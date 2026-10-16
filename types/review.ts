import type { ServiceType } from "./service"
import type { UserRole } from "./user"

/**
 * Valid star ratings constrained to integers between 1 and 5 inclusive.
 */
export type StarRating = 1 | 2 | 3 | 4 | 5

export interface Review {
  id: string
  bookingId: string
  serviceType: ServiceType
  reviewerId: string
  reviewerRole: UserRole
  targetId: string
  targetRole: UserRole
  rating: StarRating
  comment?: string
  createdAt: string
  updatedAt?: string
}
