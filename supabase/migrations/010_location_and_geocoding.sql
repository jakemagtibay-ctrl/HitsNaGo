-- =============================================================================
-- HitsNaGo Migration 010: Location, Geocoding, & Exact Coordinates Architecture
-- Backward-compatible, non-destructive migration for accurate place names,
-- verified coordinates, and customer landmark instructions.
-- Run in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD ACCURATE LOCATION COLUMNS TO PUBLIC.BOOKINGS
-- -----------------------------------------------------------------------------
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_place_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_latitude NUMERIC(10,7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_longitude NUMERIC(10,7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_barangay TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_city TEXT DEFAULT 'Butuan City';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_details TEXT;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_place_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_latitude NUMERIC(10,7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_longitude NUMERIC(10,7);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_barangay TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_city TEXT DEFAULT 'Butuan City';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS destination_details TEXT;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_metadata JSONB DEFAULT '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- 2. INDEXES FOR GEOGRAPHIC AND PLACE NAME QUERIES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_coords 
  ON public.bookings(pickup_latitude, pickup_longitude);

CREATE INDEX IF NOT EXISTS idx_bookings_dest_coords 
  ON public.bookings(destination_latitude, destination_longitude);

CREATE INDEX IF NOT EXISTS idx_bookings_pickup_place_name 
  ON public.bookings(pickup_place_name);

CREATE INDEX IF NOT EXISTS idx_bookings_dest_place_name 
  ON public.bookings(destination_place_name);
