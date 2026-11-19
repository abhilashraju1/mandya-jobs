'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bookmark, FileCheck, User } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MobileBottomNavProps {
  currentLang?: 'en' | 'kn';
  applicationCount?: number;
  savedCount?: number;
}

export function MobileBottomNav({
  currentLang: propLang,
  applicationCount = 0,
  savedCount = 0,
}: MobileBottomNavProps = {}) {
  const { lang } = useLanguage();
  const currentLang = propLang || lang;
  const pathname = usePathname() || '/';

  const navItems = [
    {
      href: '/',
      icon: Home,
      labelEn: 'Home',
      labelKn: 'ಮುಖಪುಟ',
      exact: true,
    },
    {
      href: '/?tab=search',
      icon: Search,
      labelEn: 'Search',
      labelKn: 'ಹುಡುಕಿ',
      exact: false,
    },
    {
      href: '/candidate/saved',
      icon: Bookmark,
      labelEn: 'Saved',
      labelKn: 'ಉಳಿಸಿದವು',
      badge: savedCount > 0 ? savedCount : undefined,
    },
    {
      href: '/candidate/applications',
      icon: FileCheck,
      labelEn: 'Applications',
      labelKn: 'ಅರ್ಜಿಗಳು',
      badge: applicationCount > 0 ? applicationCount : undefined,
    },
    {
      href: '/candidate/profile',
      icon: User,
      labelEn: 'Profile',
      labelKn: 'ಪ್ರೊಫೈಲ್',
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 max-w-md mx-auto"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href.split('?')[0]);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 rounded-xl transition relative ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px]">
                {currentLang === 'kn' ? item.labelKn : item.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
