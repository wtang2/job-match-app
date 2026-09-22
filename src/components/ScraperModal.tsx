'use client';

import React, { useState } from 'react';
import {
  X, Globe, Sparkles, Key, CheckCircle2, AlertCircle, Loader2,
  ArrowRight, Building2, MapPin, DollarSign, ExternalLink, ShieldCheck, Zap
} from 'lucide-react';
import { JobWithMatch, User, ResumeData, getJobApplyUrl } from '@/lib/types';

interface ScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  resume: ResumeData | null;
  targetTitle: string;
  targetLocation: string;
  onScrapeComplete: (jobs: JobWithMatch[], message: string) => void;
}

export default function ScraperModal({
  isOpen,
  onClose,
  user,
  resume,
  targetTitle,
  targetLocation,
  onScrapeComplete
}: ScraperModalProps) {
  const [brightDataApiKey, setBrightDataApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingStep, setScrapingStep] = useState(0);
  const [scrapedResults, setScrapedResults] = useState<JobWithMatch[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTitle = targetTitle || user?.desired_title || 'Software Engineer';
  const currentLocation = targetLocation || user?.desired_location || 'SF Bay Area, CA';
  const skillsCount = resume?.parsed_skills?.length || 0;

  const handleStartScraping = async () => {
    setErrorMsg(null);
    setIsScraping(true);
    setScrapedResults(null);
    setScrapingStep(1);

    // Step 1: Connecting
    setTimeout(() => setScrapingStep(2), 700);
    // Step 2: Querying
    setTimeout(() => setScrapingStep(3), 1600);
    // Step 3: Scoring
    setTimeout(() => setScrapingStep(4), 2400);

    try {
      const res = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTitle,
          location: currentLocation,
          brightDataApiKey: brightDataApiKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to scrape live jobs');
      }

      setScrapedResults(data.jobs);
      onScrapeComplete(data.jobs, data.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Scraping request failed');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Live Web Scraper & Bright Data</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Scrape live job postings matching your exact skillset and location
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Target Criteria Overview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Scraping Target Criteria
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Role</span>
                  <span className="font-bold text-slate-800">{currentTitle}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Location</span>
                  <span className="font-bold text-slate-800">{currentLocation}</span>
                </div>
              </div>
            </div>

            {resume && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Matching with your resume: <strong className="text-slate-800">{skillsCount} skills</strong>
                </span>
                <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                  {resume.parsed_skills.slice(0, 4).join(', ')}...
                </span>
              </div>
            )}
          </div>

          {/* Bright Data Integration Setting */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xs border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Bright Data Enterprise Scraper
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px]">
                      READY
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Extracts from Google Jobs, Indeed, and top Bay Area company boards
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 cursor-pointer"
              >
                {showKeyInput ? 'Hide Key' : 'Add Custom Key'}
              </button>
            </div>

            {showKeyInput && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Bright Data API Key / Token (Optional)
                </label>
                <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={brightDataApiKey}
                    onChange={e => setBrightDataApiKey(e.target.value)}
                    placeholder="e.g. bdata_api_live_..."
                    className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  If omitted, our dual-engine live scraper runs automatically with real Bay Area job feeds.
                </p>
              </div>
            )}
          </div>

          {/* Scraping Progress Animation */}
          {isScraping && (
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-3 animate-in fade-in">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {scrapingStep === 1 && 'Connecting to Bright Data & Live Web Scrapers...'}
                  {scrapingStep === 2 && `Querying Bay Area tech boards for "${currentTitle}"...`}
                  {scrapingStep === 3 && 'Extracting job requirements, salaries, and tech stacks...'}
                  {scrapingStep === 4 && `Scoring compatibility against your ${skillsCount} resume skills...`}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Filtering for roles in {currentLocation}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(scrapingStep / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Scraped Results Preview */}
          {scrapedResults && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Successfully Scraped {scrapedResults.length} Matching Roles!
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Top Match: {scrapedResults[0]?.match?.score}%
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {scrapedResults.map(job => (
                  <div
                    key={job.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                        {job.company ? job.company.charAt(0) : <Building2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{job.title}</div>
                        <div className="text-slate-500 text-[11px]">
                          {job.company} • {job.location}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {job.match && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px]">
                          {job.match.score}%
                        </span>
                      )}
                      <a
                        href={getJobApplyUrl(job)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Visit actual job page site"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>

          {scrapedResults ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore Scraped Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isScraping}
              onClick={handleStartScraping}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isScraping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scraping Live Web...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Scrape Live Matching Jobs</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
