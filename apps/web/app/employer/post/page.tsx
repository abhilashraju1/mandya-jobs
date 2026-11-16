'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/Navbar';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { CheckCircle2, Eye, Send } from 'lucide-react';

export default function EmployerPostJobPage() {
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [businessName, setBusinessName] = useState('Sri Lakshmi Showroom');
  const [businessType, setBusinessType] = useState('Showroom');
  const [jobTitle, setJobTitle] = useState('Billing Executive');
  const [locationSalary, setLocationSalary] = useState('Anna Nagar · 15,000 to 20,000 / month');
  const [skillsNeeded, setSkillsNeeded] = useState('billing, tally, customer service');
  const [description, setDescription] = useState('Handle counter billing and customer queries.');
  const [contactInfo, setContactInfo] = useState('98400 00000');
  const [submitted, setSubmitted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B]">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={() => setLang((p) => (p === 'en' ? 'kn' : 'en'))} />

      <main className="max-w-md mx-auto px-4 py-4 pb-20">
        <p className="text-xs font-semibold text-slate-500 mb-2">2 Post a job (employer)</p>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="mb-4">
            <h1 className="text-xl font-black text-slate-900">
              {lang === 'kn' ? 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ' : 'Post a job'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'kn'
                ? 'ಪ್ರಕಟಣೆಯ ಮೊದಲು ನಮ್ಮ ತಂಡದಿಂದ ಪರಿಶೀಲಿಸಲ್ಪಡುತ್ತದೆ'
                : 'Reviewed by our team before it goes live'}
            </p>
          </div>

          {submitted ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-bold text-base text-slate-900">
                {lang === 'kn' ? 'ಪರಿಶೀಲನೆಗೆ ಸಲ್ಲಿಸಲಾಗಿದೆ!' : 'Submitted for review!'}
              </h2>
              <p className="text-xs text-slate-600">
                {lang === 'kn'
                  ? 'ನಿಮ್ಮ ಹುದ್ದೆಯನ್ನು ನಮ್ಮ ಮಧ್ಯಸ್ಥಿಕೆ ತಂಡವು ಪರಿಶೀಲಿಸುತ್ತದೆ. ಅನುಮೋದನೆಯ ನಂತರ ಇದು ನೇರವಾಗಿ ಪ್ರಕಟವಾಗುತ್ತದೆ.'
                  : 'Our moderation team is reviewing your posting. Once verified, it will be published live.'}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                Post another job
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business type</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                >
                  <option value="Showroom">Showroom</option>
                  <option value="Hospital">Hospital / Clinic</option>
                  <option value="Hotel">Hotel / Restaurant</option>
                  <option value="School">School / College</option>
                  <option value="Office">Office / Finance / Legal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location and salary</label>
                <input
                  type="text"
                  value={locationSalary}
                  onChange={(e) => setLocationSalary(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Skills needed</label>
                <input
                  type="text"
                  value={skillsNeeded}
                  onChange={(e) => setSkillsNeeded(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact phone or email</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for review</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
