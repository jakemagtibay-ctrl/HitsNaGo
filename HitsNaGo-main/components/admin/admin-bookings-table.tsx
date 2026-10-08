"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PinLocation01Icon,
  UserCheck01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Booking, Rider } from "@/lib/actions/bookings"
import { assignRider, getAllBookings, getAvailableRiders } from "@/lib/actions/bookings"

interface AdminBookingsTableProps {
  initialBookings: Booking[]
}

export function AdminBookingsTable({ initialBookings }: AdminBookingsTableProps) {
  const [bookings, setBookings] = React.useState<Booking[]>(initialBookings)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [serviceFilter, setServiceFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [assigningBooking, setAssigningBooking] = React.useState<Booking | null>(null)
  const [availableRiders, setAvailableRiders] = React.useState<Rider[]>([])
  const [isLoadingRiders, setIsLoadingRiders] = React.useState<boolean>(false)
  const [selectedRiderId, setSelectedRiderId] = React.useState<string>("")
  const [isAssigning, setIsAssigning] = React.useState<boolean>(false)
  const [assignError, setAssignError] = React.useState<string>("")
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false)

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.rider?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchService = serviceFilter === "all" || b.service_type === serviceFilter
      const matchStatus = statusFilter === "all" || b.status === statusFilter

      return matchSearch && matchService && matchStatus
    })
  }, [bookings, searchQuery, serviceFilter, statusFilter])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const data = await getAllBookings()
      setBookings(data)
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
      // If a rider is already assigned, ensure they are also included in the list for reassignment
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

    // Optimistically update local state
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

  return (
    <>
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
        searchPlaceholder="Search reference, customer, location, or rider..."
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
      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Pickup</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Scheduled</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Fare</th>
                <th className="py-3 px-4">Assigned Rider</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    No bookings found in database.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                      {b.reference}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{b.customer_name}</span>
                        <span className="text-[10px] text-muted-foreground">{b.customer_email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                        {b.service_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground max-w-[150px]">
                      <div className="flex items-start gap-1">
                        <HugeiconsIcon icon={PinLocation01Icon} size={13} className="shrink-0 text-primary mt-0.5" />
                        <span className="truncate">{b.pickup}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground max-w-[150px]">
                      <span className="truncate">{b.destination || "—"}</span>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {new Date(b.scheduled_at).toLocaleDateString("en-PH", { dateStyle: "short" })}{" "}
                      {new Date(b.scheduled_at).toLocaleTimeString("en-PH", { timeStyle: "short" })}
                    </td>

                    <td className="py-3.5 px-4">
                      <AdminStatusBadge status={b.status} />
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                      ₱{Number(b.estimated_fare).toLocaleString("en-PH")}
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      {b.rider ? (
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">{b.rider.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {b.rider.vehicle_model} ({b.rider.plate_number})
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {(b.status === "pending" || b.status === "assigned") && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2 font-semibold gap-1 text-primary hover:text-primary"
                          onClick={() => handleOpenAssignDialog(b)}
                        >
                          <HugeiconsIcon icon={UserCheck01Icon} size={12} />
                          {b.rider ? "Reassign" : "Assign Rider"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
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
    </>
  )
}
