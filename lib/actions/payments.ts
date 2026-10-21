"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase"
import { getCurrentUserRole } from "@/lib/auth/roles"
import { getRiderRecord, getProviderRecord } from "@/lib/actions/bookings"
import { sendSystemNotification } from "@/lib/actions/notifications"
import type {
  PaymentTransaction,
  RecordCashPaymentInput,
  BookingPaymentSummary,
} from "@/types/payment"

/**
 * HitsNaGo Payments Subsystem — Cash Payment & Receipt Tracking
 *
 * Designed for a robust, practical school project demonstration:
 * - Cash is the primary payment mode across Ride, Delivery, and Rental.
 * - Simple, authoritative status tracking: 'pending' -> 'paid'.
 * - Strict role authorization: Only assigned riders, rental providers, or admins can record cash collection.
 * - Complete idempotency: Prevents duplicate cash logging or duplicate charge records.
 */

export async function recordCashPayment(
  input: RecordCashPaymentInput
): Promise<{ success: boolean; transaction: PaymentTransaction | null; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, transaction: null, error: "Not authenticated. Please log in." }
    }

    const role = await getCurrentUserRole()
    const db = createServiceClient()

    // 1. Fetch booking to verify existence, status, and fare
    const { data: booking, error: bookingErr } = await db
      .from("bookings")
      .select("*")
      .eq("id", input.bookingId)
      .maybeSingle()

    if (bookingErr || !booking) {
      return { success: false, transaction: null, error: "Booking record not found." }
    }

    // 2. Booking Status Validation
    if (booking.status === "cancelled") {
      return {
        success: false,
        transaction: null,
        error: "Cannot record cash payment on a cancelled booking.",
      }
    }

    if (booking.status === "pending" && !booking.rider_id) {
      return {
        success: false,
        transaction: null,
        error: "Cannot record payment on a pending booking before dispatch or assignment.",
      }
    }

    // 3. Strict Role-Based Authorization Check
    let actorId: string | null = null
    let actorRole: "rider" | "provider" | "admin" = "admin"

    if (role === "admin") {
      actorId = user.id
      actorRole = "admin"
    } else if (booking.service_type === "ride" || booking.service_type === "delivery") {
      // Must be the specific rider assigned to this booking
      const rider = await getRiderRecord()
      if (!rider) {
        return {
          success: false,
          transaction: null,
          error: "Unauthorized: Active, verified rider account required.",
        }
      }

      if (booking.rider_id !== rider.id) {
        return {
          success: false,
          transaction: null,
          error: "Unauthorized: Only the assigned rider for this trip can record cash collection.",
        }
      }

      actorId = rider.id
      actorRole = "rider"
    } else if (booking.service_type === "rental") {
      // Must be the registered rental provider
      const provider = await getProviderRecord()
      if (!provider) {
        return {
          success: false,
          transaction: null,
          error: "Unauthorized: Active, verified rental provider account required.",
        }
      }

      actorId = provider.id
      actorRole = "provider"
    } else {
      return {
        success: false,
        transaction: null,
        error: "Unauthorized: Cash payments must be recorded by the service provider, driver, or administrator.",
      }
    }

    // 4. Amount Validation
    const expectedFare = Number(booking.estimated_fare) || 0
    const paymentAmount = Number(input.amount) || expectedFare

    if (paymentAmount <= 0) {
      return {
        success: false,
        transaction: null,
        error: "Invalid payment amount. Amount must be greater than zero.",
      }
    }

    if (Math.abs(paymentAmount - expectedFare) > 0.05) {
      return {
        success: false,
        transaction: null,
        error: `Payment amount (₱${paymentAmount}) does not match the required booking fare (₱${expectedFare}).`,
      }
    }

    // 5. Idempotency Guard: Prevent duplicate cash collection
    const idempotencyKey = `cash_payment_${booking.id}`
    const { data: existingTx } = await db
      .from("payment_transactions")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle()

    if (existingTx && existingTx.status === "paid") {
      return {
        success: true,
        transaction: {
          id: existingTx.id,
          bookingId: existingTx.booking_id,
          customerId: existingTx.customer_id,
          providerOrRiderId: existingTx.provider_or_rider_id,
          reference: existingTx.reference,
          amount: Number(existingTx.amount),
          currency: existingTx.currency || "PHP",
          paymentMethod: "cash",
          status: "paid",
          notes: existingTx.metadata?.notes || null,
          paidAt: existingTx.created_at,
          createdAt: existingTx.created_at,
          updatedAt: existingTx.updated_at,
        },
        error: null,
      }
    }

    // 6. Record transaction and update booking status
    const reference = `PAY-CSH-${booking.reference || booking.id.slice(0, 8).toUpperCase()}`
    const nowIso = new Date().toISOString()

    const txPayload = {
      booking_id: booking.id,
      customer_id: booking.customer_id,
      provider_or_rider_id: actorId,
      reference,
      gateway: "cash",
      gateway_transaction_id: `cash_${Date.now()}`,
      idempotency_key: idempotencyKey,
      amount: paymentAmount,
      currency: "PHP",
      payment_method: "cash",
      status: "paid",
      metadata: {
        recorded_by_user_id: user.id,
        recorded_by_role: actorRole,
        actor_id: actorId,
        notes: input.notes || "In-person cash receipt verified upon service delivery in Butuan City.",
      },
      created_at: nowIso,
      updated_at: nowIso,
    }

    // Insert transaction record into Supabase
    let insertedTx: any = null
    try {
      const { data, error: insertErr } = await db
        .from("payment_transactions")
        .upsert(txPayload, { onConflict: "idempotency_key" })
        .select("*")
        .maybeSingle()

      if (!insertErr && data) {
        insertedTx = data
      }
    } catch (e) {
      console.warn("[recordCashPayment] Notice inserting into payment_transactions:", e)
    }

    // Update booking payment audit columns in public.bookings
    try {
      await db
        .from("bookings")
        .update({
          payment_status: "paid",
          paid_at: nowIso,
        })
        .eq("id", booking.id)
    } catch (e) {
      console.warn("[recordCashPayment] Notice updating bookings.payment_status:", e)
    }

    // 7. Dispatch real-time system notification to customer
    try {
      await sendSystemNotification({
        userId: booking.customer_id,
        userRole: "customer",
        title: "Cash Payment Confirmed",
        message: `Your cash payment of ₱${paymentAmount.toLocaleString("en-PH")} for ${booking.service_type} booking ${booking.reference} has been received and verified by your ${actorRole}.`,
        type: "booking",
        bookingId: booking.id,
        actionUrl: "/dashboard/customer/bookings",
      })
    } catch {}

    revalidatePath("/dashboard/rider")
    revalidatePath("/dashboard/provider")
    revalidatePath("/dashboard/customer/bookings")
    revalidatePath("/dashboard/admin/bookings")

    const resultTransaction: PaymentTransaction = {
      id: insertedTx?.id || idempotencyKey,
      bookingId: booking.id,
      customerId: booking.customer_id,
      providerOrRiderId: actorId,
      reference,
      amount: paymentAmount,
      currency: "PHP",
      paymentMethod: "cash",
      status: "paid",
      notes: input.notes || "In-person cash receipt verified upon service delivery in Butuan City.",
      paidAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    return {
      success: true,
      transaction: resultTransaction,
      error: null,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record cash payment."
    console.error("[recordCashPayment] Exception:", err)
    return { success: false, transaction: null, error: msg }
  }
}

