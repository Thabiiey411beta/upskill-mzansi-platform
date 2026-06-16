/**
 * Supabase Edge Function — WhatsApp Webhook (production-hardened)
 *
 * Security model:
 *   GET  — hub.challenge handshake: token equality check
 *   POST — HMAC-SHA256 signature verification against X-Hub-Signature-256
 *           before any payload is parsed or processed.
 *
 * Required Supabase secrets (supabase secrets set KEY=value):
 *   WHATSAPP_VERIFY_TOKEN    — string registered in Meta App Dashboard
 *   WHATSAPP_APP_SECRET      — Meta App Secret (used for HMAC signature)
 *   WHATSAPP_ACCESS_TOKEN    — Meta system-user / permanent access token
 *   WHATSAPP_PHONE_NUMBER_ID — WhatsApp Business phone number ID
 *   GEMINI_API_KEY           — Google AI Studio key
 *   SUPABASE_URL             — injected automatically by Supabase runtime
 *   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase runtime
 */

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Environment ───────────────────────────────────────────────────────────────

const VERIFY_TOKEN       = Deno.env.get('WHATSAPP_VERIFY_TOKEN')    ?? ''
const APP_SECRET         = Deno.env.get('WHATSAPP_APP_SECRET')      ?? ''
const WA_ACCESS_TOKEN    = Deno.env.get('WHATSAPP_ACCESS_TOKEN')    ?? ''
const WA_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? ''
const GEMINI_API_KEY     = Deno.env.get('GEMINI_API_KEY')           ?? ''
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')             ?? ''
const SUPABASE_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── HMAC-SHA256 signature verification ───────────────────────────────────────

