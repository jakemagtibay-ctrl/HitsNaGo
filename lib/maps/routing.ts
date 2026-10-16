import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"

export interface RouteCoordinates {
  lat: number
  lng: number
}

export interface RouteOptions {
  /**
   * Request timeout in milliseconds. Default: 7000ms.
   */
  timeoutMs?: number
  /**
   * Maximum retry attempts on transient failure or timeout. Default: 1 (max 2 attempts total).
   */
  maxRetries?: number
  /**
   * Delay in milliseconds between retries. Default: 350ms.
   */
  retryDelayMs?: number
  /**
   * Custom routing server endpoint.
   */
  endpoint?: string
  /**
   * Optional external AbortSignal to cancel the request.
   */
  signal?: AbortSignal
}

export interface RouteResult {
  coordinates: [number, number][] // [lat, lng] array for Leaflet polyline
  distanceKm: number              // Actual road distance or estimated distance in km
  durationMin: number             // Estimated driving duration in minutes
  isFallback: boolean             // Whether OSRM was unavailable and fallback was used
  isApproximate?: boolean         // Explicit flag indicating approximate municipal grid estimate
  routeQuality?: "exact_road" | "approximate_grid" // Explicit quality categorization
  summary?: string
  errorReason?: string            // Sanitized reason why fallback was invoked
}

// ─── In-memory Route Cache (5-minute TTL) ────────────────────────────────────

interface RouteCacheEntry {
  result: RouteResult
  expiresAt: number
}

const routeCache = new Map<string, RouteCacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_ENTRIES = 100

function getCacheKey(origin: RouteCoordinates, destination: RouteCoordinates): string {
  return `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}->${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`
}

function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, entry] of routeCache.entries()) {
    if (entry.expiresAt <= now) {
      routeCache.delete(key)
    }
  }
}

/**
 * Validates coordinate pair
 */
export function isValidCoordinates(coords?: RouteCoordinates | null): coords is RouteCoordinates {
  return (
    Boolean(coords) &&
    typeof coords?.lat === "number" &&
    !isNaN(coords.lat) &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    typeof coords?.lng === "number" &&
    !isNaN(coords.lng) &&
    coords.lng >= -180 &&
    coords.lng <= 180
  )
}

/**
 * Computes Haversine great-circle distance between two points in km
 */
