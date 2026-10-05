"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Car01Icon,
  Motorbike01Icon,
} from "@hugeicons/core-free-icons"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Card } from "@/components/ui/card"
import { MOCK_ADMIN_VEHICLES, type AdminVehicleRecord } from "@/lib/mock-data/admin-data"

export default function AdminVehiclesPage() {
  const [vehicles] = React.useState<AdminVehicleRecord[]>(MOCK_ADMIN_VEHICLES)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filteredVehicles = React.useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.brandModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.ownerName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === "all" || v.type === typeFilter
      const matchesStatus = statusFilter === "all" || v.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [vehicles, searchQuery, typeFilter, statusFilter])

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Fleet & Vehicle Registry"
        badgeText="Fleet Management"
        description="Monitor registered motorcycles, tricycles, sedans, and passenger vans operating in Butuan City."
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search vehicle model, plate number, or owner..."
        categoryFilter={typeFilter}
        onCategoryChange={setTypeFilter}
        categoryOptions={[
          { id: "all", label: "All Vehicles" },
          { id: "motorcycle", label: "Motorcycles" },
          { id: "tricycle", label: "Tricycles" },
          { id: "car", label: "Cars" },
          { id: "van", label: "Vans" },
        ]}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { id: "all", label: "All Statuses" },
          { id: "active", label: "Active" },
          { id: "maintenance", label: "Maintenance" },
          { id: "pending_inspection", label: "Pending LTO" },
        ]}
        totalResults={filteredVehicles.length}
        onResetFilters={() => {
          setSearchQuery("")
          setTypeFilter("all")
          setStatusFilter("all")
        }}
      />

      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Vehicle Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Plate Number</th>
                <th className="py-3 px-4">Owner / Operator</th>
                <th className="py-3 px-4">Registration Expiry</th>
                <th className="py-3 px-4">LTO Verification</th>
                <th className="py-3 px-4">Fleet Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredVehicles.map((veh) => (
                <tr key={veh.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {veh.type === "motorcycle" || veh.type === "tricycle" ? (
                          <HugeiconsIcon icon={Motorbike01Icon} size={15} />
                        ) : (
                          <HugeiconsIcon icon={Car01Icon} size={15} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-heading font-bold text-foreground text-xs">
                          {veh.brandModel} ({veh.year})
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Color: {veh.color}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-muted-foreground">
                    {veh.type}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {veh.plateNumber}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-foreground block">
                      {veh.ownerName}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {veh.ownerRole}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-muted-foreground font-mono">
                    {veh.registrationExpiry}
                  </td>

                  <td className="py-3.5 px-4">
                    <AdminStatusBadge status={veh.verificationStatus} />
                  </td>

                  <td className="py-3.5 px-4">
                    <AdminStatusBadge status={veh.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
