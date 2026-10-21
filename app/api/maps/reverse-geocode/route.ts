// API route for reverse geocoding: converts GPS latitude/longitude into human-readable street addresses
import { NextRequest, NextResponse } from "next/server"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import type { LocationData } from "@/types/location"

export interface ReverseGeocodeResponse extends LocationData {

  title: string
  address: string
  isApproximate?: boolean
}

// In-memory cache for reverse geocode queries (~11m resolution)
const reverseCache = new Map<string, { data: ReverseGeocodeResponse; expiresAt: number }>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const latStr = searchParams.get("lat")
  const lngStr = searchParams.get("lng")

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: "Missing lat/lng query parameters" }, { status: 400 })
  }

  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Invalid coordinate values" }, { status: 400 })
  }

  // Validate latitude and longitude range (-90..90, -180..180)
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Coordinates out of bounds" }, { status: 400 })
  }

  // Cache key rounded to ~11 meters (4 decimal places)
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
  const cached = reverseCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data)
  }

  // 1. Proximity check against verified Butuan presets (~40 meters)
  for (const preset of BUTUAN_PRESET_LOCATIONS) {
    const dLat = Math.abs(preset.address.coordinates.lat - lat)
    const dLng = Math.abs(preset.address.coordinates.lng - lng)
    if (dLat < 0.0004 && dLng < 0.0004) {
      const result: ReverseGeocodeResponse = {
        placeName: preset.name,
        formattedAddress: preset.address.formattedAddress || preset.address.address,
        title: preset.name,
        address: preset.address.address,
        latitude: lat,
        longitude: lng,
        barangay: preset.barangay,
        city: preset.address.city || "Butuan City",
        province: preset.address.province || "Agusan del Norte",
        country: preset.address.country || "Philippines",
        postalCode: preset.address.postalCode || "8600",
        providerPlaceId: preset.id,
        isApproximate: false,
        isVerifiedPreset: true,
      }
      reverseCache.set(cacheKey, { data: result, expiresAt: Date.now() + 10 * 60 * 1000 })
      return NextResponse.json(result)
    }
  }

  // 2. Query OpenStreetMap Nominatim Reverse Geocoding API
  try {
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse")
    nominatimUrl.searchParams.set("format", "jsonv2")
    nominatimUrl.searchParams.set("lat", lat.toString())
    nominatimUrl.searchParams.set("lon", lng.toString())
    nominatimUrl.searchParams.set("addressdetails", "1")
    nominatimUrl.searchParams.set("zoom", "18")

    const res = await fetch(nominatimUrl.toString(), {
      headers: {
        "User-Agent": "HitsNaGo-Geospatial/2.0 (butuan-booking@hitsnago.ph)",
        Accept: "application/json",
      },
      next: { revalidate: 600 },
    })

    if (res.ok) {
      const data = await res.json()
      if (data && !data.error) {
        const addr = data.address || {}
        const road = addr.road || addr.pedestrian || addr.footway || addr.path || addr.street || ""
        const poi = data.name || addr.amenity || addr.shop || addr.building || addr.tourism || addr.office || ""
        const barangay = addr.quarter || addr.suburb || addr.neighbourhood || addr.village || addr.city_district || ""
        const city = addr.city || addr.town || addr.municipality || "Butuan City"
        const province = addr.province || addr.state || "Agusan del Norte"
        const country = addr.country || "Philippines"
        const postalCode = addr.postcode || "8600"

        // Meaningful placeName selection:
        // If POI exists, use it.
        // If road exists, use the road name.
        // If only barangay exists, designate "Near Brgy. [Name]".
        // Never output just "Butuan City" as placeName!
        let placeName = poi.trim()
        if (!placeName || placeName.toLowerCase() === city.toLowerCase()) {
          if (road) {
            placeName = road
          } else if (barangay) {
            placeName = `Near Brgy. ${barangay}`
          } else {
            placeName = `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`
          }
        }

        const addressParts = [
          placeName && placeName !== road ? placeName : null,
          road,
          barangay ? `Brgy. ${barangay}` : null,
          city,
          province,
          country,
        ].filter(Boolean)

        const formattedAddress = addressParts.length > 0 ? addressParts.join(", ") : data.display_name

        const result: ReverseGeocodeResponse = {
          placeName,
          formattedAddress,
          title: placeName,
          address: formattedAddress,
          latitude: lat,
          longitude: lng,
          barangay: barangay || undefined,
          city,
          province,
          country,
          postalCode,
          providerPlaceId: String(data.place_id || data.osm_id || ""),
          isApproximate: false,
          isVerifiedPreset: false,
        }

        reverseCache.set(cacheKey, { data: result, expiresAt: Date.now() + 10 * 60 * 1000 })
        return NextResponse.json(result)
      }
    }
  } catch (err) {
    console.warn("[/api/maps/reverse-geocode] Nominatim reverse error:", err)
  }

  // 3. Fallback: Exact coordinates with clear placeholder for manual directions
  const fallbackPlaceName = `Pinned Point (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`
  const fallbackAddress = `Pinned Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}, Butuan City, Agusan del Norte, Philippines`

  const fallbackResult: ReverseGeocodeResponse = {
    placeName: fallbackPlaceName,
    formattedAddress: fallbackAddress,
    title: fallbackPlaceName,
    address: fallbackAddress,
    latitude: lat,
    longitude: lng,
    city: "Butuan City",
    province: "Agusan del Norte",
    country: "Philippines",
    postalCode: "8600",
    isApproximate: true,
    isVerifiedPreset: false,
  }

  return NextResponse.json(fallbackResult)
}
