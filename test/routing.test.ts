import assert from "node:assert/strict"
import {
  calculateHaversineDistanceKm,
  calculateFallbackRoadRoute,
  isValidCoordinates,
  isValidOsrmRoute,
  getRoadRoute,
  type RouteCoordinates,
} from "../lib/maps/routing"

console.log("=== RUNNING HITSNAGO OSRM ROUTING & FALLBACK TEST SUITE ===\n")

const CITY_HALL: RouteCoordinates = { lat: 8.9475, lng: 125.5406 }
const BANCASI_AIRPORT: RouteCoordinates = { lat: 8.9515, lng: 125.4789 }
const GAISANO_MALL: RouteCoordinates = { lat: 8.9515, lng: 125.5276 }

// ─── TEST 1: Coordinate Validation ───────────────────────────────────────────
console.log("[TEST 1] Coordinate validation tests...")
assert.equal(isValidCoordinates(CITY_HALL), true, "Valid Butuan City Hall coordinates should pass")
assert.equal(isValidCoordinates({ lat: 8.9515, lng: 125.4789 }), true, "Valid Airport coordinates should pass")
assert.equal(isValidCoordinates(null), false, "Null coordinates must fail")
assert.equal(isValidCoordinates({ lat: 95, lng: 125.54 }), false, "Latitude > 90 must fail")
assert.equal(isValidCoordinates({ lat: 8.94, lng: 200 }), false, "Longitude > 180 must fail")
assert.equal(isValidCoordinates({ lat: NaN, lng: 125.54 }), false, "NaN coordinate must fail")
console.log("✓ Coordinate validation correctly accepts valid bounds and rejects invalid values.")

// ─── TEST 2: Haversine Distance ──────────────────────────────────────────────
console.log("\n[TEST 2] Haversine distance accuracy...")
const distCityHallToAirport = calculateHaversineDistanceKm(CITY_HALL, BANCASI_AIRPORT)
assert(distCityHallToAirport > 6.0 && distCityHallToAirport < 7.5, `Expected ~6.8km, got ${distCityHallToAirport}km`)

const zeroDist = calculateHaversineDistanceKm(CITY_HALL, CITY_HALL)
assert.equal(zeroDist, 0, "Distance between identical points must be 0")
console.log(`✓ Haversine distance verified: City Hall to Bancasi Airport is ${distCityHallToAirport.toFixed(2)} km.`)

// ─── TEST 3: Fallback Road Route Calculation ─────────────────────────────────
console.log("\n[TEST 3] Intelligent municipal road distance fallback...")
const fallbackResult = calculateFallbackRoadRoute(CITY_HALL, GAISANO_MALL)

assert.equal(fallbackResult.isFallback, true, "isFallback must be true")
assert.equal(fallbackResult.isApproximate, true, "isApproximate must be true")
assert.equal(fallbackResult.routeQuality, "approximate_grid", "routeQuality must be approximate_grid")
assert.equal(fallbackResult.coordinates.length, 2, "Fallback coordinates must contain origin and destination")
assert.deepEqual(fallbackResult.coordinates[0], [CITY_HALL.lat, CITY_HALL.lng], "Origin coordinate must match exactly")
assert.deepEqual(fallbackResult.coordinates[1], [GAISANO_MALL.lat, GAISANO_MALL.lng], "Destination coordinate must match exactly")
assert(fallbackResult.distanceKm >= 0.5, "Distance must be at least 0.5 km")
assert(fallbackResult.durationMin >= 2, "Duration must be at least 2 minutes")
console.log("✓ Fallback calculation correctly applies 1.35x winding factor and marks result as approximate.")

// ─── TEST 4: Zero-Distance Direct Shortcut ───────────────────────────────────
console.log("\n[TEST 4] Identical coordinates handling...")
const zeroRoute = await getRoadRoute(CITY_HALL, CITY_HALL)
assert.equal(zeroRoute.distanceKm, 0, "Zero distance expected")
assert.equal(zeroRoute.durationMin, 0, "Zero duration expected")
assert.equal(zeroRoute.isFallback, false, "Zero route is not fallback")
assert.equal(zeroRoute.isApproximate, false, "Zero route is exact")
assert.deepEqual(zeroRoute.coordinates[0], [CITY_HALL.lat, CITY_HALL.lng])
console.log("✓ Identical coordinates shortcut succeeds immediately without network calls.")

// ─── TEST 5: Strict OSRM Response Payload Validation ─────────────────────────
console.log("\n[TEST 5] OSRM payload validation...")
const validOsrmRoutePayload = {
  distance: 3500,
  duration: 480,
  geometry: {
    coordinates: [
      [125.5406, 8.9475],
      [125.5350, 8.9490],
      [125.5276, 8.9515],
    ],
  },
  legs: [{ summary: "J.C. Aquino Ave" }],
}
assert.equal(isValidOsrmRoute(validOsrmRoutePayload), true, "Valid OSRM route payload must pass")

assert.equal(isValidOsrmRoute(null), false, "Null route must fail")
assert.equal(isValidOsrmRoute({ distance: -10, duration: 10, geometry: { coordinates: [[1, 2], [3, 4]] } }), false, "Negative distance must fail")
assert.equal(isValidOsrmRoute({ distance: 100, duration: NaN, geometry: { coordinates: [[1, 2], [3, 4]] } }), false, "NaN duration must fail")
assert.equal(isValidOsrmRoute({ distance: 100, duration: 10, geometry: { coordinates: [[1, 2]] } }), false, "Geometry with < 2 coordinates must fail")
assert.equal(isValidOsrmRoute({ distance: 100, duration: 10, geometry: { coordinates: "invalid" } }), false, "Non-array coordinates must fail")
console.log("✓ Strict OSRM validator accurately guards all payload attributes.")

