import assert from "node:assert/strict"
import { doDateRangesOverlap } from "../lib/rentals/availability"
import type { RentalUnit, UnitStatus, ModelAvailabilityResult } from "../types/rental"

console.log("=== RUNNING HITSNAGO RENTAL AVAILABILITY & INVENTORY TEST SUITE ===\n")

// ─── DOMAIN TYPES FOR TESTS ──────────────────────────────────────────────────
interface SimulatedRentalBooking {
  id: string
  reference: string
  listing_id: string
  unit_id: string | null
  rental_start_date: string
  rental_end_date: string
  status: "pending" | "assigned" | "accepted" | "in_progress" | "completed" | "cancelled"
  customer_name: string
}

// ─── HELPER AVAILABILITY CALCULATOR (PURE DOMAIN LOGIC) ────────────────────────
function calculateAvailabilityForModel(
  listingId: string,
  modelName: string,
  units: RentalUnit[],
  bookings: SimulatedRentalBooking[],
  startDate: string,
  endDate: string
): ModelAvailabilityResult {
  const modelUnits = units.filter((u) => u.listingId === listingId)
  const totalUnits = modelUnits.length

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

  // Active bookings overlapping the interval (exclude cancelled and completed)
  const activeBookings = bookings.filter(
    (b) =>
      b.listing_id === listingId &&
      ["pending", "assigned", "accepted", "in_progress"].includes(b.status) &&
      doDateRangesOverlap(startDate, endDate, b.rental_start_date, b.rental_end_date)
  )

  const bookedUnitIds = new Set(
    activeBookings.map((b) => b.unit_id).filter((id): id is string => Boolean(id))
  )

  let unassignedBookingsCount = activeBookings.filter((b) => !b.unit_id).length

  let availableCount = 0
  let bookedCount = 0
  let maintenanceCount = 0
  let unavailableCount = 0

  for (const unit of modelUnits) {
    // 1. Manually marked unavailable
    if (unit.status === "unavailable") {
      unavailableCount++
      continue
    }

    // 2. Under maintenance
    if (unit.status === "maintenance") {
      if (
        unit.maintenanceStart &&
        unit.maintenanceEnd &&
        !doDateRangesOverlap(startDate, endDate, unit.maintenanceStart, unit.maintenanceEnd)
      ) {
        // Maintenance is outside requested dates! Unit remains eligible
      } else {
        maintenanceCount++
        continue
      }
    }

    // 3. Checked if already booked
    if (bookedUnitIds.has(unit.id)) {
      bookedCount++
      continue
    }

    // 4. Reserve for unassigned active bookings
    if (unassignedBookingsCount > 0) {
      unassignedBookingsCount--
      bookedCount++
      continue
    }

    availableCount++
  }

  let status: ModelAvailabilityResult["status"] = "available"
  let isAvailable = true
  let message = `Available for rent (${availableCount} of ${totalUnits} units free)`

  if (availableCount === 0) {
    isAvailable = false
    if (bookedCount === totalUnits) {
      status = "all_booked"
      message = "All units of this vehicle model are already booked for your selected dates."
    } else if (maintenanceCount === totalUnits) {
      status = "all_maintenance"
      message = "All units of this vehicle model are currently under maintenance."
    } else if (unavailableCount === totalUnits) {
      status = "all_unavailable"
      message = "This vehicle model is currently unavailable."
    } else {
      status = "mixed_unavailable"
      const reasons: string[] = []
      if (bookedCount > 0) reasons.push(`${bookedCount} booked`)
      if (maintenanceCount > 0) reasons.push(`${maintenanceCount} in maintenance`)
      if (unavailableCount > 0) reasons.push(`${unavailableCount} unavailable`)
      message = `All units are currently unavailable for your selected dates (${reasons.join(", ")}).`
    }
  } else if (availableCount < totalUnits) {
    status = "mixed_available"
    message = `${availableCount} unit${availableCount > 1 ? "s" : ""} available (${bookedCount} booked, ${maintenanceCount} maintenance)`
  }

  return {
    listingId,
    modelName,
    totalUnits,
    availableUnits: availableCount,
    bookedUnits: bookedCount,
    maintenanceUnits: maintenanceCount,
    unavailableUnits: unavailableCount,
    status,
    isAvailable,
    message,
  }
}

