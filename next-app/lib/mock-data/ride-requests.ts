export interface IncomingRideRequest {
  id: string
  passengerName: string
  passengerRating: number
  passengerAvatarUrl?: string
  pickupLocation: string
  destinationLocation: string
  vehicleCategory: "motorcycle" | "tricycle" | "car" | "van"
  estimatedDistanceKm: number
  estimatedDurationMinutes: number
  estimatedFare: number
  passengerCount: number
  notes?: string
  requestedAt: string
}

export const mockIncomingRideRequests: IncomingRideRequest[] = [
  {
    id: "req_ride_901",
    passengerName: "Jasmine Morales",
    passengerRating: 4.95,
    passengerAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    pickupLocation: "Brgy. Crossing, San Isidro",
    destinationLocation: "Calubian Port Terminal",
    vehicleCategory: "motorcycle",
    estimatedDistanceKm: 6.2,
    estimatedDurationMinutes: 14,
    estimatedFare: 140,
    passengerCount: 1,
    notes: "Near yellow grocery store by the corner.",
    requestedAt: "2026-10-05T15:48:00Z",
  },
  {
    id: "req_ride_902",
    passengerName: "Atty. Bernardo Cruz",
    passengerRating: 4.88,
    pickupLocation: "San Isidro Public Market Gate 2",
    destinationLocation: "Leyte Provincial District Hospital",
    vehicleCategory: "motorcycle",
    estimatedDistanceKm: 11.5,
    estimatedDurationMinutes: 22,
    estimatedFare: 220,
    passengerCount: 1,
    requestedAt: "2026-10-05T15:49:30Z",
  },
]
