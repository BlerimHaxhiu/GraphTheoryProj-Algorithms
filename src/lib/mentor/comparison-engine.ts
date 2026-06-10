// Comparison engine (Phase 4).
//
// compareAlgorithms(a, b) -> structured key-difference + when-to-choose guidance.
// formatComparison(...) renders purpose, complexity, strengths, weaknesses and
// typical use cases for each side. Canonical pairs get hand-curated guidance;
// any other pair falls back to a KB-derived generic comparison.
import type {
  AlgorithmType,
  AlgorithmCategory,
  AppLanguage,
  ComparisonResult,
  Localized,
} from './types';
import { getKnowledge, labelOf, categoryOf } from './algorithm-knowledge';

function L(en: string, sq: string): Localized {
  return { en, sq };
}

function pairKey(a: AlgorithmType, b: AlgorithmType): string {
  return [a, b].sort().join('|');
}

const CATEGORY_NAME: Record<AlgorithmCategory, Localized> = {
  traversal: L('traversal', 'kalimi (traversal)'),
  'shortest-path': L('shortest-path', 'rruge me e shkurter'),
  'all-pairs-shortest-path': L('all-pairs shortest-path', 'rruge me e shkurter per te gjitha ciftet'),
  mst: L('minimum-spanning-tree', 'peme minimale shtrirese'),
};

interface Curated {
  keyDifference: Localized;
  when: Partial<Record<AlgorithmType, Localized>>;
}

const CURATED: Record<string, Curated> = {
  [pairKey('bfs', 'dfs')]: {
    keyDifference: L(
      'BFS explores breadth-first with a queue and finds the shortest path in unweighted graphs; DFS explores depth-first with a stack and is the tool for cycles, topological order and SCCs.',
      'BFS eksploron ne gjeresi me nje rresht dhe gjen rrugen me te shkurter ne grafe pa pesha; DFS eksploron ne thellesi me nje stiv dhe eshte vegla per cikle, renditje topologjike dhe SCC.'
    ),
    when: {
      bfs: L(
        'Choose BFS for shortest unweighted paths and level-order work.',
        'Zgjidh BFS per rruge me te shkurtra pa pesha dhe pune sipas niveleve.'
      ),
      dfs: L(
        'Choose DFS for cycle detection, topological sorting and exhaustive search.',
        'Zgjidh DFS per zbulim ciklesh, renditje topologjike dhe kerkim te plote.'
      ),
    },
  },

  [pairKey('a-star', 'dijkstra')]: {
    keyDifference: L(
      'Dijkstra expands purely by lowest cost from the start; A* adds a heuristic h and expands by f = g + h, so it heads toward the goal and usually explores far fewer nodes. With h = 0 they are identical.',
      'Dijkstra zgjerohet vetem sipas kostos me te ulet nga fillimi; A* shton nje heuristike h dhe zgjerohet sipas f = g + h, prandaj shkon drejt qellimit dhe zakonisht eksploron shume me pak nyje. Me h = 0 jane identike.'
    ),
    when: {
      'a-star': L(
        'Choose A* when you have one goal and a good heuristic (e.g. coordinates).',
        'Zgjidh A* kur ke nje qellim te vetem dhe nje heuristike te mire (p.sh. koordinata).'
      ),
      dijkstra: L(
        'Choose Dijkstra when there is no heuristic or you need many targets.',
        'Zgjidh Dijkstra kur s\'ka heuristike ose te duhen shume qellime.'
      ),
    },
  },

  [pairKey('kruskal', 'prim')]: {
    keyDifference: L(
      'Both build a minimum spanning tree. Kruskal sorts all edges globally and joins components with Union-Find (great when sparse); Prim grows one tree from a start node with a priority queue (great when dense).',
      'Te dyja ndertojne nje peme minimale shtrirese. Kruskal i rendit te gjitha brinjet globalisht dhe bashkon komponente me Union-Find (i mire kur i shperhapur); Prim rrit nje peme nga nje nyje fillestare me rend prioritar (i mire kur i dendur).'
    ),
    when: {
      kruskal: L(
        'Choose Kruskal on sparse graphs or when edges are easy to sort.',
        'Zgjidh Kruskal ne grafe te shperhapur ose kur brinjet renditen lehte.'
      ),
      prim: L(
        'Choose Prim on dense graphs or adjacency-list input.',
        'Zgjidh Prim ne grafe te dendur ose me hyrje liste fqinjesie.'
      ),
    },
  },

  [pairKey('bellman-ford', 'dijkstra')]: {
    keyDifference: L(
      'Both find single-source shortest paths, but Dijkstra (O((V+E) log V)) only works with non-negative weights, while Bellman-Ford (O(V·E)) also handles negative weights and detects negative cycles.',
      'Te dyja gjejne rruge me te shkurtra nga nje burim, por Dijkstra (O((V+E) log V)) punon vetem me pesha jo-negative, ndersa Bellman-Ford (O(V·E)) trajton edhe pesha negative dhe zbulon cikle negative.'
    ),
    when: {
      dijkstra: L(
        'Choose Dijkstra when all weights are non-negative (faster).',
        'Zgjidh Dijkstra kur te gjitha peshat jane jo-negative (me i shpejte).'
      ),
      'bellman-ford': L(
        'Choose Bellman-Ford when weights can be negative or you must detect negative cycles.',
        'Zgjidh Bellman-Ford kur peshat mund te jene negative ose duhet te zbulosh cikle negative.'
      ),
    },
  },

  [pairKey('dijkstra', 'floyd-warshall')]: {
    keyDifference: L(
      'Dijkstra solves single-source shortest paths and must be repeated per source for all pairs; Floyd-Warshall solves all-pairs directly in O(V^3) and also handles negative weights (no negative cycle).',
      'Dijkstra zgjidh rruge nga nje burim dhe duhet perseritur per cdo burim per te gjitha ciftet; Floyd-Warshall zgjidh te gjitha ciftet drejtperdrejt ne O(V^3) dhe trajton edhe pesha negative (pa cikel negativ).'
    ),
    when: {
      dijkstra: L(
        'Choose repeated Dijkstra for all-pairs on large sparse non-negative graphs.',
        'Zgjidh Dijkstra te perseritur per te gjitha ciftet ne grafe te medhenj, te shperhapur e jo-negative.'
      ),
      'floyd-warshall': L(
        'Choose Floyd-Warshall for small/dense graphs or when you need the full matrix.',
        'Zgjidh Floyd-Warshall per grafe te vegjel/te dendur ose kur te duhet matrica e plote.'
      ),
    },
  },
};

