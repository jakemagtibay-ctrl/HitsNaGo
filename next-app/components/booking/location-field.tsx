"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PinLocation01Icon,
  Search01Icon,
  Cancel01Icon,
  AlertCircleIcon,
  Building01Icon,
  Navigation01Icon,
} from "@hugeicons/core-free-icons"
import {
  BUTUAN_PRESET_LOCATIONS,
  createCustomButuanLocation,
  type ButuanLocationPreset,
} from "@/lib/mock-data/butuan-locations"
import { validateServiceAreaLocation } from "@/lib/config/service-areas"
import { cn } from "@/lib/utils"
import type { LocationAddress } from "@/types/service"

export interface LocationFieldProps {
  id: string
  label: string
  placeholder?: string
  value: LocationAddress | null
  onChange: (location: LocationAddress | null) => void
  error?: string
  required?: boolean
  className?: string
  helperText?: string
}

export function LocationField({
  id,
  label,
  placeholder = "Enter location in Butuan City...",
  value,
  onChange,
  error,
  required,
  className,
  helperText,
}: LocationFieldProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [serviceAreaWarning, setServiceAreaWarning] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Filter preset locations based on search query
  const filteredLocations = React.useMemo(() => {
    if (!query.trim()) return BUTUAN_PRESET_LOCATIONS.slice(0, 6)
    const lower = query.toLowerCase()
    return BUTUAN_PRESET_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(lower) ||
        loc.barangay.toLowerCase().includes(lower) ||
        loc.address.address.toLowerCase().includes(lower)
    )
  }, [query])

  // Handle outside click to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Input change with real-time service-area validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)

    // Check if the user entered an outside city
    const validation = validateServiceAreaLocation(val)
    if (validation.isOutsideServiceArea && validation.message) {
      setServiceAreaWarning(validation.message)
    } else {
      setServiceAreaWarning(null)
    }
  }

  // Handle selection of a preset location
  const handleSelectPreset = (preset: ButuanLocationPreset) => {
    onChange(preset.address)
    setQuery("")
    setServiceAreaWarning(null)
    setIsOpen(false)
  }

  // Handle selection of a custom typed location in Butuan City
  const handleConfirmCustom = () => {
    if (!query.trim()) return
    const validation = validateServiceAreaLocation(query)
    if (validation.isOutsideServiceArea) {
      setServiceAreaWarning(validation.message || "Location outside Butuan City service area.")
      return
    }

    const customLoc = createCustomButuanLocation(query)
    onChange(customLoc)
    setQuery("")
    setServiceAreaWarning(null)
    setIsOpen(false)
  }

  // Handle clear
  const handleClear = () => {
    onChange(null)
    setQuery("")
    setServiceAreaWarning(null)
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)} ref={containerRef}>
      {/* Label and service area badge */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        <span className="text-[10px] font-medium text-primary">
          Within Butuan City
        </span>
      </div>

      {/* Selected Location View */}
      {value ? (
        <div className="relative flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3 transition-colors">
          <div className="flex items-start gap-2.5 overflow-hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <HugeiconsIcon icon={PinLocation01Icon} size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-heading text-xs font-bold text-foreground truncate">
                {value.title || value.address}
              </span>
              <p className="text-[11px] text-muted-foreground truncate">
                {value.address}
              </p>
              {value.landmark && (
                <span className="text-[10px] text-primary/80 mt-0.5">
                  Landmark: {value.landmark}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Change location"
            aria-label="Clear location"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} />
          </button>
        </div>
      ) : (
        /* Search / Input Field */
        <div className="relative">
          <div className="relative flex items-center">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3 text-muted-foreground pointer-events-none"
            />
            <input
              id={id}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className={cn(
                "h-11 w-full rounded-xl border bg-background pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground/70",
                "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all",
                error || serviceAreaWarning ? "border-destructive ring-1 ring-destructive" : "border-border"
              )}
              aria-invalid={Boolean(error || serviceAreaWarning)}
            />
          </div>

          {/* Service Area Warning Banner */}
          {serviceAreaWarning && (
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold">Service Area Restriction</span>
                <p className="text-[11px] mt-0.5 leading-snug">{serviceAreaWarning}</p>
              </div>
            </div>
          )}

          {/* Autocomplete / Preset Dropdown */}
          {isOpen && !serviceAreaWarning && (
            <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Demo Locations — Butuan City
              </div>

              {filteredLocations.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-accent transition-colors"
                >
                  <HugeiconsIcon
                    icon={Building01Icon}
                    size={14}
                    className="shrink-0 text-primary mt-0.5"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      Brgy. {preset.barangay} • {preset.address.landmark || "Butuan City"}
                    </span>
                  </div>
                </button>
              ))}

              {/* Custom typed location fallback */}
              {query.trim().length > 2 && (
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmCustom}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <HugeiconsIcon icon={Navigation01Icon} size={14} />
                    <span className="truncate">Use &quot;{query}&quot; in Butuan City</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Helper text or validation error */}
      {error && !serviceAreaWarning && (
        <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
          <HugeiconsIcon icon={AlertCircleIcon} size={12} />
          <span>{error}</span>
        </p>
      )}
      {!error && !serviceAreaWarning && helperText && (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      )}
    </div>
  )
}
