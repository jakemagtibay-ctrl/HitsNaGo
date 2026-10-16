"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  PinLocation01Icon,
  CheckmarkCircle01Icon,
  PlayIcon,
  Calendar01Icon,
  Cancel01Icon,
  Navigation01Icon,
  Alert01Icon,
  PackageIcon,
  Clock01Icon,
  RefreshIcon,
  CheckmarkBadge01Icon,
  RadioIcon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Booking, Rider, BookingStatus } from "@/lib/actions/bookings"
import {
  acceptBookingByRider,
  getAvailableBookingsForRider,
  getRiderBookings,
  updateBookingStatus,
} from "@/lib/actions/bookings"
import { createBrowserClient } from "@/lib/supabase"
import { resolveButuanCoordinates, parseBookingGeo } from "@/lib/maps/geocode"
import { getNavigationUrl } from "@/lib/maps/routing"
import { RiderIncidentDialog } from "@/components/rider/rider-incident-dialog"
import { parseBookingCancellationInfo } from "@/lib/cancellations/metadata"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface RiderBookingsViewProps {
  rider: Rider
  initialBookings: Booking[]
  initialAvailable?: Booking[]
  viewMode?: "active" | "history"
}

export function RiderBookingsView({
  rider,
  initialBookings,
  initialAvailable = [],
  viewMode = "active",
}: RiderBookingsViewProps) {
  const router = useRouter()
  const [bookings, setBookings] = React.useState<Booking[]>(initialBookings)
  const [availableRequests, setAvailableRequests] = React.useState<Booking[]>(initialAvailable)
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = React.useState<"available" | "assigned">(
    initialAvailable.length > 0 && !initialBookings.some((b) => b.status === "in_progress")
      ? "available"
      : "assigned"
  )

  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [issueSubmittedMsg, setIssueSubmittedMsg] = React.useState<string | null>(null)
  const [selectedIncidentBooking, setSelectedIncidentBooking] = React.useState<Booking | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false)

  const [prevInitialBookings, setPrevInitialBookings] = React.useState(initialBookings)
  if (initialBookings !== prevInitialBookings) {
    setPrevInitialBookings(initialBookings)
    setBookings(initialBookings)
  }

  const [prevInitialAvailable, setPrevInitialAvailable] = React.useState(initialAvailable)
  if (initialAvailable !== prevInitialAvailable) {
    setPrevInitialAvailable(initialAvailable)
    setAvailableRequests(initialAvailable)
  }

  // Active & history filters for assigned bookings
  const activeBookings = bookings.filter((b) =>
    ["assigned", "accepted", "in_progress"].includes(b.status)
  )
  const historyBookings = bookings.filter((b) =>
    ["completed", "cancelled"].includes(b.status)
  )

  // Visible broadcasted requests (excluding dismissed ones and any already assigned to this rider)
  const visibleAvailable = availableRequests.filter(
    (b) => !dismissedIds.has(b.id) && b.rider_id !== rider.id && b.status === "pending"
  )

  // Refresh both available queue and assigned queue
  const refreshAll = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [availRes, myBookings] = await Promise.all([
        getAvailableBookingsForRider(),
        getRiderBookings(),
      ])
      if (availRes.bookings) {
        setAvailableRequests(availRes.bookings)
      }
      if (myBookings) {
        setBookings(myBookings)
      }
    } catch (err) {
      console.warn("[RiderBookingsView] refresh error:", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Supabase Realtime subscription with fallback 8-second polling
  React.useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null = null

    try {
      const supabase = createBrowserClient()
      channel = supabase
        .channel("rider-bookings-feed")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bookings" },
          () => {
            refreshAll()
          }
        )
        .subscribe()
    } catch (err) {
      console.warn("[Realtime] Browser client init error, relying on interval polling:", err)
    }

    // 8-second periodic refresh fallback
    const interval = setInterval(() => {
      refreshAll()
    }, 8000)

    return () => {
      if (channel) {
        try {
          const supabase = createBrowserClient()
          supabase.removeChannel(channel)
        } catch {}
      }
      clearInterval(interval)
    }
  }, [refreshAll])

  // Atomic Accept Request handler
  const handleAcceptRequest = async (bookingId: string) => {
    setAcceptingId(bookingId)
    setErrorMessage(null)
    setSuccessMessage(null)

    const res = await acceptBookingByRider(bookingId)
    setAcceptingId(null)

    if (res.error) {
      setErrorMessage(res.error)
      // Stale or taken by another rider — remove immediately from available
      setAvailableRequests((prev) => prev.filter((b) => b.id !== bookingId))
      return
    }

    // Success!
    setSuccessMessage(
      `Trip ${res.booking?.reference || ""} accepted! You are now the assigned rider.`
    )
    setAvailableRequests((prev) => prev.filter((b) => b.id !== bookingId))
    if (res.booking) {
      setBookings((prev) => [res.booking as Booking, ...prev.filter((b) => b.id !== bookingId)])
    }
    setActiveTab("assigned")
    router.refresh()

    setTimeout(() => {
      setSuccessMessage(null)
    }, 5000)
  }

  // Dismiss / Decline an available request locally
  const handleDismissRequest = (bookingId: string) => {
    setDismissedIds((prev) => new Set([...prev, bookingId]))
  }

  // Lifecycle status progression for assigned bookings
  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    setLoadingId(bookingId)
    setErrorMessage(null)

    const { error } = await updateBookingStatus(bookingId, newStatus)
    if (error) {
      setErrorMessage(error)
      setLoadingId(null)
      return
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    )
    setLoadingId(null)
    router.refresh()
  }

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold">Broadcasted</Badge>
      case "assigned":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold">Assigned</Badge>
      case "accepted":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold">Accepted</Badge>
      case "in_progress":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold">In Progress</Badge>
      case "completed":
        return <Badge className="bg-muted text-muted-foreground border-border font-semibold">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-semibold">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Active Terminal Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground -mt-2">
        <div>
          Active Terminal: <strong className="text-foreground">{rider.name}</strong> • {rider.vehicle_model || "Motorcycle"} ({rider.plate_number || "Verified"})
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Live Dispatch Connected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAll}
            disabled={isRefreshing}
            className="h-7 text-xs px-2 gap-1"
          >
            <HugeiconsIcon icon={RefreshIcon} size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
          </Button>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center justify-between gap-2">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-destructive hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} />
          <span>{successMessage}</span>
        </div>
      )}
      {issueSubmittedMsg && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-600 dark:text-amber-400">
          {issueSubmittedMsg}
        </div>
      )}

      {/* Tabs: Available Requests vs My Assigned Bookings (Active Mode Only) */}
      {viewMode === "active" && (
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("available")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "available"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={RadioIcon} size={15} />
            <span>Available Requests</span>
            {visibleAvailable.length > 0 && (
              <Badge className="bg-amber-400 text-black font-black text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center rounded-full">
                {visibleAvailable.length}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("assigned")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === "assigned"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={Motorbike01Icon} size={15} />
            <span>My Assigned Bookings</span>
            {activeBookings.length > 0 && (
              <Badge className="bg-emerald-500 text-white font-black text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center rounded-full">
                {activeBookings.length}
              </Badge>
            )}
          </button>
        </div>
      )}

      {/* TAB 1: Available Requests (Broadcast Queue) */}
      {viewMode === "active" && activeTab === "available" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h3 className="font-heading text-sm font-bold text-foreground">
                Broadcasted Requests ({visibleAvailable.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Customer bookings waiting for rider acceptance. The first verified rider to accept receives the assignment.
              </p>
            </div>
          </div>

          {visibleAvailable.length === 0 ? (
            <Card className="border-dashed border-border/80 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                  <HugeiconsIcon icon={RadioIcon} size={28} className="animate-pulse" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Radar Active • No Open Requests
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  All current customer bookings in Butuan City are fulfilled. When a customer books a ride or delivery, new requests appear here instantly.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleAvailable.map((booking) => {
                const isAccepting = acceptingId === booking.id
                const geo = parseBookingGeo(booking)
                const totalFare = Number(booking.estimated_fare) || 0
                const riderEarnings = Math.round(totalFare * 0.8)
                const platformFee = Math.round(totalFare * 0.2)

                return (
                  <Card
                    key={booking.id}
                    className="border-primary/20 bg-card shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <div className="p-5 flex flex-col gap-4">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">
                            {booking.reference}
                          </span>
                          {booking.service_type === "delivery" ? (
                            <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-500 border-rose-500/20 font-semibold">
                              <HugeiconsIcon icon={PackageIcon} size={10} className="mr-1" />
                              Delivery
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold">
                              <HugeiconsIcon icon={Motorbike01Icon} size={10} className="mr-1" />
                              Ride
                            </Badge>
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <HugeiconsIcon icon={Clock01Icon} size={12} />
                          Open for Acceptance
                        </span>
                      </div>

                      {/* Customer info (privacy masked) */}
                      <div className="text-xs text-muted-foreground">
                        Customer: <strong className="text-foreground">{booking.customer_name}</strong>
                      </div>

                      {/* Route Locations */}
                      <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 text-xs">
                        <div className="flex items-start gap-2">
                          <HugeiconsIcon icon={PinLocation01Icon} size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                              {booking.service_type === "delivery" ? "Item Pickup Location" : "Passenger Pickup Location"}
                            </span>
                            <span className="font-semibold text-foreground">{booking.pickup}</span>
                          </div>
                        </div>

                        {booking.destination && (
                          <div className="flex items-start gap-2 pt-2 border-t border-border/40">
                            <HugeiconsIcon icon={PinLocation01Icon} size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                {booking.service_type === "delivery" ? "Delivery Destination" : "Dropoff Location"}
                              </span>
                              <span className="font-semibold text-foreground">{booking.destination}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fare & Schedule */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={Calendar01Icon} size={13} />
                            <span>{new Date(booking.scheduled_at).toLocaleString("en-PH")}</span>
                          </div>
                          <span>Total Fare: ₱{totalFare.toLocaleString("en-PH")}</span>
                        </div>

                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Your Payout (80% net): ₱{riderEarnings.toLocaleString("en-PH")}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Fee: ₱{platformFee.toLocaleString("en-PH")}
                          </span>
                        </div>
                      </div>

                      {geo.cleanNotes && (
                        <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded-lg">
                          &quot;{geo.cleanNotes}&quot;
                        </p>
                      )}
                    </div>

                    {/* Action Buttons: Accept / Dismiss */}
                    <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs"
                        onClick={() => handleAcceptRequest(booking.id)}
                        disabled={isAccepting}
                      >
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
                        {isAccepting ? "Claiming Request..." : "Accept Request"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-muted-foreground hover:text-foreground font-medium"
                        onClick={() => handleDismissRequest(booking.id)}
                        disabled={isAccepting}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2 or HISTORY: Assigned / Active Bookings */}
      {(viewMode === "history" || activeTab === "assigned") && (
        <div className="flex flex-col gap-4">
          {viewMode === "active" && (
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-heading text-sm font-bold text-foreground">
                  My Assigned Bookings ({activeBookings.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Bookings currently assigned to you. Fulfill the trip or manage pre-trip withdrawal and emergency actions.
                </p>
              </div>
            </div>
          )}

          {(viewMode === "history" ? historyBookings : activeBookings).length === 0 ? (
            <Card className="border-dashed border-border/80 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                  <HugeiconsIcon icon={Motorbike01Icon} size={28} />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  {viewMode === "history" ? "No Past Trips Yet" : "No Active Assignments"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  {viewMode === "history"
                    ? "Your completed and cancelled trips will be archived here."
                    : "You currently have no active trips in your queue. Switch to Available Requests above to claim new bookings."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(viewMode === "history" ? historyBookings : activeBookings).map((booking) => {
                const isLoading = loadingId === booking.id
                const geo = parseBookingGeo(booking)
                const pickupCoords = geo.pickupCoords
                const destCoords =
                  geo.destCoords || (booking.destination ? resolveButuanCoordinates(booking.destination) : null)

                const targetCoords = booking.status === "in_progress" && destCoords ? destCoords : pickupCoords
                const originCoords = booking.status === "in_progress" ? pickupCoords : { lat: 8.9475, lng: 125.5406 }

                const googleNavUrl = getNavigationUrl(originCoords, targetCoords, "google")
                const wazeNavUrl = getNavigationUrl(originCoords, targetCoords, "waze")

                const totalFare = Number(booking.estimated_fare) || 0
                const riderEarnings = Math.round(totalFare * 0.8)
                const platformFee = Math.round(totalFare * 0.2)
                const cleanNotes = geo.cleanNotes
                const cancellationInfo = parseBookingCancellationInfo(booking.notes)
                const cancellation = cancellationInfo.cancellation
                const emergency = cancellationInfo.emergency

                return (
                  <Card
                    key={booking.id}
                    className="border-border/80 bg-card shadow-xs overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 flex flex-col gap-4">
                      {/* Top: Reference, Service Badge, and Status */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">
                              {booking.reference}
                            </span>
                            {booking.service_type === "delivery" ? (
                              <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-500 border-rose-500/20 font-semibold">
                                <HugeiconsIcon icon={PackageIcon} size={10} className="mr-1" />
                                Delivery
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold">
                                <HugeiconsIcon icon={Motorbike01Icon} size={10} className="mr-1" />
                                Ride
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block mt-0.5">
                            Customer: {booking.customer_name}
                          </span>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Route points */}
                      <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 text-xs">
                        <div className="flex items-start gap-2">
                          <HugeiconsIcon icon={PinLocation01Icon} size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                              {booking.service_type === "delivery" ? "Item Pickup / Collection" : "Passenger Pickup"}
                            </span>
                            <span className="font-semibold text-foreground">{booking.pickup}</span>
                          </div>
                        </div>
                        {booking.destination && (
                          <div className="flex items-start gap-2 pt-2 border-t border-border/40">
                            <HugeiconsIcon icon={PinLocation01Icon} size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                                {booking.service_type === "delivery" ? "Dropoff Destination" : "Dropoff Location"}
                              </span>
                              <span className="font-semibold text-foreground">{booking.destination}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* External Navigation Links */}
                      {viewMode === "active" && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-primary/[0.04] border border-primary/15 text-[11px]">
                          <span className="text-muted-foreground font-medium flex items-center gap-1">
                            <HugeiconsIcon icon={Navigation01Icon} size={13} className="text-primary" />
                            Navigate to {booking.status === "in_progress" ? "Dropoff" : "Pickup"}:
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={googleNavUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-primary hover:underline hover:text-primary/80"
                            >
                              Google Maps ↗
                            </a>
                            <span className="text-muted-foreground">•</span>
                            <a
                              href={wazeNavUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-primary hover:underline hover:text-primary/80"
                            >
                              Waze ↗
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Schedule & Transparent Earnings Breakdown */}
                      <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50 text-xs">
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={Calendar01Icon} size={13} />
                            <span>{new Date(booking.scheduled_at).toLocaleString("en-PH")}</span>
                          </div>
                          <span>Customer Total: ₱{totalFare.toLocaleString("en-PH")}</span>
                        </div>

                        <div className="flex items-center justify-between bg-muted/30 px-2.5 py-1.5 rounded-lg">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Your Payout (80% net): ₱{riderEarnings.toLocaleString("en-PH")}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Platform fee (20%): ₱{platformFee.toLocaleString("en-PH")}
                          </span>
                        </div>
                      </div>

                      {cleanNotes && (
                        <p className="text-[11px] text-muted-foreground italic bg-muted/20 p-2 rounded-lg">
                          &quot;{cleanNotes}&quot;
                        </p>
                      )}

                      {/* Cancellation Record if cancelled */}
                      {booking.status === "cancelled" && cancellation && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <HugeiconsIcon icon={Cancel01Icon} size={14} />
                            <span>Cancelled by {cancellation.cancelledBy} ({cancellation.cancelledByRole})</span>
                          </div>
                          <p className="text-[11px] text-foreground">
                            <strong>Reason:</strong> {cancellation.reason}
                            {cancellation.explanation && <span> — &quot;{cancellation.explanation}&quot;</span>}
                          </p>
                        </div>
                      )}

                      {/* Active Emergency / Incident Notice */}
                      {emergency && (
                        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={Alert01Icon} size={15} />
                            <span><strong>Emergency Dispatched:</strong> {emergency.category} ({emergency.status.toUpperCase()})</span>
                          </div>
                          <span className="font-mono text-[10px]">Ref: {emergency.id}</span>
                        </div>
                      )}

                      {geo.isExact && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>✓ Precise Meter-Level GPS Coordinates Confirmed</span>
                        </div>
                      )}
                    </div>

                    {/* Actions: Start, Complete, Decline / Emergency */}
                    {viewMode === "active" && (
                      <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center gap-2">
                        {booking.status === "assigned" && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 text-xs gap-1 font-semibold"
                              onClick={() => handleStatusChange(booking.id, "accepted")}
                              disabled={isLoading}
                            >
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                              {isLoading ? "Updating..." : "Accept Trip"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-destructive hover:bg-destructive/10 font-medium"
                              onClick={() => setSelectedIncidentBooking(booking)}
                              disabled={isLoading}
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={14} />
                              Decline / Withdraw
                            </Button>
                          </>
                        )}

                        {booking.status === "accepted" && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                              onClick={() => handleStatusChange(booking.id, "in_progress")}
                              disabled={isLoading}
                            >
                              <HugeiconsIcon icon={PlayIcon} size={14} />
                              {isLoading ? "Updating..." : booking.service_type === "delivery" ? "Collected & Depart" : "Start Trip"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs text-destructive hover:bg-destructive/10 font-medium"
                              onClick={() => setSelectedIncidentBooking(booking)}
                              disabled={isLoading}
                            >
                              <HugeiconsIcon icon={Alert01Icon} size={13} />
                              Withdraw / Emergency
                            </Button>
                          </>
                        )}

                        {booking.status === "in_progress" && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs"
                              onClick={() => handleStatusChange(booking.id, "completed")}
                              disabled={isLoading}
                            >
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                              {isLoading ? "Updating..." : booking.service_type === "delivery" ? "Confirm Delivered" : "Complete Trip"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs font-semibold gap-1.5"
                              onClick={() => setSelectedIncidentBooking(booking)}
                              disabled={isLoading}
                            >
                              <HugeiconsIcon icon={Alert01Icon} size={13} />
                              Report Emergency
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Rider Incident & Withdrawal Dialog */}
      {selectedIncidentBooking && (
        <RiderIncidentDialog
          booking={selectedIncidentBooking}
          isOpen={!!selectedIncidentBooking}
          onClose={() => setSelectedIncidentBooking(null)}
          onSuccess={() => {
            setSelectedIncidentBooking(null)
            setIssueSubmittedMsg("Assignment update or emergency incident submitted to dispatch.")
            setTimeout(() => setIssueSubmittedMsg(null), 5000)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
