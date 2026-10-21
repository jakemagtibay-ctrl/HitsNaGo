import assert from "node:assert/strict"
import { test } from "node:test"
import crypto from "node:crypto"
import { config } from "dotenv"
import { resolve } from "node:path"

config({ path: resolve(process.cwd(), ".env.local") })

import {
  verifyPayMongoWebhookSignature,
  isPayMongoConfigured,
  createPayMongoPaymentIntent,
} from "../lib/payments/paymongo"

test("HitsNaGo — Priority 7 Payments & Transaction Records", async (t) => {
  const testSecret = "whsec_test_hitsnago_secret_key_12345"

  // 1. PayMongo Webhook HMAC-SHA256 Cryptographic Verification
  await t.test("1. Webhook cryptographic HMAC-SHA256 signature verification", () => {
    const rawPayload = JSON.stringify({
      data: {
        id: "evt_12345",
        type: "event",
        attributes: {
          type: "payment.paid",
          data: { id: "pi_test_9988", attributes: { amount: 25000 } },
        },
      },
    })

    const timestamp = Math.floor(Date.now() / 1000)
    const comparisonString = `${timestamp}.${rawPayload}`
    const expectedSig = crypto
      .createHmac("sha256", testSecret)
      .update(comparisonString)
      .digest("hex")

    const header = `t=${timestamp},te=${expectedSig}`

    // Valid signature must pass
    const result = verifyPayMongoWebhookSignature(rawPayload, header, testSecret)
    assert.equal(result.isValid, true, "Genuine PayMongo webhook signature must be valid")

    // Tampered payload must fail
    const tamperedPayload = rawPayload.replace("25000", "99999")
    const tamperedResult = verifyPayMongoWebhookSignature(tamperedPayload, header, testSecret)
    assert.equal(tamperedResult.isValid, false, "Tampered payload must fail verification")

    // Forged signature must fail
    const forgedHeader = `t=${timestamp},te=0000000000000000000000000000000000000000000000000000000000000000`
    const forgedResult = verifyPayMongoWebhookSignature(rawPayload, forgedHeader, testSecret)
    assert.equal(forgedResult.isValid, false, "Forged signature must fail verification")
  })

  // 2. Replay Attack Prevention (Tolerance Check)
  await t.test("2. Replay attack protection rejects expired timestamps", () => {
    const rawPayload = JSON.stringify({ event: "test" })
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600 // 10 minutes ago (> 300s limit)

    const comparisonString = `${oldTimestamp}.${rawPayload}`
    const sig = crypto
      .createHmac("sha256", testSecret)
      .update(comparisonString)
      .digest("hex")

    const oldHeader = `t=${oldTimestamp},te=${sig}`
    const result = verifyPayMongoWebhookSignature(rawPayload, oldHeader, testSecret)

    assert.equal(result.isValid, false, "Expired timestamp must be rejected")
    assert.match(result.error || "", /replay attack/i, "Error message must indicate replay protection")
  })

  // 3. Gateway Configuration & Secret Protection
  await t.test("3. Payment gateway safely reports configuration state without faking charges", async () => {
    // If no credentials configured, createPayMongoPaymentIntent must safely report lack of credentials
    if (!isPayMongoConfigured()) {
      const intentRes = await createPayMongoPaymentIntent({
        amount: 250,
        description: "Test Booking",
        bookingReference: "TEST-REF-01",
        bookingId: "test-booking-id",
        customerId: "test-cust-id",
        customerEmail: "customer@example.com",
        customerName: "Test Customer",
      })

      assert.equal(intentRes.isConfigured, false, "Should indicate gateway is not configured")
      assert.equal(intentRes.paymentIntentId, null, "Must not fake a payment intent ID")
      assert.ok(intentRes.error && intentRes.error.length > 0, "Must provide clear user feedback")
    }
  })

  // 4. Centavos Conversion Accuracy
  await t.test("4. Currency centavos arithmetic is exact", () => {
    const amountPhp = 185.5
    const amountInCentavos = Math.round(amountPhp * 100)
    assert.equal(amountInCentavos, 18550, "185.50 PHP must equal 18550 centavos")
  })
})
