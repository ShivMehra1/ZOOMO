import { Module } from "@nestjs/common";
import { AdminAnalyticsController } from "./admin-analytics.controller";
import { AdminAnalyticsService } from "./admin-analytics.service";
import { PrismaModule } from "../../common/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService],
})
export class AdminAnalyticsModule {}
