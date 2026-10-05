import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  Navigation01Icon,
  Calendar01Icon,
  PinLocation01Icon,
  InformationCircleIcon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { BookingStatusBadge } from "@/components/dashboard/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import { cn } from "@/lib/utils"

export interface BookingConfirmationProps {
  bookingId: string
  serviceType: "ride" | "rental" | "delivery"
  serviceTitle: string
  location?: string
  estimatedAmount: number
  details: { label: string; value: string }[]
  onBookAgain?: () => void
  className?: string
}

export function BookingConfirmation({
  bookingId,
  serviceType,
  serviceTitle,
  location = ACTIVE_SERVICE_AREA.label,
  estimatedAmount,
  details,
  onBookAgain,
  className,
}: BookingConfirmationProps) {
  const serviceLabel =
    serviceType === "ride"
      ? "Ride Booking"
      : serviceType === "rental"
      ? "Rental Request"
      : "Courier Delivery"

  return (
    <div className={cn("mx-auto max-w-2xl flex flex-col gap-6", className)}>
      {/* Success Hero Card */}
      <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-card to-background p-6 sm:p-8 text-center shadow-xs">
        <div className="mx-auto flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md mb-4 animate-in zoom-in-90 duration-300">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
        </div>

        <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
          Request Acknowledged
        </span>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Booking Request Submitted
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-2 leading-relaxed">
          Your {serviceLabel.toLowerCase()} request for <strong className="text-foreground">{location}</strong> has been created. A verified local partner will accept your request shortly.
        </p>

        {/* Demo Notice Banner */}
        <div className="mt-5 rounded-xl border border-border/80 bg-muted/40 p-3 text-left text-xs text-muted-foreground flex items-start gap-2.5">
          <HugeiconsIcon icon={InformationCircleIcon} size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Frontend Demo Notice:</strong> This is a simulation for testing the customer booking experience in Butuan City. No actual ride dispatch, fleet booking, or payment deduction has occurred.
          </p>
        </div>
      </div>

      {/* Booking Receipt Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-6 flex flex-col gap-5">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/70">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Booking Reference
              </span>
              <span className="font-mono text-base font-bold text-foreground">
                {bookingId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status:
              </span>
              <BookingStatusBadge status="pending" />
            </div>
          </div>

          {/* Service & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border/70 text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Service Type
              </span>
              <span className="font-heading font-semibold text-foreground text-sm">
                {serviceTitle}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Service Location
              </span>
              <span className="font-semibold text-primary flex items-center gap-1">
                <HugeiconsIcon icon={PinLocation01Icon} size={13} />
                {location}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="flex flex-col gap-2.5 text-xs">
            {details.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground text-right">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Total row */}
          <div className="flex items-baseline justify-between pt-4 border-t border-border">
            <div className="flex flex-col">
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
                Estimated Total
              </span>
              <span className="text-[10px] text-muted-foreground">
                Philippine Peso (PHP)
              </span>
            </div>

            <span className="font-heading text-2xl font-black text-foreground">
              ₱{estimatedAmount.toLocaleString("en-PH")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard/customer/bookings"
          className={cn(buttonVariants({ size: "default" }), "w-full sm:flex-1 font-semibold gap-2 shadow-xs")}
        >
          <HugeiconsIcon icon={Calendar01Icon} size={16} />
          <span>View in My Bookings</span>
        </Link>

        {onBookAgain ? (
          <button
            type="button"
            onClick={onBookAgain}
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "w-full sm:flex-1 font-semibold gap-2")}
          >
            <HugeiconsIcon icon={Navigation01Icon} size={16} />
            <span>Book Another Trip</span>
          </button>
        ) : (
          <Link
            href="/dashboard/customer"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "w-full sm:flex-1 font-semibold gap-2")}
          >
            <HugeiconsIcon icon={DashboardSquare01Icon} size={16} />
            <span>Back to Dashboard</span>
          </Link>
        )}
      </div>
    </div>
  )
}
