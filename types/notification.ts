export type NotificationType =
  | "booking"
  | "verification"
  | "system"
  | "message"
  | "dispute"
  | "emergency"

export interface Notification {
  id: string
  userId: string
  userRole?: string
  type: NotificationType
  serviceType?: "ride" | "rental" | "delivery" | "general" | "support"
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

export interface NotificationBadgeCounts {
  // Messages / Inbox (all roles)
  messages: number
  // System / Activity Notifications (all roles)
  notifications: number

  // Service / Booking badges
  rides: number
  deliveries: number
  rentals: number
  bookings: number

  // Admin operational badges
  verification: number
  riders: number
  providers: number
  customers: number
  disputes: number
  reports: number
  reviews: number
  vehicles: number

  // Total summary for Dashboard
  totalActionable: number
}
