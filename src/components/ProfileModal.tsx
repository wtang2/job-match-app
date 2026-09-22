'use client';

import React, { useState } from 'react';
import { X, User, Briefcase, MapPin, DollarSign, Check, Loader2, AlertCircle, AlertTriangle, CheckCircle2, Mail, Send } from 'lucide-react';
import { User as UserType } from '@/lib/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onProfileUpdated: (updatedUser: UserType) => void;
  onOpenEmailPreview?: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
  onOpenEmailPreview
}: ProfileModalProps) {
  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [desiredTitle, setDesiredTitle] = useState(user?.desired_title || '');
  const [desiredLocation, setDesiredLocation] = useState(user?.desired_location || '');
  const [desiredJobType, setDesiredJobType] = useState(user?.desired_job_type || 'Full-time');
  const [minSalary, setMinSalary] = useState(user?.min_salary?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setResendStatus(null);
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus('Email Sent!');
        setTimeout(() => setResendStatus(null), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to resend email');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error resending verification');
    } finally {
      setIsResending(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          headline,
          desired_title: desiredTitle,
          desired_location: desiredLocation,
          desired_job_type: desiredJobType,
          min_salary: minSalary ? Number(minSalary) : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update preferences');
      }

      onProfileUpdated(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating criteria');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Job Search Criteria & Preferences</h3>
            <p className="text-xs text-slate-500">Configure your target role, location, and salary goals</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email Verification Status Card */}
          {user.email_verified ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{user.email}</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700">Email address is verified</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[190px]">{user.email}</span>
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Not Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 mt-0.5 leading-snug">
                      Your email is not verified. Please verify your email address to ensure full account access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/70">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {resendStatus || 'Resend Verification Email'}
                </button>
                {onOpenEmailPreview && (
                  <button
                    type="button"
                    onClick={onOpenEmailPreview}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/50 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3 h-3 text-amber-600" />
                    Preview Email
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Desired Job Title
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={desiredTitle}
                onChange={e => setDesiredTitle(e.target.value)}
                placeholder="e.g. Full Stack Engineer, UX Designer"
                className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Desired Location
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={desiredLocation}
                onChange={e => setDesiredLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA or Remote"
                className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Employment Type
              </label>
              <select
                value={desiredJobType}
                onChange={e => setDesiredJobType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Salary ($/yr)
              </label>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="number"
                  step="5000"
                  value={minSalary}
                  onChange={e => setMinSalary(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Professional Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer with 6+ years experience"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save & Update Matching</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
