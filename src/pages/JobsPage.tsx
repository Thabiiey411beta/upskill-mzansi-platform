import React from 'react'
import JobList from '../components/JobList'
import { AdSlot } from '../components/AdSlot'

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

        {/* AdSense-ready slot — renders nothing until VITE_ADSENSE_CLIENT_ID is set (see ADSENSE.md). */}
        <AdSlot />
      </div>
    </div>
  )
}

export default JobsPage
