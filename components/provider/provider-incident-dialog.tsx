"use client"

// Dialog allowing rental providers to report vehicle breakdown or cancel a booking with valid reason
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Alert01Icon,
  Cancel01Icon,
  Key01Icon,
  Loading03Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cancelRentalByProvider } from "@/lib/actions/cancellations"
import type { Booking } from "@/lib/actions/bookings"

interface ProviderIncidentDialogProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PROVIDER_REASONS = [
  "Vehicle or equipment breakdown",
  "Rental item unavailable or damaged",
  "Safety issue",
  "Unexpected maintenance",
  "Personal emergency",
  "Other legitimate reason",
]

export function ProviderIncidentDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: ProviderIncidentDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<string>(PROVIDER_REASONS[0])
  const [explanation, setExplanation] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const isInProgress = booking.status === "in_progress"

  const handleClose = () => {
    setSelectedReason(PROVIDER_REASONS[0])
    setExplanation("")
    setErrorMessage(null)
    setSuccessMessage(null)
    onClose()
  }

  if (!isOpen) return null

  const handleCancelRental = async () => {
    if (!selectedReason) {
      setErrorMessage("Please select a reason.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const res = await cancelRentalByProvider({
      bookingId: booking.id,
      reason: selectedReason,
      explanation: explanation.trim() || undefined,
    })

    setIsSubmitting(false)

    if (res.error) {
      setErrorMessage(res.error)
      return
    }

    if (isInProgress) {
      setSuccessMessage("Active rental incident reported. Dispatch will assist with roadside or early return.")
    } else {
      setSuccessMessage("Rental reservation cancelled. Vehicle calendar availability has been released.")
    }

    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <HugeiconsIcon icon={isInProgress ? Alert01Icon : Cancel01Icon} size={20} />
          </div>
          <div className="flex-1">
            <h3 id="provider-dialog-title" className="font-heading text-lg font-bold text-foreground">
              {isInProgress ? "Report Rental Breakdown / Issue" : "Cancel Rental Reservation"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ref: <strong className="font-mono text-foreground">{booking.reference}</strong> • Renter: {booking.customer_name}
            </p>
          </div>
        </div>

        {/* Warning if in progress */}
        {isInProgress ? (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <HugeiconsIcon icon={Key01Icon} size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">ACTIVE HANDOVER NOTICE:</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                The customer has already taken handover of this rental vehicle. Reporting an issue alerts operations dispatch to coordinate roadside support, vehicle towing, or safe early return.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Cancelling this upcoming booking releases the vehicle on the availability calendar so other customers can book it. The customer will be informed immediately.
          </div>
        )}

        {/* Form */}
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Reason <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20"
            >
              {PROVIDER_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Description / Notes <span className="text-[11px] font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              disabled={isSubmitting}
              placeholder="State vehicle condition, maintenance requirement, or reason for unavailability..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20 resize-none"
            />
          </div>
        </div>

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

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleCancelRental}
            disabled={isSubmitting}
            className="text-xs font-semibold gap-1.5"
          >
            {isSubmitting ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isInProgress ? "Flag Active Rental Incident" : "Confirm Cancellation"}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
