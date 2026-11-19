'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/Navbar';
import { MobileBottomNav } from '../../../components/MobileBottomNav';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { ApplicationDTO, ApplicationStatus } from '@mandya-jobs/types';
import {
  Calendar,
  MapPin,
  Building2,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';
import { fetchApplications, withdrawApplication } from '../../../lib/api';

const DEMO_APPLICATIONS_FIXTURE: ApplicationDTO[] = [
  {
    id: 'app_1',
    jobId: 'job_1',
    jobTitle: 'Billing Executive',
    orgName: 'Sri Lakshmi Showroom',
    candidateId: 'cand_1',
    candidateName: 'Priya R.',
    candidatePhone: '9845987654',
    candidateTaluk: 'Mandya Town',
    matchScore: 92,
    status: ApplicationStatus.INTERVIEW_SCHEDULED,
    createdAt: '2026-11-15T10:00:00Z',
    interview: {
      scheduledDate: '20 Nov 2026, 10:30 AM',
      venueOrLink: 'Sri Lakshmi Showroom, 2nd Floor, VV Road, Mandya',
      instructions: 'Please bring original 10th/PUC marks cards and a passport-size photo.',
    },
    statusHistory: [
      {
        status: ApplicationStatus.SUBMITTED,
        note: 'Application submitted',
        changedAt: '15 Nov 2026, 10:00 AM',
      },
      {
        status: ApplicationStatus.VIEWED,
        note: 'Recruiter reviewed your profile and resume',
        changedAt: '15 Nov 2026, 02:30 PM',
      },
      {
        status: ApplicationStatus.SHORTLISTED,
        note: 'Shortlisted for in-person interview',
        changedAt: '16 Nov 2026, 11:15 AM',
      },
      {
        status: ApplicationStatus.INTERVIEW_SCHEDULED,
        note: 'Interview appointment confirmed',
        changedAt: '16 Nov 2026, 04:00 PM',
      },
    ],
  },
];

export default function CandidateApplicationsPage() {
  const { lang } = useLanguage();
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [withdrawnNotice, setWithdrawnNotice] = useState('');

  const loadData = async () => {
    try {
      const apiApps = await fetchApplications();
      if (Array.isArray(apiApps) && apiApps.length > 0) {
        setApplications(apiApps);
        return;
      }
      const stored = localStorage.getItem('mandya_applications');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApplications(parsed);
          return;
        }
      }
      setApplications([]);
    } catch {
      setApplications([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadDemoApps = () => {
    setApplications(DEMO_APPLICATIONS_FIXTURE);
    try {
      localStorage.setItem('mandya_applications', JSON.stringify(DEMO_APPLICATIONS_FIXTURE));
    } catch {}
    setWithdrawnNotice('Loaded sample interview application for Priya R.');
    setTimeout(() => setWithdrawnNotice(''), 3000);
  };

  const handleWithdraw = async (id: string, jobTitle: string) => {
    try {
      await withdrawApplication(id, 'cand_1').catch(() => {});
    } catch {}

    setApplications((prev) => {
      const updated = prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status: ApplicationStatus.WITHDRAWN,
              statusHistory: [
                ...app.statusHistory,
                {
                  status: ApplicationStatus.WITHDRAWN,
                  note: 'Application withdrawn by candidate',
                  changedAt: 'Just now',
                },
              ],
            }
          : app
      );
      try {
        localStorage.setItem('mandya_applications', JSON.stringify(updated));
      } catch {
        // fallback
      }
      return updated;
    });
    setWithdrawnNotice(
      lang === 'kn'
        ? `ನೀವು "${jobTitle}" ಹುದ್ದೆಗೆ ಸಲ್ಲಿಸಿದ ಅರ್ಜಿಯನ್ನು ಹಿಂಪಡೆದಿದ್ದೀರಿ.`
        : `You have successfully withdrawn your application for "${jobTitle}".`
    );
    setTimeout(() => setWithdrawnNotice(''), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B] pb-24">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-slate-500 hover:text-slate-800 p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-black text-slate-900">
              {lang === 'kn' ? 'ನನ್ನ ಅರ್ಜಿಗಳು' : 'My Applications'}
            </h1>
          </div>
          <button
            type="button"
            onClick={loadDemoApps}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Demo Application</span>
          </button>
        </div>

        {withdrawnNotice && (
          <div className="mb-4 p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{withdrawnNotice}</span>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                {lang === 'kn' ? 'ಯಾವುದೇ ಅರ್ಜಿಗಳಿಲ್ಲ' : 'No Applications Submitted Yet'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'kn'
                  ? 'ನೀವು ಇನ್ನೂ ಯಾವುದೇ ಉದ್ಯೋಗಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿಲ್ಲ. ಲಭ್ಯವಿರುವ ಉದ್ಯೋಗಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.'
                  : 'You have not submitted any applications yet. Browse verified vacancies to apply.'}
              </p>
            </div>
            <Link
              href="/"
              className="inline-block py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
            >
              {lang === 'kn' ? 'ಉದ್ಯೋಗಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ' : 'Browse Vacancies'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const isWithdrawn = app.status === ApplicationStatus.WITHDRAWN;
              const isInterview = app.status === ApplicationStatus.INTERVIEW_SCHEDULED;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h2 className="font-bold text-base text-slate-900">{app.jobTitle}</h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {app.orgName}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isWithdrawn
                          ? 'bg-slate-100 text-slate-500'
                          : isInterview
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Interview Scheduled Highlight Box */}
                  {isInterview && app.interview && (
                    <div className="my-3 bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" />
                        <span>Interview: {app.interview.scheduledDate}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-amber-800">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <span>{app.interview.venueOrLink}</span>
                      </div>
                      {app.interview.instructions && (
                        <p className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60">
                          {app.interview.instructions}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Vertical Timeline */}
                  <div className="my-3 pl-2 border-l-2 border-slate-200 space-y-2 text-xs">
                    {app.statusHistory.map((step, idx) => (
                      <div key={idx} className="relative pl-3">
                        <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                        <div className="font-semibold text-slate-800">{step.status.replace('_', ' ')}</div>
                        <div className="text-[11px] text-slate-500">{step.note}</div>
                        <div className="text-[10px] text-slate-400">{step.changedAt}</div>
                      </div>
                    ))}
                  </div>

                  {/* Candidate Action: Withdraw */}
                  {!isWithdrawn && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleWithdraw(app.id, app.jobTitle)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition"
                      >
                        {lang === 'kn' ? 'ಅರ್ಜಿ ಹಿಂಪಡೆಯಿರಿ (Withdraw)' : 'Withdraw Application'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <MobileBottomNav currentLang={lang} applicationCount={applications.length} />
    </div>
  );
}
