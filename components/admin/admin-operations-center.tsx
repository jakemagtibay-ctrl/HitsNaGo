"use client"

// Operations command center displaying live Butuan City map, active dispatches, and trip status tracking
import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Motorbike01Icon,
  PackageIcon,
  Key01Icon,
  RefreshIcon,
  Alert01Icon,
  Clock01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import { resolveButuanCoordinates, convertBookingToMapMarkers, parseBookingGeo } from "@/lib/maps/geocode"
import { getRoadRoute, type RouteResult } from "@/lib/maps/routing"
import { getAllBookings, type Booking, type BookingStatus } from "@/lib/actions/bookings"
import type { MapMarker, MapRoute } from "@/components/maps/types"

interface AdminOperationsCenterProps {
  initialBookings: Booking[]
}

export function AdminOperationsCenter({ initialBookings }: AdminOperationsCenterProps) {
  const [bookings, setBookings] = React.useState<Booking[]>(initialBookings)
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false)
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [serviceFilter, setServiceFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null)

  // Road Route for selected inspected booking
  const [inspectedRoute, setInspectedRoute] = React.useState<RouteResult | null>(null)
  const [isRouting, setIsRouting] = React.useState<boolean>(false)

  // Hydration-safe post-mount initialization & controlled 20-second live polling
  React.useEffect(() => {
    let isCancelled = false

    // Queue timestamp update after mount to avoid server-client hydration mismatch and cascading render
    Promise.resolve().then(() => {
      if (!isCancelled) {
        setLastRefreshedAt(new Date())
      }
    })

    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return
      try {
        const fresh = await getAllBookings()
        if (!isCancelled) {
          setBookings(fresh)
          setLastRefreshedAt(new Date())
        }
      } catch (err) {
        console.warn("[AdminOperationsCenter] Background refresh failed:", err)
      }
    }, 20000)

    return () => {
      isCancelled = true
      clearInterval(interval)
    }
  }, [])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      const fresh = await getAllBookings()
      setBookings(fresh)
      setLastRefreshedAt(new Date())
    } catch (err) {
      console.error("[AdminOperationsCenter] Manual refresh error:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filter bookings
  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.destination ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.rider?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchService = serviceFilter === "all" || b.service_type === serviceFilter
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "live"
          ? b.status === "accepted" || b.status === "in_progress"
          : statusFilter === "pending"
          ? b.status === "pending" || b.status === "assigned"
          : b.status === statusFilter

      return matchSearch && matchService && matchStatus
    })
  }, [bookings, searchQuery, serviceFilter, statusFilter])

  // Compute operational alerts derived from lastRefreshedAt state (hydration safe)
  const nowMs = lastRefreshedAt ? lastRefreshedAt.getTime() : null
  const delayedTrips = React.useMemo(() => {
    if (!nowMs) return []
    return bookings.filter((b) => {
      if (b.status !== "in_progress" && b.status !== "accepted") return false
      const tripStart = new Date(b.scheduled_at || b.created_at).getTime()
      // Trip in progress for > 90 mins
      return nowMs - tripStart > 90 * 60 * 1000
    })
  }, [bookings, nowMs])

  const stalePendingBookings = React.useMemo(() => {
    if (!nowMs) return []
    return bookings.filter((b) => {
      if (b.status !== "pending") return false
      const created = new Date(b.created_at).getTime()
      // Unassigned for > 30 mins
      return nowMs - created > 30 * 60 * 1000
    })
  }, [bookings, nowMs])

  // Hydration-safe time string with deterministic placeholder and Asia/Manila timezone
  const formattedRefreshTime = React.useMemo(() => {
    if (!lastRefreshedAt) return "--:--:--"
    return lastRefreshedAt.toLocaleTimeString("en-PH", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }, [lastRefreshedAt])

  // Inspect route when selected booking changes
  React.useEffect(() => {
    let isCancelled = false

    if (!selectedBooking || !selectedBooking.destination) {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          setInspectedRoute(null)
          setIsRouting(false)
        }
      })
      return () => { isCancelled = true }
    }

    const geo = parseBookingGeo(selectedBooking)
    const startCoords = geo.pickupCoords
    const endCoords = geo.destCoords || (selectedBooking.destination ? resolveButuanCoordinates(selectedBooking.destination) : startCoords)

    if (startCoords.lat === endCoords.lat && startCoords.lng === endCoords.lng) {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          setInspectedRoute(null)
          setIsRouting(false)
        }
      })
      return () => { isCancelled = true }
    }

    Promise.resolve().then(() => {
      if (!isCancelled) setIsRouting(true)
    })

    getRoadRoute(startCoords, endCoords)
      .then((res) => {
        if (!isCancelled) {
          setInspectedRoute(res)
          setIsRouting(false)
        }
      })
      .catch((err) => {
        console.error("Routing error for inspected booking:", err)
        if (!isCancelled) setIsRouting(false)
      })

    return () => { isCancelled = true }
  }, [selectedBooking])

  // Map markers for all filtered bookings
  const mapMarkers: MapMarker[] = React.useMemo(() => {
    return filteredBookings.flatMap((b) => {
      const markers = convertBookingToMapMarkers(b)
      // Attach click action to select booking
      return markers.map((m) => ({
        ...m,
        onAction: () => setSelectedBooking(b),
        actionLabel: `Inspect ${b.reference}`,
      }))
    })
  }, [filteredBookings])

  const mapRoute: MapRoute | undefined = React.useMemo(() => {
    if (!inspectedRoute) return undefined
    return {
      coordinates: inspectedRoute.coordinates,
      distanceKm: inspectedRoute.distanceKm,
      durationMinutes: inspectedRoute.durationMin,
      isEstimated: inspectedRoute.isFallback,
    }
  }, [inspectedRoute])

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "assigned":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold">Assigned</Badge>
      case "accepted":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-semibold">Accepted</Badge>
      case "in_progress":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">In Progress</Badge>
      case "completed":
        return <Badge className="bg-muted text-muted-foreground border-border text-[10px] font-semibold">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-semibold">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Telemetry Alert Banners */}
      {(delayedTrips.length > 0 || stalePendingBookings.length > 0) && (
        <div className="flex flex-col gap-2.5">
          {delayedTrips.length > 0 && (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Alert01Icon} size={16} className="shrink-0 animate-pulse" />
                <span>
                  <strong>Stalled Trip Alert:</strong> {delayedTrips.length} active booking(s) have been in transit for over 90 minutes. Verify rider telemetry and customer arrival.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("live")
                  if (delayedTrips[0]) setSelectedBooking(delayedTrips[0])
                }}
                className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold shrink-0"
              >
                Inspect Delayed
              </Button>
            </div>
          )}

          {stalePendingBookings.length > 0 && (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Clock01Icon} size={16} className="shrink-0" />
                <span>
                  <strong>Unassigned Queue Delay:</strong> {stalePendingBookings.length} booking request(s) have been waiting for over 30 minutes without a rider assigned.
                </span>
              </div>
              <Link
                href="/dashboard/admin/bookings"
                className="h-7 px-3 py-1 rounded-lg text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold inline-flex items-center"
              >
                Dispatch Now
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Map Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-bold text-foreground">
              Butuan City Live Operations & Dispatch Center
            </h2>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-ping mr-1 inline-block" />
              Live Sync (20s)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geographic overview of active passenger trips, delivery couriers, and rental fleets in Butuan City.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-mono">
            Updated {formattedRefreshTime}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs gap-1.5 font-medium"
          >
            <HugeiconsIcon icon={RefreshIcon} size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Operations Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card shadow-xs">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            size={15}
            className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, customer, barangay, or rider..."
            className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Service Type Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Services" },
            { id: "ride", label: "Rides" },
            { id: "delivery", label: "Deliveries" },
            { id: "rental", label: "Rentals" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setServiceFilter(item.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                serviceFilter === item.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3">
          {[
            { id: "all", label: "All" },
            { id: "live", label: "Active Live" },
            { id: "pending", label: "Pending" },
            { id: "completed", label: "Completed" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === item.id
                  ? "bg-muted text-foreground ring-1 ring-border font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Operations Map Container */}
      <div className="flex flex-col gap-2">
        <ButuanCityMap
          title="Butuan City Dispatch & Coverage Grid"
          description={`Showing ${mapMarkers.length} transit points across ${filteredBookings.length} booking records`}
          height="460px"
          markers={mapMarkers}
          route={mapRoute}
          showLandmarks={true}
          showControls={true}
          enableLocationSelect={true}
          roleContext="admin"
          footerContent={
            selectedBooking ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/80 text-xs">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedBooking.service_type === "ride" ? (
                      <HugeiconsIcon icon={Motorbike01Icon} size={16} />
                    ) : selectedBooking.service_type === "delivery" ? (
                      <HugeiconsIcon icon={PackageIcon} size={16} />
                    ) : (
                      <HugeiconsIcon icon={Key01Icon} size={16} />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{selectedBooking.reference}</span>
                      {getStatusBadge(selectedBooking.status)}
                      <span className="text-muted-foreground">• Customer: {selectedBooking.customer_name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <strong>From:</strong> {selectedBooking.pickup} ➔ <strong>To:</strong> {selectedBooking.destination || "Butuan City"}
                    </div>
                    {isRouting ? (
                      <div className="text-[11px] text-muted-foreground animate-pulse">
                        Calculating road route via OSRM...
                      </div>
                    ) : inspectedRoute ? (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Road Distance: {inspectedRoute.distanceKm} km (~{inspectedRoute.durationMin} mins driving)
                        {inspectedRoute.isFallback && " (Estimated municipal grid)"}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/dashboard/admin/bookings"
                    className="h-7 px-3 py-1 rounded-lg text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold inline-flex items-center gap-1 shadow-xs"
                  >
                    <span>Manage Dispatch</span>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Clear Inspection
                  </Button>
                </div>
              </div>
            ) : undefined
          }
        />
      </div>

      {/* Live Booking Monitor Strip */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-foreground">
            Live Dispatch Queue ({filteredBookings.length})
          </h3>
          <span className="text-[11px] text-muted-foreground">
            Click any row to trace route and coordinates on the map
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBookings.slice(0, 6).map((b) => {
            const isSelected = selectedBooking?.id === b.id
            return (
              <Card
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className={`p-3.5 border transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 bg-primary/[0.03] shadow-xs"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary">{b.reference}</span>
                    {getStatusBadge(b.status)}
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                    <div className="truncate">
                      <strong>Pickup:</strong> {b.pickup}
                    </div>
                    {b.destination && (
                      <div className="truncate">
                        <strong>Dropoff:</strong> {b.destination}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                    <span className="text-muted-foreground font-mono">
                      ₱{Number(b.estimated_fare).toLocaleString("en-PH")}
                    </span>
                    <span className="font-semibold text-foreground">
                      {b.rider?.name || (b.status === "pending" ? "Unassigned" : "Waiting Dispatch")}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
