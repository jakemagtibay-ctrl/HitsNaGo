"use client"

// Global React context provider managing unread counts, system notifications, and real-time alerts
import * as React from "react"
import { useAuth } from "@clerk/nextjs"

import { createBrowserClient } from "@/lib/supabase"
import {
  getNotificationBadgeCounts,
  getUnifiedNotifications,
  markNotificationAsRead as serverMarkNotificationAsRead,
  markAllNotificationsAsRead as serverMarkAllNotificationsAsRead,
} from "@/lib/actions/notifications"
import {
  markConversationAsRead as serverMarkConversationAsRead,
} from "@/lib/actions/messages"
import type { Notification, NotificationBadgeCounts } from "@/types/notification"

interface NotificationContextType {
  counts: NotificationBadgeCounts
  notifications: Notification[]
  isLoading: boolean
  refresh: () => Promise<void>
  markNotificationAsRead: (id: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  markConversationAsRead: (conversationId: string) => Promise<void>
}

const initialCounts: NotificationBadgeCounts = {
  messages: 0,
  notifications: 0,
  bookings: 0,
  rides: 0,
  deliveries: 0,
  rentals: 0,
  riders: 0,
  providers: 0,
  customers: 0,
  verification: 0,
  disputes: 0,
  reports: 0,
  reviews: 0,
  vehicles: 0,
  totalActionable: 0,
}

const NotificationContext = React.createContext<NotificationContextType>({
  counts: initialCounts,
  notifications: [],
  isLoading: true,
  refresh: async () => {},
  markNotificationAsRead: async () => {},
  markAllNotificationsAsRead: async () => {},
  markConversationAsRead: async () => {},
})

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth()
  const [counts, setCounts] = React.useState<NotificationBadgeCounts>(initialCounts)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const isFetchingRef = React.useRef(false)

  const fetchData = React.useCallback(async () => {
    if (!userId) return
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      const [fetchedCounts, fetchedNotifs] = await Promise.all([
        getNotificationBadgeCounts(),
        getUnifiedNotifications(),
      ])
      setCounts(fetchedCounts)
      setNotifications(fetchedNotifs)
    } catch (err) {
      console.error("[NotificationProvider] Error fetching notifications:", err)
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [userId])

  // Initial fetch and focus refetch
  React.useEffect(() => {
    if (!isLoaded || !userId) {
      return
    }

    const timer = setTimeout(() => {
      void fetchData()
    }, 0)

    const onFocus = () => {
      void fetchData()
    }
    window.addEventListener("focus", onFocus)

    // Polling fallback every 20 seconds
    const interval = setInterval(fetchData, 20000)

    // Supabase Realtime subscription
    let channel: ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null = null
    try {
      const supabase = createBrowserClient()
      channel = supabase
        .channel(`realtime:hitsnago:${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
          fetchData()
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
          fetchData()
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "conversation_participants" }, () => {
          fetchData()
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
          fetchData()
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "booking_incidents" }, () => {
          fetchData()
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
          fetchData()
        })
        .subscribe()
    } catch (e) {
      console.warn("[NotificationProvider] Realtime subscription fallback to polling:", e)
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener("focus", onFocus)
      clearInterval(interval)
      if (channel) {
        try {
          const supabase = createBrowserClient()
          supabase.removeChannel(channel)
        } catch {}
      }
    }
  }, [isLoaded, userId, fetchData])

  const handleMarkNotificationAsRead = React.useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setCounts((prev) => ({
      ...prev,
      notifications: Math.max(0, prev.notifications - 1),
      totalActionable: Math.max(0, prev.totalActionable - 1),
    }))

    try {
      await serverMarkNotificationAsRead(id)
    } catch (err) {
      console.error("[NotificationProvider] Failed to mark notification as read:", err)
      fetchData()
    }
  }, [fetchData])

  const handleMarkAllNotificationsAsRead = React.useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setCounts((prev) => ({
      ...prev,
      notifications: 0,
      totalActionable: Math.max(0, prev.totalActionable - prev.notifications),
    }))

    try {
      await serverMarkAllNotificationsAsRead()
    } catch (err) {
      console.error("[NotificationProvider] Failed to mark all notifications as read:", err)
      fetchData()
    }
  }, [fetchData])

  const handleMarkConversationAsRead = React.useCallback(async (conversationId: string) => {
    try {
      const res = await serverMarkConversationAsRead(conversationId)
      if (res.success) {
        fetchData()
      }
    } catch (err) {
      console.error("[NotificationProvider] Failed to mark conversation as read:", err)
    }
  }, [fetchData])

  return (
    <NotificationContext.Provider
      value={{
        counts,
        notifications,
        isLoading,
        refresh: fetchData,
        markNotificationAsRead: handleMarkNotificationAsRead,
        markAllNotificationsAsRead: handleMarkAllNotificationsAsRead,
        markConversationAsRead: handleMarkConversationAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
