"use server"

import { createServiceClient } from "@/lib/supabase"
import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { getRiderRecord, getProviderRecord, assignRider, type Booking, type BookingStatus } from "@/lib/actions/bookings"

import {
  type IncidentType,
  type IncidentSeverity,
  type IncidentStatus,
  type BookingIncident,
  type CancellationMetadata,
  type EmergencyMetadata,
  serializeCancellationMetadata,
  serializeEmergencyMetadata,
  parseBookingCancellationInfo,
} from "@/lib/cancellations/metadata"

export type {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  BookingIncident,
  CancellationMetadata,
  EmergencyMetadata,
}
export {
  serializeCancellationMetadata,
  serializeEmergencyMetadata,
  parseBookingCancellationInfo,
}

// ─── 1. Customer: Cancel Booking ─────────────────────────────────────────────

export interface CancelBookingCustomerInput {
  bookingId: string
  reason: string
  explanation?: string
}

export async function cancelBookingByCustomer(
  input: CancelBookingCustomerInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: "Not authenticated." }

    const db = createServiceClient()

    // 1. Fetch booking to check ownership & eligibility
    const { data: booking, error: fetchError } = await db
      .from("bookings")
      .select("*, rider:riders!rider_id(*)")
      .eq("id", input.bookingId)
      .single()

    if (fetchError || !booking) {
      return { success: false, error: "Booking record not found." }
    }

    // Server-side ownership check: must belong to the logged-in customer
    if (booking.customer_id !== user.id) {
      return { success: false, error: "Unauthorized. You may only cancel your own bookings." }
    }

    // 2. Service-specific eligibility rules
    if (booking.status === "completed") {
      return { success: false, error: "Completed bookings cannot be cancelled retroactively." }
    }

    if (booking.status === "cancelled") {
      return { success: false, error: "This booking is already cancelled." }
    }

    if (booking.status === "in_progress") {
      if (booking.service_type === "ride") {
        return {
          success: false,
          error: "Your trip is currently underway. For safety, please instruct your rider to end the trip safely or use Emergency Report.",
        }
      } else if (booking.service_type === "delivery") {
        return {
          success: false,
          error: "The parcel has already been picked up and is in transit. Cancellation requires custody return verification. Please report an urgent incident or contact dispatch.",
        }
      } else if (booking.service_type === "rental") {
        return {
          success: false,
          error: "The vehicle or equipment is currently in use. Active rentals require an early-return or roadside-assistance workflow.",
        }
      }
    }

    if (!["pending", "assigned", "accepted"].includes(booking.status)) {
      return { success: false, error: `Bookings with status '${booking.status}' cannot be cancelled.` }
    }

    const previousStatus = booking.status as BookingStatus
    const customerName =
      user.fullName ||
      user.firstName ||
      user.emailAddresses[0]?.emailAddress.split("@")[0] ||
      "Customer"

    const meta: CancellationMetadata = {
      reason: input.reason.trim(),
      explanation: input.explanation?.trim() || undefined,
      cancelledBy: customerName,
      cancelledByRole: "customer",
      cancelledAt: new Date().toISOString(),
      previousStatus,
    }

    const updatedNotes = serializeCancellationMetadata(booking.notes, meta)

    // 3. Atomic status update
    const { error: updateError } = await db
      .from("bookings")
      .update({
        status: "cancelled",
        notes: updatedNotes,
      })
      .eq("id", input.bookingId)
      .in("status", ["pending", "assigned", "accepted"]) // concurrency safeguard

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // 4. Record in booking_incidents table (dual persistence)
    try {
      await db.from("booking_incidents").insert({
        booking_id: input.bookingId,
        incident_type: "customer_cancellation",
        severity: "standard",
        status: "closed",
        category: "Customer Voluntary Cancellation",
        reason: input.reason.trim(),
        description: input.explanation?.trim() || null,
        reporter_id: user.id,
        reporter_name: customerName,
        reporter_role: "customer",
        previous_status: previousStatus,
        resulting_status: "cancelled",
        metadata: { ...meta, serviceType: booking.service_type },
      })
    } catch (incidentErr) {
      console.warn("[cancelBookingByCustomer] Could not write to booking_incidents table (metadata saved to notes):", incidentErr)
    }

    // 5. Notify assigned rider if any
    if (booking.rider_id) {
      console.log(`[Notification] Rider ${booking.rider_id} notified: Customer cancelled booking ${booking.reference}.`)
    }

    revalidatePath("/dashboard/customer/bookings")
    revalidatePath("/dashboard/customer")
    revalidatePath("/dashboard/admin/bookings")
    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/rider")
    revalidatePath("/dashboard/provider")

    return { success: true, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel booking."
    console.error("[cancelBookingByCustomer] Exception:", err)
    return { success: false, error: message }
  }
}

