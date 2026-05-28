'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AlgorithmStep, AlgorithmType, Edge, Node } from '@/types/graph';
import { useLanguage } from '@/hooks/use-language';
import { algorithmExplanations } from '@/lib/translations';

interface PrintableGraphReportProps {
  nodes: Node[];
  edges: Edge[];
  algorithm: AlgorithmType | null;
  startNodeId: string | null;
  endNodeId: string | null;
  reportLog: AlgorithmStep[];
}

const NODE_RADIUS = 22;
const PRINT_PADDING = 60;
const MIN_CANVAS = 480;

function formatDate(language: 'sq' | 'en'): string {
  try {
    const locale = language === 'sq' ? 'sq-AL' : 'en-GB';
    return new Date().toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date().toISOString();
  }
}

function labelFor(nodes: Node[], id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  return nodes.find(n => n.id === id)?.label;
}

interface HighlightSummary {
  edgeKeys: Set<string>;
  pathNodeIds: string[];
  visitOrder: string[];
  mstEdgeKeys: Set<string>;
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function summarizeReport(reportLog: AlgorithmStep[]): HighlightSummary {
  const edgeKeys = new Set<string>();
  const mstEdgeKeys = new Set<string>();
  const visitOrder: string[] = [];
  let lastPath: string[] = [];

  for (const step of reportLog) {
    if (!step) continue;
    if (step.type === 'visit-node' && step.nodeId) {
      if (!visitOrder.includes(step.nodeId)) visitOrder.push(step.nodeId);
    }
    if (step.type === 'highlight-path' && Array.isArray(step.path)) {
      lastPath = step.path;
      for (let i = 0; i < step.path.length - 1; i += 1) {
        const k = edgeKey(step.path[i], step.path[i + 1]);
        edgeKeys.add(k);
        // MST messages in this app reuse highlight-path; keep a separate copy
        // so the rendering can distinguish "path" vs "mst" if needed later.
        mstEdgeKeys.add(k);
      }
    }
  }

  return {
    edgeKeys,
    pathNodeIds: lastPath,
    visitOrder,
    mstEdgeKeys,
  };
}

function isMstAlgorithm(algorithm: AlgorithmType | null): boolean {
  return algorithm === 'kruskal' || algorithm === 'prim';
}

export function PrintableGraphReport(props: PrintableGraphReportProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(<PrintableGraphReportContent {...props} />, document.body);
}

function PrintableGraphReportContent({
  nodes,
  edges,
  algorithm,
  startNodeId,
  endNodeId,
  reportLog,
}: PrintableGraphReportProps) {
  const { language, t } = useLanguage();
  const lang = language === 'sq' ? 'sq' : 'en';

  const algorithmName = algorithm
    ? algorithmExplanations[lang][algorithm]?.title ?? algorithm.toUpperCase()
    : null;
  const startLabel = labelFor(nodes, startNodeId);
  const endLabel = labelFor(nodes, endNodeId);

  const summary = useMemo(() => summarizeReport(reportLog), [reportLog]);

  const { viewBox, projected } = useMemo(() => {
    if (nodes.length === 0) {
      return {
        viewBox: `0 0 ${MIN_CANVAS} ${MIN_CANVAS * 0.6}`,
        projected: nodes,
      };
    }
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const rawW = Math.max(1, maxX - minX);
    const rawH = Math.max(1, maxY - minY);
    const w = rawW + PRINT_PADDING * 2;
    const h = rawH + PRINT_PADDING * 2;
    const offsetX = PRINT_PADDING - minX;
    const offsetY = PRINT_PADDING - minY;
    return {
      viewBox: `0 0 ${w} ${h}`,
      projected: nodes.map(n => ({ ...n, x: n.x + offsetX, y: n.y + offsetY })),
    };
  }, [nodes]);

  const nodeById = useMemo(() => new Map(projected.map(n => [n.id, n])), [projected]);

  const pathLabels = summary.pathNodeIds
    .map(id => nodes.find(n => n.id === id)?.label)
    .filter((x): x is string => Boolean(x));
  const visitLabels = summary.visitOrder
    .map(id => nodes.find(n => n.id === id)?.label)
    .filter((x): x is string => Boolean(x));

  const hasGraph = nodes.length > 0;
  const hasResult = pathLabels.length > 0 || visitLabels.length > 0;

  return (
    <div
      className="print-only-root"
      role="document"
      aria-label={t('print.title')}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#ffffff',
        color: '#000000',
        fontFamily:
          'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '780px',
          margin: '0 auto',
          padding: '8mm 0',
          color: '#000000',
        }}
      >
        <header style={{ borderBottom: '2px solid #111', paddingBottom: '6mm', marginBottom: '6mm' }}>
          <h1
            style={{
              fontSize: '22pt',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '0.01em',
              color: '#0f172a',
            }}
          >
            {t('print.title')}
          </h1>
          <p style={{ margin: '2mm 0 0', color: '#475569', fontSize: '11pt' }}>
            {t('print.subtitle')}
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4mm 8mm',
            marginBottom: '6mm',
            fontSize: '10pt',
          }}
        >
          <MetaRow label={t('print.algorithm')} value={algorithmName ?? t('print.noAlgorithm')} />
          <MetaRow label={t('print.generatedAt')} value={formatDate(lang)} />
          {startLabel && <MetaRow label={t('print.startNode')} value={startLabel} />}
          {endLabel && <MetaRow label={t('print.endNode')} value={endLabel} />}
          <MetaRow label={t('print.nodesLabel')} value={String(nodes.length)} />
          <MetaRow label={t('print.edgesLabel')} value={String(edges.length)} />
        </section>

        <section
          className="print-graph-container"
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '6mm',
            marginBottom: '6mm',
            background: '#ffffff',
          }}
        >
          {hasGraph ? (
            <svg
              viewBox={viewBox}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={t('print.title')}
              style={{ display: 'block', width: '100%', height: 'auto' }}
            >
              <defs>
                <marker
                  id="print-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="#111111" />
                </marker>
                <marker
                  id="print-arrow-highlight"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="#0b6e3b" />
                </marker>
              </defs>

              {edges.map((edge, index) => {
                const source = nodeById.get(edge.source);
                const target = nodeById.get(edge.target);
                if (!source || !target) return null;
                const isHighlighted = summary.edgeKeys.has(edgeKey(edge.source, edge.target));
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                const ux = dx / len;
                const uy = dy / len;
                const sx = source.x + ux * NODE_RADIUS;
                const sy = source.y + uy * NODE_RADIUS;
                const tx = target.x - ux * NODE_RADIUS;
                const ty = target.y - uy * NODE_RADIUS;
                const mx = (source.x + target.x) / 2;
                const my = (source.y + target.y) / 2;
                const offX = -uy * 14;
                const offY = ux * 14;
                const stroke = isHighlighted ? '#0b6e3b' : '#1f2937';
                const width = isHighlighted ? 3.5 : 1.6;
                const markerEnd = edge.directed
                  ? isHighlighted
                    ? 'url(#print-arrow-highlight)'
                    : 'url(#print-arrow)'
                  : undefined;
                return (
                  <g key={`print-edge-${index}-${edge.id}`}>
                    <line
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke={stroke}
                      strokeWidth={width}
                      markerEnd={markerEnd}
                    />
                    {Number.isFinite(edge.weight) && edge.weight !== 1 && (
                      <g>
                        <rect
                          x={mx + offX - 13}
                          y={my + offY - 9}
                          width={26}
                          height={18}
                          rx={4}
                          fill="#ffffff"
                          stroke="#94a3b8"
                          strokeWidth={0.6}
                        />
                        <text
                          x={mx + offX}
                          y={my + offY + 5}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight={600}
                          fill="#0f172a"
                        >
                          {edge.weight}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {projected.map(node => {
                const isStart = startNodeId === node.id;
                const isEnd = endNodeId === node.id;
                const isOnPath = summary.pathNodeIds.includes(node.id);
                let fill = '#ffffff';
                let stroke = '#111111';
                let strokeWidth = 1.8;
                if (isStart) {
                  fill = '#dcfce7';
                  stroke = '#0b6e3b';
                  strokeWidth = 2.4;
                } else if (isEnd) {
                  fill = '#dbeafe';
                  stroke = '#1d4ed8';
                  strokeWidth = 2.4;
                } else if (isOnPath) {
                  fill = '#f1f5f9';
                  stroke = '#0b6e3b';
                  strokeWidth = 2.2;
                }
                return (
                  <g key={`print-node-${node.id}`}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={NODE_RADIUS}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight={700}
                      fill="#0f172a"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <p
              style={{
                margin: 0,
                padding: '12mm 0',
                textAlign: 'center',
                color: '#64748b',
                fontStyle: 'italic',
                fontSize: '11pt',
              }}
            >
              {t('print.emptyGraph')}
            </p>
          )}
        </section>

        {hasResult && (
          <section style={{ marginBottom: '6mm', fontSize: '10pt' }}>
            <h2
              style={{
                fontSize: '12pt',
                fontWeight: 700,
                margin: '0 0 2mm',
                color: '#0f172a',
              }}
            >
              {t('print.resultSummary')}
            </h2>
            {pathLabels.length > 0 && (
              <p style={{ margin: '1mm 0', color: '#0f172a' }}>
                <strong>
                  {isMstAlgorithm(algorithm) ? t('print.resultMst') : t('print.resultPath')}:
                </strong>{' '}
                {pathLabels.join(isMstAlgorithm(algorithm) ? ', ' : ' → ')}
              </p>
            )}
            {visitLabels.length > 0 && (
              <p style={{ margin: '1mm 0', color: '#0f172a' }}>
                <strong>{t('print.resultVisitOrder')}:</strong> {visitLabels.join(' → ')}
              </p>
            )}
          </section>
        )}

        <footer
          style={{
            borderTop: '1px solid #cbd5e1',
            paddingTop: '4mm',
            marginTop: '6mm',
            fontSize: '9pt',
            color: '#475569',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8mm',
          }}
        >
          <span>{t('print.generatedBy')}</span>
          <span style={{ fontStyle: 'italic' }}>{t('print.pageHint')}</span>
        </footer>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          textTransform: 'uppercase',
          fontSize: '8pt',
          letterSpacing: '0.06em',
          color: '#64748b',
          marginBottom: '0.5mm',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '11pt', fontWeight: 600, color: '#0f172a' }}>{value}</div>
    </div>
  );
}
