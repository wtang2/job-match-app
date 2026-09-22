'use client';

import React from 'react';
import {
  MapPin, DollarSign, Bookmark, BookmarkCheck, CheckCircle2,
  Sparkles, Building2, Globe, Check, AlertCircle, Share2,
  Send, ExternalLink, Calendar, Briefcase, Award
} from 'lucide-react';
import { JobWithMatch, User, getJobApplyUrl } from '@/lib/types';

interface JobDetailProps {
  job: JobWithMatch;
  user: User | null;
  hasResume: boolean;
  onApply: () => void;
  onCustomApply?: () => void;
  onToggleSave: () => void;
  onOpenResumeModal: () => void;
  onCopyLink: () => void;
}

export default function JobDetail({
  job,
  user,
  hasResume,
  onApply,
  onCustomApply,
  onToggleSave,
  onOpenResumeModal,
  onCopyLink
}: JobDetailProps) {
  const match = job.match;

  const formatSalary = (min: number, max: number) => {
    return `$${min.toLocaleString()} - $${max.toLocaleString()} / year`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Top Banner & Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            {job.logo_url ? (
              <img
                src={job.logo_url}
                alt={job.company}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-lg">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {job.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 font-medium">
                <span className="font-semibold text-slate-800">{job.company}</span>
                <span>•</span>
                <span>{job.department}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getJobApplyUrl(job)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              title="Open actual job page site on company website"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onCopyLink}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Share job"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleSave}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                job.isSaved
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title={job.isSaved ? 'Saved to bookmarks' : 'Bookmark job'}
            >
              {job.isSaved ? (
                <BookmarkCheck className="w-4 h-4 fill-amber-500" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Highlight Metadata Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Location</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {job.location} {job.is_remote && '(Remote)'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Salary Range</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              ${Math.round(job.salary_min / 1000)}k - ${Math.round(job.salary_max / 1000)}k
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Experience</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              {job.experience_level} Level
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Job Type</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              {job.job_type}
            </span>
          </div>
        </div>

        {/* Primary Action Button Bar */}
        <div className="mt-4 flex items-center justify-between gap-3">
          {job.hasApplied ? (
            <>
              <div className="flex-1 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Application Submitted</span>
              </div>
              <button
                onClick={onApply}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                title="Visit actual job page site"
              >
                <span>Visit Job Site</span>
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onApply}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Apply on actual job page site"
              >
                <span>Apply on Company Site</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              {onCustomApply && (
                <button
                  onClick={onCustomApply}
                  className="py-3 px-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Apply with custom cover note"
                >
                  <Send className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Add Note</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
        {/* AI Match Breakdown Card */}
        {match && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-md border border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">AI Match Intelligence</h4>
                  <p className="text-[11px] text-slate-300">Comparing your profile & resume against job requirements</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  {match.score}%
                </span>
                <span className="text-[11px] text-slate-400 block font-medium -mt-1">{match.badge}</span>
              </div>
            </div>

            {/* Match summary description */}
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 mb-4">
              {match.summaryReason}
            </p>

            {/* Skills Breakdown Grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Matched Skills */}
              <div className="bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Your Matched Skills ({match.matchedSkills.length})</span>
                </div>
                {match.matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {match.matchedSkills.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-[11px] font-medium border border-emerald-700/40"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No direct skill matches detected in resume.</p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Missing or Nice-to-Have ({match.missingSkills.length})</span>
                </div>
                {match.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {match.missingSkills.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-400 font-medium">You match all required skills!</p>
                )}
              </div>
            </div>

            {!hasResume && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Want deeper skill compatibility?</span>
                <button
                  onClick={onOpenResumeModal}
                  className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
                >
                  Upload your Resume →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Role Overview */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              About the Role
            </h4>
            <a
              href={getJobApplyUrl(job)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>{job.company} Career Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {job.description}
          </p>
        </div>

        {/* Key Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div>
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
              Key Responsibilities
            </h4>
            <ul className="space-y-2">
              {job.responsibilities.map((resp, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div>
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
              Qualifications & Requirements
            </h4>
            <ul className="space-y-2">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Tech Stack / Skills */}
        <div>
          <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
            Required & Preferred Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {job.skills.map(skill => {
              const isMatched = match?.matchedSkills.includes(skill);
              return (
                <span
                  key={skill}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                    isMatched
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1.5'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  {skill}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
