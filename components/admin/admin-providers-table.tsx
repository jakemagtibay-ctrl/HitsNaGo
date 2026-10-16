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
  Key01Icon,
} from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AdminProviderItem, ProviderStatus } from "@/lib/actions/admin"
import {
  getAllRentalProviders,
  updateProviderStatus,
  deleteProvider,
} from "@/lib/actions/admin"

interface AdminProvidersTableProps {
  initialProviders: AdminProviderItem[]
}

export function AdminProvidersTable({ initialProviders }: AdminProvidersTableProps) {
  const [providers, setProviders] = React.useState<AdminProviderItem[]>(initialProviders)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"All" | ProviderStatus>("All")
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
      const updated = await getAllRentalProviders()
      setProviders(updated)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleApprove = async (provider: AdminProviderItem) => {
    setOpenMenuId(null)
    setProcessingId(provider.id)
    setFeedback(null)

    const res = await updateProviderStatus(provider.id, { is_verified: true, is_active: true })
    if (res.error) {
      setFeedback(`Error: ${res.error}`)
    } else {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id ? { ...p, status: "Verified", isVerified: true, isActive: true } : p
        )
      )
      setFeedback(`Rental provider ${provider.name} approved and verified.`)
    }
    setProcessingId(null)
  }

  const handleToggleActive = async (provider: AdminProviderItem, activate: boolean) => {
    setOpenMenuId(null)
    setProcessingId(provider.id)
    setFeedback(null)

    const res = await updateProviderStatus(provider.id, { is_active: activate })
    if (res.error) {
      setFeedback(`Error: ${res.error}`)
    } else {
      setProviders((prev) =>
        prev.map((p) => {
          if (p.id !== provider.id) return p
          const newStatus: ProviderStatus = activate ? (p.isVerified ? "Verified" : "Pending") : "Inactive"
          return { ...p, isActive: activate, status: newStatus }
        })
      )
      setFeedback(`Rental provider ${provider.name} marked as ${activate ? "Active" : "Inactive"}.`)
    }
    setProcessingId(null)
  }

  const handleRemove = async (provider: AdminProviderItem) => {
    if (!confirm(`Are you sure you want to remove rental provider ${provider.name}? This action cannot be undone.`)) {
      return
    }
    setOpenMenuId(null)
    setProcessingId(provider.id)
    setFeedback(null)

    const res = await deleteProvider(provider.id)
    if (res.error) {
      setFeedback(`Error: ${res.error}`)
    } else {
      setProviders((prev) => prev.filter((p) => p.id !== provider.id))
      setFeedback(`Rental provider ${provider.name} was removed.`)
    }
    setProcessingId(null)
  }

  const filteredProviders = React.useMemo(() => {
    return providers.filter((p) => {
      const q = searchQuery.toLowerCase()
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.businessName && p.businessName.toLowerCase().includes(q))

      const matchStatus = statusFilter === "All" || p.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [providers, searchQuery, statusFilter])

  return (
    <div className="flex flex-col gap-4">
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
            placeholder="Search providers by name, email, phone, business..."
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
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <HugeiconsIcon icon={Key01Icon} size={28} className="opacity-40" />
                      <p className="font-semibold text-foreground">No rental providers found</p>
                      <p className="text-[11px]">
                        {searchQuery || statusFilter !== "All"
                          ? "Try clearing your search or status filter."
                          : "No rental provider accounts have been registered yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProviders.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-heading font-bold text-foreground text-xs">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {p.email}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-foreground">
                        {p.phone || "—"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-foreground">
                        {p.businessName || "—"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {p.status === "Verified" ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                          Verified
                        </Badge>
                      ) : p.status === "Pending" ? (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-zinc-500/30 bg-zinc-500/10 text-zinc-500 font-semibold text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="relative inline-block text-left" data-row-menu>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={processingId === p.id}
                          onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Actions"
                        >
                          <HugeiconsIcon icon={MoreVerticalIcon} size={15} />
                        </Button>

                        {openMenuId === p.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border bg-popover p-1 shadow-md z-50 animate-in fade-in zoom-in-95">
                            {p.status === "Pending" && (
                              <button
                                type="button"
                                onClick={() => handleApprove(p)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors text-left"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                                <span>Approve</span>
                              </button>
                            )}

                            {p.status === "Verified" && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(p, false)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors text-left"
                              >
                                <HugeiconsIcon icon={Cancel01Icon} size={14} />
                                <span>Deactivate</span>
                              </button>
                            )}

                            {p.status === "Inactive" && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(p, true)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors text-left"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                                <span>Activate</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-border/60" />

                            <button
                              type="button"
                              onClick={() => handleRemove(p)}
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
