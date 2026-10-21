"use client"

import * as React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ReloadIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import type { Map as MapLibreMap } from "maplibre-gl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  MapRoute,
  useMap,
} from "@/components/ui/map"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { isCoordinatesWithinButuan } from "@/lib/config/service-areas"
import { cn } from "@/lib/utils"
import type { ButuanCityMapProps, MapMarker as IMapMarker, MarkerCategory } from "./types"

function getMarkerTheme(category: MarkerCategory = "default") {
  switch (category) {
    case "pickup":
      return {
        bg: "#10b981", // emerald-500
        border: "#059669",
        badge: "Pickup Point",
        icon: "P",
      }
    case "destination":
      return {
        bg: "#f59e0b", // amber-500
        border: "#d97706",
        badge: "Destination",
        icon: "D",
      }
    case "delivery":
      return {
        bg: "#f43f5e", // rose-500
        border: "#e11d48",
        badge: "Delivery",
        icon: "📦",
      }
    case "rider":
      return {
        bg: "#0284c7", // sky-600
        border: "#0369a1",
        badge: "Active Rider",
        icon: "🏍",
      }
    case "selected":
      return {
        bg: "#e11d48", // rose-600
        border: "#be123c",
        badge: "Selected Point",
        icon: "📍",
      }
    case "listing":
      return {
        bg: "#8b5cf6", // violet-500
        border: "#7c3aed",
        badge: "Rental Listing",
        icon: "🚗",
      }
    case "hospital":
      return {
        bg: "#ef4444", // red-500
        border: "#dc2626",
        badge: "Hospital / Medical",
        icon: "🏥",
      }
    case "transport":
      return {
        bg: "#0284c7", // sky-600
        border: "#0369a1",
        badge: "Transit Hub",
        icon: "✈",
      }
    case "commercial":
      return {
        bg: "#0d9488", // teal-600
        border: "#0f766e",
        badge: "Commercial Hub",
        icon: "🏬",
      }
    case "school":
      return {
        bg: "#6366f1", // indigo-500
        border: "#4f46e5",
        badge: "University / School",
        icon: "🎓",
      }
    case "hub":
    case "landmark":
    default:
      return {
        bg: "#0d9488", // primary teal
        border: "#0f766e",
        badge: "Landmark",
        icon: "✦",
      }
  }
}

/**
 * Inner controller component mounted inside <Map> with direct access to useMap()
 */
