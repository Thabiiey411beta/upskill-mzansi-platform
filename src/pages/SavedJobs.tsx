import React, { useMemo } from 'react'
import { getSavedJobs } from '@/lib/storage'
import { jobs } from '@/data/jobs'
import JobCard from '@/components/JobCard'
import type { Job } from '@/types'

export const SavedJobs: React.FC = () => {
  const saved = useMemo(() => getSavedJobs(), [])
  const list: Job[] = useMemo(() => jobs.filter((j) => saved.includes(j.id)), [saved])

  if (!list.length) return <p>No saved jobs yet. Click "Save" on a job to bookmark it.</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((j) => (
        <JobCard key={j.id} job={j} onOpen={() => window.location.hash = `#job-${j.id}`} />
      ))}
    </div>
  )
}

export default SavedJobs
