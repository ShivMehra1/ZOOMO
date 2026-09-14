import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';

@Injectable()
export class MerchantDishesService {
  constructor(private prisma: PrismaService) { }

  // 🔹 helper: get merchant's restaurant
  private async getMerchantRestaurant(
    merchantId: string,
  ) {
    const restaurant =
      await this.prisma.restaurant.findFirst({
        where: { ownerId: merchantId },
      });

    if (!restaurant) {
      throw new ForbiddenException(
        'No restaurant found for this merchant',
      );
    }

    return restaurant;
  }

  // ✅ CREATE DISH (merchant's own restaurant)
  async createForMerchant(
    merchantId: string,
    body: any,
  ) {
    const restaurant =
      await this.getMerchantRestaurant(merchantId);

    if (!body.name || !body.price) {
      throw new BadRequestException(
        'Dish name and price are required',
      );
    }

    return this.prisma.dish.create({
      data: {
        name: body.name,
        description: body.description || null,
        price: Number(body.price),
        // ✅ FIX: Prisma schema has calories and preparationTime as Int?
        // React inputs always return strings — "10" or "" — so we must
        // coerce to integer or null. Sending "" to an Int? column causes
        // a Prisma type validation error → 500 Internal Server Error.
        imageUrl: body.imageUrl || null,
        ingredients: body.ingredients || null,
        calories: body.calories !== undefined && body.calories !== "" && body.calories !== null
          ? parseInt(String(body.calories), 10) || null
          : null,
        preparationTime: body.preparationTime !== undefined && body.preparationTime !== "" && body.preparationTime !== null
          ? parseInt(String(body.preparationTime), 10) || null
          : null,
        isVegetarian: body.isVegetarian ?? false,
        isVegan: body.isVegan ?? false,
        isGlutenFree: body.isGlutenFree ?? false,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
        restaurantId: restaurant.id,
      },
    });
  }

  // ✅ GET MENU (merchant's own restaurant)
  async getMenuForMerchant(merchantId: string) {
    const restaurant =
      await this.getMerchantRestaurant(merchantId);

    return this.prisma.dish.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ UPDATE DISH
  async update(
    merchantId: string,
    dishId: string,
    body: any,
  ) {
    const dish =
      await this.prisma.dish.findUnique({
        where: { id: dishId },
        include: { restaurant: true },
      });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    if (dish.restaurant.ownerId !== merchantId) {
      throw new ForbiddenException(
        'You do not own this dish',
      );
    }

    return this.prisma.dish.update({
      where: { id: dishId },
      data: {
        name: body.name,
        description: body.description || null,
        price: body.price !== undefined ? Number(body.price) : undefined,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
        ingredients: body.ingredients || null,
        // ✅ FIX: same Int? coercion needed on update
        calories: body.calories !== undefined
          ? (body.calories !== "" && body.calories !== null
            ? parseInt(String(body.calories), 10) || null
            : null)
          : undefined,
        preparationTime: body.preparationTime !== undefined
          ? (body.preparationTime !== "" && body.preparationTime !== null
            ? parseInt(String(body.preparationTime), 10) || null
            : null)
          : undefined,
        isVegetarian: body.isVegetarian,
        isVegan: body.isVegan,
        isGlutenFree: body.isGlutenFree,
        isAvailable: body.isAvailable,
      },
    });
  }
  async getDishById(
    merchantId: string,
    dishId: string,
  ) {
    const dish = await this.prisma.dish.findUnique({
      where: { id: dishId },
      include: { restaurant: true },
    });



    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    if (dish.restaurant.ownerId !== merchantId) {
      throw new ForbiddenException(
        'You do not own this dish',
      );
    }

    return dish;
  }

  // ✅ TOGGLE AVAILABILITY
  async toggleAvailability(
    merchantId: string,
    dishId: string,
  ) {
    const dish =
      await this.prisma.dish.findUnique({
        where: { id: dishId },
        include: { restaurant: true },
      });

    if (!dish) {
      throw new NotFoundException('Dish not found');
    }

    if (dish.restaurant.ownerId !== merchantId) {
      throw new ForbiddenException(
        'You do not own this dish',
      );
    }

    return this.prisma.dish.update({
      where: { id: dishId },
      data: { isAvailable: !dish.isAvailable },
    });
  }
}