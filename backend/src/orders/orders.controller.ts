import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { PaymentMethod, UserRole } from "@prisma/client";
import type { Request } from "express";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import {
  AdminOrderQueryDto,
  CreateOrderDto,
  UpdatePaymentStatusDto,
  UpdateTrackingDto,
  UpdateOrderStatusDto,
} from "./orders.dto";
import { OrdersService } from "./orders.service";

function currentUser(request: Request): AuthenticatedUser {
  if (!request.user) throw new UnauthorizedException("Please sign in to continue");
  return request.user;
}

@Controller("orders")
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Req() request: Request, @Body() input: CreateOrderDto) {
    if (input.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      throw new BadRequestException("Use the card checkout endpoint for card payments");
    }
    return this.orders.create(currentUser(request), input);
  }

  @Get()
  list(@Req() request: Request) {
    return this.orders.listForCustomer(currentUser(request).id);
  }

  @Get(":orderNumber")
  get(@Req() request: Request, @Param("orderNumber") orderNumber: string) {
    return this.orders.findForCustomer(
      currentUser(request).id,
      orderNumber,
    );
  }
}

@Controller("admin/orders")
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() query: AdminOrderQueryDto) {
    return this.orders.listForAdmin(query);
  }

  @Get(":id")
  get(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.orders.findForAdmin(id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, input);
  }

  @Patch(":id/payment")
  updatePayment(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: UpdatePaymentStatusDto) {
    return this.orders.updatePaymentStatus(id, input.paymentStatus);
  }

  @Patch(":id/tracking")
  updateTracking(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: UpdateTrackingDto) {
    return this.orders.updateTracking(id, input.trackingCode, input.shippingCarrier);
  }

  @Post(":id/notification")
  async resendStatusNotification(@Param("id", new ParseUUIDPipe()) id: string) {
    return { sent: await this.orders.resendStatusNotification(id) };
  }
}
