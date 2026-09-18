import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  // List all restaurants — only ones approved by admin and currently open for listing
  findAll() {
    return this.prisma.restaurant.findMany({
      where: { isApproved: true, isActive: true },
      include: {
        reviews: { include: { user: { select: { name: true } } } },
        dishes: { where: { isAvailable: true }, include: { sizes: true } },
      },
    });
  }

  // Search restaurants by name/cuisine/description — approved only
  search(q: string) {
    const query = (q || "").trim();
    if (!query) return [];
    return this.prisma.restaurant.findMany({
      where: {
        isApproved: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { cuisineType: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { reviews: true },
      take: 20,
    });
  }

  // Find one restaurant — rejected restaurants 404 for customers (still visible to their owner/admin elsewhere)
  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        dishes: { include: { sizes: true } },
        reviews: { include: { user: true }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!restaurant || !restaurant.isApproved) {
      throw new NotFoundException("Restaurant not found");
    }

    return restaurant;
  }

  // Add a review
  async addReview(restaurantId: string, userId: string, rating: number, comment?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    if (rating < 1 || rating > 5) throw new BadRequestException("Rating must be 1-5");

    const delivered = await this.prisma.order.findFirst({
      where: { userId, restaurantId, status: "DELIVERED" },
      orderBy: { createdAt: "desc" },
    });
    if (!delivered) {
      throw new BadRequestException("You can review a kitchen after an order from there is delivered");
    }

    const review = await this.prisma.review.create({
      data: { restaurantId, userId, rating, comment: comment || null, orderId: delivered.id },
    });

    const agg = await this.prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
    });
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { rating: agg._avg.rating ?? rating },
    });

    return review;
  }

  // Active, non-expired promotions for a restaurant — public, used by the customer app.
  // Includes platform-wide codes (restaurantId null) plus this kitchen's own codes.
  listActivePromotions(restaurantId: string) {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [{ restaurantId }, { restaurantId: null }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      include: { restaurant: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  listAllActivePromotions() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: { restaurant: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
