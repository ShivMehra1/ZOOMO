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
  }) {
    if (!data?.code) throw new BadRequestException("code is required");
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
      },
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Promotion not found");
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
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Promotion not found");
    await this.prisma.promotion.delete({ where: { id } });
    return { ok: true, id };
  }
}
