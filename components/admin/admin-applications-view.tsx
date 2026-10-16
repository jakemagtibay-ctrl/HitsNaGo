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
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { PendingApplication } from "@/lib/actions/bookings"
import {
  getPendingApplications,
  approveApplication,
  rejectApplication,
} from "@/lib/actions/bookings"

interface AdminApplicationsViewProps {
  initialApplications: PendingApplication[]
}

export function AdminApplicationsView({ initialApplications }: AdminApplicationsViewProps) {
  const [applications, setApplications] = React.useState<PendingApplication[]>(initialApplications)
  const [processingId, setProcessingId] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const data = await getPendingApplications()
      setApplications(data)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleApprove = async (app: PendingApplication) => {
    setProcessingId(app.id)
    setFeedback(null)

    const { error } = await approveApplication(app.type, app.id)
    if (error) {
      setFeedback(`Error: ${error}`)
      setProcessingId(null)
      return
    }

    setApplications((prev) => prev.filter((a) => a.id !== app.id))
    setFeedback(`Approved ${app.name} as verified ${app.type}. They can now access the ${app.type} portal.`)
    setProcessingId(null)
  }

  const handleReject = async (app: PendingApplication) => {
    setProcessingId(app.id)
    setFeedback(null)

    const { error } = await rejectApplication(app.type, app.id)
    if (error) {
      setFeedback(`Error: ${error}`)
      setProcessingId(null)
      return
    }

    setApplications((prev) => prev.filter((a) => a.id !== app.id))
    setFeedback(`Rejected application from ${app.name}.`)
    setProcessingId(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between -mb-1">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-sm font-bold text-foreground">
            Pending Role Applications ({applications.length})
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 gap-1.5 text-xs"
        >
          <HugeiconsIcon icon={RefreshIcon} size={13} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </Button>
      </div>

      {feedback && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {applications.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
              <HugeiconsIcon icon={ShieldCheckIcon} size={24} />
            </div>
            <h4 className="font-heading text-sm font-bold text-foreground">No Pending Applications</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              All rider and rental provider onboarding requests have been reviewed and processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applications.map((app) => {
            const isProcessing = processingId === app.id

            return (
              <Card
                key={app.id}
                className="border-border/80 bg-card shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={
                        app.type === "rider"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1 text-[11px]"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 gap-1 text-[11px]"
                      }
                    >
                      <HugeiconsIcon icon={app.type === "rider" ? Motorbike01Icon : Key01Icon} size={12} />
                      <span className="capitalize">{app.type} Application</span>
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString("en-PH", { dateStyle: "short", timeZone: "Asia/Manila" })}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-heading text-sm font-bold text-foreground">{app.name}</h4>
                    <span className="text-xs text-muted-foreground block">{app.email}</span>
                    {app.phone && (
                      <span className="text-[11px] text-muted-foreground block font-mono">{app.phone}</span>
                    )}
                  </div>

                  <div className="rounded-xl bg-muted/40 p-2.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground block">
                      {app.type === "rider" ? "Vehicle & Plate:" : "Business Name:"}
                    </span>
                    <span>{app.detail}</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 border-t border-border/60 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={() => handleApprove(app)}
                    disabled={isProcessing}
                  >
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                    {isProcessing ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs gap-1 text-destructive hover:bg-destructive/10 font-semibold"
                    onClick={() => handleReject(app)}
                    disabled={isProcessing}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    Reject
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
