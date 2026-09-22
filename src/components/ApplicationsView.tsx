'use client';

import React from 'react';
import {
  BookmarkCheck, Building2, MapPin, Calendar, CheckCircle2,
  Clock, Award, ArrowRight, ExternalLink
} from 'lucide-react';
import { Application, getJobApplyUrl } from '@/lib/types';

interface ApplicationsViewProps {
  applications: Application[];
  onFindJobsClick: () => void;
}

export default function ApplicationsView({
  applications,
  onFindJobsClick
}: ApplicationsViewProps) {
  if (applications.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
          <BookmarkCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No applications submitted yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Find matching jobs that fit your resume and skills, and submit applications with just one click!
        </p>
        <button
          onClick={onFindJobsClick}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <span>Explore Matching Jobs</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">My Job Applications</h2>
          <p className="text-xs text-slate-500">Track application progress and submitted resumes</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
        </span>
      </div>

      <div className="space-y-4">
        {applications.map(app => {
          const job = app.job;
          return (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                    {job?.company ? job.company.charAt(0) : <Building2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{job?.title || 'Applied Role'}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="text-slate-700 font-semibold">{job?.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {job?.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Job Site Link */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{app.status}</span>
                  </span>

                  {job && (
                    <a
                      href={getJobApplyUrl(job)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-full border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-blue-600 bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Visit actual job page site"
                    >
                      <span>Job Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Cover Note Snippet */}
              {app.cover_note && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 mb-3 italic">
                  "{app.cover_note}"
                </div>
              )}

              {/* Bottom metadata */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Applied {new Date(app.applied_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>

                {job?.salary_min && (
                  <span className="font-medium text-slate-600">
                    Salary: ${Math.round(job.salary_min / 1000)}k - ${Math.round(job.salary_max / 1000)}k
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
