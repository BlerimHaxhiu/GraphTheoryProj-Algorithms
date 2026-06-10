// Recommendation engine (Phase 2).
//
// Two pure stages:
//   parseGraphProperties(text) -> GraphProperties   (NL -> structured problem)
//   recommend(props)           -> RecommendationResult (deterministic decision)
//   formatRecommendation(...)  -> localized string for the chat surface
//
// The decision procedure is a hand-written, technically-correct decision tree
// over the problem's task + weighted/directed/negative properties. No LLM.
import type {
  AlgorithmType,
  AppLanguage,
  GraphProperties,
  Localized,
  RecommendationResult,
  TaskKind,
} from './types';
import { labelOf } from './algorithm-knowledge';

function L(en: string, sq: string): Localized {
  return { en, sq };
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function detectTask(n: string): TaskKind | null {
  if (/all[\s-]?pairs|every pair|between (all|every)|all nodes to all|cdo cift|te gjitha ciftet|cdo dy nyje|mes te gjitha/.test(n)) {
    return 'all-pairs-shortest-path';
  }
  if (/spanning tree|minimum spanning|\bmst\b|peme (minimale|shtri|mbuluese)|lidh te gjitha (nyjet|kulmet)|kosto minimale per te lidhur/.test(n)) {
    return 'mst';
  }
  if (/path-?find|pathfinding|on a (map|grid)|\bmap\b|\bgrid\b|\bgame\b|navigat|gps|harte|rrjet rrugor|hapesir|labirint/.test(n)) {
    return 'pathfinding';
  }
  if (/shortest|rrug\w* me (te|me) shkurt|me e shkurter|distanc\w* (minimale|me e vogel)/.test(n)) {
    return 'shortest-path';
  }
  if (/travers|visit all|explore all|level[\s-]?order|breadth|depth|\bbfs\b|\bdfs\b|kalim|vizito|eksploro|gjeresi|thellesi|niveleve/.test(n)) {
    return 'traversal';
  }
  return null;
}

function detectWeighted(n: string): boolean | null {
  if (/unweighted|no weights?|without weights?|pa pesh\w*|nuk ka pesh|ska pesh/.test(n)) return false;
  if (/weighted|with weights?|me pesh\w*|\bkosto\b/.test(n)) return true;
  return null;
}

function detectDirected(n: string): boolean | null {
  if (/undirected|pa drejtim|i padrejtuar|jo i drejtuar/.test(n)) return false;
  if (/directed|me drejtim|i drejtuar|orientuar|njedrejtimesh/.test(n)) return true;
  return null;
}

function detectNegative(n: string): boolean | null {
  if (/negative (weight|edge|cost|cycle)|negativ|pesha negative|cikel negativ/.test(n)) return true;
  if (/non-?negative|positive (weight|cost|edge)|pa pesha negative|pesha pozitive|jo-?negativ|vetem pozitive/.test(n)) return false;
  return null;
}

/** Extract structured problem properties from a natural-language question. */
export function parseGraphProperties(text: string): GraphProperties {
  const n = normalize(text);
  return {
    task: detectTask(n),
    weighted: detectWeighted(n),
    directed: detectDirected(n),
    negativeWeights: detectNegative(n),
  };
}

function empty(task: TaskKind | null, props: GraphProperties): RecommendationResult {
  return {
    recommended: [],
    alternatives: [],
    reasons: [],
    tradeoffs: [],
    assumptions: [],
    task,
    resolvedProperties: { ...props, task },
  };
}

/**
 * Deterministically recommend algorithm(s) for a problem described by `props`.
 * Missing properties are filled with stated assumptions rather than silently.
 */
export function recommend(props: GraphProperties): RecommendationResult {
  const r = empty(props.task, props);

  switch (props.task) {
    case 'mst': {
      r.recommended = ['kruskal', 'prim'];
      r.reasons.push(
        L(
          'A minimum spanning tree connects every node with the least total edge weight and no cycles.',
          'Nje peme minimale shtrirese i lidh te gjitha nyjet me peshen totale me te vogel dhe pa cikle.'
        ),
        L(
          'Kruskal sorts edges and uses Union-Find — best on sparse graphs.',
          'Kruskal i rendit brinjet dhe perdor Union-Find — me i miri ne grafe te shperhapur.'
        ),
        L(
          'Prim grows the tree from a start node with a priority queue — best on dense graphs.',
          'Prim e rrit pemen nga nje nyje fillestare me rend prioritar — me i miri ne grafe te dendur.'
        )
      );
      r.tradeoffs.push(
        L('Both require an undirected graph.', 'Te dyja kerkojne nje graf te padrejtuar.'),
        L(
          'The MST is unique only when all edge weights are distinct.',
          'MST eshte unik vetem kur te gjitha peshat e brinjeve jane te ndryshme.'
        )
      );
      if (props.directed === true) {
        r.tradeoffs.push(
          L(
            'Your problem is directed, but MST is undirected-only — drop edge directions first.',
            'Problemi yt eshte me drejtim, por MST eshte vetem per grafe te padrejtuara — hiqi drejtimet me pare.'
          )
        );
      }
      if (props.weighted === false) {
        r.tradeoffs.push(
          L(
            'Without weights every spanning tree is minimal; weights make the choice meaningful.',
            'Pa pesha cdo peme shtrirese eshte minimale; peshat e bejne zgjedhjen kuptimplote.'
          )
        );
      }
      return r;
    }

    case 'all-pairs-shortest-path': {
      r.recommended = ['floyd-warshall'];
      if (props.negativeWeights === true) {
        r.alternatives = ['bellman-ford'];
        r.reasons.push(
          L(
            'Floyd-Warshall handles negative weights (no negative cycle) and returns the full distance matrix in one pass.',
            'Floyd-Warshall i trajton peshat negative (pa cikel negativ) dhe kthen matricen e plote te distancave ne nje hap.'
          ),
          L(
            'On a large sparse graph, running Bellman-Ford from each source can be cheaper.',
            'Ne nje graf te madh e te shperhapur, ekzekutimi i Bellman-Ford nga cdo burim mund te jete me i lire.'
          )
        );
      } else {
        r.alternatives = ['dijkstra'];
        r.reasons.push(
          L(
            'Floyd-Warshall is the simple O(V^3) choice for small or dense graphs.',
            'Floyd-Warshall eshte zgjedhja e thjeshte O(V^3) per grafe te vegjel ose te dendur.'
          ),
          L(
            'On a large sparse non-negative graph, repeated Dijkstra (one per source) is faster.',
            'Ne nje graf te madh, te shperhapur e jo-negativ, Dijkstra e perseritur (nje per burim) eshte me e shpejte.'
          )
        );
        if (props.negativeWeights === null) {
          r.assumptions.push(
            L(
              'I assumed non-negative weights; with negative weights prefer Floyd-Warshall or repeated Bellman-Ford.',
              'Supozova pesha jo-negative; me pesha negative prefero Floyd-Warshall ose Bellman-Ford te perseritur.'
            )
          );
          r.resolvedProperties.negativeWeights = false;
        }
      }
      r.tradeoffs.push(
        L(
          'Floyd-Warshall is O(V^3) time / O(V^2) space — fine for small graphs, heavy for large ones.',
          'Floyd-Warshall eshte O(V^3) kohe / O(V^2) hapesire — i mire per grafe te vegjel, i rende per te medhenj.'
        )
      );
      return r;
    }

    case 'traversal': {
      r.recommended = ['bfs', 'dfs'];
      r.reasons.push(
        L(
          'BFS visits level by level: shortest path in unweighted graphs, plus connectivity and components.',
          'BFS viziton sipas niveleve: rruga me e shkurter ne grafe pa pesha, plus lidhshmeria dhe komponentet.'
        ),
        L(
          'DFS goes deep: cycle detection, topological ordering, strongly connected components and backtracking.',
          'DFS shkon thelle: zbulim ciklesh, renditje topologjike, komponente fort te lidhura dhe backtracking.'
        )
      );
      if (props.weighted === true) {
        r.tradeoffs.push(
          L(
            'Traversal ignores weights; for cheapest paths on a weighted graph use Dijkstra instead.',
            'Kalimi i injoron peshat; per rruge me te lira ne nje graf me pesha perdor Dijkstra.'
          )
        );
      }
      return r;
    }

    case 'pathfinding': {
      if (props.negativeWeights === true) {
        r.recommended = ['bellman-ford'];
        r.reasons.push(
          L(
            'Pathfinding usually targets one goal, but negative weights rule out A* and Dijkstra — use Bellman-Ford.',
            'Gjetja e rruges zakonisht synon nje qellim, por peshat negative e perjashtojne A* dhe Dijkstra — perdor Bellman-Ford.'
          )
        );
      } else {
        r.recommended = ['a-star'];
        r.alternatives = ['dijkstra'];
        r.reasons.push(
          L(
            'A heuristic (e.g. Euclidean distance to the goal) lets A* head straight for the target.',
            'Nje heuristike (p.sh. distanca Euklidiane deri te qellimi) e ben A* te shkoje drejt e te qellimi.'
          ),
          L(
            'With no useful heuristic, A* reduces to Dijkstra — so Dijkstra is the safe fallback.',
            'Pa nje heuristike te dobishme, A* reduktohet ne Dijkstra — pra Dijkstra eshte zgjidhja e sigurt rezerve.'
          )
        );
        r.tradeoffs.push(
          L(
            'A* needs an admissible heuristic; without one, use Dijkstra.',
            'A* kerkon nje heuristike te pranueshme; pa te, perdor Dijkstra.'
          )
        );
      }
      return r;
    }

    case 'shortest-path': {
      if (props.weighted === false) {
        r.recommended = ['bfs'];
        r.reasons.push(
          L(
            'In an unweighted graph the shortest path has the fewest edges — BFS finds it in O(V + E).',
            'Ne nje graf pa pesha rruga me e shkurter ka me pak brinje — BFS e gjen ne O(V + E).'
          )
        );
        return r;
      }
      if (props.weighted === null) {
        r.assumptions.push(
          L(
            'I assumed weighted edges; if the graph is unweighted, use BFS.',
            'Supozova brinje me pesha; nese grafi eshte pa pesha, perdor BFS.'
          )
        );
        r.resolvedProperties.weighted = true;
      }
      if (props.negativeWeights === true) {
        r.recommended = ['bellman-ford'];
        r.alternatives = ['floyd-warshall'];
        r.reasons.push(
          L(
            'Negative weights make Dijkstra and A* unsafe; Bellman-Ford relaxes every edge V−1 times.',
            'Peshat negative e bejne Dijkstra dhe A* te pasigurt; Bellman-Ford relakson cdo brinje V−1 here.'
          ),
          L(
            'Bellman-Ford also flags a reachable negative-weight cycle (where no shortest path exists).',
            'Bellman-Ford gjithashtu sinjalizon nje cikel me peshe negative te arritshem (ku nuk ekziston rruge me e shkurter).'
          )
        );
        r.tradeoffs.push(
          L(
            'Bellman-Ford is O(V · E) — slower than Dijkstra, so only use it when weights can be negative.',
            'Bellman-Ford eshte O(V · E) — me i ngadalshem se Dijkstra, prandaj perdore vetem kur peshat mund te jene negative.'
          )
        );
        return r;
      }
      if (props.negativeWeights === null) {
        r.assumptions.push(
          L(
            'I assumed non-negative weights; if some weights are negative, use Bellman-Ford.',
            'Supozova pesha jo-negative; nese disa pesha jane negative, perdor Bellman-Ford.'
          )
        );
        r.resolvedProperties.negativeWeights = false;
      }
      r.recommended = ['dijkstra'];
      r.alternatives = ['a-star'];
      r.reasons.push(
        L(
          'With non-negative weights, Dijkstra is optimal and efficient (O((V + E) log V)).',
          'Me pesha jo-negative, Dijkstra eshte optimal dhe efikas (O((V + E) log V)).'
        ),
        L(
          'Choose A* instead if you have a goal heuristic (e.g. coordinates / Euclidean distance).',
          'Zgjidh A* nese ke nje heuristike drejt qellimit (p.sh. koordinata / distance Euklidiane).'
        )
      );
      return r;
    }

    default: {
      // Task unknown — return a deterministic decision guide instead of guessing.
      r.reasons.push(
        L('Shortest path, unweighted → BFS.', 'Rruga me e shkurter, pa pesha → BFS.'),
        L('Shortest path, weighted, non-negative → Dijkstra (A* with a heuristic).', 'Rruga me e shkurter, me pesha, jo-negative → Dijkstra (A* me heuristike).'),
        L('Shortest path with negative weights → Bellman-Ford.', 'Rruga me e shkurter me pesha negative → Bellman-Ford.'),
        L('Shortest path between every pair → Floyd-Warshall.', 'Rruga me e shkurter mes cdo cifti → Floyd-Warshall.'),
        L('Minimum spanning tree (cheapest connection) → Kruskal or Prim.', 'Peme minimale shtrirese (lidhja me e lire) → Kruskal ose Prim.'),
        L('Traversal / cycle detection / topological order → BFS or DFS.', 'Kalim / zbulim ciklesh / renditje topologjike → BFS ose DFS.')
      );
      return r;
    }
  }
}

const HEADERS = {
  recommended: L('Recommended', 'I rekomanduar'),
  alternatives: L('Alternatives', 'Alternativa'),
  why: L('Why', 'Pse'),
  tradeoffs: L('Tradeoffs', 'Kompromise'),
  assumptions: L('Assumptions', 'Supozime'),
  guide: L('Choosing an algorithm', 'Si te zgjedhesh nje algoritem'),
  guidePrompt: L(
    "Tell me the goal (e.g. 'shortest path with negative weights') or ask 'what should I use for this graph?'.",
    "Me trego qellimin (p.sh. 'rruga me e shkurter me pesha negative') ose pyet 'cilin algoritem te perdor per kete graf?'."
  ),
};

function listLabels(types: AlgorithmType[], lang: AppLanguage): string {
  const sep = lang === 'sq' ? ' ose ' : ' or ';
  return types.map(labelOf).join(sep);
}

/** Render a recommendation as a chat-friendly, localized string. */
export function formatRecommendation(result: RecommendationResult, lang: AppLanguage): string {
  const lines: string[] = [];

  if (result.recommended.length === 0) {
    // Decision guide (task unknown).
    lines.push(`${HEADERS.guide[lang]}:`);
    for (const reason of result.reasons) lines.push(`- ${reason[lang]}`);
    lines.push('');
    lines.push(HEADERS.guidePrompt[lang]);
    return lines.join('\n');
  }

  lines.push(`${HEADERS.recommended[lang]}: ${listLabels(result.recommended, lang)}`);
  if (result.alternatives.length > 0) {
    lines.push(`${HEADERS.alternatives[lang]}: ${listLabels(result.alternatives, lang)}`);
  }

  if (result.reasons.length > 0) {
    lines.push('');
    lines.push(`${HEADERS.why[lang]}:`);
    for (const reason of result.reasons) lines.push(`- ${reason[lang]}`);
  }
  if (result.tradeoffs.length > 0) {
    lines.push('');
    lines.push(`${HEADERS.tradeoffs[lang]}:`);
    for (const t of result.tradeoffs) lines.push(`- ${t[lang]}`);
  }
  if (result.assumptions.length > 0) {
    lines.push('');
    lines.push(`${HEADERS.assumptions[lang]}:`);
    for (const a of result.assumptions) lines.push(`- ${a[lang]}`);
  }

  return lines.join('\n');
}

/** Convenience: parse a question and return the formatted recommendation. */
export function recommendFromText(text: string, lang: AppLanguage): string {
  return formatRecommendation(recommend(parseGraphProperties(text)), lang);
}
