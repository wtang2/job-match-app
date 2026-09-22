'use client';

import React, { useState, useRef } from 'react';
import {
  X, UploadCloud, FileText, CheckCircle2, AlertCircle, Download,
  Trash2, Plus, Sparkles, Loader2, ArrowRight
} from 'lucide-react';
import { ResumeData } from '@/lib/types';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeData | null;
  onUploadSuccess: (resume: ResumeData) => void;
  onLoadSample: (template: string) => Promise<void>;
  onUpdateSkills: (skills: string[]) => Promise<void>;
}

export default function ResumeModal({
  isOpen,
  onClose,
  resume,
  onUploadSuccess,
  onLoadSample,
  onUpdateSkills
}: ResumeModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload resume');
      }

      onUploadSuccess(data.resume);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleAddSkill = async () => {
    if (!newSkillInput.trim() || !resume) return;
    const skill = newSkillInput.trim();
    if (resume.parsed_skills.includes(skill)) {
      setNewSkillInput('');
      return;
    }
    const updated = [...resume.parsed_skills, skill];
    await onUpdateSkills(updated);
    setNewSkillInput('');
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!resume) return;
    const updated = resume.parsed_skills.filter(s => s !== skillToRemove);
    await onUpdateSkills(updated);
  };

  const handleSampleClick = async (template: string) => {
    setErrorMsg(null);
    setIsLoadingSample(true);
    try {
      await onLoadSample(template);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load sample resume');
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Manage Your Resume</h3>
              <p className="text-xs text-slate-500">Upload your resume to automatically extract skills & match jobs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop Upload Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {isUploading ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <div className="text-sm font-semibold text-slate-800">
                  Uploading & analyzing resume...
                </div>
                <div className="text-xs text-slate-500">
                  Extracting skills, experience, and education
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  Click to upload or drag & drop
                </div>
                <div className="text-xs text-slate-500">
                  Supports PDF, DOCX, TXT (up to 10MB)
                </div>
              </div>
            )}
          </div>

          {/* 1-Click Sample Resumes */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Test: Load Pre-Built Sample Resumes
              </span>
              {isLoadingSample && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                disabled={isLoadingSample}
                onClick={() => handleSampleClick('software_engineer')}
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all cursor-pointer font-medium text-slate-800"
              >
                <div className="font-bold text-slate-900">Senior Full Stack</div>
                <div className="text-[11px] text-slate-500">React, Next.js, Node, AWS</div>
              </button>

              <button
                disabled={isLoadingSample}
                onClick={() => handleSampleClick('product_manager')}
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all cursor-pointer font-medium text-slate-800"
              >
                <div className="font-bold text-slate-900">Product Manager</div>
                <div className="text-[11px] text-slate-500">Agile, Roadmaps, Figma</div>
              </button>

              <button
                disabled={isLoadingSample}
                onClick={() => handleSampleClick('ai_ml_engineer')}
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all cursor-pointer font-medium text-slate-800"
              >
                <div className="font-bold text-slate-900">AI / ML Engineer</div>
                <div className="text-[11px] text-slate-500">Python, PyTorch, LLMs</div>
              </button>
            </div>
          </div>

          {/* Active Resume Extracted Breakdown */}
          {resume ? (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Active Resume: {resume.original_name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Uploaded on {new Date(resume.uploaded_at).toLocaleDateString()}
                  </p>
                </div>

                <a
                  href="/api/resume/download"
                  download
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              </div>

              {/* Parsed Summary */}
              {resume.parsed_summary && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold block text-slate-800 mb-1">Professional Summary</span>
                  {resume.parsed_summary}
                </div>
              )}

              {/* Experience & Education Assessment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Experience */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-blue-950">Experience Assessment</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[11px]">
                      {resume.parsed_experience?.years || 1}+ Years
                    </span>
                  </div>
                  {resume.parsed_experience?.roles && resume.parsed_experience.roles.length > 0 && (
                    <div className="text-[11px] text-slate-600 mb-1">
                      <span className="font-semibold text-slate-700">Roles: </span>
                      {resume.parsed_experience.roles.slice(0, 4).join(', ')}
                    </div>
                  )}
                  {resume.parsed_experience?.companies && resume.parsed_experience.companies.length > 0 && (
                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Companies: </span>
                      {resume.parsed_experience.companies.join(', ')}
                    </div>
                  )}
                </div>

                {/* Education */}
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-slate-800">
                  <span className="font-bold text-emerald-950 block mb-1.5">Education & Degrees</span>
                  {resume.parsed_education?.degrees && resume.parsed_education.degrees.length > 0 ? (
                    <ul className="space-y-1">
                      {resume.parsed_education.degrees.map((deg, i) => (
                        <li key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{deg}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No formal degrees detected.</p>
                  )}
                </div>
              </div>

              {/* Extracted Skills with Editable Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Extracted Skills ({resume.parsed_skills.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Click x to remove or add custom skills below
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {resume.parsed_skills.map(skill => (
                    <span
                      key={skill}
                      className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-400 hover:text-rose-600 transition-colors"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Skill Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={e => setNewSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddSkill();
                    }}
                    placeholder="Add a new skill (e.g. Docker, Rust)..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    onClick={handleAddSkill}
                    disabled={!newSkillInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No resume uploaded yet. Upload your PDF or DOCX file to get started.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {resume ? `${resume.parsed_skills.length} skills active for job matching` : 'Upload resume to boost matching'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