// ─── 2. Rider: Withdraw from Assignment / Emergency Cancellation ──────────────

export interface WithdrawRiderAssignmentInput {
  bookingId: string
  reason: string
  explanation?: string
  isEmergency?: boolean
  locationCoords?: { lat: number; lng: number }
  locationAddress?: string
}

export async function withdrawRiderAssignment(
  input: WithdrawRiderAssignmentInput
): Promise<{ success: boolean; isReassigned: boolean; error: string | null }> {
  try {
    const rider = await getRiderRecord()
    if (!rider) {
      return { success: false, isReassigned: false, error: "Unauthorized. Must be an active verified rider." }
    }

    const db = createServiceClient()

    // 1. Fetch booking to verify rider assignment
    const { data: booking, error: fetchError } = await db
      .from("bookings")
      .select("*")
      .eq("id", input.bookingId)
      .single()

    if (fetchError || !booking) {
      return { success: false, isReassigned: false, error: "Booking not found." }
    }

    if (booking.rider_id !== rider.id) {
      return { success: false, isReassigned: false, error: "Unauthorized. You are not the assigned rider for this booking." }
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return { success: false, isReassigned: false, error: `Cannot withdraw from a ${booking.status} booking.` }
    }

    const previousStatus = booking.status as BookingStatus

    // 2. Pre-trip / Pre-pickup Withdrawal (assigned or accepted)
    // IMPORTANT: Customer booking is NOT cancelled! It is returned to the reassignment queue.
    if (["assigned", "accepted"].includes(booking.status)) {
      const withdrawalMeta: CancellationMetadata = {
        reason: input.reason.trim(),
        explanation: input.explanation?.trim() || undefined,
        cancelledBy: rider.name,
        cancelledByRole: "rider",
        cancelledAt: new Date().toISOString(),
        previousStatus,
        requiresAdminReview: false,
      }

      const updatedNotes = serializeCancellationMetadata(booking.notes, withdrawalMeta)

      // Reset rider_id and set status back to pending for reassignment
      const { error: updateError } = await db
        .from("bookings")
        .update({
          rider_id: null,
          status: "pending",
          notes: updatedNotes,
        })
        .eq("id", input.bookingId)
        .eq("rider_id", rider.id) // concurrency safeguard

      if (updateError) {
        return { success: false, isReassigned: false, error: updateError.message }
      }

      // Record withdrawal event in booking_incidents
      try {
        await db.from("booking_incidents").insert({
          booking_id: input.bookingId,
          incident_type: "rider_withdrawal",
          severity: input.isEmergency ? "urgent" : "standard",
          status: "open",
          category: input.isEmergency ? "Rider Emergency Withdrawal" : "Rider Assignment Decline",
          reason: input.reason.trim(),
          description: input.explanation?.trim() || null,
          reporter_id: rider.id,
          reporter_name: rider.name,
          reporter_role: "rider",
          previous_status: previousStatus,
          resulting_status: "pending (awaiting reassignment)",
          location_lat: input.locationCoords?.lat || null,
          location_lng: input.locationCoords?.lng || null,
          location_address: input.locationAddress || null,
          metadata: { riderPlate: rider.plate_number, riderPhone: rider.phone },
        })
      } catch (err) {
        console.warn("[withdrawRiderAssignment] Incident insert notice:", err)
      }

      revalidatePath("/dashboard/rider")
      revalidatePath("/dashboard/admin/bookings")
      revalidatePath("/dashboard/admin")
      revalidatePath("/dashboard/customer/bookings")

      return { success: true, isReassigned: true, error: null }
    }

    // 3. Active in-transit trip/delivery withdrawal (in_progress)
    // DO NOT blindly reset or reassign while parcel or passenger is with rider.
    if (booking.status === "in_progress") {
      const isDelivery = booking.service_type === "delivery"
      const incidentType: IncidentType = isDelivery ? "custody_incident" : "emergency_report"

      const emergMeta: EmergencyMetadata = {
        id: `inc_${Date.now()}`,
        category: input.reason.trim(),
        description: input.explanation?.trim() || (isDelivery ? "Rider reported incident while in possession of delivery parcel." : "Rider reported in-transit emergency with passenger on board."),
        reporterName: rider.name,
        reporterRole: "rider",
        reportedAt: new Date().toISOString(),
        severity: "urgent",
        status: "open",
        locationCoords: input.locationCoords,
        locationAddress: input.locationAddress,
      }

      const updatedNotes = serializeEmergencyMetadata(booking.notes, emergMeta)

      // Keep booking in progress or flag notes; alert admin dispatch immediately
      await db
        .from("bookings")
        .update({ notes: updatedNotes })
        .eq("id", input.bookingId)

      try {
        await db.from("booking_incidents").insert({
          booking_id: input.bookingId,
          incident_type: incidentType,
          severity: "urgent",
          status: "open",
          category: isDelivery ? "Active Delivery Custody Incident" : "In-Transit Passenger Emergency",
          reason: input.reason.trim(),
          description: input.explanation?.trim() || null,
          reporter_id: rider.id,
          reporter_name: rider.name,
          reporter_role: "rider",
          previous_status: "in_progress",
          resulting_status: "in_progress (escalated to admin)",
          location_lat: input.locationCoords?.lat || null,
          location_lng: input.locationCoords?.lng || null,
          location_address: input.locationAddress || null,
          admin_notes: isDelivery
            ? "ATTENTION DISPATCH: Courier has parcel in physical custody. Coordinate return-to-sender or replacement courier transfer."
            : "ATTENTION DISPATCH: Passenger in transit. Contact rider and passenger to verify safety.",
          metadata: { riderPlate: rider.plate_number, inTransit: true },
        })
      } catch (err) {
        console.warn("[withdrawRiderAssignment] In-transit incident log notice:", err)
      }

      revalidatePath("/dashboard/rider")
      revalidatePath("/dashboard/admin/bookings")
      revalidatePath("/dashboard/admin")

      return {
        success: true,
        isReassigned: false,
        error: null,
      }
    }

    return { success: false, isReassigned: false, error: "Invalid booking state for withdrawal." }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to withdraw assignment."
    console.error("[withdrawRiderAssignment] Exception:", err)
    return { success: false, isReassigned: false, error: message }
  }
}

