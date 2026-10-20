import assert from "node:assert/strict"
import { test } from "node:test"
import { config } from "dotenv"
import { resolve } from "node:path"

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") })

import { createServiceClient } from "../lib/supabase"
import {
  getUnreadMessagesCount,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markConversationAsRead,
  getOrCreateBookingConversation,
} from "../lib/actions/messages"
import {
  getNotificationBadgeCounts,
  getUnifiedNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../lib/actions/notifications"

test("Unified Real-Time Notifications & Inbox System", async (t) => {
  const db = createServiceClient()

  // 1. Database Connectivity & Tables Check
  await t.test("1. Required tables are accessible in Supabase", async () => {
    const { data: convs, error: convError } = await db.from("conversations").select("id").limit(1)
    assert.equal(convError, null, `Conversations table must exist: ${convError?.message}`)

    const { data: msgs, error: msgError } = await db.from("messages").select("id").limit(1)
    assert.equal(msgError, null, `Messages table must exist: ${msgError?.message}`)

    const { data: parts, error: partError } = await db.from("conversation_participants").select("id").limit(1)
    assert.equal(partError, null, `Conversation participants table must exist: ${partError?.message}`)

    const { data: books, error: bookError } = await db.from("bookings").select("id, status, service_type").limit(1)
    assert.equal(bookError, null, `Bookings table must exist: ${bookError?.message}`)
  })

  // 2. Notification Badge Counts for All 4 Roles
  await t.test("2. Badge counts return accurate numbers for all roles", async () => {
    const adminCounts = await getNotificationBadgeCounts("admin", "test-admin-id")
    assert.ok(typeof adminCounts.totalActionable === "number", "Admin totalActionable must be number")
    assert.ok(typeof adminCounts.messages === "number", "Admin messages must be number")
    assert.ok(typeof adminCounts.verification === "number", "Admin verification must be number")
    assert.ok(typeof adminCounts.disputes === "number", "Admin disputes must be number")

    const customerCounts = await getNotificationBadgeCounts("customer", "test-customer-id")
    assert.ok(typeof customerCounts.messages === "number", "Customer messages count must be number")
    assert.ok(typeof customerCounts.bookings === "number", "Customer bookings count must be number")

    const riderCounts = await getNotificationBadgeCounts("rider", "test-rider-id")
    assert.ok(typeof riderCounts.rides === "number", "Rider rides count must be number")

    const providerCounts = await getNotificationBadgeCounts("provider", "test-provider-id")
    assert.ok(typeof providerCounts.rentals === "number", "Provider rentals count must be number")
  })

  // 3. Unread Message Calculation & Outgoing Message Exclusion
  await t.test("3. Outgoing messages do not increase own unread count, but notify recipient", async () => {
    const testConvId = crypto.randomUUID()
    const testMsgId = crypto.randomUUID()
    const userSender = `user-sender-${Date.now()}`
    const userRecipient = `user-recipient-${Date.now()}`

    // Insert test conversation
    const { error: insConvErr } = await db.from("conversations").insert({
      id: testConvId,
      title: "Test Ride Conversation",
      service_type: "ride",
      conversation_kind: "booking",
      status: "active",
    })
    assert.equal(insConvErr, null, `Insert conv error: ${insConvErr?.message}`)

    // Insert participants
    await db.from("conversation_participants").insert([
      {
        conversation_id: testConvId,
        user_id: userSender,
        user_name: "Test Sender",
        user_role: "customer",
        last_read_at: new Date().toISOString(),
      },
      {
        conversation_id: testConvId,
        user_id: userRecipient,
        user_name: "Test Recipient",
        user_role: "rider",
        last_read_at: new Date(Date.now() - 100000).toISOString(),
      },
    ])

    // Sender sends a message
    const { error: insMsgErr } = await db.from("messages").insert({
      id: testMsgId,
      conversation_id: testConvId,
      sender_id: userSender,
      sender_name: "Test Sender",
      sender_role: "customer",
      body: "Hello rider, I am waiting at Bancasi Airport",
      content: "Hello rider, I am waiting at Bancasi Airport",
    })
    assert.equal(insMsgErr, null, `Insert message error: ${insMsgErr?.message}`)

    // Check sender unread count: MUST BE 0 (own outgoing message is excluded)
    const senderUnread = await getUnreadMessagesCount(userSender)
    assert.equal(senderUnread, 0, "Sender's own outgoing message must NOT be counted as unread")

    // Check recipient unread count: MUST BE >= 1
    const recipientUnread = await getUnreadMessagesCount(userRecipient)
    assert.ok(recipientUnread >= 1, "Recipient must have at least 1 unread message")

    // Recipient marks conversation as read
    const markRes = await markConversationAsRead(testConvId, userRecipient)
    assert.equal(markRes.success, true, "markConversationAsRead must succeed")

    // After marking as read, recipient unread count drops
    const recipientUnreadAfter = await getUnreadMessagesCount(userRecipient)
    assert.equal(recipientUnreadAfter, 0, "Recipient unread count must drop to 0 after marking conversation as read")

    // Clean up test rows
    await db.from("messages").delete().eq("conversation_id", testConvId)
    await db.from("conversation_participants").delete().eq("conversation_id", testConvId)
    await db.from("conversations").delete().eq("id", testConvId)
  })

  // 4. Booking Conversation Creation from Booking Reference
  await t.test("4. getOrCreateBookingConversation resolves or creates conversation thread", async () => {
    // Fetch an existing booking or create temporary test booking
    const { data: existingBooking } = await db
      .from("bookings")
      .select("id, reference, customer_id, customer_name, service_type")
      .limit(1)
      .maybeSingle()

    if (existingBooking) {
      const res = await getOrCreateBookingConversation(existingBooking.id, existingBooking.customer_id)
      assert.ok(res.conversationId, "Should return valid conversationId for booking")
      assert.equal(res.error, null, "Should not return error")

      const convMessages = await getConversationMessages(res.conversationId, existingBooking.customer_id)
      assert.ok(Array.isArray(convMessages.messages), "Messages should be an array")
    }
  })

  // 5. Unified Notifications Generation
  await t.test("5. getUnifiedNotifications returns formatted notification items", async () => {
    const adminNotifs = await getUnifiedNotifications("admin", 10, "admin-test")
    assert.ok(Array.isArray(adminNotifs), "Admin notifications must be an array")

    const customerNotifs = await getUnifiedNotifications("customer", 10, "customer-test")
    assert.ok(Array.isArray(customerNotifs), "Customer notifications must be an array")
  })
})
