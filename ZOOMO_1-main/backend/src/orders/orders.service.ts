import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { MessageSender, OrderStatus, OrderType } from "@prisma/client";
import {
  computeDeliveryFee,
  computeRevenueSplit,
  computeTax,
  resolveKmSlab,
  MIN_CART_FOR_DELIVERY,
  MAX_DELIVERY_KM,
} from "../common/revenue-split.util";
import { haversineKm } from "../common/geo.util";
import { resolveJourianCoords } from "../common/jourian-areas.util";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { makeDeliveryPin } from "../common/pay.util";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) { }

  /* ===========================
     GET USER ORDERS
  ============================ */
  getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { dish: true } },
        restaurant: true,
        payment: true,
        driver: { include: { user: true } },
        address: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /* ===========================
     GET ORDER DETAILS
  ============================ */
  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { dish: true } },
        restaurant: true,
        payment: true,
        driver: { include: { user: true } },
        address: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.userId !== userId) throw new BadRequestException("Unauthorized");

    return order;
  }

  /* ===========================
     CREATE ORDER + PAYMENT
  ============================ */
  /* ===========================
     QUOTE — same math as createOrder, no side effects. Lets the checkout
     screen preview an accurate delivery fee/tax/total (distance-dependent,
     so it can't be computed client-side without duplicating the geocoding
     fallback table) before actually placing the order.
  ============================ */
  async getQuote(userId: string, data: { addressId?: string | null; orderType?: string; promoCode?: string | null; tip?: number }) {
    const q = await this.quoteFromCart(userId, data);
    return {
      subtotal: q.subtotal,
      deliveryFee: q.deliveryFee,
      tax: q.tax,
      discount: q.discount,
      tip: q.tipAmount,
      total: q.total,
      distanceKm: q.distanceKm,
      kmSlab: q.kmSlab,
      orderType: q.resolvedOrderType,
    };
  }

  private async quoteFromCart(userId: string, data: any) {
    const { addressId, tip, promoCode, orderType, restaurantId } = data;

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { dish: { include: { sizes: true } } } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    const items = restaurantId
      ? cart.items.filter((i) => i.dish.restaurantId === restaurantId)
      : cart.items;
    if (!items.length) throw new BadRequestException("That restaurant bag is empty");
    const mixed = new Set(items.map((i) => i.dish.restaurantId));
    if (mixed.size > 1) {
      throw new BadRequestException("Checkout one restaurant at a time");
    }

    /* ── Resolve per-item price (dish size overrides base price) ── */
    const itemPrice = (item: (typeof items)[number]): number => {
      if (!item.dishSizeId) return item.dish.price;
      const size = item.dish.sizes.find((s) => s.id === item.dishSizeId);
      return size ? size.price : item.dish.price;
    };

    /* ── Totals ── */
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * itemPrice(item),
      0
    );
    const tipAmount = tip || 0;
    const tax = computeTax(subtotal);

    /* ── Order type ── */
    const resolvedOrderType: OrderType =
      orderType === "PICKUP" ? OrderType.PICKUP
      : orderType === "DINE_IN" ? OrderType.DINE_IN
      : OrderType.DELIVERY;
    const isDelivery = resolvedOrderType === OrderType.DELIVERY;

    if (isDelivery && subtotal < MIN_CART_FOR_DELIVERY) {
      throw new BadRequestException(
        `Delivery needs a ₹${MIN_CART_FOR_DELIVERY}+ cart — choose pickup or dine-in for smaller orders`,
      );
    }

    /* ── Restaurant ── */
    const restaurantDish = await this.prisma.dish.findUnique({
      where: { id: items[0].dishId },
      include: { restaurant: true },
    });

    if (!restaurantDish) throw new BadRequestException("Invalid restaurant");
    if (!restaurantDish.restaurant.isApproved) {
      throw new BadRequestException("This restaurant is no longer available");
    }
    if (!restaurantDish.restaurant.isActive) {
      throw new BadRequestException("This restaurant is currently closed");
    }

    /* ── Distance (real haversine, using real lat/lng where available, else
       a Jourian-area-name fallback since Mapbox can't geocode a fictional
       town) ── */
    let distanceKm: number | null = null;
    if (addressId) {
      const address = await this.prisma.address.findUnique({ where: { id: addressId } });
      if (address) {
        const origin =
          restaurantDish.restaurant.lat != null && restaurantDish.restaurant.lng != null
            ? { lat: restaurantDish.restaurant.lat, lng: restaurantDish.restaurant.lng }
            : resolveJourianCoords(restaurantDish.restaurant.address);
        let dest =
          address.lat != null && address.lng != null
            ? { lat: address.lat, lng: address.lng }
            : resolveJourianCoords(`${address.street} ${address.city}`);
        let km = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
        const localTown = /jourian|jammu|troti|ghadi|maira|mandiwala|dadora|manchak|indri|bakore/i.test(
          `${address.street} ${address.city} ${address.state}`,
        );
        if (km > MAX_DELIVERY_KM && localTown) {
          dest = resolveJourianCoords(`${address.street} ${address.city}`);
          km = haversineKm(origin.lat, origin.lng, dest.lat, dest.lng);
        }
        distanceKm = parseFloat(km.toFixed(2));
      }
    }

    let kmSlab: string | null = null;
    if (isDelivery) {
      if (distanceKm == null) {
        throw new BadRequestException("A delivery address is required for delivery orders");
      }
      const slab = resolveKmSlab(distanceKm);
      if (!slab) {
        throw new BadRequestException(
          `That address is ${distanceKm}km away — beyond our ${MAX_DELIVERY_KM}km delivery range. Choose pickup or dine-in instead.`,
        );
      }
      kmSlab = slab;
    }

    /* ── Promo (Postgres Promotion table — platform + kitchen codes) ── */
    let discount = 0;
    let deliveryFee = isDelivery ? computeDeliveryFee(subtotal, distanceKm as number) : 0;
    if (isDelivery) {
      const rain = await this.prisma.platformSetting.findUnique({ where: { key: "rainSurge" } });
      if (rain?.value === "on") {
        const pctRow = await this.prisma.platformSetting.findUnique({ where: { key: "rainSurgePct" } });
        const pct = Number(pctRow?.value) || 25;
        deliveryFee = Math.min(80, Math.round(deliveryFee * (1 + pct / 100)));
      }
    }
    let validatedPromoCode: string | null = null;

    const code = typeof promoCode === "string" ? promoCode.trim() : "";
    if (code) {
      try {
        const promo = await this.resolvePromo(code, restaurantDish.restaurant.id, subtotal);
        validatedPromoCode = promo.code;
        if (promo.discountType === "PERCENT") {
          discount = Math.min(
            parseFloat(((subtotal * promo.value) / 100).toFixed(2)),
            promo.maxDiscount ?? Infinity,
          );
        } else if (promo.discountType === "FLAT") {
          discount = Math.min(promo.value, subtotal);
        } else if (promo.discountType === "FREE_DELIVERY") {
          deliveryFee = 0;
        }
      } catch {
        validatedPromoCode = null;
        discount = 0;
      }
    }

    const total = parseFloat(
      (subtotal + deliveryFee + tax + tipAmount - discount).toFixed(2)
    );

    const { restaurantEarning, platformFee, driverCommission } = computeRevenueSplit(subtotal, resolvedOrderType);

    return {
      cart, items, restaurantDish, itemPrice,
      subtotal, tipAmount, tax, deliveryFee, discount, total, validatedPromoCode,
      resolvedOrderType, distanceKm, kmSlab,
      restaurantEarning, platformFee, driverCommission,
    };
  }

  private async resolvePromo(code: string, restaurantId: string, subtotal: number) {
    const now = new Date();
    const rows = await this.prisma.promotion.findMany({
      where: {
        code: code.toUpperCase().trim(),
        isActive: true,
        OR: [{ restaurantId }, { restaurantId: null }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
    });
    const promo =
      rows.find((p) => p.restaurantId === restaurantId) ??
      rows.find((p) => p.restaurantId == null);
    if (!promo) throw new BadRequestException("Invalid promo code");
    if (promo.minOrderValue != null && subtotal < promo.minOrderValue) {
      throw new BadRequestException(
        `Add ₹${Math.ceil(promo.minOrderValue - subtotal)} more to use ${promo.code}`,
      );
    }
    return promo;
  }

  /* ===========================
     CREATE ORDER + PAYMENT
  ============================ */
  async createOrder(userId: string, data: any) {
    const { specialInstructions, paymentMethod, scheduledFor, addressId, dropOffPreference, dropOffNote, includeCutlery } = data || {};
    if (data) data.promoCode = typeof data.promoCode === "string" && data.promoCode.trim() ? data.promoCode.trim() : null;

    const {
      cart, items, restaurantDish, itemPrice,
      subtotal, tipAmount, tax, deliveryFee, discount, total, validatedPromoCode,
      resolvedOrderType, distanceKm, kmSlab,
      restaurantEarning, platformFee, driverCommission,
    } = await this.quoteFromCart(userId, data);

    /* ── Status ── */
    const orderStatus = scheduledFor
      ? OrderStatus.SCHEDULED
      : OrderStatus.PENDING;

    /* ── Promised-by time, used to flag a late order ── */
    const etaMin = restaurantDish.restaurant.etaMin ?? 30;
    const promisedAt = scheduledFor
      ? new Date(new Date(scheduledFor).getTime() + etaMin * 60_000)
      : new Date(Date.now() + etaMin * 60_000);

    /* ── Transaction ── */
    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          restaurantId: restaurantDish.restaurantId,
          addressId,
          subtotal,
          deliveryFee,
          tax,
          total,
          tip: tipAmount,
          promoCode: validatedPromoCode,
          discount,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          orderType: resolvedOrderType,
          dropOffPreference: dropOffPreference || "MEET_DOOR",
          dropOffNote: dropOffNote || null,
          includeCutlery: includeCutlery !== false,
          promisedAt,
          specialInstructions,
          status: orderStatus,
          restaurantEarning,
          platformFee,
          driverCommission,
          distanceKm,
          kmSlab,
          deliveryPin: resolvedOrderType === OrderType.DELIVERY ? makeDeliveryPin() : null,
          items: {
            create: items.map((item: (typeof items)[number]) => ({
              dishId: item.dishId,
              dishSizeId: item.dishSizeId,
              quantity: item.quantity,
              price: itemPrice(item),
              specialInstructions: item.specialInstructions || null,
            })),
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          amount: total,
          currency: "INR",
          method: paymentMethod || "COD",
          status: "PENDING",
          provider: !paymentMethod || paymentMethod === "COD" || paymentMethod === "CASH" ? "COD" : "ONLINE",
        },
      });

      return createdOrder;
    });

    /* ── Clear only this restaurant's bag ── */
    await this.prisma.cartItem.deleteMany({
      where: { id: { in: items.map((i) => i.id) } },
    });

    this.realtime.emitToRooms(
      [`restaurant:${order.restaurantId}`, `user:${userId}`, "admin"],
      "order:created",
      order,
    );

    return this.getOrderById(order.id, userId);
  }

  /* ===========================
     LIVE TRACKING ACTIONS
  ============================ */
  private async ownedOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.userId !== userId) throw new BadRequestException("Unauthorized");
    return order;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.ownedOrder(orderId, userId);
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Order already ${order.status.toLowerCase()}`);
    }
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
    this.emitOrderUpdate(updated);
    return updated;
  }

  /** Broadcast an order's current state to everyone with a stake in it. */
  private emitOrderUpdate(order: { id: string; restaurantId: string; userId: string; driverId: string | null }) {
    const rooms = [`order:${order.id}`, `restaurant:${order.restaurantId}`, `user:${order.userId}`, "admin"];
    if (order.driverId) rooms.push(`driver:${order.driverId}`);
    this.realtime.emitToRooms(rooms, "order:updated", order);
  }

  async rateOrder(orderId: string, userId: string, rating: number, comment?: string) {
    const order = await this.ownedOrder(orderId, userId);
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException("You can review the restaurant after this order is delivered");
    }
    if (rating < 1 || rating > 5) throw new BadRequestException("Rating must be 1-5");
    const note = comment?.trim() || null;

    await this.prisma.order.update({
      where: { id: orderId },
      data: { rating, kitchenComment: note ?? undefined },
    });

    const existing = await this.prisma.review.findFirst({
      where: { OR: [{ orderId }, { userId, restaurantId: order.restaurantId }] },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      await this.prisma.review.update({
        where: { id: existing.id },
        data: { rating, comment: note, orderId },
      });
    } else {
      await this.prisma.review.create({
        data: {
          userId,
          restaurantId: order.restaurantId,
          orderId,
          rating,
          comment: note,
        },
      });
    }

    const agg = await this.prisma.review.aggregate({
      where: { restaurantId: order.restaurantId },
      _avg: { rating: true },
    });
    await this.prisma.restaurant.update({
      where: { id: order.restaurantId },
      data: { rating: agg._avg.rating ?? rating },
    });

    return this.getOrderById(orderId, userId);
  }

  async rateDriver(orderId: string, userId: string, rating: number, comment?: string) {
    const order = await this.ownedOrder(orderId, userId);
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException("You can rate the driver after this order is delivered");
    }
    if (!order.driverId) throw new BadRequestException("No driver was assigned to this order");
    if (rating < 1 || rating > 5) throw new BadRequestException("Rating must be 1-5");

    await this.prisma.order.update({
      where: { id: orderId },
      data: { driverRating: rating, driverComment: comment?.trim() || null },
    });

    const agg = await this.prisma.order.aggregate({
      where: { driverId: order.driverId, driverRating: { not: null } },
      _avg: { driverRating: true },
    });
    await this.prisma.driver.update({
      where: { id: order.driverId },
      data: { rating: Number((agg._avg.driverRating ?? rating).toFixed(2)) },
    });

    return this.getOrderById(orderId, userId);
  }

  async addExtraTip(orderId: string, userId: string, amount: number) {
    const order = await this.ownedOrder(orderId, userId);
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException("You can tip the driver after this order is delivered");
    }
    if (order.orderType !== OrderType.DELIVERY) {
      throw new BadRequestException("Tips are for delivery orders");
    }
    if (!order.driverId) throw new BadRequestException("No driver was assigned to this order");
    const extra = Math.round(Number(amount) || 0);
    if (extra < 10 || extra > 500) {
      throw new BadRequestException("Tip must be between ₹10 and ₹500");
    }
    if ((order.postDeliveryTip || 0) > 0) {
      throw new BadRequestException("You already added a thank-you tip on this order");
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        postDeliveryTip: extra,
        tip: (order.tip || 0) + extra,
        total: order.total + extra,
      },
    });

    return this.getOrderById(orderId, userId);
  }

  async gatePing(orderId: string, userId: string) {
    await this.ownedOrder(orderId, userId);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { gatePingAt: new Date() },
    });
  }

  async setDropOff(orderId: string, userId: string, preference: string, note?: string) {
    await this.ownedOrder(orderId, userId);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { dropOffPreference: preference, dropOffNote: note || null },
    });
  }

  /* ===========================
     LATE CREDIT
  ============================ */
  async grantLateCredit(orderId: string, userId: string) {
    const order = await this.ownedOrder(orderId, userId);
    if (order.lateCreditApplied) return order; // already granted
    if (!order.promisedAt || Date.now() < order.promisedAt.getTime()) {
      throw new BadRequestException("Order is not late yet");
    }
    const credit = 40;
    return this.prisma.order.update({
      where: { id: orderId },
      data: { lateCreditApplied: credit },
    });
  }

  /* ===========================
     RIDE CHAT
  ============================ */
  async getMessages(orderId: string, userId: string) {
    await this.ownedOrder(orderId, userId);
    return this.prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
  }

  async sendMessage(orderId: string, userId: string, text: string) {
    const order = await this.ownedOrder(orderId, userId);
    const trimmed = (text || "").trim();
    if (!trimmed) throw new BadRequestException("Message can't be empty");
    const message = await this.prisma.orderMessage.create({
      data: { orderId, sender: MessageSender.CUSTOMER, text: trimmed.slice(0, 500) },
    });
    const rooms = [`order:${orderId}`, `restaurant:${order.restaurantId}`, `user:${order.userId}`];
    if (order.driverId) rooms.push(`driver:${order.driverId}`);
    this.realtime.emitToRooms(rooms, "order:message", message);
    return message;
  }
}