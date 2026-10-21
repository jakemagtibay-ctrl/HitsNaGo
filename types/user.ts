import type { VerificationStatus } from "./verification"

// Available user account types across the platform
export type UserRole = "customer" | "rider" | "provider" | "admin"

// Shared profile fields for all system users
export interface BaseUser {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl?: string
  role: UserRole
  verificationStatus: VerificationStatus
  createdAt: string
  updatedAt: string
}

// Favorite or frequently used pickup/drop-off point saved by a customer
export interface CustomerSavedAddress {
  id: string
  label: string
  address: string
  lat: number
  lng: number
  isDefault?: boolean
}

// Contact details for emergencies during trips
export interface EmergencyContact {
  name: string
  phone: string
  relation: string
}

// Customer user profile with saved addresses and emergency contact
export interface Customer extends BaseUser {
  role: "customer"
  savedAddresses?: CustomerSavedAddress[]
  emergencyContact?: EmergencyContact
}

// Rider user profile with active status, location coordinates, and ratings
export interface Rider extends BaseUser {
  role: "rider"
  vehicleId?: string
  isOnline: boolean
  isAcceptingRides: boolean
  isAcceptingDeliveries: boolean
  currentLocation?: {
    lat: number
    lng: number
    updatedAt: string
  }
  rating: number
  totalRatingsCount: number
  completedRidesCount: number
  completedDeliveriesCount: number
}

// Rental provider profile with shop/business details
export interface Provider extends BaseUser {
  role: "provider"
  businessName?: string
  businessAddress?: string
  bio?: string
  servicesOffered: string[]
  rating: number
  totalRatingsCount: number
  completedBookingsCount: number
}

// System administrator profile with elevated permissions
export interface Admin extends BaseUser {
  role: "admin"
  department?: string
  permissions: string[]
}

// Union of all user profile types
export type User = Customer | Rider | Provider | Admin

