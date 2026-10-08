import * as React from "react"
import Link from "next/link"
import { requireRole } from "@/lib/auth/roles"
import { getRiderRecord, getRiderBookings } from "@/lib/actions/bookings"
import { RiderBookingsView } from "@/components/rider/rider-bookings-view"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trip History - HitsNaGo Rider",
  description: "Completed and cancelled trips history in Butuan City.",
}

export default async function RiderHistoryPage() {
  await requireRole("rider")
  const rider = await getRiderRecord()

  if (!rider) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Rider account not registered.
      </div>
    )
  }

  const bookings = await getRiderBookings()

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Trip History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Archived completed and cancelled rides for {rider.name}
          </p>
        </div>

        <Link
          href="/dashboard/rider"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          <span>Back to Active Rides</span>
        </Link>
      </div>

      <RiderBookingsView
        rider={rider}
        initialBookings={bookings}
        viewMode="history"
      />
    </div>
  )
}
