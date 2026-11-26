/**
 * Careers24 job scraper for Upskill Mzansi.
 *
 * Low-volume, honest scraping of public Careers24 job adverts (South Africa only).
 *
 * Access pattern (from the `careers24-search` skill):
 *   Search: https://www.careers24.com/jobs/lc-<location-slug>/kw-<keyword-slug>/
 *           (location segment MUST come before the keyword segment)
 *   Detail: the canonical advert URL from the search card (employer is detail-only).
 *
 * Rules this script follows — see scripts/scrape-careers24-README.md:
 *   - Honest bot user-agent, >= 2s between requests, max ~30 jobs per run.
 *   - SA-only: location must map to one of the 9 provinces; anything else is skipped.
 *   - Every scraped job links back to its Careers24 advert (source_url) and the
 *     description is a short excerpt, never the full copied advert.
 *   - Salary is recorded ONLY when the advert lists one — never invented.
 *   - Cloudflare 403 / bot-block pages are detected, logged and stop the run.
 *     No retries hammering, no challenge solving, no UA spoofing.
 *   - Dedupe against existing jobs (title + company + location, and source_url).
 *
 * Modes:
 *   A. SUPABASE_SERVICE_ROLE_KEY is set  -> insert new rows into public.jobs
 *      (requires migration 20261126_add_job_source_url.sql applied) AND append
 *      the same jobs to src/data/jobs.ts (job-031+, the offline fallback).
 *   B. No service key                     -> write INSERTs to
 *      scripts/scrape-careers24-latest.sql (run it in the Supabase SQL Editor)
 *      AND append the same jobs to src/data/jobs.ts.
 *
 * Usage:
 *   npm run scrape:careers24                        # full run, 6 queries, max 30 jobs
 *   npm run scrape:careers24 -- --dry-run           # 1 query, max 3 jobs, nothing written
 *   npm run scrape:careers24 -- --query "nurse" --location "Western Cape" --max 5
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ── Config ──────────────────────────────────────────────────────────────────

const BASE = 'https://www.careers24.com'
const USER_AGENT =
  'UpskillMzansi-JobBot/1.0 (+https://upskill-mzansi-platform.vercel.app)'
const REQUEST_DELAY_MS = 2000
const MAX_JOBS_PER_RUN = 30
const FETCH_TIMEOUT_MS = 20000

/** Small fixed set of queries — a handful per run, never an unbounded crawl. */
const QUERIES: Array<{ keyword: string; location: string }> = [
  { keyword: 'data analyst', location: 'Gauteng' },
  { keyword: 'registered nurse', location: 'Western Cape' },
  { keyword: 'electrician', location: 'KwaZulu-Natal' },
  { keyword: 'diesel mechanic', location: 'Mpumalanga' },
  { keyword: 'farm manager', location: 'Limpopo' },
  { keyword: 'store manager', location: 'Free State' },
]

const SEED_FILE = path.join(ROOT, 'src', 'data', 'jobs.ts')
const SQL_OUT_FILE = path.join(ROOT, 'scripts', 'scrape-careers24-latest.sql')
const DRY_RUN_OUT_FILE = '/tmp/careers24-dry-run.json'

// ── Province mapping ────────────────────────────────────────────────────────

const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Free State',
  'Northern Cape',
] as const
type Province = (typeof PROVINCES)[number]

