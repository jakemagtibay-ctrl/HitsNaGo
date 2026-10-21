"use client"

// Slide-over drawer component for inspecting detailed records of users, vehicles, or bookings
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface AdminDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footerActions?: React.ReactNode
  className?: string
}

export function AdminDetailSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footerActions,
  className,
}: AdminDetailSheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div
        className={cn(
          "relative flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-heading text-base font-bold text-foreground">
              {title}
            </h3>
            {subtitle && (
              <span className="text-xs text-muted-foreground font-mono">
                {subtitle}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close panel"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
          {children}
        </div>

        {/* Footer actions */}
        {footerActions && (
          <div className="border-t border-border p-4 bg-muted/20 flex flex-wrap items-center justify-end gap-2">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  )
}