// ─── 3. Rental Provider: Emergency Cancellation ───────────────────────────────

export interface CancelRentalProviderInput {
  bookingId: string
  reason: string
  explanation?: string
}

export async function cancelRentalByProvider(
  input: CancelRentalProviderInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const provider = await getProviderRecord()
    if (!provider) {
      return { success: false, error: "Unauthorized. Must be an approved rental provider." }
    }

    const db = createServiceClient()

    const { data: booking, error: fetchError } = await db
      .from("bookings")
      .select("*")
      .eq("id", input.bookingId)
      .eq("service_type", "rental")
      .single()

    if (fetchError || !booking) {
      return { success: false, error: "Rental booking not found." }
    }

    if (["completed", "cancelled"].includes(booking.status)) {
      return { success: false, error: `Cannot cancel a ${booking.status} rental.` }
    }

    const previousStatus = booking.status as BookingStatus

    // If active handover in progress, escalate as urgent rental incident
    if (booking.status === "in_progress") {
      const emergMeta: EmergencyMetadata = {
        id: `rnt_inc_${Date.now()}`,
        category: input.reason.trim(),
        description: input.explanation?.trim() || "Provider reported emergency during active vehicle rental.",
        reporterName: provider.business_name || provider.name,
        reporterRole: "provider",
        reportedAt: new Date().toISOString(),
        severity: "urgent",
        status: "open",
      }

      const updatedNotes = serializeEmergencyMetadata(booking.notes, emergMeta)
      await db.from("bookings").update({ notes: updatedNotes }).eq("id", input.bookingId)

      try {
        await db.from("booking_incidents").insert({
          booking_id: input.bookingId,
          incident_type: "rental_incident",
          severity: "urgent",
          status: "open",
          category: "Active Rental Breakdown / Issue",
          reason: input.reason.trim(),
          description: input.explanation?.trim() || null,
          reporter_id: provider.id,
          reporter_name: provider.business_name || provider.name,
          reporter_role: "provider",
          previous_status: "in_progress",
          resulting_status: "in_progress (incident flagged)",
          admin_notes: "ATTENTION DISPATCH: Rental vehicle currently in customer possession reported breakdown or emergency. Coordinate roadside assistance or replacement.",
        })
      } catch (err) {
        console.warn("[cancelRentalByProvider] Incident insert notice:", err)
      }

      revalidatePath("/dashboard/provider")
      revalidatePath("/dashboard/admin/bookings")
      return { success: true, error: null }
    }

    // Upcoming pre-handover reservation (pending, assigned, accepted)
    const cancelMeta: CancellationMetadata = {
      reason: input.reason.trim(),
      explanation: input.explanation?.trim() || undefined,
      cancelledBy: provider.business_name || provider.name,
      cancelledByRole: "provider",
      cancelledAt: new Date().toISOString(),
      previousStatus,
    }

    const updatedNotes = serializeCancellationMetadata(booking.notes, cancelMeta)

    const { error: updateError } = await db
      .from("bookings")
      .update({
        status: "cancelled",
        notes: updatedNotes,
      })
      .eq("id", input.bookingId)
      .in("status", ["pending", "assigned", "accepted"])

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Record incident
    try {
      await db.from("booking_incidents").insert({
        booking_id: input.bookingId,
        incident_type: "provider_cancellation",
        severity: "standard",
        status: "closed",
        category: "Provider Pre-Handover Cancellation",
        reason: input.reason.trim(),
        description: input.explanation?.trim() || null,
        reporter_id: provider.id,
        reporter_name: provider.business_name || provider.name,
        reporter_role: "provider",
        previous_status: previousStatus,
        resulting_status: "cancelled",
        metadata: { vehicleCategory: booking.vehicle_category },
      })
    } catch (err) {
      console.warn("[cancelRentalByProvider] Incident insert notice:", err)
    }

    revalidatePath("/dashboard/provider")
    revalidatePath("/dashboard/admin/bookings")
    revalidatePath("/dashboard/customer/bookings")

    return { success: true, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel rental."
    console.error("[cancelRentalByProvider] Exception:", err)
    return { success: false, error: message }
  }
}

