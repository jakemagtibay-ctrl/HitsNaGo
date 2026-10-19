"use server"

import {
  createServiceClient,
  formatSupabaseError,
  isSupabaseConfigured,
  type FormattedSupabaseError,
} from "@/lib/supabase"
import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { getAdminEmails } from "@/lib/auth/roles"

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type RiderStatus = "Pending" | "Verified" | "Inactive"

export interface AdminRiderItem {
  id: string
  name: string
  email: string
  phone: string | null
  vehicleModel: string | null
  plateNumber: string | null
  status: RiderStatus
  isActive: boolean
  isVerified: boolean
  rating: number | null
  completedTripsCount: number
  createdAt: string
}

export type ProviderStatus = "Pending" | "Verified" | "Inactive"

export interface AdminProviderItem {
  id: string
  name: string
  email: string
  phone: string | null
  businessName: string | null
  status: ProviderStatus
  isActive: boolean
  isVerified: boolean
  createdAt: string
}

export interface AdminCustomerItem {
  id: string
  name: string
  email: string
  bookingsCount: number
  joinedAt?: string
}

export interface AdminDashboardMetrics {
  registeredUsers: number
  activeRiders: number
  activeProviders: number
  pendingVerifications: number
  activeLiveTrips: number
  completedBookings: number
  grossVolume: number
  recentBookings: {
    id: string
    reference: string
    customerName: string
    customerEmail: string
    serviceType: "ride" | "rental" | "delivery"
    pickup: string
    destination: string | null
    status: string
    estimatedFare: number
    createdAt: string
  }[]
}

// ─── RIDERS ACTIONS ──────────────────────────────────────────────────────────

export interface GetAllRidersResult {
  riders: AdminRiderItem[]
  error: FormattedSupabaseError | null
  isConfigured: boolean
}

export async function getAllRidersWithStatus(): Promise<GetAllRidersResult> {
  if (!isSupabaseConfigured()) {
    return {
      riders: [],
      error: {
        message: "Supabase connection is not configured or using placeholder credentials in .env.local.",
        hint: "Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY with your live Supabase project credentials in .env.local.",
      },
      isConfigured: false,
    }
  }

  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("riders")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data) {
      const formatted = formatSupabaseError(error)
      console.error("[getAllRiders] Supabase error:", formatted)
      return {
        riders: [],
        error: formatted,
        isConfigured: true,
      }
    }

    const riders = data.map((r) => {
      let status: RiderStatus = "Verified"
      if (!r.is_active) {
        status = "Inactive"
      } else if (!r.is_verified) {
        status = "Pending"
      }

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        vehicleModel: r.vehicle_model,
        plateNumber: r.plate_number,
        status,
        isActive: !!r.is_active,
        isVerified: !!r.is_verified,
        rating: r.rating != null ? Number(r.rating) : 5.0,
        completedTripsCount: r.completed_trips_count ?? 0,
        createdAt: r.created_at,
      }
    })

    return {
      riders,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    const formatted = formatSupabaseError(err)
    console.error("[getAllRiders] Exception:", formatted)
    return {
      riders: [],
      error: formatted,
      isConfigured: true,
    }
  }
}

export async function getAllRiders(): Promise<AdminRiderItem[]> {
  const res = await getAllRidersWithStatus()
  return res.riders
}

export async function updateRiderStatus(
  riderId: string,
  updates: { is_verified?: boolean; is_active?: boolean }
): Promise<{ error: string | null }> {
  try {
    const db = createServiceClient()
    const { error } = await db.from("riders").update(updates).eq("id", riderId)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/admin/riders")
    revalidatePath("/dashboard/admin/verification")
    revalidatePath("/dashboard/admin")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update rider status."
    return { error: message }
  }
}

export async function deleteRider(riderId: string): Promise<{ error: string | null }> {
  try {
    const db = createServiceClient()
    const { error } = await db.from("riders").delete().eq("id", riderId)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/admin/riders")
    revalidatePath("/dashboard/admin/verification")
    revalidatePath("/dashboard/admin")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove rider."
    return { error: message }
  }
}

// ─── RENTAL PROVIDERS ACTIONS ────────────────────────────────────────────────

