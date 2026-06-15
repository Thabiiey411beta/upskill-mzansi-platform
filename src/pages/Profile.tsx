import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Award } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow p-8">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          
          {user ? (
            <div>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-orange rounded-2xl flex items-center justify-center text-white text-4xl">
                  {user.name[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              {/* CV Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center mb-8">
                <Upload className="mx-auto mb-4 text-orange" size={48} />
                <p className="font-medium">Upload your CV (PDF)</p>
                <button className="mt-4 bg-navy text-white px-8 py-3 rounded-xl">Choose File</button>
              </div>

              {/* Skills & Experience */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Award className="text-orange" /> Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Project Management', 'Python', 'Customer Service'].map(skill => (
                      <span key={skill} className="bg-gray-100 px-4 py-2 rounded-full text-sm">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>Please log in to view your profile.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;