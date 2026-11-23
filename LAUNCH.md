# Upskill Mzansi — Launch Notes

> Last updated: 2026-11-23. Working copy of
> `github.com/Thabiiey411beta/upskill-mzansi-platform`.
> Build status: ✅ `npx tsc --noEmit` clean, `npm run build` passes.
> The app now runs end-to-end **without Supabase configured** (local mode).
>
> ## Supabase — LIVE 2026-11-23
> - Project **upskill-mzansi**, ref `nxysfwbclsokqeemqbsa`, Frankfurt (eu-central-1), Free plan, Healthy.
>   URL: https://nxysfwbclsokqeemqbsa.supabase.co — signed in via GitHub (thabangzulu94@gmail.com).
>   Note: Supabase offers no Google sign-in; the saved email/password for the account was rejected
>   ("Invalid login credentials") — GitHub sign-in is the working route. The older paused project
>   "Upskill" (slug upskill-mzansi-platform, eu-west-1) was left untouched.
> - All 5 migrations run via the SQL Editor and verified in the Table Editor: 7 tables live —
>   profiles, jobs, applications, business_profiles, marketing_content, whatsapp_messages, demo_requests.
>   Includes the `is_premium(UUID)` gate function and `deduct_credits(UUID, INTEGER)`.
> - Jobs seeded: `SELECT count(*) FROM public.jobs` = **18**. Seed SQL saved at `scripts/seed-jobs.sql`
>   (mapped to the migration schema; the old `npm run scrape` needs a service-role key and its
>   job types would fail the migration CHECK constraints, so use the seed file instead).
> - App wired: `.env.local` (gitignored, mode 600) holds `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
>   Build re-verified with it in place (tsc clean, build ~7s). Note: this VM cannot reach supabase.co
>   directly (connection times out), so live reads were verified in the dashboard, not from here —
>   the app loads live rows when deployed / run where Supabase is reachable.

## What works (verified in this working copy)

- **Build & types** — `npm install`, `tsc --noEmit`, `npm run build` all pass.
- **Home** (`/`) — hero search actually navigates to `/jobs` with the query
  applied; sector cards link to filtered job lists; stats and featured jobs are
  computed from the real seed data (no invented traction anywhere).
- **Jobs** (`/jobs`) — 18 curated seed roles with search + province/sector
  filters. Loads from Supabase `jobs` table when configured, falls back to the
  local seed catalogue otherwise (`src/lib/jobsData.ts`). Job detail modal
  with Save, AI Cover Letter and Apply (application recorded locally).
- **Upskilling** (`/upskilling`) — 3 SETA-aligned courses with working
  search + sector + province filters.
- **Profile** (`/profile`) — CV upload works offline (local parse + local
  storage); no longer a dead "Please log in" page.
- **Applications** (`/applications`) & **Saved Jobs** (`/saved`) — real,
  locally-recorded data only; previously showed invented applications.
- **Business** (`/business`) — ROI calculator, demo-request form. With no
  backend the request is queued locally and labelled as such.
- **Pricing** (`/pricing`) — NEW. Free / Premium **R49/mo** / Business
  **R299/mo**. All prices live in one config: `src/lib/pricing.ts`.
- **Premium gating** — `usePremium()` (Supabase `is_premium` RPC) now actually
  enforced: AI cover letters give every user 3 free generations, then show
  `<UpgradePrompt />` linking to `/pricing`. `requirePremium()` throws are
  caught by the modal, not left as bare errors.
- **Sidebar** — every link is a real route. Dead links (`/ai-hub`,
  `/companies`, `/settings`) removed; Pricing and Profile added.

## What still needs Newton (owner: Newton)

| # | Item | Why it blocks what |
|---|------|-------------------|
| 1 | **Supabase project** — create project, run `supabase/migrations/*.sql`, set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Real auth, Premium status, live jobs, demo-request delivery, CV storage. Until then everything above runs on local seed data + localStorage. |
| 2 | **Stripe onboarding** — finish onboarding on the "Publishers" account (`acct_1UegrEP9oMfuj7ZE`) until `charges_enabled` is true | Payments. The Pricing page currently collects waitlist emails only — there is deliberately no checkout, no Stripe product, and no price ID anywhere in the code. |
| 3 | **Gemini API key** — `VITE_GEMINI_API_KEY`, plus the `/api/ai/*` Edge Function the prompts in `src/lib/ai.ts` expect | Real AI cover letters, CV parsing and skills-gap analysis. Today those features run on local templates and are labelled as such. |
| 4 | **Seed the live jobs table** — `npm run scrape` after (1) | Otherwise the live site keeps showing the 18 seed roles. |
| 5 | **Content** — grow beyond 18 jobs / 3 courses; confirm the SETA links and course providers are current | The catalogue is thin for launch; 18 roles across 9 provinces looks empty. |

## What still needs a developer (owner: agent, after Newton does 1–3)

- **Real auth** — `src/contexts/AuthContext.tsx` is still a mock login
  (hard-coded user, no UI calls it). Replace with Supabase Auth (email link
  or magic link) once the project exists; then move applications, saved jobs
  and profiles from localStorage to Supabase tables.
- **Stripe wiring** — create Price IDs in Stripe (Premium R49/mo,
  R490/yr; Business R299/mo), store them as env vars, swap the Pricing-page
  waitlist CTA for Stripe Checkout links. Never hard-code price IDs.
- **Gemini Edge Function** — implement `/api/ai/*` (or a Supabase Edge
  Function) using the prompts in `src/lib/ai.ts`; the client helper
  `callAiEdge()` already expects that shape.
- **Employer job posting** — Business plan promises "post up to 5 jobs";
  no posting UI exists yet. Build it against the `jobs` table + credits
  (`deduct_credits` RPC exists in the migrations).
- **Bundle size** — the JS bundle is ~1.17 MB (334 kB gzip); code-split the
  heavy pages (Business, Home) with `React.lazy` before marketing spend.
- **WhatsApp webhook** — `supabase/functions/whatsapp-webhook` exists but
  was not exercised; needs `WHATSAPP_*` secrets set in Supabase before use.

## Honest gaps found in the audit (not fixed, or fixed by labelling)

- Premium was **never enforced anywhere** before this pass: `usePremium`
  existed but no component imported it. Now enforced on AI cover letters.
- `is_premium` is a boolean flag on `profiles` — there is no subscription
  table, no webhook, nothing that ever sets it to `true`. Stripe webhooks
  must flip it, or Premium can never be granted.
- `src/blink/client.ts` ships a hard-coded Blink publishable key and project
  ID as fallbacks. Publishable keys are public by design, but rotate/replace
  them if the Blink project is ever recreated.
- `CompanySize` bands disagree across files (`src/types.ts` uses
  `201-500`/`500+`; `src/lib/validations.ts` uses `201+`). The DB has no
  CHECK constraint, so nothing breaks — align them when auth lands.
- `src/main.ts` / `src/counter.ts` / `src/style.css` are leftover Vite
  template files, unused by the React app. Safe to delete.
- The Business page's "70% faster time-to-hire", "R80k+ per learner saved"
  and "5 pts B-BBEE uplift" figures are marketing claims, not measured data
  — treat them as claims to validate, not facts.

## Deploy steps (Vercel)

```bash
# 1. Push this working copy to GitHub (do NOT push .env.local — gitignored).
# 2. Vercel → Add New Project → import the repo.
#    Framework preset: Vite. Build command: npm run build.
#    Output directory: dist. Install command: npm install.
# 3. Environment variables (no secrets in the repo, ever):
#      VITE_SUPABASE_URL            (after Newton item 1)
#      VITE_SUPABASE_ANON_KEY       (after Newton item 1)
#      VITE_GEMINI_API_KEY          (after Newton item 3)
#    The site deploys and works WITHOUT these set (local mode) — add them
#    when the backends are ready, then redeploy.
# 4. Preview the deployment, click through /, /jobs, /pricing, /business.
# 5. Set the custom domain when ready (optional for launch).
```

## 1-week launch checklist

- [ ] **Day 1 — Newton:** create Supabase project; run the 5 migrations in
      `supabase/migrations/` in order; copy URL + anon key.
- [ ] **Day 1 — Newton:** finish Stripe onboarding until `charges_enabled`.
- [ ] **Day 2 — Agent:** set Vercel env vars, deploy preview, run
      `npm run scrape` to seed live jobs; verify `/jobs` shows Supabase rows.
- [ ] **Day 2 — Agent:** replace mock `AuthContext` with Supabase Auth.
- [ ] **Day 3 — Newton:** Gemini API key; agent wires the AI Edge Function.
- [ ] **Day 3 — Agent:** create Stripe Products/Prices (Premium R49/mo,
      R490/yr, Business R299/mo); swap waitlist CTA for Checkout.
- [ ] **Day 4 — Agent:** test end-to-end as a new user: sign up → free AI
      trial → upgrade prompt → (test-mode) checkout → `is_premium` flips.
- [ ] **Day 4 — Newton:** add at least 20 more real jobs + 7 more courses,
      or approve the seed catalogue as the launch set.
- [ ] **Day 5 — Newton:** announce: Binance Square post, TikTok/YouTube
      short, WhatsApp status. Point at the live URL.
- [ ] **Day 6–7:** watch for errors (Vercel logs), fix, and collect the
      first 10 waitlist emails as the launch cohort.

## Pricing rationale (summary)

Full reasoning lives in `src/lib/pricing.ts`. Short version: Premium R49/mo
stays under the R50 barrier for unemployed/low-income jobseekers (about a
takeaway meal; rival SA platforms charge R99–R199 for less). Business
R299/mo undercuts a single job-board listing (R500–R1,500) and a recruiter
(R10,000+ per hire). Both are launch prices — revisit only with real
conversion data.

## Fixes made in this pass (2026-11-23)

1. `src/vite-env.d.ts` (new) — `vite/client` types; fixed all
   `import.meta.env` and asset-import errors.
2. `src/types/database.types.ts` — added `Views` + `Relationships: []` per
   table (required by supabase-js ≥ 2.39, otherwise `.from()`/`.rpc()` typed
   as `never`); made `credits_balance` optional on insert (DB defaults 0);
   aligned `CompanySize` with `src/types.ts`.
3. `src/main.tsx` — removed nested `<BrowserRouter>` (App already provides
   one; nesting throws at runtime).
4. `src/lib/supabase.ts` — placeholder client values when unconfigured:
   **the app used to crash on load without env vars** (`createClient`
   throws on empty URL). Now it boots in local mode; added
   `isSupabaseConfigured`.
5. `src/pages/HomePage.tsx` — removed duplicate `cn` (type error); replaced
   invented stats (12,450+ jobs, 45,000+ users…) with seed-derived counts;
   featured jobs are real seed roles; search + sector cards navigate.
6. `tailwind.config.cjs` — defined the missing `navy`/`orange` colours;
   `bg-navy`/`bg-orange` buttons previously rendered unstyled.
7. `src/pages/Applications.tsx` — removed two invented applications.
8. New: `src/lib/pricing.ts`, `src/pages/PricingPage.tsx`,
   `src/components/UpgradePrompt.tsx`, `src/lib/jobsData.ts`.