export async function getAllRentalProviders(): Promise<AdminProviderItem[]> {
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data) {
      console.error("[getAllRentalProviders] Supabase error:", error)
      return []
    }

    return data.map((p) => {
      let status: ProviderStatus = "Verified"
      if (!p.is_active) {
        status = "Inactive"
      } else if (!p.is_verified) {
        status = "Pending"
      }

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        businessName: p.business_name,
        status,
        isActive: !!p.is_active,
        isVerified: !!p.is_verified,
        createdAt: p.created_at,
      }
    })
  } catch (err) {
    console.error("[getAllRentalProviders]", err)
    return []
  }
}

export async function updateProviderStatus(
  providerId: string,
  updates: { is_verified?: boolean; is_active?: boolean }
): Promise<{ error: string | null }> {
  try {
    const db = createServiceClient()
    const { error } = await db.from("providers").update(updates).eq("id", providerId)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/admin/providers")
    revalidatePath("/dashboard/admin/verification")
    revalidatePath("/dashboard/admin")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update provider status."
    return { error: message }
  }
}

export async function deleteProvider(providerId: string): Promise<{ error: string | null }> {
  try {
    const db = createServiceClient()
    const { error } = await db.from("providers").delete().eq("id", providerId)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/admin/providers")
    revalidatePath("/dashboard/admin/verification")
    revalidatePath("/dashboard/admin")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove provider."
    return { error: message }
  }
}

// ─── CUSTOMERS ACTIONS ────────────────────────────────────────────────────────

export async function getAllCustomers(): Promise<AdminCustomerItem[]> {
  try {
    const db = createServiceClient()

    // 1. Fetch riders and providers emails to exclude them
    const [{ data: riders }, { data: providers }, { data: bookings }] = await Promise.all([
      db.from("riders").select("email, clerk_user_id"),
      db.from("providers").select("email, clerk_user_id"),
      db.from("bookings").select("customer_id, customer_email, customer_name"),
    ])

    const excludedEmails = new Set<string>()
    const adminEmails = getAdminEmails()
    adminEmails.forEach((e) => e && excludedEmails.add(e.toLowerCase().trim()))
    riders?.forEach((r) => r.email && excludedEmails.add(r.email.toLowerCase().trim()))
    providers?.forEach((p) => p.email && excludedEmails.add(p.email.toLowerCase().trim()))

    const excludedClerkIds = new Set<string>()
    riders?.forEach((r) => r.clerk_user_id && excludedClerkIds.add(r.clerk_user_id))
    providers?.forEach((p) => p.clerk_user_id && excludedClerkIds.add(p.clerk_user_id))

    // 2. Compute bookings counts map by email and customer_id
    const bookingCountsByEmail = new Map<string, number>()
    const bookingCountsById = new Map<string, number>()
    const bookingsCustomerNames = new Map<string, string>()

    bookings?.forEach((b) => {
      const email = b.customer_email?.toLowerCase().trim()
      if (email) {
        bookingCountsByEmail.set(email, (bookingCountsByEmail.get(email) || 0) + 1)
        if (b.customer_name) bookingsCustomerNames.set(email, b.customer_name)
      }
      if (b.customer_id) {
        bookingCountsById.set(b.customer_id, (bookingCountsById.get(b.customer_id) || 0) + 1)
      }
    })

    const customerMap = new Map<string, AdminCustomerItem>()

    // 3. Try to fetch Clerk users
    try {
      const clerk = await clerkClient()
      const clerkUsersResponse = await clerk.users.getUserList({ limit: 100 })
      const clerkUsers = clerkUsersResponse.data || clerkUsersResponse

      if (Array.isArray(clerkUsers)) {
        for (const u of clerkUsers) {
          if (excludedClerkIds.has(u.id)) continue
          const primaryEmail =
            u.emailAddresses?.find((e: { id: string }) => e.id === u.primaryEmailAddressId)
              ?.emailAddress || u.emailAddresses?.[0]?.emailAddress || ""

          const lowerEmail = primaryEmail.toLowerCase().trim()
          if (lowerEmail && excludedEmails.has(lowerEmail)) continue

          const name =
            (u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : null) ||
            u.username ||
            lowerEmail.split("@")[0] ||
            "Customer"

          const count =
            (lowerEmail ? bookingCountsByEmail.get(lowerEmail) : 0) ||
            bookingCountsById.get(u.id) ||
            0

          const key = lowerEmail || u.id
          customerMap.set(key, {
            id: u.id,
            name,
            email: primaryEmail || "No email",
            bookingsCount: count,
            joinedAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
          })
        }
      }
    } catch (clerkErr) {
      console.warn("[getAllCustomers] Clerk fetch skipped or failed, fallback to distinct bookings customers:", clerkErr)
    }

    // 4. Also incorporate distinct customers from bookings if not already present
    bookings?.forEach((b) => {
      const email = b.customer_email?.toLowerCase().trim()
      if (!email || excludedEmails.has(email)) return

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: b.customer_id || email,
          name: b.customer_name || email.split("@")[0],
          email: b.customer_email,
          bookingsCount: bookingCountsByEmail.get(email) || 1,
        })
      }
    })

    return Array.from(customerMap.values()).sort((a, b) => b.bookingsCount - a.bookingsCount)
  } catch (err) {
    console.error("[getAllCustomers]", err)
    return []
  }
}

