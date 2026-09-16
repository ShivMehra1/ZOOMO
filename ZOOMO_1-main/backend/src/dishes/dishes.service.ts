import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class DishesService {
  constructor(private prisma: PrismaService) {}

  // FETCH DISHES FOR A RESTAURANT
  findByRestaurant(restaurantId: string) {
    return this.prisma.dish.findMany({
      where: { restaurantId },
      include: { sizes: true },
    });
  }

  // SEARCH DISHES ACROSS ALL RESTAURANTS (approved restaurants only)
  search(q: string) {
    const query = (q || "").trim();
    if (!query) return [];
    return this.prisma.dish.findMany({
      where: {
        restaurant: { isApproved: true },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { restaurant: true, sizes: true },
      take: 20,
    });
  }

  // FETCH A SINGLE DISH
  async findOne(id: string) {
    const dish = await this.prisma.dish.findUnique({
      where: { id },
      include: { sizes: true },
    });
    if (!dish) throw new NotFoundException("Dish not found");
    return dish;
  }

  // CREATE DISH
  create(data: any, restaurantId: string) {
    const { sizes, ...rest } = data;
    return this.prisma.dish.create({
      data: {
        ...rest,
        price: Number(data.price),
        restaurantId,
        ...(Array.isArray(sizes) && sizes.length
          ? { sizes: { create: sizes.map((s: any) => ({ label: s.label, price: Number(s.price) })) } }
          : {}),
      },
      include: { sizes: true },
    });
  }

  // UPDATE DISH
  update(id: string, data: any) {
    const { sizes, ...rest } = data;
    return this.prisma.dish.update({
      where: { id },
      data: rest,
      include: { sizes: true },
    });
  }

  // DELETE DISH
  delete(id: string) {
    return this.prisma.dish.delete({ where: { id } });
  }
}