// ─── 4. Emergency Reporting Action ───────────────────────────────────────────

export interface ReportEmergencyInput {
  bookingId: string
  category: string
  description: string
  locationCoords?: { lat: number; lng: number }
  locationAddress?: string
}

export async function reportEmergencyIncident(
  input: ReportEmergencyInput
): Promise<{ success: boolean; incidentId: string | null; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { success: false, incidentId: null, error: "Not authenticated." }

    const db = createServiceClient()

    const { data: booking, error: fetchError } = await db
      .from("bookings")
      .select("*")
      .eq("id", input.bookingId)
      .single()

    if (fetchError || !booking) {
      return { success: false, incidentId: null, error: "Booking reference not found." }
    }

    // Determine user role
    const email = user.emailAddresses[0]?.emailAddress || ""
    const [{ data: rider }, { data: provider }] = await Promise.all([
      db.from("riders").select("id, name").or(`clerk_user_id.eq.${user.id},email.eq.${email}`).maybeSingle(),
      db.from("providers").select("id, name, business_name").or(`clerk_user_id.eq.${user.id},email.eq.${email}`).maybeSingle(),
    ])

    const reporterRole: "customer" | "rider" | "provider" | "admin" =
      booking.rider_id && rider && rider.id === booking.rider_id
        ? "rider"
        : provider
        ? "provider"
        : "customer"

    const reporterName =
      reporterRole === "rider"
        ? rider?.name || "Rider"
        : reporterRole === "provider"
        ? provider?.business_name || provider?.name || "Provider"
        : user.fullName || user.firstName || "Customer"

    const emergMeta: EmergencyMetadata = {
      id: `emg_${Date.now()}`,
      category: input.category.trim(),
      description: input.description.trim(),
      reporterName,
      reporterRole,
      reportedAt: new Date().toISOString(),
      severity: "critical",
      status: "open",
      locationCoords: input.locationCoords,
      locationAddress: input.locationAddress,
    }

    const updatedNotes = serializeEmergencyMetadata(booking.notes, emergMeta)
    await db.from("bookings").update({ notes: updatedNotes }).eq("id", input.bookingId)

    let createdId = emergMeta.id
    try {
      const { data: incidentRow } = await db
        .from("booking_incidents")
        .insert({
          booking_id: input.bookingId,
          incident_type: "emergency_report",
          severity: "critical",
          status: "open",
          category: input.category.trim(),
          reason: input.category.trim(),
          description: input.description.trim(),
          reporter_id: user.id,
          reporter_name: reporterName,
          reporter_role: reporterRole,
          previous_status: booking.status,
          resulting_status: booking.status, // does not blindly cancel booking
          location_lat: input.locationCoords?.lat || null,
          location_lng: input.locationCoords?.lng || null,
          location_address: input.locationAddress || null,
          admin_notes: "URGENT DISPATCH ALERT: Immediate operator review required.",
        })
        .select("id")
        .single()

      if (incidentRow?.id) {
        createdId = incidentRow.id
      }
    } catch (err) {
      console.warn("[reportEmergencyIncident] booking_incidents insert notice:", err)
    }

    console.log(`[EMERGENCY DISPATCH ALERT] Category: ${input.category} | Booking: ${booking.reference} | Reporter: ${reporterName} (${reporterRole})`)

    revalidatePath("/dashboard/admin/bookings")
    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/rider")
    revalidatePath("/dashboard/customer/bookings")

    return { success: true, incidentId: createdId, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit emergency report."
    console.error("[reportEmergencyIncident] Exception:", err)
    return { success: false, incidentId: null, error: message }
  }
}

