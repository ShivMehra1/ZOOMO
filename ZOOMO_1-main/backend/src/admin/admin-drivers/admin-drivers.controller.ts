import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminDriversService } from "./admin-drivers.service";
import { AdminJwtGuard } from "../guards/admin-jwt/admin-jwt.guard";

@Controller("admin/drivers")
@UseGuards(AdminJwtGuard)
export class AdminDriversController {
  constructor(private readonly adminDriversService: AdminDriversService) {}

  @Get()
  getAllDrivers() {
    return this.adminDriversService.getAllDrivers();
  }

  @Post()
  createDriver(@Body() body: any) {
    return this.adminDriversService.createDriver(body);
  }

  @Get(":id")
  getDriverById(@Param("id") id: string) {
    return this.adminDriversService.getDriverById(id);
  }

  @Patch(":id")
  updateDriver(@Param("id") id: string, @Body() body: any) {
    return this.adminDriversService.updateDriver(id, body);
  }

  @Delete(":id")
  deleteDriver(@Param("id") id: string) {
    return this.adminDriversService.deleteDriver(id);
  }
}
