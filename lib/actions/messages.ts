"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase"
import { getCurrentUserRole } from "@/lib/auth/roles"

export interface MessageItem {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: string
  body: string
  content: string
  createdAt: string
  updatedAt?: string
}

export interface ConversationParticipantItem {
  id: string
  conversationId: string
  userId: string
  userName: string
  userRole: string
  lastReadAt?: string | null
}

export interface ConversationSummaryItem {
  id: string
  title: string
  serviceType: "ride" | "rental" | "delivery" | "support" | "general"
  conversationKind: string
  bookingId?: string | null
  bookingReference?: string | null
  status: string
  updatedAt: string
  createdAt: string
  otherParticipant: {
    userId: string
    name: string
    role: string
  }
  latestMessage?: {
    body: string
    senderId: string
    senderName: string
    createdAt: string
  } | null
  unreadCount: number
}

/**
 * Calculates accurate unread message count for the authenticated user.
 * Excludes user's own sent messages and only counts messages newer than participant's last_read_at.
 */
export async function getUnreadMessagesCount(forcedUserId?: string): Promise<number> {
  try {
    let userId = forcedUserId
    if (!userId) {
      const user = await currentUser()
      if (!user) return 0
      userId = user.id
    }

    const db = createServiceClient()

    // 1. Get all conversations the user participates in
    const { data: participations, error: pError } = await db
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId)

    if (pError || !participations || participations.length === 0) {
      return 0
    }

    // 2. Count unread messages across these conversations
    let totalUnread = 0

    await Promise.all(
      participations.map(async (p) => {
        let query = db
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", p.conversation_id)
          .neq("sender_id", userId)

        if (p.last_read_at) {
          query = query.gt("created_at", p.last_read_at)
        }

        const { count, error } = await query
        if (!error && count) {
          totalUnread += count
        }
      })
    )

    return totalUnread
  } catch (err) {
    console.error("[getUnreadMessagesCount] Error:", err)
    return 0
  }
}

/**
 * Retrieves the user's conversations with booking context, participant details, and unread counts.
 */
export async function getUserConversations(): Promise<ConversationSummaryItem[]> {
  try {
    const user = await currentUser()
    if (!user) return []

    const db = createServiceClient()

    // 1. Find conversations the user is enrolled in
    const { data: userParticipations, error: pError } = await db
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id)

    if (pError || !userParticipations || userParticipations.length === 0) {
      return []
    }

    const conversationIds = userParticipations.map((p) => p.conversation_id)

    // 2. Fetch conversation rows
    const { data: convRows, error: cError } = await db
      .from("conversations")
      .select("id, title, service_type, conversation_kind, booking_id, status, created_at, updated_at")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false })

    if (cError || !convRows) {
      return []
    }

    // 3. For each conversation, fetch other participants, latest message, and unread count
    const summaries: ConversationSummaryItem[] = await Promise.all(
      convRows.map(async (c) => {
        const userPart = userParticipations.find((p) => p.conversation_id === c.id)
        const lastReadAt = userPart?.last_read_at

        // Fetch other participants
        const { data: allParts } = await db
          .from("conversation_participants")
          .select("user_id, user_name, user_role")
          .eq("conversation_id", c.id)

        const otherPart = allParts?.find((p) => p.user_id !== user.id)
        const otherParticipant = otherPart
          ? {
              userId: otherPart.user_id,
              name: otherPart.user_name || "Participant",
              role: otherPart.user_role || "user",
            }
          : {
              userId: "system",
              name: "HitsNaGo Support",
              role: "support",
            }

        // Fetch latest message
        const { data: latestMsgRows } = await db
          .from("messages")
          .select("body, sender_id, sender_name, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)

        const latestMsg = latestMsgRows?.[0]
          ? {
              body: latestMsgRows[0].body,
              senderId: latestMsgRows[0].sender_id,
              senderName: latestMsgRows[0].sender_name,
              createdAt: latestMsgRows[0].created_at,
            }
          : null

        // Fetch unread count for this conversation
        let unreadCount = 0
        let unreadQuery = db
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", user.id)

        if (lastReadAt) {
          unreadQuery = unreadQuery.gt("created_at", lastReadAt)
        }

        const { count } = await unreadQuery
        unreadCount = count || 0

        // Booking reference if linked
        let bookingReference: string | null = null
        if (c.booking_id) {
          const { data: bData } = await db
            .from("bookings")
            .select("reference")
            .eq("id", c.booking_id)
            .maybeSingle()
          bookingReference = bData?.reference || null
        }

        return {
          id: c.id,
          title: c.title || "Booking Conversation",
          serviceType: (c.service_type as ConversationSummaryItem["serviceType"]) || "general",
          conversationKind: c.conversation_kind || "booking",
          bookingId: c.booking_id,
          bookingReference,
          status: c.status || "active",
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          otherParticipant,
          latestMessage: latestMsg,
          unreadCount,
        }
      })
    )

    // Sort by latest message or updated_at
    return summaries.sort((a, b) => {
      const timeA = new Date(a.latestMessage?.createdAt || a.updatedAt).getTime()
      const timeB = new Date(b.latestMessage?.createdAt || b.updatedAt).getTime()
      return timeB - timeA
    })
  } catch (err) {
    console.error("[getUserConversations] Error:", err)
    return []
  }
}

