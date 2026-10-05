"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Motorbike01Icon,
  Key01Icon,
  PackageIcon,
  PinLocation01Icon,
  CreditCardIcon,
  FilterIcon,
  Cancel01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { mockAllBookings } from "@/lib/mock-data/bookings"
import { BookingStatusBadge } from "@/components/dashboard/status-badge"
import { ServiceAreaNotice } from "@/components/booking/service-area-notice"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Booking } from "@/types/booking"
import type { ServiceType } from "@/types/service"

export default function CustomerBookingsPage() {
  const [activeServiceTab, setActiveServiceTab] = React.useState<"all" | ServiceType>("all")
  const [activeStatusFilter, setActiveStatusFilter] = React.useState<string>("all")
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null)

  // Filter bookings
  const filteredBookings = React.useMemo(() => {
    return mockAllBookings.filter((b) => {
      const matchesService =
        activeServiceTab === "all" || b.serviceType === activeServiceTab
      const matchesStatus =
        activeStatusFilter === "all" || b.status === activeStatusFilter

      return matchesService && matchesStatus
    })
  }, [activeServiceTab, activeStatusFilter])

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold uppercase tracking-wider"
            >
              Customer Bookings
            </Badge>
            <ServiceAreaNotice variant="badge" />
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Bookings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View, track, and manage all your ride trips, vehicle rentals, and courier packages across Butuan City.
          </p>
        </div>

        {/* Quick booking CTA buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/customer/book/ride"
            className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold gap-1.5 shadow-xs")}
          >
            <HugeiconsIcon icon={Motorbike01Icon} size={14} />
            <span>Book Ride</span>
          </Link>
          <Link
            href="/dashboard/customer/book/rental"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs font-semibold gap-1.5")}
          >
            <HugeiconsIcon icon={Key01Icon} size={14} />
            <span>Rent Service</span>
          </Link>
          <Link
            href="/dashboard/customer/book/delivery"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs font-semibold gap-1.5")}
          >
            <HugeiconsIcon icon={PackageIcon} size={14} />
            <span>Send Delivery</span>
          </Link>
        </div>
      </div>

      {/* Service Area Notice */}
      <ServiceAreaNotice variant="compact" />

      {/* Service Category Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: "All Bookings", icon: Calendar01Icon },
            { id: "ride", label: "Rides", icon: Motorbike01Icon },
            { id: "rental", label: "Rentals", icon: Key01Icon },
            { id: "delivery", label: "Deliveries", icon: PackageIcon },
          ].map((tab) => {
            const Icon = tab.icon
            const isSelected = activeServiceTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveServiceTab(tab.id as "all" | ServiceType)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <HugeiconsIcon icon={Icon} size={15} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <HugeiconsIcon icon={FilterIcon} size={12} />
            Status:
          </span>
          {["all", "active", "pending", "confirmed", "completed"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setActiveStatusFilter(st)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-all",
                activeStatusFilter === st
                  ? "bg-foreground text-background shadow-2xs"
                  : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List or Empty State */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <HugeiconsIcon icon={Calendar01Icon} size={28} />
          </div>
          <h3 className="font-heading text-base font-bold text-foreground">
            No bookings found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            There are no {activeServiceTab === "all" ? "" : activeServiceTab} bookings matching the selected status in Butuan City.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveServiceTab("all")
                setActiveStatusFilter("all")
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
            <Link
              href="/dashboard/customer/book/ride"
              className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold")}
            >
              Book a Ride in Butuan
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => {
            const isRide = b.serviceType === "ride"
            const isRental = b.serviceType === "rental"
            const isDelivery = b.serviceType === "delivery"

            const icon = isRide ? Motorbike01Icon : isRental ? Key01Icon : PackageIcon
            const serviceLabel = isRide ? "Ride" : isRental ? "Rental" : "Delivery"

            let title = "Booking Details"
            let subtitle = ""

            if (isRide && "pickupLocation" in b && "destinationLocation" in b) {
              title = `${b.pickupLocation.title || b.pickupLocation.city || "Pickup"} → ${b.destinationLocation.title || b.destinationLocation.city || "Dropoff"}`
              subtitle = `${b.pickupLocation.address} to ${b.destinationLocation.address}`
            } else if (isRental && "startDate" in b && "endDate" in b) {
              title = `Rental Period (${b.durationDays} day${b.durationDays > 1 ? "s" : ""})`
              subtitle = `${b.startDate} to ${b.endDate} • Deposit: ₱${b.securityDeposit?.toLocaleString() || 0}`
            } else if (isDelivery && "packageInfo" in b && "pickupLocation" in b) {
              title = `Delivery: ${b.packageInfo.description || "Package"}`
              subtitle = `To: ${b.deliveryLocation.address}`
            }

            const formattedDate = new Date(b.createdAt).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })

            return (
              <Card
                key={b.id}
                className="group overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-xs flex flex-col justify-between"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <HugeiconsIcon icon={icon} size={15} />
                      </div>
                      <span className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider">
                        {serviceLabel}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        #{b.id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <BookingStatusBadge status={b.status} />
                  </div>

                  {/* Title & subtitle */}
                  <div>
                    <h4 className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {title}
                    </h4>
                    <div className="flex items-start gap-1.5 mt-1 text-xs text-muted-foreground">
                      <HugeiconsIcon icon={PinLocation01Icon} size={14} className="shrink-0 mt-0.5 text-primary" />
                      <p className="line-clamp-2">{subtitle}</p>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <HugeiconsIcon icon={Calendar01Icon} size={13} />
                        <span>{formattedDate}</span>
                      </span>

                      <span className="flex items-center gap-1 uppercase text-[11px]">
                        <HugeiconsIcon icon={CreditCardIcon} size={13} />
                        <span>{b.paymentMethod}</span>
                      </span>
                    </div>

                    <span className="font-heading text-sm font-bold text-foreground">
                      ₱{b.totalAmount.toLocaleString("en-PH")}
                    </span>
                  </div>

                  {/* View Details CTA */}
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    className="w-full mt-2 rounded-xl border border-border/80 bg-muted/40 py-2 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>View Details</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Booking Details Modal / Sheet */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <HugeiconsIcon
                    icon={
                      selectedBooking.serviceType === "ride"
                        ? Motorbike01Icon
                        : selectedBooking.serviceType === "rental"
                        ? Key01Icon
                        : PackageIcon
                    }
                    size={20}
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    Booking #{selectedBooking.id.slice(-6).toUpperCase()}
                  </h3>
                  <span className="text-[11px] text-primary font-semibold uppercase tracking-wider">
                    {selectedBooking.serviceType} Service • Butuan City
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close details"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            {/* Status and Price summary */}
            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3.5 border border-border/60">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Status
                </span>
                <div className="mt-1">
                  <BookingStatusBadge status={selectedBooking.status} />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Total Fare
                </span>
                <span className="font-heading text-lg font-bold text-foreground block">
                  ₱{selectedBooking.totalAmount.toLocaleString("en-PH")}
                </span>
              </div>
            </div>

            {/* Specific Service Breakdown */}
            {selectedBooking.serviceType === "ride" && "pickupLocation" in selectedBooking && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1 p-3 rounded-xl border border-border/70 bg-card">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Pickup Location (Butuan City)
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedBooking.pickupLocation.title || selectedBooking.pickupLocation.address}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedBooking.pickupLocation.address}
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl border border-border/70 bg-card">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Destination (Butuan City)
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedBooking.destinationLocation.title || selectedBooking.destinationLocation.address}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedBooking.destinationLocation.address}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Vehicle Category</span>
                    <span className="font-semibold text-foreground capitalize">{selectedBooking.vehicleCategory}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Passengers</span>
                    <span className="font-semibold text-foreground">{selectedBooking.passengerCount} Pax</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Distance</span>
                    <span className="font-semibold text-foreground">~{selectedBooking.distanceKm} km</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Payment Method</span>
                    <span className="font-semibold text-foreground uppercase">{selectedBooking.paymentMethod}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedBooking.serviceType === "rental" && "startDate" in selectedBooking && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1 p-3 rounded-xl border border-border/70 bg-card">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Rental Schedule
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedBooking.startDate} to {selectedBooking.endDate} ({selectedBooking.durationDays} days)
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl border border-border/70 bg-card">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Handover in Butuan City
                  </span>
                  <span className="font-semibold text-foreground capitalize">
                    Method: {selectedBooking.handoverMethod}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedBooking.handoverAddress}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Security Deposit</span>
                    <span className="font-semibold text-foreground">₱{selectedBooking.securityDeposit.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Deposit Status</span>
                    <span className="font-semibold text-foreground capitalize">{selectedBooking.depositStatus}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedBooking.serviceType === "delivery" && "sender" in selectedBooking && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1 p-3 rounded-xl border border-border/70 bg-card">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Pickup (Sender)
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedBooking.pickupLocation.title || selectedBooking.pickupLocation.address}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Contact: {selectedBooking.sender.name} ({selectedBooking.sender.phone})
                  </span>
                </div>

                <div className="flex flex-col gap-1 p-3 rounded-xl border border-border/70 bg-card">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Dropoff (Recipient)
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedBooking.deliveryLocation.title || selectedBooking.deliveryLocation.address}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Recipient: {selectedBooking.recipient.name} ({selectedBooking.recipient.phone})
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-card flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Package Description
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedBooking.packageInfo.description}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Type: {selectedBooking.packageInfo.type.toUpperCase()} • Weight: {selectedBooking.packageInfo.weightKg} kg • Fragile: {selectedBooking.packageInfo.isFragile ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-border flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooking(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
