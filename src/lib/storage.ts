const SAVED_KEY = 'upskill_saved_jobs'

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

export default { getSavedJobs, isJobSaved, toggleSavedJob }
