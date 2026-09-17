import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class AdminDriversService {
  constructor(private prisma: PrismaService) {}

  async getDriverById(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true, isSuspended: true, suspendedReason: true, createdAt: true },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true, status: true, total: true, deliveryFee: true, driverCommission: true, createdAt: true,
            restaurant: { select: { name: true } },
          },
        },
      },
    });
    if (!driver) throw new NotFoundException("Driver not found");

    const delivered = await this.prisma.order.findMany({
      where: { driverId: id, status: OrderStatus.DELIVERED },
      select: { deliveryFee: true, driverCommission: true },
    });
    const earned = delivered.reduce((sum, o) => sum + (o.deliveryFee || 0) + (o.driverCommission || 0), 0);
    const paidAgg = await this.prisma.payout.aggregate({
      where: { driverId: id, recipientType: "DRIVER", status: { in: ["PENDING", "COMPLETED"] } },
      _sum: { amount: true },
    });
    const paidOrPending = paidAgg._sum.amount || 0;

    return {
      ...driver,
      totalDeliveries: delivered.length,
      totalEarned: parseFloat(earned.toFixed(2)),
      balance: parseFloat((earned - paidOrPending).toFixed(2)),
    };
  }

  async getAllDrivers() {
    const drivers = await this.prisma.driver.findMany({
      select: {
        id: true,
        isAvailable: true,
        vehicleType: true,
        user: {
          select: {
            name: true,
          },
        },
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.OUT_FOR_DELIVERY,
                OrderStatus.READY_FOR_PICKUP,
              ],
            },
          },
          select: { id: true },
        },
      },
    });

    // map to add activeOrderCount
    return drivers.map((driver) => ({
      id: driver.id,
      isAvailable: driver.isAvailable,
      vehicleType: driver.vehicleType,
      user: driver.user,
      activeOrderCount: driver.orders.length,
    }));
  }
}
