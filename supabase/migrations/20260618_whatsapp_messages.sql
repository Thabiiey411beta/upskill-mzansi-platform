-- ─────────────────────────────────────────────────────────────────────────────
-- whatsapp_messages
--   Audit log for every inbound WhatsApp message and the bot's reply.
--   Written by the Edge Function using the service-role key (bypasses RLS).
--   Only platform_super_admin users can read rows via the client SDK.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  from_number  TEXT    NOT NULL,                -- E.164 sender number, e.g. 27821234567
  user_message TEXT    NOT NULL,
  bot_reply    TEXT,                            -- NULL when send failed before a reply was generated
  status       TEXT    NOT NULL
               CHECK (status IN ('replied', 'gemini_error', 'send_error', 'skipped')),
  error_detail TEXT,                            -- populated on non-'replied' statuses
  created_at   TIMESTAMP WITH TIME ZONE
               DEFAULT timezone('utc', now()) NOT NULL
);

-- Index for analytics queries by sender and time
CREATE INDEX IF NOT EXISTS whatsapp_messages_from_number_idx
  ON public.whatsapp_messages (from_number);

CREATE INDEX IF NOT EXISTS whatsapp_messages_created_at_idx
  ON public.whatsapp_messages (created_at DESC);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Only platform super admins can query the log via the client SDK.
-- The Edge Function writes using the service-role key which bypasses RLS entirely.
CREATE POLICY "Admins read whatsapp messages"
  ON public.whatsapp_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'platform_super_admin'
    )
  );
