"use client"

// Rider action panel allowing riders to toggle online status, review trip requests, and accept bookings
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Motorbike01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { IncomingRideRequest } from "@/lib/mock-data/ride-requests"

interface RiderActionsProps {
  initialRequests: IncomingRideRequest[]
}

export function RiderActions({ initialRequests }: RiderActionsProps) {
  const [requests, setRequests] = React.useState<IncomingRideRequest[]>(initialRequests)
  const [isOnline, setIsOnline] = React.useState(true)
  const [activeMessage, setActiveMessage] = React.useState<string | null>(null)

  const handleAccept = (req: IncomingRideRequest) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
    setActiveMessage(`Trip accepted! Navigating to pickup: ${req.pickupLocation} for passenger ${req.passengerName}.`)
    setTimeout(() => setActiveMessage(null), 6000)
  }

  const handleDecline = (reqId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== reqId))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Rider Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              isOnline ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
            )}
          >
            <HugeiconsIcon icon={Motorbike01Icon} size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold text-foreground">
                Driver Status: {isOnline ? "Online & Ready" : "Offline"}
              </span>
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Honda Click 125i • Plate: <strong className="text-foreground font-mono">7718-HA</strong> • Verified Rider
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOnline(!isOnline)}
          className={cn(
            buttonVariants({ variant: isOnline ? "outline" : "default", size: "sm" }),
            "font-semibold text-xs transition-all"
          )}
        >
          {isOnline ? "Go Offline" : "Go Online Now"}
        </button>
      </div>

      {/* Active toast/notice */}
      {activeMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in-0 duration-200">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="shrink-0" />
          <span>{activeMessage}</span>
        </div>
      )}

      {/* Incoming Requests Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-foreground">
              Incoming Ride Requests
            </h3>
            {requests.length > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                {requests.length} Available
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">Auto-refreshing near you</span>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-xs text-muted-foreground">
            No incoming requests in your immediate vicinity. Staying online will alert you when riders book nearby.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <Card key={req.id} className="border-border bg-card hover:border-primary/40 transition-all">
                <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                  <div className="flex flex-col gap-2.5">
                    {/* Header: Passenger & Fare */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          <HugeiconsIcon icon={UserIcon} size={16} />
                        </div>
                        <div>
                          <span className="font-heading text-xs font-semibold text-foreground block">
                            {req.passengerName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ★ {req.passengerRating} Rating
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-heading text-lg font-bold text-primary block">
                          ₱{req.estimatedFare}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {req.estimatedDistanceKm} km • ~{req.estimatedDurationMinutes} mins
                        </span>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground border-t border-border/60 pt-2.5">
                      <div className="flex items-start gap-2">
                        <span className="size-2 rounded-full bg-primary shrink-0 mt-1" />
                        <span className="text-foreground font-medium truncate">
                          Pickup: {req.pickupLocation}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="size-2 rounded-full bg-rose-500 shrink-0 mt-1" />
                        <span className="text-foreground font-medium truncate">
                          Dropoff: {req.destinationLocation}
                        </span>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="text-[11px] text-muted-foreground italic bg-muted/50 p-2 rounded-lg">
                        &ldquo;{req.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Accept / Decline actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => handleDecline(req.id)}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-1 text-xs text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      <span>Decline</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccept(req)}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "gap-1 text-xs font-semibold shadow-xs"
                      )}
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                      <span>Accept Trip</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
