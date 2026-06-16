-- ─────────────────────────────────────────────────────────────
-- 1. marketing_content table
--    Stores AI-generated weekly social media post drafts.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_content (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  platform    TEXT    NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'instagram')),
  post_draft  TEXT    NOT NULL,
  week_start  DATE    NOT NULL,                        -- ISO week Monday
  generated_by TEXT   NOT NULL DEFAULT 'gemini-2.0',
  status      TEXT    NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'approved', 'published')),
  created_at  TIMESTAMP WITH TIME ZONE
              DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;

-- Platform admins can read and manage all drafts; public cannot.
CREATE POLICY "Admins manage marketing content"
  ON public.marketing_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'platform_super_admin'
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 2. is_premium(user_id) — subscription gate function
--
--    Returns TRUE when the profile row has is_premium = true.
--    SECURITY DEFINER lets it bypass RLS for safe server-side
--    calls (e.g. Edge Functions, background jobs).
--    Call from the client:  SELECT public.is_premium(auth.uid())
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_premium(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_premium FROM public.profiles WHERE id = user_id),
    false
  );
$$;

-- Grant execution to authenticated users so the client SDK
-- can call it via supabase.rpc('is_premium', { user_id })
GRANT EXECUTE ON FUNCTION public.is_premium(UUID) TO authenticated;
