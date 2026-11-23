import { Link } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'
import { PREMIUM_PLAN } from '@/lib/pricing'

interface UpgradePromptProps {
  /** The Premium feature that was blocked, e.g. "AI cover letters". */
  feature: string
  detail?: string
  /** Extra context shown under the prompt, e.g. remaining free uses. */
  footer?: string
}

/**
 * The single upgrade prompt used everywhere Premium is enforced.
 * Shown when `usePremium().requirePremium()` throws, when the free AI
 * allowance runs out, and on any Premium-only surface. It always links to
 * /pricing — never to a checkout, because payments are not live yet
 * (Stripe onboarding pending; see LAUNCH.md).
 */
export function UpgradePrompt({ feature, detail, footer }: UpgradePromptProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
        <Lock className="h-6 w-6 text-amber-600" />
      </div>
      <h3 className="text-lg font-bold">{feature} is a Premium feature</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {detail ??
          `Upgrade to Premium (${PREMIUM_PLAN.priceLabel}/month) to unlock ${feature.toLowerCase()} and the full AI career toolkit.`}
      </p>
      <Link
        to="/pricing"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" /> See Premium plans
      </Link>
      {footer && <p className="mt-3 text-xs text-muted-foreground">{footer}</p>}
    </div>
  )
}

export default UpgradePrompt
