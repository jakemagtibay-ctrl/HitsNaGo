import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import assert from 'node:assert/strict'
import { createServiceClient } from '../lib/supabase'
import {
  getUnitsForListing,
  checkRentalAvailability,
  allocateUnitForBooking,
} from '../lib/actions/rentals'
import {
  normalizeRentalUnitId,
  VALID_UUID_REGEX,
} from '../lib/rentals/inventory'

async function runTests() {
  console.log('=== RUNNING RENTAL BOOKING UUID & DATABASE INTEGRITY TESTS ===\n')

  // 1. Test normalizeRentalUnitId
  console.log('TEST 1: Normalizing legacy and truncated identifiers')
  assert.equal(normalizeRentalUnitId('unit_click_01'), 'a1000000-0003-4000-8000-000000000001')
  assert.equal(normalizeRentalUnitId('unit_click_0'), 'a1000000-0003-4000-8000-000000000001')
  assert.equal(normalizeRentalUnitId('unit_innova_01'), 'a1000000-0001-4000-8000-000000000001')
  assert.equal(normalizeRentalUnitId('unit_hiace_01'), 'a1000000-0002-4000-8000-000000000001')
  assert.equal(normalizeRentalUnitId('unit_nmax_01'), 'a1000000-0004-4000-8000-000000000001')
  assert.equal(normalizeRentalUnitId('a1000000-0003-4000-8000-000000000001'), 'a1000000-0003-4000-8000-000000000001')
  assert.equal(normalizeRentalUnitId('invalid_random_str'), null)
  console.log('  ✓ normalizeRentalUnitId correctly converts legacy, prefix, and valid UUIDs')

  // 2. Test getUnitsForListing returns real database UUIDs for Honda Click 125i (rent_btn_03)
  console.log('\nTEST 2: getUnitsForListing returns valid database UUIDs')
  const clickUnits = await getUnitsForListing('rent_btn_03')
  assert.equal(clickUnits.length, 3, 'Should have 3 units for Honda Click')
  for (const unit of clickUnits) {
    assert.match(unit.id, VALID_UUID_REGEX, `Unit ID ${unit.id} must be a valid UUID`)
    assert.equal(unit.listingId, 'rent_btn_03')
  }
  console.log('  ✓ All 3 Honda Click units have valid UUIDs:', clickUnits.map(u => ({ id: u.id, identifier: u.unitIdentifier })))

  // 3. Test checkRentalAvailability works seamlessly
  console.log('\nTEST 3: checkRentalAvailability with valid UUID units')
  const startDate = new Date().toISOString().split('T')[0]
  const endDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  const avail = await checkRentalAvailability('rent_btn_03', startDate, endDate)
  assert.equal(avail.isAvailable, true)
  assert.equal(avail.totalUnits, 3)
  console.log('  ✓ Availability calculated successfully:', avail.message)

  // 4. Test allocateUnitForBooking returns unit with valid UUID
  console.log('\nTEST 4: allocateUnitForBooking returns a unit with valid UUID')
  const alloc = await allocateUnitForBooking('rent_btn_03', startDate, endDate)
  assert.equal(alloc.success, true)
  assert.ok(alloc.unit)
  assert.match(alloc.unit.id, VALID_UUID_REGEX, `Allocated unit ID ${alloc.unit.id} must be a valid UUID`)
  console.log('  ✓ Successfully allocated unit:', alloc.unit.id, alloc.unit.unitIdentifier)

  // 5. Test inserting booking with the allocated unit ID into Supabase
  console.log('\nTEST 5: Database insertion with allocated unit ID into public.bookings')
  const db = createServiceClient()
  const testRef = 'TEST-VERIFY-' + Date.now()
  const { data: booking, error: insertError } = await db.from('bookings').insert({
    reference: testRef,
    customer_id: 'user_cust_test_uuid',
    customer_name: 'Test Customer UUID Check',
    customer_email: 'test_uuid@example.com',
    service_type: 'rental',
    vehicle_category: 'vehicle',
    pickup: 'Butuan City Hub',
    destination: 'Montilla Blvd, Butuan City',
    scheduled_at: new Date(startDate).toISOString(),
    passengers: 1,
    payment_mode: 'cash',
    estimated_fare: 900,
    notes: 'Unit verification test',
    status: 'pending',
    unit_id: alloc.unit.id,
    listing_id: 'rent_btn_03',
    rental_start_date: new Date(startDate).toISOString(),
    rental_end_date: new Date(endDate).toISOString(),
  }).select('id, reference, unit_id, status').single()

  assert.equal(insertError, null, `Insert must not error: ${insertError?.message}`)
  assert.ok(booking?.id)
  assert.equal(booking?.unit_id, alloc.unit.id)
  console.log('  ✓ Database insert succeeded with real UUID:', booking)

  // 6. Test cleanup
  if (booking?.id) {
    const { error: delError } = await db.from('bookings').delete().eq('id', booking.id)
    assert.equal(delError, null)
    console.log('  ✓ Cleaned up test booking:', booking.id)
  }

  // 7. Check all vehicle listings
  console.log('\nTEST 6: Verify all other fleet vehicle models')
  for (const listingId of ['rent_btn_01', 'rent_btn_02', 'rent_btn_04']) {
    const units = await getUnitsForListing(listingId)
    assert.ok(units.length > 0)
    for (const u of units) {
      assert.match(u.id, VALID_UUID_REGEX)
    }
  }
  console.log('  ✓ All models (Innova, HiAce, NMAX) verified with valid database UUIDs')

  console.log('\n🎉 ALL DATABASE INTEGRITY & UUID TESTS PASSED!')
}

runTests().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
