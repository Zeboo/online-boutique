import { Injectable, Logger } from "@nestjs/common";

type MailOrder = {
  orderNumber: string;
  email: string;
  recipientName: string;
  status: string;
  trackingCode: string | null;
  shippingCarrier: string | null;
};

type MailTransport = {
  sendMail(message: { from: string; to: string; subject: string; text: string; html: string }): Promise<unknown>;
};

const nodemailer = require("nodemailer") as {
  createTransport(options: Record<string, unknown>): MailTransport;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]!);

const statusNames: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", PROCESSING: "Processing",
  SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

@Injectable()
export class OrderEmailService {
  private readonly logger = new Logger(OrderEmailService.name);
  private transport?: MailTransport;

  async sendStatusUpdate(order: MailOrder, previousStatus?: string): Promise<boolean> {
    const host = process.env.SMTP_HOST?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    if (!host || !from) {
      this.logger.warn(`Order ${order.orderNumber} status email was not sent: configure SMTP_HOST and EMAIL_FROM.`);
      return false;
    }

    if (!this.transport) {
      const port = Number(process.env.SMTP_PORT ?? 587);
      const username = process.env.SMTP_USER?.trim();
      const password = process.env.SMTP_PASSWORD;
      this.transport = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        ...(username ? { auth: { user: username, pass: password ?? "" } } : {}),
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
    }

    const status = statusNames[order.status] ?? order.status;
    const previous = previousStatus ? statusNames[previousStatus] ?? previousStatus : undefined;
    const storeUrl = (process.env.STOREFRONT_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const accountUrl = `${storeUrl}/account`;
    const isShipped = order.status === "SHIPPED";
    const trackingUrl = isShipped && order.trackingCode
      ? `https://www.17track.net/en/track?nums=${encodeURIComponent(order.trackingCode)}`
      : undefined;
    const greeting = `Hello ${order.recipientName},`;
    const shipmentText = trackingUrl
      ? `\nCourier: ${order.shippingCarrier ?? "Other"}\nTracking number: ${order.trackingCode}\nTrack your shipment: ${trackingUrl}\n`
      : "";
    const statusText = previous ? `has been updated from ${previous} to ${status}` : `is currently ${status}`;
    const text = `${greeting}\n\nYour Umber Collection order ${order.orderNumber} ${statusText}.${shipmentText}\nView your order: ${accountUrl}\n\nThank you,\nUmber Collection`;
    const shipmentHtml = trackingUrl
      ? `<div style="margin:24px 0;padding:20px;border:1px solid #e7ddd2;border-radius:12px;background:#faf7f2"><p style="margin:0 0 8px;color:#806548;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Shipment tracking</p><p style="margin:0 0 6px"><strong>Courier:</strong> ${escapeHtml(order.shippingCarrier ?? "Other")}</p><p style="margin:0 0 16px"><strong>Tracking number:</strong> ${escapeHtml(order.trackingCode ?? "")}</p><a href="${trackingUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#382f27;color:#fffaf4;text-decoration:none;font-weight:700">Track your shipment</a></div>`
      : "";
    const html = `<div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#fffdfa;color:#302820;font-family:Arial,sans-serif;line-height:1.6"><p style="color:#92704d;font-size:12px;letter-spacing:.15em;text-transform:uppercase">Umber Collection</p><h1 style="font-size:26px;font-weight:500">Your order is ${escapeHtml(status.toLowerCase())}</h1><p>${escapeHtml(greeting)}</p><p>Order <strong>${escapeHtml(order.orderNumber)}</strong> ${previous ? `has been updated from ${escapeHtml(previous)} to` : "is currently"} <strong>${escapeHtml(status)}</strong>.</p>${shipmentHtml}<p><a href="${accountUrl}" style="color:#785a3a">View your order history</a></p><p>Thank you,<br />Umber Collection</p></div>`;

    try {
      await this.transport.sendMail({
        from,
        to: order.email,
        subject: isShipped
          ? `Your order ${order.orderNumber} has shipped`
          : `Order ${order.orderNumber} status: ${status}`,
        text,
        html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Could not send status email for order ${order.orderNumber}.`, error instanceof Error ? error.stack : String(error));
      return false;
    }
  }
}
