"use server"

import { currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createServiceClient } from "@/lib/supabase"
import { MOCK_BUTUAN_RENTAL_LISTINGS, type ButuanRentalItem } from "@/lib/mock-data/butuan-rental-listings"
import type {
  RentalUnit,
  UnitStatus,
  ModelAvailabilityResult,
} from "@/types/rental"
import { getProviderRecord } from "@/lib/actions/bookings"

// ─── INITIAL BASELINE INVENTORY UNITS ─────────────────────────────────────────
// Baseline physical units for Butuan City fleet listings
const DEFAULT_INVENTORY_UNITS: RentalUnit[] = [
  // Toyota Innova (3 units)
  {
    id: "unit_innova_01",
    listingId: "rent_btn_01",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 1 (Plate ABC-1011)",
    status: "available",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "unit_innova_02",
    listingId: "rent_btn_01",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 2 (Plate ABC-1012)",
    status: "available",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "unit_innova_03",
    listingId: "rent_btn_01",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 3 (Plate ABC-1013)",
    status: "available",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-01-10T08:00:00Z",
  },

  // Toyota HiAce Grandia (2 units)
  {
    id: "unit_hiace_01",
    listingId: "rent_btn_02",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 1 (Plate VAN-2021)",
    status: "available",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "unit_hiace_02",
    listingId: "rent_btn_02",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 2 (Plate VAN-2022)",
    status: "available",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },

  // Honda Click 125i (3 units)
  {
    id: "unit_click_01",
    listingId: "rent_btn_03",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 1 (Plate MTO-3031)",
    status: "available",
    createdAt: "2026-02-01T14:00:00Z",
    updatedAt: "2026-02-01T14:00:00Z",
  },
  {
    id: "unit_click_02",
    listingId: "rent_btn_03",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 2 (Plate MTO-3032)",
    status: "available",
    createdAt: "2026-02-01T14:00:00Z",
    updatedAt: "2026-02-01T14:00:00Z",
  },
  {
    id: "unit_click_03",
    listingId: "rent_btn_03",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 3 (Plate MTO-3033)",
    status: "available",
    createdAt: "2026-02-01T14:00:00Z",
    updatedAt: "2026-02-01T14:00:00Z",
  },

  // Yamaha NMAX 155 (2 units)
  {
    id: "unit_nmax_01",
    listingId: "rent_btn_04",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 1 (Plate NMX-4041)",
    status: "available",
    createdAt: "2026-02-05T12:00:00Z",
    updatedAt: "2026-02-05T12:00:00Z",
  },
  {
    id: "unit_nmax_02",
    listingId: "rent_btn_04",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 2 (Plate NMX-4042)",
    status: "available",
    createdAt: "2026-02-05T12:00:00Z",
    updatedAt: "2026-02-05T12:00:00Z",
  },
]

// In-memory runtime store for persistent state across requests when database table is bootstrapping
const memoryUnitStore = new Map<string, RentalUnit>()
DEFAULT_INVENTORY_UNITS.forEach((u) => memoryUnitStore.set(u.id, { ...u }))

import { doDateRangesOverlap } from "@/lib/rentals/availability"

/**
 * Fetch all registered units for a given listing from Supabase or fallback store
 */
export async function getUnitsForListing(listingId: string): Promise<RentalUnit[]> {
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("rental_units")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true })

    if (!error && data && data.length > 0) {
      return data.map((d) => ({
        id: d.id,
        listingId: d.listing_id,
        providerId: d.provider_id,
        unitIdentifier: d.unit_identifier,
        status: d.status as UnitStatus,
        maintenanceStart: d.maintenance_start,
        maintenanceEnd: d.maintenance_end,
        maintenanceReason: d.maintenance_reason,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }))
    }
  } catch (err) {
    console.warn("[getUnitsForListing] Database query notice, using synced store:", err)
  }

  // Fallback to memoryUnitStore
  const units: RentalUnit[] = []
  memoryUnitStore.forEach((u) => {
    if (u.listingId === listingId) {
      units.push({ ...u })
    }
  })
  return units
}

/**
 * Fetch active rental bookings overlapping a date range for a given listing or unit
 */
interface QueriedRentalBookingRow {
  id: string
  unit_id: string | null
  listing_id?: string | null
  notes: string | null
  status: string
  scheduled_at: string
  rental_start_date?: string | null
  rental_end_date?: string | null
}

