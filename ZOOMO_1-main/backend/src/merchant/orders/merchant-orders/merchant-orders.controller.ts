import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { MerchantOrdersService } from './merchant-orders.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Roles } from '../../../auth/roles.decorator';

@Controller('merchant/restaurants/:restaurantId/orders')
@UseGuards(JwtAuthGuard)
@Roles('MERCHANT')
export class MerchantOrdersController {
  constructor(private readonly service: MerchantOrdersService) {}

  // ✅ GET ALL ORDERS FOR A RESTAURANT
  @Get()
  getOrders(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.service.getOrders(
      req.user.id,
      restaurantId,
    );
  }

  // ✅ GET SINGLE ORDER
  @Get(':orderId')
  getOrderById(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.service.getOrderById(
      req.user.id,
      restaurantId,
      orderId,
    );
  }

  // ✅ UPDATE STATUS
  @Patch(':orderId/status')
  updateStatus(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Param('orderId') orderId: string,
    @Body() body: any,
  ) {
    return this.service.updateStatus(
      req.user.id,
      restaurantId,
      orderId,
      body.status,
    );
  }

  // ✅ CANCEL ORDER
  @Patch(':orderId/cancel')
  cancelOrder(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.service.cancelOrder(
      req.user.id,
      restaurantId,
      orderId,
    );
  }

  @Get(':orderId/messages')
  getMessages(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.service.getMessages(req.user.id, restaurantId, orderId);
  }

  @Post(':orderId/messages')
  sendMessage(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Param('orderId') orderId: string,
    @Body() body: { text: string },
  ) {
    return this.service.sendMessage(req.user.id, restaurantId, orderId, body?.text);
  }
}
