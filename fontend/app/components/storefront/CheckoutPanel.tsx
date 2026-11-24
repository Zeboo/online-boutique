"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, ApiError } from "@/app/lib/api";
import { Icon } from "@/app/components/ui/Icon";
import { ProductImage } from "@/app/components/storefront/ProductGrid";

type CheckoutItem = { productId: string; quantity: number; size: string };
type CheckoutProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  color: string;
};
export type CheckoutOrder = {
  orderNumber: string;
  email: string;
  recipientName: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string | number;
  shipping: string | number;
  total: string | number;
  createdAt: string;
  items: { id: string; productName: string; quantity: number; size: string; unitPrice: string | number; lineTotal: string | number }[];
};

export function CheckoutPanel({
  items,
  products,
  onComplete,
}: {
  items: CheckoutItem[];
  products: CheckoutProduct[];
  onComplete: (order: CheckoutOrder) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "CARD">("CARD");

  useEffect(() => {
    if (!items.length) {
      queueMicrotask(() => setAuthChecking(false));
      return;
    }
    let active = true;
    apiRequest<{ role: string }>("/auth/me")
      .then(async (user) => {
        if (!active) return;
        if (user.role !== "CUSTOMER") {
          await apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
          router.replace("/account?returnTo=%2F%3Fcheckout%3D1");
          return;
        }
        setAuthError("");
        setAuthChecking(false);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/account?returnTo=%2F%3Fcheckout%3D1");
          return;
        }
        setAuthError(requestError instanceof Error ? requestError.message : "We could not verify your customer account.");
        setAuthChecking(false);
      });
    return () => { active = false; };
  }, [items.length, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const getValue = (name: string) => String(form.get(name) ?? "").trim();

    try {
      const payload = {
        email: getValue("email"), recipientName: getValue("recipientName"), phone: getValue("phone"), addressLine1: getValue("addressLine1"), addressLine2: getValue("addressLine2") || undefined, city: getValue("city"), region: getValue("region"), postalCode: getValue("postalCode"), country: getValue("country"), paymentMethod,
        items: items.map(({ productId, quantity, size }) => ({ productId, quantity, size })),
      };
      if (paymentMethod === "CARD") {
        const session = await apiRequest<{ url: string | null }>("/payments/stripe/checkout", { method: "POST", body: JSON.stringify(payload) });
        if (!session.url) throw new Error("Stripe did not return a checkout URL.");
        window.location.assign(session.url);
        return;
      }
      const order = await apiRequest<CheckoutOrder>("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onComplete(order);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 401) {
        router.replace("/account?returnTo=%2F%3Fcheckout%3D1");
        return;
      }
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Your order could not be placed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <section className="flow-page checkout-page">
        <div className="empty-cart">
          <h2>Your bag is empty.</h2>
          <p>Add a piece to your bag before checking out.</p>
        </div>
      </section>
    );
  }

  if (authChecking) {
    return <section className="flow-page checkout-page"><div className="checkout-account-status" role="status"><span className="eyebrow">Secure checkout</span><h2>Checking your customer account...</h2><p>We&apos;re preparing your secure delivery and payment details.</p></div></section>;
  }

  if (authError) {
    return <section className="flow-page checkout-page"><div className="checkout-account-status" role="alert"><span className="eyebrow">Secure checkout</span><h2>We couldn&apos;t verify your account.</h2><p>{authError}</p><button type="button" className="button button-dark" onClick={() => router.push("/account?returnTo=%2F%3Fcheckout%3D1")}>Sign in to continue</button></div></section>;
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const subtotal = items.reduce(
    (sum, item) => sum + (productById.get(item.productId)?.price ?? 0) * item.quantity,
    0,
  );
  const shipping = subtotal >= 150 ? 0 : 12;

  return (
    <section className="flow-page checkout-page">
      <div className="flow-heading">
        <span className="eyebrow">A few details to go</span>
        <h1>Shipping &amp; payment</h1>
        <p>Add your delivery address and choose how you&apos;d like to pay.</p>
      </div>
      <div className="checkout-layout">
        <form className="checkout-form-column checkout-form" onSubmit={submit}>
          <div className="form-section-title"><div><span className="eyebrow">Delivery details</span><h2>Shipping address</h2></div><span>* Required fields</span></div>
          <div className="form-grid">
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} />
            </label>
            <label>
              Recipient name
              <input name="recipientName" autoComplete="name" placeholder="Full name" required maxLength={160} />
            </label>
            <label className="field-full">
              Phone
              <input name="phone" type="tel" autoComplete="tel" placeholder="Include your country code" required maxLength={40} />
            </label>
            <label className="field-full">
              Address
              <input name="addressLine1" autoComplete="address-line1" placeholder="Street address" required maxLength={240} />
            </label>
            <label className="field-full">
              Apartment, suite, etc. <span className="field-optional">(optional)</span>
              <input name="addressLine2" autoComplete="address-line2" placeholder="Apartment, suite, unit, etc." maxLength={240} />
            </label>
            <label>
              City
              <input name="city" autoComplete="address-level2" placeholder="City" required maxLength={120} />
            </label>
            <label>
              State / region
              <input name="region" autoComplete="address-level1" placeholder="State or region" required maxLength={120} />
            </label>
            <label>
              Postal code
              <input name="postalCode" autoComplete="postal-code" placeholder="Postal code" required maxLength={32} />
            </label>
            <label>
              Country (2-letter code)
              <input name="country" autoComplete="country" placeholder="e.g. US" pattern="[A-Za-z]{2}" required maxLength={2} />
            </label>
          </div>
          <label className={`payment-choice ${paymentMethod === "CASH_ON_DELIVERY" ? "payment-choice-active" : ""}`}>
            <input type="radio" name="paymentMethod" value="CASH_ON_DELIVERY" checked={paymentMethod === "CASH_ON_DELIVERY"} onChange={() => setPaymentMethod("CASH_ON_DELIVERY")} />
            <Icon name="truck" size={20} />
            <span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span>
            <span className="payment-brands">COD</span>
          </label>
          <label className={`payment-choice ${paymentMethod === "CARD" ? "payment-choice-active" : ""}`}>
            <input type="radio" name="paymentMethod" value="CARD" checked={paymentMethod === "CARD"} onChange={() => setPaymentMethod("CARD")} />
            <Icon name="shield" size={20} />
            <span><strong>Card payment</strong><small>Secure Stripe Checkout</small></span>
            <span className="payment-brands">VISA <span aria-hidden="true">·</span> MC</span>
          </label>
          {paymentMethod === "CARD" && <p className="checkout-payment-help">After you submit this form, Stripe will open a secure card page where you can enter your card number, expiry date, CVC, and confirm payment.</p>}
          {error && <div className="admin-form-error" role="alert">{error}</div>}
          <button type="submit" className="button button-dark form-submit" disabled={busy}>
            {busy ? "Placing your order..." : "Place order"}
            <Icon name="arrow" size={16} />
          </button>
        </form>
        <aside className="order-summary checkout-summary">
          <h2>Your pieces</h2>
          {items.map((item) => {
            const product = productById.get(item.productId);
            if (!product) return null;
            return (
              <div className="checkout-product" key={`${item.productId}-${item.size}`}>
                <div className="checkout-product-image">
                  <ProductImage src={product.image} alt={product.name} className="cart-photo" />
                  <span>{item.quantity}</span>
                </div>
                <div><strong>{product.name}</strong><span>{product.color} <span aria-hidden="true">·</span> {item.size}</span></div>
                <b>${(product.price * item.quantity).toFixed(2)}</b>
              </div>
            );
          })}
          <div className="summary-row"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
          <div className="summary-row"><span>Shipping</span><strong>{shipping ? "$12.00" : "Complimentary"}</strong></div>
          <div className="summary-total"><span>Total</span><strong>${(subtotal + shipping).toFixed(2)}</strong></div>
          <p className="checkout-summary-note">Inventory and prices are confirmed by the server when your order is placed.</p>
        </aside>
      </div>
    </section>
  );
}
