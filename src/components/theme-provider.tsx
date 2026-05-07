'use client';

import {
  createContext,
  type FC,
  type ReactNode,
  useEffect,
  useState,
} from 'react';

export type Theme = 'light' | 'dark';

interface ThemeProviderProps {
  children: ReactNode;
}

export interface ThemeContextValue {
  theme: Theme;
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const THEME_STORAGE_KEY = 'theme';

const defaultThemeContextValue: ThemeContextValue = {
  theme: 'dark',
  mounted: false,
  setTheme: () => {},
  toggleTheme: () => {},
};

export const ThemeContext = createContext<ThemeContextValue>(defaultThemeContextValue);

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors so the UI theme never crashes rendering.
    }
  }, [mounted, theme]);

  const value: ThemeContextValue = {
    theme,
    mounted,
    setTheme,
    toggleTheme: () => setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark')),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
