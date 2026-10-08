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
    pickupLocation: "Villa Kananga Commercial Center, South Montilla Blvd, Butuan City",
    destinationLocation: "SM City Butuan, J.C. Aquino Avenue, Butuan City",
    vehicleCategory: "motorcycle",
    estimatedDistanceKm: 4.8,
    estimatedDurationMinutes: 12,
    estimatedFare: 110,
    passengerCount: 1,
    notes: "Near the Holy Child Colleges gate.",
    requestedAt: "2026-10-05T15:48:00Z",
  },
  {
    id: "req_ride_902",
    passengerName: "Atty. Bernardo Cruz",
    passengerRating: 4.88,
    pickupLocation: "Libertad Public Market, National Highway, Butuan City",
    destinationLocation: "Manuel J. Santos Hospital, Montilla Boulevard, Butuan City",
    vehicleCategory: "motorcycle",
    estimatedDistanceKm: 3.6,
    estimatedDurationMinutes: 10,
    estimatedFare: 90,
    passengerCount: 1,
    requestedAt: "2026-10-05T15:49:30Z",
  },
]
