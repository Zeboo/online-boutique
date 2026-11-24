import { Body, Controller, Headers, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CreateOrderDto } from "../orders/orders.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("stripe/checkout")
  @UseGuards(SessionGuard, RolesGuard)
  @Roles("CUSTOMER" as never)
  createCheckout(@Req() request: Request, @Body() input: CreateOrderDto) {
    if (!request.user) throw new UnauthorizedException();
    return this.payments.createCheckout(request.user as AuthenticatedUser, input);
  }

  @Post("stripe/webhook")
  webhook(@Headers("stripe-signature") signature: string | undefined, @Req() request: Request & { rawBody?: Buffer }) {
    return this.payments.handleWebhook(signature, request.rawBody ?? Buffer.from(""));
  }
}
