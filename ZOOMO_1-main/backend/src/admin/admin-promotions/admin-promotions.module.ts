import { Module } from "@nestjs/common";
import { AdminPromotionsController } from "./admin-promotions.controller";
import { AdminSettingsController } from "./admin-settings.controller";
import { AdminPromotionsService } from "./admin-promotions.service";

@Module({
  controllers: [AdminPromotionsController, AdminSettingsController],
  providers: [AdminPromotionsService],
})
export class AdminPromotionsModule {}
