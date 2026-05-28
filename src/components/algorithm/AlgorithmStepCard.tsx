'use client';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import type { AlgorithmExampleStep } from '@/lib/algorithm-explanations';
import { StaticExampleGraph } from './StaticExampleGraph';
import { AlgorithmStepState } from './AlgorithmStepState';

interface AlgorithmStepCardProps {
  step: AlgorithmExampleStep;
  className?: string;
}

export function AlgorithmStepCard({ step, className }: AlgorithmStepCardProps) {
  const { t } = useLanguage();
  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-gradient-to-br from-card to-muted/40 p-3 shadow-sm transition-colors hover:from-card hover:to-card',
        className
      )}
    >
      <header className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
          {step.stepNumber}
        </span>
        <h5 className="text-sm font-bold text-foreground">{step.title}</h5>
      </header>
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
        <StepRichText text={step.description} />
      </p>
      <StaticExampleGraph
        graph={step.graphState}
        className="mb-3"
        ariaLabel={`${t('algorithmExplanation.stepLabel')} ${step.stepNumber} — ${step.title}`}
      />
      {step.algorithmState && (
        <AlgorithmStepState state={step.algorithmState} className="mb-3" />
      )}
      {step.changeNote && (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-foreground">
          <span className="font-bold text-emerald-700 dark:text-emerald-300">
            {t('algorithmExplanation.stepChange')}:
          </span>{' '}
          <StepRichText text={step.changeNote} />
        </p>
      )}
    </article>
  );
}

function StepRichText({ text }: { text: string }) {
  const parts = text.split(
    /(\*\*[^*\s][^*]*?[^*\s]?\*\*|\*[^*\s][^*]*?[^*\s]?\*|`[^`]+`)/g
  );
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
          return (
            <strong key={index} className="font-bold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
          return (
            <em key={index} className="italic text-primary/90">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          return (
            <code
              key={index}
              className="rounded bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
