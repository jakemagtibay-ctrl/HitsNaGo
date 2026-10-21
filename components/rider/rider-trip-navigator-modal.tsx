"use client"

// Turn-by-turn route navigation and trip progress modal for active riders
import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  PinLocation01Icon,
  Navigation01Icon,
  Clock01Icon,
  Cancel01Icon,
  PlayIcon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import type { MapMarker, MapRoute } from "@/components/maps/types"
import { resolveButuanCoordinates, parseBookingGeo } from "@/lib/maps/geocode"
import { getRoadRoute, type RouteResult, getNavigationUrl } from "@/lib/maps/routing"
import { updateBookingStatus, type Booking, type Rider, type BookingStatus } from "@/lib/actions/bookings"
import { getOrCreateBookingConversation } from "@/lib/actions/messaging"

interface RiderTripNavigatorModalProps {
  booking: Booking
  rider: Rider
  isOpen: boolean
  onClose: () => void
  onStatusUpdated?: (newStatus: BookingStatus) => void
}

export function RiderTripNavigatorModal({
  booking,
  rider,
  isOpen,
  onClose,
  onStatusUpdated,
}: RiderTripNavigatorModalProps) {
  const router = useRouter()

  // GPS Location Sharing State
  const [isSharingLocation, setIsSharingLocation] = React.useState<boolean>(false)
  const [riderCoords, setRiderCoords] = React.useState<{ lat: number; lng: number } | null>(null)
  const [gpsAccuracy, setGpsAccuracy] = React.useState<number | null>(null)
  const [gpsLastUpdated, setGpsLastUpdated] = React.useState<Date | null>(null)
  const [gpsError, setGpsError] = React.useState<string | null>(null)
  const [watchId, setWatchId] = React.useState<number | null>(null)

  // Road Routing state
  const [routeResult, setRouteResult] = React.useState<RouteResult | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = React.useState<boolean>(false)
  const [statusLoading, setStatusLoading] = React.useState<boolean>(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const geo = React.useMemo(() => parseBookingGeo(booking), [booking])
  const pickupCoords = React.useMemo(
    () => geo.pickupCoords || resolveButuanCoordinates(booking.pickup),
    [geo, booking.pickup]
  )
  const destCoords = React.useMemo(
    () => (booking.destination ? geo.destCoords || resolveButuanCoordinates(booking.destination) : null),
    [geo, booking.destination]
  )

  // Toggle GPS Location Sharing
  const handleToggleLocationSharing = React.useCallback(() => {
    if (isSharingLocation) {
      // Turn off tracking
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        setWatchId(null)
      }
      setIsSharingLocation(false)
      setRiderCoords(null)
      setGpsAccuracy(null)
      setGpsError(null)
      return
    }

    // Turn on tracking with explicit permission
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.")
      return
    }

    setGpsError(null)
    setIsSharingLocation(true)

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setRiderCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setGpsAccuracy(Math.round(position.coords.accuracy))
        setGpsLastUpdated(new Date())
        setGpsError(null)
      },
      (err) => {
        let msg = "Could not acquire location."
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings."
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS location request timed out. Please check your device GPS signal."
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Device location is currently unavailable."
        }
        setGpsError(msg)
        setIsSharingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )
    setWatchId(id)
  }, [isSharingLocation, watchId])

  // Stop tracking on unmount or modal close
  React.useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  // Calculate real road route:
  // Phase 1 (assigned / accepted): Rider GPS (or Butuan default) -> Customer Pickup
  // Phase 2 (in_progress): Customer Pickup -> Customer Destination
  React.useEffect(() => {
    let isCancelled = false
    Promise.resolve().then(() => {
      if (!isCancelled) setIsLoadingRoute(true)
    })

    let start = pickupCoords
    let end = destCoords || pickupCoords

    if (booking.status === "assigned" || booking.status === "accepted") {
      start = riderCoords || { lat: 8.9475, lng: 125.5406 }
      end = pickupCoords
    } else if (booking.status === "in_progress") {
      start = riderCoords || pickupCoords
      end = destCoords || pickupCoords
    }

    getRoadRoute(start, end)
      .then((res) => {
        if (!isCancelled) {
          setRouteResult(res)
          setIsLoadingRoute(false)
        }
      })
      .catch((err) => {
        console.warn("[RiderTripNavigatorModal] Route calculation failed:", err)
        if (!isCancelled) setIsLoadingRoute(false)
      })

    return () => {
      isCancelled = true
    }
  }, [booking.status, pickupCoords, destCoords, riderCoords])

  // Markers for MapCN
  const mapMarkers: MapMarker[] = React.useMemo(() => {
    const list: MapMarker[] = []

    // 1. Pickup marker
    list.push({
      id: "pickup",
      title: geo.pickupPlaceName || "Customer Pickup Point",
      description: geo.pickupDetails ? `${geo.pickupAddress} • Directions: ${geo.pickupDetails}` : geo.pickupAddress,
      address: geo.pickupAddress,
      lat: pickupCoords.lat,
      lng: pickupCoords.lng,
      category: "pickup",
      badgeText: "Customer Pickup",
    })

    // 2. Destination marker (if present)
    if (destCoords && booking.destination) {
      list.push({
        id: "dropoff",
        title: geo.destPlaceName || "Trip Destination",
        description: geo.destDetails ? `${geo.destAddress || booking.destination} • Directions: ${geo.destDetails}` : (geo.destAddress || booking.destination),
        address: geo.destAddress || booking.destination,
        lat: destCoords.lat,
        lng: destCoords.lng,
        category: "destination",
        badgeText: "Dropoff Point",
      })
    }

    // 3. Live Rider GPS marker (if location sharing is enabled)
    if (riderCoords) {
      list.push({
        id: "rider-live",
        title: `You: ${rider.name} (Live)`,
        description: `${rider.vehicle_model || "Motorcycle"} (${rider.plate_number || "Verified"})`,
        lat: riderCoords.lat,
        lng: riderCoords.lng,
        category: "rider",
        badgeText: "Your Current Location",
      })
    }

    return list
  }, [booking.pickup, booking.destination, pickupCoords, destCoords, riderCoords, rider])

  // MapCN Route Polyline
  const mapRoute: MapRoute | undefined = React.useMemo(() => {
    if (!routeResult) return undefined
    return {
      coordinates: routeResult.coordinates,
      distanceKm: routeResult.distanceKm,
      durationMinutes: routeResult.durationMin,
      isEstimated: routeResult.isFallback,
    }
  }, [routeResult])

  // Open Chat with Customer
  const handleMessageCustomer = async () => {
    try {
      const res = await getOrCreateBookingConversation(booking.id)
      if (res.conversationId) {
        onClose()
        router.push(`/dashboard/rider/messages?conversationId=${res.conversationId}`)
      } else {
        router.push(`/dashboard/rider/messages?bookingId=${booking.id}`)
      }
    } catch {
      router.push(`/dashboard/rider/messages?bookingId=${booking.id}`)
    }
  }

  // Handle Trip Status Transition
  const handleStatusChange = async (newStatus: BookingStatus) => {
    setStatusLoading(true)
    setActionError(null)
    const { error } = await updateBookingStatus(booking.id, newStatus)
    setStatusLoading(false)

    if (error) {
      setActionError(error)
      return
    }

    if (onStatusUpdated) {
      onStatusUpdated(newStatus)
    }
    router.refresh()
  }

  if (!isOpen) return null

  const targetCoords = booking.status === "in_progress" && destCoords ? destCoords : pickupCoords
  const originCoords = riderCoords || { lat: 8.9475, lng: 125.5406 }
  const googleNavUrl = getNavigationUrl(originCoords, targetCoords, "google")
  const wazeNavUrl = getNavigationUrl(originCoords, targetCoords, "waze")

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Navigation01Icon} size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">
                  Road Navigation & Trip Telemetry
                </h2>
                <Badge variant="outline" className="font-mono text-[11px] font-bold text-primary">
                  {booking.reference}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customer: <strong className="text-foreground">{booking.customer_name}</strong> • Butuan City Service Area
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

        {/* Modal Body: Split between Map & Navigation Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col lg:flex-row gap-5">
          {/* Map Column */}
          <div className="flex-1 flex flex-col gap-3 min-h-[320px] sm:min-h-[400px]">
            <div className="relative rounded-xl overflow-hidden border border-border h-full flex-1 min-h-[320px]">
              <ButuanCityMap
                markers={mapMarkers}
                route={mapRoute}
                initialCenter={[8.9475, 125.5406]}
                initialZoom={13}
                height="100%"
                className="w-full h-full min-h-[320px]"
              />

              {isLoadingRoute && (
                <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-xs border border-border px-3 py-1.5 rounded-lg text-xs font-medium text-foreground flex items-center gap-2 shadow-sm">
                  <span className="size-2 rounded-full bg-primary animate-ping inline-block" />
                  Calculating real road route...
                </div>
              )}
            </div>

            {/* Road Telemetry Bar */}
            {routeResult && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border/70 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Navigation01Icon} size={14} className="text-primary" />
                    <span className="text-muted-foreground">Road Distance:</span>
                    <strong className="text-foreground font-semibold">{routeResult.distanceKm} km</strong>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} size={14} className="text-emerald-600" />
                    <span className="text-muted-foreground">Est. Drive Time:</span>
                    <strong className="text-foreground font-semibold">~{routeResult.durationMin} mins</strong>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground">
                  {routeResult.isFallback ? "Approx. municipal grid" : "Real road route via OSRM"}
                </div>
              </div>
            )}
          </div>

          {/* Controls & Instructions Column */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            {/* GPS Location Sharing Switch */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "size-2.5 rounded-full inline-block",
                    isSharingLocation ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                  )} />
                  <span className="font-heading text-xs font-bold text-foreground">
                    Live GPS Location Sharing
                  </span>
                </div>

                <Button
                  size="sm"
                  variant={isSharingLocation ? "default" : "outline"}
                  onClick={handleToggleLocationSharing}
                  className="h-7 text-xs font-semibold px-2.5"
                >
                  {isSharingLocation ? "Active (Stop)" : "Enable GPS"}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                HitsNaGo requests GPS access only while on duty to calculate real-time road navigation to your customer and display accurate distance and ETA. Location is never collected without your explicit permission.
              </p>

              {gpsError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-[11px] text-destructive flex items-start gap-1.5">
                  <HugeiconsIcon icon={Alert01Icon} size={13} className="shrink-0 mt-0.5" />
                  <span>{gpsError}</span>
                </div>
              )}

              {isSharingLocation && riderCoords && (
                <div className="flex flex-col gap-1 text-[11px] bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-emerald-800 dark:text-emerald-300">
                  <span className="font-semibold">✓ GPS Tracking Active</span>
                  <span className="text-[10px] text-muted-foreground">
                    Accuracy: ±{gpsAccuracy}m • Last ping: {gpsLastUpdated?.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Current Phase & Destination info */}
            <div className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Current Navigation Target
              </span>

              {booking.status === "assigned" || booking.status === "accepted" ? (
                <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                  <HugeiconsIcon icon={PinLocation01Icon} size={16} className="shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-foreground block truncate">{geo.pickupPlaceName || "Customer Pickup Point"}</span>
                    <span className="text-muted-foreground text-[11px] block leading-snug">{geo.pickupAddress}</span>
                    {geo.pickupDetails && (
                      <span className="text-primary font-medium text-[10px] block mt-0.5">Directions: {geo.pickupDetails}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                  <HugeiconsIcon icon={PinLocation01Icon} size={16} className="shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-foreground block truncate">{geo.destPlaceName || "Trip Destination / Dropoff"}</span>
                    <span className="text-muted-foreground text-[11px] block leading-snug">{geo.destAddress || booking.destination}</span>
                    {geo.destDetails && (
                      <span className="text-primary font-medium text-[10px] block mt-0.5">Directions: {geo.destDetails}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* External Navigation Links */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                External Turn-by-Turn GPS
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleNavUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground border border-border transition-colors text-center"
                >
                  Google Maps ↗
                </a>
                <a
                  href={wazeNavUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground border border-border transition-colors text-center"
                >
                  Waze ↗
                </a>
              </div>
            </div>

            {/* Action Buttons: Message Customer & Trip Transition */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMessageCustomer}
                className="w-full gap-2 text-xs font-semibold"
              >
                <HugeiconsIcon icon={Message01Icon} size={15} className="text-primary" />
                <span>Message Customer</span>
              </Button>

              {booking.status === "accepted" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("in_progress")}
                  disabled={statusLoading}
                  className="w-full gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <HugeiconsIcon icon={PlayIcon} size={14} />
                  <span>{statusLoading ? "Starting..." : "Start Trip / Customer Picked Up"}</span>
                </Button>
              )}

              {booking.status === "in_progress" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("completed")}
                  disabled={statusLoading}
                  className="w-full gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                >
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                  <span>{statusLoading ? "Completing..." : "Complete Trip & Confirm Arrival"}</span>
                </Button>
              )}

              {actionError && (
                <p className="text-[11px] text-destructive text-center mt-1">{actionError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
