'use client';

import React, { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Check, X, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminReviewPage() {
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [activeTab, setActiveTab] = useState<'pending' | 'applications' | 'profiles'>('pending');

  const [pendingJobs, setPendingJobs] = useState([
    {
      id: 'job_1',
      title: 'Billing Executive',
      company: 'Sri Lakshmi Showroom',
      locality: 'Anna Nagar',
      flagged: false,
      flagMessage: 'No red flags found',
    },
    {
      id: 'job_2',
      title: 'Data Entry Work From Home',
      company: 'QuickEarn Services',
      locality: 'Other',
      flagged: true,
      flagMessage: 'Flagged: "registration fee", contact looks invalid',
    },
  ]);

  const [toastMessage, setToastMessage] = useState('');

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    const job = pendingJobs.find((j) => j.id === id);
    setPendingJobs((prev) => prev.filter((j) => j.id !== id));
    setToastMessage(`Job "${job?.title}" has been ${action}.`);
    setTimeout(() => setToastMessage(''), 3000);
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
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
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
                <span className="font-bold text-xs text-teal-700">92%</span>
              </div>

              <button className="mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>View resume text</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
