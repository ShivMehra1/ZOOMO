import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) { }

  /* ===========================
     GET ALL ORDERS (ADMIN)
  ============================ */
  async getAllOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: true,
        user: true,       // ✅ included so admin table shows customer name
        address: true,    // ✅ included so admin table shows address
        driver: {
          include: { user: true },
        },
      },
    });
  }

  /* ===========================
     ASSIGN DRIVER (ADMIN)
  ============================ */
  async assignDriver(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException("Order not found");

    if (order.driverId) {
      throw new BadRequestException("Order already assigned to a driver");
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException("Only READY_FOR_PICKUP orders can be assigned");
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) throw new BadRequestException("Driver not found");

    const activeOrdersCount = await this.prisma.order.count({
      where: {
        driverId,
        status: {
          in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY],
        },
      },
    });

    if (activeOrdersCount > 0) {
      throw new BadRequestException("Driver already has an active order");
    }

    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { driverId },
      }),
      this.prisma.driver.update({
        where: { id: driverId },
        data: { isAvailable: false },
      }),
    ]);
  }

  /* ===========================
     UPDATE ORDER STATUS (ADMIN)  ✅ NEW
  ============================ */
  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException("Order not found");

    // Only allow transitioning FROM scheduled
    const allowedStatuses = Object.values(OrderStatus);
    if (!allowedStatuses.includes(status as OrderStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });
  }

  /* ===========================
     DISPUTES — cancelled orders, low ratings, un-refunded
  ============================ */
  async getDisputes() {
    return this.prisma.order.findMany({
      where: {
        OR: [
          { status: OrderStatus.CANCELLED },
          { rating: { lte: 2 } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: { select: { name: true } },
        user: { select: { name: true, email: true } },
        messages: true,
      },
    });
  }

  async refundOrder(orderId: string, amount: number, reason: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.refundedAt) throw new BadRequestException("Order already refunded");

    const refundAmount = amount ?? order.total;
    if (refundAmount <= 0 || refundAmount > order.total) {
      throw new BadRequestException("Invalid refund amount");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        refundAmount,
        refundedAt: new Date(),
        cancelReason: reason || order.cancelReason,
      },
    });
  }

  async getOrderMessages(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");

    return this.prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
  }
}