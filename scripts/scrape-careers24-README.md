# Careers24 scraper — `scripts/scrape-careers24.ts`

Low-volume scraper that pulls fresh South African job adverts from Careers24
(careers24.com) into Upskill Mzansi, so the listings stay current without
hand-writing every job.

## What it does

- Searches a small fixed set of 6 queries (one page each, 10 results/page):
  data analyst (Gauteng), registered nurse (Western Cape), electrician
  (KwaZulu-Natal), diesel mechanic (Mpumalanga), farm manager (Limpopo),
  store manager (Free State).
- Fetches each advert's detail page (the employer name only appears there),
  keeps at most ~30 new jobs per run.
- SA-only: a job is kept only if its location maps to one of the 9 provinces
  (city → province map in the script). Anything else is skipped.
- Every scraped job links back to its original Careers24 advert
  (`source_url`); the description stored is a short excerpt, never the full
  copied advert. Apply happens on Careers24 — the job modal shows an
  "Apply on Careers24" button only for jobs that have a `sourceUrl`.
- Salary is recorded ONLY if the advert lists one ("Market Related" or no
  salary → null, shown as "Salary on application"). Never invented.

## Low-volume / polite rules

- Honest user-agent: `UpskillMzansi-JobBot/1.0 (+https://upskill-mzansi-platform.vercel.app)`
- ≥ 2 seconds between requests; max 6 search + ~30 detail requests per run.
- Careers24's robots.txt disallows a named list of crawler user-agents
  (Scrapy, SemrushBot, Baiduspider, Yandex, …) with no `User-agent: *`
  group — this bot is not on that list.
- Cloudflare sometimes blocks automated fetches from datacenter IPs
  (HTTP 403, "Attention Required" page). The script detects that, logs it,
  stops the run immediately and exits code 2. It never retries in a loop,
  never solves challenges, never spoofs a browser UA. If a run is blocked,
  re-run it later or from a non-datacenter network — the
  `careers24-search` skill (bun CLI, same URL pattern) works from a normal
  machine, which proves the pattern itself is sound.

## Two modes

**Mode A — automatic (needs the service-role key).**
Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (alongside
`VITE_SUPABASE_URL`). The script inserts new rows into `public.jobs`
directly and appends the same jobs to `src/data/jobs.ts` (job-031+, the
offline fallback). First apply the migration that adds the link column:

```
supabase/migrations/20261126_add_job_source_url.sql
-- ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_url text;
```

> ⚠️ The service-role key is NOT on file yet (only the anon key is in
> `.env.local`). Until Newton adds it via the Secure Vault, every run uses
> Mode B. Never paste the key into chat or commit it.

**Mode B — manual (no key).**
The script writes `scripts/scrape-careers24-latest.sql` (INSERT statements
in the same style as `scripts/seed-jobs.sql`, plus the `source_url` column)
and appends the same jobs to `src/data/jobs.ts`. Run the SQL in the
Supabase SQL Editor (after applying the migration above) — the live site
reads Supabase first, so the new jobs appear without a redeploy. The seed
append keeps the offline fallback in sync.

Both modes dedupe against existing jobs (title + company + location, and
`source_url`), so re-running is safe.

## Usage

```bash
npm run scrape:careers24                        # full run, max 30 jobs
npm run scrape:careers24 -- --dry-run           # 1 query, max 3 jobs, writes only /tmp/careers24-dry-run.json
npm run scrape:careers24 -- --query "nurse" --location "Western Cape" --max 5
```

## Daily runs

Exact command for a daily run (e.g. a cron job, once a day, off-peak):

```bash
cd ~/workspace/upskill-mzansi-launch && npm run scrape:careers24
```

In Mode A that is the whole job — new adverts land in Supabase and the
seed file. In Mode B the cron can only do the seed-file half; the SQL file
still needs a human to run it in the Supabase SQL Editor, so schedule
Mode B runs only when someone is around to apply the SQL, or add the
service-role key to switch to Mode A.

## Link rot — re-verify stored apply links every run (28 Nov 2026 lesson)

Careers24 reuses advert IDs: an advert URL that was correct on scrape day
can later open a COMPLETELY DIFFERENT job, or redirect to a 0-result
search page when the advert expires. Checked 28 Nov 2026: of 30 stored
links, 18 matched, 6 opened a different job, 6 had expired — only 60%
were still right after 1–2 days. Never trust a stored `source_url`
without re-checking it.

Every daily run must, BEFORE inserting new jobs:
1. Re-open every active job's `source_url` in the cloud browser and
   compare the title/employer shown with the stored title/company.
2. Deactivate (`is_active = false`, never delete) any row whose link now
   shows a different job, redirects to a 0-result search, or is blocked —
   and remove the same job from `src/data/jobs.ts` so the fallback stays
   in sync.
3. Only then insert the new jobs. A job with no verified apply link does
   not go live: curated/no-source jobs are not listed at all.

The 28 Nov cleanup deactivated 13 bad Careers24 jobs + all 30 curated
no-source jobs, leaving 17 verified jobs live. The daily scraper refills
the site with fresh verified jobs (~15/day).

- `supabase/migrations/20261126_add_job_source_url.sql` — adds the column.
- `src/types.ts` — `Job.sourceUrl?: string`.
- `src/lib/jobsData.ts` — `mapDbJob` maps `source_url` → `sourceUrl`.
- `src/components/JobModal.tsx` — "Apply on Careers24 ↗" button, only when
  `sourceUrl` is present. `src/components/JobCard.tsx` — small "Source:
  Careers24 ↗" line, only when present. Curated jobs (no `sourceUrl`)
  display exactly as before.
