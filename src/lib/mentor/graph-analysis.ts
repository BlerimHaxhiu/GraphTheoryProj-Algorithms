// Graph analysis + graph-aware recommendation (Phase 5).
//
// analyzeGraph(nodes, edges) inspects the *currently loaded* graph and
// recommendForGraph(analysis) explains what fits it — without ever executing an
// algorithm. Reuses the app's existing graph utilities (relative import so the
// sucrase test harness can resolve it).
import type { Node, Edge } from '@/types/graph';
import type { AlgorithmType, AppLanguage, GraphAnalysis, Localized } from './types';
import {
  calculateGraphStats,
  graphHasDirectedEdges,
  hasNegativeEdgeWeights,
  normalizeEdge,
} from '../graph-utils';
import { labelOf } from './algorithm-knowledge';
import { recommend } from './recommendation-engine';

function L(en: string, sq: string): Localized {
  return { en, sq };
}

function sizeBucket(n: number): GraphAnalysis['sizeBucket'] {
  if (n === 0) return 'empty';
  if (n <= 5) return 'tiny';
  if (n <= 15) return 'small';
  if (n <= 40) return 'medium';
  return 'large';
}

/** Inspect a loaded graph and return a read-only structural snapshot. */
export function analyzeGraph(nodes: Node[], edges: Edge[]): GraphAnalysis {
  const stats = calculateGraphStats(nodes, edges);
  const weights = edges
    .filter(e => e.source !== e.target)
    .map(e => normalizeEdge(e).weight);
  const distinct = new Set(weights);
  const weighted = weights.some(w => w !== 1);
  const uniformWeights = weights.length > 0 && distinct.size === 1;

  return {
    nodeCount: stats.nodesCount,
    edgeCount: stats.edgesCount,
    weighted,
    uniformWeights,
    directed: graphHasDirectedEdges(edges),
    hasNegativeWeights: hasNegativeEdgeWeights(edges),
    connected: stats.nodesCount > 0 && stats.connectedComponents === 1,
    components: stats.connectedComponents,
    isComplete: stats.isComplete,
    density: stats.density,
    sizeBucket: sizeBucket(stats.nodesCount),
  };
}

const HEADERS = {
  yourGraph: L('Your graph', 'Grafi yt') as Localized,
  whatFits: L('What fits this graph', 'Cfare i pershtatet ketij grafi') as Localized,
  notes: L('Notes', 'Shenime') as Localized,
  shortestPath: L('Shortest path', 'Rruga me e shkurter') as Localized,
  allPairs: L('All-pairs shortest path', 'Rruga me e shkurter per te gjitha ciftet') as Localized,
  mst: L('Minimum spanning tree', 'Peme minimale shtrirese') as Localized,
  traversal: L('Traversal', 'Kalimi') as Localized,
  noAutoRun: L(
    "I won't run anything automatically — pick an algorithm in the controls, or ask me \"why <algorithm>?\".",
    'Nuk ekzekutoj asgje automatikisht — zgjidh nje algoritem te kontrollet, ose pyetme "pse <algoritmi>?".'
  ) as Localized,
  empty: L(
    'The graph is empty. Add nodes and edges first, then ask again.',
    'Grafi eshte bosh. Shto me pare nyje dhe brinje, pastaj pyet perseri.'
  ) as Localized,
};

function describe(a: GraphAnalysis, lang: AppLanguage): string {
  const weighted = a.weighted
    ? L('weighted', 'me pesha')[lang]
    : L('unweighted', 'pa pesha')[lang];
  const directed = a.directed
    ? L('directed', 'me drejtim')[lang]
    : L('undirected', 'pa drejtim')[lang];
  const connected = a.connected
    ? L('connected', 'i lidhur')[lang]
    : L(`disconnected (${a.components} components)`, `i shkeputur (${a.components} komponente)`)[lang];
  const negative = a.hasNegativeWeights
    ? (lang === 'sq' ? ', me pesha negative' : ', has negative weights')
    : '';
  const nodesWord = lang === 'sq' ? 'nyje' : 'nodes';
  const edgesWord = lang === 'sq' ? 'brinje' : 'edges';
  return `${a.nodeCount} ${nodesWord}, ${a.edgeCount} ${edgesWord} — ${weighted}, ${directed}, ${connected}${negative}.`;
}

function labels(types: AlgorithmType[], lang: AppLanguage): string {
  const sep = lang === 'sq' ? ' ose ' : ' or ';
  return types.map(labelOf).join(sep);
}

