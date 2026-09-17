import { Injectable } from "@nestjs/common";
import { PrismaService } from "./common/prisma.service";

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return "Hello World!";
  }

  async getOffers() {
    const now = new Date();
    const rows = await this.prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: { restaurant: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((p) => ({
      code: p.code,
      title: p.description || p.code,
      subtitle: p.restaurant?.name ? `At ${p.restaurant.name}` : "All Jourian kitchens",
      expires: p.expiresAt
        ? new Date(p.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : "Always on",
      restaurantId: p.restaurantId,
      discountType: p.discountType,
      value: p.value,
      maxDiscount: p.maxDiscount,
      minOrderValue: p.minOrderValue,
    }));
  }
}
