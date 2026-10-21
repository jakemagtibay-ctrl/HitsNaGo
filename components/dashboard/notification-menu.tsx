"use client"

// Dropdown menu showing recent alerts and system notifications with mark-as-read options
import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Notification01Icon,
  CheckmarkCircle01Icon,
  Car01Icon,
  ShieldCheckIcon,
  AlertCircleIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import type { Notification } from "@/types/notification"

interface NotificationMenuProps {
  role?: string
}

export function NotificationMenu({ role }: NotificationMenuProps = {}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const { notifications, counts, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications()
  const menuRef = React.useRef<HTMLDivElement>(null)

  const unreadCount = counts.notifications

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const getIconForType = (type: Notification["type"]) => {
    switch (type) {
      case "booking":
        return Car01Icon
      case "verification":
        return ShieldCheckIcon
      case "message":
        return Mail01Icon
      case "system":
        return CheckmarkCircle01Icon
      case "dispute":
      case "emergency":
        return AlertCircleIcon
      default:
        return AlertCircleIcon
    }
  }

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    } catch {
      return ""
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        aria-expanded={isOpen}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen && "bg-muted text-foreground ring-1 ring-ring"
        )}
      >
        <HugeiconsIcon icon={Notification01Icon} size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-xs animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-0 shadow-2xl z-50 text-card-foreground animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 p-4">
            <div className="flex items-center gap-2">
              <h4 className="font-heading text-sm font-semibold text-foreground">Notifications</h4>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {unreadCount > 99 ? "99+" : unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-xs font-medium text-primary hover:underline transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = getIconForType(notif.type)
                const timeText = formatRelativeTime(notif.createdAt)

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead) {
                        markNotificationAsRead(notif.id)
                      }
                    }}
                    className={cn(
                      "flex items-start gap-3 p-3.5 transition-colors hover:bg-muted/50 cursor-pointer",
                      !notif.isRead && "bg-primary/5"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                        notif.isRead
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      <HugeiconsIcon icon={Icon} size={15} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-heading text-xs font-semibold text-foreground truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeText}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                        {notif.message}
                      </p>

                      {notif.data?.actionUrl && (
                        <Link
                          href={notif.data.actionUrl}
                          onClick={() => {
                            if (!notif.isRead) markNotificationAsRead(notif.id)
                            setIsOpen(false)
                          }}
                          className="mt-1.5 inline-block text-[11px] font-semibold text-primary hover:underline"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>

                    {!notif.isRead && (
                      <span className="size-2 rounded-full bg-primary shrink-0 self-center" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer link to full notification center for admin */}
          <div className="p-2 border-t border-border/60 bg-muted/20 text-center">
            <Link
              href={role === "admin" ? "/dashboard/admin/notifications" : "/dashboard"}
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              {role === "admin" ? "View Full Operations Alert Feed →" : "Dashboard Overview →"}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
