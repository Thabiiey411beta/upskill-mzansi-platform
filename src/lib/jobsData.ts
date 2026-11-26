import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'
import { jobs as seedJobs } from '@/data/jobs'
import type { Job, JobType, Province, Sector } from '@/types'
import { formatCurrencyZAR } from './jobUtils'

export type JobsSource = 'supabase' | 'seed'

export interface JobsResult {
  jobs: Job[]
  /** Where the jobs came from. 'seed' means Supabase is unconfigured,
   *  unreachable, or returned nothing — the app still works. */
  source: JobsSource
}

/**
 * Map a `public.jobs` row (supabase/migrations/20260616) onto the app's Job type.
 * The DB table has no experience_level / responsibilities / benefits / tags
 * columns, so those fall back to safe defaults — a live row is still a real,
 * displayable job.
 */
function mapDbJob(row: Record<string, unknown>): Job {
  const min = typeof row.salary_min === 'number' ? row.salary_min : 0
  const max = typeof row.salary_max === 'number' ? row.salary_max : 0
  const annual = max || min
  const typeMap: Record<string, JobType> = {
    'Full-time': 'Permanent',
    'Part-time': 'Contract',
    Contract: 'Contract',
    Internship: 'Contract',
    Learnership: 'Contract',
  }
  return {
    id: String(row.id),
    title: String(row.title ?? 'Untitled role'),
    company: String(row.company ?? 'Employer'),
    sector: (row.sector as Sector) ?? 'IT & Tech',
    province: (row.province as Province) ?? 'Gauteng',
    location: String(row.location ?? row.province ?? 'South Africa'),
    type: typeMap[String(row.type)] ?? 'Permanent',
    experienceLevel: 'Mid-level',
    salaryText:
      min && max
        ? `${formatCurrencyZAR(min)} – ${formatCurrencyZAR(max)} / year`
        : annual
          ? `${formatCurrencyZAR(annual)} / year`
          : 'Salary on application',
    annualSalary: annual,
    postedAt: String(row.created_at ?? new Date().toISOString()),
    description: String(row.description ?? ''),
    requirements: Array.isArray(row.requirements) ? (row.requirements as string[]) : [],
    responsibilities: [],
    benefits: [],
    tags: [],
    sourceUrl:
      typeof row.source_url === 'string' && row.source_url.length > 0
        ? row.source_url
        : undefined,
  }
}

/**
 * Load jobs: Supabase first when configured, local seed data otherwise.
 * NEVER throws and NEVER returns an empty list when seed data exists —
 * a missing/unreachable backend must not blank the Jobs page.
 */
export async function loadJobs(): Promise<JobsResult> {
  if (!isSupabaseConfigured) return { jobs: seedJobs, source: 'seed' }
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error || !data || data.length === 0) return { jobs: seedJobs, source: 'seed' }
    return { jobs: data.map((row) => mapDbJob(row as unknown as Record<string, unknown>)), source: 'supabase' }
  } catch {
    return { jobs: seedJobs, source: 'seed' }
  }
}

export function useJobs() {
  const [result, setResult] = useState<JobsResult>({ jobs: seedJobs, source: 'seed' })
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    let cancelled = false
    // Show seed data instantly; swap in live rows if Supabase has any.
    loadJobs().then((r) => {
      if (!cancelled) {
        setResult(r)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { ...result, loading }
}
