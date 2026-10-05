import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { UserRole } from "@/types/user"
export type { UserRole }

export const VALID_ROLES: readonly UserRole[] = ["customer", "rider", "provider", "admin"] as const

/**
 * Server-side admin email whitelist.
 * Only these email addresses are recognized as platform administrators.
 * In a production system this list is replaced by Clerk publicMetadata + database roles.
 * NOTE: This is never exposed to client components.
 */
const ADMIN_EMAILS: readonly string[] = [
  "jake.magtibay@urios.edu.ph",
] as const

export function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && (VALID_ROLES as readonly string[]).includes(role)
}

/**
 * Resolves the role of the currently authenticated Clerk user.
 *
 * Source of truth hierarchy:
 * 1. Admin email whitelist (server-side only, takes highest priority)
 * 2. Clerk user's publicMetadata.role — for approved riders/providers set via admin tools
 * 3. Safe default: "customer" (all new sign-ups are customers)
 *
 * The demo role cookie (hitsnago_demo_role) has been intentionally removed.
 * Role assignment is now server-authoritative only.
 */
export async function getCurrentUserRole(): Promise<UserRole> {
  const user = await currentUser()

  if (!user) {
    return "customer"
  }

  // 1. Highest priority: Admin email whitelist (server-only, never client-visible)
  const primaryEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress ?? ""

  if (ADMIN_EMAILS.includes(primaryEmail)) {
    return "admin"
  }

  // 2. Clerk publicMetadata role (set by admin tools for approved riders/providers)
  const metaRole = user.publicMetadata?.role
  if (isValidRole(metaRole) && metaRole !== "admin") {
    // Admin cannot be assigned via metadata — it is email-whitelisted only
    return metaRole
  }

  // 3. Default: Customer (all new registrations)
  return "customer"
}

/**
 * Enforces server-side role authorization for protected routes.
 * If unauthenticated → redirects to /login.
 * If unauthorized role → redirects to the user's own dashboard.
 * Admins always have access to all routes.
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
    redirect(`/dashboard/${role}?unauthorized=true`)
  }

  return { user, role }
}

/**
 * Requires the user to have any of the specified roles.
 */
export async function requireAnyRole(allowedRoles: UserRole[]) {
  return requireRole(allowedRoles)
}
