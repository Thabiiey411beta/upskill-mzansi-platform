import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getApplications } from '../lib/storage';

// NOTE: this page used to show two invented applications ("Senior Software
// Engineer at Standard Bank — Shortlisted", etc.). Those were never real.
// It now lists only applications actually recorded from this browser via
// the Apply button. Until Supabase Auth + the applications table are live,
// applications are local-only — see LAUNCH.md.
const Applications = () => {
  const applications = useMemo(() => getApplications(), []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-2">My Applications</h1>
        <p className="text-gray-600 mb-8">
          Applications you submit are tracked here. Employer submission opens once
          accounts are live — for now they are saved in this browser.
        </p>
        <div className="bg-white rounded-3xl p-8">
          {applications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-600 mb-4">No applications yet.</p>
              <Link to="/jobs" className="font-semibold text-primary underline">
                Browse jobs to apply
              </Link>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="border-b py-6 flex justify-between items-center last:border-b-0">
                <div>
                  <h3 className="font-semibold">{app.jobTitle}</h3>
                  <p className="text-gray-600">{app.company} · {app.location}</p>
                  <p className="text-xs text-gray-400">
                    Applied {new Date(app.appliedAt).toLocaleDateString('en-ZA')}
                  </p>
                </div>
                <div className={`px-4 py-1 rounded-full text-sm ${app.status === 'Shortlisted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {app.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;
