// Package types, weight limits, and pricing options for on-demand parcel deliveries
import type { PackageType } from "@/types/delivery"

export interface PackageCategoryOption {

  type: PackageType
  label: string
  description: string
  maxWeightKg: number
  basePrice: number
  iconName: string
}

export const PACKAGE_TYPES_CONFIG: PackageCategoryOption[] = [
  {
    type: "documents",
    label: "Legal & Office Documents",
    description: "Envelopes, contracts, school credentials, business permits, certificates.",
    maxWeightKg: 1,
    basePrice: 50,
    iconName: "File01Icon",
  },
  {
    type: "parcel",
    label: "Small to Medium Parcel",
    description: "Boxes, e-commerce orders, retail items, electronics, clothing items.",
    maxWeightKg: 5,
    basePrice: 75,
    iconName: "PackageIcon",
  },
  {
    type: "food",
    label: "Food & Fresh Pastries",
    description: "Restaurant takeout, packed meals, homemade cakes, bakery goods.",
    maxWeightKg: 6,
    basePrice: 65,
    iconName: "ShoppingBag01Icon",
  },
  {
    type: "groceries",
    label: "Grocery Supplies",
    description: "Supermarket items, market produce, daily household essentials.",
    maxWeightKg: 15,
    basePrice: 90,
    iconName: "ShoppingCart01Icon",
  },
  {
    type: "fragile",
    label: "Fragile & Delicate Items",
    description: "Glassware, ceramics, delicate equipment, precision instruments.",
    maxWeightKg: 5,
    basePrice: 95,
    iconName: "ShieldAlertIcon",
  },
  {
    type: "other",
    label: "Other General Goods",
    description: "Tools, spare parts, hardware items within safety guidelines.",
    maxWeightKg: 20,
    basePrice: 80,
    iconName: "PackageIcon",
  },
]

export interface PackageSizeTier {
  id: "small" | "medium" | "large"
  label: string
  sublabel: string
  maxDimensions: string
  weightRange: string
  surcharge: number
}

export const PACKAGE_SIZE_TIERS: PackageSizeTier[] = [
  {
    id: "small",
    label: "Small Package",
    sublabel: "Fits in rider pouch / sling bag",
    maxDimensions: "Up to 25 x 20 x 10 cm",
    weightRange: "0.1 - 2.0 kg",
    surcharge: 0,
  },
  {
    id: "medium",
    label: "Medium Package",
    sublabel: "Standard delivery insulated box",
    maxDimensions: "Up to 40 x 35 x 30 cm",
    weightRange: "2.1 - 7.0 kg",
    surcharge: 30,
  },
  {
    id: "large",
    label: "Large / Bulky Package",
    sublabel: "Requires cargo rack or tricycle/van",
    maxDimensions: "Up to 60 x 50 x 40 cm",
    weightRange: "7.1 - 20.0 kg",
    surcharge: 75,
  },
]

/**
 * Calculates estimated delivery fee in PHP for trips within Butuan City
 */
export function calculateDeliveryEstimate(
  packageType: PackageType,
  sizeTierId: "small" | "medium" | "large",
  weightKg: number = 1,
  distanceKm: number = 4.5,
  isFragile: boolean = false
): {
  baseFee: number
  sizeSurcharge: number
  distanceFee: number
  fragileHandlingFee: number
  estimatedTotal: number
} {
  const pkgConfig = PACKAGE_TYPES_CONFIG.find((p) => p.type === packageType) || PACKAGE_TYPES_CONFIG[0]
  const sizeConfig = PACKAGE_SIZE_TIERS.find((s) => s.id === sizeTierId) || PACKAGE_SIZE_TIERS[0]

  const baseFee = pkgConfig.basePrice
  const sizeSurcharge = sizeConfig.surcharge
  const distanceFee = Math.round(distanceKm * 10)
  const weightFee = Math.max(0, Math.round((weightKg - 1) * 5))
  const fragileHandlingFee = isFragile ? 35 : 0

  const estimatedTotal = baseFee + sizeSurcharge + distanceFee + weightFee + fragileHandlingFee

  return {
    baseFee: baseFee + weightFee,
    sizeSurcharge,
    distanceFee,
    fragileHandlingFee,
    estimatedTotal,
  }
}
