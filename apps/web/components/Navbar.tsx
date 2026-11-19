'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Globe, ShieldCheck, Bookmark, FileCheck, User, PlusCircle, Shield } from 'lucide-react';

interface NavbarProps {
  currentLang: 'en' | 'kn';
  onToggleLang: () => void;
}

export function Navbar({ currentLang, onToggleLang }: NavbarProps) {
  const pathname = usePathname() || '/';

  const isLinkActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <Link
              href="/"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                isLinkActive('/') && pathname === '/'
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{currentLang === 'kn' ? 'ಉದ್ಯೋಗಗಳು' : 'Find Jobs'}</span>
            </Link>

            <Link
              href="/candidate/saved"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                isLinkActive('/candidate/saved')
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{currentLang === 'kn' ? 'ಉಳಿಸಿದವು' : 'Saved'}</span>
            </Link>

            <Link
              href="/candidate/applications"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                isLinkActive('/candidate/applications')
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{currentLang === 'kn' ? 'ಅರ್ಜಿಗಳು' : 'Applications'}</span>
            </Link>

            <Link
              href="/candidate/profile"
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                isLinkActive('/candidate/profile')
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{currentLang === 'kn' ? 'ಪ್ರೊಫೈಲ್' : 'Profile'}</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/employer/post"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600 hidden sm:inline" />
            <span>{currentLang === 'kn' ? 'ಉದ್ಯೋಗ ಪ್ರಕಟಿಸಿ' : 'Post a Job'}</span>
          </Link>

          <Link
            href="/admin"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              isLinkActive('/admin')
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

          <Link
            href="/login"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1.5 rounded hover:bg-blue-50 transition"
          >
            {currentLang === 'kn' ? 'ಲಾಗಿನ್' : 'Sign In'}
          </Link>

          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentLang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
