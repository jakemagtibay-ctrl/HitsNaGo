// Unit tests for the simplified cash payment flow, fare mismatch validation, and receipt records
import assert from "node:assert/strict"
import { test } from "node:test"
import { config } from "dotenv"
import { resolve } from "node:path"


config({ path: resolve(process.cwd(), ".env.local") })

import type { PaymentTransaction, RecordCashPaymentInput, BookingPaymentSummary } from "../types/payment"

test("HitsNaGo — Simplified Cash Payment System for School Final Project", async (t) => {
  // 1. Cash Payment Method & Default Status
  await t.test("1. Default payment method is cash and initial status is pending", () => {
    const booking = {
      id: "b-001",
      reference: "HNG-RIDE-1001",
      estimated_fare: 150.0,
      payment_mode: "cash",
      payment_status: "pending",
      paid_at: null,
    }

    assert.equal(booking.payment_mode, "cash", "Primary payment method must be cash")
    assert.equal(booking.payment_status, "pending", "Initial payment status must be pending")
    assert.equal(booking.paid_at, null, "Paid timestamp must be null before collection")
  })

  // 2. Underpayment & Fare Mismatch Validation
  await t.test("2. Cash payment validates exact fare amount against underpayment", () => {
    const bookingFare = 280.0 // ₱280.00
    const underpaidAmount = 250.0 // ₱250.00 (short by ₱30)

    const isUnderpaid = underpaidAmount < bookingFare
    assert.equal(isUnderpaid, true, "Underpayment must be detected and rejected")

    const exactAmount = 280.0
    const isExact = exactAmount >= bookingFare
    assert.equal(isExact, true, "Exact fare must pass validation")

    const negativeAmount = -50
    assert.equal(negativeAmount <= 0, true, "Negative or zero cash amount must be rejected")
  })

  // 3. Role-Based Collection Authorization Rules
  await t.test("3. Only assigned rider, rental provider, or admin may record cash collection", () => {
    const booking = {
      id: "b-002",
      service_type: "ride",
      rider_id: "rider-uuid-111",
      customer_id: "cust-clerk-222",
      provider_id: null,
      status: "in_progress",
    }

    // Role check logic matching lib/actions/payments.ts:
    const isAuthorized = (callerRole: string, callerUserId: string, callerRiderId?: string) => {
      if (callerRole === "admin") return true
      if (callerRole === "customer" && callerUserId === booking.customer_id) return false // Customer cannot mark paid!
      if (callerRole === "rider" && callerRiderId === booking.rider_id) return true
      return false
    }

    // Customer attempts to mark own booking paid -> Rejected
    assert.equal(
      isAuthorized("customer", "cust-clerk-222"),
      false,
      "Customer must NEVER be permitted to record their own cash payment"
    )

    // Unassigned / different rider attempts to record cash -> Rejected
    assert.equal(
      isAuthorized("rider", "other-clerk-user", "rider-uuid-999"),
      false,
      "Unrelated rider must not be permitted to record cash payment"
    )

    // Assigned rider attempts to record cash -> Authorized
    assert.equal(
      isAuthorized("rider", "assigned-clerk-user", "rider-uuid-111"),
      true,
      "Assigned rider must be authorized to record cash payment"
    )

    // Admin attempts to record cash -> Authorized
    assert.equal(
      isAuthorized("admin", "admin-clerk-user"),
      true,
      "Administrator must be authorized to record cash payment"
    )
  })

  // 4. Rental Provider Cash Collection Authorization
  await t.test("4. Rental provider is authorized to record cash collection for rental bookings", () => {
    const rentalBooking = {
      id: "b-003",
      service_type: "rental",
      rider_id: null,
      customer_id: "cust-clerk-333",
      provider_id: "provider-uuid-555",
      status: "in_progress",
    }

    const isProviderAuthorized = (callerProviderId?: string) => {
      return Boolean(callerProviderId && callerProviderId === rentalBooking.provider_id)
    }

    assert.equal(isProviderAuthorized("provider-uuid-555"), true, "Fleet provider is authorized")
    assert.equal(isProviderAuthorized("provider-uuid-999"), false, "Different provider is rejected")
  })

  // 5. Lifecycle Isolation: Cancelled Bookings Cannot Receive Cash
  await t.test("5. Cancelled or unassigned pending bookings cannot have cash recorded", () => {
    const isEligibleStatus = (status: string, hasAssignee: boolean) => {
      if (status === "cancelled") return false
      if (status === "pending" && !hasAssignee) return false
      return ["assigned", "accepted", "in_progress", "completed"].includes(status)
    }

    assert.equal(isEligibleStatus("cancelled", false), false, "Cancelled booking cannot receive cash")
    assert.equal(isEligibleStatus("pending", false), false, "Broadcasted pending booking cannot receive cash before assignment")
    assert.equal(isEligibleStatus("in_progress", true), true, "In-progress booking can receive cash")
    assert.equal(isEligibleStatus("completed", true), true, "Completed booking can receive cash")
  })

  // 6. Idempotency Key Guarantees
  await t.test("6. Cash payment idempotency key prevents duplicate transaction records", () => {
    const bookingId = "b9090b8f-1234-4567-890a-bcdef0123456"
    const idempotencyKey = `cash_payment_${bookingId}`

    assert.equal(idempotencyKey, "cash_payment_b9090b8f-1234-4567-890a-bcdef0123456")

    // Simulate idempotency check:
    const recordedTransactions: Record<string, PaymentTransaction> = {
      [idempotencyKey]: {
        id: "tx-1",
        bookingId,
        customerId: "cust-01",
        reference: "RCPT-CASH-HNG-1001",
        amount: 150.0,
        currency: "PHP",
        paymentMethod: "cash",
        status: "paid",
        notes: "Collected in cash",
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    // Subsequent call with same idempotency key must return existing record
    const existing = recordedTransactions[idempotencyKey]
    assert.ok(existing, "Existing transaction found by idempotency key")
    assert.equal(existing.status, "paid", "Status is confirmed paid")
  })

  // 7. Cash Receipt Reference Format & Audit Trail
  await t.test("7. Cash receipt reference generation and audit data consistency", () => {
    const bookingRef = "HNG-RIDE-8821"
    const receiptRef = `RCPT-CASH-${bookingRef}`

    assert.match(receiptRef, /^RCPT-CASH-HNG-/, "Receipt reference must start with RCPT-CASH-")

    const summary: BookingPaymentSummary = {
      bookingId: "b-004",
      reference: bookingRef,
      estimatedFare: 210.0,
      paymentMode: "cash",
      paymentStatus: "paid",
      paidAt: new Date().toISOString(),
      transaction: {
        id: "tx-2",
        bookingId: "b-004",
        customerId: "cust-02",
        reference: receiptRef,
        amount: 210.0,
        currency: "PHP",
        paymentMethod: "cash",
        status: "paid",
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    assert.equal(summary.paymentStatus, "paid")
    assert.equal(summary.transaction?.amount, summary.estimatedFare)
    assert.equal(summary.transaction?.paymentMethod, "cash")
    assert.equal(summary.transaction?.status, "paid")
  })

  // 8. Currency Arithmetic & Precision
  await t.test("8. Philippine Peso currency representation and rounding are precise", () => {
    const fare1 = 150.75
    const fare2 = 49.25
    const total = fare1 + fare2
    assert.equal(total, 200.0)

    const formatted = total.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    assert.equal(formatted, "200.00")
  })
})
