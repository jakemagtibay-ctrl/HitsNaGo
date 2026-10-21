import type { SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase"

export const VERIFICATION_BUCKET = "verification-documents"
export const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024 // 5MB limit
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

/**
 * Validates the file buffer magic bytes (file signature) to ensure
 * the upload matches a genuine JPEG, PNG, or WebP image.
 */
export function validateImageSignature(buffer: Buffer): { valid: boolean; detectedMime?: AllowedMimeType } {
  if (!buffer || buffer.length < 12) {
    return { valid: false }
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" }
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: "image/png" }
  }

  // WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  const isRiff =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 // 'RIFF'
  const isWebp =
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50 // 'WEBP'
  if (isRiff && isWebp) {
    return { valid: true, detectedMime: "image/webp" }
  }

  return { valid: false }
}

/**
 * Ensures the private verification storage bucket exists and is private.
 */
export async function ensureVerificationBucket(db: SupabaseClient): Promise<void> {
  try {
    const { data: buckets } = await db.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.id === VERIFICATION_BUCKET || b.name === VERIFICATION_BUCKET)

    if (!bucketExists) {
      await db.storage.createBucket(VERIFICATION_BUCKET, {
        public: false,
        fileSizeLimit: MAX_DOCUMENT_FILE_SIZE,
        allowedMimeTypes: [...ALLOWED_MIME_TYPES],
      })
    }
  } catch (err) {
    // Non-fatal if bucket is already present or permissions restricted
    console.warn("[ensureVerificationBucket] Notice:", err instanceof Error ? err.message : err)
  }
}

export interface UploadDocumentParams {
  file: File
  role: "rider" | "provider"
  userId: string
  side: "front" | "back"
}

export interface UploadDocumentResult {
  path: string | null
  error: string | null
}

/**
 * Server-side document upload handler. Validates file size, MIME type,
 * and binary magic bytes before streaming to private Supabase storage.
 */
export async function uploadVerificationDocument({
  file,
  role,
  userId,
  side,
}: UploadDocumentParams): Promise<UploadDocumentResult> {
  try {
    if (!file || file.size === 0) {
      return { path: null, error: `Please select a clear photo for the ${side} of your ID.` }
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      return {
        path: null,
        error: `The ${side} image exceeds the 5MB file size limit. Please upload an image under 5MB.`,
      }
    }

    // MIME type check
    const mime = file.type?.toLowerCase() as AllowedMimeType
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      return {
        path: null,
        error: `Invalid file format (${file.type || "unknown"}). Only JPG, PNG, and WebP images are accepted.`,
      }
    }

    // Binary file signature check
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const sigCheck = validateImageSignature(buffer)

    if (!sigCheck.valid) {
      return {
        path: null,
        error: `File signature validation failed for ${side} image. Please upload a genuine JPG, PNG, or WebP photo.`,
      }
    }

    const db = createServiceClient()
    await ensureVerificationBucket(db)

    const ext = sigCheck.detectedMime === "image/png" ? "png" : sigCheck.detectedMime === "image/webp" ? "webp" : "jpg"
    const timestamp = Date.now()
    const randomSuffix = crypto.randomUUID().slice(0, 8)
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_")
    const storagePath = `${role}/${sanitizedUserId}/${timestamp}_${side}_${randomSuffix}.${ext}`

    const { error: uploadError } = await db.storage
      .from(VERIFICATION_BUCKET)
      .upload(storagePath, buffer, {
        contentType: sigCheck.detectedMime,
        upsert: true,
      })

    if (uploadError) {
      return { path: null, error: `Failed to store ${side} image: ${uploadError.message}` }
    }

    return { path: storagePath, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process document upload."
    return { path: null, error: msg }
  }
}

/**
 * Creates short-lived signed URLs for authorized document viewing.
 * URLs expire after expiresInSeconds (default 600s / 10 minutes).
 */
export async function getDocumentSignedUrl(
  path: string,
  expiresInSeconds = 600
): Promise<{ signedUrl: string | null; error: string | null }> {
  try {
    if (!path) return { signedUrl: null, error: "Empty document path" }

    const db = createServiceClient()
    const { data, error } = await db.storage
      .from(VERIFICATION_BUCKET)
      .createSignedUrl(path, expiresInSeconds)

    if (error || !data?.signedUrl) {
      return { signedUrl: null, error: error?.message || "Could not generate signed URL" }
    }

    return { signedUrl: data.signedUrl, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate signed URL"
    return { signedUrl: null, error: msg }
  }
}
