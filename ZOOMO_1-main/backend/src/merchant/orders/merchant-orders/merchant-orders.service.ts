import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { MessageSender, OrderStatus } from '@prisma/client';
import { RealtimeGateway } from '../../../realtime/realtime.gateway';
import { canTransition } from '../../../common/order-status-flow.util';

@Injectable()
export class MerchantOrdersService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) { }

  // 🔐 ensure restaurant belongs to merchant
  private async assertRestaurantOwnership(
    merchantId: string,
    restaurantId: string,
  ) {
    const restaurant =
      await this.prisma.restaurant.findFirst({
        where: {
          id: restaurantId,
          ownerId: merchantId,
        },
      });

    if (!restaurant) {
      throw new ForbiddenException(
        'Not your restaurant',
      );
    }

    return restaurant;
  }

  // ✅ GET ALL ORDERS
  async getOrders(
    merchantId: string,
    restaurantId: string,
  ) {
    await this.assertRestaurantOwnership(
      merchantId,
      restaurantId,
    );

    return this.prisma.order.findMany({
      where: { restaurantId },
      include: {
        items: { include: { dish: true } },
        user: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ GET SINGLE ORDER
  async getOrderById(
    merchantId: string,
    restaurantId: string,
    orderId: string,
  ) {
    await this.assertRestaurantOwnership(
      merchantId,
      restaurantId,
    );

    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          restaurantId,
        },
        include: {
          items: { include: { dish: true } },
          user: true,
          address: true,
        },
      });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // ✅ UPDATE STATUS
  async updateStatus(
    merchantId: string,
    restaurantId: string,
    orderId: string,
    nextStatus: OrderStatus,
  ) {
    await this.assertRestaurantOwnership(
      merchantId,
      restaurantId,
    );

    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          restaurantId,
        },
      });

    if (!order)
      throw new NotFoundException('Order not found');

    if (order.status === nextStatus) return order;

    if (!canTransition(order, nextStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${nextStatus}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });
    this.emitOrderUpdate(updated);
    return updated;
  }

  private emitOrderUpdate(order: { id: string; restaurantId: string; userId: string; driverId: string | null }) {
    const rooms = [`order:${order.id}`, `restaurant:${order.restaurantId}`, `user:${order.userId}`, 'admin'];
    if (order.driverId) rooms.push(`driver:${order.driverId}`);
    this.realtime.emitToRooms(rooms, 'order:updated', order);
  }

  // ✅ CANCEL ORDER
  async cancelOrder(
    merchantId: string,
    restaurantId: string,
    orderId: string,
  ) {
    await this.assertRestaurantOwnership(
      merchantId,
      restaurantId,
    );

    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          restaurantId,
        },
      });

    if (!order)
      throw new NotFoundException('Order not found');

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.SCHEDULED   // ✅ allow cancelling SCHEDULED too
    ) {
      throw new BadRequestException(
        'Only pending or scheduled orders can be cancelled',
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
    this.emitOrderUpdate(updated);
    return updated;
  }

  async getMessages(merchantId: string, restaurantId: string, orderId: string) {
    await this.assertRestaurantOwnership(merchantId, restaurantId);
    const order = await this.prisma.order.findFirst({ where: { id: orderId, restaurantId } });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(merchantId: string, restaurantId: string, orderId: string, text: string) {
    await this.assertRestaurantOwnership(merchantId, restaurantId);
    const order = await this.prisma.order.findFirst({ where: { id: orderId, restaurantId } });
    if (!order) throw new NotFoundException('Order not found');
    const trimmed = (text || '').trim();
    if (!trimmed) throw new BadRequestException("Message can't be empty");
    const message = await this.prisma.orderMessage.create({
      data: { orderId, sender: MessageSender.RESTAURANT, text: trimmed.slice(0, 500) },
    });
    const rooms = [`order:${orderId}`, `user:${order.userId}`, `restaurant:${restaurantId}`];
    if (order.driverId) rooms.push(`driver:${order.driverId}`);
    this.realtime.emitToRooms(rooms, 'order:message', message);
    return message;
  }
}