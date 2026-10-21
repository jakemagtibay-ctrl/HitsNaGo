// Itemized fare and pricing breakdown component with base rates, distance fees, and total sum
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { InformationCircleIcon, Coins01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface PriceBreakdownItem {
  label: string
  amount: number
  isNegative?: boolean
  subtitle?: string
}

interface PriceSummaryProps {
  items: PriceBreakdownItem[]
  totalAmount: number
  totalLabel?: string
  currency?: string
  className?: string
  showDisclaimer?: boolean
}

export function PriceSummary({
  items,
  totalAmount,
  totalLabel = "Estimated Total",
  currency = "PHP",
  className,
  showDisclaimer = true,
}: PriceSummaryProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs",
        className
      )}
    >
      <div className="flex items-center gap-2 pb-3 border-b border-border/60">
        <HugeiconsIcon icon={Coins01Icon} size={16} className="text-primary" />
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
          Fare & Fee Breakdown
        </h3>
      </div>

      {/* Itemized list */}
      <div className="flex flex-col gap-2.5 py-3 text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-muted-foreground">{item.label}</span>
              {item.subtitle && (
                <span className="text-[10px] text-muted-foreground/70">
                  {item.subtitle}
                </span>
              )}
            </div>
            <span
              className={cn(
                "font-mono font-medium",
                item.isNegative ? "text-emerald-500" : "text-foreground"
              )}
            >
              {item.isNegative ? "-" : ""}₱{item.amount.toLocaleString("en-PH")}
            </span>
          </div>
        ))}
      </div>

      {/* Total row */}
      <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3">
        <div className="flex flex-col">
          <span className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
            {totalLabel}
          </span>
          <span className="text-[10px] text-muted-foreground">
            All prices in Philippine Peso ({currency})
          </span>
        </div>

        <div className="flex items-baseline gap-1 text-right">
          <span className="font-heading text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            ₱{totalAmount.toLocaleString("en-PH")}
          </span>
        </div>
      </div>

      {/* Disclaimer notice */}
      {showDisclaimer && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 p-2.5 text-[11px] text-muted-foreground border border-border/50">
          <HugeiconsIcon
            icon={InformationCircleIcon}
            size={14}
            className="shrink-0 text-primary mt-0.5"
          />
          <p className="leading-snug">
            <strong>Estimated demo fare:</strong> This price is a simulated estimate for trips within Butuan City. No actual payment or credit card charge will take place.
          </p>
        </div>
      )}
    </div>
  )
}
