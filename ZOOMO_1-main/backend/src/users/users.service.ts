import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(data) {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // `phone` has no unique constraint on User, so this is a findFirst, not findUnique.
  findByPhone(phone: string) {
    return this.prisma.user.findFirst({ where: { phone } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  updateMe(id: string, data: { name?: string; email?: string; phone?: string; avatarUrl?: string }) {
    const { name, email, phone, avatarUrl } = data;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
    });
  }
}
