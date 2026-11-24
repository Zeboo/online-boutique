import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import type { Request } from "express";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("admin")
@Controller("admin")
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTENT_MANAGER)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("dashboard")
  async getDashboard(@Req() request: Request) {
    const isContentManager = request.user?.role === UserRole.CONTENT_MANAGER;
    const [banners, pages] = await Promise.all([
      this.prisma.banner.count(),
      this.prisma.contentPage.count(),
    ]);

    if (isContentManager) return { banners, pages };

    const [products, activeProducts, categories, customers, orders, pendingOrders] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER, status: "ACTIVE" } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: "PENDING" } }),
    ]);

    return { products, activeProducts, categories, customers, banners, pages, orders, pendingOrders };
  }
}
