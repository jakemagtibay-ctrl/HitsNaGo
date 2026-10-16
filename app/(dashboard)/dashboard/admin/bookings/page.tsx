import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminBookingsTable } from "@/components/admin/admin-bookings-table"
import { getAllBookings } from "@/lib/actions/bookings"
import { getBookingIncidents } from "@/lib/actions/cancellations"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Booking Management - HitsNaGo Admin",
  description: "Live monitoring, rider dispatch, and incident resolution for all service bookings in Butuan City.",
}

export default async function AdminBookingsPage() {
  await requireRole("admin")

  const [bookings, incidents] = await Promise.all([
    getAllBookings(),
    getBookingIncidents(),
  ])

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Booking Operations"
        description="Real-time monitoring and dispatch for passenger rides, vehicle rentals, and courier packages across Butuan City."
      />

      <AdminBookingsTable initialBookings={bookings} initialIncidents={incidents} />
    </div>
  )
}
