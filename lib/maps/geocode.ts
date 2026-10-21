import { BUTUAN_PRESET_LOCATIONS, searchButuanLocations } from "@/lib/mock-data/butuan-locations"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import type { MapMarker } from "@/components/maps/types"
import type { GeocodeResult } from "@/app/api/maps/geocode/route"
import type { ReverseGeocodeResponse } from "@/app/api/maps/reverse-geocode/route"
import type { LocationData } from "@/types/location"
import { normalizeLocationData } from "@/types/location"

export { searchButuanLocations }
export type { GeocodeResult, ReverseGeocodeResponse, LocationData }

export interface BookingGeoMeta {
  pickupCoords?: { lat: number; lng: number }
  destinationCoords?: { lat: number; lng: number }
  pickupPlaceName?: string
  pickupFormattedAddress?: string
  pickupDetails?: string
  destinationPlaceName?: string
  destPlaceName?: string
  destinationFormattedAddress?: string
  destinationDetails?: string
  destDetails?: string
  distanceKm?: number
  durationMin?: number
  clientNotes?: string
}

/**
 * Searches real addresses, establishments, schools, hospitals, and landmarks
 * using the server-side Nominatim proxy and verified Butuan gazetteer.
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
 * Reverse-geocodes exact latitude & longitude coordinates into a human-readable street address
 * and meaningful place name.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResponse> {
  // Validate coordinates range
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      placeName: "Invalid Coordinates",
      formattedAddress: "Coordinates out of bounds",
      title: "Invalid Coordinates",
      address: "Coordinates out of bounds",
      latitude: lat,
      longitude: lng,
      isApproximate: true,
    }
  }

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

  // Graceful fallback without invented place names
  const placeName = `Pinned Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`
  const formattedAddress = `Pinned Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}, Butuan City, Agusan del Norte, Philippines`

  return {
    placeName,
    formattedAddress,
    title: placeName,
    address: formattedAddress,
    city: "Butuan City",
    province: "Agusan del Norte",
    country: "Philippines",
    postalCode: "8600",
    latitude: lat,
    longitude: lng,
    isApproximate: true,
  }
}

/**
 * Extracts exact coordinates, verified place names, and addresses from a booking.
 * Supports both dedicated table columns and backwards-compatible [GEO:...] notes tag.
 */
export function parseBookingGeo(booking: {
  notes?: string | null
  pickup?: string
  destination?: string | null
  pickup_place_name?: string | null
  pickup_latitude?: number | string | null
  pickup_longitude?: number | string | null
  pickup_details?: string | null
  destination_place_name?: string | null
  destination_latitude?: number | string | null
  destination_longitude?: number | string | null
  destination_details?: string | null
}): {
  pickupCoords: { lat: number; lng: number }
  destCoords?: { lat: number; lng: number }
  pickupPlaceName: string
  pickupAddress: string
  destPlaceName?: string
  destAddress?: string
  pickupDetails?: string
  destDetails?: string
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
  let pickupPlaceName = booking.pickup_place_name?.trim() || ""
  let destPlaceName = booking.destination_place_name?.trim() || ""
  let pickupDetails = booking.pickup_details?.trim() || ""
  let destDetails = booking.destination_details?.trim() || ""
  let distanceKm: number | undefined
  let durationMin: number | undefined

  // 1. Check dedicated columns if present
  if (booking.pickup_latitude && booking.pickup_longitude) {
    const lat = Number(booking.pickup_latitude)
    const lng = Number(booking.pickup_longitude)
    if (!isNaN(lat) && !isNaN(lng)) {
      pickupCoords = { lat, lng }
      isExact = true
    }
  }

  if (booking.destination_latitude && booking.destination_longitude) {
    const lat = Number(booking.destination_latitude)
    const lng = Number(booking.destination_longitude)
    if (!isNaN(lat) && !isNaN(lng)) {
      destCoords = { lat, lng }
    }
  }

  // 2. Parse [GEO:{"pickupCoords":...}] from notes tag
  const geoMatch = rawNotes.match(/\[GEO:(.*?)\]/)
  if (geoMatch) {
    try {
      const parsed = JSON.parse(geoMatch[1]) as BookingGeoMeta
      if (!pickupCoords && parsed.pickupCoords && typeof parsed.pickupCoords.lat === "number") {
        pickupCoords = parsed.pickupCoords
        isExact = true
      }
      if (!destCoords && parsed.destinationCoords && typeof parsed.destinationCoords.lat === "number") {
        destCoords = parsed.destinationCoords
      }
      if (!pickupPlaceName && parsed.pickupPlaceName) {
        pickupPlaceName = parsed.pickupPlaceName
      }
      const resolvedDestPlace = parsed.destinationPlaceName || parsed.destPlaceName
      if (!destPlaceName && resolvedDestPlace) {
        destPlaceName = resolvedDestPlace
      }
      if (!pickupDetails && parsed.pickupDetails) {
        pickupDetails = parsed.pickupDetails
      }
      const resolvedDestDet = parsed.destinationDetails || parsed.destDetails
      if (!destDetails && resolvedDestDet) {
        destDetails = resolvedDestDet
      }
      if (typeof parsed.distanceKm === "number") distanceKm = parsed.distanceKm
      if (typeof parsed.durationMin === "number") durationMin = parsed.durationMin
      cleanNotes = rawNotes.replace(/\[GEO:.*?\]/, "").trim()
    } catch {
      // Ignore JSON parse error and fallback
    }
  }

  // 3. Fallback to address resolution if no exact coordinates exist
  if (!pickupCoords) {
    pickupCoords = resolveButuanCoordinates(booking.pickup)
  }
  if (!destCoords && booking.destination) {
    destCoords = resolveButuanCoordinates(booking.destination)
  }

  // If place names are still empty, derive a clean label from the address
  if (!pickupPlaceName) {
    pickupPlaceName = booking.pickup?.split(",")[0].trim() || "Pickup Point"
  }
  if (!destPlaceName && booking.destination) {
    destPlaceName = booking.destination?.split(",")[0].trim() || "Destination Point"
  }

  return {
    pickupCoords,
    destCoords,
    pickupPlaceName,
    pickupAddress: booking.pickup || "Butuan City",
    destPlaceName: destPlaceName || undefined,
    destAddress: booking.destination || undefined,
    pickupDetails: pickupDetails || undefined,
    destDetails: destDetails || undefined,
    distanceKm,
    durationMin,
    cleanNotes,
    isExact,
  }
}

