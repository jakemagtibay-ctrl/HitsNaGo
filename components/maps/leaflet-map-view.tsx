"use client"

import * as React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import L from "leaflet"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Navigation01Icon,
  ReloadIcon,
  PinLocation01Icon,
  InformationCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { ACTIVE_SERVICE_AREA, isCoordinatesWithinButuan } from "@/lib/config/service-areas"
import { cn } from "@/lib/utils"
import type { ButuanCityMapProps, MarkerCategory } from "./types"

// Fix for default Leaflet icon paths in bundler environments
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

/**
 * Returns color tokens according to marker category
 */
function getMarkerTheme(category: MarkerCategory = "default") {
  switch (category) {
    case "pickup":
      return {
        bg: "#10b981", // emerald-500
        border: "#059669",
        text: "#ffffff",
        badge: "Pickup Point",
        iconSvg: `<circle cx="12" cy="12" r="4" fill="#ffffff" /><path d="M12 4v4m0 8v4M4 12h4m8 0h4" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`,
      }
    case "destination":
      return {
        bg: "#f59e0b", // amber-500
        border: "#d97706",
        text: "#ffffff",
        badge: "Destination",
        iconSvg: `<path d="M5 21V4l9 4-9 4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      }
    case "delivery":
      return {
        bg: "#f43f5e", // rose-500
        border: "#e11d48",
        text: "#ffffff",
        badge: "Delivery Destination",
        iconSvg: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="#ffffff" stroke-width="1.8"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="#ffffff" stroke-width="1.8"/>`,
      }
    case "rider":
      return {
        bg: "#0284c7", // sky-600
        border: "#0369a1",
        text: "#ffffff",
        badge: "Active Rider",
        iconSvg: `<circle cx="5.5" cy="17.5" r="3.5" stroke="#ffffff" stroke-width="1.8"/><circle cx="18.5" cy="17.5" r="3.5" stroke="#ffffff" stroke-width="1.8"/><path d="M15 6h-4l-3 6.5h7.5l2-3.5h2.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>`,
      }
    case "selected":
      return {
        bg: "#f43f5e", // rose-500
        border: "#e11d48",
        text: "#ffffff",
        badge: "Selected Point",
        iconSvg: `<circle cx="12" cy="12" r="3" fill="#ffffff"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" stroke="#ffffff" stroke-width="2"/>`,
      }
    case "listing":
      return {
        bg: "#8b5cf6", // violet-500
        border: "#7c3aed",
        text: "#ffffff",
        badge: "Rental Listing",
        iconSvg: `<circle cx="9" cy="9" r="4" stroke="#ffffff" stroke-width="2"/><path d="M12 12l7 7m-3-1l2 2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`,
      }
    case "hospital":
      return {
        bg: "#ef4444", // red-500
        border: "#dc2626",
        text: "#ffffff",
        badge: "Hospital / Medical",
        iconSvg: `<path d="M12 6v12M6 12h12" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>`,
      }
    case "transport":
      return {
        bg: "#0284c7", // sky-600
        border: "#0369a1",
        text: "#ffffff",
        badge: "Transit Hub",
        iconSvg: `<path d="M5 17h14M6 17v2m12-2v2M6 8h12a2 2 0 0 1 2 2v7H4v-7a2 2 0 0 1 2-2z" stroke="#ffffff" stroke-width="1.8"/>`,
      }
    case "commercial":
      return {
        bg: "#0d9488", // teal-600
        border: "#0f766e",
        text: "#ffffff",
        badge: "Commercial Hub",
        iconSvg: `<path d="M3 21h18M5 21V7l7-4 7 4v14" stroke="#ffffff" stroke-width="1.8"/><path d="M9 10h1m4 0h1M9 14h1m4 0h1" stroke="#ffffff" stroke-width="2"/>`,
      }
    case "school":
      return {
        bg: "#6366f1", // indigo-500
        border: "#4f46e5",
        text: "#ffffff",
        badge: "University / School",
        iconSvg: `<path d="M22 10l-10-5L2 10l10 5 10-5zM6 12.5V17c0 2 3 3 6 3s6-1 6-3v-4.5" stroke="#ffffff" stroke-width="1.8"/>`,
      }
    case "hub":
    case "landmark":
    default:
      return {
        bg: "#0d9488", // primary teal
        border: "#0f766e",
        text: "#ffffff",
        badge: "Butuan Landmark",
        iconSvg: `<path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" stroke="#ffffff" stroke-width="2"/><circle cx="12" cy="10" r="2.5" fill="#ffffff"/>`,
      }
  }
}

