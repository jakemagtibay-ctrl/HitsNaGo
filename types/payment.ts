export type PaymentMethod = "cash"

export type PaymentStatus = "pending" | "paid"

export interface PaymentTransaction {
  id: string
  bookingId: string
  customerId: string
  providerOrRiderId?: string | null
  reference: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  status: PaymentStatus
  notes?: string | null
  paidAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface RecordCashPaymentInput {
  bookingId: string
  amount: number
  receivedByRole?: "rider" | "provider" | "admin"
  receivedById?: string
  notes?: string
}

export interface BookingPaymentSummary {
  bookingId: string
  reference: string
  estimatedFare: number
  paymentMode: string
  paymentStatus: PaymentStatus
  paidAt: string | null
  transaction: PaymentTransaction | null
}
