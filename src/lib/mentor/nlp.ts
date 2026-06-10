// Small deterministic NLP helpers for the mentor: detect which algorithm(s) a
// question refers to. Patterns mirror the (well-tested) command parser, but here
// we also need to find *several* algorithms in one sentence (for comparisons).
import type { AlgorithmType } from './types';

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Order matters only for tie-breaking; detection itself is index-based.
const ALGORITHM_PATTERNS: Array<{ type: AlgorithmType; pattern: RegExp }> = [
  { type: 'a-star', pattern: /(a\s*-?\s*star|a\s*\*|a\s*yje|a\s*yll)/ },
  { type: 'bellman-ford', pattern: /bellman[\s-]?ford|bellmanford|\bbellman\b|\bford\b/ },
  { type: 'floyd-warshall', pattern: /floyd[\s-]?warshall|floydwarshall|\bfloyd\b|\bwarshall\b/ },
  { type: 'kruskal', pattern: /kruskal/ },
  { type: 'prim', pattern: /\bprim('?s)?\b/ },
  { type: 'dijkstra', pattern: /(dijkstra|dikstra|dijsktra|djkstra|djikstra|dijstra)/ },
  { type: 'bfs', pattern: /\bbfs\b|breadth[\s-]?first|gjeresi|level[\s-]?order/ },
  { type: 'dfs', pattern: /\bdfs\b|depth[\s-]?first|thellesi|backtrack/ },
];

/**
 * Return every algorithm mentioned in `text`, in order of first appearance,
 * de-duplicated.
 */
export function detectAlgorithms(text: string): AlgorithmType[] {
  const n = normalize(text);
  const hits: Array<{ type: AlgorithmType; index: number }> = [];
  for (const { type, pattern } of ALGORITHM_PATTERNS) {
    const m = pattern.exec(n);
    if (m) hits.push({ type, index: m.index });
  }
  hits.sort((a, b) => a.index - b.index);
  const seen = new Set<AlgorithmType>();
  const ordered: AlgorithmType[] = [];
  for (const h of hits) {
    if (!seen.has(h.type)) {
      seen.add(h.type);
      ordered.push(h.type);
    }
  }
  return ordered;
}

/** Return the single algorithm mentioned, or null if zero or more than one. */
export function detectSingleAlgorithm(text: string): AlgorithmType | null {
  const all = detectAlgorithms(text);
  return all.length === 1 ? all[0] : null;
}
