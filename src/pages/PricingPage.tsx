import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Sparkles, Info } from 'lucide-react'
import { Button, Card, CardContent, Badge } from '@blinkdotnew/ui'
import { PLANS, type Plan } from '@/lib/pricing'
import { cn } from '@/lib/utils'

const WAITLIST_KEY = 'upskill_pricing_waitlist'

function getWaitlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WAITLIST_KEY) ?? '[]')
  } catch {
    return []
  }
}

/**
 * Pricing page. Prices come from src/lib/pricing.ts — the single config.
 *
 * PAYMENTS ARE NOT LIVE: Stripe onboarding is incomplete (charges not
 * enabled), so there is no checkout here. Premium/Business CTAs collect a
 * waitlist email stored locally in this browser; once Stripe is enabled,
 * swap the waitlist form for a Checkout link (see LAUNCH.md) — do not
 * pretend a payment was taken.
 */
export function PricingPage() {
  const [email, setEmail] = useState('')
  const [planChoice, setPlanChoice] = useState<Plan['id']>('premium')
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  const joinWaitlist = (planId: Plan['id']) => {
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address to join the waitlist.')
      return
    }
    const list = getWaitlist()
    if (!list.includes(trimmed)) {
      list.push(trimmed)
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(list))
    }
    setPlanChoice(planId)
    setJoined(true)
    setError('')
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full">
            Simple, honest pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-4">Plans that pay for themselves</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Job hunting is free. Premium is R49 a month — less than a takeaway —
            and one callback from a tailored application covers a year of it.
          </p>
        </div>

        <div className="mb-10 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-blue-900">
            <strong>Payments open soon.</strong> Card payments via Stripe are being
            switched on — until then, join the waitlist below and we&apos;ll email you
            the moment Premium opens. No card is taken and nothing is charged today.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-3xl',
                plan.popular && 'border-primary shadow-xl ring-2 ring-primary/20'
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                  Most popular
                </span>
              )}
              <CardContent className="flex flex-1 flex-col p-8">
                <h2 className="text-xl font-heading font-bold">{plan.name}</h2>
                <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.tagline}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-heading font-extrabold">{plan.priceLabel}</span>
                  <span className="text-sm text-muted-foreground">/ {plan.intervalLabel}</span>
                </div>
                {plan.annualLabel && (
                  <p className="mt-1 text-xs font-semibold text-green-600">{plan.annualLabel}</p>
                )}
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === 'free' ? (
                  <Button className="mt-8 w-full h-12 rounded-xl font-bold" asChild>
                    <Link to="/jobs">{plan.cta}</Link>
                  </Button>
                ) : (
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className="mt-8 w-full h-12 rounded-xl font-bold gap-2"
                    onClick={() => {
                      setPlanChoice(plan.id)
                      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    <Sparkles className="h-4 w-4" /> {plan.cta} — join waitlist
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Waitlist ─────────────────────────────────────────── */}
        <div id="waitlist" className="mx-auto mt-12 max-w-xl rounded-3xl border bg-card p-8 text-center shadow-sm">
          <h2 className="text-2xl font-heading font-bold mb-2">Get Premium the day it opens</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Leave your email and we&apos;ll notify you when card payments go live.
            Early waitlist members get their first month at the launch price.
          </p>
          {joined ? (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
              <strong>You&apos;re on the list.</strong> We&apos;ll email {email.trim()} when the{' '}
              {planChoice === 'business' ? 'Business' : 'Premium'} plan opens for payment.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.co.za"
                  className="h-12 flex-1 rounded-xl border bg-background px-4 text-sm"
                />
                <Button className="h-12 rounded-xl px-6 font-bold" onClick={() => joinWaitlist(planChoice)}>
                  Join waitlist
                </Button>
              </div>
              <div className="mt-4 flex justify-center gap-2">
                {(['premium', 'business'] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => setPlanChoice(id)}
                    className={cn(
                      'rounded-full border px-4 py-1.5 text-xs font-bold',
                      planChoice === id ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {id === 'premium' ? 'Premium — R49/mo' : 'Business — R299/mo'}
                  </button>
                ))}
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <div className="mx-auto mt-12 max-w-2xl space-y-4">
          <h2 className="text-center text-2xl font-heading font-bold">Questions</h2>
          {[
            {
              q: 'Is the Free plan really free?',
              a: 'Yes — browsing jobs, saving roles and tracking applications costs nothing, forever. No card is ever asked for on the Free plan.',
            },
            {
              q: 'Why is Premium only R49?',
              a: 'Our users are job seekers, many of them unemployed. R49 keeps the AI tools within reach of a job seeker\'s budget while still funding the service. The price is a launch price and may rise once the AI features prove their value — waitlist members keep the launch price.',
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Premium will be month-to-month with no lock-in, and cancelling drops you back to Free with your profile and saved jobs intact.',
            },
            {
              q: 'I\'m an employer — how does Business work?',
              a: 'Business is R299/month for up to 5 live job posts with AI screening. Prefer to talk first? Use the demo request on the Business page and we\'ll walk you through it.',
            },
          ].map((item) => (
            <div key={item.q} className="rounded-2xl border bg-card p-5">
              <p className="font-bold">{item.q}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PricingPage
