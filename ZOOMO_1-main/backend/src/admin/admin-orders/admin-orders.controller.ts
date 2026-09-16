import { Controller, Get, Patch, Param, Body } from "@nestjs/common";
import { AdminOrdersService } from "./admin-orders.service";
import { AdminJwtGuard } from "../guards/admin-jwt/admin-jwt.guard";
import { UseGuards } from "@nestjs/common/decorators";

@Controller("admin/orders")
@UseGuards(AdminJwtGuard)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) { }

  @Get()
  getAllOrders() {
    return this.adminOrdersService.getAllOrders();
  }

  @Patch(":orderId/assign-driver")
  assignDriver(
    @Param("orderId") orderId: string,
    @Body("driverId") driverId: string
  ) {
    return this.adminOrdersService.assignDriver(orderId, driverId);
  }

  // ✅ NEW — force confirm or cancel a scheduled order
  @Patch(":orderId/status")
  updateOrderStatus(
    @Param("orderId") orderId: string,
    @Body("status") status: string
  ) {
    return this.adminOrdersService.updateOrderStatus(orderId, status);
  }

  @Get("disputes")
  getDisputes() {
    return this.adminOrdersService.getDisputes();
  }

  @Patch(":orderId/refund")
  refundOrder(
    @Param("orderId") orderId: string,
    @Body("amount") amount: number,
    @Body("reason") reason: string
  ) {
    return this.adminOrdersService.refundOrder(orderId, amount, reason);
  }

  @Get(":orderId/messages")
  getOrderMessages(@Param("orderId") orderId: string) {
    return this.adminOrdersService.getOrderMessages(orderId);
  }
}