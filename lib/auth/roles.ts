// Handles role validation, admin whitelisting, and route authorization checks
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { UserRole } from "@/types/user"
export type { UserRole }

export const VALID_ROLES: readonly UserRole[] = ["customer", "rider", "provider", "admin"] as const


/**
 * Server-side admin email whitelist.
 * Only these email addresses are recognized as platform administrators.
 * NOTE: This is never exposed to client components.
 */
export const DEFAULT_ADMIN_EMAIL = "jake.magtibay@urios.edu.ph"

export function getAdminEmails(): string[] {
  return [
    DEFAULT_ADMIN_EMAIL,
    ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []),
  ]
}

export function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && (VALID_ROLES as readonly string[]).includes(role)
}

/**
 * Resolves the role of the currently authenticated Clerk user.
 *
 * Source of truth hierarchy (per specification):
 * 1. ADMIN_EMAIL -> admin
 * 2. Matching verified + active row in riders -> rider
 * 3. Matching verified + active row in providers -> provider
 * 4. Default: customer
 */
export async function getCurrentUserRole(): Promise<UserRole> {
  const user = await currentUser()

  if (!user) {
    return "customer"
  }

  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    ""

  const adminEmails = [
    DEFAULT_ADMIN_EMAIL,
    ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []),
  ]

  // 1. ADMIN_EMAIL -> admin
  if (primaryEmail && adminEmails.includes(primaryEmail)) {
    return "admin"
  }

  // 2 & 3. Verified + active in riders / providers
  if (primaryEmail) {
    try {
      const { createServiceClient } = await import("@/lib/supabase")
      const db = createServiceClient()

      const [{ data: riderRow }, { data: providerRow }] = await Promise.all([
        db
          .from("riders")
          .select("id")
          .or(`clerk_user_id.eq.${user.id},email.eq.${primaryEmail}`)
          .eq("is_active", true)
          .eq("is_verified", true)
          .maybeSingle(),
        db
          .from("providers")
          .select("id")
          .or(`clerk_user_id.eq.${user.id},email.eq.${primaryEmail}`)
          .eq("is_active", true)
          .eq("is_verified", true)
          .maybeSingle(),
      ])

      if (riderRow) return "rider"
      if (providerRow) return "provider"
    } catch {
      // Supabase unavailable or table not created yet -> fallback to customer
    }
  }

  // 4. Default
  return "customer"
}

/**
 * Enforces server-side role authorization for protected routes.
 * Unauthenticated -> /login
 * If applicant is not yet approved -> redirect to application pending page
 * Wrong role -> /dashboard/{role}
 * Admin always passes.
 */
export async function requireRole(
  allowed: UserRole | UserRole[],
  options: { allowAdmin?: boolean } = { allowAdmin: true }
) {
  const user = await currentUser()

  if (!user) {
    redirect("/login")
  }

  const role = await getCurrentUserRole()
  const allowedList = Array.isArray(allowed) ? allowed : [allowed]

  const isExplicitlyAllowed = allowedList.includes(role)
  const isSuperAdminAllowed = options.allowAdmin !== false && role === "admin"

  if (!isExplicitlyAllowed && !isSuperAdminAllowed) {
    // If user attempted to access rider or provider portal, check if they have a pending application
    if (allowedList.includes("rider")) {
      try {
        const { createServiceClient } = await import("@/lib/supabase")
        const db = createServiceClient()
        const primaryEmail = user.emailAddresses[0]?.emailAddress || ""
        const { data: pendingRider } = await db
          .from("riders")
          .select("id, is_verified")
          .or(`clerk_user_id.eq.${user.id},email.eq.${primaryEmail}`)
          .eq("is_active", true)
          .maybeSingle()

        if (pendingRider && !pendingRider.is_verified) {
          redirect("/dashboard/customer/apply/rider?status=pending")
        }
      } catch {
        // Fall through
      }
    }

    if (allowedList.includes("provider")) {
      try {
        const { createServiceClient } = await import("@/lib/supabase")
        const db = createServiceClient()
        const primaryEmail = user.emailAddresses[0]?.emailAddress || ""
        const { data: pendingProvider } = await db
          .from("providers")
          .select("id, is_verified")
          .or(`clerk_user_id.eq.${user.id},email.eq.${primaryEmail}`)
          .eq("is_active", true)
          .maybeSingle()

        if (pendingProvider && !pendingProvider.is_verified) {
          redirect("/dashboard/customer/apply/provider?status=pending")
        }
      } catch {
        // Fall through
      }
    }

    redirect(`/dashboard/${role}?unauthorized=true`)
  }

  return { user, role }
}
