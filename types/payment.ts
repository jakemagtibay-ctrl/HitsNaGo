// Cash payment method used for offline cash transactions
export type PaymentMethod = "cash"

// Tracking status of the cash transaction
export type PaymentStatus = "pending" | "paid"

// Record of a cash payment stored in the database
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

// Payload parameters for recording a cash payment received by a rider or provider
export interface RecordCashPaymentInput {
  bookingId: string
  amount: number
  receivedByRole?: "rider" | "provider" | "admin"
  receivedById?: string
  notes?: string
}

// Summary of payment status and transaction displayed on the booking details page
export interface BookingPaymentSummary {
  bookingId: string
  reference: string
  estimatedFare: number
  paymentMode: string
  paymentStatus: PaymentStatus
  paidAt: string | null
  transaction: PaymentTransaction | null
}

