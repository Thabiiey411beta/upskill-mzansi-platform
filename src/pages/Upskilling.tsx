import React, { useState } from 'react';
import { courses } from '../data/courses';
import { provinces, sectors } from '../data/jobs';
import { Search, Filter, Award } from 'lucide-react';

const Upskilling = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedProvince, setSelectedProvince] = useState('All');

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'All' || course.sector === selectedSector;
    const matchesProvince = selectedProvince === 'All' || course.province === selectedProvince;
    return matchesSearch && matchesSector && matchesProvince;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-navy mb-4">Upskill with Purpose</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Discover SETA-aligned learnerships, skills programmes and funded opportunities across South Africa</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Sector + province filters (state existed but had no controls) */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="py-3 px-3 border border-gray-200 rounded-xl bg-white"
                aria-label="Filter by sector"
              >
                <option value="All">All sectors</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="py-3 px-3 border border-gray-200 rounded-xl bg-white"
              aria-label="Filter by province"
            >
              <option value="All">All provinces</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredCourses.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
            No courses match those filters yet — only {courses.length} launch courses are listed so far.
            More SETA-aligned programmes are added as providers confirm them.
          </p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <Award className="w-8 h-8 text-orange" />
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">{course.funding}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-gray-100 px-3 py-1 rounded-full">{course.sector}</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full">{course.province}</span>
              </div>
              <a href={course.link} target="_blank" className="mt-6 block text-center bg-navy text-white py-3 rounded-xl font-medium hover:bg-orange transition-colors">
                Learn More & Apply
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Upskilling;