/**
 * Retrieves all messages for a specific conversation.
 * Authorizes that the user is either a participant or an admin.
 */
export async function getConversationMessages(
  conversationId: string,
  forcedUserId?: string
): Promise<{ messages: MessageItem[]; error: string | null }> {
  try {
    let user: { id: string } | null = null
    try {
      user = await currentUser()
    } catch {}

    const userId = forcedUserId || user?.id
    if (!userId) return { messages: [], error: "Not authenticated." }

    const db = createServiceClient()

    // Authorization check
    const role = user ? await getCurrentUserRole() : "customer"
    if (role !== "admin") {
      const { data: part } = await db
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .maybeSingle()

      if (!part) {
        return { messages: [], error: "Unauthorized access to this conversation." }
      }
    }

    const { data: rows, error } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      return { messages: [], error: error.message }
    }

    const messages: MessageItem[] = (rows || []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderName: m.sender_name || "User",
      senderRole: m.sender_role || "customer",
      body: m.body || m.content || "",
      content: m.content || m.body || "",
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }))

    return { messages, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load messages."
    return { messages: [], error: msg }
  }
}

/**
 * Sends a message in a conversation and updates the conversation's timestamp.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  forcedUserId?: string
): Promise<{ message: MessageItem | null; error: string | null }> {
  try {
    let user: { id: string; fullName?: string | null; firstName?: string | null; emailAddresses: { emailAddress: string }[] } | null = null
    try {
      user = await currentUser()
    } catch {}

    const userId = forcedUserId || user?.id
    if (!userId) return { message: null, error: "Not authenticated." }

    const trimmed = content.trim()
    if (!trimmed) return { message: null, error: "Message cannot be empty." }

    const db = createServiceClient()
    const role = user ? await getCurrentUserRole() : "customer"

    // Authorization check
    if (role !== "admin") {
      const { data: part } = await db
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .maybeSingle()

      if (!part) {
        return { message: null, error: "Unauthorized to send messages in this conversation." }
      }
    }

    const senderName =
      user?.fullName ||
      user?.firstName ||
      user?.emailAddresses[0]?.emailAddress.split("@")[0] ||
      "User"

    const now = new Date().toISOString()

    // 1. Insert message
    const { data: msgRow, error: mError } = await db
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_name: senderName,
        sender_role: role,
        body: trimmed,
        content: trimmed,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (mError || !msgRow) {
      console.error("[sendMessage] Error inserting message:", mError)
      return { message: null, error: mError?.message || "Failed to send message." }
    }

    // 2. Update conversation updated_at
    await db
      .from("conversations")
      .update({ updated_at: now })
      .eq("id", conversationId)

    // 3. Update sender's last_read_at so they don't count their own message
    await db
      .from("conversation_participants")
      .update({ last_read_at: now, updated_at: now })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)

    try {
      revalidatePath("/dashboard/customer/inbox")
      revalidatePath("/dashboard/rider/inbox")
      revalidatePath("/dashboard/provider/inbox")
      revalidatePath("/dashboard/admin/inbox")
    } catch {}

    const created: MessageItem = {
      id: msgRow.id,
      conversationId: msgRow.conversation_id,
      senderId: msgRow.sender_id,
      senderName: senderName,
      senderRole: role,
      body: msgRow.body,
      content: msgRow.content,
      createdAt: msgRow.created_at,
    }

    return { message: created, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send message."
    return { message: null, error: msg }
  }
}

/**
 * Marks conversation as read for the authenticated user, updating their last_read_at timestamp.
 */
