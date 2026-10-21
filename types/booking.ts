import type { ServiceType } from "./service"
import type { RideBooking } from "./ride"
import type { RentalBooking } from "./rental"
import type { DeliveryBooking } from "./delivery"

// Represents the lifecycle state of a booking (from pending to completed or cancelled)
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

// Supported payment options for customers
export type PaymentMethod =
  | "cash"
  | "gcash"
  | "maya"
  | "bank_transfer"
  | "wallet"

// Tracks whether the booking fee has been collected
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed"

// Base booking data shared across rides, rentals, and deliveries
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

// Union of all specific booking models
export type Booking = RideBooking | RentalBooking | DeliveryBooking

