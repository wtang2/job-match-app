'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, X, Send, Sparkles, Bot, User as UserIcon,
  RotateCcw, ExternalLink, ChevronRight, Briefcase, ArrowUpRight,
  Lightbulb, FileText, CheckCircle2, ChevronDown, Maximize2, Minimize2
} from 'lucide-react';
import { JobWithMatch, User, ResumeData, ChatMessage, getJobApplyUrl } from '@/lib/types';

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
  user: User | null;
  resume: ResumeData | null;
  selectedJob: JobWithMatch | null;
  onSelectJob: (job: JobWithMatch) => void;
  onApplyJob: (job: JobWithMatch) => void;
}

export default function ChatBot({
  isOpen,
  onToggle,
  user,
  resume,
  selectedJob,
  onSelectJob,
  onApplyJob
}: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome greeting
  useEffect(() => {
    if (messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Hi ${user ? user.name.split(' ')[0] : 'there'}! 👋 I'm your **JobMatch AI Career Copilot**.

I can help you find high-match roles, draft personalized cover letters, analyze your resume skills, or prep for upcoming interviews.

How can I help with your job search today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          '🎯 Recommend top jobs for me',
          selectedJob ? `📝 Draft cover letter for ${selectedJob.company}` : '📝 Draft a tailored cover letter',
          '💡 How can I improve my match score?',
          selectedJob ? `🎤 Interview questions for ${selectedJob.title}` : '🎤 Technical interview prep'
        ]
      };
      setMessages([initialGreeting]);
    }
  }, [user, selectedJob]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setShowWelcomeTooltip(false);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          currentJobId: selectedJob?.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedJobs: data.recommendedJobs,
        suggestedFollowUps: data.suggestedFollowUps
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: `I'm having a little trouble connecting right now (${err.message || 'Network error'}). Please try again or ask about job recommendations!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg_cleared',
        role: 'assistant',
        content: `Chat cleared! What else would you like to explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          '🎯 Recommend top jobs for me',
          '💡 How can I improve my match score?',
          '📝 Draft a tailored cover letter'
        ]
      }
    ]);
  };

  // Helper to render markdown-like content (bold, bullet points, numbered lists, dividers)
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          if (trimmed === '---') {
            return <hr key={idx} className="my-2 border-slate-200" />;
          }

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1">
                {formatInlineFormatting(trimmed.replace('### ', ''))}
              </h4>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h5 key={idx} className="font-bold text-slate-800 text-xs mt-1.5 mb-0.5">
                {formatInlineFormatting(trimmed.replace('#### ', ''))}
              </h5>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{formatInlineFormatting(trimmed.slice(2))}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
                <span className="font-bold text-blue-600 shrink-0">{numMatch[1]}.</span>
                <span>{formatInlineFormatting(numMatch[2])}</span>
              </div>
            );
          }

          // Regular paragraph
          return <p key={idx}>{formatInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  // Inline formatter for bold (**text**), italics (*text*), and code (`code`)
  const formatInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-slate-600">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-blue-700 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          {showWelcomeTooltip && (
            <div className="hidden sm:flex items-center gap-2 bg-white text-slate-800 text-xs px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask Career Copilot anything!</span>
              <button
                onClick={() => setShowWelcomeTooltip(false)}
                className="text-slate-400 hover:text-slate-600 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={onToggle}
            className="group relative flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-xl hover:shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Open AI Career Copilot Chat"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            <span className="font-bold text-sm tracking-wide">AI Copilot</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          </button>
        </div>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl border border-slate-200/90 bg-white rounded-3xl overflow-hidden flex flex-col ${
            isExpanded
              ? 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[540px] h-[calc(100vh-3rem)] sm:h-[700px]'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] sm:h-[600px]'
          }`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm ring-2 ring-white/10">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white leading-tight">JobMatch Copilot</h3>
                  <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-400/30">
                    AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ready to assist your job search</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors hidden sm:block"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Badge (Shows current job / resume context) */}
          <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 truncate max-w-[280px]">
              <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {selectedJob ? (
                <span className="truncate">
                  Context: <strong>{selectedJob.company}</strong> ({selectedJob.title})
                </span>
              ) : (
                <span className="truncate">
                  {user ? `${user.name} • ${resume?.parsed_skills.length || 0} skills loaded` : 'General Job Search Mode'}
                </span>
              )}
            </div>
            {selectedJob && (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                {selectedJob.match?.score || 85}% Match
              </span>
            )}
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 custom-scrollbar">
            {messages.map(msg => {
              const isUser = msg.role === 'user';

              return (
                <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {isUser ? <p className="whitespace-pre-wrap">{msg.content}</p> : renderMessageContent(msg.content)}
                    </div>

                    {/* Interactive Recommended Job Cards */}
                    {!isUser && msg.recommendedJobs && msg.recommendedJobs.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Recommended Matching Roles:
                        </div>
                        {msg.recommendedJobs.map(job => (
                          <div
                            key={job.id}
                            className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:border-blue-300 transition-all text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-slate-900 leading-tight line-clamp-1">{job.title}</h5>
                                <p className="text-[11px] text-slate-500 font-medium">{job.company} • {job.location}</p>
                              </div>
                              {job.match && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200 shrink-0">
                                  {job.match.score}%
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                              <span className="font-semibold text-slate-700">
                                ${Math.round(job.salary_min / 1000)}k - ${Math.round(job.salary_max / 1000)}k
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => onSelectJob(job)}
                                  className="px-2 py-1 rounded-md text-blue-600 hover:bg-blue-50 font-semibold transition-colors cursor-pointer"
                                >
                                  View Role
                                </button>
                                <button
                                  onClick={() => onApplyJob(job)}
                                  className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  title="Apply on actual job page site"
                                >
                                  <span>Apply</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Follow-up Action Chips */}
                    {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedFollowUps.map((chip, chipIdx) => (
                          <button
                            key={chipIdx}
                            onClick={() => handleSendMessage(chip)}
                            className="px-2.5 py-1 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-[11px] font-medium border border-blue-200/70 transition-all text-left cursor-pointer flex items-center gap-1"
                          >
                            <span>{chip}</span>
                            <ChevronRight className="w-3 h-3 text-blue-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 px-1">{msg.timestamp}</div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-slate-500 ml-1.5 font-medium">Analyzing job market & profile...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar (Default suggested prompts) */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSendMessage('Recommend top jobs for my profile')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              🎯 Top Job Matches
            </button>
            <button
              onClick={() => handleSendMessage(selectedJob ? `Draft cover letter for ${selectedJob.company}` : 'Draft a tailored cover letter')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              📝 Draft Cover Letter
            </button>
            <button
              onClick={() => handleSendMessage('How can I improve my match score?')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              💡 Boost Match Score
            </button>
            <button
              onClick={() => handleSendMessage('Technical interview questions for full stack')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              🎤 Interview Prep
            </button>
          </div>

          {/* Input & Send Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Ask about jobs, resume advice, cover letters..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