// ─── 5. Admin: Query & Resolve Incidents ──────────────────────────────────────

export async function getBookingIncidents(bookingId?: string): Promise<BookingIncident[]> {
  try {
    const db = createServiceClient()
    let query = db
      .from("booking_incidents")
      .select("*, booking:booking_id(*)")
      .order("created_at", { ascending: false })

    if (bookingId) {
      query = query.eq("booking_id", bookingId)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return data as BookingIncident[]
    }

    // Fallback: Parse from bookings table notes if table is empty or pending migration
    let bookingsQuery = db.from("bookings").select("*")
    if (bookingId) {
      bookingsQuery = bookingsQuery.eq("id", bookingId)
    }
    const { data: bookings } = await bookingsQuery

    const syntheticIncidents: BookingIncident[] = []

    for (const b of bookings || []) {
      const parsed = parseBookingCancellationInfo(b.notes)
      if (parsed.emergency) {
        syntheticIncidents.push({
          id: parsed.emergency.id,
          booking_id: b.id,
          incident_type: "emergency_report",
          severity: parsed.emergency.severity || "critical",
          status: parsed.emergency.status || "open",
          category: parsed.emergency.category,
          reason: parsed.emergency.category,
          description: parsed.emergency.description,
          reporter_id: "unknown",
          reporter_name: parsed.emergency.reporterName,
          reporter_role: parsed.emergency.reporterRole,
          previous_status: b.status,
          resulting_status: b.status,
          location_lat: parsed.emergency.locationCoords?.lat || null,
          location_lng: parsed.emergency.locationCoords?.lng || null,
          location_address: parsed.emergency.locationAddress || null,
          created_at: parsed.emergency.reportedAt,
          updated_at: parsed.emergency.reportedAt,
          booking: b as Booking,
        })
      }
      if (parsed.cancellation) {
        syntheticIncidents.push({
          id: `cancel_${b.id}`,
          booking_id: b.id,
          incident_type: (parsed.cancellation.cancelledByRole === "rider"
            ? "rider_withdrawal"
            : parsed.cancellation.cancelledByRole === "provider"
            ? "provider_cancellation"
            : "customer_cancellation") as IncidentType,
          severity: "standard",
          status: "closed",
          category: parsed.cancellation.reason,
          reason: parsed.cancellation.reason,
          description: parsed.cancellation.explanation || null,
          reporter_id: "unknown",
          reporter_name: parsed.cancellation.cancelledBy,
          reporter_role: parsed.cancellation.cancelledByRole,
          previous_status: parsed.cancellation.previousStatus,
          resulting_status: b.status,
          created_at: parsed.cancellation.cancelledAt,
          updated_at: parsed.cancellation.cancelledAt,
          booking: b as Booking,
        })
      }
    }

    return syntheticIncidents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (err) {
    console.error("[getBookingIncidents] Exception:", err)
    return []
  }
}

export interface ResolveIncidentInput {
  incidentId: string
  bookingId: string
  resolutionNotes: string
  status?: "investigating" | "resolved" | "closed"
  resultingBookingStatus?: BookingStatus
  reassignRiderId?: string
}

export async function resolveBookingIncident(
  input: ResolveIncidentInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: "Not authenticated." }

    const adminName = user.fullName || user.firstName || "Admin Dispatcher"
    const db = createServiceClient()

    // 1. Update incident row in Supabase
    try {
      await db
        .from("booking_incidents")
        .update({
          status: input.status || "resolved",
          admin_notes: input.resolutionNotes.trim(),
          resolved_by: adminName,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", input.incidentId)
    } catch (err) {
      console.warn("[resolveBookingIncident] Incident update notice:", err)
    }

    // 2. Perform requested booking action if specified
    if (input.reassignRiderId) {
      const assignRes = await assignRider(input.bookingId, input.reassignRiderId)
      if (assignRes.error) {
        return { success: false, error: `Incident marked, but rider assignment failed: ${assignRes.error}` }
      }
    } else if (input.resultingBookingStatus) {
      await db
        .from("bookings")
        .update({ status: input.resultingBookingStatus })
        .eq("id", input.bookingId)
    }

    revalidatePath("/dashboard/admin/bookings")
    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/rider")
    revalidatePath("/dashboard/customer/bookings")

    return { success: true, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resolve incident."
    console.error("[resolveBookingIncident] Exception:", err)
    return { success: false, error: message }
  }
}
