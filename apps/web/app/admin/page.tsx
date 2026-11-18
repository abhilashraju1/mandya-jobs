'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Check, X, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { JobDTO, JobStatus } from '@mandya-jobs/types';

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
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [activeTab, setActiveTab] = useState<'pending' | 'applications' | 'profiles'>('pending');
  const [pendingJobs, setPendingJobs] = useState<any[]>(INITIAL_PENDING_QUEUE);
  const [toastMessage, setToastMessage] = useState('');

  // Load dynamically submitted employer jobs on mount
  useEffect(() => {
    try {
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
      <Navbar currentLang={lang} onToggleLang={() => setLang((p) => (p === 'en' ? 'kn' : 'en'))} />

      <main className="max-w-md mx-auto px-4 py-4 pb-20">
        <p className="text-xs font-semibold text-slate-500 mb-2">3 Admin review</p>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h1 className="text-xl font-black text-slate-900 mb-4">Admin</h1>

          {/* Tab Selector */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending {pendingJobs.length}
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                activeTab === 'applications'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Applications 14
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                activeTab === 'profiles'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Profiles 31
            </button>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-4 p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Pending Moderation Queue */}
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

          {/* Latest Application Box */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Latest application
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Priya R.</h4>
                  <p className="text-[11px] text-slate-500">
                    Billing Executive • Sri Lakshmi Showroom
                  </p>
                </div>
                <span className="font-bold text-xs text-teal-700">90%</span>
              </div>

              <div className="mt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>Priya_Resume_2026.pdf (Verified)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
