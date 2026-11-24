import { Suspense } from "react";
import { OrderRouteClient } from "@/app/components/admin/OrderRouteClient";

export default function AdminOrderPage() {
  return <Suspense fallback={<main className="admin-detail-page"><div className="admin-detail-loading">Loading order details…</div></main>}><OrderRouteClient /></Suspense>;
}
