import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import type { MapMarker } from "@/components/maps/types"
import type { GeocodeResult } from "@/app/api/maps/geocode/route"
import type { ReverseGeocodeResponse } from "@/app/api/maps/reverse-geocode/route"

export type { GeocodeResult, ReverseGeocodeResponse }

export interface BookingGeoMeta {
  pickupCoords?: { lat: number; lng: number }
  destinationCoords?: { lat: number; lng: number }
  distanceKm?: number
  durationMin?: number
  clientNotes?: string
}

/**
 * Searches real addresses and establishments using the server-side Nominatim proxy.
 * Debounced and respects rate limits.
 */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return []

  try {
    const res = await fetch(`/api/maps/geocode?q=${encodeURIComponent(query.trim())}`, {
      signal,
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch (err) {
    if ((err as Error).name === "AbortError") return []
    console.warn("[searchAddress] Geocode error:", err)
    return []
  }
}

/**
 * Reverse-geocodes exact latitude & longitude coordinates into a human-readable street address.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResponse> {
  try {
    const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`, {
      signal,
    })
    if (res.ok) {
      const data = await res.json()
      if (data && !data.error) return data
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err
    console.warn("[reverseGeocode] Reverse error:", err)
  }

  // Graceful fallback
  return {
    title: `Pinned Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
    address: `Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)}), Butuan City`,
    city: "Butuan City",
    province: "Agusan del Norte",
    postalCode: "8600",
    lat,
    lng,
    isApproximate: true,
  }
}

/**
 * Extracts exact coordinates from a booking's notes tag or falls back to resolving.
 */
export function parseBookingGeo(booking: {
  notes?: string | null
  pickup?: string
  destination?: string | null
}): {
  pickupCoords: { lat: number; lng: number }
  destCoords?: { lat: number; lng: number }
  distanceKm?: number
  durationMin?: number
  cleanNotes: string
  isExact: boolean
} {
  const rawNotes = booking.notes || ""
  let cleanNotes = rawNotes
  let isExact = false
  let pickupCoords: { lat: number; lng: number } | undefined
  let destCoords: { lat: number; lng: number } | undefined
  let distanceKm: number | undefined
  let durationMin: number | undefined

  // Match [GEO:{"pickup":{lat,lng},"dest":{lat,lng},...}]
  const geoMatch = rawNotes.match(/\[GEO:(.*?)\]/)
  if (geoMatch) {
    try {
      const parsed = JSON.parse(geoMatch[1]) as BookingGeoMeta
      if (parsed.pickupCoords && typeof parsed.pickupCoords.lat === "number") {
        pickupCoords = parsed.pickupCoords
        isExact = true
      }
      if (parsed.destinationCoords && typeof parsed.destinationCoords.lat === "number") {
        destCoords = parsed.destinationCoords
      }
      if (typeof parsed.distanceKm === "number") distanceKm = parsed.distanceKm
      if (typeof parsed.durationMin === "number") durationMin = parsed.durationMin
      // Remove GEO tag from clean user-facing notes
      cleanNotes = rawNotes.replace(/\[GEO:.*?\]/, "").trim()
    } catch {
      // Ignore JSON parse error and fallback
    }
  }

  // Fallback to address resolution if no exact tag exists
  if (!pickupCoords) {
    pickupCoords = resolveButuanCoordinates(booking.pickup)
  }
  if (!destCoords && booking.destination) {
    destCoords = resolveButuanCoordinates(booking.destination)
  }

  return {
    pickupCoords,
    destCoords,
    distanceKm,
    durationMin,
    cleanNotes,
    isExact,
  }
}

/**
 * Serializes exact coordinates into a machine-parseable tag embedded into booking notes.
 */
export function serializeBookingGeo(
  userNotes: string | null | undefined,
  meta: BookingGeoMeta
): string {
  const geoTag = `[GEO:${JSON.stringify(meta)}]`
  if (!userNotes || !userNotes.trim()) {
    return geoTag
  }
  return `${userNotes.trim()} ${geoTag}`
}

/**
 * Attempts to resolve an address string within Butuan City to geographic coordinates.
 * Matches against verified Butuan landmark presets and barangays first.
 */
export function resolveButuanCoordinates(address?: string | null): { lat: number; lng: number } {
  if (!address || !address.trim()) {
    return {
      lat: ACTIVE_SERVICE_AREA.centerCoordinates.lat,
      lng: ACTIVE_SERVICE_AREA.centerCoordinates.lng,
    }
  }

  const normalized = address.toLowerCase().trim()

  // 1. Direct match with verified landmark presets
  for (const preset of BUTUAN_PRESET_LOCATIONS) {
    const titleMatch = normalized.includes(preset.name.toLowerCase())
    const addrMatch = Boolean(preset.address.title && normalized.includes(preset.address.title.toLowerCase()))
    const streetMatch = preset.address.address.toLowerCase().includes(normalized)

    if (titleMatch || addrMatch || streetMatch) {
      return {
        lat: preset.address.coordinates.lat,
        lng: preset.address.coordinates.lng,
      }
    }

    if (preset.barangay && normalized.includes(preset.barangay.toLowerCase())) {
      return {
        lat: preset.address.coordinates.lat,
        lng: preset.address.coordinates.lng,
      }
    }
  }

  // 2. Specific well-known landmark keyword heuristics
  if (normalized.includes("robinson")) return { lat: 8.9408, lng: 125.5206 }
  if (normalized.includes("sm city") || normalized.includes("sm butuan")) return { lat: 8.9512, lng: 125.5385 }
  if (normalized.includes("gaisano")) return { lat: 8.9492, lng: 125.535 }
  if (normalized.includes("city hall")) return { lat: 8.9535, lng: 125.5264 }
  if (normalized.includes("airport") || normalized.includes("bancasi")) return { lat: 8.9511, lng: 125.4789 }
  if (normalized.includes("terminal") || normalized.includes("langihan")) return { lat: 8.9612, lng: 125.5412 }
  if (normalized.includes("csu") || normalized.includes("caraga state")) return { lat: 8.9575, lng: 125.5976 }
  if (normalized.includes("urios") || normalized.includes("fsuu")) return { lat: 8.9481, lng: 125.5418 }
  if (normalized.includes("santos") || normalized.includes("mj santos")) return { lat: 8.9458, lng: 125.5372 }
  if (normalized.includes("medical center") || normalized.includes("bmc")) return { lat: 8.9712, lng: 125.5615 }
  if (normalized.includes("cathedral") || normalized.includes("guingona")) return { lat: 8.9489, lng: 125.5432 }
  if (normalized.includes("balangay") || normalized.includes("libertad")) return { lat: 8.9515, lng: 125.5098 }
  if (normalized.includes("kananga")) return { lat: 8.9325, lng: 125.529 }
  if (normalized.includes("bridge") || normalized.includes("magsaysay")) return { lat: 8.9482, lng: 125.552 }
  if (normalized.includes("ampayon")) return { lat: 8.9575, lng: 125.5976 }
  if (normalized.includes("doongan")) return { lat: 8.9498, lng: 125.5298 }
  if (normalized.includes("diego silang")) return { lat: 8.9512, lng: 125.5385 }

  // 3. Fallback: Butuan City Center
  return {
    lat: ACTIVE_SERVICE_AREA.centerCoordinates.lat,
    lng: ACTIVE_SERVICE_AREA.centerCoordinates.lng,
  }
}

/**
 * Converts booking records into real interactive map markers using exact stored coordinates.
 */
export function convertBookingToMapMarkers(booking: {
  id: string
  reference: string
  customer_name?: string
  customerName?: string
  pickup: string
  destination?: string | null
  status: string
  service_type?: string
  serviceType?: string
  estimated_fare?: number | string
  estimatedFare?: number
  notes?: string | null
}): MapMarker[] {
  const customerName = booking.customer_name || booking.customerName || "Customer"
  const service = booking.service_type || booking.serviceType || "ride"
  const markers: MapMarker[] = []

  // Extract exact coordinates if available
  const geo = parseBookingGeo(booking)

  // Pickup marker
  markers.push({
    id: `booking-${booking.id}-pickup`,
    title: `Pickup: ${booking.reference}`,
    description: `Customer: ${customerName} • Status: ${booking.status.toUpperCase()} (${service})`,
    address: booking.pickup,
    lat: geo.pickupCoords.lat,
    lng: geo.pickupCoords.lng,
    category: "pickup",
    badgeText: geo.isExact ? "Verified Exact Pickup" : "Pickup Location",
    actionLabel: "View Booking Details",
    actionUrl: `/dashboard/admin/bookings`,
  })

  // Destination marker if exists
  if (booking.destination && geo.destCoords) {
    markers.push({
      id: `booking-${booking.id}-dest`,
      title: `Dropoff: ${booking.reference}`,
      description: `Destination for ${customerName}`,
      address: booking.destination,
      lat: geo.destCoords.lat,
      lng: geo.destCoords.lng,
      category: "destination",
      badgeText: geo.isExact ? "Verified Exact Dropoff" : "Dropoff Destination",
      actionLabel: "View Booking Details",
      actionUrl: `/dashboard/admin/bookings`,
    })
  }

  return markers
}