export function calculateHaversineDistanceKm(
  point1: RouteCoordinates,
  point2: RouteCoordinates
): number {
  if (!isValidCoordinates(point1) || !isValidCoordinates(point2)) {
    return 0
  }
  const R = 6371 // Earth radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Intelligent municipal road distance fallback
 * Applies a 1.35x winding factor to account for Butuan City street grid topology
 * Assumes average municipal vehicle speed of ~25 km/h with traffic considerations
 * Explicitly marks result as approximate so it is not misrepresented as an exact road route
 */
export function calculateFallbackRoadRoute(
  origin: RouteCoordinates,
  destination: RouteCoordinates,
  errorReason?: string
): RouteResult {
  const safeOrigin = isValidCoordinates(origin) ? origin : ACTIVE_SERVICE_AREA.centerCoordinates
  const safeDest = isValidCoordinates(destination) ? destination : ACTIVE_SERVICE_AREA.centerCoordinates

  const straightLineKm = calculateHaversineDistanceKm(safeOrigin, safeDest)
  const estimatedRoadKm = Math.max(0.5, Number((straightLineKm * 1.35).toFixed(2)))
  const estimatedDurationMin = Math.max(2, Math.round((estimatedRoadKm / 25) * 60))

  return {
    coordinates: [
      [safeOrigin.lat, safeOrigin.lng],
      [safeDest.lat, safeDest.lng],
    ],
    distanceKm: estimatedRoadKm,
    durationMin: estimatedDurationMin,
    isFallback: true,
    isApproximate: true,
    routeQuality: "approximate_grid",
    summary: "Approximate municipal grid estimate (road routing unavailable)",
    errorReason,
  }
}

// ─── OSRM Response Validator ─────────────────────────────────────────────────

interface OsrmRouteGeometry {
  coordinates: [number, number][]
  type?: string
}

interface OsrmRoute {
  distance: number
  duration: number
  geometry: OsrmRouteGeometry
  legs?: Array<{ summary?: string }>
}

interface OsrmResponse {
  code: string
  routes?: OsrmRoute[]
}

export function isValidOsrmRoute(route: unknown): route is OsrmRoute {
  if (!route || typeof route !== "object") return false
  const r = route as Record<string, unknown>

  // Distance must be a non-negative finite number
  if (typeof r.distance !== "number" || isNaN(r.distance) || !isFinite(r.distance) || r.distance < 0) {
    return false
  }

  // Duration must be a non-negative finite number
  if (typeof r.duration !== "number" || isNaN(r.duration) || !isFinite(r.duration) || r.duration < 0) {
    return false
  }

  // Geometry must be an object with coordinates array of at least 2 points
  if (!r.geometry || typeof r.geometry !== "object") return false
  const geom = r.geometry as Record<string, unknown>
  if (!Array.isArray(geom.coordinates) || geom.coordinates.length < 2) return false

  // Each point must be valid [lng, lat] numbers
  return geom.coordinates.every(
    (pt) =>
      Array.isArray(pt) &&
      pt.length >= 2 &&
      typeof pt[0] === "number" &&
      !isNaN(pt[0]) &&
      typeof pt[1] === "number" &&
      !isNaN(pt[1])
  )
}

/**
 * Queries OSRM road network routing engine for driving directions in Butuan City.
 * Features:
 * - Sensible configurable timeout (default: 7000ms instead of 4000ms)
 * - Safe timer cleanup in `finally` blocks
 * - Limited retry with backoff (max 1 retry, no infinite loop)
 * - Strict response validation before reading distance, duration, or geometry
 * - In-memory cache for repeated lookups
 * - Sanitized logging without leaking user or environment data
 * - Clear marking of approximate fallback routes
 */
export async function getRoadRoute(
  origin: RouteCoordinates,
  destination: RouteCoordinates,
  options?: RouteOptions
): Promise<RouteResult> {
  // Validate coordinates
  if (!isValidCoordinates(origin) || !isValidCoordinates(destination)) {
    return calculateFallbackRoadRoute(
      origin || ACTIVE_SERVICE_AREA.centerCoordinates,
      destination || ACTIVE_SERVICE_AREA.centerCoordinates,
      "invalid_coordinates"
    )
  }

  // If origin and destination are essentially identical (< 5 meters), return zero route
  const directDistance = calculateHaversineDistanceKm(origin, destination)
  if (directDistance < 0.005) {
    return {
      coordinates: [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ],
      distanceKm: 0,
      durationMin: 0,
      isFallback: false,
      isApproximate: false,
      routeQuality: "exact_road",
      summary: "Origin and destination are identical",
    }
  }

  // Check in-memory cache
  const cacheKey = getCacheKey(origin, destination)
  const cached = routeCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result
  }

  // Configuration options
  const timeoutMs = options?.timeoutMs ?? 7000
  const maxRetries = Math.min(Math.max(0, options?.maxRetries ?? 1), 2)
  const retryDelayMs = options?.retryDelayMs ?? 350
  const baseEndpoint = (
    options?.endpoint ||
    process.env.NEXT_PUBLIC_OSRM_ROUTING_URL ||
    "https://router.project-osrm.org/route/v1/driving/"
  ).replace(/\/$/, "")

  // OSRM format: lng,lat;lng,lat
  const originStr = `${origin.lng.toFixed(6)},${origin.lat.toFixed(6)}`
  const destStr = `${destination.lng.toFixed(6)},${destination.lat.toFixed(6)}`
  const url = `${baseEndpoint}/${originStr};${destStr}?overview=full&geometries=geojson`

  let lastErrorReason = "unknown_error"

  // Limited retry loop (max 1 retry by default)
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    try {
      const controller = new AbortController()

      // Set timeout with guarantee of cleanup in finally
      timeoutId = setTimeout(() => {
        controller.abort()
      }, timeoutMs)

      // Forward external caller signal if aborted
      const handleExternalAbort = () => controller.abort()
      if (options?.signal) {
        if (options.signal.aborted) {
          controller.abort()
        } else {
          options.signal.addEventListener("abort", handleExternalAbort, { once: true })
        }
      }

      let response: Response
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        })
      } finally {
        if (options?.signal) {
          options.signal.removeEventListener("abort", handleExternalAbort)
        }
      }

      if (!response.ok) {
        lastErrorReason = `http_status_${response.status}`
        // Transient server errors or rate limiting (429, 502, 503, 504) can be retried
        if ([429, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)))
          continue
        }
        break
      }

      const rawData: unknown = await response.json()
      const data = rawData as OsrmResponse

      if (!data || data.code !== "Ok" || !Array.isArray(data.routes) || data.routes.length === 0) {
        lastErrorReason = `osrm_code_${data?.code || "invalid"}`
        break
      }

      const routeCandidate = data.routes[0]

      // Strict validation before reading properties
      if (!isValidOsrmRoute(routeCandidate)) {
        lastErrorReason = "invalid_route_payload"
        break
      }

      const distanceKm = Number((routeCandidate.distance / 1000).toFixed(2))
      const durationMin = Math.max(1, Math.round(routeCandidate.duration / 60))

      // Convert GeoJSON [lng, lat] coordinates to Leaflet [lat, lng]
      const coordinates: [number, number][] = routeCandidate.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      )

      // Ensure the polyline connects directly and precisely to the user's exact coordinates
      if (coordinates.length > 0) {
        coordinates[0] = [origin.lat, origin.lng]
        coordinates[coordinates.length - 1] = [destination.lat, destination.lng]
      }

      const result: RouteResult = {
        coordinates,
        distanceKm,
        durationMin,
        isFallback: false,
        isApproximate: false,
        routeQuality: "exact_road",
        summary: routeCandidate.legs?.[0]?.summary || "Butuan City Road Corridor",
      }

      // Save to cache
      if (routeCache.size >= MAX_CACHE_ENTRIES) {
        cleanExpiredCache()
        if (routeCache.size >= MAX_CACHE_ENTRIES) {
          const firstKey = routeCache.keys().next().value
          if (firstKey) routeCache.delete(firstKey)
        }
      }
      routeCache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS })

      return result
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError"
      lastErrorReason = isAbort ? "timeout" : "network_error"

      // If timed out and retries remain, back off briefly and retry once
      if (attempt < maxRetries && !options?.signal?.aborted) {
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)))
        continue
      }
      break
    } finally {
      // REQUIREMENT 4: Always clear timeout timers in a finally block
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }
  }

  // Sanitized logging: do not leak user info, secrets, or full query URLs
  if (lastErrorReason === "timeout") {
    console.warn(
      `[getRoadRoute] Road routing request timed out after ${timeoutMs}ms. Using calibrated municipal grid estimate.`
    )
  } else {
    console.warn(
      `[getRoadRoute] Road routing service unavailable (${lastErrorReason}). Using calibrated municipal grid estimate.`
    )
  }

  return calculateFallbackRoadRoute(origin, destination, lastErrorReason)
}

/**
 * Generates an external turn-by-turn navigation URL for riders/drivers
 */
export function getNavigationUrl(
  origin: RouteCoordinates,
  destination: RouteCoordinates,
  app: "google" | "waze" = "google"
): string {
  if (app === "waze") {
    return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`
}
