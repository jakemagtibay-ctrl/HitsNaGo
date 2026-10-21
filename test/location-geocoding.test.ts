import assert from "node:assert/strict"
import {
  normalizeLocationData,
  isValidCoordinateBounds,
  type LocationData,
} from "../types/location"
import {
  parseBookingGeo,
  serializeBookingGeo,
  resolveButuanCoordinates,
  searchButuanLocations,
  findNearestButuanLandmark,
} from "../lib/maps/geocode"
import {
  BUTUAN_PRESET_LOCATIONS,
  BUTUAN_BARANGAYS,
} from "../lib/mock-data/butuan-locations"
import type { Booking } from "../lib/actions/bookings"

console.log("=== RUNNING HITSNAGO ACCURATE LOCATION & GEOCODING TEST SUITE ===\n")

// ─── TEST 1: Coordinate Bounds & Validation ───────────────────────────────────
console.log("[TEST 1] Coordinate bounds & range validation...")
assert.equal(isValidCoordinateBounds(8.9475, 125.5406), true, "Valid Butuan City Hall coords must pass")
assert.equal(isValidCoordinateBounds(0, 0), true, "Equator coords are within valid globe bounds")
assert.equal(isValidCoordinateBounds(91, 125.54), false, "Latitude > 90 must fail")
assert.equal(isValidCoordinateBounds(-91, 125.54), false, "Latitude < -90 must fail")
assert.equal(isValidCoordinateBounds(8.94, 181), false, "Longitude > 180 must fail")
assert.equal(isValidCoordinateBounds(8.94, -181), false, "Longitude < -180 must fail")
assert.equal(isValidCoordinateBounds(NaN, 125.54), false, "NaN latitude must fail")
assert.equal(isValidCoordinateBounds(8.94, NaN), false, "NaN longitude must fail")
console.log("✓ Coordinate bounds correctly validate standard geographical limits.")

// ─── TEST 2: Location Data Normalization ──────────────────────────────────────
console.log("\n[TEST 2] LocationData normalization and data consistency...")
const rawLocationInput = {
  placeName: "  SM City Butuan  ",
  formattedAddress: "  JC Aquino Ave, Brgy. Lapu-Lapu, Butuan City, Agusan del Norte, 8600  ",
  latitude: 8.945899999,
  longitude: 125.534200001,
  barangay: "Lapu-Lapu",
  city: "Butuan City",
  province: "Agusan del Norte",
  country: "Philippines",
  addressDetails: "  Near North Entrance Gate  ",
}

const normalized = normalizeLocationData(rawLocationInput)
assert.equal(normalized.placeName, "SM City Butuan", "placeName should be trimmed")
assert.equal(normalized.formattedAddress, "JC Aquino Ave, Brgy. Lapu-Lapu, Butuan City, Agusan del Norte, 8600")
assert.equal(normalized.latitude, 8.9459, "latitude should be rounded to 6 decimal places")
assert.equal(normalized.longitude, 125.5342, "longitude should be rounded to 6 decimal places")
assert.equal(normalized.addressDetails, "Near North Entrance Gate")
assert.equal(normalized.city, "Butuan City")
console.log("✓ normalizeLocationData cleanly standardizes location fields and coordinate precision.")

// ─── TEST 3: Gazetteer Search & Landmark Autocomplete ─────────────────────────
console.log("\n[TEST 3] Landmark and establishment gazetteer search...")
// Search for hospital
const hospitalResults = searchButuanLocations("Doctors")
assert(hospitalResults.length > 0, "Searching 'Doctors' must find Butuan Doctors Hospital")
assert(hospitalResults[0].title.includes("Doctors"), "First result should be Butuan Doctors Hospital")
assert(hospitalResults[0].coordinates.lat > 8.9, "Coordinates must be in Butuan range")

// Search for school / university
const univResults = searchButuanLocations("Father Saturnino Urios")
assert(univResults.length > 0, "Searching 'Urios' must return FSUU")
assert.equal(univResults[0].title, "Father Saturnino Urios University (FSUU)")

