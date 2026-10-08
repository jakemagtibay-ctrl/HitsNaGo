"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  PinLocation01Icon,
  CheckmarkCircle01Icon,
  PlayIcon,
  Calendar01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Booking, Rider, BookingStatus } from "@/lib/actions/bookings"
import { updateBookingStatus } from "@/lib/actions/bookings"
import { useRouter } from "next/navigation"

interface RiderBookingsViewProps {
  rider: Rider
  initialBookings: Booking[]
  viewMode?: "active" | "history"
}

export function RiderBookingsView({
  rider,
  initialBookings,
  viewMode = "active",
}: RiderBookingsViewProps) {
  const router = useRouter()
  const [bookings, setBookings] = React.useState<Booking[]>(initialBookings)
  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const activeBookings = bookings.filter((b) =>
    ["assigned", "accepted", "in_progress"].includes(b.status)
  )
  const historyBookings = bookings.filter((b) =>
    ["completed", "cancelled"].includes(b.status)
  )

  const currentList = viewMode === "history" ? historyBookings : activeBookings

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    setLoadingId(bookingId)
    setErrorMessage(null)

    const { error } = await updateBookingStatus(bookingId, newStatus)
    if (error) {
      setErrorMessage(error)
      setLoadingId(null)
      return
    }

    // Optimistically update
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    )
    setLoadingId(null)
    router.refresh()
  }

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "assigned":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Assigned</Badge>
      case "accepted":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Accepted</Badge>
      case "in_progress":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">In Progress</Badge>
      case "completed":
        return <Badge className="bg-muted text-muted-foreground border-border">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs text-muted-foreground -mt-2">
        Active Terminal: <strong className="text-foreground">{rider.name}</strong> • {rider.vehicle_model || "Motorcycle"} ({rider.plate_number || "Verified"})
      </div>
      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          {errorMessage}
        </div>
      )}

      {currentList.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
              <HugeiconsIcon icon={Motorbike01Icon} size={28} />
            </div>
            <h3 className="font-heading text-base font-bold text-foreground">
              {viewMode === "history" ? "No Past Trips Yet" : "No Active Assignments"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {viewMode === "history"
                ? "Your completed and cancelled trips will be archived here."
                : "You currently have no dispatched rides waiting. When an admin dispatches a ride to you, it will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((booking) => {
            const isLoading = loadingId === booking.id

            return (
              <Card
                key={booking.id}
                className="border-border/80 bg-card shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 flex flex-col gap-4">
                  {/* Top: Reference and Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-primary">
                        {booking.reference}
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        Customer: {booking.customer_name}
                      </span>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Route */}
                  <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 text-xs">
                    <div className="flex items-start gap-2">
                      <HugeiconsIcon icon={PinLocation01Icon} size={15} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Pickup</span>
                        <span className="font-semibold text-foreground">{booking.pickup}</span>
                      </div>
                    </div>
                    {booking.destination && (
                      <div className="flex items-start gap-2 pt-2 border-t border-border/40">
                        <HugeiconsIcon icon={PinLocation01Icon} size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Destination</span>
                          <span className="font-semibold text-foreground">{booking.destination}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Schedule & Fare */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <HugeiconsIcon icon={Calendar01Icon} size={13} />
                      <span>{new Date(booking.scheduled_at).toLocaleString("en-PH")}</span>
                    </div>
                    <div className="font-mono font-bold text-foreground">
                      ₱{Number(booking.estimated_fare).toLocaleString("en-PH")}
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded-lg">
                      &quot;{booking.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Actions */}
                {viewMode === "active" && (
                  <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center gap-2">
                    {booking.status === "assigned" && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 text-xs gap-1"
                          onClick={() => handleStatusChange(booking.id, "accepted")}
                          disabled={isLoading}
                        >
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                          {isLoading ? "Updating..." : "Accept Ride"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleStatusChange(booking.id, "cancelled")}
                          disabled={isLoading}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={14} />
                          Decline
                        </Button>
                      </>
                    )}

                    {booking.status === "accepted" && (
                      <Button
                        size="sm"
                        className="w-full text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleStatusChange(booking.id, "in_progress")}
                        disabled={isLoading}
                      >
                        <HugeiconsIcon icon={PlayIcon} size={14} />
                        {isLoading ? "Updating..." : "Start Trip"}
                      </Button>
                    )}

                    {booking.status === "in_progress" && (
                      <Button
                        size="sm"
                        className="w-full text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                        onClick={() => handleStatusChange(booking.id, "completed")}
                        disabled={isLoading}
                      >
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                        {isLoading ? "Updating..." : "Complete Trip"}
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
