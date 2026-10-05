"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Clock01Icon,
  File01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminDetailSheet } from "@/components/admin/admin-detail-sheet"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  MOCK_ADMIN_VERIFICATIONS,
  type AdminVerificationRecord,
} from "@/lib/mock-data/admin-data"
import { cn } from "@/lib/utils"
import type { VerificationStatus } from "@/types/verification"

export function AdminVerificationView() {
  const [verifications, setVerifications] = React.useState<AdminVerificationRecord[]>(
    MOCK_ADMIN_VERIFICATIONS
  )
  const [activeTab, setActiveTab] = React.useState<"pending" | "verified" | "rejected">(
    "pending"
  )
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [selectedRequest, setSelectedRequest] = React.useState<AdminVerificationRecord | null>(
    null
  )
  const [adminNotes, setAdminNotes] = React.useState<string>("")

  // Confirm dialog state
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean
    action: "approve" | "reject" | "more_info"
    request: AdminVerificationRecord | null
  }>({
    isOpen: false,
    action: "approve",
    request: null,
  })

  // Filter requests
  const filteredRequests = React.useMemo(() => {
    return verifications.filter((v) => {
      const matchesTab = v.status === activeTab
      const matchesSearch =
        v.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesTab && matchesSearch
    })
  }, [verifications, activeTab, searchQuery])

  const pendingCount = verifications.filter((v) => v.status === "pending").length
  const verifiedCount = verifications.filter((v) => v.status === "verified").length
  const rejectedCount = verifications.filter((v) => v.status === "rejected").length

  const handleExecuteAction = () => {
    if (!dialogState.request) return

    const targetId = dialogState.request.id
    const newStatus: VerificationStatus =
      dialogState.action === "approve"
        ? "verified"
        : dialogState.action === "reject"
        ? "rejected"
        : "pending"

    setVerifications((prev) =>
      prev.map((v) => {
        if (v.id === targetId) {
          return {
            ...v,
            status: newStatus,
            reviewedBy: "Marcus V. Tan",
            reviewedAt: new Date().toISOString(),
            notes: adminNotes || v.notes,
          }
        }
        return v
      })
    )

    if (selectedRequest?.id === targetId) {
      setSelectedRequest((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              notes: adminNotes || prev.notes,
            }
          : null
      )
    }

    setDialogState({ isOpen: false, action: "approve", request: null })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-border pb-2 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <HugeiconsIcon icon={Clock01Icon} size={15} />
            <span>Pending Review</span>
            <span className="ml-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px]">
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("verified")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "verified"
                ? "bg-emerald-600 text-white shadow-xs"
                : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
            <span>Approved & Verified</span>
            <span className="ml-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px]">
              {verifiedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              activeTab === "rejected"
                ? "bg-destructive text-destructive-foreground shadow-xs"
                : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} />
            <span>Rejected</span>
            <span className="ml-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px]">
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            size={15}
            className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or ID..."
            className="h-9 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Requests Table */}
      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No verification applications in this tab.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedRequest(req)
                      setAdminNotes(req.notes || "")
                    }}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-heading font-bold text-foreground group-hover:text-primary transition-colors text-xs">
                          {req.userName}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ID: {req.userId}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                        {req.userRole}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      <span className="font-medium text-foreground block">
                        {req.documentType}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        #{req.documentNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground">
                      {new Date(req.submittedDate).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                          req.priority === "high"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            : req.priority === "medium"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {req.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <AdminStatusBadge status={req.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req)
                            setAdminNotes(req.notes || "")
                          }}
                          className="h-7 text-[11px] px-2 font-semibold"
                        >
                          Review
                        </Button>

                        {req.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setDialogState({ isOpen: true, action: "approve", request: req })
                              }}
                              className="h-7 rounded-lg bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDialogState({ isOpen: true, action: "reject", request: req })
                              }}
                              className="h-7 rounded-lg border border-destructive/30 px-2 text-[11px] font-bold text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              Reject
                            </button>
                          </>
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

      {/* Verification Detail Slide-Over Sheet */}
      <AdminDetailSheet
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        title={`Verification Application: ${selectedRequest?.userName}`}
        subtitle={`Request #${selectedRequest?.id} • Role: ${selectedRequest?.userRole?.toUpperCase()}`}
        footerActions={
          selectedRequest && (
            <div className="flex items-center gap-2">
              {selectedRequest.status === "pending" ? (
                <>
                  <Button
                    type="button"
                    onClick={() => {
                      setDialogState({ isOpen: true, action: "approve", request: selectedRequest })
                    }}
                    className="text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Approve Application
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setDialogState({ isOpen: true, action: "reject", request: selectedRequest })
                    }}
                    className="text-xs font-semibold"
                  >
                    Reject Application
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogState({ isOpen: true, action: "more_info", request: selectedRequest })
                    }}
                    className="text-xs font-semibold"
                  >
                    Request Information
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="text-xs"
                >
                  Close Panel
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedRequest && (
          <div className="flex flex-col gap-6 text-xs">
            {/* Applicant Summary */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex flex-col gap-0.5">
                <span className="font-heading text-sm font-bold text-foreground">
                  {selectedRequest.userName}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  Butuan City Registered Member • User ID: {selectedRequest.userId}
                </span>
              </div>
              <AdminStatusBadge status={selectedRequest.status} />
            </div>

            {/* Verification Checklist */}
            <div className="p-4 rounded-xl border border-border/80 bg-card flex flex-col gap-3">
              <span className="font-heading text-xs font-bold text-foreground uppercase tracking-wider">
                Verification Audit Checklist
              </span>
              <div className="flex flex-col gap-2">
                {[
                  "Government ID / License authenticity match with LTO or PhilSys registry",
                  "Applicant address verified within Butuan City operational territory",
                  "Motorcycle OR/CR / Commercial permit matches applicant entity",
                  "No active safety suspensions or unresolved customer disputes",
                ].map((item, idx) => (
                  <label key={idx} className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-0.5 size-4 rounded text-primary focus:ring-primary" />
                    <span className="text-muted-foreground leading-snug">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submitted Documents Placeholder Gallery */}
            <div className="flex flex-col gap-3">
              <span className="font-heading text-xs font-bold text-foreground uppercase tracking-wider">
                Submitted Documents ({selectedRequest.submittedFiles.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedRequest.submittedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-xl border border-border bg-muted/30 p-3 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <HugeiconsIcon icon={File01Icon} size={15} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-foreground truncate text-xs">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {file.type}
                        </span>
                      </div>
                    </div>

                    {/* Preview Thumbnail */}
                    <div className="h-28 w-full rounded-lg overflow-hidden bg-muted relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <span className="text-[10px] text-center text-primary font-semibold">
                      Click to inspect high-resolution
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviewer Notes Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="verif-notes" className="text-xs font-semibold text-foreground">
                Administrative Notes & Audit Reason
              </label>
              <textarea
                id="verif-notes"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal admin notes or reason for approval/rejection..."
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
          dialogState.action === "approve"
            ? `Approve verification for ${dialogState.request?.userName}?`
            : dialogState.action === "reject"
            ? `Reject verification for ${dialogState.request?.userName}?`
            : `Request more information from ${dialogState.request?.userName}?`
        }
        description={
          dialogState.action === "approve"
            ? `This grants full verified credentials to ${dialogState.request?.userName} in Butuan City.`
            : dialogState.action === "reject"
            ? `This will deny verified status with recorded admin notes.`
            : `This will send an alert notifying the applicant to upload missing documents.`
        }
        variant={
          dialogState.action === "approve"
            ? "success"
            : dialogState.action === "reject"
            ? "destructive"
            : "primary"
        }
        confirmLabel={
          dialogState.action === "approve"
            ? "Confirm Approval"
            : dialogState.action === "reject"
            ? "Confirm Rejection"
            : "Send Request"
        }
        onConfirm={handleExecuteAction}
        onCancel={() => setDialogState({ isOpen: false, action: "approve", request: null })}
      />
    </div>
  )
}
