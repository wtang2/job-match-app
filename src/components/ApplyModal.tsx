'use client';

import React, { useState } from 'react';
import { X, Send, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2, ExternalLink, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import { JobWithMatch, User, ResumeData, getJobApplyUrl } from '@/lib/types';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobWithMatch | null;
  user: User | null;
  resume: ResumeData | null;
  onApplySuccess: () => void;
  onOpenResumeModal: () => void;
}

export default function ApplyModal({
  isOpen,
  onClose,
  job,
  user,
  resume,
  onApplySuccess,
  onOpenResumeModal
}: ApplyModalProps) {
  const [coverNote, setCoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          coverNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Open actual job page site in a new tab
      const targetUrl = getJobApplyUrl(job);
      window.open(targetUrl, '_blank', 'noopener,noreferrer');

      onApplySuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Apply to {job.company}</h3>
            <p className="text-xs text-slate-500">{job.title} • {job.location}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Attached Resume Indicator */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Attached Resume
            </label>
            {resume ? (
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{resume.original_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {resume.parsed_skills.length} skills • Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenResumeModal();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No resume attached yet.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenResumeModal();
                  }}
                  className="font-bold underline text-amber-900"
                >
                  Upload now
                </button>
              </div>
            )}
          </div>

          {/* Candidate Profile Details */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant Name:</span>
              <span className="font-semibold text-slate-800">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
            {job.match && (
              <div className="flex justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Criteria Match:</span>
                <span className="font-bold text-emerald-700">{job.match.score}% ({job.match.badge})</span>
              </div>
            )}
          </div>

          {/* Optional Cover Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Short Note or Cover Letter (Optional)
            </label>
            <textarea
              rows={4}
              value={coverNote}
              onChange={e => setCoverNote(e.target.value)}
              placeholder="Tell the hiring team why you are excited about this role and what unique skills you bring..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Job Site Info Banner */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Role posted on <strong>{job.company}</strong>'s careers portal</span>
            </div>
            <a
              href={getJobApplyUrl(job)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 underline underline-offset-2 shrink-0 ml-2"
            >
              <span>Visit Site</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Opening Job Site...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit & Go to {job.company} Job Site</span>
                  <ExternalLink className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