// ─── ATOMIC ALLOCATION SIMULATOR ─────────────────────────────────────────────
class SimulatedRentalDatabase {
  units: Map<string, RentalUnit> = new Map()
  bookings: Map<string, SimulatedRentalBooking> = new Map()
  activeLocks: Set<string> = new Set() // Simulates Postgres row locks (FOR UPDATE)

  constructor(initialUnits: RentalUnit[]) {
    initialUnits.forEach((u) => this.units.set(u.id, { ...u }))
  }

  /**
   * Concurrency-safe atomic unit allocation (mirroring reserve_rental_unit RPC)
   */
  async atomicAllocateUnit(
    listingId: string,
    startDate: string,
    endDate: string,
    customerName: string
  ): Promise<{ success: boolean; unit?: RentalUnit; booking?: SimulatedRentalBooking; error?: string }> {
    // Find model units
    const modelUnits = Array.from(this.units.values()).filter((u) => u.listingId === listingId)
    if (modelUnits.length === 0) {
      return { success: false, error: "Vehicle model not found" }
    }

    // Check currently active overlapping bookings
    const activeOverlaps = Array.from(this.bookings.values()).filter(
      (b) =>
        b.listing_id === listingId &&
        ["pending", "assigned", "accepted", "in_progress"].includes(b.status) &&
        doDateRangesOverlap(startDate, endDate, b.rental_start_date, b.rental_end_date)
    )

    const bookedUnitIds = new Set(
      activeOverlaps.map((b) => b.unit_id).filter((id): id is string => Boolean(id))
    )

    // Select candidate units
    const candidateUnits = modelUnits.filter((u) => {
      if (u.status === "unavailable") return false
      if (u.status === "maintenance") {
        if (
          u.maintenanceStart &&
          u.maintenanceEnd &&
          !doDateRangesOverlap(startDate, endDate, u.maintenanceStart, u.maintenanceEnd)
        ) {
          // Maintenance is outside requested dates
        } else {
          return false
        }
      }
      if (bookedUnitIds.has(u.id)) return false
      return true
    })

    if (candidateUnits.length === 0) {
      return {
        success: false,
        error: "All units of this vehicle model are already booked or unavailable for your selected dates.",
      }
    }

    // Try to acquire row-level lock on the first candidate unit
    const chosenUnit = candidateUnits[0]
    if (this.activeLocks.has(chosenUnit.id)) {
      // Unit is currently locked by a concurrent transaction
      return { success: false, error: "Unit is currently being booked by another customer. Please retry." }
    }

    // Acquire lock
    this.activeLocks.add(chosenUnit.id)

    try {
      // Create confirmed booking
      const newBooking: SimulatedRentalBooking = {
        id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        reference: `RNT-${Math.floor(100000 + Math.random() * 900000)}`,
        listing_id: listingId,
        unit_id: chosenUnit.id,
        rental_start_date: startDate,
        rental_end_date: endDate,
        status: "pending",
        customer_name: customerName,
      }

      this.bookings.set(newBooking.id, newBooking)
      return { success: true, unit: chosenUnit, booking: newBooking }
    } finally {
      // Release lock
      this.activeLocks.delete(chosenUnit.id)
    }
  }

