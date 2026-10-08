"use client"

/**
 * RoleSwitcher — DEVELOPER PREVIEW TOOL ONLY
 *
 * This component is ONLY rendered in development mode.
 * It is never shown to real users in production.
 * The demo cookie is removed from the role resolution stack (see lib/auth/roles.ts).
 * It now only serves as a visual indicator of the currently resolved role.
 *
 * Admin role is NEVER available as a selectable option — admin access
 * is exclusively resolved server-side via email whitelist.
 */

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  Motorbike01Icon,
  Key01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons"
import type { UserRole } from "@/lib/auth/roles"
import { cn } from "@/lib/utils"

interface RoleSwitcherProps {
  currentRole: UserRole
  className?: string
}

const ROLE_DISPLAY: Record<UserRole, { label: string; icon: typeof UserIcon; color: string }> = {
  customer: { label: "Customer", icon: UserIcon, color: "text-blue-500" },
  rider: { label: "Rider", icon: Motorbike01Icon, color: "text-emerald-500" },
  provider: { label: "Provider", icon: Key01Icon, color: "text-amber-500" },
  admin: { label: "Administrator", icon: ShieldCheckIcon, color: "text-rose-500" },
}

/**
 * Shows the current resolved role as a read-only badge.
 * The role is determined server-side and cannot be changed from this UI.
 */
export function RoleSwitcher({ currentRole, className }: RoleSwitcherProps) {
  const config = ROLE_DISPLAY[currentRole] ?? ROLE_DISPLAY.customer

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-2.5 py-1.5 text-xs font-medium text-foreground",
        className
      )}
      title={`Signed in as: ${config.label}`}
    >
      <div className={cn("flex size-5 items-center justify-center rounded-md bg-primary/10", config.color)}>
        <HugeiconsIcon icon={config.icon} size={13} />
      </div>
      <span className="font-semibold capitalize truncate max-w-[100px] sm:max-w-none">
        {config.label}
      </span>
    </div>
  )
}
