"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PinLocation01Icon,
  Navigation01Icon,
  Clock01Icon,
  Cancel01Icon,
  Motorbike01Icon,
  Message01Icon,
  CustomerService01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookingStatusBadge } from "@/components/dashboard/status-badge"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import type { MapMarker, MapRoute } from "@/components/maps/types"
import { resolveButuanCoordinates, parseBookingGeo } from "@/lib/maps/geocode"
import { getRoadRoute, type RouteResult } from "@/lib/maps/routing"
import type { Booking } from "@/lib/actions/bookings"
import { getOrCreateBookingConversation, createSupportConversation } from "@/lib/actions/messaging"

interface CustomerTripTrackingModalProps {
  booking: Booking
  isOpen: boolean
  onClose: () => void
}

export function CustomerTripTrackingModal({
  booking,
  isOpen,
  onClose,
}: CustomerTripTrackingModalProps) {
  const router = useRouter()
  const [routeResult, setRouteResult] = React.useState<RouteResult | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = React.useState<boolean>(false)
  const [isMessaging, setIsMessaging] = React.useState<boolean>(false)

  const geo = React.useMemo(() => parseBookingGeo(booking), [booking])
  const pickupCoords = React.useMemo(
    () => geo.pickupCoords || resolveButuanCoordinates(booking.pickup),
    [geo, booking.pickup]
  )
  const destCoords = React.useMemo(
    () => (booking.destination ? geo.destCoords || resolveButuanCoordinates(booking.destination) : null),
    [geo, booking.destination]
  )

  // Calculate real road route between pickup and destination
  React.useEffect(() => {
    let isCancelled = false
    Promise.resolve().then(() => {
      if (!isCancelled) setIsLoadingRoute(true)
    })

    const start = pickupCoords
    const end = destCoords || pickupCoords

    getRoadRoute(start, end)
      .then((res) => {
        if (!isCancelled) {
          setRouteResult(res)
          setIsLoadingRoute(false)
        }
      })
      .catch((err) => {
        console.warn("[CustomerTripTrackingModal] Route calculation failed:", err)
        if (!isCancelled) setIsLoadingRoute(false)
      })

    return () => {
      isCancelled = true
    }
  }, [pickupCoords, destCoords])

  // Map markers for MapCN
  const mapMarkers: MapMarker[] = React.useMemo(() => {
    const list: MapMarker[] = []

    list.push({
      id: "pickup",
      title: "Your Pickup Point",
      description: booking.pickup,
      address: booking.pickup,
      lat: pickupCoords.lat,
      lng: pickupCoords.lng,
      category: "pickup",
      badgeText: "Pickup Location",
    })

    if (destCoords && booking.destination) {
      list.push({
        id: "dropoff",
        title: "Your Destination",
        description: booking.destination,
        address: booking.destination,
        lat: destCoords.lat,
        lng: destCoords.lng,
        category: "destination",
        badgeText: "Dropoff Destination",
      })
    }

    return list
  }, [booking.pickup, booking.destination, pickupCoords, destCoords])

  const mapRoute: MapRoute | undefined = React.useMemo(() => {
    if (!routeResult) return undefined
    return {
      coordinates: routeResult.coordinates,
      distanceKm: routeResult.distanceKm,
      durationMinutes: routeResult.durationMin,
      isEstimated: routeResult.isFallback,
    }
  }, [routeResult])

  // Direct Message Rider
  const handleMessageRider = async () => {
    setIsMessaging(true)
    try {
      const res = await getOrCreateBookingConversation(booking.id)
      if (res.conversationId) {
        onClose()
        router.push(`/dashboard/customer/messages?conversationId=${res.conversationId}`)
      } else {
        router.push(`/dashboard/customer/messages?bookingId=${booking.id}`)
      }
    } catch {
      router.push(`/dashboard/customer/messages?bookingId=${booking.id}`)
    } finally {
      setIsMessaging(false)
    }
  }

  // Direct Message Support
  const handleMessageSupport = async () => {
    setIsMessaging(true)
    try {
      const res = await createSupportConversation(
        `Support Inquiry for ${booking.reference}`,
        booking.id
      )
      if (res.conversationId) {
        onClose()
        router.push(`/dashboard/customer/messages?conversationId=${res.conversationId}`)
      } else {
        router.push("/dashboard/customer/messages")
      }
    } catch {
      router.push("/dashboard/customer/messages")
    } finally {
      setIsMessaging(false)
    }
  }

  if (!isOpen) return null

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
                  Trip Route & Status
                </h2>
                <Badge variant="outline" className="font-mono text-[11px] font-bold text-primary">
                  {booking.reference}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Service Area: Butuan City, Agusan del Norte
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BookingStatusBadge status={booking.status} />
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
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
                  Mapping road route...
                </div>
              )}
            </div>

            {/* Route Stats */}
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
                    <span className="text-muted-foreground">Estimated Time:</span>
                    <strong className="text-foreground font-semibold">~{routeResult.durationMin} mins</strong>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground">
                  {routeResult.isFallback ? "Municipal grid estimate" : "Real road route via OSRM"}
                </div>
              </div>
            )}
          </div>

          {/* Details & Actions Column */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            {/* Route summary */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Trip Route
              </span>

              <div className="flex items-start gap-2">
                <HugeiconsIcon icon={PinLocation01Icon} size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">Pickup Location</span>
                  <span className="text-muted-foreground text-[11px]">{booking.pickup}</span>
                </div>
              </div>

              {booking.destination && (
                <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                  <HugeiconsIcon icon={PinLocation01Icon} size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-foreground block">Destination</span>
                    <span className="text-muted-foreground text-[11px]">{booking.destination}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Assigned Rider info or Pending State */}
            {booking.rider ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <HugeiconsIcon icon={Motorbike01Icon} size={16} className="text-primary" />
                    Assigned Rider
                  </span>
                  <span className="text-[10px] text-primary font-bold uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>

                <div className="text-muted-foreground flex flex-col gap-1 text-[11px]">
                  <div>Name: <strong className="text-foreground">{booking.rider.name}</strong></div>
                  {booking.rider.vehicle_model && (
                    <div>Vehicle: <strong className="text-foreground">{booking.rider.vehicle_model}</strong> ({booking.rider.plate_number || "Verified"})</div>
                  )}
                  {booking.rider.rating && (
                    <div>Rating: <strong className="text-foreground">★ {Number(booking.rider.rating).toFixed(2)}</strong></div>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={handleMessageRider}
                  disabled={isMessaging}
                  className="mt-1 gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs w-full"
                >
                  <HugeiconsIcon icon={Message01Icon} size={14} />
                  <span>{isMessaging ? "Connecting..." : "Chat with Rider"}</span>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                  <span className="size-2 rounded-full bg-amber-500 animate-ping inline-block" />
                  <span>Awaiting Rider Acceptance</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your booking is broadcasted to active verified riders across Butuan City. The first rider to accept will immediately be assigned.
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMessageSupport}
                  disabled={isMessaging}
                  className="gap-1.5 text-xs font-semibold w-full mt-1"
                >
                  <HugeiconsIcon icon={CustomerService01Icon} size={14} />
                  <span>Contact Support</span>
                </Button>
              </div>
            )}

            {/* Fare Summary */}
            <div className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between text-xs mt-auto">
              <span className="text-muted-foreground">Estimated Fare ({booking.payment_mode}):</span>
              <strong className="text-base font-heading font-bold text-foreground">
                ₱{Number(booking.estimated_fare).toLocaleString("en-PH")}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
