"use client";
import { useParams } from "next/navigation";
import { AdminOrderDetail } from "./AdminOrderDetail";
export function OrderRouteClient() { const params = useParams<{ id: string }>(); return <AdminOrderDetail key={params.id} orderId={params.id} />; }
