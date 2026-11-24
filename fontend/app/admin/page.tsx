import { Suspense } from "react";
import { AdminPageClient } from "@/app/components/admin/AdminPageClient";

export default function AdminPage() {
  return <Suspense fallback={<main className="admin-loading-page" role="status">Loading administration…</main>}><AdminPageClient /></Suspense>;
}
