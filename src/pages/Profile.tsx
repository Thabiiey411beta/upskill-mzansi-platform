import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Award, Info } from 'lucide-react';
import { parseCvNameToProfile } from '../lib/ai';
import type { Profile as ProfileType } from '../types';

const LOCAL_PROFILE_KEY = 'upskill_local_profile';

function loadLocalProfile(): Partial<ProfileType> | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Profile page.
 *
 * Sign-in (Supabase Auth) is NOT connected yet, so this page used to be a
 * dead end ("Please log in") with a CV button that did nothing. It now works
 * offline: uploading a CV parses what it can locally (filename-based, see
 * src/lib/ai.ts parseCvNameToProfile) and stores the profile in this browser.
 * Full CV text parsing + cloud sync arrive with Supabase Auth — see LAUNCH.md.
 */
const Profile = () => {
  const [profile, setProfile] = useState<Partial<ProfileType> | null>(loadLocalProfile);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    // Local parse only: no upload happens until Supabase Storage is configured.
    const parsed = parseCvNameToProfile(file.name);
    const next = { ...parsed, fullName: parsed.fullName ?? 'Mzansi Candidate' };
    setProfile(next);
    setFileName(file.name);
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next));
    } catch {
      // Private mode etc. — profile just won't persist.
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-blue-900">
            <strong>Accounts aren&apos;t live yet.</strong> Your profile is stored only in
            this browser for now. Once sign-in is connected, it will sync to your
            account. AI CV parsing (Gemini) unlocks with{' '}
            <Link to="/pricing" className="font-semibold underline">Premium</Link>.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow p-8">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>

          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-orange rounded-2xl flex items-center justify-center text-white text-4xl">
              {(profile?.fullName ?? 'M')[0]}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{profile?.fullName ?? 'Mzansi Candidate'}</h2>
              <p className="text-gray-600">{profile?.headline ?? 'Build your profile by uploading your CV below.'}</p>
              {profile?.email && <p className="text-gray-600 text-sm">{profile.email}</p>}
            </div>
          </div>

          {/* CV Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-8">
            <Upload className="mx-auto mb-4 text-orange" size={48} />
            <p className="font-medium">Upload your CV (PDF)</p>
            <p className="text-sm text-gray-500 mt-1">
              {fileName ? `Loaded: ${fileName}` : 'Parsed locally in your browser — nothing is uploaded yet.'}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              className="mt-4 bg-navy text-white px-8 py-3 rounded-xl"
              onClick={() => fileRef.current?.click()}
            >
              Choose File
            </button>
          </div>

          {/* Skills & Experience */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Award className="text-orange" /> Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(profile?.skills ?? ['Communication', 'Teamwork', 'Microsoft Office']).map((skill) => (
                  <span key={skill} className="bg-gray-100 px-4 py-2 rounded-full text-sm">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Education</h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {(profile?.education ?? ['National Senior Certificate']).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {profile?.summary && (
                <>
                  <h3 className="font-semibold mt-6 mb-2">Summary</h3>
                  <p className="text-sm text-gray-700">{profile.summary}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
