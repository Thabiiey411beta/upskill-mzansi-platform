import { useEffect, useRef } from 'react'

// AdSense-ready ad slot — renders NOTHING unless an AdSense client ID is set.
//
// There is no AdSense account or publisher ID on record, so no ca-pub ID is
// hard-coded anywhere and no ad is ever rendered or script loaded until
// VITE_ADSENSE_CLIENT_ID is set in the environment (see ADSENSE.md).
// When it is set, the AdSense script loads once (module-level guard) and
// this renders one responsive display unit. `slot` is the optional ad-unit
// ID (VITE_ADSENSE_SLOT_ID) — set it once an ad unit is created in AdSense;
// without it the unit still renders in auto format.
declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[]
  }
}

let adsenseScriptLoaded = false

function loadAdsenseScript(clientId: string) {
  if (adsenseScriptLoaded || typeof document === 'undefined') return
  adsenseScriptLoaded = true
  const script = document.createElement('script')
  script.async = true
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}

interface AdSlotProps {
  /** Optional AdSense ad-unit ID. Defaults to VITE_ADSENSE_SLOT_ID. */
  slot?: string
  /** Accessible label for the ad region. */
  label?: string
}

export function AdSlot({ slot, label = 'Advertisement' }: AdSlotProps) {
  const clientId = (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined)?.trim()
  const adSlot = slot ?? (import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined)?.trim()
  const insRef = useRef<HTMLModElement>(null)
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!clientId || !insRef.current || pushedRef.current) return
    pushedRef.current = true
    loadAdsenseScript(clientId)
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense not ready (e.g. blocked) — fail silently, leave the slot empty.
    }
  }, [clientId])

  // No client ID, no ad. Deliberately renders nothing at all.
  if (!clientId) return null

  return (
    <div className="mx-auto my-8 max-w-6xl px-4" aria-label={label}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        {...(adSlot ? { 'data-ad-slot': adSlot } : {})}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
