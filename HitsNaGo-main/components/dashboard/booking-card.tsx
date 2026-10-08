import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Key01Icon,
  PackageIcon,
  Calendar01Icon,
  CreditCardIcon,
  PinLocation01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { BookingStatusBadge } from "./status-badge"
import { cn } from "@/lib/utils"
import type { Booking } from "@/types/booking"

export interface BookingCardProps {
  booking: Booking
  href?: string
  className?: string
}

export function BookingCard({ booking, href, className }: BookingCardProps) {
  const isRide = booking.serviceType === "ride"
  const isRental = booking.serviceType === "rental"
  const isDelivery = booking.serviceType === "delivery"

  const icon = isRide ? Motorbike01Icon : isRental ? Key01Icon : PackageIcon
  const serviceLabel = isRide ? "Ride" : isRental ? "Rental" : "Delivery"

  // Formatting date
  const formattedDate = new Date(booking.createdAt).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  // Format currency
  const formattedPrice = `₱${booking.totalAmount.toLocaleString("en-PH")}`

  // Locations / Descriptions
  let title = "Booking Details"
  let subtitle = ""

  if (isRide && "pickupLocation" in booking && "destinationLocation" in booking) {
    title = `${booking.pickupLocation.city || "Pickup"} → ${booking.destinationLocation.city || "Destination"}`
    subtitle = `${booking.pickupLocation.address} to ${booking.destinationLocation.address}`
  } else if (isRental && "startDate" in booking && "endDate" in booking) {
    title = `Rental Period (${booking.durationDays} day${booking.durationDays > 1 ? "s" : ""})`
    subtitle = `${booking.startDate} to ${booking.endDate} • Deposit: ₱${booking.securityDeposit?.toLocaleString() || 0}`
  } else if (isDelivery && "packageInfo" in booking && "pickupLocation" in booking) {
    title = `Delivery: ${booking.packageInfo.description || "Package"}`
    subtitle = `To: ${booking.deliveryLocation.address}`
  }

  const content = (
    <Card
      className={cn(
        "group overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-xs",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          {/* Top row: Service Tag, Booking ID, and Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={icon} size={15} />
              </div>
              <span className="font-heading text-xs font-semibold text-foreground uppercase tracking-wider">
                {serviceLabel}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                #{booking.id.slice(-6).toUpperCase()}
              </span>
            </div>

            <BookingStatusBadge status={booking.status} />
          </div>

          {/* Main title & subtitle */}
          <div>
            <h4 className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h4>
            <div className="flex items-start gap-1.5 mt-1 text-xs text-muted-foreground">
              <HugeiconsIcon icon={PinLocation01Icon} size={14} className="shrink-0 mt-0.5" />
              <p className="line-clamp-1">{subtitle}</p>
            </div>
          </div>

          {/* Bottom row: Date, Payment, and Amount */}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Calendar01Icon} size={13} />
                <span>{formattedDate}</span>
              </span>

              <span className="flex items-center gap-1 uppercase text-[11px]">
                <HugeiconsIcon icon={CreditCardIcon} size={13} />
                <span>{booking.paymentMethod}</span>
              </span>
            </div>

            <span className="font-heading text-sm font-bold text-foreground">
              {formattedPrice}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {content}
      </Link>
    )
  }

  return content
}