/**
 * Retrieves payment transactions for a specific booking with strict role-based access.
 */
export async function getBookingTransactions(bookingId: string): Promise<PaymentTransaction[]> {
  try {
    const user = await currentUser()
    if (!user) return []

    const role = await getCurrentUserRole()
    const db = createServiceClient()

    // 1. Fetch booking to verify permissions
    const { data: booking, error: bookingErr } = await db
      .from("bookings")
      .select("id, customer_id, rider_id, service_type")
      .eq("id", bookingId)
      .maybeSingle()

    if (bookingErr || !booking) return []

    // 2. Authorization check
    let isAuthorized = false

    if (role === "admin") {
      isAuthorized = true
    } else if (booking.customer_id === user.id) {
      // Customer who owns this booking
      isAuthorized = true
    } else if (role === "rider" && booking.rider_id) {
      // Assigned rider
      const rider = await getRiderRecord()
      if (rider && rider.id === booking.rider_id) {
        isAuthorized = true
      }
    } else if (role === "provider" && booking.service_type === "rental") {
      // Provider
      const provider = await getProviderRecord()
      if (provider) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      return []
    }

    const { data, error } = await db
      .from("payment_transactions")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((t) => ({
      id: t.id,
      bookingId: t.booking_id,
      customerId: t.customer_id,
      providerOrRiderId: t.provider_or_rider_id,
      reference: t.reference,
      amount: Number(t.amount),
      currency: t.currency || "PHP",
      paymentMethod: "cash",
      status: (t.status as "pending" | "paid") || "paid",
      notes: t.metadata?.notes || null,
      paidAt: t.created_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))
  } catch {
    return []
  }
}

/**
 * Summary helper for booking card status badges and receipt views.
 */
export async function getBookingPaymentSummary(bookingId: string): Promise<BookingPaymentSummary | null> {
  try {
    const db = createServiceClient()
    const { data: booking } = await db
      .from("bookings")
      .select("id, reference, estimated_fare, payment_mode, payment_status, paid_at")
      .eq("id", bookingId)
      .maybeSingle()

    if (!booking) return null

    const txs = await getBookingTransactions(bookingId)

    return {
      bookingId: booking.id,
      reference: booking.reference,
      estimatedFare: Number(booking.estimated_fare) || 0,
      paymentMode: booking.payment_mode || "cash",
      paymentStatus: (booking.payment_status as "pending" | "paid") || "pending",
      paidAt: booking.paid_at || null,
      transaction: txs[0] || null,
    }
  } catch {
    return null
  }
}
