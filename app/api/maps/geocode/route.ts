import { NextRequest, NextResponse } from "next/server"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"

export interface GeocodeResult {
  id: string
  displayName: string
  title: string
  lat: number
  lng: number
  address: string
  barangay?: string
  city?: string
  province?: string
  isPreset?: boolean
}

// In-memory cache with 10-minute TTL to respect Nominatim usage policy
interface CacheEntry {
  data: GeocodeResult[]
  expiresAt: number
}
const geocodeCache = new Map<string, CacheEntry>()

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

  // 1. High-priority local match from Butuan presets & gazetteer
  const lowerQuery = query.toLowerCase()
  for (const preset of BUTUAN_PRESET_LOCATIONS) {
    const nameMatch = preset.name.toLowerCase().includes(lowerQuery)
    const brgyMatch = preset.barangay.toLowerCase().includes(lowerQuery)
    const addrMatch = preset.address.address.toLowerCase().includes(lowerQuery)

    if (nameMatch || brgyMatch || addrMatch) {
      results.push({
        id: `preset-${preset.id}`,
        displayName: `${preset.name}, Brgy. ${preset.barangay}, Butuan City`,
        title: preset.name,
        lat: preset.address.coordinates.lat,
        lng: preset.address.coordinates.lng,
        address: preset.address.address,
        barangay: preset.barangay,
        city: "Butuan City",
        province: "Agusan del Norte",
        isPreset: true,
      })
    }
  }

  // 2. Fetch live street-level and establishment results from OpenStreetMap Nominatim
  try {
    // We bias towards Butuan City bounding box (viewbox=125.40,8.85,125.68,9.05 with bounded=0)
    // so Butuan / Agusan del Norte places rank first, while still allowing neighboring or nationwide addresses
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search")
    nominatimUrl.searchParams.set("format", "jsonv2")
    nominatimUrl.searchParams.set("q", query)
    nominatimUrl.searchParams.set("countrycodes", "ph")
    nominatimUrl.searchParams.set("addressdetails", "1")
    nominatimUrl.searchParams.set("viewbox", "125.40,8.85,125.68,9.05")
    nominatimUrl.searchParams.set("bounded", "0")
    nominatimUrl.searchParams.set("limit", "8")

    const res = await fetch(nominatimUrl.toString(), {
      headers: {
        "User-Agent": "HitsNaGo-Butuan/1.0 (booking-platform@hitsnago.ph)",
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
          const road = addr.road || addr.pedestrian || addr.suburb || ""
          const barangay = addr.quarter || addr.suburb || addr.neighbourhood || addr.village || ""
          const city = addr.city || addr.town || addr.municipality || "Butuan City"
          const province = addr.province || addr.state || "Agusan del Norte"

          const title = item.name || road || item.display_name.split(",")[0].trim()

          // Avoid duplicating preset that has the exact same coordinate
          const isDuplicate = results.some(
            (r) => Math.abs(r.lat - lat) < 0.0003 && Math.abs(r.lng - lng) < 0.0003
          )

          if (!isDuplicate) {
            results.push({
              id: `osm-${item.place_id || item.osm_id || Math.random()}`,
              displayName: item.display_name,
              title,
              lat,
              lng,
              address: item.display_name,
              barangay: barangay || undefined,
              city,
              province,
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
