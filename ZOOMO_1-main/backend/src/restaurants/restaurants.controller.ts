import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller("restaurants")
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

  @Get()
  getAll() {
    return this.restaurantsService.findAll();
  }

  // GET /restaurants/search?q=pizza — must come before the :id route below
  @Get("search")
  search(@Query("q") q: string) {
    return this.restaurantsService.search(q);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.restaurantsService.findOne(id);
  }

  // GET /restaurants/:id/promotions — active promo codes, public
  @Get(":id/promotions")
  getPromotions(@Param("id") id: string) {
    return this.restaurantsService.listActivePromotions(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("USER")
  @Post(":id/reviews")
  addReview(@Param("id") id: string, @Body() body, @Req() req) {
    return this.restaurantsService.addReview(id, req.user.id, Number(body.rating), body.comment);
  }
}
