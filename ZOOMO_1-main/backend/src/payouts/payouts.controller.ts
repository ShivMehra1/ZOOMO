import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminJwtGuard } from "../admin/guards/admin-jwt/admin-jwt.guard";
import { PayoutsService } from "./payouts.service";

@Controller("merchant/payouts")
@UseGuards(JwtAuthGuard)
export class MerchantPayoutsController {
  constructor(private readonly service: PayoutsService) {}
  private assertMerchant(req: any) {
    if (req.user?.role !== "MERCHANT") throw new ForbiddenException("Merchant access only");
  }

  @Get("balance")
  balance(@Req() req) {
    this.assertMerchant(req);
    return this.service.getMerchantBalance(req.user.id);
  }

  @Get()
  list(@Req() req) {
    this.assertMerchant(req);
    return this.service.listForMerchant(req.user.id);
  }

  @Post()
  request(@Req() req, @Body() body: any) {
    this.assertMerchant(req);
    return this.service.requestMerchantPayout(req.user.id, body);
  }
}

@Controller("driver/payouts")
@UseGuards(JwtAuthGuard)
export class DriverPayoutsController {
  constructor(private readonly service: PayoutsService) {}
  private assertDriver(req: any) {
    if (req.user?.role !== "DRIVER") throw new ForbiddenException("Driver access only");
  }

  @Get("balance")
  balance(@Req() req) {
    this.assertDriver(req);
    return this.service.getDriverBalance(req.user.id);
  }

  @Get()
  list(@Req() req) {
    this.assertDriver(req);
    return this.service.listForDriver(req.user.id);
  }

  @Post()
  request(@Req() req, @Body() body: any) {
    this.assertDriver(req);
    return this.service.requestDriverPayout(req.user.id, body);
  }
}

@Controller("admin/payouts")
@UseGuards(AdminJwtGuard)
export class AdminPayoutsController {
  constructor(private readonly service: PayoutsService) {}

  @Get()
  list() {
    return this.service.listAll();
  }

  @Get("summary")
  summary() {
    return this.service.businessSummary();
  }

  @Patch(":id/approve")
  approve(@Param("id") id: string) {
    return this.service.setStatus(id, "COMPLETED");
  }

  @Patch(":id/reject")
  reject(@Param("id") id: string) {
    return this.service.setStatus(id, "REJECTED");
  }
}
