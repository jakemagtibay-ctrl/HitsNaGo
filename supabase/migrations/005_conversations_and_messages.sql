-- =============================================================================
-- HitsNaGo Migration 005: Real Messaging & Inbox System
-- Enables persistent communication between Customers, Riders, and Admins
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- --------------------------------------------------------
-- 1. CONVERSATIONS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_by   TEXT NOT NULL,
  title        TEXT,
  service_type TEXT CHECK (service_type IN ('ride', 'rental', 'delivery', 'support', 'general')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 2. CONVERSATION PARTICIPANTS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,
  user_name       TEXT NOT NULL,
  user_role       TEXT NOT NULL CHECK (user_role IN ('customer', 'rider', 'provider', 'admin')),
  last_read_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- --------------------------------------------------------
-- 3. MESSAGES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL,
  sender_name     TEXT NOT NULL,
  sender_role     TEXT NOT NULL CHECK (sender_role IN ('customer', 'rider', 'provider', 'admin')),
  content         TEXT NOT NULL CHECK (length(trim(content)) > 0 AND length(content) <= 2000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------
-- 4. INDEXES FOR PERFORMANCE
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON public.conversations(booking_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conv_user ON public.conversation_participants(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- Auto-update trigger for conversations
CREATE OR REPLACE FUNCTION public.conversations_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_set_updated_at ON public.conversations;
CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.conversations_set_updated_at();

-- --------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- --------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; anon client policies can be configured if needed
CREATE POLICY "Allow service role full access on conversations"
  ON public.conversations FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on participants"
  ON public.conversation_participants FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on messages"
  ON public.messages FOR ALL
  TO service_role USING (true) WITH CHECK (true);
