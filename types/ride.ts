import type { BaseBooking } from "./booking"
import type { LocationAddress } from "./service"
import type { VehicleType } from "./vehicle"

export type RideVehicleCategory = VehicleType

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
