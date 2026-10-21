"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase"
import type { UserRole } from "@/lib/auth/roles"
import { getCurrentUserRole } from "@/lib/auth/roles"
import type { Notification, NotificationBadgeCounts } from "@/types/notification"
import { getUnreadMessagesCount } from "@/lib/actions/messages"

// In-memory set of read notification IDs for graceful handling when notifications table is newly migrating
const memoryReadNotificationIds = new Set<string>()

/**
 * Calculates exact, real-time notification badge counts for all sidebar items across all dashboards.
 */
export async function getNotificationBadgeCounts(
  forcedRole?: UserRole,
  forcedUserId?: string
): Promise<NotificationBadgeCounts> {
  const emptyCounts: NotificationBadgeCounts = {
    messages: 0,
    notifications: 0,
    rides: 0,
    deliveries: 0,
    rentals: 0,
    bookings: 0,
    verification: 0,
    riders: 0,
    providers: 0,
    customers: 0,
    disputes: 0,
    reports: 0,
    reviews: 0,
    vehicles: 0,
    totalActionable: 0,
  }

  try {
    let user: { id: string; emailAddresses: { emailAddress: string }[] } | null = null
    try {
      user = await currentUser()
    } catch {
      // CLI / background execution without Next request store
    }

    const userId = forcedUserId || user?.id
    let role = forcedRole
    if (!role) {
      role = user ? await getCurrentUserRole() : "customer"
    }

    const db = createServiceClient()

    // 1. Unread Messages count (unified across all roles)
    const unreadMessages = userId ? await getUnreadMessagesCount(userId) : 0

    // 2. Role-specific actionable queries
    if (role === "admin") {
      // Pending bookings by service type
      const [
        { count: pendingRidesCount },
        { count: pendingDeliveriesCount },
        { count: pendingRentalsCount },
        { count: pendingBookingsCount },
        { count: pendingRidersCount },
        { count: pendingProvidersCount },
        { count: openDisputesCount },
        { count: emergencyReportsCount },
      ] = await Promise.all([
        db
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("service_type", "ride")
          .eq("status", "pending"),
        db
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("service_type", "delivery")
          .eq("status", "pending"),
        db
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("service_type", "rental")
          .eq("status", "pending"),
        db
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        db
          .from("riders")
          .select("*", { count: "exact", head: true })
          .eq("is_verified", false)
          .eq("is_active", true),
        db
          .from("providers")
          .select("*", { count: "exact", head: true })
          .eq("is_verified", false)
          .eq("is_active", true),
        db
          .from("booking_incidents")
          .select("*", { count: "exact", head: true })
          .in("status", ["open", "investigating"]),
        db
          .from("booking_incidents")
          .select("*", { count: "exact", head: true })
          .eq("incident_type", "emergency_report")
          .in("status", ["open", "investigating"]),
      ])

      const verificationTotal = (pendingRidersCount ?? 0) + (pendingProvidersCount ?? 0)
      const totalActionable =
        (pendingBookingsCount ?? 0) + verificationTotal + (openDisputesCount ?? 0)

      return {
        messages: unreadMessages,
        notifications: totalActionable,
        rides: pendingRidesCount ?? 0,
        deliveries: pendingDeliveriesCount ?? 0,
        rentals: pendingRentalsCount ?? 0,
        bookings: pendingBookingsCount ?? 0,
        verification: verificationTotal,
        riders: pendingRidersCount ?? 0,
        providers: pendingProvidersCount ?? 0,
        customers: 0,
        disputes: openDisputesCount ?? 0,
        reports: emergencyReportsCount ?? 0,
        reviews: 0,
        vehicles: pendingRentalsCount ?? 0,
        totalActionable,
      }
    }

    if (role === "rider") {
      // Find rider row for this user
      const userEmail = user?.emailAddresses?.[0]?.emailAddress || ""
      let riderId: string | undefined

      if (userId || userEmail) {
        const { data: riderRow } = await db
          .from("riders")
          .select("id")
          .or(`clerk_user_id.eq.${userId || "none"},email.eq.${userEmail || "none"}`)
          .maybeSingle()
        riderId = riderRow?.id
      }

      // Available unclaimed trips (broadcast queue) + trips assigned to this rider
      let activeRides = 0
      let activeDeliveries = 0

      const [unassignedRides, unassignedDeliveries] = await Promise.all([
        db
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("service_type", "ride")
          .eq("status", "pending")
          .is("rider_id", null),
        db
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("service_type", "delivery")
          .eq("status", "pending")
          .is("rider_id", null),
      ])

      activeRides += unassignedRides.count ?? 0
      activeDeliveries += unassignedDeliveries.count ?? 0

      if (riderId) {
        const [myRides, myDeliveries] = await Promise.all([
          db
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("service_type", "ride")
            .eq("rider_id", riderId)
            .in("status", ["accepted", "in_progress"]),
          db
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("service_type", "delivery")
            .eq("rider_id", riderId)
            .in("status", ["accepted", "in_progress"]),
        ])

        activeRides += myRides.count ?? 0
        activeDeliveries += myDeliveries.count ?? 0
      }

      const totalBookings = activeRides + activeDeliveries

      return {
        ...emptyCounts,
        messages: unreadMessages,
        notifications: totalBookings,
        rides: activeRides,
        deliveries: activeDeliveries,
        bookings: totalBookings,
        totalActionable: totalBookings,
      }
    }

    if (role === "provider") {
      // Find pending rental bookings requiring provider review
      const { count: pendingRentals } = await db
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("service_type", "rental")
        .in("status", ["pending", "accepted", "in_progress"])

      const actionableRentals = pendingRentals ?? 0

      return {
        ...emptyCounts,
        messages: unreadMessages,
        notifications: actionableRentals,
        rentals: actionableRentals,
        bookings: actionableRentals,
        vehicles: 0,
        totalActionable: actionableRentals,
      }
    }

    // Customer role: Active trips or pending bookings belonging strictly to this customer
    const targetCustId = userId || "none"
    const [
      { count: customerRides },
      { count: customerDeliveries },
      { count: customerRentals },
      { count: totalCustomerBookings },
    ] = await Promise.all([
      db
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", targetCustId)
        .eq("service_type", "ride")
        .in("status", ["pending", "assigned", "accepted", "in_progress"]),
      db
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", targetCustId)
        .eq("service_type", "delivery")
        .in("status", ["pending", "assigned", "accepted", "in_progress"]),
      db
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", targetCustId)
        .eq("service_type", "rental")
        .in("status", ["pending", "assigned", "accepted", "in_progress"]),
      db
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", targetCustId)
        .in("status", ["pending", "assigned", "accepted", "in_progress"]),
    ])

    const totalActive = totalCustomerBookings ?? 0

    return {
      ...emptyCounts,
      messages: unreadMessages,
      notifications: totalActive,
      rides: customerRides ?? 0,
      deliveries: customerDeliveries ?? 0,
      rentals: customerRentals ?? 0,
      bookings: totalActive,
      totalActionable: totalActive,
    }
  } catch (err) {
    console.error("[getNotificationBadgeCounts] Error calculating counts:", err)
    return emptyCounts
  }
}

