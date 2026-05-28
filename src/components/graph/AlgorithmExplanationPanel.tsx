'use client';

import type { ReactNode } from 'react';
import type { AlgorithmType } from '@/types/graph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpenText, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { algorithmExplanations } from '@/lib/translations';
import {
  getAlgorithmExplanation,
  getEmptyExplanationFallback,
  type AlgorithmExplanation,
} from '@/lib/algorithm-explanations';
import { getAlgorithmExampleSteps } from '@/lib/algorithm-example-steps';
import { AlgorithmStepCard } from '@/components/algorithm/AlgorithmStepCard';
import { cn } from '@/lib/utils';

interface AlgorithmExplanationPanelProps {
  algorithm: AlgorithmType | null;
  isMaximized?: boolean;
}

export function AlgorithmExplanationPanel({
  algorithm,
  isMaximized = false,
}: AlgorithmExplanationPanelProps) {
  const { t } = useLanguage();

  return (
    <Card className="flex h-full flex-col shadow-lg">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="flex items-center text-lg">
          <BookOpenText className="mr-2 h-5 w-5 text-primary" />
          {t('algorithmExplanation.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-0 py-0">
        {algorithm ? (
          isMaximized ? (
            <DetailedExplanation algorithm={algorithm} />
          ) : (
            <CompactExplanation algorithm={algorithm} />
          )
        ) : (
          <EmptyState isMaximized={isMaximized} />
        )}
      </CardContent>
    </Card>
  );
}

function CompactExplanation({ algorithm }: { algorithm: AlgorithmType }) {
  const { language, t } = useLanguage();
  const explanation = getAlgorithmExplanation(language, algorithm);
  const legacy = algorithmExplanations[language][algorithm];

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-3 p-4 text-sm">
        <h3 className="text-md font-semibold text-primary">{explanation.name}</h3>
        <p className="leading-relaxed text-muted-foreground">{explanation.shortSummary}</p>
        <ul className="list-inside list-disc space-y-1.5 text-muted-foreground">
          {explanation.bulletPoints.map(point => (
            <li key={point} className="leading-snug">
              {point}
            </li>
          ))}
        </ul>
        {legacy?.complexity && (
          <p className="pt-1 text-xs text-muted-foreground/80">
            <span className="font-semibold text-muted-foreground">
              {t('algorithmExplanation.complexity')}:
            </span>{' '}
            {legacy.complexity}
          </p>
        )}
        <p className="rounded-md bg-muted/40 px-3 py-2 text-[11px] italic text-muted-foreground">
          {t('algorithmExplanation.hintExpand')}
        </p>
      </div>
    </ScrollArea>
  );
}

function DetailedExplanation({ algorithm }: { algorithm: AlgorithmType }) {
  const { language, t } = useLanguage();
  const explanation = getAlgorithmExplanation(language, algorithm);
  const exampleSteps = getAlgorithmExampleSteps(language, algorithm);

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 text-sm">
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
          <h3 className="text-lg font-bold text-primary">{explanation.name}</h3>
          <p className="mt-1 leading-relaxed text-foreground/90">
            <RichText text={explanation.shortSummary} />
          </p>
        </div>

        <Section title={t('algorithmExplanation.sectionTheory')} accent="primary">
          <p className="leading-relaxed text-muted-foreground">
            <RichText text={explanation.theory} />
          </p>
        </Section>

        <Section title={t('algorithmExplanation.sectionOverview')} accent="sky">
          <p className="leading-relaxed text-muted-foreground">
            <RichText text={explanation.overview} />
          </p>
        </Section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard title={t('algorithmExplanation.sectionTimeComplexity')} accent="emerald">
            <code className="text-sm font-bold text-foreground">
              {explanation.timeComplexity}
            </code>
          </InfoCard>
          <InfoCard title={t('algorithmExplanation.sectionSpaceComplexity')} accent="violet">
            <code className="text-sm font-bold text-foreground">
              {explanation.spaceComplexity}
            </code>
          </InfoCard>
        </div>

        <Section title={t('algorithmExplanation.sectionWhenToUse')} accent="emerald">
          <BulletList items={explanation.whenToUse} />
        </Section>

        <Section title={t('algorithmExplanation.sectionDataStructures')} accent="sky">
          <BulletList items={explanation.dataStructures} />
        </Section>

        <Section title={t('algorithmExplanation.sectionSteps')} accent="amber">
          <ol className="list-inside list-decimal space-y-1.5 text-muted-foreground marker:font-bold marker:text-amber-600 dark:marker:text-amber-400">
            {explanation.detailedSteps.map(step => (
              <li key={step} className="leading-snug">
                <RichText text={step} />
              </li>
            ))}
          </ol>
        </Section>

        {exampleSteps && exampleSteps.length > 0 ? (
          <Section title={t('algorithmExplanation.sectionStepByStep')} accent="primary">
            <p className="-mt-1 mb-3 text-[11px] italic text-muted-foreground">
              {t('algorithmExplanation.exampleNote')}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {exampleSteps.map(stepData => (
                <AlgorithmStepCard key={stepData.stepNumber} step={stepData} />
              ))}
            </div>
          </Section>
        ) : (
          <Section title={t('algorithmExplanation.sectionWalkthrough')} accent="primary">
            <p className="-mt-1 mb-2 text-[11px] italic text-muted-foreground">
              {t('algorithmExplanation.exampleNote')}
            </p>
            <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground marker:font-bold marker:text-primary">
              {explanation.exampleWalkthrough.map(step => (
                <li key={step} className="leading-snug">
                  <RichText text={step} />
                </li>
              ))}
            </ol>
          </Section>
        )}

        <Section title={t('algorithmExplanation.sectionMistakes')} accent="rose">
          <BulletList items={explanation.commonMistakes} accent="rose" />
        </Section>

        <Section title={t('algorithmExplanation.sectionLimitations')} accent="amber">
          <BulletList items={explanation.limitations} accent="amber" />
        </Section>
      </div>
    </ScrollArea>
  );
}

