'use client';

import { useContext } from 'react';
import { LanguageContext, type AppLanguage } from '@/components/language-provider';

export function useLanguage() {
  return useContext(LanguageContext);
}

export type { AppLanguage };
