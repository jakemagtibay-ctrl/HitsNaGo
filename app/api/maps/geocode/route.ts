import { NextRequest, NextResponse } from "next/server"
import { BUTUAN_PRESET_LOCATIONS, BUTUAN_BARANGAYS } from "@/lib/mock-data/butuan-locations"

export interface GeocodeResult {
  id: string
  placeName: string
  formattedAddress: string
  displayName: string
  title: string
  address: string
  lat: number
  lng: number
  category?: string
  barangay?: string
  city?: string
  province?: string
  country?: string
  postalCode?: string
  providerPlaceId?: string
  isPreset?: boolean
}

// In-memory cache with 10-minute TTL to respect Nominatim usage policy
interface CacheEntry {
  data: GeocodeResult[]
  expiresAt: number
}
const geocodeCache = new Map<string, CacheEntry>()

function cleanPlaceTitle(raw: string): string {
  if (!raw) return ""
  // If raw contains comma, take the prominent first segment
  const first = raw.split(",")[0].trim()
  return first
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const cacheKey = query.toLowerCase()
  const cached = geocodeCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ results: cached.data })
  }

  const results: GeocodeResult[] = []
  const lowerQuery = query.toLowerCase()

  // 1. High-priority local match from Butuan verified landmarks and establishments
  for (const preset of BUTUAN_PRESET_LOCATIONS) {
    const nameMatch = preset.name.toLowerCase().includes(lowerQuery)
    const brgyMatch = preset.barangay.toLowerCase().includes(lowerQuery)
    const addrMatch = preset.address.address.toLowerCase().includes(lowerQuery)
    const landmarkMatch = Boolean(preset.address.landmark?.toLowerCase().includes(lowerQuery))

    if (nameMatch || brgyMatch || addrMatch || landmarkMatch) {
      results.push({
        id: `preset-${preset.id}`,
        placeName: preset.name,
        formattedAddress: preset.address.formattedAddress || preset.address.address,
        displayName: `${preset.name}, Brgy. ${preset.barangay}, Butuan City`,
        title: preset.name,
        address: preset.address.address,
        lat: preset.address.coordinates.lat,
        lng: preset.address.coordinates.lng,
        category: preset.type,
        barangay: preset.barangay,
        city: "Butuan City",
        province: "Agusan del Norte",
        country: "Philippines",
        postalCode: preset.address.postalCode || "8600",
        providerPlaceId: preset.id,
        isPreset: true,
      })
    }
  }

  // 2. High-priority match for Butuan City Barangays if user searches for a barangay
  for (const brgy of BUTUAN_BARANGAYS) {
    if (brgy.toLowerCase().includes(lowerQuery) && !results.some((r) => r.barangay?.toLowerCase() === brgy.toLowerCase())) {
      results.push({
        id: `brgy-${brgy.toLowerCase().replace(/\s+/g, "-")}`,
        placeName: `Barangay ${brgy}`,
        formattedAddress: `Brgy. ${brgy}, Butuan City, Agusan del Norte, 8600, Philippines`,
        displayName: `Brgy. ${brgy}, Butuan City, Agusan del Norte`,
        title: `Barangay ${brgy}`,
        address: `Brgy. ${brgy}, Butuan City`,
        lat: 8.9475,
        lng: 125.5406,
        category: "landmark",
        barangay: brgy,
        city: "Butuan City",
        province: "Agusan del Norte",
        country: "Philippines",
        postalCode: "8600",
        isPreset: true,
      })
    }
  }

  // 3. Live street-level, building, establishment, and POI geocoding from OpenStreetMap Nominatim
  try {
    // Biased to Butuan City / Caraga bounding box (viewbox=125.40,8.80,125.75,9.10 with bounded=0)
    // Results in Butuan City & Caraga rank first, without strictly blocking neighboring or nationwide queries
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search")
    nominatimUrl.searchParams.set("format", "jsonv2")
    nominatimUrl.searchParams.set("q", query)
    nominatimUrl.searchParams.set("countrycodes", "ph")
    nominatimUrl.searchParams.set("addressdetails", "1")
    nominatimUrl.searchParams.set("extratags", "1")
    nominatimUrl.searchParams.set("viewbox", "125.40,8.80,125.75,9.10")
    nominatimUrl.searchParams.set("bounded", "0")
    nominatimUrl.searchParams.set("limit", "10")

    const res = await fetch(nominatimUrl.toString(), {
      headers: {
        "User-Agent": "HitsNaGo-Geospatial/2.0 (butuan-booking@hitsnago.ph)",
        Accept: "application/json",
      },
      next: { revalidate: 600 },
    })

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        for (const item of data) {
          const lat = parseFloat(item.lat)
          const lng = parseFloat(item.lon)

          if (isNaN(lat) || isNaN(lng)) continue

          const addr = item.address || {}
          const road = addr.road || addr.pedestrian || addr.footway || addr.street || ""
          const barangay = addr.quarter || addr.suburb || addr.neighbourhood || addr.village || addr.city_district || ""
          const city = addr.city || addr.town || addr.municipality || "Butuan City"
          const province = addr.province || addr.state || "Agusan del Norte"
          const country = addr.country || "Philippines"
          const postalCode = addr.postcode || "8600"

          // Determine the most accurate placeName
          // Order of preference: POI/establishment name -> specific road -> barangay
          const poiName = item.name || addr.amenity || addr.shop || addr.building || addr.tourism || addr.office || ""
          let placeName = poiName.trim()

          if (!placeName || placeName.toLowerCase() === city.toLowerCase() || placeName.toLowerCase() === province.toLowerCase()) {
            if (road) {
              placeName = road
            } else if (barangay) {
              placeName = `Barangay ${barangay}`
            } else {
              placeName = cleanPlaceTitle(item.display_name)
            }
          }

          // Build complete formatted address without redundant repetitions
          const addressTokens = [
            placeName && placeName !== road ? placeName : null,
            road,
            barangay ? `Brgy. ${barangay}` : null,
            city,
            province,
            postalCode,
            country,
          ].filter(Boolean)

          const formattedAddress = addressTokens.length > 0
            ? addressTokens.join(", ")
            : item.display_name

          // Avoid duplicating preset that has virtually the same coordinate
          const isDuplicate = results.some(
            (r) => Math.abs(r.lat - lat) < 0.0003 && Math.abs(r.lng - lng) < 0.0003
          )

          if (!isDuplicate) {
            results.push({
              id: `osm-${item.place_id || item.osm_id || Math.random()}`,
              placeName,
              formattedAddress,
              displayName: item.display_name,
              title: placeName,
              address: formattedAddress,
              lat,
              lng,
              category: item.type || item.category || "place",
              barangay: barangay || undefined,
              city,
              province,
              country,
              postalCode,
              providerPlaceId: String(item.place_id || item.osm_id || ""),
              isPreset: false,
            })
          }
        }
      }
    }
  } catch (err) {
    console.warn("[/api/maps/geocode] Nominatim query error:", err)
  }

  // Cache up to 10 minutes
  geocodeCache.set(cacheKey, {
    data: results,
    expiresAt: Date.now() + 10 * 60 * 1000,
  })

  // Prevent memory leaks: prune cache if exceeding 300 entries
  if (geocodeCache.size > 300) {
    const firstKey = geocodeCache.keys().next().value
    if (firstKey) geocodeCache.delete(firstKey)
  }

  return NextResponse.json({ results })
}
