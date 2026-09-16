import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  // List all restaurants — only ones approved by admin and currently open for listing
  findAll() {
    return this.prisma.restaurant.findMany({
      where: { isApproved: true },
      include: {
        reviews: true,
        dishes: { include: { sizes: true } },
      },
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

    const review = await this.prisma.review.create({
      data: { restaurantId, userId, rating, comment: comment || null },
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
}
