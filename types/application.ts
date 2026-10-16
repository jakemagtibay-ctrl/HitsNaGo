/**
 * HitsNaGo Role Application Types
 *
 * These types model the Rider and Rental Provider application flows.
 * All applications start with status "pending" and transition to
 * "approved" or "rejected" after admin review.
 *
 * NOTE: Customers retain their "customer" role until an application is APPROVED.
 */

export type ApplicationStatus = "pending" | "approved" | "rejected"
export type ApplicationType = "rider" | "provider"

// ─── Rider Application ───────────────────────────────────────────────────────

export interface RiderApplication {
  id: string
  /** Applicant's Clerk user ID */
  applicantId: string
  applicantName: string
  applicantEmail: string
  applicationType: "rider"
  status: ApplicationStatus

  // Personal Info
  fullName: string
  contactNumber: string
  address: string
  barangay: string

  // Driver's License
  licenseNumber: string
  licenseExpiry: string
  licenseRestrictionCode: string

  // Vehicle
  vehicleType: "motorcycle" | "tricycle" | "electric_bike"
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  plateNumber: string
  orNumber: string  // Official Receipt
  crNumber: string  // Certificate of Registration

  // Documents (mock URLs for frontend phase)
  licensePhotoUrl?: string
  vehiclePhotoUrl?: string
  orCrPhotoUrl?: string
  validIdUrl?: string
  profilePhotoUrl?: string

  // Emergency Contact
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string

  // Admin
  submittedAt: string
  reviewedAt?: string
  reviewedByAdminId?: string
  adminRemarks?: string
  /** Requestfor more information message from admin */
  moreInfoRequest?: string
}

// ─── Rental Provider Application ─────────────────────────────────────────────

export interface ProviderApplication {
  id: string
  /** Applicant's Clerk user ID */
  applicantId: string
  applicantName: string
  applicantEmail: string
  applicationType: "provider"
  status: ApplicationStatus

  // Business Info
  applicantFullName: string
  businessName: string
  contactNumber: string
  address: string
  barangay: string

  // Service Details
  serviceCategory: "vehicle_rental" | "motorcycle_rental" | "equipment_rental" | "multi_service"
  serviceDescription: string
  estimatedFleetSize: number

  // Documents (mock URLs for frontend phase)
  governmentIdUrl?: string
  businessPermitUrl?: string
  dtiRegistrationUrl?: string
  servicePhotoUrls?: string[]

  // Admin
  submittedAt: string
  reviewedAt?: string
  reviewedByAdminId?: string
  adminRemarks?: string
  moreInfoRequest?: string
}

export type RoleApplication = RiderApplication | ProviderApplication
