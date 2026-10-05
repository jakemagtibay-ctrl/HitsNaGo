import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminBookingsView } from "@/components/admin/admin-bookings-view"
import { HugeiconsIcon } from "@hugeicons/react"
import { Motorbike01Icon, PinLocation01Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ride Operations - HitsNaGo Admin",
  description: "Monitor live and scheduled rides across Butuan City, Agusan del Norte.",
}

export default async function AdminRidesPage() {
  await requireRole("admin")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Ride Operations Hub"
        badgeText="Passenger Transport"
        description="Monitor active habal-habal motorcycle taxis, local tricycles, and chauffeured sedans across Butuan City."
      />

      {/* Simulated Live Operations Section */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="font-heading text-sm sm:text-base font-bold text-foreground">
              Live Fleet Dispatch in Butuan City
            </h2>
          </div>
          <span className="text-[11px] font-mono text-primary font-semibold">
            Telemetry Simulated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-border/80 bg-card/80 flex flex-col gap-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-primary font-bold text-xs">TRIP #HNG-849201</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                In Transit
              </span>
            </div>
            <div className="flex items-start gap-2">
              <HugeiconsIcon icon={Motorbike01Icon} size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground block">Danilo Reyes (Yamaha NMAX 155)</span>
                <span className="text-muted-foreground text-[11px]">Passenger: Maria Santos</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-[11px] pt-2 border-t border-border/50">
              <HugeiconsIcon icon={PinLocation01Icon} size={13} className="text-primary shrink-0" />
              <span>J.C. Aquino Ave &rarr; SM City Butuan (ETA ~3 mins)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/80 bg-card/80 flex flex-col gap-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-primary font-bold text-xs">TRIP #HNG-629183</span>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Pending Dispatch
              </span>
            </div>
            <div className="flex items-start gap-2">
              <HugeiconsIcon icon={Clock01Icon} size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground block">Nearby Tricycle Search Active</span>
                <span className="text-muted-foreground text-[11px]">Passenger: Carlos Mendoza</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-[11px] pt-2 border-t border-border/50">
              <HugeiconsIcon icon={PinLocation01Icon} size={13} className="text-primary shrink-0" />
              <span>Libertad Public Market &rarr; Butuan City Hall</span>
            </div>
          </div>
        </div>
      </div>

      <AdminBookingsView initialServiceFilter="ride" title="Ride Bookings" />
    </div>
  )
}
