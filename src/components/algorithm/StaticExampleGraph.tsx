'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type {
  ExampleEdgeStatus,
  ExampleGraph,
  ExampleNodeStatus,
} from '@/lib/algorithm-explanations';

interface StaticExampleGraphProps {
  graph: ExampleGraph;
  className?: string;
  ariaLabel?: string;
}

const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 230;
const NODE_RADIUS = 18;

function edgeKey(from: string, to: string): string {
  return from < to ? `${from}->${to}` : `${to}->${from}`;
}

interface NodeStyle {
  fill: string;
  stroke: string;
  textClass: string;
}

const NODE_STYLE: Record<ExampleNodeStatus, NodeStyle> = {
  default: { fill: 'fill-card', stroke: 'stroke-border', textClass: 'fill-foreground' },
  start: { fill: 'fill-primary/25', stroke: 'stroke-primary', textClass: 'fill-foreground' },
  end: { fill: 'fill-emerald-500/20', stroke: 'stroke-emerald-500', textClass: 'fill-foreground' },
  current: { fill: 'fill-amber-400/30', stroke: 'stroke-amber-500', textClass: 'fill-foreground' },
  visited: { fill: 'fill-muted', stroke: 'stroke-muted-foreground/60', textClass: 'fill-muted-foreground' },
  queued: { fill: 'fill-sky-400/20', stroke: 'stroke-sky-500', textClass: 'fill-foreground' },
  stacked: { fill: 'fill-violet-400/20', stroke: 'stroke-violet-500', textClass: 'fill-foreground' },
  relaxed: { fill: 'fill-sky-400/15', stroke: 'stroke-sky-500', textClass: 'fill-foreground' },
  final: { fill: 'fill-emerald-500/25', stroke: 'stroke-emerald-500', textClass: 'fill-foreground' },
  mst: { fill: 'fill-emerald-500/25', stroke: 'stroke-emerald-500', textClass: 'fill-foreground' },
  path: { fill: 'fill-primary/30', stroke: 'stroke-primary', textClass: 'fill-foreground' },
  ignored: { fill: 'fill-card', stroke: 'stroke-muted-foreground/40', textClass: 'fill-muted-foreground' },
};

interface EdgeStyle {
  stroke: string;
  width: number;
  dasharray?: string;
}

const EDGE_STYLE: Record<ExampleEdgeStatus, EdgeStyle> = {
  default: { stroke: 'stroke-muted-foreground/70', width: 1.8 },
  active: { stroke: 'stroke-amber-500', width: 3 },
  visited: { stroke: 'stroke-muted-foreground/50', width: 1.6 },
  relaxed: { stroke: 'stroke-sky-500', width: 2.5 },
  selected: { stroke: 'stroke-emerald-500', width: 3 },
  rejected: { stroke: 'stroke-rose-500', width: 1.8, dasharray: '4 3' },
  mst: { stroke: 'stroke-emerald-500', width: 3 },
  path: { stroke: 'stroke-primary', width: 3 },
  ignored: { stroke: 'stroke-muted-foreground/35', width: 1.5, dasharray: '3 3' },
};

