import en from './en.json';
import kn from './kn.json';

export const translations = {
  en,
  kn,
} as const;

export type SupportedLocale = keyof typeof translations;
export type TranslationDict = typeof en;

export function getTranslation(locale: SupportedLocale): TranslationDict {
  return translations[locale] || translations.en;
}
