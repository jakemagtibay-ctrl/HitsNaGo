-- =============================================================================
-- HitsNaGo Migration 001: Bookings, Riders, & Providers Tables
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- --------------------------------------------------------
-- 1. RIDERS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.riders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id         TEXT UNIQUE,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT,
  vehicle_model         TEXT,
  plate_number          TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  is_verified           BOOLEAN NOT NULL DEFAULT false,
  rating                NUMERIC(3,2) DEFAULT 5.00,
  completed_trips_count INT DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 2. PROVIDERS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  business_name TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 3. BOOKINGS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        TEXT NOT NULL UNIQUE,
  customer_id      TEXT NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  service_type     TEXT NOT NULL CHECK (service_type IN ('ride','rental','delivery')),
  vehicle_category TEXT,
  pickup           TEXT NOT NULL,
  destination      TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  passengers       INT NOT NULL DEFAULT 1,
  payment_mode     TEXT NOT NULL DEFAULT 'cash',
  estimated_fare   NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','assigned','accepted','in_progress','completed','cancelled')),
  rider_id         UUID REFERENCES public.riders(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_set_updated_at ON public.bookings;
CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS riders_set_updated_at ON public.riders;
CREATE TRIGGER riders_set_updated_at
  BEFORE UPDATE ON public.riders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS providers_set_updated_at ON public.providers;
CREATE TRIGGER providers_set_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- --------------------------------------------------------
ALTER TABLE public.bookings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
