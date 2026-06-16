/**
 * Supabase Edge Function — WhatsApp Career Assistant Webhook
 *
 * Handles two request types from Meta:
 *   GET  — hub.challenge verification handshake
 *   POST — inbound message events (text only, other types are acknowledged but skipped)
 *
 * Flow for every inbound text message:
 *   1. Parse the Meta payload and extract sender + message body
 *   2. Call Gemini 2.0 Flash with a South-African career coaching system prompt
 *   3. Send the Gemini reply back via the WhatsApp Business API
 *   4. Log the exchange (from, question, reply, status) to `whatsapp_messages` in Supabase
 *
 * Required Supabase secrets (set via `supabase secrets set`):
 *   WHATSAPP_VERIFY_TOKEN   — arbitrary string registered in Meta App Dashboard
 *   WHATSAPP_ACCESS_TOKEN   — Meta permanent / system-user access token
 *   WHATSAPP_PHONE_NUMBER_ID — WhatsApp Business phone number ID from Meta
 *   GEMINI_API_KEY           — Google AI Studio API key
 *   SUPABASE_URL             — injected automatically by Supabase runtime
 *   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase runtime
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Environment ───────────────────────────────────────────────────────────────

const VERIFY_TOKEN       = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? ''
const WA_ACCESS_TOKEN    = Deno.env.get('WHATSAPP_ACCESS_TOKEN') ?? ''
const WA_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? ''
const GEMINI_API_KEY     = Deno.env.get('GEMINI_API_KEY') ?? ''
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// ── Supabase client (service role — bypasses RLS for message logging) ─────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Gemini ────────────────────────────────────────────────────────────────────

const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

/**
 * System prompt grounding Gemini as an SA career coach.
 * Mirrors the tone and SETA domain knowledge in src/lib/ai.ts.
 */
const CAREER_SYSTEM_PROMPT = `You are Mzansi Career Assistant, a friendly and knowledgeable career coach for South African job seekers.

Your expertise covers:
- Job searching across all nine South African provinces
- SETA-aligned learnerships and skills programmes (MICT, BANKSETA, merSETA, MQA, HWSETA, ETDP SETA, CETA, PSETA, AgriSETA, etc.)
- NQF levels, RPL (Recognition of Prior Learning), and WSP/ATR funding processes
- CV writing, cover letters, and interview preparation for the South African job market
- B-BBEE considerations, National Skills Fund (NSF) bursaries, and Section 12H incentives
- Practical advice for unemployed youth, school leavers, and career changers

Guidelines:
- Reply in clear, warm, encouraging English (brief Zulu/Sotho/Afrikaans phrases are welcome where natural)
- Keep replies concise — WhatsApp messages should be under 1 000 characters
- If the question is unrelated to careers, politely redirect to career topics
- Never fabricate specific job listings, company contacts, or official grant amounts
- End every reply with one actionable next step`

async function askGemini(userMessage: string): Promise<string> {
  const body = {
    system_instruction: { parts: [{ text: CAREER_SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 400,   // ~1 000 chars — keeps replies WhatsApp-friendly
    },
  }

  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Gemini ${res.status}: ${detail}`)
  }

  const json = await res.json()
  const text: string | undefined =
    json?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('Gemini returned an empty candidates array.')
  return text.trim()
}

// ── WhatsApp Business API ─────────────────────────────────────────────────────

const WA_MESSAGES_URL =
  `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`

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

// ── Message logging ───────────────────────────────────────────────────────────

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

  // Log failures are non-fatal — never let a DB write block the 200 response
  if (error) console.error('⚠️ Failed to log message:', error.message)
}

// ── Meta payload helpers ──────────────────────────────────────────────────────

interface MetaTextMessage {
  from: string
  id:   string
  body: string
}

/**
 * Extracts the first text message from a Meta webhook payload.
 * Returns null for non-text events (images, reactions, status updates, etc.)
 * so they can be acknowledged without processing.
 */
function extractTextMessage(payload: unknown): MetaTextMessage | null {
  try {
    const entry    = (payload as any)?.entry?.[0]
    const change   = entry?.changes?.[0]
    const value    = change?.value
    const messages = value?.messages

    if (!Array.isArray(messages) || messages.length === 0) return null

    const msg = messages[0]
    if (msg?.type !== 'text') return null

    const body: string = msg?.text?.body?.trim()
    if (!body) return null

    return { from: msg.from, id: msg.id, body }
  } catch {
    return null
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  // ── 1. GET — Meta hub.challenge verification ────────────────────────────────
  if (req.method === 'GET') {
    const params    = new URL(req.url).searchParams
    const mode      = params.get('hub.mode')
    const token     = params.get('hub.verify_token')
    const challenge = params.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
      console.log('✅ WhatsApp webhook verified.')
      return new Response(challenge, { status: 200 })
    }

    console.warn('⛔ Webhook verification failed — token mismatch.')
    return new Response('Forbidden', { status: 403 })
  }

  // ── 2. POST — inbound message event ────────────────────────────────────────
  if (req.method === 'POST') {
    // Always return 200 quickly — Meta will retry on non-2xx responses,
    // causing duplicate processing. All error handling is internal.
    let payload: unknown

    try {
      payload = await req.json()
    } catch {
      // Malformed body — acknowledge so Meta doesn't retry endlessly
      console.error('❌ Could not parse request body as JSON.')
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const message = extractTextMessage(payload)

    if (!message) {
      // Status updates, reactions, images, etc. — acknowledge and move on
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`📩 Message from ${message.from}: "${message.body}"`)

    // ── 2a. Call Gemini ───────────────────────────────────────────────────────
    let reply: string
    try {
      reply = await askGemini(message.body)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.error('❌ Gemini error:', detail)

      const fallback =
        'Sawubona! I\'m having a little trouble right now. Please try again in a moment. ' +
        'For urgent career help, visit upskillmzansi.co.za 🌟'

      // Best-effort fallback reply so the user isn't left in silence
      try {
        await sendWhatsAppReply(message.from, fallback)
      } catch (sendErr) {
        console.error('❌ Could not send fallback reply:', sendErr)
      }

      await logMessage(message.from, message.body, fallback, 'gemini_error', detail)

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 2b. Send reply via WhatsApp Business API ──────────────────────────────
    try {
      await sendWhatsAppReply(message.from, reply)
      console.log(`✅ Reply sent to ${message.from}.`)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.error('❌ WhatsApp send error:', detail)
      await logMessage(message.from, message.body, reply, 'send_error', detail)

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 2c. Log the successful exchange ──────────────────────────────────────
    await logMessage(message.from, message.body, reply, 'replied')

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response('Method Not Allowed', { status: 405 })
})
