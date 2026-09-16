import { Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../common/prisma.service";
import { UserRole } from "@prisma/client";

@Injectable()
export class DriverAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(email: string, password: string) {
    
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        driver: true,
      },
    });

    
    if (!user || user.role !== UserRole.DRIVER) {
      throw new UnauthorizedException(
        "Invalid driver credentials"
      );
    }

   
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      throw new UnauthorizedException(
        "Invalid driver credentials"
      );
    }

    if (user.isSuspended) {
      throw new ForbiddenException(
        user.suspendedReason
          ? `Account suspended: ${user.suspendedReason}`
          : "Account suspended. Contact support."
      );
    }


    if (!user.driver) {
      throw new UnauthorizedException(
        "Driver profile not found"
      );
    }

    
    const payload = {
      id: user.id,
      role: user.role,
      driverId: user.driver.id,
    };

   
    const accessToken = this.jwtService.sign(payload);

    
    return {
      accessToken,
      driver: {
        id: user.driver.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
