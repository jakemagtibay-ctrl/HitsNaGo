import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpRight01Icon, ArrowDownRight01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  trend?: {
    value: string
    isPositive?: boolean
    label?: string
  }
  iconClassName?: string
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  iconClassName,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden border-border bg-card transition-all hover:shadow-sm", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold tracking-tight text-foreground">{value}</span>
            </div>
          </div>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs",
              iconClassName
            )}
          >
            <HugeiconsIcon icon={icon} size={20} />
          </div>
        </div>

        {(subtitle || trend) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-md text-[11px]",
                  trend.isPositive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                <HugeiconsIcon
                  icon={trend.isPositive ? ArrowUpRight01Icon : ArrowDownRight01Icon}
                  size={12}
                />
                {trend.value}
              </span>
            )}
            {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
