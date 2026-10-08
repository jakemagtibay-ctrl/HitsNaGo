/**
 * Service Area Configuration for HitsNaGo
 *
 * CRITICAL BUSINESS RULE:
 * HitsNaGo is currently operating EXCLUSIVELY in Butuan City, Agusan del Norte, Caraga Region, Philippines.
 *
 * This configuration centralizes the service area definition to prevent hardcoding across components
 * and to allow future multi-city expansion when the platform scales.
 */

export interface ServiceArea {
  id: string
  city: string
  province: string
  region: string
  country: string
  postalCode: string
  label: string
  shortLabel: string
  centerCoordinates: {
    lat: number
    lng: number
  }
  isActive: boolean
  tagline: string
}

/**
 * Primary Active Service Area for this phase
 */
export const ACTIVE_SERVICE_AREA: ServiceArea = {
  id: "area_butuan_city",
  city: "Butuan City",
  province: "Agusan del Norte",
  region: "Caraga Region (Region XIII)",
  country: "Philippines",
  postalCode: "8600",
  label: "Butuan City, Agusan del Norte",
  shortLabel: "Butuan City",
  centerCoordinates: {
    lat: 8.9475,
    lng: 125.5406,
  },
  isActive: true,
  tagline: "Serving Butuan City, Agusan del Norte",
}

/**
 * Non-supported cities list used for client-side geofencing feedback.
 * If a customer enters a common outside city name, we explicitly clarify our current Butuan City coverage.
 */
export const OUTSIDE_CITIES_RESTRICTION_LIST = [
  "manila",
  "quezon city",
  "cebu",
  "cebu city",
  "davao",
  "davao city",
  "cagayan de oro",
  "cdo",
  "tacloban",
  "iloilo",
  "zamboanga",
  "bacolod",
  "general santos",
  "gensan",
  "tagum",
  "surigao",
  "surigao city",
  "tandag",
  "bislig",
  "bayugan",
  "cabadbaran",
  "makati",
  "pasig",
  "taguig",
  "angeles",
  "baguio",
]

/**
 * Validates if a user-entered location string falls within the active Butuan City service area.
 * Returns validation outcome and an informative message.
 */
export function validateServiceAreaLocation(locationText: string): {
  isValid: boolean
  isOutsideServiceArea: boolean
  message?: string
} {
  if (!locationText || !locationText.trim()) {
    return {
      isValid: false,
      isOutsideServiceArea: false,
      message: "Please enter a location within Butuan City.",
    }
  }

  const normalized = locationText.toLowerCase().trim()

  // Check if an outside city was explicitly provided
  const detectedOutsideCity = OUTSIDE_CITIES_RESTRICTION_LIST.find((city) => {
    const regex = new RegExp(`\\b${city}\\b`, "i")
    return regex.test(normalized)
  })

  if (detectedOutsideCity) {
    const formattedCity = detectedOutsideCity.charAt(0).toUpperCase() + detectedOutsideCity.slice(1)
    return {
      isValid: false,
      isOutsideServiceArea: true,
      message: `HitsNaGo is currently available within Butuan City only. Trips and deliveries in ${formattedCity} are not yet supported.`,
    }
  }

  return {
    isValid: true,
    isOutsideServiceArea: false,
  }
}

/**
 * Check if coordinates are within the approximate Butuan City bounding box
 * Bounding box: Lat 8.80 to 9.10, Lng 125.40 to 125.70
 */
export function isCoordinatesWithinButuan(lat: number, lng: number): boolean {
  return lat >= 8.80 && lat <= 9.10 && lng >= 125.40 && lng <= 125.70
}
