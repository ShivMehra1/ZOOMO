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

    const quantity = body.quantity ?? 1;
    await this.cartService.addItem(req.user.id, body.dishId, quantity, body.dishSizeId);

    return this.cartService.getCart(req.user.id); // 👈 FIXED
  }

  /* ================= UPDATE ITEM ================= */
  @Patch("items/:id")
  async updateItem(@Req() req, @Param("id") id: string, @Body() body) {
    this.checkCustomer(req);

    await this.cartService.updateItem(id, body.quantity ?? 1);
    return this.cartService.getCart(req.user.id); // 👈 FIXED
  }

  /* ================= REMOVE ITEM ================= */
  @Delete("items/:id")
  async removeItem(@Req() req, @Param("id") id: string) {
    this.checkCustomer(req);

    await this.cartService.removeItem(id);
    return this.cartService.getCart(req.user.id); // 👈 FIXED
  }

  /* ================= CLEAR CART ================= */
  @Delete()
  async clearCart(@Req() req) {
    this.checkCustomer(req);

    await this.cartService.clearCart(req.user.id);
    return this.cartService.getCart(req.user.id); // 👈 FIXED
  }
}
