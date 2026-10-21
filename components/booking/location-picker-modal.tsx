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
  Location01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  ReloadIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import { searchAddress, reverseGeocode, type GeocodeResult } from "@/lib/maps/geocode"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { validateServiceAreaLocation, isCoordinatesWithinButuan } from "@/lib/config/service-areas"
import type { LocationData } from "@/types/location"
import { normalizeLocationData } from "@/types/location"
import { cn } from "@/lib/utils"

export interface LocationPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (location: LocationData) => void
  initialLocation?: LocationData | null
  title?: string
  subtitle?: string
  roleType?: "pickup" | "destination" | "general"
}

export function LocationPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialLocation,
  title = "Select Accurate Location",
  subtitle = "Search for a landmark, street, or pick directly on the Butuan City map.",
  roleType = "pickup",
}: LocationPickerModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<GeocodeResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isLocating, setIsLocating] = React.useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = React.useState(false)
  const [serviceAreaWarning, setServiceAreaWarning] = React.useState<string | null>(null)

  // Current drafted selection
  const [selectedPlaceName, setSelectedPlaceName] = React.useState("")
  const [selectedAddress, setSelectedAddress] = React.useState("")
  const [selectedCoords, setSelectedCoords] = React.useState<{ lat: number; lng: number }>({
    lat: 8.9475,
    lng: 125.5406,
  })
  const [barangay, setBarangay] = React.useState<string | undefined>()
  const [city, setCity] = React.useState("Butuan City")
  const [province, setProvince] = React.useState("Agusan del Norte")
  const [postalCode, setPostalCode] = React.useState("8600")
  const [addressDetails, setAddressDetails] = React.useState("")
  const [providerPlaceId, setProviderPlaceId] = React.useState<string | undefined>()

  const abortControllerRef = React.useRef<AbortController | null>(null)

  // Initialize or reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialLocation) {
        const norm = normalizeLocationData(initialLocation)
        setSelectedPlaceName(norm.placeName)
        setSelectedAddress(norm.formattedAddress)
        setSelectedCoords({ lat: norm.latitude, lng: norm.longitude })
        setBarangay(norm.barangay)
        setCity(norm.city || "Butuan City")
        setProvince(norm.province || "Agusan del Norte")
        setPostalCode(norm.postalCode || "8600")
        setAddressDetails(norm.addressDetails || "")
        setProviderPlaceId(norm.providerPlaceId)
      } else {
        const defaultPreset = BUTUAN_PRESET_LOCATIONS[0]
        setSelectedPlaceName(defaultPreset.name)
        setSelectedAddress(defaultPreset.address.formattedAddress || defaultPreset.address.address)
        setSelectedCoords(defaultPreset.address.coordinates)
        setBarangay(defaultPreset.barangay)
        setCity("Butuan City")
        setProvince("Agusan del Norte")
        setPostalCode("8600")
        setAddressDetails("")
        setProviderPlaceId(defaultPreset.id)
      }
      setSearchQuery("")
      setSuggestions([])
      setServiceAreaWarning(null)
    }
  }, [isOpen, initialLocation])

  // Debounced search query
  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchAddress(searchQuery, controller.signal)
        if (!controller.signal.aborted) {
          setSuggestions(results)
          setIsSearching(false)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.warn("[LocationPickerModal] Geocode search failed:", err)
          setIsSearching(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery])

  if (!isOpen) return null

  // Handle selecting an autocomplete item
  const handleSelectSuggestion = (item: GeocodeResult) => {
    setSelectedPlaceName(item.placeName || item.title)
    setSelectedAddress(item.formattedAddress || item.address)
    setSelectedCoords({ lat: item.lat, lng: item.lng })
    setBarangay(item.barangay)
    setCity(item.city || "Butuan City")
    setProvince(item.province || "Agusan del Norte")
    setPostalCode(item.postalCode || "8600")
    setProviderPlaceId(item.providerPlaceId || item.id)
    setSearchQuery("")
    setSuggestions([])
    setServiceAreaWarning(null)
  }

  // Handle clicking or dragging marker on map
  const handleMapCoordChange = async (coords: { lat: number; lng: number }) => {
    if (!isCoordinatesWithinButuan(coords.lat, coords.lng)) {
      setServiceAreaWarning("Selected coordinates are outside the Butuan City service area.")
    } else {
      setServiceAreaWarning(null)
    }

    setSelectedCoords(coords)
    setIsReverseGeocoding(true)

    try {
      const res = await reverseGeocode(coords.lat, coords.lng)
      if (res) {
        setSelectedPlaceName(res.placeName || res.title)
        setSelectedAddress(res.formattedAddress || res.address)
        setBarangay(res.barangay)
        setCity(res.city || "Butuan City")
        setProvince(res.province || "Agusan del Norte")
        setPostalCode(res.postalCode || "8600")
        setProviderPlaceId(res.providerPlaceId)
      }
    } catch (err) {
      console.warn("[LocationPickerModal] Reverse geocode failed:", err)
    } finally {
      setIsReverseGeocoding(false)
    }
  }

  // Handle "Locate Me" GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        await handleMapCoordChange(coords)
        setIsLocating(false)
      },
      (err) => {
        setIsLocating(false)
        alert(
          err.code === err.PERMISSION_DENIED
            ? "GPS location permission was denied. Please pick a location manually or search an address."
            : "Could not retrieve your current location."
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Confirm selection
  const handleConfirm = () => {
    const finalLocation: LocationData = {
      placeName: selectedPlaceName.trim() || selectedAddress.split(",")[0].trim() || "Selected Location",
      formattedAddress: selectedAddress.trim(),
      latitude: selectedCoords.lat,
      longitude: selectedCoords.lng,
      barangay,
      city,
      province,
      country: "Philippines",
      postalCode,
      addressDetails: addressDetails.trim() || undefined,
      providerPlaceId,
      isVerifiedPreset: Boolean(providerPlaceId?.startsWith("preset-") || providerPlaceId?.startsWith("loc_")),
    }

    onConfirm(finalLocation)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className={cn(
              "size-10 rounded-xl flex items-center justify-center shrink-0",
              roleType === "destination"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-primary/10 text-primary"
            )}>
              <HugeiconsIcon icon={PinLocation01Icon} size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-foreground">
                  {title}
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-bold",
                    roleType === "destination" ? "text-amber-600 border-amber-500/30" : "text-primary border-primary/30"
                  )}
                >
                  {roleType === "destination" ? "Dropoff Destination" : "Pickup Point"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Modal Body: Search + Map + Place Confirmation */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* Search Bar & Quick Chips */}
          <div className="relative flex flex-col gap-2">
            <div className="relative flex items-center">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  const v = validateServiceAreaLocation(e.target.value)
                  if (v.isOutsideServiceArea && v.message) {
                    setServiceAreaWarning(v.message)
                  } else {
                    setServiceAreaWarning(null)
                  }
                }}
                placeholder="Search business name, school, hospital, mall, street, or barangay..."
                className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-24 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />

              <div className="absolute right-2 flex items-center gap-1">
                {isSearching && (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    size={14}
                    className="animate-spin text-muted-foreground mr-1"
                  />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setSuggestions([])
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  </button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className="h-7 px-2 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <HugeiconsIcon icon={Navigation01Icon} size={12} className={isLocating ? "animate-spin" : ""} />
                  <span>GPS</span>
                </Button>
              </div>
            </div>

            {/* Service Area Warning */}
            {serviceAreaWarning && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0" />
                <span>{serviceAreaWarning}</span>
              </div>
            )}

            {/* Autocomplete Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-12 z-30 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-2xl">
                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-b border-border/50">
                  Search Results ({suggestions.length})
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-muted transition-colors border-b border-border/30 last:border-none"
                  >
                    <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <HugeiconsIcon icon={item.isPreset ? Building01Icon : Location01Icon} size={13} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground truncate">
                          {item.placeName || item.title}
                        </span>
                        {item.barangay && (
                          <span className="text-[10px] font-medium text-primary px-1.5 py-0.5 rounded bg-primary/10 shrink-0">
                            Brgy. {item.barangay}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {item.formattedAddress || item.address}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Landmark Preset Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Popular:</span>
              {BUTUAN_PRESET_LOCATIONS.slice(0, 6).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlaceName(preset.name)
                    setSelectedAddress(preset.address.formattedAddress || preset.address.address)
                    setSelectedCoords(preset.address.coordinates)
                    setBarangay(preset.barangay)
                    setCity("Butuan City")
                    setProvince("Agusan del Norte")
                    setPostalCode("8600")
                    setProviderPlaceId(preset.id)
                    setServiceAreaWarning(null)
                  }}
                  className={cn(
                    "shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                    selectedPlaceName === preset.name
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 hover:bg-muted text-foreground border-border/80"
                  )}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* MapCN Container with draggable pin */}
          <div className="relative rounded-2xl overflow-hidden border border-border h-72 sm:h-80 w-full shadow-xs">
            <ButuanCityMap
              selectedLocation={{
                lat: selectedCoords.lat,
                lng: selectedCoords.lng,
                label: selectedPlaceName || "Selected Location",
              }}
              draggableSelectedPin={true}
              onSelectedPinDragEnd={handleMapCoordChange}
              enableLocationSelect={true}
              onLocationSelect={handleMapCoordChange}
              initialCenter={[selectedCoords.lat, selectedCoords.lng]}
              initialZoom={14}
              height="100%"
              className="w-full h-full"
            />

            {/* Helper pill overlaid on map */}
            <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-xs border border-border px-3 py-1.5 rounded-lg text-[11px] font-medium text-foreground shadow-sm flex items-center gap-1.5">
              <HugeiconsIcon icon={Location01Icon} size={13} className="text-primary" />
              <span>Click map or drag pin to fine-tune exact gate/entrance</span>
            </div>

            {isReverseGeocoding && (
              <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-xs border border-border px-3 py-1.5 rounded-lg text-[11px] font-semibold text-primary shadow-sm flex items-center gap-1.5 animate-pulse">
                <HugeiconsIcon icon={Loading03Icon} size={13} className="animate-spin" />
                <span>Identifying place name & address...</span>
              </div>
            )}
          </div>

          {/* Confirmed Place Details Card */}
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Selected Place & Landmark Name
                </span>
                <input
                  type="text"
                  value={selectedPlaceName}
                  onChange={(e) => setSelectedPlaceName(e.target.value)}
                  placeholder="Enter business, building, or establishment name"
                  className="font-heading text-sm font-bold text-foreground bg-transparent border-b border-border/60 focus:border-primary focus:outline-none py-0.5 mt-0.5"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border/60">
                  {selectedCoords.lat.toFixed(5)}°N, {selectedCoords.lng.toFixed(5)}°E
                </span>
                {providerPlaceId && (
                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    Verified Location
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Complete Formatted Street Address
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedAddress || "No address selected yet."}
              </p>
            </div>

            {/* Optional Customer Directions / Landmark Instructions */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">
              <label htmlFor="address-details" className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Specific Landmark / Directions (Optional)</span>
                <span className="text-[10px] font-normal text-muted-foreground">e.g. Near blue gate, Room 201</span>
              </label>
              <input
                id="address-details"
                type="text"
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                placeholder="e.g., Gate 2 beside the pharmacy, near yellow apartment building"
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-border/80 flex items-center justify-between bg-muted/20 gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-muted-foreground"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            className="text-xs font-bold gap-1.5 px-4 shadow-sm"
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
            <span>Confirm & Use Location</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
