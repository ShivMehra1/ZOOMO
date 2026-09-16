// src/auth/auth.controller.ts
import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  /** CUSTOMER SIGNUP ONLY */
  @Post("signup")
  async signup(@Body() body: any) {
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      throw new BadRequestException("Name, email & password are required.");
    }

    // Always force role = USER for this customer backend
    const role = "USER";

    const user = await this.authService.signup({
      name,
      email,
      phone,
      password,
      role,
    });

    return {
      message: "Customer account created successfully",
      access_token: user.access_token,
      user: user.user,
    };
  }

  /** CUSTOMER LOGIN ONLY */
  @Post("login")
  async login(@Body() body: any) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException("Email & password required");
    }

    const result = await this.authService.login({ email, password });

    return {
      message: "Login successful",
      access_token: result.access_token,
      user: result.user,
    };
  }

  /** MOBILE OTP — request a code (dev-mode: returned directly, not texted) */
  @Post("otp/request")
  async requestOtp(@Body() body: any) {
    return this.authService.requestOtp(body.phone);
  }

  /** MOBILE OTP — verify code, logs in or signs up (find-or-create by phone) */
  @Post("otp/verify")
  async verifyOtp(@Body() body: any) {
    const { phone, code, name } = body;
    if (!phone || !code) {
      throw new BadRequestException("phone and code are required");
    }
    const result = await this.authService.verifyOtp(phone, code, name);
    return {
      message: "Login successful",
      access_token: result.access_token,
      user: result.user,
    };
  }

  /** GOOGLE SIGN-IN — dev-mode (trusts client-supplied email/name; see service for the real-verification hook) */
  @Post("google")
  async google(@Body() body: any) {
    const { email, name, idToken } = body;
    const result = await this.authService.googleAuth(email, name, idToken);
    return {
      message: "Login successful",
      access_token: result.access_token,
      user: result.user,
    };
  }
}
