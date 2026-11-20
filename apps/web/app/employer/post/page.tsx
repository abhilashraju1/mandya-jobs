'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/Navbar';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { CheckCircle2, Send, Building2, MapPin, AlertTriangle, Sparkles } from 'lucide-react';
import { detectJobFraud } from '@mandya-jobs/validation';
import { JobStatus, EmploymentType, WorkMode, SalaryPeriod } from '@mandya-jobs/types';
import { useLanguage } from '../../../context/LanguageContext';
import { createJobDraft, submitJobForReview } from '../../../lib/api';

export default function EmployerPostJobPage() {
  const { lang, toggleLanguage } = useLanguage();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Showroom');
  const [jobTitle, setJobTitle] = useState('');
  const [taluk, setTaluk] = useState('Mandya Town');
  const [area, setArea] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>(WorkMode.ON_SITE);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(EmploymentType.FULL_TIME);
  const [minEducation, setMinEducation] = useState('PUC / 12th');
  const [specificCredential, setSpecificCredential] = useState('');
  const [minExpYears, setMinExpYears] = useState<number>(0);
  const [salaryMin, setSalaryMin] = useState<number | string>('');
  const [salaryMax, setSalaryMax] = useState<number | string>('');
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>(SalaryPeriod.MONTHLY);
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [skillsNeeded, setSkillsNeeded] = useState('');
  const [description, setDescription] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [applicationRoute, setApplicationRoute] = useState<'WALK_IN' | 'PHONE_CALL' | 'EXTERNAL_URL' | 'MANDYA_JOBS_DIRECT'>('WALK_IN');
  const [externalAppUrl, setExternalAppUrl] = useState('');
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInVenue, setWalkInVenue] = useState('');
  const [walkInTimings, setWalkInTimings] = useState('');
  const [agreedAntiFee, setAgreedAntiFee] = useState(true);
  const [submittedJobId, setSubmittedJobId] = useState('');
  const [submissionRef, setSubmissionRef] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fillSampleData = () => {
    setBusinessName('Sri Lakshmi Showroom');
    setBusinessType('Showroom');
    setJobTitle('Billing Executive');
    setTaluk('Mandya Town');
    setArea('VV Road, 2nd Floor');
    setWorkMode(WorkMode.ON_SITE);
    setEmploymentType(EmploymentType.FULL_TIME);
    setMinEducation('PUC / 12th');
    setMinExpYears(0);
    setSalaryMin(15000);
    setSalaryMax(20000);
    setSalaryPeriod(SalaryPeriod.MONTHLY);
    setIsNegotiable(true);
    setSkillsNeeded('billing, tally, customer service');
    setDescription('Handle counter billing, POS operations, and customer queries.');
    setContactPersonName('Ramesh Kumar');
    setContactInfo('9845012345');
    setApplicationRoute('WALK_IN');
    setIsWalkIn(true);
    setWalkInVenue('Sri Lakshmi Showroom, 2nd Floor, VV Road, Mandya');
    setWalkInTimings('10:00 AM - 1:00 PM (Mon-Sat)');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const skillsList = skillsNeeded.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

    // Run heuristic anti-fraud check
    const fraudCheck = detectJobFraud({
      title: jobTitle,
      description,
      contactPhone: contactInfo,
    });

    const jobPayload = {
      orgName: businessName,
      orgBusinessType: businessType,
      orgVerified: false,
      isGuestSubmission: true,
      categoryId: businessType.toLowerCase(),
      categoryName: businessType,
      title: jobTitle,
      employmentType,
      workMode,
      taluk,
      addressDisplay: area ? `${area}, ${taluk}` : `${taluk}, Mandya District`,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      salaryPeriod,
      isNegotiable,
      minExpYears: Number(minExpYears),
      minEducation,
      specificCredential: specificCredential || undefined,
      applicationRoute,
      openings: 1,
      description,
      benefits: ['Provident Fund', 'Incentives'],
      requiredSkills: skillsList,
      preferredSkills: [],
      isWalkIn: isWalkIn || applicationRoute === 'WALK_IN',
      walkInVenue: isWalkIn || applicationRoute === 'WALK_IN' ? walkInVenue : undefined,
      walkInTimings: isWalkIn || applicationRoute === 'WALK_IN' ? walkInTimings : undefined,
      contactPhone: contactInfo,
      posterContactName: contactPersonName,
      status: JobStatus.SUBMITTED,
      fraudAlerts: fraudCheck.flags,
    };

    let serverJobId = `job_${Date.now()}`;
    let serverRef = `REF-MDY-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const created = await createJobDraft(jobPayload);
      if (created?.id) {
        serverJobId = created.id;
        serverRef = created.submissionRef || serverRef;
        await submitJobForReview(created.id);
      }
      const existingQueue = JSON.parse(localStorage.getItem('mandya_moderation_queue') || '[]');
      localStorage.setItem(
        'mandya_moderation_queue',
        JSON.stringify([{ ...jobPayload, id: serverJobId, submissionRef: serverRef }, ...existingQueue])
      );
    } catch (err) {
      console.debug('API submit error:', err);
    }

    setSubmittedJobId(serverJobId);
    setSubmissionRef(serverRef);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B]">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={toggleLanguage} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {lang === 'kn' ? 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ' : 'Post a Job'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'kn'
                  ? 'ಪ್ರಕಟಣೆಯ ಮೊದಲು ನಮ್ಮ ತಂಡದಿಂದ ಪರಿಶೀಲಿಸಲ್ಪಡುತ್ತದೆ'
                  : 'Reviewed by our moderation team before going live'}
              </p>
            </div>
            <button
              type="button"
              onClick={fillSampleData}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Fill Sample (Sri Lakshmi Showroom)</span>
            </button>
          </div>

          {submitted ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold mb-2">
                  {lang === 'kn' ? 'ಮಧ್ಯಸ್ಥಿಕೆ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' : 'Pending Admin Review'}
                </span>
                <h2 className="font-black text-lg text-slate-900">
                  {lang === 'kn' ? 'ಪರಿಶೀಲನೆಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!' : 'Submitted for Verification!'}
                </h2>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'kn' ? 'ರೆಫರೆನ್ಸ್ ಸಂಖ್ಯೆ:' : 'Submission Ref:'}</span>
                  <span className="font-mono font-bold text-slate-800">{submissionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'kn' ? 'ಹುದ್ದೆ ಐಡಿ:' : 'Job ID:'}</span>
                  <span className="font-mono font-semibold text-slate-600">{submittedJobId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'kn' ? 'ಸ್ಥಿತಿ:' : 'Visibility:'}</span>
                  <span className="text-amber-700 font-bold">{lang === 'kn' ? 'ಖಾಸಗಿ (ಪ್ರಕಟವಾಗಿಲ್ಲ)' : 'Private (Not Public)'}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {lang === 'kn'
                  ? 'ನಿಮ್ಮ ಉದ್ಯೋಗ ಪ್ರಕಟಣೆಯನ್ನು ನಮ್ಮ ಮಧ್ಯಸ್ಥಿಕೆ ತಂಡವು ಸಂಪರ್ಕ ವಿವರಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸುತ್ತದೆ. ನಿಯಮಾನುಸಾರ ಅನುಮೋದನೆ ದೊರೆತ ನಂತರವೇ ಸಾರ್ವಜನಿಕವಾಗಿ ಪ್ರಕಟಗೊಳ್ಳುತ್ತದೆ.'
                  : 'Your posting is currently private and held in the moderation queue. Our district admin team will verify the contact and approve publication.'}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm"
              >
                {lang === 'kn' ? 'ಮತ್ತೊಂದು ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ' : 'Post another vacancy'}
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
                  <label className="block font-semibold text-slate-700 mb-1">{lang === 'kn' ? 'ತಾಲೂಕು' : 'Taluk'}</label>
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
                    <option value="Nagamangala">Nagamangala</option>
                    <option value="KR Pete">KR Pete</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'kn' ? 'ಸ್ಥಳ / ಪ್ರದೇಶ (ಬೀದಿ ಅಥವಾ ಹೆಗ್ಗುರುತು)' : 'Area / Locality / Landmark'}
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. VV Road, near Bus Stand"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{lang === 'kn' ? 'ಹುದ್ದೆಯ ಹೆಸರು' : 'Job title'}</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Billing Executive, Staff Nurse"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'kn' ? 'ಕನಿಷ್ಠ ವಿದ್ಯಾರ್ಹತೆ' : 'Min Education'}
                  </label>
                  <select
                    value={minEducation}
                    onChange={(e) => setMinEducation(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value="No formal education required">No formal education required</option>
                    <option value="Below SSLC">Below SSLC</option>
                    <option value="SSLC / 10th">SSLC / 10th</option>
                    <option value="PUC / 12th">PUC / 12th</option>
                    <option value="ITI / Vocational">ITI / Vocational</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Any Degree / Graduation">Any Degree / Graduation</option>
                    <option value="Postgraduate / Professional">Postgraduate / Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'kn' ? 'ಅನುಭವ' : 'Min Experience'}
                  </label>
                  <select
                    value={minExpYears}
                    onChange={(e) => setMinExpYears(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    <option value={0}>No experience required / Freshers welcome</option>
                    <option value={1}>1+ Year</option>
                    <option value={2}>2+ Years</option>
                    <option value={3}>3+ Years</option>
                    <option value={5}>5+ Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'kn' ? 'ನಿರ್ದಿಷ್ಟ ಅರ್ಹತೆ / ಪ್ರಮಾಣಪತ್ರ (ಐಚ್ಛಿಕ)' : 'Specific Credential / License (Optional)'}
                </label>
                <input
                  type="text"
                  value={specificCredential}
                  onChange={(e) => setSpecificCredential(e.target.value)}
                  placeholder="e.g. GNM / B.Sc Nursing, D.Pharm, Commercial Driving License"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Salary (₹/mo)</label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={skillsNeeded}
                  onChange={(e) => setSkillsNeeded(e.target.value)}
                  placeholder="e.g. billing, tally, customer service"
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

              {/* Private Admin Verification Contact (Kept private from job seekers) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span>🛡️</span>
                  <span>{lang === 'kn' ? 'ಮಧ್ಯಸ್ಥಿಕೆ ಪರಿಶೀಲನಾ ಸಂಪರ್ಕ (ಖಾಸಗಿ)' : 'Verification Contact (Private to Admin)'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {lang === 'kn' ? 'ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ಹೆಸರು' : 'Contact Person Name'}
                    </label>
                    <input
                      type="text"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {lang === 'kn' ? 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ' : 'Phone Number'}
                    </label>
                    <input
                      type="text"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="e.g. 9845012345"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Candidate Application Route */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'kn' ? 'ಅಭ್ಯರ್ಥಿ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ' : 'Candidate Application Method'}
                </label>
                <select
                  value={applicationRoute}
                  onChange={(e: any) => setApplicationRoute(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                >
                  <option value="WALK_IN">Direct Walk-in Interview</option>
                  <option value="PHONE_CALL">Call or WhatsApp</option>
                  <option value="EXTERNAL_URL">External Website / Portal</option>
                  <option value="MANDYA_JOBS_DIRECT">Apply on Mandya Jobs (Direct)</option>
                </select>
              </div>

              {applicationRoute === 'WALK_IN' && (
                <div className="space-y-2 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Walk-in Venue</label>
                    <input
                      type="text"
                      value={walkInVenue}
                      onChange={(e) => setWalkInVenue(e.target.value)}
                      placeholder="e.g. Sri Lakshmi Showroom, 2nd Floor, VV Road"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Walk-in Timings</label>
                    <input
                      type="text"
                      value={walkInTimings}
                      onChange={(e) => setWalkInTimings(e.target.value)}
                      placeholder="e.g. 10:00 AM - 1:00 PM (Mon-Sat)"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Anti-Scam & Accuracy Acknowledgement */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedAntiFee}
                    onChange={(e) => setAgreedAntiFee(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    {lang === 'kn'
                      ? 'ಈ ವಿವರಗಳು ನಿಖರವಾಗಿದ್ದು, ಮಧ್ಯಸ್ಥಿಕೆ ಪರಿಶೀಲನೆಗಾಗಿ ಸಂಪರ್ಕಿಸಲು ಸಮ್ಮತಿಸುತ್ತೇನೆ ಮತ್ತು ಯಾವುದೇ ನೋಂದಣಿ ಶುಲ್ಕ ವಿಧಿಸುವುದಿಲ್ಲ ಎಂದು ದೃಢೀಕರಿಸುತ್ತೇನೆ.'
                      : 'I acknowledge that the details are accurate, agree that Mandya Jobs administration may contact me for review, and confirm that NO recruitment fees will be charged to job seekers.'}
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!agreedAntiFee}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{lang === 'kn' ? 'ಪರಿಶೀಲನೆಗೆ ಸಲ್ಲಿಸಿ' : 'Submit for review'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
