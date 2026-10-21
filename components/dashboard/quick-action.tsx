// Shortcut card component providing quick access to primary actions like booking a ride or renting a car
import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"

import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface QuickActionProps {
  title: string
  description: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  href: string
  badgeText?: string
  iconBgColor?: string
  className?: string
}

export function QuickAction({
  title,
  description,
  icon,
  href,
  badgeText,
  iconBgColor = "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  className,
}: QuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl transition-colors duration-200",
            iconBgColor
          )}
        >
          <HugeiconsIcon icon={icon} size={22} />
        </div>
        <div className="flex items-center gap-2">
          {badgeText && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {badgeText}
            </span>
          )}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
          />
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  )
}
