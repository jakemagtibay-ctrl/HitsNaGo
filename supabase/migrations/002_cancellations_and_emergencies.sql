-- =============================================================================
-- HitsNaGo Migration 002: Booking Cancellations, Withdrawals & Emergency Incidents
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- --------------------------------------------------------
-- 1. BOOKING INCIDENTS & CANCELLATIONS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_incidents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  incident_type       TEXT NOT NULL CHECK (
                        incident_type IN (
                          'customer_cancellation',
                          'rider_withdrawal',
                          'provider_cancellation',
                          'emergency_report',
                          'custody_incident',
                          'rental_incident'
                        )
                      ),
  severity            TEXT NOT NULL DEFAULT 'standard' CHECK (severity IN ('standard', 'urgent', 'critical')),
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  category            TEXT NOT NULL,
  reason              TEXT NOT NULL,
  description         TEXT,
  reporter_id         TEXT NOT NULL,
  reporter_name       TEXT NOT NULL,
  reporter_role       TEXT NOT NULL CHECK (reporter_role IN ('customer', 'rider', 'provider', 'admin')),
  previous_status     TEXT NOT NULL,
  resulting_status    TEXT NOT NULL,
  location_lat        NUMERIC(10,7),
  location_lng        NUMERIC(10,7),
  location_address    TEXT,
  admin_notes         TEXT,
  resolved_by         TEXT,
  resolved_at         TIMESTAMPTZ,
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by booking and by status/type
CREATE INDEX IF NOT EXISTS idx_booking_incidents_booking_id ON public.booking_incidents(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_incidents_status ON public.booking_incidents(status);
CREATE INDEX IF NOT EXISTS idx_booking_incidents_incident_type ON public.booking_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_booking_incidents_severity ON public.booking_incidents(severity);

-- Auto-update trigger
DROP TRIGGER IF EXISTS booking_incidents_set_updated_at ON public.booking_incidents;
CREATE TRIGGER booking_incidents_set_updated_at
  BEFORE UPDATE ON public.booking_incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- --------------------------------------------------------
ALTER TABLE public.booking_incidents ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Allow authenticated read incidents"
  ON public.booking_incidents
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access incidents"
  ON public.booking_incidents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
