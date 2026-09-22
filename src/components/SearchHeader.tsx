'use client';

import React, { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, Sparkles, X, ChevronDown, Check, ArrowUpDown, Globe } from 'lucide-react';
import { User } from '@/lib/types';

interface SearchHeaderProps {
  searchTitle: string;
  setSearchTitle: (val: string) => void;
  searchLocation: string;
  setSearchLocation: (val: string) => void;
  remoteOnly: boolean;
  setRemoteOnly: (val: boolean) => void;
  jobType: string;
  setJobType: (val: string) => void;
  experience: string;
  setExperience: (val: string) => void;
  minSalary: number;
  setMinSalary: (val: number) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  onSearch: () => void;
  onOpenScraper: () => void;
  user: User | null;
  hasResume: boolean;
  resumeSkillsCount: number;
  onOpenProfile: () => void;
  onOpenResumeModal: () => void;
  totalJobsFound: number;
}

export default function SearchHeader({
  searchTitle,
  setSearchTitle,
  searchLocation,
  setSearchLocation,
  remoteOnly,
  setRemoteOnly,
  jobType,
  setJobType,
  experience,
  setExperience,
  minSalary,
  setMinSalary,
  sortBy,
  setSortBy,
  onSearch,
  onOpenScraper,
  user,
  hasResume,
  resumeSkillsCount,
  onOpenProfile,
  onOpenResumeModal,
  totalJobsFound
}: SearchHeaderProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const hasActiveFilters =
    remoteOnly || jobType !== 'All' || experience !== 'All' || minSalary > 0;

  const resetFilters = () => {
    setRemoteOnly(false);
    setJobType('All');
    setExperience('All');
    setMinSalary(0);
    setSortBy('match');
  };

  return (
    <div className="bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 shadow-xl">
      <div className="max-w-7xl mx-auto">
        {/* Main Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI-Powered Resume & Criteria Match Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3">
            Find the jobs that <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">match your skills</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Specify what job title and location you want. Upload your resume to unlock real-time match scoring and personalized compatibility breakdowns.
          </p>
        </div>

        {/* Primary Search Bar Container */}
        <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-slate-200/40 text-slate-800 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-stretch gap-2">
            {/* Job Title / Keywords Input */}
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTitle}
                onChange={e => setSearchTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Job title, keywords, or company..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchTitle && (
                <button
                  onClick={() => setSearchTitle('')}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Location Input */}
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="City, state, or 'Remote'..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchLocation && (
                <button
                  onClick={() => setSearchLocation('')}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                  hasActiveFilters || filtersOpen
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </button>

              <button
                onClick={onSearch}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>

              <button
                onClick={onOpenScraper}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                title="Scrape live job postings with Bright Data and web scrapers"
              >
                <Globe className="w-4 h-4" />
                <span>Scrape Live Jobs</span>
              </button>
            </div>
          </div>

          {/* Quick Filters Pill Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Remote Toggle */}
              <button
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  remoteOnly
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {remoteOnly && <Check className="w-3.5 h-3.5" />}
                <span>Remote Only</span>
              </button>

              {/* Quick Title Chips */}
              <button
                onClick={() => {
                  setSearchTitle('Full Stack Engineer');
                  onSearch();
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
              >
                Full Stack
              </button>
              <button
                onClick={() => {
                  setSearchTitle('Frontend Engineer');
                  onSearch();
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
              >
                Frontend
              </button>
              <button
                onClick={() => {
                  setSearchTitle('Product Manager');
                  onSearch();
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
              >
                Product Manager
              </button>
              <button
                onClick={() => {
                  setSearchTitle('Machine Learning');
                  onSearch();
                }}
                className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
              >
                AI & ML
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium hidden sm:inline">Sort:</span>
              <div className="relative inline-flex items-center">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-1.5 pl-2.5 pr-7 rounded-lg border border-slate-200 cursor-pointer focus:outline-none"
                >
                  <option value="match">Match Score (AI)</option>
                  <option value="recent">Most Recent</option>
                  <option value="salary">Highest Salary</option>
                </select>
                <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Expanded Filters Drawer */}
          {filtersOpen && (
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Job Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Employment Type</label>
                <select
                  value={jobType}
                  onChange={e => setJobType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Experience Level</label>
                <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Levels</option>
                  <option value="Entry">Entry Level (0-2 yrs)</option>
                  <option value="Mid">Mid Level (2-5 yrs)</option>
                  <option value="Senior">Senior Level (5+ yrs)</option>
                  <option value="Lead">Lead / Staff (8+ yrs)</option>
                </select>
              </div>

              {/* Minimum Salary */}
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1.5">
                  <span>Minimum Salary</span>
                  <span className="text-blue-600 font-bold">
                    {minSalary > 0 ? `$${(minSalary / 1000).toFixed(0)}k+/yr` : 'Any Salary'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="250000"
                  step="10000"
                  value={minSalary}
                  onChange={e => setMinSalary(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {hasActiveFilters && (
                <div className="sm:col-span-3 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Target Criteria Status Banner */}
        {user && (
          <div className="max-w-4xl mx-auto mt-4 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-blue-300 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                Target Criteria:
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-medium">
                {user.desired_title || 'Any Title'}
              </span>
              <span className="text-slate-400">in</span>
              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-medium">
                {user.desired_location || 'Any Location'}
              </span>
              {hasResume ? (
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/50 text-emerald-300 font-medium">
                  {resumeSkillsCount} Resume Skills Match Active
                </span>
              ) : (
                <span className="text-amber-300">
                  (No resume uploaded yet)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!hasResume ? (
                <button
                  onClick={onOpenResumeModal}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2"
                >
                  Upload Resume for 100% Accuracy
                </button>
              ) : (
                <button
                  onClick={onOpenProfile}
                  className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2"
                >
                  Edit Criteria
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
