import type { UserRole } from "./user"

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected"

export type VerificationDocumentType =
  | "government_id"
  | "drivers_license"
  | "vehicle_registration"
  | "business_permit"
  | "barangay_clearance"
  | "police_clearance"

export interface VerificationDocument {
  id: string
  documentType: VerificationDocumentType
  documentNumber?: string
  fileUrl: string
  uploadedAt: string
  expiresAt?: string
}

export interface VerificationRequest {
  id: string
  userId: string
  userRole: UserRole
  status: VerificationStatus
  documents: VerificationDocument[]
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  adminNotes?: string
}

export interface UserVerificationBadge {
  userId: string
  status: VerificationStatus
  verifiedAt?: string
}
