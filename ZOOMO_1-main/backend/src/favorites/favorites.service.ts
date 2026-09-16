import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: { restaurant: true },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map((f) => f.restaurant);
  }

  async add(userId: string, restaurantId: string) {
    if (!restaurantId) throw new BadRequestException('restaurantId missing');
    return this.prisma.favorite.upsert({
      where: { userId_restaurantId: { userId, restaurantId } },
      update: {},
      create: { userId, restaurantId },
    });
  }

  async remove(userId: string, restaurantId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, restaurantId } });
    return { ok: true };
  }
}
