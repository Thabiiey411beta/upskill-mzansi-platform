import React from 'react'
import JobList from '../components/JobList'

const JobsPage = () => {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight">Find Jobs</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Search across curated South African opportunities and filter by province, sector and keywords.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <JobList />
        </div>
      </div>
    </div>
  )
}

export default JobsPage
