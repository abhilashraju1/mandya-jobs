'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/Navbar';
import { MobileBottomNav } from '../../../components/MobileBottomNav';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { JobCard } from '../../../components/JobCard';
import { JobDTO, EmploymentType, WorkMode, SalaryPeriod } from '@mandya-jobs/types';
import { Bookmark, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const INITIAL_SAVED_JOBS: JobDTO[] = [
  {
    id: 'job_1',
    orgId: 'org_1',
    orgName: 'Sri Lakshmi Showroom',
    orgBusinessType: 'Showroom',
    orgVerified: true,
    categoryId: 'showrooms',
    categoryName: 'Showrooms',
    title: 'Billing Executive',
    employmentType: EmploymentType.FULL_TIME,
    workMode: WorkMode.ON_SITE,
    taluk: 'Anna Nagar · Mandya',
    addressDisplay: 'VV Road, Mandya',
    salaryMin: 15000,
    salaryMax: 20000,
    salaryPeriod: SalaryPeriod.MONTHLY,
    isNegotiable: true,
    minExpYears: 1,
    minEducation: 'PUC / Graduate',
    openings: 2,
    description: 'Handle counter billing, POS operations, and Tally updates.',
    benefits: ['PF', 'ESI'],
    requiredSkills: ['billing', 'tally', 'customer service'],
    preferredSkills: ['ms excel'],
    isWalkIn: true,
    status: 'PUBLISHED' as any,
    createdAt: new Date().toISOString(),
    match: {
      score: 92,
      reasons: ['Matches: billing, tally, customer'],
      missingSkills: [],
      isEligible: true,
    },
  },
];

export default function CandidateSavedJobsPage() {
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [savedJobs, setSavedJobs] = useState<JobDTO[]>(INITIAL_SAVED_JOBS);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});

  const handleApply = (job: JobDTO) => {
    setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B] pb-24">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={() => setLang((p) => (p === 'en' ? 'kn' : 'en'))} />

      <main className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="text-slate-500 hover:text-slate-800 p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-black text-slate-900">
            {lang === 'kn' ? 'ಉಳಿಸಿದ ಉದ್ಯೋಗಗಳು' : 'Saved Jobs'}
          </h1>
        </div>

        {savedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h2 className="font-bold text-sm text-slate-700">No saved jobs yet</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Bookmark vacancies while browsing to review and apply later.
            </p>
            <Link
              href="/"
              className="inline-block py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                currentLang={lang}
                onApply={handleApply}
                isApplied={appliedJobs[job.id]}
              />
            ))}
          </div>
        )}
      </main>

      <MobileBottomNav currentLang={lang} savedCount={savedJobs.length} />
    </div>
  );
}
