"use server"

// Server actions for fetching user conversations, validating chat input, and participant management
import { createServiceClient } from "@/lib/supabase"
import { currentUser } from "@clerk/nextjs/server"
import { getCurrentUserRole } from "@/lib/auth/roles"
import type { UserRole } from "@/types/user"
import type { ConversationSummary, MessageItem, ConversationParticipant } from "@/types/messaging"
import { revalidatePath } from "next/cache"


/**
 * Validates message content against size and quality limits
 */
function validateMessageContent(content: string): { valid: boolean; error?: string; cleanContent: string } {
  if (!content || typeof content !== "string") {
    return { valid: false, error: "Message content is required.", cleanContent: "" }
  }
  const clean = content.trim()
  if (clean.length === 0) {
    return { valid: false, error: "Message cannot be empty.", cleanContent: "" }
  }
  if (clean.length > 2000) {
    return { valid: false, error: "Message exceeds 2,000 character limit.", cleanContent: clean }
  }
  return { valid: true, cleanContent: clean }
}

/**
 * Fetch all conversations for the authenticated user
 */
export async function getUserConversations(): Promise<{
  conversations: ConversationSummary[]
  error: string | null
}> {
  try {
    const user = await currentUser()
    if (!user) {
      return { conversations: [], error: "Not authenticated." }
    }

    const role = (await getCurrentUserRole()) as UserRole
    const db = createServiceClient()

    // 1. Get conversations where current user is a participant (or all active if admin)
    let convIds: string[] = []

    if (role === "admin") {
      const { data: allConvs, error: convError } = await db
        .from("conversations")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(50)

      if (convError) {
        console.warn("[getUserConversations] Supabase query notice:", convError.message)
        return { conversations: [], error: convError.message }
      }
      convIds = (allConvs || []).map((c) => c.id)
    } else {
      const { data: myParticipations, error: partError } = await db
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id)

      if (partError) {
        console.warn("[getUserConversations] Participant query notice:", partError.message)
        return { conversations: [], error: partError.message }
      }
      convIds = (myParticipations || []).map((p) => p.conversation_id)
    }

    if (convIds.length === 0) {
      return { conversations: [], error: null }
    }

    // 2. Fetch conversation records
    const { data: rawConvs, error: rawError } = await db
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("updated_at", { ascending: false })

    if (rawError || !rawConvs) {
      return { conversations: [], error: rawError?.message || "Failed to load conversations" }
    }

    // 2b. Fetch associated bookings directly to avoid dependency on PostgREST relationship cache
    const bookingIds = rawConvs.map((c) => c.booking_id).filter(Boolean) as string[]
    const bookingsById = new Map<string, {
      id: string
      reference: string
      service_type: string
      status: string
      pickup: string
      destination: string | null
    }>()

    if (bookingIds.length > 0) {
      const { data: bList } = await db
        .from("bookings")
        .select("id, reference, service_type, status, pickup, destination")
        .in("id", bookingIds)

      if (bList) {
        for (const b of bList) {
          bookingsById.set(b.id, b)
        }
      }
    }

    // 3. Fetch participants for these conversations
    const { data: rawParts } = await db
      .from("conversation_participants")
      .select("*")
      .in("conversation_id", convIds)

    // 4. Fetch latest message and count unread messages for current user
    const { data: rawMessages } = await db
      .from("messages")
      .select("*")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: true })

    const summaries: ConversationSummary[] = rawConvs.map((c) => {
      const parts: ConversationParticipant[] = (rawParts || [])
        .filter((p) => p.conversation_id === c.id)
        .map((p) => ({
          id: p.id,
          conversationId: p.conversation_id,
          userId: p.user_id,
          userName: p.user_name,
          userRole: p.user_role as UserRole,
          lastReadAt: p.last_read_at,
          createdAt: p.created_at,
        }))

      const convMessages = (rawMessages || []).filter((m) => m.conversation_id === c.id)
      const lastMsg = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null

      // Find user's last read timestamp
      const myPart = parts.find((p) => p.userId === user.id)
      const lastRead = myPart ? new Date(myPart.lastReadAt).getTime() : 0

      // Calculate unread count (messages sent by others after my last read time)
      const unreadCount = convMessages.filter(
        (m) => m.sender_id !== user.id && new Date(m.created_at).getTime() > lastRead
      ).length

      const matchedBooking = c.booking_id ? bookingsById.get(c.booking_id) : null

      return {
        id: c.id,
        bookingId: c.booking_id,
        conversationKind: c.conversation_kind || (c.service_type === "support" ? "support" : "booking_rider"),
        title: c.title,
        serviceType: c.service_type,
        status: c.status,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        participants: parts,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              conversationId: lastMsg.conversation_id,
              senderId: lastMsg.sender_id,
              senderName: lastMsg.sender_name,
              senderRole: lastMsg.sender_role as UserRole,
              content: lastMsg.content || lastMsg.body || "",
              createdAt: lastMsg.created_at,
              updatedAt: lastMsg.updated_at,
            }
          : null,
        unreadCount,
        booking: matchedBooking
          ? {
              id: matchedBooking.id,
              reference: matchedBooking.reference,
              serviceType: matchedBooking.service_type,
              status: matchedBooking.status,
              pickup: matchedBooking.pickup,
              destination: matchedBooking.destination,
            }
          : null,
      }
    })

    return { conversations: summaries, error: null }
  } catch (err) {
    console.error("[getUserConversations] Exception:", err)
    return { conversations: [], error: err instanceof Error ? err.message : "Internal error." }
  }
}

