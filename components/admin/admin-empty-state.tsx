// Empty state placeholder displayed when no records, bookings, or search results are found
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AdminEmptyStateProps {
  title: string
  description: string
  icon?: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function AdminEmptyState({
  title,
  description,
  icon = AlertCircleIcon,
  actionLabel,
  onAction,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
        <HugeiconsIcon icon={icon} size={24} />
      </div>

      <div className="flex flex-col gap-1 max-w-sm">
        <h4 className="font-heading text-sm sm:text-base font-bold text-foreground">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAction}
            className="text-xs font-semibold"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
