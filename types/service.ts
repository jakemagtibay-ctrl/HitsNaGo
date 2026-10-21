import type { LocationData } from "./location"

export type { LocationData }
// Supported main service offerings in HitsNaGo
export type ServiceType = "ride" | "rental" | "delivery"

// Geographic coordinate pair (latitude and longitude)
export interface Coordinates {
  lat: number
  lng: number
}

// Detailed location representation with address text and coordinates
export interface LocationAddress {
  address: string
  title?: string
  placeName?: string
  formattedAddress?: string
  landmark?: string
  barangay?: string
  coordinates: Coordinates
  city?: string
  province?: string
  country?: string
  postalCode?: string
  providerPlaceId?: string
  addressDetails?: string
  isVerifiedPreset?: boolean
}

// Service category card displayed on the booking home page
export interface ServiceCategory {
  id: string
  type: ServiceType
  name: string
  description: string
  iconName: string
  isActive: boolean
}