/**
 * Fetch all messages in a specific conversation
 */
export async function getConversationMessages(conversationId: string): Promise<{
  messages: MessageItem[]
  error: string | null
}> {
  try {
    const user = await currentUser()
    if (!user) {
      return { messages: [], error: "Not authenticated." }
    }

    const role = (await getCurrentUserRole()) as UserRole
    const db = createServiceClient()

    // Authorization check: Verify user is a participant or administrator
    if (role !== "admin") {
      const { data: part, error: partError } = await db
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle()

      if (partError || !part) {
        return { messages: [], error: "Access denied. You are not a participant in this conversation." }
      }
    }

    // Mark as read for current user
    await db
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)

    // Fetch messages
    const { data, error } = await db
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      return { messages: [], error: error.message }
    }

    const items: MessageItem[] = (data || []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderName: m.sender_name,
      senderRole: m.sender_role as UserRole,
      content: m.content,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }))

    return { messages: items, error: null }
  } catch (err) {
    console.error("[getConversationMessages] Exception:", err)
    return { messages: [], error: err instanceof Error ? err.message : "Internal error." }
  }
}

/**
 * Sends a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ message: MessageItem | null; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) {
      return { message: null, error: "Not authenticated." }
    }

    const { valid, error: valError, cleanContent } = validateMessageContent(content)
    if (!valid) {
      return { message: null, error: valError || "Invalid message content." }
    }

    const role = (await getCurrentUserRole()) as UserRole
    const db = createServiceClient()

    // Authorization check: Verify user is participant or administrator
    if (role !== "admin") {
      const { data: part, error: partError } = await db
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle()

      if (partError || !part) {
        return { message: null, error: "Unauthorized. You are not a participant in this conversation." }
      }
    }

    // Check if conversation is linked to a completed or cancelled booking
    const { data: conv } = await db
      .from("conversations")
      .select("id, booking_id")
      .eq("id", conversationId)
      .maybeSingle()

    if (conv?.booking_id) {
      const { data: bookingData } = await db
        .from("bookings")
        .select("id, status, reference")
        .eq("id", conv.booking_id)
        .maybeSingle()

      if (bookingData && (bookingData.status === "completed" || bookingData.status === "cancelled")) {
        return {
          message: null,
          error: "This trip has ended. Messaging is closed for this booking.",
        }
      }
    }

    const senderName =
      user.fullName ||
      user.firstName ||
      user.emailAddresses[0]?.emailAddress.split("@")[0] ||
      "User"

    const now = new Date().toISOString()

    const { data, error } = await db
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: senderName,
        sender_role: role,
        content: cleanContent,
        body: cleanContent,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error || !data) {
      return { message: null, error: error?.message || "Failed to send message." }
    }

    // Update conversation timestamp and sender's last_read_at
    await Promise.all([
      db
        .from("conversations")
        .update({ updated_at: now })
        .eq("id", conversationId),
      db
        .from("conversation_participants")
        .update({ last_read_at: now })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id),
    ])

    revalidatePath("/dashboard/customer/messages")
    revalidatePath("/dashboard/rider/messages")
    revalidatePath("/dashboard/admin/messages")

    return {
      message: {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        senderName: data.sender_name,
        senderRole: data.sender_role as UserRole,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      error: null,
    }
  } catch (err) {
    console.error("[sendMessage] Exception:", err)
    return { message: null, error: err instanceof Error ? err.message : "Internal error." }
  }
}

/**
 * Gets an existing conversation or creates one for a booking
 */