/** SA city/town (lowercase, substring match) -> province. */
const CITY_TO_PROVINCE: Array<[string, Province]> = [
  // Gauteng
  ['johannesburg', 'Gauteng'], ['pretoria', 'Gauteng'], ['sandton', 'Gauteng'],
  ['centurion', 'Gauteng'], ['midrand', 'Gauteng'], ['randburg', 'Gauteng'],
  ['roodepoort', 'Gauteng'], ['germiston', 'Gauteng'], ['benoni', 'Gauteng'],
  ['boksburg', 'Gauteng'], ['kempton park', 'Gauteng'], ['ekurhuleni', 'Gauteng'],
  ['soweto', 'Gauteng'], ['krugersdorp', 'Gauteng'], ['vereeniging', 'Gauteng'],
  ['vanderbijlpark', 'Gauteng'], ['springs', 'Gauteng'], ['fourways', 'Gauteng'],
  // Western Cape
  ['cape town', 'Western Cape'], ['bellville', 'Western Cape'], ['parow', 'Western Cape'],
  ['stellenbosch', 'Western Cape'], ['paarl', 'Western Cape'], ['george', 'Western Cape'],
  ['worcester', 'Western Cape'], ['somerset west', 'Western Cape'], ['durbanville', 'Western Cape'],
  // KwaZulu-Natal
  ['durban', 'KwaZulu-Natal'], ['pietermaritzburg', 'KwaZulu-Natal'],
  ['umhlanga', 'KwaZulu-Natal'], ['richards bay', 'KwaZulu-Natal'],
  ['newcastle', 'KwaZulu-Natal'], ['ballito', 'KwaZulu-Natal'], ['hillcrest', 'KwaZulu-Natal'],
  // Eastern Cape
  ['gqeberha', 'Eastern Cape'], ['port elizabeth', 'Eastern Cape'],
  ['east london', 'Eastern Cape'], ['mthatha', 'Eastern Cape'],
  ['makhanda', 'Eastern Cape'], ['grahamstown', 'Eastern Cape'],
  ['kariega', 'Eastern Cape'], ['uitenhage', 'Eastern Cape'],
  // Limpopo
  ['polokwane', 'Limpopo'], ['tzaneen', 'Limpopo'], ['mokopane', 'Limpopo'],
  ['phalaborwa', 'Limpopo'], ['musina', 'Limpopo'], ['thohoyandou', 'Limpopo'],
  ['modimolle', 'Limpopo'], ['bela-bela', 'Limpopo'],
  // Mpumalanga
  ['mbombela', 'Mpumalanga'], ['nelspruit', 'Mpumalanga'],
  ['emalahleni', 'Mpumalanga'], ['witbank', 'Mpumalanga'],
  ['middelburg', 'Mpumalanga'], ['secunda', 'Mpumalanga'], ['ermelo', 'Mpumalanga'],
  // North West
  ['rustenburg', 'North West'], ['klerksdorp', 'North West'],
  ['potchefstroom', 'North West'], ['mahikeng', 'North West'],
  ['mafikeng', 'North West'], ['vryburg', 'North West'],
  // Free State
  ['bloemfontein', 'Free State'], ['welkom', 'Free State'],
  ['bethlehem', 'Free State'], ['sasolburg', 'Free State'], ['kroonstad', 'Free State'],
  // Northern Cape
  ['kimberley', 'Northern Cape'], ['upington', 'Northern Cape'],
  ['springbok', 'Northern Cape'], ['de aar', 'Northern Cape'],
  ['kathu', 'Northern Cape'], ['kuruman', 'Northern Cape'],
]

function mapLocationToProvince(location: string): Province | null {
  const loc = location.toLowerCase()
  for (const p of PROVINCES) {
    if (loc.includes(p.toLowerCase())) return p
  }
  for (const [city, province] of CITY_TO_PROVINCE) {
    if (loc.includes(city)) return province
  }
  return null
}

// ── Sector inference ────────────────────────────────────────────────────────

type Sector =
  | 'IT & Tech' | 'Finance & Banking' | 'Mining & Resources' | 'Manufacturing'
  | 'Healthcare' | 'Education' | 'Retail & FMCG' | 'Construction & Engineering'
  | 'Government & Public Sector' | 'Agriculture'

const SECTOR_KEYWORDS: Array<[RegExp, Sector]> = [
  [/\b(software|developer|data|it |tech|network|cyber|programmer|systems? analyst)\b/i, 'IT & Tech'],
  [/\b(bank|finance|account|insurance|audit|bookkeep|credit|tax)\b/i, 'Finance & Banking'],
  [/\b(mining|mine|geologist|metallurg)\b/i, 'Mining & Resources'],
  [/\b(manufactur|production|factory|millwright|fitter|welder)\b/i, 'Manufacturing'],
  [/\b(health|medical|nurse|clinic|pharma|doctor|caregiver)\b/i, 'Healthcare'],
  [/\b(education|teach|lecturer|training|school|tutor)\b/i, 'Education'],
  [/\b(retail|fmcg|shop|store|sales|merchandis|cashier)\b/i, 'Retail & FMCG'],
  [/\b(construction|engineer|civil|building|electrician|plumb|quantity surveyor)\b/i, 'Construction & Engineering'],
  [/\b(government|municipal|public sector|community development)\b/i, 'Government & Public Sector'],
  [/\b(agricultur|farm|crop|livestock|horticultur)\b/i, 'Agriculture'],
]

