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
      try {
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
      } catch {
        // Unconfigured/unreachable Supabase: fail closed to Free, never crash.
        if (!cancelled) setLoading(false)
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
      // Callers catch this and render <UpgradePrompt /> (which links to
      // /pricing). The message carries the path so even a bare toast points
      // the user at the right place.
      throw new Error(
        'This feature requires a Premium subscription. See /pricing to upgrade.'
      )
    }
  }

  return { isPremium, loading, requirePremium }
}