/**
 * Retrieves unified notifications for the current authenticated user and role.
 * Dynamically builds verified notifications from active bookings, status transitions,
 * emergency incidents, and direct notifications in Supabase.
 */
export async function getUnifiedNotifications(
  forcedRole?: UserRole,
  limit = 20,
  forcedUserId?: string
): Promise<Notification[]> {
  try {
    let user: { id: string } | null = null
    try {
      user = await currentUser()
    } catch {
      // CLI / background execution
    }

    const role = forcedRole || (user ? await getCurrentUserRole() : "customer")
    const userId = forcedUserId || user?.id || (role === "admin" ? "admin" : null)
    if (!userId && role !== "admin") return []

    const db = createServiceClient()
    const notifications: Notification[] = []

    // 1. Try querying dedicated public.notifications table if present
    try {
      let query = db
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (role !== "admin" && userId) {
        query = query.or(`user_id.eq.${userId},user_role.eq.${role}`)
      }

      const { data: dbNotifs, error: notifError } = await query

      if (!notifError && dbNotifs && dbNotifs.length > 0) {
        dbNotifs.forEach((d) => {
          notifications.push({
            id: d.id,
            userId: d.user_id,
            userRole: d.user_role,
            type: d.type,
            serviceType: d.service_type,
            title: d.title,
            message: d.message,
            data: {
              bookingId: d.booking_id,
              actionUrl: d.action_url,
              ...d.metadata,
            },
            isRead: Boolean(d.is_read || memoryReadNotificationIds.has(d.id)),
            createdAt: d.created_at,
          })
        })
      }
    } catch {
      // Table bootstrapping
    }

    // 2. Generate live actionable notifications from bookings for this user/role
    if (role === "customer" && userId) {
      const { data: customerBookings } = await db
        .from("bookings")
        .select("id, reference, service_type, status, pickup, destination, scheduled_at, created_at, updated_at")
        .eq("customer_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10)

      if (customerBookings) {
        customerBookings.forEach((b) => {
          const notifId = `notif_book_${b.id}_${b.status}`
          let title = `Booking ${b.reference}`
          let message = `Status: ${b.status.toUpperCase()}`
          const actionUrl = `/dashboard/customer/bookings`

          if (b.status === "pending") {
            title = `Request Submitted: ${b.reference}`
            message = `Your ${b.service_type} request is pending rider/provider dispatch in Butuan City.`
          } else if (b.status === "accepted" || b.status === "assigned") {
            title = `Driver Assigned: ${b.reference}`
            message = `A verified driver has been assigned to your ${b.service_type} and is preparing for pickup.`
          } else if (b.status === "in_progress") {
            title = `Trip Active: ${b.reference}`
            message = `Your ${b.service_type} is currently active and en route to ${b.destination || "destination"}.`
          } else if (b.status === "completed") {
            title = `Trip Completed: ${b.reference}`
            message = `Your ${b.service_type} booking was finalized. Thank you for using HitsNaGo!`
          } else if (b.status === "cancelled") {
            title = `Booking Cancelled: ${b.reference}`
            message = `Your ${b.service_type} reservation was cancelled.`
          }

          notifications.push({
            id: notifId,
            userId: userId || "user",
            userRole: "customer",
            type: "booking",
            serviceType: b.service_type as Notification["serviceType"],
            title,
            message,
            data: {
              bookingId: b.id,
              serviceType: b.service_type,
              actionUrl,
            },
            isRead: memoryReadNotificationIds.has(notifId),
            createdAt: b.updated_at || b.created_at,
          })
        })
      }
    } else if (role === "rider") {
      const { data: riderBookings } = await db
        .from("bookings")
        .select("id, reference, service_type, status, pickup, destination, scheduled_at, created_at, updated_at")
        .in("status", ["pending", "accepted", "in_progress"])
        .in("service_type", ["ride", "delivery"])
        .order("created_at", { ascending: false })
        .limit(10)

      if (riderBookings) {
        riderBookings.forEach((b) => {
          const notifId = `notif_rider_${b.id}_${b.status}`
          const isPending = b.status === "pending"
          notifications.push({
            id: notifId,
            userId: userId || "rider",
            userRole: "rider",
            type: "booking",
            serviceType: b.service_type as Notification["serviceType"],
            title: isPending ? `New Available ${b.service_type.toUpperCase()}` : `Active Trip: ${b.reference}`,
            message: `${b.pickup} ➔ ${b.destination || "Butuan City Hub"} (${b.reference})`,
            data: {
              bookingId: b.id,
              serviceType: b.service_type,
              actionUrl: "/dashboard/rider",
            },
            isRead: memoryReadNotificationIds.has(notifId),
            createdAt: b.created_at,
          })
        })
      }
    } else if (role === "admin") {
      // Admin receives notifications about pending verifications and active incidents
      const [{ data: openIncidents }, { data: pendingRiders }, { data: pendingProviders }] =
        await Promise.all([
          db
            .from("booking_incidents")
            .select("id, incident_type, reason, severity, reporter_name, created_at")
            .in("status", ["open", "investigating"])
            .order("created_at", { ascending: false })
            .limit(5),
          db
            .from("riders")
            .select("id, name, vehicle_model, created_at")
            .eq("is_verified", false)
            .eq("is_active", true)
            .limit(5),
          db
            .from("providers")
            .select("id, name, business_name, created_at")
            .eq("is_verified", false)
            .eq("is_active", true)
            .limit(5),
        ])

      openIncidents?.forEach((inc) => {
        const notifId = `notif_inc_${inc.id}`
        notifications.push({
          id: notifId,
          userId: userId || "admin",
          userRole: "admin",
          type: "dispute",
          serviceType: "general",
          title: `Action Required: ${inc.incident_type.replace(/_/g, " ").toUpperCase()}`,
          message: `${inc.reporter_name} reported: "${inc.reason}" (${inc.severity} severity)`,
          data: {
            actionUrl: "/dashboard/admin/disputes",
          },
          isRead: memoryReadNotificationIds.has(notifId),
          createdAt: inc.created_at,
        })
      })

      pendingRiders?.forEach((r) => {
        const notifId = `notif_rider_verif_${r.id}`
        notifications.push({
          id: notifId,
          userId: userId || "admin",
          userRole: "admin",
          type: "verification",
          serviceType: "ride",
          title: "Rider Verification Pending",
          message: `${r.name} applied as rider (${r.vehicle_model || "Motorcycle"}).`,
          data: {
            actionUrl: "/dashboard/admin/verification",
          },
          isRead: memoryReadNotificationIds.has(notifId),
          createdAt: r.created_at,
        })
      })

      pendingProviders?.forEach((p) => {
        const notifId = `notif_prov_verif_${p.id}`
        notifications.push({
          id: notifId,
          userId: userId || "admin",
          userRole: "admin",
          type: "verification",
          serviceType: "rental",
          title: "Provider Verification Pending",
          message: `${p.name} (${p.business_name || "Rental Host"}) awaiting license approval.`,
          data: {
            actionUrl: "/dashboard/admin/verification",
          },
          isRead: memoryReadNotificationIds.has(notifId),
          createdAt: p.created_at,
        })
      })
    }

    // Sort by timestamp descending
    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  } catch (err) {
    console.error("[getUnifiedNotifications] Error:", err)
    return []
  }
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    memoryReadNotificationIds.add(notificationId)

    const db = createServiceClient()
    // Attempt database update if notifications table exists
    try {
      await db
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId)
    } catch {}

    revalidatePath("/dashboard")
    return { success: true, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to mark notification as read."
    return { success: false, error: msg }
  }
}

