"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { DashboardSidebar } from "./dashboard-sidebar"
import type { UserRole } from "@/lib/auth/roles"

interface DashboardMobileNavProps {
  role: UserRole
}

export function DashboardMobileNav({ role }: DashboardMobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Prevent body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open dashboard navigation"
      >
        <HugeiconsIcon icon={Menu01Icon} size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col bg-background shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close navigation"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <div className="h-full overflow-y-auto">
              <DashboardSidebar
                role={role}
                onNavigate={() => setIsOpen(false)}
                className="w-full border-r-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
