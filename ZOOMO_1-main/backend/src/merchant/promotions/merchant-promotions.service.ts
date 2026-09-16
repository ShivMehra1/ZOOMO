import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class MerchantPromotionsService {
  constructor(private prisma: PrismaService) {}

  private async getOwnedRestaurantId(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId },
      select: { id: true },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found for this merchant');
    }
    return restaurant.id;
  }

  async list(ownerId: string) {
    const restaurantId = await this.getOwnedRestaurantId(ownerId);
    return this.prisma.promotion.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(ownerId: string, body: any) {
    const restaurantId = await this.getOwnedRestaurantId(ownerId);
    if (!body.code || !body.value) {
      throw new BadRequestException('code and value are required');
    }
    return this.prisma.promotion.create({
      data: {
        restaurantId,
        code: String(body.code).toUpperCase().trim(),
        description: body.description ?? null,
        discountType: body.discountType === 'FLAT' ? 'FLAT' : 'PERCENT',
        value: Number(body.value),
        maxDiscount: body.maxDiscount != null ? Number(body.maxDiscount) : null,
        minOrderValue: body.minOrderValue != null ? Number(body.minOrderValue) : null,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
  }

  async update(ownerId: string, promotionId: string, body: any) {
    const restaurantId = await this.getOwnedRestaurantId(ownerId);
    const promo = await this.prisma.promotion.findUnique({ where: { id: promotionId } });
    if (!promo) throw new NotFoundException('Promotion not found');
    if (promo.restaurantId !== restaurantId) {
      throw new ForbiddenException('You do not own this promotion');
    }
    return this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.discountType !== undefined
          ? { discountType: body.discountType === 'FLAT' ? 'FLAT' : 'PERCENT' }
          : {}),
        ...(body.value !== undefined ? { value: Number(body.value) } : {}),
        ...(body.maxDiscount !== undefined ? { maxDiscount: body.maxDiscount != null ? Number(body.maxDiscount) : null } : {}),
        ...(body.minOrderValue !== undefined ? { minOrderValue: body.minOrderValue != null ? Number(body.minOrderValue) : null } : {}),
        ...(body.isActive !== undefined ? { isActive: !!body.isActive } : {}),
        ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null } : {}),
      },
    });
  }

  async remove(ownerId: string, promotionId: string) {
    const restaurantId = await this.getOwnedRestaurantId(ownerId);
    const promo = await this.prisma.promotion.findUnique({ where: { id: promotionId } });
    if (!promo) throw new NotFoundException('Promotion not found');
    if (promo.restaurantId !== restaurantId) {
      throw new ForbiddenException('You do not own this promotion');
    }
    await this.prisma.promotion.delete({ where: { id: promotionId } });
    return { success: true };
  }

  // Public — used by the customer app to show active promos for a restaurant.
  async listActiveForRestaurant(restaurantId: string) {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        restaurantId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
