import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface SectionHeaderProps {
  title: string
  description?: string
  badge?: React.ReactNode
  action?: {
    label: string
    href?: string
    icon?: React.ComponentProps<typeof HugeiconsIcon>["icon"]
    onClick?: () => void
  }
  className?: string
}

export function SectionHeader({
  title,
  description,
  badge,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">{title}</h2>
          {badge}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>

      {action && (
        <div className="mt-2 sm:mt-0">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>{action.label}</span>
              <HugeiconsIcon icon={action.icon || ArrowRight01Icon} size={14} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>{action.label}</span>
              <HugeiconsIcon icon={action.icon || ArrowRight01Icon} size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
