import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminBookingsView } from "@/components/admin/admin-bookings-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Delivery Operations - HitsNaGo Admin",
  description: "Monitor point-to-point courier and parcel dispatch across Butuan City, Agusan del Norte.",
}

export default async function AdminDeliveriesPage() {
  await requireRole("admin")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Delivery Operations"
        badgeText="Courier Dispatch"
        description="Monitor point-to-point document dispatch, e-commerce parcels, and medical deliveries across Butuan City."
      />

      <AdminBookingsView initialServiceFilter="delivery" title="Delivery Dispatches" />
    </div>
  )
}
