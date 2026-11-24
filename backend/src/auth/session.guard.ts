import { createHash } from "node:crypto";
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";

const SESSION_COOKIE = "umber_session";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token: unknown = request.cookies?.[SESSION_COOKIE];
    if (typeof token !== "string" || token.length > 128) {
      throw new UnauthorizedException("Please sign in to continue");
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") {
      if (session) await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException("Your session has expired. Please sign in again");
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    };
    return true;
  }
}
