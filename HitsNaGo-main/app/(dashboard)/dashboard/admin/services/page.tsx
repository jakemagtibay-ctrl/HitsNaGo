"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PinLocation01Icon } from "@hugeicons/core-free-icons"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Card } from "@/components/ui/card"

export interface AdminServiceRecord {
  id: string
  name: string
  category: string
  providerName: string
  rateType: "hourly" | "daily" | "per_trip" | "fixed"
  rateAmount: number
  approvalStatus: "approved" | "pending" | "rejected"
  location: string
}

const ACTIVE_SERVICES: AdminServiceRecord[] = [
  {
    id: "srv_ride",
    name: "Passenger Ride Hailing",
    category: "motorcycle",
    providerName: "HitsNaGo Driver Fleet",
    rateType: "per_trip",
    rateAmount: 45,
    approvalStatus: "approved",
    location: "Butuan City, Agusan del Norte",
  },
  {
    id: "srv_rental",
    name: "Vehicle & Fleet Rental",
    category: "vehicle",
    providerName: "Verified Rental Providers",
    rateType: "daily",
    rateAmount: 1200,
    approvalStatus: "approved",
    location: "Butuan City, Agusan del Norte",
  },
  {
    id: "srv_delivery",
    name: "Courier & Package Delivery",
    category: "motorcycle",
    providerName: "HitsNaGo Dispatch",
    rateType: "fixed",
    rateAmount: 50,
    approvalStatus: "approved",
    location: "Butuan City, Agusan del Norte",
  },
]

export default function AdminServicesPage() {
  const [services] = React.useState<AdminServiceRecord[]>(ACTIVE_SERVICES)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filteredServices = React.useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === "all" || s.category.toLowerCase().includes(categoryFilter.toLowerCase())
      const matchesStatus = statusFilter === "all" || s.approvalStatus === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [services, searchQuery, categoryFilter, statusFilter])

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Service Offerings & Catalog"
        badgeText="Service Governance"
        description="Review approved and active service options in Butuan City."
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search service name, provider, or category..."
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categoryOptions={[
          { id: "all", label: "All Offerings" },
          { id: "vehicle", label: "Vehicles" },
          { id: "motorcycle", label: "Motorcycles" },
        ]}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { id: "all", label: "All Statuses" },
          { id: "approved", label: "Approved" },
          { id: "pending", label: "Pending" },
          { id: "rejected", label: "Rejected" },
        ]}
        totalResults={filteredServices.length}
        onResetFilters={() => {
          setSearchQuery("")
          setCategoryFilter("all")
          setStatusFilter("all")
        }}
      />

      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Service Offering</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Provider / Fleet</th>
                <th className="py-3 px-4">Base Rate</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Catalog Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredServices.map((srv) => (
                <tr key={srv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-heading font-bold text-foreground text-xs block">
                      {srv.name}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-muted-foreground">
                    {srv.category}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {srv.providerName}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    ₱{srv.rateAmount}{" "}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      /{srv.rateType.replace("_", " ")}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={PinLocation01Icon} size={13} className="shrink-0 text-primary" />
                      <span>{srv.location}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <AdminStatusBadge status={srv.approvalStatus} />
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
