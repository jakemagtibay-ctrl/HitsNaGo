"use client"

// Emergency dialog for reporting accidents, breakdowns, or safety concerns during active trips
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Alert01Icon,
  CallIcon,
  PinLocation01Icon,
  Loading03Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { reportEmergencyIncident } from "@/lib/actions/cancellations"
import { reverseGeocode } from "@/lib/maps/geocode"

interface EmergencyReportDialogProps {
  bookingId: string
  bookingReference: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const EMERGENCY_CATEGORIES = [
  "Accident / Vehicle Collision",
  "Medical / Personal Health Emergency",
  "Vehicle Breakdown / Mechanical Failure",
  "Threat / Harassment / Security Concern",
  "Severe Weather / Impassable Road Hazard",
  "Customer / Recipient Unreachable or Missing",
  "Other Urgent Incident",
]

export function EmergencyReportDialog({
  bookingId,
  bookingReference,
  isOpen,
  onClose,
  onSuccess,
}: EmergencyReportDialogProps) {
  const [category, setCategory] = React.useState<string>(EMERGENCY_CATEGORIES[0])
  const [description, setDescription] = React.useState<string>("")
  const [locationCoords, setLocationCoords] = React.useState<{ lat: number; lng: number } | null>(null)
  const [locationAddress, setLocationAddress] = React.useState<string>("")
  const [isLocating, setIsLocating] = React.useState<boolean>(
    () => typeof window !== "undefined" && "geolocation" in navigator
  )
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const handleClose = () => {
    setCategory(EMERGENCY_CATEGORIES[0])
    setDescription("")
    setIsLocating(typeof window !== "undefined" && "geolocation" in navigator)
    setErrorMessage(null)
    setSuccessMessage(null)
    onClose()
  }

  React.useEffect(() => {
    if (!isOpen) return

    // Try capturing GPS location if allowed
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
          } finally {
            setIsLocating(false)
          }
        },
        () => {
          setIsLocating(false)
        },
        { timeout: 8000 }
      )
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmitEmergency = async () => {
    if (!description.trim()) {
      setErrorMessage("Please describe the emergency incident so dispatch can assist.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const res = await reportEmergencyIncident({
      bookingId,
      category,
      description: description.trim(),
      locationCoords: locationCoords || undefined,
      locationAddress: locationAddress || undefined,
    })

    setIsSubmitting(false)

    if (res.error) {
      setErrorMessage(res.error)
      return
    }

    setSuccessMessage("Urgent incident dispatched to HitsNaGo operations.")
    setTimeout(() => {
      onSuccess?.()
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-dialog-title"
      >
        {/* Urgent Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-destructive text-white shadow-md shadow-destructive/20 animate-pulse">
            <HugeiconsIcon icon={Alert01Icon} size={22} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 id="emergency-dialog-title" className="font-heading text-lg font-bold text-destructive">
                Report Urgent Incident / Emergency
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ref: <strong className="font-mono text-foreground">{bookingReference}</strong> • Immediate Alert to HitsNaGo Dispatch
            </p>
          </div>
        </div>

        {/* Local Emergency Services Disclaimer Banner */}
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <HugeiconsIcon icon={CallIcon} size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">CRITICAL SAFETY DIRECTIVE:</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                This form transmits an urgent dispatch alert to HitsNaGo operations operators. It does <strong>NOT</strong> automatically notify PNP (Police), BFP (Fire), or 911. If you or anyone else is in immediate danger or injured, call local Butuan City Emergency Hotlines first:
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono font-bold">
                <span className="bg-amber-500/20 px-2 py-0.5 rounded-md">Emergency: 911</span>
                <span className="bg-amber-500/20 px-2 py-0.5 rounded-md">CDRRMO Butuan: 0917-700-1111</span>
                <span className="bg-amber-500/20 px-2 py-0.5 rounded-md">PNP Butuan: 0998-598-7264</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Form */}
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Incident Category <span className="text-destructive">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30"
            >
              {EMERGENCY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Incident Details & Situation <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="State what occurred, who is affected, current vehicle condition, and what assistance is required immediately..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
            />
          </div>

          {/* Location Badge */}
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={PinLocation01Icon} size={15} className="text-primary shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-foreground block">
                  {isLocating ? "Acquiring GPS location..." : locationAddress ? "Incident Location Attached" : "Location Not Available"}
                </span>
                {locationAddress && <span className="text-[10px] text-muted-foreground block line-clamp-1">{locationAddress}</span>}
              </div>
            </div>
            {isLocating && <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin text-muted-foreground" />}
          </div>
        </div>

        {/* Error / Success feedback */}
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
            onClick={handleSubmitEmergency}
            disabled={isSubmitting}
            className="text-xs font-semibold gap-1.5"
          >
            {isSubmitting ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                <span>Transmitting Alert...</span>
              </>
            ) : (
              <span>Dispatch Emergency Report</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
