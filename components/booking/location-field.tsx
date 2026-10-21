"use client"

// Address input component with real-time Butuan City place suggestions and modal picker trigger
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  PinLocation01Icon,
  Search01Icon,
  Cancel01Icon,
  AlertCircleIcon,
  Building01Icon,
  Navigation01Icon,
  Location01Icon,
  Edit01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { searchAddress, reverseGeocode, type GeocodeResult } from "@/lib/maps/geocode"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { validateServiceAreaLocation } from "@/lib/config/service-areas"
import { LocationPickerModal } from "@/components/booking/location-picker-modal"
import type { LocationData } from "@/types/location"
import { normalizeLocationData } from "@/types/location"
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
  onPinOnMapClick?: () => void
  isPinningOnMap?: boolean
  roleType?: "pickup" | "destination" | "general"
}

export function LocationField({
  id,
  label,
  placeholder = "Enter street address, establishment, or landmark...",
  value,
  onChange,
  error,
  required,
  className,
  helperText,
  onPinOnMapClick,
  isPinningOnMap,
  roleType = "pickup",
}: LocationFieldProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<GeocodeResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isLocating, setIsLocating] = React.useState(false)
  const [serviceAreaWarning, setServiceAreaWarning] = React.useState<string | null>(null)
  const [geocodeNotFound, setGeocodeNotFound] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  // Default quick recommendations when input is empty
  const defaultRecommendations: GeocodeResult[] = React.useMemo(() => {
    return BUTUAN_PRESET_LOCATIONS.slice(0, 6).map((p) => ({
      id: `rec-${p.id}`,
      placeName: p.name,
      formattedAddress: p.address.formattedAddress || p.address.address,
      displayName: `${p.name}, Brgy. ${p.barangay}, Butuan City`,
      title: p.name,
      lat: p.address.coordinates.lat,
      lng: p.address.coordinates.lng,
      address: p.address.address,
      barangay: p.barangay,
      city: "Butuan City",
      province: "Agusan del Norte",
      isPreset: true,
    }))
  }, [])

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

  // Debounced real-time geocoding search
  React.useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      Promise.resolve().then(() => {
        setSuggestions(defaultRecommendations)
        setIsSearching(false)
        setGeocodeNotFound(false)
      })
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    Promise.resolve().then(() => {
      setIsSearching(true)
      setGeocodeNotFound(false)
    })

    const timer = setTimeout(async () => {
      try {
        const results = await searchAddress(query, controller.signal)
        if (!controller.signal.aborted) {
          setSuggestions(results)
          setGeocodeNotFound(results.length === 0)
          setIsSearching(false)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.warn("[LocationField] Geocoding query failed:", err)
          setIsSearching(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, defaultRecommendations])

  // Handle text input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)

    const validation = validateServiceAreaLocation(val)
    if (validation.isOutsideServiceArea && validation.message) {
      setServiceAreaWarning(validation.message)
    } else {
      setServiceAreaWarning(null)
    }
  }

  // Handle selection of a geocoded suggestion
  const handleSelectSuggestion = (item: GeocodeResult) => {
    const locAddress: LocationAddress = {
      title: item.placeName || item.title,
      placeName: item.placeName || item.title,
      address: item.formattedAddress || item.address || item.displayName,
      formattedAddress: item.formattedAddress || item.address || item.displayName,
      landmark: item.barangay ? `Brgy. ${item.barangay}` : undefined,
      barangay: item.barangay,
      city: item.city || "Butuan City",
      province: item.province || "Agusan del Norte",
      country: item.country || "Philippines",
      postalCode: item.postalCode || "8600",
      providerPlaceId: item.providerPlaceId || item.id,
      coordinates: {
        lat: item.lat,
        lng: item.lng,
      },
      isVerifiedPreset: Boolean(item.isPreset),
    }

    onChange(locAddress)
    setQuery("")
    setIsOpen(false)
    setServiceAreaWarning(null)
    setGeocodeNotFound(false)
  }

  // Handle "Use My Current Location" via browser GPS and reverse geocoding
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        try {
          const rev = await reverseGeocode(lat, lng)
          const locAddress: LocationAddress = {
            title: rev.placeName || rev.title || "My Current Location",
            placeName: rev.placeName || rev.title || "My Current Location",
            address: rev.formattedAddress || rev.address,
            formattedAddress: rev.formattedAddress || rev.address,
            landmark: rev.barangay ? `Brgy. ${rev.barangay}` : undefined,
            barangay: rev.barangay,
            city: rev.city || "Butuan City",
            province: rev.province || "Agusan del Norte",
            country: rev.country || "Philippines",
            postalCode: rev.postalCode || "8600",
            providerPlaceId: rev.providerPlaceId,
            coordinates: { lat, lng },
            isVerifiedPreset: rev.isVerifiedPreset,
          }
          onChange(locAddress)
          setQuery("")
          setIsOpen(false)
          setServiceAreaWarning(null)
        } catch {
          onChange({
            title: "My Current Location",
            placeName: "My Current Location",
            address: `Current GPS Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            formattedAddress: `Current GPS Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}, Butuan City`,
            city: "Butuan City",
            province: "Agusan del Norte",
            postalCode: "8600",
            coordinates: { lat, lng },
          })
        } finally {
          setIsLocating(false)
        }
      },
      (err) => {
        setIsLocating(false)
        alert(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Please allow location access or pick on map."
            : "Could not retrieve your current location."
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Handle direct Enter key
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0])
      } else if (query.trim().length >= 3) {
        setIsSearching(true)
        const res = await searchAddress(query)
        setIsSearching(false)
        if (res.length > 0) {
          handleSelectSuggestion(res[0])
        } else {
          setGeocodeNotFound(true)
        }
      }
    }
  }

  // Clear current selection
  const handleClear = () => {
    onChange(null)
    setQuery("")
    setServiceAreaWarning(null)
    setGeocodeNotFound(false)
  }

  // Open the interactive map modal
  const handleOpenPickerModal = () => {
    setIsOpen(false)
    setIsModalOpen(true)
  }

  // Handle confirmed location from modal
  const handleModalConfirm = (loc: LocationData) => {
    const locAddress: LocationAddress = {
      title: loc.placeName,
      placeName: loc.placeName,
      address: loc.formattedAddress,
      formattedAddress: loc.formattedAddress,
      landmark: loc.barangay ? `Brgy. ${loc.barangay}` : undefined,
      barangay: loc.barangay,
      city: loc.city || "Butuan City",
      province: loc.province || "Agusan del Norte",
      country: loc.country || "Philippines",
      postalCode: loc.postalCode || "8600",
      providerPlaceId: loc.providerPlaceId,
      addressDetails: loc.addressDetails,
      coordinates: {
        lat: loc.latitude,
        lng: loc.longitude,
      },
      isVerifiedPreset: loc.isVerifiedPreset,
    }
    onChange(locAddress)
    setQuery("")
    setServiceAreaWarning(null)
  }

  const displayTitle = value?.placeName || value?.title || (value?.address ? value.address.split(",")[0].trim() : "")

  return (
    <div className={cn("flex flex-col gap-1.5", className)} ref={containerRef}>
      {/* Label and Actions */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPickerModal}
            className="text-[11px] font-semibold flex items-center gap-1 text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors px-2 py-0.5 rounded-md"
            title="Open interactive MapCN map to search or pin location"
          >
            <HugeiconsIcon icon={Location01Icon} size={12} />
            <span>Map & Search</span>
          </button>

          <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline">
            Butuan City & Caraga
          </span>
        </div>
      </div>

      {/* Selected Location View */}
      {value ? (
        <div className="relative flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3 transition-colors shadow-xs">
          <div className="flex items-start gap-2.5 overflow-hidden flex-1">
            <div className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              roleType === "destination" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-primary/15 text-primary"
            )}>
              <HugeiconsIcon icon={PinLocation01Icon} size={16} />
            </div>
            <div className="flex flex-col overflow-hidden min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading text-xs font-bold text-foreground truncate">
                  {displayTitle}
                </span>
                {value.coordinates && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0 border border-border/60">
                    {value.coordinates.lat.toFixed(4)}°N, {value.coordinates.lng.toFixed(4)}°E
                  </span>
                )}
                {value.isVerifiedPreset && (
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={value.address}>
                {value.address}
              </p>
              {value.addressDetails && (
                <span className="text-[10px] text-primary font-medium mt-0.5 truncate">
                  Note: &quot;{value.addressDetails}&quot;
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleOpenPickerModal}
              className="flex size-7 items-center justify-center rounded-lg text-primary hover:bg-primary/15 transition-colors"
              title="Fine-tune on map"
              aria-label="Fine-tune position on map"
            >
              <HugeiconsIcon icon={Edit01Icon} size={14} />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Change address"
              aria-label="Clear location"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={15} />
            </button>
          </div>
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
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className={cn(
                "h-11 w-full rounded-xl border bg-background pl-9 pr-24 text-xs text-foreground placeholder:text-muted-foreground/70",
                "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all",
                error || serviceAreaWarning ? "border-destructive ring-1 ring-destructive" : "border-border"
              )}
              aria-invalid={Boolean(error || serviceAreaWarning)}
            />

            {/* GPS & Status action buttons inside input */}
            <div className="absolute right-2 flex items-center gap-1">
              {isSearching && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={14}
                  className="animate-spin text-muted-foreground mr-1"
                />
              )}

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="h-7 px-2 rounded-lg text-[11px] font-semibold text-primary hover:bg-primary/10 flex items-center gap-1 border border-primary/20 transition-all"
                title="Use current GPS location"
              >
                <HugeiconsIcon
                  icon={Navigation01Icon}
                  size={12}
                  className={isLocating ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">GPS</span>
              </button>
            </div>
          </div>

          {/* Service Area Warning Banner */}
          {serviceAreaWarning && (
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold">Service Area Notice</span>
                <p className="text-[11px] mt-0.5 leading-snug">{serviceAreaWarning}</p>
              </div>
            </div>
          )}

          {/* Autocomplete / Geocoding Suggestions Dropdown */}
          {isOpen && !serviceAreaWarning && (
            <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl">
              <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                <span>{query.trim() ? "Search Results (Real-time)" : "Recommended Butuan Locations"}</span>
                {isSearching && <span className="text-primary normal-case">Searching OpenStreetMap...</span>}
              </div>

              {suggestions.length > 0 ? (
                suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-accent transition-colors"
                  >
                    <HugeiconsIcon
                      icon={item.isPreset ? Building01Icon : Location01Icon}
                      size={15}
                      className="shrink-0 text-primary mt-0.5"
                    />
                    <div className="flex flex-col overflow-hidden flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {item.placeName || item.title}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground shrink-0">
                          {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.formattedAddress || item.address}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">
                    {geocodeNotFound
                      ? `No exact address match found for "${query}".`
                      : "Type an address, street, or establishment name."}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenPickerModal}
                    className="mx-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-xs"
                  >
                    <HugeiconsIcon icon={Location01Icon} size={14} />
                    <span>Pin Exact Point on Map</span>
                  </button>
                </div>
              )}

              {/* Pin on map CTA footer */}
              {suggestions.length > 0 && (
                <div className="border-t border-border/60 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenPickerModal}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <HugeiconsIcon icon={Location01Icon} size={13} />
                    <span>Can&apos;t find your exact building or spot? Open Map to Pin</span>
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

      {/* Interactive Location Picker Modal */}
      <LocationPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
        initialLocation={
          value
            ? {
                placeName: value.placeName || value.title || value.address,
                formattedAddress: value.formattedAddress || value.address,
                latitude: value.coordinates.lat,
                longitude: value.coordinates.lng,
                barangay: value.barangay,
                city: value.city,
                province: value.province,
                postalCode: value.postalCode,
                providerPlaceId: value.providerPlaceId,
                addressDetails: value.addressDetails,
                isVerifiedPreset: value.isVerifiedPreset,
              }
            : null
        }
        title={roleType === "destination" ? "Select Destination on Map" : "Select Pickup Location on Map"}
        subtitle="Search establishment names or drag the marker to your exact gate or spot in Butuan City."
        roleType={roleType}
      />
    </div>
  )
}