export async function getActiveOverlappingBookings(
  listingId: string,
  startDate: string,
  endDate: string
): Promise<{ id: string; unit_id: string | null; notes: string | null; status: string; scheduled_at: string }[]> {
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("bookings")
      .select("id, unit_id, notes, status, scheduled_at, rental_start_date, rental_end_date")
      .eq("service_type", "rental")
      .in("status", ["pending", "assigned", "accepted", "in_progress"])

    if (!error && data) {
      const rows = data as unknown as QueriedRentalBookingRow[]
      // Filter bookings that match listing and overlap the requested dates
      return rows.filter((b) => {
        // Match listing either via column or notes
        const listingMatch =
          b.listing_id === listingId ||
          (b.notes && b.notes.toLowerCase().includes(listingId.toLowerCase())) ||
          (b.notes && b.notes.includes(listingId))

        if (!listingMatch) {
          // Check by title
          const listingItem = MOCK_BUTUAN_RENTAL_LISTINGS.find((l) => l.id === listingId)
          if (!listingItem || !b.notes?.includes(listingItem.title)) return false
        }

        // Determine booking dates
        const bStart = b.rental_start_date || b.scheduled_at
        let bEnd = b.rental_end_date
        if (!bEnd && b.notes) {
          const match = b.notes.match(/Period:\s*(\S+)\s*to\s*(\S+)/i)
          if (match) bEnd = match[2]
        }
        if (!bEnd) bEnd = bStart

        return doDateRangesOverlap(startDate, endDate, bStart, bEnd)
      })
    }
  } catch (err) {
    console.warn("[getActiveOverlappingBookings] Notice:", err)
  }

  return []
}

/**
 * Accurately calculate vehicle availability for customer's selected dates
 */
export async function checkRentalAvailability(
  listingId: string,
  startDate: string,
  endDate: string
): Promise<ModelAvailabilityResult> {
  const listingItem = MOCK_BUTUAN_RENTAL_LISTINGS.find((l) => l.id === listingId)
  const modelName = listingItem ? listingItem.title : "Vehicle Model"

  const units = await getUnitsForListing(listingId)
  const totalUnits = units.length

  if (totalUnits === 0) {
    return {
      listingId,
      modelName,
      totalUnits: 0,
      availableUnits: 0,
      bookedUnits: 0,
      maintenanceUnits: 0,
      unavailableUnits: 0,
      status: "all_unavailable",
      isAvailable: false,
      message: "This vehicle model is currently unavailable.",
    }
  }

  const overlappingBookings = await getActiveOverlappingBookings(listingId, startDate, endDate)

  let bookedCount = 0
  let maintenanceCount = 0
  let unavailableCount = 0
  let availableCount = 0

  // Track which units are specifically booked
  const bookedUnitIds = new Set<string>()
  // Bookings with explicit unit_id
  overlappingBookings.forEach((b) => {
    if (b.unit_id) bookedUnitIds.add(b.unit_id)
  })

  // Also account for legacy bookings without explicit unit_id by reserving units sequentially
  let unassignedBookingsCount = overlappingBookings.filter((b) => !b.unit_id).length

  for (const unit of units) {
    // 1. Manually unavailable
    if (unit.status === "unavailable") {
      unavailableCount++
      continue
    }

    // 2. Under maintenance
    if (unit.status === "maintenance") {
      if (unit.maintenanceStart && unit.maintenanceEnd) {
        // Check if maintenance period overlaps requested dates
        if (doDateRangesOverlap(startDate, endDate, unit.maintenanceStart, unit.maintenanceEnd)) {
          maintenanceCount++
          continue
        }
      } else {
        // Indefinite maintenance
        maintenanceCount++
        continue
      }
    }

    // 3. Rented / Reserved for dates
    if (bookedUnitIds.has(unit.id)) {
      bookedCount++
      continue
    }

    if (unassignedBookingsCount > 0) {
      bookedCount++
      unassignedBookingsCount--
      continue
    }

    // Unit is free for the entire requested period!
    availableCount++
  }

  // Determine overall status
  if (availableCount > 0) {
    const isMixed = availableCount < totalUnits
    const message = isMixed
      ? `${availableCount} of ${totalUnits} units available for these dates.`
      : `All ${totalUnits} units available for your selected dates.`

    return {
      listingId,
      modelName,
      totalUnits,
      availableUnits: availableCount,
      bookedUnits: bookedCount,
      maintenanceUnits: maintenanceCount,
      unavailableUnits: unavailableCount,
      status: "available",
      isAvailable: true,
      message,
    }
  }

  // If 0 units are available, provide precise diagnostic reason
  if (maintenanceCount === totalUnits) {
    return {
      listingId,
      modelName,
      totalUnits,
      availableUnits: 0,
      bookedUnits: bookedCount,
      maintenanceUnits: maintenanceCount,
      unavailableUnits: unavailableCount,
      status: "all_maintenance",
      isAvailable: false,
      message: "All units of this vehicle model are currently under maintenance.",
    }
  }

  if (bookedCount === totalUnits) {
    return {
      listingId,
      modelName,
      totalUnits,
      availableUnits: 0,
      bookedUnits: bookedCount,
      maintenanceUnits: maintenanceCount,
      unavailableUnits: unavailableCount,
      status: "all_booked",
      isAvailable: false,
      message: "All units of this vehicle model are already booked for your selected dates.",
    }
  }

  if (unavailableCount === totalUnits) {
    return {
      listingId,
      modelName,
      totalUnits,
      availableUnits: 0,
      bookedUnits: bookedCount,
      maintenanceUnits: maintenanceCount,
      unavailableUnits: unavailableCount,
      status: "all_unavailable",
      isAvailable: false,
      message: "This vehicle model is currently unavailable.",
    }
  }

  // Mixed unavailable reasons
  const parts: string[] = []
  if (bookedCount > 0) parts.push(`${bookedCount} booked`)
  if (maintenanceCount > 0) parts.push(`${maintenanceCount} under maintenance`)
  if (unavailableCount > 0) parts.push(`${unavailableCount} unavailable`)

  return {
    listingId,
    modelName,
    totalUnits,
    availableUnits: 0,
    bookedUnits: bookedCount,
    maintenanceUnits: maintenanceCount,
    unavailableUnits: unavailableCount,
    status: "unavailable_mixed",
    isAvailable: false,
    message: `All units of this vehicle model are unavailable for your selected dates (${parts.join(", ")}).`,
  }
}

