"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  PackageIcon,
  PinLocation01Icon,
  UserCheck01Icon,
  Key01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { resolveBookingIncident } from "@/lib/actions/cancellations"
import type { BookingIncident } from "@/lib/cancellations/metadata"
import { getAvailableRiders, type Rider } from "@/lib/actions/bookings"

interface AdminIncidentResolutionModalProps {
  incident: BookingIncident | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AdminIncidentResolutionModal({
  incident,
  isOpen,
  onClose,
  onSuccess,
}: AdminIncidentResolutionModalProps) {
  const [adminNotes, setAdminNotes] = React.useState<string>("")
  const [resolutionStatus, setResolutionStatus] = React.useState<"investigating" | "resolved" | "closed">("resolved")
  const [actionChoice, setActionChoice] = React.useState<"none" | "reassign" | "cancel">("none")
  const [availableRiders, setAvailableRiders] = React.useState<Rider[]>([])
  const [selectedRiderId, setSelectedRiderId] = React.useState<string>("")
  const [isLoadingRiders, setIsLoadingRiders] = React.useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const handleClose = () => {
    setAdminNotes("")
    setResolutionStatus("resolved")
    setActionChoice("none")
    setSelectedRiderId("")
    setIsLoadingRiders(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    onClose()
  }

  React.useEffect(() => {
    let isCurrent = true
    const scheduledAt = incident?.booking?.scheduled_at
    if (!isOpen || !scheduledAt) return

    // If booking is pending or needs reassignment, fetch available riders
    getAvailableRiders(scheduledAt)
      .then((r) => {
        if (isCurrent) {
          setAvailableRiders(r)
          setIsLoadingRiders(false)
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.warn("Failed to load riders:", err)
          setIsLoadingRiders(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [isOpen, incident])

  if (!isOpen || !incident) return null

  const isCustody = incident.incident_type === "custody_incident"
  const isRental = incident.incident_type === "rental_incident"
  const isEmergency = incident.severity === "critical" || incident.incident_type === "emergency_report"

  const handleResolve = async () => {
    if (!adminNotes.trim()) {
      setErrorMessage("Please enter dispatch investigation notes or resolution outcome.")
      return
    }

    if (actionChoice === "reassign" && !selectedRiderId) {
      setErrorMessage("Please select a rider to reassign.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const res = await resolveBookingIncident({
      incidentId: incident.id,
      bookingId: incident.booking_id,
      resolutionNotes: adminNotes.trim(),
      status: resolutionStatus,
      reassignRiderId: actionChoice === "reassign" ? selectedRiderId : undefined,
      resultingBookingStatus: actionChoice === "cancel" ? "cancelled" : undefined,
    })

    setIsSubmitting(false)

    if (res.error) {
      setErrorMessage(res.error)
      return
    }

    setSuccessMessage("Incident marked as resolved. Booking status updated.")
    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              isEmergency
                ? "bg-destructive text-white shadow-md shadow-destructive/20"
                : isCustody
                ? "bg-amber-500/10 text-amber-600"
                : "bg-primary/10 text-primary"
            }`}>
              <HugeiconsIcon icon={isEmergency ? Alert01Icon : isCustody ? PackageIcon : isRental ? Key01Icon : Alert01Icon} size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="incident-modal-title" className="font-heading text-base font-bold text-foreground">
                  Incident Investigation & Resolution
                </h3>
                <Badge className={
                  incident.severity === "critical"
                    ? "bg-destructive text-white text-[10px]"
                    : incident.severity === "urgent"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px]"
                    : "bg-muted text-muted-foreground text-[10px]"
                }>
                  {incident.severity.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ticket ID: <span className="font-mono text-foreground font-semibold">{incident.id.slice(0, 18)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Incident Summary Card */}
        <div className="mt-4 rounded-xl border border-border/80 bg-muted/30 p-4 text-xs flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Type: <strong className="text-foreground capitalize">{incident.incident_type.replace(/_/g, " ")}</strong></span>
            <span className="text-muted-foreground">Category: <strong className="text-foreground">{incident.category}</strong></span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reporter: <strong className="text-foreground">{incident.reporter_name} ({incident.reporter_role})</strong></span>
            <span className="text-muted-foreground">Status: <strong className="text-foreground capitalize">{incident.status}</strong></span>
          </div>

          {incident.booking && (
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="font-mono text-primary font-bold">{incident.booking.reference}</span>
              <span className="capitalize">{incident.booking.service_type} • ₱{Number(incident.booking.estimated_fare).toLocaleString("en-PH")}</span>
            </div>
          )}

          {incident.reason && (
            <p className="mt-1 text-foreground">
              <strong>Reported Reason:</strong> {incident.reason}
            </p>
          )}

          {incident.description && (
            <p className="text-muted-foreground italic bg-background/60 p-2 rounded-lg border border-border/40">
              &quot;{incident.description}&quot;
            </p>
          )}

          {incident.location_address && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <HugeiconsIcon icon={PinLocation01Icon} size={13} className="text-primary shrink-0" />
              <span>Location: {incident.location_address}</span>
            </div>
          )}
        </div>

        {/* Custody Warning for Collected Deliveries */}
        {isCustody && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <strong>PARCEL CUSTODY ALERT:</strong> The courier is in physical possession of customer package. Verify safe return-to-sender or courier handover before closing this ticket.
          </div>
        )}

        {/* Active Rental Warning */}
        {isRental && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <strong>ACTIVE VEHICLE HANDOVER:</strong> Renter has vehicle in active possession. Verify roadside towing, mechanic assistance, or early return.
          </div>
        )}

        {/* Resolution Form */}
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Resolution Status
            </label>
            <select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value as "investigating" | "resolved" | "closed")}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="investigating">Under Investigation (Keep Open)</option>
              <option value="resolved">Resolved (Action Taken)</option>
              <option value="closed">Closed / Dismissed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Action on Associated Booking
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={actionChoice === "none" ? "default" : "outline"}
                onClick={() => setActionChoice("none")}
                className="text-xs flex-1"
              >
                No Status Change
              </Button>
              <Button
                type="button"
                size="sm"
                variant={actionChoice === "reassign" ? "default" : "outline"}
                onClick={() => setActionChoice("reassign")}
                className="text-xs flex-1 gap-1"
              >
                <HugeiconsIcon icon={UserCheck01Icon} size={13} />
                Reassign Rider
              </Button>
              <Button
                type="button"
                size="sm"
                variant={actionChoice === "cancel" ? "destructive" : "outline"}
                onClick={() => setActionChoice("cancel")}
                className="text-xs flex-1 gap-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={13} />
                Cancel Booking
              </Button>
            </div>
          </div>

          {actionChoice === "reassign" && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Select Replacement Rider {isLoadingRiders && "(Loading available riders...)"}
              </label>
              <select
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                disabled={isSubmitting || isLoadingRiders}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Choose an available verified rider...</option>
                {availableRiders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.vehicle_model || "Motorcycle"} ({r.plate_number || "No plate"}) • ★{Number(r.rating || 5).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Operator Investigation & Resolution Notes <span className="text-destructive">*</span>
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={isSubmitting}
              placeholder="Record actions taken (e.g. contacted rider by phone, package securely returned to sender, replacement vehicle provided, customer refunded/assisted)..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>

        {/* Feedback messages */}
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
            size="sm"
            onClick={handleResolve}
            disabled={isSubmitting}
            className="text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                <span>Recording Resolution...</span>
              </>
            ) : (
              <span>Confirm Incident Resolution</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
