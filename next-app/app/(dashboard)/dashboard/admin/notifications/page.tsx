"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BellIcon,
  ShieldCheckIcon,
  Calendar01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AdminNotificationItem {
  id: string
  title: string
  message: string
  type: "verification" | "booking" | "dispute" | "system"
  timestamp: string
  isRead: boolean
}

const INITIAL_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: "notif_01",
    title: "New Rider License Verification Uploaded",
    message: "Arnel Bautista submitted Professional Driver's License and Honda Beat OR/CR in Brgy. San Vicente.",
    type: "verification",
    timestamp: "10 mins ago",
    isRead: false,
  },
  {
    id: "notif_02",
    title: "Dispute Escalated: Trip #HNG-396274",
    message: "Carlos Mendoza flagged driver route deviation on trip originating from Bancasi Airport.",
    type: "dispute",
    timestamp: "45 mins ago",
    isRead: false,
  },
  {
    id: "notif_03",
    title: "High Demand Notice: Robinsons Place Butuan",
    message: "Unusual booking volume spike detected along J.C. Aquino Ave. 14 riders currently active in vicinity.",
    type: "booking",
    timestamp: "2 hours ago",
    isRead: false,
  },
  {
    id: "notif_04",
    title: "Business Permit Approved: Caraga Car & Van",
    message: "Mayor's permit BP-BUTUAN-2026-0819 authenticated with Butuan City Hall records.",
    type: "verification",
    timestamp: "Yesterday",
    isRead: true,
  },
  {
    id: "notif_05",
    title: "Weekly Security Health Check Completed",
    message: "Zero unauthorized geofence breaches detected outside Butuan City operational perimeter.",
    type: "system",
    timestamp: "2 days ago",
    isRead: true,
  },
]

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = React.useState<AdminNotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [filterType, setFilterType] = React.useState<string>("all")

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const filteredNotifications = React.useMemo(() => {
    if (filterType === "all") return notifications
    return notifications.filter((n) => n.type === filterType)
  }, [notifications, filterType])

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Administrative Notifications"
        badgeText="Alerts & Dispatch"
        description="Real-time operational alerts, partner verification notices, and safety escalations in Butuan City."
      >
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs font-semibold"
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </AdminPageHeader>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-3">
        {[
          { id: "all", label: "All Alerts" },
          { id: "verification", label: "Verifications" },
          { id: "booking", label: "Bookings" },
          { id: "dispute", label: "Disputes" },
          { id: "system", label: "System" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
              filterType === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="flex flex-col gap-3">
        {filteredNotifications.map((notif) => {
          const icon =
            notif.type === "verification"
              ? ShieldCheckIcon
              : notif.type === "dispute"
              ? AlertCircleIcon
              : notif.type === "booking"
              ? Calendar01Icon
              : BellIcon

          return (
            <Card
              key={notif.id}
              className={cn(
                "border-border/80 transition-all",
                notif.isRead ? "bg-card/60 opacity-80" : "bg-card border-primary/40 shadow-xs"
              )}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      notif.isRead
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/15 text-primary"
                    )}
                  >
                    <HugeiconsIcon icon={icon} size={20} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading text-sm font-bold text-foreground">
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.message}
                    </p>

                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {notif.timestamp}
                    </span>
                  </div>
                </div>

                {!notif.isRead && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => markAsRead(notif.id)}
                    className="text-[11px] h-7 shrink-0 font-semibold"
                  >
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
