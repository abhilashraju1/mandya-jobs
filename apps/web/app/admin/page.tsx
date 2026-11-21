'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Check, X, AlertTriangle, FileText, CheckCircle2, ShieldCheck, Phone, Mail, Building2, User } from 'lucide-react';
import { JobDTO } from '@mandya-jobs/types';
import { useLanguage } from '../../context/LanguageContext';
import { adminLogin, moderateJob, verifyEmployer, fetchModerationQueue, fetchApplications } from '../../lib/api';

export default function AdminReviewPage() {
  const { lang, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pending' | 'applications'>('pending');
  const [pendingJobs, setPendingJobs] = useState<JobDTO[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState('9999');
  const [pinError, setPinError] = useState('');
  const [applicationsList, setApplicationsList] = useState<any[]>([]);

  const loadQueue = async () => {
    try {
      const queue = await fetchModerationQueue();
      setPendingJobs(Array.isArray(queue) ? queue : []);
    } catch {
      setPendingJobs([]);
    }
  };

  const loadApps = async () => {
    try {
      const apps = await fetchApplications();
      setApplicationsList(Array.isArray(apps) ? apps : []);
    } catch {
      setApplicationsList([]);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('mandya_admin_token');
    if (token) {
      setIsAdminAuthenticated(true);
      loadQueue();
      loadApps();
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    try {
      const res = await adminLogin(adminPin);
      localStorage.setItem('mandya_admin_token', res.token);
      localStorage.setItem('mandya_admin_pin', adminPin);
      setIsAdminAuthenticated(true);
      await Promise.all([loadQueue(), loadApps()]);
    } catch (err: any) {
      setPinError(err.message || 'Invalid administrator passcode');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('mandya_admin_token');
    localStorage.removeItem('mandya_admin_pin');
    setIsAdminAuthenticated(false);
    setAdminPin('');
    setPendingJobs([]);
  };

  const handleVerify = async (id: string) => {
    setErrorMessage('');
    try {
      await verifyEmployer(id);
      setToastMessage('Employer contact and trade credentials verified!');
      setTimeout(() => setToastMessage(''), 3500);
      await loadQueue();
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleModerate = async (
    id: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    reason?: string
  ) => {
    setErrorMessage('');
    try {
      await moderateJob(id, action, reason);
      setToastMessage(`Job status updated: ${action}`);
      setTimeout(() => setToastMessage(''), 3500);
      await loadQueue();
    } catch (err: any) {
      setErrorMessage(err.message || `Action ${action} failed`);
      setTimeout(() => setErrorMessage(''), 4000);
    }
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
                    Live Authenticated Session
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
                Moderation Queue ({pendingJobs.length})
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'applications'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Applications ({applicationsList.length})
              </button>
            </div>

            {/* Toast Notifications */}
            {toastMessage && (
              <div className="mb-4 p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex items-center gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Tab 1: Pending Moderation Queue */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`rounded-2xl border p-5 transition ${
                      job.fraudAlerts && job.fraudAlerts.length > 0
                        ? 'border-amber-400 bg-amber-50/20 shadow-sm'
                        : 'border-slate-200 bg-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900">{job.title}</h3>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            Status: {job.status}
                          </span>
                          {job.orgVerified ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-teal-600" />
                              Employer Verified
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Verification Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {job.orgName} • {job.orgBusinessType} • {job.taluk}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400">Ref: {job.submissionRef || job.id}</span>
                    </div>

                    {/* Private Verification Information for Administrator */}
                    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                        Private Poster Verification Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                        <p className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Contact: <strong>{job.posterContactName || 'Not specified'}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Phone: <strong>{job.posterContactPhone || job.contactPhone || 'None'}</strong></span>
                        </p>
                        {job.posterContactEmail && (
                          <p className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>Email: <strong>{job.posterContactEmail}</strong></span>
                          </p>
                        )}
                        <p className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Route: <strong>{job.applicationRoute || (job.isWalkIn ? 'WALK_IN' : 'DIRECT')}</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Fraud Alerts / Flags */}
                    {job.fraudAlerts && job.fraudAlerts.length > 0 && (
                      <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Fraud / Policy Alerts:</p>
                          <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                            {job.fraudAlerts.map((flag, idx) => (
                              <li key={idx}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Description preview */}
                    <p className="text-xs text-slate-600 mb-4 line-clamp-2">{job.description}</p>

                    {/* Moderation Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      {!job.orgVerified && (
                        <button
                          onClick={() => handleVerify(job.id)}
                          className="py-2 px-3 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>1. Verify Employer</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleModerate(job.id, 'APPROVE', 'Verified local employer with trade license.')}
                        disabled={!job.orgVerified}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                          job.orgVerified
                            ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                        title={!job.orgVerified ? 'Verify employer contact before approving' : 'Approve and publish to public feed'}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>2. Approve & Publish</span>
                      </button>

                      <button
                        onClick={() => handleModerate(job.id, 'REQUEST_CHANGES', 'Please provide valid business registration or trade certificate.')}
                        className="py-2 px-3 border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold transition"
                      >
                        Request Changes
                      </button>

                      <button
                        onClick={() => handleModerate(job.id, 'REJECT', 'Violates policy or failed authentication.')}
                        className="py-2 px-3 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}

                {pendingJobs.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto" />
                    <p className="font-semibold text-slate-600">All pending moderation reviews are complete.</p>
                    <p>New submissions from employers will automatically appear in this live queue.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Applications */}
            {activeTab === 'applications' && (
              <div className="space-y-3">
                {applicationsList.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No candidate applications submitted yet.
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
          </div>
        </main>
      )}
    </div>
  );
}
