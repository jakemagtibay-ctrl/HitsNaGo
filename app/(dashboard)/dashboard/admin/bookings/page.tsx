import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminBookingsTable } from "@/components/admin/admin-bookings-table"
import { getAllBookings } from "@/lib/actions/bookings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Booking Management - HitsNaGo Admin",
  description: "Live monitoring and rider dispatch for all service bookings in Butuan City.",
}

export default async function AdminBookingsPage() {
  await requireRole("admin")

  const bookings = await getAllBookings()

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Booking Operations"
        description="Real-time monitoring and dispatch for passenger rides, vehicle rentals, and courier packages across Butuan City."
      />

      <AdminBookingsTable initialBookings={bookings} />
    </div>
  )
}
