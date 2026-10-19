import { createClient } from "@supabase/supabase-js"

/**
 * Sanitizes and normalizes the Supabase project URL.
 * Ensures the URL is strictly in the format https://<project-ref>.supabase.co,
 * stripping Markdown formatting, trailing /rest/v1 paths, and trailing slashes.
 */
export function cleanSupabaseUrl(url?: string): string {
  if (!url) return ""
  let cleaned = url.trim()

  // Remove markdown link syntax if present e.g. [text](https://...) or <https://...>
  const mdMatch = cleaned.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/)
  if (mdMatch) {
    cleaned = mdMatch[1]
  } else {
    cleaned = cleaned.replace(/^<|>$/g, "").trim()
  }

  // Strip trailing /rest/v1 or /rest/v1/ and any trailing slashes
  return cleaned.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "")
}

/**
 * Safely sanitizes a URL for logging by redacting sensitive parameters.
 * Credentials like the service-role key are passed via HTTP headers and are never logged.
 */
export function sanitizeUrlForLogging(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    const sensitiveKeys = ["apikey", "token", "secret", "password", "key", "authorization"]
    parsed.searchParams.forEach((_, key) => {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        parsed.searchParams.set(key, "[REDACTED]")
      }
    })
    return parsed.toString()
  } catch {
    return rawUrl.replace(/apikey=[^&]+/gi, "apikey=[REDACTED]")
  }
}

/**
 * Safe fetch wrapper that logs the request URL with credentials redacted,
 * never logging the service-role key or sensitive auth headers.
 */
const safeFetch: typeof fetch = async (input, init) => {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
  const method = init?.method || "GET"
  console.log(`[Supabase REST Request] ${method} ${sanitizeUrlForLogging(urlStr)}`)
  return fetch(input, init)
}

/**
 * Checks whether Supabase is configured with real non-placeholder credentials.
 * Supports both new Supabase API keys (sb_publishable_..., sb_secret_...) and legacy JWT keys (eyJ...).
 */
export function isSupabaseConfigured(): boolean {
  const url = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!url || !key) return false
  if (
    url.includes("your-project-id") ||
    url.includes("example.com") ||
    url.includes("placeholder")
  ) {
    return false
  }

  // Reject literal placeholders or dummy ellipses
  if (
    key.includes("your_anon_key") ||
    key.includes("your_service_role_key") ||
    key.includes("placeholder") ||
    key.includes("...") ||
    key.trim().length === 0
  ) {
    return false
  }

  // Accept valid key formats: new sb_* keys (~40-50 chars) and legacy JWT keys (~200+ chars)
  return key.length >= 20
}

export interface FormattedSupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

/**
 * Formats a Supabase or network error into readable diagnostic properties,
 * preventing `{}` empty object serialization in logs while ensuring no secrets are exposed.
 */
export function formatSupabaseError(error: unknown): FormattedSupabaseError {
  if (!error) {
    return { message: "Unknown database error" }
  }

  if (typeof error === "string") {
    return { message: error }
  }

  if (error instanceof Error) {
    const cause = (error as { cause?: Error }).cause
    return {
      message: error.message,
      details: cause ? `Caused by: ${cause.message}` : undefined,
    }
  }

  if (typeof error === "object") {
    const err = error as Record<string, unknown>
    return {
      message: String(err.message || err.error_description || "Database operation failed"),
      code: err.code ? String(err.code) : undefined,
      details: err.details ? String(err.details) : undefined,
      hint: err.hint ? String(err.hint) : undefined,
    }
  }

  return { message: String(error) }
}

/**
 * Server-side Supabase client — uses service-role key, bypasses RLS.
 * Only import this in Server Components, Route Handlers, or Server Actions.
 */
export function createServiceClient() {
  const supabaseUrl = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "[Supabase] Configuration missing: Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    )
  }

  if (supabaseUrl.includes("your-project-id")) {
    throw new Error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL contains placeholder 'your-project-id.supabase.co'. Please update .env.local with your real Supabase project URL."
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    global: { fetch: safeFetch },
  })
}

/**
 * Browser-side Supabase client — uses anon key.
 * Only import this in Client Components.
 */
export function createBrowserClient() {
  const supabaseUrl = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[Supabase] Configuration missing: Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    )
  }

  if (supabaseUrl.includes("your-project-id")) {
    throw new Error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL contains placeholder 'your-project-id.supabase.co'. Please update .env.local with your real Supabase project URL."
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: safeFetch },
  })
}
