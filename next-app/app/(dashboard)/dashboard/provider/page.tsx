import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { currentUser } from "@clerk/nextjs/server"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Key01Icon,
  Coins01Icon,
  Calendar01Icon,
  Analytics01Icon,
  PlusSignIcon,
  PinLocation01Icon,
} from "@hugeicons/core-free-icons"
import { requireRole } from "@/lib/auth/roles"
import { mockProviderStats } from "@/lib/mock-data/stats"
import { mockRentalListings } from "@/lib/mock-data/rental-listings"
import { mockRentalBookings } from "@/lib/mock-data/bookings"
import { StatCard } from "@/components/dashboard/stat-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { ProviderRentalManager } from "@/components/dashboard/provider-rental-manager"
import { VerificationStatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rental Provider Hub - HitsNaGo",
  description: "Vehicle and equipment inventory management, rental requests, and earnings.",
}

export default async function ProviderDashboardPage() {
  await requireRole("provider")
  const clerkUser = await currentUser()

  const displayName =
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    "Bautista Equipment Rentals"

  return (
    <div className="flex flex-col gap-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold border-primary/30 text-primary bg-primary/10">
                Rental Provider Hub
              </Badge>
              <VerificationStatusBadge status="verified" />
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome, <span className="text-primary">{displayName}</span>!
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Manage your fleet of rental vehicles, machinery, and outdoor gear. Track reservations and process customer bookings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/#services"
              className={cn(buttonVariants({ size: "default" }), "gap-2 shadow-xs font-semibold")}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              <span>List New Asset</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Listings"
          value={mockProviderStats.activeListingsCount}
          subtitle="Equipment & vehicles"
          icon={Key01Icon}
        />
        <StatCard
          title="Monthly Revenue"
          value={`₱${mockProviderStats.monthlyEarnings.toLocaleString("en-PH")}`}
          subtitle="Net rental earnings"
          icon={Coins01Icon}
          trend={{ value: "+24%", isPositive: true }}
        />
        <StatCard
          title="Fleet Occupancy"
          value={`${mockProviderStats.occupancyRate}%`}
          subtitle="High asset utilization"
          icon={Analytics01Icon}
          trend={{ value: "Optimal", isPositive: true }}
        />
        <StatCard
          title="Pending Requests"
          value={mockProviderStats.pendingBookingsCount}
          subtitle="Awaiting provider confirmation"
          icon={Calendar01Icon}
        />
      </div>

      {/* Fleet & Listings Showcase */}
      <div id="listings" className="flex flex-col gap-4">
        <SectionHeader
          title="Your Active Rental Fleet & Equipment"
          description="Assets published on the HitsNaGo public directory"
          action={{
            label: "Add Listing",
            href: "/#services",
            icon: PlusSignIcon,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockRentalListings.map((listing) => (
            <Card key={listing.id} className="group overflow-hidden border-border bg-card hover:border-primary/40 transition-all">
              <div className="relative h-40 w-full overflow-hidden bg-muted">
                {/* Image */}
                <Image
                  src={listing.images[0]}
                  alt={listing.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    variant={listing.status === "available" ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      listing.status === "available"
                        ? "bg-emerald-500/90 text-white"
                        : "bg-amber-500/90 text-white border-none"
                    )}
                  >
                    {listing.status}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
                    {listing.category}
                  </span>
                  <h4 className="font-heading text-sm font-semibold text-foreground line-clamp-1 mt-0.5">
                    {listing.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                    <HugeiconsIcon icon={PinLocation01Icon} size={12} className="shrink-0" />
                    <span className="truncate">{listing.pickupAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Rate</span>
                    <span className="font-heading text-sm font-bold text-foreground">
                      ₱{listing.pricePerDay.toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground">/day</span>
                    </span>
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    Deposit: ₱{listing.securityDeposit}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rental Requests & Approvals */}
      <div id="requests" className="flex flex-col gap-4">
        <SectionHeader
          title="Rental Reservations & Incoming Bookings"
          description="Review client reservation dates, security deposits, and handover details"
        />

        <ProviderRentalManager initialBookings={mockRentalBookings} />
      </div>
    </div>
  )
}
