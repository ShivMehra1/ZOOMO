import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { Prisma } from "@prisma/client";

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
        dishes: {
          select: { id: true, name: true, description: true, price: true, imageUrl: true, isVegetarian: true, isAvailable: true },
          orderBy: { name: "asc" },
        },
      },
    });
    if (!restaurant) throw new NotFoundException("Restaurant not found");

    const revenue = await this.prisma.order.aggregate({
      where: { restaurantId: id, status: { not: "CANCELLED" } },
      _sum: { total: true, restaurantEarning: true, platformFee: true, driverCommission: true },
      _count: true,
    });

    return {
      ...restaurant,
      totalRevenue: revenue._sum.total || 0,
      totalOrders: revenue._count,
      totalRestaurantEarning: revenue._sum.restaurantEarning || 0,
      totalPlatformFee: revenue._sum.platformFee || 0,
      totalDriverCommission: revenue._sum.driverCommission || 0,
    };
  }

  async createRestaurant(data: {
    name: string;
    address: string;
    ownerEmail?: string;
    ownerName?: string;
    ownerId?: string;
    cuisineType?: string;
    phone?: string;
    description?: string;
    imageUrl?: string;
  }) {
    if (!data?.name || !data?.address) throw new BadRequestException("name and address are required");
    let ownerId = data.ownerId;
    if (!ownerId) {
      if (!data.ownerEmail) throw new BadRequestException("ownerEmail or ownerId is required");
      const existing = await this.prisma.user.findUnique({ where: { email: data.ownerEmail } });
      if (existing) {
        ownerId = existing.id;
      } else {
        const created = await this.prisma.user.create({
          data: {
            email: data.ownerEmail,
            name: data.ownerName || `${data.name} owner`,
            phone: data.phone || "",
            password: "unset",
            role: "MERCHANT",
            mustResetPassword: true,
          },
        });
        ownerId = created.id;
      }
    }
    return this.prisma.restaurant.create({
      data: {
        name: data.name,
        address: data.address,
        ownerId,
        cuisineType: data.cuisineType || "Various",
        phone: data.phone,
        description: data.description,
        imageUrl: data.imageUrl,
        isApproved: true,
        isActive: true,
      },
    });
  }

  async createDish(restaurantId: string, data: {
    name: string; price: number; description?: string; imageUrl?: string;
    isVegetarian?: boolean; category?: string;
  }) {
    await this.mustExist(restaurantId);
    if (!data?.name || data.price == null) throw new BadRequestException("name and price are required");
    return this.prisma.dish.create({
      data: {
        restaurantId,
        name: data.name,
        price: Number(data.price),
        description: data.description,
        imageUrl: data.imageUrl,
        isVegetarian: Boolean(data.isVegetarian),
        category: data.category,
      },
    });
  }

  async deleteRestaurant(id: string) {
    await this.mustExist(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.order.deleteMany({ where: { restaurantId: id } });
      await tx.restaurant.delete({ where: { id } });
    });
    return { ok: true, id };
  }

  async updateDish(restaurantId: string, dishId: string, data: {
    name?: string; description?: string; price?: number; isAvailable?: boolean; imageUrl?: string;
  }) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish || dish.restaurantId !== restaurantId) throw new NotFoundException("Dish not found");
    return this.prisma.dish.update({ where: { id: dishId }, data });
  }

  async deleteDish(restaurantId: string, dishId: string) {
    const dish = await this.prisma.dish.findUnique({ where: { id: dishId } });
    if (!dish || dish.restaurantId !== restaurantId) throw new NotFoundException("Dish not found");
    try {
      await this.prisma.dish.delete({ where: { id: dishId } });
      return { ok: true, id: dishId };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        throw new ConflictException(
          "Can't delete a dish that has order history — mark it unavailable instead.",
        );
      }
      throw err;
    }
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
    address?: string; phone?: string; imageUrl?: string;
    payoutMethod?: string; upiId?: string; bankName?: string; accountLast4?: string;
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
