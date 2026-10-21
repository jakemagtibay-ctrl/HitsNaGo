// Informs users that services are exclusively operated within Butuan City, Agusan del Norte
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  PinLocation01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import { cn } from "@/lib/utils"

interface ServiceAreaNoticeProps {
  variant?: "banner" | "compact" | "badge"
  className?: string
}

export function ServiceAreaNotice({
  variant = "banner",
  className,
}: ServiceAreaNoticeProps) {
  if (variant === "badge") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary",
          className
        )}
      >
        <HugeiconsIcon icon={PinLocation01Icon} size={12} className="text-primary shrink-0" />
        <span>Available in Butuan City</span>
      </span>
    )
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
          className
        )}
      >
        <HugeiconsIcon icon={PinLocation01Icon} size={15} className="text-primary shrink-0" />
        <span className="font-medium text-foreground">Active Service Area:</span>
        <span>{ACTIVE_SERVICE_AREA.label}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <HugeiconsIcon icon={PinLocation01Icon} size={16} />
        </div>
        <div className="flex flex-col">
          <span className="font-heading font-semibold text-foreground">
            Current Service Area: {ACTIVE_SERVICE_AREA.label}
          </span>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">
            HitsNaGo is currently operating exclusively within Butuan City, Agusan del Norte. Pickup, destination, and drop-off points must be within city boundaries.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center font-medium text-[11px] text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
        <HugeiconsIcon icon={ShieldCheckIcon} size={13} />
        <span>Local Verified Network</span>
      </div>
    </div>
  )
}
