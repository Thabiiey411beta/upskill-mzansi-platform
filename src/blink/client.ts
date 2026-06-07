import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'upskill-mzansi-web-w1wae895',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_QdwVR9_gH4_q87-J5aerAZsrvrdkn5yk',
  authRequired: false,
  auth: { mode: 'managed' },
})
