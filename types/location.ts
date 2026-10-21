export interface LocationData {
  /**
   * Actual business, landmark, building, establishment, or recognizable place name.
   * e.g. "SM City Butuan", "Robinsons Place Butuan", "Father Saturnino Urios University"
   */
  placeName: string

  /**
   * Complete, formatted human-readable address.
   * e.g. "J.C. Aquino Avenue, Brgy. Diego Silang, Butuan City, Agusan del Norte, 8600, Philippines"
   */
  formattedAddress: string

  /**
   * Geographic latitude in decimal degrees.
   */
  latitude: number

  /**
   * Geographic longitude in decimal degrees.
   */
  longitude: number

  /**
   * Barangay / neighborhood name if available.
   * e.g. "Diego Silang", "Doongan", "Holy Redeemer"
   */
  barangay?: string

  /**
   * City or municipality name.
   * Defaults to "Butuan City"
   */
  city?: string

  /**
   * Province / State name.
   * Defaults to "Agusan del Norte"
   */
  province?: string

  /**
   * Country name.
   * Defaults to "Philippines"
   */
  country?: string

  /**
   * Postal ZIP code.
   * e.g. "8600"
   */
  postalCode?: string

  /**
   * Optional provider-specific identifier (e.g. OSM place_id or internal preset id)
   */
  providerPlaceId?: string

  /**
   * Optional specific directions, gate number, building floor, or landmark instruction from user.
   * e.g. "Gate 2 beside the security guard", "Near the blue pharmacy"
   */
  addressDetails?: string

  /**
   * Whether this was selected from a verified local landmark preset
   */
  isVerifiedPreset?: boolean
}

/**
 * Validates whether latitude and longitude are valid numbers within valid Earth geographic bounds.
 */
export function isValidCoordinateBounds(lat: number, lng: number): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false
  if (isNaN(lat) || isNaN(lng)) return false
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Normalizes a LocationData object or string into a standard LocationData structure.
 */
export function normalizeLocationData(
  input: string | Partial<LocationData> | null | undefined,
  fallbackCoords?: { lat: number; lng: number }
): LocationData {
  if (!input) {
    return {
      placeName: "Butuan City",
      formattedAddress: "Butuan City, Agusan del Norte, Philippines",
      latitude: fallbackCoords?.lat ?? 8.9475,
      longitude: fallbackCoords?.lng ?? 125.5406,
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
    }
  }

  if (typeof input === "string") {
    return {
      placeName: input.split(",")[0].trim() || "Butuan City",
      formattedAddress: input.trim(),
      latitude: fallbackCoords?.lat ?? 8.9475,
      longitude: fallbackCoords?.lng ?? 125.5406,
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
    }
  }

  const rawLat = typeof input.latitude === "number" && !isNaN(input.latitude)
    ? input.latitude
    : (fallbackCoords?.lat ?? 8.9475)
  const rawLng = typeof input.longitude === "number" && !isNaN(input.longitude)
    ? input.longitude
    : (fallbackCoords?.lng ?? 125.5406)

  const lat = Number(rawLat.toFixed(6))
  const lng = Number(rawLng.toFixed(6))

  const placeName = input.placeName?.trim() ||
    input.formattedAddress?.split(",")[0].trim() ||
    (input.barangay ? `Brgy. ${input.barangay}` : "Selected Location")

  const formattedAddress = input.formattedAddress?.trim() ||
    [placeName, input.barangay ? `Brgy. ${input.barangay}` : null, input.city || "Butuan City", input.province || "Agusan del Norte"]
      .filter(Boolean)
      .join(", ")

  return {
    placeName,
    formattedAddress,
    latitude: lat,
    longitude: lng,
    barangay: input.barangay?.trim() || undefined,
    city: input.city?.trim() || "Butuan City",
    province: input.province?.trim() || "Agusan del Norte",
    country: input.country?.trim() || "Philippines",
    postalCode: input.postalCode?.trim() || "8600",
    providerPlaceId: input.providerPlaceId || undefined,
    addressDetails: input.addressDetails?.trim() || undefined,
    isVerifiedPreset: Boolean(input.isVerifiedPreset),
  }
}
