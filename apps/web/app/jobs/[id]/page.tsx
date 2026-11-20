'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '../../../components/Navbar';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { fetchJobById, submitApplication } from '../../../lib/api';
import { JobDTO, ApplicationStatus } from '@mandya-jobs/types';
import { useLanguage } from '../../../context/LanguageContext';
import { MapPin, Calendar, CheckCircle2, ArrowLeft, Share2, Building2, ExternalLink, Phone } from 'lucide-react';
import Link from 'next/link';

export default function JobDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { lang, toggleLanguage } = useLanguage();
  const [job, setJob] = useState<JobDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applyNotice, setApplyNotice] = useState('');
  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchJobById(id)
      .then((data) => {
        setJob(data);
      })
      .catch(() => {
        setJob(null);
      })
      .finally(() => setIsLoading(false));

    try {
      const stored = localStorage.getItem('mandya_applied_jobs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[id]) setHasApplied(true);
      }
    } catch {}
  }, [id]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setShareNotice(lang === 'kn' ? 'ಲಿಂಕ್ ನಕಲಿಸಲಾಗಿದೆ!' : 'Shareable link copied to clipboard!');
      setTimeout(() => setShareNotice(''), 3000);
    }
  };

  const handleApply = async () => {
    if (!job) return;
    try {
      const storedProfile = JSON.parse(localStorage.getItem('mandya_candidate_profile') || '{}');
      const candidateName = storedProfile.fullName || storedProfile.name || 'Job Seeker';
      const candidatePhone = storedProfile.phone || '9845987654';

      await submitApplication({
        jobId: job.id,
        candidate: {
          id: storedProfile.id || `cand_${Date.now()}`,
          name: candidateName,
          phone: candidatePhone,
          taluk: storedProfile.taluk || job.taluk,
        },
      });

      const appliedMap = JSON.parse(localStorage.getItem('mandya_applied_jobs') || '{}');
      appliedMap[job.id] = true;
      localStorage.setItem('mandya_applied_jobs', JSON.stringify(appliedMap));

      setHasApplied(true);
      setApplyNotice(
        lang === 'kn'
          ? `ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು "${job.title}" ಹುದ್ದೆಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!`
          : `Application submitted successfully for "${job.title}"!`
      );
      setTimeout(() => setApplyNotice(''), 5000);
    } catch (err: any) {
      setApplyNotice(err.message || 'Failed to submit application.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B] pb-20">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={toggleLanguage} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'kn' ? 'ಉದ್ಯೋಗ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Vacancies'}</span>
          </Link>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'kn' ? 'ಹಂಚಿಕೊಳ್ಳಿ' : 'Share'}</span>
          </button>
        </div>

        {shareNotice && (
          <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800 text-center">
            {shareNotice}
          </div>
        )}

        {applyNotice && (
          <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{applyNotice}</span>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            {lang === 'kn' ? 'ಹುದ್ದೆಯ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading vacancy details...'}
          </div>
        ) : !job ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <p className="text-sm font-bold text-slate-800">
              {lang === 'kn' ? 'ಹುದ್ದೆ ಲಭ್ಯವಿಲ್ಲ ಅಥವಾ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' : 'Vacancy not found or pending review'}
            </p>
            <p className="text-xs text-slate-500">
              {lang === 'kn'
                ? 'ಈ ಹುದ್ದೆಯನ್ನು ಹಿಂಪಡೆಯಲಾಗಿದೆ ಅಥವಾ ಅನುಮೋದನೆಯಾಗುವವರೆಗೆ ಖಾಸಗಿಯಾಗಿದೆ.'
                : 'This job may have been unlisted or is awaiting admin verification before publication.'}
            </p>
            <Link
              href="/"
              className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
            >
              {lang === 'kn' ? 'ಇತರ ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ' : 'Browse verified vacancies'}
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{job.title}</h1>
                {job.orgVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-700">{job.orgName} • {job.orgBusinessType}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.addressDisplay || `${job.taluk}, Mandya`}</span>
              </p>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Salary</span>
                <span className="font-bold text-slate-800">
                  {job.salaryMin && job.salaryMax ? `₹${job.salaryMin} - ₹${job.salaryMax}` : 'Negotiable'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Work Type</span>
                <span className="font-bold text-slate-800">{job.employmentType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Education</span>
                <span className="font-bold text-slate-800">{job.minEducation || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Experience</span>
                <span className="font-bold text-slate-800">
                  {job.minExpYears === 0 ? 'Freshers welcome' : `${job.minExpYears}+ yrs`}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {/* Required Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Required Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Walk-in Info */}
            {job.isWalkIn && job.walkInVenue && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Walk-in Interview Details</span>
                </h3>
                <p className="text-amber-800">Venue: <span className="font-semibold">{job.walkInVenue}</span></p>
                {job.walkInTimings && <p className="text-amber-800">Timings: {job.walkInTimings}</p>}
              </div>
            )}

            {/* Route-Aware Application Actions */}
            <div className="pt-4 border-t border-slate-100">
              {job.applicationRoute === 'EXTERNAL_URL' && job.externalApplicationUrl ? (
                <a
                  href={job.externalApplicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <span>Apply on Company Website</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : job.applicationRoute === 'PHONE_CALL' && job.contactPhone ? (
                <a
                  href={`tel:${job.contactPhone}`}
                  className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Employer ({job.contactPhone})</span>
                </a>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={hasApplied}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition shadow-sm ${
                    hasApplied
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.99]'
                  }`}
                >
                  {hasApplied
                    ? lang === 'kn' ? 'ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ' : 'Application Submitted'
                    : lang === 'kn' ? 'ನೇರ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ' : 'Apply on Mandya Jobs'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