// ─── DASHBOARD REAL METRICS ──────────────────────────────────────────────────

export async function getAdminDashboardStats(): Promise<AdminDashboardMetrics> {
  try {
    let registeredUsersCount = 0
    try {
      const clerk = await clerkClient()
      const totalClerk = await clerk.users.getCount()
      registeredUsersCount = typeof totalClerk === "number" ? totalClerk : 0
    } catch {
      registeredUsersCount = 0
    }

    if (!isSupabaseConfigured()) {
      return {
        registeredUsers: registeredUsersCount,
        activeRiders: 0,
        activeProviders: 0,
        pendingVerifications: 0,
        activeLiveTrips: 0,
        completedBookings: 0,
        grossVolume: 0,
        recentBookings: [],
      }
    }

    const db = createServiceClient()

    // 2. Active Riders (verified AND active)
    const { count: activeRidersCount } = await db
      .from("riders")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true)
      .eq("is_active", true)

    // 3. Rental Providers (verified AND active)
    const { count: activeProvidersCount } = await db
      .from("providers")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true)
      .eq("is_active", true)

    // 4. Pending Verifications (unverified riders + unverified providers)
    const [{ count: pendingRidersCount }, { count: pendingProvidersCount }] = await Promise.all([
      db
        .from("riders")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", false)
        .eq("is_active", true),
      db
        .from("providers")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", false)
        .eq("is_active", true),
    ])

    const pendingVerificationsCount = (pendingRidersCount ?? 0) + (pendingProvidersCount ?? 0)

    // 5. Active Live Trips (bookings in accepted or in_progress)
    const { count: activeLiveTripsCount } = await db
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("status", ["accepted", "in_progress"])

    // 6. Completed Bookings
    const { count: completedBookingsCount } = await db
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")

    // 7. Gross Volume (sum of estimated_fare of completed bookings)
    const { data: completedRows } = await db
      .from("bookings")
      .select("estimated_fare")
      .eq("status", "completed")

    const grossVolume = (completedRows || []).reduce(
      (sum, r) => sum + (Number(r.estimated_fare) || 0),
      0
    )

    // 8. Recent Bookings (latest 5)
    const { data: recentRows } = await db
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    const recentBookings = (recentRows || []).map((b) => ({
      id: b.id,
      reference: b.reference,
      customerName: b.customer_name,
      customerEmail: b.customer_email,
      serviceType: b.service_type as "ride" | "rental" | "delivery",
      pickup: b.pickup,
      destination: b.destination,
      status: b.status,
      estimatedFare: Number(b.estimated_fare) || 0,
      createdAt: b.created_at,
    }))

    return {
      registeredUsers: registeredUsersCount,
      activeRiders: activeRidersCount ?? 0,
      activeProviders: activeProvidersCount ?? 0,
      pendingVerifications: pendingVerificationsCount,
      activeLiveTrips: activeLiveTripsCount ?? 0,
      completedBookings: completedBookingsCount ?? 0,
      grossVolume,
      recentBookings,
    }
  } catch (err) {
    console.error("[getAdminDashboardStats]", err)
    return {
      registeredUsers: 0,
      activeRiders: 0,
      activeProviders: 0,
      pendingVerifications: 0,
      activeLiveTrips: 0,
      completedBookings: 0,
      grossVolume: 0,
      recentBookings: [],
    }
  }
}
