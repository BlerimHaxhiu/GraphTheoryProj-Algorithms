'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useLanguage } from '@/hooks/use-language';

export function AppHeader() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <Link href="/" className="flex items-center gap-2" aria-label={t('header.homeLabel')}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7 text-accent"
          aria-hidden="true"
        >
          <circle cx="5" cy="5" r="2" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M5 7v10" />
          <path d="M19 7v10" />
          <path d="M7 5h10" />
          <path d="m15.5 15.5 2 2" />
          <path d="m8.5 8.5 2 2" />
          <path d="M8.5 15.5l2-2" />
          <path d="m15.5 8.5-2 2" />
        </svg>
        <span className="text-base font-semibold text-foreground sm:text-lg md:text-xl">
          {t('header.title')}
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
