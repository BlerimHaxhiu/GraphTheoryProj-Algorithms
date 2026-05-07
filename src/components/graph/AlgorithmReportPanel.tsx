'use client';

import type { AlgorithmStep, Node, Edge } from '@/types/graph';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { MessageSquare, Shuffle, LocateFixed, Waypoints, RefreshCcw, AlertTriangle, ListChecks, PlayCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface AlgorithmReportPanelProps {
  reportLog: AlgorithmStep[];
  nodes: Node[];
  edges: Edge[];
}

export function AlgorithmReportPanel({ reportLog, nodes, edges }: AlgorithmReportPanelProps) {
  const { t } = useLanguage();

  const getNodeLabel = (nodeId: string | undefined): string => {
    if (!nodeId) return t('algorithmReport.unknownNode');
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.label : (nodeId.length > 6 ? `${nodeId.substring(0, 6)}...` : nodeId);
  };

  const getMessageIconAndStyle = (step: AlgorithmStep) => {
    let IconComponent;
    let textColorClass = 'text-foreground';
    let bgColorClass = 'bg-card hover:bg-muted/50';

    switch (step.type) {
      case 'visit-node':
        IconComponent = LocateFixed;
        textColorClass = 'text-blue-600 dark:text-blue-400';
        bgColorClass = 'bg-blue-500/10 hover:bg-blue-500/20';
        break;
      case 'traverse-edge':
        IconComponent = Shuffle;
        textColorClass = 'text-green-600 dark:text-green-400';
        bgColorClass = 'bg-green-500/10 hover:bg-green-500/20';
        break;
      case 'highlight-path':
        IconComponent = Waypoints;
        textColorClass = 'text-accent-foreground';
        bgColorClass = 'bg-accent/20 hover:bg-accent/30';
        break;
      case 'reset':
        IconComponent = RefreshCcw;
        textColorClass = 'text-muted-foreground';
        bgColorClass = 'bg-muted/20 hover:bg-muted/30';
        break;
      case 'message':
        IconComponent = MessageSquare;
        textColorClass = 'text-foreground/90';
        bgColorClass = 'bg-muted/30 hover:bg-muted/40';
        if (step.message?.toLowerCase().includes('gabim') || step.message?.toLowerCase().includes('error')) {
          IconComponent = AlertTriangle;
          textColorClass = 'text-destructive';
          bgColorClass = 'bg-destructive/10 hover:bg-destructive/20';
        }
        break;
      default:
        IconComponent = MessageSquare;
        textColorClass = 'text-muted-foreground';
        bgColorClass = 'bg-muted/20 hover:bg-muted/30';
    }
    return { IconComponent, textColorClass, bgColorClass };
  };

  const formatStepMessage = (step: AlgorithmStep): string => {
    switch (step.type) {
      case 'visit-node':
        return `${t('algorithmReport.visitNode')}: ${getNodeLabel(step.nodeId)}`;
      case 'traverse-edge': {
        const edge = edges.find(e => e.id === step.edgeId);
        const sourceNodeLabel = edge ? getNodeLabel(edge.source) : (step.highlightSourceNodeId ? getNodeLabel(step.highlightSourceNodeId) : t('algorithmReport.unknownNode'));
        const targetNodeLabel = getNodeLabel(step.nodeId);
        return `${t('algorithmReport.traverseEdge')}: ${sourceNodeLabel} -> ${targetNodeLabel}`;
      }
      case 'highlight-path':
        return `${t('algorithmReport.finalPath')}: ${step.path?.map(id => getNodeLabel(id)).join(' -> ') || '-'}`;
      default:
        if (step.messageKey) {
          return t(step.messageKey, step.messageValues);
        }
        return step.message || t('algorithmReport.undefinedStep');
    }
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-md">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-md flex items-center gap-2 sm:text-lg">
          <ListChecks className="h-5 w-5 text-primary" />
          {t('algorithmReport.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full w-full p-2 sm:p-3">
          {reportLog.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
              <PlayCircle className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <span className="text-sm">{t('algorithmReport.emptyTitle')}</span>
              <span className="text-xs">
                {nodes.length === 0 ? t('algorithmReport.emptyHintWithoutGraph') : t('algorithmReport.emptyHintWithGraph')}
              </span>
            </div>
          ) : (
            <ul className="space-y-1.5 sm:space-y-2">
              {reportLog.map(step => {
                const { IconComponent, textColorClass, bgColorClass } = getMessageIconAndStyle(step);
                const messageContent = formatStepMessage(step);

                return (
                  <li
                    key={step.id}
                    className={cn(
                      'flex items-start rounded-md p-2 text-xs transition-colors sm:text-sm',
                      bgColorClass
                    )}
                  >
                    <IconComponent className={cn('mr-2 mt-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4', textColorClass)} aria-hidden="true" />
                    <span className={cn('flex-grow', textColorClass)}>{messageContent}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
