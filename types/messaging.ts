import type { UserRole } from "@/types/user"

// User participating in a chat conversation
export interface ConversationParticipant {
  id: string
  conversationId: string
  userId: string
  userName: string
  userRole: UserRole
  lastReadAt: string
  createdAt: string
}

// Individual chat message exchanged between users
export interface MessageItem {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderRole: UserRole
  content: string
  createdAt: string
  updatedAt: string
}

// Conversation preview displayed in the inbox list
export interface ConversationSummary {
  id: string
  bookingId?: string | null
  conversationKind?: "support" | "booking_rider" | string | null
  title?: string | null
  serviceType?: string | null
  status: "active" | "archived" | "closed"
  createdAt: string
  updatedAt: string
  participants: ConversationParticipant[]
  lastMessage?: MessageItem | null
  unreadCount: number
  booking?: {
    id: string
    reference: string
    serviceType: string
    status: string
    pickup: string
    destination?: string | null
  } | null
}

