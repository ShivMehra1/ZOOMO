import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { DriverOrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("driver/orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
export class DriverOrdersController {
  constructor(
    private readonly driverOrdersService: DriverOrdersService
  ) {}

  @Get()
  getAssignedOrders(@Req() req) {
    return this.driverOrdersService.getAssignedOrders(
      req.user.id
    );
  }

  // Past deliveries (delivered/cancelled) — must come before the :id route below
  @Get("history")
  getHistory(@Req() req) {
    return this.driverOrdersService.getHistory(req.user.id);
  }

  // ✅ NEW — Order details for map & navigation
  @Get(":id")
  getOrderDetails(
    @Param("id") orderId: string,
    @Req() req
  ) {
    return this.driverOrdersService.getOrderDetails(
      orderId,
      req.user.id
    );
  }

  @Patch(":id/pickup")
  markPickedUp(
    @Param("id") orderId: string,
    @Req() req
  ) {
    return this.driverOrdersService.markPickedUp(
      orderId,
      req.user.id
    );
  }

  @Patch(":id/deliver")
  markDelivered(
    @Param("id") orderId: string,
    @Req() req
  ) {
    return this.driverOrdersService.markDelivered(
      orderId,
      req.user.id
    );
  }

  @Get(":id/messages")
  getMessages(@Param("id") orderId: string, @Req() req) {
    return this.driverOrdersService.getMessages(orderId, req.user.id);
  }

  @Post(":id/messages")
  sendMessage(@Param("id") orderId: string, @Req() req, @Body() body: { text: string }) {
    return this.driverOrdersService.sendMessage(orderId, req.user.id, body.text);
  }
}
