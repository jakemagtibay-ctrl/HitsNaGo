import type { UserRole } from "./user"

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected"
  | "resubmission_required"

export type GovernmentIdType =
  | "philippine_national_id"
  | "philippine_passport"
  | "philippine_drivers_license"
  | "umid"
  | "other"

export interface GovernmentIdOption {
  id: GovernmentIdType
  label: string
  requiresBack: boolean
  description: string
}

export const GOVERNMENT_ID_OPTIONS: GovernmentIdOption[] = [
  {
    id: "philippine_national_id",
    label: "Philippine National ID (PhilID / ePhilID)",
    requiresBack: true,
    description: "Clear photo of the front and back (showing QR code and details).",
  },
  {
    id: "philippine_drivers_license",
    label: "Philippine Driver's License (LTO)",
    requiresBack: true,
    description: "Official LTO driver's license card (both front and back).",
  },
  {
    id: "philippine_passport",
    label: "Philippine Passport (DFA)",
    requiresBack: false,
    description: "Clear photo of the photo/bio data page with signature.",
  },
  {
    id: "umid",
    label: "Unified Multi-Purpose ID (UMID)",
    requiresBack: true,
    description: "Official UMID card issued by SSS / GSIS (front and back).",
  },
  {
    id: "other",
    label: "Other Government-Issued ID",
    requiresBack: true,
    description: "Valid Philippine government ID (PRC, Postal, Voter's). Please specify document type.",
  },
]

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
