-- =============================================================================
-- HitsNaGo Migration 008: Government-Issued ID Verification for Riders & Providers
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD VERIFICATION & ID COLUMNS TO RIDERS TABLE
-- -----------------------------------------------------------------------------
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS id_type_custom TEXT;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS id_front_path TEXT;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS id_back_path TEXT;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

-- Ensure verification_status check constraint
DO $$ BEGIN
  ALTER TABLE public.riders DROP CONSTRAINT IF EXISTS riders_verification_status_check;
  ALTER TABLE public.riders ADD CONSTRAINT riders_verification_status_check
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'resubmission_required'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Backfill existing rider statuses
UPDATE public.riders
SET verification_status = CASE
  WHEN is_verified = true THEN 'verified'
  WHEN is_active = false THEN 'rejected'
  ELSE 'pending'
END
WHERE verification_status IS NULL OR verification_status = 'pending';

-- -----------------------------------------------------------------------------
-- 2. ADD VERIFICATION & ID COLUMNS TO PROVIDERS TABLE
-- -----------------------------------------------------------------------------
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS id_type_custom TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS id_front_path TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS id_back_path TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

-- Ensure verification_status check constraint
DO $$ BEGIN
  ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_verification_status_check;
  ALTER TABLE public.providers ADD CONSTRAINT providers_verification_status_check
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'resubmission_required'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Backfill existing provider statuses
UPDATE public.providers
SET verification_status = CASE
  WHEN is_verified = true THEN 'verified'
  WHEN is_active = false THEN 'rejected'
  ELSE 'pending'
END
WHERE verification_status IS NULL OR verification_status = 'pending';

-- -----------------------------------------------------------------------------
-- 3. AUDIT & LOGGING TABLE FOR VERIFICATION APPLICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('rider', 'provider')),
  target_id UUID,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  detail TEXT,
  id_type TEXT NOT NULL,
  id_type_custom TEXT,
  id_front_path TEXT NOT NULL,
  id_back_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'resubmission_required')),
  rejection_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_applications_user ON public.verification_applications(user_id, role);
CREATE INDEX IF NOT EXISTS idx_verification_applications_status ON public.verification_applications(status, role);

-- Enable RLS on verification_applications
ALTER TABLE public.verification_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access verification_applications"
  ON public.verification_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. PRIVATE SUPABASE STORAGE BUCKET FOR GOVERNMENT IDS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'verification-documents',
      'verification-documents',
      false,
      5242880,
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = false,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
