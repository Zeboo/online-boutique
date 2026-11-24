"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiError } from "@/app/lib/api";
import { OrderProductImage } from "@/app/components/orders/OrderProductImage";

type OrderItem = {
  id: string;
  productName: string;
  imageUrl: string;
  sku: string | null;
  size: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
};
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  statusNotificationSent?: boolean;
  paymentMethod: string;
  paymentStatus: string;
  trackingCode: string | null;
  shippingCarrier: string | null;
  total: string | number;
  subtotal: string | number;
  shipping: string | number;
  currency: string;
  createdAt: string;
  email: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  items: OrderItem[];
};

const steps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
const transitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
const carriers = ["OTHER", "DHL", "FEDEX", "UPS", "USPS", "TCS", "LEOPARDS", "POSTEX"];
const carrierLabels: Record<string, string> = {
  OTHER: "Other / auto detect", DHL: "DHL", FEDEX: "FedEx", UPS: "UPS", USPS: "USPS",
  TCS: "TCS", LEOPARDS: "Leopards Courier", POSTEX: "PostEx",
};
const money = (value: string | number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(value));
const trackingUrl = (code: string) =>
  `https://www.17track.net/en/track?nums=${encodeURIComponent(code)}`;

export function AdminOrderDetail({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("OTHER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async (signal?: AbortSignal) => {
    if (signal?.aborted) return;
    setLoading(true);
    setError("");
    try {
      const value = await apiRequest<Order>(`/admin/orders/${encodeURIComponent(orderId)}`, { signal, cache: "no-store" });
      if (!signal?.aborted) {
        setOrder(value);
        setTracking(value.trackingCode ?? "");
        setCarrier(value.shippingCarrier ?? "OTHER");
      }
    } catch (requestError) {
      if (!signal?.aborted && !(requestError instanceof Error && requestError.name === "AbortError")) {
        setError(requestError instanceof Error ? requestError.message : "Could not load this order.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { void loadOrder(controller.signal); });
    return () => controller.abort();
  }, [loadOrder]);

  async function action(path: string, body: unknown, successMessage = "Order updated successfully.") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const saved = await apiRequest<Order>(path, { method: "PATCH", body: JSON.stringify(body) });
      setOrder((current) => current ? { ...current, ...saved } : saved);
      setTracking(saved.trackingCode ?? "");
      setCarrier(saved.shippingCarrier ?? "OTHER");
      setMessage(path.endsWith("/status") && saved.statusNotificationSent === false
        ? "Status updated, but the customer email could not be sent. Configure or check the API SMTP settings."
        : path.endsWith("/status")
          ? "Order status and customer email updated."
          : successMessage);
    } catch (requestError) {
      if (requestError instanceof ApiError && /property shippingCarrier should not exist/i.test(requestError.message)) {
        setError("The API is running an older build that cannot save courier details. Restart it with Ctrl+C, then run `npm run api:dev`, and save the shipping details again.");
      } else {
        setError(requestError instanceof ApiError ? requestError.message : "The order could not be updated.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveShippingDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    const trackingCode = tracking.trim();
    if (!trackingCode) {
      setError("Enter a courier tracking number before saving.");
      return;
    }
    await action(`/admin/orders/${order.id}/tracking`, { trackingCode, shippingCarrier: carrier }, "Courier and tracking details saved.");
  }

  async function resendStatusNotification() {
    if (!order) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiRequest<{ sent: boolean }>(`/admin/orders/${order.id}/notification`, { method: "POST" });
      if (!result.sent) throw new Error("The email could not be sent. Configure SMTP settings and check the API log, then retry.");
      setOrder((current) => current ? { ...current, statusNotificationSent: true } : current);
      setMessage("Customer status email sent.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The customer email could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  const backButton = <button type="button" className="admin-back-link" onClick={() => router.push("/admin?section=orders")}>← All orders</button>;
  if (loading && !order) return <main className="admin-detail-page"><div className="admin-detail-topbar">{backButton}</div><div className="admin-detail-loading" role="status">Loading order details…</div></main>;
  if (error && !order) return <main className="admin-detail-page"><div className="admin-detail-topbar">{backButton}</div><div className="admin-detail-error" role="alert"><strong>Could not load this order</strong><p>{error}</p><button type="button" className="admin-detail-retry" onClick={() => void loadOrder()}>Try again</button></div></main>;
  if (!order) return <main className="admin-detail-page"><div className="admin-detail-topbar">{backButton}</div><div className="admin-detail-loading">Loading order details…</div></main>;

  const currentIndex = steps.indexOf(order.status);
  const statusTone = order.status === "DELIVERED" ? "active" : order.status === "CANCELLED" ? "muted" : "pending";
  const currency = order.currency.trim();

  return (
    <main className="admin-detail-page">
      <div className="admin-detail-topbar">{backButton}<span className={`admin-pill-${statusTone}`}>{order.status.replaceAll("_", " ")}</span></div>
      <header className="admin-detail-hero">
        <div><span className="eyebrow">Order workspace</span><h1>{order.orderNumber}</h1><p>Placed {new Date(order.createdAt).toLocaleString()} · {order.email}</p></div>
        <div className="admin-detail-total"><small>Order total</small><strong>{money(order.total, currency)}</strong><span>{currency}</span></div>
      </header>
      <section className="admin-order-progress" aria-label="Order progress">
        <div className="admin-progress-line" />
        {steps.map((step, index) => <div className={`admin-progress-step ${index <= currentIndex ? "is-done" : ""}`} key={step}><i>{index < currentIndex ? "✓" : index + 1}</i><span>{step.replaceAll("_", " ")}</span></div>)}
        {order.status === "CANCELLED" && <p className="admin-cancelled-note">This order was cancelled.</p>}
      </section>
      <div className="admin-detail-columns">
        <div className="admin-detail-main">
          <section className="admin-detail-card">
            <div className="admin-detail-card-title"><div><span className="eyebrow">Fulfillment control</span><h2>Process this order</h2></div></div>
            <div className="admin-detail-controls">
              <label className="admin-status-control" htmlFor="admin-order-status">Order status <span>Current: {order.status.replaceAll("_", " ")}</span><select id="admin-order-status" aria-label={`Change order status from ${order.status.replaceAll("_", " ")}`} value="" disabled={busy || !(transitions[order.status]?.filter((status) => !(status === "CANCELLED" && order.paymentStatus === "PAID")).length)} onChange={(event) => { const nextStatus = event.target.value; if (nextStatus) void action(`/admin/orders/${order.id}/status`, { status: nextStatus }); }}><option value="" disabled>{busy ? "Saving status…" : "Select the next status"}</option>{(transitions[order.status] ?? []).filter((status) => !(status === "CANCELLED" && order.paymentStatus === "PAID")).map((status) => <option key={status} value={status} disabled={status === "SHIPPED" && (!order.trackingCode || !order.shippingCarrier)}>{status.replaceAll("_", " ")}</option>)}</select>{transitions[order.status]?.includes("SHIPPED") && (!order.trackingCode || !order.shippingCarrier) && <small className="admin-status-hint">Save the courier and tracking number before marking this order shipped.</small>}</label>
              <form className="admin-shipping-form" onSubmit={(event) => void saveShippingDetails(event)}>
                <label>Courier<select value={carrier} disabled={busy} onChange={(event) => setCarrier(event.target.value)}>{carriers.map((value) => <option value={value} key={value}>{carrierLabels[value]}</option>)}</select></label>
                <label>Tracking number<input value={tracking} disabled={busy} onChange={(event) => setTracking(event.target.value)} placeholder="Enter courier tracking number" autoComplete="off" /></label>
                <div className="admin-shipping-actions"><button type="submit" disabled={busy || !tracking.trim() || (tracking.trim() === (order.trackingCode ?? "") && carrier === (order.shippingCarrier ?? "OTHER"))}>{busy ? <><span className="admin-button-spinner" aria-hidden="true" />Saving…</> : "Save shipping details"}</button>{order.trackingCode && <button type="button" className="admin-clear-tracking-button" disabled={busy} onClick={() => { setTracking(""); void action(`/admin/orders/${order.id}/tracking`, { trackingCode: "" }, "Saved courier tracking details cleared."); }}>Clear saved tracking</button>}</div>
              </form>
            </div>
            {order.trackingCode && <p className="admin-order-track-summary">{carrierLabels[order.shippingCarrier ?? "OTHER"]}: <strong>{order.trackingCode}</strong> · <a href={trackingUrl(order.trackingCode)} target="_blank" rel="noreferrer">Track shipment ↗</a></p>}
            {order.statusNotificationSent === false && <div className="admin-notification-retry"><span>The status changed, but the customer email was not sent.</span><button type="button" disabled={busy} onClick={() => void resendStatusNotification()}>{busy ? "Sending…" : "Retry email"}</button></div>}
            {message && <p className="admin-detail-success" role="status">{message}</p>}{error && <p className="admin-form-error" role="alert">{error}</p>}
          </section>
          <section className="admin-detail-card">
            <div className="admin-detail-card-title"><div><span className="eyebrow">Items in this order</span><h2>{order.items.length} {order.items.length === 1 ? "piece" : "pieces"}</h2></div></div>
            {order.items.map((item) => <div className="admin-detail-item admin-detail-item-with-image" key={item.id}><OrderProductImage src={item.imageUrl} alt={item.productName} width={72} height={88} className="admin-detail-product-image" /><div><strong>{item.productName}</strong><span>SKU {item.sku ?? "—"} · Size {item.size} · Qty {item.quantity} · {money(item.unitPrice, currency)} each</span></div><strong>{money(item.lineTotal, currency)}</strong></div>)}
            <div className="admin-detail-totals"><span>Subtotal <b>{money(order.subtotal, currency)}</b></span><span>Shipping <b>{money(order.shipping, currency)}</b></span><strong>Total <b>{money(order.total, currency)}</b></strong></div>
          </section>
        </div>
        <aside className="admin-detail-side">
          <section className="admin-detail-card"><span className="eyebrow">Customer</span><h2>{order.recipientName}</h2><p>{order.email}<br />{order.phone}</p></section>
          <section className="admin-detail-card"><span className="eyebrow">Delivery address</span><p>{order.addressLine1}{order.addressLine2 && <><br />{order.addressLine2}</>}<br />{order.city}, {order.region} {order.postalCode}<br />{order.country}</p></section>
          <section className="admin-detail-card"><span className="eyebrow">Payment details</span><h2>{order.paymentStatus.replaceAll("_", " ")}</h2><p>Method: {order.paymentMethod.replaceAll("_", " ")}<br />Charged: {money(order.total, currency)}<br />Placed: {new Date(order.createdAt).toLocaleDateString()}</p>{order.paymentMethod === "CASH_ON_DELIVERY" && order.paymentStatus !== "PAID" && <button type="button" className="admin-detail-payment" disabled={busy} onClick={() => void action(`/admin/orders/${order.id}/payment`, { paymentStatus: "PAID" })}>Mark COD as paid</button>}</section>
        </aside>
      </div>
    </main>
  );
}
