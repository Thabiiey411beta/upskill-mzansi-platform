import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type PremiumState = {
  isPremium: boolean
  loading: boolean
  /** Throws a human-readable error when access is denied. */
  requirePremium: () => void
}

/**
 * Checks whether the currently authenticated user holds a Premium subscription
 * by calling the `is_premium(user_id)` Postgres function.
 *
 * Usage:
 *   const { isPremium, loading, requirePremium } = usePremium()
 *
 *   // Gate a feature:
 *   if (!isPremium) { requirePremium() }   // throws → catch in UI
 *
 *   // Gate JSX:
 *   {isPremium ? <AIHub /> : <UpgradePrompt />}
 */
export function usePremium(): PremiumState {
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('is_premium', { user_id: user.id })

      if (!cancelled) {
        if (!error) setIsPremium(!!data)
        setLoading(false)
      }
    }

    check()

    // Re-check when the auth session changes (login / logout / token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setLoading(true)
      check()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const requirePremium = () => {
    if (!isPremium) {
      throw new Error('This feature requires a Premium subscription. Upgrade your plan to unlock it.')
    }
  }

  return { isPremium, loading, requirePremium }
}
