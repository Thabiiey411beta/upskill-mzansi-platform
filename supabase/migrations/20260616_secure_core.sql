CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. PROFILES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID  REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name    TEXT  NOT NULL CHECK (char_length(full_name) >= 2),
  role         TEXT  NOT NULL DEFAULT 'job_seeker'
                     CHECK (role IN ('job_seeker', 'business_admin', 'platform_super_admin')),
  email        TEXT  NOT NULL UNIQUE
                     CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone_number TEXT  CHECK (phone_number ~* '^\+?[0-9]{10,15}$'),
  is_premium   BOOLEAN DEFAULT false NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 2. JOBS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT    NOT NULL CHECK (char_length(title) >= 3),
  company        TEXT    NOT NULL,
  location       TEXT    NOT NULL,
  province       TEXT    NOT NULL
                         CHECK (province IN (
                           'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
                           'Free State', 'Limpopo', 'Mpumalanga', 'North West',
                           'Northern Cape', 'Remote'
                         )),
  type           TEXT    NOT NULL DEFAULT 'Full-time'
                         CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Learnership')),
  salary_min     NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  salary_max     NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  currency       TEXT    NOT NULL DEFAULT 'ZAR',
  sector         TEXT    NOT NULL,
  seta_alignment TEXT,
  description    TEXT    NOT NULL CHECK (char_length(description) >= 20),
  requirements   TEXT[]  NOT NULL DEFAULT '{}',
  posted_by      UUID    REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active      BOOLEAN DEFAULT true NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT check_salary_range CHECK (salary_max >= salary_min)
);

-- ── 3. APPLICATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id           UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id       UUID  REFERENCES public.jobs(id)     ON DELETE CASCADE NOT NULL,
  applicant_id UUID  REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status       TEXT  DEFAULT 'applied' NOT NULL
                     CHECK (status IN ('applied', 'reviewing', 'shortlisted', 'rejected', 'offered')),
  cv_url       TEXT  NOT NULL CHECK (cv_url ~* '^https?://[^\s/$.?#].[^\s]*$'),
  cover_letter TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_applicant_per_job UNIQUE (job_id, applicant_id)
);

-- ── 4. BUSINESS PROFILES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id                  UUID    REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  company_name        TEXT    NOT NULL CHECK (char_length(company_name) >= 2),
  registration_number TEXT    UNIQUE
                              CHECK (registration_number ~* '^[0-9]{4}/[0-9]{6}/[0-9]{2}$'),
  industry            TEXT    NOT NULL,
  company_size        TEXT    NOT NULL CHECK (company_size IN ('1-10', '11-50', '51-200', '201+')),
  bee_level           INTEGER DEFAULT 4 CHECK (bee_level BETWEEN 1 AND 8),
  is_verified         BOOLEAN DEFAULT false NOT NULL,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 5. AUTH TRIGGER — auto-create profile on signup ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Mzansi User'),
    NEW.email,
    'job_seeker'
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent: safe if row already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_sync();

-- ── 6. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Allow public read access to profiles"          ON public.profiles;
DROP POLICY IF EXISTS "Allow individual write on own profile"         ON public.profiles;
CREATE POLICY "Allow public read access to profiles"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow individual write on own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs
DROP POLICY IF EXISTS "Allow global read on active jobs"              ON public.jobs;
DROP POLICY IF EXISTS "Allow verified admins/businesses to post jobs" ON public.jobs;
CREATE POLICY "Allow global read on active jobs"
  ON public.jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Allow verified admins/businesses to post jobs"
  ON public.jobs FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('business_admin', 'platform_super_admin')
    )
  );

-- Applications
DROP POLICY IF EXISTS "Applicants view own applications"              ON public.applications;
DROP POLICY IF EXISTS "Job posters view their applicants"             ON public.applications;
DROP POLICY IF EXISTS "Authenticated users can apply"                 ON public.applications;
CREATE POLICY "Applicants view own applications"
  ON public.applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Job posters view their applicants"
  ON public.applications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id
        AND jobs.posted_by = auth.uid()
    )
  );
CREATE POLICY "Authenticated users can apply"
  ON public.applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Business profiles — base policies (further evolved in 20260619_business_profiles_v2.sql)
DROP POLICY IF EXISTS "Allow public read access to business profiles" ON public.business_profiles;
CREATE POLICY "Allow public read access to business profiles"
  ON public.business_profiles FOR SELECT USING (true);

-- ── 7. PERFORMANCE INDICES ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_province       ON public.jobs(province);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active      ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_sector         ON public.jobs(sector);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_job    ON public.applications(job_id);
