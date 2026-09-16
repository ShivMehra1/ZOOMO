import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './common/prisma.module';
import { PrismaService } from './common/prisma.service';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { DishesModule } from './dishes/dishes.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AddressModule } from './address/address.module';
import { MerchantModule } from './merchant/merchant.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { DriverModule } from './driver/driver.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { FavoritesModule } from './favorites/favorites.module';


@Module({
  imports: [AuthModule, UsersModule, PrismaModule, RestaurantsModule, DishesModule, CartModule, OrdersModule, PaymentsModule, AddressModule, MerchantModule, DriverModule, AdminModule, UploadModule, FavoritesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }