import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminJwtGuard } from "../guards/admin-jwt/admin-jwt.guard";
import { AdminPromotionsService } from "./admin-promotions.service";

@Controller("admin/promotions")
@UseGuards(AdminJwtGuard)
export class AdminPromotionsController {
  constructor(private readonly service: AdminPromotionsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
