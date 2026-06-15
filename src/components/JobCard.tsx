import React from 'react'
import type { Job } from '@/types'

interface Props {
  job: Job
  onOpen: (job: Job) => void
}

export const JobCard: React.FC<Props> = ({ job, onOpen }) => {
  return (
    <article className="border rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => onOpen(job)}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{job.title}</h3>
          <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-emerald-600">{job.salaryText}</div>
          <div className="text-xs text-muted-foreground">{job.postedAt}</div>
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-700 line-clamp-3">{job.description}</p>
      <div className="mt-3 flex gap-2 flex-wrap">
        {job.tags.map((t) => (
          <span key={t} className="text-xs bg-muted px-2 py-1 rounded">{t}</span>
        ))}
      </div>
    </article>
  )
}

export default JobCard
