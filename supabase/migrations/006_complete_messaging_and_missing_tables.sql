-- =============================================================================
-- HitsNaGo Migration 006: Complete Messaging, Incident & Rental Tables + RLS
-- Comprehensive, fully idempotent migration.
-- Ensures all columns, foreign keys, triggers, and RLS policies exist with
-- explicit type safety and explicit type casts on every comparison.
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. SHARED HELPER FUNCTION FOR UPDATED_AT
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 1. CONVERSATIONS TABLE & COLUMNS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'general';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure created_by is TEXT even if an earlier migration created it as UUID
DO $$ BEGIN
  ALTER TABLE public.conversations ALTER COLUMN created_by TYPE TEXT USING created_by::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2. CONVERSATION PARTICIPANTS TABLE & COLUMNS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL DEFAULT 'User';
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Drop any legacy foreign key constraint on user_id to auth.users, and alter user_id from UUID to TEXT
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.conversation_participants'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.conversation_participants'::regclass AND attname = 'user_id')]
  ) LOOP
    EXECUTE 'ALTER TABLE public.conversation_participants DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;

  -- Convert user_id to TEXT to store Clerk user IDs (user_2t...)
  ALTER TABLE public.conversation_participants ALTER COLUMN user_id TYPE TEXT USING user_id::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Sync role to user_role if an older migration created column 'role'
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversation_participants' AND column_name = 'role'
  ) THEN
    UPDATE public.conversation_participants 
    SET user_role = role 
    WHERE (user_role IS NULL OR user_role = 'customer') AND role IS NOT NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. MESSAGES TABLE & COLUMNS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_name TEXT NOT NULL DEFAULT 'Sender';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_role TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Drop any legacy foreign key constraint on sender_id to auth.users, and alter sender_id from UUID to TEXT
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.messages'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.messages'::regclass AND attname = 'sender_id')]
  ) LOOP
    EXECUTE 'ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;

  -- Convert sender_id to TEXT to store Clerk user IDs (user_2t...)
  ALTER TABLE public.messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Sync body to content if an older migration created column 'body'
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'body'
  ) THEN
    UPDATE public.messages 
    SET content = body 
    WHERE (content IS NULL OR content = '') AND body IS NOT NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. RENTAL UNITS TABLE & BOOKINGS EXTENSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rental_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.rental_units ADD COLUMN IF NOT EXISTS listing_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.rental_units ADD COLUMN IF NOT EXISTS provider_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.rental_units ADD COLUMN IF NOT EXISTS unit_identifier TEXT NOT NULL DEFAULT '';
