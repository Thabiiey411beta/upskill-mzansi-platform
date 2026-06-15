# Supabase integration notes

This document outlines the intended Supabase/Postgres schema and integration points used by Upskill-Mzansi.

Environment variables (use secrets, do NOT commit keys):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (or service role for server-side)

Tables to create (example SQL):

-- profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  data jsonb,
  cv_path text,
  created_at timestamptz DEFAULT now()
);

-- saved_jobs
CREATE TABLE saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  job_id text,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

-- applications
CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  job_id text,
  status text DEFAULT 'Pending',
  cover_letter text,
  created_at timestamptz DEFAULT now()
);

Security: implement Row Level Security (RLS) on user owned tables and only allow access for `auth.uid()` matches.

Edge functions: place LLM proxy endpoints under `supabase/functions/` or `src/api/ai/*` and call external LLM providers there. Keep keys server-side only.
