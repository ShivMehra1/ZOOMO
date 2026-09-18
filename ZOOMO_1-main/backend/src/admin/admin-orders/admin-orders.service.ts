import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { OrderStatus } from "@prisma/client";
import { canTransition } from "../../common/order-status-flow.util";
import { RealtimeGateway } from "../../realtime/realtime.gateway";
import { haversineKm } from "../../common/geo.util";
import { resolveJourianCoords } from "../../common/jourian-areas.util";

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService, private readonly realtime: RealtimeGateway) { }

  private emitOrderUpdate(order: { id: string; restaurantId: string; userId: string; driverId: string | null }) {
    const rooms = [`order:${order.id}`, `restaurant:${order.restaurantId}`, `user:${order.userId}`, "admin"];
    if (order.driverId) rooms.push(`driver:${order.driverId}`);
    this.realtime.emitToRooms(rooms, "order:updated", order);
  }

  /* ===========================
     NEAREST AVAILABLE DRIVERS (geo algorithm)
     Ranks available, unassigned drivers by real haversine distance from
     their last known position to the restaurant — falls back to the
     Jourian area-center lookup for drivers/restaurants with no live
     GPS fix yet.
  ============================ */
  async nearestDrivers(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    const origin =
      order.restaurant.lat != null && order.restaurant.lng != null
        ? { lat: order.restaurant.lat, lng: order.restaurant.lng }
        : resolveJourianCoords(order.restaurant.address);

    const drivers = await this.prisma.driver.findMany({
      where: { isAvailable: true },
      include: { user: { select: { name: true, avatarUrl: true } } },
    });

    return drivers
      .map((d) => {
        // A driver who has never sent a real GPS ping still carries whatever
        // placeholder lat/lng they were seeded with (often nowhere near
        // Jourian) — treat anything >200km away as "no live position" rather
        // than reporting a nonsense distance, and rank them by the town
        // center instead so they're still assignable.
        const rawPos = d.currentLat != null && d.currentLng != null ? { lat: d.currentLat, lng: d.currentLng } : null;
        const rawDistance = rawPos ? haversineKm(origin.lat, origin.lng, rawPos.lat, rawPos.lng) : null;
        const hasLivePosition = rawDistance != null && rawDistance <= 200;
        const pos = hasLivePosition ? rawPos! : resolveJourianCoords("jourian");
        const distanceKm = parseFloat(haversineKm(origin.lat, origin.lng, pos.lat, pos.lng).toFixed(2));
        return {
          driverId: d.id,
          name: d.user.name,
          avatarUrl: d.user.avatarUrl,
          rating: d.rating,
          vehicleType: d.vehicleType,
          distanceKm,
          hasLivePosition,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /* ===========================
     GET ALL ORDERS (ADMIN)
  ============================ */
  async getAllOrders(filters: {
    restaurantId?: string;
    status?: string;
    orderType?: string;
    from?: string;
    to?: string;
    search?: string;
  } = {}) {
    const where: any = {};
    if (filters.restaurantId) where.restaurantId = filters.restaurantId;
    if (filters.status) where.status = filters.status;
    if (filters.orderType) {
      where.orderType = filters.orderType === "TAKEAWAY" ? "PICKUP" : filters.orderType;
    }
    const from = filters.from ? new Date(filters.from) : null;
    const to = filters.to ? new Date(filters.to) : null;
    if ((from && !Number.isNaN(+from)) || (to && !Number.isNaN(+to))) {
      where.createdAt = {};
      if (from && !Number.isNaN(+from)) where.createdAt.gte = from;
      if (to && !Number.isNaN(+to)) where.createdAt.lte = to;
    }
    const q = filters.search?.trim();
    if (q) {
      const ors: any[] = [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q, mode: "insensitive" } } },
        { restaurant: { name: { contains: q, mode: "insensitive" } } },
      ];
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)) {
        ors.unshift({ id: q });
      }
      where.OR = ors;
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: {
        restaurant: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        driver: { include: { user: { select: { name: true } } } },
      },
    });
  }

  /* ===========================
     DELETE ORDER (ADMIN)
     Hard delete — cascades OrderItem/Payment/OrderMessage via schema FKs.
     Only for orders that never earned real revenue (PENDING/SCHEDULED/
     CANCELLED junk or test orders) — a DELIVERED order's totals are already
     baked into restaurant/driver payout balances and the platform business
     summary, so deleting it would silently corrupt those figures with no
     audit trail. Use CANCELLED status (already supported elsewhere) to
     remove a delivered order from view instead.
  ============================ */
  async deleteOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException(
        "Delivered orders can't be deleted — their revenue is already reflected in payout balances and business totals. Cancel or refund instead.",
      );
    }
    await this.prisma.order.delete({ where: { id: orderId } });
    this.realtime.emitToRooms(
      [`order:${orderId}`, `restaurant:${order.restaurantId}`, "admin"],
      "order:deleted",
      { id: orderId },
    );
    return { ok: true, id: orderId };
  }

  /* ===========================
     ASSIGN DRIVER (ADMIN)
  ============================ */
  async assignDriver(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException("Order not found");

    if (order.driverId) {
      throw new BadRequestException("Order already assigned to a driver");
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException("Only READY_FOR_PICKUP orders can be assigned");
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) throw new BadRequestException("Driver not found");

    const activeOrdersCount = await this.prisma.order.count({
      where: {
        driverId,
        status: {
          in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY],
        },
      },
    });

    if (activeOrdersCount > 0) {
      throw new BadRequestException("Driver already has an active order");
    }

    const result = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { driverId },
      }),
      this.prisma.driver.update({
        where: { id: driverId },
        data: { isAvailable: false },
      }),
    ]);
    this.emitOrderUpdate(result[0]);
    return result;
  }

  /* ===========================
     UPDATE ORDER STATUS (ADMIN)  ✅ NEW
  ============================ */
  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException("Order not found");

    const allowedStatuses = Object.values(OrderStatus);
    if (!allowedStatuses.includes(status as OrderStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const next = status as OrderStatus;
    // Same ticket already there (e.g. restaurant already accepted) — no error.
    if (order.status === next) return order;

    if (!canTransition(order, next)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${next}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: next },
    });
    this.emitOrderUpdate(updated);
    return updated;
  }

  /* ===========================
     DISPUTES — cancelled orders, low ratings, un-refunded
  ============================ */
  async getDisputes() {
    return this.prisma.order.findMany({
      where: {
        OR: [
          { status: OrderStatus.CANCELLED },
          { rating: { lte: 2 } },
          { refundRequested: true, refundedAt: null },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: { select: { name: true } },
        user: { select: { name: true, email: true } },
        messages: true,
      },
    });
  }

  async refundOrder(orderId: string, amount: number, reason: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.refundedAt) throw new BadRequestException("Order already refunded");

    const refundAmount = amount ?? order.total;
    if (refundAmount <= 0 || refundAmount > order.total) {
      throw new BadRequestException("Invalid refund amount");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        refundAmount,
        refundedAt: new Date(),
        refundRequested: false,
        cancelReason: reason || order.cancelReason,
      },
    });
  }

  async rejectRefund(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    return this.prisma.order.update({
      where: { id: orderId },
      data: { refundRejectedAt: new Date(), refundRequested: false },
    });
  }

  async getOrderMessages(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");

    return this.prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
  }
}