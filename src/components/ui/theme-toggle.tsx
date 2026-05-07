'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/hooks/use-language';

export function ThemeToggle() {
  const { mounted, theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const ariaLabel = theme === 'dark' ? t('theme.light') : t('theme.dark');

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      disabled={!mounted}
      aria-label={ariaLabel}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
