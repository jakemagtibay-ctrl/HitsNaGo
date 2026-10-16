"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { VerificationStatusBadge } from "./status-badge"
import { cn } from "@/lib/utils"
import type { VerificationRequest } from "@/types/verification"

interface AdminVerificationQueueProps {
  initialRequests: VerificationRequest[]
}

export function AdminVerificationQueue({ initialRequests }: AdminVerificationQueueProps) {
  const [requests, setRequests] = React.useState<VerificationRequest[]>(initialRequests)
  const [notice, setNotice] = React.useState<string | null>(null)

  const handleDecision = (id: string, decision: "verified" | "rejected") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: decision } : r))
    )
    setNotice(`Application #${id.slice(-6).toUpperCase()} marked as ${decision}. Notification sent to applicant.`)
    setTimeout(() => setNotice(null), 5000)
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-700 dark:text-emerald-300">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map((req) => {
          const isPending = req.status === "pending"

          return (
            <Card key={req.id} className="border-border bg-card">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-xs font-bold text-foreground capitalize">
                        {req.userRole} Verification
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        #{req.id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <VerificationStatusBadge status={req.status} />
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>User Reference:</span>
                      <span className="font-mono text-foreground">{req.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Submitted:</span>
                      <span className="text-foreground">
                        {new Date(req.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Documents list */}
                  <div className="border-t border-border/60 pt-2.5">
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">
                      Uploaded Credentials ({req.documents.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {req.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2 py-1 text-[11px]"
                        >
                          <HugeiconsIcon icon={File01Icon} size={12} className="text-primary" />
                          <span className="capitalize">{doc.documentType.replace("_", " ")}</span>
                          {doc.documentNumber && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              ({doc.documentNumber})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {req.adminNotes && (
                    <div className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      <strong>Admin note:</strong> {req.adminNotes}
                    </div>
                  )}

                  {req.rejectionReason && (
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-[11px] text-rose-700 dark:text-rose-300">
                      <strong>Reason for refusal:</strong> {req.rejectionReason}
                    </div>
                  )}
                </div>

                {isPending && (
                  <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                    <button
                      type="button"
                      onClick={() => handleDecision(req.id, "rejected")}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "text-xs gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-700"
                      )}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={13} />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecision(req.id, "verified")}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "text-xs font-semibold gap-1 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      )}
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} />
                      <span>Approve & Verify</span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
