import * as React from "react"
import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { requireRole } from "@/lib/auth/roles"
import { getRiderRecord, getRiderBookings, getAvailableBookingsForRider } from "@/lib/actions/bookings"
import { RiderBookingsView } from "@/components/rider/rider-bookings-view"
import { HugeiconsIcon } from "@hugeicons/react"
import { Motorbike01Icon, Calendar01Icon, StarIcon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import { convertBookingToMapMarkers } from "@/lib/maps/geocode"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Rides - HitsNaGo Rider",
  description: "Rider dispatch console and assigned passenger trips in Butuan City.",
}

export default async function RiderDashboardPage() {
  await requireRole("rider")
  const clerkUser = await currentUser()
  const rider = await getRiderRecord()

  if (!rider) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <HugeiconsIcon icon={Motorbike01Icon} size={28} />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">Rider Account Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Your logged-in email ({clerkUser?.emailAddresses[0]?.emailAddress}) is not registered in the system as an approved rider.
          Please contact an administrator to register your email in the riders list.
        </p>
      </div>
    )
  }

  const [bookings, availableResult] = await Promise.all([
    getRiderBookings(),
    getAvailableBookingsForRider(),
  ])
  const availableBookings = availableResult.bookings || []

  // Combine markers for assigned and available requests
  const assignedMarkers = bookings.flatMap(convertBookingToMapMarkers)
  const availableMarkers = availableBookings.flatMap((b) =>
    convertBookingToMapMarkers(b).map((m) => ({
      ...m,
      id: `avail-${m.id}`,
      title: `[Available Request] ${m.title}`,
      category: "pickup" as const,
      badgeText: "Broadcasted Request",
    }))
  )
  const allMarkers = [...assignedMarkers, ...availableMarkers]

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Rides
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {rider.name} • {rider.vehicle_model || "Motorcycle"} ({rider.plate_number || "Verified"})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs">
            <HugeiconsIcon icon={StarIcon} size={14} className="text-amber-500 fill-amber-500" />
            <span className="font-bold text-foreground">{Number(rider.rating ?? 5.0).toFixed(2)}</span>
            <span className="text-muted-foreground text-[11px]">Rating</span>
          </div>
          <Link
            href="/dashboard/rider/history"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
          >
            <HugeiconsIcon icon={Calendar01Icon} size={14} />
            <span>Trip History</span>
          </Link>
        </div>
      </div>

      {/* City Dispatch & Route Map */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-heading text-base font-bold text-foreground">
              Butuan City Dispatch & Area Map
            </h2>
            <p className="text-xs text-muted-foreground">
              {allMarkers.length > 0
                ? `Displaying ${bookings.length} assigned trip(s) and ${availableBookings.length} broadcasted request(s) waiting for acceptance in Butuan City.`
                : `No active dispatches. Explore Butuan City landmarks, commercial centers, and transit terminals below.`}
            </p>
          </div>
        </div>

        <ButuanCityMap
          title="Rider Coverage & City Route Map"
          description="Butuan City, Agusan del Norte • Real-time dispatch points & transit landmarks"
          height="420px"
          markers={allMarkers}
          showLandmarks={true}
          showControls={true}
          roleContext="rider"
        />
      </div>

      {/* Bookings View */}
      <RiderBookingsView
        rider={rider}
        initialBookings={bookings}
        initialAvailable={availableBookings}
        viewMode="active"
      />
    </div>
  )
}
