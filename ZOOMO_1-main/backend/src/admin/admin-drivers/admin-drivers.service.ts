import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { OrderStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";

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
            id: true, status: true, total: true, deliveryFee: true, driverCommission: true, tip: true, createdAt: true,
            restaurant: { select: { name: true } },
          },
        },
      },
    });
    if (!driver) throw new NotFoundException("Driver not found");

    const delivered = await this.prisma.order.findMany({
      where: { driverId: id, status: OrderStatus.DELIVERED },
      select: { deliveryFee: true, driverCommission: true, tip: true },
    });
    const earned = delivered.reduce((sum, o) => sum + (o.deliveryFee || 0) + (o.driverCommission || 0) + (o.tip || 0), 0);
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
        payoutMethod: true,
        upiId: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
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
      payoutMethod: driver.payoutMethod,
      upiId: driver.upiId,
    }));
  }

  async createDriver(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    vehicleType?: string;
    vehiclePlate?: string;
  }) {
    if (!data?.name || !data?.email) throw new BadRequestException("name and email are required");
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException("Email already in use");
    const password = await bcrypt.hash(data.password || randomBytes(8).toString("base64url"), 10);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          password,
          role: "DRIVER",
        },
      });
      return tx.driver.create({
        data: {
          userId: user.id,
          isAvailable: false,
          vehicleType: data.vehicleType || "Bike",
          vehiclePlate: data.vehiclePlate || "",
        },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      });
    });
  }

  async updateDriver(id: string, data: {
    isAvailable?: boolean;
    vehicleType?: string;
    vehiclePlate?: string;
    payoutMethod?: string;
    upiId?: string;
    bankName?: string;
    accountLast4?: string;
    name?: string;
    phone?: string;
  }) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException("Driver not found");
    const updated = await this.prisma.driver.update({
      where: { id },
      data: {
        isAvailable: data.isAvailable,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        payoutMethod: data.payoutMethod,
        upiId: data.upiId,
        bankName: data.bankName,
        accountLast4: data.accountLast4,
      },
    });
    if (data.name || data.phone) {
      await this.prisma.user.update({
        where: { id: driver.userId },
        data: { name: data.name, phone: data.phone },
      });
    }
    return updated;
  }

  async deleteDriver(id: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException("Driver not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({ where: { driverId: id }, data: { driverId: null } });
      await tx.payout.deleteMany({ where: { driverId: id } });
      await tx.driver.delete({ where: { id } });
      await tx.user.delete({ where: { id: driver.userId } });
    });
    return { ok: true, id };
  }
}
