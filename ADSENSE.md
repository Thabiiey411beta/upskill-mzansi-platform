# Enabling ads on Upskill Mzansi (Google AdSense)

Status: **AdSense-ready, not live.** No ads render today — there is no
AdSense account or publisher ID on record, and none is hard-coded anywhere.
The `AdSlot` component (`src/components/AdSlot.tsx`) renders nothing at all
until `VITE_ADSENSE_CLIENT_ID` is set.

## How Newton enables ads later

1. **Create / approve a Google AdSense account** at https://adsense.google.com
   for the deployed Upskill Mzansi site. AdSense approval requires the live
   site to be up with real content — deploy first, then apply.
2. **Create an ad unit** in AdSense (Ads → By ad unit → Display ad,
   Responsive) and note its ad-unit (slot) ID.
3. **Copy the publisher ID** from AdSense (it looks like `ca-pub-1234567890123456`).
   Never commit it to the repo — it goes in Vercel only.
4. **In Vercel** (Project → Settings → Environment Variables), add:
   - `VITE_ADSENSE_CLIENT_ID` = `ca-pub-…` (required — turns ads on)
   - `VITE_ADSENSE_SLOT_ID` = the ad-unit ID from step 2 (optional — the
     slot still renders in auto format without it)
   - `VITE_SITE_URL` = the real deployed URL, e.g. `https://upskill-mzansi.vercel.app`
     (also used for the canonical URL / `og:url` — see `src/lib/seo.ts`)
5. **Redeploy** in Vercel. Ads appear in the two `AdSlot` placements:
   below the Featured Jobs on the home page and below the jobs list on
   `/jobs`. No ads are placed inside the pricing/checkout flow.

## Files

- `public/ads.txt` — placeholder only (a comment). Once AdSense is
  approved, replace it with the real line AdSense gives you, which looks
  like `google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0`
  (same digits as the `ca-pub-…` ID, without the `ca-` prefix).
- `src/components/AdSlot.tsx` — the slot component (renders nothing
  without `VITE_ADSENSE_CLIENT_ID`).
