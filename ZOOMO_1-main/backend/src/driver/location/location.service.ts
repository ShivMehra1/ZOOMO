import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { OrderStatus } from "@prisma/client";
import { RealtimeGateway } from "../../realtime/realtime.gateway";

@Injectable()
export class DriverLocationService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  async updateLocation(
    userId: string,
    lat: number,
    lng: number
  ) {
    const driver = await this.prisma.driver.update({
      where: { userId },
      data: {
        currentLat: lat,
        currentLng: lng,
        updatedAt: new Date(),
      },
    });

    // Live-tracking payload for whichever order this driver currently has
    // out for delivery — customer's tracking map listens on `order:<id>`.
    const activeOrder = await this.prisma.order.findFirst({
      where: { driverId: driver.id, status: OrderStatus.OUT_FOR_DELIVERY },
      select: { id: true, userId: true },
    });
    if (activeOrder) {
      this.realtime.emitToRooms(
        [`order:${activeOrder.id}`, `user:${activeOrder.userId}`],
        "driver:location",
        { orderId: activeOrder.id, driverId: driver.id, lat, lng },
      );
    }

    return driver;
  }
}
