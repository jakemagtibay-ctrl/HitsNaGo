"use client"

// Confirmation modal dialog for sensitive administrative actions such as approving, suspending, or deleting
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { Cancel01Icon, AlertCircleIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AdminConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "destructive" | "primary" | "success"
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function AdminConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  variant = "primary",
  onConfirm,
  onCancel,
  isLoading = false,
}: AdminConfirmDialogProps) {
  if (!isOpen) return null

  const confirmColors = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  }

  const iconColors = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconColors[variant])}>
              {variant === "success" ? (
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} />
              ) : (
                <HugeiconsIcon icon={AlertCircleIcon} size={20} />
              )}
            </div>
            <div className="flex flex-col">
              <h3 className="font-heading text-base font-bold text-foreground">
                {title}
              </h3>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                Admin Authorization
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>

        <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
          <strong>Demo simulation:</strong> This will update the admin interface locally. No production backend database mutation occurs.
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            {cancelLabel}
          </Button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              confirmColors[variant]
            )}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
