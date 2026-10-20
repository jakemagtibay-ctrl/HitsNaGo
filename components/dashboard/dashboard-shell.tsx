import * as React from "react"
import Link from "next/link"
import { DashboardSidebar } from "./dashboard-sidebar"
import { DashboardHeader } from "./dashboard-header"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import type { UserRole } from "@/lib/auth/roles"

interface DashboardShellProps {
  children: React.ReactNode
  role: UserRole
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  return (
    <NotificationProvider>
      <div className="flex min-h-svh w-full bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex shrink-0">
          <DashboardSidebar role={role} />
        </div>

      {/* Main View Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardHeader role={role} />

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-border/50 py-5 text-center text-xs text-muted-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>&copy; {new Date().getFullYear()} HitsNaGo Online Transport & Booking Hub.</span>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-foreground transition-colors">
                Public Site
              </Link>
              <span>•</span>
              <Link href="/#services" className="hover:text-foreground transition-colors">
                Services
              </Link>
              <span>•</span>
              <Link href="/#how-it-works" className="hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </NotificationProvider>
  )
}
