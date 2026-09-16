import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MerchantPromotionsService } from './merchant-promotions.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('merchant/promotions')
@UseGuards(JwtAuthGuard)
export class MerchantPromotionsController {
  constructor(private readonly service: MerchantPromotionsService) {}

  private assertMerchant(req: any) {
    if (req.user?.role !== 'MERCHANT') {
      throw new ForbiddenException('Merchant access only');
    }
  }

  @Get()
  list(@Req() req) {
    this.assertMerchant(req);
    return this.service.list(req.user.id);
  }

  @Post()
  create(@Req() req, @Body() body: any) {
    this.assertMerchant(req);
    return this.service.create(req.user.id, body);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() body: any) {
    this.assertMerchant(req);
    return this.service.update(req.user.id, id, body);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    this.assertMerchant(req);
    return this.service.remove(req.user.id, id);
  }
}
