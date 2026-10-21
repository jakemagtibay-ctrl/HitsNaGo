"use client"

// Numeric notification badge pill displayed on navigation links and icons
import * as React from "react"
import { cn } from "@/lib/utils"


interface NotificationBadgeProps {
  count?: number
  className?: string
  variant?: "default" | "urgent" | "subtle"
  ariaLabel?: string
}

export function NotificationBadge({
  count = 0,
  className,
  variant = "default",
  ariaLabel,
}: NotificationBadgeProps) {
  if (!count || count <= 0) return null

  const displayCount = count > 99 ? "99+" : `${count}`
  const label = ariaLabel || `${count} new item${count > 1 ? "s" : ""}`

  const variantClasses = {
    default: "bg-primary text-primary-foreground font-bold shadow-xs",
    urgent: "bg-destructive text-destructive-foreground font-bold shadow-xs animate-pulse",
    subtle: "bg-muted text-muted-foreground font-semibold",
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-1.5 py-0.2 min-w-4.5 h-4.5 text-[10px] leading-none transition-all duration-200 select-none",
        variantClasses[variant],
        className
      )}
    >
      {displayCount}
    </span>
  )
}
