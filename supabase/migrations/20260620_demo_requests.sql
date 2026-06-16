-- ─────────────────────────────────────────────────────────────────────────────
-- demo_requests
--   Lead-gen form submissions from the BusinessSolutions landing page.
--   Anyone (including unauthenticated visitors) can INSERT.
--   Only platform_super_admin can SELECT (read the leads pipeline).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT    NOT NULL,
  contact_name TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  phone        TEXT,
  industry     TEXT,
  size         TEXT,
  message      TEXT,
  created_at   TIMESTAMP WITH TIME ZONE
               DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Public INSERT so unauthenticated visitors can submit the lead-gen form
CREATE POLICY "Anyone can submit a demo request"
  ON public.demo_requests
  FOR INSERT
  WITH CHECK (true);

-- Only platform admins can read the leads pipeline
CREATE POLICY "Admins read demo requests"
  ON public.demo_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'platform_super_admin'
    )
  );
