import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminBookingsTable } from "@/components/admin/admin-bookings-table"
import { getAllBookings } from "@/lib/actions/bookings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ride Operations - HitsNaGo Admin",
  description: "Monitor and dispatch passenger rides across Butuan City, Agusan del Norte.",
}

export default async function AdminRidesPage() {
  await requireRole("admin")

  const allBookings = await getAllBookings()
  const rideBookings = allBookings.filter((b) => b.service_type === "ride")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Ride Operations Hub"
        description="Active motorcycle taxis, tricycles, and chauffeured cars across Butuan City."
      />

      <AdminBookingsTable initialBookings={rideBookings} />
    </div>
  )
}
