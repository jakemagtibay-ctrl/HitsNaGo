"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  AlertCircleIcon,
  Loading03Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cancelBookingByCustomer } from "@/lib/actions/cancellations"
import type { Booking } from "@/lib/actions/bookings"

interface CancelBookingDialogProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const CANCELLATION_REASONS = [
  "Changed my plans",
  "Incorrect pickup or destination",
  "Booked by mistake",
  "Excessive waiting time",
  "Provider or rider unavailable",
  "Other",
]

export function CancelBookingDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: CancelBookingDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<string>(CANCELLATION_REASONS[0])
  const [explanation, setExplanation] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const handleClose = () => {
    setSelectedReason(CANCELLATION_REASONS[0])
    setExplanation("")
    setErrorMessage(null)
    setSuccessMessage(null)
    onClose()
  }

  if (!isOpen) return null

  // Eligibility check
  const isEligible = ["pending", "assigned", "accepted"].includes(booking.status)
  const isInProgress = booking.status === "in_progress"

  const handleConfirmCancel = async () => {
    if (!selectedReason) {
      setErrorMessage("Please select a cancellation reason.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const res = await cancelBookingByCustomer({
      bookingId: booking.id,
      reason: selectedReason,
      explanation: explanation.trim() || undefined,
    })

    setIsSubmitting(false)

    if (res.error) {
      setErrorMessage(res.error)
      return
    }

    setSuccessMessage("Your booking has been cancelled.")
    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </div>
          <div className="flex-1">
            <h3 id="cancel-dialog-title" className="font-heading text-lg font-bold text-foreground">
              Cancel Booking?
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ref: <strong className="font-mono text-foreground">{booking.reference}</strong> •{" "}
              <span className="capitalize">{booking.service_type}</span> (₱{Number(booking.estimated_fare).toLocaleString("en-PH")})
            </p>
          </div>
        </div>

        {/* Warning / Ineligibility Alert */}
        {!isEligible && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cancellation Ineligible</p>
              <p className="mt-0.5">
                {isInProgress
                  ? "This booking is currently in progress. For active trips or in-transit packages, please use Emergency Report or contact dispatch."
                  : `This booking is marked as ${booking.status} and cannot be cancelled.`}
              </p>
            </div>
          </div>
        )}

        {/* Form Body if eligible */}
        {isEligible && (
          <div className="mt-5 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Reason for cancellation <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Additional explanation <span className="text-[11px] font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                disabled={isSubmitting}
                placeholder="Tell us what happened so we can improve our service..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {booking.rider && (
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-[11px] text-muted-foreground">
                Assigned rider <strong>{booking.rider.name}</strong> will be immediately released and notified of your cancellation.
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            {isEligible ? "Never mind" : "Close"}
          </Button>

          {isEligible && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={isSubmitting}
              className="text-xs font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