function shortestPathLine(a: GraphAnalysis, lang: AppLanguage): string {
  const rec = recommend({
    task: 'shortest-path',
    weighted: a.weighted,
    directed: a.directed,
    negativeWeights: a.hasNegativeWeights,
  }).recommended;
  const why = !a.weighted
    ? L('unweighted, so fewest edges', 'pa pesha, pra me pak brinje')[lang]
    : a.hasNegativeWeights
    ? L('negative weights present', 'ka pesha negative')[lang]
    : L('non-negative weights', 'pesha jo-negative')[lang];
  return `- ${HEADERS.shortestPath[lang]}: ${labels(rec, lang)} (${why})`;
}

function allPairsLine(a: GraphAnalysis, lang: AppLanguage): string {
  const rec = recommend({
    task: 'all-pairs-shortest-path',
    weighted: a.weighted,
    directed: a.directed,
    negativeWeights: a.hasNegativeWeights,
  }).recommended;
  const why = a.hasNegativeWeights
    ? L('handles negative weights', 'trajton pesha negative')[lang]
    : L('small/dense graphs', 'grafe te vegjel/te dendur')[lang];
  return `- ${HEADERS.allPairs[lang]}: ${labels(rec, lang)} (${why})`;
}

function mstLine(a: GraphAnalysis, lang: AppLanguage): string {
  if (a.directed) {
    const note = L(
      'needs an undirected graph (drop edge directions)',
      'kerkon graf te padrejtuar (hiq drejtimet e brinjeve)'
    )[lang];
    return `- ${HEADERS.mst[lang]}: Kruskal / Prim — ${note}`;
  }
  return `- ${HEADERS.mst[lang]}: ${labels(['kruskal', 'prim'], lang)}`;
}

function traversalLine(lang: AppLanguage): string {
  return `- ${HEADERS.traversal[lang]}: ${labels(['bfs', 'dfs'], lang)}`;
}

function notes(a: GraphAnalysis, lang: AppLanguage): string[] {
  const out: string[] = [];
  if (a.directed) {
    out.push(
      L(
        'MST algorithms (Kruskal/Prim) need an undirected graph; remove directions to use them.',
        'Algoritmet MST (Kruskal/Prim) kerkojne graf te padrejtuar; hiq drejtimet per t\'i perdorur.'
      )[lang]
    );
  }
  if (a.hasNegativeWeights) {
    out.push(
      L(
        'Negative weights are present, so Dijkstra and A* are unsafe here — use Bellman-Ford (or Floyd-Warshall for all pairs).',
        'Ka pesha negative, prandaj Dijkstra dhe A* jane te pasigurt ketu — perdor Bellman-Ford (ose Floyd-Warshall per te gjitha ciftet).'
      )[lang]
    );
  }
  if (!a.connected && a.nodeCount > 0) {
    out.push(
      L(
        'The graph is disconnected: BFS/DFS/Prim only cover the start node\'s component, and one spanning tree cannot reach every node.',
        'Grafi eshte i shkeputur: BFS/DFS/Prim mbulojne vetem komponenten e nyjes fillestare, dhe nje peme e vetme shtrirese nuk arrin cdo nyje.'
      )[lang]
    );
  }
  if (a.uniformWeights && a.weighted) {
    out.push(
      L(
        'Every edge has the same weight, so BFS (by edge count) already finds shortest paths.',
        'Cdo brinje ka te njejten peshe, prandaj BFS (sipas numrit te brinjeve) i gjen tashme rruget me te shkurtra.'
      )[lang]
    );
  }
  return out;
}

/** Render a graph-aware recommendation as a chat-friendly, localized string. */
export function recommendForGraph(a: GraphAnalysis, lang: AppLanguage): string {
  if (a.nodeCount === 0) {
    return HEADERS.empty[lang];
  }

  const lines: string[] = [];
  lines.push(`${HEADERS.yourGraph[lang]}: ${describe(a, lang)}`);
  lines.push('');
  lines.push(`${HEADERS.whatFits[lang]}:`);
  lines.push(shortestPathLine(a, lang));
  lines.push(allPairsLine(a, lang));
  lines.push(mstLine(a, lang));
  lines.push(traversalLine(lang));

  const noteLines = notes(a, lang);
  if (noteLines.length > 0) {
    lines.push('');
    lines.push(`${HEADERS.notes[lang]}:`);
    for (const note of noteLines) lines.push(`- ${note}`);
  }

  lines.push('');
  lines.push(HEADERS.noAutoRun[lang]);
  return lines.join('\n');
}

/** Convenience: analyze and recommend in one call. */
export function recommendForGraphFromState(nodes: Node[], edges: Edge[], lang: AppLanguage): string {
  return recommendForGraph(analyzeGraph(nodes, edges), lang);
}
