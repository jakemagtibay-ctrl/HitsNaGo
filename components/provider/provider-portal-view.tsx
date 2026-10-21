"use client"

// Rental provider portal view for approving reservations, tracking fleet units, and recording cash payments
import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Calendar01Icon,
  PinLocation01Icon,
  Alert01Icon,
  Mail01Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import { resolveButuanCoordinates, parseBookingGeo } from "@/lib/maps/geocode"
import { parseBookingCancellationInfo } from "@/lib/cancellations/metadata"
import { ProviderIncidentDialog } from "@/components/provider/provider-incident-dialog"
import { ProviderUnitModal } from "@/components/provider/provider-unit-modal"
import type { MapMarker } from "@/components/maps/types"
import type { Booking, Provider } from "@/lib/actions/bookings"
import { updateBookingStatus } from "@/lib/actions/bookings"
import { recordCashPayment } from "@/lib/actions/payments"
import type { RentalUnit } from "@/types/rental"
import type { ButuanRentalItem } from "@/lib/mock-data/butuan-rental-listings"

interface RentalRequest {
  id: string
  reference: string
  customerName: string
  itemName: string
  startDate: string
  endDate: string
  amount: number
  status: "pending" | "accepted" | "declined"
  location: string
}

const INITIAL_REQUESTS: RentalRequest[] = [
  {
    id: "req_01",
    reference: "HNG-RNT-4921",
    customerName: "Maria Teresa Gomez",
    itemName: "Toyota HiAce Commuter Van",
    startDate: "2026-10-12",
    endDate: "2026-10-15",
    amount: 8400,
    status: "pending",
    location: "Bancasi Airport, Butuan City",
  },
  {
    id: "req_02",
    reference: "HNG-RNT-8812",
    customerName: "Roberto Dela Cruz",
    itemName: "Honda CRF150L Trail Bike",
    startDate: "2026-10-14",
    endDate: "2026-10-16",
    amount: 1800,
    status: "accepted",
    location: "Langihan Road, Butuan City",
  },
]

interface ProviderPortalViewProps {
  provider: Provider
  initialBookings?: Booking[]
  initialInventory?: { listing: ButuanRentalItem; units: RentalUnit[] }[]
}

