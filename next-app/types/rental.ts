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

export interface RentalBooking extends BaseBooking {
  serviceType: "rental"
  listingId: string
  providerId: string
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
