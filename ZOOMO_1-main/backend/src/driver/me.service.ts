import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class DriverMeService {
  constructor(private readonly prisma: PrismaService) {}

  async updateAvailability(driverId: string, isAvailable: boolean) {
    return this.prisma.driver.update({
      where: { id: driverId },
      data: { isAvailable },
      select: {
        id: true,
        isAvailable: true,
      },
    });
  }

  async getDriverProfile(userId: string) {
    return this.prisma.driver.findUnique({
      where: { userId },
      select: {
        id: true,
        isAvailable: true,
        currentLat: true,
        currentLng: true,
        vehicleType: true,
        vehiclePlate: true,
        rating: true,
        user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
      },
    });
  }

  async updateVehicle(userId: string, data: { vehicleType?: string; vehiclePlate?: string }) {
    return this.prisma.driver.update({
      where: { userId },
      data: {
        ...(data.vehicleType !== undefined ? { vehicleType: data.vehicleType } : {}),
        ...(data.vehiclePlate !== undefined ? { vehiclePlate: data.vehiclePlate } : {}),
      },
      select: { id: true, vehicleType: true, vehiclePlate: true },
    });
  }

  async getPayoutMethod(userId: string) {
    return this.prisma.driver.findUnique({
      where: { userId },
      select: { payoutMethod: true, upiId: true, bankName: true, accountLast4: true },
    });
  }

  async setPayoutMethod(userId: string, data: { payoutMethod?: string; upiId?: string; bankName?: string; accountLast4?: string }) {
    return this.prisma.driver.update({
      where: { userId },
      data: {
        payoutMethod: data.payoutMethod,
        upiId: data.upiId,
        bankName: data.bankName,
        accountLast4: data.accountLast4,
      },
      select: { payoutMethod: true, upiId: true, bankName: true, accountLast4: true },
    });
  }
}
