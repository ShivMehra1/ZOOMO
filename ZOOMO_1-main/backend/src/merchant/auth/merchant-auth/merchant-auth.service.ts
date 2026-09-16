import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class MerchantAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signup(body: any) {
    const { name, email, phone, password } = body;

    if (!name || !email || !phone || !password) {
      throw new BadRequestException('All fields are required');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashed,
        role: UserRole.MERCHANT,
      },
    });

    return this.signToken(user.id, user.role);
  }

  async login(body: any) {
    const { email, password } = body;

    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== UserRole.MERCHANT) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isSuspended) {
      throw new ForbiddenException(
        user.suspendedReason
          ? `Account suspended: ${user.suspendedReason}`
          : 'Account suspended. Contact support.',
      );
    }

    return this.signToken(user.id, user.role);
  }

  private signToken(userId: string, role: UserRole) {
    return {
      access_token: this.jwt.sign({
        sub: userId,
        role,
      }),
    };
  }
}
