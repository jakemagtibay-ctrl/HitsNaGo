import type { LocationData } from "./location"

export type { LocationData }
export type ServiceType = "ride" | "rental" | "delivery"

export interface Coordinates {
  lat: number
  lng: number
}

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

export interface ServiceCategory {
  id: string
  type: ServiceType
  name: string
  description: string
  iconName: string
  isActive: boolean
}
