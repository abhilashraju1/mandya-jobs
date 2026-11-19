'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/Navbar';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { CheckCircle2, Send, Building2, MapPin, AlertTriangle } from 'lucide-react';
import { detectJobFraud } from '@mandya-jobs/validation';
import { JobStatus, EmploymentType, WorkMode, SalaryPeriod } from '@mandya-jobs/types';

export default function EmployerPostJobPage() {
  const [lang, setLang] = useState<'en' | 'kn'>('en');
  const [businessName, setBusinessName] = useState('Sri Lakshmi Showroom');
  const [businessType, setBusinessType] = useState('Showroom');
  const [jobTitle, setJobTitle] = useState('Billing Executive');
  const [taluk, setTaluk] = useState('Mandya Town');
  const [salaryMin, setSalaryMin] = useState(15000);
  const [salaryMax, setSalaryMax] = useState(20000);
  const [skillsNeeded, setSkillsNeeded] = useState('billing, tally, customer service');
  const [description, setDescription] = useState('Handle counter billing, POS operations, and customer queries.');
  const [contactInfo, setContactInfo] = useState('9845012345');
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [walkInVenue, setWalkInVenue] = useState('Sri Lakshmi Showroom, 2nd Floor, VV Road, Mandya');
  const [submittedJobId, setSubmittedJobId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const jobId = `job_${Date.now()}`;
    const skillsList = skillsNeeded.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

    // Run heuristic anti-fraud check
    const fraudCheck = detectJobFraud({
      title: jobTitle,
      description,
      contactPhone: contactInfo,
    });

    const newJob = {
      id: jobId,
      orgId: `org_${Date.now()}`,
      orgName: businessName,
      orgBusinessType: businessType,
      orgVerified: true, // Recruiter verified
      categoryId: businessType.toLowerCase(),
      categoryName: businessType,
      title: jobTitle,
      employmentType: EmploymentType.FULL_TIME,
      workMode: WorkMode.ON_SITE,
      taluk,
      addressDisplay: `${taluk}, Mandya District`,
      salaryMin: Number(salaryMin),
      salaryMax: Number(salaryMax),
      salaryPeriod: SalaryPeriod.MONTHLY,
      isNegotiable: true,
      minExpYears: 1,
      minEducation: 'PUC / Graduate',
      openings: 2,
      description,
      benefits: ['PF', 'ESI', 'Incentives'],
      requiredSkills: skillsList,
      preferredSkills: ['ms excel'],
      isWalkIn,
      walkInVenue: isWalkIn ? walkInVenue : undefined,
      walkInTimings: isWalkIn ? '10:00 AM - 1:00 PM' : undefined,
      contactPhone: contactInfo,
      status: JobStatus.SUBMITTED,
      createdAt: new Date().toISOString(),
      fraudAlerts: fraudCheck.flags,
    };

    try {
      const existingQueue = JSON.parse(localStorage.getItem('mandya_moderation_queue') || '[]');
      localStorage.setItem('mandya_moderation_queue', JSON.stringify([newJob, ...existingQueue]));
    } catch {
      // Fallback
    }

    setSubmittedJobId(jobId);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B]">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={() => setLang((p) => (p === 'en' ? 'kn' : 'en'))} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-4">
            <h1 className="text-xl font-black text-slate-900">
              {lang === 'kn' ? 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ' : 'Post a job'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'kn'
                ? 'ಪ್ರಕಟಣೆಯ ಮೊದಲು ನಮ್ಮ ತಂಡದಿಂದ ಪರಿಶೀಲಿಸಲ್ಪಡುತ್ತದೆ'
                : 'Reviewed by our moderation team before going live'}
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
                  ? `ನಿಮ್ಮ ಹುದ್ದೆ (ID: ${submittedJobId}) ಯನ್ನು ಮಧ್ಯಸ್ಥಿಕೆ ತಂಡವು ಪರಿಶೀಲಿಸುತ್ತಿದೆ. ಅನುಮೋದನೆಯ ನಂತರ ನೇರವಾಗಿ ಪ್ರಕಟವಾಗುತ್ತದೆ.`
                  : `Your job posting (${submittedJobId}) has been routed to the admin moderation queue for verification.`}
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

              <div className="grid grid-cols-2 gap-2">
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
                    <option value="Dairy">Dairy & Agriculture</option>
                    <option value="Office">Office / Finance / Legal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Taluk</label>
                  <select
                    value={taluk}
                    onChange={(e) => setTaluk(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="Mandya Town">Mandya Town</option>
                    <option value="Maddur">Maddur</option>
                    <option value="Malavalli">Malavalli</option>
                    <option value="Pandavapura">Pandavapura</option>
                    <option value="Srirangapatna">Srirangapatna</option>
                  </select>
                </div>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Salary (₹/mo)</label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Salary (₹/mo)</label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={skillsNeeded}
                  onChange={(e) => setSkillsNeeded(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWalkIn}
                    onChange={(e) => setIsWalkIn(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Conduct Walk-in Interviews</span>
                </label>
                {isWalkIn && (
                  <input
                    type="text"
                    value={walkInVenue}
                    onChange={(e) => setWalkInVenue(e.target.value)}
                    placeholder="Walk-in venue address..."
                    className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                )}
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
