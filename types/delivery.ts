import type { BaseBooking } from "./booking"
import type { LocationAddress } from "./service"

// Kinds of packages supported for on-demand delivery
export type PackageType =
  | "documents"
  | "food"
  | "parcel"
  | "fragile"
  | "groceries"
  | "other"

// Details about the parcel being sent
export interface PackageInfo {
  type: PackageType
  description: string
  weightKg?: number
  isFragile: boolean
  handlingInstructions?: string
  photoUrl?: string
}

// Contact details of the person receiving the parcel
export interface Recipient {
  name: string
  phone: string
  alternatePhone?: string
  notes?: string
}

// Contact details of the person sending the parcel
export interface Sender {
  name: string
  phone: string
}

// Full delivery order containing pickup, dropoff, parcel, and tracking details
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

