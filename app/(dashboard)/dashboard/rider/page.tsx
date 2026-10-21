import * as React from "react"
import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { requireRole } from "@/lib/auth/roles"
import { getRiderRecord, getRiderBookings, getAvailableBookingsForRider, getUserApplicationStatus } from "@/lib/actions/bookings"
import { RiderBookingsView } from "@/components/rider/rider-bookings-view"
import { HugeiconsIcon } from "@hugeicons/react"
import { Motorbike01Icon, Calendar01Icon, StarIcon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import { convertBookingToMapMarkers } from "@/lib/maps/geocode"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { DashboardVerificationBanner } from "@/components/dashboard/dashboard-verification-banner"
import { VerifiedBadge } from "@/components/common/verified-badge"
import type { VerificationStatus } from "@/types/verification"

export const metadata: Metadata = {
  title: "My Rides - HitsNaGo Rider",
  description: "Rider dispatch console and assigned passenger trips in Butuan City.",
}

export default async function RiderDashboardPage() {
  await requireRole("rider")
  const clerkUser = await currentUser()
  const [rider, appStatus] = await Promise.all([
    getRiderRecord(),
    getUserApplicationStatus(),
  ])

  if (!rider) {
    const fallbackStatus: VerificationStatus = appStatus.riderApplication?.status || (appStatus.isRiderPending ? "pending" : "unverified")
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-6 max-w-xl mx-auto">
        <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <HugeiconsIcon icon={Motorbike01Icon} size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-xl font-bold text-foreground">Rider Verification Portal</h2>
          <p className="text-sm text-muted-foreground">
            Your account ({clerkUser?.emailAddresses[0]?.emailAddress}) is not yet activated as an active rider. Submit or check your verification application below.
          </p>
        </div>
        <div className="w-full text-left">
          <DashboardVerificationBanner
            role="rider"
            status={fallbackStatus}
            rejectionReason={appStatus.riderApplication?.rejectionReason}
          />
        </div>
      </div>
    )
  }

  // Resolve persisted verification status
  let riderStatus: VerificationStatus = "unverified"
  if (rider.is_verified || rider.verification_status === "verified") {
    riderStatus = "verified"
  } else if (rider.verification_status === "resubmission_required" || appStatus.isRiderResubmission) {
    riderStatus = "resubmission_required"
  } else if (rider.verification_status === "rejected" || appStatus.isRiderRejected) {
    riderStatus = "rejected"
  } else if (rider.verification_status === "pending" || appStatus.isRiderPending) {
    riderStatus = "pending"
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
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              My Rides
            </h1>
            <VerifiedBadge
              role="rider"
              isVerified={rider.is_verified}
              verificationStatus={rider.verification_status}
              size="md"
              showText
            />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-foreground">{rider.name}</span>
            <VerifiedBadge
              role="rider"
              isVerified={rider.is_verified}
              verificationStatus={rider.verification_status}
              size="sm"
            />
            <span>• {rider.vehicle_model || "Motorcycle"} ({rider.plate_number || "Active Dispatch"})</span>
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

      {/* Verification Status Banner */}
      <DashboardVerificationBanner
        role="rider"
        status={riderStatus}
        rejectionReason={rider.rejection_reason || appStatus.riderApplication?.rejectionReason}
        submittedAt={rider.submitted_at || rider.created_at}
      />


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
