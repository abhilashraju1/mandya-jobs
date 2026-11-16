'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { JobCard } from '../components/JobCard';
import { OfflineBanner } from '../components/OfflineBanner';
import { JobDTO, EmploymentType, WorkMode, SalaryPeriod } from '@mandya-jobs/types';
import { Search, UploadCloud, UserCheck, CheckCircle2, X } from 'lucide-react';

const INITIAL_JOBS: JobDTO[] = [
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
    description: 'Handle counter billing, POS operations, Tally inventory updates, and customer queries.',
    benefits: ['ESI', 'PF', 'Performance Bonus'],
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
  {
    id: 'job_2',
    orgId: 'org_2',
    orgName: 'Green Leaf Hotel',
    orgBusinessType: 'Hotel',
    orgVerified: true,
    categoryId: 'hospitality',
    categoryName: 'Hospitality',
    title: 'Front Desk Associate',
    employmentType: EmploymentType.FULL_TIME,
    workMode: WorkMode.ON_SITE,
    taluk: 'T. Nagar · Mandya',
    addressDisplay: 'Highway Road, Mandya',
    salaryMin: 14000,
    salaryMax: 18000,
    salaryPeriod: SalaryPeriod.MONTHLY,
    isNegotiable: false,
    minExpYears: 1,
    minEducation: 'PUC',
    openings: 3,
    description: 'Manage guest check-ins, reservations, and customer support.',
    benefits: ['Duty Meals Provided'],
    requiredSkills: ['customer service', 'english'],
    preferredSkills: ['hotel software'],
    isWalkIn: false,
    status: 'PUBLISHED' as any,
    createdAt: new Date().toISOString(),
    match: {
      score: 78,
      reasons: ['Matches: customer service, english'],
      missingSkills: ['hotel software'],
      isEligible: true,
    },
  },
  {
    id: 'job_3',
    orgId: 'org_3',
    orgName: 'City College',
    orgBusinessType: 'College',
    orgVerified: true,
    categoryId: 'education',
    categoryName: 'Education',
    title: 'Lab Assistant',
    employmentType: EmploymentType.FULL_TIME,
    workMode: WorkMode.ON_SITE,
    taluk: 'Velachery · Mandya',
    addressDisplay: 'College Road, Mandya',
    salaryMin: 12000,
    salaryMax: 16000,
    salaryPeriod: SalaryPeriod.MONTHLY,
    isNegotiable: false,
    minExpYears: 1,
    minEducation: 'Diploma / BSc',
    openings: 1,
    description: 'Laboratory upkeep, equipment maintenance, and chemical preparation.',
    benefits: ['Health Coverage'],
    requiredSkills: ['lab safety', 'dmlt', 'chemistry basics'],
    preferredSkills: [],
    isWalkIn: true,
    status: 'PUBLISHED' as any,
    createdAt: new Date().toISOString(),
    match: {
      score: 34,
      reasons: ['Basic location match'],
      missingSkills: ['dmlt', 'pathology testing'],
      isEligible: true,
    },
  },
];

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [activeModalJob, setActiveModalJob] = useState<JobDTO | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState('');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'kn' : 'en'));
  };

  const handleApplyClick = (job: JobDTO) => {
    setActiveModalJob(job);
  };

  const confirmApplication = () => {
    if (activeModalJob) {
      setAppliedJobs((prev) => ({ ...prev, [activeModalJob.id]: true }));
      setApplySuccessMessage(
        lang === 'kn'
          ? `ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ${activeModalJob.orgName} ಸಂಸ್ಥೆಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!`
          : `Application submitted successfully to ${activeModalJob.orgName}!`
      );
      setActiveModalJob(null);
      setTimeout(() => setApplySuccessMessage(''), 4000);
    }
  };

  const filteredJobs = INITIAL_JOBS.filter((j) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      j.title.toLowerCase().includes(term) ||
      j.orgName.toLowerCase().includes(term) ||
      j.taluk.toLowerCase().includes(term) ||
      j.requiredSkills.some((s) => s.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B]">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={toggleLanguage} />

      <main className="max-w-md mx-auto px-4 py-4 pb-20">
        <p className="text-xs font-semibold text-slate-500 mb-2">1 Find jobs (job seeker)</p>

        {/* Brand Banner */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {lang === 'kn' ? 'ಸ್ಥಳೀಯ ಉದ್ಯೋಗಗಳು' : 'LocalJobs'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'kn'
                ? 'ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳಿಗೆ ಹೊಂದುವ ಹತ್ತಿರದ ಉದ್ಯೋಗಗಳು'
                : 'Jobs near you, matched to your skills'}
            </p>
          </div>
          <a
            href="/employer/post"
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white bg-slate-50 transition"
          >
            {lang === 'kn' ? 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ' : 'Post a job'}
          </a>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            {lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್' : 'Your profile'}
          </h2>
          <p className="text-xs font-medium text-slate-700 mb-3">
            {lang === 'kn'
              ? 'ಕೌಶಲ್ಯಗಳು: ಬಿಲ್ಲಿಂಗ್, ಟ್ಯಾಲಿ, ಗ್ರಾಹಕ ಸೇವೆ'
              : 'Skills: billing, tally, customer service'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-blue-200 bg-blue-50/50 text-blue-700 font-semibold text-xs hover:bg-blue-100/50 transition">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{lang === 'kn' ? 'ರೆಸ್ಯೂಮೆ ಅಪ್‌ಲೋಡ್' : 'Upload resume'}</span>
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{lang === 'kn' ? 'ಪ್ರೊಫೈಲ್ ತಿದ್ದಿ' : 'Edit profile'}</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Type Dropdown */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'kn' ? 'ಹುದ್ದೆ, ಅಂಗಡಿ, ಪ್ರದೇಶ ಹುಡುಕಿ...' : 'Search title, shop, area'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm"
            />
          </div>
          <button className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm shrink-0">
            {lang === 'kn' ? 'ಎಲ್ಲಾ ಪ್ರಕಾರಗಳು' : 'All types'}
          </button>
        </div>

        {/* Success Alert */}
        {applySuccessMessage && (
          <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-teal-800 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{applySuccessMessage}</span>
          </div>
        )}

        {/* Job Feed */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'kn' ? 'ನಿಮಗಾಗಿ ಉತ್ತಮ ಹೊಂದಾಣಿಕೆಗಳು' : 'Best matches for you'}
          </h2>

          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              currentLang={lang}
              onApply={handleApplyClick}
              isApplied={appliedJobs[job.id]}
            />
          ))}
        </div>
      </main>

      {/* Application Confirmation Modal */}
      {activeModalJob && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-slate-900">
                {lang === 'kn' ? 'ಅರ್ಜಿ ಖಚಿತಪಡಿಸಿ' : 'Confirm Application'}
              </h3>
              <button
                onClick={() => setActiveModalJob(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              {lang === 'kn'
                ? `ನೀವು "${activeModalJob.title}" ಹುದ್ದೆಗೆ (${activeModalJob.orgName}) ಅರ್ಜಿ ಸಲ್ಲಿಸುತ್ತಿದ್ದೀರಿ.`
                : `You are applying for "${activeModalJob.title}" at ${activeModalJob.orgName}.`}
            </p>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Match score:</span>
                <span className="font-bold text-teal-700">{activeModalJob.match?.score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Resume:</span>
                <span className="font-medium text-slate-700">Priya_Resume_2026.pdf</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveModalJob(null)}
                className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {lang === 'kn' ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
              </button>
              <button
                onClick={confirmApplication}
                className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20"
              >
                {lang === 'kn' ? 'ಖಚಿತಪಡಿಸಿ (Submit)' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
