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
  UserGroupIcon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons"
import { requireRole } from "@/lib/auth/roles"
import { getAdminDashboardStats } from "@/lib/actions/admin"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAllBookings } from "@/lib/actions/bookings"
import { AdminOperationsCenter } from "@/components/admin/admin-operations-center"
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

  const [metrics, allBookings] = await Promise.all([
    getAdminDashboardStats(),
    getAllBookings(),
  ])

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Page Header */}
      <AdminPageHeader
        title="Admin Dashboard"
        badgeText="Operations Command"
        description={`Welcome back, ${displayName}. Live monitoring, verification queues, and booking telemetry strictly for Butuan City, Agusan del Norte.`}
      >
        <Link
          href="/dashboard/admin/verification"
          className={cn(buttonVariants({ size: "sm" }), "font-semibold shadow-xs gap-1.5 text-xs")}
        >
          <HugeiconsIcon icon={ShieldCheckIcon} size={15} />
          <span>Review Verifications ({metrics.pendingVerifications})</span>
        </Link>
      </AdminPageHeader>

      {/* 7 Key Metrics Cards - 100% Real Supabase Queries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Registered Users"
          value={metrics.registeredUsers}
          subtitle="Clerk accounts registered"
          icon={UserGroupIcon}
        />
        <AdminStatCard
          title="Active Riders"
          value={metrics.activeRiders}
          subtitle="Verified & active in Butuan City"
          icon={Motorbike01Icon}
          variant="primary"
        />
        <AdminStatCard
          title="Rental Providers"
          value={metrics.activeProviders}
          subtitle="Verified & active fleet hosts"
          icon={Key01Icon}
        />
        <AdminStatCard
          title="Pending Verifications"
          value={metrics.pendingVerifications}
          subtitle="Unverified riders & providers"
          icon={ShieldCheckIcon}
          variant={metrics.pendingVerifications > 0 ? "warning" : "default"}
        />
        <AdminStatCard
          title="Active Live Trips"
          value={metrics.activeLiveTrips}
          subtitle="Accepted or in-progress bookings"
          icon={Car01Icon}
          variant="primary"
        />
        <AdminStatCard
          title="Completed Bookings"
          value={metrics.completedBookings}
          subtitle="Successful dispatches & trips"
          icon={CheckmarkCircle01Icon}
          variant="success"
        />
        <AdminStatCard
          title="Gross Volume"
          value={`₱${metrics.grossVolume.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Sum of completed bookings fare"
          icon={Coins01Icon}
          className="sm:col-span-2 lg:col-span-2"
        />
      </div>

      {/* Butuan City Live Operations & Dispatch Center */}
      <AdminOperationsCenter initialBookings={allBookings} />


      {/* Recent Bookings List (Latest 5) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Recent Bookings
            </h2>
            <p className="text-xs text-muted-foreground">
              Latest 5 bookings recorded across Butuan City services.
            </p>
          </div>
          <Link
            href="/dashboard/admin/bookings"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs gap-1.5")}
          >
            <span>View All Bookings</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </div>

        <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Fare</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {metrics.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <HugeiconsIcon icon={Calendar01Icon} size={28} className="opacity-40" />
                        <p className="font-semibold text-foreground">No bookings recorded yet</p>
                        <p className="text-[11px]">
                          Bookings created by customers will appear here in real time.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  metrics.recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {b.reference}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {b.customerName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {b.customerEmail}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="capitalize text-[10px] font-semibold">
                          {b.serviceType}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col max-w-[220px]">
                          <span className="text-foreground truncate" title={b.pickup}>
                            {b.pickup}
                          </span>
                          {b.destination && (
                            <span className="text-[10px] text-muted-foreground truncate" title={b.destination}>
                              → {b.destination}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        ₱{b.estimatedFare.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4">
                        <AdminStatusBadge status={b.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right text-muted-foreground font-mono text-[11px]">
                        {new Date(b.createdAt).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Manila",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
