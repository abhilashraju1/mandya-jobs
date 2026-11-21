'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../../components/Navbar';
import { MobileBottomNav } from '../../../components/MobileBottomNav';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { useLanguage } from '../../../context/LanguageContext';
import {
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Plus,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { uploadResumeFile, saveCandidateProfile } from '../../../lib/api';

export default function CandidateProfilePage() {
  const { lang, toggleLanguage } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [taluk, setTaluk] = useState('Mandya Town');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeName, setResumeName] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [saveToast, setSaveToast] = useState('');
  const [resumeNotice, setResumeNotice] = useState('');

  // Load persisted candidate profile on mount if exists
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mandya_candidate_profile');
      if (stored) {
        const p = JSON.parse(stored);
        if (p.fullName || p.name) setFullName(p.fullName || p.name);
        if (p.phone) setPhone(p.phone);
        if (p.taluk) setTaluk(p.taluk);
        if (p.education || p.educationLevel) setEducation(p.education || p.educationLevel);
        if (p.experience) setExperience(p.experience);
        if (Array.isArray(p.skills)) setSkills(p.skills);
        if (p.resumeName) setResumeName(p.resumeName);
      }
    } catch {
      // Fallback cleanly
    }
  }, []);

  const fillSampleNurse = () => {
    setFullName('Priya R.');
    setPhone('9845987654');
    setTaluk('Mandya Town');
    setEducation('Diploma in General Nursing (GNM)');
    setExperience('1.5 Years Clinical Nursing at Local Hospital');
    setSkills(['nursing', 'patient care', 'first aid', 'kannada communication']);
    setResumeName('Priya_R_Nurse_Resume_2026.pdf');
    setSaveToast('Populated Staff Nurse persona (Priya R.)!');
    setTimeout(() => setSaveToast(''), 3000);
  };

  const handleClearProfile = () => {
    localStorage.removeItem('mandya_candidate_profile');
    setFullName('');
    setPhone('');
    setTaluk('Mandya Town');
    setEducation('');
    setExperience('');
    setSkills([]);
    setResumeName('');
    setSaveToast('Profile cleared to clean fresh state.');
    setTimeout(() => setSaveToast(''), 3000);
  };

  const addSkill = () => {
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim().toLowerCase())) {
      setSkills([...skills, newSkillInput.trim().toLowerCase()]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setResumeNotice(
        lang === 'kn'
          ? 'ದೋಷ: ರೆಸ್ಯೂಮ್ ಗಾತ್ರ 5MB ಗಿಂತ ಕಡಿಮೆಯಿರಬೇಕು.'
          : 'Error: Resume size must be within 5MB.'
      );
      setTimeout(() => setResumeNotice(''), 4000);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const storedUser = JSON.parse(localStorage.getItem('mandya_user') || '{}');
          const candidateId = storedUser.id || `cand_${Date.now()}`;

          const res = await uploadResumeFile({
            originalname: file.name,
            size: file.size,
            base64Data,
            mimetype: file.type,
            candidateId,
          });

          setResumeName(res.originalName);
          setResumeNotice(
            lang === 'kn'
              ? `"${res.originalName}" ಸರ್ವರ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ ಮತ್ತು ಮ್ಯಾಜಿಕ್-ಬೈಟ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ.`
              : `"${res.originalName}" uploaded safely and confirmed by server quarantine scan.`
          );
          setTimeout(() => setResumeNotice(''), 4000);
        } catch (err: any) {
          setResumeNotice(err.message || 'File upload failed');
          setTimeout(() => setResumeNotice(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setResumeNotice(err.message || 'Failed to read file');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const storedUser = JSON.parse(localStorage.getItem('mandya_user') || '{}');
    const candidateId = storedUser.id || `cand_${phone.replace(/\D/g, '') || Date.now()}`;

    const profileData = {
      id: candidateId,
      fullName,
      name: fullName,
      phone,
      taluk,
      education,
      educationLevel: education,
      experience,
      totalExpYears: experience.toLowerCase().includes('fresher') ? 0 : 1,
      skills,
      resumeName,
      expectedSalary: 18000,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveCandidateProfile(profileData);
      localStorage.setItem('mandya_candidate_profile', JSON.stringify(profileData));
      setSaveToast(
        lang === 'kn'
          ? 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಕೌಶಲ್ಯಗಳು ಸರ್ವರ್‌ನಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲ್ಪಟ್ಟಿವೆ!'
          : 'Profile and matching criteria saved to server successfully!'
      );
    } catch {
      localStorage.setItem('mandya_candidate_profile', JSON.stringify(profileData));
      setSaveToast(
        lang === 'kn'
          ? 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಲಾಗಿದೆ (ಆಫ್‌ಲೈನ್ ಮೋಡ್)'
          : 'Profile saved locally'
      );
    }
    setTimeout(() => setSaveToast(''), 3500);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#17243B] pb-24">
      <OfflineBanner lang={lang} />
      <Navbar currentLang={lang} onToggleLang={toggleLanguage} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-slate-500 hover:text-slate-800 p-1 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-black text-slate-900">
              {lang === 'kn' ? 'ನನ್ನ ಪ್ರೊಫೈಲ್' : 'My Profile'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fillSampleNurse}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Fill Priya R. (Staff Nurse)</span>
            </button>
            <button
              type="button"
              onClick={handleClearProfile}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
              title="Clear profile"
            >
              Clear
            </button>
          </div>
        </div>

        {saveToast && (
          <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-semibold text-teal-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}

        {resumeNotice && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{resumeNotice}</span>
          </div>
        )}

        {/* Resume Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900">{resumeName}</h3>
                <p className="text-[11px] text-teal-700 font-medium flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                  <span>Magic-byte verified & private storage</span>
                </p>
              </div>
            </div>

            <label className="cursor-pointer py-1.5 px-3 rounded-lg border border-blue-200 bg-blue-50/50 text-blue-700 font-semibold text-xs hover:bg-blue-100/50 transition">
              Replace
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleResumeChange}
              />
            </label>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Taluk / Area</label>
              <select
                value={taluk}
                onChange={(e) => setTaluk(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              >
                <option value="Mandya Town">Mandya Town</option>
                <option value="Maddur">Maddur</option>
                <option value="Malavalli">Malavalli</option>
                <option value="Pandavapura">Pandavapura</option>
                <option value="Nagamangala">Nagamangala</option>
                <option value="Krishnarajpet">Krishnarajpet</option>
                <option value="Srirangapatna">Srirangapatna</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Highest Education</label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Experience</label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Skills Management Chips */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Skills (Used for Smart Matching)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-blue-500 hover:text-blue-700 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Add skill (e.g. excel, typing)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={addSkill}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md shadow-blue-500/20 active:scale-[0.99]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </main>

      <MobileBottomNav currentLang={lang} />
    </div>
  );
}
