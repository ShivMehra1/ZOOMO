import { Module } from "@nestjs/common";
import { PrismaModule } from "../common/prisma.module";
import { PayoutsService } from "./payouts.service";
import { MerchantPayoutsController, DriverPayoutsController, AdminPayoutsController } from "./payouts.controller";

@Module({
  imports: [PrismaModule],
  controllers: [MerchantPayoutsController, DriverPayoutsController, AdminPayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}
