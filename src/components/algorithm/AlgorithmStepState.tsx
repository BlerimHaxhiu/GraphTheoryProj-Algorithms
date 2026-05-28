'use client';

import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import type { AlgorithmStepAlgoState } from '@/lib/algorithm-explanations';

interface AlgorithmStepStateProps {
  state: AlgorithmStepAlgoState;
  className?: string;
}

export function AlgorithmStepState({ state, className }: AlgorithmStepStateProps) {
  const { t } = useLanguage();

  const blocks: Array<{ label: string; node: React.ReactNode }> = [];

  if (state.queue !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.stateQueue'),
      node: <Chips items={state.queue} variant="queue" />,
    });
  }
  if (state.stack !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.stateStack'),
      node: <Chips items={state.stack} variant="stack" />,
    });
  }
  if (state.priorityQueue !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.statePriorityQueue'),
      node: <Chips items={state.priorityQueue} variant="priority" />,
    });
  }
  if (state.visited !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.stateVisited'),
      node: <Chips items={state.visited} variant="visited" />,
    });
  }
  if (state.distances !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.stateDistances'),
      node: <KeyValueRow data={state.distances} />,
    });
  }
  if (state.previous !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.statePrevious'),
      node: (
        <KeyValueRow
          data={Object.fromEntries(
            Object.entries(state.previous).map(([k, v]) => [k, v ?? '—'])
          )}
        />
      ),
    });
  }
  if (state.mstEdges !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.stateMst'),
      node: <Chips items={state.mstEdges} variant="mst" />,
    });
  }
  if (state.selectedEdge !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.stateSelected'),
      node: <Chips items={[state.selectedEdge]} variant="selected" />,
    });
  }
  if (state.rejectedEdge !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.stateRejected'),
      node: <Chips items={[state.rejectedEdge]} variant="rejected" />,
    });
  }
  if (state.matrix !== undefined) {
    blocks.push({
      label: t('algorithmExplanation.stateMatrix'),
      node: <MatrixTable matrix={state.matrix} />,
    });
  }
  if (state.notes !== undefined && state.notes.length > 0) {
    blocks.push({
      label: t('algorithmExplanation.stateNotes'),
      node: (
        <ul className="list-inside list-disc text-xs text-muted-foreground">
          {state.notes.map(note => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ),
    });
  }

  if (blocks.length === 0) return null;

  return (
    <div className={cn('grid grid-cols-1 gap-2 text-xs sm:grid-cols-2', className)}>
      {blocks.map(block => (
        <div key={block.label} className="rounded-md border border-border/60 bg-muted/30 p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {block.label}
          </p>
          {block.node}
        </div>
      ))}
    </div>
  );
}

type ChipVariant =
  | 'queue'
  | 'stack'
  | 'priority'
  | 'visited'
  | 'mst'
  | 'selected'
  | 'rejected';

const CHIP_VARIANT: Record<ChipVariant, string> = {
  queue: 'border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-200',
  stack: 'border-violet-500/60 bg-violet-500/10 text-violet-700 dark:text-violet-200',
  priority: 'border-primary/60 bg-primary/10 text-primary',
  visited: 'border-border bg-muted text-muted-foreground',
  mst: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  selected: 'border-emerald-500/70 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200',
  rejected: 'border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-200',
};

function Chips({ items, variant }: { items: string[]; variant: ChipVariant }) {
  if (items.length === 0) {
    return <span className="text-[11px] italic text-muted-foreground">∅</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
            CHIP_VARIANT[variant]
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function KeyValueRow({ data }: { data: Record<string, string | number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <span className="text-[11px] italic text-muted-foreground">∅</span>;
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-1">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="flex flex-col items-center rounded-md border border-border/60 bg-background/70 px-1 py-1"
        >
          <span className="text-[10px] font-semibold uppercase text-muted-foreground">{key}</span>
          <span className="text-xs font-semibold text-foreground">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function MatrixTable({
  matrix,
}: {
  matrix: { columns: string[]; rows: Array<{ label: string; cells: string[] }> };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="border border-border/60 bg-muted/40 px-1.5 py-1 text-muted-foreground">·</th>
            {matrix.columns.map(col => (
              <th
                key={col}
                className="border border-border/60 bg-muted/40 px-1.5 py-1 font-semibold text-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map(row => (
            <Fragment key={row.label}>
              <tr>
                <th className="border border-border/60 bg-muted/40 px-1.5 py-1 font-semibold text-foreground">
                  {row.label}
                </th>
                {row.cells.map((cell, idx) => (
                  <td
                    key={`${row.label}-${idx}`}
                    className="border border-border/60 px-1.5 py-1 text-center text-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
