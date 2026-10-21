import type { BaseBooking } from "./booking"
import type { LocationAddress } from "./service"
import type { VehicleType } from "./vehicle"

// Allowed vehicle categories for ride hailing
export type RideVehicleCategory = VehicleType

// Represents a complete ride hailing booking record
export interface RideBooking extends BaseBooking {
  serviceType: "ride"
  pickupLocation: LocationAddress
  destinationLocation: LocationAddress
  vehicleCategory: RideVehicleCategory
  vehicleId?: string
  riderId?: string
  estimatedPrice: number
  actualPrice?: number
  distanceKm: number
  estimatedDurationMinutes: number
  passengerCount: number
  acceptedAt?: string
  arrivedAtPickupAt?: string
  rideStartedAt?: string
  rideCompletedAt?: string
}

