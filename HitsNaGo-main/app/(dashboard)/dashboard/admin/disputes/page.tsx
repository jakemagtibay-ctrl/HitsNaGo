"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  File01Icon,
} from "@hugeicons/core-free-icons"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminDetailSheet } from "@/components/admin/admin-detail-sheet"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
export interface AdminDisputeRecord {
  id: string
  bookingId: string
  bookingReference: string
  customerName: string
  partyName: string
  partyRole: string
  serviceType: string
  issue: string
  amount: number
  status: "open" | "under_review" | "resolved" | "closed"
  submittedDate: string
  createdAt: string
  description?: string
  adminNotes?: string
  evidencePlaceholder?: string
  priority?: "low" | "medium" | "high" | "urgent"
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = React.useState<AdminDisputeRecord[]>([])
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedDispute, setSelectedDispute] = React.useState<AdminDisputeRecord | null>(null)
  const [adminResolutionNotes, setAdminResolutionNotes] = React.useState<string>("")

  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean
    action: "resolve" | "close" | "investigate"
    dispute: AdminDisputeRecord | null
  }>({
    isOpen: false,
    action: "resolve",
    dispute: null,
  })

  const filteredDisputes = React.useMemo(() => {
    return disputes.filter((d) => {
      const matchesSearch =
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.bookingId.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || d.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [disputes, searchQuery, statusFilter])

  const handleExecuteAction = () => {
    if (!dialogState.dispute) return
    const targetId = dialogState.dispute.id

    const newStatus =
      dialogState.action === "resolve"
        ? "resolved"
        : dialogState.action === "close"
        ? "closed"
        : "under_review"

    setDisputes((prev) =>
      prev.map((d) => {
        if (d.id === targetId) {
          return {
            ...d,
            status: newStatus,
            adminNotes: adminResolutionNotes || d.adminNotes,
          }
        }
        return d
      })
    )

    if (selectedDispute?.id === targetId) {
      setSelectedDispute((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              adminNotes: adminResolutionNotes || prev.adminNotes,
            }
          : null
      )
    }

    setDialogState({ isOpen: false, action: "resolve", dispute: null })
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Dispute & Safety Escalations"
        badgeText="Trust & Mediation"
        description="Mediate fare discrepancies, route issues, damaged parcels, and deposit refund claims in Butuan City."
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search dispute ID, customer, partner, or issue..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { id: "all", label: "All Disputes" },
          { id: "open", label: "Open" },
          { id: "under_review", label: "Under Review" },
          { id: "resolved", label: "Resolved" },
          { id: "closed", label: "Closed" },
        ]}
        totalResults={filteredDisputes.length}
        onResetFilters={() => {
          setSearchQuery("")
          setStatusFilter("all")
        }}
      />

      <div className="grid grid-cols-1 gap-4">
        {filteredDisputes.map((disp) => (
          <Card key={disp.id} className="border-border/80 bg-card shadow-xs">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <HugeiconsIcon icon={AlertCircleIcon} size={20} />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      #{disp.bookingId}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-primary">
                      {disp.serviceType}
                    </span>
                    <AdminStatusBadge status={disp.status} />
                  </div>

                  <h3 className="font-heading font-bold text-sm text-foreground">
                    {disp.issue}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    Complainant: <strong className="text-foreground">{disp.customerName}</strong> vs{" "}
                    <strong className="text-foreground">{disp.partyName} ({disp.partyRole})</strong>
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border gap-2 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="font-heading text-base font-bold text-foreground">
                    ₱{disp.amount.toLocaleString()} disputed
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {new Date(disp.submittedDate).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDispute(disp)
                    setAdminResolutionNotes(disp.adminNotes || "")
                  }}
                  className="text-xs font-semibold"
                >
                  Investigate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dispute Detail Sheet */}
      <AdminDetailSheet
        isOpen={Boolean(selectedDispute)}
        onClose={() => setSelectedDispute(null)}
        title={`Dispute Case #${selectedDispute?.id}`}
        subtitle={`Booking Ref: ${selectedDispute?.bookingId} • Amount: ₱${selectedDispute?.amount.toLocaleString()}`}
        footerActions={
          selectedDispute && (
            <div className="flex items-center gap-2">
              {selectedDispute.status !== "resolved" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setDialogState({ isOpen: true, action: "resolve", dispute: selectedDispute })
                  }
                  className="text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Mark as Resolved
                </Button>
              )}
              {selectedDispute.status === "open" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDialogState({ isOpen: true, action: "investigate", dispute: selectedDispute })
                  }
                  className="text-xs font-semibold"
                >
                  Move to Under Review
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDispute(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          )
        }
      >
        {selectedDispute && (
          <div className="flex flex-col gap-5 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
              <span className="font-heading font-bold text-foreground text-sm">
                Disputed Claim: ₱{selectedDispute.amount.toLocaleString("en-PH")}
              </span>
              <AdminStatusBadge status={selectedDispute.status} />
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card flex flex-col gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Reported Incident
              </span>
              <p className="text-sm font-semibold text-foreground">
                {selectedDispute.issue}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Evidence Placeholder & Telemetry Records
              </span>
              <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-lg text-muted-foreground">
                <HugeiconsIcon icon={File01Icon} size={16} className="text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">{selectedDispute.evidencePlaceholder}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="disp-notes" className="text-xs font-semibold text-foreground">
                Admin Resolution Notes
              </label>
              <textarea
                id="disp-notes"
                rows={3}
                value={adminResolutionNotes}
                onChange={(e) => setAdminResolutionNotes(e.target.value)}
                placeholder="Document findings, mediation decisions, or refund authorisations..."
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
        )}
      </AdminDetailSheet>

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={dialogState.isOpen}
        title={
          dialogState.action === "resolve"
            ? "Resolve this dispute?"
            : "Update dispute investigation status?"
        }
        description="This updates the mediation state in the administrative record for Butuan City operations."
        variant={dialogState.action === "resolve" ? "success" : "primary"}
        confirmLabel={dialogState.action === "resolve" ? "Resolve Dispute" : "Update Status"}
        onConfirm={handleExecuteAction}
        onCancel={() => setDialogState({ isOpen: false, action: "resolve", dispute: null })}
      />
    </div>
  )
}
