import React, { useState } from 'react';

const CoverLetterModal = ({ job, onClose }: { job: any; onClose: () => void }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCoverLetter = async () => {
    setLoading(true);
    // Mock AI generation using prompt logic
    setTimeout(() => {
      setCoverLetter(`Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} position at ${job.company}. With my background in ${job.sector} and skills matching your requirements, I am confident I can contribute effectively to your team in ${job.location}.\n\n[Full tailored letter here - ready for Gemini integration via Supabase Edge Function]\n\nBest regards,`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 p-8">
        <h2 className="text-2xl font-bold mb-6">AI Generated Cover Letter</h2>
        <button onClick={generateCoverLetter} disabled={loading} className="bg-orange text-white px-6 py-3 rounded-xl mb-6">
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>
        {coverLetter && <textarea className="w-full h-80 p-4 border rounded-xl" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />}
        <div className="flex gap-4 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl">Close</button>
          <button className="flex-1 bg-navy text-white py-3 rounded-xl">Save & Use</button>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterModal;