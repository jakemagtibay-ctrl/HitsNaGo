"use client"

// Messaging inbox layout rendering conversations list alongside active chat threads and composer
import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"

import { useUser } from "@clerk/nextjs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Message01Icon,
  SentIcon,
  ArrowLeft01Icon,
  Calendar01Icon,
  ReloadIcon,
  Add01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  createSupportConversation,
} from "@/lib/actions/messaging"
import type { ConversationSummary, MessageItem } from "@/types/messaging"
import type { UserRole } from "@/types/user"
import { cn } from "@/lib/utils"

interface InboxViewProps {
  initialConversationId?: string
  role: UserRole
}

export function InboxView({ initialConversationId, role }: InboxViewProps) {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const urlConvId = searchParams.get("conversationId")
  const urlBookingId = searchParams.get("bookingId")

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId || urlConvId || null
  )
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [isLoadingConvs, setIsLoadingConvs] = useState(true)
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [inputText, setInputText] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewSupportModal, setShowNewSupportModal] = useState(false)
  const [supportSubject, setSupportSubject] = useState("")
  const [supportMessage, setSupportMessage] = useState("")
  const [isCreatingSupport, setIsCreatingSupport] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load conversations
  const loadConversations = useCallback(async (selectFirstIfNone = false) => {
    const res = await getUserConversations()
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setConversations(res.conversations)
      if (urlConvId && res.conversations.some((c) => c.id === urlConvId)) {
        setActiveConversationId(urlConvId)
      } else if (urlBookingId) {
        const matched = res.conversations.find((c) => c.bookingId === urlBookingId)
        if (matched) setActiveConversationId(matched.id)
      } else if (selectFirstIfNone && !activeConversationId && res.conversations.length > 0) {
        setActiveConversationId(res.conversations[0].id)
      }
    }
    setIsLoadingConvs(false)
  }, [activeConversationId, urlConvId, urlBookingId])

  useEffect(() => {
    let isCancelled = false
    Promise.resolve().then(() => {
      if (!isCancelled) loadConversations(true)
    })
    // Poll conversation list every ~15 seconds, pause when tab is hidden
    const interval = setInterval(() => {
      if (!isCancelled && typeof document !== "undefined" && !document.hidden) {
        loadConversations(false)
      }
    }, 15000)
    return () => {
      isCancelled = true
      clearInterval(interval)
    }
  }, [loadConversations])

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (convId: string) => {
    setIsLoadingMsgs(true)
    setErrorMsg(null)
    const res = await getConversationMessages(convId)
    if (res.error) {
      setErrorMsg(res.error)
    } else {
      setMessages(res.messages)
      setTimeout(scrollToBottom, 100)
    }
    setIsLoadingMsgs(false)
  }, [])

  useEffect(() => {
    let isCancelled = false
    if (activeConversationId) {
      Promise.resolve().then(() => {
        if (!isCancelled) loadMessages(activeConversationId)
      })
      // Poll active conversation messages every 5 seconds, pause when tab is hidden
      const interval = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return
        getConversationMessages(activeConversationId).then((res) => {
          if (!isCancelled && !res.error && res.messages) {
            setMessages(res.messages)
          }
        })
      }, 5000)
      return () => {
        isCancelled = true
        clearInterval(interval)
      }
    }
  }, [activeConversationId, loadMessages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!activeConversationId || !inputText.trim() || isSending) return

    const content = inputText.trim()
    setIsSending(true)
    setInputText("")

    // Optimistic message
    const tempId = `temp-${Date.now()}`
    const optimisticMsg: MessageItem = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: user?.id || "me",
      senderName: user?.fullName || user?.firstName || "You",
      senderRole: role,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setTimeout(scrollToBottom, 50)

    const res = await sendMessage(activeConversationId, content)
    if (res.error) {
      setErrorMsg(res.error)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } else if (res.message) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message! : m)))
      loadConversations(false)
    }
    setIsSending(false)
  }

  const handleCreateSupport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supportMessage.trim()) return

    setIsCreatingSupport(true)
    const res = await createSupportConversation(supportSubject || "Support Request", supportMessage)
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.conversationId) {
      setShowNewSupportModal(false)
      setSupportSubject("")
      setSupportMessage("")
      await loadConversations(false)
      setActiveConversationId(res.conversationId)
    }
    setIsCreatingSupport(false)
  }

  const activeConv = conversations.find((c) => c.id === activeConversationId)

  const filteredConvs = conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.booking?.reference && c.booking.reference.toLowerCase().includes(q)) ||
      c.participants.some((p) => p.userName.toLowerCase().includes(q))
    )
  })

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-10rem)] min-h-[500px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Messages &amp; Inbox
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time verified communication between customers, assigned riders, and administrators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadConversations(false)}
            className="h-8 text-xs gap-1.5"
            title="Refresh inbox"
          >
            <HugeiconsIcon icon={ReloadIcon} size={13} />
            <span>Refresh</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowNewSupportModal(true)}
            className="h-8 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground shadow-xs"
          >
            <HugeiconsIcon icon={Add01Icon} size={14} />
            <span>Support Chat</span>
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-destructive font-bold">
            ×
          </button>
        </div>
      )}

      {/* Main Inbox Card */}
      <Card className="flex-1 overflow-hidden border border-border/70 bg-card shadow-xs flex">
        {/* Left column: Conversation list */}
        <div
          className={cn(
            "w-full sm:w-80 md:w-96 flex flex-col border-r border-border/60 bg-muted/10 shrink-0",
            activeConversationId && "hidden sm:flex"
          )}
        >
          {/* Search bar */}
          <div className="p-3 border-b border-border/60">
            <input
              type="text"
              placeholder="Search conversations or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {isLoadingConvs ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <span className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <HugeiconsIcon icon={Message01Icon} size={32} className="text-muted-foreground/40" />
                <span className="font-semibold text-foreground">No conversations yet</span>
                <p className="text-[11px] max-w-[200px]">
                  Book a ride or start a support chat to communicate with drivers and administrators.
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const isActive = conv.id === activeConversationId
                const otherParticipants = conv.participants.filter((p) => p.userId !== user?.id)
                const participantNames =
                  otherParticipants.map((p) => p.userName).join(", ") || "Support Dispatch"

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConversationId(conv.id)}
                    className={cn(
                      "w-full p-3.5 text-left transition-colors flex flex-col gap-1.5 hover:bg-muted/40",
                      isActive && "bg-primary/[0.06] border-l-3 border-l-primary"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-heading text-xs font-bold text-foreground truncate">
                          {participantNames}
                        </span>
                        {otherParticipants[0] && (
                          <Badge variant="outline" className="text-[9px] uppercase px-1 h-3.5 border-border">
                            {otherParticipants[0].userRole}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {conv.lastMessage
                          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    {conv.booking && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0 h-4">
                          {conv.booking.reference}
                        </Badge>
                        <span className="capitalize">{conv.booking.serviceType}</span>
                        <span>•</span>
                        <span className="capitalize text-teal-600 dark:text-teal-400 font-medium">
                          {conv.booking.status}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage ? conv.lastMessage.content : "No messages yet"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right column: Active conversation thread */}
        <div className={cn("flex-1 flex flex-col bg-background min-w-0", !activeConversationId && "hidden sm:flex")}>
          {activeConv ? (
            <>
              {/* Thread header */}
              <div className="flex items-center justify-between border-b border-border/60 p-3 sm:px-4 bg-muted/15 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(null)}
                    className="sm:hidden p-1 rounded-lg text-muted-foreground hover:bg-muted"
                    aria-label="Back to conversations"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
                  </button>

                  <div className="flex flex-col min-w-0">
                    <span className="font-heading text-xs sm:text-sm font-bold text-foreground truncate">
                      {activeConv.title || "Trip Conversation"}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>
                        {activeConv.participants.map((p) => `${p.userName} (${p.userRole})`).join(" • ")}
                      </span>
                    </div>
                  </div>
                </div>

                {activeConv.booking && (
                  <div className="hidden md:flex items-center gap-2 border border-border/80 bg-card rounded-xl px-2.5 py-1 text-xs">
                    <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-primary" />
                    <span className="font-mono font-semibold">{activeConv.booking.reference}</span>
                    <Badge variant="outline" className="text-[10px] uppercase border-teal-500/30 text-teal-600">
                      {activeConv.booking.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMsgs ? (
                  <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <span className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                    <span>No messages in this conversation yet. Send the first message below.</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex flex-col gap-1 max-w-[82%] sm:max-w-[70%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                      >
                        {!isMe && (
                          <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
                            <span className="font-bold text-foreground">{msg.senderName}</span>
                            <Badge variant="outline" className="text-[9px] uppercase px-1 h-3.5">
                              {msg.senderRole}
                            </Badge>
                          </div>
                        )}

                        <div
                          className={cn(
                            "rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs break-words",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-xs"
                              : "bg-muted/70 text-foreground border border-border/70 rounded-bl-xs"
                          )}
                        >
                          {msg.content}
                        </div>

                        <span className="text-[10px] text-muted-foreground/70 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Read-only notice or Message composer */}
              {activeConv?.booking && (activeConv.booking.status === "completed" || activeConv.booking.status === "cancelled") ? (
                <div className="p-3 border-t border-border/60 bg-muted/30 text-center flex flex-col items-center justify-center gap-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    This trip has ended ({activeConv.booking.status}).
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">
                    New messages are disabled for this booking. You can still view message history.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="p-3 border-t border-border/60 bg-muted/10 flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      placeholder="Type your message... (Shift+Enter for newline)"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      maxLength={2000}
                      disabled={isSending}
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none disabled:opacity-50"
                    />
                    <span className="absolute bottom-1 right-2 text-[9px] text-muted-foreground pointer-events-none">
                      {inputText.length}/2000
                    </span>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputText.trim() || isSending}
                    className="h-10 px-4 font-semibold shadow-xs gap-1.5 shrink-0 bg-primary text-primary-foreground"
                  >
                    {isSending ? (
                      <span className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <span>Send</span>
                        <HugeiconsIcon icon={SentIcon} size={15} />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-3">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <HugeiconsIcon icon={Message01Icon} size={24} />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h3 className="font-heading font-bold text-foreground text-sm">Select a Conversation</h3>
                <p className="text-xs">
                  Choose a conversation from the list on the left to review messages or start a new support conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* New Support Modal */}
      {showNewSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <Card className="w-full max-w-md border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Message01Icon} size={18} className="text-primary" />
                  <h3 className="font-heading font-bold text-foreground text-sm">Contact Support / Admin</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewSupportModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateSupport} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-foreground">Subject / Concern</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Question about rider dispatch or route"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-foreground">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe how we can assist you..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    maxLength={2000}
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewSupportModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreatingSupport || !supportMessage.trim()}
                    className="text-xs font-semibold bg-primary text-primary-foreground shadow-xs gap-1.5"
                  >
                    {isCreatingSupport ? "Opening Thread..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
