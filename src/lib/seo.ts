// SEO helpers — canonical URL + og:url, driven by VITE_SITE_URL.
//
// The site has no deployed domain yet, so VITE_SITE_URL is intentionally
// unset. Until it is set (Vercel env vars, after the first deploy), this
// module does nothing and the page simply has no canonical / og:url —
// no invented domain is ever emitted. Once set, the canonical link and
// og:url are upserted at runtime so crawlers that execute JS (including
// Google) see the real URL.
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/+$/, '')

export function getSiteUrl(): string | undefined {
  return SITE_URL || undefined
}

function upsertMeta(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function applySiteUrl() {
  if (typeof document === 'undefined' || !SITE_URL) return
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', SITE_URL + '/')
  upsertMeta('og:url', SITE_URL + '/')
}
