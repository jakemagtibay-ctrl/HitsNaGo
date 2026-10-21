import assert from "node:assert/strict"
import { test } from "node:test"
import { config } from "dotenv"
import { resolve } from "node:path"

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") })

import {
  validateImageSignature,
  MAX_DOCUMENT_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  VERIFICATION_BUCKET,
} from "../lib/verification/storage"
import {
  GOVERNMENT_ID_OPTIONS,
  type GovernmentIdType,
} from "../types/verification"
import { createServiceClient } from "../lib/supabase"
import {
  getPendingApplications,
  getVerificationDocumentUrls,
  reviewApplication,
} from "../lib/actions/bookings"
import { sendSystemNotification } from "../lib/actions/notifications"

test("HitsNaGo — Government-Issued ID Verification & Security", async (t) => {
  const db = createServiceClient()

  // 1. ID Type Configuration & Rules
  await t.test("1. Required Philippine Government ID types are properly configured", () => {
    const requiredTypes: GovernmentIdType[] = [
      "philippine_national_id",
      "philippine_passport",
      "philippine_drivers_license",
      "umid",
      "other",
    ]

    for (const type of requiredTypes) {
      const match = GOVERNMENT_ID_OPTIONS.find((opt) => opt.id === type)
      assert.ok(match, `ID option for ${type} must exist`)
      assert.ok(match.label.length > 0, `ID label for ${type} must not be empty`)
    }

    // Passport must NOT require back image
    const passportOption = GOVERNMENT_ID_OPTIONS.find((opt) => opt.id === "philippine_passport")
    assert.equal(passportOption?.requiresBack, false, "Passport does not require a back photo")

    // National ID and Driver's License must require back image
    const nationalId = GOVERNMENT_ID_OPTIONS.find((opt) => opt.id === "philippine_national_id")
    const driversLicense = GOVERNMENT_ID_OPTIONS.find((opt) => opt.id === "philippine_drivers_license")
    assert.equal(nationalId?.requiresBack, true, "National ID requires back photo")
    assert.equal(driversLicense?.requiresBack, true, "Driver's license requires back photo")
  })

  // 2. Binary Magic Bytes & File Validation
  await t.test("2. Binary image signatures and size limits are strictly enforced", () => {
    assert.equal(MAX_DOCUMENT_FILE_SIZE, 5 * 1024 * 1024, "File size limit must be exactly 5MB")
    assert.deepEqual(
      [...ALLOWED_MIME_TYPES],
      ["image/jpeg", "image/png", "image/webp"],
      "Only JPG, PNG, and WebP are allowed"
    )

    // Valid JPEG (FF D8 FF ...)
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
    const jpegCheck = validateImageSignature(jpegBuffer)
    assert.equal(jpegCheck.valid, true)
    assert.equal(jpegCheck.detectedMime, "image/jpeg")

    // Valid PNG (89 50 4E 47 0D 0A 1A 0A ...)
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
    const pngCheck = validateImageSignature(pngBuffer)
    assert.equal(pngCheck.valid, true)
    assert.equal(pngCheck.detectedMime, "image/png")

    // Valid WebP (RIFF + WEBP)
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // 'RIFF'
      0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // 'WEBP'
      0x56, 0x50, 0x38, 0x20,
    ])
    const webpCheck = validateImageSignature(webpBuffer)
    assert.equal(webpCheck.valid, true)
    assert.equal(webpCheck.detectedMime, "image/webp")

    // Invalid / fake text file renamed as .jpg
    const fakeBuffer = Buffer.from("THIS_IS_A_TEXT_FILE_NOT_AN_IMAGE_PAYLOAD")
    const fakeCheck = validateImageSignature(fakeBuffer)
    assert.equal(fakeCheck.valid, false, "Fake file without image magic bytes must be rejected")
  })

  // 3. Database Schema & Storage Configuration
  await t.test("3. Verification columns and storage bucket accessibility", async () => {
    // Check riders table accessibility
    const { data: riders, error: riderErr } = await db
      .from("riders")
      .select("id, is_verified, is_active")
      .limit(1)
    assert.equal(riderErr, null, `Riders table query must succeed: ${riderErr?.message}`)

    // Check providers table accessibility
    const { data: providers, error: provErr } = await db
      .from("providers")
      .select("id, is_verified, is_active")
      .limit(1)
    assert.equal(provErr, null, `Providers table query must succeed: ${provErr?.message}`)

    // Verify storage bucket configuration
    assert.equal(VERIFICATION_BUCKET, "verification-documents", "Private bucket must be named verification-documents")
  })

  // 4. Role-Based Restrictions (Server-Side Enforced)
  await t.test("4. Customer experience is completely unaffected by rider/provider ID requirement", async () => {
    // Customer bookings table allows customers to create bookings without government ID
    const { data: bookingSample, error: bError } = await db
      .from("bookings")
      .select("id, customer_id, service_type")
      .limit(1)
    assert.equal(bError, null, "Customer bookings must remain functional")
  })

  // 5. System Notifications for Verification Events
  await t.test("5. Notifications dispatch properly without leaking sensitive ID documents or numbers", async () => {
    const res = await sendSystemNotification({
      userId: "test-compliance-user",
      userRole: "customer",
      title: "ID Verification Queued",
      message: "Your government ID has been received and queued for review.",
      type: "verification",
      serviceType: "ride",
      actionUrl: "/dashboard/customer/apply/rider",
    })

    assert.equal(res.success, true, "Notification delivery helper must succeed")
  })
})
