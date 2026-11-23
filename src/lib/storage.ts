import type { Application } from '@/types'

const SAVED_KEY = 'upskill_saved_jobs'
const APPLICATIONS_KEY = 'upskill_applications'

export function getSavedJobs(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function isJobSaved(jobId: string) {
  return getSavedJobs().includes(jobId)
}

export function toggleSavedJob(jobId: string) {
  const curr = new Set(getSavedJobs())
  if (curr.has(jobId)) curr.delete(jobId)
  else curr.add(jobId)
  const arr = Array.from(curr)
  localStorage.setItem(SAVED_KEY, JSON.stringify(arr))
  return arr
}

// ── Applications (local until Supabase Auth + applications table are live) ───
// Applications are stored in this browser only for now. Once Supabase Auth
// is connected, these should be written to public.applications instead and
// this local list becomes a migration source — see LAUNCH.md.
export function getApplications(): Application[] {
  try {
    const raw = localStorage.getItem(APPLICATIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function hasApplied(jobId: string) {
  return getApplications().some((a) => a.jobId === jobId)
}

export function recordApplication(job: {
  id: string
  title: string
  company: string
  location: string
}): Application | null {
  if (hasApplied(job.id)) return null
  const app: Application = {
    id: `local-${Date.now()}`,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    location: job.location,
    appliedAt: new Date().toISOString(),
    status: 'Pending',
    coverLetter: '',
  }
  const apps = getApplications()
  apps.unshift(app)
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps))
  return app
}

export default { getSavedJobs, isJobSaved, toggleSavedJob, getApplications, hasApplied, recordApplication }
