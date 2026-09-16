import { Module } from '@nestjs/common';
import { MerchantPromotionsController } from './merchant-promotions.controller';
import { MerchantPromotionsService } from './merchant-promotions.service';
import { PrismaModule } from '../../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MerchantPromotionsController],
  providers: [MerchantPromotionsService],
})
export class MerchantPromotionsModule {}
