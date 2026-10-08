import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

/**
 * Server-side Supabase client — uses service-role key, bypasses RLS.
 * Only import this in Server Components, Route Handlers, or Server Actions.
 */
export function createServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
}

/**
 * Browser-side Supabase client — uses anon key.
 * Only import this in Client Components.
 */
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}
