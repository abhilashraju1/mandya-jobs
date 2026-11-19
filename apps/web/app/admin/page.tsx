'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Check, X, AlertTriangle, FileText, CheckCircle2, User, Building2, Sparkles } from 'lucide-react';
import { JobDTO, JobStatus } from '@mandya-jobs/types';
import { useLanguage } from '../../context/LanguageContext';

const INITIAL_PENDING_QUEUE: any[] = [
  {
    id: 'job_pending_1',
    title: 'Garment Sales Associate',
    company: 'Mandya Silks & Sarees',
    locality: 'VV Road · Mandya Town',
    flagged: false,
    flagMessage: 'Verified employer • No red flags found',
    fullJob: {
      id: 'job_pending_1',
      orgId: 'org_silks',
      orgName: 'Mandya Silks & Sarees',
      orgBusinessType: 'Showroom',
      orgVerified: true,
      categoryId: 'showrooms',
      categoryName: 'Showrooms',
      title: 'Garment Sales Associate',
      employmentType: 'FULL_TIME',
      workMode: 'ON_SITE',
      taluk: 'Mandya Town',
      addressDisplay: 'VV Road, Mandya Town',
      salaryMin: 14000,
      salaryMax: 18000,
      salaryPeriod: 'MONTHLY',
      isNegotiable: true,
      minExpYears: 1,
      minEducation: 'PUC',
      openings: 3,
      description: 'Assist retail customers, showcase silk sarees, and manage counter inventory.',
      benefits: ['PF', 'Incentives'],
      requiredSkills: ['sales', 'customer service', 'kannada'],
      preferredSkills: ['english'],
      isWalkIn: true,
      walkInVenue: 'Mandya Silks showroom counter',
      contactPhone: '9845999888',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: 'job_scam_test',
    title: 'Data Entry Work From Home',
    company: 'QuickEarn Services',
    locality: 'Online / Other',
    flagged: true,
    flagMessage: 'Flagged: "registration fee" (illegal recruitment fee violation)',
    fullJob: {
      id: 'job_scam_test',
      orgId: 'org_unverified',
      orgName: 'QuickEarn Services',
      orgBusinessType: 'Other',
      orgVerified: false,
      title: 'Data Entry Work From Home',
      taluk: 'Mandya Town',
      status: 'SUBMITTED',
      fraudAlerts: ['Flagged: "registration fee" (recruitment fee violation)'],
    },
  },
];

export default function AdminReviewPage() {
  const { lang, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pending' | 'applications' | 'profiles'>('pending');
  const [pendingJobs, setPendingJobs] = useState<any[]>(INITIAL_PENDING_QUEUE);
  const [toastMessage, setToastMessage] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [applicationsList, setApplicationsList] = useState<any[]>([]);
  const [profilesList, setProfilesList] = useState<any[]>([]);

  // Check admin session and load dynamic data on mount
  useEffect(() => {
    try {
      const isAuth = localStorage.getItem('mandya_admin_auth') === 'true';
      setIsAdminAuthenticated(isAuth);

      const storedApps = localStorage.getItem('mandya_applications');
      if (storedApps) {
        const parsed = JSON.parse(storedApps);
        if (Array.isArray(parsed)) {
          setApplicationsList(parsed);
          setApplicationsCount(parsed.length);
        }
      }

      const storedProfile = localStorage.getItem('mandya_candidate_profile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.fullName || parsed.name) {
          setProfilesList([parsed]);
        }
      }

      const storedQueue = localStorage.getItem('mandya_moderation_queue');
      if (storedQueue) {
        const parsed = JSON.parse(storedQueue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map((j: JobDTO) => ({
            id: j.id,
            title: j.title,
            company: j.orgName,
            locality: j.taluk,
            flagged: Boolean(j.fraudAlerts && j.fraudAlerts.length > 0),
            flagMessage:
              j.fraudAlerts && j.fraudAlerts.length > 0
                ? j.fraudAlerts[0]
                : 'Verified employer • No red flags found',
            fullJob: j,
          }));
          setPendingJobs([...formatted, ...INITIAL_PENDING_QUEUE.filter((q) => !parsed.some((p: any) => p.id === q.id))]);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '9999' || adminPin === 'admin123') {
      try {
        localStorage.setItem('mandya_admin_auth', 'true');
      } catch {
        // Fallback
      }
      setIsAdminAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Invalid admin passcode. (Default: 9999)');
    }
  };

  const handleAdminLogout = () => {
    try {
      localStorage.removeItem('mandya_admin_auth');
    } catch {
      // Fallback
    }
    setIsAdminAuthenticated(false);
    setAdminPin('');
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    const jobItem = pendingJobs.find((j) => j.id === id);
    const updatedQueue = pendingJobs.filter((j) => j.id !== id);
    setPendingJobs(updatedQueue);

    try {
      // Update moderation queue in localStorage
      const remainingFullJobs = updatedQueue.map((q) => q.fullJob).filter(Boolean);
      localStorage.setItem('mandya_moderation_queue', JSON.stringify(remainingFullJobs));

      if (action === 'approved' && jobItem?.fullJob) {
        const approvedJob = {
          ...jobItem.fullJob,
          status: JobStatus.PUBLISHED,
          orgVerified: true,
          approvedAt: new Date().toISOString(),
        };

        const existingApproved = JSON.parse(localStorage.getItem('mandya_approved_jobs') || '[]');
        localStorage.setItem(
          'mandya_approved_jobs',
          JSON.stringify([approvedJob, ...existingApproved.filter((j: any) => j.id !== id)])
        );
      }
    } catch {
      // Fallback
    }

    setToastMessage(
      lang === 'kn'
        ? `"${jobItem?.title}" ಹುದ್ದೆಯನ್ನು ${action === 'approved' ? 'ಅನುಮೋದಿಸಲಾಗಿದೆ' : 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ'}.`
        : `Job "${jobItem?.title}" has been ${action}.`
    );
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B]">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={toggleLanguage} />

      {!isAdminAuthenticated ? (
        <main className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-slate-900">
                {lang === 'kn' ? 'ನಿರ್ವಾಹಕರ ಪ್ರವೇಶ' : 'Admin Portal'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'kn'
                  ? 'ಮಧ್ಯಸ್ಥಿಕೆ ಫಲಕವನ್ನು ಪ್ರವೇಶಿಸಲು ಪಾಸ್‌ಕೋಡ್ ನಮೂದಿಸಿ'
                  : 'Enter administrator passcode to access moderation panel'}
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Admin Passcode
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Enter passcode (default: 9999)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  autoFocus
                />
                {pinError && <p className="text-xs text-red-600 mt-1.5 font-medium">{pinError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition shadow-sm"
              >
                Unlock Dashboard
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Authorized district moderation officers only · PIN: <span className="font-mono font-bold text-slate-600">9999</span>
              </p>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900">
                    {lang === 'kn' ? 'ಮಧ್ಯಸ್ಥಿಕೆ ಮತ್ತು ಪರಿಶೀಲನೆ' : 'Moderation & Verification'}
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Live Session
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'kn'
                    ? 'ಮಂಡ್ಯ ಜಿಲ್ಲಾ ಉದ್ಯೋಗಗಳ ಪರಿಶೀಲನಾ ವ್ಯವಸ್ಥೆ'
                    : 'Mandya District Job Verification & Anti-Fraud Queue'}
                </p>
              </div>

              <button
                onClick={handleAdminLogout}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Sign Out
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 mb-5 max-w-md">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'pending'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending ({pendingJobs.length})
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'applications'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Applications ({applicationsCount})
              </button>
              <button
                onClick={() => setActiveTab('profiles')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'profiles'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Profiles ({applicationsCount > 0 ? applicationsCount : 1})
              </button>
            </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-4 p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Tab 1: Pending Moderation Queue */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingJobs.map((job) => (
                <div
                  key={job.id}
                  className={`rounded-2xl border p-4 transition ${
                    job.flagged
                      ? 'border-amber-400 bg-amber-50/20 shadow-sm'
                      : 'border-slate-200 bg-white shadow-sm'
                  }`}
                >
                  <div className="mb-2">
                    <h3 className="font-bold text-sm text-slate-900">{job.title}</h3>
                    <p className="text-xs text-slate-500">
                      {job.company} • {job.locality}
                    </p>
                  </div>

                  <div className="mb-3">
                    {job.flagged ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{job.flagMessage}</span>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-teal-700">{job.flagMessage}</p>
                    )}
                  </div>

                  {/* Moderation Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAction(job.id, 'approved')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        job.flagged
                          ? 'border border-teal-600 text-teal-700 hover:bg-teal-50'
                          : 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleAction(job.id, 'rejected')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        job.flagged
                          ? 'bg-red-700 hover:bg-red-800 text-white shadow-sm'
                          : 'border border-red-600 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}

              {pendingJobs.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  All pending moderation reviews are complete!
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Live Applications */}
          {activeTab === 'applications' && (
            <div className="space-y-3">
              {applicationsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No applications received yet.
                </div>
              ) : (
                applicationsList.map((app) => (
                  <div
                    key={app.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">{app.candidateName}</h4>
                      <p className="text-slate-500 mt-0.5">
                        {app.jobTitle} • {app.orgName} • Phone: {app.candidatePhone}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {app.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Candidate Profiles */}
          {activeTab === 'profiles' && (
            <div className="space-y-3">
              {profilesList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No candidate profiles registered yet.
                </div>
              ) : (
                profilesList.map((prof, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900">{prof.fullName || prof.name}</h4>
                      <span className="text-[11px] text-slate-500">{prof.taluk}</span>
                    </div>
                    <p className="text-slate-600">{prof.education}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prof.skills?.map((s: string) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Latest Application Box (Only shown if applications exist) */}
          {applicationsList.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Latest application
              </h2>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      {applicationsList[0].candidateName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {applicationsList[0].jobTitle} • {applicationsList[0].orgName}
                    </p>
                  </div>
                  {applicationsList[0].matchScore && (
                    <span className="font-bold text-xs text-teal-700">
                      {applicationsList[0].matchScore}%
                    </span>
                  )}
                </div>

                {applicationsList[0].resumeName && (
                  <div className="mt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{applicationsList[0].resumeName} (Verified)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      )}
    </div>
  );
}