function genericKeyDifference(a: AlgorithmType, b: AlgorithmType): Localized {
  const ka = getKnowledge(a);
  const kb = getKnowledge(b);
  const ca = CATEGORY_NAME[categoryOf(a)];
  const cb = CATEGORY_NAME[categoryOf(b)];
  return L(
    `${ka.label} is a ${ca.en} algorithm (${ka.timeComplexity}); ${kb.label} is a ${cb.en} algorithm (${kb.timeComplexity}). Compare their strengths below to choose.`,
    `${ka.label} eshte algoritem i tipit ${ca.sq} (${ka.timeComplexity}); ${kb.label} eshte algoritem i tipit ${cb.sq} (${kb.timeComplexity}). Krahaso pikat e forta me poshte per te zgjedhur.`
  );
}

/** Build a structured comparison of two algorithms. */
export function compareAlgorithms(a: AlgorithmType, b: AlgorithmType): ComparisonResult {
  const cur = CURATED[pairKey(a, b)];
  return {
    a,
    b,
    keyDifference: cur ? cur.keyDifference : genericKeyDifference(a, b),
    chooseWhen: {
      a: cur?.when[a] ?? getKnowledge(a).whenToUse,
      b: cur?.when[b] ?? getKnowledge(b).whenToUse,
    },
    curated: Boolean(cur),
  };
}

const HEADERS = {
  vs: { en: 'vs', sq: 'kunder' } as Localized,
  keyDifference: { en: 'Key difference', sq: 'Dallimi kryesor' } as Localized,
  purpose: { en: 'Purpose', sq: 'Qellimi' } as Localized,
  complexity: { en: 'Complexity', sq: 'Kompleksiteti' } as Localized,
  strengths: { en: 'Strengths', sq: 'Pikat e forta' } as Localized,
  weaknesses: { en: 'Weaknesses', sq: 'Pikat e dobeta' } as Localized,
  useCases: { en: 'Use cases', sq: 'Raste perdorimi' } as Localized,
  whenToChoose: { en: 'When to choose', sq: 'Kur te zgjedhesh' } as Localized,
  timeWord: { en: 'time', sq: 'kohe' } as Localized,
  spaceWord: { en: 'space', sq: 'hapesire' } as Localized,
};

function block(type: AlgorithmType, lang: AppLanguage): string[] {
  const k = getKnowledge(type);
  return [
    `${k.label}`,
    `- ${HEADERS.purpose[lang]}: ${k.purpose[lang]}`,
    `- ${HEADERS.complexity[lang]}: ${k.timeComplexity} ${HEADERS.timeWord[lang]}, ${k.spaceComplexity} ${HEADERS.spaceWord[lang]}`,
    `- ${HEADERS.strengths[lang]}: ${k.strengths[lang].join('; ')}`,
    `- ${HEADERS.weaknesses[lang]}: ${k.weaknesses[lang].join('; ')}`,
    `- ${HEADERS.useCases[lang]}: ${k.useCases[lang].join('; ')}`,
  ];
}

/** Render a comparison as a chat-friendly, localized string. */
export function formatComparison(result: ComparisonResult, lang: AppLanguage): string {
  const lines: string[] = [];
  lines.push(`${labelOf(result.a)} ${HEADERS.vs[lang]} ${labelOf(result.b)}`);
  lines.push('');
  lines.push(`${HEADERS.keyDifference[lang]}: ${result.keyDifference[lang]}`);
  lines.push('');
  lines.push(...block(result.a, lang));
  lines.push('');
  lines.push(...block(result.b, lang));
  lines.push('');
  lines.push(`${HEADERS.whenToChoose[lang]}:`);
  lines.push(`- ${labelOf(result.a)}: ${result.chooseWhen.a[lang]}`);
  lines.push(`- ${labelOf(result.b)}: ${result.chooseWhen.b[lang]}`);
  return lines.join('\n');
}

/** Convenience: structured + formatted in one call. */
export function compareFormatted(a: AlgorithmType, b: AlgorithmType, lang: AppLanguage): string {
  return formatComparison(compareAlgorithms(a, b), lang);
}
