import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { MessageSender, OrderStatus, OrderType } from "@prisma/client";
import { PROMO_CODES } from "../common/promo-codes";
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
    const { addressId, tip, promoCode, orderType } = data;

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { dish: { include: { sizes: true } } } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    /* ── Resolve per-item price (dish size overrides base price) ── */
    const itemPrice = (item: (typeof cart.items)[number]): number => {
      if (!item.dishSizeId) return item.dish.price;
      const size = item.dish.sizes.find((s) => s.id === item.dishSizeId);
      return size ? size.price : item.dish.price;
    };

    /* ── Totals ── */
    const subtotal = cart.items.reduce(
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
      where: { id: cart.items[0].dishId },
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
        const dest =
          address.lat != null && address.lng != null
            ? { lat: address.lat, lng: address.lng }
            : resolveJourianCoords(`${address.street} ${address.city}`);
        distanceKm = parseFloat(haversineKm(origin.lat, origin.lng, dest.lat, dest.lng).toFixed(2));
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

    /* ── Promo ── */
    let discount = 0;
    let deliveryFee = isDelivery ? computeDeliveryFee(subtotal, distanceKm as number) : 0;
    let validatedPromoCode: string | null = null;

    if (promoCode) {
      const promo = PROMO_CODES[promoCode.toUpperCase()];
      if (!promo) throw new BadRequestException("Invalid promo code");
      validatedPromoCode = promoCode.toUpperCase();
      if (promo.type === "percent") {
        discount = Math.min(
          parseFloat(((subtotal * promo.value) / 100).toFixed(2)),
          promo.max ?? Infinity
        );
      } else if (promo.type === "flat") {
        discount = Math.min(promo.value, subtotal);
      } else if (promo.type === "ship") {
        deliveryFee = 0;
      }
    }

    const total = parseFloat(
      (subtotal + deliveryFee + tax + tipAmount - discount).toFixed(2)
    );

    const { restaurantEarning, platformFee, driverCommission } = computeRevenueSplit(subtotal, resolvedOrderType);

    return {
      cart, restaurantDish, itemPrice,
      subtotal, tipAmount, tax, deliveryFee, discount, total, validatedPromoCode,
      resolvedOrderType, distanceKm, kmSlab,
      restaurantEarning, platformFee, driverCommission,
    };
  }

  /* ===========================
     CREATE ORDER + PAYMENT
  ============================ */
  async createOrder(userId: string, data: any) {
    const { specialInstructions, paymentMethod, scheduledFor, addressId, dropOffPreference, dropOffNote, includeCutlery } = data;

    const {
      cart, restaurantDish, itemPrice,
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
          items: {
            create: cart.items.map((item: (typeof cart.items)[number]) => ({
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
          provider: paymentMethod === "COD" ? "COD" : "ONLINE",
        },
      });

      return createdOrder;
    });

    /* ── Clear cart ── */
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    this.realtime.emitToRooms(
      [`restaurant:${order.restaurantId}`, `user:${userId}`, "admin"],
      "order:created",
      order,
    );

    return order;
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

  async rateOrder(orderId: string, userId: string, rating: number) {
    await this.ownedOrder(orderId, userId);
    if (rating < 1 || rating > 5) throw new BadRequestException("Rating must be 1-5");
    return this.prisma.order.update({
      where: { id: orderId },
      data: { rating },
    });
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
    const rooms = [`order:${orderId}`];
    if (order.driverId) rooms.push(`driver:${order.driverId}`);
    this.realtime.emitToRooms(rooms, "order:message", message);
    return message;
  }
}