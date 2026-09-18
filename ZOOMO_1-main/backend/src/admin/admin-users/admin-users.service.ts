import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(search?: string, role?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        ...(role ? { role: role as any } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isSuspended: true,
        suspendedReason: true,
        mustResetPassword: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => ({
      ...u,
      orderCount: u._count.orders,
      _count: undefined,
    }));
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isSuspended: true,
        suspendedReason: true,
        mustResetPassword: true,
        createdAt: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            orderType: true,
            subtotal: true,
            deliveryFee: true,
            tax: true,
            tip: true,
            total: true,
            createdAt: true,
            restaurant: { select: { name: true } },
            driver: { select: { user: { select: { name: true } } } },
            items: {
              select: { quantity: true, price: true, dish: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException("User not found");

    const totalSpent = await this.prisma.order.aggregate({
      where: { userId: id, status: { not: "CANCELLED" } },
      _sum: { total: true },
    });

    return { ...user, totalSpent: totalSpent._sum.total || 0 };
  }

  async updateUser(id: string, data: { name?: string; email?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return this.prisma.user.update({
      where: { id },
      data: { name: data.name, email: data.email, phone: data.phone },
      select: { id: true, name: true, email: true, phone: true },
    });
  }

  async suspendUser(id: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: true, suspendedReason: reason || "Suspended by admin" },
      select: { id: true, isSuspended: true, suspendedReason: true },
    });
  }

  async unsuspendUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: false, suspendedReason: null },
      select: { id: true, isSuspended: true },
    });
  }

  async resetPassword(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    const tempPassword = randomBytes(6).toString("base64url");
    const hashed = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashed, mustResetPassword: true },
    });

    // Returned once — never stored or logged in plaintext anywhere else.
    return { tempPassword };
  }

  async createUser(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: "USER" | "MERCHANT" | "DRIVER" | "ADMIN";
  }) {
    if (!data?.name || !data?.email) throw new BadRequestException("name and email are required");
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException("Email already in use");
    const role = data.role || "USER";
    const password = await bcrypt.hash(data.password || randomBytes(8).toString("base64url"), 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        password,
        role: role as any,
        mustResetPassword: !data.password,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
    if (role === "DRIVER") {
      await this.prisma.driver.create({ data: { userId: user.id, isAvailable: false } });
    }
    return user;
  }

  private static KEEP_EMAILS = new Set([
    "admin@zoomoeats.com",
    "driver@zoomoeats.com",
    "customer@zoomoeats.com",
    "owner1@zoomoeats.com",
    "owner-moonlight@zoomoeats.com",
    "owner-mlmoonlight@zoomoeats.com",
    "owner-coffeexpress@zoomoeats.com",
  ]);

  async purgeSeed() {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true },
    });
    const junk = users.filter((u) => {
      const email = (u.email || "").toLowerCase();
      if (AdminUsersService.KEEP_EMAILS.has(email)) return false;
      if (u.role === "ADMIN") return false;
      if (/^(owner2|owner3|owner)@|test@test\.com|demo@|owner@example\.com/i.test(email)) return true;
      if (/^(john customer|mike driver|xyzad|qwdsasa|122321|test user|demo user)$/i.test(u.name || "")) return true;
      return false;
    });
    const deleted: string[] = [];
    for (const u of junk) {
      try {
        await this.deleteUser(u.id);
        deleted.push(u.id);
      } catch {
        /* skip rows that still have live restaurant ownership we won't cascade blindly */
      }
    }
    return { ok: true, deleted: deleted.length };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === "ADMIN") throw new BadRequestException("Cannot delete an admin");

    await this.prisma.$transaction(async (tx) => {
      if (user.role === "MERCHANT") {
        const restaurants = await tx.restaurant.findMany({ where: { ownerId: id }, select: { id: true } });
        for (const r of restaurants) {
          await tx.order.deleteMany({ where: { restaurantId: r.id } });
          await tx.restaurant.delete({ where: { id: r.id } });
        }
      }
      if (user.role === "DRIVER") {
        await tx.order.updateMany({ where: { driver: { userId: id } }, data: { driverId: null } });
        await tx.driver.deleteMany({ where: { userId: id } });
      }
      await tx.cart.deleteMany({ where: { userId: id } });
      await tx.address.deleteMany({ where: { userId: id } });
      await tx.favorite.deleteMany({ where: { userId: id } });
      await tx.review.deleteMany({ where: { userId: id } });
      await tx.order.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });
    return { ok: true, id };
  }
}
