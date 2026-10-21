"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Key01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  RefreshIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  EyeIcon,
  File01Icon,
  Image01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VerificationStatusBadge } from "@/components/dashboard/status-badge"
import type { PendingApplication } from "@/lib/actions/bookings"
import {
  getPendingApplications,
  getVerificationDocumentUrls,
  reviewApplication,
} from "@/lib/actions/bookings"
import { GOVERNMENT_ID_OPTIONS } from "@/types/verification"
import { cn } from "@/lib/utils"

interface AdminApplicationsViewProps {
  initialApplications: PendingApplication[]
}

type FilterTab = "pending" | "resubmission_required" | "verified" | "all"

export function AdminApplicationsView({ initialApplications }: AdminApplicationsViewProps) {
  const [applications, setApplications] = React.useState<PendingApplication[]>(initialApplications)
  const [activeTab, setActiveTab] = React.useState<FilterTab>("pending")
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Document viewer modal state
  const [viewingApp, setViewingApp] = React.useState<PendingApplication | null>(null)
  const [docLoading, setDocLoading] = React.useState(false)
  const [docUrls, setDocUrls] = React.useState<{ frontUrl: string | null; backUrl: string | null } | null>(null)
  const [docError, setDocError] = React.useState<string | null>(null)
  const [activeDocSide, setActiveDocSide] = React.useState<"front" | "back">("front")

  // Decision modals state
  const [actionModal, setActionModal] = React.useState<{
    app: PendingApplication
    type: "approve" | "reject" | "resubmit"
  } | null>(null)
  const [decisionReason, setDecisionReason] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const data = await getPendingApplications()
      setApplications(data)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Open Document Viewer
  const handleOpenDocViewer = async (app: PendingApplication) => {
    setViewingApp(app)
    setDocLoading(true)
    setDocError(null)
    setDocUrls(null)
    setActiveDocSide("front")

    const res = await getVerificationDocumentUrls(app.type, app.id)
    if (res.error) {
      setDocError(res.error)
    } else {
      setDocUrls({ frontUrl: res.frontUrl, backUrl: res.backUrl })
    }
    setDocLoading(false)
  }

  const handleCloseDocViewer = () => {
    setViewingApp(null)
    setDocUrls(null)
    setDocError(null)
  }

  // Submit Decision
  const handleConfirmDecision = async () => {
    if (!actionModal) return

    if ((actionModal.type === "reject" || actionModal.type === "resubmit") && !decisionReason.trim()) {
      alert("A clear reason or explanation is required for this decision.")
      return
    }

    setIsProcessing(true)
    const res = await reviewApplication({
      type: actionModal.app.type,
      id: actionModal.app.id,
      decision: actionModal.type,
      reason: decisionReason.trim() || undefined,
    })

    if (res.error) {
      setFeedback(`Error: ${res.error}`)
      setIsProcessing(false)
      return
    }

    // Update local state
    const newStatus =
      actionModal.type === "approve"
        ? "verified"
        : actionModal.type === "resubmit"
        ? "resubmission_required"
        : "rejected"

    setApplications((prev) =>
      prev.map((a) =>
        a.id === actionModal.app.id
          ? {
              ...a,
              status: newStatus,
              rejection_reason: decisionReason.trim() || null,
              reviewed_at: new Date().toISOString(),
            }
          : a
      )
    )

    const actionText =
      actionModal.type === "approve"
        ? `Approved ${actionModal.app.name} as verified ${actionModal.app.type}.`
        : actionModal.type === "resubmit"
        ? `Requested document resubmission from ${actionModal.app.name}.`
        : `Declined application from ${actionModal.app.name}.`

    setFeedback(actionText)
    setIsProcessing(false)
    setActionModal(null)
    setDecisionReason("")
    if (viewingApp?.id === actionModal.app.id) {
      handleCloseDocViewer()
    }
  }

  // Counts for tabs
  const pendingCount = applications.filter((a) => a.status === "pending").length
  const resubmitCount = applications.filter((a) => a.status === "resubmission_required").length
  const verifiedCount = applications.filter((a) => a.status === "verified").length

  // Filtered applications
  const filteredApps = applications.filter((a) => {
    if (activeTab === "pending") return a.status === "pending"
    if (activeTab === "resubmission_required") return a.status === "resubmission_required"
    if (activeTab === "verified") return a.status === "verified"
    return true
  })

  const getIdLabel = (idType?: string | null, customType?: string | null) => {
    if (!idType) return "Unspecified Document"
    if (idType === "other") return customType ? `Other: ${customType}` : "Other Government ID"
    const match = GOVERNMENT_ID_OPTIONS.find((o) => o.id === idType)
    return match ? match.label : idType
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-sm font-bold text-foreground">
            Verification Applications ({applications.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 gap-1.5 text-xs"
          >
            <HugeiconsIcon icon={RefreshIcon} size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Queue"}</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={cn(
            "h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
            activeTab === "pending"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>Pending Review</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeTab === "pending" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"
            )}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("resubmission_required")}
          className={cn(
            "h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
            activeTab === "resubmission_required"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>Resubmission Requested</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeTab === "resubmission_required"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {resubmitCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("verified")}
          className={cn(
            "h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
            activeTab === "verified"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>Approved / Verified</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeTab === "verified" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"
            )}
          >
            {verifiedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
            activeTab === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>All Applications</span>
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px]",
              activeTab === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"
            )}
          >
            {applications.length}
          </span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold underline ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
              <HugeiconsIcon icon={ShieldCheckIcon} size={24} />
            </div>
            <h4 className="font-heading text-sm font-bold text-foreground">No Applications in this View</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              There are currently no verification applications matching the selected tab.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApps.map((app) => {
            const hasUploadedImages = Boolean(app.id_front_path)

            return (
              <Card
                key={app.id}
                className="border-border/80 bg-card shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 flex flex-col gap-3">
                  {/* Top line badges */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      className={
                        app.type === "rider"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 text-[11px]"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 gap-1 text-[11px]"
                      }
                    >
                      <HugeiconsIcon icon={app.type === "rider" ? Motorbike01Icon : Key01Icon} size={12} />
                      <span className="capitalize">{app.type} Onboarding</span>
                    </Badge>

                    <VerificationStatusBadge status={app.status} />
                  </div>

                  {/* Applicant Details */}
                  <div>
                    <h4 className="font-heading text-sm font-bold text-foreground">{app.name}</h4>
                    <span className="text-xs text-muted-foreground block">{app.email}</span>
                    {app.phone && (
                      <span className="text-[11px] text-muted-foreground block font-mono">{app.phone}</span>
                    )}
                  </div>

                  {/* Operational Details */}
                  <div className="rounded-xl bg-muted/40 p-2.5 text-xs text-muted-foreground flex flex-col gap-1">
                    <div>
                      <span className="font-semibold text-foreground">
                        {app.type === "rider" ? "Vehicle & Plate:" : "Business / Fleet:"}
                      </span>{" "}
                      <span>{app.detail}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/40 text-[11px]">
                      <HugeiconsIcon icon={File01Icon} size={12} className="text-primary shrink-0" />
                      <span className="font-semibold text-foreground">ID Type:</span>
                      <span className="truncate">{getIdLabel(app.id_type, app.id_type_custom)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>Submitted:</span>
                      <span>
                        {new Date(app.submitted_at || app.created_at).toLocaleDateString("en-PH", {
                          dateStyle: "medium",
                          timeZone: "Asia/Manila",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Previous Admin Review Note */}
                  {app.rejection_reason && (
                    <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-2.5 text-xs text-orange-950 dark:text-orange-200">
                      <strong className="block font-semibold mb-0.5">Admin Note / Feedback:</strong>
                      <span>{app.rejection_reason}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="p-3 bg-muted/20 border-t border-border/60 flex flex-col sm:flex-row items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto flex-1 text-xs gap-1.5"
                    onClick={() => handleOpenDocViewer(app)}
                  >
                    <HugeiconsIcon icon={EyeIcon} size={14} />
                    <span>View Submitted ID</span>
                    {!hasUploadedImages && <span className="text-[10px] text-amber-500">(Pending Upload)</span>}
                  </Button>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {app.status !== "verified" && (
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() => setActionModal({ app, type: "approve" })}
                      >
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                        Approve
                      </Button>
                    )}

                    {app.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none text-xs gap-1 text-orange-600 border-orange-500/30 hover:bg-orange-500/10 font-semibold"
                        onClick={() => {
                          setDecisionReason("")
                          setActionModal({ app, type: "resubmit" })
                        }}
                      >
                        <HugeiconsIcon icon={AlertCircleIcon} size={14} />
                        Resubmit
                      </Button>
                    )}

                    {app.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none text-xs gap-1 text-destructive hover:bg-destructive/10 font-semibold"
                        onClick={() => {
                          setDecisionReason("")
                          setActionModal({ app, type: "reject" })
                        }}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={14} />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── SECURE DOCUMENT VIEWER MODAL ────────────────────────────────────── */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HugeiconsIcon icon={ShieldCheckIcon} size={20} />
                </div>
                <div>
                  <h3 className="font-heading text-sm sm:text-base font-bold text-foreground">
                    Government ID Inspection: {viewingApp.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {getIdLabel(viewingApp.id_type, viewingApp.id_type_custom)} • {viewingApp.type.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDocViewer}
                className="size-8 rounded-lg text-muted-foreground hover:bg-muted flex items-center justify-center cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
              {docLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground text-xs">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Generating short-lived encrypted signed URLs...</span>
                </div>
              ) : docError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive text-center flex flex-col items-center gap-2">
                  <HugeiconsIcon icon={AlertCircleIcon} size={22} />
                  <span>{docError}</span>
                  <p className="text-[11px] opacity-80">
                    The applicant may not have uploaded ID photos yet or the signed token has expired.
                  </p>
                </div>
              ) : !docUrls?.frontUrl && !docUrls?.backUrl ? (
                <div className="rounded-xl border border-border/80 bg-muted/20 p-8 text-center flex flex-col items-center gap-2 text-muted-foreground text-xs">
                  <HugeiconsIcon icon={Image01Icon} size={28} />
                  <span className="font-semibold text-foreground">No ID Photos Uploaded</span>
                  <p className="max-w-xs text-[11px]">
                    This application was created without attached document files. You may request resubmission.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Side Switcher (Front / Back) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveDocSide("front")}
                      className={cn(
                        "flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                        activeDocSide === "front"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <HugeiconsIcon icon={File01Icon} size={14} />
                      <span>Front of ID</span>
                    </button>

                    {docUrls?.backUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveDocSide("back")}
                        className={cn(
                          "flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                          activeDocSide === "back"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <HugeiconsIcon icon={File01Icon} size={14} />
                        <span>Back of ID</span>
                      </button>
                    )}
                  </div>

                  {/* Image Display */}
                  <div className="rounded-2xl border border-border/80 bg-black/90 p-2 flex items-center justify-center min-h-[260px] max-h-[420px] overflow-hidden relative">
                    {activeDocSide === "front" && docUrls?.frontUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={docUrls.frontUrl}
                        alt="Front of Government ID"
                        className="max-h-[380px] w-auto max-w-full object-contain rounded-lg"
                      />
                    )}

                    {activeDocSide === "back" && docUrls?.backUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={docUrls.backUrl}
                        alt="Back of Government ID"
                        className="max-h-[380px] w-auto max-w-full object-contain rounded-lg"
                      />
                    )}
                  </div>

                  {/* Confidentiality Reminder */}
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-3 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
                    <HugeiconsIcon icon={LockIcon} size={16} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Confidential Document Vault:</strong> Viewing via 10-minute temporary signed authorization. Never copy, photograph, or distribute applicant government IDs.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 bg-muted/20 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDocViewer(viewingApp)}
                disabled={docLoading}
                className="text-xs gap-1.5"
              >
                <HugeiconsIcon icon={RefreshIcon} size={13} className={docLoading ? "animate-spin" : ""} />
                <span>Refresh URLs</span>
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                {viewingApp.status !== "verified" && (
                  <Button
                    size="sm"
                    className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={() => {
                      setActionModal({ app: viewingApp, type: "approve" })
                    }}
                  >
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                    Approve
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1 text-orange-600 border-orange-500/30 hover:bg-orange-500/10 font-semibold"
                  onClick={() => {
                    setDecisionReason("")
                    setActionModal({ app: viewingApp, type: "resubmit" })
                  }}
                >
                  <HugeiconsIcon icon={AlertCircleIcon} size={14} />
                  Resubmit
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1 text-destructive hover:bg-destructive/10 font-semibold"
                  onClick={() => {
                    setDecisionReason("")
                    setActionModal({ app: viewingApp, type: "reject" })
                  }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ACTION CONFIRMATION MODALS (Approve / Reject / Resubmit) ─────────── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  actionModal.type === "approve"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : actionModal.type === "resubmit"
                    ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                    : "bg-destructive/15 text-destructive"
                )}
              >
                <HugeiconsIcon
                  icon={
                    actionModal.type === "approve"
                      ? CheckmarkCircle01Icon
                      : actionModal.type === "resubmit"
                      ? AlertCircleIcon
                      : Cancel01Icon
                  }
                  size={20}
                />
              </div>

              <div>
                <h3 className="font-heading text-sm font-bold text-foreground">
                  {actionModal.type === "approve"
                    ? `Approve ${actionModal.app.type === "rider" ? "Rider" : "Provider"} Verification`
                    : actionModal.type === "resubmit"
                    ? "Request Document Resubmission"
                    : "Reject Verification Application"}
                </h3>
                <p className="text-xs text-muted-foreground">{actionModal.app.name}</p>
              </div>
            </div>

            {actionModal.type === "approve" ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to approve this application? The applicant will be marked as a verified {actionModal.app.type} and granted full access to their dashboard services.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <label htmlFor="reason" className="text-xs font-semibold text-foreground">
                  {actionModal.type === "resubmit"
                    ? "Explanation / Instructions for Applicant *"
                    : "Reason for Rejection *"}
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  required
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder={
                    actionModal.type === "resubmit"
                      ? "e.g. Front image is slightly blurry. Please upload a clearer photo showing your full name and expiry date."
                      : "e.g. Document expired or name does not match registration record."
                  }
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <span className="text-[11px] text-muted-foreground">
                  This explanation will be delivered directly to the applicant via notification.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActionModal(null)}
                disabled={isProcessing}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                onClick={handleConfirmDecision}
                disabled={
                  isProcessing ||
                  ((actionModal.type === "reject" || actionModal.type === "resubmit") && !decisionReason.trim())
                }
                className={cn(
                  "text-xs font-semibold gap-1.5 shadow-xs",
                  actionModal.type === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : actionModal.type === "resubmit"
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-destructive hover:bg-destructive/90 text-white"
                )}
              >
                {isProcessing ? (
                  <span>Processing...</span>
                ) : actionModal.type === "approve" ? (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                    <span>Confirm & Approve</span>
                  </>
                ) : actionModal.type === "resubmit" ? (
                  <>
                    <HugeiconsIcon icon={AlertCircleIcon} size={14} />
                    <span>Send Resubmission Request</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
