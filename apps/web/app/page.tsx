'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { JobCard } from '../components/JobCard';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { OfflineBanner } from '../components/OfflineBanner';
import { JobDTO, ApplicationStatus } from '@mandya-jobs/types';
import { MANDYA_SEED_JOBS, calculateJobMatch } from '@mandya-jobs/validation';
import { useLanguage } from '../context/LanguageContext';
import { fetchJobs, submitApplication, seedDemoData, resetData } from '../lib/api';
import {
  Search,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Calendar,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

const TALUK_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Mandya Town': { lat: 12.524, lng: 76.896 },
  'Maddur': { lat: 12.584, lng: 77.045 },
  'Malavalli': { lat: 12.386, lng: 77.056 },
  'Srirangapatna': { lat: 12.423, lng: 76.695 },
  'Pandavapura': { lat: 12.497, lng: 76.669 },
  'Nagamangala': { lat: 12.821, lng: 76.758 },
  'KR Pete': { lat: 12.659, lng: 76.495 },
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function HomePage() {
  const { lang, toggleLanguage } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});
  const [activeModalJob, setActiveModalJob] = useState<JobDTO | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedTaluk, setSelectedTaluk] = useState<string>('ALL');
  const [locationMode, setLocationMode] = useState<'ALL' | 'SELECT' | 'NEAR_ME'>('ALL');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<string>('ALL');
  const [geoNotice, setGeoNotice] = useState<string>('');
  const [walkInOnly, setWalkInOnly] = useState<boolean>(false);
  const [candidateProfile, setCandidateProfile] = useState<any | null>(null);
  const [liveJobs, setLiveJobs] = useState<JobDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [seedNotice, setSeedNotice] = useState<string>('');

  // Guest applicant input for quick apply without pre-existing profile
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJobs();
      setLiveJobs(Array.isArray(data) ? data : []);
    } catch {
      setLiveJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();

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
      // Fallback cleanly
    }
  }, []);

  const handleApplyClick = (job: JobDTO) => {
    setActiveModalJob(job);
  };

  const handleSeedDemo = async () => {
    try {
      await seedDemoData();
      await loadJobs();
      setSeedNotice('Seeded 10 verified Mandya vacancies from server!');
      setTimeout(() => setSeedNotice(''), 4000);
    } catch {
      await loadJobs();
    }
  };

  const handleResetData = async () => {
    try {
      await resetData();
      localStorage.removeItem('mandya_saved_jobs');
      localStorage.removeItem('mandya_applied_jobs');
      setLiveJobs([]);
      setSavedJobs({});
      setAppliedJobs({});
      setSeedNotice('Reset to clean initial launch state (0 vacancies, 0 applications).');
      setTimeout(() => setSeedNotice(''), 4000);
    } catch {
      setLiveJobs([]);
    }
  };

  const activateDemoCandidate = () => {
    const demo = {
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
    try {
      localStorage.setItem('mandya_candidate_profile', JSON.stringify(demo));
    } catch {}
    setCandidateProfile(demo);
    setSeedNotice('Activated test candidate persona: Priya R.');
    setTimeout(() => setSeedNotice(''), 3000);
  };

  const confirmApplication = async () => {
    if (!activeModalJob) return;

    const applicantName = candidateProfile?.name || guestName || 'Candidate';
    const applicantPhone = candidateProfile?.phone || guestPhone || '9845987654';

    const updatedApplied = { ...appliedJobs, [activeModalJob.id]: true };
    setAppliedJobs(updatedApplied);

    try {
      localStorage.setItem('mandya_applied_jobs', JSON.stringify(updatedApplied));

      // 1. Submit via real API
      await submitApplication({
        jobId: activeModalJob.id,
        candidate: {
          id: candidateProfile?.id || `cand_${Date.now()}`,
          name: applicantName,
          phone: applicantPhone,
          taluk: candidateProfile?.taluk || 'Mandya Town',
          matchScore: activeModalJob.match?.score,
        },
      }).catch((e) => console.debug('API submit err:', e));

      // 2. Persist in local storage for offline continuity
      const existingApps = JSON.parse(localStorage.getItem('mandya_applications') || '[]');
      const newApp = {
        id: `app_${Date.now()}`,
        jobId: activeModalJob.id,
        jobTitle: activeModalJob.title,
        orgName: activeModalJob.orgName,
        candidateId: candidateProfile?.id || `cand_${Date.now()}`,
        candidateName: applicantName,
        candidatePhone: applicantPhone,
        candidateTaluk: candidateProfile?.taluk || 'Mandya Town',
        matchScore: activeModalJob.match?.score,
        resumeName: candidateProfile?.resumeName || 'Uploaded_Resume.pdf',
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
  };

  const toggleSavedJob = (jobId: string) => {
    setSavedJobs((prev) => {
      const isCurrentlySaved = Boolean(prev[jobId]);
      const next = { ...prev, [jobId]: !isCurrentlySaved };
      try {
        const stored = JSON.parse(localStorage.getItem('mandya_saved_jobs') || '[]');
        let updatedList: JobDTO[];
        if (isCurrentlySaved) {
          updatedList = stored.filter((j: any) => j.id !== jobId);
        } else {
          const targetJob = liveJobs.find((j) => j.id === jobId) || computedJobs.find((j) => j.id === jobId);
          if (targetJob) {
            const withoutCurrent = stored.filter((j: any) => j.id !== jobId);
            updatedList = [targetJob, ...withoutCurrent];
          } else {
            updatedList = stored;
          }
        }
        localStorage.setItem('mandya_saved_jobs', JSON.stringify(updatedList));
      } catch {
        // Storage fallback
      }
      return next;
    });
  };

  const allAvailableJobs = liveJobs;

  // Dynamically compute match scores for all published and verified Mandya vacancies
  const computedJobs: JobDTO[] = allAvailableJobs
    .filter((job) => job.status === 'PUBLISHED' && job.orgVerified)
    .map((job) => {
      let match = undefined;
      if (candidateProfile) {
        match = calculateJobMatch(
          {
            skills: candidateProfile.skills || [],
            educationLevel: candidateProfile.educationLevel,
            totalExpYears: candidateProfile.totalExpYears || 0,
            taluk: candidateProfile.taluk,
            expectedSalary: candidateProfile.expectedSalary,
          },
          {
            requiredSkills: job.requiredSkills || [],
            preferredSkills: job.preferredSkills,
            minEducation: job.minEducation,
            minExpYears: job.minExpYears,
            taluk: job.taluk,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
          }
        );
      }
      return { ...job, match };
    });

  // Filter jobs based on search term, location mode, taluk, education, and walk-in toggle
  const filteredJobs = computedJobs.filter((job) => {
    if (locationMode === 'SELECT' && selectedTaluk !== 'ALL') {
      if (job.taluk.toLowerCase() !== selectedTaluk.toLowerCase()) return false;
    } else if (locationMode === 'NEAR_ME') {
      if (userCoords) {
        const talukCoord = TALUK_COORDINATES[job.taluk] || TALUK_COORDINATES['Mandya Town'];
        const distance = calculateDistanceKm(userCoords.lat, userCoords.lng, talukCoord.lat, talukCoord.lng);
        if (distance > 30) return false;
      }
    }
    if (selectedEducation !== 'ALL') {
      const jobEd = (job.minEducation || '').toLowerCase();
      if (selectedEducation === 'No formal education required') {
        if (!jobEd.includes('no formal') && !jobEd.includes('none') && jobEd !== '') return false;
      } else if (!jobEd.includes(selectedEducation.toLowerCase())) {
        return false;
      }
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
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B] pb-24 md:pb-12">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={toggleLanguage} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:grid md:grid-cols-12 md:gap-8 items-start">
          {/* Desktop Left Sidebar (Filters, Taluks, Anti-Scam) */}
          <aside className="hidden md:block md:col-span-4 lg:col-span-3 space-y-5 sticky top-20">
            {/* 3-Mode Location Control Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {lang === 'kn' ? 'ಸ್ಥಳ ಆಯ್ಕೆ' : 'Location Mode'}
                </h3>
                {(locationMode !== 'ALL' || selectedTaluk !== 'ALL') && (
                  <button
                    onClick={() => {
                      setLocationMode('ALL');
                      setSelectedTaluk('ALL');
                      setGeoNotice('');
                    }}
                    className="text-[10px] text-blue-600 font-semibold hover:underline"
                  >
                    {lang === 'kn' ? 'ಮರುಹೊಂದಿಸಿ' : 'Clear'}
                  </button>
                )}
              </div>

              {/* Mode Toggle Buttons */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                <button
                  onClick={() => {
                    setLocationMode('ALL');
                    setSelectedTaluk('ALL');
                    setGeoNotice('');
                  }}
                  className={`py-1.5 px-1 rounded-lg transition text-center ${
                    locationMode === 'ALL' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'kn' ? 'ಎಲ್ಲಾ' : 'All Mandya'}
                </button>
                <button
                  onClick={() => setLocationMode('SELECT')}
                  className={`py-1.5 px-1 rounded-lg transition text-center ${
                    locationMode === 'SELECT' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'kn' ? 'ತಾಲೂಕು' : 'Taluks'}
                </button>
                <button
                  onClick={() => {
                    setLocationMode('NEAR_ME');
                    if (typeof navigator !== 'undefined' && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                          setGeoNotice(
                            lang === 'kn'
                              ? `ಸಾಮೀಪ್ಯ: (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}) ವ್ಯಾಪ್ತಿಯ ಉದ್ಯೋಗಗಳು`
                              : `Near Me: Jobs within ~30km of (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`
                          );
                        },
                        () => {
                          setUserCoords(null);
                          setGeoNotice(
                            lang === 'kn'
                              ? 'ಸ್ಥಳ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ - ಎಲ್ಲಾ ತಾಲೂಕುಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ'
                              : 'Location access denied - showing all district vacancies'
                          );
                        }
                      );
                    } else {
                      setUserCoords(null);
                      setGeoNotice(
                        lang === 'kn'
                          ? 'ಸ್ಥಳ ಪ್ರವೇಶ ಲಭ್ಯವಿಲ್ಲ - ಎಲ್ಲಾ ತಾಲೂಕುಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ'
                          : 'Geolocation not supported - showing all district vacancies'
                      );
                    }
                  }}
                  className={`py-1.5 px-1 rounded-lg transition text-center ${
                    locationMode === 'NEAR_ME' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'kn' ? 'ಹತ್ತಿರದ' : 'Near Me'}
                </button>
              </div>

              {geoNotice && (
                <p className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg font-medium">
                  📍 {geoNotice}
                </p>
              )}

              {/* Taluk List (When SELECT mode is active) */}
              {locationMode === 'SELECT' && (
                <div className="space-y-1 pt-1 max-h-48 overflow-y-auto">
                  {[
                    { id: 'ALL', en: 'All 7 Taluks', kn: 'ಸಂಪೂರ್ಣ ಮಂಡ್ಯ ಜಿಲ್ಲೆ' },
                    { id: 'Mandya Town', en: 'Mandya Town', kn: 'ಮಂಡ್ಯ ನಗರ' },
                    { id: 'Maddur', en: 'Maddur', kn: 'ಮದ್ದೂರು' },
                    { id: 'Malavalli', en: 'Malavalli', kn: 'ಮಳವಳ್ಳಿ' },
                    { id: 'Srirangapatna', en: 'Srirangapatna', kn: 'ಶ್ರೀರಂಗಪಟ್ಟಣ' },
                    { id: 'Pandavapura', en: 'Pandavapura', kn: 'ಪಾಂಡವಪುರ' },
                    { id: 'Nagamangala', en: 'Nagamangala', kn: 'ನಾಗಮಂಗಲ' },
                    { id: 'KR Pete', en: 'K.R. Pete', kn: 'ಕೆ.ಆರ್. ಪೇಟೆ' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTaluk(t.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                        selectedTaluk.toLowerCase() === t.id.toLowerCase()
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang === 'kn' ? t.kn : t.en}</span>
                      {selectedTaluk.toLowerCase() === t.id.toLowerCase() && (
                        <span className="text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Independent Minimum Education Filter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {lang === 'kn' ? 'ವಿದ್ಯಾರ್ಹತೆ' : 'Education'}
                </h3>
                {selectedEducation !== 'ALL' && (
                  <button
                    onClick={() => setSelectedEducation('ALL')}
                    className="text-[10px] text-blue-600 font-semibold hover:underline"
                  >
                    {lang === 'kn' ? 'ಮರುಹೊಂದಿಸಿ' : 'Clear'}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {[
                  { id: 'ALL', en: 'All Education Levels', kn: 'ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಹತೆ' },
                  { id: 'No formal education required', en: 'No formal education', kn: 'ಯಾವುದೇ ಔಪಚಾರಿಕ ಶಿಕ್ಷಣ ಬೇಡ' },
                  { id: 'SSLC', en: 'SSLC / 10th', kn: 'ಎಸ್.ಎಸ್.ಎಲ್.ಸಿ / 10ನೇ' },
                  { id: 'PUC', en: 'PUC / 12th', kn: 'ಪಿ.ಯು.ಸಿ / 12ನೇ' },
                  { id: 'Diploma', en: 'Diploma', kn: 'ಡಿಪ್ಲೊಮಾ' },
                  { id: 'Degree', en: 'Any Degree / Graduate', kn: 'ಯಾವುದೇ ಪದವಿ' },
                ].map((ed) => (
                  <button
                    key={ed.id}
                    onClick={() => setSelectedEducation(ed.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedEducation.toLowerCase() === ed.id.toLowerCase()
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang === 'kn' ? ed.kn : ed.en}</span>
                    {selectedEducation.toLowerCase() === ed.id.toLowerCase() && (
                      <span className="text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Walk-in Hiring Drive Filter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                {lang === 'kn' ? 'ಸಂದರ್ಶನ ವಿಧಾನ' : 'Interview Type'}
              </h3>
              <button
                onClick={() => setWalkInOnly(!walkInOnly)}
                className={`w-full py-2.5 px-3 rounded-xl border text-left font-medium transition flex items-center justify-between ${
                  walkInOnly
                    ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'kn' ? 'ನೇರ ಸಂದರ್ಶನ ಮಾತ್ರ' : 'Walk-in Drives Only'}</span>
                </span>
                <span
                  className={`w-4 h-4 rounded-full border text-[10px] flex items-center justify-center ${
                    walkInOnly ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {walkInOnly && '✓'}
                </span>
              </button>
            </div>

            {/* Candidate Match Engine Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {lang === 'kn' ? 'ಅಭ್ಯರ್ಥಿ ಪ್ರೊಫೈಲ್' : 'Candidate Status'}
                </span>
                {candidateProfile ? (
                  <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                    Active Profile
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                    Guest Mode
                  </span>
                )}
              </div>
              {candidateProfile ? (
                <div>
                  <p className="text-slate-800 font-bold">{candidateProfile.name}</p>
                  <p className="text-[11px] text-slate-500">{candidateProfile.educationLevel} · {candidateProfile.taluk}</p>
                  <div className="flex flex-wrap gap-1 pt-2">
                    {candidateProfile.skills?.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-between items-center text-[11px]">
                    <Link href="/candidate/profile" className="text-blue-600 font-semibold hover:underline">
                      Edit Profile
                    </Link>
                    <button
                      onClick={() => {
                        localStorage.removeItem('mandya_candidate_profile');
                        setCandidateProfile(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 text-[10px]"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    {lang === 'kn'
                      ? 'ವೈಯಕ್ತಿಕ ಹೊಂದಾಣಿಕೆ ಅಂಕಗಳನ್ನು ನೋಡಲು ಪ್ರೊಫೈಲ್ ರಚಿಸಿ ಅಥವಾ ಡೆಮೊ ಅಭ್ಯರ್ಥಿಯನ್ನು ಬಳಸಿ.'
                      : 'Sign in to see personalized 5-tier matching scores and 1-click apply.'}
                  </p>
                  <button
                    onClick={activateDemoCandidate}
                    className="w-full py-1.5 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Test as Priya R.</span>
                  </button>
                </div>
              )}
            </div>

            {/* Clean Launch & Reset Testing Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 text-xs space-y-2">
              <span className="font-bold text-[11px] text-slate-600 uppercase tracking-wider block">
                Verification Controls
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleSeedDemo}
                  className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs"
                >
                  Seed 9 Jobs
                </button>
                <button
                  onClick={handleResetData}
                  className="py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 shadow-2xs"
                  title="Reset to 0 jobs (clean launch)"
                >
                  Reset Clean
                </button>
              </div>
            </div>

            {/* Anti-Scam Advisory */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <span className="text-amber-600 text-sm">⚠️</span>
                <span>{lang === 'kn' ? '100% ಉಚಿತ ಸೇವೆ' : '100% Free for Candidates'}</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {lang === 'kn'
                  ? 'ಯಾವುದೇ ಉದ್ಯೋಗಕ್ಕೆ ನೋಂದಣಿ ಅಥವಾ ತರಬೇತಿ ಶುಲ್ಕ ನೀಡಬೇಡಿ. ಮಂಡ್ಯ ಜಾಬ್ಸ್ ಎಲ್ಲಾ ಅಭ್ಯರ್ಥಿಗಳಿಗೆ ಉಚಿತವಾಗಿದೆ.'
                  : 'Never pay registration fees or security deposits. Mandya Jobs is strictly free for job seekers.'}
              </p>
            </div>
          </aside>

          {/* Right Main Feed */}
          <div className="md:col-span-8 lg:col-span-9 space-y-4 min-w-0">
            {/* Mobile Anti-Scam Advisory Banner */}
            <div className="md:hidden bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900 shadow-sm">
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
                className="w-full pl-10 pr-12 py-3 bg-white rounded-2xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
              <button
                onClick={() => setShowFilterDrawer(true)}
                className="md:hidden absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
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

            {/* Success & Seed Alert Banners */}
            {applySuccessMessage && (
              <div className="bg-teal-50 border border-teal-200 text-teal-800 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{applySuccessMessage}</span>
              </div>
            )}

            {seedNotice && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-xs animate-fade-in">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{seedNotice}</span>
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

            {/* Job Cards Listing - Zero State vs List Grid */}
            {allAvailableJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'kn' ? 'ಯಾವುದೇ ಉದ್ಯೋಗಗಳು ಪ್ರಕಟವಾಗಿಲ್ಲ' : 'Clean First Launch: No Jobs in Database'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    {lang === 'kn'
                      ? 'ಇದು ಸ್ವಚ್ಛ ಆರಂಭಿಕ ಡೇಟಾಬೇಸ್ ಸ್ಥಿತಿಯಾಗಿದೆ. ಪರೀಕ್ಷಿಸಲು ಡೆಮೊ ಉದ್ಯೋಗಗಳನ್ನು ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ.'
                      : 'Zero sample jobs exist by default. Click below to seed verified Mandya opportunities or post a vacancy as an employer.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleSeedDemo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === 'kn' ? 'ಡೆಮೊ ಉದ್ಯೋಗ ಸೇರಿಸಿ (Seed 9 Jobs)' : 'Seed Verified Vacancies (9 Jobs)'}</span>
                  </button>
                  <Link
                    href="/employer/post"
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                  >
                    {lang === 'kn' ? 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ' : 'Post a Vacancy'}
                  </Link>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
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
                  {['ALL', 'Mandya Town', 'Maddur', 'Malavalli', 'Srirangapatna', 'Pandavapura', 'Nagamangala', 'KR Pete'].map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedTaluk(t);
                          setLocationMode(t === 'ALL' ? 'ALL' : 'SELECT');
                        }}
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
                    setLocationMode('ALL');
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

            {candidateProfile ? (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-800">{candidateProfile.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-medium text-slate-700">{candidateProfile.phone}</span>
                </div>
                {activeModalJob.match?.score !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Match score:</span>
                    <span className="font-bold text-teal-700">{activeModalJob.match.score}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Resume:</span>
                  <span className="font-medium text-slate-800">{candidateProfile.resumeName || 'Profile Resume'}</span>
                </div>
                {activeModalJob.isWalkIn && (
                  <div className="pt-1.5 border-t border-slate-200/60 text-amber-800">
                    <span className="font-bold">Walk-in Venue:</span> {activeModalJob.walkInVenue}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-[11px] text-blue-900">
                  {lang === 'kn'
                    ? '100% ಉಚಿತ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ. ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.'
                    : '100% free application. Enter your details to submit directly.'}
                </div>
                <input
                  type="text"
                  placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು' : 'Your Full Name'}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder={lang === 'kn' ? '10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : '10-digit mobile number'}
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            )}

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
