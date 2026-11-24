import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./auth.dto";
import { SessionGuard } from "./session.guard";

const COOKIE_NAME = "umber_session";
const COOKIE_PATH = "/api/v1";
const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: COOKIE_PATH,
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() input: RegisterDto) {
    return this.authService.register(input);
  }

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.createSession(input.email, input.password);
    const maxAge = Math.max(0, session.expiresAt.getTime() - Date.now());
    response.cookie(COOKIE_NAME, session.token, {
      ...sessionCookieOptions,
      maxAge,
    });
    return { user: session.user, expiresAt: session.expiresAt };
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token: unknown = request.cookies?.[COOKIE_NAME];
    await this.authService.revokeSession(typeof token === "string" ? token : undefined);
    response.clearCookie(COOKIE_NAME, sessionCookieOptions);
    return { success: true };
  }

  @Get("me")
  @UseGuards(SessionGuard)
  getCurrentUser(@Req() request: Request) {
    return request.user;
  }
}