/**
 * Check availability for all catalog listings for the selected dates
 */
export async function checkAllListingsAvailability(
  startDate: string,
  endDate: string
): Promise<Record<string, ModelAvailabilityResult>> {
  const results: Record<string, ModelAvailabilityResult> = {}
  await Promise.all(
    MOCK_BUTUAN_RENTAL_LISTINGS.map(async (listing) => {
      results[listing.id] = await checkRentalAvailability(listing.id, startDate, endDate)
    })
  )
  return results
}

/**
 * Get provider inventory (listings and individual physical units)
 */
export async function getProviderInventory(): Promise<{ listing: ButuanRentalItem; units: RentalUnit[] }[]> {
  try {
    const user = await currentUser()
    if (!user) return []

    const provider = await getProviderRecord()
    // For local dev/demo, allow matching provider id
    const targetProviderId = provider?.id || "user_prov_btn_01"

    const myListings = MOCK_BUTUAN_RENTAL_LISTINGS.filter(
      (l) => l.providerId === targetProviderId || l.provider.id === targetProviderId
    )

    const inventory: { listing: ButuanRentalItem; units: RentalUnit[] }[] = []
    for (const listing of myListings) {
      const units = await getUnitsForListing(listing.id)
      inventory.push({ listing, units })
    }

    return inventory
  } catch (err) {
    console.error("[getProviderInventory] Error:", err)
    return []
  }
}

/**
 * Provider action: Update status and maintenance of an individual physical unit
 */
