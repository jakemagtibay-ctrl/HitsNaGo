// KPI summary card showing numeric metrics, trends, and styled icons on admin dashboards
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Card, CardContent } from "@/components/ui/card"

import { cn } from "@/lib/utils"

export interface AdminStatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  trend?: {
    value: string
    isPositive?: boolean
  }
  variant?: "default" | "warning" | "success" | "primary"
  className?: string
}

export function AdminStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
}: AdminStatCardProps) {
  const variantStyles = {
    default: "border-border/80 bg-card hover:border-primary/40",
    primary: "border-primary/40 bg-primary/[0.03] hover:border-primary",
    warning: "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/60",
    success: "border-emerald-500/30 bg-emerald-500/[0.03] hover:border-emerald-500/60",
  }

  const iconBgStyles = {
    default: "bg-primary/10 text-primary",
    primary: "bg-primary text-primary-foreground shadow-xs",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  }

  return (
    <Card className={cn("overflow-hidden shadow-xs transition-all duration-200", variantStyles[variant], className)}>
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className={cn("flex size-9 items-center justify-center rounded-xl", iconBgStyles[variant])}>
            <HugeiconsIcon icon={icon} size={18} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </span>
          {subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>

        {trend && (
          <div className="mt-1 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
            <span
              className={cn(
                "font-semibold text-[11px]",
                trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              )}
            >
              {trend.value}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">
              vs previous period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
