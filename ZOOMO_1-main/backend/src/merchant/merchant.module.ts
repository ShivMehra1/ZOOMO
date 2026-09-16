import { Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { MerchantAuthModule } from './auth/merchant-auth/merchant-auth.module';
import { MerchantRestaurantsModule } from './restaurants/merchant-restaurants/merchant-restaurants.module';
import { MerchantDishesModule } from './dishes/merchant-dishes/merchant-dishes.module';
import { MerchantOrdersModule } from './orders/merchant-orders/merchant-orders.module';
import { MerchantPromotionsModule } from './promotions/merchant-promotions.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../auth/roles.guard';




@Module({
  controllers: [MerchantController],
  providers: [{ provide: APP_GUARD, useClass: RolesGuard }, MerchantService],
  imports: [MerchantRestaurantsModule, MerchantAuthModule, MerchantDishesModule, MerchantOrdersModule, MerchantPromotionsModule],
})
export class MerchantModule {}
