"use client"

// Search and filter toolbar with category dropdowns, keyword search input, and reset controls
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { Search01Icon, FilterIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export interface FilterOption {
  id: string
  label: string
}

interface AdminFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string
  statusFilter?: string
  onStatusChange?: (status: string) => void
  statusOptions?: FilterOption[]
  categoryFilter?: string
  onCategoryChange?: (category: string) => void
  categoryOptions?: FilterOption[]
  totalResults: number
  onResetFilters?: () => void
  className?: string
}

export function AdminFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  statusFilter,
  onStatusChange,
  statusOptions,
  categoryFilter,
  onCategoryChange,
  categoryOptions,
  totalResults,
  onResetFilters,
  className,
}: AdminFilterBarProps) {
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      (statusFilter && statusFilter !== "all") ||
      (categoryFilter && categoryFilter !== "all")
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-3 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Category Filter Pills */}
        {categoryOptions && onCategoryChange && (
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {categoryOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onCategoryChange(opt.id)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                  categoryFilter === opt.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Second row: Status Filters and Result Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
        {statusOptions && onStatusChange && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
              <HugeiconsIcon icon={FilterIcon} size={12} />
              Status:
            </span>
            {statusOptions.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onStatusChange(st.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-all",
                  statusFilter === st.id
                    ? "bg-foreground text-background shadow-2xs"
                    : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{totalResults}</strong> records
          </span>

          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] font-medium text-destructive hover:underline"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={12} />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
