import { Injectable, NotFoundException } from "@nestjs/common";
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
          take: 20,
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            restaurant: { select: { name: true } },
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
}
