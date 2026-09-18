import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  private checkCustomer(req) {
    if (!req.user || req.user.role !== 'USER') {
      throw new ForbiddenException("Only customers can access the cart");
    }
  }

  /* ================= GET CART ================= */
  @Get()
  async getCart(@Req() req) {
    this.checkCustomer(req);
    return this.cartService.getCart(req.user.id); // 👈 FIXED
  }

  /* ================= ADD ITEM ================= */
  @Post("items")
  async addItem(@Req() req, @Body() body) {
    this.checkCustomer(req);
    return this.cartService.addItem(req.user.id, {
      dishId: body.dishId,
      quantity: body.quantity,
      dishSizeId: body.dishSizeId,
      specialInstructions: body.specialInstructions,
      replace: Boolean(body.replace),
    });
  }

  /* ================= UPDATE ITEM ================= */
  @Patch("items/:id")
  async updateItem(@Req() req, @Param("id") id: string, @Body() body) {
    this.checkCustomer(req);
    return this.cartService.updateItem(req.user.id, id, body.quantity ?? 1, body.specialInstructions);
  }

  /* ================= REMOVE ITEM ================= */
  @Delete("items/:id")
  async removeItem(@Req() req, @Param("id") id: string) {
    this.checkCustomer(req);
    return this.cartService.removeItem(req.user.id, id);
  }

  @Delete("restaurant/:restaurantId")
  async clearRestaurant(@Req() req, @Param("restaurantId") restaurantId: string) {
    this.checkCustomer(req);
    return this.cartService.clearRestaurant(req.user.id, restaurantId);
  }

  /* ================= CLEAR CART ================= */
  @Delete()
  async clearCart(@Req() req) {
    this.checkCustomer(req);
    return this.cartService.clearCart(req.user.id);
  }
}
