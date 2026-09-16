import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminAnalyticsService } from "./admin-analytics.service";
import { AdminJwtGuard } from "../guards/admin-jwt/admin-jwt.guard";

@Controller("admin/analytics")
@UseGuards(AdminJwtGuard)
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get("summary")
  getSummary() {
    return this.adminAnalyticsService.getSummary();
  }

  @Get("revenue-timeseries")
  getRevenueTimeseries(@Query("days") days?: string) {
    return this.adminAnalyticsService.getRevenueTimeseries(days ? parseInt(days, 10) : 14);
  }

  @Get("top-restaurants")
  getTopRestaurants(@Query("limit") limit?: string) {
    return this.adminAnalyticsService.getTopRestaurants(limit ? parseInt(limit, 10) : 5);
  }

  @Get("top-dishes")
  getTopDishes(@Query("limit") limit?: string) {
    return this.adminAnalyticsService.getTopDishes(limit ? parseInt(limit, 10) : 5);
  }
}
