'use client';

import type { Node, Edge, GraphStats } from '@/types/graph';
import { calculateGraphStats } from '@/lib/graph-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Component, Shapes, Binary, CheckCircle2, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useLanguage } from '@/hooks/use-language';

interface GraphStatsPanelProps {
  nodes: Node[];
  edges: Edge[];
}

export function GraphStatsPanel({ nodes, edges }: GraphStatsPanelProps) {
  const { t } = useLanguage();
  const stats: GraphStats = useMemo(() => calculateGraphStats(nodes, edges), [nodes, edges]);

  const statItems = [
    { label: t('graphStats.nodesCount'), value: stats.nodesCount, icon: Shapes },
    { label: t('graphStats.edgesCount'), value: stats.edgesCount, icon: Binary },
    { label: t('graphStats.density'), value: stats.density, icon: BarChart3 },
    { label: t('graphStats.components'), value: stats.connectedComponents, icon: Component },
    {
      label: t('graphStats.complete'),
      value: stats.isComplete ? t('common.yes') : t('common.no'),
      icon: stats.isComplete ? CheckCircle2 : XCircle,
      color: stats.isComplete ? 'text-green-500' : 'text-red-500',
    },
  ];

  return (
    <Card className="flex h-full flex-col shadow-lg">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="flex items-center text-lg">
          <BarChart3 className="mr-2 h-5 w-5 text-primary" />
          {t('graphStats.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-4 pb-4">
        {nodes.length === 0 ? (
          <p className="flex flex-1 items-center justify-center py-4 text-center text-sm text-muted-foreground">
            {t('graphStats.empty')}
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {statItems.map(item => (
              <li key={item.label} className="flex items-center justify-between rounded-md bg-muted/30 p-2">
                <span className="flex items-center">
                  <item.icon className={`mr-2 h-4 w-4 ${item.color || 'text-muted-foreground'}`} />
                  {item.label}:
                </span>
                <span className={`font-semibold ${item.color || 'text-foreground'}`}>{item.value}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
