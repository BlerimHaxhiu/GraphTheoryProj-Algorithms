'use client';

import type { AlgorithmType } from '@/types/graph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpenText, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { algorithmExplanations } from '@/lib/translations';

interface AlgorithmExplanationPanelProps {
  algorithm: AlgorithmType | null;
}

export function AlgorithmExplanationPanel({ algorithm }: AlgorithmExplanationPanelProps) {
  const { language, t } = useLanguage();
  const content = algorithm
    ? algorithmExplanations[language][algorithm]
    : null;

  return (
    <Card className="flex h-full flex-col shadow-lg">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="flex items-center text-lg">
          <BookOpenText className="mr-2 h-5 w-5 text-primary" />
          {t('algorithmExplanation.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden px-0 py-0">
        <ScrollArea className="h-full w-full p-4">
          {content ? (
            <div className="space-y-3 text-sm">
              <h3 className="text-md font-semibold text-primary">{content.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{content.description}</p>
              {content.complexity && (
                <p className="pt-2 text-xs text-muted-foreground/80">
                  <span className="font-semibold text-muted-foreground">{t('algorithmExplanation.complexity')}:</span>{' '}
                  {content.complexity}
                </p>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
              <HelpCircle className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm">{t('algorithmExplanation.empty')}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