export function ProviderPortalView({
  provider,
  initialBookings = [],
  initialInventory = [],
}: ProviderPortalViewProps) {
  const [activeTab, setActiveTab] = React.useState<"bookings" | "listings" | "requests">(
    initialBookings.length > 0 ? "bookings" : "listings"
  )
  const [bookings, setBookings] = React.useState<Booking[]>(initialBookings)
  const [inventory, setInventory] = React.useState(initialInventory)
  const [requests, setRequests] = React.useState<RentalRequest[]>(INITIAL_REQUESTS)
  const [message, setMessage] = React.useState<string | null>(null)

  // Unit management modal state
  const [editingUnit, setEditingUnit] = React.useState<{ unit: RentalUnit; listingTitle: string } | null>(null)

  // Incident dialog state
  const [selectedBookingForIncident, setSelectedBookingForIncident] = React.useState<Booking | null>(null)
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = React.useState<boolean>(false)
  const [updatingBookingId, setUpdatingBookingId] = React.useState<string | null>(null)
  const [recordingPaymentId, setRecordingPaymentId] = React.useState<string | null>(null)

  const handleUpdateRentalStatus = async (
    bookingId: string,
    newStatus: "accepted" | "in_progress" | "completed"
  ) => {
    setUpdatingBookingId(bookingId)
    try {
      const { error } = await updateBookingStatus(bookingId, newStatus)
      if (error) {
        setMessage(`Error: ${error}`)
      } else {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        )
        const labels: Record<string, string> = {
          accepted: "Rental request confirmed and reserved.",
          in_progress: "Vehicle handed over. Rental period is now active.",
          completed: "Vehicle return finalized. Rental completed successfully.",
        }
        setMessage(labels[newStatus] || `Rental status updated to ${newStatus}.`)
      }
    } catch {
      setMessage("Failed to update rental status.")
    } finally {
      setUpdatingBookingId(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleRecordProviderCash = async (b: Booking) => {
    setRecordingPaymentId(b.id)
    try {
      const res = await recordCashPayment({
        bookingId: b.id,
        amount: Number(b.estimated_fare),
        notes: `Collected in cash by rental provider ${provider.business_name}`,
      })

      if (res.error) {
        setMessage(`Payment Error: ${res.error}`)
      } else {
        setBookings((prev) =>
          prev.map((item) => (item.id === b.id ? ({ ...item, payment_status: "paid" } as any) : item))
        )
        setMessage(`Cash payment of ₱${Number(b.estimated_fare).toLocaleString("en-PH")} recorded successfully.`)
      }
    } catch {
      setMessage("Could not record cash payment.")
    } finally {
      setRecordingPaymentId(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleAction = (id: string, newStatus: "accepted" | "declined") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
    setMessage(`Request marked as ${newStatus}.`)
    setTimeout(() => setMessage(null), 4000)
  }

  const providerMarkers: MapMarker[] = React.useMemo(() => {
    const listMarkers: MapMarker[] = inventory.map(({ listing, units }) => {
      const address = listing.pickupAddress || "Butuan City"
      const coords = resolveButuanCoordinates(address)
      const availCount = units.filter((u) => u.status === "available").length
      return {
        id: `provider-${listing.id}`,
        title: listing.title,
        description: `Rate: ₱${listing.pricePerDay.toLocaleString("en-PH")}/day • ${availCount} of ${units.length} units available`,
        address,
        lat: coords.lat,
        lng: coords.lng,
        category: "listing" as const,
        badgeText: "Rental Fleet",
      }
    })

    const reqMarkers: MapMarker[] = requests.map((r) => {
      const coords = resolveButuanCoordinates(r.location)
      return {
        id: `request-${r.id}`,
        title: `Request: ${r.itemName}`,
        description: `Customer: ${r.customerName} (${r.startDate} to ${r.endDate})`,
        address: r.location,
        lat: coords.lat,
        lng: coords.lng,
        category: "pickup" as const,
        badgeText: "Handover / Pickup",
      }
    })

    const bookingMarkers: MapMarker[] = bookings.map((b) => {
      const coords = resolveButuanCoordinates(b.pickup)
      return {
        id: `booking-${b.id}`,
        title: `Rental: ${b.reference}`,
        description: `Customer: ${b.customer_name} • Status: ${b.status}`,
        address: b.pickup,
        lat: coords.lat,
        lng: coords.lng,
        category: "pickup" as const,
        badgeText: `Rental Booking (${b.status})`,
      }
    })

    return [...listMarkers, ...reqMarkers, ...bookingMarkers]
  }, [inventory, requests, bookings])

  const handleOpenIncidentDialog = (booking: Booking) => {
    setSelectedBookingForIncident(booking)
    setIsIncidentDialogOpen(true)
  }

  const handleIncidentSuccess = () => {
    setIsIncidentDialogOpen(false)
    if (selectedBookingForIncident) {
      if (selectedBookingForIncident.status === "in_progress") {
        setMessage("Emergency incident successfully escalated to Admin Dispatch.")
      } else {
        setMessage("Rental reservation cancelled successfully. Calendar availability released.")
        setBookings((prev) =>
          prev.map((b) => (b.id === selectedBookingForIncident.id ? { ...b, status: "cancelled" } : b))
        )
      }
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs text-muted-foreground -mt-2">
        Active Provider Account: <strong className="text-foreground">{provider.business_name || provider.name}</strong> ({provider.email})
      </div>
      {message && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary font-medium flex items-center gap-2">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
          <span>{message}</span>
        </div>
      )}

      {/* Fleet & Location Coverage Map */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-heading text-sm font-bold text-foreground">
              Fleet Coverage & Handover Locations
            </h3>
            <p className="text-xs text-muted-foreground">
              Geographic distribution of your rental vehicles, equipment hubs, and customer handover locations in Butuan City.
            </p>
          </div>
        </div>

        <ButuanCityMap
          title="Rental Fleet & Handover Map"
          description="Butuan City, Agusan del Norte • Authorized listing points & customer requests"
          height="400px"
          markers={providerMarkers}
          showLandmarks={true}
          showControls={true}
          roleContext="provider"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "bookings"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Active Bookings ({bookings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "listings"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Fleet Inventory & Units ({inventory.reduce((acc, curr) => acc + curr.units.length, 0)})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "requests"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Rental Requests ({requests.length})
        </button>
      </div>

      {activeTab === "bookings" ? (
        <div className="flex flex-col gap-4">
          {bookings.length === 0 ? (
            <Card className="p-8 text-center border-border/80 bg-card text-muted-foreground text-xs">
              No confirmed rental bookings yet in system. Customer reservations will appear here.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map((booking) => {
                const parsed = parseBookingCancellationInfo(booking.notes)
                const isCancelled = booking.status === "cancelled"
                const isInProgress = booking.status === "in_progress"
                const isEligibleToCancel = ["pending", "assigned", "accepted"].includes(booking.status)

                return (
                  <Card key={booking.id} className="border-border/80 bg-card p-5 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary">{booking.reference}</span>
                        <Badge
                          className={
                            isCancelled
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : isInProgress
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="flex flex-col">
                        <span className="font-heading text-sm font-bold text-foreground">
                          {booking.vehicle_category?.toUpperCase() || "Rental Vehicle"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Customer: <strong className="text-foreground">{booking.customer_name}</strong>
                        </span>
                      </div>

                      {(() => {
                        const geo = parseBookingGeo(booking)
                        return (
                          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                            <div className="flex items-start gap-1.5">
                              <HugeiconsIcon icon={PinLocation01Icon} size={14} className="text-primary shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-foreground block truncate">Pickup: {geo.pickupPlaceName || booking.pickup}</span>
                                {geo.pickupAddress && geo.pickupAddress !== geo.pickupPlaceName && (
                                  <span className="text-[11px] text-muted-foreground block truncate">{geo.pickupAddress}</span>
                                )}
                              </div>
                            </div>
                            {booking.destination && (
                              <div className="flex items-start gap-1.5">
                                <HugeiconsIcon icon={PinLocation01Icon} size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-foreground block truncate">Return: {geo.destPlaceName || booking.destination}</span>
                                  {geo.destAddress && geo.destAddress !== geo.destPlaceName && (
                                    <span className="text-[11px] text-muted-foreground block truncate">{geo.destAddress}</span>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <HugeiconsIcon icon={Calendar01Icon} size={13} className="shrink-0" />
                              <span>
                                Scheduled: {new Date(booking.scheduled_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                              </span>
                            </div>
                          </div>
                        )
                      })()}

                      {/* Notes snippet */}
                      {booking.notes && (
                        <p className="text-[11px] text-muted-foreground/80 line-clamp-2 bg-muted/30 p-2 rounded-lg">
                          {booking.notes.replace(/\[CANCELLATION:.*?\]/g, "").replace(/\[EMERGENCY:.*?\]/g, "")}
                        </p>
                      )}

                      {/* Cancellation banner */}
                      {isCancelled && parsed.cancellation && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-[11px] text-destructive flex flex-col gap-1">
                          <span className="font-bold">Cancelled by {parsed.cancellation.cancelledBy} ({parsed.cancellation.cancelledByRole})</span>
                          <span>Reason: {parsed.cancellation.reason}</span>
                          {parsed.cancellation.explanation && <span>Note: {parsed.cancellation.explanation}</span>}
                          <span className="text-[10px] opacity-75">
                            {new Date(parsed.cancellation.cancelledAt).toLocaleString("en-PH")}
                          </span>
                        </div>
                      )}

                      {/* Emergency banner */}
                      {parsed.emergency && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-700 dark:text-amber-300 flex flex-col gap-1">
                          <span className="font-bold">⚠️ Urgent Incident: {parsed.emergency.category}</span>
                          <span>{parsed.emergency.description}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-foreground">
                          ₱{Number(booking.estimated_fare).toLocaleString("en-PH")}
                        </span>
                        <div className="mt-0.5">
                          {(booking as any).payment_status === "paid" ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              ✓ Paid in Cash
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                              Pending Cash
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* Cash Collection Button for Provider */}
                        {!(booking as any).payment_status || (booking as any).payment_status !== "paid" ? (
                          (booking.status === "in_progress" || booking.status === "completed" || booking.status === "accepted") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2 gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-bold"
                              disabled={recordingPaymentId === booking.id}
                              onClick={() => handleRecordProviderCash(booking)}
                            >
                              <HugeiconsIcon icon={Coins01Icon} size={12} />
                              {recordingPaymentId === booking.id ? "Recording..." : "Collect Cash"}
                            </Button>
                          )
                        ) : null}
                        <Link
                          href={`/dashboard/provider/inbox?bookingId=${booking.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-2.5 h-7 text-xs font-semibold text-foreground hover:bg-muted transition-colors gap-1"
                        >
                          <HugeiconsIcon icon={Mail01Icon} size={12} />
                          <span>Chat</span>
                        </Link>

                        {booking.status === "pending" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={updatingBookingId === booking.id}
                            onClick={() => handleUpdateRentalStatus(booking.id, "accepted")}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                            {updatingBookingId === booking.id ? "Updating..." : "Approve Rental"}
                          </Button>
                        )}

                        {booking.status === "accepted" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={updatingBookingId === booking.id}
                            onClick={() => handleUpdateRentalStatus(booking.id, "in_progress")}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                            {updatingBookingId === booking.id ? "Updating..." : "Handover Vehicle"}
                          </Button>
                        )}

                        {isInProgress && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                            disabled={updatingBookingId === booking.id}
                            onClick={() => handleUpdateRentalStatus(booking.id, "completed")}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                            {updatingBookingId === booking.id ? "Updating..." : "Complete Return"}
                          </Button>
                        )}

                        {isEligibleToCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5 gap-1 text-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenIncidentDialog(booking)}
                          >
                            <HugeiconsIcon icon={Cancel01Icon} size={12} />
                            {booking.status === "pending" ? "Decline Request" : "Cancel Rental"}
                          </Button>
                        )}

                        {isInProgress && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs px-2.5 gap-1"
                            onClick={() => handleOpenIncidentDialog(booking)}
                          >
                            <HugeiconsIcon icon={Alert01Icon} size={12} />
                            Report Breakdown
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ) : activeTab === "listings" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="font-heading text-sm font-bold text-foreground">
              Vehicle Model Fleet & Physical Units Inventory
            </h3>
            <p className="text-xs text-muted-foreground">
              Manage individual physical units for each vehicle model. Configure maintenance intervals or toggle operational availability to prevent customer scheduling conflicts.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {inventory.length === 0 ? (
              <Card className="p-8 text-center border-border/80 bg-card text-muted-foreground text-xs">
                No fleet inventory models registered. Vehicle models and equipment units will appear here.
              </Card>
            ) : (
              inventory.map(({ listing, units }) => {
                const total = units.length
                const available = units.filter((u) => u.status === "available").length
                const maintenance = units.filter((u) => u.status === "maintenance").length
                const unavailable = units.filter((u) => u.status === "unavailable").length

                return (
                  <Card key={listing.id} className="border-border/80 bg-card overflow-hidden shadow-xs flex flex-col gap-4 p-5">
                    {/* Model Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                            {listing.category}
                          </Badge>
                          <span className="font-mono text-xs font-bold text-primary">
                            ₱{listing.pricePerDay.toLocaleString("en-PH")} / day
                          </span>
                        </div>
                        <h4 className="font-heading text-base font-bold text-foreground">
                          {listing.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <HugeiconsIcon icon={PinLocation01Icon} size={13} className="text-primary shrink-0" />
                          <span>{listing.pickupAddress}</span>
                        </div>
                      </div>

                      {/* Model Fleet Summary Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                          {available} Available
                        </span>
                        {maintenance > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                            {maintenance} In Maintenance
                          </span>
                        )}
                        {unavailable > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-1 rounded-full">
                            {unavailable} Unavailable
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground font-semibold ml-1">
                          ({total} total units)
                        </span>
                      </div>
                    </div>

                    {/* Physical Units List */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Physical Units & Assigned Equipment:
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {units.map((unit) => {
                          const isAvail = unit.status === "available"
                          const isMaint = unit.status === "maintenance"
                          const isUnavail = unit.status === "unavailable"

                          return (
                            <div
                              key={unit.id}
                              className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col justify-between gap-3 text-xs"
                            >
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-foreground">
                                    {unit.unitIdentifier}
                                  </span>
                                  {isAvail && (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold text-[10px]">
                                      Available
                                    </Badge>
                                  )}
                                  {isMaint && (
                                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold text-[10px]">
                                      Maintenance
                                    </Badge>
                                  )}
                                  {isUnavail && (
                                    <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-semibold text-[10px]">
                                      Unavailable
                                    </Badge>
                                  )}
                                </div>

                                {isMaint && (
                                  <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg">
                                    <p className="font-semibold line-clamp-1">
                                      {unit.maintenanceReason ? `Reason: ${unit.maintenanceReason}` : "Under repair / maintenance"}
                                    </p>
                                    {unit.maintenanceStart && unit.maintenanceEnd && (
                                      <p className="text-[10px] opacity-80 mt-0.5">
                                        {new Date(unit.maintenanceStart).toLocaleDateString("en-PH")} → {new Date(unit.maintenanceEnd).toLocaleDateString("en-PH")}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUnit({ unit, listingTitle: listing.title })}
                                className="h-7 text-xs font-semibold gap-1.5 w-full mt-1"
                              >
                                <span>Manage Unit Status</span>
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="border-border/80 bg-card p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{req.reference}</span>
                  <Badge className={req.status === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : req.status === "accepted" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                    {req.status}
                  </Badge>
                </div>
                <h4 className="font-heading text-sm font-bold text-foreground">{req.itemName}</h4>
                <div className="text-xs text-muted-foreground">
                  Customer: <span className="text-foreground font-semibold">{req.customerName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HugeiconsIcon icon={Calendar01Icon} size={13} />
                  <span>{req.startDate} to {req.endDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                <span className="font-mono font-bold text-foreground">₱{req.amount.toLocaleString("en-PH")}</span>
                {req.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleAction(req.id, "accepted")}
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5 gap-1 text-destructive hover:bg-destructive/10"
                      onClick={() => handleAction(req.id, "declined")}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} />
                      Decline
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground capitalize font-semibold">{req.status}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Provider Unit Management Modal */}
      {editingUnit && (
        <ProviderUnitModal
          key={editingUnit.unit.id}
          unit={editingUnit.unit}
          listingTitle={editingUnit.listingTitle}
          isOpen={Boolean(editingUnit)}
          onClose={() => setEditingUnit(null)}
          onSuccess={(updatedUnit) => {
            setInventory((prev) =>
              prev.map((item) => ({
                ...item,
                units: item.units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)),
              }))
            )
            setMessage(`Unit "${updatedUnit.unitIdentifier}" status updated to ${updatedUnit.status.toUpperCase()}.`)
            setTimeout(() => setMessage(null), 4000)
          }}
        />
      )}

      {/* Provider Incident Dialog */}
      {selectedBookingForIncident && (
        <ProviderIncidentDialog
          booking={selectedBookingForIncident}
          isOpen={isIncidentDialogOpen}
          onClose={() => setIsIncidentDialogOpen(false)}
          onSuccess={handleIncidentSuccess}
        />
      )}
    </div>
  )
}
