'use client';

import type { ExecutionLogEntry } from '@/types/graph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';
import { format } from 'date-fns';
import { sq, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/use-language';

interface ExecutionHistoryPanelProps {
  history: ExecutionLogEntry[];
}

export function ExecutionHistoryPanel({ history }: ExecutionHistoryPanelProps) {
  const { language, t } = useLanguage();
  const locale = language === 'sq' ? sq : enUS;

  return (
    <Card className="flex h-full min-h-[300px] flex-col shadow-lg">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="flex items-center text-lg">
          <History className="mr-2 h-5 w-5 text-primary" />
          {t('executionHistory.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden px-4 pb-4">
        {history.length === 0 ? (
          <p className="flex h-full items-center justify-center py-4 text-center text-sm text-muted-foreground">
            {t('executionHistory.empty')}
          </p>
        ) : (
          <ScrollArea className="h-full">
            <ul className="space-y-2 text-xs">
              {history.slice().reverse().map(entry => (
                <li key={entry.id} className="rounded-md bg-muted/30 p-2">
                  <div className="font-semibold text-primary">{entry.algorithm.toUpperCase()}</div>
                  <div className="text-muted-foreground">
                    {format(entry.startTime, 'd MMM yyyy, HH:mm:ss', { locale })} - {format(entry.endTime, 'HH:mm:ss', { locale })}
                  </div>
                  <div>
                    {entry.startNodeLabel && `${t('executionHistory.start')}: ${entry.startNodeLabel}`}
                    {entry.endNodeLabel && `, ${t('executionHistory.end')}: ${entry.endNodeLabel}`}
                  </div>
                  <div className="italic">{entry.resultSummary}</div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
