// Top navigation bar for the dashboard with mobile navigation toggle, role switcher, and notification bell
import * as React from "react"
import { UserButton } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/layout/theme-toggle"

import { NotificationMenu } from "./notification-menu"
import { RoleSwitcher } from "./role-switcher"
import { DashboardMobileNav } from "./dashboard-mobile-nav"
import type { UserRole } from "@/lib/auth/roles"

interface DashboardHeaderProps {
  role: UserRole
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile Nav & Breadcrumb */}
      <div className="flex items-center gap-3">
        <DashboardMobileNav role={role} />

        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline font-semibold text-muted-foreground">HitsNaGo</span>
          <span className="hidden sm:inline text-muted-foreground">/</span>
          <span className="font-heading font-bold text-foreground capitalize">
            {role === "admin" ? "Operations" : `${role} Console`}
          </span>
        </div>
      </div>

      {/* Right: RoleSwitcher, Notifications, Theme, UserButton */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher Demo Helper */}
        <RoleSwitcher currentRole={role} />

        {/* Notifications */}
        <NotificationMenu role={role} />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User profile is pinned to bottom-left sidebar for admin */}
        {role !== "admin" && (
          <div className="flex items-center pl-1 sm:pl-2 border-l border-border/60">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "size-8 sm:size-9 border border-border ring-offset-background",
                  userButtonPopoverCard: "border border-border bg-card text-card-foreground shadow-xl rounded-2xl",
                  userButtonPopoverFooter: "border-t border-border",
                },
              }}
            />
          </div>
        )}
      </div>
    </header>
  )
}