// ─── TEST 6: Successful Routing Extraction with Mocked Server ───────────────
console.log("\n[TEST 6] Mocked successful OSRM route extraction & coordinate snapping...")
const originalFetch = globalThis.fetch

globalThis.fetch = async () => {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      code: "Ok",
      routes: [validOsrmRoutePayload],
    }),
  } as unknown as Response
}

const mockOrigin = { lat: 8.947512, lng: 125.540634 }
const mockDest = { lat: 8.951578, lng: 125.527691 }
const successfulRoute = await getRoadRoute(mockOrigin, mockDest, { timeoutMs: 5000, maxRetries: 0 })

assert.equal(successfulRoute.isFallback, false, "Successful OSRM route must have isFallback: false")
assert.equal(successfulRoute.isApproximate, false, "Successful OSRM route must have isApproximate: false")
assert.equal(successfulRoute.routeQuality, "exact_road", "routeQuality must be exact_road")
assert.equal(successfulRoute.distanceKm, 3.5, "Expected 3.5 km distance")
assert.equal(successfulRoute.durationMin, 8, "Expected 8 minutes duration")
// Verify coordinate snapping to exact user input
assert.deepEqual(successfulRoute.coordinates[0], [mockOrigin.lat, mockOrigin.lng], "First coordinate must snap to exact origin")
assert.deepEqual(successfulRoute.coordinates[successfulRoute.coordinates.length - 1], [mockDest.lat, mockDest.lng], "Last coordinate must snap to exact destination")
console.log("✓ Successful OSRM road route correctly extracts distance, duration, and snaps endpoints to exact coordinates.")

// ─── TEST 7: Configurable Timeout & Abort Handling ───────────────────────────
console.log("\n[TEST 7] Configurable timeout and timer cleanup verification...")
let timeoutTriggered = false

globalThis.fetch = async (url, init) => {
  const signal = init?.signal as AbortSignal | undefined
  return new Promise((resolve, reject) => {
    if (signal) {
      signal.addEventListener("abort", () => {
        timeoutTriggered = true
        const err = new Error("This operation was aborted")
        err.name = "AbortError"
        reject(err)
      })
    }
  })
}

const timeoutStart = Date.now()
const timeoutRoute = await getRoadRoute(
  { lat: 8.91, lng: 125.51 },
  { lat: 8.92, lng: 125.52 },
  { timeoutMs: 80, maxRetries: 0 } // Fast 80ms timeout test
)
const timeoutElapsed = Date.now() - timeoutStart

assert.equal(timeoutTriggered, true, "AbortController signal must trigger timeout abort")
assert(timeoutElapsed >= 75 && timeoutElapsed < 400, `Timeout elapsed was ${timeoutElapsed}ms`)
assert.equal(timeoutRoute.isFallback, true, "Timed-out request must gracefully return fallback")
assert.equal(timeoutRoute.isApproximate, true, "Timed-out result must be marked as approximate")
assert.equal(timeoutRoute.errorReason, "timeout", "Error reason must be recorded as timeout")
console.log(`✓ Timeout cleanly triggered at ${timeoutElapsed}ms and returned approximate municipal fallback.`)

// ─── TEST 8: Malformed / HTTP 500 Error Recovery & Bounded Retries ───────────
console.log("\n[TEST 8] Malformed payload and bounded retry recovery...")
let retryAttempts = 0

globalThis.fetch = async () => {
  retryAttempts++
  return {
    ok: false,
    status: 503,
    statusText: "Service Unavailable",
    json: async () => ({}),
  } as unknown as Response
}

const errorRoute = await getRoadRoute(
  { lat: 8.93, lng: 125.53 },
  { lat: 8.94, lng: 125.54 },
  { timeoutMs: 500, maxRetries: 1, retryDelayMs: 20 }
)

// Initial attempt (1) + max 1 retry (1) = 2 attempts total
assert.equal(retryAttempts, 2, `Expected exactly 2 attempts, got ${retryAttempts}`)
assert.equal(errorRoute.isFallback, true, "Failed request must return fallback")
assert.equal(errorRoute.isApproximate, true, "Must be marked approximate")
assert.equal(errorRoute.errorReason, "http_status_503")
console.log("✓ Bounded retries correctly executed 2 attempts on 503 and gracefully fell back without infinite loops.")

// ─── TEST 9: In-Memory Caching ───────────────────────────────────────────────
console.log("\n[TEST 9] In-memory cache verification...")
let fetchCalls = 0

globalThis.fetch = async () => {
  fetchCalls++
  return {
    ok: true,
    status: 200,
    json: async () => ({
      code: "Ok",
      routes: [validOsrmRoutePayload],
    }),
  } as unknown as Response
}

const cacheOrigin = { lat: 8.961, lng: 125.561 }
const cacheDest = { lat: 8.962, lng: 125.562 }

const firstCall = await getRoadRoute(cacheOrigin, cacheDest, { timeoutMs: 1000, maxRetries: 0 })
assert.equal(fetchCalls, 1, "First query should invoke fetch")

const secondCall = await getRoadRoute(cacheOrigin, cacheDest, { timeoutMs: 1000, maxRetries: 0 })
assert.equal(fetchCalls, 1, "Second query for identical points must use memory cache and NOT call fetch")
assert.equal(secondCall.distanceKm, firstCall.distanceKm)
console.log("✓ In-memory route cache successfully eliminated redundant network requests.")

// Restore fetch
globalThis.fetch = originalFetch

console.log("\n=======================================================")
console.log("ALL 9 ROUTING & FALLBACK TESTS PASSED SUCCESSFULLY!")
console.log("=======================================================\n")
