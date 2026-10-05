"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PinLocation01Icon,
  CallIcon,
} from "@hugeicons/core-free-icons"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminDetailSheet } from "@/components/admin/admin-detail-sheet"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MOCK_ADMIN_BOOKINGS, type AdminBookingRecord } from "@/lib/mock-data/admin-data"
import type { ServiceType } from "@/types/service"

interface AdminBookingsViewProps {
  initialServiceFilter?: "all" | ServiceType
  title?: string
}

export function AdminBookingsView({
  initialServiceFilter = "all",
  title = "Booking Operations",
}: AdminBookingsViewProps) {
  const [bookings] = React.useState<AdminBookingRecord[]>(MOCK_ADMIN_BOOKINGS)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [serviceFilter, setServiceFilter] = React.useState<string>(initialServiceFilter)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedBooking, setSelectedBooking] = React.useState<AdminBookingRecord | null>(null)

  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.providerOrRiderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesService = serviceFilter === "all" || b.serviceType === serviceFilter
      const matchesStatus = statusFilter === "all" || b.status === statusFilter

      return matchesSearch && matchesService && matchesStatus
    })
  }, [bookings, searchQuery, serviceFilter, statusFilter])

  return (
    <div className="flex flex-col gap-6">
      {title && (
        <h3 className="font-heading text-base font-bold text-foreground -mb-2">
          {title}
        </h3>
      )}
      {/* Filter and search */}
      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search booking ID, customer, partner, or location..."
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
          { id: "active", label: "Active" },
          { id: "assigned", label: "Assigned" },
          { id: "pending", label: "Pending" },
          { id: "confirmed", label: "Confirmed" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
        ]}
        totalResults={filteredBookings.length}
        onResetFilters={() => {
          setSearchQuery("")
          setServiceFilter(initialServiceFilter)
          setStatusFilter("all")
        }}
      />

      {/* Bookings Table */}
      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Assigned Partner</th>
                <th className="py-3 px-4">Location (Butuan)</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    No bookings found matching filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                      {b.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{b.customerName}</span>
                        <span className="text-[10px] text-muted-foreground">{b.customerPhone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                        {b.serviceType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      <span className="font-medium text-foreground">{b.providerOrRiderName}</span>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground max-w-[200px]">
                      <div className="flex items-start gap-1">
                        <HugeiconsIcon icon={PinLocation01Icon} size={13} className="shrink-0 text-primary mt-0.5" />
                        <span className="truncate">{b.pickupAddress}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {b.date} • {b.time}
                    </td>

                    <td className="py-3.5 px-4">
                      <AdminStatusBadge status={b.status} />
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                      ₱{b.totalAmount.toLocaleString("en-PH")}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBooking(b)}
                        className="h-7 text-[11px] px-2 font-semibold"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Booking Detail Sheet */}
      <AdminDetailSheet
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        title={`Booking #${selectedBooking?.id}`}
        subtitle={`${selectedBooking?.serviceType.toUpperCase()} Service • Butuan City, Agusan del Norte`}
        footerActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedBooking(null)}
            className="text-xs"
          >
            Close
          </Button>
        }
      >
        {selectedBooking && (
          <div className="flex flex-col gap-6 text-xs">
            {/* Top row */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Status
                </span>
                <div className="mt-1">
                  <AdminStatusBadge status={selectedBooking.status} />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Total Fare (PHP)
                </span>
                <span className="font-heading text-xl font-bold text-foreground block">
                  ₱{selectedBooking.totalAmount.toLocaleString("en-PH")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Payment via {selectedBooking.paymentMethod}
                </span>
              </div>
            </div>

            {/* Customer & Partner Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border/70 bg-card flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Customer
                </span>
                <span className="font-bold text-foreground text-sm">
                  {selectedBooking.customerName}
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <HugeiconsIcon icon={CallIcon} size={12} />
                  {selectedBooking.customerPhone}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-card flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Assigned Partner
                </span>
                <span className="font-bold text-foreground text-sm">
                  {selectedBooking.providerOrRiderName}
                </span>
                <span className="text-muted-foreground capitalize">
                  Role: {selectedBooking.providerOrRiderRole}
                </span>
              </div>
            </div>

            {/* Route & Geographic points */}
            <div className="p-4 rounded-xl border border-border/70 bg-card flex flex-col gap-3">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Trip Route (Butuan City)
              </span>

              <div className="flex items-start gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-muted-foreground">Pickup Location</span>
                  <span className="font-medium text-foreground">{selectedBooking.pickupAddress}</span>
                </div>
              </div>

              {selectedBooking.destinationAddress && (
                <div className="flex items-start gap-2.5">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-500 text-[10px] font-bold">
                    B
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-muted-foreground">Destination / Handover</span>
                    <span className="font-medium text-foreground">{selectedBooking.destinationAddress}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notes / Live dispatch logs */}
            {selectedBooking.notes && (
              <div className="p-3 rounded-xl border border-border/70 bg-muted/20 flex flex-col gap-1">
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                  Operational Dispatch Notes
                </span>
                <p className="text-muted-foreground italic">&quot;{selectedBooking.notes}&quot;</p>
              </div>
            )}
          </div>
        )}
      </AdminDetailSheet>
    </div>
  )
}
