export type ServiceType = "ride" | "rental" | "delivery"

export interface Coordinates {
  lat: number
  lng: number
}

export interface LocationAddress {
  address: string
  title?: string
  landmark?: string
  coordinates: Coordinates
  city?: string
  province?: string
  postalCode?: string
}

export interface ServiceCategory {
  id: string
  type: ServiceType
  name: string
  description: string
  iconName: string
  isActive: boolean
}
