import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class DriverOrdersService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.order.findMany({
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
      },
    });
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

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.OUT_FOR_DELIVERY },
      select: { id: true, status: true },
    });
  }

  /* ===========================
     MARK DELIVERED (COD SAFE)
  ============================ */
  async markDelivered(orderId: string, userId: string) {
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

    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          actualDeliveryTime: new Date(),
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

      restaurant: {
        name: order.restaurant.name,
        address: order.restaurant.address,
        imageUrl: order.restaurant.imageUrl,
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
        method: order.payment?.method ?? "ONLINE",
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
}
