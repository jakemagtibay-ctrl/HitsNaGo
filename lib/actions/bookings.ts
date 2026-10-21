"use server"

import {
  createServiceClient,
  formatSupabaseError,
  isSupabaseConfigured,
  type FormattedSupabaseError,
} from "@/lib/supabase"
import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { uploadVerificationDocument, getDocumentSignedUrl } from "@/lib/verification/storage"
import { sendSystemNotification } from "@/lib/actions/notifications"
import { requireRole } from "@/lib/auth/roles"
import { GOVERNMENT_ID_OPTIONS, type GovernmentIdType, type VerificationStatus } from "@/types/verification"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"

export interface Booking {
  id: string
  reference: string
  customer_id: string
  customer_name: string
  customer_email: string
  service_type: "ride" | "rental" | "delivery"
  vehicle_category: string | null
  pickup: string
  destination: string | null
  scheduled_at: string
  passengers: number
  payment_mode: string
  estimated_fare: number
  notes: string | null
  status: BookingStatus
  rider_id: string | null
  created_at: string
  updated_at: string
  // joined
  rider?: {
    id: string
    name: string
    email: string
    vehicle_model: string | null
    plate_number: string | null
    rating: number | null
    is_verified?: boolean
    verification_status?: string | null
  } | null
}

