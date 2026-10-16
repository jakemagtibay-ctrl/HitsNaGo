"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Navigation01Icon,
  DashboardSquare01Icon,
  Motorbike01Icon,
  Key01Icon,
  PackageIcon,
  ShieldCheckIcon,
  Calendar01Icon,
  Car01Icon,
  UserGroupIcon,
  Home01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/auth/roles"

import { getUserApplicationStatus } from "@/lib/actions/bookings"

interface DashboardSidebarProps {
  role: UserRole
  className?: string
  onNavigate?: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
}

interface NavSection {
  title?: string
  items: NavItem[]
}

export function DashboardSidebar({ role, className, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [appStatus, setAppStatus] = React.useState<{ hasAppliedRider: boolean; hasAppliedProvider: boolean }>({
    hasAppliedRider: true,
    hasAppliedProvider: true,
  })

  React.useEffect(() => {
    if (role === "customer") {
      getUserApplicationStatus()
        .then((res) => {
          setAppStatus({
            hasAppliedRider: res.hasAppliedRider,
            hasAppliedProvider: res.hasAppliedProvider,
          })
        })
        .catch(() => {})
    }
  }, [role])

  const getNavSections = (currentRole: UserRole): NavSection[] => {
    switch (currentRole) {
      case "admin":
        return [
          {
            items: [
              { label: "Dashboard", href: "/dashboard/admin", icon: DashboardSquare01Icon },
              { label: "Bookings", href: "/dashboard/admin/bookings", icon: Calendar01Icon },
              { label: "Riders", href: "/dashboard/admin/riders", icon: Motorbike01Icon },
              { label: "Rental Providers", href: "/dashboard/admin/providers", icon: Key01Icon },
              { label: "Customers", href: "/dashboard/admin/customers", icon: UserGroupIcon },
              { label: "Verification", href: "/dashboard/admin/verification", icon: ShieldCheckIcon },
              { label: "Rentals / Vehicles", href: "/dashboard/admin/vehicles", icon: Car01Icon },
            ],
          },
        ]
      case "rider":
        return [
          {
            items: [
              { label: "My Rides", href: "/dashboard/rider", icon: Motorbike01Icon },
              { label: "History", href: "/dashboard/rider/history", icon: Calendar01Icon },
            ],
          },
        ]
      case "provider":
        return [
          {
            items: [
              { label: "My Listings", href: "/dashboard/provider", icon: Key01Icon },
              { label: "Requests", href: "/dashboard/provider", icon: Calendar01Icon },
            ],
          },
        ]
      case "customer":
      default: {
        const partnerItems: NavItem[] = []
        if (!appStatus.hasAppliedRider) {
          partnerItems.push({ label: "Become a Rider", href: "/dashboard/customer/apply/rider", icon: Motorbike01Icon })
        }
        if (!appStatus.hasAppliedProvider) {
          partnerItems.push({ label: "Become a Provider", href: "/dashboard/customer/apply/provider", icon: Key01Icon })
        }

        const sections: NavSection[] = [
          {
            items: [
              { label: "Overview", href: "/dashboard/customer", icon: DashboardSquare01Icon },
              { label: "My Bookings", href: "/dashboard/customer/bookings", icon: Calendar01Icon },
            ],
          },
          {
            title: "Book Services",
            items: [
              { label: "Book a Ride", href: "/dashboard/customer/book/ride", icon: Motorbike01Icon },
              { label: "Rent a Vehicle", href: "/dashboard/customer/book/rental", icon: Key01Icon },
              { label: "Send Delivery", href: "/dashboard/customer/book/delivery", icon: PackageIcon },
            ],
          },
        ]

        if (partnerItems.length > 0) {
          sections.push({
            title: "Partner",
            items: partnerItems,
          })
        }

        return sections
      }
    }
  }

  const roleLabelMap: Record<UserRole, { title: string; tag: string }> = {
    customer: { title: "Customer Portal", tag: "Customer" },
    rider: { title: "Rider Console", tag: "Rider" },
    provider: { title: "Rental Manager", tag: "Provider" },
    admin: { title: "Operations Hub", tag: "Admin" },
  }

  const sections = getNavSections(role)

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col justify-between border-r border-border/80 bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Brand logo & header */}
      <div className="p-4 border-b border-sidebar-border/60 shrink-0">
        <div className="flex items-center gap-3 px-2 py-1">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <HugeiconsIcon icon={Navigation01Icon} size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold tracking-tight text-sidebar-foreground">
                HitsNaGo
              </span>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase -mt-0.5">
                {roleLabelMap[role].title}
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="flex flex-col gap-1">
            {sec.title && (
              <div className="px-2 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {sec.title}
              </div>
            )}
            <nav className="flex flex-col gap-1" aria-label="Sidebar Navigation">
              {sec.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard/admin" &&
                    item.href !== "/dashboard/customer" &&
                    item.href !== "/dashboard/rider" &&
                    item.href !== "/dashboard/provider" &&
                    pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <HugeiconsIcon icon={Icon} size={17} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}

        {/* Public platform link */}
        <div className="flex flex-col gap-1 pt-3 border-t border-sidebar-border/60">
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <HugeiconsIcon icon={Home01Icon} size={15} />
            <span>Main Website</span>
          </Link>
        </div>
      </div>

      {/* Bottom role indicator badge */}
      <div className="p-4 border-t border-sidebar-border/60 shrink-0">
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Active Role</span>
            <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-bold uppercase">
              {role}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
            Butuan City, Caraga Region Hub
          </p>
        </div>
      </div>
    </aside>
  )
}
