"use client"

// Sidebar navigation menu adapting links and notification badges to the user's active role (customer, rider, provider, admin)
import * as React from "react"
import Link from "next/link"
import Image from "next/image"

import { usePathname } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
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
  Logout01Icon,
  ReloadIcon,
  Mail01Icon,
  Notification01Icon,
  AlertCircleIcon,
  File01Icon,
  StarIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationBadge } from "@/components/dashboard/notification-badge"
import { useNotifications } from "@/hooks/use-notifications"
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
  badgeCount?: number
  badgeVariant?: "default" | "urgent" | "subtle"
}

interface NavSection {
  title?: string
  items: NavItem[]
}

export function DashboardSidebar({ role, className, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const { counts } = useNotifications()
  const [appStatus, setAppStatus] = React.useState<{ hasAppliedRider: boolean; hasAppliedProvider: boolean }>({
    hasAppliedRider: true,
    hasAppliedProvider: true,
  })

  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.firstName
      ? user.firstName.slice(0, 2).toUpperCase()
      : role === "admin"
      ? "AD"
      : "HN"

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      if (onNavigate) {
        onNavigate()
      }
      await signOut({ redirectUrl: "/" })
    } catch (err) {
      console.error("[DashboardSidebar] Sign out error:", err)
      setIsLoggingOut(false)
    }
  }

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
            title: "Operations",
            items: [

              {
                label: "Dashboard",
                href: "/dashboard/admin",
                icon: DashboardSquare01Icon,
                badgeCount: counts.totalActionable,
              },
              {
                label: "Messages / Inbox",
                href: "/dashboard/admin/inbox",
                icon: Mail01Icon,
                badgeCount: counts.messages,
              },
              {
                label: "Notifications",
                href: "/dashboard/admin/notifications",
                icon: Notification01Icon,
                badgeCount: counts.notifications,
              },
            ],
          },
          {
            title: "Services & Bookings",
            items: [
              {
                label: "Bookings",
                href: "/dashboard/admin/bookings",
                icon: Calendar01Icon,
                badgeCount: counts.bookings,
              },
              {
                label: "Rides",
                href: "/dashboard/admin/rides",
                icon: Motorbike01Icon,
                badgeCount: counts.rides,
              },
              {
                label: "Deliveries",
                href: "/dashboard/admin/deliveries",
                icon: PackageIcon,
                badgeCount: counts.deliveries,
              },
              {
                label: "Rentals",
                href: "/dashboard/admin/rentals",
                icon: Key01Icon,
                badgeCount: counts.rentals,
              },
              {
                label: "Vehicles",
                href: "/dashboard/admin/vehicles",
                icon: Car01Icon,
                badgeCount: counts.vehicles,
              },
            ],
          },
          {
            title: "Partners & Users",
            items: [
              {
                label: "Verification",
                href: "/dashboard/admin/verification",
                icon: ShieldCheckIcon,
                badgeCount: counts.verification,
                badgeVariant: "urgent",
              },
              {
                label: "Riders",
                href: "/dashboard/admin/riders",
                icon: Motorbike01Icon,
                badgeCount: counts.riders,
              },
              {
                label: "Rental Providers",
                href: "/dashboard/admin/providers",
                icon: Key01Icon,
                badgeCount: counts.providers,
              },
              {
                label: "Customers",
                href: "/dashboard/admin/customers",
                icon: UserGroupIcon,
                badgeCount: counts.customers,
              },
            ],
          },
          {
            title: "Safety & Compliance",
            items: [
              {
                label: "Disputes",
                href: "/dashboard/admin/disputes",
                icon: AlertCircleIcon,
                badgeCount: counts.disputes,
                badgeVariant: "urgent",
              },
              {
                label: "Reports",
                href: "/dashboard/admin/reports",
                icon: File01Icon,
                badgeCount: counts.reports,
              },
              {
                label: "Reviews",
                href: "/dashboard/admin/reviews",
                icon: StarIcon,
                badgeCount: counts.reviews,
              },
            ],
          },
          {
            title: "Settings & Logs",
            items: [
              {
                label: "Audit Logs",
                href: "/dashboard/admin/audit-logs",
                icon: File01Icon,
              },
              {
                label: "Settings",
                href: "/dashboard/admin/settings",
                icon: Settings01Icon,
              },
            ],
          },
        ]
      case "rider":
        return [
          {
            title: "Activity",
            items: [
              {
                label: "My Rides",
                href: "/dashboard/rider",
                icon: Motorbike01Icon,
                badgeCount: counts.rides,
              },
              {
                label: "Messages / Inbox",
                href: "/dashboard/rider/inbox",
                icon: Mail01Icon,
                badgeCount: counts.messages,
              },
              {
                label: "History & Bookings",
                href: "/dashboard/rider/history",
                icon: Calendar01Icon,
                badgeCount: counts.bookings,
              },
            ],
          },
        ]
      case "provider":
        return [
          {
            title: "Rental Business",
            items: [
              {
                label: "Rental Manager",
                href: "/dashboard/provider",
                icon: Key01Icon,
                badgeCount: counts.rentals,
              },
              {
                label: "Messages / Inbox",
                href: "/dashboard/provider/inbox",
                icon: Mail01Icon,
                badgeCount: counts.messages,
              },
            ],
          },
        ]
      case "customer":
      default: {
        const partnerItems: NavItem[] = [
          {
            label: appStatus.hasAppliedRider ? "Rider Application" : "Become a Rider",
            href: "/dashboard/customer/apply/rider",
            icon: Motorbike01Icon,
          },
          {
            label: appStatus.hasAppliedProvider ? "Provider Application" : "Become a Provider",
            href: "/dashboard/customer/apply/provider",
            icon: Key01Icon,
          },
        ]

        const sections: NavSection[] = [
          {
            title: "Activity",
            items: [
              {
                label: "Overview",
                href: "/dashboard/customer",
                icon: DashboardSquare01Icon,
              },
              {
                label: "Messages / Inbox",
                href: "/dashboard/customer/inbox",
                icon: Mail01Icon,
                badgeCount: counts.messages,
              },
              {
                label: "My Bookings",
                href: "/dashboard/customer/bookings",
                icon: Calendar01Icon,
                badgeCount: counts.bookings,
              },
            ],
          },
          {
            title: "Book Services",
            items: [
              {
                label: "Book a Ride",
                href: "/dashboard/customer/book/ride",
                icon: Motorbike01Icon,
                badgeCount: counts.rides,
              },
              {
                label: "Rent a Vehicle",
                href: "/dashboard/customer/book/rental",
                icon: Key01Icon,
                badgeCount: counts.rentals,
              },
              {
                label: "Send Delivery",
                href: "/dashboard/customer/book/delivery",
                icon: PackageIcon,
                badgeCount: counts.deliveries,
              },
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
    admin: { title: "Operations Hub", tag: "Administrator" },
  }

  const sections = getNavSections(role)
  const roleDisplay = roleLabelMap[role].tag

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
                      "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HugeiconsIcon icon={Icon} size={17} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <NotificationBadge
                        count={item.badgeCount}
                        variant={item.badgeVariant || (isActive ? "subtle" : "default")}
                        className={isActive ? "bg-primary-foreground text-primary font-bold" : undefined}
                      />
                    )}
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

      {/* Account panel pinned to sidebar bottom - displays user's actual name, role, and real Logout action */}
      <div className="p-3 border-t border-sidebar-border/60 shrink-0 bg-sidebar/95 backdrop-blur-xs">
        <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2.5 shadow-2xs">
          {/* Avatar / Initials */}
          <div className="relative shrink-0">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || "User profile"}
                width={36}
                height={36}
                unoptimized
                className="size-9 rounded-xl object-cover border border-border/80 shadow-2xs"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs border border-primary/20 shadow-2xs">
                {userInitials}
              </div>
            )}
          </div>

          {/* Name & Role */}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-sidebar-foreground truncate leading-tight">
              {user?.fullName || user?.firstName || (role === "admin" ? "Administrator" : "Active Account")}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                variant="outline"
                className="h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider border-primary/30 text-primary bg-primary/5"
              >
                {roleDisplay}
              </Badge>
              <span className="text-[10px] text-muted-foreground truncate hidden sm:inline">
                Butuan City
              </span>
            </div>
          </div>

          {/* Dedicated Real Logout Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="size-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
            title="Sign out of HitsNaGo"
            aria-label="Sign out of account"
          >
            {isLoggingOut ? (
              <HugeiconsIcon icon={ReloadIcon} size={15} className="animate-spin text-muted-foreground" />
            ) : (
              <HugeiconsIcon icon={Logout01Icon} size={16} />
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
