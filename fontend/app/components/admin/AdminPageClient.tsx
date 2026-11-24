"use client";

import { useSearchParams } from "next/navigation";
import { AdminConsole } from "./AdminConsole";

export function AdminPageClient() {
  const searchParams = useSearchParams();
  const initialSection = searchParams.get("section") === "orders" ? "Orders" : "Overview";
  return <AdminConsole initialSection={initialSection} />;
}
