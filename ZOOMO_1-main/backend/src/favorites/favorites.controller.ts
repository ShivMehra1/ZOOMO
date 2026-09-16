import { Controller, Get, Post, Delete, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  private checkCustomer(req) {
    if (!req.user || req.user.role !== 'USER') {
      throw new ForbiddenException('Only customers can access favorites');
    }
  }

  @Get()
  list(@Req() req) {
    this.checkCustomer(req);
    return this.favoritesService.list(req.user.id);
  }

  @Post(':restaurantId')
  add(@Req() req, @Param('restaurantId') restaurantId: string) {
    this.checkCustomer(req);
    return this.favoritesService.add(req.user.id, restaurantId);
  }

  @Delete(':restaurantId')
  remove(@Req() req, @Param('restaurantId') restaurantId: string) {
    this.checkCustomer(req);
    return this.favoritesService.remove(req.user.id, restaurantId);
  }
}
