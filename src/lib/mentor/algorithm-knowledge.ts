// Algorithm knowledge base — the single source of truth for the mentor's
// recommendation, why, comparison and graph-analysis engines.
//
// All prose is bilingual ({ sq, en }) and kept in lock-step (see
// tests/mentor-knowledge-parity.test.js). Capabilities are machine-readable
// flags used to reason about constraints. Nothing here mutates app state.
import type {
  AlgorithmType,
  AlgorithmKnowledge,
  AlgorithmCategory,
} from './types';

const KNOWLEDGE: Record<AlgorithmType, AlgorithmKnowledge> = {
  bfs: {
    type: 'bfs',
    label: 'BFS',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    capabilities: {
      category: 'traversal',
      requiresStartNode: true,
      requiresEndNode: false,
      weightAware: false,
      supportsNegativeWeights: false,
      detectsNegativeCycle: false,
      requiresUndirected: false,
    },
    purpose: {
      en: 'Explore an unweighted graph level by level from a start node using a FIFO queue. Because it expands in order of edge-distance, the first time it reaches a node it has found a path with the fewest edges.',
      sq: 'Eksploron nje graf pa pesha shtrese pas shtrese nga nje nyje fillestare duke perdorur nje rresht FIFO. Meqe zgjerohet sipas distances ne brinje, here e pare qe arrin nje nyje ka gjetur rrugen me me pak brinje.',
    },
    whenToUse: {
      en: 'Use BFS for shortest paths in unweighted graphs, level-order traversal and connectivity.',
      sq: 'Perdore BFS per rruge me te shkurtra ne grafe pa pesha, kalim sipas niveleve dhe lidhshmeri.',
    },
    strengths: {
      en: [
        'Finds the shortest path (fewest edges) in unweighted graphs.',
        'Simple and predictable: O(V + E) time.',
        'Naturally discovers connected components and graph levels.',
      ],
      sq: [
        'Gjen rrugen me te shkurter (me pak brinje) ne grafe pa pesha.',
        'I thjeshte dhe i parashikueshem: koha O(V + E).',
        'Zbulon natyrshem komponentet e lidhura dhe nivelet e grafit.',
      ],
    },
    weaknesses: {
      en: [
        'Ignores edge weights, so it is wrong for weighted shortest paths.',
        'Can use a lot of memory on wide graphs (the frontier grows fast).',
        'Gives no ordering guarantee beyond edge count.',
      ],
      sq: [
        'Injoron peshat e brinjeve, prandaj eshte i gabuar per rruge me pesha.',
        'Mund te perdore shume memorie ne grafe te gjere (fronti rritet shpejt).',
        'Nuk jep garanci renditjeje pertej numrit te brinjeve.',
      ],
    },
    useCases: {
      en: [
        'Shortest hop count in social or unweighted networks.',
        'Level-order / breadth exploration.',
        'Finding connected components and reachability.',
      ],
      sq: [
        'Numri minimal i hapave ne rrjete sociale ose pa pesha.',
        'Eksplorim sipas niveleve / ne gjeresi.',
        'Gjetja e komponenteve te lidhura dhe arritshmerise.',
      ],
    },
  },

  dfs: {
    type: 'dfs',
    label: 'DFS',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    capabilities: {
      category: 'traversal',
      requiresStartNode: true,
      requiresEndNode: false,
      weightAware: false,
      supportsNegativeWeights: false,
      detectsNegativeCycle: false,
      requiresUndirected: false,
    },
    purpose: {
      en: 'Dive as deep as possible along one branch before backtracking, using a stack or recursion. It exposes the structure of the graph rather than shortest distances.',
      sq: 'Zbret sa me thelle ne nje dege para se te kthehet pas, duke perdorur stiv ose rekursion. Nxjerr ne pah strukturen e grafit, jo distancat me te shkurtra.',
    },
    whenToUse: {
      en: 'Use DFS for cycle detection, topological sorting, connected/strongly-connected components and exhaustive path search.',
      sq: 'Perdore DFS per zbulim ciklesh, renditje topologjike, komponente te lidhura dhe kerkim te plote rrugesh.',
    },
    strengths: {
      en: [
        'Excellent for cycle detection, topological order and SCCs.',
        'Low memory on deep, narrow graphs.',
        'Naturally enumerates all reachable paths via backtracking.',
      ],
      sq: [
        'I shkelqyer per zbulim ciklesh, renditje topologjike dhe SCC.',
        'Memorie e ulet ne grafe te thelle e te ngushte.',
        'Numeron natyrshem te gjitha rruget e arritshme permes backtracking.',
      ],
    },
    weaknesses: {
      en: [
        'Does not find shortest paths (even in unweighted graphs).',
        'Deep recursion can overflow the stack on large graphs.',
        'Visit order depends on neighbour ordering, so results can look arbitrary.',
      ],
      sq: [
        'Nuk gjen rruge me te shkurtra (as ne grafe pa pesha).',
        'Rekursioni i thelle mund te mbushe stivin ne grafe te medhenj.',
        'Rendi i vizitave varet nga renditja e fqinjeve, prandaj duket arbitrar.',
      ],
    },
    useCases: {
      en: [
        'Detecting cycles and dependency loops.',
        'Topological scheduling of tasks.',
        'Maze / backtracking and exhaustive exploration.',
      ],
      sq: [
        'Zbulimi i cikleve dhe varesive qarkore.',
        'Planifikim topologjik i detyrave.',
        'Labirinte / backtracking dhe eksplorim i plote.',
      ],
    },
  },

  dijkstra: {
    type: 'dijkstra',
    label: 'Dijkstra',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    capabilities: {
      category: 'shortest-path',
      requiresStartNode: true,
      requiresEndNode: true,
      weightAware: true,
      supportsNegativeWeights: false,
      detectsNegativeCycle: false,
      requiresUndirected: false,
    },
    purpose: {
      en: 'Find the cheapest path from a source using a min-priority queue, always finalising the closest unsettled node. Correct only when no edge weight is negative.',
      sq: 'Gjen rrugen me te lire nga nje burim duke perdorur nje rend prioritar minimal, duke perfunduar gjithmone nyjen me te afert te papercaktuar. I sakte vetem kur asnje peshe nuk eshte negative.',
    },
    whenToUse: {
      en: 'Use Dijkstra for shortest paths on graphs with non-negative weights (road networks, latencies, routing).',
      sq: 'Perdore Dijkstra per rruge me te shkurtra ne grafe me pesha jo-negative (rrjete rrugore, latenca, rutim).',
    },
    strengths: {
      en: [
        'Optimal shortest paths with non-negative weights.',
        'Efficient: O((V + E) log V) with a binary heap.',
        'A single source covers every reachable node at once.',
      ],
      sq: [
        'Rruge me te shkurtra optimale me pesha jo-negative.',
        'Efikas: O((V + E) log V) me binary heap.',
        'Nje burim mbulon menjehere cdo nyje te arritshme.',
      ],
    },
    weaknesses: {
      en: [
        'Incorrect with negative edge weights.',
        'No goal direction: it explores in all directions equally.',
        'Needs a priority queue to stay efficient.',
      ],
      sq: [
        'I pasakte me pesha negative ne brinje.',
        'Pa drejtim nga qellimi: eksploron njesoj ne te gjitha drejtimet.',
        'Kerkon rend prioritar per te qene efikas.',
      ],
    },
    useCases: {
      en: [
        'Routing and navigation with positive costs.',
        'Network latency / least-cost paths.',
        'Single-source shortest distances.',
      ],
      sq: [
        'Rutim dhe navigim me kosto pozitive.',
        'Latenca rrjeti / rruge me kosto minimale.',
        'Distanca me te shkurtra nga nje burim.',
      ],
    },
  },

  'a-star': {
    type: 'a-star',
    label: 'A*',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    capabilities: {
      category: 'shortest-path',
      requiresStartNode: true,
      requiresEndNode: true,
      weightAware: true,
      supportsNegativeWeights: false,
      detectsNegativeCycle: false,
      requiresUndirected: false,
    },
    purpose: {
      en: 'Goal-directed shortest path: like Dijkstra but ordered by f = g + h, where h estimates the remaining distance to the target. A good admissible heuristic makes it explore far fewer nodes.',
      sq: 'Rruge me e shkurter e drejtuar drejt qellimit: si Dijkstra por e renditur sipas f = g + h, ku h vlereson distancen e mbetur deri te qellimi. Nje heuristike e mire (e pranueshme) ben qe te eksploroje shume me pak nyje.',
    },
    whenToUse: {
      en: 'Use A* for single-target pathfinding when a useful heuristic (e.g. Euclidean distance) is available — maps, grids, games.',
      sq: 'Perdore A* per gjetje rruge drejt nje qellimi kur ke nje heuristike te dobishme (p.sh. distanca Euklidiane) — harta, rrjeta, lojra.',
    },
    strengths: {
      en: [
        'Usually much faster than Dijkstra toward a single goal.',
        'Optimal when the heuristic is admissible (never overestimates).',
        'Reduces to Dijkstra when the heuristic is zero — easy to reason about.',
      ],
      sq: [
        'Zakonisht shume me i shpejte se Dijkstra drejt nje qellimi.',
        'Optimal kur heuristika eshte e pranueshme (nuk e mbivlereson kurre).',
        'Reduktohet ne Dijkstra kur heuristika eshte zero — i lehte per t\'u kuptuar.',
      ],
    },
    weaknesses: {
      en: [
        'Needs a meaningful heuristic; a bad one gives no benefit.',
        'Still incorrect with negative edge weights.',
        'An inadmissible heuristic can break optimality.',
      ],
      sq: [
        'Kerkon nje heuristike kuptimplote; nje e keqe nuk sjell perfitim.',
        'Perseri i pasakte me pesha negative.',
        'Nje heuristike e papranueshme mund te prishe optimalitetin.',
      ],
    },
    useCases: {
      en: [
        'Pathfinding on maps and game grids.',
        'Robot / GPS navigation toward a destination.',
        'Any single-target search with a distance estimate.',
      ],
      sq: [
        'Gjetje rruge ne harta dhe rrjeta lojrash.',
        'Navigim roboti / GPS drejt nje destinacioni.',
        'Cdo kerkim drejt nje qellimi me vleresim distance.',
      ],
    },
  },

  'bellman-ford': {
    type: 'bellman-ford',
    label: 'Bellman-Ford',
    timeComplexity: 'O(V * E)',
    spaceComplexity: 'O(V)',
    capabilities: {
      category: 'shortest-path',
      requiresStartNode: true,
      requiresEndNode: false,
      weightAware: true,
      supportsNegativeWeights: true,
      detectsNegativeCycle: true,
      requiresUndirected: false,
    },
    purpose: {
      en: 'Compute shortest paths from one source even with negative edge weights by relaxing every edge V−1 times; a further relaxation reveals a reachable negative cycle.',
      sq: 'Llogarit rruge me te shkurtra nga nje burim edhe me pesha negative, duke relaksuar cdo brinje V−1 here; nje relaksim i metejshem zbulon nje cikel negativ te arritshem.',
    },
    whenToUse: {
      en: 'Use Bellman-Ford when edges can be negative or when you must detect negative-weight cycles.',
      sq: 'Perdore Bellman-Ford kur brinjet mund te jene negative ose kur duhet te zbulosh cikle me peshe negative.',
    },
    strengths: {
      en: [
        'Handles negative edge weights correctly.',
        'Detects reachable negative-weight cycles.',
        'Simple to implement; no priority queue needed.',
      ],
      sq: [
        'I trajton sakte peshat negative ne brinje.',
        'Zbulon ciklet negative te arritshme.',
        'I thjeshte per t\'u implementuar; pa rend prioritar.',
      ],
    },
    weaknesses: {
      en: [
        'Slower than Dijkstra: O(V · E).',
        'No finite answer when a negative cycle is reachable.',
        'Overkill when all weights are non-negative.',
      ],
      sq: [
        'Me i ngadalshem se Dijkstra: O(V · E).',
        'Pa pergjigje te fundme kur arrihet nje cikel negativ.',
        'I tepert kur te gjitha peshat jane jo-negative.',
      ],
    },
    useCases: {
      en: [
        'Currency arbitrage / negative-cycle detection.',
        'Shortest paths with penalties or refunds (negative costs).',
        'Distance-vector routing protocols.',
      ],
      sq: [
        'Arbitrazh valutor / zbulim ciklesh negative.',
        'Rruge me te shkurtra me gjoba ose kthime (kosto negative).',
        'Protokolle rutimi distance-vector.',
      ],
    },
  },

  'floyd-warshall': {
    type: 'floyd-warshall',
    label: 'Floyd-Warshall',
    timeComplexity: 'O(V^3)',
    spaceComplexity: 'O(V^2)',
    capabilities: {
      category: 'all-pairs-shortest-path',
      requiresStartNode: false,
      requiresEndNode: false,
      weightAware: true,
      supportsNegativeWeights: true,
      detectsNegativeCycle: true,
      requiresUndirected: false,
    },
    purpose: {
      en: 'Fill a distance matrix with the shortest path between every pair of nodes via dynamic programming, letting each node in turn act as an intermediate. Handles negative weights but not negative cycles.',
      sq: 'Mbush nje matrice distancash me rrugen me te shkurter mes cdo cifti nyjesh permes programimit dinamik, duke lejuar cdo nyje me radhe te jete e ndermjetme. I trajton peshat negative por jo ciklet negative.',
    },
    whenToUse: {
      en: 'Use Floyd-Warshall for all-pairs shortest paths on small or dense graphs, or when you need the full distance matrix in one pass.',
      sq: 'Perdore Floyd-Warshall per rruge me te shkurtra mes te gjitha cifteve ne grafe te vegjel ose te dendur, ose kur te duhet matrica e plote e distancave ne nje hap.',
    },
    strengths: {
      en: [
        'Computes all-pairs shortest paths in one run.',
        'Very simple triple loop; handles directed and negative edges.',
        'Also yields transitive closure / reachability.',
      ],
      sq: [
        'Llogarit rruget me te shkurtra mes te gjitha cifteve ne nje ekzekutim.',
        'Tri-cikel shume i thjeshte; trajton brinje me drejtim dhe negative.',
        'Jep gjithashtu mbylljen transitive / arritshmerine.',
      ],
    },
    weaknesses: {
      en: [
        'O(V³) time and O(V²) space — poor for large graphs.',
        'Wasteful on sparse graphs (repeated Dijkstra is faster).',
        'Cannot give finite distances through a negative cycle.',
      ],
      sq: [
        'Koha O(V³) dhe hapesira O(V²) — e dobet per grafe te medhenj.',
        'E shpenzueshme ne grafe te shperhapur (Dijkstra e perseritur eshte me e shpejte).',
        'Nuk jep distanca te fundme permes nje cikli negativ.',
      ],
    },
    useCases: {
      en: [
        'All-pairs distance tables for small dense graphs.',
        'Transitive closure / reachability matrices.',
        'Pre-computing every route in a small network.',
      ],
      sq: [
        'Tabela distancash per te gjitha ciftet ne grafe te vegjel te dendur.',
        'Matrica te mbylljes transitive / arritshmerise.',
        'Parallogaritje e cdo rruge ne nje rrjet te vogel.',
      ],
    },
  },

  kruskal: {
    type: 'kruskal',
    label: 'Kruskal',
    timeComplexity: 'O(E log E)',
    spaceComplexity: 'O(V)',
    capabilities: {
      category: 'mst',
      requiresStartNode: false,
      requiresEndNode: false,
      weightAware: true,
      supportsNegativeWeights: true,
      detectsNegativeCycle: false,
      requiresUndirected: true,
    },
    purpose: {
      en: 'Build a minimum spanning tree by sorting all edges by weight and greedily adding the lightest edge that joins two different components (Union-Find), skipping any edge that would form a cycle.',
      sq: 'Nderton nje peme minimale shtrirese duke renditur te gjitha brinjet sipas peshes dhe duke shtuar pa kompromis brinjen me te lehte qe bashkon dy komponente te ndryshme (Union-Find), duke anashkaluar cdo brinje qe do te formonte cikel.',
    },
    whenToUse: {
      en: 'Use Kruskal for an MST on a sparse undirected graph, especially when edges are easy to sort.',
      sq: 'Perdore Kruskal per nje MST ne nje graf te padrejtuar te shperhapur, sidomos kur brinjet renditen lehte.',
    },
    strengths: {
      en: [
        'Simple greedy MST via edge sorting + Union-Find.',
        'Great on sparse graphs (O(E log E)).',
        'Works edge-globally, independent of a start node.',
      ],
      sq: [
        'MST i thjeshte lakmitar permes renditjes se brinjeve + Union-Find.',
        'I shkelqyer ne grafe te shperhapur (O(E log E)).',
        'Punon globalisht mbi brinjet, pavaresisht nga nyja fillestare.',
      ],
    },
    weaknesses: {
      en: [
        'Only for undirected graphs.',
        'Sorting dominates; less ideal than Prim on very dense graphs.',
        'The MST is unique only when all weights are distinct.',
      ],
      sq: [
        'Vetem per grafe te padrejtuara.',
        'Renditja dominon; me pak ideal se Prim ne grafe shume te dendur.',
        'MST eshte unik vetem kur te gjitha peshat jane te ndryshme.',
      ],
    },
    useCases: {
      en: [
        'Cheapest network / cabling layout.',
        'Clustering by removing the heaviest MST edges.',
        'Any minimum-cost connection problem on sparse data.',
      ],
      sq: [
        'Rrjeti / kabllimi me i lire.',
        'Grupim duke hequr brinjet me te renda te MST.',
        'Cdo problem lidhjeje me kosto minimale ne te dhena te shperhapura.',
      ],
    },
  },

  prim: {
    type: 'prim',
    label: 'Prim',
    timeComplexity: 'O(E log V)',
    spaceComplexity: 'O(V)',
    capabilities: {
      category: 'mst',
      requiresStartNode: true,
      requiresEndNode: false,
      weightAware: true,
      supportsNegativeWeights: true,
      detectsNegativeCycle: false,
      requiresUndirected: true,
    },
    purpose: {
      en: 'Grow a minimum spanning tree from a start node, repeatedly attaching the lightest edge that crosses from the tree to a new node, using a priority queue keyed by the cheapest connecting edge.',
      sq: 'Rrit nje peme minimale shtrirese nga nje nyje fillestare, duke bashkengjitur perseritshem brinjen me te lehte qe kalon nga pema te nje nyje e re, duke perdorur nje rend prioritar te bazuar tek brinja me e lire lidhese.',
    },
    whenToUse: {
      en: 'Use Prim for an MST on a dense undirected graph, or when the graph is given as an adjacency list.',
      sq: 'Perdore Prim per nje MST ne nje graf te padrejtuar te dendur, ose kur grafi jepet si liste fqinjesie.',
    },
    strengths: {
      en: [
        'Grows one connected tree, easy to visualise.',
        'Efficient on dense graphs with a heap (O(E log V)).',
        'Works directly from an adjacency list.',
      ],
      sq: [
        'Rrit nje peme te vetme te lidhur, e lehte per t\'u vizualizuar.',
        'Efikas ne grafe te dendur me heap (O(E log V)).',
        'Punon drejtperdrejt nga nje liste fqinjesie.',
      ],
    },
    weaknesses: {
      en: [
        'Only for undirected graphs.',
        'Needs a start node and a priority queue.',
        'On a disconnected graph it only spans the start node\'s component.',
      ],
      sq: [
        'Vetem per grafe te padrejtuara.',
        'Kerkon nyje fillestare dhe rend prioritar.',
        'Ne nje graf te shkeputur shtrihet vetem ne komponenten e nyjes fillestare.',
      ],
    },
    useCases: {
      en: [
        'MST on dense graphs / adjacency lists.',
        'Incremental network growth from a hub.',
        'The same minimum-cost connection goal as Kruskal.',
      ],
      sq: [
        'MST ne grafe te dendur / liste fqinjesie.',
        'Rritje inkrementale e rrjetit nga nje qender.',
        'I njejti qellim lidhjeje me kosto minimale si Kruskal.',
      ],
    },
  },
};

/** All algorithm types in a stable, teaching-friendly order. */
export const ALL_ALGORITHMS: AlgorithmType[] = [
  'bfs',
  'dfs',
  'dijkstra',
  'a-star',
  'bellman-ford',
  'floyd-warshall',
  'kruskal',
  'prim',
];

/** Look up the knowledge record for an algorithm. */
export function getKnowledge(type: AlgorithmType): AlgorithmKnowledge {
  return KNOWLEDGE[type];
}

/** Language-neutral display label, e.g. "Dijkstra". */
export function labelOf(type: AlgorithmType): string {
  return KNOWLEDGE[type].label;
}

/** Algorithm family. */
export function categoryOf(type: AlgorithmType): AlgorithmCategory {
  return KNOWLEDGE[type].capabilities.category;
}

export { KNOWLEDGE };
