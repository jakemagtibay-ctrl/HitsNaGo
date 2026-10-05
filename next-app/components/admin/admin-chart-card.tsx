import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BarChartItem {
  label: string
  value: number
  secondaryValue?: string
}

interface AdminChartCardProps {
  title: string
  subtitle?: string
  type: "bar" | "distribution" | "timeline"
  data: BarChartItem[]
  unit?: string
  totalDisplay?: string
  className?: string
}

export function AdminChartCard({
  title,
  subtitle,
  type,
  data,
  unit = "₱",
  totalDisplay,
  className,
}: AdminChartCardProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <Card className={cn("border-border/80 bg-card shadow-xs overflow-hidden", className)}>
      <CardContent className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div>
            <h3 className="font-heading text-sm font-bold text-foreground">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {totalDisplay && (
            <div className="text-left sm:text-right">
              <span className="font-heading text-lg font-bold text-foreground">
                {totalDisplay}
              </span>
              <span className="text-[10px] text-muted-foreground block uppercase">
                Active Period Total
              </span>
            </div>
          )}
        </div>

        {/* Bar chart mode */}
        {type === "bar" && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-end justify-between gap-2 sm:gap-4 h-36 pt-4 px-1">
              {data.map((item, idx) => {
                const heightPercent = Math.max(Math.round((item.value / maxValue) * 100), 8)
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {unit === "₱" ? `₱${item.value.toLocaleString()}` : item.value}
                    </span>
                    <div
                      className="w-full max-w-[28px] rounded-t-lg bg-primary/20 group-hover:bg-primary transition-all duration-300 relative overflow-hidden"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/60 opacity-80" />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground truncate w-full text-center">
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Distribution / Progress Mode */}
        {type === "distribution" && (
          <div className="flex flex-col gap-3 pt-1">
            {data.map((item, idx) => {
              const percent = Math.round((item.value / maxValue) * 100)
              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">
                        {item.secondaryValue || (unit === "₱" ? `₱${item.value.toLocaleString()}` : `${item.value} units`)}
                      </span>
                      <span className="text-[10px] font-bold text-primary font-mono w-9 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