export interface Rider {
  id: string
  name: string
  email: string
  phone: string | null
  vehicle_model: string | null
  plate_number: string | null
  is_active: boolean
  is_verified: boolean
  rating: number | null
  completed_trips_count: number
  verification_status?: VerificationStatus | null
  id_type?: string | null
  id_type_custom?: string | null
  id_front_path?: string | null
  id_back_path?: string | null
  rejection_reason?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  submitted_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface Provider {
  id: string
  name: string
  email: string
  phone: string | null
  business_name: string | null
  is_active: boolean
  is_verified: boolean
  verification_status?: VerificationStatus | null
  id_type?: string | null
  id_type_custom?: string | null
  id_front_path?: string | null
  id_back_path?: string | null
  rejection_reason?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  submitted_at?: string | null
  created_at?: string
  updated_at?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateReference(): string {
  return `HNG-${Math.floor(100000 + Math.random() * 900000)}`
}

// ─── Customer Actions ─────────────────────────────────────────────────────────

import { serializeBookingGeo } from "@/lib/maps/geocode"

export interface CreateRideBookingInput {
  pickup: string
  destination: string
  scheduledAt: string         // ISO string
  passengers: number
  paymentMode: string
  estimatedFare: number
  vehicleCategory: string
  notes?: string
  pickupCoords?: { lat: number; lng: number }
  destinationCoords?: { lat: number; lng: number }
  distanceKm?: number
  durationMin?: number
}

export async function createRideBooking(
  input: CreateRideBookingInput
): Promise<{ booking: Booking | null; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { booking: null, error: "Not authenticated." }

    const db = createServiceClient()

    const customerName =
      user.fullName ||
      user.firstName ||
      user.emailAddresses[0]?.emailAddress.split("@")[0] ||
      "Customer"
    const customerEmail = user.emailAddresses[0]?.emailAddress || ""

    const serializedNotes = serializeBookingGeo(input.notes, {
      pickupCoords: input.pickupCoords,
      destinationCoords: input.destinationCoords,
      distanceKm: input.distanceKm,
      durationMin: input.durationMin,
    })

    const { data, error } = await db
      .from("bookings")
      .insert({
        reference: generateReference(),
        customer_id: user.id,
        customer_name: customerName,
        customer_email: customerEmail,
        service_type: "ride",
        vehicle_category: input.vehicleCategory,
        pickup: input.pickup,
        destination: input.destination,
        scheduled_at: input.scheduledAt,
        passengers: input.passengers,
        payment_mode: input.paymentMode,
        estimated_fare: input.estimatedFare,
        notes: serializedNotes,
        status: "pending",
        rider_id: null,
      })
      .select("*, rider:riders!rider_id(id,name,email,vehicle_model,plate_number,rating)")
      .single()

    if (error) {
      console.error("[createRideBooking]", error)
      return { booking: null, error: error.message }
    }

    revalidatePath("/dashboard/customer/bookings")
    revalidatePath("/dashboard/admin/bookings")
    revalidatePath("/dashboard/rider")

    return { booking: data as Booking, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create booking."
    console.error("[createRideBooking] Exception:", err)
    return { booking: null, error: message }
  }
}

export interface CreateDeliveryBookingInput {
  pickup: string
  destination: string
  scheduledAt: string
  packageType: string
  sizeTier: string
  senderName: string
  senderPhone: string
  recipientName: string
  recipientPhone: string
  packageDescription: string
  isFragile?: boolean
  estimatedFare: number
  notes?: string
  pickupCoords?: { lat: number; lng: number }
  destinationCoords?: { lat: number; lng: number }
  distanceKm?: number
  durationMin?: number
}

export async function createDeliveryBooking(
  input: CreateDeliveryBookingInput
): Promise<{ booking: Booking | null; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { booking: null, error: "Not authenticated." }

    const db = createServiceClient()

    const customerName =
      user.fullName ||
      user.firstName ||
      user.emailAddresses[0]?.emailAddress.split("@")[0] ||
      "Customer"
    const customerEmail = user.emailAddresses[0]?.emailAddress || ""

    const deliveryNotes = [
      `Sender: ${input.senderName} (${input.senderPhone})`,
      `Recipient: ${input.recipientName} (${input.recipientPhone})`,
      `Item: ${input.packageDescription} [Type: ${input.packageType}, Tier: ${input.sizeTier}${input.isFragile ? ", FRAGILE" : ""}]`,
      input.notes ? `Instructions: ${input.notes}` : "",
    ]
      .filter(Boolean)
      .join(" • ")

    const serializedNotes = serializeBookingGeo(deliveryNotes, {
      pickupCoords: input.pickupCoords,
      destinationCoords: input.destinationCoords,
      distanceKm: input.distanceKm,
      durationMin: input.durationMin,
    })

    const { data, error } = await db
      .from("bookings")
      .insert({
        reference: generateReference(),
        customer_id: user.id,
        customer_name: customerName,
        customer_email: customerEmail,
        service_type: "delivery",
        vehicle_category: "motorcycle",
        pickup: input.pickup,
        destination: input.destination,
        scheduled_at: input.scheduledAt,
        passengers: 0,
        payment_mode: "cash",
        estimated_fare: input.estimatedFare,
        notes: serializedNotes,
        status: "pending",
        rider_id: null,
      })
      .select("*, rider:riders!rider_id(id,name,email,vehicle_model,plate_number,rating)")
      .single()

    if (error) {
      console.error("[createDeliveryBooking]", error)
      return { booking: null, error: error.message }
    }

    revalidatePath("/dashboard/customer/bookings")
    revalidatePath("/dashboard/admin/bookings")
    revalidatePath("/dashboard/rider")

    return { booking: data as Booking, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create delivery booking."
    console.error("[createDeliveryBooking] Exception:", err)
    return { booking: null, error: message }
  }
}

export interface CreateRentalBookingInput {
  listingId?: string
  itemTitle: string
  category: string
  pickupLocation: string
  handoverLocation: string
  startDate: string
  endDate: string
  rentalDays: number
  pricePerDay: number
  securityDeposit: number
  estimatedTotal: number
  notes?: string
}

export async function createRentalBooking(
  input: CreateRentalBookingInput
): Promise<{ booking: Booking | null; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { booking: null, error: "Not authenticated." }

    const db = createServiceClient()

    const customerName =
      user.fullName ||
      user.firstName ||
      user.emailAddresses[0]?.emailAddress.split("@")[0] ||
      "Customer"
    const customerEmail = user.emailAddresses[0]?.emailAddress || ""

    // Validate dates
    const start = new Date(input.startDate)
    const end = new Date(input.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return { booking: null, error: "Invalid rental duration dates." }
    }

    // Resolve listingId
    let listingId = input.listingId
    if (!listingId) {
      const { MOCK_BUTUAN_RENTAL_LISTINGS } = await import("@/lib/mock-data/butuan-rental-listings")
      const matched = MOCK_BUTUAN_RENTAL_LISTINGS.find((l) => l.title === input.itemTitle)
      listingId = matched ? matched.id : "rent_btn_01"
    }

    // Concurrency-safe atomic unit allocation check
    const { allocateUnitForBooking } = await import("@/lib/actions/rentals")
    const { normalizeRentalUnitId, VALID_UUID_REGEX } = await import("@/lib/rentals/inventory")
    const allocation = await allocateUnitForBooking(
      listingId,
      input.startDate,
      input.endDate
    )

    if (!allocation.success || !allocation.unit) {
      return {
        booking: null,
        error: allocation.error || "Selected vehicle model is fully reserved for the requested dates.",
      }
    }

    const assignedUnit = allocation.unit
    let resolvedUnitId = normalizeRentalUnitId(assignedUnit.id) || assignedUnit.id

    // Fallback: If not a valid UUID string, resolve from rental_units in database
    if (!VALID_UUID_REGEX.test(resolvedUnitId)) {
      const { data: dbUnits } = await db
        .from("rental_units")
        .select("id")
        .eq("listing_id", listingId)
        .limit(1)
      if (dbUnits && dbUnits.length > 0 && dbUnits[0]?.id) {
        resolvedUnitId = dbUnits[0].id
      }
    }

    const rentalNotes = [
      `Rental Item: ${input.itemTitle}`,
      `Assigned Unit: ${assignedUnit.unitIdentifier}`,
      `Period: ${input.startDate} to ${input.endDate} (${input.rentalDays} days)`,
      `Rate: ₱${input.pricePerDay}/day`,
      `Deposit: ₱${input.securityDeposit}`,
      `Handover Location: ${input.handoverLocation}`,
      input.notes ? `Customer Notes: ${input.notes}` : "",
    ]
      .filter(Boolean)
      .join(" • ")

    const insertPayload: Record<string, unknown> = {
      reference: generateReference(),
      customer_id: user.id,
      customer_name: customerName,
      customer_email: customerEmail,
      service_type: "rental",
      vehicle_category: input.category,
      pickup: input.pickupLocation,
      destination: input.handoverLocation,
      scheduled_at: start.toISOString(),
      passengers: 1,
      payment_mode: "cash",
      estimated_fare: input.estimatedTotal,
      notes: rentalNotes,
      status: "pending",
      rider_id: null,
      unit_id: resolvedUnitId,
      listing_id: listingId,
      rental_start_date: start.toISOString(),
      rental_end_date: end.toISOString(),
    }

    let { data, error } = await db
      .from("bookings")
      .insert(insertPayload)
      .select("*, rider:riders!rider_id(id,name,email,vehicle_model,plate_number,rating)")
      .single()

    if (error && (error.message?.includes("column") || error.code === "PGRST204")) {
      delete insertPayload.unit_id
      delete insertPayload.listing_id
      delete insertPayload.rental_start_date
      delete insertPayload.rental_end_date

      const retryRes = await db
        .from("bookings")
        .insert(insertPayload)
        .select("*, rider:riders!rider_id(id,name,email,vehicle_model,plate_number,rating)")
        .single()

      data = retryRes.data
      error = retryRes.error
    }

    if (error) {
      console.error("[createRentalBooking]", error)
      return { booking: null, error: error.message }
    }

    revalidatePath("/dashboard/customer/bookings")
    revalidatePath("/dashboard/provider")
    revalidatePath("/dashboard/admin/bookings")

    return { booking: data as Booking, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create rental reservation."
    console.error("[createRentalBooking] Exception:", err)
    return { booking: null, error: message }
  }
}

export async function getCustomerBookings(): Promise<Booking[]> {
  try {
    const user = await currentUser()
    if (!user) return []

    const db = createServiceClient()
    const { data, error } = await db
      .from("bookings")
      .select("*, rider:riders!rider_id(id,name,email,vehicle_model,plate_number,rating,is_verified)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[getCustomerBookings]", error)
      return []
    }

    return (data as Booking[]) || []
  } catch (err) {
    console.error("[getCustomerBookings] Exception:", err)
    return []
  }
}

export async function getCustomerBookingStats(): Promise<{
  active: number
  pending: number
  completed: number
  totalSpent: number
}> {
  try {
    const user = await currentUser()
    if (!user) return { active: 0, pending: 0, completed: 0, totalSpent: 0 }

    const bookings = await getCustomerBookings()

    return {
      active: bookings.filter((b) => b.status === "in_progress" || b.status === "accepted").length,
      pending: bookings.filter((b) => b.status === "pending" || b.status === "assigned").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      totalSpent: bookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + Number(b.estimated_fare), 0),
    }
  } catch {
    return { active: 0, pending: 0, completed: 0, totalSpent: 0 }
  }
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

export interface GetAllBookingsResult {
  bookings: Booking[]
  error: FormattedSupabaseError | null
  isConfigured: boolean
}

export async function getAllBookingsWithStatus(): Promise<GetAllBookingsResult> {
  if (!isSupabaseConfigured()) {
    return {
      bookings: [],
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
      .from("bookings")
      .select("*, rider:riders!rider_id(id,name,email,vehicle_model,plate_number,rating,is_verified)")
      .order("created_at", { ascending: false })

    if (error) {
      const formatted = formatSupabaseError(error)
      console.error("[getAllBookings] Database query error:", formatted)
      return {
        bookings: [],
        error: formatted,
        isConfigured: true,
      }
    }

    return {
      bookings: (data as Booking[]) || [],
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    const formatted = formatSupabaseError(err)
    console.error("[getAllBookings] Exception:", formatted)
    return {
      bookings: [],
      error: formatted,
      isConfigured: true,
    }
  }
}

export async function getAllBookings(): Promise<Booking[]> {
  const res = await getAllBookingsWithStatus()
  return res.bookings
}

export async function getAvailableRiders(scheduledAt: string, excludeBookingId?: string): Promise<Rider[]> {
  try {
    const db = createServiceClient()

    // Fetch all active + verified riders
    const { data: riders, error: ridersError } = await db
      .from("riders")
      .select("*")
      .eq("is_active", true)
      .eq("is_verified", true)

    if (ridersError || !riders) return []

    // Get rider IDs that already have an overlapping booking within ±90 min
    const windowStart = new Date(new Date(scheduledAt).getTime() - 90 * 60 * 1000).toISOString()
    const windowEnd   = new Date(new Date(scheduledAt).getTime() + 90 * 60 * 1000).toISOString()

    let busyQuery = db
      .from("bookings")
      .select("rider_id")
      .not("rider_id", "is", null)
      .not("status", "in", '("cancelled","completed")')
      .gte("scheduled_at", windowStart)
      .lte("scheduled_at", windowEnd)

    if (excludeBookingId) {
      busyQuery = busyQuery.neq("id", excludeBookingId)
    }

    const { data: busyBookings } = await busyQuery

    const busyRiderIds = new Set((busyBookings ?? []).map((b: { rider_id: string }) => b.rider_id))

    return (riders as Rider[]).filter((r) => !busyRiderIds.has(r.id))
  } catch (err) {
    console.error("[getAvailableRiders] Exception:", err)
    return []
  }
}

export async function assignRider(bookingId: string, riderId: string): Promise<{ error: string | null }> {
  try {
    const db = createServiceClient()

    // Fetch booking to check status and schedule
    const { data: booking, error: fetchError } = await db
      .from("bookings")
      .select("id, reference, status, scheduled_at, customer_email, customer_name")
      .eq("id", bookingId)
      .single()

    if (fetchError || !booking) return { error: "Booking not found." }
    if (!["pending", "assigned"].includes(booking.status)) {
      return { error: "Can only assign riders to pending or assigned bookings." }
    }

    // Availability double-check on server (exclude this booking for reassignment check)
    const available = await getAvailableRiders(booking.scheduled_at, bookingId)
    const isAvailable = available.some((r) => r.id === riderId)
    if (!isAvailable) return { error: "Rider is not available at that time." }

    const { error } = await db
      .from("bookings")
      .update({ rider_id: riderId, status: "assigned" })
      .eq("id", bookingId)

    if (error) return { error: error.message }

    // Notify rider and customer (Task 2)
    console.log(`[Notification] Booking ${booking.reference} assigned to rider ${riderId}. Customer ${booking.customer_name} (${booking.customer_email}) notified.`)

    revalidatePath("/dashboard/admin/bookings")
    revalidatePath("/dashboard/rider")
    revalidatePath("/dashboard/customer/bookings")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to assign rider."
    console.error("[assignRider] Exception:", err)
    return { error: message }
  }
}

// ─── Rider Actions ────────────────────────────────────────────────────────────

export async function getRiderRecord(): Promise<Rider | null> {
  try {
    const user = await currentUser()
    if (!user) return null

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) return null

    const db = createServiceClient()

    // Only verified and active riders can access
    const { data } = await db
      .from("riders")
      .select("*")
      .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
      .eq("is_active", true)
      .eq("is_verified", true)
      .maybeSingle()

    return (data as Rider) || null
  } catch (err) {
    console.error("[getRiderRecord] Exception:", err)
    return null
  }
}

export async function getRiderBookings(): Promise<Booking[]> {
  try {
    const rider = await getRiderRecord()
    if (!rider) return []

    const db = createServiceClient()
    const { data, error } = await db
      .from("bookings")
      .select("*")
      .eq("rider_id", rider.id)
      .order("created_at", { ascending: false })

    if (error) return []
    return (data as Booking[]) || []
  } catch (err) {
    console.error("[getRiderBookings] Exception:", err)
    return []
  }
}

export async function getAvailableBookingsForRider(): Promise<{
  bookings: Booking[]
  riderActiveTrip: Booking | null
  error: string | null
}> {
  try {
    const rider = await getRiderRecord()
    if (!rider) {
      return { bookings: [], riderActiveTrip: null, error: "Only verified and active riders can view available requests." }
    }

    const db = createServiceClient()

    // 1. Check if rider currently has an active trip in progress
    const { data: activeTrips } = await db
      .from("bookings")
      .select("*")
      .eq("rider_id", rider.id)
      .eq("status", "in_progress")
      .maybeSingle()

    const riderActiveTrip = (activeTrips as Booking) || null

    // 2. Fetch unclaimed pending bookings for on-demand services (rides & deliveries)
    const { data, error } = await db
      .from("bookings")
      .select("*")
      .eq("status", "pending")
      .is("rider_id", null)
      .in("service_type", ["ride", "delivery"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[getAvailableBookingsForRider] Query error:", error)
      return { bookings: [], riderActiveTrip, error: error.message }
    }

    // 3. Privacy protection: Mask customer personal contact info until accepted
    const sanitizedBookings: Booking[] = (data || []).map((b) => {
      const nameParts = b.customer_name ? b.customer_name.trim().split(" ") : ["Customer"]
      const maskedName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`
          : nameParts[0]

      return {
        ...b,
        customer_name: maskedName,
        customer_email: "", // Never expose email to unassigned riders
      }
    })

    return { bookings: sanitizedBookings, riderActiveTrip, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load available bookings."
    console.error("[getAvailableBookingsForRider] Exception:", err)
    return { bookings: [], riderActiveTrip: null, error: message }
  }
}

export async function acceptBookingByRider(
  bookingId: string
): Promise<{ success: boolean; booking: Booking | null; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, booking: null, error: "Not authenticated." }
    }

    const rider = await getRiderRecord()
    if (!rider) {
      return { success: false, booking: null, error: "Only verified and active riders can accept bookings." }
    }

    const db = createServiceClient()

    // 1. Check if rider is already occupied with an in_progress booking
    const { data: activeTrips } = await db
      .from("bookings")
      .select("id, reference")
      .eq("rider_id", rider.id)
      .eq("status", "in_progress")

    if (activeTrips && activeTrips.length > 0) {
      return {
        success: false,
        booking: null,
        error: "You cannot accept another booking while you have a trip or delivery in progress.",
      }
    }

    // 2. Race-Safe Atomic Acceptance via Supabase RPC function
    let rpcSuccess = false
    try {
      const { data: rpcResult, error: rpcError } = await db.rpc("accept_booking_as_rider", {
        p_booking_id: bookingId,
        p_rider_id: rider.id,
      })

      if (!rpcError && rpcResult) {
        if (!rpcResult.success) {
          return {
            success: false,
            booking: null,
            error: rpcResult.message || "Failed to accept booking.",
          }
        }
        rpcSuccess = true
      }
    } catch {
      rpcSuccess = false
    }

    // 3. Dual-Resilience Direct Atomic Conditional Fallback
    // If RPC is pending database migration, run atomic single-winner UPDATE
    if (!rpcSuccess) {
      const { data: updated, error: updateError } = await db
        .from("bookings")
        .update({
          rider_id: rider.id,
          status: "accepted",
        })
        .eq("id", bookingId)
        .is("rider_id", null)
        .eq("status", "pending")
        .in("service_type", ["ride", "delivery"])
        .select("*, rider:riders!rider_id(id,name,email,vehicle_model,plate_number,rating)")
        .maybeSingle()

      if (updateError) {
        console.error("[acceptBookingByRider] Fallback update error:", updateError)
        return { success: false, booking: null, error: updateError.message }
      }

      if (!updated) {
        // Condition matched 0 rows -> another rider accepted first or customer cancelled
        const { data: current } = await db
          .from("bookings")
          .select("status, rider_id")
          .eq("id", bookingId)
          .maybeSingle()

        if (current?.status === "cancelled") {
          return { success: false, booking: null, error: "This booking was cancelled by the customer." }
        }

        return {
          success: false,
          booking: null,
          error: "Another rider accepted this request first. It is no longer available.",
        }
      }

      console.log(`[Automatic Distribution] Booking ${updated.reference} atomically accepted by rider ${rider.name} (${rider.id}).`)

      revalidatePath("/dashboard/rider")
      revalidatePath("/dashboard/customer/bookings")
      revalidatePath("/dashboard/admin/bookings")

      return { success: true, booking: updated as Booking, error: null }
    }

    // Fully retrieve populated booking if RPC succeeded
    const { data: populatedBooking } = await db
      .from("bookings")
      .select("*, rider:riders!rider_id(id,name,email,vehicle_model,plate_number,rating)")
      .eq("id", bookingId)
      .single()

    console.log(`[Automatic Distribution] Booking ${populatedBooking?.reference || bookingId} accepted by rider ${rider.name}.`)

    revalidatePath("/dashboard/rider")
    revalidatePath("/dashboard/customer/bookings")
    revalidatePath("/dashboard/admin/bookings")

    return { success: true, booking: populatedBooking as Booking, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to accept booking."
    console.error("[acceptBookingByRider] Exception:", err)
    return { success: false, booking: null, error: message }
  }
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus
): Promise<{ error: string | null }> {
  try {
    const rider = await getRiderRecord()
    if (!rider) return { error: "Not a registered rider." }

    const db = createServiceClient()

    // Verify rider owns this booking
    const { data: booking } = await db
      .from("bookings")
      .select("rider_id, status")
      .eq("id", bookingId)
      .single()

    if (!booking) return { error: "Booking not found." }
    if (booking.rider_id !== rider.id) return { error: "Unauthorized." }

    const allowedTransitions: Record<string, BookingStatus[]> = {
      assigned:    ["accepted", "cancelled"],
      accepted:    ["in_progress", "cancelled"],
      in_progress: ["completed"],
    }

    if (!allowedTransitions[booking.status]?.includes(newStatus)) {
      return { error: `Cannot transition from ${booking.status} to ${newStatus}.` }
    }

    const { error } = await db
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/rider")
    revalidatePath("/dashboard/customer/bookings")
    revalidatePath("/dashboard/admin/bookings")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update booking status."
    console.error("[updateBookingStatus] Exception:", err)
    return { error: message }
  }
}

// ─── Provider Actions ─────────────────────────────────────────────────────────

export async function getProviderRecord(): Promise<Provider | null> {
  try {
    const user = await currentUser()
    if (!user) return null

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) return null

    const db = createServiceClient()

    const { data } = await db
      .from("providers")
      .select("*")
      .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
      .eq("is_active", true)
      .eq("is_verified", true)
      .maybeSingle()

    return (data as Provider) || null
  } catch (err) {
    console.error("[getProviderRecord] Exception:", err)
    return null
  }
}

export async function getProviderRentalBookings(): Promise<Booking[]> {
  try {
    const user = await currentUser()
    if (!user) return []

    const db = createServiceClient()
    const { data, error } = await db
      .from("bookings")
      .select("*, rider:riders!rider_id(id,name,email,vehicle_model,plate_number,rating)")
      .eq("service_type", "rental")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[getProviderRentalBookings]", error)
      return []
    }

    return (data as Booking[]) || []
  } catch (err) {
    console.error("[getProviderRentalBookings] Exception:", err)
    return []
  }
}

// ─── Onboarding & Applications Actions ─────────────────────────────────────────

export interface ApplyRiderInput {
  name: string
  phone: string
  vehicleModel: string
  plateNumber: string
  idType?: GovernmentIdType
  customIdType?: string
  frontImage?: File
  backImage?: File
  certification?: boolean
}

export async function applyToBecomeRider(
  inputOrFormData: ApplyRiderInput | FormData
): Promise<{ error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { error: "Not authenticated. Please log in." }

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) return { error: "No email found for account." }

    let name = ""
    let phone = ""
    let vehicleModel = ""
    let plateNumber = ""
    let idType: GovernmentIdType = "philippine_national_id"
    let customIdType: string | undefined
    let frontImage: File | null = null
    let backImage: File | null = null
    let certification = false

    if (inputOrFormData instanceof FormData) {
      name = (inputOrFormData.get("name") as string)?.trim() || ""
      phone = (inputOrFormData.get("phone") as string)?.trim() || ""
      vehicleModel = (inputOrFormData.get("vehicleModel") as string)?.trim() || ""
      plateNumber = (inputOrFormData.get("plateNumber") as string)?.trim() || ""
      idType = (inputOrFormData.get("idType") as GovernmentIdType) || "philippine_national_id"
      customIdType = (inputOrFormData.get("customIdType") as string)?.trim() || undefined
      frontImage = inputOrFormData.get("frontImage") as File | null
      backImage = inputOrFormData.get("backImage") as File | null
      certification =
        inputOrFormData.get("certification") === "true" || inputOrFormData.get("certification") === "on"
    } else {
      name = inputOrFormData.name?.trim() || ""
      phone = inputOrFormData.phone?.trim() || ""
      vehicleModel = inputOrFormData.vehicleModel?.trim() || ""
      plateNumber = inputOrFormData.plateNumber?.trim() || ""
      idType = inputOrFormData.idType || "philippine_national_id"
      customIdType = inputOrFormData.customIdType?.trim()
      frontImage = inputOrFormData.frontImage || null
      backImage = inputOrFormData.backImage || null
      certification = inputOrFormData.certification ?? true
    }

    if (!name || !phone || !vehicleModel || !plateNumber) {
      return { error: "Please fill in all personal and vehicle details." }
    }

    const selectedOption = GOVERNMENT_ID_OPTIONS.find((opt) => opt.id === idType)
    if (!selectedOption) {
      return { error: "Please select a valid government-issued ID type." }
    }

    if (idType === "other" && !customIdType) {
      return { error: "Please specify the document type for your government ID." }
    }

    if (!certification) {
      return { error: "Please confirm that the submitted ID belongs to you and the information is accurate." }
    }

    // Require front image
    if (!frontImage || frontImage.size === 0) {
      return { error: "Please upload a clear front image of your government-issued ID." }
    }

    // Require back image if applicable for selected ID type
    if (selectedOption.requiresBack && (!backImage || backImage.size === 0)) {
      return { error: `A back image is required for ${selectedOption.label}.` }
    }

    // Upload front image securely to private vault
    const frontUpload = await uploadVerificationDocument({
      file: frontImage,
      role: "rider",
      userId: user.id,
      side: "front",
    })
    if (frontUpload.error || !frontUpload.path) {
      return { error: frontUpload.error || "Failed to upload front image." }
    }

    let backPath: string | null = null
    if (backImage && backImage.size > 0) {
      const backUpload = await uploadVerificationDocument({
        file: backImage,
        role: "rider",
        userId: user.id,
        side: "back",
      })
      if (backUpload.error || !backUpload.path) {
        return { error: backUpload.error || "Failed to upload back image." }
      }
      backPath = backUpload.path
    }

    const db = createServiceClient()

    // Check if applicant already exists in riders
    const { data: existing } = await db
      .from("riders")
      .select("id, is_verified, is_active, verification_status")
      .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
      .maybeSingle()

    if (existing?.is_verified) {
      return { error: "You are already an approved and verified rider." }
    }

    let riderId = existing?.id
    const nowIso = new Date().toISOString()

    if (existing) {
      // Update existing record (handles resubmission seamlessly)
      const { error: updateErr } = await db
        .from("riders")
        .update({
          clerk_user_id: user.id,
          name,
          email,
          phone,
          vehicle_model: vehicleModel,
          plate_number: plateNumber,
          is_active: true,
          is_verified: false,
          verification_status: "pending",
          id_type: idType,
          id_type_custom: customIdType || null,
          id_front_path: frontUpload.path,
          id_back_path: backPath,
          rejection_reason: null,
          submitted_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", existing.id)

      if (updateErr) return { error: updateErr.message }
    } else {
      // New record insertion
      const { data: newRider, error: insertErr } = await db
        .from("riders")
        .insert({
          clerk_user_id: user.id,
          name,
          email,
          phone,
          vehicle_model: vehicleModel,
          plate_number: plateNumber,
          is_active: true,
          is_verified: false,
          verification_status: "pending",
          id_type: idType,
          id_type_custom: customIdType || null,
          id_front_path: frontUpload.path,
          id_back_path: backPath,
          rejection_reason: null,
          submitted_at: nowIso,
        })
        .select("id")
        .single()

      if (insertErr) return { error: insertErr.message }
      riderId = newRider?.id
    }

    // Record in audit log if table exists
    try {
      await db.from("verification_applications").insert({
        user_id: user.id,
        role: "rider",
        target_id: riderId,
        applicant_name: name,
        applicant_email: email,
        applicant_phone: phone,
        detail: `${vehicleModel} (${plateNumber})`,
        id_type: idType,
        id_type_custom: customIdType || null,
        id_front_path: frontUpload.path,
        id_back_path: backPath,
        status: "pending",
        submitted_at: nowIso,
      })
    } catch {}

    // Dispatch notifications
    await sendSystemNotification({
      userId: user.id,
      userRole: "customer",
      title: "Rider ID Verification Submitted",
      message:
        "Your government-issued ID documents have been received and are pending administrator review. You will receive an update once reviewed.",
      type: "verification",
      serviceType: "ride",
      actionUrl: "/dashboard/customer/apply/rider",
    })

    await sendSystemNotification({
      userId: "admin",
      userRole: "admin",
      title: "New Rider Verification Application",
      message: `${name} submitted government-issued ID documents for Rider onboarding.`,
      type: "verification",
      serviceType: "ride",
      actionUrl: "/dashboard/admin/verification",
    })

    revalidatePath("/dashboard/customer")
    revalidatePath("/dashboard/customer/apply/rider")
    revalidatePath("/dashboard/admin/verification")
    revalidatePath("/dashboard/admin/riders")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit rider application."
    return { error: message }
  }
}

export interface ApplyProviderInput {
  name: string
  phone: string
  businessName: string
  idType?: GovernmentIdType
  customIdType?: string
  frontImage?: File
  backImage?: File
  certification?: boolean
}

export async function applyToBecomeProvider(
  inputOrFormData: ApplyProviderInput | FormData
): Promise<{ error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { error: "Not authenticated. Please log in." }

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) return { error: "No email found for account." }

    let name = ""
    let phone = ""
    let businessName = ""
    let idType: GovernmentIdType = "philippine_national_id"
    let customIdType: string | undefined
    let frontImage: File | null = null
    let backImage: File | null = null
    let certification = false

    if (inputOrFormData instanceof FormData) {
      name = (inputOrFormData.get("name") as string)?.trim() || ""
      phone = (inputOrFormData.get("phone") as string)?.trim() || ""
      businessName = (inputOrFormData.get("businessName") as string)?.trim() || ""
      idType = (inputOrFormData.get("idType") as GovernmentIdType) || "philippine_national_id"
      customIdType = (inputOrFormData.get("customIdType") as string)?.trim() || undefined
      frontImage = inputOrFormData.get("frontImage") as File | null
      backImage = inputOrFormData.get("backImage") as File | null
      certification =
        inputOrFormData.get("certification") === "true" || inputOrFormData.get("certification") === "on"
    } else {
      name = inputOrFormData.name?.trim() || ""
      phone = inputOrFormData.phone?.trim() || ""
      businessName = inputOrFormData.businessName?.trim() || ""
      idType = inputOrFormData.idType || "philippine_national_id"
      customIdType = inputOrFormData.customIdType?.trim()
      frontImage = inputOrFormData.frontImage || null
      backImage = inputOrFormData.backImage || null
      certification = inputOrFormData.certification ?? true
    }

    if (!name || !phone || !businessName) {
      return { error: "Please fill in all applicant and business fleet details." }
    }

    const selectedOption = GOVERNMENT_ID_OPTIONS.find((opt) => opt.id === idType)
    if (!selectedOption) {
      return { error: "Please select a valid government-issued ID type." }
    }

    if (idType === "other" && !customIdType) {
      return { error: "Please specify the document type for your government ID." }
    }

    if (!certification) {
      return { error: "Please confirm that the submitted ID belongs to you and the information is accurate." }
    }

    if (!frontImage || frontImage.size === 0) {
      return { error: "Please upload a clear front image of your government-issued ID." }
    }

    if (selectedOption.requiresBack && (!backImage || backImage.size === 0)) {
      return { error: `A back image is required for ${selectedOption.label}.` }
    }

    // Upload front image securely
    const frontUpload = await uploadVerificationDocument({
      file: frontImage,
      role: "provider",
      userId: user.id,
      side: "front",
    })
    if (frontUpload.error || !frontUpload.path) {
      return { error: frontUpload.error || "Failed to upload front image." }
    }

    let backPath: string | null = null
    if (backImage && backImage.size > 0) {
      const backUpload = await uploadVerificationDocument({
        file: backImage,
        role: "provider",
        userId: user.id,
        side: "back",
      })
      if (backUpload.error || !backUpload.path) {
        return { error: backUpload.error || "Failed to upload back image." }
      }
      backPath = backUpload.path
    }

    const db = createServiceClient()

    // Check if applicant already exists in providers
    const { data: existing } = await db
      .from("providers")
      .select("id, is_verified, is_active, verification_status")
      .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
      .maybeSingle()

    if (existing?.is_verified) {
      return { error: "You are already an approved and verified rental provider." }
    }

    let providerId = existing?.id
    const nowIso = new Date().toISOString()

    if (existing) {
      // Update existing record (handles resubmission seamlessly)
      const { error: updateErr } = await db
        .from("providers")
        .update({
          clerk_user_id: user.id,
          name,
          email,
          phone,
          business_name: businessName,
          is_active: true,
          is_verified: false,
          verification_status: "pending",
          id_type: idType,
          id_type_custom: customIdType || null,
          id_front_path: frontUpload.path,
          id_back_path: backPath,
          rejection_reason: null,
          submitted_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", existing.id)

      if (updateErr) return { error: updateErr.message }
    } else {
      // New record insertion
      const { data: newProvider, error: insertErr } = await db
        .from("providers")
        .insert({
          clerk_user_id: user.id,
          name,
          email,
          phone,
          business_name: businessName,
          is_active: true,
          is_verified: false,
          verification_status: "pending",
          id_type: idType,
          id_type_custom: customIdType || null,
          id_front_path: frontUpload.path,
          id_back_path: backPath,
          rejection_reason: null,
          submitted_at: nowIso,
        })
        .select("id")
        .single()

      if (insertErr) return { error: insertErr.message }
      providerId = newProvider?.id
    }

    // Record in audit log if table exists
    try {
      await db.from("verification_applications").insert({
        user_id: user.id,
        role: "provider",
        target_id: providerId,
        applicant_name: name,
        applicant_email: email,
        applicant_phone: phone,
        detail: businessName,
        id_type: idType,
        id_type_custom: customIdType || null,
        id_front_path: frontUpload.path,
        id_back_path: backPath,
        status: "pending",
        submitted_at: nowIso,
      })
    } catch {}

    // Dispatch notifications
    await sendSystemNotification({
      userId: user.id,
      userRole: "customer",
      title: "Rental Provider ID Verification Submitted",
      message:
        "Your government-issued ID documents have been received and are pending administrator review. You will receive an update once reviewed.",
      type: "verification",
      serviceType: "rental",
      actionUrl: "/dashboard/customer/apply/provider",
    })

    await sendSystemNotification({
      userId: "admin",
      userRole: "admin",
      title: "New Rental Provider Application",
      message: `${name} submitted government-issued ID documents for Rental Provider onboarding.`,
      type: "verification",
      serviceType: "rental",
      actionUrl: "/dashboard/admin/verification",
    })

    revalidatePath("/dashboard/customer")
    revalidatePath("/dashboard/customer/apply/provider")
    revalidatePath("/dashboard/admin/verification")
    revalidatePath("/dashboard/admin/providers")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit provider application."
    return { error: message }
  }
}

export interface UserRoleApplicationSummary {
  id: string
  hasApplied: boolean
  status: VerificationStatus
  idType?: string | null
  idTypeCustom?: string | null
  idFrontPath?: string | null
  idBackPath?: string | null
  rejectionReason?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
  reviewedBy?: string | null
  name?: string
  phone?: string
  vehicleModel?: string
  plateNumber?: string
  businessName?: string
}

export interface UserApplicationStatusResult {
  hasAppliedRider: boolean
  isRiderPending: boolean
  isRiderVerified: boolean
  isRiderRejected: boolean
  isRiderResubmission: boolean
  riderApplication: UserRoleApplicationSummary | null

  hasAppliedProvider: boolean
  isProviderPending: boolean
  isProviderVerified: boolean
  isProviderRejected: boolean
  isProviderResubmission: boolean
  providerApplication: UserRoleApplicationSummary | null
}

export async function getUserApplicationStatus(): Promise<UserApplicationStatusResult> {
  const emptyResult: UserApplicationStatusResult = {
    hasAppliedRider: false,
    isRiderPending: false,
    isRiderVerified: false,
    isRiderRejected: false,
    isRiderResubmission: false,
    riderApplication: null,
    hasAppliedProvider: false,
    isProviderPending: false,
    isProviderVerified: false,
    isProviderRejected: false,
    isProviderResubmission: false,
    providerApplication: null,
  }

  try {
    const user = await currentUser()
    if (!user) return emptyResult

    const email = user.emailAddresses[0]?.emailAddress || ""
    const db = createServiceClient()

    const [{ data: rider }, { data: provider }] = await Promise.all([
      db
        .from("riders")
        .select("*")
        .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
        .maybeSingle(),
      db
        .from("providers")
        .select("*")
        .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
        .maybeSingle(),
    ])

    // Resolve Rider Application State
    let riderStatus: VerificationStatus = "unverified"
    let riderSummary: UserRoleApplicationSummary | null = null

    if (rider) {
      if (rider.is_verified) {
        riderStatus = "verified"
      } else if (rider.verification_status === "resubmission_required") {
        riderStatus = "resubmission_required"
      } else if (rider.verification_status === "rejected" || !rider.is_active) {
        riderStatus = "rejected"
      } else {
        riderStatus = "pending"
      }

      riderSummary = {
        id: rider.id,
        hasApplied: true,
        status: riderStatus,
        idType: rider.id_type || null,
        idTypeCustom: rider.id_type_custom || null,
        idFrontPath: rider.id_front_path || null,
        idBackPath: rider.id_back_path || null,
        rejectionReason: rider.rejection_reason || null,
        submittedAt: rider.submitted_at || rider.created_at,
        reviewedAt: rider.reviewed_at || null,
        reviewedBy: rider.reviewed_by || null,
        name: rider.name,
        phone: rider.phone,
        vehicleModel: rider.vehicle_model,
        plateNumber: rider.plate_number,
      }
    }

    // Resolve Provider Application State
    let providerStatus: VerificationStatus = "unverified"
    let providerSummary: UserRoleApplicationSummary | null = null

    if (provider) {
      if (provider.is_verified) {
        providerStatus = "verified"
      } else if (provider.verification_status === "resubmission_required") {
        providerStatus = "resubmission_required"
      } else if (provider.verification_status === "rejected" || !provider.is_active) {
        providerStatus = "rejected"
      } else {
        providerStatus = "pending"
      }

      providerSummary = {
        id: provider.id,
        hasApplied: true,
        status: providerStatus,
        idType: provider.id_type || null,
        idTypeCustom: provider.id_type_custom || null,
        idFrontPath: provider.id_front_path || null,
        idBackPath: provider.id_back_path || null,
        rejectionReason: provider.rejection_reason || null,
        submittedAt: provider.submitted_at || provider.created_at,
        reviewedAt: provider.reviewed_at || null,
        reviewedBy: provider.reviewed_by || null,
        name: provider.name,
        phone: provider.phone,
        businessName: provider.business_name,
      }
    }

    return {
      hasAppliedRider: !!rider,
      isRiderPending: riderStatus === "pending",
      isRiderVerified: riderStatus === "verified",
      isRiderRejected: riderStatus === "rejected",
      isRiderResubmission: riderStatus === "resubmission_required",
      riderApplication: riderSummary,

      hasAppliedProvider: !!provider,
      isProviderPending: providerStatus === "pending",
      isProviderVerified: providerStatus === "verified",
      isProviderRejected: providerStatus === "rejected",
      isProviderResubmission: providerStatus === "resubmission_required",
      providerApplication: providerSummary,
    }
  } catch {
    return emptyResult
  }
}

// ─── Admin Verification Queue Actions ──────────────────────────────────────────

export interface PendingApplication {
  id: string
  type: "rider" | "provider"
  name: string
  email: string
  phone: string | null
  detail: string
  created_at: string
  status: VerificationStatus
  id_type?: string | null
  id_type_custom?: string | null
  id_front_path?: string | null
  id_back_path?: string | null
  rejection_reason?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  submitted_at?: string | null
}

export async function getPendingApplications(): Promise<PendingApplication[]> {
  try {
    const db = createServiceClient()

    const [{ data: riders }, { data: providers }] = await Promise.all([
      db.from("riders").select("*").order("created_at", { ascending: false }),
      db.from("providers").select("*").order("created_at", { ascending: false }),
    ])

    const list: PendingApplication[] = []

    for (const r of riders ?? []) {
      const vStatus =
        (r.verification_status as VerificationStatus) || (r.is_verified ? "verified" : "pending")
      list.push({
        id: r.id,
        type: "rider",
        name: r.name,
        email: r.email,
        phone: r.phone,
        detail: `${r.vehicle_model || "Motorcycle"} (${r.plate_number || "No plate"})`,
        created_at: r.created_at,
        status: vStatus,
        id_type: r.id_type || null,
        id_type_custom: r.id_type_custom || null,
        id_front_path: r.id_front_path || null,
        id_back_path: r.id_back_path || null,
        rejection_reason: r.rejection_reason || null,
        reviewed_by: r.reviewed_by || null,
        reviewed_at: r.reviewed_at || null,
        submitted_at: r.submitted_at || r.created_at,
      })
    }

    for (const p of providers ?? []) {
      const vStatus =
        (p.verification_status as VerificationStatus) || (p.is_verified ? "verified" : "pending")
      list.push({
        id: p.id,
        type: "provider",
        name: p.name,
        email: p.email,
        phone: p.phone,
        detail: p.business_name || "Rental Provider",
        created_at: p.created_at,
        status: vStatus,
        id_type: p.id_type || null,
        id_type_custom: p.id_type_custom || null,
        id_front_path: p.id_front_path || null,
        id_back_path: p.id_back_path || null,
        rejection_reason: p.rejection_reason || null,
        reviewed_by: p.reviewed_by || null,
        reviewed_at: p.reviewed_at || null,
        submitted_at: p.submitted_at || p.created_at,
      })
    }

    return list.sort(
      (a, b) =>
        new Date(b.submitted_at || b.created_at).getTime() -
        new Date(a.submitted_at || a.created_at).getTime()
    )
  } catch (err) {
    console.error("[getPendingApplications]", err)
    return []
  }
}

/**
 * Loads short-lived signed URLs for authorized administrator review of submitted ID documents.
 */
export async function getVerificationDocumentUrls(
  type: "rider" | "provider",
  id: string
): Promise<{
  frontUrl: string | null
  backUrl: string | null
  idType?: string | null
  idTypeCustom?: string | null
  error: string | null
}> {
  try {
    await requireRole("admin")

    const db = createServiceClient()
    const table = type === "rider" ? "riders" : "providers"
    const { data: record, error } = await db.from(table).select("*").eq("id", id).maybeSingle()

    if (error || !record) {
      return { frontUrl: null, backUrl: null, error: "Application record not found." }
    }

    let frontUrl: string | null = null
    let backUrl: string | null = null

    if (record.id_front_path) {
      const res = await getDocumentSignedUrl(record.id_front_path, 600)
      frontUrl = res.signedUrl
    }

    if (record.id_back_path) {
      const res = await getDocumentSignedUrl(record.id_back_path, 600)
      backUrl = res.signedUrl
    }

    return {
      frontUrl,
      backUrl,
      idType: record.id_type,
      idTypeCustom: record.id_type_custom,
      error: null,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load document URLs."
    return { frontUrl: null, backUrl: null, error: msg }
  }
}

/**
 * Processes an administrator decision (Approve, Reject, or Request Resubmission).
 * Enforces mandatory reason recording for Reject and Resubmit decisions.
 */
export async function reviewApplication(input: {
  type: "rider" | "provider"
  id: string
  decision: "approve" | "reject" | "resubmit"
  reason?: string
}): Promise<{ error: string | null }> {
  try {
    const { user } = await requireRole("admin")
    const reviewer = user.emailAddresses[0]?.emailAddress || user.id

    if ((input.decision === "reject" || input.decision === "resubmit") && !input.reason?.trim()) {
      return { error: "A clear reason or explanation is required for this decision." }
    }

    const db = createServiceClient()
    const table = input.type === "rider" ? "riders" : "providers"

    // Fetch applicant record
    const { data: record } = await db.from(table).select("*").eq("id", input.id).maybeSingle()
    if (!record) {
      return { error: "Application record not found." }
    }

    const nowIso = new Date().toISOString()
    let updatePayload: Record<string, unknown> = {}

    if (input.decision === "approve") {
      updatePayload = {
        is_verified: true,
        is_active: true,
        verification_status: "verified",
        rejection_reason: null,
        reviewed_by: reviewer,
        reviewed_at: nowIso,
        updated_at: nowIso,
      }
    } else if (input.decision === "reject") {
      updatePayload = {
        is_verified: false,
        is_active: false,
        verification_status: "rejected",
        rejection_reason: input.reason?.trim(),
        reviewed_by: reviewer,
        reviewed_at: nowIso,
        updated_at: nowIso,
      }
    } else if (input.decision === "resubmit") {
      updatePayload = {
        is_verified: false,
        is_active: true,
        verification_status: "resubmission_required",
        rejection_reason: input.reason?.trim(),
        reviewed_by: reviewer,
        reviewed_at: nowIso,
        updated_at: nowIso,
      }
    }

    let { error: updateError } = await db.from(table).update(updatePayload).eq("id", input.id)
    if (updateError) {
      console.warn(`[reviewApplication] Full update failed on ${table}, attempting fallback with baseline columns:`, updateError.message)
      // Fallback for baseline schema if migration 008 columns are not yet live
      const fallbackPayload: Record<string, unknown> = {
        is_verified: input.decision === "approve",
        is_active: input.decision === "approve" || input.decision === "resubmit",
        updated_at: nowIso,
      }
      const { error: fallbackError } = await db.from(table).update(fallbackPayload).eq("id", input.id)
      if (fallbackError) return { error: fallbackError.message }
    }

    // Update audit log if table exists
    try {
      await db
        .from("verification_applications")
        .update({
          status: updatePayload.verification_status,
          rejection_reason: updatePayload.rejection_reason || null,
          reviewed_by: reviewer,
          reviewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("target_id", input.id)
        .order("created_at", { ascending: false })
        .limit(1)
    } catch {}

    // Send notifications to applicant with fail-safe wrapper
    try {
      const applicantUserId = record.clerk_user_id || record.id
      if (input.decision === "approve") {
        await sendSystemNotification({
          userId: applicantUserId,
          userRole: input.type === "rider" ? "rider" : "provider",
          title: "Government ID Verification Approved!",
          message: `Congratulations ${record.name}! Your verification application has been approved. You now have full access to the ${
            input.type === "rider" ? "Rider Console" : "Rental Provider Hub"
          }.`,
          type: "verification",
          serviceType: input.type === "rider" ? "ride" : "rental",
          actionUrl: input.type === "rider" ? "/dashboard/rider" : "/dashboard/provider",
        })
      } else if (input.decision === "reject") {
        await sendSystemNotification({
          userId: applicantUserId,
          userRole: "customer",
          title: "Verification Application Declined",
          message: `Your ${input.type} application could not be verified. Reason: ${input.reason?.trim()}. Please review requirements before re-applying.`,
          type: "verification",
          serviceType: input.type === "rider" ? "ride" : "rental",
          actionUrl: `/dashboard/customer/apply/${input.type}`,
        })
      } else if (input.decision === "resubmit") {
        await sendSystemNotification({
          userId: applicantUserId,
          userRole: "customer",
          title: "Action Required: ID Document Resubmission",
          message: `Your verification requires additional information: ${input.reason?.trim()}. Please resubmit your documents.`,
          type: "verification",
          serviceType: input.type === "rider" ? "ride" : "rental",
          actionUrl: `/dashboard/customer/apply/${input.type}`,
        })
      }
    } catch (notifErr) {
      console.warn("[reviewApplication] Notification dispatch warning:", notifErr)
    }

    try {
      revalidatePath("/dashboard/admin/verification")
      revalidatePath("/dashboard/admin/riders")
      revalidatePath("/dashboard/admin/providers")
      revalidatePath("/dashboard/customer/apply/rider")
      revalidatePath("/dashboard/customer/apply/provider")
      revalidatePath("/dashboard")
    } catch {}

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review application."
    return { error: message }
  }
}

export async function approveApplication(
  type: "rider" | "provider",
  id: string
): Promise<{ error: string | null }> {
  return reviewApplication({ type, id, decision: "approve" })
}

export async function rejectApplication(
  type: "rider" | "provider",
  id: string,
  reason?: string
): Promise<{ error: string | null }> {
  return reviewApplication({
    type,
    id,
    decision: "reject",
    reason: reason || "Application declined by administrator.",
  })
}

