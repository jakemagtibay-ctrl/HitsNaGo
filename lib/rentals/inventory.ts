import type { RentalUnit } from "@/types/rental"

// Baseline physical units for Butuan City fleet listings with valid UUID primary keys
export const DEFAULT_INVENTORY_UNITS: RentalUnit[] = [
  // Toyota Innova (3 units)
  {
    id: "a1000000-0001-4000-8000-000000000001",
    listingId: "rent_btn_01",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 1 (Plate ABC-1011)",
    status: "available",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "a1000000-0001-4000-8000-000000000002",
    listingId: "rent_btn_01",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 2 (Plate ABC-1012)",
    status: "available",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "a1000000-0001-4000-8000-000000000003",
    listingId: "rent_btn_01",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 3 (Plate ABC-1013)",
    status: "available",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-01-10T08:00:00Z",
  },

  // Toyota HiAce Grandia (2 units)
  {
    id: "a1000000-0002-4000-8000-000000000001",
    listingId: "rent_btn_02",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 1 (Plate VAN-2021)",
    status: "available",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "a1000000-0002-4000-8000-000000000002",
    listingId: "rent_btn_02",
    providerId: "user_prov_btn_01",
    unitIdentifier: "Unit 2 (Plate VAN-2022)",
    status: "available",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },

  // Honda Click 125i (3 units)
  {
    id: "a1000000-0003-4000-8000-000000000001",
    listingId: "rent_btn_03",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 1 (Plate MTO-3031)",
    status: "available",
    createdAt: "2026-02-01T14:00:00Z",
    updatedAt: "2026-02-01T14:00:00Z",
  },
  {
    id: "a1000000-0003-4000-8000-000000000002",
    listingId: "rent_btn_03",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 2 (Plate MTO-3032)",
    status: "available",
    createdAt: "2026-02-01T14:00:00Z",
    updatedAt: "2026-02-01T14:00:00Z",
  },
  {
    id: "a1000000-0003-4000-8000-000000000003",
    listingId: "rent_btn_03",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 3 (Plate MTO-3033)",
    status: "available",
    createdAt: "2026-02-01T14:00:00Z",
    updatedAt: "2026-02-01T14:00:00Z",
  },

  // Yamaha NMAX 155 (2 units)
  {
    id: "a1000000-0004-4000-8000-000000000001",
    listingId: "rent_btn_04",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 1 (Plate NMX-4041)",
    status: "available",
    createdAt: "2026-02-05T12:00:00Z",
    updatedAt: "2026-02-05T12:00:00Z",
  },
  {
    id: "a1000000-0004-4000-8000-000000000002",
    listingId: "rent_btn_04",
    providerId: "user_prov_btn_02",
    unitIdentifier: "Unit 2 (Plate NMX-4042)",
    status: "available",
    createdAt: "2026-02-05T12:00:00Z",
    updatedAt: "2026-02-05T12:00:00Z",
  },
]

// Bidirectional mapping from legacy placeholder identifiers to database UUIDs
export const LEGACY_UNIT_ID_MAP: Record<string, string> = {
  unit_innova_01: "a1000000-0001-4000-8000-000000000001",
  unit_innova_02: "a1000000-0001-4000-8000-000000000002",
  unit_innova_03: "a1000000-0001-4000-8000-000000000003",
  unit_hiace_01: "a1000000-0002-4000-8000-000000000001",
  unit_hiace_02: "a1000000-0002-4000-8000-000000000002",
  unit_click_01: "a1000000-0003-4000-8000-000000000001",
  unit_click_02: "a1000000-0003-4000-8000-000000000002",
  unit_click_03: "a1000000-0003-4000-8000-000000000003",
  unit_nmax_01: "a1000000-0004-4000-8000-000000000001",
  unit_nmax_02: "a1000000-0004-4000-8000-000000000002",
}

export const VALID_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Normalizes any unit identifier (legacy string or prefix) to a valid database UUID
 */
export function normalizeRentalUnitId(rawId?: string | null): string | null {
  if (!rawId) return null
  const trimmed = rawId.trim()
  if (LEGACY_UNIT_ID_MAP[trimmed]) {
    return LEGACY_UNIT_ID_MAP[trimmed]
  }
  // Check for prefix matches if trimmed (e.g. "unit_click_0")
  for (const [legacy, uuid] of Object.entries(LEGACY_UNIT_ID_MAP)) {
    if (trimmed.startsWith(legacy) || legacy.startsWith(trimmed)) {
      return uuid
    }
  }
  return VALID_UUID_REGEX.test(trimmed) ? trimmed : null
}
