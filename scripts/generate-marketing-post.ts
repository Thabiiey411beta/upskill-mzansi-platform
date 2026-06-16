/**
 * Background job: Generate a weekly Facebook marketing post draft.
 *
 * Usage:
 *   npm run marketing:post
 *
 * Requires in .env.local:
 *   VITE_GEMINI_API_KEY       — Gemini API key
 *   VITE_SUPABASE_URL         — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service-role key (bypasses RLS for insert)
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// ── Config ────────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY
const SUPABASE_URL   = process.env.VITE_SUPABASE_URL   || process.env.SUPABASE_URL
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing VITE_GEMINI_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the ISO Monday of the current week as YYYY-MM-DD. */
function currentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()                          // 0 = Sun … 6 = Sat
  const diff = now.getDate() - (day === 0 ? 6 : day - 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

// ── Gemini call ───────────────────────────────────────────────────────────────

const FACEBOOK_POST_PROMPT = `You are a social media manager for Upskill Mzansi, a South African career and skills development platform.

Write a single engaging Facebook post for this week. The post should:
- Be written in a warm, encouraging South African tone (mix of English is fine)
- Highlight one of these themes, rotating each week: learnerships, SETA funding, job searching tips, CV advice, or career growth
- Include 2–3 relevant emojis
- End with a clear call-to-action (e.g. "Visit upskillmzansi.co.za" or "Drop a comment below")
- Be between 80 and 150 words
- Include 3–5 relevant hashtags on the last line (e.g. #MzansiJobs #SETA #Upskill)

Return ONLY the post text. No explanation, no JSON, no markdown.`

async function generatePostWithGemini(): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

  const body = {
    contents: [{ parts: [{ text: FACEBOOK_POST_PROMPT }] }],
    generationConfig: { temperature: 0.85, maxOutputTokens: 300 },
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${detail}`)
  }

  const json = await res.json()
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('Gemini returned an empty response.')

  return text.trim()
}

// ── Duplicate guard ───────────────────────────────────────────────────────────

async function draftExistsForWeek(weekStart: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('marketing_content')
    .select('id', { count: 'exact', head: true })
    .eq('platform', 'facebook')
    .eq('week_start', weekStart)

  if (error) throw new Error(`Duplicate check failed: ${error.message}`)
  return (count ?? 0) > 0
}

// ── Save to Supabase ──────────────────────────────────────────────────────────

async function saveDraft(weekStart: string, postDraft: string): Promise<void> {
  const { error } = await supabase.from('marketing_content').insert({
    platform:     'facebook',
    post_draft:   postDraft,
    week_start:   weekStart,
    generated_by: 'gemini-2.0-flash',
    status:       'draft',
  })

  if (error) throw new Error(`Failed to save draft: ${error.message}`)
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function run() {
  const weekStart = currentWeekStart()
  console.log(`📅 Week starting: ${weekStart}`)

  const exists = await draftExistsForWeek(weekStart)
  if (exists) {
    console.log('ℹ️  A Facebook draft already exists for this week. Skipping generation.')
    return
  }

  console.log('🤖 Calling Gemini to generate post draft...')
  const draft = await generatePostWithGemini()

  console.log('\n── Draft ─────────────────────────────────────')
  console.log(draft)
  console.log('──────────────────────────────────────────────\n')

  await saveDraft(weekStart, draft)
  console.log('✅ Draft saved to marketing_content table.')
}

run().catch(err => {
  console.error('❌ Job failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
