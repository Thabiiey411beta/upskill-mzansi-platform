import { useCallback, useEffect, useState } from 'react'
import { supabase, getBusinessProfile, saveBusinessProfile } from './supabase'
import type { BusinessProfile } from '@/types'

type UseBusinessProfileState = {
  profile: BusinessProfile | null
  loading: boolean
  saving: boolean
  error: string | null
  /** Persists partial updates and refreshes local state on success. */
  save: (updates: Omit<BusinessProfile, 'id' | 'credits_balance' | 'created_at'>) => Promise<boolean>
  /** True when the business has at least `required` credits. */
  hasCredits: (required: number) => boolean
}

/**
 * Loads the business profile for the currently authenticated user.
 *
 * Usage:
 *   const { profile, loading, save, hasCredits } = useBusinessProfile()
 *
 *   // Gate a paid feature (e.g. posting a job costs 1 credit):
 *   if (!hasCredits(1)) return <BuyCreditsPrompt />
 *
 *   // Save onboarding data:
 *   await save({ company_name, registration_number, industry, size })
 */
export function useBusinessProfile(): UseBusinessProfileState {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading]  = useState(true)
  const [saving, setSaving]    = useState(false)
  const [error, setError]      = useState<string | null>(null)

  const load = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await getBusinessProfile(userId)
    setProfile(data)
    if (fetchError) setError(fetchError)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) { setLoading(false); return }
      await load(user.id)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) load(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [load])

  const save = useCallback(
    async (
      updates: Omit<BusinessProfile, 'id' | 'credits_balance' | 'created_at'>,
    ): Promise<boolean> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); return false }

      setSaving(true)
      setError(null)
      const { data, error: saveError } = await saveBusinessProfile(user.id, updates)
      setSaving(false)

      if (saveError) { setError(saveError); return false }

      // Merge saved row back so credits_balance (managed server-side) is preserved
      setProfile(prev => ({ ...prev, ...data } as BusinessProfile))
      return true
    },
    [],
  )

  const hasCredits = useCallback(
    (required: number) => (profile?.credits_balance ?? 0) >= required,
    [profile],
  )

  return { profile, loading, saving, error, save, hasCredits }
}
