import React, { useMemo, useState } from 'react'
import { jobs, provinces, sectors, quickCategories } from '@/data/jobs'
import type { Job } from '@/types'
import JobCard from './JobCard'
import JobModal from './JobModal'
import { filterJobs } from '@/lib/jobUtils'

export const JobList: React.FC = () => {
  const [selected, setSelected] = useState<Job | null>(null)
  const [query, setQuery] = useState('')
  const [province, setProvince] = useState<string>('')
  const [sector, setSector] = useState<string>('')

  const filtered = useMemo(() => {
    return filterJobs(jobs, {
      query: query || undefined,
      provinces: province ? [province as any] : undefined,
      sectors: sector ? [sector as any] : undefined,
    })
  }, [query, province, sector])

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
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="border rounded px-3 py-2" value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

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
