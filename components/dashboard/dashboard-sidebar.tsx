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
  UserCheck01Icon,
  ShieldCheckIcon,
  Analytics01Icon,
  Home01Icon,
  HelpCircleIcon,
  Calendar01Icon,
  Car01Icon,
  UserGroupIcon,
  StarIcon,
  AlertCircleIcon,
  BellIcon,
  Audit01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/auth/roles"

interface DashboardSidebarProps {
  role: UserRole
  className?: string
  onNavigate?: () => void
}

interface NavSection {
  title: string
  items: {
    label: string
    href: string
    icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  }[]
}

export function DashboardSidebar({ role, className, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname()

  // Standard flat navigation for rider, provider, customer
  const getStandardNavLinks = (currentRole: UserRole) => {
    switch (currentRole) {
      case "rider":
        return [
          { label: "Rider Console", href: "/dashboard/rider", icon: DashboardSquare01Icon },
          { label: "Active Trips", href: "/dashboard/rider#active-trips", icon: Motorbike01Icon },
          { label: "New Requests", href: "/dashboard/rider#available-requests", icon: PackageIcon },
          { label: "My Earnings", href: "/dashboard/rider#earnings", icon: Analytics01Icon },
        ]
      case "provider":
        return [
          { label: "Provider Hub", href: "/dashboard/provider", icon: DashboardSquare01Icon },
          { label: "My Listings", href: "/dashboard/provider#listings", icon: Key01Icon },
          { label: "Rental Orders", href: "/dashboard/provider#requests", icon: Calendar01Icon },
          { label: "Revenue Analytics", href: "/dashboard/provider#analytics", icon: Analytics01Icon },
        ]
      case "customer":
      default:
        return [
          { label: "Overview", href: "/dashboard/customer", icon: DashboardSquare01Icon },
          { label: "My Bookings", href: "/dashboard/customer/bookings", icon: Calendar01Icon },
          { label: "Book a Ride", href: "/dashboard/customer/book/ride", icon: Motorbike01Icon },
          { label: "Rent a Service", href: "/dashboard/customer/book/rental", icon: Key01Icon },
          { label: "Send Delivery", href: "/dashboard/customer/book/delivery", icon: PackageIcon },
          { label: "Become a Rider", href: "/dashboard/customer/apply/rider", icon: Motorbike01Icon },
          { label: "Become a Provider", href: "/dashboard/customer/apply/provider", icon: Key01Icon },
        ]
    }
  }

  // Comprehensive organized sections for Super Admin
  const adminNavSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard/admin", icon: DashboardSquare01Icon },
      ],
    },
    {
      title: "Users",
      items: [
        { label: "All Users", href: "/dashboard/admin/users", icon: UserGroupIcon },
        { label: "Customers", href: "/dashboard/admin/users/customers", icon: UserCheck01Icon },
        { label: "Riders", href: "/dashboard/admin/users/riders", icon: Motorbike01Icon },
        { label: "Rental Providers", href: "/dashboard/admin/users/providers", icon: Key01Icon },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "All Bookings", href: "/dashboard/admin/bookings", icon: Calendar01Icon },
        { label: "Rides", href: "/dashboard/admin/rides", icon: Motorbike01Icon },
        { label: "Rentals", href: "/dashboard/admin/rentals", icon: Key01Icon },
        { label: "Deliveries", href: "/dashboard/admin/deliveries", icon: PackageIcon },
      ],
    },
    {
      title: "Verification",
      items: [
        { label: "Verification Requests", href: "/dashboard/admin/verification", icon: ShieldCheckIcon },
      ],
    },
    {
      title: "Services & Fleet",
      items: [
        { label: "Vehicles", href: "/dashboard/admin/vehicles", icon: Car01Icon },
        { label: "Rental Services", href: "/dashboard/admin/services", icon: Key01Icon },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Reviews", href: "/dashboard/admin/reviews", icon: StarIcon },
        { label: "Disputes", href: "/dashboard/admin/disputes", icon: AlertCircleIcon },
        { label: "Notifications", href: "/dashboard/admin/notifications", icon: BellIcon },
        { label: "Reports & Analytics", href: "/dashboard/admin/reports", icon: Analytics01Icon },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Settings", href: "/dashboard/admin/settings", icon: Settings02Icon },
        { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: Audit01Icon },
      ],
    },
  ]

  const roleLabelMap: Record<UserRole, { title: string; tag: string }> = {
    customer: { title: "Customer Portal", tag: "Customer" },
    rider: { title: "Rider Terminal", tag: "Rider" },
    provider: { title: "Rental Manager", tag: "Provider" },
    admin: { title: "Operations Hub", tag: "Super Admin" },
  }

  const standardNavLinks = getStandardNavLinks(role)

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

      {/* Scrollable Navigation Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {role === "admin" ? (
          /* Multi-section admin navigation */
          <div className="flex flex-col gap-5">
            {adminNavSections.map((sec) => (
              <div key={sec.title} className="flex flex-col gap-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                  {sec.title}
                </div>
                <nav className="flex flex-col gap-0.5" aria-label={`Admin ${sec.title}`}>
                  {sec.items.map((item) => {
                    const Icon = item.icon
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard/admin" && pathname.startsWith(item.href))

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <HugeiconsIcon icon={Icon} size={16} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>
        ) : (
          /* Standard role navigation */
          <div className="flex flex-col gap-1">
            <div className="px-2 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </div>
            <nav className="flex flex-col gap-1" aria-label="Dashboard Sidebar">
              {standardNavLinks.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <HugeiconsIcon icon={Icon} size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}

        {/* Public platform links */}
        <div className="flex flex-col gap-1 pt-2 border-t border-sidebar-border/60">
          <div className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Public Platform
          </div>
          <div className="flex flex-col gap-0.5">
            <Link
              href="/"
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <HugeiconsIcon icon={Home01Icon} size={15} />
              <span>Main Website</span>
            </Link>
            <Link
              href="/#how-it-works"
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <HugeiconsIcon icon={HelpCircleIcon} size={15} />
              <span>Safety & Help</span>
            </Link>
          </div>
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
