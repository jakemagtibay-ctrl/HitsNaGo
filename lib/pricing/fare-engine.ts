/**
 * HitsNaGo Centralized Authoritative Pricing and Fare Engine
 *
 * All rates are strictly for Butuan City, Agusan del Norte, Caraga Region.
 * Pricing is computed server-side from actual road distance.
 */

export interface RideFareConfig {
  baseFare: number
  perKmRate: number
  minimumFare: number
  capacity: number
  description: string
}

export const RIDE_PRICING_CONFIG: Record<string, RideFareConfig> = {
  motorcycle: {
    baseFare: 40,
    perKmRate: 15,
    minimumFare: 50,
    capacity: 1,
    description: "Fast single-passenger motorbike commute",
  },
  tricycle: {
    baseFare: 30,
    perKmRate: 12,
    minimumFare: 40,
    capacity: 3,
    description: "Neighborhood tricycle transport",
  },
  car_sedan: {
    baseFare: 80,
    perKmRate: 25,
    minimumFare: 120,
    capacity: 4,
    description: "Air-conditioned 4-passenger private sedan",
  },
  van: {
    baseFare: 150,
    perKmRate: 35,
    minimumFare: 200,
    capacity: 10,
    description: "Commuter or family group van",
  },
}

export interface DeliveryPricingConfig {
  baseFare: number
  perKmRate: number
  minimumFare: number
  sizeTierSurcharge: Record<"small" | "medium" | "large", number>
  fragileSurcharge: number
}

export const DELIVERY_PRICING_CONFIG: Record<string, DeliveryPricingConfig> = {
  documents: {
    baseFare: 35,
    perKmRate: 12,
    minimumFare: 45,
    sizeTierSurcharge: { small: 0, medium: 15, large: 30 },
    fragileSurcharge: 20,
  },
  food: {
    baseFare: 45,
    perKmRate: 15,
    minimumFare: 55,
    sizeTierSurcharge: { small: 0, medium: 20, large: 40 },
    fragileSurcharge: 15,
  },
  parcel: {
    baseFare: 40,
    perKmRate: 14,
    minimumFare: 50,
    sizeTierSurcharge: { small: 0, medium: 25, large: 60 },
    fragileSurcharge: 25,
  },
  fragile: {
    baseFare: 60,
    perKmRate: 18,
    minimumFare: 80,
    sizeTierSurcharge: { small: 10, medium: 35, large: 80 },
    fragileSurcharge: 40,
  },
}

export interface FareBreakdown {
  serviceType: "ride" | "delivery" | "rental"
  category: string
  distanceKm: number
  baseFare: number
  distanceCharge: number
  surcharges: number
  surchargeDetails?: { label: string; amount: number }[]
  subtotal: number
  totalFare: number
  currency: string
  riderEstimatedEarnings: number
  platformFee: number
  isProvisional: boolean
}

/**
 * Calculates authoritative ride fare based on road distance
 */
export function calculateAuthoritativeRideFare(
  category: string,
  roadDistanceKm: number
): FareBreakdown {
  const normalizedCategory = category.toLowerCase().trim()
  const config =
    RIDE_PRICING_CONFIG[normalizedCategory] ||
    RIDE_PRICING_CONFIG.motorcycle

  const distance = Math.max(0.1, Number(roadDistanceKm.toFixed(2)))
  const baseFare = config.baseFare
  const distanceCharge = Number((distance * config.perKmRate).toFixed(2))
  const subtotal = baseFare + distanceCharge
  const totalFare = Math.max(config.minimumFare, Math.round(subtotal))

  // Platform split: 80% to verified rider, 20% platform operation fee
  const riderEstimatedEarnings = Number((totalFare * 0.8).toFixed(2))
  const platformFee = Number((totalFare * 0.2).toFixed(2))

  return {
    serviceType: "ride",
    category: normalizedCategory,
    distanceKm: distance,
    baseFare,
    distanceCharge,
    surcharges: 0,
    subtotal,
    totalFare,
    currency: "PHP",
    riderEstimatedEarnings,
    platformFee,
    isProvisional: true, // Marked provisional until city ordinance approval
  }
}

/**
 * Calculates authoritative delivery fare based on package options and road distance
 */
export function calculateAuthoritativeDeliveryFare(
  packageType: string,
  sizeTier: "small" | "medium" | "large" = "small",
  roadDistanceKm: number,
  isFragile = false
): FareBreakdown {
  const normalizedType = packageType.toLowerCase().trim()
  const config =
    DELIVERY_PRICING_CONFIG[normalizedType] ||
    DELIVERY_PRICING_CONFIG.parcel

  const distance = Math.max(0.1, Number(roadDistanceKm.toFixed(2)))
  const baseFare = config.baseFare
  const distanceCharge = Number((distance * config.perKmRate).toFixed(2))

  const surchargeDetails: { label: string; amount: number }[] = []
  let surcharges = 0

  const sizeFee = config.sizeTierSurcharge[sizeTier] || 0
  if (sizeFee > 0) {
    surcharges += sizeFee
    surchargeDetails.push({ label: `${sizeTier.toUpperCase()} Size Handling`, amount: sizeFee })
  }

  if (isFragile) {
    surcharges += config.fragileSurcharge
    surchargeDetails.push({ label: "Fragile Care Surcharge", amount: config.fragileSurcharge })
  }

  const subtotal = baseFare + distanceCharge + surcharges
  const totalFare = Math.max(config.minimumFare, Math.round(subtotal))

  const riderEstimatedEarnings = Number((totalFare * 0.8).toFixed(2))
  const platformFee = Number((totalFare * 0.2).toFixed(2))

  return {
    serviceType: "delivery",
    category: normalizedType,
    distanceKm: distance,
    baseFare,
    distanceCharge,
    surcharges,
    surchargeDetails,
    subtotal,
    totalFare,
    currency: "PHP",
    riderEstimatedEarnings,
    platformFee,
    isProvisional: true,
  }
}

/**
 * Validates client-submitted fare against authoritative server calculation.
 * Prevents forged fares or negative prices.
 */
export function validateSubmittedFare(
  submittedFare: number,
  calculatedFare: number,
  tolerance = 10
): { isValid: boolean; message?: string } {
  if (typeof submittedFare !== "number" || isNaN(submittedFare) || submittedFare <= 0) {
    return { isValid: false, message: "Invalid or non-positive fare submitted." }
  }

  const difference = Math.abs(submittedFare - calculatedFare)
  if (difference > tolerance) {
    return {
      isValid: false,
      message: `Submitted fare (₱${submittedFare}) deviates significantly from server-calculated fare (₱${calculatedFare}).`,
    }
  }

  return { isValid: true }
}
