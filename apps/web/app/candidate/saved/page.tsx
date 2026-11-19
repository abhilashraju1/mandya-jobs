'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/Navbar';
import { MobileBottomNav } from '../../../components/MobileBottomNav';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { JobCard } from '../../../components/JobCard';
import { JobDTO } from '@mandya-jobs/types';
import { Bookmark, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';
import { submitApplication } from '../../../lib/api';

export default function CandidateSavedJobsPage() {
  const { lang, toggleLanguage } = useLanguage();
  const [savedJobs, setSavedJobs] = useState<JobDTO[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mandya_saved_jobs');
      if (stored) {
        setSavedJobs(JSON.parse(stored));
      } else {
        setSavedJobs([]);
      }

      const storedApplied = localStorage.getItem('mandya_applied_jobs');
      if (storedApplied) {
        setAppliedJobs(JSON.parse(storedApplied));
      }
    } catch {
      setSavedJobs([]);
    }
  }, []);

  const handleApply = (job: JobDTO) => {
    setAppliedJobs((prev) => {
      const next = { ...prev, [job.id]: true };
      try {
        localStorage.setItem('mandya_applied_jobs', JSON.stringify(next));

        const existingApps = JSON.parse(localStorage.getItem('mandya_applications') || '[]');
        if (!existingApps.some((a: any) => a.jobId === job.id)) {
          const profile = JSON.parse(localStorage.getItem('mandya_candidate_profile') || '{}');
          const candidateName = profile.fullName || profile.name || 'Candidate';
          const candidatePhone = profile.phone || '9845987654';

          submitApplication({
            jobId: job.id,
            candidate: {
              id: profile.id || `cand_${Date.now()}`,
              name: candidateName,
              phone: candidatePhone,
              taluk: profile.taluk || 'Mandya Town',
              matchScore: job.match?.score,
            },
          }).catch((e) => console.debug('API submit err:', e));

          const newApp = {
            id: `app_${Date.now()}`,
            jobId: job.id,
            jobTitle: job.title,
            orgName: job.orgName,
            candidateId: profile.id || `cand_${Date.now()}`,
            candidateName,
            candidatePhone,
            candidateTaluk: profile.taluk || 'Mandya Town',
            matchScore: job.match?.score,
            resumeName: profile.resumeName || 'Uploaded_Resume.pdf',
            status: 'SUBMITTED',
            createdAt: new Date().toISOString(),
            statusHistory: [
              {
                status: 'SUBMITTED',
                note: 'Application submitted from Saved Jobs',
                changedAt: 'Just now',
              },
            ],
          };
          localStorage.setItem('mandya_applications', JSON.stringify([newApp, ...existingApps]));
        }
      } catch {
        // fallback
      }
      return next;
    });
  };

  const handleToggleSave = (jobId: string) => {
    setSavedJobs((prev) => {
      const next = prev.filter((j) => j.id !== jobId);
      try {
        localStorage.setItem('mandya_saved_jobs', JSON.stringify(next));
      } catch {
        // fallback
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B] pb-24">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={toggleLanguage} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="text-slate-500 hover:text-slate-800 p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-black text-slate-900">
            {lang === 'kn' ? 'ಉಳಿಸಿದ ಉದ್ಯೋಗಗಳು' : 'Saved Jobs'}
          </h1>
        </div>

        {savedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto">
            <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h2 className="font-bold text-sm text-slate-700">
              {lang === 'kn' ? 'ಉಳಿಸಿದ ಉದ್ಯೋಗಗಳಿಲ್ಲ' : 'No saved jobs yet'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {lang === 'kn'
                ? 'ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕುವಾಗ ಬುಕ್‌ಮಾರ್ಕ್ ಮಾಡಿ ನಂತರ ಪರಿಶೀಲಿಸಿ.'
                : 'Bookmark vacancies while browsing to review and apply later.'}
            </p>
            <Link
              href="/"
              className="inline-block py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              {lang === 'kn' ? 'ಉದ್ಯೋಗಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ' : 'Browse Jobs'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                currentLang={lang}
                onApply={handleApply}
                onToggleSave={handleToggleSave}
                isApplied={appliedJobs[job.id]}
                isSaved={true}
              />
            ))}
          </div>
        )}
      </main>

      <MobileBottomNav currentLang={lang} savedCount={savedJobs.length} />
    </div>
  );
}
