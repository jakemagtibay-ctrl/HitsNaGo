"use client"

// Dialog allowing riders to report on-road incidents, withdraw from an assigned trip, and request dispatch reassignment
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Alert01Icon,
  Cancel01Icon,
  PackageIcon,
  PinLocation01Icon,
  Loading03Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { withdrawRiderAssignment } from "@/lib/actions/cancellations"
import { reverseGeocode } from "@/lib/maps/geocode"
import type { Booking } from "@/lib/actions/bookings"

interface RiderIncidentDialogProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const RIDER_REASONS = [
  "Vehicle breakdown",
  "Medical or personal emergency",
  "Unsafe road or weather conditions",
  "Accident or unexpected obstruction",
  "Customer unreachable",
  "Other emergency",
]

export function RiderIncidentDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: RiderIncidentDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<string>(RIDER_REASONS[0])
  const [explanation, setExplanation] = React.useState<string>("")
  const [isEmergency, setIsEmergency] = React.useState<boolean>(false)
  const [locationCoords, setLocationCoords] = React.useState<{ lat: number; lng: number } | null>(null)
  const [locationAddress, setLocationAddress] = React.useState<string>("")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const isInProgress = booking.status === "in_progress"
  const isDelivery = booking.service_type === "delivery"

  const handleClose = () => {
    setSelectedReason(RIDER_REASONS[0])
    setExplanation("")
    setIsEmergency(isInProgress)
    setErrorMessage(null)
    setSuccessMessage(null)
    onClose()
  }

  React.useEffect(() => {
    if (!isOpen) return

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLocationCoords(coords)
          try {
            const rev = await reverseGeocode(coords.lat, coords.lng)
            setLocationAddress(rev.address)
          } catch {
            setLocationAddress(`GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
          }
        },
        () => {},
        { timeout: 7000 }
      )
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleWithdraw = async () => {
    if (!selectedReason) {
      setErrorMessage("Please select a reason.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const res = await withdrawRiderAssignment({
      bookingId: booking.id,
      reason: selectedReason,
      explanation: explanation.trim() || undefined,
      isEmergency,
      locationCoords: locationCoords || undefined,
      locationAddress: locationAddress || undefined,
    })

    setIsSubmitting(false)

    if (res.error) {
      setErrorMessage(res.error)
      return
    }

    if (res.isReassigned) {
      setSuccessMessage("Assignment withdrawn. Booking returned to dispatch for reassignment.")
    } else {
      setSuccessMessage("Urgent in-transit incident logged. Dispatch has been alerted.")
    }

    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rider-incident-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <HugeiconsIcon icon={isInProgress ? Alert01Icon : Cancel01Icon} size={20} />
          </div>
          <div className="flex-1">
            <h3 id="rider-incident-dialog-title" className="font-heading text-lg font-bold text-foreground">
              {isInProgress ? "Report In-Transit Emergency" : "Withdraw from Assignment"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ref: <strong className="font-mono text-foreground">{booking.reference}</strong> • Customer: {booking.customer_name}
            </p>
          </div>
        </div>

        {/* Parcel Custody Warning for Delivery */}
        {isInProgress && isDelivery && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <HugeiconsIcon icon={PackageIcon} size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">PARCEL CUSTODY DIRECTIVE:</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                You have already collected this parcel. Do not leave the item unattended. Reporting an emergency immediately alerts Admin Dispatch to coordinate a replacement rider handover or safe return to sender.
              </p>
            </div>
          </div>
        )}

        {/* Pre-trip reassurance */}
        {!isInProgress && (
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Withdrawing releases you from this booking. The customer&apos;s request remains valid and will be immediately returned to the admin queue for reassignment to another rider.
          </div>
        )}

        {/* Form */}
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Reason for withdrawal / emergency <span className="text-destructive">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20"
            >
              {RIDER_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Details & explanation <span className="text-[11px] font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              disabled={isSubmitting}
              placeholder="Provide context (e.g. flat tire at Montilla Blvd, heavy flood on JC Aquino, customer phone unanswered for 15 mins)..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20 resize-none"
            />
          </div>

          {locationAddress && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/60">
              <HugeiconsIcon icon={PinLocation01Icon} size={14} className="text-primary shrink-0" />
              <span className="truncate text-[11px]">Report location: {locationAddress}</span>
            </div>
          )}
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
            onClick={handleWithdraw}
            disabled={isSubmitting}
            className="text-xs font-semibold gap-1.5"
          >
            {isSubmitting ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isInProgress ? "Transmit Incident Report" : "Confirm Withdrawal"}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
