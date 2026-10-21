"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PinLocation01Icon,
  UserCheck01Icon,
  RefreshIcon,
  Alert01Icon,
  Clock01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Booking, Rider } from "@/lib/actions/bookings"
import { assignRider, getAllBookings, getAvailableRiders } from "@/lib/actions/bookings"
import { getBookingIncidents } from "@/lib/actions/cancellations"
import { getOrCreateBookingConversation } from "@/lib/actions/messaging"
import {
  parseBookingCancellationInfo,
  type BookingIncident,
} from "@/lib/cancellations/metadata"
import { cn } from "@/lib/utils"
import { AdminIncidentResolutionModal } from "@/components/admin/admin-incident-resolution-modal"

interface AdminBookingsTableProps {
  initialBookings: Booking[]
  initialIncidents?: BookingIncident[]
  dbNotice?: string | null
}

export function AdminBookingsTable({
  initialBookings,
  initialIncidents = [],
  dbNotice = null,
}: AdminBookingsTableProps) {
  const router = useRouter()
  const [bookings, setBookings] = React.useState<Booking[]>(initialBookings)
  const [incidents, setIncidents] = React.useState<BookingIncident[]>(initialIncidents)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [serviceFilter, setServiceFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  // Rider assignment modal
  const [assigningBooking, setAssigningBooking] = React.useState<Booking | null>(null)
  const [availableRiders, setAvailableRiders] = React.useState<Rider[]>([])
  const [isLoadingRiders, setIsLoadingRiders] = React.useState<boolean>(false)
  const [selectedRiderId, setSelectedRiderId] = React.useState<string>("")
  const [isAssigning, setIsAssigning] = React.useState<boolean>(false)
  const [assignError, setAssignError] = React.useState<string>("")
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false)

  // Incident resolution modal
  const [selectedIncident, setSelectedIncident] = React.useState<BookingIncident | null>(null)
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState<boolean>(false)

  // Quick count of active incidents
  const activeIncidents = React.useMemo(() => {
    return incidents.filter((i) => i.status === "open" || i.status === "investigating")
  }, [incidents])

  // Map incidents by booking_id for quick lookup
  const incidentsByBookingId = React.useMemo(() => {
    const map = new Map<string, BookingIncident>()
    for (const inc of incidents) {
      if (!map.has(inc.booking_id)) {
        map.set(inc.booking_id, inc)
      }
    }
    return map
  }, [incidents])

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      const parsed = parseBookingCancellationInfo(b.notes)
      const hasIncident = Boolean(parsed.emergency || incidentsByBookingId.has(b.id))

      const matchSearch =
        b.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.rider?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (parsed.cancellation?.reason || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (parsed.emergency?.category || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchService = serviceFilter === "all" || b.service_type === serviceFilter

      let matchStatus = true
      if (statusFilter === "all") {
        matchStatus = true
      } else if (statusFilter === "incident") {
        matchStatus = hasIncident
      } else if (statusFilter === "unassigned") {
        matchStatus = (b.status === "pending" || !b.rider_id) && b.status !== "cancelled" && b.status !== "completed"
      } else {
        matchStatus = b.status === statusFilter
      }

      return matchSearch && matchService && matchStatus
    })
  }, [bookings, searchQuery, serviceFilter, statusFilter, incidentsByBookingId])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const [bookingsData, incidentsData] = await Promise.all([
        getAllBookings(),
        getBookingIncidents(),
      ])
      setBookings(bookingsData)
      setIncidents(incidentsData)
    } catch (err) {
      console.error("[handleRefresh]", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleOpenAssignDialog = async (booking: Booking) => {
    setAssigningBooking(booking)
    setSelectedRiderId(booking.rider_id ?? "")
    setAssignError("")
    setIsLoadingRiders(true)
    try {
      const riders = await getAvailableRiders(booking.scheduled_at)
      if (booking.rider && !riders.some((r) => r.id === booking.rider_id)) {
        riders.unshift({
          id: booking.rider.id,
          name: booking.rider.name,
          email: booking.rider.email,
          phone: null,
          vehicle_model: booking.rider.vehicle_model,
          plate_number: booking.rider.plate_number,
          is_active: true,
          is_verified: true,
          rating: booking.rider.rating,
          completed_trips_count: 0,
        })
      }
      setAvailableRiders(riders)
    } catch (err) {
      console.error("[handleOpenAssignDialog]", err)
    } finally {
      setIsLoadingRiders(false)
    }
  }

  const handleAssign = async () => {
    if (!assigningBooking || !selectedRiderId) return
    setIsAssigning(true)
    setAssignError("")

    const { error } = await assignRider(assigningBooking.id, selectedRiderId)
    if (error) {
      setAssignError(error)
      setIsAssigning(false)
      return
    }

    const assignedRiderObj = availableRiders.find((r) => r.id === selectedRiderId)
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== assigningBooking.id) return b
        return {
          ...b,
          status: "assigned",
          rider_id: selectedRiderId,
          rider: assignedRiderObj
            ? {
                id: assignedRiderObj.id,
                name: assignedRiderObj.name,
                email: assignedRiderObj.email,
                vehicle_model: assignedRiderObj.vehicle_model,
                plate_number: assignedRiderObj.plate_number,
                rating: assignedRiderObj.rating,
              }
            : b.rider,
        }
      })
    )

    setAssigningBooking(null)
    setSelectedRiderId("")
    setIsAssigning(false)
  }

  const handleOpenIncidentModal = (incident: BookingIncident) => {
    setSelectedIncident(incident)
    setIsIncidentModalOpen(true)
  }

  const handleCreateOrOpenBookingIncident = (booking: Booking) => {
    const existing = incidentsByBookingId.get(booking.id)
    if (existing) {
      handleOpenIncidentModal(existing)
      return
    }

    // Synthesize an incident object for direct admin review
    const parsed = parseBookingCancellationInfo(booking.notes)
    const synthetic: BookingIncident = {
      id: `review_${booking.id}`,
      booking_id: booking.id,
      incident_type: parsed.emergency ? "emergency_report" : "customer_cancellation",
      severity: parsed.emergency?.severity || "standard",
      status: parsed.emergency?.status || (booking.status === "cancelled" ? "closed" : "open"),
      category: parsed.emergency?.category || parsed.cancellation?.reason || "Booking Review",
      reason: parsed.emergency?.category || parsed.cancellation?.reason || "Administrative Investigation",
      description: parsed.emergency?.description || parsed.cancellation?.explanation || "Direct investigation opened by administrator.",
      reporter_id: "admin",
      reporter_name: parsed.cancellation?.cancelledBy || parsed.emergency?.reporterName || "HitsNaGo System",
      reporter_role: parsed.cancellation?.cancelledByRole || parsed.emergency?.reporterRole || "admin",
      previous_status: parsed.cancellation?.previousStatus || booking.status,
      resulting_status: booking.status,
      created_at: parsed.cancellation?.cancelledAt || parsed.emergency?.reportedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      booking,
    }

    handleOpenIncidentModal(synthetic)
  }

  return (
    <>
      {/* Database Connection / Configuration Notice */}
      {dbNotice && (
        <Card className="border-amber-500/40 bg-amber-500/10 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <HugeiconsIcon icon={Alert01Icon} size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-sm font-bold text-amber-900 dark:text-amber-200">
                Database Notice
              </span>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                {dbNotice}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Urgent Dispatch & Emergencies Banner */}
      {activeIncidents.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
              <HugeiconsIcon icon={Alert01Icon} size={20} className="animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm font-bold text-destructive">
                  {activeIncidents.length} Urgent Dispatch Alert{activeIncidents.length > 1 ? "s" : ""}
                </span>
                <Badge variant="destructive" className="text-[10px] font-mono px-1.5 py-0 uppercase">
                  Action Required
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rider emergency withdrawal, in-transit incident, or parcel custody alert awaiting admin resolution.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
              onClick={() => handleOpenIncidentModal(activeIncidents[0])}
            >
              <HugeiconsIcon icon={Alert01Icon} size={14} />
              Resolve Incident ({activeIncidents[0].booking?.reference || activeIncidents[0].category})
            </Button>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between -mb-2">
        <h3 className="font-heading text-base font-bold text-foreground">All Bookings</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-1.5 text-xs">
          <HugeiconsIcon icon={RefreshIcon} size={13} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </Button>
      </div>

      {/* Filter and search */}
      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search reference, customer, location, rider, or cancellation reason..."
        categoryFilter={serviceFilter}
        onCategoryChange={setServiceFilter}
        categoryOptions={[
          { id: "all", label: "All Services" },
          { id: "ride", label: "Rides" },
          { id: "rental", label: "Rentals" },
          { id: "delivery", label: "Deliveries" },
        ]}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { id: "all", label: "All Statuses" },
          { id: "incident", label: "🚨 Emergencies & Incidents" },
          { id: "unassigned", label: "📡 Broadcasted / Unclaimed" },
          { id: "pending", label: "Pending" },
          { id: "assigned", label: "Assigned" },
          { id: "accepted", label: "Accepted" },
          { id: "in_progress", label: "In Progress" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
        ]}
        totalResults={filteredBookings.length}
        onResetFilters={() => {
          setSearchQuery("")
          setServiceFilter("all")
          setStatusFilter("all")
        }}
      />

      {/* Bookings Table */}
      <Card className="border-border/80 bg-card shadow-xs overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table
            className="w-full min-w-[1510px] table-fixed text-left border-collapse text-xs"
            style={{ width: "100%", minWidth: "1510px", tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "130px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "95px" }} />
              <col style={{ width: "190px" }} />
              <col style={{ width: "190px" }} />
              <col style={{ width: "145px" }} />
              <col style={{ width: "200px" }} />
              <col style={{ width: "90px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "130px" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th style={{ width: "130px" }} className="py-3 px-4 w-[130px]">Booking Ref</th>
                <th style={{ width: "170px" }} className="py-3 px-4 w-[170px]">Customer</th>
                <th style={{ width: "95px" }} className="py-3 px-4 w-[95px]">Service</th>
                <th style={{ width: "190px" }} className="py-3 px-4 w-[190px]">Pickup</th>
                <th style={{ width: "190px" }} className="py-3 px-4 w-[190px]">Destination</th>
                <th style={{ width: "145px" }} className="py-3 px-4 w-[145px]">Scheduled</th>
                <th style={{ width: "200px" }} className="py-3 px-4 w-[200px]">Status & Incidents</th>
                <th style={{ width: "90px" }} className="py-3 px-4 w-[90px]">Fare</th>
                <th style={{ width: "170px" }} className="py-3 px-4 w-[170px]">Assigned Rider</th>
                <th style={{ width: "130px" }} className="py-3 px-4 w-[130px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    No bookings found matching filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const parsed = parseBookingCancellationInfo(b.notes)
                  const incident = incidentsByBookingId.get(b.id)
                  const isCancelled = b.status === "cancelled"
                  const hasEmergency = Boolean(parsed.emergency || incident?.incident_type === "emergency_report")

                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors group">
                      {/* 1. Booking Ref */}
                      <td className="py-3 px-4 w-[130px] align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden">
                          <span
                            className="block truncate font-mono font-bold text-foreground group-hover:text-primary transition-colors"
                            title={b.reference}
                          >
                            {b.reference}
                          </span>
                        </div>
                      </td>

                      {/* 2. Customer */}
                      <td className="py-3 px-4 w-[170px] align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden flex flex-col gap-0.5">
                          <span className="block truncate font-semibold text-foreground text-xs" title={b.customer_name}>
                            {b.customer_name}
                          </span>
                          <span className="block truncate text-[10px] text-muted-foreground" title={b.customer_email || ""}>
                            {b.customer_email}
                          </span>
                        </div>
                      </td>

                      {/* 3. Service */}
                      <td className="py-3 px-4 w-[95px] align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden">
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                            {b.service_type}
                          </span>
                        </div>
                      </td>

                      {/* 4. Pickup */}
                      <td className="py-3 px-4 text-muted-foreground w-[190px] align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden flex items-start gap-1.5">
                          <HugeiconsIcon icon={PinLocation01Icon} size={13} className="shrink-0 text-primary mt-0.5" />
                          <span
                            className="block truncate text-xs min-w-0 flex-1 font-medium text-foreground leading-snug"
                            title={b.pickup}
                          >
                            {b.pickup}
                          </span>
                        </div>
                      </td>

                      {/* 5. Destination */}
                      <td className="py-3 px-4 text-muted-foreground w-[190px] align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden flex items-start gap-1.5">
                          <HugeiconsIcon
                            icon={PinLocation01Icon}
                            size={13}
                            className={cn(
                              "shrink-0 mt-0.5",
                              b.destination ? "text-rose-500/80" : "text-muted-foreground/35"
                            )}
                          />
                          <span
                            className={cn(
                              "block truncate text-xs min-w-0 flex-1 leading-snug",
                              b.destination ? "text-foreground font-medium" : "text-muted-foreground/60 italic"
                            )}
                            title={b.destination ? b.destination : "No destination specified (Open Point / Rental)"}
                          >
                            {b.destination || "—"}
                          </span>
                        </div>
                      </td>

                      {/* 6. Scheduled */}
                      <td className="py-3 px-4 text-muted-foreground w-[145px] align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden flex flex-col gap-0.5 leading-tight">
                          <span
                            className="block truncate text-foreground font-medium text-xs"
                            title={new Date(b.scheduled_at).toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" })}
                          >
                            {new Date(b.scheduled_at).toLocaleDateString("en-PH", { dateStyle: "short", timeZone: "Asia/Manila" })}
                          </span>
                          <span
                            className="block truncate text-[10px] text-muted-foreground"
                            title={new Date(b.scheduled_at).toLocaleTimeString("en-PH", { timeStyle: "medium", timeZone: "Asia/Manila" })}
                          >
                            {new Date(b.scheduled_at).toLocaleTimeString("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" })}
                          </span>
                        </div>
                      </td>

                      {/* 7. Status & Incidents */}
                      <td className="py-3 px-4 w-[200px] align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden flex flex-col gap-1.5">
                          <div className="flex items-center min-w-0">
                            <AdminStatusBadge status={b.status} />
                          </div>

                          {/* Cancellation Details */}
                          {isCancelled && parsed.cancellation && (
                            <div
                              className="w-full max-w-full min-w-0 overflow-hidden flex flex-col gap-0.5 text-[10px] text-destructive bg-destructive/5 border border-destructive/20 rounded p-1.5 box-border"
                              title={`Reason: ${parsed.cancellation.reason}\nBy: ${parsed.cancellation.cancelledBy} (${parsed.cancellation.cancelledByRole})\nAt: ${new Date(parsed.cancellation.cancelledAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`}
                            >
                              <span className="block truncate font-bold max-w-full">
                                Reason: {parsed.cancellation.reason}
                              </span>
                              <span className="block truncate text-[9px] text-muted-foreground max-w-full">
                                By {parsed.cancellation.cancelledBy} ({parsed.cancellation.cancelledByRole})
                              </span>
                              <span className="block truncate text-[9px] text-muted-foreground/75 max-w-full">
                                {new Date(parsed.cancellation.cancelledAt).toLocaleTimeString("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" })}
                              </span>
                            </div>
                          )}

                          {/* Emergency / Incident Details */}
                          {hasEmergency && (
                            <div
                              className="w-full max-w-full min-w-0 overflow-hidden flex flex-col gap-0.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded p-1.5 box-border"
                              title={`${parsed.emergency?.category || incident?.category || "Emergency Flagged"}: ${parsed.emergency?.description || incident?.description || "Awaiting dispatch resolution"}`}
                            >
                              <span className="flex items-center gap-1 min-w-0 max-w-full overflow-hidden">
                                <HugeiconsIcon icon={Alert01Icon} size={11} className="text-destructive shrink-0" />
                                <span className="block truncate font-bold min-w-0 flex-1">
                                  {parsed.emergency?.category || incident?.category || "Emergency Flagged"}
                                </span>
                              </span>
                              <span className="block truncate text-[9px] max-w-full">
                                {parsed.emergency?.description || incident?.description || "Awaiting dispatch resolution"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 8. Fare */}
                      <td className="py-3 px-4 font-mono font-bold text-foreground w-[90px] align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden whitespace-nowrap">
                          ₱{Number(b.estimated_fare).toLocaleString("en-PH")}
                        </div>
                      </td>

                      {/* 9. Assigned Rider */}
                      <td className="py-3 px-4 text-muted-foreground w-[170px] align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden">
                          {b.rider ? (
                            <div className="flex flex-col min-w-0 w-full gap-0.5">
                              <span className="block truncate text-foreground font-semibold text-xs" title={b.rider.name}>
                                {b.rider.name}
                              </span>
                              <span
                                className="block truncate text-[10px] text-muted-foreground"
                                title={`${b.rider.vehicle_model} (${b.rider.plate_number})`}
                              >
                                {b.rider.vehicle_model} ({b.rider.plate_number})
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5 min-w-0 w-full">
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px] min-w-0 max-w-full overflow-hidden">
                                <HugeiconsIcon icon={Clock01Icon} size={11} className="shrink-0" />
                                <span className="block truncate min-w-0 flex-1" title={b.service_type === "rental" ? "Awaiting Provider" : "Broadcasted (Available)"}>
                                  {b.service_type === "rental" ? "Awaiting Provider" : "Broadcasted (Available)"}
                                </span>
                              </span>
                              {b.service_type !== "rental" && b.status === "pending" && (
                                <span className="block truncate text-[10px] text-muted-foreground" title="Waiting for rider acceptance">
                                  Waiting for rider acceptance
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 10. Action */}
                      <td className="py-3 px-4 w-[130px] text-right align-top">
                        <div className="w-full max-w-full min-w-0 overflow-hidden flex items-center justify-end gap-1.5">
                          {/* Incident Investigation Button */}
                          {(incident || parsed.emergency || isCancelled) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px] px-2 font-semibold gap-1 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                              onClick={() => handleCreateOrOpenBookingIncident(b)}
                              title="Investigate Incident History"
                            >
                              <HugeiconsIcon icon={Alert01Icon} size={12} className={hasEmergency ? "text-destructive" : ""} />
                              <span>Details</span>
                            </Button>
                          )}

                          {/* Assign or Reassign */}
                          {(b.status === "pending" || b.status === "assigned") && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px] px-2 font-semibold gap-1 text-primary hover:text-primary shrink-0"
                              onClick={() => handleOpenAssignDialog(b)}
                            >
                              <HugeiconsIcon icon={UserCheck01Icon} size={12} />
                              <span>{b.rider ? "Reassign" : "Assign"}</span>
                            </Button>
                          )}

                          {/* Message / Chat Action */}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] px-2 font-semibold gap-1 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={async () => {
                              try {
                                const res = await getOrCreateBookingConversation(b.id)
                                if (res.conversationId) {
                                  router.push(`/dashboard/admin/inbox?conversationId=${res.conversationId}`)
                                } else {
                                  router.push(`/dashboard/admin/inbox?bookingId=${b.id}`)
                                }
                              } catch {
                                router.push(`/dashboard/admin/inbox?bookingId=${b.id}`)
                              }
                            }}
                          >
                            <HugeiconsIcon icon={Message01Icon} size={12} className="text-primary" />
                            <span>Chat</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assign Rider Dialog */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl p-6 flex flex-col gap-5">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                {assigningBooking.rider ? "Reassign Rider" : "Assign Rider"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Booking <strong className="text-foreground">{assigningBooking.reference}</strong> — {assigningBooking.pickup}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Scheduled: {new Date(assigningBooking.scheduled_at).toLocaleString("en-PH")}
              </p>
            </div>

            {isLoadingRiders ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Checking active & available riders in Butuan City...
              </div>
            ) : availableRiders.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                No available riders for this time slot. All active riders have conflicting bookings within 90 minutes.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Select Available Rider ({availableRiders.length} eligible)
                </label>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {availableRiders.map((rider) => (
                    <button
                      key={rider.id}
                      type="button"
                      onClick={() => setSelectedRiderId(rider.id)}
                      className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedRiderId === rider.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 bg-background"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{rider.name}</span>
                          {assigningBooking.rider_id === rider.id && (
                            <span className="text-[10px] text-primary font-semibold">(Current)</span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {rider.vehicle_model || "Motorcycle"} • {rider.plate_number || "Verified"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-amber-500 shrink-0">
                        ★{Number(rider.rating ?? 5.0).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {assignError && (
              <p className="text-xs text-destructive rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                {assignError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAssigningBooking(null)
                  setSelectedRiderId("")
                  setAssignError("")
                }}
                disabled={isAssigning}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleAssign}
                disabled={!selectedRiderId || isAssigning || availableRiders.length === 0}
              >
                {isAssigning ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Incident Resolution Modal */}
      {selectedIncident && (
        <AdminIncidentResolutionModal
          incident={selectedIncident}
          isOpen={isIncidentModalOpen}
          onClose={() => {
            setIsIncidentModalOpen(false)
            setSelectedIncident(null)
          }}
          onSuccess={() => {
            handleRefresh()
          }}
        />
      )}
    </>
  )
}
