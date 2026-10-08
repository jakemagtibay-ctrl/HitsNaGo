import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onActionClick?: () => void
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center sm:p-12",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-xs">
        <HugeiconsIcon icon={icon} size={28} />
      </div>
      <h3 className="mt-4 font-heading text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className={cn(buttonVariants({ size: "sm" }), "shadow-xs font-semibold")}
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className={cn(buttonVariants({ size: "sm" }), "shadow-xs font-semibold")}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
