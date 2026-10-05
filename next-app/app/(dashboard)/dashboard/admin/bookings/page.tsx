import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminBookingsView } from "@/components/admin/admin-bookings-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Booking Management - HitsNaGo Admin",
  description: "Monitor, audit, and inspect all service bookings in Butuan City, Agusan del Norte.",
}

export default async function AdminBookingsPage() {
  await requireRole("admin")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Booking Operations"
        badgeText="Dispatch & Bookings"
        description="Live monitoring of passenger rides, vehicle rentals, and courier packages across Butuan City."
      />

      <AdminBookingsView initialServiceFilter="all" />
    </div>
  )
}
