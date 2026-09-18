import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseGuards } from "@nestjs/common";
import { AdminRestaurantsService } from "./admin-restaurants.service";
import { AdminJwtGuard } from "../guards/admin-jwt/admin-jwt.guard";

@Controller("admin/restaurants")
@UseGuards(AdminJwtGuard)
export class AdminRestaurantsController {
  constructor(private readonly adminRestaurantsService: AdminRestaurantsService) {}

  @Get()
  getAllRestaurants(@Query("search") search?: string) {
    return this.adminRestaurantsService.getAllRestaurants(search);
  }

  @Post()
  createRestaurant(@Body() body: any) {
    return this.adminRestaurantsService.createRestaurant(body);
  }

  @Get(":id")
  getRestaurantById(@Param("id") id: string) {
    return this.adminRestaurantsService.getRestaurantById(id);
  }

  @Post(":id/dishes")
  createDish(@Param("id") id: string, @Body() body: any) {
    return this.adminRestaurantsService.createDish(id, body);
  }

  @Delete(":id")
  deleteRestaurant(@Param("id") id: string) {
    return this.adminRestaurantsService.deleteRestaurant(id);
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string) {
    return this.adminRestaurantsService.approve(id);
  }

  @Patch(":id/reject")
  reject(@Param("id") id: string) {
    return this.adminRestaurantsService.reject(id);
  }

  @Patch(":id/active")
  toggleActive(@Param("id") id: string, @Body("isActive") isActive: boolean) {
    return this.adminRestaurantsService.toggleActive(id, isActive);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.adminRestaurantsService.update(id, body);
  }

  @Patch(":id/dishes/:dishId")
  updateDish(@Param("id") id: string, @Param("dishId") dishId: string, @Body() body: any) {
    return this.adminRestaurantsService.updateDish(id, dishId, body);
  }

  @Delete(":id/dishes/:dishId")
  deleteDish(@Param("id") id: string, @Param("dishId") dishId: string) {
    return this.adminRestaurantsService.deleteDish(id, dishId);
  }
}
