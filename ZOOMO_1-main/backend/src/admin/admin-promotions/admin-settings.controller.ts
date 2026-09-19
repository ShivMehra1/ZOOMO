import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AdminJwtGuard } from "../guards/admin-jwt/admin-jwt.guard";
import { AdminPromotionsService } from "./admin-promotions.service";

@Controller("admin/settings")
@UseGuards(AdminJwtGuard)
export class AdminSettingsController {
  constructor(private readonly service: AdminPromotionsService) {}

  @Get("rain-surge")
  getRain() {
    return this.service.getRainSurge();
  }

  @Post("rain-surge")
  setRain(@Body() body: { on?: boolean; pct?: number }) {
    return this.service.setRainSurge(Boolean(body?.on), body?.pct != null ? Number(body.pct) : undefined);
  }
}
