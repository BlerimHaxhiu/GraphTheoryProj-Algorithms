'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

interface FullscreenSectionProps {
  children: ReactNode;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
  buttonClassName?: string;
}

export function FullscreenSection({
  children,
  isActive,
  onToggle,
  className,
  buttonClassName,
}: FullscreenSectionProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggle();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isActive, onToggle]);

  const ariaLabel = isActive ? t('fullscreen.restore') : t('fullscreen.open');

  return (
    <>
      {isActive && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}
      <div
        className={cn(
          'relative',
          className,
          isActive &&
            'fixed inset-3 z-50 h-[calc(100vh-1.5rem)] overflow-auto rounded-2xl bg-background p-1 shadow-2xl sm:inset-4 sm:h-[calc(100vh-2rem)]'
        )}
        onClick={isActive ? event => event.stopPropagation() : undefined}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggle}
          aria-label={ariaLabel}
          title={ariaLabel}
          className={cn(
            'absolute right-3 top-3 z-20 h-9 w-9 bg-background/95 backdrop-blur-sm',
            buttonClassName
          )}
        >
          {isActive ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        {children}
      </div>
    </>
  );
}
