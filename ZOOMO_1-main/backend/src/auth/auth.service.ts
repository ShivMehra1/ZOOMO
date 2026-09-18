import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  // Dev-mode OTP store: phone -> { code, expiresAt }. In-memory only —
  // fine for dev/demo (no SMS provider configured), doesn't survive a
  // server restart, and was deliberately kept out of Postgres per scope.
  private otpStore = new Map<string, { code: string; expiresAt: number }>();

  /* ================================
     MOBILE OTP — REQUEST
  ================================== */
  async requestOtp(phone: string) {
    if (!phone || phone.replace(/\D/g, "").length !== 10) {
      throw new BadRequestException("Enter a valid 10-digit mobile number");
    }
    const code = String(Math.floor(1000 + Math.random() * 9000)); // 4 digits
    this.otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    // 📲 Real SMS provider (e.g. Twilio) would send `code` to `phone` here
    // instead of returning it. No provider is configured yet, so dev mode
    // hands the code straight back for the frontend to display on-screen.
    return { devCode: code };
  }

  /* ================================
     MOBILE OTP — VERIFY (login or signup-via-phone)
  ================================== */
  async verifyOtp(phone: string, code: string, name?: string) {
    const entry = this.otpStore.get(phone);
    if (!entry || entry.expiresAt < Date.now()) {
      throw new UnauthorizedException("Code expired. Request a new one.");
    }
    if (entry.code !== code) {
      throw new UnauthorizedException("Incorrect code");
    }
    this.otpStore.delete(phone); // consume — single use

    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36) + Date.now(),
        10
      );
      user = await this.usersService.create({
        email: `${phone}@phone.zoomoeats.local`,
        password: randomPassword,
        name: name?.trim() || "Zoomo Guest",
        phone,
        role: "USER",
      });
    }

    if (user.isSuspended) {
      throw new ForbiddenException(
        user.suspendedReason
          ? `Account suspended: ${user.suspendedReason}`
          : "Account suspended. Contact support."
      );
    }

    return this.makeTokenResponse(user);
  }

  /* ================================
     GOOGLE SIGN-IN (dev-mode)
  ================================== */
  async googleAuth(email: string, name: string, idToken?: string) {
    if (process.env.GOOGLE_CLIENT_ID) {
      // 🔐 Real flow: verify `idToken` server-side, e.g. with
      // `google-auth-library`'s OAuth2Client(process.env.GOOGLE_CLIENT_ID)
      // .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID }),
      // then trust the verified payload's email/name instead of the body.
      throw new BadRequestException(
        "Real Google verification not implemented yet — unset GOOGLE_CLIENT_ID to use dev mode"
      );
    }

    if (!email || !name) {
      throw new BadRequestException("email and name are required");
    }

    let user = await this.usersService.findByEmail(email);
    if (!user) {
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36) + Date.now(),
        10
      );
      user = await this.usersService.create({
        email,
        password: randomPassword,
        name,
        phone: "",
        role: "USER",
      });
    }

    if (user.isSuspended) {
      throw new ForbiddenException(
        user.suspendedReason
          ? `Account suspended: ${user.suspendedReason}`
          : "Account suspended. Contact support."
      );
    }

    return this.makeTokenResponse(user);
  }

  /* ================================
     CUSTOMER SIGNUP (USER ROLE ONLY)
  ================================== */
  async signup(dto: any) {
    if (!dto.email || !dto.password || !dto.name) {
      throw new BadRequestException("Missing required fields");
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new UnauthorizedException("Email already in use");

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashed,
      name: dto.name,
      phone: dto.phone || "",
      role: "USER", // 🔐 Enforced
    });

    return this.makeTokenResponse(user);
  }

  /* ================================
          CUSTOMER LOGIN
  ================================== */
  async login(dto: any) {
    const email = String(dto.email || "").trim().toLowerCase();
    const aliases: Record<string, string> = {
      "customer@customer.com": "customer@zoomoeats.com",
      "customer@zoomo.com": "customer@zoomoeats.com",
      "customer@": "customer@zoomoeats.com",
    };
    const user =
      (await this.usersService.findByEmail(email)) ||
      (aliases[email] ? await this.usersService.findByEmail(aliases[email]) : null);
    if (!user) throw new UnauthorizedException("Invalid email or password");

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid email or password");

    // 🚫 Prevent merchant/admin access
    if (user.role !== "USER") {
      throw new UnauthorizedException("Access denied for this role");
    }

    if (user.isSuspended) {
      throw new ForbiddenException(
        user.suspendedReason
          ? `Account suspended: ${user.suspendedReason}`
          : "Account suspended. Contact support."
      );
    }

    return this.makeTokenResponse(user);
  }

  /* ================================
           TOKEN RESPONSE
  ================================== */
  private makeTokenResponse(user) {
    // 👇 must match jwt.strategy validate()
    const payload = { id: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token, // 👈 ALWAYS use this key
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
