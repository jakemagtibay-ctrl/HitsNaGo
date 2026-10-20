-- =============================================================================
-- HitsNaGo Migration 004: Rental Units Inventory & Availability Management
-- Tracks individual vehicle units, maintenance schedules, and race-safe date overlap booking
-- =============================================================================

-- --------------------------------------------------------
-- 1. RENTAL UNITS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rental_units (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          TEXT NOT NULL,
  provider_id         TEXT NOT NULL,
  unit_identifier     TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('available', 'maintenance', 'unavailable')) DEFAULT 'available',
  maintenance_start   TIMESTAMPTZ,
  maintenance_end     TIMESTAMPTZ,
  maintenance_reason  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 2. EXTEND BOOKINGS FOR PHYSICAL UNIT ASSIGNMENT
-- --------------------------------------------------------
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.rental_units(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS listing_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rental_start_date TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rental_end_date TIMESTAMPTZ;

-- --------------------------------------------------------
-- 3. INDEXES FOR HIGH-CONCURRENCY AVAILABILITY CHECKS
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rental_units_listing_status ON public.rental_units(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_rental_units_provider ON public.rental_units(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_rental_overlap ON public.bookings(unit_id, rental_start_date, rental_end_date)
  WHERE service_type = 'rental' AND status IN ('pending', 'assigned', 'accepted', 'in_progress');

-- --------------------------------------------------------
-- 4. ATOMIC CONCURRENCY-SAFE UNIT RESERVATION RPC
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_rental_unit(
  p_listing_id TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_booking_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unit RECORD;
  v_unit_id UUID := NULL;
  v_total_units INT := 0;
  v_booked_units INT := 0;
  v_maintenance_units INT := 0;
  v_unavailable_units INT := 0;
BEGIN
  -- Count total registered units for model
  SELECT count(*) INTO v_total_units FROM public.rental_units WHERE listing_id = p_listing_id;
  IF v_total_units = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'NO_UNITS_FOUND',
      'message', 'No inventory units registered for this vehicle model.'
    );
  END IF;

  -- Lock candidate units FOR UPDATE to guarantee single-winner atomic assignment
  FOR v_unit IN
    SELECT u.*
    FROM public.rental_units u
    WHERE u.listing_id = p_listing_id
    ORDER BY u.created_at ASC
    FOR UPDATE
  LOOP
    -- 1. Check if unit is marked unavailable
    IF v_unit.status = 'unavailable' THEN
      v_unavailable_units := v_unavailable_units + 1;
      CONTINUE;
    END IF;

    -- 2. Check if unit is in maintenance overlapping requested dates
    IF v_unit.status = 'maintenance' AND v_unit.maintenance_start IS NOT NULL AND v_unit.maintenance_end IS NOT NULL THEN
      IF (v_unit.maintenance_start <= p_end_date AND v_unit.maintenance_end >= p_start_date) THEN
        v_maintenance_units := v_maintenance_units + 1;
        CONTINUE;
      END IF;
    END IF;

    -- 3. Check if unit has overlapping active booking
    IF EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.unit_id = v_unit.id
        AND b.service_type = 'rental'
        AND b.status IN ('pending', 'assigned', 'accepted', 'in_progress')
        AND (b.rental_start_date <= p_end_date AND b.rental_end_date >= p_start_date)
    ) THEN
      v_booked_units := v_booked_units + 1;
      CONTINUE;
    END IF;

    -- If we get here, unit is available and free!
    v_unit_id := v_unit.id;
    EXIT;
  END LOOP;

  IF v_unit_id IS NULL THEN
    IF v_maintenance_units = v_total_units THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'ALL_MAINTENANCE',
        'message', 'All units of this vehicle model are currently under maintenance.'
      );
    ELSIF v_booked_units = v_total_units THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'ALL_BOOKED',
        'message', 'All units of this vehicle model are already booked for your selected dates.'
      );
    ELSIF v_unavailable_units = v_total_units THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'ALL_UNAVAILABLE',
        'message', 'This vehicle model is currently unavailable.'
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'MIXED_UNAVAILABLE',
        'message', 'All units of this vehicle model are unavailable for your selected dates.'
      );
    END IF;
  END IF;

  -- Assign unit to booking if booking ID supplied
  IF p_booking_id IS NOT NULL THEN
    UPDATE public.bookings
    SET unit_id = v_unit_id,
        listing_id = p_listing_id,
        rental_start_date = p_start_date,
        rental_end_date = p_end_date
    WHERE id = p_booking_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'unit_id', v_unit_id
  );
END;
$$;

-- --------------------------------------------------------
-- 5. SEED INITIAL INVENTORY UNITS (FOR BUTUAN CITY FLEET)
-- --------------------------------------------------------
INSERT INTO public.rental_units (id, listing_id, provider_id, unit_identifier, status)
VALUES
  -- Toyota Innova (3 units)
  ('a1000000-0001-4000-8000-000000000001', 'rent_btn_01', 'user_prov_btn_01', 'Unit 1 (Plate ABC-1011)', 'available'),
  ('a1000000-0001-4000-8000-000000000002', 'rent_btn_01', 'user_prov_btn_01', 'Unit 2 (Plate ABC-1012)', 'available'),
  ('a1000000-0001-4000-8000-000000000003', 'rent_btn_01', 'user_prov_btn_01', 'Unit 3 (Plate ABC-1013)', 'available'),
  -- Toyota HiAce (2 units)
  ('a1000000-0002-4000-8000-000000000001', 'rent_btn_02', 'user_prov_btn_01', 'Unit 1 (Plate VAN-2021)', 'available'),
  ('a1000000-0002-4000-8000-000000000002', 'rent_btn_02', 'user_prov_btn_01', 'Unit 2 (Plate VAN-2022)', 'available'),
  -- Honda Click 125i (3 units)
  ('a1000000-0003-4000-8000-000000000001', 'rent_btn_03', 'user_prov_btn_02', 'Unit 1 (Plate MTO-3031)', 'available'),
  ('a1000000-0003-4000-8000-000000000002', 'rent_btn_03', 'user_prov_btn_02', 'Unit 2 (Plate MTO-3032)', 'available'),
  ('a1000000-0003-4000-8000-000000000003', 'rent_btn_03', 'user_prov_btn_02', 'Unit 3 (Plate MTO-3033)', 'available'),
  -- Yamaha NMAX (2 units)
  ('a1000000-0004-4000-8000-000000000001', 'rent_btn_04', 'user_prov_btn_02', 'Unit 1 (Plate NMX-4041)', 'available'),
  ('a1000000-0004-4000-8000-000000000002', 'rent_btn_04', 'user_prov_btn_02', 'Unit 2 (Plate NMX-4042)', 'available')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- --------------------------------------------------------
ALTER TABLE public.rental_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read rental units" ON public.rental_units FOR SELECT USING (true);
