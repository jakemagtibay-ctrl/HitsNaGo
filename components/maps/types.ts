// Type definitions for map markers, marker categories, and the Butuan City map component
export type MarkerCategory =

  | "hub"
  | "pickup"
  | "destination"
  | "delivery"
  | "rider"
  | "landmark"
  | "commercial"
  | "hospital"
  | "transport"
  | "school"
  | "listing"
  | "selected"
  | "default"

export interface MapMarker {
  id: string
  title: string
  lat: number
  lng: number
  description?: string
  category?: MarkerCategory
  badgeText?: string
  address?: string
  actionLabel?: string
  actionUrl?: string
  onAction?: () => void
  draggable?: boolean
  onDragEnd?: (coords: { lat: number; lng: number }) => void
}

export interface ButuanCityMapProps {
  /**
   * Title shown above or within the map container header
   */
  title?: string
  /**
   * Subtitle or contextual description
   */
  description?: string
  /**
   * CSS height string (e.g. "450px", "520px", "100%")
   * Defaults to "420px"
   */
  height?: string
  /**
   * Extra container class names
   */
  className?: string
  /**
   * Additional markers to render (e.g., booking pickups, provider listings)
   */
  markers?: MapMarker[]
  /**
   * Whether to include Butuan City landmark markers (SM, Robinsons, City Hall, etc.)
   * Default: true
   */
  showLandmarks?: boolean
  /**
   * Initial center [lat, lng].
   * Defaults to official Butuan City center: [8.9475, 125.5406]
   */
  initialCenter?: [number, number]
  /**
   * Initial zoom level. Default: 13
   */
  initialZoom?: number
  /**
   * Allow user to click anywhere on the map to select a point
   */
  enableLocationSelect?: boolean
  /**
   * Callback fired when a point is selected
   */
  onLocationSelect?: (coords: { lat: number; lng: number; label?: string }) => void
  /**
   * Selected location to display as an active pin
   */
  selectedLocation?: { lat: number; lng: number; label?: string } | null
  /**
   * Whether the selected location pin should be draggable by user
   */
  draggableSelectedPin?: boolean
  /**
   * Callback fired when dragging the selected location pin finishes
   */
  onSelectedPinDragEnd?: (coords: { lat: number; lng: number }) => void
  /**
   * Show map quick controls (e.g. Recenter Butuan, Locate Me)
   */
  showControls?: boolean
  /**
   * Role context for tailoring UI accents and presets
   */
  roleContext?: "public" | "admin" | "rider" | "provider" | "customer"
  /**
   * Primary road route to display (e.g. Passenger pickup to dropoff)
   */
  route?: MapRoute | null
  /**
   * Secondary road route to display (e.g. Rider to pickup dispatch leg)
   */
  secondaryRoute?: MapRoute | null
  /**
   * Active pin adjustment mode ("pickup" | "destination")
   */
  activePinMode?: "pickup" | "destination" | null
  /**
   * Callback fired when clicking the map while an active pin mode is enabled
   */
  onPinAdjust?: (type: "pickup" | "destination", coords: { lat: number; lng: number }) => void
  /**
   * Optional footer actions or CTA content below the map
   */
  footerContent?: React.ReactNode
}

export interface MapRoute {
  coordinates: [number, number][]
  distanceKm?: number
  durationMin?: number
  isFallback?: boolean
  isApproximate?: boolean
  routeQuality?: "exact_road" | "approximate_grid"
  label?: string
  color?: string
  style?: "solid" | "dashed"
}