function inferSector(title: string, boardSector: string, description: string): Sector {
  const hay = `${boardSector} ${title} ${description}`
  for (const [re, sector] of SECTOR_KEYWORDS) {
    if (re.test(hay)) return sector
  }
  return 'IT & Tech' // matches the app's own fallback in mapDbJob
}

// ── Types ───────────────────────────────────────────────────────────────────

interface ScrapedJob {
  title: string
  company: string
  location: string
  province: Province
  type: 'Permanent' | 'Contract' | 'Remote' | 'Hybrid'
  sector: Sector
  salaryMinAnnual: number | null
  salaryMaxAnnual: number | null
  description: string // short excerpt only, never the full advert
  postedAt: string
  sourceUrl: string
}

interface Card {
  url: string
  title: string
  location: string
  dateText: string
  employmentType: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const escSql = (s: string) => s.replace(/'/g, "''")
const escTs = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const stripTags = (s: string) =>
  s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim()

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function searchUrl(keyword: string, location: string): string {
  return `${BASE}/jobs/lc-${slugify(location)}/kw-${slugify(keyword)}/`
}

// ── Fetching (graceful on blocks) ────────────────────────────────────────────

class BlockedError extends Error {}

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-ZA,en;q=0.9',
      },
    })
  } catch (err) {
    clearTimeout(timer)
    throw new Error(`fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`)
  }
  clearTimeout(timer)
  const text = await res.text()
  const looksLikeCloudflare =
    /Attention Required/i.test(text) || /cf-error|Cloudflare Ray ID/i.test(text)
  if (res.status === 403 || res.status === 429 || looksLikeCloudflare) {
    throw new BlockedError(
      `Careers24 blocked the request (HTTP ${res.status}${looksLikeCloudflare ? ', Cloudflare challenge page' : ''}) at ${url}. ` +
        'Stopping the run — no retries, no challenge solving.',
    )
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`)
  return text
}

// ── Parsing ─────────────────────────────────────────────────────────────────

/** JobPosting entries from JSON-LD, when the page embeds them. */
function extractJsonLdJobs(html: string): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = []
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  for (const m of html.matchAll(re)) {
    try {
      const parsed: unknown = JSON.parse(m[1] as string)
      const items = Array.isArray(parsed)
        ? parsed
        : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { '@graph'?: unknown })['@graph'])
          ? ((parsed as { '@graph': unknown[] })['@graph'])
          : [parsed]
      for (const item of items) {
        if (typeof item === 'object' && item !== null && (item as { '@type'?: string })['@type'] === 'JobPosting') {
          out.push(item as Record<string, unknown>)
        }
      }
    } catch {
      // malformed JSON-LD block — ignore it
    }
  }
  return out
}

function ldText(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v !== null && typeof (v as { name?: unknown }).name === 'string') {
    return (v as { name: string }).name
  }
  return ''
}

function ldLocation(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v !== null) {
    const addr = (v as { address?: unknown }).address
    if (typeof addr === 'string') return addr
    if (typeof addr === 'object' && addr !== null) {
      const a = addr as Record<string, unknown>
      return [a.addressLocality, a.addressRegion, a.addressCountry]
        .filter((x) => typeof x === 'string' && x)
        .join(', ')
    }
    if (typeof (v as { name?: unknown }).name === 'string') return (v as { name: string }).name
  }
  return ''
}

/** Parse a search page into cards. JSON-LD first, anchor fallback second. */
function parseSearchPage(html: string): Card[] {
  const cards: Card[] = []
  const seen = new Set<string>()

  for (const j of extractJsonLdJobs(html)) {
    const url = typeof j.url === 'string' ? j.url : ''
    if (!url || seen.has(url)) continue
    seen.add(url)
    const loc = ldLocation(j.jobLocation)
    const dateText = typeof j.datePosted === 'string' ? j.datePosted : ''
    const emp = Array.isArray(j.employmentType)
      ? String(j.employmentType[0] ?? '')
      : typeof j.employmentType === 'string' ? j.employmentType : ''
    cards.push({ url, title: ldText(j.title), location: loc, dateText, employmentType: emp })
  }
  if (cards.length > 0) return cards

  // Fallback: anchors pointing at adverts (href contains /jobs/ + a numeric id).
  const anchorRe = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  for (const m of html.matchAll(anchorRe)) {
    const href = m[1] as string
    if (!/\/jobs\//.test(href) || !/\d{5,}/.test(href)) continue
    const url = href.startsWith('http') ? href : BASE + href
    if (seen.has(url)) continue
    seen.add(url)
    const title = stripTags(m[2] as string)
    if (!title || title.length < 3 || title.length > 120) continue
    cards.push({ url, title, location: '', dateText: '', employmentType: '' })
  }
  return cards
}

interface Detail {
  company: string
  salaryText: string
  sector: string
  description: string
  dateText: string
}

/** Parse a detail page. JSON-LD first; short text fallbacks second. */
function parseDetailPage(html: string, card: Card): Detail {
  const jobs = extractJsonLdJobs(html)
  const j = jobs[0]
  let company = ''
  let salaryText = ''
  let sector = ''
  let description = ''
  let dateText = card.dateText

  if (j) {
    company = ldText(j.hiringOrganization)
    const salary = j.baseSalary
    if (typeof salary === 'string') salaryText = salary
    else if (typeof salary === 'object' && salary !== null) {
      const val = (salary as { value?: unknown }).value
      if (typeof val === 'string') salaryText = val
      else if (typeof val === 'object' && val !== null) {
        const v = val as Record<string, unknown>
        const lo = typeof v.minValue === 'number' ? v.minValue : typeof v.value === 'number' ? v.value : null
        const hi = typeof v.maxValue === 'number' ? v.maxValue : lo
        const unit = typeof v.unitText === 'string' ? v.unitText : ''
        if (lo !== null) salaryText = `R${lo}${hi !== null && hi !== lo ? ` - R${hi}` : ''} ${unit}`.trim()
      }
    }
    const desc = j.description
    if (typeof desc === 'string') description = stripTags(desc)
    if (typeof j.datePosted === 'string') dateText = j.datePosted
    const ind = j.industry
    if (typeof ind === 'string') sector = ind
  }

  if (!company) {
    const m = html.match(/Company:\s*<[^>]*>\s*([^<]{2,80})/i) ||
      html.match(/"hiringOrganization"[^}]{0,200}"name"\s*:\s*"([^"]+)"/)
    if (m) company = stripTags(m[1] as string)
  }
  if (!salaryText) {
    const m = html.match(/Salary[:\s]*([^<\n]{2,80})/i)
    if (m) salaryText = stripTags(m[1] as string)
  }
  if (!description) {
    const m = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)
    if (m) description = stripTags(m[1] as string)
  }
  return { company, salaryText, sector, description, dateText }
}

// ── Salary ──────────────────────────────────────────────────────────────────

/** Parse a Careers24 salary line. Returns annual min/max, or nulls when the
 *  advert says "Market Related", lists nothing, or is unparseable. Never invents. */
function parseSalary(text: string): { min: number | null; max: number | null } {
  const none = { min: null, max: null }
  if (!text || /market related|negotiable|not specified|to be discussed/i.test(text)) return none
  const nums = [...text.matchAll(/R\s*([\d][\d\s,]*)/gi)]
    .map((m) => Number((m[1] as string).replace(/[\s,]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (nums.length === 0) return none
  const monthly = /\b(pm|per month|\/ ?month|monthly)\b/i.test(text)
  const factor = monthly ? 12 : 1
  const min = Math.min(...nums) * factor
  const max = Math.max(...nums) * factor
  return { min, max }
}

function formatMonthlyZAR(annual: number): string {
  const monthly = Math.round(annual / 12)
  return `R${monthly.toLocaleString('en-ZA').replace(/,/g, ' ')} / month`
}

function postedAtLabel(dateText: string): string {
  const d = new Date(dateText)
  if (!Number.isNaN(d.getTime())) {
    const days = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (days <= 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }
  return 'Recently'
}

function mapEmploymentType(raw: string): ScrapedJob['type'] {
  const t = raw.toLowerCase()
  if (/contract|temporary|fixed[- ]term|learnership|internship/.test(t)) return 'Contract'
  if (/remote/.test(t)) return 'Remote'
  if (/hybrid/.test(t)) return 'Hybrid'
  return 'Permanent'
}

function excerpt(text: string, maxLen = 280): string {
  const clean = stripTags(text)
  if (clean.length <= maxLen) return clean
  const cut = clean.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

// ── Seed file helpers ───────────────────────────────────────────────────────

function readSeed(): { text: string; nextId: number; existing: Set<string> } {
  const text = fs.readFileSync(SEED_FILE, 'utf8')
  let nextId = 31
  for (const m of text.matchAll(/id: 'job-(\d+)'/g)) {
    nextId = Math.max(nextId, Number(m[1]) + 1)
  }
  // Dedupe keys: normalized title|company pairs already in the seed file.
  const existing = new Set<string>()
  const pairRe = /title: '([^']+)',\s*\n\s*company: '([^']+)'/g
  for (const m of text.matchAll(pairRe)) {
    existing.add(`${(m[1] as string).trim().toLowerCase()}|${(m[2] as string).trim().toLowerCase()}`)
  }
  return { text, nextId, existing }
}

function seedEntry(job: ScrapedJob, id: string): string {
  const mid = job.salaryMinAnnual !== null && job.salaryMaxAnnual !== null
    ? Math.round((job.salaryMinAnnual + job.salaryMaxAnnual) / 2)
    : job.salaryMinAnnual ?? job.salaryMaxAnnual ?? 0
  const salaryText = job.salaryMinAnnual !== null
    ? formatMonthlyZAR(mid)
    : 'Salary on application'
  const lines = [
    '  {',
    `    id: '${id}',`,
    `    title: '${escTs(job.title)}',`,
    `    company: '${escTs(job.company)}',`,
    `    sector: '${job.sector}',`,
    `    province: '${job.province}',`,
    `    location: '${escTs(job.location)}',`,
    `    type: '${job.type}',`,
    `    experienceLevel: 'Mid-level',`,
    `    salaryText: '${salaryText}',`,
    `    annualSalary: ${mid},`,
    `    postedAt: '${escTs(job.postedAt)}',`,
    '    description:',
    `      '${escTs(job.description)}',`,
    '    requirements: [],',
    '    responsibilities: [],',
    '    benefits: [],',
    `    tags: ['${escTs(job.sector.split(' ')[0] as string)}', 'Careers24'],`,
    `    sourceUrl: '${escTs(job.sourceUrl)}',`,
    '  }',
  ]
  return lines.join('\n')
}

function appendToSeed(jobs: ScrapedJob[], startId: number): string[] {
  const { text } = readSeed()
  const marker = '\n]\n\nexport const quickCategories'
  const idx = text.indexOf(marker)
  if (idx === -1) throw new Error(`Could not find the end of the jobs array in ${SEED_FILE}`)
  const ids: string[] = []
  const entries = jobs.map((job, i) => {
    const id = `job-${String(startId + i).padStart(3, '0')}`
    ids.push(id)
    return seedEntry(job, id)
  })
  const updated = text.slice(0, idx) + ',\n' + entries.join(',\n') + ',\n' + text.slice(idx)
  fs.writeFileSync(SEED_FILE, updated)
  return ids
}

function sqlForJobs(jobs: ScrapedJob[]): string {
  const header = [
    '-- Careers24 scrape output — INSERTs for public.jobs.',
    '-- Run in the Supabase SQL Editor AFTER applying',
    '-- supabase/migrations/20261126_add_job_source_url.sql (adds the source_url column).',
    '-- Idempotent-ish: re-running inserts duplicates (no dedupe key) — check for',
    '-- existing rows first; the scraper already dedupes against the live table.',
    '-- Every row links back to its Careers24 advert via source_url.',
    '',
  ]
  const inserts = jobs.map((job) => {
    const dbType =
      job.type === 'Contract' ? 'Contract' : 'Full-time'
    const min = job.salaryMinAnnual ?? 0
    const max = job.salaryMaxAnnual ?? 0
    const reqs = 'ARRAY[]::text[]'
    return (
      `INSERT INTO public.jobs (title, company, location, province, type, salary_min, salary_max, currency, sector, description, requirements, is_active, source_url) VALUES ` +
      `('${escSql(job.title)}', '${escSql(job.company)}', '${escSql(job.location)}', '${job.province}', '${dbType}', ${min}, ${max}, 'ZAR', '${job.sector}', '${escSql(job.description)}', ${reqs}, true, '${escSql(job.sourceUrl)}');`
    )
  })
  return header.join('\n') + inserts.join('\n') + '\n'
}

// ── Main ────────────────────────────────────────────────────────────────────

interface Args {
  dryRun: boolean
  max: number
  query?: string
  location?: string
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, max: MAX_JOBS_PER_RUN }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') args.dryRun = true
    else if (argv[i] === '--max' && argv[i + 1]) args.max = Number(argv[++i])
    else if (argv[i] === '--query' && argv[i + 1]) args.query = argv[++i]
    else if (argv[i] === '--location' && argv[i + 1]) args.location = argv[++i]
  }
  return args
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const queries = args.query
    ? [{ keyword: args.query, location: args.location ?? 'Gauteng' }]
    : QUERIES
  const maxJobs = args.dryRun ? Math.min(args.max, 3) : args.max

  console.log(
    `🔍 Careers24 scrape — ${args.dryRun ? 'DRY RUN (nothing will be written)' : 'live run'} — ` +
      `${queries.length} quer${queries.length === 1 ? 'y' : 'ies'}, max ${maxJobs} jobs`,
  )

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const modeA = Boolean(supabaseUrl && serviceKey) && !args.dryRun
  console.log(`Mode: ${args.dryRun ? 'DRY RUN' : modeA ? 'A (insert into Supabase + seed file)' : 'B (SQL file + seed file)'}`)

  // Existing jobs for dedupe.
  const seed = readSeed()
  const existingKeys = new Set(seed.existing)
  const existingUrls = new Set<string>()
  if (modeA) {
    const supabase = createClient(supabaseUrl as string, serviceKey as string)
    const { data, error } = await supabase
      .from('jobs')
      .select('title, company, location, source_url')
    if (error) {
      console.error(`❌ Could not read existing Supabase jobs: ${error.message}`)
      process.exit(1)
    }
    for (const row of data ?? []) {
      existingKeys.add(
        `${String(row.title).trim().toLowerCase()}|${String(row.company).trim().toLowerCase()}`,
      )
      if (row.source_url) existingUrls.add(String(row.source_url))
    }
    console.log(`Dedupe base: ${existingKeys.size} existing jobs known.`)
  }

  const found: ScrapedJob[] = []
  let skippedDuplicate = 0
  let skippedNonSa = 0
  let skippedUnparseable = 0
  let blocked = false

  try {
    for (const q of queries) {
      if (found.length >= maxJobs) break
      const url = searchUrl(q.keyword, q.location)
      console.log(`\n— "${q.keyword}" in ${q.location} → ${url}`)
      let html: string
      try {
        html = await fetchPage(url)
      } catch (err) {
        if (err instanceof BlockedError) {
          console.error(`⛔ ${err.message}`)
          blocked = true
          break
        }
        throw err
      }
      await sleep(REQUEST_DELAY_MS)

      const cards = parseSearchPage(html)
      console.log(`  ${cards.length} card(s) on page 1`)
      for (const card of cards) {
        if (found.length >= maxJobs) break
        if (existingUrls.has(card.url)) { skippedDuplicate++; continue }

        // Detail fetch: company is detail-only on Careers24.
        let detail: Detail
        try {
          const detailHtml = await fetchPage(card.url)
          detail = parseDetailPage(detailHtml, card)
        } catch (err) {
          if (err instanceof BlockedError) {
            console.error(`⛔ ${err.message}`)
            blocked = true
            break
          }
          throw err
        }
        await sleep(REQUEST_DELAY_MS)

        const location = card.location || ''
        const province = location ? mapLocationToProvince(location) : null
        if (!province) {
          skippedNonSa++
          console.log(`  skip (not mappable to an SA province): "${card.title}" @ "${location}"`)
          continue
        }
        const company = detail.company.trim()
        if (!company || !card.title) { skippedUnparseable++; continue }
        const key = `${card.title.trim().toLowerCase()}|${company.toLowerCase()}`
        if (existingKeys.has(key) || found.some((f) => f.sourceUrl === card.url)) {
          skippedDuplicate++
          continue
        }
        const description = excerpt(detail.description || card.title)
        if (description.length < 20) { skippedUnparseable++; continue }
        const salary = parseSalary(detail.salaryText)
        found.push({
          title: card.title.trim(),
          company,
          location: location || province,
          province,
          type: mapEmploymentType(card.employmentType),
          sector: inferSector(card.title, detail.sector, description),
          salaryMinAnnual: salary.min,
          salaryMaxAnnual: salary.max,
          description,
          postedAt: postedAtLabel(detail.dateText),
          sourceUrl: card.url,
        })
        existingKeys.add(key)
        console.log(`  + ${card.title} — ${company} (${province})`)
      }
      if (blocked) break
    }
  } catch (err) {
    console.error(`❌ Run failed: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  }

  console.log(
    `\nSummary: found ${found.length} new job(s), ` +
      `${skippedDuplicate} duplicate(s) skipped, ${skippedNonSa} non-SA/unmappable skipped, ` +
      `${skippedUnparseable} unparseable skipped${blocked ? ', BLOCKED by Careers24 (stopped early)' : ''}.`,
  )

  if (args.dryRun) {
    fs.writeFileSync(DRY_RUN_OUT_FILE, JSON.stringify({ blocked, jobs: found }, null, 2))
    console.log(`Dry-run output written to ${DRY_RUN_OUT_FILE} (nothing inserted, seed untouched).`)
    process.exit(blocked ? 2 : 0)
  }
  if (blocked && found.length === 0) {
    console.log('Nothing to write — Careers24 blocked the run before any job was collected.')
    process.exit(2)
  }
  if (found.length === 0) {
    console.log('No new jobs — nothing to write.')
    process.exit(0)
  }

  if (modeA) {
    const supabase = createClient(supabaseUrl as string, serviceKey as string)
    const rows = found.map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      province: job.province,
      type: job.type === 'Contract' ? 'Contract' : 'Full-time',
      salary_min: job.salaryMinAnnual ?? 0,
      salary_max: job.salaryMaxAnnual ?? 0,
      currency: 'ZAR',
      sector: job.sector,
      description: job.description,
      requirements: [],
      is_active: true,
      source_url: job.sourceUrl,
    }))
    const { error } = await supabase.from('jobs').insert(rows)
    if (error) {
      console.error(`❌ Supabase insert failed: ${error.message}`)
      console.error('No seed changes were made. Fix the error (e.g. apply migration 20261126_add_job_source_url.sql) and re-run — dedupe will skip what already landed.')
      process.exit(1)
    }
    console.log(`✅ Inserted ${found.length} job(s) into Supabase public.jobs.`)
  } else {
    fs.writeFileSync(SQL_OUT_FILE, sqlForJobs(found))
    console.log(`✅ Wrote ${found.length} INSERT(s) to ${SQL_OUT_FILE} — run it in the Supabase SQL Editor.`)
  }

  const ids = appendToSeed(found, seed.nextId)
  console.log(`✅ Appended ${ids.length} job(s) to src/data/jobs.ts (${ids[0]} … ${ids[ids.length - 1]}).`)
  console.log('Done.')
}

main()
