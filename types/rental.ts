import type { BaseBooking } from "./booking"

// Category of items available for rent
export type RentalCategory = "vehicle" | "equipment" | "space" | "service"

// General operational state of a rental listing
export type RentalStatus = "available" | "rented" | "maintenance" | "inactive"

// How the customer receives the rented item
export type HandoverMethod = "pickup" | "delivery"

// Listing information for an item offered by a rental provider
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

// Current status of an individual physical rental unit
export type UnitStatus = "available" | "maintenance" | "unavailable"

// Specific physical vehicle or unit belonging to a listing
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

// Detailed availability status code for multiple units
export type AvailabilityStatus =
  | "available"
  | "all_booked"
  | "all_maintenance"
  | "all_unavailable"
  | "unavailable_mixed"
  | "mixed_available"
  | "mixed_unavailable"

// Calculated inventory result showing unit counts and availability for a listing
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

// Booking record for a rental reservation
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

