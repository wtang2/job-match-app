'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Search, Sparkles, Filter, FileText, CheckCircle2,
  AlertCircle, ArrowRight, Loader2, RefreshCw, UploadCloud, Layers, Globe,
  AlertTriangle, Mail
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import SearchHeader from '@/components/SearchHeader';
import JobCard from '@/components/JobCard';
import JobDetail from '@/components/JobDetail';
import ResumeModal from '@/components/ResumeModal';
import ApplyModal from '@/components/ApplyModal';
import AuthModal from '@/components/AuthModal';
import ProfileModal from '@/components/ProfileModal';
import ScraperModal from '@/components/ScraperModal';
import EmailPreviewModal from '@/components/EmailPreviewModal';
import ApplicationsView from '@/components/ApplicationsView';
import SavedJobsView from '@/components/SavedJobsView';
import ChatBot from '@/components/ChatBot';
import ToastContainer, { ToastMessage } from '@/components/Toast';
import { JobWithMatch, User, ResumeData, Application, SavedJob, getJobApplyUrl } from '@/lib/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'resume' | 'applications' | 'saved'>('jobs');
  const [user, setUser] = useState<User | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [jobs, setJobs] = useState<JobWithMatch[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobWithMatch | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);

  // Search & Filter state
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobType, setJobType] = useState('All');
  const [experience, setExperience] = useState('All');
  const [minSalary, setMinSalary] = useState(0);
  const [sortBy, setSortBy] = useState('match');

  // Loading states
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [scraperModalOpen, setScraperModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [jobToApply, setJobToApply] = useState<JobWithMatch | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch initial authentication status
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        if (data.user.desired_title && !searchTitle) {
          setSearchTitle(data.user.desired_title);
        }
        if (data.user.desired_location && !searchLocation) {
          setSearchLocation(data.user.desired_location);
        }

        // Fetch resume
        fetchResume();
        // Fetch applications & saved
        fetchApplications();
        fetchSavedJobs();
      }
    } catch (err) {
      console.error('Error checking auth:', err);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const fetchResume = async () => {
    try {
      const res = await fetch('/api/resume');
      const data = await res.json();
      if (data.resume) {
        setResume(data.resume);
      }
    } catch (err) {
      console.error('Error fetching resume:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const res = await fetch('/api/saved');
      const data = await res.json();
      if (data.savedJobs) {
        setSavedJobs(data.savedJobs);
      }
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
    }
  };

  // Search Jobs API query
  const fetchJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const params = new URLSearchParams();
      if (searchTitle.trim()) params.set('title', searchTitle.trim());
      if (searchLocation.trim()) params.set('location', searchLocation.trim());
      if (remoteOnly) params.set('remote', 'true');
      if (jobType !== 'All') params.set('jobType', jobType);
      if (experience !== 'All') params.set('experience', experience);
      if (minSalary > 0) params.set('minSalary', minSalary.toString());
      if (sortBy) params.set('sort', sortBy);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();

      if (data.jobs) {
        setJobs(data.jobs);
        // Select first job if none selected or selected is not in results
        if (data.jobs.length > 0) {
          const currentInNew = selectedJob ? data.jobs.find((j: JobWithMatch) => j.id === selectedJob.id) : null;
          setSelectedJob(currentInNew || data.jobs[0]);
        } else {
          setSelectedJob(null);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      showToast('Error loading jobs. Please try again.', 'error');
    } finally {
      setIsLoadingJobs(false);
    }
  }, [searchTitle, searchLocation, remoteOnly, jobType, experience, minSalary, sortBy, showToast, selectedJob]);

  // Initial load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Check URL query parameters for email verification result
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const verified = urlParams.get('verified');
      const error = urlParams.get('error');

      if (verified === 'true') {
        showToast('🎉 Success! Your email address has been verified.', 'success');
        checkAuth();
        window.history.replaceState({}, '', window.location.pathname);
      } else if (verified === 'false') {
        showToast(error ? decodeURIComponent(error) : 'Email verification failed or link expired.', 'error');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [checkAuth, showToast]);

  const handleResendVerificationFromBanner = async () => {
    if (!user) return;
    setIsResendingVerification(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Verification email resent! Check preview modal or inbox.', 'success');
      } else {
        showToast(data.error || 'Failed to resend verification email', 'error');
      }
    } catch {
      showToast('Error sending verification email', 'error');
    } finally {
      setIsResendingVerification(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [remoteOnly, jobType, experience, minSalary, sortBy]);

  // Handle Demo Login
  const handleDemoLogin = async (role: 'engineer' | 'designer' = 'engineer') => {
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setSearchTitle(data.user.desired_title || '');
        setSearchLocation(data.user.desired_location || '');
        await fetchResume();
        await fetchApplications();
        await fetchSavedJobs();
        await fetchJobs();
        showToast(`Logged in as ${data.user.name}! Matched to ${data.user.desired_title}.`, 'success');
      }
    } catch (err) {
      showToast('Failed to log in as demo user', 'error');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setResume(null);
      setApplications([]);
      setSavedJobs([]);
      showToast('You have been signed out.', 'info');
      fetchJobs();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Handle Toggle Save
  const handleToggleSave = async (job: JobWithMatch) => {
    if (!user) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id })
      });
      const data = await res.json();

      if (res.ok) {
        setJobs(prev =>
          prev.map(j => (j.id === job.id ? { ...j, isSaved: data.isSaved } : j))
        );
        if (selectedJob?.id === job.id) {
          setSelectedJob(prev => (prev ? { ...prev, isSaved: data.isSaved } : null));
        }
        await fetchSavedJobs();
        showToast(data.message, data.isSaved ? 'success' : 'info');
      }
    } catch (err) {
      showToast('Failed to update bookmark', 'error');
    }
  };

  // Handle Apply Trigger: Opens actual job page site and tracks application if user is logged in
  const handleApplyClick = async (job: JobWithMatch) => {
    const targetUrl = getJobApplyUrl(job);

    // Open actual job page site in a new tab immediately
    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    // If user is logged in, automatically track application in database
    if (user) {
      try {
        const res = await fetch('/api/jobs/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id })
        });
        if (res.ok) {
          setJobs(prev =>
            prev.map(j => (j.id === job.id ? { ...j, hasApplied: true } : j))
          );
          if (selectedJob?.id === job.id) {
            setSelectedJob(prev => (prev ? { ...prev, hasApplied: true } : null));
          }
          await fetchApplications();
          showToast(`Opening ${job.company} careers site... Application tracked in your dashboard!`, 'success');
          return;
        }
      } catch (err) {
        console.error('Failed to auto-track application:', err);
      }
    }

    showToast(`Opening ${job.company} careers site...`, 'info');
  };

  // Handle Custom Apply Modal Trigger (with cover note & resume review)
  const handleCustomApplyClick = (job: JobWithMatch) => {
    if (!user) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    setJobToApply(job);
    setApplyModalOpen(true);
  };

  // Handle Load Sample Resume
  const handleLoadSample = async (template: string) => {
    const res = await fetch('/api/resume/sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load sample');

    setResume(data.resume);
    await checkAuth();
    await fetchJobs();
    showToast(data.message, 'success');
  };

  // Handle Update Resume Skills
  const handleUpdateSkills = async (skills: string[]) => {
    const res = await fetch('/api/resume', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update skills');

    setResume(data.resume);
    await fetchJobs();
    showToast('Resume skills updated! Job match scores recalculated.', 'success');
  };

  // Handle Copy Link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'info');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        hasResume={Boolean(resume)}
        applicationsCount={applications.length}
        savedCount={savedJobs.length}
        onOpenAuth={mode => {
          setAuthModalMode(mode || 'login');
          setAuthModalOpen(true);
        }}
        onOpenDemo={handleDemoLogin}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenResumeModal={() => setResumeModalOpen(true)}
        onLogout={handleLogout}
        onToggleChat={() => setChatOpen(prev => !prev)}
        isChatOpen={chatOpen}
        onOpenEmailPreview={() => setEmailPreviewOpen(true)}
      />

      {/* Unverified Email Alert Banner */}
      {user && !user.email_verified && (
        <div className="bg-amber-50 border-b border-amber-200/90 px-4 py-2.5 sm:px-6 text-amber-900 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong className="font-bold text-amber-950">Email not verified:</strong> We sent a verification email to{' '}
                <span className="font-mono font-medium text-amber-950 underline">{user.email}</span>. Please verify your email by clicking the button in the email.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setEmailPreviewOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                Preview & Verify Email
              </button>
              <button
                onClick={handleResendVerificationFromBanner}
                disabled={isResendingVerification}
                className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResendingVerification ? 'Sending...' : 'Resend Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Tab Views */}
      {activeTab === 'jobs' && (
        <main className="flex-1 flex flex-col">
          {/* Hero Search & Criteria Bar */}
          <SearchHeader
            searchTitle={searchTitle}
            setSearchTitle={setSearchTitle}
            searchLocation={searchLocation}
            setSearchLocation={setSearchLocation}
            remoteOnly={remoteOnly}
            setRemoteOnly={setRemoteOnly}
            jobType={jobType}
            setJobType={setJobType}
            experience={experience}
            setExperience={setExperience}
            minSalary={minSalary}
            setMinSalary={setMinSalary}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSearch={fetchJobs}
            onOpenScraper={() => setScraperModalOpen(true)}
            user={user}
            hasResume={Boolean(resume)}
            resumeSkillsCount={resume?.parsed_skills?.length || 0}
            onOpenProfile={() => setProfileModalOpen(true)}
            onOpenResumeModal={() => setResumeModalOpen(true)}
            totalJobsFound={jobs.length}
          />

          {/* Job Search Content: Split View */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
            {/* Header info row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {searchTitle || searchLocation ? 'Matching Jobs' : 'All Recommended Opportunities'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {jobs.length} available
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScraperModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Scrape Live Web</span>
                </button>

                <button
                  onClick={fetchJobs}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors p-1"
                  title="Refresh jobs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingJobs ? 'animate-spin text-blue-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Split Screen Layout */}
            {isLoadingJobs ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <div className="text-sm font-bold text-slate-800">Searching matching jobs...</div>
                <div className="text-xs text-slate-500">Calculating compatibility and skill overlap</div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No jobs match your criteria</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Try broadening your search title or location, or remove some filters to explore more roles.
                </p>
                <button
                  onClick={() => {
                    setSearchTitle('');
                    setSearchLocation('');
                    setRemoteOnly(false);
                    setJobType('All');
                    setExperience('All');
                    setMinSalary(0);
                    fetchJobs();
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Job Cards List (5 cols on lg) */}
                <div className="lg:col-span-5 space-y-3.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1 custom-scrollbar">
                  {jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSelected={selectedJob?.id === job.id}
                      onSelect={() => setSelectedJob(job)}
                      onToggleSave={e => {
                        e.stopPropagation();
                        handleToggleSave(job);
                      }}
                      onApply={e => {
                        e.stopPropagation();
                        handleApplyClick(job);
                      }}
                    />
                  ))}
                </div>

                {/* Right Column: Sticky Job Detail (7 cols on lg) */}
                <div className="hidden lg:block lg:col-span-7 sticky top-20 h-[calc(100vh-100px)]">
                  {selectedJob && (
                    <JobDetail
                      job={selectedJob}
                      user={user}
                      hasResume={Boolean(resume)}
                      onApply={() => handleApplyClick(selectedJob)}
                      onCustomApply={() => handleCustomApplyClick(selectedJob)}
                      onToggleSave={() => handleToggleSave(selectedJob)}
                      onOpenResumeModal={() => setResumeModalOpen(true)}
                      onCopyLink={handleCopyLink}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Tab: My Resume */}
      {activeTab === 'resume' && (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 flex-1 w-full">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Your Resume & Extracted Profile</h2>
                  <p className="text-xs text-slate-500">
                    Uploaded resumes are analyzed to calculate real-time match scores against job openings
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResumeModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{resume ? 'Replace Resume' : 'Upload Resume'}</span>
                </button>
              </div>
            </div>

            {resume ? (
              <div className="mt-6 space-y-6">
                {/* Resume Meta Banner */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{resume.original_name}</span>
                    <span className="text-slate-500">
                      Uploaded on {new Date(resume.uploaded_at).toLocaleDateString()} • {(resume.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <a
                    href="/api/resume/download"
                    download
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 font-semibold text-xs hover:bg-blue-50 transition-colors inline-flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <span>Download Original</span>
                  </a>
                </div>

                {/* Extracted Summary */}
                {resume.parsed_summary && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Detected Professional Summary
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      {resume.parsed_summary}
                    </p>
                  </div>
                )}

                {/* Skills Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Extracted Match Skills ({resume.parsed_skills.length})
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      These skills are used to calculate match percentages
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {resume.parsed_skills.map(skill => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience & Education */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">Experience Assessment</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-bold text-xs">
                        {resume.parsed_experience?.years || 3}+ years
                      </span>
                    </div>
                    {resume.parsed_experience?.roles && resume.parsed_experience.roles.length > 0 && (
                      <div className="text-slate-700 mb-2">
                        <span className="font-semibold text-slate-900 block mb-1">Detected Roles:</span>
                        <div className="flex flex-wrap gap-1">
                          {resume.parsed_experience.roles.map((role, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-900 text-[11px] font-medium">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {resume.parsed_experience?.companies && resume.parsed_experience.companies.length > 0 && (
                      <div className="text-slate-600 text-[11px] mt-2 pt-2 border-t border-blue-100/60">
                        <span className="font-semibold text-slate-800">Companies: </span>
                        {resume.parsed_experience.companies.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <span className="font-bold text-slate-900 text-sm block mb-2">Education & Certifications</span>
                    {resume.parsed_education?.degrees && resume.parsed_education.degrees.length > 0 ? (
                      <div className="space-y-1.5">
                        {resume.parsed_education.degrees.map((deg, i) => (
                          <div key={i} className="p-2 rounded-xl bg-white border border-emerald-200 text-slate-800 flex items-start gap-2 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-[11px] font-medium">{deg}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No degrees or certifications detected.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">No resume on file</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                  Upload your resume in PDF, DOCX, or text format to get automated skill extraction and tailored match scoring.
                </p>
                <button
                  onClick={() => setResumeModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Resume Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Applications */}
      {activeTab === 'applications' && (
        <ApplicationsView
          applications={applications}
          onFindJobsClick={() => setActiveTab('jobs')}
        />
      )}

      {/* Tab: Saved Jobs */}
      {activeTab === 'saved' && (
        <SavedJobsView
          savedJobs={savedJobs}
          onRemoveSave={jobId => {
            const mockJob = { id: jobId } as JobWithMatch;
            handleToggleSave(mockJob);
          }}
          onApply={job => handleApplyClick(job)}
          onFindJobsClick={() => setActiveTab('jobs')}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-800">JobMatch AI</span> &copy; 2026 — Pair Programming Smart Job Search
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Resume Parsing</span>
            <span>•</span>
            <span>Skill Matching</span>
            <span>•</span>
            <span>Criteria Filtering</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={async newUser => {
          setUser(newUser);
          if (newUser.desired_title) setSearchTitle(newUser.desired_title);
          if (newUser.desired_location) setSearchLocation(newUser.desired_location);
          await fetchResume();
          await fetchApplications();
          await fetchSavedJobs();
          await fetchJobs();
          if (!newUser.email_verified) {
            showToast(`Account created! A verification email was sent to ${newUser.email}.`, 'info');
            setEmailPreviewOpen(true);
          } else {
            showToast(`Welcome, ${newUser.name}!`, 'success');
          }
        }}
        onDemoLogin={handleDemoLogin}
      />

      <ResumeModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        resume={resume}
        onUploadSuccess={async newResume => {
          setResume(newResume);
          await checkAuth();
          await fetchJobs();
          showToast(`Resume uploaded! ${newResume.parsed_skills.length} skills extracted. Match scores updated.`, 'success');
        }}
        onLoadSample={handleLoadSample}
        onUpdateSkills={handleUpdateSkills}
      />

      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        job={jobToApply}
        user={user}
        resume={resume}
        onApplySuccess={async () => {
          if (jobToApply) {
            setJobs(prev =>
              prev.map(j => (j.id === jobToApply.id ? { ...j, hasApplied: true } : j))
            );
            if (selectedJob?.id === jobToApply.id) {
              setSelectedJob(prev => (prev ? { ...prev, hasApplied: true } : null));
            }
          }
          await fetchApplications();
          showToast(`Application successfully sent to ${jobToApply?.company}!`, 'success');
        }}
        onOpenResumeModal={() => setResumeModalOpen(true)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onOpenEmailPreview={() => setEmailPreviewOpen(true)}
        onProfileUpdated={async updatedUser => {
          setUser(updatedUser);
          if (updatedUser.desired_title) setSearchTitle(updatedUser.desired_title);
          if (updatedUser.desired_location) setSearchLocation(updatedUser.desired_location);
          await fetchJobs();
          showToast('Search criteria updated and matching refreshed!', 'success');
        }}
      />

      <EmailPreviewModal
        isOpen={emailPreviewOpen}
        onClose={() => setEmailPreviewOpen(false)}
        onVerified={async () => {
          await checkAuth();
          showToast('🎉 Email successfully verified! Welcome to JobFinder.', 'success');
        }}
      />

      <ScraperModal
        isOpen={scraperModalOpen}
        onClose={() => setScraperModalOpen(false)}
        user={user}
        resume={resume}
        targetTitle={searchTitle}
        targetLocation={searchLocation}
        onScrapeComplete={async (newJobs, message) => {
          await fetchJobs();
          showToast(message, 'success');
        }}
      />

      {/* AI Career Copilot Chatbot */}
      <ChatBot
        isOpen={chatOpen}
        onToggle={() => setChatOpen(prev => !prev)}
        user={user}
        resume={resume}
        selectedJob={selectedJob}
        onSelectJob={job => {
          setSelectedJob(job);
          setActiveTab('jobs');
        }}
        onApplyJob={job => handleApplyClick(job)}
      />
    </div>
  );
}