export async function getOrCreateBookingConversation(bookingId: string): Promise<{
  conversationId: string | null
  error: string | null
}> {
  try {
    const user = await currentUser()
    if (!user) return { conversationId: null, error: "Not authenticated." }

    const role = (await getCurrentUserRole()) as UserRole
    const db = createServiceClient()

    // 1. Fetch booking to verify permissions
    const { data: booking, error: bError } = await db
      .from("bookings")
      .select("*, rider:riders!rider_id(id, clerk_user_id, name, email)")
      .eq("id", bookingId)
      .single()

    if (bError || !booking) {
      return { conversationId: null, error: "Booking not found." }
    }

    // Reject if no rider is assigned yet
    if (!booking.rider_id || !booking.rider) {
      return { conversationId: null, error: "No rider has been assigned to this booking yet." }
    }

    // Check permission: Must be the customer, the assigned rider, or admin
    const isCustomer = booking.customer_id === user.id
    const isAssignedRider = booking.rider?.clerk_user_id === user.id
    const isAdmin = role === "admin"

    if (!isCustomer && !isAssignedRider && !isAdmin) {
      return { conversationId: null, error: "Not authorized to access conversations for this booking." }
    }

    // 2. Check if a conversation already exists for this booking between customer and rider
    const { data: existingConv } = await db
      .from("conversations")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("conversation_kind", "booking_rider")
      .maybeSingle()

    if (existingConv) {
      // Ensure caller is in participants list
      await db
        .from("conversation_participants")
        .upsert(
          {
            conversation_id: existingConv.id,
            user_id: user.id,
            user_name: user.fullName || user.firstName || "User",
            user_role: role,
          },
          { onConflict: "conversation_id,user_id" }
        )
      return { conversationId: existingConv.id, error: null }
    }

    // 3. Create new conversation with race condition handling
    const title = `Trip ${booking.reference || booking.id.substring(0, 8)} (${booking.service_type || "ride"})`
    const { data: newConv, error: createError } = await db
      .from("conversations")
      .insert({
        booking_id: bookingId,
        created_by: user.id,
        title,
        service_type: booking.service_type || "ride",
        conversation_kind: "booking_rider",
        status: "active",
      })
      .select()
      .single()

    if (createError) {
      // If conflict occurred due to race condition, re-fetch existing conversation
      const { data: fallbackConv } = await db
        .from("conversations")
        .select("id")
        .eq("booking_id", bookingId)
        .eq("conversation_kind", "booking_rider")
        .maybeSingle()

      if (fallbackConv) {
        return { conversationId: fallbackConv.id, error: null }
      }
      return { conversationId: null, error: createError.message || "Failed to create conversation." }
    }

    if (!newConv) {
      return { conversationId: null, error: "Failed to create conversation." }
    }

    // 4. Add initial participants (Customer and Rider)
    const participantsToInsert: Array<{
      conversation_id: string
      user_id: string
      user_name: string
      user_role: UserRole
    }> = []

    if (booking.customer_id) {
      participantsToInsert.push({
        conversation_id: newConv.id,
        user_id: booking.customer_id,
        user_name: booking.customer_name || "Customer",
        user_role: "customer",
      })
    }

    if (booking.rider?.clerk_user_id) {
      participantsToInsert.push({
        conversation_id: newConv.id,
        user_id: booking.rider.clerk_user_id,
        user_name: booking.rider.name || "Assigned Rider",
        user_role: "rider",
      })
    }

    if (isAdmin && !participantsToInsert.some((p) => p.user_id === user.id)) {
      participantsToInsert.push({
        conversation_id: newConv.id,
        user_id: user.id,
        user_name: user.fullName || "Administrator",
        user_role: "admin",
      })
    }

    if (participantsToInsert.length > 0) {
      await db
        .from("conversation_participants")
        .upsert(participantsToInsert, { onConflict: "conversation_id,user_id" })
    }

    // Welcome system message
    const welcomeText = `Conversation opened for booking ${booking.reference || booking.id.substring(0, 8)}. Customer and rider can communicate here regarding trip details.`
    await db.from("messages").insert({
      conversation_id: newConv.id,
      sender_id: user.id,
      sender_name: "HitsNaGo Dispatch",
      sender_role: "admin",
      content: welcomeText,
      body: welcomeText,
    })

    return { conversationId: newConv.id, error: null }
  } catch (err) {
    console.error("[getOrCreateBookingConversation] Exception:", err)
    return { conversationId: null, error: err instanceof Error ? err.message : "Internal error." }
  }
}

/**
 * Creates a support thread with HitsNaGo admin
 */
export async function createSupportConversation(
  subject: string,
  initialMessage: string,
  bookingId?: string
): Promise<{ conversationId: string | null; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { conversationId: null, error: "Not authenticated." }

    const { valid, error: valError, cleanContent } = validateMessageContent(initialMessage)
    if (!valid) return { conversationId: null, error: valError || "Invalid message content." }

    const role = (await getCurrentUserRole()) as UserRole
    const db = createServiceClient()

    const { data: conv, error: convError } = await db
      .from("conversations")
      .insert({
        created_by: user.id,
        booking_id: bookingId || null,
        title: subject.trim() || "Support Request",
        service_type: "support",
        conversation_kind: "support",
        status: "active",
      })
      .select()
      .single()

    if (convError || !conv) {
      return { conversationId: null, error: convError?.message || "Failed to create support thread." }
    }

    // Add user as participant
    const userName = user.fullName || user.firstName || "Customer"
    await db.from("conversation_participants").insert({
      conversation_id: conv.id,
      user_id: user.id,
      user_name: userName,
      user_role: role,
    })

    // Add initial message
    await db.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      sender_name: userName,
      sender_role: role,
      content: cleanContent,
      body: cleanContent,
    })

    revalidatePath("/dashboard/customer/messages")
    revalidatePath("/dashboard/admin/messages")

    return { conversationId: conv.id, error: null }
  } catch (err) {
    console.error("[createSupportConversation] Exception:", err)
    return { conversationId: null, error: err instanceof Error ? err.message : "Internal error." }
  }
}
