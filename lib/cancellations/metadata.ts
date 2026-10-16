import type { Booking, BookingStatus } from "@/lib/actions/bookings"

// ─── Types ────────────────────────────────────────────────────────────────────

export type IncidentType =
  | "customer_cancellation"
  | "rider_withdrawal"
  | "provider_cancellation"
  | "emergency_report"
  | "custody_incident"
  | "rental_incident"

export type IncidentSeverity = "standard" | "urgent" | "critical"

export type IncidentStatus = "open" | "investigating" | "resolved" | "closed"

export interface BookingIncident {
  id: string
  booking_id: string
  incident_type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  category: string
  reason: string
  description?: string | null
  reporter_id: string
  reporter_name: string
  reporter_role: "customer" | "rider" | "provider" | "admin"
  previous_status: string
  resulting_status: string
  location_lat?: number | null
  location_lng?: number | null
  location_address?: string | null
  admin_notes?: string | null
  resolved_by?: string | null
  resolved_at?: string | null
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  // joined booking details if queried
  booking?: Booking | null
}

export interface CancellationMetadata {
  reason: string
  explanation?: string
  cancelledBy: string
  cancelledByRole: "customer" | "rider" | "provider" | "admin"
  cancelledAt: string
  previousStatus: BookingStatus
  requiresAdminReview?: boolean
}

export interface EmergencyMetadata {
  id: string
  category: string
  description: string
  reporterName: string
  reporterRole: "customer" | "rider" | "provider" | "admin"
  reportedAt: string
  severity: IncidentSeverity
  status: IncidentStatus
  locationCoords?: { lat: number; lng: number }
  locationAddress?: string
}

// ─── Note Metadata Serializers & Parsers (Dual-Resilience) ───────────────────

export function serializeCancellationMetadata(
  notes: string | null | undefined,
  meta: CancellationMetadata
): string {
  const token = `[CANCELLATION:${JSON.stringify(meta)}]`
  if (!notes || !notes.trim()) return token
  return `${notes.trim()} ${token}`
}

export function serializeEmergencyMetadata(
  notes: string | null | undefined,
  meta: EmergencyMetadata
): string {
  const token = `[EMERGENCY:${JSON.stringify(meta)}]`
  if (!notes || !notes.trim()) return token
  return `${notes.trim()} ${token}`
}

export function parseBookingCancellationInfo(notes?: string | null): {
  cleanNotes: string
  cancellation: CancellationMetadata | null
  emergency: EmergencyMetadata | null
} {
  if (!notes) {
    return { cleanNotes: "", cancellation: null, emergency: null }
  }

  let clean = notes
  let cancellation: CancellationMetadata | null = null
  let emergency: EmergencyMetadata | null = null

  // Match [CANCELLATION:{...}]
  const cancelMatch = clean.match(/\[CANCELLATION:(\{.*?\})\]/)
  if (cancelMatch) {
    try {
      cancellation = JSON.parse(cancelMatch[1]) as CancellationMetadata
      clean = clean.replace(cancelMatch[0], "").trim()
    } catch {
      // ignore parse error
    }
  }

  // Match [EMERGENCY:{...}]
  const emergMatch = clean.match(/\[EMERGENCY:(\{.*?\})\]/)
  if (emergMatch) {
    try {
      emergency = JSON.parse(emergMatch[1]) as EmergencyMetadata
      clean = clean.replace(emergMatch[0], "").trim()
    } catch {
      // ignore parse error
    }
  }

  return {
    cleanNotes: clean,
    cancellation,
    emergency,
  }
}
