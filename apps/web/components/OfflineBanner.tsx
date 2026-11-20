'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner({ lang = 'en' }: { lang?: 'en' | 'kn' }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-md">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>
        {lang === 'kn'
          ? 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ಉಳಿಸಿದ ಉದ್ಯೋಗಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಬಹುದು. ಹೊಸ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಅಗತ್ಯವಿದೆ.'
          : 'You are currently offline. You can browse cached jobs. Internet connection is required to apply or submit vacancies.'}
      </span>
    </div>
  );
}
