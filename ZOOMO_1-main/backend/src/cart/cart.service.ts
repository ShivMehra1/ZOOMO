import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export type AddItemInput = {
  dishId: string;
  quantity?: number;
  dishSizeId?: string | null;
  specialInstructions?: string;
  replace?: boolean;
};

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /* ================= GET CART ================= */
  async getCart(userId: string) {
    if (!userId) throw new BadRequestException("userId missing");

    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { dish: { include: { sizes: true } } },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: { include: { dish: { include: { sizes: true } } } },
        },
      });
    }

    return { items: cart.items };
  }

  /* ================= ADD ITEM ================= */
  async addItem(userId: string, input: AddItemInput) {
    if (!userId) throw new BadRequestException("userId missing");
    const dishId = input.dishId?.trim();
    if (!dishId) throw new BadRequestException("dishId missing");

    const quantity = Math.max(1, Number(input.quantity) || 1);
    const dishSizeId = input.dishSizeId?.trim() || null;
    const note = input.specialInstructions?.trim() || null;

    const dish = await this.prisma.dish.findUnique({
      where: { id: dishId },
      include: { restaurant: true, sizes: true },
    });
    if (!dish) throw new NotFoundException("Dish not found");
    if (!dish.isAvailable) throw new BadRequestException("This dish is sold out");
    if (!dish.restaurant?.isApproved) {
      throw new BadRequestException("This restaurant is no longer available");
    }
    if (!dish.restaurant?.isActive) {
      throw new BadRequestException("This restaurant is currently closed");
    }
    if (dishSizeId && !dish.sizes.some((s) => s.id === dishSizeId)) {
      throw new BadRequestException("That size is not available for this dish");
    }

    const cart = await this.ensureCart(userId);

    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, dishId, dishSizeId, specialInstructions: note },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, dishId, quantity, dishSizeId, specialInstructions: note },
      });
    }

    return this.getCart(userId);
  }

  /* ================= UPDATE QUANTITY / NOTE ================= */
  async updateItem(userId: string, id: string, quantity: number, specialInstructions?: string) {
    if (!id) throw new BadRequestException("item id missing");

    const item = await this.prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });
    if (!item) throw new NotFoundException("Item not found");
    if (item.cart.userId !== userId) throw new ForbiddenException("Not your bag");

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id } });
    } else {
      await this.prisma.cartItem.update({
        where: { id },
        data: {
          quantity,
          ...(specialInstructions !== undefined ? { specialInstructions: specialInstructions.trim() || null } : {}),
        },
      });
    }

    return this.getCart(userId);
  }

  /* ================= REMOVE ================= */
  async removeItem(userId: string, itemId: string) {
    if (!itemId) throw new BadRequestException("item id missing");

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item) return this.getCart(userId);
    if (item.cart.userId !== userId) throw new ForbiddenException("Not your bag");

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  /* ================= CLEAR CART ================= */
  async clearCart(userId: string) {
    if (!userId) throw new BadRequestException("userId missing");

    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return { items: [] };

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return this.getCart(userId);
  }

  async clearRestaurant(userId: string, restaurantId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { dish: true } } },
    });
    if (!cart) return { items: [] };
    const ids = cart.items.filter((i) => i.dish.restaurantId === restaurantId).map((i) => i.id);
    if (ids.length) {
      await this.prisma.cartItem.deleteMany({ where: { id: { in: ids } } });
    }
    return this.getCart(userId);
  }

  /* ================= UTIL ================= */
  private async ensureCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    return cart;
  }
}