// Search for barangay
const brgyResults = searchButuanLocations("Doongan")
assert(brgyResults.length > 0, "Searching 'Doongan' must return Barangay Doongan")
assert.equal(brgyResults[0].barangay, "Doongan")

// Search for mall
const mallResults = searchButuanLocations("Robinsons Place")
assert(mallResults.length > 0, "Searching 'Robinsons' must return Robinsons Place Butuan")
assert.equal(mallResults[0].category, "commercial")
console.log("✓ Gazetteer search accurately resolves landmarks, hospitals, universities, and barangays.")

// ─── TEST 4: Nearest Landmark Proximity Matching (Reverse Geocoding) ───────────
console.log("\n[TEST 4] Nearest landmark proximity reverse lookup...")
// Close to SM City Butuan (within 5 meters)
const nearSmCoords = { lat: 8.95122, lng: 125.53852 }
const matchedSm = findNearestButuanLandmark(nearSmCoords.lat, nearSmCoords.lng, 0.05) // within 50 meters
assert(matchedSm !== null, "Points within 50m of SM City Butuan should resolve to SM City Butuan")
assert.equal(matchedSm?.placeName, "SM City Butuan")

// Point far in the middle of a rural area (no landmark within 50m)
const ruralCoords = { lat: 8.8800, lng: 125.6000 }
const noMatch = findNearestButuanLandmark(ruralCoords.lat, ruralCoords.lng, 0.05)
assert.equal(noMatch, null, "Rural point should return null rather than inventing a false place name")
console.log("✓ Nearest landmark proximity matches nearby establishments and never invents false landmarks.")

// ─── TEST 5: Booking Geo Serialization & Extraction ───────────────────────────
console.log("\n[TEST 5] Booking geo serialization and extraction...")
const userNotes = "Please bring change for 500 pesos."
const geoMeta = {
  pickupCoords: { lat: 8.9515, lng: 125.5276 },
  destinationCoords: { lat: 8.9475, lng: 125.5406 },
  pickupPlaceName: "Gaisano Mall Butuan",
  destinationPlaceName: "Butuan City Hall",
  pickupDetails: "At the main driveway beside taxi stand",
  destDetails: "Engineering building lobby",
  distanceKm: 2.4,
  durationMin: 7,
}

const serializedNotes = serializeBookingGeo(userNotes, geoMeta)
assert(serializedNotes.startsWith("Please bring change for 500 pesos."), "User notes must be preserved")
assert(serializedNotes.includes("[GEO:"), "Notes must contain [GEO: tag")

