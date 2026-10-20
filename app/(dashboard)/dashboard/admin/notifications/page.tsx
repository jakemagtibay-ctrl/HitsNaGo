"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Notification01Icon,
  ShieldCheckIcon,
  Calendar01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

export default function AdminNotificationsPage() {
  const { notifications, counts, isLoading, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications()
  const [filterType, setFilterType] = React.useState<string>("all")

  const unreadCount = counts.notifications

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins} mins ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours} hours ago`
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return ""
    }
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
            onClick={markAllNotificationsAsRead}
            className="text-xs font-semibold"
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </AdminPageHeader>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/80 pb-3 overflow-x-auto">
        {[
          { id: "all", label: "All Alerts" },
          { id: "verification", label: "Verifications" },
          { id: "booking", label: "Bookings" },
          { id: "message", label: "Messages" },
          { id: "dispute", label: "Disputes" },
          { id: "system", label: "System" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0",
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
        {isLoading && notifications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-xs text-muted-foreground">
            No notifications in this category right now.
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            let icon = Notification01Icon
            if (notif.type === "verification") icon = ShieldCheckIcon
            else if (notif.type === "dispute" || notif.type === "emergency") icon = AlertCircleIcon
            else if (notif.type === "booking") icon = Calendar01Icon
            else if (notif.type === "message") icon = Mail01Icon
            else if (notif.type === "system") icon = CheckmarkCircle01Icon

            const timeText = formatRelativeTime(notif.createdAt)

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

                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {timeText}
                        </span>

                        {notif.data?.actionUrl && (
                          <Link
                            href={notif.data.actionUrl}
                            onClick={() => {
                              if (!notif.isRead) markNotificationAsRead(notif.id)
                            }}
                            className="text-[11px] font-semibold text-primary hover:underline"
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="text-[11px] h-7 shrink-0 font-semibold"
                    >
                      Mark read
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
