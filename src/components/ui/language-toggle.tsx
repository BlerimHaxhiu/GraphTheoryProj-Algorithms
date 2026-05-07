'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { language, mounted, setLanguage, t } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-md border border-input bg-background p-1 shadow-sm">
      <div className="px-2 text-muted-foreground">
        <Languages className="h-4 w-4" />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('sq')}
        disabled={!mounted}
        className={cn(
          'rounded px-2 py-1 text-xs font-semibold transition-colors',
          language === 'sq'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label={t('language.switchToSq')}
      >
        SQ
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        disabled={!mounted}
        className={cn(
          'rounded px-2 py-1 text-xs font-semibold transition-colors',
          language === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label={t('language.switchToEn')}
      >
        EN
      </button>
    </div>
  );
}
