import { Module } from "@nestjs/common";
import { AdminAuthModule } from "./admin-auth/admin-auth.module";
import { AdminOrdersModule } from "./admin-orders/admin-orders.module";
import { AdminDriversModule } from "./admin-drivers/admin-drivers.module";
import { AdminUsersModule } from "./admin-users/admin-users.module";
import { AdminRestaurantsModule } from "./admin-restaurants/admin-restaurants.module";
import { AdminAnalyticsModule } from "./admin-analytics/admin-analytics.module";
import { AdminJwtStrategy } from "./strategies/admin-jwt.strategy/admin-jwt.strategy";

@Module({
  imports: [
    AdminAuthModule,
    AdminOrdersModule,
    AdminDriversModule,
    AdminUsersModule,
    AdminRestaurantsModule,
    AdminAnalyticsModule,
  ],
  providers: [AdminJwtStrategy],
})
export class AdminModule {}
