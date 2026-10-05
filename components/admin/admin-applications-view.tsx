"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Key01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons"
import { AdminDetailSheet } from "@/components/admin/admin-detail-sheet"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  MOCK_RIDER_APPLICATIONS,
  MOCK_PROVIDER_APPLICATIONS,
} from "@/lib/mock-data/applications"
import type { RiderApplication, ProviderApplication, RoleApplication, ApplicationStatus } from "@/types/application"
import { cn } from "@/lib/utils"

type TabId = "all" | "rider" | "provider" | "pending" | "approved" | "rejected"

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rider", label: "Rider Applications" },
  { id: "provider", label: "Provider Applications" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
]

function StatusPill({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, { label: string; className: string }> = {
    pending: { label: "Pending Review", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25" },
    approved: { label: "Approved", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" },
    rejected: { label: "Rejected", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25" },
  }
  const cfg = map[status]
  return (
    <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border", cfg.className)}>
      {cfg.label}
    </span>
  )
}

function ApplicationTypeTag({ type }: { type: "rider" | "provider" }) {
  return (
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit",
      type === "rider"
        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
        : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25"
    )}>
      <HugeiconsIcon icon={type === "rider" ? Motorbike01Icon : Key01Icon} size={10} />
      {type === "rider" ? "Rider" : "Rental Provider"}
    </span>
  )
}

export function AdminApplicationsView() {
  const [riderApps, setRiderApps] = React.useState<RiderApplication[]>(MOCK_RIDER_APPLICATIONS)
  const [providerApps, setProviderApps] = React.useState<ProviderApplication[]>(MOCK_PROVIDER_APPLICATIONS)
  const [activeTab, setActiveTab] = React.useState<TabId>("all")
  const [selectedApp, setSelectedApp] = React.useState<RoleApplication | null>(null)
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean
    action: "approve" | "reject" | "request_info"
    app: RoleApplication | null
  }>({ isOpen: false, action: "approve", app: null })

  const allApps: RoleApplication[] = React.useMemo(() => [
    ...riderApps,
    ...providerApps,
  ].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [riderApps, providerApps])

  const filteredApps = React.useMemo(() => {
    return allApps.filter((app) => {
      if (activeTab === "all") return true
      if (activeTab === "rider") return app.applicationType === "rider"
      if (activeTab === "provider") return app.applicationType === "provider"
      if (activeTab === "pending" || activeTab === "approved" || activeTab === "rejected") {
        return app.status === activeTab
      }
      return true
    })
  }, [allApps, activeTab])

  const counts = React.useMemo(() => ({
    all: allApps.length,
    rider: riderApps.length,
    provider: providerApps.length,
    pending: allApps.filter((a) => a.status === "pending").length,
    approved: allApps.filter((a) => a.status === "approved").length,
    rejected: allApps.filter((a) => a.status === "rejected").length,
  }), [allApps, riderApps, providerApps])

  const handleAction = () => {
    const { app, action } = dialogState
    if (!app) return

    const updateStatus = (prev: ApplicationStatus): ApplicationStatus => {
      if (action === "approve") return "approved"
      if (action === "reject") return "rejected"
      return prev
    }

    if (app.applicationType === "rider") {
      setRiderApps((prev) =>
        prev.map((a) => a.id === app.id ? { ...a, status: updateStatus(a.status), reviewedAt: new Date().toISOString() } : a)
      )
    } else {
      setProviderApps((prev) =>
        prev.map((a) => a.id === app.id ? { ...a, status: updateStatus(a.status), reviewedAt: new Date().toISOString() } : a)
      )
    }

    if (selectedApp?.id === app.id) {
      setSelectedApp((prev) => prev ? { ...prev, status: updateStatus(prev.status) } : null)
    }
    setDialogState({ isOpen: false, action: "approve", app: null })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-heading text-sm font-bold text-foreground">
          Role Applications
        </h3>
        <p className="text-xs text-muted-foreground">
          Review and process Rider and Rental Provider applications. Approved applicants gain their new role in HitsNaGo.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-[10px] font-bold rounded-full px-1.5 py-0.5",
              activeTab === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <HugeiconsIcon icon={File01Icon} size={32} className="text-muted-foreground/40" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">No Applications Found</span>
              <span className="text-xs text-muted-foreground">No role applications match the selected filter.</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedApp(app)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground">{app.applicantName}</span>
                        <span className="text-muted-foreground text-[11px]">{app.applicantEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <ApplicationTypeTag type={app.applicationType} />
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(app.submittedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={app.status} />
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {app.status === "pending" ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDialogState({ isOpen: true, action: "approve", app })}
                            className="flex items-center gap-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2 py-1 text-[11px] font-semibold hover:bg-emerald-500/25 transition-colors"
                          >
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setDialogState({ isOpen: true, action: "reject", app })}
                            className="flex items-center gap-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 px-2 py-1 text-[11px] font-semibold hover:bg-rose-500/25 transition-colors"
                          >
                            <HugeiconsIcon icon={Cancel01Icon} size={12} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          {app.status === "approved" ? "Approved" : "Rejected"}
                          {app.reviewedAt && (
                            <span className="block">
                              {new Date(app.reviewedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Sheet */}
      <AdminDetailSheet
        isOpen={selectedApp !== null}
        onClose={() => setSelectedApp(null)}
        title={selectedApp?.applicantName ?? ""}
        subtitle={`${selectedApp?.applicationType === "rider" ? "Rider" : "Rental Provider"} Application`}
      >
        {selectedApp && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border/60">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={selectedApp.applicationType === "rider" ? Motorbike01Icon : Key01Icon} size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{selectedApp.applicantName}</span>
                  <ApplicationTypeTag type={selectedApp.applicationType} />
                </div>
                <span className="text-xs text-muted-foreground">{selectedApp.applicantEmail}</span>
              </div>
            </div>

            <StatusPill status={selectedApp.status} />

            {selectedApp.applicationType === "rider" ? (
              <RiderApplicationDetails app={selectedApp as RiderApplication} />
            ) : (
              <ProviderApplicationDetails app={selectedApp as ProviderApplication} />
            )}

            {selectedApp.adminRemarks && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Admin Remarks</span>
                <span className="text-xs text-foreground">{selectedApp.adminRemarks}</span>
              </div>
            )}

            {selectedApp.status === "pending" && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                <span className="text-xs font-bold text-foreground">Admin Actions</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                    onClick={() => setDialogState({ isOpen: true, action: "approve", app: selectedApp })}
                  >
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                    Approve Application
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10 font-semibold gap-1.5"
                    onClick={() => setDialogState({ isOpen: true, action: "reject", app: selectedApp })}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminDetailSheet>

      {/* Confirm Dialog */}
      <AdminConfirmDialog
        isOpen={dialogState.isOpen}
        onConfirm={handleAction}
        onCancel={() => setDialogState((s) => ({ ...s, isOpen: false }))}
        title={
          dialogState.action === "approve"
            ? `Approve ${dialogState.app?.applicantName}'s Application`
            : `Reject ${dialogState.app?.applicantName}'s Application`
        }
        description={
          dialogState.action === "approve"
            ? `This will grant ${dialogState.app?.applicantName} the ${dialogState.app?.applicationType === "rider" ? "Rider" : "Rental Provider"} role in HitsNaGo. They will gain access to the corresponding dashboard.`
            : `This will reject the application. The applicant will remain a Customer and may reapply after addressing feedback.`
        }
        confirmLabel={dialogState.action === "approve" ? "Yes, Approve" : "Yes, Reject"}
        variant={dialogState.action === "approve" ? "success" : "destructive"}
      />
    </div>
  )
}

// ─── Detail Sub-components ────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[11px] font-semibold text-foreground text-right">{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-2">{children}</h4>
}

function RiderApplicationDetails({ app }: { app: RiderApplication }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Personal</SectionTitle>
      <DetailRow label="Full Name" value={app.fullName} />
      <DetailRow label="Contact" value={app.contactNumber} />
      <DetailRow label="Address" value={`${app.address}, Brgy. ${app.barangay}, Butuan City`} />
      <DetailRow label="Emergency Contact" value={`${app.emergencyContactName} (${app.emergencyContactRelation})`} />

      <SectionTitle>Driver&apos;s License</SectionTitle>
      <DetailRow label="License No." value={app.licenseNumber} />
      <DetailRow label="Expiry" value={app.licenseExpiry} />
      <DetailRow label="Restriction Code" value={app.licenseRestrictionCode} />

      <SectionTitle>Vehicle</SectionTitle>
      <DetailRow label="Type" value={app.vehicleType} />
      <DetailRow label="Vehicle" value={`${app.vehicleMake} ${app.vehicleModel} (${app.vehicleYear})`} />
      <DetailRow label="Plate No." value={app.plateNumber} />
      <DetailRow label="OR No." value={app.orNumber} />
      <DetailRow label="CR No." value={app.crNumber} />

      <SectionTitle>Submitted</SectionTitle>
      <DetailRow label="Date" value={new Date(app.submittedAt).toLocaleString("en-PH")} />
    </div>
  )
}

function ProviderApplicationDetails({ app }: { app: ProviderApplication }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Business Info</SectionTitle>
      <DetailRow label="Applicant" value={app.applicantFullName} />
      <DetailRow label="Business Name" value={app.businessName} />
      <DetailRow label="Contact" value={app.contactNumber} />
      <DetailRow label="Address" value={`${app.address}, Brgy. ${app.barangay}, Butuan City`} />

      <SectionTitle>Service Details</SectionTitle>
      <DetailRow label="Category" value={app.serviceCategory.replace(/_/g, " ")} />
      <DetailRow label="Fleet Size" value={String(app.estimatedFleetSize)} />
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-muted-foreground">Description</span>
        <p className="text-[11px] text-foreground leading-relaxed">{app.serviceDescription}</p>
      </div>

      <SectionTitle>Submitted</SectionTitle>
      <DetailRow label="Date" value={new Date(app.submittedAt).toLocaleString("en-PH")} />
    </div>
  )
}
