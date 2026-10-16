import type { BaseBooking } from "./booking"

export type RentalCategory = "vehicle" | "equipment" | "space" | "service"

export type RentalStatus = "available" | "rented" | "maintenance" | "inactive"

export type HandoverMethod = "pickup" | "delivery"

export interface RentalListing {
  id: string
  providerId: string
  title: string
  description: string
  category: RentalCategory
  pricePerDay: number
  pricePerHour?: number
  securityDeposit: number
  currency: string
  images: string[]
  termsAndConditions?: string
  requirements?: string[]
  pickupAddress?: string
  status: RentalStatus
  createdAt: string
  updatedAt: string
}

export type UnitStatus = "available" | "maintenance" | "unavailable"

export interface RentalUnit {
  id: string
  listingId: string
  providerId: string
  unitIdentifier: string
  status: UnitStatus
  maintenanceStart?: string | null
  maintenanceEnd?: string | null
  maintenanceReason?: string | null
  createdAt: string
  updatedAt: string
}

export type AvailabilityStatus =
  | "available"
  | "all_booked"
  | "all_maintenance"
  | "all_unavailable"
  | "unavailable_mixed"
  | "mixed_available"
  | "mixed_unavailable"

export interface ModelAvailabilityResult {
  listingId: string
  modelName: string
  totalUnits: number
  availableUnits: number
  bookedUnits: number
  maintenanceUnits: number
  unavailableUnits: number
  status: AvailabilityStatus
  isAvailable: boolean
  message: string
}

export interface RentalBooking extends BaseBooking {
  serviceType: "rental"
  listingId: string
  providerId: string
  unitId?: string | null
  unitIdentifier?: string | null
  listing?: RentalListing
  startDate: string
  endDate: string
  durationDays: number
  durationHours?: number
  securityDeposit: number
  depositStatus: "pending" | "held" | "refunded" | "forfeited"
  handoverMethod: HandoverMethod
  handoverAddress?: string
  checkInNotes?: string
  returnInspectionNotes?: string
}
