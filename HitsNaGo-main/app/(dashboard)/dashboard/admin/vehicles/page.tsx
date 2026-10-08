import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Car01Icon,
  Motorbike01Icon,
} from "@hugeicons/core-free-icons"
import { requireRole } from "@/lib/auth/roles"
import { getAllRiders } from "@/lib/actions/admin"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fleet & Vehicle Registry - HitsNaGo Admin",
  description: "Monitor registered motorcycles, tricycles, and vehicles operating in Butuan City.",
}

export default async function AdminVehiclesPage() {
  await requireRole("admin")

  const riders = await getAllRiders()

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Fleet & Vehicle Registry"
        badgeText="Fleet Management"
        description="Monitor registered motorcycles and vehicles operating across Butuan City, Agusan del Norte."
      />

      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Vehicle Model</th>
                <th className="py-3 px-4">Plate Number</th>
                <th className="py-3 px-4">Driver / Operator</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Fleet Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {riders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <HugeiconsIcon icon={Car01Icon} size={28} className="opacity-40" />
                      <p className="font-semibold text-foreground">No vehicles registered yet</p>
                      <p className="text-[11px]">
                        Vehicles registered by approved riders will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                riders.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <HugeiconsIcon icon={Motorbike01Icon} size={15} />
                        </div>
                        <span className="font-heading font-bold text-foreground text-xs">
                          {r.vehicleModel || "Motorcycle / Tricycle"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {r.plateNumber || "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-foreground block">
                        {r.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {r.email}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      {r.phone || "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      {r.isVerified ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                          Pending
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {r.isActive ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-zinc-500/30 bg-zinc-500/10 text-zinc-500 font-semibold text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
