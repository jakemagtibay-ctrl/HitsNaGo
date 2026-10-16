-- =============================================================================
-- HitsNaGo Migration 003: Automatic Booking Distribution & Race-Safe Rider Acceptance
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- --------------------------------------------------------
-- 1. RACE-SAFE ATOMIC BOOKING ACCEPTANCE RPC
-- --------------------------------------------------------
-- Atomically assigns an unassigned pending ride/delivery to the first eligible rider
-- Prevents race conditions with FOR UPDATE row-level locking
CREATE OR REPLACE FUNCTION public.accept_booking_as_rider(
  p_booking_id UUID,
  p_rider_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rider RECORD;
  v_booking RECORD;
  v_active_trips_count INT;
  v_updated_booking RECORD;
BEGIN
  -- 1. Validate Rider Eligibility
  SELECT * INTO v_rider
  FROM public.riders
  WHERE id = p_rider_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'RIDER_NOT_FOUND', 'message', 'Rider record not found.');
  END IF;

  IF NOT v_rider.is_active THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'RIDER_INACTIVE', 'message', 'Rider account is inactive.');
  END IF;

  IF NOT v_rider.is_verified THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'RIDER_UNVERIFIED', 'message', 'Rider account is not verified.');
  END IF;

  -- 2. Check for Incompatible Active Trips
  SELECT COUNT(*) INTO v_active_trips_count
  FROM public.bookings
  WHERE rider_id = p_rider_id
    AND status = 'in_progress';

  IF v_active_trips_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'RIDER_OCCUPIED', 'message', 'You currently have an active trip or delivery in progress.');
  END IF;

  -- 3. Lock & Validate Booking Row (Row-level Lock for Concurrency Safeguard)
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'BOOKING_NOT_FOUND', 'message', 'Booking not found.');
  END IF;

  -- Rentals are exclusively managed by rental providers unless custom ride-delivery
  IF v_booking.service_type NOT IN ('ride', 'delivery') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_SERVICE', 'message', 'This service type is handled by authorized rental providers.');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'BOOKING_CANCELLED', 'message', 'This booking was cancelled.');
  END IF;

  IF v_booking.status != 'pending' OR v_booking.rider_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'ALREADY_ACCEPTED', 'message', 'This booking has already been accepted by another rider.');
  END IF;

  -- 4. Atomic Assignment
  UPDATE public.bookings
  SET rider_id = p_rider_id,
      status = 'accepted',
      updated_at = now()
  WHERE id = p_booking_id
    AND status = 'pending'
    AND rider_id IS NULL
  RETURNING * INTO v_updated_booking;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'CONCURRENT_CLAIM', 'message', 'Another rider accepted this booking simultaneously.');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_updated_booking.id,
    'reference', v_updated_booking.reference,
    'status', v_updated_booking.status,
    'rider_id', v_updated_booking.rider_id
  );
END;
$$;

-- Grant execute permissions to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.accept_booking_as_rider(UUID, UUID) TO authenticated, service_role;

-- --------------------------------------------------------
-- 2. INDEXES FOR HIGH-THROUGHPUT REALTIME DISPATCH
-- --------------------------------------------------------
-- Speeds up querying pending unclaimed bookings for the broadcast queue
CREATE INDEX IF NOT EXISTS idx_bookings_pending_unassigned
  ON public.bookings (status, service_type, created_at DESC)
  WHERE rider_id IS NULL AND status = 'pending';

-- Index for rider active status checks
CREATE INDEX IF NOT EXISTS idx_bookings_rider_active_status
  ON public.bookings (rider_id, status)
  WHERE rider_id IS NOT NULL;

-- --------------------------------------------------------
-- 3. ENABLE SUPABASE REALTIME (IF SUPPORTED)
-- --------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
