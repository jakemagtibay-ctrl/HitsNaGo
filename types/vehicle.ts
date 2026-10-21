// Vehicle category options used for rides, deliveries, and rentals
export type VehicleType = "motorcycle" | "tricycle" | "car" | "van" | "other"

// Operational status of a registered vehicle
export type VehicleStatus = "available" | "busy" | "inactive"

// Vehicle record with license plate, model, and registration details
export interface Vehicle {
  id: string
  ownerId: string
  type: VehicleType
  brand: string
  model: string
  year: number
  plateNumber: string
  color: string
  capacity: number
  status: VehicleStatus
  imageUrl?: string
  registrationExpiry?: string
  createdAt: string
  updatedAt: string
}

