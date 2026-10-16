import { NextRequest, NextResponse } from "next/server"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"

export interface ReverseGeocodeResponse {
  title: string
  address: string
  barangay?: string
  city: string
  province: string
  postalCode?: string
  lat: number
  lng: number
  isApproximate?: boolean
}

// In-memory cache
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

  // Cache key rounded to ~11 meters (4 decimal places)
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
  const cached = reverseCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data)
  }

  // 1. Check if point is right next to a preset landmark (within ~30m)
  for (const preset of BUTUAN_PRESET_LOCATIONS) {
    const dLat = Math.abs(preset.address.coordinates.lat - lat)
    const dLng = Math.abs(preset.address.coordinates.lng - lng)
    if (dLat < 0.0003 && dLng < 0.0003) {
      const result: ReverseGeocodeResponse = {
        title: preset.name,
        address: preset.address.address,
        barangay: preset.barangay,
        city: "Butuan City",
        province: "Agusan del Norte",
        postalCode: "8600",
        lat,
        lng,
        isApproximate: false,
      }
      reverseCache.set(cacheKey, { data: result, expiresAt: Date.now() + 10 * 60 * 1000 })
      return NextResponse.json(result)
    }
  }

  // 2. Query Nominatim Reverse Geocoding API
  try {
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse")
    nominatimUrl.searchParams.set("format", "jsonv2")
    nominatimUrl.searchParams.set("lat", lat.toString())
    nominatimUrl.searchParams.set("lon", lng.toString())
    nominatimUrl.searchParams.set("addressdetails", "1")

    const res = await fetch(nominatimUrl.toString(), {
      headers: {
        "User-Agent": "HitsNaGo-Butuan/1.0 (booking-platform@hitsnago.ph)",
        Accept: "application/json",
      },
      next: { revalidate: 600 },
    })

    if (res.ok) {
      const data = await res.json()
      if (data && !data.error) {
        const addr = data.address || {}
        const road = addr.road || addr.pedestrian || addr.footway || addr.path || ""
        const poi = data.name || addr.amenity || addr.shop || addr.building || ""
        const barangay = addr.quarter || addr.suburb || addr.neighbourhood || addr.village || addr.city_district || ""
        const city = addr.city || addr.town || addr.municipality || "Butuan City"
        const province = addr.province || addr.state || "Agusan del Norte"
        const postalCode = addr.postcode || "8600"

        let title = poi || road || (barangay ? `Brgy. ${barangay}` : "Pinned Location")
        if (title.length > 50) title = title.slice(0, 47) + "..."

        const addressParts = [
          poi && poi !== road ? poi : null,
          road,
          barangay ? `Brgy. ${barangay}` : null,
          city,
          province,
        ].filter(Boolean)

        const address = addressParts.length > 0 ? addressParts.join(", ") : data.display_name

        const result: ReverseGeocodeResponse = {
          title,
          address,
          barangay: barangay || undefined,
          city,
          province,
          postalCode,
          lat,
          lng,
          isApproximate: false,
        }

        reverseCache.set(cacheKey, { data: result, expiresAt: Date.now() + 10 * 60 * 1000 })
        return NextResponse.json(result)
      }
    }
  } catch (err) {
    console.warn("[/api/maps/reverse-geocode] Nominatim reverse error:", err)
  }

  // 3. Fallback: Exact coordinates with standard Butuan City notation
  const fallbackResult: ReverseGeocodeResponse = {
    title: `Pinned Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
    address: `Pinned Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}, Butuan City, Agusan del Norte`,
    city: "Butuan City",
    province: "Agusan del Norte",
    postalCode: "8600",
    lat,
    lng,
    isApproximate: true,
  }

  return NextResponse.json(fallbackResult)
}
