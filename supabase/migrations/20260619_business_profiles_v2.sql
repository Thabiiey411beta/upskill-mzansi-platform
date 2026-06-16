-- ─────────────────────────────────────────────────────────────────────────────
-- Evolve public.business_profiles
--
-- Existing shape  (20260616_secure_core.sql):
--   id → profiles(id), company_name, registration_number, industry,
--   company_size, bee_level, is_verified, created_at
--
-- Target shape (requested):
--   id → auth.users, company_name, registration_number, industry,
--   size, credits_balance, created_at
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Drop the existing FK constraint so we can re-point it to auth.users
ALTER TABLE public.business_profiles
  DROP CONSTRAINT IF EXISTS business_profiles_id_fkey;

-- 2. Re-attach FK to auth.users (cascade on user deletion)
ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- 3. Rename company_size → size  (preserves existing data)
ALTER TABLE public.business_profiles
  RENAME COLUMN company_size TO size;

-- 4. Add credits_balance for AI tools / job post purchases
ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 0;

-- 5. Drop columns that no longer belong in this table
ALTER TABLE public.business_profiles
  DROP COLUMN IF EXISTS bee_level,
  DROP COLUMN IF EXISTS is_verified;

-- 6. Relax NOT NULL on industry so the INSERT flow can be incremental
--    (business owner may fill industry after initial sign-up)
ALTER TABLE public.business_profiles
  ALTER COLUMN industry DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Clear any stale policies from the original migration before re-creating
DROP POLICY IF EXISTS "Users can update own business profile"   ON public.business_profiles;
DROP POLICY IF EXISTS "Public can view business names"          ON public.business_profiles;
DROP POLICY IF EXISTS "Businesses can insert own profile"       ON public.business_profiles;

-- Businesses can INSERT their own row on sign-up
CREATE POLICY "Businesses can insert own profile"
  ON public.business_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Businesses can UPDATE their own row only
CREATE POLICY "Users can update own business profile"
  ON public.business_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Everyone (including unauthenticated visitors) can read basic info
-- needed to display company names on public job listings
CREATE POLICY "Public can view business names"
  ON public.business_profiles
  FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- credits_balance guard function
--
-- Safely deducts credits atomically.
-- Returns TRUE on success, FALSE if balance would go negative.
-- Use from trusted server context (Edge Functions, background jobs).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_credits(
  business_id UUID,
  amount      INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT credits_balance INTO current_balance
  FROM public.business_profiles
  WHERE id = business_id
  FOR UPDATE;  -- row-level lock prevents race conditions

  IF current_balance IS NULL OR current_balance < amount THEN
    RETURN false;
  END IF;

  UPDATE public.business_profiles
  SET credits_balance = credits_balance - amount
  WHERE id = business_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_credits(UUID, INTEGER) TO authenticated;
