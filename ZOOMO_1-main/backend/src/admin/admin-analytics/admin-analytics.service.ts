import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class AdminAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getInbox() {
    const [unreadOrders, unreadPayouts, disputes, refunds] = await Promise.all([
      this.prisma.order.count({ where: { status: { in: ["PENDING", "SCHEDULED"] } } }),
      this.prisma.payout.count({ where: { status: "PENDING" } }),
      this.prisma.order.count({
        where: {
          OR: [
            { status: "CANCELLED" },
            { rating: { lte: 2 } },
            { refundRequested: true, refundedAt: null, refundRejectedAt: null },
          ],
        },
      }),
      this.prisma.order.count({
        where: { refundRequested: true, refundedAt: null, refundRejectedAt: null },
      }),
    ]);
    return { unreadOrders, unreadPayouts, disputes, refunds };
  }

  async getSummary() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      revenueAgg,
      totalOrders,
      totalUsers,
      totalRestaurants,
      totalDrivers,
      activeDrivers,
      todayAgg,
      cancelledOrders,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      this.prisma.order.count(),
      this.prisma.user.count({ where: { role: "USER" } }),
      this.prisma.restaurant.count(),
      this.prisma.driver.count(),
      this.prisma.driver.count({ where: { isAvailable: true } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: startOfToday }, status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.count({ where: { status: "CANCELLED" } }),
    ]);

    return {
      totalRevenue: revenueAgg._sum.total || 0,
      totalOrders,
      totalUsers,
      totalRestaurants,
      totalDrivers,
      activeDrivers,
      ordersToday: todayAgg._count,
      revenueToday: todayAgg._sum.total || 0,
      cancelledOrders,
      cancellationRate: totalOrders > 0 ? +((cancelledOrders / totalOrders) * 100).toFixed(1) : 0,
    };
  }

  async getRevenueTimeseries(days = 14) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    cutoff.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: cutoff }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
    });

    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(cutoff);
      d.setDate(d.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }

    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.revenue += o.total;
        bucket.orders += 1;
      }
    }

    return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
  }

  async getTopRestaurants(limit = 5) {
    const grouped = await this.prisma.order.groupBy({
      by: ["restaurantId"],
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: limit,
    });

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: grouped.map((g) => g.restaurantId) } },
      select: { id: true, name: true, imageUrl: true, cuisineType: true },
    });
    const byId = new Map(restaurants.map((r) => [r.id, r]));

    return grouped.map((g) => ({
      restaurant: byId.get(g.restaurantId) || null,
      revenue: g._sum.total || 0,
      orderCount: g._count,
    }));
  }

  async getTopDishes(limit = 5) {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { status: { not: "CANCELLED" } } },
      select: { dishId: true, quantity: true, price: true },
    });

    const totals = new Map<string, { qtySold: number; revenue: number }>();
    for (const item of items) {
      const t = totals.get(item.dishId) || { qtySold: 0, revenue: 0 };
      t.qtySold += item.quantity;
      t.revenue += item.price * item.quantity;
      totals.set(item.dishId, t);
    }

    const ranked = Array.from(totals.entries())
      .sort((a, b) => b[1].qtySold - a[1].qtySold)
      .slice(0, limit);

    const dishes = await this.prisma.dish.findMany({
      where: { id: { in: ranked.map(([id]) => id) } },
      select: { id: true, name: true, imageUrl: true, restaurant: { select: { name: true } } },
    });
    const byId = new Map(dishes.map((d) => [d.id, d]));

    return ranked.map(([dishId, t]) => ({
      dish: byId.get(dishId) || null,
      qtySold: t.qtySold,
      revenue: t.revenue,
    }));
  }
}
