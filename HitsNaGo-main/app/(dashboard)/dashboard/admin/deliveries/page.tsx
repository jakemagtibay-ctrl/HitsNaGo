import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminBookingsTable } from "@/components/admin/admin-bookings-table"
import { getAllBookings } from "@/lib/actions/bookings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Delivery Operations - HitsNaGo Admin",
  description: "Monitor point-to-point courier and parcel dispatch across Butuan City, Agusan del Norte.",
}

export default async function AdminDeliveriesPage() {
  await requireRole("admin")

  const allBookings = await getAllBookings()
  const deliveryBookings = allBookings.filter((b) => b.service_type === "delivery")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Delivery Operations"
        badgeText="Courier Dispatch"
        description="Monitor point-to-point document dispatch, e-commerce parcels, and medical deliveries across Butuan City."
      />

      <AdminBookingsTable initialBookings={deliveryBookings} />
    </div>
  )
}
