import type { ServiceType } from "./service"
import type { RideBooking } from "./ride"
import type { RentalBooking } from "./rental"
import type { DeliveryBooking } from "./delivery"

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "active"
  | "completed"
  | "cancelled"
  | "rejected"

export type PaymentMethod =
  | "cash"
  | "gcash"
  | "maya"
  | "bank_transfer"
  | "wallet"

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed"

export interface BaseBooking {
  id: string
  customerId: string
  providerId?: string
  riderId?: string
  serviceType: ServiceType
  status: BookingStatus
  totalAmount: number
  currency: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  scheduledAt?: string
  notes?: string
  cancellationReason?: string
  cancelledBy?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

export type Booking = RideBooking | RentalBooking | DeliveryBooking
