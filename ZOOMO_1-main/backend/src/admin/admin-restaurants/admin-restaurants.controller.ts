import { Controller, Get, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
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

  @Get(":id")
  getRestaurantById(@Param("id") id: string) {
    return this.adminRestaurantsService.getRestaurantById(id);
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
}
