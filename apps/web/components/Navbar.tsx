'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, Globe, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentLang: 'en' | 'kn';
  onToggleLang: () => void;
}

export function Navbar({ currentLang, onToggleLang }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition">
              {currentLang === 'kn' ? 'ಮಂಡ್ಯ ಜಾಬ್ಸ್' : 'Mandya Jobs'}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-teal-700 font-medium">
              <ShieldCheck className="w-3 h-3 text-teal-600" />
              <span>{currentLang === 'kn' ? 'ಪರಿಶೀಲಿಸಿದ ಉದ್ಯೋಗಗಳು' : 'Verified Vacancies'}</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/employer/post"
            className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
          >
            {currentLang === 'kn' ? 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ' : 'Post a Job'}
          </Link>

          <Link
            href="/admin"
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded"
          >
            Admin
          </Link>

          <Link
            href="/login"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded"
          >
            {currentLang === 'kn' ? 'ಲಾಗಿನ್' : 'Sign In'}
          </Link>

          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentLang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
