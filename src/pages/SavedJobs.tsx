import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getSavedJobs } from '@/lib/storage'
import { useJobs } from '@/lib/jobsData'
import JobCard from '@/components/JobCard'
import JobModal from '@/components/JobModal'
import type { Job } from '@/types'

export const SavedJobs: React.FC = () => {
  const { jobs, loading } = useJobs()
  const [selected, setSelected] = React.useState<Job | null>(null)
  const saved = useMemo(() => getSavedJobs(), [])
  const list: Job[] = useMemo(() => jobs.filter((j) => saved.includes(j.id)), [jobs, saved])

  if (loading) return <p>Loading saved jobs…</p>

  if (!list.length) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-4xl font-semibold tracking-tight mb-2">Saved Jobs</h1>
          <p className="text-sm text-muted-foreground">
            No saved jobs yet. Click &ldquo;Save&rdquo; on a job to bookmark it here.{' '}
            <Link to="/jobs" className="font-semibold text-primary underline">Browse jobs</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="text-4xl font-semibold tracking-tight mb-8">Saved Jobs</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((j) => (
            <JobCard key={j.id} job={j} onOpen={setSelected} />
          ))}
        </div>
        <JobModal job={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  )
}

export default SavedJobs
