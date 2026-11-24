import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, PaymentStatus, Prisma, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import { OrderEmailService } from "./order-email.service";
import type {
  AdminOrderQueryDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
} from "./orders.dto";

const orderInclude = {
  items: true,
} satisfies Prisma.OrderInclude;

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function orderNumber() {
  return `UC-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEmail: OrderEmailService,
  ) {}

  async create(user: AuthenticatedUser, input: CreateOrderDto) {
    if (user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException("Orders can only be placed by customer accounts");
    }

    return this.prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({
        where: {
          id: { in: [...new Set(input.items.map((item) => item.productId))] },
          isActive: true,
        },
      });
      const productsById = new Map(products.map((product) => [product.id, product]));
      const requestedStock = new Map<string, number>();
      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      let subtotal = new Prisma.Decimal(0);

      for (const item of input.items) {
        const product = productsById.get(item.productId);
        if (!product || !product.sizes.includes(item.size)) {
          throw new BadRequestException("A selected product or size is no longer available");
        }

        requestedStock.set(
          product.id,
          (requestedStock.get(product.id) ?? 0) + item.quantity,
        );
        const lineTotal = product.price.mul(item.quantity);
        subtotal = subtotal.add(lineTotal);
        orderItems.push({
          product: { connect: { id: product.id } },
          productName: product.name,
          imageUrl: product.imageUrl,
          sku: product.sku,
          size: item.size,
          quantity: item.quantity,
          unitPrice: product.price,
          lineTotal,
        });
      }

      for (const [productId, quantity] of [...requestedStock.entries()].sort(([left], [right]) => left.localeCompare(right))) {
        const reservation = await transaction.product.updateMany({
          where: { id: productId, isActive: true, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (reservation.count !== 1) {
          throw new ConflictException("A selected item is out of stock. Please update your bag.");
        }
      }

      const shipping = subtotal.gte(150) ? new Prisma.Decimal(0) : new Prisma.Decimal(12);
      return transaction.order.create({
        data: {
          orderNumber: orderNumber(),
          userId: user.id,
          email: input.email.trim().toLowerCase(),
          recipientName: input.recipientName.trim(),
          phone: input.phone.trim(),
          addressLine1: input.addressLine1.trim(),
          addressLine2: input.addressLine2?.trim() || null,
          city: input.city.trim(),
          region: input.region.trim(),
          postalCode: input.postalCode.trim(),
          country: input.country.toUpperCase(),
          subtotal,
          shipping,
          total: subtotal.add(shipping),
          paymentMethod: input.paymentMethod,
          items: { create: orderItems },
        },
        include: orderInclude,
      });
    });
  }

  listForCustomer(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async findForCustomer(userId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { userId, orderNumber },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  listForAdmin(query: AdminOrderQueryDto) {
    return this.prisma.order.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: { ...orderInclude, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });
  }

  async findForAdmin(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { ...orderInclude, user: { select: { name: true, email: true } } } });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async updateStatus(id: string, input: UpdateOrderStatusDto) {
    const { order, previousStatus } = await this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id },
        include: orderInclude,
      });
      if (!order) throw new NotFoundException("Order not found");
      if (input.status === OrderStatus.CANCELLED && order.paymentStatus === PaymentStatus.PAID) {
        throw new ConflictException(
          "This order has been paid. Issue the refund in your payment provider before cancelling it.",
        );
      }
      if (!allowedTransitions[order.status].includes(input.status)) {
        throw new ConflictException(
          `Order cannot transition from ${order.status} to ${input.status}`,
        );
      }
      if (input.status === OrderStatus.SHIPPED && (!order.trackingCode?.trim() || !order.shippingCarrier)) {
        throw new ConflictException("Save the courier and tracking number before marking this order as shipped");
      }

      const transition = await transaction.order.updateMany({
        where: { id, status: order.status },
        data: { status: input.status },
      });
      if (transition.count !== 1) {
        throw new ConflictException("This order was updated by another administrator");
      }

      if (input.status === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await transaction.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const updatedOrder = await transaction.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
      return { order: updatedOrder, previousStatus: order.status };
    });
    const notificationSent = await this.orderEmail.sendStatusUpdate(order, previousStatus);
    return { ...order, statusNotificationSent: notificationSent };
  }

  sendStatusNotification(order: Parameters<OrderEmailService["sendStatusUpdate"]>[0], previousStatus: string) {
    return this.orderEmail.sendStatusUpdate(order, previousStatus);
  }

  async resendStatusNotification(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) throw new NotFoundException("Order not found");
    return this.orderEmail.sendStatusUpdate(order);
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.paymentMethod !== "CASH_ON_DELIVERY" && paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException("Card payments are confirmed by the payment provider webhook");
    }
    return this.prisma.order.update({ where: { id }, data: { paymentStatus }, include: orderInclude });
  }

  async updateTracking(id: string, trackingCode?: string, shippingCarrier?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    const normalizedCode = trackingCode?.trim() || null;
    return this.prisma.order.update({ where: { id }, data: { trackingCode: normalizedCode, shippingCarrier: normalizedCode ? shippingCarrier ?? order.shippingCarrier ?? "OTHER" : null }, include: orderInclude });
  }
}
