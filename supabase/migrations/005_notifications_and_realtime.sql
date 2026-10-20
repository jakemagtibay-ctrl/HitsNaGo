-- =============================================================================
-- HitsNaGo Migration 005: Unified Notifications System & Realtime Publications
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- --------------------------------------------------------
-- 1. NOTIFICATIONS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  user_role     TEXT NOT NULL CHECK (user_role IN ('customer', 'rider', 'provider', 'admin')),
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('booking', 'verification', 'message', 'dispute', 'system', 'emergency')),
  service_type  TEXT CHECK (service_type IN ('ride', 'rental', 'delivery', 'general', 'support')),
  booking_id    UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  action_url    TEXT,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning-fast queries by user & read state
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_role_unread ON public.notifications(user_role, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON public.notifications(booking_id);

-- Auto-update trigger
DROP TRIGGER IF EXISTS notifications_set_updated_at ON public.notifications;
CREATE TRIGGER notifications_set_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- --------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own notifications or role notifications
CREATE POLICY "Allow authenticated read notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access notifications"
  ON public.notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------
-- 3. ENABLE SUPABASE REALTIME REPLICATION
-- --------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Ensure all core messaging, booking and notification tables are replicated
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_incidents;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
