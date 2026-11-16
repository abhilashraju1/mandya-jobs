'use client';

import React from 'react';
import { JobDTO } from '@mandya-jobs/types';
import { MapPin, Calendar, CheckCircle2, Building2 } from 'lucide-react';

interface JobCardProps {
  job: JobDTO;
  currentLang: 'en' | 'kn';
  onApply: (job: JobDTO) => void;
  isApplied?: boolean;
}

export function JobCard({ job, currentLang, onApply, isApplied }: JobCardProps) {
  const matchScore = job.match?.score || 92;
  const matchColor =
    matchScore >= 85
      ? 'text-teal-700 bg-teal-50 border-teal-200'
      : matchScore >= 70
      ? 'text-blue-700 bg-blue-50 border-blue-200'
      : 'text-slate-600 bg-slate-100 border-slate-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
            {job.orgVerified && (
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" title="Verified Employer" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="font-medium text-slate-700">{job.orgName}</span>
            <span>•</span>
            <span>{job.orgBusinessType}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              {job.taluk}
            </span>
          </div>
        </div>

        {/* Match Percentage Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${matchColor}`}>
          {matchScore}% {currentLang === 'kn' ? 'ಹೊಂದಾಣಿಕೆ' : 'match'}
        </div>
      </div>

      {/* Salary & Walk-in Highlights */}
      <div className="flex flex-wrap items-center gap-2 my-3 text-xs">
        {job.salaryMin && job.salaryMax && (
          <span className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
            ₹{job.salaryMin.toLocaleString()} - ₹{job.salaryMax.toLocaleString()} / mo
          </span>
        )}
        {job.isWalkIn && (
          <span className="font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-600" />
            {currentLang === 'kn' ? 'ನೇರ ಸಂದರ್ಶನ (Walk-in)' : 'Walk-in Interview'}
          </span>
        )}
      </div>

      {/* Explainable Match Reason */}
      {job.match?.reasons && job.match.reasons.length > 0 && (
        <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <span className="font-medium text-slate-700">{job.match.reasons.join(' • ')}</span>
        </p>
      )}

      {/* Action CTA */}
      <div className="pt-2">
        <button
          onClick={() => onApply(job)}
          disabled={isApplied}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition shadow-sm ${
            isApplied
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.99]'
          }`}
        >
          {isApplied
            ? currentLang === 'kn'
              ? 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ'
              : 'Applied'
            : currentLang === 'kn'
            ? 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ (Apply)'
            : 'Apply'}
        </button>
      </div>
    </div>
  );
}
