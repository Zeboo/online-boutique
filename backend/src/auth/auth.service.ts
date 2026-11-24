import { createHash, randomBytes } from "node:crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword, verifyPassword } from "./password";

const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 12);
if (!Number.isFinite(SESSION_TTL_HOURS) || SESSION_TTL_HOURS < 1 || SESSION_TTL_HOURS > 720) {
  throw new Error("SESSION_TTL_HOURS must be between 1 and 720");
}

let dummyPasswordHash: Promise<string> | undefined;

function getDummyPasswordHash() {
  dummyPasswordHash ??= hashPassword(randomBytes(32).toString("base64url"));
  return dummyPasswordHash;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: { name: string; email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) throw new ConflictException("An account with this email already exists");

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash: await hashPassword(input.password),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("An account with this email already exists");
      }
      throw error;
    }
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async createSession(emailInput: string, password: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    const passwordMatches = await verifyPassword(
      password,
      user?.passwordHash ?? await getDummyPasswordHash(),
    );
    if (!user || user.status !== "ACTIVE" || !passwordMatches) {
      throw new UnauthorizedException("Email or password is incorrect");
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    return {
      token: rawToken,
      expiresAt,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async revokeSession(token: string | undefined) {
    if (!token || token.length > 128) return;
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await this.prisma.session.deleteMany({ where: { tokenHash } });
  }
}