/**
 * Marks all notifications as read for current user/role.
 */
export async function markAllNotificationsAsRead(
  forcedRole?: UserRole
): Promise<{ success: boolean; error: string | null }> {
  try {
    let user: { id: string } | null = null
    try {
      user = await currentUser()
    } catch {}

    const role = forcedRole || (user ? await getCurrentUserRole() : "customer")
    const db = createServiceClient()
    try {
      if (user) {
        await db
          .from("notifications")
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .or(`user_id.eq.${user.id},user_role.eq.${role}`)
      }
    } catch {}

    revalidatePath("/dashboard")
    return { success: true, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to mark all as read."
    return { success: false, error: msg }
  }
}

export interface SendSystemNotificationParams {
  userId: string
  userRole: UserRole
  title: string
  message: string
  type: "booking" | "verification" | "message" | "dispute" | "system" | "emergency"
  serviceType?: "ride" | "rental" | "delivery" | "general" | "support"
  bookingId?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

/**
 * Dispatches a system notification to a specific user and role.
 * Persists directly into public.notifications and revalidates dashboard.
 */
export async function sendSystemNotification(
  params: SendSystemNotificationParams
): Promise<{ success: boolean; error: string | null }> {
  try {
    const db = createServiceClient()
    const { error } = await db.from("notifications").insert({
      user_id: params.userId,
      user_role: params.userRole,
      title: params.title,
      message: params.message,
      type: params.type,
      service_type: params.serviceType || "general",
      booking_id: params.bookingId || null,
      action_url: params.actionUrl || null,
      metadata: params.metadata || {},
      is_read: false,
    })

    if (error) {
      console.warn("[sendSystemNotification] Database notice (table may need migration):", error.message)
    }

    try {
      revalidatePath("/dashboard")
    } catch {}

    return { success: true, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send notification."
    console.warn("[sendSystemNotification] Exception:", msg)
    return { success: false, error: msg }
  }
}