/**
 * Verifies the X-Hub-Signature-256 header Meta attaches to every POST.
 * Uses a constant-time comparison (via WebCrypto HMAC verify) to prevent
 * timing side-channel attacks.
 *
 * Spec: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
async function verifyMetaSignature(
  rawBody: Uint8Array,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader?.startsWith('sha256=')) return false
  if (!APP_SECRET) {
    // APP_SECRET not configured — fail closed in production, log warning
    console.warn('⚠️  WHATSAPP_APP_SECRET not set. Signature verification skipped.')
    return false
  }

  const expectedHex = signatureHeader.slice('sha256='.length)

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, rawBody)
  const actualHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison: compare every character regardless of first mismatch
  if (actualHex.length !== expectedHex.length) return false
  let mismatch = 0
  for (let i = 0; i < actualHex.length; i++) {
    mismatch |= actualHex.charCodeAt(i) ^ expectedHex.charCodeAt(i)
  }
  return mismatch === 0
}

// ── Gemini ────────────────────────────────────────────────────────────────────

const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

const CAREER_SYSTEM_PROMPT = `You are Mzansi Career Assistant, a friendly career coach for South African job seekers.

Your expertise covers:
- Job searching across all nine South African provinces
- SETA-aligned learnerships (MICT, BANKSETA, merSETA, MQA, HWSETA, ETDP SETA, CETA, PSETA, AgriSETA)
- NQF levels, RPL, WSP/ATR funding, NSF bursaries, Section 12H incentives
- CV writing, cover letters, and interview preparation
- B-BBEE considerations and practical advice for unemployed youth and career changers

Guidelines:
- Reply in clear, warm English (brief Zulu/Sotho/Afrikaans phrases welcome)
- Keep replies under 1 000 characters — this is WhatsApp
- Redirect off-topic questions politely to career topics
- Never fabricate job listings, contacts, or official grant amounts
- End every reply with one concrete next step`

async function askGemini(userMessage: string): Promise<string> {
  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: CAREER_SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Gemini ${res.status}: ${detail}`)
  }

  const json = await res.json()
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned an empty candidates array.')
  return text.trim()
}

// ── WhatsApp Business API ─────────────────────────────────────────────────────

const WA_MESSAGES_URL = `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`

async function sendWhatsAppReply(to: string, body: string): Promise<void> {
  const res = await fetch(WA_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body },
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`WhatsApp send failed ${res.status}: ${detail}`)
  }
}

// ── Audit logging ─────────────────────────────────────────────────────────────

type LogStatus = 'replied' | 'gemini_error' | 'send_error' | 'skipped'

async function logMessage(
  from: string,
  userMessage: string,
  reply: string | null,
  status: LogStatus,
  errorDetail: string | null = null,
): Promise<void> {
  const { error } = await supabase.from('whatsapp_messages').insert({
    from_number:  from,
    user_message: userMessage,
    bot_reply:    reply,
    status,
    error_detail: errorDetail,
  })
  if (error) console.error('⚠️ Audit log failed:', error.message)
}

// ── Meta payload parser ───────────────────────────────────────────────────────

interface MetaTextMessage { from: string; id: string; body: string }

function extractTextMessage(payload: unknown): MetaTextMessage | null {
  try {
    const msg = (payload as any)?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
    if (!msg || msg.type !== 'text') return null
    const body: string = msg?.text?.body?.trim()
    if (!body) return null
    return { from: msg.from, id: msg.id, body }
  } catch {
    return null
  }
}

// ── OK response helper ────────────────────────────────────────────────────────

const OK = new Response(JSON.stringify({ status: 'ok' }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
})

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {

  // ── GET — Meta hub.challenge verification ──────────────────────────────────
  if (req.method === 'GET') {
    const p = new URL(req.url).searchParams
    if (
      p.get('hub.mode')         === 'subscribe' &&
      p.get('hub.verify_token') === VERIFY_TOKEN &&
      p.get('hub.challenge')
    ) {
      console.log('✅ Webhook verified.')
      return new Response(p.get('hub.challenge')!, { status: 200 })
    }
    console.warn('⛔ Verification failed — token mismatch or missing challenge.')
    return new Response('Forbidden', { status: 403 })
  }

  // ── POST — inbound message event ───────────────────────────────────────────
  if (req.method === 'POST') {
    // Read raw bytes once — needed for HMAC before JSON parse
    const rawBody = new Uint8Array(await req.arrayBuffer())

    // ── Security gate: verify Meta HMAC signature ──────────────────────────
    const signatureHeader = req.headers.get('x-hub-signature-256')
    const verified = await verifyMetaSignature(rawBody, signatureHeader)

    if (!verified) {
      console.error('⛔ Signature verification failed — request rejected.')
      // Return 200 to prevent Meta retry storms, but do not process
      return OK
    }

    // ── Parse payload ──────────────────────────────────────────────────────
    let payload: unknown
    try {
      payload = JSON.parse(new TextDecoder().decode(rawBody))
    } catch {
      console.error('❌ Could not parse request body as JSON.')
      return OK
    }

    const message = extractTextMessage(payload)

    // Non-text events (images, status updates, reactions) — acknowledge only
    if (!message) return OK

    console.log(`📩 ${message.from}: "${message.body}"`)

    // ── Call Gemini ────────────────────────────────────────────────────────
    let reply: string
    try {
      reply = await askGemini(message.body)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.error('❌ Gemini error:', detail)

      const fallback =
        "Sawubona! I'm having a moment of trouble. Please try again shortly. " +
        "For urgent career help visit upskillmzansi.co.za 🌟"

      try { await sendWhatsAppReply(message.from, fallback) } catch { /* best-effort */ }
      await logMessage(message.from, message.body, fallback, 'gemini_error', detail)
      return OK
    }

    // ── Send reply ─────────────────────────────────────────────────────────
    try {
      await sendWhatsAppReply(message.from, reply)
      console.log(`✅ Reply sent to ${message.from}.`)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.error('❌ WhatsApp send error:', detail)
      await logMessage(message.from, message.body, reply, 'send_error', detail)
      return OK
    }

    // ── Audit log successful exchange ──────────────────────────────────────
    await logMessage(message.from, message.body, reply, 'replied')
    return OK
  }

  return new Response('Method Not Allowed', { status: 405 })
})
