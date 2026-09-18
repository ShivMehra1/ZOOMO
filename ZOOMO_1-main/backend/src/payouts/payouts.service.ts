import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { OrderStatus } from "@prisma/client";
import { RealtimeGateway } from "../realtime/realtime.gateway";

const PAYOUT_METHODS = ["CASH", "UPI", "BANK_TRANSFER"];

@Injectable()
export class PayoutsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  private async ownedRestaurantId(ownerId: string) {
    const r = await this.prisma.restaurant.findFirst({ where: { ownerId }, select: { id: true } });
    if (!r) throw new NotFoundException("Restaurant not found for this merchant");
    return r.id;
  }

  private async ownedDriverId(userId: string) {
    const d = await this.prisma.driver.findUnique({ where: { userId }, select: { id: true } });
    if (!d) throw new NotFoundException("Driver profile not found");
    return d.id;
  }

  private async restaurantBalance(restaurantId: string) {
    const earnedAgg = await this.prisma.order.aggregate({
      where: { restaurantId, status: OrderStatus.DELIVERED },
      _sum: { restaurantEarning: true },
    });
    const paidAgg = await this.prisma.payout.aggregate({
      where: { restaurantId, recipientType: "RESTAURANT", status: { in: ["PENDING", "APPROVED", "COMPLETED"] } },
      _sum: { amount: true },
    });
    const earned = earnedAgg._sum.restaurantEarning || 0;
    const paidOrPending = paidAgg._sum.amount || 0;
    return { earned, paidOrPending, available: parseFloat((earned - paidOrPending).toFixed(2)) };
  }

  private async driverBalance(driverId: string) {
    const orders = await this.prisma.order.findMany({
      where: { driverId, status: OrderStatus.DELIVERED },
      select: { deliveryFee: true, driverCommission: true, tip: true },
    });
    const earned = orders.reduce((sum, o) => sum + (o.deliveryFee || 0) + (o.driverCommission || 0) + (o.tip || 0), 0);
    const paidAgg = await this.prisma.payout.aggregate({
      where: { driverId, recipientType: "DRIVER", status: { in: ["PENDING", "APPROVED", "COMPLETED"] } },
      _sum: { amount: true },
    });
    const paidOrPending = paidAgg._sum.amount || 0;
    return {
      earned: parseFloat(earned.toFixed(2)),
      paidOrPending,
      available: parseFloat((earned - paidOrPending).toFixed(2)),
    };
  }

  async getMerchantBalance(ownerId: string) {
    const restaurantId = await this.ownedRestaurantId(ownerId);
    return this.restaurantBalance(restaurantId);
  }

  async getDriverBalance(userId: string) {
    const driverId = await this.ownedDriverId(userId);
    return this.driverBalance(driverId);
  }

  async listForMerchant(ownerId: string) {
    const restaurantId = await this.ownedRestaurantId(ownerId);
    return this.prisma.payout.findMany({ where: { restaurantId }, orderBy: { createdAt: "desc" } });
  }

  async listForDriver(userId: string) {
    const driverId = await this.ownedDriverId(userId);
    return this.prisma.payout.findMany({ where: { driverId }, orderBy: { createdAt: "desc" } });
  }

  async requestMerchantPayout(ownerId: string, body: { amount: number; method: string; payoutDetail?: string; note?: string }) {
    const restaurantId = await this.ownedRestaurantId(ownerId);
    const { available } = await this.restaurantBalance(restaurantId);
    return this.createPayout({ ...body, recipientType: "RESTAURANT", restaurantId, available });
  }

  async requestDriverPayout(userId: string, body: { amount: number; method: string; payoutDetail?: string; note?: string }) {
    const driverId = await this.ownedDriverId(userId);
    const { available } = await this.driverBalance(driverId);
    return this.createPayout({ ...body, recipientType: "DRIVER", driverId, available });
  }

  private async createPayout(args: {
    amount: number;
    method: string;
    payoutDetail?: string;
    note?: string;
    recipientType: "RESTAURANT" | "DRIVER";
    restaurantId?: string;
    driverId?: string;
    available: number;
  }) {
    const { amount, method, payoutDetail, note, recipientType, restaurantId, driverId, available } = args;
    if (!amount || amount <= 0) throw new BadRequestException("Enter a valid amount");
    if (!PAYOUT_METHODS.includes(method)) throw new BadRequestException("Invalid payout method");
    if (amount > available) throw new BadRequestException(`Amount exceeds available balance (₹${available.toFixed(2)})`);

    const payout = await this.prisma.payout.create({
      data: { amount, method, payoutDetail, note, recipientType, restaurantId, driverId },
    });

    this.realtime.emitToRoom("admin", "payout:requested", payout);
    if (restaurantId) this.realtime.emitToRoom(`restaurant:${restaurantId}`, "payout:updated", payout);
    if (driverId) this.realtime.emitToRoom(`driver:${driverId}`, "payout:updated", payout);

    return payout;
  }

  /* ── Admin ── */
  async getMerchantMethod(ownerId: string) {
    const restaurantId = await this.ownedRestaurantId(ownerId);
    return this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { payoutMethod: true, upiId: true, bankName: true, accountLast4: true },
    });
  }

  async setMerchantMethod(ownerId: string, data: { payoutMethod?: string; upiId?: string; bankName?: string; accountLast4?: string }) {
    const restaurantId = await this.ownedRestaurantId(ownerId);
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        payoutMethod: data.payoutMethod,
        upiId: data.upiId,
        bankName: data.bankName,
        accountLast4: data.accountLast4,
      },
      select: { payoutMethod: true, upiId: true, bankName: true, accountLast4: true },
    });
  }

  async getDriverMethod(userId: string) {
    const driverId = await this.ownedDriverId(userId);
    return this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { payoutMethod: true, upiId: true, bankName: true, accountLast4: true },
    });
  }

  async setDriverMethod(userId: string, data: { payoutMethod?: string; upiId?: string; bankName?: string; accountLast4?: string }) {
    const driverId = await this.ownedDriverId(userId);
    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        payoutMethod: data.payoutMethod,
        upiId: data.upiId,
        bankName: data.bankName,
        accountLast4: data.accountLast4,
      },
      select: { payoutMethod: true, upiId: true, bankName: true, accountLast4: true },
    });
  }

  async listAll() {
    return this.prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: { select: { name: true, payoutMethod: true, upiId: true, bankName: true, accountLast4: true } },
        driver: { select: { payoutMethod: true, upiId: true, bankName: true, accountLast4: true, user: { select: { name: true } } } },
      },
    });
  }

  async setStatus(id: string, status: "APPROVED" | "COMPLETED" | "REJECTED") {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout) throw new NotFoundException("Payout not found");
    if (status === "APPROVED" && payout.status !== "PENDING") {
      throw new BadRequestException("Only pending payouts can be approved");
    }
    if (status === "COMPLETED" && payout.status !== "APPROVED" && payout.status !== "PENDING") {
      throw new BadRequestException("Payout is not awaiting payment");
    }
    if (status === "REJECTED" && payout.status !== "PENDING" && payout.status !== "APPROVED") {
      throw new BadRequestException("Payout already resolved");
    }

    const updated = await this.prisma.payout.update({ where: { id }, data: { status } });

    if (updated.restaurantId) this.realtime.emitToRoom(`restaurant:${updated.restaurantId}`, "payout:updated", updated);
    if (updated.driverId) this.realtime.emitToRoom(`driver:${updated.driverId}`, "payout:updated", updated);
    this.realtime.emitToRoom("admin", "payout:updated", updated);

    return updated;
  }

  async attachProof(id: string, paymentProofUrl: string) {
    if (!paymentProofUrl) throw new BadRequestException("Proof image is required");
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout) throw new NotFoundException("Payout not found");
    const updated = await this.prisma.payout.update({
      where: { id },
      data: {
        paymentProofUrl,
        status: payout.status === "PENDING" ? "APPROVED" : payout.status,
      },
      include: {
        restaurant: { select: { name: true, payoutMethod: true, upiId: true, bankName: true, accountLast4: true } },
        driver: { select: { payoutMethod: true, upiId: true, bankName: true, accountLast4: true, user: { select: { name: true } } } },
      },
    });
    if (updated.restaurantId) this.realtime.emitToRoom(`restaurant:${updated.restaurantId}`, "payout:updated", updated);
    if (updated.driverId) this.realtime.emitToRoom(`driver:${updated.driverId}`, "payout:updated", updated);
    this.realtime.emitToRoom("admin", "payout:updated", updated);
    return updated;
  }

  /* ── Admin business summary: total business + per-driver earnings history ── */
  async businessSummary() {
    const deliveredAgg = await this.prisma.order.aggregate({
      where: { status: OrderStatus.DELIVERED },
      _sum: { total: true, subtotal: true, restaurantEarning: true, platformFee: true, deliveryFee: true, driverCommission: true },
      _count: true,
    });

    const drivers = await this.prisma.driver.findMany({
      select: {
        id: true,
        user: { select: { name: true, email: true } },
        orders: {
          where: { status: OrderStatus.DELIVERED },
          select: { deliveryFee: true, driverCommission: true, tip: true, total: true },
        },
      },
    });

    const driverBreakdown = drivers
      .map((d) => {
        const deliveries = d.orders.length;
        const earnings = d.orders.reduce((s, o) => s + (o.deliveryFee || 0) + (o.driverCommission || 0) + (o.tip || 0), 0);
        return {
          driverId: d.id,
          name: d.user.name,
          email: d.user.email,
          deliveries,
          earnings: parseFloat(earnings.toFixed(2)),
        };
      })
      .filter((d) => d.deliveries > 0)
      .sort((a, b) => b.earnings - a.earnings);

    return {
      totalOrders: deliveredAgg._count,
      totalBusiness: deliveredAgg._sum.total || 0,
      totalItemRevenue: deliveredAgg._sum.subtotal || 0,
      totalRestaurantPayout: deliveredAgg._sum.restaurantEarning || 0,
      totalPlatformEarnings: deliveredAgg._sum.platformFee || 0,
      totalDeliveryFees: deliveredAgg._sum.deliveryFee || 0,
      totalDriverCommission: deliveredAgg._sum.driverCommission || 0,
      driverBreakdown,
    };
  }
}