/**
 * Serializes exact coordinates and location metadata into a machine-parseable tag embedded in booking notes.
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
  if (normalized.includes("robinson")) return { lat: 8.9498, lng: 125.5298 }
  if (normalized.includes("sm city") || normalized.includes("sm butuan")) return { lat: 8.9512, lng: 125.5385 }
  if (normalized.includes("gaisano")) return { lat: 8.9492, lng: 125.535 }
  if (normalized.includes("city hall")) return { lat: 8.9535, lng: 125.5264 }
  if (normalized.includes("airport") || normalized.includes("bancasi")) return { lat: 8.9511, lng: 125.4789 }
  if (normalized.includes("terminal") || normalized.includes("langihan")) return { lat: 8.9612, lng: 125.5412 }
  if (normalized.includes("csu") || normalized.includes("caraga state")) return { lat: 8.9575, lng: 125.5976 }
  if (normalized.includes("urios") || normalized.includes("fsuu")) return { lat: 8.9481, lng: 125.5418 }
  if (normalized.includes("sjit") || normalized.includes("saint joseph institute")) return { lat: 8.9465, lng: 125.5395 }
  if (normalized.includes("santos") || normalized.includes("mj santos")) return { lat: 8.9458, lng: 125.5372 }
  if (normalized.includes("doctors") || normalized.includes("butuan doc")) return { lat: 8.9485, lng: 125.528 }
  if (normalized.includes("medical center") || normalized.includes("bmc")) return { lat: 8.9712, lng: 125.5615 }
  if (normalized.includes("cathedral") || normalized.includes("guingona")) return { lat: 8.9489, lng: 125.5432 }
  if (normalized.includes("balangay") || normalized.includes("libertad")) return { lat: 8.9515, lng: 125.5098 }
  if (normalized.includes("inland") || normalized.includes("almont inland")) return { lat: 8.9505, lng: 125.5255 }
  if (normalized.includes("almont city")) return { lat: 8.9472, lng: 125.544 }
  if (normalized.includes("puregold")) return { lat: 8.9595, lng: 125.5398 }
  if (normalized.includes("camella")) return { lat: 8.9275, lng: 125.531 }
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
  pickup_place_name?: string | null
  destination_place_name?: string | null
}): MapMarker[] {
  const customerName = booking.customer_name || booking.customerName || "Customer"
  const service = booking.service_type || booking.serviceType || "ride"
  const markers: MapMarker[] = []

  // Extract exact coordinates and place names
  const geo = parseBookingGeo(booking)

  // Pickup marker
  markers.push({
    id: `booking-${booking.id}-pickup`,
    title: `Pickup: ${geo.pickupPlaceName}`,
    description: `Customer: ${customerName} • Status: ${booking.status.toUpperCase()} (${service})`,
    address: geo.pickupAddress,
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
      title: `Dropoff: ${geo.destPlaceName || "Destination"}`,
      description: `Destination for ${customerName}`,
      address: geo.destAddress || booking.destination,
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

/**
 * Finds the nearest verified landmark preset to given coordinates if within threshold distance (default 50 meters).
 */
export function findNearestButuanLandmark(
  lat: number,
  lng: number,
  thresholdKm = 0.05
): LocationData | null {
  for (const preset of BUTUAN_PRESET_LOCATIONS) {
    const dLat = Math.abs(preset.address.coordinates.lat - lat)
    const dLng = Math.abs(preset.address.coordinates.lng - lng)
    const approxDistKm = Math.sqrt((dLat * 111) ** 2 + (dLng * 109) ** 2)
    if (approxDistKm <= thresholdKm) {
      return {
        placeName: preset.name,
        formattedAddress: preset.address.formattedAddress || preset.address.address,
        latitude: lat,
        longitude: lng,
        barangay: preset.barangay,
        city: preset.address.city || "Butuan City",
        province: preset.address.province || "Agusan del Norte",
        country: preset.address.country || "Philippines",
        postalCode: preset.address.postalCode || "8600",
        providerPlaceId: preset.id,
      }
    }
  }
  return null
}