/**
 * Creates custom HTML Pin DivIcon
 */
function createCustomPin(category: MarkerCategory = "default", isSelected = false) {
  const theme = getMarkerTheme(category)
  const pulseHtml = isSelected
    ? `<span style="position:absolute;top:-4px;left:-4px;width:38px;height:38px;border-radius:9999px;background-color:${theme.bg};opacity:0.4;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>`
    : ""

  const html = `
    <div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
      ${pulseHtml}
      <div style="
        width: 30px;
        height: 30px;
        background: ${theme.bg};
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border-radius: 9999px 9999px 9999px 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" style="transform: rotate(45deg);">
          ${theme.iconSvg}
        </svg>
      </div>
    </div>
  `

  return L.divIcon({
    className: "hitsnago-custom-pin",
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32],
  })
}

export function LeafletMapView({
  title,
  description,
  height = "440px",
  className,
  markers = [],
  showLandmarks = true,
  initialCenter = [ACTIVE_SERVICE_AREA.centerCoordinates.lat, ACTIVE_SERVICE_AREA.centerCoordinates.lng],
  initialZoom = 13,
  enableLocationSelect = false,
  onLocationSelect,
  selectedLocation,
  showControls = true,
  roleContext = "public",
  route,
  secondaryRoute,
  activePinMode,
  onPinAdjust,
  footerContent,
}: ButuanCityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const routesLayerRef = useRef<L.LayerGroup | null>(null)
  const selectedMarkerRef = useRef<L.Marker | null>(null)

  const activePinModeRef = useRef(activePinMode)
  const onPinAdjustRef = useRef(onPinAdjust)
  const onLocationSelectRef = useRef(onLocationSelect)

  useEffect(() => {
    activePinModeRef.current = activePinMode
    onPinAdjustRef.current = onPinAdjust
    onLocationSelectRef.current = onLocationSelect
  }, [activePinMode, onPinAdjust, onLocationSelect])

  const [userSelectedPin, setUserSelectedPin] = useState<{
    lat: number
    lng: number
    label: string
    isOutsideButuan?: boolean
  } | null>(null)

  // Derived active pin: selectedLocation prop takes precedence if passed, otherwise user clicked pin
  const activePin = React.useMemo(() => {
    if (selectedLocation) {
      return {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        label: selectedLocation.label || "Selected Location",
        isOutsideButuan: !isCoordinatesWithinButuan(selectedLocation.lat, selectedLocation.lng),
      }
    }
    return userSelectedPin
  }, [selectedLocation, userSelectedPin])

  const [tileErrorCount, setTileErrorCount] = useState<number>(0)
  const [userLocationState, setUserLocationState] = useState<"idle" | "locating" | "found" | "denied">("idle")
  const [userMessage, setUserMessage] = useState<string | null>(null)

  // Update cursor on activePinMode change
  useEffect(() => {
    if (!mapContainerRef.current) return
    mapContainerRef.current.style.cursor = activePinMode ? "crosshair" : ""
  }, [activePinMode])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return // Already initialized

    // Create Map Instance
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false, // We'll add zoom control in top-right or use styled position
      attributionControl: true,
      maxBounds: [
        [8.7, 125.2], // Southwest boundary
        [9.2, 125.8], // Northeast boundary
      ],
      maxBoundsViscosity: 0.6,
      minZoom: 11,
      maxZoom: 18,
    })

    // Standard OpenStreetMap Tile Layer
    const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    })

    tileLayer.on("tileerror", () => {
      setTileErrorCount((prev: number) => prev + 1)
    })

    tileLayer.addTo(map)

    // Add zoom control in top-right
    L.control.zoom({ position: "topright" }).addTo(map)

    // Add scale bar in bottom-left
    L.control.scale({ imperial: false, metric: true, position: "bottomleft" }).addTo(map)

    // Layer groups for dynamic markers and route polylines
    const routesLayer = L.layerGroup().addTo(map)
    const markersLayer = L.layerGroup().addTo(map)
    routesLayerRef.current = routesLayer
    markersLayerRef.current = markersLayer
    mapInstanceRef.current = map

    // Handle map clicks for point selection or active pin adjustment
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng

      if (activePinModeRef.current && onPinAdjustRef.current) {
        onPinAdjustRef.current(activePinModeRef.current, { lat, lng })
        return
      }

      if (enableLocationSelect) {
        const isOutside = !isCoordinatesWithinButuan(lat, lng)
        const label = `Custom Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`

        setUserSelectedPin({ lat, lng, label, isOutsideButuan: isOutside })
        if (onLocationSelectRef.current) {
          onLocationSelectRef.current({ lat, lng, label })
        }
      }
    })

    // Invalidate size on container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })
    resizeObserver.observe(mapContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapInstanceRef.current = null
      markersLayerRef.current = null
      routesLayerRef.current = null
      selectedMarkerRef.current = null
    }
  }, [enableLocationSelect, initialCenter, initialZoom])

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current
    const markersLayer = markersLayerRef.current
    if (!map || !markersLayer) return

    markersLayer.clearLayers()

    // 1. Add Butuan Landmark markers if enabled
    if (showLandmarks) {
      BUTUAN_PRESET_LOCATIONS.forEach((preset) => {
        const coords: [number, number] = [preset.address.coordinates.lat, preset.address.coordinates.lng]
        const pinIcon = createCustomPin(preset.type)

        const marker = L.marker(coords, { icon: pinIcon })

        const popupContent = document.createElement("div")
        popupContent.className = "p-3 flex flex-col gap-1.5 min-w-[210px] text-xs"
        popupContent.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <strong style="font-size:13px;font-weight:700;color:inherit;">${preset.name}</strong>
            <span style="font-size:10px;text-transform:uppercase;padding:2px 6px;border-radius:9999px;background:#0d948815;color:#0d9488;font-weight:600;border:1px solid #0d948830;">
              ${preset.barangay}
            </span>
          </div>
          <div style="color:#64748b;font-size:11px;">${preset.address.address}</div>
          <div style="font-size:10px;color:#94a3b8;font-family:monospace;">${coords[0].toFixed(4)}°N, ${coords[1].toFixed(4)}°E</div>
        `

        if (enableLocationSelect || activePinMode) {
          const selectBtn = document.createElement("button")
          selectBtn.innerText = activePinMode
            ? `Pin as ${activePinMode === "pickup" ? "Pickup" : "Dropoff"}`
            : "Select This Location"
          selectBtn.style.cssText =
            "margin-top:6px;background:#0d9488;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-weight:600;cursor:pointer;font-size:11px;text-align:center;"
          selectBtn.onclick = () => {
            if (activePinMode && onPinAdjust) {
              onPinAdjust(activePinMode, { lat: coords[0], lng: coords[1] })
            } else {
              setUserSelectedPin({ lat: coords[0], lng: coords[1], label: preset.name, isOutsideButuan: false })
              if (onLocationSelect) {
                onLocationSelect({ lat: coords[0], lng: coords[1], label: preset.name })
              }
            }
            marker.closePopup()
          }
          popupContent.appendChild(selectBtn)
        }

        marker.bindPopup(popupContent)
        markersLayer.addLayer(marker)
      })
    }

    // 2. Add custom markers from props (e.g. real database bookings, provider listings)
    markers.forEach((m) => {
      const pinIcon = createCustomPin(m.category || "default")
      const marker = L.marker([m.lat, m.lng], {
        icon: pinIcon,
        draggable: Boolean(m.draggable),
      })

      if (m.draggable) {
        marker.on("dragend", (e: L.LeafletEvent) => {
          const target = e.target as L.Marker
          const latlng = target.getLatLng()
          m.onDragEnd?.({ lat: latlng.lat, lng: latlng.lng })
        })
      }

      const theme = getMarkerTheme(m.category)
      const popupContent = document.createElement("div")
      popupContent.className = "p-3 flex flex-col gap-1.5 min-w-[220px] text-xs"
      popupContent.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
          <strong style="font-size:13px;font-weight:700;color:inherit;">${m.title}</strong>
          <span style="font-size:10px;padding:2px 6px;border-radius:9999px;background:${theme.bg}20;color:${theme.bg};font-weight:700;border:1px solid ${theme.bg}40;">
            ${m.badgeText || theme.badge}
          </span>
        </div>
        ${m.description ? `<div style="color:#64748b;font-size:11px;">${m.description}</div>` : ""}
        ${m.address ? `<div style="color:#64748b;font-size:11px;"><strong>Address:</strong> ${m.address}</div>` : ""}
        <div style="font-size:10px;color:#94a3b8;font-family:monospace;">${m.lat.toFixed(4)}°N, ${m.lng.toFixed(4)}°E</div>
      `

      if (m.draggable) {
        const dragNotice = document.createElement("div")
        dragNotice.style.cssText = "font-size:10px;color:#0d9488;font-weight:600;margin-top:4px;"
        dragNotice.innerText = "📍 Drag this pin anytime to fine-tune exact position"
        popupContent.appendChild(dragNotice)
      }

      if (m.actionLabel && m.actionUrl) {
        const linkBtn = document.createElement("a")
        linkBtn.href = m.actionUrl
        linkBtn.innerText = m.actionLabel
        linkBtn.style.cssText =
          "margin-top:6px;display:block;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;padding:5px 8px;font-weight:600;font-size:11px;text-align:center;"
        popupContent.appendChild(linkBtn)
      } else if (m.actionLabel && m.onAction) {
        const actionBtn = document.createElement("button")
        actionBtn.innerText = m.actionLabel
        actionBtn.style.cssText =
          "margin-top:6px;background:#0d9488;color:#fff;border:none;border-radius:6px;padding:5px 8px;font-weight:600;cursor:pointer;font-size:11px;text-align:center;"
        actionBtn.onclick = () => {
          m.onAction?.()
          marker.closePopup()
        }
        popupContent.appendChild(actionBtn)
      }

      marker.bindPopup(popupContent)
      markersLayer.addLayer(marker)
    })

    // 3. Render active selected pin if present
    if (activePin) {
      const selectedIcon = createCustomPin("selected", true)
      const selectedMarker = L.marker([activePin.lat, activePin.lng], { icon: selectedIcon })

      const popupContent = document.createElement("div")
      popupContent.className = "p-3 flex flex-col gap-1.5 min-w-[200px] text-xs"
      popupContent.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <strong style="font-size:13px;font-weight:700;color:#e11d48;">Selected Location</strong>
        </div>
        <div style="color:#64748b;font-size:11px;">${activePin.label}</div>
        <div style="font-size:10px;color:#94a3b8;font-family:monospace;">${activePin.lat.toFixed(4)}°N, ${activePin.lng.toFixed(4)}°E</div>
        ${activePin.isOutsideButuan ? `<div style="color:#e11d48;font-weight:600;font-size:10px;">⚠️ Note: Outside standard Butuan City coverage area.</div>` : ""}
      `

      selectedMarker.bindPopup(popupContent)
      markersLayer.addLayer(selectedMarker)
      selectedMarkerRef.current = selectedMarker
    }
  }, [activePin, enableLocationSelect, markers, onLocationSelect, showLandmarks, activePinMode, onPinAdjust])

  // Update Routes & Polylines
  useEffect(() => {
    const map = mapInstanceRef.current
    const routesLayer = routesLayerRef.current
    if (!map || !routesLayer) return

    routesLayer.clearLayers()

    const allRouteCoords: [number, number][] = []

    // 1. Draw Secondary Route (e.g. Rider dispatch to pickup)
    if (secondaryRoute && secondaryRoute.coordinates.length > 1) {
      allRouteCoords.push(...secondaryRoute.coordinates)

      const casing = L.polyline(secondaryRoute.coordinates, {
        color: "#0369a1",
        weight: 6,
        opacity: 0.35,
      })
      const core = L.polyline(secondaryRoute.coordinates, {
        color: secondaryRoute.color || "#0284c7",
        weight: 4,
        dashArray: "6, 8",
        opacity: 0.9,
      })
      if (secondaryRoute.label) {
        core.bindTooltip(secondaryRoute.label, { sticky: true, className: "text-xs font-semibold" })
      }
      routesLayer.addLayer(casing)
      routesLayer.addLayer(core)
    }

    // 2. Draw Primary Route (e.g. Passenger trip or Courier route)
    if (route && route.coordinates.length > 1) {
      allRouteCoords.push(...route.coordinates)

      const isApproximate = Boolean(route.isFallback || route.isApproximate)
      const casing = L.polyline(route.coordinates, {
        color: isApproximate ? "#d97706" : "#0f766e",
        weight: isApproximate ? 6 : 8,
        opacity: isApproximate ? 0.35 : 0.45,
        dashArray: isApproximate ? "8, 8" : undefined,
      })
      const core = L.polyline(route.coordinates, {
        color: route.color || (isApproximate ? "#b45309" : "#0d9488"),
        weight: isApproximate ? 4 : 5,
        opacity: 0.95,
        dashArray: isApproximate ? "8, 8" : undefined,
      })
      if (route.label) {
        core.bindTooltip(
          isApproximate ? `${route.label} (Approximate Estimate)` : route.label,
          { sticky: true, className: "text-xs font-semibold" }
        )
      }
      routesLayer.addLayer(casing)
      routesLayer.addLayer(core)
    }

    // Auto-fit bounds if routes are drawn
    if (allRouteCoords.length > 1) {
      const bounds = L.latLngBounds(allRouteCoords)
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 })
    }
  }, [route, secondaryRoute])

  // Recenter to Butuan City
  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    map.flyTo(initialCenter, initialZoom, { duration: 1.2 })
    setUserMessage("Map centered on Butuan City")
    setTimeout(() => setUserMessage(null), 2500)
  }, [initialCenter, initialZoom])

  // Locate User (browser GPS upon explicit button click only)
  const handleLocateMe = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (!navigator.geolocation) {
      setUserLocationState("denied")
      setUserMessage("Geolocation is not supported by your browser.")
      setTimeout(() => setUserMessage(null), 3000)
      return
    }

    setUserLocationState("locating")
    setUserMessage("Locating your device...")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocationState("found")
        setUserMessage(`Found your location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
        setTimeout(() => setUserMessage(null), 3500)

        const isOutside = !isCoordinatesWithinButuan(latitude, longitude)
        setUserSelectedPin({
          lat: latitude,
          lng: longitude,
          label: "My Current Location",
          isOutsideButuan: isOutside,
        })

        map.flyTo([latitude, longitude], 15, { duration: 1.2 })

        if (onLocationSelect) {
          onLocationSelect({ lat: latitude, lng: longitude, label: "My Current Location" })
        }
      },
      (error) => {
        setUserLocationState("denied")
        setUserMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Defaulting to Butuan City center."
            : "Could not retrieve your location."
        )
        setTimeout(() => setUserMessage(null), 3500)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [onLocationSelect])

  return (
    <Card className={cn("overflow-hidden border border-border/70 shadow-sm bg-card", className)}>
      {/* Map Header */}
      {(title || showControls) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-primary animate-pulse" />
              <h3 className="font-heading text-sm sm:text-base font-bold text-foreground">
                {title || "Butuan City Interactive Map"}
              </h3>
              <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                Caraga Region
              </Badge>
              {roleContext && roleContext !== "public" && (
                <Badge variant="secondary" className="text-[10px] capitalize font-bold text-muted-foreground">
                  {roleContext} view
                </Badge>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>

          {/* Map Controls */}
          {showControls && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecenter}
                className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
                title="Recenter to Butuan City"
              >
                <HugeiconsIcon icon={ReloadIcon} size={13} />
                <span>Center Butuan</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLocateMe}
                disabled={userLocationState === "locating"}
                className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
                title="Find My Location (Explicit Permission Required)"
              >
                <HugeiconsIcon icon={Navigation01Icon} size={13} />
                <span>{userLocationState === "locating" ? "Locating..." : "My Location"}</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Message / Toast Banner */}
      {userMessage && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-xs font-medium text-primary flex items-center gap-2">
          <HugeiconsIcon icon={InformationCircleIcon} size={14} />
          <span>{userMessage}</span>
        </div>
      )}

      {/* Error Fallback Banner if tile network fails */}
      {tileErrorCount > 4 && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <span>Some map tiles could not be loaded from OpenStreetMap. Check your internet connection.</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTileErrorCount(0)
              mapInstanceRef.current?.invalidateSize()
            }}
            className="h-6 text-[11px] underline"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Active Pin Placement Banner */}
      {activePinMode && (
        <div className="bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold flex items-center justify-between gap-2 shadow-inner border-b border-primary-foreground/20">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-white animate-ping" />
            <span>
              Targeting: <strong>{activePinMode === "pickup" ? "Pickup Point (Green)" : "Dropoff Destination (Amber)"}</strong>. Click anywhere on the map or drag pin.
            </span>
          </div>
          <span className="text-[11px] opacity-90 bg-white/20 px-2 py-0.5 rounded font-mono">
            Crosshair Active
          </span>
        </div>
      )}

      {/* Leaflet DOM Container Wrapper */}
      <div className="relative w-full overflow-hidden">
        {/* Route Telemetry Overlay */}
        {route && route.coordinates.length > 1 && (
          <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 rounded-xl border border-border/80 bg-background/95 p-3 shadow-md backdrop-blur-xs text-xs max-w-xs pointer-events-auto">
            <div className="flex items-center justify-between gap-3">
              <span className="font-heading font-bold text-foreground flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                {route.label || "Road Route"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold",
                  route.isFallback || route.isApproximate
                    ? "border-amber-500/30 text-amber-600 bg-amber-500/10"
                    : "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                )}
              >
                {route.isFallback || route.isApproximate ? "Approximate Grid Estimate" : "OSRM Road Network"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground font-medium text-[11px]">
              <span>
                Road Distance:{" "}
                <strong className="text-foreground">
                  {route.isFallback || route.isApproximate ? `~${route.distanceKm} km (Approx.)` : `${route.distanceKm} km`}
                </strong>
              </span>
              <span>
                Est. Time: <strong className="text-foreground">~{route.durationMin} mins</strong>
              </span>
            </div>
            {secondaryRoute && (
              <div className="border-t border-border/60 pt-1 text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                Rider Dispatch: {secondaryRoute.distanceKm} km (~{secondaryRoute.durationMin} mins)
              </div>
            )}
          </div>
        )}

        <div
          ref={mapContainerRef}
          style={{ height, minHeight: "320px", width: "100%" }}
          className="relative bg-muted/40 z-0"
        />
      </div>

      {/* Selected Location Bar (if interactive point selected) */}
      {activePin && enableLocationSelect && (
        <div className="border-t border-border/60 bg-muted/10 p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <span className="flex size-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <HugeiconsIcon icon={PinLocation01Icon} size={15} />
            </span>
            <div>
              <span className="font-bold">{activePin.label}</span>
              <span className="text-muted-foreground ml-2">
                ({activePin.lat.toFixed(4)}°N, {activePin.lng.toFixed(4)}°E)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold gap-1">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
              Coordinates Captured
            </Badge>
          </div>
        </div>
      )}

      {/* Optional Custom Footer Content */}
      {footerContent && <div className="border-t border-border/60 p-3 sm:p-4">{footerContent}</div>}
    </Card>
  )
}
