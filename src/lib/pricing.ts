/**
 * src/lib/pricing.ts — the SINGLE source of truth for all prices on the site.
 *
 * Change a price here and it updates everywhere (Pricing page, upgrade
 * prompts, plan comparisons). Prices are in ZAR, VAT inclusive.
 *
 * ── Why these prices? ───────────────────────────────────────────────────────
 * The jobseeker audience is largely unemployed or low-income, so Premium is
 * deliberately priced UNDER the R50 psychological barrier: R49/month is
 * roughly the cost of a takeaway meal or ~1GB of mobile data — cheap enough
 * to try, and low enough that a single interview (or one AI-drafted cover
 * letter that lands a callback) pays for a year of it. Comparable SA career
 * platforms charge R99–R199/month for far less AI tooling, so R49 is a
 * launch-price wedge: convert early, prove the AI features work, and only
 * then revisit pricing with real conversion data.
 *
 * Business at R299/month is priced against the alternative: a recruiter
 * charges R10,000+ per hire and a single job-board listing is R500–R1,500.
 * R299 for 5 live posts + AI screening is cheaper than one listing.
 *
 * ── Payments status ─────────────────────────────────────────────────────────
 * NO live payments are wired yet: Newton's Stripe account is not enabled for
 * charges, so there are no Stripe products, prices or checkout links in this
 * file. The Pricing page collects waitlist emails instead. When Stripe
 * onboarding completes, add the Stripe price IDs here (as env vars, never
 * hard-coded) and swap the waitlist CTA for a Checkout link — see LAUNCH.md.
 */

export type PlanId = 'free' | 'premium' | 'business'

export interface Plan {
  id: PlanId
  name: string
  tagline: string
  /** Monthly price in ZAR. 0 = free. */
  priceZar: number
  /** Price shown on the card, e.g. "R49". */
  priceLabel: string
  intervalLabel: string
  /** Optional annual price in ZAR (shown as the "save" option). */
  annualPriceZar?: number
  annualLabel?: string
  features: string[]
  cta: string
  popular?: boolean
  audience: 'jobseekers' | 'employers'
}

export const PRICING_CURRENCY = 'ZAR'

/** Free AI generations (cover letters / skills-gap runs) before Premium is required. */
export const FREE_AI_USES = 3

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Start your job search — no card required.',
    priceZar: 0,
    priceLabel: 'R0',
    intervalLabel: 'forever',
    features: [
      'Browse all jobs, learnerships & courses',
      'Save jobs and track applications locally',
      'Basic profile & CV upload',
      `${FREE_AI_USES} free AI cover letters to try the tools`,
      'SETA & funding guidance in the Upskilling Hub',
    ],
    cta: 'Start free',
    audience: 'jobseekers',
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'AI that does the heavy lifting on every application.',
    priceZar: 49,
    priceLabel: 'R49',
    intervalLabel: 'per month',
    annualPriceZar: 490,
    annualLabel: 'R490/year — 2 months free',
    features: [
      'Everything in Free',
      'Unlimited AI cover letters, tailored per job',
      'AI skills-gap analysis with SETA & NQF alignment',
      'AI CV parsing — upload a PDF, get a structured profile',
      'Personalised upskilling plan + funding options',
      'Priority listing in employer searches (once live)',
    ],
    cta: 'Go Premium',
    popular: true,
    audience: 'jobseekers',
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Hire smarter and upskill your team.',
    priceZar: 299,
    priceLabel: 'R299',
    intervalLabel: 'per month',
    features: [
      'Post up to 5 live jobs at a time',
      'AI screening & candidate shortlists',
      'Company profile on the platform',
      'SETA-aligned upskilling for your staff',
      'Section 12H / ETI savings guidance',
      'Demo & onboarding support',
    ],
    cta: 'Talk to us',
    audience: 'employers',
  },
]

export const PREMIUM_PLAN = PLANS.find((p) => p.id === 'premium')!
export const BUSINESS_PLAN = PLANS.find((p) => p.id === 'business')!
export const FREE_PLAN = PLANS.find((p) => p.id === 'free')!

export function formatPriceZar(amount: number): string {
  return `R${amount}`
}
