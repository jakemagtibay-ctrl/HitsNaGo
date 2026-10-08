import type { VerificationStatus } from "./verification"

export type UserRole = "customer" | "rider" | "provider" | "admin"

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

export interface CustomerSavedAddress {
  id: string
  label: string
  address: string
  lat: number
  lng: number
  isDefault?: boolean
}

export interface EmergencyContact {
  name: string
  phone: string
  relation: string
}

export interface Customer extends BaseUser {
  role: "customer"
  savedAddresses?: CustomerSavedAddress[]
  emergencyContact?: EmergencyContact
}

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

export interface Admin extends BaseUser {
  role: "admin"
  department?: string
  permissions: string[]
}

export type User = Customer | Rider | Provider | Admin
