'use client';

import React from 'react';
import { Bookmark, Building2, MapPin, Trash2, Send, ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
import { SavedJob } from '@/lib/types';

interface SavedJobsViewProps {
  savedJobs: SavedJob[];
  onRemoveSave: (jobId: string) => void;
  onApply: (job: any) => void;
  onFindJobsClick: () => void;
}

export default function SavedJobsView({
  savedJobs,
  onRemoveSave,
  onApply,
  onFindJobsClick
}: SavedJobsViewProps) {
  if (savedJobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
          <Bookmark className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No saved jobs yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Bookmark jobs you're interested in while browsing to review and apply to them later!
        </p>
        <button
          onClick={onFindJobsClick}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>Browse Jobs</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Saved Jobs</h2>
          <p className="text-xs text-slate-500">Roles you have bookmarked for review</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
          {savedJobs.length} {savedJobs.length === 1 ? 'Job' : 'Jobs'} Saved
        </span>
      </div>

      <div className="space-y-4">
        {savedJobs.map(item => {
          const job = item.job;
          if (!job) return null;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                    {job.company ? job.company.charAt(0) : <Building2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{job.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="text-slate-700 font-semibold">{job.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {job.location} {job.is_remote && '(Remote)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => onRemoveSave(job.id)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onApply(job)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                    title="Apply on actual job page site"
                  >
                    <span>Apply</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {job.skills.slice(0, 6).map(skill => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom Row */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>
                  Saved on {new Date(item.saved_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>

                {job.salary_min && (
                  <span className="font-semibold text-slate-700">
                    ${Math.round(job.salary_min / 1000)}k - ${Math.round(job.salary_max / 1000)}k
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