function MapCameraController({
  routeCoordinates,
  allMarkers,
  enableLocationSelect,
  activePinMode,
  onLocationSelect,
  onPinAdjust,
  onOutsideWarning,
}: {
  routeCoordinates?: [number, number][]
  allMarkers: IMapMarker[]
  enableLocationSelect?: boolean
  activePinMode?: "pickup" | "destination" | null
  onLocationSelect?: (coords: { lat: number; lng: number; label?: string }) => void
  onPinAdjust?: (type: "pickup" | "destination", coords: { lat: number; lng: number }) => void
  onOutsideWarning?: (msg: string) => void
}) {
  const { map, isLoaded } = useMap()
  const initialFittedRef = useRef(false)

  // Fit bounds when route coordinates or markers change
  useEffect(() => {
    if (!isLoaded || !map) return

    if (routeCoordinates && routeCoordinates.length >= 2) {
      let minLng = Infinity,
        maxLng = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity

      for (const [lng, lat] of routeCoordinates) {
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      }

      if (minLng !== Infinity && maxLng !== -Infinity) {
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 50, maxZoom: 16, duration: 1000 }
        )
      }
    } else if (!initialFittedRef.current && allMarkers.length > 0) {
      initialFittedRef.current = true
      let minLng = Infinity,
        maxLng = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity

      for (const m of allMarkers) {
        if (m.lng < minLng) minLng = m.lng
        if (m.lng > maxLng) maxLng = m.lng
        if (m.lat < minLat) minLat = m.lat
        if (m.lat > maxLat) maxLat = m.lat
      }

      if (minLng !== Infinity && maxLng !== -Infinity && (maxLng - minLng > 0.001 || maxLat - minLat > 0.001)) {
        map.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat],
          ],
          { padding: 50, maxZoom: 15, duration: 800 }
        )
      }
    }
  }, [isLoaded, map, routeCoordinates, allMarkers])

  // Handle map clicks
  useEffect(() => {
    if (!isLoaded || !map) return

    const canvas = map.getCanvas()
    if (activePinMode || enableLocationSelect) {
      canvas.style.cursor = "crosshair"
    } else {
      canvas.style.cursor = ""
    }

    const handleClick = (e: { lngLat: { lng: number; lat: number } }) => {
      const { lng, lat } = e.lngLat

      if (!isCoordinatesWithinButuan(lat, lng)) {
        onOutsideWarning?.("Location outside Butuan City service coverage.")
        return
      }

      if (activePinMode && onPinAdjust) {
        onPinAdjust(activePinMode, { lat, lng })
      } else if (enableLocationSelect && onLocationSelect) {
        onLocationSelect({
          lat,
          lng,
          label: `Pinned Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        })
      }
    }

    map.on("click", handleClick)
    return () => {
      map.off("click", handleClick)
      canvas.style.cursor = ""
    }
  }, [isLoaded, map, activePinMode, enableLocationSelect, onPinAdjust, onLocationSelect, onOutsideWarning])

  return null
}

export function MapcnMapView({
  title,
  description,
  height = "420px",
  className,
  markers = [],
  showLandmarks = true,
  initialCenter = [8.9475, 125.5406],
  initialZoom = 13,
  enableLocationSelect = false,
  onLocationSelect,
  selectedLocation,
  draggableSelectedPin = false,
  onSelectedPinDragEnd,
  showControls = true,
  route,
  secondaryRoute,
  activePinMode,
  onPinAdjust,
  footerContent,
}: ButuanCityMapProps) {
  const [outsideWarning, setOutsideWarning] = useState<string | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)

  // Clear warning after 5 seconds
  useEffect(() => {
    if (outsideWarning) {
      const timer = setTimeout(() => setOutsideWarning(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [outsideWarning])

  // Landmark markers
  const landmarkMarkers: IMapMarker[] = useMemo(() => {
    if (!showLandmarks) return []
    return BUTUAN_PRESET_LOCATIONS.map((loc) => ({
      id: loc.id,
      title: loc.name,
      lat: loc.address.coordinates.lat,
      lng: loc.address.coordinates.lng,
      category: loc.type as MarkerCategory,
      badgeText: loc.type.toUpperCase(),
      description: loc.address.address,
      address: loc.address.address,
    }))
  }, [showLandmarks])

  // Combined marker list
  const allMarkers = useMemo(() => {
    const combined = [...landmarkMarkers, ...markers]
    if (selectedLocation) {
      combined.push({
        id: "selected-location-pin",
        title: selectedLocation.label || "Selected Point",
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        category: "selected",
        badgeText: "Selected GPS Pin",
        description: `Latitude: ${selectedLocation.lat.toFixed(5)}, Longitude: ${selectedLocation.lng.toFixed(5)}`,
        draggable: Boolean(draggableSelectedPin),
        onDragEnd: onSelectedPinDragEnd,
      })
    }
    return combined
  }, [landmarkMarkers, markers, selectedLocation, draggableSelectedPin, onSelectedPinDragEnd])

  // Ensure route coordinates are in [lng, lat] GeoJSON format for MapCN
  const routeCoordinates = route?.coordinates
  const formattedRouteCoords: [number, number][] = useMemo(() => {
    if (!routeCoordinates || routeCoordinates.length < 2) return []
    return routeCoordinates.map((pt) => {
      // If pt[0] is latitude (~8.9) and pt[1] is longitude (~125.5), swap to [lng, lat]
      if (Math.abs(pt[0]) < 20 && Math.abs(pt[1]) > 50) {
        return [pt[1], pt[0]]
      }
      return [pt[0], pt[1]]
    })
  }, [routeCoordinates])

  const secondaryRouteCoordinates = secondaryRoute?.coordinates
  const formattedSecondaryRouteCoords: [number, number][] = useMemo(() => {
    if (!secondaryRouteCoordinates || secondaryRouteCoordinates.length < 2) return []
    return secondaryRouteCoordinates.map((pt) => {
      if (Math.abs(pt[0]) < 20 && Math.abs(pt[1]) > 50) {
        return [pt[1], pt[0]]
      }
      return [pt[0], pt[1]]
    })
  }, [secondaryRouteCoordinates])

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [initialCenter[1], initialCenter[0]],
        zoom: initialZoom,
        duration: 1000,
      })
    }
  }

  return (
    <Card className={cn("overflow-hidden border border-border/70 bg-card shadow-xs flex flex-col", className)}>
      {/* Map Header */}
      {(title || description || activePinMode) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3 gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold text-foreground">
                {title || "Butuan City Service Map"}
              </span>
              <Badge variant="outline" className="border-teal-500/30 text-teal-600 dark:text-teal-400 text-[10px] font-semibold">
                MapCN Interactive
              </Badge>
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activePinMode && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] animate-pulse">
                Click map to place {activePinMode} pin
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRecenter}
              className="h-7 px-2.5 text-[11px] font-medium border-border/80 gap-1.5 shadow-none"
              title="Reset center to Butuan City"
            >
              <HugeiconsIcon icon={ReloadIcon} size={12} />
              <span>Center Butuan</span>
            </Button>
          </div>
        </div>
      )}

      {/* Warning Alert if outside boundary clicked */}
      {outsideWarning && (
        <div className="bg-destructive/10 text-destructive border-b border-destructive/20 px-4 py-2 text-xs flex items-center gap-2">
          <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0" />
          <span>{outsideWarning}</span>
        </div>
      )}

      {/* Interactive Map */}
      <div style={{ height, minHeight: "320px" }} className="relative w-full">
        <Map
          ref={mapRef}
          center={[initialCenter[1], initialCenter[0]]} // [lng, lat]
          zoom={initialZoom}
          className="h-full w-full"
        >
          {/* Controls */}
          {showControls && (
            <MapControls
              position="top-right"
              showZoom={true}
              showCompass={true}
              showLocate={true}
              showFullscreen={true}
              onLocate={(coords) => {
                if (isCoordinatesWithinButuan(coords.latitude, coords.longitude)) {
                  onLocationSelect?.({
                    lat: coords.latitude,
                    lng: coords.longitude,
                    label: "My Current Device Location",
                  })
                } else {
                  setOutsideWarning("Device GPS reported coordinates outside Butuan City service boundary.")
                }
              }}
            />
          )}

          {/* Camera and click handler */}
          <MapCameraController
            routeCoordinates={formattedRouteCoords.length > 0 ? formattedRouteCoords : undefined}
            allMarkers={allMarkers}
            enableLocationSelect={enableLocationSelect}
            activePinMode={activePinMode}
            onLocationSelect={onLocationSelect}
            onPinAdjust={onPinAdjust}
            onOutsideWarning={setOutsideWarning}
          />

          {/* Secondary Route (e.g. Rider to pickup dispatch leg) */}
          {formattedSecondaryRouteCoords.length >= 2 && (
            <MapRoute
              id="dispatch-route"
              coordinates={formattedSecondaryRouteCoords}
              color="#6366f1" // indigo-500
              width={3}
              dashArray={[6, 4]}
            />
          )}

          {/* Primary Route (Pickup to dropoff) */}
          {formattedRouteCoords.length >= 2 && (
            <MapRoute
              id="booking-route"
              coordinates={formattedRouteCoords}
              color={route?.color || "#0d9488"} // teal-600
              width={4}
              opacity={0.9}
            />
          )}

          {/* Markers */}
          {allMarkers.map((marker) => {
            const theme = getMarkerTheme(marker.category)
            const isDraggable = Boolean(marker.draggable)

            return (
              <MapMarker
                key={marker.id}
                longitude={marker.lng}
                latitude={marker.lat}
                draggable={isDraggable}
                onDragEnd={(coords) => {
                  if (marker.onDragEnd) {
                    marker.onDragEnd(coords)
                  }
                }}
              >
                <MarkerContent>
                  <div
                    style={{
                      backgroundColor: theme.bg,
                      borderColor: theme.border,
                    }}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border-2 text-white shadow-md transition-transform hover:scale-110",
                      isDraggable && "ring-2 ring-white/60 animate-pulse"
                    )}
                    title={marker.title}
                  >
                    <span className="text-[11px] font-bold leading-none select-none">
                      {theme.icon}
                    </span>
                  </div>
                </MarkerContent>

                <MarkerPopup className="text-xs">
                  <div className="flex flex-col gap-1.5 p-1 max-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: theme.bg }}
                      />
                      <span className="font-heading font-bold text-foreground text-xs leading-snug">
                        {marker.title}
                      </span>
                    </div>
                    {marker.badgeText && (
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {marker.badgeText}
                      </span>
                    )}
                    {marker.description && (
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        {marker.description}
                      </p>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground/80 mt-1">
                      {marker.lat.toFixed(4)}°N, {marker.lng.toFixed(4)}°E
                    </span>
                    {marker.actionLabel && marker.onAction && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={marker.onAction}
                        className="mt-2 h-7 text-xs font-semibold w-full"
                      >
                        {marker.actionLabel}
                      </Button>
                    )}
                  </div>
                </MarkerPopup>
              </MapMarker>
            )
          })}
        </Map>
      </div>

      {/* Footer Content */}
      {footerContent && (
        <div className="border-t border-border/60 bg-muted/10 p-3 sm:px-4">
          {footerContent}
        </div>
      )}
    </Card>
  )
}
