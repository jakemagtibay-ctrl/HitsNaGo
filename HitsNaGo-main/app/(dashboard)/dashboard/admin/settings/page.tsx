"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PinLocation01Icon,
  ShieldCheckIcon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = React.useState("HitsNaGo")
  const currency = "PHP (₱)"
  const [requireDriverLicense, setRequireDriverLicense] = React.useState(true)
  const [requireBusinessPermit, setRequireBusinessPermit] = React.useState(true)
  const [allowInstantBooking, setAllowInstantBooking] = React.useState(true)
  const [emailAlerts, setEmailAlerts] = React.useState(true)
  const [disputeEscalation, setDisputeEscalation] = React.useState(true)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  const handleSave = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Platform & System Settings"
        badgeText="Configuration"
        description="Global parameters, active municipal service boundary, verification constraints, and notification toggles."
      >
        <Button
          type="button"
          onClick={handleSave}
          className="text-xs font-semibold shadow-xs gap-1.5"
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
          <span>Save Changes</span>
        </Button>
      </AdminPageHeader>

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
          <span>Settings successfully updated in local administrative state.</span>
        </div>
      )}

      {/* 1. General & Service Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-5 flex flex-col gap-4">
            <h3 className="font-heading text-sm font-bold text-foreground pb-2 border-b border-border/60">
              General Platform Identity
            </h3>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-foreground">Platform Brand Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <label className="font-semibold text-foreground">Active Currency</label>
              <input
                type="text"
                value={currency}
                disabled
                className="h-10 rounded-xl border border-border bg-muted/40 px-3 text-xs text-muted-foreground font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                All customer, rider, and provider transactions are denominated in Philippine Peso (PHP).
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Service Area Restriction */}
        <Card className="border-primary/30 bg-primary/[0.02] shadow-xs">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="font-heading text-sm font-bold text-foreground">
                Active Operational Service Area
              </h3>
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase">
                Sole Active Territory
              </Badge>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3.5 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2 text-primary font-bold">
                <HugeiconsIcon icon={PinLocation01Icon} size={16} />
                <span>{ACTIVE_SERVICE_AREA.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Region: {ACTIVE_SERVICE_AREA.region} • Country: {ACTIVE_SERVICE_AREA.country} • Postal: {ACTIVE_SERVICE_AREA.postalCode}
              </p>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/60">
              <HugeiconsIcon icon={InformationCircleIcon} size={15} className="text-primary shrink-0 mt-0.5" />
              <span>
                HitsNaGo is currently restricted exclusively to Butuan City. All outside-city dispatch requests (Cebu, Manila, Davao, CDO) are rejected at the client geofence level.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Booking & Verification Policies */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardContent className="p-5 flex flex-col gap-4">
          <h3 className="font-heading text-sm font-bold text-foreground pb-2 border-b border-border/60">
            Booking & Verification Compliance Rules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                checked={requireDriverLicense}
                onChange={(e) => setRequireDriverLicense(e.target.checked)}
                className="mt-0.5 size-4 rounded text-primary focus:ring-primary"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  Mandatory Professional Driver&apos;s License
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Riders in Butuan City must hold valid LTO credentials before dispatch authorization.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                checked={requireBusinessPermit}
                onChange={(e) => setRequireBusinessPermit(e.target.checked)}
                className="mt-0.5 size-4 rounded text-primary focus:ring-primary"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  Mandatory Mayor&apos;s / DTI Business Permit
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Rental hosts must submit verified municipal registration in Butuan City.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                checked={allowInstantBooking}
                onChange={(e) => setAllowInstantBooking(e.target.checked)}
                className="mt-0.5 size-4 rounded text-primary focus:ring-primary"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  Instant Ride Dispatch
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Enable automatic nearest-rider broadcasting for habal-habal and tricycle rides.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="mt-0.5 size-4 rounded text-primary focus:ring-primary"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  Admin Dispatch Email Notifications
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Transmit high-priority safety escalations to platform administrator mailbox.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 cursor-pointer">
              <input
                type="checkbox"
                checked={disputeEscalation}
                onChange={(e) => setDisputeEscalation(e.target.checked)}
                className="mt-0.5 size-4 rounded text-primary focus:ring-primary"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  Dispute Auto-Escalation SLA
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Automatically escalate unresolved customer or provider disputes after 24 hours.
                </span>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 4. Security & Clerk Authentication Architecture */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardContent className="p-5 flex flex-col gap-3">
          <h3 className="font-heading text-sm font-bold text-foreground pb-2 border-b border-border/60">
            Administrative Role Guard & Security Architecture
          </h3>

          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 flex flex-col gap-2 text-xs">
            <span className="font-semibold text-foreground">
              Server-Side Role Guard Active
            </span>
            <p className="text-muted-foreground leading-relaxed">
              Administrative routes are guarded on the server via <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">requireRole(&quot;admin&quot;)</code> in server components and layout middleware. Client-side state, cookies, or localStorage are never trusted for authorization.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
              <HugeiconsIcon icon={ShieldCheckIcon} size={14} />
              <span>Clerk Authentication & Session Safeguards Active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
