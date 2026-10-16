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
 * Server-side Supabase client — uses service-role key, bypasses RLS.
 * Only import this in Server Components, Route Handlers, or Server Actions.
 */
export function createServiceClient() {
  const supabaseUrl = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
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
    throw new Error("Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: safeFetch },
  })
}
