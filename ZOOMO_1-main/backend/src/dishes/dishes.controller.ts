import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DishesService } from './dishes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller("dishes")
export class DishesController {
  constructor(private dishesService: DishesService) {}

  // GET /dishes?restaurantId=123
  @Get()
  getByRestaurant(@Query("restaurantId") restaurantId: string) {
    return this.dishesService.findByRestaurant(restaurantId);
  }

  // GET /dishes/search?q=paneer — must come before the :id route below
  @Get("search")
  search(@Query("q") q: string) {
    return this.dishesService.search(q);
  }

  // GET /dishes/:id
  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.dishesService.findOne(id);
  }

  // CREATE DISH (MERCHANT ONLY)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("MERCHANT", "ADMIN")
  @Post()
  create(@Body() body: any, @Req() req) {
    const { restaurantId } = body;
    return this.dishesService.create(body, restaurantId);
  }

  // UPDATE DISH
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("MERCHANT", "ADMIN")
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.dishesService.update(id, body);
  }

  // DELETE DISH
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("MERCHANT", "ADMIN")
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.dishesService.delete(id);
  }
}