ALTER TABLE public.rental_units ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available';
ALTER TABLE public.rental_units ADD COLUMN IF NOT EXISTS maintenance_start TIMESTAMPTZ;
ALTER TABLE public.rental_units ADD COLUMN IF NOT EXISTS maintenance_end TIMESTAMPTZ;
ALTER TABLE public.rental_units ADD COLUMN IF NOT EXISTS maintenance_reason TEXT;
ALTER TABLE public.rental_units ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.rental_units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Extend bookings table for physical unit assignment
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.rental_units(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS listing_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rental_start_date TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rental_end_date TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- 5. BOOKING INCIDENTS & CANCELLATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS incident_type TEXT NOT NULL DEFAULT 'customer_cancellation';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL DEFAULT 'Unspecified';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS reporter_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS reporter_name TEXT NOT NULL DEFAULT 'Reporter';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS reporter_role TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS previous_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS resulting_status TEXT NOT NULL DEFAULT 'cancelled';
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10,7);
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS location_lng NUMERIC(10,7);
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS resolved_by TEXT;
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.booking_incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- -----------------------------------------------------------------------------
-- 6. PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON public.conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conv_user ON public.conversation_participants(conversation_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_conv_user_unique ON public.conversation_participants(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_rental_units_listing_status ON public.rental_units(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_rental_units_provider ON public.rental_units(provider_id);
CREATE INDEX IF NOT EXISTS idx_booking_incidents_booking_id ON public.booking_incidents(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_incidents_status ON public.booking_incidents(status);

-- -----------------------------------------------------------------------------
-- 7. AUTO-UPDATE TRIGGERS
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS conversations_set_updated_at ON public.conversations;
CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS participants_set_updated_at ON public.conversation_participants;
CREATE TRIGGER participants_set_updated_at
  BEFORE UPDATE ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS messages_set_updated_at ON public.messages;
CREATE TRIGGER messages_set_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS rental_units_set_updated_at ON public.rental_units;
CREATE TRIGGER rental_units_set_updated_at
  BEFORE UPDATE ON public.rental_units
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS booking_incidents_set_updated_at ON public.booking_incidents;
CREATE TRIGGER booking_incidents_set_updated_at
  BEFORE UPDATE ON public.booking_incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_incidents ENABLE ROW LEVEL SECURITY;

-- 8A. Service Role Full Access (Next.js Server Actions execute via createServiceClient)
DROP POLICY IF EXISTS "service_role_conversations" ON public.conversations;
CREATE POLICY "service_role_conversations"
  ON public.conversations FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_participants" ON public.conversation_participants;
CREATE POLICY "service_role_participants"
  ON public.conversation_participants FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_messages" ON public.messages;
CREATE POLICY "service_role_messages"
  ON public.messages FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_rental_units" ON public.rental_units;
CREATE POLICY "service_role_rental_units"
  ON public.rental_units FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_booking_incidents" ON public.booking_incidents;
CREATE POLICY "service_role_booking_incidents"
  ON public.booking_incidents FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- 8B. Defense-In-Depth Authenticated User Policies (With explicit ::text casts on all Clerk user ID comparisons)
-- Conversations
DROP POLICY IF EXISTS "participants_select_conversations" ON public.conversations;
CREATE POLICY "participants_select_conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    created_by::text = (auth.jwt() ->> 'sub')
    OR id IN (
      SELECT cp.conversation_id
      FROM public.conversation_participants cp
      WHERE cp.user_id::text = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "users_insert_conversations" ON public.conversations;
CREATE POLICY "users_insert_conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by::text = (auth.jwt() ->> 'sub')
  );

-- Conversation Participants
DROP POLICY IF EXISTS "participants_select_participants" ON public.conversation_participants;
CREATE POLICY "participants_select_participants"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (
    user_id::text = (auth.jwt() ->> 'sub')
    OR conversation_id IN (
      SELECT cp.conversation_id
      FROM public.conversation_participants cp
      WHERE cp.user_id::text = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "users_insert_participants" ON public.conversation_participants;
CREATE POLICY "users_insert_participants"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id::text = (auth.jwt() ->> 'sub')
    OR conversation_id IN (
      SELECT c.id
      FROM public.conversations c
      WHERE c.created_by::text = (auth.jwt() ->> 'sub')
    )
  );

-- Messages
DROP POLICY IF EXISTS "participants_select_messages" ON public.messages;
CREATE POLICY "participants_select_messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT cp.conversation_id
      FROM public.conversation_participants cp
      WHERE cp.user_id::text = (auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "participants_insert_messages" ON public.messages;
CREATE POLICY "participants_insert_messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id::text = (auth.jwt() ->> 'sub')
    AND conversation_id IN (
      SELECT cp.conversation_id
      FROM public.conversation_participants cp
      WHERE cp.user_id::text = (auth.jwt() ->> 'sub')
    )
  );

-- Rental Units: Authenticated read
DROP POLICY IF EXISTS "authenticated_select_rental_units" ON public.rental_units;
CREATE POLICY "authenticated_select_rental_units"
  ON public.rental_units FOR SELECT
  TO authenticated
  USING (true);

-- Booking Incidents: Customers can view incidents for their own bookings or reports
DROP POLICY IF EXISTS "authenticated_select_booking_incidents" ON public.booking_incidents;
CREATE POLICY "authenticated_select_booking_incidents"
  ON public.booking_incidents FOR SELECT
  TO authenticated
  USING (
    reporter_id::text = (auth.jwt() ->> 'sub')
    OR booking_id IN (
      SELECT b.id
      FROM public.bookings b
      WHERE b.customer_id::text = (auth.jwt() ->> 'sub')
    )
  );

-- -----------------------------------------------------------------------------
-- 9. NOTIFY POSTGREST SCHEMA CACHE RELOAD
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