// Mock booking with only serialized notes (legacy/unmigrated schema test)
const mockLegacyBooking: Booking = {
  id: "bk_test_01",
  reference: "HNG-123456",
  customer_id: "user_test",
  customer_name: "Juan Dela Cruz",
  customer_email: "juan@example.com",
  service_type: "ride",
  vehicle_category: "motorcycle",
  pickup: "Gaisano Mall, JC Aquino Ave, Butuan City",
  destination: "Butuan City Hall, Jose Rosales Ave, Butuan City",
  scheduled_at: new Date().toISOString(),
  passengers: 1,
  payment_mode: "cash",
  estimated_fare: 65,
  notes: serializedNotes,
  status: "pending",
  rider_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const parsedFromNotes = parseBookingGeo(mockLegacyBooking)
assert.equal(parsedFromNotes.pickupPlaceName, "Gaisano Mall Butuan", "Place name should be extracted from notes tag")
assert.equal(parsedFromNotes.destPlaceName, "Butuan City Hall", "Destination place name extracted from notes tag")
assert.equal(parsedFromNotes.pickupDetails, "At the main driveway beside taxi stand")
assert.equal(parsedFromNotes.destDetails, "Engineering building lobby")
assert.equal(parsedFromNotes.isExact, true, "isExact should be true")
assert.equal(parsedFromNotes.cleanNotes, "Please bring change for 500 pesos.", "Clean notes should strip [GEO:]")
assert.deepEqual(parsedFromNotes.pickupCoords, { lat: 8.9515, lng: 125.5276 })
console.log("✓ parseBookingGeo successfully recovers all structured metadata from notes tag without schema alterations.")

// ─── TEST 6: Parsing from Dedicated Database Columns (Migrated Schema) ────────
console.log("\n[TEST 6] Parsing from dedicated database columns (Migrated Schema)...")
const mockMigratedBooking: Booking = {
  id: "bk_test_02",
  reference: "HNG-654321",
  customer_id: "user_test",
  customer_name: "Maria Santos",
  customer_email: "maria@example.com",
  service_type: "delivery",
  vehicle_category: "motorcycle",
  pickup: "JC Aquino Ave, Brgy. Lapu-Lapu, Butuan City",
  destination: "Montilla Blvd, Butuan City",
  pickup_place_name: "SM City Butuan",
  pickup_latitude: 8.9459,
  pickup_longitude: 125.5342,
  pickup_barangay: "Lapu-Lapu",
  pickup_city: "Butuan City",
  pickup_details: "Drop package at customer service counter",
  destination_place_name: "Father Saturnino Urios University (FSUU)",
  destination_latitude: 8.9482,
  destination_longitude: 125.5435,
  destination_barangay: "Dagohoy",
  destination_city: "Butuan City",
  destination_details: "Main gate guardhouse",
  scheduled_at: new Date().toISOString(),
  passengers: 0,
  payment_mode: "cash",
  estimated_fare: 85,
  notes: "Urgent medicine delivery",
  status: "assigned",
  rider_id: "rider_test",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const parsedFromColumns = parseBookingGeo(mockMigratedBooking)
assert.equal(parsedFromColumns.pickupPlaceName, "SM City Butuan")
assert.equal(parsedFromColumns.destPlaceName, "Father Saturnino Urios University (FSUU)")
assert.equal(parsedFromColumns.pickupDetails, "Drop package at customer service counter")
assert.equal(parsedFromColumns.destDetails, "Main gate guardhouse")
assert.equal(parsedFromColumns.isExact, true)
assert.deepEqual(parsedFromColumns.pickupCoords, { lat: 8.9459, lng: 125.5342 })
assert.deepEqual(parsedFromColumns.destCoords, { lat: 8.9482, lng: 125.5435 })
console.log("✓ parseBookingGeo prioritizes authoritative database columns when present.")

// ─── TEST 7: Fallback When No Coordinates Or Geo Tags Exist ───────────────────
console.log("\n[TEST 7] Address fallback resolution for historical bookings...")
const mockBareBooking: Booking = {
  id: "bk_test_03",
  reference: "HNG-999999",
  customer_id: "user_test",
  customer_name: "Old Booking Customer",
  customer_email: "old@example.com",
  service_type: "ride",
  vehicle_category: "motorcycle",
  pickup: "Bancasi Airport, Butuan City",
  destination: "Barangay Libertad, Butuan City",
  scheduled_at: new Date().toISOString(),
  passengers: 1,
  payment_mode: "cash",
  estimated_fare: 120,
  notes: null,
  status: "completed",
  rider_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const parsedBare = parseBookingGeo(mockBareBooking)
assert(parsedBare.pickupCoords !== null, "Should resolve coordinates for Bancasi Airport")
assert(parsedBare.pickupCoords.lat > 8.9 && parsedBare.pickupCoords.lng > 125.4, "Coordinates should be near airport")
assert.equal(parsedBare.pickupPlaceName, "Bancasi Airport", "Should derive clean place name from address")
assert.equal(parsedBare.destPlaceName, "Barangay Libertad", "Should derive clean destination name from address")
console.log("✓ Address fallback seamlessly generates sensible coordinates and labels for legacy bookings.")

console.log("\n=== ALL ACCURATE LOCATION & GEOCODING TESTS PASSED SUCCESSFULLY! ===")
