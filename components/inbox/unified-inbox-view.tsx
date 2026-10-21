"use client"

// Real-time chat inbox allowing customers, riders, providers, and admins to exchange direct messages
import * as React from "react"
import Link from "next/link"
import { useAuth, useUser } from "@clerk/nextjs"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Mail01Icon,
  Motorbike01Icon,
  PackageIcon,
  Key01Icon,
  ShieldCheckIcon,
  SentIcon,
  ArrowLeft01Icon,
  Search01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NotificationBadge } from "@/components/dashboard/notification-badge"
import { useNotifications } from "@/hooks/use-notifications"
import { createBrowserClient } from "@/lib/supabase"
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  getOrCreateBookingConversation,
  type ConversationSummaryItem,
  type MessageItem,
} from "@/lib/actions/messages"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/auth/roles"

interface UnifiedInboxViewProps {
  role: UserRole
  initialBookingId?: string
}

export function UnifiedInboxView({ role, initialBookingId }: UnifiedInboxViewProps) {
  const { userId } = useAuth()
  const { user } = useUser()
  const { markConversationAsRead } = useNotifications()

  const [conversations, setConversations] = React.useState<ConversationSummaryItem[]>([])
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<MessageItem[]>([])
  const [inputMessage, setInputMessage] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedFilter, setSelectedFilter] = React.useState<string>("all")
  const [mobileShowChat, setMobileShowChat] = React.useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" })
  }

  // Load conversations asynchronously
  React.useEffect(() => {
    let isMounted = true
    if (!userId) {
      return
    }

    getUserConversations()
      .then(async (convs) => {
        if (!isMounted) return
        let updatedConvs = convs

        if (initialBookingId) {
          let match = updatedConvs.find((c) => c.bookingId === initialBookingId)
          if (!match) {
            const creationRes = await getOrCreateBookingConversation(initialBookingId)
            if (creationRes.conversationId && isMounted) {
              updatedConvs = await getUserConversations()
              match = updatedConvs.find((c) => c.id === creationRes.conversationId)
            }
          }
          if (match && isMounted) {
            setSelectedConversationId(match.id)
            setMobileShowChat(true)
          }
        } else if (updatedConvs.length > 0 && window.innerWidth >= 768) {
          setSelectedConversationId((prev) => prev || updatedConvs[0].id)
        }

        if (isMounted) {
          setConversations(updatedConvs)
          setIsLoadingConversations(false)
        }
      })
      .catch((err) => {
        console.error("[UnifiedInboxView] Error loading conversations:", err)
        if (isMounted) setIsLoadingConversations(false)
      })

    return () => {
      isMounted = false
    }
  }, [userId, initialBookingId])

  // Load messages when selectedConversationId changes
  React.useEffect(() => {
    if (!selectedConversationId) {
      return
    }

    let isCancelled = false

    // Mark as read in context & backend
    void markConversationAsRead(selectedConversationId)

    // Fetch messages asynchronously
    getConversationMessages(selectedConversationId)
      .then((res) => {
        if (!isCancelled) {
          setMessages(res.messages || [])
          setIsLoadingMessages(false)
          setTimeout(() => scrollToBottom(false), 50)
        }
      })
      .catch((err) => {
        console.error("[UnifiedInboxView] Error loading messages:", err)
        if (!isCancelled) setIsLoadingMessages(false)
      })

    // Subscribe to realtime messages for this conversation
    let channel: ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null = null
    try {
      const supabase = createBrowserClient()
      channel = supabase
        .channel(`messages:${selectedConversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversationId}`,
          },
          (payload) => {
            const newRow = payload.new as Record<string, unknown>
            const senderId = String(newRow.sender_id || "")
            const incomingMsg: MessageItem = {
              id: String(newRow.id || ""),
              conversationId: String(newRow.conversation_id || ""),
              senderId,
              senderName: String(newRow.sender_name || (senderId === userId ? "You" : "Participant")),
              senderRole: String(newRow.sender_role || "user"),
              body: String(newRow.body || newRow.content || ""),
              content: String(newRow.content || newRow.body || ""),
              createdAt: String(newRow.created_at || new Date().toISOString()),
            }

            setMessages((prev) => {
              if (prev.some((m) => m.id === incomingMsg.id)) return prev
              return [...prev, incomingMsg]
            })

            // Mark conversation as read if message is incoming
            if (incomingMsg.senderId !== userId) {
              void markConversationAsRead(selectedConversationId)
            }

            setTimeout(() => scrollToBottom(true), 50)
          }
        )
        .subscribe()
    } catch (e) {
      console.warn("[UnifiedInboxView] Realtime subscription error:", e)
    }

    return () => {
      isCancelled = true
      if (channel) {
        try {
          const supabase = createBrowserClient()
          supabase.removeChannel(channel)
        } catch {}
      }
    }
  }, [selectedConversationId, userId, markConversationAsRead])

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputMessage.trim() || !selectedConversationId || isSending) return

    const messageText = inputMessage.trim()
    setInputMessage("")
    setIsSending(true)

    // Optimistic message
    const tempId = `temp-${Date.now()}`
    const optimisticMsg: MessageItem = {
      id: tempId,
      conversationId: selectedConversationId,
      senderId: userId || "me",
      senderName: user?.fullName || "You",
      senderRole: role,
      body: messageText,
      content: messageText,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setTimeout(() => scrollToBottom(true), 30)

    try {
      const res = await sendMessage(selectedConversationId, messageText)

      if (res.message) {
        // Replace temp msg with server confirmed
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.message! : m))
        )

        // Update local conversation list latest message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversationId
              ? {
                  ...c,
                  latestMessage: {
                    body: messageText,
                    senderId: userId || "",
                    senderName: user?.fullName || "You",
                    createdAt: new Date().toISOString(),
                  },
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        )
      } else {
        console.error("[UnifiedInboxView] Failed to send message:", res.error)
      }
    } catch (err) {
      console.error("[UnifiedInboxView] Send message error:", err)
    } finally {
      setIsSending(false)
    }
  }

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId)

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (selectedFilter !== "all" && c.serviceType !== selectedFilter) {
      return false
    }
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      c.title.toLowerCase().includes(q) ||
      c.otherParticipant.name.toLowerCase().includes(q) ||
      (c.bookingReference && c.bookingReference.toLowerCase().includes(q)) ||
      (c.latestMessage && c.latestMessage.body.toLowerCase().includes(q))
    )
  })

  const getServiceBadge = (type: string) => {
    switch (type) {
      case "ride":
        return {
          label: "Ride",
          icon: Motorbike01Icon,
          badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        }
      case "delivery":
        return {
          label: "Delivery",
          icon: PackageIcon,
          badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        }
      case "rental":
        return {
          label: "Rental",
          icon: Key01Icon,
          badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        }
      case "support":
        return {
          label: "Support",
          icon: ShieldCheckIcon,
          badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        }
      default:
        return {
          label: "Direct",
          icon: Mail01Icon,
          badgeClass: "bg-muted text-muted-foreground border-border",
        }
    }
  }

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      if (isToday) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    } catch {
      return ""
    }
  }

  const getBookingLink = (bookingId?: string | null) => {
    if (!bookingId) return null
    if (role === "admin") return `/dashboard/admin/bookings`
    if (role === "customer") return `/dashboard/customer/bookings`
    if (role === "rider") return `/dashboard/rider/history`
    if (role === "provider") return `/dashboard/provider`
    return null
  }

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Messages & Inbox
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary font-semibold text-xs">
              Live Real-Time
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Unified communication hub for customer bookings, rider dispatches, rental reservations, and support.
          </p>
        </div>
      </div>

      {/* Main Inbox Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs min-h-[580px] max-h-[750px]">
        {/* Left Pane: Conversation List */}
        <div
          className={cn(
            "md:col-span-5 lg:col-span-4 border-r border-border/80 flex flex-col bg-sidebar/50",
            mobileShowChat ? "hidden md:flex" : "flex"
          )}
        >
          {/* Search & Filter */}
          <div className="p-3.5 border-b border-border/80 flex flex-col gap-2.5">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search conversations, booking ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Service Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {[
                { id: "all", label: "All" },
                { id: "ride", label: "Rides" },
                { id: "delivery", label: "Deliveries" },
                { id: "rental", label: "Rentals" },
                { id: "support", label: "Support" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedFilter(filter.id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all shrink-0",
                    selectedFilter === filter.id
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <HugeiconsIcon icon={Mail01Icon} size={28} className="text-muted-foreground/50" />
                <span>No conversations found</span>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const serviceInfo = getServiceBadge(conv.serviceType)
                const isSelected = conv.id === selectedConversationId
                const timeText = formatTimestamp(conv.latestMessage?.createdAt || conv.updatedAt)

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id)
                      setMobileShowChat(true)
                    }}
                    className={cn(
                      "p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-muted/60 relative",
                      isSelected ? "bg-muted text-foreground" : "text-sidebar-foreground",
                      conv.unreadCount > 0 && !isSelected && "bg-primary/5"
                    )}
                  >
                    {/* Participant Avatar */}
                    <div className="size-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs border border-primary/20">
                      {conv.otherParticipant.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-heading text-xs font-semibold truncate text-foreground">
                          {conv.otherParticipant.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          {timeText}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] px-1.5 py-0 font-medium h-4 border", serviceInfo.badgeClass)}
                        >
                          <HugeiconsIcon icon={serviceInfo.icon} size={10} className="mr-0.5 inline" />
                          {serviceInfo.label}
                        </Badge>

                        {conv.bookingReference && (
                          <span className="text-[10px] text-muted-foreground font-mono truncate">
                            #{conv.bookingReference}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1 leading-snug">
                        {conv.latestMessage ? (
                          <>
                            {conv.latestMessage.senderId === userId ? (
                              <span className="font-medium text-foreground">You: </span>
                            ) : null}
                            {conv.latestMessage.body}
                          </>
                        ) : (
                          <span className="italic text-muted-foreground/70">Conversation started</span>
                        )}
                      </p>
                    </div>

                    {conv.unreadCount > 0 && !isSelected && (
                      <NotificationBadge
                        count={conv.unreadCount}
                        className="shrink-0 self-center"
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Pane: Chat Window */}
        <div
          className={cn(
            "md:col-span-7 lg:col-span-8 flex flex-col bg-background h-full",
            !mobileShowChat ? "hidden md:flex" : "flex"
          )}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-border/80 flex items-center justify-between gap-3 bg-card/60 backdrop-blur-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden size-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
                    aria-label="Back to conversations"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  </button>

                  <div className="size-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs border border-primary/20">
                    {selectedConversation.otherParticipant.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-xs sm:text-sm font-bold text-foreground truncate">
                        {selectedConversation.otherParticipant.name}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 text-muted-foreground">
                        {selectedConversation.otherParticipant.role}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="capitalize">{selectedConversation.serviceType} Service</span>
                      {selectedConversation.bookingReference && (
                        <>
                          <span>•</span>
                          <span className="font-mono">Ref: #{selectedConversation.bookingReference}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Booking link if attached */}
                {selectedConversation.bookingId && getBookingLink(selectedConversation.bookingId) && (
                  <Link
                    href={getBookingLink(selectedConversation.bookingId)!}
                    className="shrink-0 text-xs font-semibold text-primary hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/20 bg-primary/5"
                  >
                    <HugeiconsIcon icon={Calendar01Icon} size={13} />
                    <span className="hidden sm:inline">View Booking</span>
                  </Link>
                )}
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[360px]">
                {isLoadingMessages ? (
                  <div className="m-auto text-xs text-muted-foreground">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="m-auto text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <HugeiconsIcon icon={Mail01Icon} size={22} />
                    </div>
                    <span className="font-semibold text-foreground">No messages yet</span>
                    <span className="text-[11px] max-w-xs">
                      Send a message below to coordinate regarding this booking or inquiry.
                    </span>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === userId
                    const showTime =
                      idx === messages.length - 1 ||
                      new Date(messages[idx + 1]?.createdAt).getTime() - new Date(msg.createdAt).getTime() > 300000

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[80%] sm:max-w-[70%]",
                          isMe ? "self-end items-end" : "self-start items-start"
                        )}
                      >
                        {!isMe && (
                          <span className="text-[10px] font-semibold text-muted-foreground mb-1 ml-1">
                            {msg.senderName} ({msg.senderRole})
                          </span>
                        )}

                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed shadow-2xs break-words",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-xs"
                              : "bg-muted text-foreground border border-border/60 rounded-bl-xs"
                          )}
                        >
                          {msg.body || msg.content}
                        </div>

                        {showTime && (
                          <span className="text-[10px] text-muted-foreground mt-1 mx-1 font-mono">
                            {formatTimestamp(msg.createdAt)}
                          </span>
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-border/80 flex items-center gap-2 bg-card/40"
              >
                <input
                  type="text"
                  placeholder="Type a message... (Press Enter to send)"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isSending}
                  className="flex-1 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputMessage.trim() || isSending}
                  className="rounded-xl px-4 h-9 gap-1.5 shrink-0 font-semibold"
                >
                  <HugeiconsIcon icon={SentIcon} size={15} />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="m-auto p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
              <div className="size-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                <HugeiconsIcon icon={Mail01Icon} size={28} />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Select a conversation
              </h3>
              <p className="text-xs max-w-xs leading-relaxed">
                Choose a conversation from the left to coordinate regarding rides, rentals, deliveries, or support.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
