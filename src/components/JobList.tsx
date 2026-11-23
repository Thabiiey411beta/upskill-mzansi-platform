import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Job } from '@/types'
import JobCard from './JobCard'
import JobModal from './JobModal'
import { filterJobs } from '@/lib/jobUtils'
import { useJobs } from '@/lib/jobsData'

export const JobList: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { jobs, source, loading } = useJobs()
  const [selected, setSelected] = useState<Job | null>(null)
  // Seed the filters from the URL so the home-page search and sector cards
  // land here with their query applied (?q=, ?province=, ?sector=).
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [province, setProvince] = useState<string>(searchParams.get('province') ?? '')
  const [sector, setSector] = useState<string>(searchParams.get('sector') ?? '')

  const filtered = useMemo(() => {
    return filterJobs(jobs, {
      query: query || undefined,
      provinces: province ? [province as any] : undefined,
      sectors: sector ? [sector as any] : undefined,
    })
  }, [jobs, query, province, sector])

  return (
    <div className="space-y-4">
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Search roles, companies, keywords"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="border rounded px-3 py-2" value={province} onChange={(e) => setProvince(e.target.value)}>
          <option value="">All provinces</option>
          {[...new Set(jobs.map((j) => j.province))].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="border rounded px-3 py-2" value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">All sectors</option>
          {[...new Set(jobs.map((j) => j.sector))].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {loading
          ? 'Loading jobs…'
          : source === 'seed'
            ? `Showing ${filtered.length} of ${jobs.length} curated launch roles (local catalogue — Supabase jobs table not connected yet).`
            : `Showing ${filtered.length} of ${jobs.length} live roles.`}
      </p>

      {filtered.length === 0 && !loading && (
        <p className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No roles match those filters yet. Try clearing a filter — new roles are added as employers post them.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((j) => (
          <JobCard key={j.id} job={j} onOpen={setSelected} />
        ))}
      </div>

      <JobModal job={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

export default JobList
