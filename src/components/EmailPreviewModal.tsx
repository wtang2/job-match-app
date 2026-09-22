'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, ExternalLink, RefreshCw, X, Copy, Check, Clock } from 'lucide-react';
import { SentEmail } from '@/lib/types';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
}

export default function EmailPreviewModal({ isOpen, onClose, onVerified }: EmailPreviewModalProps) {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/emails');
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        if (data.emails && data.emails.length > 0) {
          setSelectedEmail(data.emails[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyDirectly = async (actionUrl?: string) => {
    if (!actionUrl) return;
    try {
      setVerifying(true);
      setStatusMessage(null);
      // Extract token from URL
      const url = new URL(actionUrl, window.location.origin);
      const token = url.searchParams.get('token');

      if (token) {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatusMessage('✅ Email successfully verified!');
          if (onVerified) onVerified();
          setTimeout(() => {
            onClose();
          }, 1500);
          return;
        } else {
          setStatusMessage(`❌ Verification failed: ${data.error || 'Unknown error'}`);
        }
      } else {
        // Fallback open link directly
        window.location.href = actionUrl;
      }
    } catch (err: any) {
      setStatusMessage(`❌ Verification error: ${err.message || 'Unknown error'}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyLink = (url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Simulated Email Inbox
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  Local Dev
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                View sent emails and test the email verification button in 1-click
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh emails"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {statusMessage && (
            <div className={`p-3 rounded-xl text-sm font-medium border ${
              statusMessage.startsWith('✅')
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {statusMessage}
            </div>
          )}

          {loading && emails.length === 0 ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Checking inbox...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="py-16 text-center text-gray-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">No emails sent yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Trigger a verification email from your profile or create a new account to see the verification email here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Email meta card */}
              {selectedEmail && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-2">
                    <span className="font-semibold text-gray-700 text-sm">{selectedEmail.subject}</span>
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(selectedEmail.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-gray-600 gap-2">
                    <div>
                      <span>To: </span>
                      <strong className="text-gray-900 font-mono">{selectedEmail.to_email}</strong>
                    </div>
                    {selectedEmail.action_url && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(selectedEmail.action_url)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copied ? 'Copied' : 'Copy link'}
                        </button>
                        <button
                          onClick={() => handleVerifyDirectly(selectedEmail.action_url)}
                          disabled={verifying}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors shadow-xs"
                        >
                          {verifying ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Click Button Directly
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Email preview frame */}
              {selectedEmail && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  <div className="bg-gray-100/80 px-4 py-2 text-[11px] font-mono text-gray-500 border-b border-gray-200 flex items-center justify-between">
                    <span>Rendered Email Preview</span>
                    <span>HTML View</span>
                  </div>
                  <div
                    className="p-4 max-h-[420px] overflow-y-auto bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Emails are stored in local SQLite database (`sent_emails` table).</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