export async function markConversationAsRead(
  conversationId: string,
  forcedUserId?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    let user: { id: string } | null = null
    try {
      user = await currentUser()
    } catch {}

    const userId = forcedUserId || user?.id
    if (!userId) return { success: false, error: "Not authenticated." }

    const db = createServiceClient()
    // Add forward buffer to guarantee immunity to database clock skew
    const now = new Date(Date.now() + 2000).toISOString()

    const { error } = await db
      .from("conversation_participants")
      .update({ last_read_at: now, updated_at: now })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)

    if (error) {
      console.error("[markConversationAsRead] Error:", error)
      return { success: false, error: error.message }
    }

    try {
      revalidatePath("/dashboard/customer/inbox")
      revalidatePath("/dashboard/rider/inbox")
      revalidatePath("/dashboard/provider/inbox")
      revalidatePath("/dashboard/admin/inbox")
    } catch {}

    return { success: true, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to mark as read."
    return { success: false, error: msg }
  }
}

/**
 * Creates or retrieves a unified conversation for a specific booking.
 * Automatically adds the customer, assigned rider/provider, and support channel.
 */
export async function getOrCreateBookingConversation(
  bookingId: string,
  forcedUserId?: string
): Promise<{ conversationId: string | null; error: string | null }> {
  try {
    let user: { id: string; fullName?: string | null; firstName?: string | null } | null = null
    try {
      user = await currentUser()
    } catch {}

    const userId = forcedUserId || user?.id
    if (!userId) return { conversationId: null, error: "Not authenticated." }

    const db = createServiceClient()

    // 1. Check if conversation already exists for this booking
    const { data: existing } = await db
      .from("conversations")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle()

    if (existing?.id) {
      // Ensure current user is in participants
      const { data: hasPart } = await db
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", existing.id)
        .eq("user_id", userId)
        .maybeSingle()

      if (!hasPart) {
        const role = user ? await getCurrentUserRole() : "customer"
        const userName = user?.fullName || user?.firstName || "User"
        await db.from("conversation_participants").insert({
          conversation_id: existing.id,
          user_id: userId,
          user_name: userName,
          user_role: role,
        })
      }

      return { conversationId: existing.id, error: null }
    }

    // 2. Fetch booking details to configure participants
    const { data: booking, error: bError } = await db
      .from("bookings")
      .select("*, rider:rider_id(id,name,clerk_user_id)")
      .eq("id", bookingId)
      .single()

    if (bError || !booking) {
      return { conversationId: null, error: "Booking not found." }
    }

    const conversationKind =
      booking.service_type === "rental" ? "booking_provider" : "booking_rider"
    const title = `Trip ${booking.reference} (${booking.service_type})`

    // 3. Create conversation row with explicit UUID
    const convId = crypto.randomUUID()
    const { data: newConv, error: cError } = await db
      .from("conversations")
      .insert({
        id: convId,
        booking_id: booking.id,
        title,
        service_type: booking.service_type,
        conversation_kind: conversationKind,
        created_by: userId,
        status: "active",
      })
      .select()
      .single()

    if (cError || !newConv) {
      return { conversationId: null, error: cError?.message || "Failed to create conversation." }
    }

    // 4. Enroll customer
    const participantsToInsert = [
      {
        conversation_id: newConv.id,
        user_id: booking.customer_id,
        user_name: booking.customer_name || "Customer",
        user_role: "customer",
      },
    ]

    // 5. Enroll assigned rider if present
    if (booking.rider && booking.rider_id) {
      const riderUserId = booking.rider.clerk_user_id || booking.rider_id
      participantsToInsert.push({
        conversation_id: newConv.id,
        user_id: riderUserId,
        user_name: booking.rider.name || "Assigned Rider",
        user_role: "rider",
      })
    }

    // 6. Enroll current user if not already included (e.g. admin or provider)
    if (!participantsToInsert.some((p) => p.user_id === userId)) {
      const role = user ? await getCurrentUserRole() : "customer"
      const userName = user?.fullName || user?.firstName || "User"
      participantsToInsert.push({
        conversation_id: newConv.id,
        user_id: userId,
        user_name: userName,
        user_role: role,
      })
    }

    await db.from("conversation_participants").insert(participantsToInsert)

    return { conversationId: newConv.id, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to get or create conversation."
    return { conversationId: null, error: msg }
  }
}