function EmptyState({ isMaximized }: { isMaximized: boolean }) {
  const { language, t } = useLanguage();
  const fallback = getEmptyExplanationFallback(language);

  if (!isMaximized) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <HelpCircle className="mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm">{t('algorithmExplanation.empty')}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-4 p-6 text-sm">
        <div className="flex items-center gap-2 text-primary">
          <HelpCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{fallback.title}</h3>
        </div>
        <p className="text-muted-foreground">{fallback.message}</p>
        <BulletList items={fallback.generalPoints} />
      </div>
    </ScrollArea>
  );
}

type Accent = 'primary' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet';

const ACCENT_HEADER: Record<Accent, string> = {
  primary: 'text-primary border-primary/40',
  sky: 'text-sky-600 dark:text-sky-300 border-sky-500/40',
  emerald: 'text-emerald-600 dark:text-emerald-300 border-emerald-500/40',
  amber: 'text-amber-600 dark:text-amber-300 border-amber-500/40',
  rose: 'text-rose-600 dark:text-rose-300 border-rose-500/40',
  violet: 'text-violet-600 dark:text-violet-300 border-violet-500/40',
};

const ACCENT_INFOCARD: Record<Accent, string> = {
  primary: 'border-primary/40 bg-primary/5',
  sky: 'border-sky-500/40 bg-sky-500/5',
  emerald: 'border-emerald-500/40 bg-emerald-500/5',
  amber: 'border-amber-500/40 bg-amber-500/5',
  rose: 'border-rose-500/40 bg-rose-500/5',
  violet: 'border-violet-500/40 bg-violet-500/5',
};

const ACCENT_BULLET_MARKER: Record<Accent, string> = {
  primary: 'marker:text-primary',
  sky: 'marker:text-sky-500',
  emerald: 'marker:text-emerald-500',
  amber: 'marker:text-amber-500',
  rose: 'marker:text-rose-500',
  violet: 'marker:text-violet-500',
};

function Section({
  title,
  children,
  accent = 'primary',
}: {
  title: string;
  children: ReactNode;
  accent?: Accent;
}) {
  return (
    <section className="space-y-2">
      <h4
        className={cn(
          'inline-block border-b-2 pb-0.5 text-sm font-bold uppercase tracking-wide',
          ACCENT_HEADER[accent]
        )}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}

function InfoCard({
  title,
  children,
  accent = 'primary',
}: {
  title: string;
  children: ReactNode;
  accent?: Accent;
}) {
  return (
    <div className={cn('rounded-lg border p-3', ACCENT_INFOCARD[accent])}>
      <p
        className={cn(
          'text-[11px] font-bold uppercase tracking-wide',
          ACCENT_HEADER[accent].split(' ').filter(c => c.startsWith('text-')).join(' ')
        )}
      >
        {title}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function BulletList({ items, accent = 'primary' }: { items: string[]; accent?: Accent }) {
  return (
    <ul
      className={cn(
        'list-inside list-disc space-y-1.5 text-muted-foreground marker:font-bold',
        ACCENT_BULLET_MARKER[accent]
      )}
    >
      {items.map(item => (
        <li key={item} className="leading-snug">
          <RichText text={item} />
        </li>
      ))}
    </ul>
  );
}

function RichText({ text }: { text: string }) {
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

// Re-export the public type to keep IDE auto-imports tidy.
export type { AlgorithmExplanation };
