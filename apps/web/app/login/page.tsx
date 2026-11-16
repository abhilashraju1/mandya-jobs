'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Phone, KeyRound, CheckCircle2, ShieldCheck, ArrowRight, RotateCw, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [phone, setPhone] = useState('9845987654');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CANDIDATE' | 'EMPLOYER' | 'ADMIN'>('CANDIDATE');
  const [consentAgreed, setConsentAgreed] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerActive && countdown > 0) {
      interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, countdown]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const clean = phone.replace(/[\s-+]/g, '');
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setErrorMessage(
        lang === 'kn'
          ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10-ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ'
          : 'Please enter a valid 10-digit Indian mobile number'
      );
      return;
    }

    setStep('otp');
    setCountdown(300);
    setIsTimerActive(true);
    setOtp('123456'); // Pre-fill development mock OTP for 1-click verification
    setSuccessToast(
      lang === 'kn'
        ? 'OTP ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ (ಡೆಮೊ ಕೋಡ್: 123456)'
        : 'OTP sent successfully (Demo code: 123456)'
    );
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (otp !== '123456' && otp.length !== 6) {
      setErrorMessage(
        lang === 'kn' ? 'ತಪ್ಪಾದ OTP ಕೋಡ್. ದಯವಿಟ್ಟು 123456 ನಮೂದಿಸಿ' : 'Invalid OTP. Please enter 123456'
      );
      return;
    }

    setIsLoggedIn(true);
    setSuccessToast(
      lang === 'kn' ? 'ಲಾಗಿನ್ ಯಶಸ್ವಿಯಾಗಿದೆ! ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...' : 'Signed in successfully! Redirecting...'
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B] pb-24">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={() => setLang((p) => (p === 'en' ? 'kn' : 'en'))} />

      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900">
              {lang === 'kn' ? 'ಲಾಗಿನ್ / ನೋಂದಣಿ' : 'Sign In / Register'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'kn'
                ? 'ಪಾಸ್‌ವರ್ಡ್‌ಲೆಸ್ ಫೋನ್ OTP ದೃಢೀಕರಣ'
                : 'Secure passwordless Phone OTP verification'}
            </p>
          </div>

          {/* Role Pill Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedRole('CANDIDATE')}
              className={`py-2 rounded-xl transition ${
                selectedRole === 'CANDIDATE'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('EMPLOYER')}
              className={`py-2 rounded-xl transition ${
                selectedRole === 'EMPLOYER'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Employer
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('ADMIN')}
              className={`py-2 rounded-xl transition ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Toast / Error */}
          {successToast && (
            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          {isLoggedIn ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Welcome, {phone}!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Logged in as <span className="font-bold text-blue-600">{selectedRole}</span>.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {selectedRole === 'CANDIDATE' && (
                  <Link
                    href="/candidate/profile"
                    className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 text-center shadow-md shadow-blue-500/20"
                  >
                    Go to Candidate Profile
                  </Link>
                )}
                {selectedRole === 'EMPLOYER' && (
                  <Link
                    href="/employer/post"
                    className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 text-center shadow-md shadow-blue-500/20"
                  >
                    Go to Post a Job
                  </Link>
                )}
                {selectedRole === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 text-center shadow-md shadow-blue-500/20"
                  >
                    Go to Admin Approvals
                  </Link>
                )}
                <Link
                  href="/"
                  className="w-full py-2 px-4 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 text-center"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {lang === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : 'Mobile Number'}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-semibold text-slate-500 text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98450 12345"
                    className="w-full border border-slate-200 rounded-xl pl-12 pr-3 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Consent checkbox compliant with DPDP Act */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  required
                />
                <label htmlFor="consent" className="text-[11px] text-slate-500 leading-tight">
                  {lang === 'kn'
                    ? 'ನಾನು ಸೇವಾ ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತಾ ನೀತಿಯನ್ನು ಒಪ್ಪುತ್ತೇನೆ. ಯಾವುದೇ ನೋಂದಣಿ ಶುಲ್ಕವಿಲ್ಲ.'
                    : 'I agree to the Terms of Service & Privacy Policy. Job applications are 100% free with zero recruitment fees.'}
                </label>
              </div>

              <button
                type="submit"
                disabled={!consentAgreed}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-1.5 text-xs"
              >
                <span>{lang === 'kn' ? 'OTP ಕಳುಹಿಸಿ' : 'Get OTP'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">Sent to:</span>
                  <p className="font-bold text-slate-800">+91 {phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  {lang === 'kn' ? '6-ಅಂಕಿಯ OTP ಕೋಡ್' : 'Enter 6-digit OTP'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-mono tracking-widest text-center text-sm font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Demo code: <span className="font-bold text-slate-700">123456</span>
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">
                  {isTimerActive ? `Expires in ${formatTime(countdown)}` : 'OTP expired'}
                </span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isTimerActive}
                  className="text-blue-600 font-semibold hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 active:scale-[0.99] text-xs"
              >
                {lang === 'kn' ? 'ದೃಢೀಕರಿಸಿ ಮತ್ತು ಪ್ರವೇಶಿಸಿ' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {/* Trust Footnote */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-teal-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>DPDP Act 2023 Compliant • No Aadhaar Required</span>
          </div>
        </div>
      </main>
    </div>
  );
}