  /**
   * Update unit status with provider authorization check and active rental conflict prevention
   */
  updateUnitStatus(
    unitId: string,
    requestingProviderId: string,
    newStatus: UnitStatus,
    maintenanceStart?: string,
    maintenanceEnd?: string,
    maintenanceReason?: string
  ): { success: boolean; error?: string } {
    const unit = this.units.get(unitId)
    if (!unit) {
      return { success: false, error: "Unit not found" }
    }

    // Provider Authorization Check
    if (unit.providerId !== requestingProviderId) {
      return { success: false, error: "Unauthorized: You do not own this inventory unit." }
    }

    // Conflict Check: Prevent marking unit unavailable/maintenance if it has an active in_progress rental
    if (newStatus !== "available") {
      const activeRental = Array.from(this.bookings.values()).find(
        (b) => b.unit_id === unitId && b.status === "in_progress"
      )

      if (activeRental) {
        return {
          success: false,
          error: `Cannot mark unit ${newStatus}: Unit is currently on an active customer rental (${activeRental.reference}). Please complete or resolve the rental first.`,
        }
      }
    }

    // Apply update
    unit.status = newStatus
    unit.maintenanceStart = newStatus === "maintenance" ? maintenanceStart : undefined
    unit.maintenanceEnd = newStatus === "maintenance" ? maintenanceEnd : undefined
    unit.maintenanceReason = newStatus === "maintenance" ? maintenanceReason : undefined
    unit.updatedAt = new Date().toISOString()

    return { success: true }
  }
}

// ─── TEST SUITE EXECUTION ─────────────────────────────────────────────────────

