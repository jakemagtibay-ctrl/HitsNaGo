"use server"

import { createServiceClient } from "@/lib/supabase"
import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

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
}

export interface Provider {
  id: string
  name: string
  email: string
  phone: string | null
  business_name: string | null
  is_active: boolean
  is_verified: boolean
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
      .select("*, rider:rider_id(id,name,email,vehicle_model,plate_number,rating)")
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
      .select("*, rider:rider_id(id,name,email,vehicle_model,plate_number,rating)")
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
      unit_id: assignedUnit.id,
      listing_id: listingId,
      rental_start_date: start.toISOString(),
      rental_end_date: end.toISOString(),
    }

    let { data, error } = await db
      .from("bookings")
      .insert(insertPayload)
      .select("*, rider:rider_id(id,name,email,vehicle_model,plate_number,rating)")
      .single()

    if (error && (error.message?.includes("column") || error.code === "PGRST204")) {
      delete insertPayload.unit_id
      delete insertPayload.listing_id
      delete insertPayload.rental_start_date
      delete insertPayload.rental_end_date

      const retryRes = await db
        .from("bookings")
        .insert(insertPayload)
        .select("*, rider:rider_id(id,name,email,vehicle_model,plate_number,rating)")
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
      .select("*, rider:rider_id(id,name,email,vehicle_model,plate_number,rating)")
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

export async function getAllBookings(): Promise<Booking[]> {
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("bookings")
      .select("*, rider:rider_id(id,name,email,vehicle_model,plate_number,rating)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[getAllBookings]", error)
      return []
    }

    return (data as Booking[]) || []
  } catch (err) {
    console.error("[getAllBookings] Exception:", err)
    return []
  }
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
        .select("*, rider:rider_id(id,name,email,vehicle_model,plate_number,rating)")
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
      .select("*, rider:rider_id(id,name,email,vehicle_model,plate_number,rating)")
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
      .select("*, rider:rider_id(id,name,email,vehicle_model,plate_number,rating)")
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
}

export async function applyToBecomeRider(input: ApplyRiderInput): Promise<{ error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { error: "Not authenticated." }

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) return { error: "No email found for account." }

    const db = createServiceClient()

    // Check if already applied
    const { data: existing } = await db
      .from("riders")
      .select("id, is_verified, is_active")
      .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
      .maybeSingle()

    if (existing) {
      if (existing.is_verified) {
        return { error: "You are already an approved rider." }
      }
      return { error: "Your rider application has already been submitted and is pending admin approval." }
    }

    const { error } = await db.from("riders").insert({
      clerk_user_id: user.id,
      name: input.name.trim(),
      email: email.trim(),
      phone: input.phone.trim(),
      vehicle_model: input.vehicleModel.trim(),
      plate_number: input.plateNumber.trim(),
      is_active: true,
      is_verified: false,
    })

    if (error) return { error: error.message }

    revalidatePath("/dashboard/customer")
    revalidatePath("/dashboard/customer/apply/rider")
    revalidatePath("/dashboard/admin/verification")

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
}

export async function applyToBecomeProvider(input: ApplyProviderInput): Promise<{ error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { error: "Not authenticated." }

    const email = user.emailAddresses[0]?.emailAddress
    if (!email) return { error: "No email found for account." }

    const db = createServiceClient()

    const { data: existing } = await db
      .from("providers")
      .select("id, is_verified, is_active")
      .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
      .maybeSingle()

    if (existing) {
      if (existing.is_verified) {
        return { error: "You are already an approved rental provider." }
      }
      return { error: "Your rental provider application has already been submitted and is pending admin approval." }
    }

    const { error } = await db.from("providers").insert({
      clerk_user_id: user.id,
      name: input.name.trim(),
      email: email.trim(),
      phone: input.phone.trim(),
      business_name: input.businessName.trim(),
      is_active: true,
      is_verified: false,
    })

    if (error) return { error: error.message }

    revalidatePath("/dashboard/customer")
    revalidatePath("/dashboard/customer/apply/provider")
    revalidatePath("/dashboard/admin/verification")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit provider application."
    return { error: message }
  }
}

export async function getUserApplicationStatus(): Promise<{
  hasAppliedRider: boolean
  isRiderPending: boolean
  isRiderVerified: boolean
  hasAppliedProvider: boolean
  isProviderPending: boolean
  isProviderVerified: boolean
}> {
  try {
    const user = await currentUser()
    if (!user) {
      return {
        hasAppliedRider: false,
        isRiderPending: false,
        isRiderVerified: false,
        hasAppliedProvider: false,
        isProviderPending: false,
        isProviderVerified: false,
      }
    }

    const email = user.emailAddresses[0]?.emailAddress || ""
    const db = createServiceClient()

    const [{ data: rider }, { data: provider }] = await Promise.all([
      db
        .from("riders")
        .select("id, is_verified, is_active")
        .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
        .maybeSingle(),
      db
        .from("providers")
        .select("id, is_verified, is_active")
        .or(`clerk_user_id.eq.${user.id},email.eq.${email}`)
        .maybeSingle(),
    ])

    return {
      hasAppliedRider: !!rider,
      isRiderPending: !!rider && !rider.is_verified && rider.is_active,
      isRiderVerified: !!rider && rider.is_verified && rider.is_active,
      hasAppliedProvider: !!provider,
      isProviderPending: !!provider && !provider.is_verified && provider.is_active,
      isProviderVerified: !!provider && provider.is_verified && provider.is_active,
    }
  } catch {
    return {
      hasAppliedRider: false,
      isRiderPending: false,
      isRiderVerified: false,
      hasAppliedProvider: false,
      isProviderPending: false,
      isProviderVerified: false,
    }
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
}

export async function getPendingApplications(): Promise<PendingApplication[]> {
  try {
    const db = createServiceClient()

    const [{ data: riders }, { data: providers }] = await Promise.all([
      db
        .from("riders")
        .select("*")
        .eq("is_verified", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      db
        .from("providers")
        .select("*")
        .eq("is_verified", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    ])

    const list: PendingApplication[] = []

    for (const r of riders ?? []) {
      list.push({
        id: r.id,
        type: "rider",
        name: r.name,
        email: r.email,
        phone: r.phone,
        detail: `${r.vehicle_model || "Motorcycle"} (${r.plate_number || "No plate"})`,
        created_at: r.created_at,
      })
    }

    for (const p of providers ?? []) {
      list.push({
        id: p.id,
        type: "provider",
        name: p.name,
        email: p.email,
        phone: p.phone,
        detail: p.business_name || "Rental Provider",
        created_at: p.created_at,
      })
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (err) {
    console.error("[getPendingApplications]", err)
    return []
  }
}

export async function approveApplication(type: "rider" | "provider", id: string): Promise<{ error: string | null }> {
  try {
    const db = createServiceClient()
    const table = type === "rider" ? "riders" : "providers"

    const { error } = await db
      .from(table)
      .update({ is_verified: true, is_active: true })
      .eq("id", id)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/admin/verification")
    revalidatePath("/dashboard/admin/bookings")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to approve application."
    return { error: message }
  }
}

export async function rejectApplication(type: "rider" | "provider", id: string): Promise<{ error: string | null }> {
  try {
    const db = createServiceClient()
    const table = type === "rider" ? "riders" : "providers"

    // Reject deletes or deactivates the application
    const { error } = await db
      .from(table)
      .delete()
      .eq("id", id)

    if (error) return { error: error.message }

    revalidatePath("/dashboard/admin/verification")

    return { error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reject application."
    return { error: message }
  }
}
