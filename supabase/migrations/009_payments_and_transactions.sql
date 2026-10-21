-- =============================================================================
-- HitsNaGo Migration 009: Payments, Transactions & PayMongo Architecture
-- Backward-compatible, idempotent migration for cash and gateway payments.
-- Run in: Supabase Dashboard > SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND BOOKINGS TABLE WITH PAYMENT AUDIT COLUMNS
-- -----------------------------------------------------------------------------
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- 2. CREATE PAYMENT TRANSACTIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id              UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_id             TEXT NOT NULL,
  provider_or_rider_id    UUID,
  reference               TEXT UNIQUE NOT NULL,
  gateway                 TEXT NOT NULL DEFAULT 'cash' CHECK (gateway IN ('cash', 'paymongo', 'manual_bank')),
  gateway_transaction_id  TEXT,
  idempotency_key         TEXT UNIQUE NOT NULL,
  amount                  NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency                TEXT NOT NULL DEFAULT 'PHP',
  payment_method          TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'gcash', 'maya', 'card', 'qrph')),
  status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  failure_reason          TEXT,
  refund_amount           NUMERIC(10,2) CHECK (refund_amount >= 0),
  refund_reason           TEXT,
  refunded_at             TIMESTAMPTZ,
  metadata                JSONB DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES FOR CONCURRENCY & QUERY PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payment_tx_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_customer_id ON public.payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_idempotency ON public.payment_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_gateway_id ON public.payment_transactions(gateway_transaction_id);

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Service role has full permissions
DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role full access on payment_transactions" ON public.payment_transactions;
  CREATE POLICY "Service role full access on payment_transactions"
    ON public.payment_transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Authenticated users can view their own payment transactions
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;
  CREATE POLICY "Users can view own payment transactions"
    ON public.payment_transactions
    FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid()::text);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