export function StaticExampleGraph({ graph, className, ariaLabel }: StaticExampleGraphProps) {
  const nodeById = useMemo(
    () => new Map(graph.nodes.map(node => [node.id, node])),
    [graph.nodes]
  );

  const legacyHighlightedEdgeSet = useMemo(() => {
    const set = new Set<string>();
    const path = graph.highlightedPath ?? [];
    for (let i = 0; i < path.length - 1; i += 1) {
      set.add(edgeKey(path[i], path[i + 1]));
    }
    for (const edge of graph.highlightedEdges ?? []) {
      set.add(edgeKey(edge.from, edge.to));
    }
    return set;
  }, [graph.highlightedPath, graph.highlightedEdges]);

  const visitedRank = useMemo(() => {
    const map = new Map<string, number>();
    (graph.visitedOrder ?? []).forEach((id, index) => map.set(id, index + 1));
    return map;
  }, [graph.visitedOrder]);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-border bg-muted/30',
        className
      )}
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel ?? 'Theoretical example graph'}
        className="block h-auto w-full"
      >
        <defs>
          <marker
            id="static-example-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-muted-foreground" />
          </marker>
          <marker
            id="static-example-arrow-primary"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-primary" />
          </marker>
          <marker
            id="static-example-arrow-amber"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-amber-500" />
          </marker>
          <marker
            id="static-example-arrow-emerald"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-emerald-500" />
          </marker>
          <marker
            id="static-example-arrow-sky"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" className="fill-sky-500" />
          </marker>
        </defs>

        {graph.edges.map((edge, index) => {
          const source = nodeById.get(edge.from);
          const target = nodeById.get(edge.to);
          if (!source || !target) return null;
          const explicitStatus = edge.status && edge.status !== 'default';
          const isLegacyHighlighted = legacyHighlightedEdgeSet.has(edgeKey(edge.from, edge.to));
          const effectiveStatus: ExampleEdgeStatus = explicitStatus
            ? edge.status!
            : isLegacyHighlighted
              ? 'path'
              : 'default';
          const style = EDGE_STYLE[effectiveStatus];

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const ux = dx / len;
          const uy = dy / len;
          const sourceX = source.x + ux * NODE_RADIUS;
          const sourceY = source.y + uy * NODE_RADIUS;
          const targetX = target.x - ux * NODE_RADIUS;
          const targetY = target.y - uy * NODE_RADIUS;
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          const labelOffsetX = -uy * 12;
          const labelOffsetY = ux * 12;

          let markerEnd: string | undefined;
          if (edge.directed) {
            switch (effectiveStatus) {
              case 'path':
                markerEnd = 'url(#static-example-arrow-primary)';
                break;
              case 'active':
                markerEnd = 'url(#static-example-arrow-amber)';
                break;
              case 'selected':
              case 'mst':
                markerEnd = 'url(#static-example-arrow-emerald)';
                break;
              case 'relaxed':
                markerEnd = 'url(#static-example-arrow-sky)';
                break;
              default:
                markerEnd = 'url(#static-example-arrow)';
            }
          }

          return (
            <g key={`edge-${index}-${edge.from}-${edge.to}`}>
              <line
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                strokeWidth={style.width}
                strokeDasharray={style.dasharray}
                markerEnd={markerEnd}
                className={cn('transition-colors', style.stroke)}
              />
              {typeof edge.weight === 'number' && (
                <g>
                  <rect
                    x={midX + labelOffsetX - 11}
                    y={midY + labelOffsetY - 8}
                    width={22}
                    height={16}
                    rx={4}
                    className="fill-background stroke-border"
                    strokeWidth={0.6}
                  />
                  <text
                    x={midX + labelOffsetX}
                    y={midY + labelOffsetY + 4}
                    textAnchor="middle"
                    className="fill-foreground"
                    style={{ fontSize: '10px', fontWeight: 600 }}
                  >
                    {edge.weight}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {graph.nodes.map(node => {
          let effectiveStatus: ExampleNodeStatus = node.status ?? 'default';
          if (effectiveStatus === 'default') {
            if (graph.startNode === node.id) effectiveStatus = 'start';
            else if (graph.endNode === node.id) effectiveStatus = 'end';
          }
          const style = NODE_STYLE[effectiveStatus];
          const rank = visitedRank.get(node.id);
          const badge = node.badge ?? (rank !== undefined ? String(rank) : undefined);
          return (
            <g key={`node-${node.id}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                strokeWidth={2}
                className={cn('transition-colors', style.fill, style.stroke)}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                className={cn(style.textClass)}
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                {node.label}
              </text>
              {badge !== undefined && (
                <g>
                  <circle
                    cx={node.x + NODE_RADIUS - 2}
                    cy={node.y - NODE_RADIUS + 2}
                    r={9}
                    className="fill-primary stroke-background"
                    strokeWidth={1.5}
                  />
                  <text
                    x={node.x + NODE_RADIUS - 2}
                    y={node.y - NODE_RADIUS + 5}
                    textAnchor="middle"
                    className="fill-primary-foreground"
                    style={{ fontSize: '9px', fontWeight: 700 }}
                  >
                    {badge}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {graph.legend && (
        <p className="px-3 py-2 text-[11px] text-muted-foreground">{graph.legend}</p>
      )}
    </div>
  );
}
