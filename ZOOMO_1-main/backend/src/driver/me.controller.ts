import {
  Controller,
  Patch,
  Get,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DriverMeService } from "./me.service";

@Controller("driver/me")
@UseGuards(AuthGuard("driver-jwt"))
export class DriverMeController {
  constructor(private readonly driverMeService: DriverMeService) {}

  @Get()
  async getMe(@Req() req: any) {
    return this.driverMeService.getDriverProfile(req.user.userId);
  }

  @Patch("availability")
  async updateAvailability(
    @Req() req: any,
    @Body() body: { isAvailable: boolean }
  ) {
    return this.driverMeService.updateAvailability(
      req.user.driverId,
      body.isAvailable
    );
  }

  @Patch("vehicle")
  async updateVehicle(
    @Req() req: any,
    @Body() body: { vehicleType?: string; vehiclePlate?: string }
  ) {
    return this.driverMeService.updateVehicle(req.user.userId, body);
  }
}
