'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';

interface PlaybackControlsProps {
  hasRun: boolean;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  currentStepIndex: number;
  totalSteps: number;
  onPause: () => void;
  onResume: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onResetRun: () => void;
}

export function PlaybackControls({
  hasRun,
  isRunning,
  isPaused,
  isFinished,
  currentStepIndex,
  totalSteps,
  onPause,
  onResume,
  onNextStep,
  onPreviousStep,
  onResetRun,
}: PlaybackControlsProps) {
  const { t } = useLanguage();
  const canPause = hasRun && isRunning;
  const canResume = hasRun && isPaused && !isFinished;
  const canStep = hasRun && !isRunning && totalSteps > 0 && !isFinished;
  const canStepBack = hasRun && !isRunning && totalSteps > 0 && currentStepIndex > 0;
  const canReset = hasRun;

  return (
    <Card className="border-dashed bg-muted/20 px-3 py-2 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[92px] text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{t('playback.title')}</span>
          <span className="ml-2 tabular-nums">
            {totalSteps > 0 && currentStepIndex >= 0 ? `${currentStepIndex + 1}/${totalSteps}` : '0/0'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isRunning ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={onPause}
              disabled={!canPause}
            >
              <Pause className="h-3.5 w-3.5" />
              {t('playback.pause')}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={onResume}
              disabled={!canResume}
            >
              <Play className="h-3.5 w-3.5" />
              {t('playback.resume')}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 px-2 text-xs"
            onClick={onPreviousStep}
            disabled={!canStepBack}
          >
            <SkipBack className="h-3.5 w-3.5" />
            {t('playback.previousStep')}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 px-2 text-xs"
            onClick={onNextStep}
            disabled={!canStep}
          >
            <SkipForward className="h-3.5 w-3.5" />
            {t('playback.nextStep')}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn('h-8 gap-1.5 px-2 text-xs', canReset && 'text-muted-foreground')}
            onClick={onResetRun}
            disabled={!canReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('playback.restartRun')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
