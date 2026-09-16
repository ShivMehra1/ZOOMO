import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { OFFERS } from './common/promo-codes';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('offers')
  getOffers() {
    return OFFERS;
  }
}
