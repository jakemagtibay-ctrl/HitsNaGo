// Summary card displaying trip route, selected vehicle, scheduled time, and estimated total before confirmation
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  PinLocation01Icon,
  Calendar01Icon,
  Clock01Icon,
  Motorbike01Icon,
  Key01Icon,
  PackageIcon,
  ShieldCheckIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import { cn } from "@/lib/utils"

export interface BookingSummaryProps {
  serviceType: "ride" | "rental" | "delivery"
  title: string
  pickupAddress?: string
  destinationAddress?: string
  date?: string
  time?: string
  passengerCount?: number
  vehicleOrItemName?: string
  riderOrProviderName?: string
  riderRating?: number
  isVerified?: boolean
  estimatedTotal: number
  totalLabel?: string
  onContinue?: () => void
  onBack?: () => void
  continueLabel?: string
  isContinueDisabled?: boolean
  isLoading?: boolean
  showActions?: boolean
  className?: string
}

export function BookingSummary({
  serviceType,
  title,
  pickupAddress,
  destinationAddress,
  date,
  time,
  passengerCount,
  vehicleOrItemName,
  riderOrProviderName,
  riderRating,
  isVerified,
  estimatedTotal,
  totalLabel = "Estimated Total",
  onContinue,
  onBack,
  continueLabel = "Continue",
  isContinueDisabled = false,
  isLoading = false,
  showActions = true,
  className,
}: BookingSummaryProps) {
  const serviceIcon =
    serviceType === "ride"
      ? Motorbike01Icon
      : serviceType === "rental"
      ? Key01Icon
      : PackageIcon

  const serviceTag =
    serviceType === "ride"
      ? "Ride in Butuan"
      : serviceType === "rental"
      ? "Butuan Rental"
      : "Butuan Delivery"

  return (
    <Card className={cn("overflow-hidden border-border bg-card shadow-sm sticky top-20", className)}>
      <CardContent className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={serviceIcon} size={15} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
                {serviceTag}
              </span>
              <span className="text-[10px] text-primary font-medium">
                {ACTIVE_SERVICE_AREA.shortLabel}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Summary
          </span>
        </div>

        {/* Selected Service Title */}
        <div>
          <h4 className="font-heading text-sm font-bold text-foreground">
            {title}
          </h4>
          {vehicleOrItemName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {vehicleOrItemName}
            </p>
          )}
        </div>

        {/* Provider / Rider Info if assigned */}
        {riderOrProviderName && (
          <div className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                {riderOrProviderName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-xs">
                  {riderOrProviderName}
                </span>
                {riderRating && (
                  <span className="text-[10px] text-amber-500 font-medium">
                    ★ {riderRating.toFixed(1)} rating
                  </span>
                )}
              </div>
            </div>

            {isVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <HugeiconsIcon icon={ShieldCheckIcon} size={11} />
                <span>Verified</span>
              </span>
            )}
          </div>
        )}

        {/* Route / Locations */}
        <div className="flex flex-col gap-2 text-xs">
          {pickupAddress && (
            <div className="flex items-start gap-2">
              <HugeiconsIcon
                icon={PinLocation01Icon}
                size={14}
                className="text-primary shrink-0 mt-0.5"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Pickup Point
                </span>
                <span className="text-foreground line-clamp-1 font-medium">
                  {pickupAddress}
                </span>
              </div>
            </div>
          )}

          {destinationAddress && (
            <div className="flex items-start gap-2">
              <HugeiconsIcon
                icon={PinLocation01Icon}
                size={14}
                className="text-rose-500 shrink-0 mt-0.5"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Destination
                </span>
                <span className="text-foreground line-clamp-1 font-medium">
                  {destinationAddress}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Date, Time, Passengers */}
        {(date || time || passengerCount) && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs">
            {date && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <HugeiconsIcon icon={Calendar01Icon} size={13} className="text-primary shrink-0" />
                <span className="truncate">{date}</span>
              </div>
            )}
            {time && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <HugeiconsIcon icon={Clock01Icon} size={13} className="text-primary shrink-0" />
                <span className="truncate">{time}</span>
              </div>
            )}
            {passengerCount && (
              <div className="col-span-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                Passengers: <strong className="text-foreground">{passengerCount}</strong>
              </div>
            )}
          </div>
        )}

        {/* Price Row */}
        <div className="border-t border-border pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {totalLabel}
            </span>
            <div className="text-right">
              <span className="font-heading text-xl font-bold text-foreground">
                ₱{estimatedTotal.toLocaleString("en-PH")}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                PHP (Demo Estimate)
              </span>
            </div>
          </div>
        </div>

        {/* Desktop actions */}
        {showActions && (
          <div className="flex flex-col gap-2 pt-2">
            {onContinue && (
              <Button
                type="button"
                onClick={onContinue}
                disabled={isContinueDisabled || isLoading}
                className="w-full font-semibold shadow-xs gap-1.5"
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{continueLabel}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                  </>
                )}
              </Button>
            )}

            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="w-full text-xs font-medium gap-1.5"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                <span>Back</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
