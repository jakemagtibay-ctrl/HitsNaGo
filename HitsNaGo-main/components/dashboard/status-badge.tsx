import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  CheckmarkBadge01Icon,
  UserCheck01Icon,
  PlayIcon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  UnavailableIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BookingStatus } from "@/types/booking"
import type { VerificationStatus } from "@/types/verification"

interface BookingStatusBadgeProps {
  status: BookingStatus
  className?: string
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className={cn("gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium text-xs", className)}
        >
          <HugeiconsIcon icon={Clock01Icon} size={12} />
          <span>Pending</span>
        </Badge>
      )
    case "confirmed":
      return (
        <Badge
          variant="outline"
          className={cn("gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs", className)}
        >
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} />
          <span>Confirmed</span>
        </Badge>
      )
    case "assigned":
      return (
        <Badge
          variant="outline"
          className={cn("gap-1 border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium text-xs", className)}
        >
          <HugeiconsIcon icon={UserCheck01Icon} size={12} />
          <span>Assigned</span>
        </Badge>
      )
    case "accepted":
      return (
        <Badge
          variant="outline"
          className={cn("gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs", className)}
        >
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} />
          <span>Accepted</span>
        </Badge>
      )
    case "in_progress":
    case "active":
      return (
        <Badge
          className={cn("gap-1 bg-emerald-600 text-white dark:bg-emerald-600 font-medium text-xs shadow-xs", className)}
        >
          <HugeiconsIcon icon={PlayIcon} size={12} />
          <span>In Progress</span>
        </Badge>
      )
    case "completed":
      return (
        <Badge
          variant="secondary"
          className={cn("gap-1 font-medium text-xs text-muted-foreground", className)}
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
          <span>Completed</span>
        </Badge>
      )
    case "cancelled":
      return (
        <Badge
          variant="destructive"
          className={cn("gap-1 font-medium text-xs bg-destructive/15 text-destructive border border-destructive/20", className)}
        >
          <HugeiconsIcon icon={CancelCircleIcon} size={12} />
          <span>Cancelled</span>
        </Badge>
      )
    case "rejected":
      return (
        <Badge
          variant="destructive"
          className={cn("gap-1 font-medium text-xs bg-destructive/15 text-destructive border border-destructive/20", className)}
        >
          <HugeiconsIcon icon={UnavailableIcon} size={12} />
          <span>Declined</span>
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={cn("text-xs", className)}>
          {status}
        </Badge>
      )
  }
}

interface VerificationStatusBadgeProps {
  status: VerificationStatus
  className?: string
}

export function VerificationStatusBadge({ status, className }: VerificationStatusBadgeProps) {
  switch (status) {
    case "verified":
      return (
        <Badge
          className={cn(
            "gap-1 bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold shadow-xs",
            className
          )}
        >
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} />
          <span>Verified Account</span>
        </Badge>
      )
    case "pending":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold",
            className
          )}
        >
          <HugeiconsIcon icon={Clock01Icon} size={13} />
          <span>In Review</span>
        </Badge>
      )
    case "rejected":
      return (
        <Badge
          variant="destructive"
          className={cn("gap-1 bg-destructive/15 text-destructive border border-destructive/30 text-xs font-semibold", className)}
        >
          <HugeiconsIcon icon={CancelCircleIcon} size={13} />
          <span>Action Required</span>
        </Badge>
      )
    case "unverified":
    default:
      return (
        <Badge
          variant="outline"
          className={cn("gap-1 border-border text-muted-foreground text-xs font-medium", className)}
        >
          <HugeiconsIcon icon={AlertCircleIcon} size={13} />
          <span>Basic / Unverified</span>
        </Badge>
      )
  }
}