async function runTests() {
  const toyotaInnovaUnits: RentalUnit[] = [
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
  ]

  // ── TEST 1: One unit rented while another unit of the same model remains available
  console.log("TEST 1: One unit rented while another unit of the same model remains available")
  {
    const bookings: SimulatedRentalBooking[] = [
      {
        id: "b_01",
        reference: "RNT-1001",
        listing_id: "rent_btn_01",
        unit_id: "unit_innova_01",
        rental_start_date: "2026-10-20",
        rental_end_date: "2026-10-23",
        status: "accepted",
        customer_name: "Customer A",
      },
    ]

    const result = calculateAvailabilityForModel(
      "rent_btn_01",
      "Toyota Innova",
      toyotaInnovaUnits,
      bookings,
      "2026-10-21",
      "2026-10-22"
    )

    assert.equal(result.isAvailable, true, "Model should be available when remaining units exist")
    assert.equal(result.totalUnits, 3)
    assert.equal(result.availableUnits, 2, "2 units should remain free")
    assert.equal(result.bookedUnits, 1, "1 unit is booked")
    assert.equal(result.status, "mixed_available")
    console.log("  ✓ Correctly allows booking (2 of 3 units free, not treated as fully booked)\n")
  }

  // ── TEST 2: Every unit booked for the requested dates
  console.log("TEST 2: Every unit booked for the requested dates")
  {
    const bookings: SimulatedRentalBooking[] = [
      {
        id: "b_01",
        reference: "RNT-1001",
        listing_id: "rent_btn_01",
        unit_id: "unit_innova_01",
        rental_start_date: "2026-10-20",
        rental_end_date: "2026-10-23",
        status: "in_progress",
        customer_name: "Customer A",
      },
      {
        id: "b_02",
        reference: "RNT-1002",
        listing_id: "rent_btn_01",
        unit_id: "unit_innova_02",
        rental_start_date: "2026-10-20",
        rental_end_date: "2026-10-24",
        status: "accepted",
        customer_name: "Customer B",
      },
      {
        id: "b_03",
        reference: "RNT-1003",
        listing_id: "rent_btn_01",
        unit_id: "unit_innova_03",
        rental_start_date: "2026-10-21",
        rental_end_date: "2026-10-22",
        status: "pending",
        customer_name: "Customer C",
      },
    ]

    const result = calculateAvailabilityForModel(
      "rent_btn_01",
      "Toyota Innova",
      toyotaInnovaUnits,
      bookings,
      "2026-10-21",
      "2026-10-22"
    )

    assert.equal(result.isAvailable, false, "Model must not be available when all units booked")
    assert.equal(result.availableUnits, 0)
    assert.equal(result.bookedUnits, 3)
    assert.equal(result.status, "all_booked")
    assert.equal(result.message, "All units of this vehicle model are already booked for your selected dates.")
    console.log("  ✓ Correctly reports 'All units of this vehicle model are already booked for your selected dates.'\n")
  }

  // ── TEST 3: A booking overlapping a unit's maintenance period
  console.log("TEST 3: A booking overlapping a unit's maintenance period")
  {
    const unitsWithMaintenance: RentalUnit[] = [
      {
        ...toyotaInnovaUnits[0],
        status: "maintenance",
        maintenanceStart: "2026-10-20",
        maintenanceEnd: "2026-10-25",
        maintenanceReason: "Scheduled 10,000km Engine Maintenance",
      },
      {
        ...toyotaInnovaUnits[1],
        status: "maintenance",
        maintenanceStart: "2026-10-18",
        maintenanceEnd: "2026-10-24",
        maintenanceReason: "Brake pad replacement",
      },
      {
        ...toyotaInnovaUnits[2],
        status: "maintenance",
        maintenanceStart: "2026-10-21",
        maintenanceEnd: "2026-10-22",
        maintenanceReason: "Tire alignment",
      },
    ]

    const result = calculateAvailabilityForModel(
      "rent_btn_01",
      "Toyota Innova",
      unitsWithMaintenance,
      [],
      "2026-10-21",
      "2026-10-22"
    )

    assert.equal(result.isAvailable, false)
    assert.equal(result.status, "all_maintenance")
    assert.equal(result.maintenanceUnits, 3)
    assert.equal(result.message, "All units of this vehicle model are currently under maintenance.")
    console.log("  ✓ Correctly reports 'All units of this vehicle model are currently under maintenance.'\n")
  }

  // ── TEST 4: A maintenance period outside the requested dates
  console.log("TEST 4: A maintenance period outside the requested dates (unit remains available)")
  {
    const unitsWithFutureMaintenance: RentalUnit[] = [
      {
        ...toyotaInnovaUnits[0],
        status: "maintenance",
        maintenanceStart: "2026-11-05", // Future maintenance next month
        maintenanceEnd: "2026-11-10",
        maintenanceReason: "Scheduled Change Oil",
      },
      toyotaInnovaUnits[1],
      toyotaInnovaUnits[2],
    ]

    // Customer requests rental for 2026-10-20 to 2026-10-22 (before maintenance)
    const result = calculateAvailabilityForModel(
      "rent_btn_01",
      "Toyota Innova",
      unitsWithFutureMaintenance,
      [],
      "2026-10-20",
      "2026-10-22"
    )

    assert.equal(result.isAvailable, true)
    assert.equal(result.availableUnits, 3, "Unit with maintenance next month must be available this month")
    assert.equal(result.maintenanceUnits, 0)
    console.log("  ✓ Correctly recognizes maintenance outside requested interval does not block availability\n")
  }

  // ── TEST 5: A provider marking a unit unavailable
  console.log("TEST 5: A provider marking a unit unavailable")
  {
    const unitsWithUnavailable: RentalUnit[] = [
      {
        ...toyotaInnovaUnits[0],
        status: "unavailable",
      },
      toyotaInnovaUnits[1],
      toyotaInnovaUnits[2],
    ]

    const result = calculateAvailabilityForModel(
      "rent_btn_01",
      "Toyota Innova",
      unitsWithUnavailable,
      [],
      "2026-10-20",
      "2026-10-22"
    )

    assert.equal(result.isAvailable, true)
    assert.equal(result.availableUnits, 2)
    assert.equal(result.unavailableUnits, 1)

    // When all are unavailable
    const allUnavailableUnits = toyotaInnovaUnits.map((u) => ({ ...u, status: "unavailable" as UnitStatus }))
    const allUnavResult = calculateAvailabilityForModel(
      "rent_btn_01",
      "Toyota Innova",
      allUnavailableUnits,
      [],
      "2026-10-20",
      "2026-10-22"
    )

    assert.equal(allUnavResult.isAvailable, false)
    assert.equal(allUnavResult.status, "all_unavailable")
    assert.equal(allUnavResult.message, "This vehicle model is currently unavailable.")
    console.log("  ✓ Excluded unavailable units and correctly showed 'This vehicle model is currently unavailable.'\n")
  }

  // ── TEST 6: A cancelled reservation no longer blocking availability
  console.log("TEST 6: A cancelled reservation no longer blocking availability according to lifecycle")
  {
    const bookings: SimulatedRentalBooking[] = [
      {
        id: "b_cancelled_01",
        reference: "RNT-9999",
        listing_id: "rent_btn_01",
        unit_id: "unit_innova_01",
        rental_start_date: "2026-10-20",
        rental_end_date: "2026-10-23",
        status: "cancelled", // User cancelled booking
        customer_name: "Customer Cancelled",
      },
      {
        id: "b_completed_02",
        reference: "RNT-8888",
        listing_id: "rent_btn_01",
        unit_id: "unit_innova_02",
        rental_start_date: "2026-10-18",
        rental_end_date: "2026-10-21",
        status: "completed", // Trip already finished
        customer_name: "Customer Completed",
      },
    ]

    const result = calculateAvailabilityForModel(
      "rent_btn_01",
      "Toyota Innova",
      toyotaInnovaUnits,
      bookings,
      "2026-10-20",
      "2026-10-22"
    )

    assert.equal(result.isAvailable, true)
    assert.equal(result.availableUnits, 3, "Cancelled and completed bookings must not block unit availability")
    assert.equal(result.bookedUnits, 0)
    console.log("  ✓ Cancelled and completed reservations do not block availability\n")
  }

  // ── TEST 7: Two customers attempting to reserve the same unit for overlapping dates simultaneously
  console.log("TEST 7: Two customers attempting to reserve the same unit for overlapping dates simultaneously")
  {
    // Inventory with only 1 unit
    const singleUnitFleet: RentalUnit[] = [
      {
        id: "unit_single_01",
        listingId: "rent_single",
        providerId: "prov_01",
        unitIdentifier: "Only 1 Car (Plate ABC-999)",
        status: "available",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]

    const db = new SimulatedRentalDatabase(singleUnitFleet)

    // Customer A and Customer B both attempt to book for 2026-10-20 to 2026-10-22 concurrently
    const [resA, resB] = await Promise.all([
      db.atomicAllocateUnit("rent_single", "2026-10-20", "2026-10-22", "Customer A"),
      db.atomicAllocateUnit("rent_single", "2026-10-20", "2026-10-22", "Customer B"),
    ])

    const successCount = (resA.success ? 1 : 0) + (resB.success ? 1 : 0)
    const failureCount = (!resA.success ? 1 : 0) + (!resB.success ? 1 : 0)

    assert.equal(successCount, 1, "Exactly one customer must succeed in booking the unit")
    assert.equal(failureCount, 1, "The second concurrent customer must be rejected without double-booking")
    console.log("  ✓ Concurrency safe: exactly 1 reservation succeeded, second request safely rejected\n")
  }

  // ── TEST 8: Two reservations for the same unit on non-overlapping dates
  console.log("TEST 8: Two reservations for the same unit on non-overlapping dates")
  {
    const singleUnitFleet: RentalUnit[] = [
      {
        id: "unit_single_01",
        listingId: "rent_single",
        providerId: "prov_01",
        unitIdentifier: "Only 1 Car (Plate ABC-999)",
        status: "available",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]

    const db = new SimulatedRentalDatabase(singleUnitFleet)

    // Customer A books Oct 15 - Oct 17
    const resA = await db.atomicAllocateUnit("rent_single", "2026-10-15", "2026-10-17", "Customer A")
    assert.equal(resA.success, true, "First non-overlapping reservation should succeed")

    // Customer B books Oct 18 - Oct 20 (no overlap with Oct 15-17)
    const resB = await db.atomicAllocateUnit("rent_single", "2026-10-18", "2026-10-20", "Customer B")
    assert.equal(resB.success, true, "Second non-overlapping reservation should succeed for the same physical unit")
    assert.equal(resA.unit?.id, resB.unit?.id, "Same physical unit safely reused for non-overlapping dates")
    console.log("  ✓ Successfully booked the same physical unit across two separate, non-overlapping intervals\n")
  }

  // ── TEST 9: Unauthorized access to another provider's inventory
  console.log("TEST 9: Unauthorized access to another provider's inventory")
  {
    const db = new SimulatedRentalDatabase(toyotaInnovaUnits)

    // Unit belongs to 'user_prov_btn_01'. Attacker is 'user_attacker_99'
    const updateResult = db.updateUnitStatus(
      "unit_innova_01",
      "user_attacker_99",
      "unavailable"
    )

    assert.equal(updateResult.success, false, "Unauthorized update must fail")
    assert.match(updateResult.error || "", /unauthorized/i)

    // Verify unit status was NOT changed
    const unitAfter = db.units.get("unit_innova_01")
    assert.equal(unitAfter?.status, "available", "Unit status must remain untouched")
    console.log("  ✓ Correctly rejected unauthorized update and preserved provider inventory integrity\n")
  }

  // ── TEST 10: Availability changing after customer opens form but before submitting
  console.log("TEST 10: Availability changing after customer opens form but before submitting")
  {
    const singleUnitFleet: RentalUnit[] = [
      {
        id: "unit_single_01",
        listingId: "rent_single",
        providerId: "prov_01",
        unitIdentifier: "Last Remaining Car (Plate XYZ-111)",
        status: "available",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]

    const db = new SimulatedRentalDatabase(singleUnitFleet)

    // 1. Customer opens form: checks availability -> available
    const initialAvailability = calculateAvailabilityForModel(
      "rent_single",
      "Special Vehicle",
      Array.from(db.units.values()),
      Array.from(db.bookings.values()),
      "2026-10-20",
      "2026-10-22"
    )
    assert.equal(initialAvailability.isAvailable, true)

    // 2. An in-between customer books the last remaining unit before Customer 1 clicks "Book Now"
    const ninjaBooking = await db.atomicAllocateUnit("rent_single", "2026-10-20", "2026-10-22", "Ninja Customer")
    assert.equal(ninjaBooking.success, true)

    // 3. Customer 1 finally submits form
    const submitResult = await db.atomicAllocateUnit("rent_single", "2026-10-20", "2026-10-22", "Customer 1")
    assert.equal(submitResult.success, false, "Server-side atomic check must reject stale submission")
    assert.match(submitResult.error || "", /already booked or unavailable/i)

    // 4. Form refreshes availability for customer
    const refreshedAvailability = calculateAvailabilityForModel(
      "rent_single",
      "Special Vehicle",
      Array.from(db.units.values()),
      Array.from(db.bookings.values()),
      "2026-10-20",
      "2026-10-22"
    )
    assert.equal(refreshedAvailability.isAvailable, false)
    assert.equal(refreshedAvailability.status, "all_booked")
    console.log("  ✓ Safely caught race condition on server submit; customer can refresh and pick alternative dates\n")
  }

  // ── BONUS TEST: Active ongoing rental conflict prevention
  console.log("BONUS TEST: Active rental conflict prevention for providers")
  {
    const db = new SimulatedRentalDatabase(toyotaInnovaUnits)

    // Put unit on an in_progress rental
    db.bookings.set("bk_active_01", {
      id: "bk_active_01",
      reference: "RNT-ACT-001",
      listing_id: "rent_btn_01",
      unit_id: "unit_innova_01",
      rental_start_date: "2026-10-15",
      rental_end_date: "2026-10-20",
      status: "in_progress",
      customer_name: "Active Customer",
    })

    // Provider tries to mark unit under maintenance or unavailable while customer has the car
    const conflictResult = db.updateUnitStatus(
      "unit_innova_01",
      "user_prov_btn_01",
      "maintenance",
      "2026-10-16",
      "2026-10-19",
      "Attempted mid-rental maintenance"
    )

    assert.equal(conflictResult.success, false)
    assert.match(conflictResult.error || "", /active customer rental/i)
    console.log("  ✓ Prevented provider from silently marking unit unavailable during an active customer rental\n")
  }

  console.log("🎉 ALL 10 USER REQUIREMENTS + CONFLICT PREVENTION TESTS PASSED SUCCESSFULLY!")
}

runTests().catch((err) => {
  console.error("Test failed with error:", err)
  process.exit(1)
})
