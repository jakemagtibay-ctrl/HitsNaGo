import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Navigation01Icon } from "@hugeicons/core-free-icons"
import { requireRole } from "@/lib/auth/roles"
import { getCustomerBookings } from "@/lib/actions/bookings"
import { CustomerBookingsView } from "@/components/customer/customer-bookings-view"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Bookings - HitsNaGo",
  description: "View all your ride, rental, and delivery bookings.",
}

export default async function CustomerBookingsPage() {
  await requireRole("customer")
  const bookings = await getCustomerBookings()

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Booking History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            All your service requests in Butuan City. Real-time updates, cancellation management, and emergency response.
          </p>
        </div>

        <Link
          href="/dashboard/customer/book/ride"
          className={cn(buttonVariants({ size: "default" }), "gap-2 font-semibold shadow-xs shrink-0")}
        >
          <HugeiconsIcon icon={Navigation01Icon} size={16} />
          <span>Book New Trip</span>
        </Link>
      </div>

      <CustomerBookingsView initialBookings={bookings} />
    </div>
  )
}