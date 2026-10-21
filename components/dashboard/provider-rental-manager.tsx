"use client"

// Dashboard widget for rental providers to quickly approve, reject, or mark rental bookings completed
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { BookingStatusBadge } from "./status-badge"
import { cn } from "@/lib/utils"
import type { RentalBooking } from "@/types/rental"

interface ProviderRentalManagerProps {
  initialBookings: RentalBooking[]
}

export function ProviderRentalManager({ initialBookings }: ProviderRentalManagerProps) {
  const [bookings, setBookings] = React.useState<RentalBooking[]>(initialBookings)
  const [feedback, setFeedback] = React.useState<string | null>(null)

  const handleStatusChange = (id: string, newStatus: RentalBooking["status"]) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    )
    setFeedback(`Booking #${id.slice(-6).toUpperCase()} updated to ${newStatus}.`)
    setTimeout(() => setFeedback(null), 5000)
  }

  return (
    <div className="flex flex-col gap-4">
      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((booking) => {
          const isPending = booking.status === "pending"

          return (
            <Card key={booking.id} className="border-border bg-card">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{booking.id.slice(-6).toUpperCase()}
                    </span>
                    <BookingStatusBadge status={booking.status} />
                  </div>

                  <div>
                    <h4 className="font-heading text-sm font-semibold text-foreground">
                      Rental Request • {booking.durationDays} Day{booking.durationDays > 1 ? "s" : ""}
                    </h4>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-primary" />
                      <span>{booking.startDate} → {booking.endDate}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <strong className="text-foreground">₱{booking.totalAmount.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Deposit Status:</span>
                      <span className="capitalize text-foreground font-medium">{booking.depositStatus} (₱{booking.securityDeposit?.toLocaleString() || 0})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Handover:</span>
                      <span className="capitalize text-foreground font-medium">{booking.handoverMethod}</span>
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(booking.id, "cancelled")}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "text-xs gap-1 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={13} />
                      <span>Decline</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(booking.id, "confirmed")}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "text-xs font-semibold gap-1 shadow-xs"
                      )}
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
                      <span>Approve</span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