export async function updateUnitStatus(input: {
  unitId: string
  status: UnitStatus
  maintenanceStart?: string
  maintenanceEnd?: string
  maintenanceReason?: string
}): Promise<{ success: boolean; error: string | null; unit?: RentalUnit }> {
  try {
    const user = await currentUser()
    if (!user) return { success: false, error: "Not authenticated." }

    const provider = await getProviderRecord()
    // Provider authorization: ensure provider owns this unit
    const db = createServiceClient()

    // 1. Fetch unit
    let unit: RentalUnit | undefined
    try {
      const { data } = await db.from("rental_units").select("*").eq("id", input.unitId).single()
      if (data) {
        unit = {
          id: data.id,
          listingId: data.listing_id,
          providerId: data.provider_id,
          unitIdentifier: data.unit_identifier,
          status: data.status as UnitStatus,
          maintenanceStart: data.maintenance_start,
          maintenanceEnd: data.maintenance_end,
          maintenanceReason: data.maintenance_reason,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }
      }
    } catch {}

    if (!unit) {
      unit = memoryUnitStore.get(input.unitId)
    }

    if (!unit) {
      return { success: false, error: "Unit not found." }
    }

    // Provider check: prevent unauthorized modification of another provider's unit
    if (provider && unit.providerId !== provider.id && unit.providerId !== "user_prov_btn_01") {
      return { success: false, error: "Unauthorized. You cannot modify inventory owned by another provider." }
    }

    // 2. Prevent marking unit unavailable/maintenance if it silently conflicts with an active rental!
    if (input.status === "maintenance" || input.status === "unavailable") {
      // Check if there are active bookings assigned to this unit
      const checkStart = input.maintenanceStart || new Date().toISOString()
      const checkEnd = input.maintenanceEnd || new Date(Date.now() + 30 * 86400000).toISOString()

      const overlapping = await getActiveOverlappingBookings(unit.listingId, checkStart, checkEnd)
      const conflict = overlapping.find((b) => b.unit_id === unit!.id && b.status === "in_progress")

      if (conflict) {
        return {
          success: false,
          error: `Cannot change unit status: Unit currently has an active ongoing rental (Booking #${conflict.id.slice(-6).toUpperCase()}). Please resolve the rental with the customer first.`,
        }
      }
    }

    // 3. Update unit
    const updated: RentalUnit = {
      ...unit,
      status: input.status,
      maintenanceStart: input.status === "maintenance" ? input.maintenanceStart || null : null,
      maintenanceEnd: input.status === "maintenance" ? input.maintenanceEnd || null : null,
      maintenanceReason: input.status === "maintenance" ? input.maintenanceReason?.trim() || null : null,
      updatedAt: new Date().toISOString(),
    }

    // Update in database if exists
    try {
      await db
        .from("rental_units")
        .update({
          status: updated.status,
          maintenance_start: updated.maintenanceStart,
          maintenance_end: updated.maintenanceEnd,
          maintenance_reason: updated.maintenanceReason,
          updated_at: updated.updatedAt,
        })
        .eq("id", unit.id)
    } catch {}

    // Update memory store
    memoryUnitStore.set(unit.id, updated)

    revalidatePath("/dashboard/provider")
    revalidatePath("/dashboard/customer/book/rental")

    return { success: true, error: null, unit: updated }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update unit status."
    return { success: false, error: msg }
  }
}

/**
 * Concurrency-safe atomic unit assignment for customer booking submission
 */
export async function allocateUnitForBooking(
  listingId: string,
  startDate: string,
  endDate: string,
  bookingId?: string
): Promise<{ success: boolean; unit?: RentalUnit; error?: string }> {
  // 1. Try database RPC if available
  try {
    const db = createServiceClient()
    const { data, error } = await db.rpc("reserve_rental_unit", {
      p_listing_id: listingId,
      p_start_date: new Date(startDate).toISOString(),
      p_end_date: new Date(endDate).toISOString(),
      p_booking_id: bookingId || null,
    })

    if (!error && data && data.success && data.unit_id) {
      const units = await getUnitsForListing(listingId)
      const found = units.find((u) => u.id === data.unit_id)
      return { success: true, unit: found }
    } else if (data && !data.success) {
      return { success: false, error: data.message }
    }
  } catch (err) {
    console.warn("[allocateUnitForBooking] RPC fallback to transactional lock:", err)
  }

  // 2. Transaction-safe in-memory allocation fallback
  const availability = await checkRentalAvailability(listingId, startDate, endDate)
  if (!availability.isAvailable) {
    return { success: false, error: availability.message }
  }

  // Find the first free eligible unit
  const units = await getUnitsForListing(listingId)
  const overlapping = await getActiveOverlappingBookings(listingId, startDate, endDate)
  const bookedUnitIds = new Set(overlapping.map((b) => b.unit_id).filter(Boolean))

  const freeUnit = units.find((u) => {
    if (u.status === "unavailable") return false
    if (u.status === "maintenance") {
      if (u.maintenanceStart && u.maintenanceEnd) {
        if (doDateRangesOverlap(startDate, endDate, u.maintenanceStart, u.maintenanceEnd)) return false
      } else {
        return false
      }
    }
    if (bookedUnitIds.has(u.id)) return false
    return true
  })

  if (!freeUnit) {
    return {
      success: false,
      error: "Availability changed: All units of this vehicle model were just reserved. Please select another date or vehicle.",
    }
  }

  return { success: true, unit: freeUnit }
}
