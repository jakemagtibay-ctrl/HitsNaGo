import * as React from "react"
import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Coins01Icon,
  CheckmarkCircle01Icon,
  Analytics01Icon,
  PinLocation01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons"
import { requireRole } from "@/lib/auth/roles"
import { mockRiderStats } from "@/lib/mock-data/stats"
import { mockIncomingRideRequests } from "@/lib/mock-data/ride-requests"
import { mockRideBookings, mockDeliveryBookings } from "@/lib/mock-data/bookings"
import { StatCard } from "@/components/dashboard/stat-card"
import { BookingCard } from "@/components/dashboard/booking-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { RiderActions } from "@/components/dashboard/rider-actions"
import { BookingStatusBadge, VerificationStatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rider Terminal - HitsNaGo",
  description: "Rider dispatch console, incoming trips, route tracking, and daily earnings.",
}

export default async function RiderDashboardPage() {
  await requireRole("rider")
  const clerkUser = await currentUser()

  const displayName =
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    "Danilo Reyes"

  const activeRide = mockRideBookings.find((b) => b.status === "active")
  const recentRiderTrips = [
    ...mockRideBookings.filter((b) => b.status === "completed"),
    ...mockDeliveryBookings,
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-primary/30 text-primary bg-primary/10">
                Rider Console
              </Badge>
              <VerificationStatusBadge status="verified" />
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, <span className="text-primary">{displayName}</span>!
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Accept instant passenger rides and parcel courier requests across San Isidro and northwest Leyte municipalities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2">
              <HugeiconsIcon icon={StarIcon} size={16} className="text-amber-500 fill-amber-500" />
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xs text-foreground">
                  {mockRiderStats.rating} / 5.0 Rating
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {mockRiderStats.totalRatingsCount} verified ratings
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Today's Earnings"
          value={`₱${mockRiderStats.todayEarnings.toLocaleString("en-PH")}`}
          subtitle="Net accumulated today"
          icon={Coins01Icon}
          trend={{ value: "+18%", isPositive: true }}
        />
        <StatCard
          title="Completed Today"
          value={`${mockRiderStats.todayRidesCount} trips`}
          subtitle="Rides & parcels"
          icon={CheckmarkCircle01Icon}
        />
        <StatCard
          title="Acceptance Rate"
          value={`${mockRiderStats.acceptanceRate}%`}
          subtitle="High driver priority"
          icon={Analytics01Icon}
          trend={{ value: "Top Tier", isPositive: true }}
        />
        <StatCard
          title="Weekly Earnings"
          value={`₱${mockRiderStats.weekEarnings.toLocaleString("en-PH")}`}
          subtitle="Payout scheduled Mon"
          icon={Coins01Icon}
        />
      </div>

      {/* Active Trip Spotlight (if rider has one in progress) */}
      {activeRide && (
        <div id="active-trips" className="flex flex-col gap-4">
          <SectionHeader
            title="Trip Currently In Progress"
            description="Active passenger transit assigned to your vehicle"
            badge={
              <Badge className="bg-emerald-600 text-white text-xs">
                In Progress
              </Badge>
            }
          />

          <Card className="border-emerald-500/30 bg-card shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <HugeiconsIcon icon={Motorbike01Icon} size={24} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-foreground text-base">
                        Passenger: Maria Santos
                      </span>
                      <BookingStatusBadge status={activeRide.status} />
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={PinLocation01Icon} size={14} className="text-primary shrink-0" />
                        <span>Pickup: <strong className="text-foreground">{activeRide.pickupLocation.address}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={PinLocation01Icon} size={14} className="text-rose-500 shrink-0" />
                        <span>Dropoff: <strong className="text-foreground">{activeRide.destinationLocation.address}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
                  <div className="text-left lg:text-right">
                    <span className="text-xs text-muted-foreground block">Trip Fare</span>
                    <span className="font-heading text-2xl font-bold text-primary">
                      ₱{activeRide.totalAmount}
                    </span>
                    <span className="text-[11px] text-muted-foreground block uppercase">
                      Payment via {activeRide.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/#services"
                      className={cn(buttonVariants({ size: "sm" }), "font-semibold shadow-xs")}
                    >
                      Complete Trip
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interactive Dispatch & Incoming Requests */}
      <div id="available-requests">
        <RiderActions initialRequests={mockIncomingRideRequests} />
      </div>

      {/* Recent Trips History */}
      <div id="earnings" className="flex flex-col gap-4">
        <SectionHeader
          title="Trip History & Dispatched Jobs"
          description="Summary of your recent completed trips and deliveries"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentRiderTrips.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      </div>
    </div>
  )
}
