'use client';

import type { ExecutionLogEntry, Node, Edge, AlgorithmType } from '@/types/graph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitCompareArrows } from 'lucide-react';
import { format } from 'date-fns';
import { sq, enUS } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/hooks/use-language';

interface CompareAlgorithmsPanelProps {
  history: ExecutionLogEntry[];
  nodes: Node[];
  edges: Edge[];
}

const ALGORITHM_COMPLEXITIES: Record<AlgorithmType, string> = {
  'bfs': 'O(V + E)',
  'dfs': 'O(V + E)',
  'dijkstra': 'O(E log V)',
  'a-star': 'O(E log V)',
  'bellman-ford': 'O(V * E)',
  'floyd-warshall': 'O(V^3)',
  'kruskal': 'O(E log E)',
  'prim': 'O(E log V)',
};

export function CompareAlgorithmsPanel({ history }: CompareAlgorithmsPanelProps) {
  const { language, t } = useLanguage();
  const locale = language === 'sq' ? sq : enUS;

  return (
    <Card className="flex h-[400px] flex-col shadow-lg">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="flex items-center text-lg">
          <GitCompareArrows className="mr-2 h-5 w-5 text-primary" />
          {t('algorithmComparison.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden px-0 py-2">
        {history.length === 0 ? (
          <p className="flex h-full items-center justify-center px-4 py-4 text-center text-sm text-muted-foreground">
            {t('algorithmComparison.empty')}
          </p>
        ) : (
          <ScrollArea className="h-full w-full">
            <Table className="text-xs">
              <TableHeader className="sticky top-0 z-10 bg-card/95">
                <TableRow>
                  <TableHead className="px-2 py-1.5 sm:px-3 sm:py-2">{t('algorithmComparison.algorithm')}</TableHead>
                  <TableHead className="px-2 py-1.5 text-center sm:px-3 sm:py-2">{t('algorithmComparison.time')}</TableHead>
                  <TableHead className="px-2 py-1.5 sm:px-3 sm:py-2">{t('algorithmComparison.complexity')}</TableHead>
                  <TableHead className="px-2 py-1.5 text-center sm:px-3 sm:py-2">V | E</TableHead>
                  <TableHead className="px-2 py-1.5 sm:px-3 sm:py-2">{t('algorithmComparison.summary')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.slice().reverse().map(entry => (
                  <TableRow key={entry.id} className="hover:bg-muted/20">
                    <TableCell className="max-w-[100px] truncate px-2 py-1.5 font-medium text-primary sm:max-w-[120px] sm:px-3 sm:py-2">
                      {entry.algorithm.toUpperCase()}
                      <div className="text-[10px] text-muted-foreground sm:text-[11px]">
                        {format(entry.startTime, 'HH:mm:ss', { locale })}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-center tabular-nums sm:px-3 sm:py-2">
                      {entry.executionTimeMs.toFixed(2)}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-muted-foreground sm:px-3 sm:py-2">
                      {ALGORITHM_COMPLEXITIES[entry.algorithm] || 'N/A'}
                    </TableCell>
                    <TableCell className="px-2 py-1.5 text-center tabular-nums text-muted-foreground sm:px-3 sm:py-2">
                      {entry.nodesCountSnapshot} | {entry.edgesCountSnapshot}
                    </TableCell>
                    <TableCell className="whitespace-normal px-2 py-1.5 italic text-muted-foreground sm:px-3 sm:py-2">
                      {entry.resultSummary}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
