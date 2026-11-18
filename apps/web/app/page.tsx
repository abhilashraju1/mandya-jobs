'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { JobCard } from '../components/JobCard';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { OfflineBanner } from '../components/OfflineBanner';
import { JobDTO, EmploymentType, WorkMode, SalaryPeriod, ApplicationStatus } from '@mandya-jobs/types';
import { MANDYA_SEED_JOBS, calculateJobMatch } from '@mandya-jobs/validation';
import {
  Search,
  UploadCloud,
  UserCheck,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  Building2,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

// Default candidate profile used for dynamic match computation
const DEFAULT_CANDIDATE = {
  id: 'cand_1',
  name: 'Priya R.',
  phone: '9845987654',
  skills: ['billing', 'tally', 'customer service'],
  educationLevel: 'B.Com / Graduate',
  totalExpYears: 1.5,
  taluk: 'Mandya Town',
  expectedSalary: 18000,
  resumeName: 'Priya_R_Resume_2026.pdf',
};

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});
  const [activeModalJob, setActiveModalJob] = useState<JobDTO | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedTaluk, setSelectedTaluk] = useState<string>('ALL');
  const [walkInOnly, setWalkInOnly] = useState<boolean>(false);
  const [candidateProfile, setCandidateProfile] = useState(DEFAULT_CANDIDATE);

  // Initialize and synchronize with localStorage on client mount
  useEffect(() => {
    try {
      const storedSaved = localStorage.getItem('mandya_saved_jobs');
      if (storedSaved) {
        const parsed = JSON.parse(storedSaved);
        const map: Record<string, boolean> = {};
        parsed.forEach((j: any) => {
          map[j.id] = true;
        });
        setSavedJobs(map);
      }

      const storedApplied = localStorage.getItem('mandya_applied_jobs');
      if (storedApplied) {
        setAppliedJobs(JSON.parse(storedApplied));
      }

      const storedProfile = localStorage.getItem('mandya_candidate_profile');
      if (storedProfile) {
        setCandidateProfile(JSON.parse(storedProfile));
      }
    } catch {
      // Fallback cleanly if localStorage is restricted
    }
  }, []);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'kn' : 'en'));
  };

  const handleApplyClick = (job: JobDTO) => {
    setActiveModalJob(job);
  };

  const confirmApplication = () => {
    if (activeModalJob) {
      const updatedApplied = { ...appliedJobs, [activeModalJob.id]: true };
      setAppliedJobs(updatedApplied);

      // Persist to localStorage for cross-page & session synchronization
      try {
        localStorage.setItem('mandya_applied_jobs', JSON.stringify(updatedApplied));

        const existingApps = JSON.parse(localStorage.getItem('mandya_applications') || '[]');
        const newApp = {
          id: `app_${Date.now()}`,
          jobId: activeModalJob.id,
          jobTitle: activeModalJob.title,
          orgName: activeModalJob.orgName,
          candidateId: candidateProfile.id,
          candidateName: candidateProfile.name,
          candidatePhone: candidateProfile.phone,
          candidateTaluk: candidateProfile.taluk,
          matchScore: activeModalJob.match?.score,
          resumeName: candidateProfile.resumeName,
          status: ApplicationStatus.SUBMITTED,
          createdAt: new Date().toISOString(),
          statusHistory: [
            {
              status: ApplicationStatus.SUBMITTED,
              note: 'Application submitted online',
              changedAt: 'Just now',
            },
          ],
        };
        localStorage.setItem('mandya_applications', JSON.stringify([newApp, ...existingApps]));
      } catch {
        // Storage fallback
      }

      setApplySuccessMessage(
        lang === 'kn'
          ? `ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು "${activeModalJob.title}" ಹುದ್ದೆಗೆ (${activeModalJob.orgName}) ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!`
          : `Application submitted successfully for "${activeModalJob.title}" at ${activeModalJob.orgName}!`
      );
      setActiveModalJob(null);
      setTimeout(() => setApplySuccessMessage(''), 5000);
    }
  };

  const toggleSavedJob = (jobId: string) => {
    setSavedJobs((prev) => {
      const next = { ...prev, [jobId]: !prev[jobId] };
      try {
        const savedList = MANDYA_SEED_JOBS.filter((j) => next[j.id]);
        localStorage.setItem('mandya_saved_jobs', JSON.stringify(savedList));
      } catch {
        // Storage fallback
      }
      return next;
    });
  };

  // Dynamically compute match scores for all published and verified Mandya vacancies
  const computedJobs: JobDTO[] = MANDYA_SEED_JOBS.filter(
    (job) => job.status === 'PUBLISHED' && job.orgVerified
  ).map((job) => {
    const match = calculateJobMatch(
      {
        skills: candidateProfile.skills,
        educationLevel: candidateProfile.educationLevel,
        totalExpYears: candidateProfile.totalExpYears,
        taluk: candidateProfile.taluk,
        expectedSalary: candidateProfile.expectedSalary,
      },
      {
        requiredSkills: job.requiredSkills,
        preferredSkills: job.preferredSkills,
        minEducation: job.minEducation,
        minExpYears: job.minExpYears,
        taluk: job.taluk,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
      }
    );
    return { ...job, match };
  });

  // Filter jobs based on search term, taluk, and walk-in toggle
  const filteredJobs = computedJobs.filter((job) => {
    if (selectedTaluk !== 'ALL') {
      if (job.taluk.toLowerCase() !== selectedTaluk.toLowerCase()) return false;
    }
    if (walkInOnly && !job.isWalkIn) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchOrg = job.orgName.toLowerCase().includes(q);
      const matchTaluk = job.taluk.toLowerCase().includes(q);
      const matchSkills = job.requiredSkills.some((s) => s.toLowerCase().includes(q));
      return matchTitle || matchOrg || matchTaluk || matchSkills;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B] pb-24">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={toggleLanguage} />

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Anti-Scam Advisory Banner */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900 shadow-sm">
          <span className="text-amber-600 font-bold text-base leading-none mt-0.5">⚠️</span>
          <div>
            <p className="font-bold text-[12px]">
              {lang === 'kn' ? 'ಮಂಡ್ಯ ಜಾಬ್ಸ್ ಎಚ್ಚರಿಕೆ' : '100% Free for Job Seekers'}
            </p>
            <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
              {lang === 'kn'
                ? 'ಯಾವುದೇ ಉದ್ಯೋಗಕ್ಕೆ ನೋಂದಣಿ ಶುಲ್ಕ ನೀಡಬೇಡಿ. ಮಂಡ್ಯ ಜಾಬ್ಸ್ ಉಚಿತ ಸೇವೆ.'
                : 'Never pay registration fees or training charges. All applications are free.'}
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              lang === 'kn'
                ? 'ಹುದ್ದೆ, ಅಂಗಡಿ, ಆಸ್ಪತ್ರೆ, ತಾಲೂಕು ಹುಡುಕಿ...'
                : 'Search title, shop, hospital, taluk, skill...'
            }
            className="w-full pl-10 pr-12 py-3 bg-white rounded-2xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
          <button
            onClick={() => setShowFilterDrawer(true)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            title="Filter jobs"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Active Filters Pill Bar */}
        {(selectedTaluk !== 'ALL' || walkInOnly) && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {selectedTaluk !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full border border-blue-200">
                {selectedTaluk}
                <button onClick={() => setSelectedTaluk('ALL')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {walkInOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 font-semibold rounded-full border border-amber-200">
                Walk-ins Only
                <button onClick={() => setWalkInOnly(false)} className="hover:text-amber-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedTaluk('ALL');
                setWalkInOnly(false);
              }}
              className="text-slate-400 hover:text-slate-600 underline text-[11px] ml-1"
            >
              Reset
            </button>
          </div>
        )}

        {/* Success Alert Banner */}
        {applySuccessMessage && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{applySuccessMessage}</span>
          </div>
        )}

        {/* Job Feed Header */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-sm font-bold text-slate-800">
            {lang === 'kn' ? 'ಲಭ್ಯವಿರುವ ಉದ್ಯೋಗಗಳು' : 'Verified Opportunities in Mandya'}
            <span className="ml-1.5 text-xs text-slate-400 font-normal">({filteredJobs.length})</span>
          </h2>
          <span className="text-[11px] font-medium text-slate-500">
            {lang === 'kn' ? 'ದೃಢೀಕೃತ ಸಂಸ್ಥೆಗಳು' : 'Verified Employers'}
          </span>
        </div>

        {/* Job Cards Listing */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No vacancies match your criteria</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTaluk('ALL');
                setWalkInOnly(false);
              }}
              className="text-xs font-semibold text-blue-600 hover:underline pt-2 block mx-auto"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                currentLang={lang}
                onApply={handleApplyClick}
                onToggleSave={toggleSavedJob}
                isApplied={appliedJobs[job.id]}
                isSaved={savedJobs[job.id]}
              />
            ))}
          </div>
        )}
      </main>

      {/* Filter Drawer Dialog */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {lang === 'kn' ? 'ಫಿಲ್ಟರ್‌ಗಳು (Filters)' : 'Filter Vacancies'}
              </h3>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Taluk / Area</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ALL', 'Mandya Town', 'Maddur', 'Malavalli', 'Srirangapatna', 'Pandavapura'].map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTaluk(t)}
                        className={`py-2 px-3 rounded-xl border text-center font-medium transition ${
                          selectedTaluk === t
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {t === 'ALL' ? 'All Taluks' : t}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Interview Type</label>
                <button
                  onClick={() => setWalkInOnly(!walkInOnly)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-left font-medium transition flex items-center justify-between ${
                    walkInOnly
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Walk-in Hiring Drives Only
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      walkInOnly ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {walkInOnly && '✓'}
                  </span>
                </button>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedTaluk('ALL');
                    setWalkInOnly(false);
                    setShowFilterDrawer(false);
                  }}
                  className="flex-1 py-2.5 px-3 border border-slate-200 rounded-xl text-slate-700 font-semibold"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilterDrawer(false)}
                  className="flex-1 py-2.5 px-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Match score:</span>
                <span className="font-bold text-teal-700">{activeModalJob.match?.score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-medium text-slate-800">{candidateProfile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Resume:</span>
                <span className="font-medium text-slate-800">{candidateProfile.resumeName}</span>
              </div>
              {activeModalJob.isWalkIn && (
                <div className="pt-1.5 border-t border-slate-200/60 text-amber-800">
                  <span className="font-bold">Walk-in Venue:</span> {activeModalJob.walkInVenue}
                </div>
              )}
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentLang={lang}
        applicationCount={Object.keys(appliedJobs).length}
        savedCount={Object.keys(savedJobs).filter((k) => savedJobs[k]).length}
      />
    </div>
  );
}
