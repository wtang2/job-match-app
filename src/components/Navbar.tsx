'use client';

import React, { useState } from 'react';
import { Briefcase, FileText, BookmarkCheck, User, LogOut, SlidersHorizontal, Sparkles, ChevronDown, Check, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import { User as UserType } from '@/lib/types';

interface NavbarProps {
  activeTab: 'jobs' | 'resume' | 'applications' | 'saved';
  setActiveTab: (tab: 'jobs' | 'resume' | 'applications' | 'saved') => void;
  user: UserType | null;
  hasResume: boolean;
  applicationsCount: number;
  savedCount: number;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenDemo: (role?: 'engineer' | 'designer') => void;
  onOpenProfile: () => void;
  onOpenResumeModal: () => void;
  onLogout: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onOpenEmailPreview?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  hasResume,
  applicationsCount,
  savedCount,
  onOpenAuth,
  onOpenDemo,
  onOpenProfile,
  onOpenResumeModal,
  onLogout,
  onToggleChat,
  isChatOpen,
  onOpenEmailPreview
}: NavbarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('jobs')}
              className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  JobMatch<span className="text-blue-600">AI</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">PRO</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium -mt-1">Intelligent Career Finder</div>
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'jobs'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                Find Jobs
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    onOpenAuth('login');
                  } else {
                    setActiveTab('resume');
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'resume'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>My Resume</span>
                {hasResume && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" title="Resume Active" />
                )}
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    onOpenAuth('login');
                  } else {
                    setActiveTab('applications');
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'applications'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Applications</span>
                {applicationsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {applicationsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    onOpenAuth('login');
                  } else {
                    setActiveTab('saved');
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'saved'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span>Saved Jobs</span>
                {savedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
                    {savedCount}
                  </span>
                )}
              </button>

              {onToggleChat && (
                <button
                  onClick={onToggleChat}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isChatOpen
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                  title="Open AI Career Assistant"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Copilot</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Section / Auth */}
          <div className="flex items-center gap-3">
            {onToggleChat && (
              <button
                onClick={onToggleChat}
                className={`md:hidden flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  isChatOpen
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
                title="Toggle AI Career Copilot Chat"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Upload Resume Button */}
                <button
                  onClick={onOpenResumeModal}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{hasResume ? 'Update Resume' : 'Upload Resume'}</span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all focus:outline-none cursor-pointer"
                  >
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</div>
                      <div className="text-[11px] text-slate-500 max-w-[130px] truncate">
                        {user.desired_title || user.headline || 'Job Seeker'}
                      </div>
                    </div>
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                      {!user.email_verified && (
                        <span
                          title="Email not verified"
                          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"
                        />
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 mr-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                            {user.email_verified ? (
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-200 shrink-0">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Not Verified
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                          {user.desired_title && (
                            <div className="mt-2 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium inline-block">
                              Target: {user.desired_title}
                            </div>
                          )}
                        </div>

                        {!user.email_verified && (
                          <div className="mx-3 my-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Email address not verified</span>
                            </div>
                            <p className="text-[10px] text-amber-800/90 leading-tight">
                              Please check your inbox or preview the verification email.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              {onOpenEmailPreview && (
                                <button
                                  onClick={() => {
                                    setProfileDropdownOpen(false);
                                    onOpenEmailPreview();
                                  }}
                                  className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                >
                                  <Mail className="w-3 h-3" /> Preview Email
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setProfileDropdownOpen(false);
                                  onOpenProfile();
                                }}
                                className="text-[10px] font-medium text-amber-800 hover:underline"
                              >
                                Manage in Profile
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="py-1">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              onOpenProfile();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                          >
                            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                            <span>Edit Target Criteria & Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              setActiveTab('resume');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                          >
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span>Manage Resume & Skills</span>
                          </button>
                        </div>

                        <div className="pt-1 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              onLogout();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                          >
                            <LogOut className="w-4 h-4 text-rose-500" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* 1-Click Demo Button */}
                <div className="relative">
                  <button
                    onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Demo Login</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                  </button>

                  {demoDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDemoDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50">
                        <div className="text-xs font-medium text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                          Instant Test Profiles
                        </div>
                        <button
                          onClick={() => {
                            setDemoDropdownOpen(false);
                            onOpenDemo('engineer');
                          }}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-blue-50 transition-colors flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            AC
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Alex Chen (Full Stack)</div>
                            <div className="text-[11px] text-slate-500">React, Next.js, Node.js, AWS</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setDemoDropdownOpen(false);
                            onOpenDemo('designer');
                          }}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-purple-50 transition-colors flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            EZ
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">Emily Zhang (UI/UX)</div>
                            <div className="text-[11px] text-slate-500">Figma, Design Systems, UX</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Sign In
                </button>

                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
