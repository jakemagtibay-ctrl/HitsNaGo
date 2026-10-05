import * as React from "react"
import Link from "next/link"
import { currentUser } from "@clerk/nextjs/server"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShieldCheckIcon,
  Coins01Icon,
  Car01Icon,
  Motorbike01Icon,
  Key01Icon,
  PackageIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { requireRole } from "@/lib/auth/roles"
import {
  MOCK_ADMIN_USERS,
  MOCK_ADMIN_VERIFICATIONS,
  MOCK_ADMIN_BOOKINGS,
  MOCK_ADMIN_DISPUTES,
} from "@/lib/mock-data/admin-data"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { AdminChartCard } from "@/components/admin/admin-chart-card"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard - HitsNaGo",
  description: "Central command center for HitsNaGo operations in Butuan City, Agusan del Norte.",
}

export default async function AdminDashboardOverviewPage() {
  await requireRole("admin")
  const clerkUser = await currentUser()

  const displayName =
    clerkUser?.fullName || clerkUser?.firstName || "System Administrator"

  // Computed metrics from authentic Butuan City mock datasets
  const totalUsers = MOCK_ADMIN_USERS.length
  const activeRiders = MOCK_ADMIN_USERS.filter((u) => u.role === "rider" && u.accountStatus === "active").length
  const rentalProviders = MOCK_ADMIN_USERS.filter((u) => u.role === "provider").length
  const pendingVerifications = MOCK_ADMIN_VERIFICATIONS.filter((v) => v.status === "pending").length
  const activeBookings = MOCK_ADMIN_BOOKINGS.filter((b) => b.status === "active" || b.status === "assigned").length
  const completedBookings = MOCK_ADMIN_BOOKINGS.filter((b) => b.status === "completed").length
  const totalRevenue = MOCK_ADMIN_BOOKINGS.filter((b) => b.status === "completed" || b.status === "active")
    .reduce((sum, b) => sum + b.totalAmount, 0)
  const openDisputes = MOCK_ADMIN_DISPUTES.filter((d) => d.status === "open" || d.status === "under_review").length

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Page Header with Service Area & Operational Status */}
      <AdminPageHeader
        title="Admin Dashboard"
        badgeText="Operations Command"
        description={`Welcome back, ${displayName}. Real-time monitoring, verification queues, and booking telemetry strictly for Butuan City, Agusan del Norte.`}
      >
        <Link
          href="/dashboard/admin/verification"
          className={cn(buttonVariants({ size: "sm" }), "font-semibold shadow-xs gap-1.5 text-xs")}
        >
          <HugeiconsIcon icon={ShieldCheckIcon} size={15} />
          <span>Review Verifications ({pendingVerifications})</span>
        </Link>
      </AdminPageHeader>

      {/* Top 8 Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Registered Users"
          value={totalUsers}
          subtitle="Customers, riders, providers in Butuan"
          icon={UserGroupIcon}
          trend={{ value: "+14% MoM", isPositive: true }}
        />
        <AdminStatCard
          title="Active Riders"
          value={activeRiders}
          subtitle="Verified & online in Butuan City"
          icon={Motorbike01Icon}
          variant="primary"
          trend={{ value: "98% compliance", isPositive: true }}
        />
        <AdminStatCard
          title="Rental Providers"
          value={rentalProviders}
          subtitle="Fleet & equipment hosts"
          icon={Key01Icon}
        />
        <AdminStatCard
          title="Pending Verifications"
          value={pendingVerifications}
          subtitle="Requires admin approval"
          icon={ShieldCheckIcon}
          variant="warning"
          trend={{ value: "Action Required", isPositive: false }}
        />
        <AdminStatCard
          title="Active Live Trips"
          value={activeBookings}
          subtitle="In transit across Butuan"
          icon={Car01Icon}
          variant="success"
          trend={{ value: "Real-time dispatch", isPositive: true }}
        />
        <AdminStatCard
          title="Completed Bookings"
          value={completedBookings}
          subtitle="Successfully finalized trips"
          icon={CheckmarkCircle01Icon}
        />
        <AdminStatCard
          title="Gross Platform Volume"
          value={`₱${totalRevenue.toLocaleString("en-PH")}`}
          subtitle="PHP transactions volume"
          icon={Coins01Icon}
          variant="primary"
          trend={{ value: "+22% this week", isPositive: true }}
        />
        <AdminStatCard
          title="Open Disputes"
          value={openDisputes}
          subtitle="Customer/driver mediation"
          icon={AlertCircleIcon}
          variant={openDisputes > 0 ? "warning" : "default"}
        />
      </div>

      {/* Visual Analytics Sections: Booking Activity & Service Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking Activity Chart */}
        <div className="lg:col-span-8">
          <AdminChartCard
            title="Weekly Booking Activity (Butuan City)"
            subtitle="Trips dispatched across Ride, Rental, and Courier services"
            type="bar"
            unit=""
            totalDisplay="128 Trips"
            data={[
              { label: "Mon", value: 16 },
              { label: "Tue", value: 14 },
              { label: "Wed", value: 19 },
              { label: "Thu", value: 21 },
              { label: "Fri", value: 28 },
              { label: "Sat", value: 30 },
              { label: "Sun", value: 22 },
            ]}
          />
        </div>

        {/* Service Distribution Chart */}
        <div className="lg:col-span-4">
          <AdminChartCard
            title="Service Volume Split"
            subtitle="Distribution by service type in Butuan"
            type="distribution"
            unit="₱"
            totalDisplay="₱15,705"
            data={[
              { label: "Express Ride", value: 6800, secondaryValue: "52% (₱6.8k)" },
              { label: "Vehicle & Tool Rentals", value: 7100, secondaryValue: "38% (₱7.1k)" },
              { label: "Courier Delivery", value: 1805, secondaryValue: "10% (₱1.8k)" },
            ]}
          />
        </div>
      </div>

      {/* Operational Grids: Recent Bookings & Verification Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings Table */}
        <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Recent Booking Operations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Live dispatch across Butuan City barangays
                </p>
              </div>

              <Link
                href="/dashboard/admin/bookings"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              {MOCK_ADMIN_BOOKINGS.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {booking.serviceType === "ride" ? (
                        <HugeiconsIcon icon={Motorbike01Icon} size={16} />
                      ) : booking.serviceType === "rental" ? (
                        <HugeiconsIcon icon={Key01Icon} size={16} />
                      ) : (
                        <HugeiconsIcon icon={PackageIcon} size={16} />
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {booking.id}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          {booking.serviceType}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {booking.customerName} • {booking.pickupAddress}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <AdminStatusBadge status={booking.status} />
                    <span className="font-heading text-xs font-bold text-foreground">
                      ₱{booking.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification Queue & Safety Requests */}
        <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Pending Verification Queue
                </h3>
                <p className="text-xs text-muted-foreground">
                  Credentials awaiting identity & vehicle review
                </p>
              </div>

              <Link
                href="/dashboard/admin/verification"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Full Queue</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              {MOCK_ADMIN_VERIFICATIONS.slice(0, 4).map((verif) => (
                <div
                  key={verif.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <HugeiconsIcon icon={ShieldCheckIcon} size={16} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-xs font-bold text-foreground truncate">
                          {verif.userName}
                        </span>
                        <span className="text-[10px] font-semibold text-primary uppercase">
                          {verif.userRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {verif.documentType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <AdminStatusBadge status={verif.status} />
                    <Link
                      href="/dashboard/admin/verification"
                      className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Disputes Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">
              Disputes & Safety Escalations
            </h3>
            <p className="text-xs text-muted-foreground">
              Customer, driver, and provider mediation issues in Butuan City
            </p>
          </div>
          <Link
            href="/dashboard/admin/disputes"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Manage Disputes</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_ADMIN_DISPUTES.map((dispute) => (
            <Card key={dispute.id} className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">
                    #{dispute.bookingId}
                  </span>
                  <AdminStatusBadge status={dispute.status} />
                </div>

                <div className="flex flex-col gap-1">
                  <h4 className="font-heading text-xs font-bold text-foreground line-clamp-1">
                    {dispute.issue}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    Parties: {dispute.customerName} vs {dispute.partyName} ({dispute.partyRole})
                  </p>
                </div>

                <div className="mt-1 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="font-heading font-bold text-foreground">
                    ₱{dispute.amount.toLocaleString()} disputed
                  </span>
                  <Link
                    href="/dashboard/admin/disputes"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Investigate →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
