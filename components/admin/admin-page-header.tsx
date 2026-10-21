// Standard page title header with descriptive subtitles and action buttons for admin sections
import * as React from "react"
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
  children,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-col gap-1">
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
