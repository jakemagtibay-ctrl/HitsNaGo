-- 007_booking_conversations.sql
-- Idempotent migration to support distinct conversation kinds (booking_rider vs support)

-- 1. Add conversation_kind column with default 'booking_rider'
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS conversation_kind TEXT NOT NULL DEFAULT 'booking_rider';

-- 2. Backfill existing support conversations based on service_type
UPDATE public.conversations 
SET conversation_kind = 'support' 
WHERE service_type = 'support' AND conversation_kind <> 'support';

-- 3. Ensure foreign key constraint from conversations.booking_id to bookings.id exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_booking_id_fkey'
  ) THEN
    ALTER TABLE public.conversations 
    ADD CONSTRAINT conversations_booking_id_fkey 
    FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Drop any prior generic index on booking_id alone if it was created
DROP INDEX IF EXISTS public.idx_conversations_booking_id_unique;

-- 5. Create unique partial index ONLY for customer-rider conversations attached to a booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_booking_rider_unique 
ON public.conversations(booking_id) 
WHERE booking_id IS NOT NULL AND conversation_kind = 'booking_rider';

-- 6. Supporting index for quick lookup of conversation participants by user
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conv 
ON public.conversation_participants(user_id, conversation_id);

-- 7. Ensure body column sync if body column exists on messages
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'body'
  ) THEN
    ALTER TABLE public.messages ALTER COLUMN body DROP NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 8. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
