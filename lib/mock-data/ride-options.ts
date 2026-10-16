import type { VehicleType } from "@/types/vehicle"

export interface RideOption {
  id: string
  vehicleType: VehicleType
  categoryLabel: string
  description: string
  capacity: number
  baseFare: number
  perKmRate: number
  estimatedArrivalMinutes: number
  rider: {
    id: string
    name: string
    avatarUrl: string
    rating: number
    totalRides: number
    isVerified: boolean
    vehicleModel: string
    plateNumber: string
    badgeText: string
  }
}

/**
 * Mock available verified riders within Butuan City.
 * Structured to map to HitsNaGo domain models while clearly labeled as demo data.
 */
export const MOCK_BUTUAN_RIDE_OPTIONS: RideOption[] = [
  {
    id: "ride_opt_moto",
    vehicleType: "motorcycle",
    categoryLabel: "Motorcycle Taxi (Habal-Habal Express)",
    description: "Fastest single-passenger transit through Butuan downtown traffic.",
    capacity: 1,
    baseFare: 45,
    perKmRate: 15,
    estimatedArrivalMinutes: 3,
    rider: {
      id: "rider_btn_01",
      name: "Danilo Reyes",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      rating: 4.95,
      totalRides: 342,
      isVerified: true,
      vehicleModel: "Yamaha NMAX 155 (Black)",
      plateNumber: "7718-HA",
      badgeText: "Top Rated Rider",
    },
  },
  {
    id: "ride_opt_tricycle",
    vehicleType: "tricycle",
    categoryLabel: "Local Tricycle (Poblacion & Barangay)",
    description: "Affordable shared or private neighborhood trip for up to 3 passengers.",
    capacity: 3,
    baseFare: 30,
    perKmRate: 12,
    estimatedArrivalMinutes: 5,
    rider: {
      id: "rider_btn_02",
      name: "Rodrigo 'Boy' Alcantara",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      rating: 4.88,
      totalRides: 512,
      isVerified: true,
      vehicleModel: "Kawasaki Barako II Tricycle",
      plateNumber: "BXU-4491",
      badgeText: "Butuan City Franchise",
    },
  },
  {
    id: "ride_opt_car",
    vehicleType: "car",
    categoryLabel: "Private Sedan (Comfort Car)",
    description: "Air-conditioned private sedan suitable for airport runs & business.",
    capacity: 4,
    baseFare: 90,
    perKmRate: 25,
    estimatedArrivalMinutes: 7,
    rider: {
      id: "rider_btn_03",
      name: "Eduardo Mendoza",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      rating: 4.98,
      totalRides: 189,
      isVerified: true,
      vehicleModel: "Toyota Vios 1.3 XLE (Silver)",
      plateNumber: "KAG-8201",
      badgeText: "Verified Chauffeured",
    },
  },
  {
    id: "ride_opt_van",
    vehicleType: "van",
    categoryLabel: "Commuter Van / MPV (Group Travel)",
    description: "Spacious van for families, luggage, and team excursions across Butuan.",
    capacity: 8,
    baseFare: 160,
    perKmRate: 35,
    estimatedArrivalMinutes: 10,
    rider: {
      id: "rider_btn_04",
      name: "Jonathan 'Jong' Salcedo",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      rating: 4.91,
      totalRides: 275,
      isVerified: true,
      vehicleModel: "Toyota HiAce Commuter (White)",
      plateNumber: "ZAA-3920",
      badgeText: "Fleet Verified",
    },
  },
]

/**
 * Calculates mock fare in PHP based on vehicle type and estimated distance in km
 */
export function calculateRideFare(
  baseFare: number,
  perKmRate: number,
  distanceKm: number = 5.2
): {
  baseFare: number
  distanceFee: number
  estimatedTotal: number
} {
  const distanceFee = Math.round(perKmRate * distanceKm)
  const estimatedTotal = baseFare + distanceFee

  return {
    baseFare,
    distanceFee,
    estimatedTotal,
  }
}
