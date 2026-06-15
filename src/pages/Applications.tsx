import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Applications = () => {
  const { user } = useAuth();

  const applications = [
    { id: 1, title: 'Senior Software Engineer', company: 'Standard Bank', status: 'Shortlisted', date: '2025-06-01' },
    { id: 2, title: 'Project Manager', company: 'Anglo American', status: 'Pending', date: '2025-05-28' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">My Applications</h1>
        <div className="bg-white rounded-3xl p-8">
          {applications.map(app => (
            <div key={app.id} className="border-b py-6 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{app.title}</h3>
                <p className="text-gray-600">{app.company}</p>
              </div>
              <div className={`px-4 py-1 rounded-full text-sm ${app.status === 'Shortlisted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {app.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Applications;