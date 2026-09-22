'use client';

import React from 'react';
import { MapPin, DollarSign, Bookmark, BookmarkCheck, CheckCircle2, Sparkles, Building2, Globe, ExternalLink } from 'lucide-react';
import { JobWithMatch } from '@/lib/types';

interface JobCardProps {
  job: JobWithMatch;
  isSelected: boolean;
  onSelect: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
  onApply: (e: React.MouseEvent) => void;
}

export default function JobCard({
  job,
  isSelected,
  onSelect,
  onToggleSave,
  onApply
}: JobCardProps) {
  const match = job.match;

  const getBadgeStyle = () => {
    if (!match) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (match.score >= 85) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
    }
    if (match.score >= 70) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (match.score >= 50) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatSalary = (min: number, max: number) => {
    return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative p-5 rounded-2xl border transition-all cursor-pointer bg-white text-slate-900 ${
        isSelected
          ? 'border-blue-600 shadow-md ring-2 ring-blue-600/10'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Top Header: Company + Match Score */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {job.logo_url ? (
            <img
              src={job.logo_url}
              alt={job.company}
              className="w-11 h-11 rounded-xl object-cover border border-slate-100 shadow-xs"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
              <Building2 className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {job.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium">{job.company} • {job.department}</p>
          </div>
        </div>

        {/* Match Score Badge */}
        {match && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${getBadgeStyle()}`}
            title={`Match score: ${match.score}%`}
          >
            {match.score >= 85 && <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
            <span>{match.score}% Match</span>
          </div>
        )}
      </div>

      {/* Meta Pills: Location, Remote, Salary, Type */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3.5">
        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
          <MapPin className="w-3 h-3 text-slate-400" />
          {job.location}
        </span>

        {job.is_remote && (
          <span className="flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md font-semibold">
            <Globe className="w-3 h-3" />
            Remote
          </span>
        )}

        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
          {formatSalary(job.salary_min, job.salary_max)}
        </span>

        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">
          {job.job_type}
        </span>
      </div>

      {/* Skills Snippet */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {job.skills.slice(0, 5).map(skill => {
          const isMatched = match?.matchedSkills.includes(skill);
          return (
            <span
              key={skill}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                isMatched
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isMatched && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
              {skill}
            </span>
          );
        })}
        {job.skills.length > 5 && (
          <span className="text-[11px] text-slate-400 font-medium">
            +{job.skills.length - 5} more
          </span>
        )}
      </div>

      {/* Bottom Row Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        <span className="text-slate-400 font-medium">
          Posted {new Date(job.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>

        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={onToggleSave}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              job.isSaved
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
            }`}
            title={job.isSaved ? 'Remove from saved' : 'Save job'}
          >
            {job.isSaved ? (
              <BookmarkCheck className="w-4 h-4 fill-amber-500" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          {job.hasApplied ? (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Applied
              </span>
              <button
                onClick={onApply}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Visit actual job page site"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onApply}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Apply on actual job page site"
            >
              <span>Apply</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
