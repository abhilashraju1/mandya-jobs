'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation, SupportedLocale, TranslationDict } from '@mandya-jobs/i18n';

interface LanguageContextType {
  lang: SupportedLocale;
  setLang: (lang: SupportedLocale) => void;
  toggleLanguage: () => void;
  t: TranslationDict;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLanguage: () => {},
  t: getTranslation('en'),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLocale>('en');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mandya_lang') as SupportedLocale;
      if (stored === 'kn' || stored === 'en') {
        setLangState(stored);
        document.documentElement.lang = stored;
      }
    } catch {
      // Fallback
    }
  }, []);

  const setLang = (nextLang: SupportedLocale) => {
    setLangState(nextLang);
    try {
      localStorage.setItem('mandya_lang', nextLang);
      document.documentElement.lang = nextLang;
    } catch {
      // Fallback
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'kn' : 'en';
    setLang(nextLang);
  };

  const t = getTranslation(lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
