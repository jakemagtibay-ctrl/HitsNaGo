import type { BaseBooking } from "./booking"
import type { LocationAddress } from "./service"

export type PackageType =
  | "documents"
  | "food"
  | "parcel"
  | "fragile"
  | "groceries"
  | "other"

export interface PackageInfo {
  type: PackageType
  description: string
  weightKg?: number
  isFragile: boolean
  handlingInstructions?: string
  photoUrl?: string
}

export interface Recipient {
  name: string
  phone: string
  alternatePhone?: string
  notes?: string
}

export interface Sender {
  name: string
  phone: string
}

export interface DeliveryBooking extends BaseBooking {
  serviceType: "delivery"
  pickupLocation: LocationAddress
  deliveryLocation: LocationAddress
  sender: Sender
  recipient: Recipient
  packageInfo: PackageInfo
  riderId?: string
  estimatedPrice: number
  actualPrice?: number
  distanceKm: number
  estimatedDurationMinutes?: number
  assignedAt?: string
  pickedUpAt?: string
  deliveredAt?: string
  proofOfPickupUrl?: string
  proofOfDeliveryUrl?: string
}
