import * as React from "react"
import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Key01Icon,
  PackageIcon,
  CheckmarkCircle01Icon,
  Calendar01Icon,
  Coins01Icon,
  Navigation01Icon,
  PinLocation01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { requireRole } from "@/lib/auth/roles"
import { mockCustomerStats } from "@/lib/mock-data/stats"
import { mockRideBookings, mockRentalBookings, mockDeliveryBookings } from "@/lib/mock-data/bookings"
import { StatCard } from "@/components/dashboard/stat-card"
import { BookingCard } from "@/components/dashboard/booking-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { QuickAction } from "@/components/dashboard/quick-action"
import { BookingStatusBadge, VerificationStatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Customer Portal - HitsNaGo",
  description: "Manage your rides, equipment rentals, and package courier deliveries.",
}

export default async function CustomerDashboardPage() {
  await requireRole("customer")
  const clerkUser = await currentUser()

  const displayName =
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    clerkUser?.emailAddresses[0]?.emailAddress.split("@")[0] ||
    "Valued Customer"

  const activeRide = mockRideBookings.find((b) => b.status === "active")
  const allRecentBookings = [...mockRideBookings, ...mockRentalBookings, ...mockDeliveryBookings]

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-primary/30 text-primary bg-primary/10">
                Customer Portal
              </Badge>
              <VerificationStatusBadge status="verified" />
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Hello, <span className="text-primary">{displayName}</span>!
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Track your active trips across Butuan City, reserve reliable vehicle rentals, or send express parcels quickly and securely.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/customer/book/ride"
              className={cn(buttonVariants({ size: "default" }), "gap-2 shadow-xs font-semibold")}
            >
              <HugeiconsIcon icon={Navigation01Icon} size={16} />
              <span>Book New Trip</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Bookings"
          value={mockCustomerStats.activeBookingsCount}
          subtitle="Currently ongoing"
          icon={Navigation01Icon}
          trend={{ value: "1 live now", isPositive: true }}
        />
        <StatCard
          title="Upcoming Trips"
          value={mockCustomerStats.upcomingCount}
          subtitle="Reserved schedules"
          icon={Calendar01Icon}
        />
        <StatCard
          title="Completed"
          value={mockCustomerStats.completedCount}
          subtitle="Successful services"
          icon={CheckmarkCircle01Icon}
          trend={{ value: "+3 this week", isPositive: true }}
        />
        <StatCard
          title="Total Spent"
          value={`₱${mockCustomerStats.totalSpent.toLocaleString("en-PH")}`}
          subtitle="All transactions"
          icon={Coins01Icon}
        />
      </div>

      {/* Active Service Spotlight (if in progress) */}
      {activeRide && (
        <div className="flex flex-col gap-4">
          <SectionHeader
            title="Live Service Spotlight"
            description="Your current active ride in Butuan City"
            badge={
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                Live Tracking
              </span>
            }
          />

          <Card className="border-primary/30 bg-card shadow-sm overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <HugeiconsIcon icon={Motorbike01Icon} size={24} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-foreground text-base">
                        Express Motorcycle Ride
                      </span>
                      <BookingStatusBadge status={activeRide.status} />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Assigned Rider: <strong className="text-foreground">Danilo Reyes (4.9★)</strong> • Plate: <span className="font-mono text-foreground">7718-HA</span>
                    </p>

                    <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={PinLocation01Icon} size={14} className="text-primary shrink-0" />
                        <span>Pickup: <strong className="text-foreground">{activeRide.pickupLocation.address}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={PinLocation01Icon} size={14} className="text-rose-500 shrink-0" />
                        <span>Destination: <strong className="text-foreground">{activeRide.destinationLocation.address}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
                  <div className="text-left lg:text-right">
                    <span className="text-xs text-muted-foreground block">Estimated Fare</span>
                    <span className="font-heading text-2xl font-bold text-foreground">
                      ₱{activeRide.totalAmount}
                    </span>
                    <span className="text-[11px] text-muted-foreground block uppercase">
                      Payment via {activeRide.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/customer/bookings"
                      className={cn(buttonVariants({ size: "sm" }), "font-semibold")}
                    >
                      Trip Details
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Booking Shortcuts */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Instant Service Requests"
          description="Request reliable transportation or courier delivery in Butuan City"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            title="Book a Ride"
            description="Motorcycles, tricycles, private sedans, and commuter passenger vans."
            icon={Motorbike01Icon}
            href="/dashboard/customer/book/ride"
            badgeText="Fast"
          />
          <QuickAction
            title="Rent Equipment or Vehicles"
            description="Self-drive or chauffeured vans, motorbikes, power generators, and sound systems."
            icon={Key01Icon}
            href="/dashboard/customer/book/rental"
            badgeText="Verified"
          />
          <QuickAction
            title="Express Courier Delivery"
            description="Rapid point-to-point document and parcel dispatch across Butuan City."
            icon={PackageIcon}
            href="/dashboard/customer/book/delivery"
            badgeText="Same-day"
          />
        </div>
      </div>

      {/* Become a Rider / Rental Provider CTAs */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Grow with HitsNaGo"
          description="Apply to become a verified rider or rental provider in Butuan City"
        />

        {/* Mock: show pending banners if user has applications in-flight */}
        {/* In production, these banners are driven by real application status from the database */}
        {/* MOCK_HAS_PENDING_RIDER_APP = false; MOCK_HAS_PENDING_PROVIDER_APP = false */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rider Application CTA */}
          <Card className="border-border/80 bg-card shadow-xs hover:border-primary/40 hover:shadow-sm transition-all">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HugeiconsIcon icon={Motorbike01Icon} size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Become a Rider</span>
                  <span className="text-[11px] text-muted-foreground">Earn by accepting rides & deliveries</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Drive as a verified habal-habal or tricycle rider across Butuan City. Submit your LTO license, vehicle details, and OR/CR to apply.
              </p>
              <Link
                href="/dashboard/customer/apply/rider"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-2 font-semibold mt-1 border-primary/40 text-primary hover:bg-primary/10")}
              >
                Apply Now
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </CardContent>
          </Card>

          {/* Provider Application CTA */}
          <Card className="border-border/80 bg-card shadow-xs hover:border-primary/40 hover:shadow-sm transition-all">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HugeiconsIcon icon={Key01Icon} size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Become a Rental Provider</span>
                  <span className="text-[11px] text-muted-foreground">List vehicles & equipment for rent</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Offer your cars, motorcycles, generators, or event equipment to customers in Butuan City. Business permit and government ID required.
              </p>
              <Link
                href="/dashboard/customer/apply/provider"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-2 font-semibold mt-1 border-primary/40 text-primary hover:bg-primary/10")}
              >
                Apply Now
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Bookings List */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Recent Bookings & Activity"
          description="History of all your service requests across Butuan City"
          action={{
            label: "View All Bookings",
            href: "/dashboard/customer/bookings",
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allRecentBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      </div>
    </div>
  )
}
