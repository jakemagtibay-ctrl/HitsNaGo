"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  MoreVerticalIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Delete02Icon,
  RefreshIcon,
  Motorbike01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AdminRiderItem, RiderStatus } from "@/lib/actions/admin"
import {
  getAllRiders,
  updateRiderStatus,
  deleteRider,
} from "@/lib/actions/admin"
import { VerifiedBadge } from "@/components/common/verified-badge"

interface AdminRidersTableProps {
  initialRiders: AdminRiderItem[]
  dbNotice?: string | null
}

export function AdminRidersTable({ initialRiders, dbNotice = null }: AdminRidersTableProps) {
  const [riders, setRiders] = React.useState<AdminRiderItem[]>(initialRiders)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"All" | RiderStatus>("All")
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const [processingId, setProcessingId] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-row-menu]")) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const updated = await getAllRiders()
      setRiders(updated)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleApprove = async (rider: AdminRiderItem) => {
    setOpenMenuId(null)
    setProcessingId(rider.id)
    setFeedback(null)

    const res = await updateRiderStatus(rider.id, { is_verified: true, is_active: true })
    if (res.error) {
      setFeedback(`Error: ${res.error}`)
    } else {
      setRiders((prev) =>
        prev.map((r) =>
          r.id === rider.id ? { ...r, status: "Verified", isVerified: true, isActive: true } : r
        )
      )
      setFeedback(`Rider ${rider.name} approved and verified.`)
    }
    setProcessingId(null)
  }

  const handleToggleActive = async (rider: AdminRiderItem, activate: boolean) => {
    setOpenMenuId(null)
    setProcessingId(rider.id)
    setFeedback(null)

    const res = await updateRiderStatus(rider.id, { is_active: activate })
    if (res.error) {
      setFeedback(`Error: ${res.error}`)
    } else {
      setRiders((prev) =>
        prev.map((r) => {
          if (r.id !== rider.id) return r
          const newStatus: RiderStatus = activate ? (r.isVerified ? "Verified" : "Pending") : "Inactive"
          return { ...r, isActive: activate, status: newStatus }
        })
      )
      setFeedback(`Rider ${rider.name} marked as ${activate ? "Active" : "Inactive"}.`)
    }
    setProcessingId(null)
  }

  const handleRemove = async (rider: AdminRiderItem) => {
    if (!confirm(`Are you sure you want to remove rider ${rider.name}? This action cannot be undone.`)) {
      return
    }
    setOpenMenuId(null)
    setProcessingId(rider.id)
    setFeedback(null)

    const res = await deleteRider(rider.id)
    if (res.error) {
      setFeedback(`Error: ${res.error}`)
    } else {
      setRiders((prev) => prev.filter((r) => r.id !== rider.id))
      setFeedback(`Rider ${rider.name} was removed.`)
    }
    setProcessingId(null)
  }

  const filteredRiders = React.useMemo(() => {
    return riders.filter((r) => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.vehicleModel && r.vehicleModel.toLowerCase().includes(q)) ||
        (r.plateNumber && r.plateNumber.toLowerCase().includes(q))

      const matchStatus = statusFilter === "All" || r.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [riders, searchQuery, statusFilter])

  return (
    <div className="flex flex-col gap-4">
      {/* Database Connection / Configuration Notice */}
      {dbNotice && (
        <Card className="border-amber-500/40 bg-amber-500/10 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <HugeiconsIcon icon={Alert01Icon} size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-sm font-bold text-amber-900 dark:text-amber-200">
                Database Notice
              </span>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                {dbNotice}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search box & Status filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search riders by name, email, phone, plate..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
            {(["All", "Pending", "Verified", "Inactive"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  statusFilter === s
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 px-2.5 text-xs gap-1.5"
            title="Refresh table"
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold ml-2 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <Card className="border-border/80 bg-card shadow-xs overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Rider</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Vehicle & Plate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Completed Trips</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <HugeiconsIcon icon={Motorbike01Icon} size={28} className="opacity-40" />
                      <p className="font-semibold text-foreground">No riders found</p>
                      <p className="text-[11px]">
                        {searchQuery || statusFilter !== "All"
                          ? "Try clearing your search or status filter."
                          : "No rider accounts have been registered yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRiders.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-heading font-bold text-foreground text-xs">
                            {r.name}
                          </span>
                          <VerifiedBadge role="rider" isVerified={r.isVerified} size="sm" />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {r.email}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-foreground">
                        {r.phone || "—"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {r.vehicleModel || "—"}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {r.plateNumber || "No plate"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {r.status === "Verified" ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                          Verified
                        </Badge>
                      ) : r.status === "Pending" ? (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-zinc-500/30 bg-zinc-500/10 text-zinc-500 font-semibold text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                      {r.completedTripsCount}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="relative inline-block text-left" data-row-menu>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={processingId === r.id}
                          onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Actions"
                        >
                          <HugeiconsIcon icon={MoreVerticalIcon} size={15} />
                        </Button>

                        {openMenuId === r.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border bg-popover p-1 shadow-md z-50 animate-in fade-in zoom-in-95">
                            {r.status === "Pending" && (
                              <button
                                type="button"
                                onClick={() => handleApprove(r)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors text-left"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                                <span>Approve</span>
                              </button>
                            )}

                            {r.status === "Verified" && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(r, false)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors text-left"
                              >
                                <HugeiconsIcon icon={Cancel01Icon} size={14} />
                                <span>Deactivate</span>
                              </button>
                            )}

                            {r.status === "Inactive" && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(r, true)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors text-left"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                                <span>Activate</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-border/60" />

                            <button
                              type="button"
                              onClick={() => handleRemove(r)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors text-left"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={14} />
                              <span>Remove</span>
                            </button>
                          </div>
                        )}
                      </div>
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
