export type NotificationType =
  | "booking"
  | "verification"
  | "system"
  | "message"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: {
    bookingId?: string
    serviceType?: string
    verificationId?: string
    actionUrl?: string
    [key: string]: unknown
  }
  isRead: boolean
  createdAt: string
}
