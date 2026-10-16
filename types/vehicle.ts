export type VehicleType = "motorcycle" | "tricycle" | "car" | "van" | "other"

export type VehicleStatus = "available" | "busy" | "inactive"

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
