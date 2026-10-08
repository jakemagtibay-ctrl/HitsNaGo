import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Motorbike01Icon,
  Key01Icon,
  PackageIcon,
  PinLocation01Icon,
  Navigation01Icon,
} from "@hugeicons/core-free-icons"
import { requireRole } from "@/lib/auth/roles"
import { getCustomerBookings } from "@/lib/actions/bookings"
import { BookingStatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent } from "@/components/ui/card"
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
            All your service requests in Butuan City. Statuses update in real time.
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

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <HugeiconsIcon icon={Calendar01Icon} size={28} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">No bookings yet</h3>
              <p className="text-xs text-muted-foreground mt-1">Your ride, rental, and delivery bookings will appear here.</p>
            </div>
            <Link href="/dashboard/customer/book/ride" className={cn(buttonVariants({ size: "sm" }), "gap-2 font-semibold mt-2")}>
              <HugeiconsIcon icon={Navigation01Icon} size={14} />
              <span>Book Your First Ride</span>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="border-border/80 bg-card shadow-xs hover:border-primary/30 transition-colors">
              <CardContent className="p-5 flex flex-col gap-4">
                {/* Top row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {booking.service_type === "ride" ? (
                        <HugeiconsIcon icon={Motorbike01Icon} size={20} />
                      ) : booking.service_type === "rental" ? (
                        <HugeiconsIcon icon={Key01Icon} size={20} />
                      ) : (
                        <HugeiconsIcon icon={PackageIcon} size={20} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-bold text-foreground">{booking.reference}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {booking.service_type} • {new Date(booking.scheduled_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                      </span>
                    </div>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>

                {/* Route */}
                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon icon={PinLocation01Icon} size={13} className="text-primary shrink-0 mt-0.5" />
                    <span>Pickup: <strong className="text-foreground">{booking.pickup}</strong></span>
                  </div>
                  {booking.destination && (
                    <div className="flex items-start gap-2">
                      <HugeiconsIcon icon={PinLocation01Icon} size={13} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>Destination: <strong className="text-foreground">{booking.destination}</strong></span>
                    </div>
                  )}
                </div>

                {/* Rider info if assigned */}
                {booking.rider && (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                    <span>Assigned Rider: <strong className="text-foreground">{booking.rider.name}</strong></span>
                    {booking.rider.vehicle_model && <span> • {booking.rider.vehicle_model}</span>}
                    {booking.rider.plate_number && <span> ({booking.rider.plate_number})</span>}
                    {booking.rider.rating && <span> • ★{Number(booking.rider.rating).toFixed(2)}</span>}
                  </div>
                )}

                {/* Pending notice */}
                {booking.status === "pending" && !booking.rider && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                    Waiting for rider assignment — the admin will assign a verified rider shortly.
                  </div>
                )}

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="font-heading text-base font-bold text-foreground">
                    ₱{Number(booking.estimated_fare).toLocaleString("en-PH")}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">{booking.payment_mode}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
