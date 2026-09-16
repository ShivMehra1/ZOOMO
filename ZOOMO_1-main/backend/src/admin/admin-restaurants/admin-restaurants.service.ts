import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class AdminRestaurantsService {
  constructor(private prisma: PrismaService) {}

  async getAllRestaurants(search?: string) {
    const restaurants = await this.prisma.restaurant.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { cuisineType: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        imageUrl: true,
        cuisineType: true,
        address: true,
        rating: true,
        isActive: true,
        isApproved: true,
        costForTwo: true,
        etaMin: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { orders: true, dishes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return restaurants.map((r) => ({
      ...r,
      orderCount: r._count.orders,
      dishCount: r._count.dishes,
      _count: undefined,
    }));
  }

  async getRestaurantById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        dishes: { select: { id: true, name: true, price: true, isAvailable: true } },
      },
    });
    if (!restaurant) throw new NotFoundException("Restaurant not found");

    const revenue = await this.prisma.order.aggregate({
      where: { restaurantId: id, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    });

    return {
      ...restaurant,
      totalRevenue: revenue._sum.total || 0,
      totalOrders: revenue._count,
    };
  }

  async approve(id: string) {
    await this.mustExist(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { isApproved: true },
      select: { id: true, isApproved: true },
    });
  }

  async reject(id: string) {
    await this.mustExist(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { isApproved: false, isActive: false },
      select: { id: true, isApproved: true, isActive: true },
    });
  }

  async toggleActive(id: string, isActive: boolean) {
    await this.mustExist(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });
  }

  async update(id: string, data: {
    name?: string; description?: string; cuisineType?: string;
    priceRange?: string; costForTwo?: number; etaMin?: number;
    address?: string; phone?: string;
  }) {
    await this.mustExist(id);
    return this.prisma.restaurant.update({ where: { id }, data });
  }

  private async mustExist(id: string) {
    const r = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!r) throw new NotFoundException("Restaurant not found");
    return r;
  }
}
