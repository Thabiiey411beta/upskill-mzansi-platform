import type { Job, Province, Sector, JobType, ExperienceLevel } from '@/types'

export function formatCurrencyZAR(amount: number) {
  if (!isFinite(amount)) return 'R0'
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount)
}

export interface JobFilter {
  provinces?: Province[]
  sectors?: Sector[]
  types?: JobType[]
  experience?: ExperienceLevel[]
  minAnnual?: number
  maxAnnual?: number
  query?: string
}

export function filterJobs(jobs: Job[], f: JobFilter) {
  return jobs.filter((j) => {
    if (f.provinces && f.provinces.length && !f.provinces.includes(j.province)) return false
    if (f.sectors && f.sectors.length && !f.sectors.includes(j.sector)) return false
    if (f.types && f.types.length && !f.types.includes(j.type)) return false
    if (f.experience && f.experience.length && !f.experience.includes(j.experienceLevel)) return false
    if (typeof f.minAnnual === 'number' && j.annualSalary < f.minAnnual) return false
    if (typeof f.maxAnnual === 'number' && j.annualSalary > f.maxAnnual) return false
    if (f.query) {
      const q = f.query.toLowerCase()
      if (!`${j.title} ${j.company} ${j.description} ${j.location}`.toLowerCase().includes(q)) return false
    }
    return true
  })
}

export default { formatCurrencyZAR, filterJobs }
