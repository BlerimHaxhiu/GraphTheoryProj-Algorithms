import type { AlgorithmStep } from '@/types/graph';

export type PlaybackStatus = 'idle' | 'running' | 'paused' | 'finished';

export function clampStepIndex(index: number, totalSteps: number): number {
  if (totalSteps <= 0) return -1;
  return Math.max(0, Math.min(index, totalSteps - 1));
}

export function getNextStepIndex(currentIndex: number, totalSteps: number): number {
  if (totalSteps <= 0) return -1;
  return clampStepIndex(currentIndex + 1, totalSteps);
}

export function getPreviousStepIndex(currentIndex: number, totalSteps: number): number {
  if (totalSteps <= 0) return -1;
  return clampStepIndex(currentIndex - 1, totalSteps);
}

export function buildPlaybackReportLog(
  introStep: AlgorithmStep | null,
  steps: AlgorithmStep[],
  currentIndex: number,
  completionStep?: AlgorithmStep | null
): AlgorithmStep[] {
  const visibleSteps = currentIndex >= 0 ? steps.slice(0, currentIndex + 1) : [];
  return [
    ...(introStep ? [introStep] : []),
    ...visibleSteps,
    ...(completionStep ? [completionStep] : []),
  ];
}

export function getPlaybackProgressLabel(currentIndex: number, totalSteps: number): string {
  if (totalSteps <= 0 || currentIndex < 0) return '0 / 0';
  return `${currentIndex + 1} / ${totalSteps}`;
}
