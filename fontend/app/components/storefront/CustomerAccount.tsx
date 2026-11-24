"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { OrderProductImage } from "@/app/components/orders/OrderProductImage";
import { apiRequest, ApiError } from "@/app/lib/api";
import { BrandLogo } from "@/app/components/brand/BrandLogo";

type Customer = { id: string; name: string; email: string; role: string };
type CustomerOrder = {
  id?: string;
  orderNumber: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  trackingCode?: string | null;
  shippingCarrier?: string | null;
  subtotal?: string | number;
  shipping?: string | number;
  currency?: string;
  recipientName?: string;
  addressLine1?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  total: string | number;
  createdAt: string;
  items: { id: string; productName: string; imageUrl: string; sku?: string | null; quantity: number; size: string; unitPrice?: string | number; lineTotal?: string | number }[];
};

export function CustomerAccount() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest<Customer>("/auth/me")
      .then(async (currentCustomer) => {
        if (!active) return;
        if (currentCustomer.role !== "CUSTOMER") {
          await apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
          setError("This page is for customer accounts. Use the store administration sign-in for staff accounts.");
          return;
        }
        const returnTo = new URLSearchParams(window.location.search).get("returnTo");
        if (returnTo === "/?checkout=1") {
          router.replace(returnTo);
          return;
        }
        setCustomer(currentCustomer);
        const customerOrders = await apiRequest<CustomerOrder[]>("/orders");
        if (active) setOrders(customerOrders);
      })
      .catch((requestError: unknown) => {
        if (!active && !(requestError instanceof ApiError && requestError.status === 401)) return;
        if (!(requestError instanceof ApiError && requestError.status === 401)) {
          setError(requestError instanceof Error ? requestError.message : "Could not load your account.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const credentials = {
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    };

    try {
      if (registering) {
        await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            ...credentials,
            name: String(form.get("name") ?? "").trim(),
          }),
        });
      }
      const result = await apiRequest<{ user: Customer }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      if (result.user.role !== "CUSTOMER") {
        await apiRequest("/auth/logout", { method: "POST" });
        throw new Error("This sign-in is for customer accounts. Use the administration sign-in for staff.");
      }
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      if (returnTo === "/?checkout=1") {
        router.replace(returnTo);
        return;
      }
      setCustomer(result.user);
      setOrders(await apiRequest<CustomerOrder[]>("/orders"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not sign you in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setError("");
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      setCustomer(null);
      setOrders([]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not sign out.");
    }
  }

  async function viewOrder(orderNumber: string) {
    setError("");
    setOrderLoading(true);
    try {
      setSelectedOrder(await apiRequest<CustomerOrder>(`/orders/${encodeURIComponent(orderNumber)}`));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load order tracking.");
    } finally {
      setOrderLoading(false);
    }
  }

  return (
    <main className="flow-page account-page">
      <button type="button" className="account-page-logo" onClick={() => router.push("/")}>
        <BrandLogo className="brand-logo-image" />
      </button>
      {loading ? (
        <div className="empty-cart" role="status">Loading your account…</div>
      ) : customer ? (
        <>
          <div className="flow-heading">
            <span className="eyebrow">A little place of your own</span>
            <h1>Welcome, {customer.name}.</h1>
            <p>{customer.email}</p>
          </div>
          <div className="account-orders">
            <div className="account-orders-heading">
              <div><span className="eyebrow">Your purchases</span><h2>Order history</h2></div>
              <button type="button" className="back-step" onClick={() => void signOut()}>Sign out</button>
            </div>
            {orders.length ? orders.map((order) => (
              <article className="account-order-row" key={order.orderNumber}>
                <div>
                  <span className="account-order-thumbnails">{order.items.slice(0, 3).map((item) => <OrderProductImage src={item.imageUrl} alt={item.productName} width={38} height={46} className="account-order-thumbnail" key={item.id} />)}</span>
                  <strong>{order.orderNumber}</strong>
                  <span>{new Date(order.createdAt).toLocaleDateString()} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} pieces</span>
                  <span>{order.items.map((item) => `${item.quantity} × ${item.productName} (${item.size})`).join(" · ")}</span>
                </div>
                <span className="order-status">{order.status.replaceAll("_", " ")}</span>
                <strong>${Number(order.total).toFixed(2)}</strong>
                <button type="button" onClick={() => void viewOrder(order.orderNumber)}>{orderLoading ? "Loading…" : "Track order"}</button>
              </article>
            )) : (
              <div className="empty-cart"><h2>No orders yet.</h2><p>Your placed orders will appear here.</p><button type="button" className="button button-dark" onClick={() => router.push("/")}>Explore the collection</button></div>
            )}
          </div>
          {selectedOrder && <section className="account-order-tracking" aria-live="polite">
            <div className="account-orders-heading"><div><span className="eyebrow">Live order tracking</span><h2>{selectedOrder.orderNumber}</h2></div><button type="button" className="back-step" onClick={() => setSelectedOrder(null)}>Close</button></div>
            <div className="order-tracking-steps">{["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].map((step) => { const orderSteps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]; const current = orderSteps.indexOf(selectedOrder.status); const index = orderSteps.indexOf(step); return <div className={`order-tracking-step ${index <= current ? "is-complete" : ""}`} key={step}><i>{index < current ? "✓" : index + 1}</i><span>{step.replaceAll("_", " ")}</span></div>; })}</div>
            <div className="order-tracking-meta"><span><small>Payment status</small><strong>{selectedOrder.paymentStatus === "PAID" ? "Paid" : selectedOrder.paymentMethod === "CARD" ? "Awaiting card confirmation" : "Unpaid · Cash on delivery"}</strong></span><span><small>Payment method</small><strong>{selectedOrder.paymentMethod?.replaceAll("_", " ") ?? "—"}</strong></span><span><small>Order total</small><strong>{selectedOrder.currency ?? "USD"} {Number(selectedOrder.total).toFixed(2)}</strong></span><span><small>Address</small><strong>{selectedOrder.addressLine1}, {selectedOrder.city}, {selectedOrder.region} {selectedOrder.postalCode}, {selectedOrder.country}</strong></span></div>
            <div className="customer-tracking-courier"><span><small>Courier tracking</small><strong>{selectedOrder.shippingCarrier?.replaceAll("_", " ") ?? "Not assigned yet"}</strong>{selectedOrder.trackingCode ? <><span>{selectedOrder.trackingCode}</span><a href={`https://www.17track.net/en/track?nums=${encodeURIComponent(selectedOrder.trackingCode)}`} target="_blank" rel="noreferrer">Track shipment with courier ↗</a></> : <span>Your tracking number will appear here once your order ships.</span>}</span></div>
            <div className="customer-tracking-items">{selectedOrder.items.map((item) => <div key={item.id}><OrderProductImage src={item.imageUrl} alt={item.productName} width={58} height={70} className="customer-order-item-image" /><span><strong>{item.productName}</strong><small>Size {item.size} · Qty {item.quantity} · {item.sku ?? "No SKU"}</small></span><strong>${Number(item.lineTotal ?? 0).toFixed(2)}</strong></div>)}</div>
          </section>}
          {error && <div className="admin-form-error" role="alert">{error}</div>}
        </>
      ) : (
        <section className="admin-login-card customer-login-card">
          <span className="eyebrow">Customer account</span>
          <h1>{registering ? "Create your account." : "Welcome back."}</h1>
          <p>Sign in or create an account to see your order history and check out securely.</p>
          <form className="admin-login-form" onSubmit={submit}>
            {registering && <label>Name<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>}
            <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
            <label>Password<input name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 12 : 1} required /></label>
            {error && <div className="admin-form-error" role="alert">{error}</div>}
            <button type="submit" className="button button-dark" disabled={busy}>{busy ? "Please wait…" : registering ? "Create account" : "Sign in"}</button>
          </form>
          <button type="button" className="admin-back-link" onClick={() => { setError(""); setRegistering(!registering); }}>
            {registering ? "Already have an account? Sign in" : "New to Umber? Create an account"}
          </button>
        </section>
      )}
    </main>
  );
}
