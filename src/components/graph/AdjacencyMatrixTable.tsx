'use client';

import type { AdjacencyMatrix, Node, AlgorithmStep } from '@/types/graph';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3X3 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface AdjacencyMatrixTableProps {
  matrix: AdjacencyMatrix;
  nodes: Node[];
  currentAlgorithmStep: AlgorithmStep | null;
}

export function AdjacencyMatrixTable({ matrix, nodes, currentAlgorithmStep }: AdjacencyMatrixTableProps) {
  const { t } = useLanguage();

  const getNodeIndex = (nodeId: string) => nodes.findIndex(n => n.id === nodeId);
  const workingMatrix = currentAlgorithmStep?.matrixSnapshot ?? matrix;
  const isWorkingDistanceMatrix = Boolean(currentAlgorithmStep?.matrixSnapshot);

  let highlightedCells: { row: number; col: number }[] = [];

  if (currentAlgorithmStep) {
    if (
      currentAlgorithmStep.type === 'traverse-edge' &&
      currentAlgorithmStep.edgeId &&
      currentAlgorithmStep.highlightSourceNodeId &&
      currentAlgorithmStep.nodeId
    ) {
      const sourceIdx = getNodeIndex(currentAlgorithmStep.highlightSourceNodeId);
      const targetIdx = getNodeIndex(currentAlgorithmStep.nodeId);
      if (sourceIdx !== -1 && targetIdx !== -1) {
        highlightedCells.push({ row: sourceIdx, col: targetIdx });
      }
    } else if (currentAlgorithmStep.type === 'update-matrix-cell' && currentAlgorithmStep.matrixCell) {
      highlightedCells.push({ row: currentAlgorithmStep.matrixCell.row, col: currentAlgorithmStep.matrixCell.col });
    } else if (currentAlgorithmStep.type === 'highlight-path' && currentAlgorithmStep.path) {
      for (let i = 0; i < currentAlgorithmStep.path.length - 1; i++) {
        const sourceIdx = getNodeIndex(currentAlgorithmStep.path[i]);
        const targetIdx = getNodeIndex(currentAlgorithmStep.path[i + 1]);
        if (sourceIdx !== -1 && targetIdx !== -1) {
          highlightedCells.push({ row: sourceIdx, col: targetIdx });
        }
      }
    }
  }

  const matrixTitle = isWorkingDistanceMatrix ? t('matrix.workingDistanceMatrix') : t('matrix.title');
  const contextParts = currentAlgorithmStep?.matrixContext
    ? [
        currentAlgorithmStep.matrixContext.k !== undefined ? `k=${currentAlgorithmStep.matrixContext.k}` : null,
        currentAlgorithmStep.matrixContext.i !== undefined ? `i=${currentAlgorithmStep.matrixContext.i}` : null,
        currentAlgorithmStep.matrixContext.j !== undefined ? `j=${currentAlgorithmStep.matrixContext.j}` : null,
      ].filter(Boolean)
    : [];
  const updatedCellLabel = currentAlgorithmStep?.matrixCell
    ? `${t('matrix.updatedCell')}: ${nodes[currentAlgorithmStep.matrixCell.row]?.label ?? currentAlgorithmStep.matrixCell.row}, ${nodes[currentAlgorithmStep.matrixCell.col]?.label ?? currentAlgorithmStep.matrixCell.col} = ${
        currentAlgorithmStep.matrixCell.value === Infinity || currentAlgorithmStep.matrixCell.value === undefined
          ? '∞'
          : currentAlgorithmStep.matrixCell.value
      }`
    : '';

  const formatMatrixValue = (value: number | string | undefined) => {
    if (value === undefined) return '∞';
    if (value === Infinity || value === 'inf') return '∞';
    if (value === -Infinity || value === '-inf') return '-∞';
    return value;
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-md">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-md flex items-center gap-2 sm:text-lg">
          <Grid3X3 className="h-5 w-5 text-primary" />
          {matrixTitle}
        </CardTitle>
        {(contextParts.length > 0 || updatedCellLabel) && (
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {contextParts.length > 0 && <span>{`${t('matrix.context')}: ${contextParts.join(', ')}`}</span>}
            {updatedCellLabel && <span>{updatedCellLabel}</span>}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full w-full">
          {nodes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
              <Grid3X3 className="mb-3 h-12 w-12 text-muted-foreground/30" data-ai-hint="matrix icon" />
              <span className="text-sm">{t('matrix.emptyTitle')}</span>
              <span className="text-xs">{t('matrix.emptySubtitle')}</span>
            </div>
          ) : (
            <Table className="min-w-max border-collapse">
              <TableHeader className="sticky top-0 z-10 bg-card/95">
                <TableRow>
                  <TableHead
                    className={cn(
                      'sticky left-0 z-20 bg-card/95 text-center',
                      'w-auto min-w-[28px] p-1 text-[10px]',
                      'sm:min-w-[32px] sm:p-1.5 sm:text-xs',
                      'md:min-w-[36px] md:p-2 md:text-sm'
                    )}
                  />
                  {nodes.map(node => (
                    <TableHead
                      key={node.id}
                      className={cn(
                        'text-center font-semibold whitespace-nowrap',
                        'w-auto min-w-[28px] p-1 text-[10px]',
                        'sm:min-w-[32px] sm:p-1.5 sm:text-xs',
                        'md:min-w-[36px] md:p-2 md:text-sm'
                      )}
                    >
                      {node.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {nodes.map((rowNode, rowIndex) => (
                  <TableRow key={rowNode.id}>
                    <TableHead
                      className={cn(
                        'sticky left-0 z-10 bg-card/95 text-center font-semibold whitespace-nowrap',
                        'w-auto min-w-[28px] p-1 text-[10px]',
                        'sm:min-w-[32px] sm:p-1.5 sm:text-xs',
                        'md:min-w-[36px] md:p-2 md:text-sm'
                      )}
                    >
                      {rowNode.label}
                    </TableHead>
                    {nodes.map((colNode, colIndex) => {
                      const isHighlighted = highlightedCells.some(cell => cell.row === rowIndex && cell.col === colIndex);
                      const cellValue = workingMatrix[rowIndex]?.[colIndex];

                      return (
                        <TableCell
                          key={colNode.id}
                          className={cn(
                            'border text-center',
                            'w-auto min-w-[28px] p-1 text-[10px]',
                            'sm:min-w-[32px] sm:p-1.5 sm:text-xs',
                            'md:min-w-[36px] md:p-2 md:text-sm',
                            isHighlighted ? 'bg-accent/40 font-bold text-accent-foreground' : '',
                            cellValue === Infinity || cellValue === undefined || cellValue === 'inf' || cellValue === '-inf'
                              ? 'text-muted-foreground'
                              : ''
                          )}
                        >
                          {formatMatrixValue(cellValue)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
