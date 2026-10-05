import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PinLocation01Icon, ShieldCheckIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import { cn } from "@/lib/utils"

interface AdminPageHeaderProps {
  title: string
  description?: string
  badgeText?: string
  children?: React.ReactNode
  className?: string
}

export function AdminPageHeader({
  title,
  description,
  badgeText = "Admin Operations",
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold uppercase tracking-wider"
          >
            {badgeText}
          </Badge>
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <HugeiconsIcon icon={PinLocation01Icon} size={12} className="text-primary shrink-0" />
            <span>{ACTIVE_SERVICE_AREA.shortLabel} Only</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <HugeiconsIcon icon={ShieldCheckIcon} size={12} className="shrink-0" />
            <span>Active Operational Zone</span>
          </span>
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
