"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Calendar01Icon,
  PinLocation01Icon,
} from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Provider } from "@/lib/actions/bookings"

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
}

export function ProviderPortalView({ provider }: ProviderPortalViewProps) {
  const [activeTab, setActiveTab] = React.useState<"listings" | "requests">("listings")
  const [requests, setRequests] = React.useState<RentalRequest[]>(INITIAL_REQUESTS)
  const [message, setMessage] = React.useState<string | null>(null)

  const handleAction = (id: string, newStatus: "accepted" | "declined") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
    setMessage(`Request marked as ${newStatus}.`)
    setTimeout(() => setMessage(null), 4000)
  }

  const listings = [
    {
      id: "lst-1",
      title: "Toyota HiAce Commuter 15-Seater Van",
      category: "Passenger Van",
      pricePerDay: 2800,
      status: "Available",
      location: "Langihan, Butuan City",
    },
    {
      id: "lst-2",
      title: "Honda CRF150L Dual Sport Trail Motorcycle",
      category: "Motorcycle",
      pricePerDay: 900,
      status: "Rented",
      location: "Brgy. Holy Redeemer, Butuan City",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs text-muted-foreground -mt-2">
        Active Provider Account: <strong className="text-foreground">{provider.business_name || provider.name}</strong> ({provider.email})
      </div>
      {message && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("listings")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "listings"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          My Listings ({listings.length})
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

      {activeTab === "listings" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((item) => (
            <Card key={item.id} className="border-border/80 bg-card p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
                    {item.category}
                  </Badge>
                  <Badge className={item.status === "Available" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"}>
                    {item.status}
                  </Badge>
                </div>
                <h4 className="font-heading text-sm font-bold text-foreground">{item.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HugeiconsIcon icon={PinLocation01Icon} size={13} className="text-primary" />
                  <span>{item.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-mono font-bold text-foreground">₱{item.pricePerDay.toLocaleString("en-PH")} / day</span>
              </div>
            </Card>
          ))}
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
    </div>
  )
}
