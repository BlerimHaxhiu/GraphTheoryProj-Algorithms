'use client';

import {
  createContext,
  type FC,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { getTranslation, type TranslationKey } from '@/lib/translations';

export type AppLanguage = 'sq' | 'en';

interface LanguageProviderProps {
  children: ReactNode;
}

export interface LanguageContextValue {
  language: AppLanguage;
  mounted: boolean;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

export const LANGUAGE_STORAGE_KEY = 'app-language';

const defaultLanguageContextValue: LanguageContextValue = {
  language: 'sq',
  mounted: false,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: key => getTranslation('sq', key),
};

export const LanguageContext = createContext<LanguageContextValue>(
  defaultLanguageContextValue
);

function getPreferredLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return 'sq';
  }

  try {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage === 'sq' || savedLanguage === 'en') {
      return savedLanguage;
    }
  } catch {
    return 'sq';
  }

  return 'sq';
}

function applyLanguage(language: AppLanguage) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = language;
}

export const LanguageProvider: FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<AppLanguage>('sq');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialLanguage = getPreferredLanguage();
    applyLanguage(initialLanguage);
    setLanguage(initialLanguage);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    applyLanguage(language);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage errors so language switching never breaks rendering.
    }
  }, [language, mounted]);

  const value: LanguageContextValue = {
    language,
    mounted,
    setLanguage,
    toggleLanguage: () => setLanguage(prev => (prev === 'sq' ? 'en' : 'sq')),
    t: (key, values) => getTranslation(language, key, values),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
