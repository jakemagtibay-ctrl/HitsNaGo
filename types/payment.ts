export type PaymentMethod = "cash" | "gcash" | "maya" | "card" | "qrph"

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded"

export type PaymentGateway = "cash" | "paymongo" | "manual_bank"

export interface PaymentTransaction {
  id: string
  bookingId: string
  customerId: string
  providerOrRiderId?: string | null
  reference: string
  gateway: PaymentGateway
  gatewayTransactionId?: string | null
  idempotencyKey: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  status: PaymentStatus
  failureReason?: string | null
  refundAmount?: number | null
  refundReason?: string | null
  refundedAt?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface PaymentIntentResult {
  clientKey: string | null
  paymentIntentId: string | null
  checkoutUrl?: string | null
  error: string | null
  isConfigured: boolean
}

export interface RecordCashPaymentInput {
  bookingId: string
  amount: number
  receivedByRole: "rider" | "provider" | "admin"
  receivedById: string
  notes?: string
}

export interface WebhookVerificationResult {
  isValid: boolean
  error?: string
}
