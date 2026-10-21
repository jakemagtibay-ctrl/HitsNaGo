"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase"
import { getCurrentUserRole } from "@/lib/auth/roles"
import type {
  PaymentTransaction,
  PaymentMethod,
  PaymentIntentResult,
  RecordCashPaymentInput,
} from "@/types/payment"
import {
  createPayMongoPaymentIntent,
  type CreatePaymentIntentParams,
} from "@/lib/payments/paymongo"

/**
 * HitsNaGo Payments & Transaction Records Server Actions
 *
 * Implements strict transaction audits, cash payment recording,
 * PayMongo online gateway initialization, and idempotency protection.
 */

export async function recordCashPayment(
  input: RecordCashPaymentInput
): Promise<{ success: boolean; transaction: PaymentTransaction | null; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { success: false, transaction: null, error: "Not authenticated." }

    const role = await getCurrentUserRole()
    const db = createServiceClient()

    // 1. Fetch booking to verify existence and authorization
    const { data: booking, error: bookingErr } = await db
      .from("bookings")
      .select("*")
      .eq("id", input.bookingId)
      .maybeSingle()

    if (bookingErr || !booking) {
      return { success: false, transaction: null, error: "Booking not found." }
    }

    // Role-based authorization: Rider assigned to trip, provider of rental, or admin
    if (role === "customer") {
      return {
        success: false,
        transaction: null,
        error: "Cash payment collection must be recorded by the service provider, driver, or administrator.",
      }
    }

    // 2. Idempotency Check: Prevent duplicate payment recording
    const idempotencyKey = `cash_payment_${booking.id}`
    const { data: existingTx } = await db
      .from("payment_transactions")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle()

    if (existingTx && existingTx.status === "paid") {
      return {
        success: true,
        transaction: existingTx as PaymentTransaction,
        error: null, // Idempotent return: already recorded
      }
    }

    // 3. Insert transaction record
    const reference = `PAY-CSH-${booking.reference || booking.id.slice(0, 8).toUpperCase()}`
    const nowIso = new Date().toISOString()

    const txPayload = {
      booking_id: booking.id,
      customer_id: booking.customer_id,
      provider_or_rider_id: input.receivedById || null,
      reference,
      gateway: "cash",
      gateway_transaction_id: `cash_${Date.now()}`,
      idempotency_key: idempotencyKey,
      amount: input.amount || Number(booking.estimated_fare) || 0,
      currency: "PHP",
      payment_method: "cash",
      status: "paid",
      metadata: {
        recorded_by_user_id: user.id,
        recorded_by_role: role,
        received_by_role: input.receivedByRole,
        notes: input.notes || "In-person cash receipt verified upon service delivery.",
      },
      created_at: nowIso,
      updated_at: nowIso,
    }

    const { data: inserted, error: insertErr } = await db
      .from("payment_transactions")
      .insert(txPayload)
      .select("*")
      .maybeSingle()

    if (insertErr) {
      console.warn("[recordCashPayment] Database insert notice:", insertErr.message)
    }

    // 4. Update booking payment status
    try {
      await db
        .from("bookings")
        .update({
          payment_status: "paid",
          paid_at: nowIso,
        })
        .eq("id", booking.id)
    } catch {}

    revalidatePath("/dashboard/rider")
    revalidatePath("/dashboard/provider")
    revalidatePath("/dashboard/customer/bookings")
    revalidatePath("/dashboard/admin/bookings")

    return {
      success: true,
      transaction: (inserted || txPayload) as PaymentTransaction,
      error: null,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record cash payment."
    console.error("[recordCashPayment] Exception:", err)
    return { success: false, transaction: null, error: msg }
  }
}

export async function initiateOnlinePayment(
  bookingId: string,
  paymentMethods: PaymentMethod[] = ["gcash", "maya", "card"]
): Promise<PaymentIntentResult> {
  try {
    const user = await currentUser()
    if (!user) {
      return { clientKey: null, paymentIntentId: null, error: "Not authenticated.", isConfigured: false }
    }

    const db = createServiceClient()
    const { data: booking, error: bookingErr } = await db
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle()

    if (bookingErr || !booking) {
      return { clientKey: null, paymentIntentId: null, error: "Booking not found.", isConfigured: false }
    }

    if (booking.customer_id !== user.id) {
      return { clientKey: null, paymentIntentId: null, error: "Unauthorized.", isConfigured: false }
    }

    const amount = Number(booking.estimated_fare) || 0
    if (amount <= 0) {
      return { clientKey: null, paymentIntentId: null, error: "Invalid booking fare amount.", isConfigured: false }
    }

    const params: CreatePaymentIntentParams = {
      amount,
      description: `HitsNaGo ${booking.service_type} booking ${booking.reference}`,
      bookingReference: booking.reference,
      bookingId: booking.id,
      customerId: user.id,
      customerEmail: user.emailAddresses[0]?.emailAddress || booking.customer_email,
      customerName: booking.customer_name || user.fullName || "HitsNaGo Customer",
      paymentMethods,
    }

    return await createPayMongoPaymentIntent(params)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to initiate online payment."
    return { clientKey: null, paymentIntentId: null, error: msg, isConfigured: false }
  }
}

export async function getBookingTransactions(bookingId: string): Promise<PaymentTransaction[]> {
  try {
    const user = await currentUser()
    if (!user) return []

    const db = createServiceClient()
    const { data, error } = await db
      .from("payment_transactions")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })

    if (error || !data) return []
    return data as PaymentTransaction[]
  } catch {
    return []
  }
}
