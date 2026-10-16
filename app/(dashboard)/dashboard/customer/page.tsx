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
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { requireRole } from "@/lib/auth/roles"
import { getCustomerBookings, getCustomerBookingStats, getUserApplicationStatus } from "@/lib/actions/bookings"
import { StatCard } from "@/components/dashboard/stat-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { QuickAction } from "@/components/dashboard/quick-action"
import { BookingStatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent } from "@/components/ui/card"
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

  const [bookings, stats, appStatus] = await Promise.all([
    getCustomerBookings(),
    getCustomerBookingStats(),
    getUserApplicationStatus(),
  ])

  const recentBookings = bookings.slice(0, 6)
  const activeBooking = bookings.find((b) => b.status === "in_progress" || b.status === "accepted")
  const pendingBooking = bookings.find((b) => b.status === "pending" || b.status === "assigned")

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Hello, <span className="text-primary">{displayName}</span>!
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Book rides, rent vehicles, or send parcels anywhere in Butuan City.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active / In Progress"
          value={stats.active}
          subtitle="Currently ongoing"
          icon={Navigation01Icon}
          trend={{ value: stats.active > 0 ? "Live now" : "None active", isPositive: stats.active > 0 }}
        />
        <StatCard
          title="Pending / Assigned"
          value={stats.pending}
          subtitle="Awaiting rider"
          icon={Calendar01Icon}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          subtitle="Successful trips"
          icon={CheckmarkCircle01Icon}
          trend={{ value: `+${stats.completed} total`, isPositive: true }}
        />
        <StatCard
          title="Total Spent"
          value={`₱${stats.totalSpent.toLocaleString("en-PH")}`}
          subtitle="Completed transactions"
          icon={Coins01Icon}
        />
      </div>

      {/* Active ride spotlight */}
      {activeBooking && (
        <div className="flex flex-col gap-4">
          <SectionHeader
            title="Live Trip"
            description="Your current active booking"
            badge={
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                Live
              </span>
            }
          />
          <Card className="border-primary/30 bg-card shadow-sm overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <HugeiconsIcon icon={Motorbike01Icon} size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-foreground text-sm">{activeBooking.reference}</span>
                      <BookingStatusBadge status={activeBooking.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeBooking.rider
                        ? `Rider: ${activeBooking.rider.name} • ${activeBooking.rider.vehicle_model ?? ""}`
                        : "Rider: Assigned"}
                    </p>
                    <p className="text-xs text-muted-foreground">Pickup: <strong className="text-foreground">{activeBooking.pickup}</strong></p>
                    <p className="text-xs text-muted-foreground">Destination: <strong className="text-foreground">{activeBooking.destination}</strong></p>
                  </div>
                </div>
                <Link
                  href="/dashboard/customer/bookings"
                  className={cn(buttonVariants({ size: "sm" }), "font-semibold shrink-0")}
                >
                  View Details
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending booking notice */}
      {!activeBooking && pendingBooking && (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-foreground">Booking Pending: {pendingBooking.reference}</span>
              <span className="text-xs text-muted-foreground">
                {pendingBooking.status === "pending" ? "Waiting for rider assignment by admin" : "Rider assigned — awaiting acceptance"}
              </span>
            </div>
            <BookingStatusBadge status={pendingBooking.status} />
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Book a Service"
          description="Request transportation or courier delivery in Butuan City"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            title="Book a Ride"
            description="Motorcycles, tricycles, private sedans, and commuter vans."
            icon={Motorbike01Icon}
            href="/dashboard/customer/book/ride"
            badgeText="Fast"
          />
          <QuickAction
            title="Rent Equipment"
            description="Self-drive vehicles, generators, and sound systems."
            icon={Key01Icon}
            href="/dashboard/customer/book/rental"
            badgeText="Verified"
          />
          <QuickAction
            title="Send a Parcel"
            description="Rapid point-to-point document and parcel dispatch."
            icon={PackageIcon}
            href="/dashboard/customer/book/delivery"
            badgeText="Same-day"
          />
        </div>
      </div>

      {/* Recent bookings */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Recent Bookings"
          description="Your latest service requests"
          action={{ label: "View All", href: "/dashboard/customer/bookings" }}
        />

        {recentBookings.length === 0 ? (
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              No bookings yet. <Link href="/dashboard/customer/book/ride" className="text-primary font-semibold underline">Book your first ride</Link>.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBookings.map((booking) => (
              <Card key={booking.id} className="border-border bg-card shadow-xs hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">{booking.reference}</span>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <span>Pickup: <strong className="text-foreground">{booking.pickup}</strong></span>
                    {booking.destination && <span>To: <strong className="text-foreground">{booking.destination}</strong></span>}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="font-heading text-sm font-bold text-foreground">
                      ₱{Number(booking.estimated_fare).toLocaleString("en-PH")}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      {booking.service_type}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {recentBookings.length > 0 && (
          <div className="flex justify-end">
            <Link href="/dashboard/customer/bookings" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}>
              <span>View All Bookings</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
            </Link>
          </div>
        )}
      </div>

      {/* Show "Become a Rider/Provider" only to customers who haven't applied (Requirement 5) */}
      {(!appStatus.hasAppliedRider || !appStatus.hasAppliedProvider) && (
        <Card className="border-border/80 bg-muted/20">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground">Partner with HitsNaGo</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Earn by providing motorcycle rides or listing rental vehicles across Butuan City.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!appStatus.hasAppliedRider && (
                <Link
                  href="/dashboard/customer/apply/rider"
                  className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold")}
                >
                  Become a Rider
                </Link>
              )}
              {!appStatus.hasAppliedProvider && (
                <Link
                  href="/dashboard/customer/apply/provider"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs font-semibold")}
                >
                  Become a Provider
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
