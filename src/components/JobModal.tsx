import React, { useState } from 'react'
import type { Job } from '@/types'
import { isJobSaved, toggleSavedJob } from '@/lib/storage'

interface Props {
  job: Job | null
  onClose: () => void
}

export const JobModal: React.FC<Props> = ({ job, onClose }) => {
  const [saved, setSaved] = useState(false)
  if (!job) return null

  function handleToggleSave() {
    toggleSavedJob(job.id)
    setSaved(isJobSaved(job.id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white max-w-3xl w-full mx-4 rounded-lg shadow-lg p-6 overflow-auto max-h-[90vh]">
        <header className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{job.title}</h2>
            <p className="text-sm text-muted-foreground">{job.company} • {job.location} • {job.province}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-emerald-600">{job.salaryText}</div>
            <div className="text-xs text-muted-foreground">{job.type} • {job.experienceLevel}</div>
          </div>
        </header>

        <section className="mt-4 space-y-4">
          <div>
            <h3 className="font-semibold">Job description</h3>
            <p className="text-sm text-gray-700">{job.description}</p>
          </div>

          <div>
            <h3 className="font-semibold">Requirements</h3>
            <ul className="list-disc pl-5 text-sm">
              {job.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Responsibilities</h3>
            <ul className="list-disc pl-5 text-sm">
              {job.responsibilities.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Benefits</h3>
            <ul className="list-disc pl-5 text-sm">
              {job.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 rounded border" onClick={onClose}>Close</button>
          <button className="px-4 py-2 rounded border" onClick={handleToggleSave}>{isJobSaved(job.id) || saved ? 'Unsave' : 'Save'}</button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white">Apply Now</button>
        </footer>
      </div>
    </div>
  )
}

export default JobModal
