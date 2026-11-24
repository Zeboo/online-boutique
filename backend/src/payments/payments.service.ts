import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import Stripe from "stripe";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { OrdersService } from "../orders/orders.service";
import type { CreateOrderDto } from "../orders/orders.dto";

function storefrontOrigin() {
  const configured = process.env.STOREFRONT_ORIGIN
    ?.split(",")
    .map((origin) => origin.trim())
    .find(Boolean);
  const parsed = new URL(configured || "http://localhost:3000");
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ServiceUnavailableException("STOREFRONT_ORIGIN must be an HTTP or HTTPS URL");
  }
  return parsed.origin;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe?: Stripe;

  constructor(private readonly prisma: PrismaService, private readonly orders: OrdersService) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (key && (key.startsWith("sk_") || key.startsWith("rk_"))) {
      this.stripe = new Stripe(key, { apiVersion: "2026-10-28.endive" });
    }
  }

  async createCheckout(user: AuthenticatedUser, input: CreateOrderDto) {
    if (!this.stripe) throw new ServiceUnavailableException("Card payments are not configured");
    if (input.paymentMethod !== PaymentMethod.CARD) {
      throw new BadRequestException("Select card payment to continue");
    }
    const order = await this.orders.create(user, input);
    let session: Stripe.Checkout.Session | undefined;
    try {
      const origin = storefrontOrigin();
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => ({
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: { name: item.productName },
          unit_amount: item.unitPrice.mul(100).toNumber(),
        },
        quantity: item.quantity,
      }));
      if (order.shipping.greaterThan(0)) {
        lineItems.push({
          price_data: {
            currency: order.currency.toLowerCase(),
            product_data: { name: "Shipping" },
            unit_amount: order.shipping.mul(100).toNumber(),
          },
          quantity: 1,
        });
      }

      session = await this.stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "hosted_page",
        billing_address_collection: "auto",
        phone_number_collection: { enabled: false },
        automatic_tax: { enabled: false },
        allow_promotion_codes: false,
        submit_type: "auto",
        integration_identifier: "hosted_web_0001",
        origin_context: "web",
        customer_email: order.email,
        payment_intent_data: { receipt_email: order.email },
        line_items: lineItems,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
        success_url: `${origin}/?payment=success&order=${encodeURIComponent(order.orderNumber)}`,
        cancel_url: `${origin}/?payment=cancelled`,
      });
      if (!session.url) {
        throw new ServiceUnavailableException("Stripe did not provide a checkout URL");
      }
      await this.prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });
      return { url: session.url, orderNumber: order.orderNumber };
    } catch (error) {
      if (session?.status === "open") {
        try {
          await this.stripe.checkout.sessions.expire(session.id);
        } catch (expireError) {
          this.logger.error(
            "Could not expire the unused Stripe checkout session",
            expireError instanceof Error ? expireError.stack : String(expireError),
          );
        }
      }
      await this.orders.updateStatus(order.id, { status: OrderStatus.CANCELLED });
      this.logger.error("Stripe checkout session creation failed", error instanceof Error ? error.stack : String(error));
      if (error instanceof ServiceUnavailableException) throw error;
      if (error instanceof Stripe.errors.StripeConnectionError) {
        throw new ServiceUnavailableException(
          "The API server could not connect to Stripe after retrying. Check its outbound HTTPS, firewall, or proxy access to api.stripe.com. No payment was submitted.",
        );
      }
      if (error instanceof Stripe.errors.StripeAuthenticationError) {
        throw new ServiceUnavailableException(
          "Stripe rejected the API server key. Configure a valid Stripe secret key in backend/.env and restart the API.",
        );
      }
      if (error instanceof Stripe.errors.StripePermissionError) {
        throw new ServiceUnavailableException(
          "The configured Stripe key does not have permission to create Checkout sessions.",
        );
      }
      if (error instanceof Stripe.errors.StripeRateLimitError) {
        throw new ServiceUnavailableException(
          "Stripe is temporarily rate-limiting checkout. Please try again shortly.",
        );
      }
      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        const stripeError = error as Stripe.errors.StripeInvalidRequestError & {
          code?: string;
          param?: string;
          requestId?: string;
        };
        this.logger.error(
          `Stripe rejected Checkout configuration (${stripeError.code ?? "unknown"}; parameter: ${stripeError.param ?? "unknown"}; request: ${stripeError.requestId ?? "unknown"}): ${stripeError.message}`,
        );
        throw new BadRequestException(
          {
            message: "Stripe rejected the checkout configuration.",
            code: stripeError.code,
            parameter: stripeError.param,
            requestId: stripeError.requestId,
            details: stripeError.message,
          },
        );
      }
      throw new ServiceUnavailableException("Stripe could not start card checkout. No payment was taken.");
    }
  }

  async handleWebhook(signature: string | undefined, rawBody: Buffer) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) throw new ServiceUnavailableException("Stripe webhooks are not configured");
    if (!signature) throw new BadRequestException("Missing Stripe signature");
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET.trim());
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId || session.payment_status !== "paid" || session.amount_total === null) {
        this.logger.warn("Ignoring an incomplete Stripe checkout completion event");
        return { received: true };
      }

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          paymentMethod: true,
          paymentStatus: true,
          status: true,
          stripeSessionId: true,
          total: true,
          currency: true,
        },
      });
      if (!order) {
        this.logger.error(`Stripe payment verification failed for order ${orderId}`);
        return { received: true };
      }
      const expectedAmount = order.total.mul(100).toNumber();
      if (
        order.orderNumber !== session.metadata?.orderNumber ||
        order.paymentMethod !== PaymentMethod.CARD ||
        order.stripeSessionId !== session.id ||
        expectedAmount !== session.amount_total ||
        order.currency.toLowerCase() !== session.currency?.toLowerCase()
      ) {
        this.logger.error(`Stripe payment verification failed for order ${orderId}`);
        return { received: true };
      }

      const confirmed = await this.prisma.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          paymentMethod: PaymentMethod.CARD,
          stripeSessionId: session.id,
        },
        data: { paymentStatus: PaymentStatus.PAID, status: OrderStatus.CONFIRMED },
      });
      if (confirmed.count === 1) {
        const confirmedOrder = await this.prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
        if (confirmedOrder) await this.orders.sendStatusNotification(confirmedOrder, OrderStatus.PENDING);
      }
    }
    return { received: true };
  }
}
