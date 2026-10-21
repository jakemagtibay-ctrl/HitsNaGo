import { NextResponse } from "next/server"
import { verifyPayMongoWebhookSignature } from "@/lib/payments/paymongo"
import { createServiceClient } from "@/lib/supabase"
import { sendSystemNotification } from "@/lib/actions/notifications"

/**
 * PayMongo Webhook Handler
 *
 * Verifies cryptographic HMAC-SHA256 signature, enforces idempotency,
 * updates transaction records, and alerts the customer/admin.
 */

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get("paymongo-signature")

    // 1. Verify cryptographic signature
    const verification = verifyPayMongoWebhookSignature(rawBody, signatureHeader)
    if (!verification.isValid) {
      console.warn("[PayMongo Webhook] Unauthorized request:", verification.error)
      return NextResponse.json(
        { error: verification.error || "Invalid webhook signature" },
        { status: 401 }
      )
    }

    const event = JSON.parse(rawBody)
    const eventType = event.data?.attributes?.type
    const resourceData = event.data?.attributes?.data

    if (!eventType || !resourceData) {
      return NextResponse.json({ message: "Ignored unhandled event structure" }, { status: 200 })
    }

    const db = createServiceClient()
    const paymentIntentId = resourceData.id
    const metadata = resourceData.attributes?.metadata || {}
    const bookingId = metadata.booking_id
    const customerId = metadata.customer_id
    const amountInCentavos = resourceData.attributes?.amount || 0
    const amountInPhp = amountInCentavos / 100
    const nowIso = new Date().toISOString()

    // 2. Event Dispatching with Idempotency
    if (eventType === "payment.paid") {
      const idempotencyKey = `paymongo_paid_${paymentIntentId}`

      // Check if already processed
      const { data: existing } = await db
        .from("payment_transactions")
        .select("id, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle()

      if (existing && existing.status === "paid") {
        return NextResponse.json({ message: "Event already processed (idempotent)" }, { status: 200 })
      }

      // Upsert transaction record
      await db.from("payment_transactions").upsert({
        booking_id: bookingId || null,
        customer_id: customerId || "unknown",
        reference: `PAY-PM-${paymentIntentId.slice(-8).toUpperCase()}`,
        gateway: "paymongo",
        gateway_transaction_id: paymentIntentId,
        idempotency_key: idempotencyKey,
        amount: amountInPhp,
        currency: "PHP",
        payment_method: resourceData.attributes?.source?.type || "gcash",
        status: "paid",
        metadata: {
          paymongo_event_id: event.data?.id,
          raw_attributes: resourceData.attributes,
        },
        updated_at: nowIso,
      })

      // Update booking payment status
      if (bookingId) {
        await db
          .from("bookings")
          .update({
            payment_status: "paid",
            paid_at: nowIso,
          })
          .eq("id", bookingId)

        // Notify customer
        if (customerId) {
          await sendSystemNotification({
            userId: customerId,
            userRole: "customer",
            title: "Payment Received",
            message: `Your payment of ₱${amountInPhp.toLocaleString("en-PH")} for booking has been confirmed.`,
            type: "booking",
            bookingId,
            actionUrl: "/dashboard/customer/bookings",
          })
        }
      }

      return NextResponse.json({ success: true, processed: "payment.paid" }, { status: 200 })
    }

    if (eventType === "payment.failed") {
      const idempotencyKey = `paymongo_failed_${paymentIntentId}`
      await db.from("payment_transactions").upsert({
        booking_id: bookingId || null,
        customer_id: customerId || "unknown",
        reference: `PAY-FL-${paymentIntentId.slice(-8).toUpperCase()}`,
        gateway: "paymongo",
        gateway_transaction_id: paymentIntentId,
        idempotency_key: idempotencyKey,
        amount: amountInPhp,
        currency: "PHP",
        payment_method: resourceData.attributes?.source?.type || "gcash",
        status: "failed",
        failure_reason: resourceData.attributes?.failed_code || "Payment transaction declined",
        updated_at: nowIso,
      })

      return NextResponse.json({ success: true, processed: "payment.failed" }, { status: 200 })
    }

    return NextResponse.json({ message: `Event ${eventType} received` }, { status: 200 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook handler exception"
    console.error("[PayMongo Webhook] Exception:", err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
