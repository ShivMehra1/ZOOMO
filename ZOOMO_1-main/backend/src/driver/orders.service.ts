import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { OrderStatus, MessageSender } from "@prisma/client";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { isCashCollect, resolveDeliveryPin } from "../common/pay.util";

@Injectable()
export class DriverOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /* ===========================
     RESOLVE DRIVER
  ============================ */
  private async getDriverId(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new ForbiddenException("Driver profile not found");
    }

    return driver.id;
  }

  /* ===========================
     GET ASSIGNED ORDERS (LIST)
     → Lightweight for orders screen
  ============================ */
  async getAssignedOrders(userId: string) {
    const driverId = await this.getDriverId(userId);

    const mine = await this.prisma.order.findMany({
      where: {
        driverId,
        status: {
          in: [
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        total: true,
        tip: true,
        postDeliveryTip: true,
        adminAssigned: true,
        driverId: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            name: true,
            address: true,
            lat: true,
            lng: true,
          },
        },
        address: {
          select: {
            street: true,
            city: true,
            lat: true,
            lng: true,
          },
        },
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        payment: { select: { method: true, status: true } },
      },
    });
    const open = await this.prisma.order.findMany({
      where: {
        driverId: null,
        orderType: "DELIVERY",
        status: OrderStatus.READY_FOR_PICKUP,
      },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: {
        id: true,
        status: true,
        total: true,
        tip: true,
        postDeliveryTip: true,
        adminAssigned: true,
        driverId: true,
        createdAt: true,
        updatedAt: true,
        restaurant: { select: { name: true, address: true, lat: true, lng: true } },
        address: { select: { street: true, city: true, lat: true, lng: true } },
        user: { select: { name: true, phone: true } },
        payment: { select: { method: true, status: true } },
      },
    });
    return [...mine, ...open.filter((o) => !mine.some((m) => m.id === o.id))];
  }

  async acceptOrder(orderId: string, userId: string) {
    const driverId = await this.getDriverId(userId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.driverId && order.driverId !== driverId) {
      throw new BadRequestException("Already taken");
    }
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });
    await this.prisma.driver.update({ where: { id: driverId }, data: { isAvailable: false } });
    this.emitOrderUpdate(updated);
    return updated;
  }

  async rejectOrder(orderId: string, userId: string) {
    const driverId = await this.getDriverId(userId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.adminAssigned) {
      throw new BadRequestException("Admin assigned this drop — you need to complete it");
    }
    if (order.driverId && order.driverId !== driverId) {
      throw new ForbiddenException("Not your order");
    }
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { driverId: null },
    });
    await this.prisma.driver.update({ where: { id: driverId }, data: { isAvailable: true } });
    this.emitOrderUpdate(updated);
    return updated;
  }

  /* ===========================
     GET DELIVERY HISTORY
     → Past deliveries (delivered/cancelled), for earnings/
       performance/receipts screens.
  ============================ */
  async getHistory(userId: string) {
    const driverId = await this.getDriverId(userId);

    return this.prisma.order.findMany({
      where: {
        driverId,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        total: true,
        deliveryFee: true,
        createdAt: true,
        actualDeliveryTime: true,
        estimatedDeliveryTime: true,
        rating: true,
        tip: true,
        postDeliveryTip: true,
        restaurant: { select: { name: true, imageUrl: true } },
        address: { select: { street: true, city: true } },
      },
    });
  }

  /* ===========================
     MARK PICKED UP
  ============================ */
  async markPickedUp(orderId: string, userId: string) {
    const driverId = await this.getDriverId(userId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.driverId !== driverId)
      throw new ForbiddenException("Not your order");
    if (order.status !== OrderStatus.READY_FOR_PICKUP)
      throw new ForbiddenException("Order not ready for pickup");

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.OUT_FOR_DELIVERY },
      select: { id: true, status: true, restaurantId: true, userId: true, driverId: true },
    });
    this.emitOrderUpdate(updated);
    return updated;
  }

  private emitOrderUpdate(order: { id: string; restaurantId: string; userId: string; driverId: string | null }) {
    const rooms = [`order:${order.id}`, `restaurant:${order.restaurantId}`, `user:${order.userId}`, "admin"];
    if (order.driverId) rooms.push(`driver:${order.driverId}`);
    this.realtime.emitToRooms(rooms, "order:updated", order);
  }

  /* ===========================
     MARK DELIVERED (COD SAFE)
  ============================ */
  async markDelivered(orderId: string, userId: string, proofUrl?: string, pin?: string) {
    const driverId = await this.getDriverId(userId);

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        driverId,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found or not assigned to you");
    }

    if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new ForbiddenException("Order not out for delivery");
    }

    if (!isCashCollect(order.payment?.method)) {
      const expected = resolveDeliveryPin(order);
      if ((pin || "").trim() !== expected) {
        throw new BadRequestException("Ask the customer for the 4-digit PIN");
      }
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // 1️⃣ Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          actualDeliveryTime: new Date(),
          deliveryProofUrl: proofUrl || undefined,
        },
      });

      // 2️⃣ Complete COD payment if needed
      if (
        order.payment &&
        order.payment.method === "COD" &&
        order.payment.status === "PENDING"
      ) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "COMPLETED" },
        });
      }

      return updatedOrder;
    });
    this.emitOrderUpdate(updatedOrder);
    return updatedOrder;
  }

  /* ===========================
     GET ORDER DETAILS (DRIVER)
     → FULL DATA FOR OrderDetails UI
  ============================ */
  async getOrderDetails(orderId: string, userId: string) {
    const driverId = await this.getDriverId(userId);

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        driverId,
      },
      include: {
        user: true,
        restaurant: true,
        address: true,
        items: {
          include: {
            dish: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        "Order not found or not assigned to you"
      );
    }

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      tip: order.tip,
      postDeliveryTip: order.postDeliveryTip,
      createdAt: order.createdAt,
      adminAssigned: order.adminAssigned,
      deliveryProofUrl: order.deliveryProofUrl,

      restaurant: {
        name: order.restaurant.name,
        address: order.restaurant.address,
        imageUrl: order.restaurant.imageUrl,
        phone: order.restaurant.phone,
        lat: order.restaurant.lat,
        lng: order.restaurant.lng,
      },

      customer: {
        name: order.user.name,
        phone: order.user.phone,
      },

      address: order.address && {
        street: order.address.street,
        city: order.address.city,
        lat: order.address.lat,
        lng: order.address.lng,
      },

      payment: {
        method: order.payment?.method ?? "COD",
        status: order.payment?.status ?? "PENDING",
      },

      // 🔥 CRITICAL FIX — DO NOT CHANGE
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        dish: {
          id: item.dish.id,
          name: item.dish.name,
        },
      })),
    };
  }

  /* ===========================
     RIDE CHAT (driver side)
  ============================ */
  async getMessages(orderId: string, userId: string) {
    const driverId = await this.getDriverId(userId);
    const order = await this.prisma.order.findFirst({ where: { id: orderId, driverId } });
    if (!order) throw new NotFoundException("Order not found or not assigned to you");
    return this.prisma.orderMessage.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } });
  }

  async sendMessage(orderId: string, userId: string, text: string) {
    const driverId = await this.getDriverId(userId);
    const order = await this.prisma.order.findFirst({ where: { id: orderId, driverId } });
    if (!order) throw new NotFoundException("Order not found or not assigned to you");
    const trimmed = (text || "").trim();
    if (!trimmed) throw new BadRequestException("Message can't be empty");
    const message = await this.prisma.orderMessage.create({
      data: { orderId, sender: MessageSender.DRIVER, text: trimmed.slice(0, 500) },
    });
    this.realtime.emitToRooms(
      [`order:${orderId}`, `user:${order.userId}`, `restaurant:${order.restaurantId}`, `driver:${driverId}`],
      "order:message",
      message,
    );
    return message;
  }
}
