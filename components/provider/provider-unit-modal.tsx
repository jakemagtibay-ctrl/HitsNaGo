"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ToolsIcon,
  CheckmarkCircle01Icon,
  Calendar01Icon,
  Loading03Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import type { RentalUnit, UnitStatus } from "@/types/rental"
import { updateUnitStatus } from "@/lib/actions/rentals"

interface ProviderUnitModalProps {
  unit: RentalUnit | null
  listingTitle?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedUnit: RentalUnit) => void
}

export function ProviderUnitModal({
  unit,
  listingTitle,
  isOpen,
  onClose,
  onSuccess,
}: ProviderUnitModalProps) {
  const [status, setStatus] = React.useState<UnitStatus>(unit?.status || "available")
  const [maintStart, setMaintStart] = React.useState<string>(
    unit?.maintenanceStart ? unit.maintenanceStart.split("T")[0] : ""
  )
  const [maintEnd, setMaintEnd] = React.useState<string>(
    unit?.maintenanceEnd ? unit.maintenanceEnd.split("T")[0] : ""
  )
  const [maintReason, setMaintReason] = React.useState<string>(unit?.maintenanceReason || "")
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  if (!isOpen || !unit) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    if (status === "maintenance") {
      if (maintStart && maintEnd && new Date(maintEnd) < new Date(maintStart)) {
        setErrorMessage("Maintenance end date cannot be earlier than start date.")
        setIsSubmitting(false)
        return
      }
    }

    const res = await updateUnitStatus({
      unitId: unit.id,
      status,
      maintenanceStart: status === "maintenance" && maintStart ? new Date(maintStart).toISOString() : undefined,
      maintenanceEnd: status === "maintenance" && maintEnd ? new Date(maintEnd).toISOString() : undefined,
      maintenanceReason: status === "maintenance" ? maintReason.trim() : undefined,
    })

    setIsSubmitting(false)

    if (!res.success || res.error) {
      setErrorMessage(res.error || "Failed to update unit inventory status.")
      return
    }

    setSuccessMessage("Unit availability status successfully updated!")
    if (res.unit) {
      setTimeout(() => {
        onSuccess(res.unit!)
        onClose()
      }, 1000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unit-modal-title"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={ToolsIcon} size={20} />
          </div>
          <div className="flex-1">
            <h3 id="unit-modal-title" className="font-heading text-lg font-bold text-foreground">
              Manage Vehicle Unit Status
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {listingTitle || "Rental Vehicle"} • <strong className="text-foreground">{unit.unitIdentifier}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-5 flex flex-col gap-4">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Unit Operational Status <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus("available")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  status === "available"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                ✓ Available
              </button>

              <button
                type="button"
                onClick={() => setStatus("maintenance")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  status === "maintenance"
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                🛠 Maintenance
              </button>

              <button
                type="button"
                onClick={() => setStatus("unavailable")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  status === "unavailable"
                    ? "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                ✕ Unavailable
              </button>
            </div>
          </div>

          {/* Maintenance Options (only if maintenance selected) */}
          {status === "maintenance" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 flex flex-col gap-3 text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <HugeiconsIcon icon={ToolsIcon} size={14} />
                Maintenance Schedule & Reason
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="maint-start" className="text-[11px] font-semibold text-foreground">
                    Start Date
                  </label>
                  <div className="relative">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      size={14}
                      className="absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none"
                    />
                    <input
                      id="maint-start"
                      type="date"
                      value={maintStart}
                      onChange={(e) => setMaintStart(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="maint-end" className="text-[11px] font-semibold text-foreground">
                    Estimated Completion Date
                  </label>
                  <div className="relative">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      size={14}
                      className="absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none"
                    />
                    <input
                      id="maint-end"
                      type="date"
                      value={maintEnd}
                      min={maintStart}
                      onChange={(e) => setMaintEnd(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="maint-reason" className="text-[11px] font-semibold text-foreground">
                  Maintenance Reason / Notes
                </label>
                <input
                  id="maint-reason"
                  type="text"
                  value={maintReason}
                  onChange={(e) => setMaintReason(e.target.value)}
                  placeholder="e.g. Scheduled 20k PMS, brake pad replacement, AC repair..."
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Unavailable Notice */}
          {status === "unavailable" && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-muted-foreground">
              Marking this unit as <strong className="text-foreground">Unavailable</strong> temporarily removes it from customer search availability. Other eligible units of this model will remain rentable.
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium flex items-start gap-2">
              <HugeiconsIcon icon={Alert01Icon} size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                  <span>Saving Status...</span>
                </>
              ) : (
                <span>Update Unit Status</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
