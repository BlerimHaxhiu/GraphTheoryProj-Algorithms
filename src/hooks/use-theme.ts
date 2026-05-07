'use client';

import { useContext } from 'react';
import { ThemeContext, type Theme } from '@/components/theme-provider';

export function useTheme() {
  return useContext(ThemeContext);
}

export type { Theme };
