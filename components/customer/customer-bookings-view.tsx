"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Motorbike01Icon,
  Key01Icon,
  PackageIcon,
  PinLocation01Icon,
  Navigation01Icon,
  Cancel01Icon,
  Alert01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"
import { BookingStatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { CancelBookingDialog } from "@/components/booking/cancel-booking-dialog"
import { EmergencyReportDialog } from "@/components/booking/emergency-report-dialog"
import { CustomerTripTrackingModal } from "@/components/customer/customer-trip-tracking-modal"
import { parseBookingCancellationInfo } from "@/lib/cancellations/metadata"
import { cn } from "@/lib/utils"
import type { Booking } from "@/lib/actions/bookings"

interface CustomerBookingsViewProps {
  initialBookings: Booking[]
}

export function CustomerBookingsView({ initialBookings }: CustomerBookingsViewProps) {
  const router = useRouter()
  const [bookings, setBookings] = React.useState<Booking[]>(initialBookings)
  const [cancellingBooking, setCancellingBooking] = React.useState<Booking | null>(null)
  const [emergencyBooking, setEmergencyBooking] = React.useState<Booking | null>(null)
  const [trackingBooking, setTrackingBooking] = React.useState<Booking | null>(null)

  const [prevInitialBookings, setPrevInitialBookings] = React.useState(initialBookings)

  if (initialBookings !== prevInitialBookings) {
    setPrevInitialBookings(initialBookings)
    setBookings(initialBookings)
  }

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
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
          {bookings.map((booking) => {
            const isCancellable = ["pending", "assigned", "accepted"].includes(booking.status)
            const isInProgress = booking.status === "in_progress"
            const { cleanNotes, cancellation, emergency } = parseBookingCancellationInfo(booking.notes)

            return (
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
                          {booking.service_type} • {new Date(booking.scheduled_at).toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" })}
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

                  {/* Clean Notes if present */}
                  {cleanNotes && (
                    <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/50">
                      <span className="font-semibold text-foreground">Instructions/Details:</span> {cleanNotes}
                    </div>
                  )}

                  {/* Rider info if assigned */}
                  {booking.rider && booking.status !== "cancelled" && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <HugeiconsIcon icon={Motorbike01Icon} size={15} className="text-primary" />
                          {booking.status === "in_progress" ? "Trip in Progress" : "Rider Assigned"}
                        </span>
                        <span className="text-[10px] text-primary font-semibold uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                          {booking.status === "in_progress" ? "En Route" : "Confirmed Rider"}
                        </span>
                      </div>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[11px]">
                        <span>Rider: <strong className="text-foreground">{booking.rider.name}</strong></span>
                        {booking.rider.vehicle_model && <span>• {booking.rider.vehicle_model}</span>}
                        {booking.rider.plate_number && <span>({booking.rider.plate_number})</span>}
                        {booking.rider.rating && <span>• ★{Number(booking.rider.rating).toFixed(2)}</span>}
                      </div>
                    </div>
                  )}

                  {/* Broadcast & Pending notice */}
                  {booking.status === "pending" && !booking.rider && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                          <span className="size-2 rounded-full bg-amber-500 animate-ping inline-block" />
                          <span>Finding a Rider • Waiting for Rider Acceptance</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold uppercase">
                          Broadcasted
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {booking.service_type === "rental"
                          ? "Waiting for rental provider approval — the registered vehicle provider will confirm your reservation."
                          : "Your booking is currently broadcasted to active, verified riders across Butuan City. The first rider to accept will immediately receive your trip assignment. Your request will remain securely queued until claimed."}
                      </p>
                    </div>
                  )}

                  {/* Cancellation Record Banner */}
                  {booking.status === "cancelled" && cancellation && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-xs text-destructive flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                        <span>Cancelled by {cancellation.cancelledBy} ({cancellation.cancelledByRole})</span>
                        <span className="font-normal font-mono text-[10px] text-muted-foreground ml-auto">
                          {new Date(cancellation.cancelledAt).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground mt-0.5">
                        <strong>Reason:</strong> {cancellation.reason}
                        {cancellation.explanation && <span> — &quot;{cancellation.explanation}&quot;</span>}
                      </p>
                    </div>
                  )}

                  {/* Emergency Record Banner */}
                  {emergency && (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Alert01Icon} size={15} />
                        <span><strong>Emergency Dispatched:</strong> {emergency.category} ({emergency.status.toUpperCase()})</span>
                      </div>
                      <span className="font-mono text-[10px]">Ref: {emergency.id}</span>
                    </div>
                  )}

                  {/* Bottom row: Price, Payment & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <div>
                      <span className="font-heading text-base font-bold text-foreground">
                        ₱{Number(booking.estimated_fare).toLocaleString("en-PH")}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 capitalize font-medium">({booking.payment_mode})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Track Route & Map */}
                      {booking.status !== "cancelled" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setTrackingBooking(booking)}
                          className="h-8 text-xs font-semibold gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                        >
                          <HugeiconsIcon icon={Navigation01Icon} size={13} />
                          <span>View Map & Route</span>
                        </Button>
                      )}




                      {/* Direct Message Link */}
                      {(booking.rider || booking.service_type === "rental" || booking.status !== "cancelled") && (
                        <Link
                          href={`/dashboard/customer/inbox?bookingId=${booking.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-2.5 h-8 text-xs font-semibold text-foreground hover:bg-muted transition-colors gap-1.5"
                        >
                          <HugeiconsIcon icon={Mail01Icon} size={13} />
                          <span>Message {booking.service_type === "rental" ? "Provider" : "Rider"}</span>
                        </Link>

                      )}

                      {/* Emergency Report Button for active trip */}
                      {isInProgress && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setEmergencyBooking(booking)}
                          className="h-8 text-xs font-semibold gap-1.5"
                        >
                          <HugeiconsIcon icon={Alert01Icon} size={13} />
                          <span>Report Emergency</span>
                        </Button>
                      )}

                      {/* Cancel Booking Action */}
                      {isCancellable && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCancellingBooking(booking)}
                          className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 font-semibold gap-1.5"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={13} />
                          <span>Cancel Booking</span>
                        </Button>
                      )}

                      {/* Ineligible / Already Cancelled indicator */}
                      {booking.status === "cancelled" && (
                        <span className="text-[11px] text-muted-foreground font-medium italic">
                          Booking Cancelled
                        </span>
                      )}

                      {booking.status === "completed" && (
                        <span className="text-[11px] text-muted-foreground font-medium italic">
                          Trip Completed
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingBooking && (
        <CancelBookingDialog
          booking={cancellingBooking}
          isOpen={!!cancellingBooking}
          onClose={() => setCancellingBooking(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Emergency Report Dialog */}
      {emergencyBooking && (
        <EmergencyReportDialog
          bookingId={emergencyBooking.id}
          bookingReference={emergencyBooking.reference}
          isOpen={!!emergencyBooking}
          onClose={() => setEmergencyBooking(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Trip Tracking & Route Map Modal */}
      {trackingBooking && (
        <CustomerTripTrackingModal
          booking={trackingBooking}
          isOpen={!!trackingBooking}
          onClose={() => setTrackingBooking(null)}
        />
      )}
    </div>
  )
}
