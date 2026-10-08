import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Clock01Icon,
  AlertCircleIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export type AdminStatusType =
  | "active"
  | "suspended"
  | "pending"
  | "verified"
  | "unverified"
  | "rejected"
  | "confirmed"
  | "assigned"
  | "completed"
  | "cancelled"
  | "open"
  | "under_review"
  | "resolved"
  | "closed"
  | "approved"

interface AdminStatusBadgeProps {
  status: string
  className?: string
}

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  const normalized = status.toLowerCase()

  switch (normalized) {
    case "active":
    case "verified":
    case "approved":
    case "completed":
    case "resolved":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize",
            className
          )}
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} className="shrink-0" />
          <span>{status}</span>
        </span>
      )

    case "pending":
    case "under_review":
    case "open":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 capitalize",
            className
          )}
        >
          <HugeiconsIcon icon={Clock01Icon} size={12} className="shrink-0" />
          <span>{status.replace("_", " ")}</span>
        </span>
      )

    case "assigned":
    case "confirmed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary capitalize",
            className
          )}
        >
          <HugeiconsIcon icon={UserCheck01Icon} size={12} className="shrink-0" />
          <span>{status}</span>
        </span>
      )

    case "suspended":
    case "rejected":
    case "cancelled":
    case "closed":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive capitalize",
            className
          )}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={12} className="shrink-0" />
          <span>{status}</span>
        </span>
      )

    case "unverified":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground capitalize",
            className
          )}
        >
          <HugeiconsIcon icon={AlertCircleIcon} size={12} className="shrink-0" />
          <span>{status}</span>
        </span>
      )
  }
}
