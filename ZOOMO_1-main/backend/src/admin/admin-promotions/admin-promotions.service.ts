import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class AdminPromotionsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.promotion.findMany({
      include: { restaurant: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    code: string;
    description?: string;
    discountType?: string;
    value?: number;
    maxDiscount?: number;
    minOrderValue?: number;
    restaurantId?: string | null;
    expiresAt?: string | null;
    showOnCard?: boolean;
    badgeLabel?: string | null;
  }) {
    if (!data?.code) throw new BadRequestException("code is required");
    if (data.showOnCard && data.restaurantId) {
      await this.prisma.promotion.updateMany({
        where: { restaurantId: data.restaurantId, showOnCard: true },
        data: { showOnCard: false },
      });
    }
    return this.prisma.promotion.create({
      data: {
        code: data.code.toUpperCase().trim(),
        description: data.description,
        discountType: data.discountType || "PERCENT",
        value: Number(data.value) || 0,
        maxDiscount: data.maxDiscount ?? null,
        minOrderValue: data.minOrderValue ?? null,
        restaurantId: data.restaurantId || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: true,
        showOnCard: Boolean(data.showOnCard),
        badgeLabel: data.badgeLabel?.trim() || data.code.toUpperCase().trim(),
      },
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Promotion not found");
    if (data.showOnCard && existing.restaurantId) {
      await this.prisma.promotion.updateMany({
        where: { restaurantId: existing.restaurantId, showOnCard: true, NOT: { id } },
        data: { showOnCard: false },
      });
    }
    return this.prisma.promotion.update({
      where: { id },
      data: {
        description: data.description,
        discountType: data.discountType,
        value: data.value != null ? Number(data.value) : undefined,
        maxDiscount: data.maxDiscount,
        minOrderValue: data.minOrderValue,
        isActive: data.isActive,
        expiresAt: data.expiresAt === undefined ? undefined : data.expiresAt ? new Date(data.expiresAt) : null,
        showOnCard: data.showOnCard,
        badgeLabel: data.badgeLabel,
      },
    });
  }

  async getRainSurge() {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: "rainSurge" } });
    const pct = await this.prisma.platformSetting.findUnique({ where: { key: "rainSurgePct" } });
    return { rainSurge: row?.value === "on", pct: Number(pct?.value) || 25 };
  }

  async setRainSurge(on: boolean, pct?: number) {
    await this.prisma.platformSetting.upsert({
      where: { key: "rainSurge" },
      update: { value: on ? "on" : "off" },
      create: { key: "rainSurge", value: on ? "on" : "off" },
    });
    if (pct != null && Number.isFinite(pct)) {
      const n = Math.min(100, Math.max(5, Math.round(pct)));
      await this.prisma.platformSetting.upsert({
        where: { key: "rainSurgePct" },
        update: { value: String(n) },
        create: { key: "rainSurgePct", value: String(n) },
      });
    }
    return this.getRainSurge();
  }

  async remove(id: string) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Promotion not found");
    await this.prisma.promotion.delete({ where: { id } });
    return { ok: true, id };
  }
}
