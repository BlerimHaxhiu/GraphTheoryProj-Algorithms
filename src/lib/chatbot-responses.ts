import type { AlgorithmStep, AlgorithmType, Edge, Node } from '@/types/graph';
import type { AppLanguage } from '@/components/language-provider';

export interface ChatbotContext {
  language: AppLanguage;
  selectedAlgorithm: AlgorithmType | null;
  nodes: Node[];
  edges: Edge[];
  startNodeId?: string | null;
  endNodeId?: string | null;
  currentStep?: AlgorithmStep | null;
}

export interface ChatbotMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

type Localized = { sq: string; en: string };

interface AlgorithmInfo {
  label: string;
  description: Localized;
  complexity: Localized;
  whenToUse: Localized;
  notes: Localized;
}

const ALGORITHM_INFO: Record<AlgorithmType, AlgorithmInfo> = {
  bfs: {
    label: 'BFS',
    description: {
      en: 'Breadth-First Search (BFS) explores the graph layer by layer using a FIFO queue. It visits all neighbours of a node before going deeper, which makes it perfect for finding the shortest path in an unweighted graph.',
      sq: 'BFS (Kerkim ne Gjeresi) e eksploron grafin shtrese pas shtrese duke perdorur nje rresht FIFO. Viziton te gjithe fqinjet e nje nyje para se te shkoje me thelle, dhe per kete arsye gjen rrugen me te shkurter ne grafe pa pesha.',
    },
    complexity: {
      en: 'Time O(V + E), Space O(V).',
      sq: 'Koha O(V + E), Hapesira O(V).',
    },
    whenToUse: {
      en: 'Use BFS for shortest path in unweighted graphs, level-order traversal, finding connected components, and minimum number of edges between two nodes.',
      sq: 'Perdoreni BFS per rrugen me te shkurter ne grafe pa pesha, kalim sipas niveleve, gjetjen e komponenteve te lidhura dhe numrin minimal te brinjeve mes dy nyjeve.',
    },
    notes: {
      en: 'BFS uses a queue. Nodes are visited in order of distance (number of edges) from the start node.',
      sq: 'BFS perdor rresht. Nyjet vizitohen sipas distances (numrit te brinjeve) nga nyja fillestare.',
    },
  },
  dfs: {
    label: 'DFS',
    description: {
      en: 'Depth-First Search (DFS) dives deep along one branch before backtracking. It uses a stack (or recursion) and is great for topological order, cycle detection, and exploring all reachable paths.',
      sq: 'DFS (Kerkim ne Thellesi) zbret thelle ne nje dege para se te kthehet pas. Perdor stiv (ose rekursion) dhe eshte ideal per rendin topologjik, detektimin e cikleve dhe eksplorimin e te gjitha rrugeve te arritshme.',
    },
    complexity: {
      en: 'Time O(V + E), Space O(V) for the recursion / explicit stack.',
      sq: 'Koha O(V + E), Hapesira O(V) per rekursionin / stivin.',
    },
    whenToUse: {
      en: 'Use DFS for cycle detection, topological sorting, strongly connected components, and exhaustive path exploration.',
      sq: 'Perdoreni DFS per detektim ciklesh, renditje topologjike, komponente te lidhura fuqimisht dhe eksplorim te plote rrugesh.',
    },
    notes: {
      en: 'DFS uses a stack. It does NOT guarantee the shortest path.',
      sq: 'DFS perdor stiv. NUK garanton rrugen me te shkurter.',
    },
  },
  dijkstra: {
    label: 'Dijkstra',
    description: {
      en: "Dijkstra's algorithm finds the shortest path from a start node to other nodes in a graph with non-negative weights. It repeatedly picks the unvisited node with the smallest tentative distance.",
      sq: 'Algoritmi i Dijkstra-s gjen rrugen me te shkurter nga nje nyje fillestare drejt nyjeve te tjera ne nje graf me pesha jo-negative. Zgjedh perseritshem nyjen e pavizituar me distancen me te vogel.',
    },
    complexity: {
      en: 'Time O((V + E) log V) with a priority queue (binary heap), Space O(V).',
      sq: 'Koha O((V + E) log V) me rend prioritar (binary heap), Hapesira O(V).',
    },
    whenToUse: {
      en: 'Use Dijkstra for shortest path in graphs with non-negative weights such as road networks, latency graphs, or routing.',
      sq: 'Perdoreni Dijkstra-n per rrugen me te shkurter ne grafe me pesha jo-negative, p.sh. rrjete rrugesh, latence, ose rutim.',
    },
    notes: {
      en: 'Dijkstra fails with negative weights — use Bellman-Ford instead.',
      sq: 'Dijkstra deshton me pesha negative — perdorni Bellman-Ford ne vend te tij.',
    },
  },
  'a-star': {
    label: 'A*',
    description: {
      en: 'A* is an informed search algorithm: it combines Dijkstra (g cost) with a heuristic (h cost) to focus the search toward the goal. It finds the shortest path faster than Dijkstra when a good heuristic is available.',
      sq: 'A* eshte algoritem kerkimi i informuar: kombinon Dijkstra-n (kostoja g) me nje heuristike (kostoja h) per ta fokusuar kerkimin drejt qellimit. Gjen rrugen me te shkurter me shpejt se Dijkstra kur kemi nje heuristike te mire.',
    },
    complexity: {
      en: 'Time depends on the heuristic; worst case O((V + E) log V), like Dijkstra.',
      sq: 'Koha varet nga heuristika; ne rastin me te keq O((V + E) log V), si Dijkstra.',
    },
    whenToUse: {
      en: 'Use A* for pathfinding on maps, game AI, and any shortest-path problem where a useful heuristic (e.g. Euclidean distance) exists.',
      sq: 'Perdoreni A* per gjetje rruge ne harta, AI lojrash, dhe per probleme te rruges me te shkurter ku kemi nje heuristike te dobishme (p.sh. distanca Euklidiane).',
    },
    notes: {
      en: 'A* requires non-negative weights. With a zero heuristic, A* reduces to Dijkstra.',
      sq: 'A* kerkon pesha jo-negative. Me heuristike zero, A* reduktohet ne Dijkstra.',
    },
  },
  'bellman-ford': {
    label: 'Bellman-Ford',
    description: {
      en: 'Bellman-Ford computes shortest paths from a single source even when edges have negative weights. It relaxes every edge V-1 times and can detect negative-weight cycles.',
      sq: 'Bellman-Ford llogarit rruget me te shkurtra nga nje burim edhe kur brinjet kane pesha negative. Relakson cdo brinje V-1 here dhe mund te detektoje cikle me peshe negative.',
    },
    complexity: {
      en: 'Time O(V * E), Space O(V).',
      sq: 'Koha O(V * E), Hapesira O(V).',
    },
    whenToUse: {
      en: 'Use Bellman-Ford when edges can be negative (e.g. currency arbitrage detection) or when you need to detect negative cycles.',
      sq: 'Perdoreni Bellman-Ford kur brinjet mund te jene negative (p.sh. arbitrazh valutor) ose kur duhet te detektoni cikle negative.',
    },
    notes: {
      en: 'Slower than Dijkstra but more general. Cannot return a finite shortest path if a negative cycle is reachable.',
      sq: 'Me i ngadalshem se Dijkstra por me i pergjithshem. Nuk mund te jape rruge te fundme kur arrihet nje cikel negativ.',
    },
  },
  'floyd-warshall': {
    label: 'Floyd-Warshall',
    description: {
      en: 'Floyd-Warshall computes shortest paths between every pair of nodes using dynamic programming on a distance matrix. It handles negative weights (but not negative cycles).',
      sq: 'Floyd-Warshall llogarit rruget me te shkurtra mes cdo cifti nyjesh duke perdorur programim dinamik mbi nje matrice distancash. Suporton pesha negative (por jo cikle negative).',
    },
    complexity: {
      en: 'Time O(V^3), Space O(V^2).',
      sq: 'Koha O(V^3), Hapesira O(V^2).',
    },
    whenToUse: {
      en: 'Use Floyd-Warshall for all-pairs shortest path in small/medium dense graphs, transitive closure, or when you need the full distance matrix.',
      sq: 'Perdoreni Floyd-Warshall per rrugen me te shkurter mes te gjitha cifteve ne grafe te vegjel/mesatare te dendur, mbyllje transitive, ose kur kerkohet matrica e plote e distancave.',
    },
    notes: {
      en: 'For sparse graphs, running Dijkstra from every node can be faster than O(V^3).',
      sq: 'Per grafe te shperhapur, ekzekutimi i Dijkstra-s nga cdo nyje mund te jete me i shpejte se O(V^3).',
    },
  },
  kruskal: {
    label: 'Kruskal',
    description: {
      en: "Kruskal's algorithm builds a Minimum Spanning Tree (MST) by sorting edges by weight and greedily adding the lightest edge that does not form a cycle. It uses a Union-Find / Disjoint Set Union structure.",
      sq: 'Algoritmi i Kruskal-it nderton nje Peme Minimale Shtrirese (MST) duke i renditur brinjet sipas peshes dhe duke shtuar pa kompromise brinjen me te lehte qe nuk formon cikel. Perdor strukturen Union-Find.',
    },
    complexity: {
      en: 'Time O(E log E), dominated by sorting; Space O(V).',
      sq: 'Koha O(E log E), dominon renditja; Hapesira O(V).',
    },
    whenToUse: {
      en: 'Use Kruskal for MST on sparse graphs, especially when edges are already sorted or easy to sort.',
      sq: 'Perdoreni Kruskal-in per MST ne grafe te shperhapur, sidomos kur brinjet jane te renditura ose lehte per t\'u renditur.',
    },
    notes: {
      en: 'Works only on undirected graphs. Result is unique only if all edge weights are distinct.',
      sq: 'Funksionon vetem mbi grafe te padrejtuara. Rezultati eshte unik vetem nese te gjitha peshat jane te ndryshme.',
    },
  },
  prim: {
    label: 'Prim',
    description: {
      en: "Prim's algorithm grows an MST from a starting node, repeatedly attaching the lightest edge that connects a new node to the tree. It uses a priority queue keyed by the lightest incoming edge.",
      sq: 'Algoritmi i Prim-it rrit nje MST duke filluar nga nje nyje, duke i bashkengjitur perseritshem brinjen me te lehte qe lidh nje nyje te re me pemen. Perdor nje rend prioritar te bazuar tek brinja me e lehte hyrese.',
    },
    complexity: {
      en: 'Time O(E log V) with a binary heap; Space O(V).',
      sq: 'Koha O(E log V) me binary heap; Hapesira O(V).',
    },
    whenToUse: {
      en: 'Use Prim for MST on dense graphs and when the graph is given in adjacency-list form.',
      sq: 'Perdoreni Prim-in per MST ne grafe te dendur dhe kur grafi jepet me liste te fqinjesise.',
    },
    notes: {
      en: 'Works only on undirected graphs. Requires a start node.',
      sq: 'Funksionon vetem mbi grafe te padrejtuara. Kerkon nyje fillestare.',
    },
  },
};

const COMPARISONS: Record<string, Localized> = {
  'bfs-dfs': {
    en: 'BFS vs DFS:\n- BFS uses a queue (FIFO), DFS uses a stack (LIFO) or recursion.\n- BFS finds the shortest path in unweighted graphs; DFS does not.\n- BFS uses more memory when the graph is wide; DFS uses more memory when the graph is deep.\n- DFS is the natural choice for cycle detection, topological order, and SCCs.',
    sq: 'BFS kunder DFS:\n- BFS perdor rresht (FIFO), DFS perdor stiv (LIFO) ose rekursion.\n- BFS gjen rrugen me te shkurter ne grafe pa pesha; DFS jo.\n- BFS perdor me shume memorie kur grafi eshte i gjere; DFS kur grafi eshte i thelle.\n- DFS eshte zgjedhja natyrale per detektim ciklesh, renditje topologjike dhe SCC.',
  },
  'dijkstra-bellman': {
    en: 'Dijkstra vs Bellman-Ford:\n- Dijkstra: O((V+E) log V), but only with non-negative weights.\n- Bellman-Ford: O(V * E), supports negative weights and detects negative cycles.\n- Prefer Dijkstra when weights are non-negative; otherwise use Bellman-Ford.',
    sq: 'Dijkstra kunder Bellman-Ford:\n- Dijkstra: O((V+E) log V), por vetem me pesha jo-negative.\n- Bellman-Ford: O(V * E), suporton pesha negative dhe detekton cikle negative.\n- Preferoni Dijkstra-n kur peshat jane jo-negative; perndryshe perdorni Bellman-Ford.',
  },
  'dijkstra-astar': {
    en: 'Dijkstra vs A*:\n- Dijkstra expands nodes purely by lowest distance from start.\n- A* expands by f = g + h, where h is a heuristic estimate of the distance to the goal.\n- With a good admissible heuristic, A* explores far fewer nodes than Dijkstra and finds the same optimal path.\n- Both require non-negative weights.',
    sq: 'Dijkstra kunder A*:\n- Dijkstra zgjeron nyjet vetem sipas distances minimale nga nyja fillestare.\n- A* zgjeron sipas f = g + h, ku h eshte vleresimi heuristik i distances drejt qellimit.\n- Me heuristike te mire (te pranueshme), A* eksploron shume me pak nyje se Dijkstra dhe gjen te njejten rruge optimale.\n- Te dyja kerkojne pesha jo-negative.',
  },
  'kruskal-prim': {
    en: "Kruskal vs Prim:\n- Both build a Minimum Spanning Tree.\n- Kruskal sorts edges globally and uses Union-Find; great for sparse graphs.\n- Prim grows the tree from a start node using a priority queue; great for dense graphs.\n- Both work only on undirected graphs.",
    sq: 'Kruskal kunder Prim:\n- Te dyja ndertojne nje Peme Minimale Shtrirese.\n- Kruskal-i i rendit brinjet globalisht dhe perdor Union-Find; i pershtatshem per grafe te shperhapur.\n- Prim-i rrit pemen nga nje nyje fillestare me rend prioritar; i pershtatshem per grafe te dendur.\n- Te dyja funksionojne vetem mbi grafe te padrejtuara.',
  },
  'floyd-dijkstra': {
    en: 'Floyd-Warshall vs repeated Dijkstra:\n- Floyd-Warshall: O(V^3), simple, handles negative weights (no negative cycles).\n- Dijkstra from every node: O(V * (V + E) log V), faster on sparse graphs but only with non-negative weights.\n- Use Floyd-Warshall on small dense graphs or when you need the full distance matrix in one pass.',
    sq: 'Floyd-Warshall kunder Dijkstra-s se perseritur:\n- Floyd-Warshall: O(V^3), i thjeshte, suporton pesha negative (por jo cikle negative).\n- Dijkstra nga cdo nyje: O(V * (V + E) log V), me i shpejte ne grafe te shperhapur por vetem me pesha jo-negative.\n- Perdorni Floyd-Warshall ne grafe te vegjel te dendur ose kur duhet matrica e plote e distancave ne nje hap.',
  },
};

const TERMS: Record<string, Localized> = {
  node: {
    en: 'A node (vertex) is a point in the graph. In this app, every node has an id, a label, and an x/y position on the canvas.',
    sq: 'Nyja (kulm) eshte nje pike ne graf. Ne kete aplikacion, cdo nyje ka nje id, nje etikete (label) dhe nje pozicion x/y ne kanavace.',
  },
  edge: {
    en: 'An edge connects two nodes. Edges can be directed or undirected, weighted, and straight or curved in this app.',
    sq: 'Brinja lidh dy nyje. Brinjet mund te jene me drejtim ose pa drejtim, me peshe, dhe te drejta ose te lakuara ne kete aplikacion.',
  },
  weight: {
    en: 'A weight is the cost of traversing an edge — distance, time, money, etc. Algorithms like Dijkstra, Bellman-Ford and A* use weights to find the cheapest path.',
    sq: 'Pesha eshte kostoja per te kaluar nje brinje — distance, kohe, para, etj. Algoritmet si Dijkstra, Bellman-Ford dhe A* perdorin peshat per te gjetur rrugen me te lire.',
  },
  queue: {
    en: 'A queue is a FIFO (First-In-First-Out) structure. BFS uses a queue so that nodes are explored in the order they are discovered.',
    sq: 'Rreshti eshte nje struktur FIFO (i pari brenda, i pari jashte). BFS perdor rresht qe nyjet te eksplorohen sipas rendit te zbulimit.',
  },
  stack: {
    en: 'A stack is a LIFO (Last-In-First-Out) structure. DFS uses a stack (explicit or via recursion) so that exploration goes deep before backtracking.',
    sq: 'Stivi eshte nje struktur LIFO (i fundit brenda, i pari jashte). DFS perdor stiv (te qarte ose permes rekursionit) qe eksplorimi te shkoje thelle para kthimit prapa.',
  },
  'priority queue': {
    en: 'A priority queue always pops the element with the smallest (or largest) key. Dijkstra, A* and Prim use a min-priority queue to pick the next cheapest node.',
    sq: 'Rendi prioritar nxjerr gjithmone elementin me celesin me te vogel (ose me te madh). Dijkstra, A* dhe Prim perdorin rend prioritar minimal per te zgjedhur nyjen tjeter me te lire.',
  },
  mst: {
    en: 'A Minimum Spanning Tree (MST) connects every node in an undirected graph using a subset of edges with the minimum total weight and no cycles. Kruskal and Prim both compute MSTs.',
    sq: 'Pema Minimale Shtrirese (MST) i lidh te gjitha nyjet ne nje graf te padrejtuar duke perdorur nje nenbashkesi brinjesh me peshen totale minimale dhe pa cikle. Kruskal-i dhe Prim-i te dyja e llogarisin MST-ne.',
  },
  'shortest path': {
    en: 'A shortest path is a path between two nodes with the minimum total weight. Use BFS (unweighted), Dijkstra (non-negative weights), Bellman-Ford (negative weights), A* (with a heuristic), or Floyd-Warshall (all pairs).',
    sq: 'Rruga me e shkurter eshte nje rruge mes dy nyjeve me peshen totale minimale. Perdorni BFS (pa pesha), Dijkstra (pesha jo-negative), Bellman-Ford (pesha negative), A* (me heuristike), ose Floyd-Warshall (per cdo cift).',
  },
  visited: {
    en: 'A node is "visited" once the algorithm has finalised its result for that node. BFS and DFS mark a node visited when it is dequeued/popped; Dijkstra marks a node visited when its shortest distance is finalised.',
    sq: 'Nje nyje konsiderohet "e vizituar" pasi algoritmi e ka perfunduar rezultatin per te. BFS dhe DFS e shenojne kur nyja del nga rreshti/stivi; Dijkstra e shenon kur distanca me e shkurter eshte perfunduar.',
  },
  'distance table': {
    en: 'The distance table records the current best-known distance from the start node to every other node. Algorithms update entries as they "relax" edges.',
    sq: 'Tabela e distancave mban distancen aktuale me te mire te njohur nga nyja fillestare drejt cdo nyje tjeter. Algoritmet e perditesojne ate ndersa "relaksojne" brinjet.',
  },
  'parent table': {
    en: 'The parent (or predecessor) table stores, for each node, the previous node on the best path from the source. After the algorithm finishes, the path is reconstructed by walking parents backwards from the target.',
    sq: 'Tabela e prinderve ruan, per cdo nyje, nyjen e meparshme ne rrugen me te mire nga burimi. Pas perfundimit, rruga rikrijohet duke kthyer prinderit mbrapsht nga destinacioni.',
  },
  heuristic: {
    en: 'A heuristic is an estimate of the remaining cost from a node to the goal. For A*, an admissible heuristic never overestimates, which guarantees an optimal path.',
    sq: 'Heuristika eshte nje vleresim i kostos se mbetur nga nje nyje drejt qellimit. Per A*, nje heuristike e pranueshme nuk e mbivlereson kurre, gjë qe garanton rrugen optimale.',
  },
};

const SQ_RE = /[ëçÇË]|kompleks|nyje|peshe|grafik|grafi|fqinje|rrugen|rruga|kerkim|rresht|stiv|krahas|dallim|shkurt|negativ|hap|kalim|cikel|shpjeg/i;

function pickLanguage(question: string, fallback: AppLanguage): AppLanguage {
  if (SQ_RE.test(question)) return 'sq';
  return fallback;
}

function pick<T extends { en: string; sq: string }>(text: T, lang: AppLanguage): string {
  return text[lang];
}

function detectAlgorithm(text: string): AlgorithmType | null {
  const q = text.toLowerCase();
  if (/(a-?star|a\*|a yje|a yll)/.test(q)) return 'a-star';
  if (/bellman/.test(q)) return 'bellman-ford';
  if (/floyd/.test(q)) return 'floyd-warshall';
  if (/kruskal/.test(q)) return 'kruskal';
  if (/\bprim/.test(q)) return 'prim';
  if (/dijkstra/.test(q)) return 'dijkstra';
  if (/\bbfs\b|breadth|gjeresi/.test(q)) return 'bfs';
  if (/\bdfs\b|depth|thellesi/.test(q)) return 'dfs';
  return null;
}

function detectComparison(text: string): keyof typeof COMPARISONS | null {
  const q = text.toLowerCase();
  const wantsCompare = /(vs|versus|krahas|dallim|ndryshim|compare|differen)/.test(q);
  const algorithms = new Set<AlgorithmType>();
  for (const a of ['bfs', 'dfs', 'dijkstra', 'a-star', 'bellman-ford', 'floyd-warshall', 'kruskal', 'prim'] as AlgorithmType[]) {
    const det = detectAlgorithm(a === 'a-star' ? 'a*' : a === 'bellman-ford' ? 'bellman' : a === 'floyd-warshall' ? 'floyd' : a);
    if (det) algorithms.add(det);
  }
  const a = detectAlgorithm(q);
  const rest = q.replace(/dijkstra|bellman|floyd|kruskal|prim|a-?star|a\*|bfs|dfs|breadth|depth|gjeresi|thellesi/, '');
  const b = detectAlgorithm(rest);
  if (a && b && a !== b) {
    if ((a === 'bfs' && b === 'dfs') || (a === 'dfs' && b === 'bfs')) return 'bfs-dfs';
    if ((a === 'dijkstra' && b === 'bellman-ford') || (a === 'bellman-ford' && b === 'dijkstra')) return 'dijkstra-bellman';
    if ((a === 'dijkstra' && b === 'a-star') || (a === 'a-star' && b === 'dijkstra')) return 'dijkstra-astar';
    if ((a === 'kruskal' && b === 'prim') || (a === 'prim' && b === 'kruskal')) return 'kruskal-prim';
    if ((a === 'floyd-warshall' && b === 'dijkstra') || (a === 'dijkstra' && b === 'floyd-warshall')) return 'floyd-dijkstra';
  }
  if (!wantsCompare) return null;
  if (/(bfs|breadth|gjeresi).*(dfs|depth|thellesi)|(dfs|depth|thellesi).*(bfs|breadth|gjeresi)/.test(q)) return 'bfs-dfs';
  return null;
}

function detectTerm(text: string): keyof typeof TERMS | null {
  const q = text.toLowerCase();
  if (/priority queue|rend prioritar/.test(q)) return 'priority queue';
  if (/\bqueue\b|rresht/.test(q)) return 'queue';
  if (/\bstack\b|stiv/.test(q)) return 'stack';
  if (/distance table|tabela e distance/.test(q)) return 'distance table';
  if (/parent table|predecessor|tabela e prinder|prind/.test(q)) return 'parent table';
  if (/heurist|heurist/.test(q)) return 'heuristic';
  if (/\bmst\b|spanning tree|peme minimale|peme shtri/.test(q)) return 'mst';
  if (/shortest path|rrug.*shkurt|rrugen me te shkurter/.test(q)) return 'shortest path';
  if (/visited|vizit/.test(q)) return 'visited';
  if (/\bweight\b|peshe/.test(q)) return 'weight';
  if (/\bedge\b|brinje|brinj/.test(q)) return 'edge';
  if (/\bnode\b|vertex|nyje|kulm/.test(q)) return 'node';
  return null;
}

function describeContext(ctx: ChatbotContext, lang: AppLanguage): string {
  const startLabel = ctx.startNodeId ? ctx.nodes.find(n => n.id === ctx.startNodeId)?.label : undefined;
  const endLabel = ctx.endNodeId ? ctx.nodes.find(n => n.id === ctx.endNodeId)?.label : undefined;
  const algo = ctx.selectedAlgorithm ? ALGORITHM_INFO[ctx.selectedAlgorithm].label : null;

  if (lang === 'sq') {
    const parts = [
      `Konteksti aktual: ${ctx.nodes.length} nyje, ${ctx.edges.length} brinje.`,
    ];
    if (algo) parts.push(`Algoritmi i zgjedhur: ${algo}.`);
    if (startLabel) parts.push(`Nyja fillestare: ${startLabel}.`);
    if (endLabel) parts.push(`Nyja perfundimtare: ${endLabel}.`);
    return parts.join(' ');
  }
  const parts = [
    `Current context: ${ctx.nodes.length} nodes, ${ctx.edges.length} edges.`,
  ];
  if (algo) parts.push(`Selected algorithm: ${algo}.`);
  if (startLabel) parts.push(`Start node: ${startLabel}.`);
  if (endLabel) parts.push(`End node: ${endLabel}.`);
  return parts.join(' ');
}

function explainCurrentStep(ctx: ChatbotContext, lang: AppLanguage): string | null {
  const step = ctx.currentStep;
  if (!step) return null;
  const labelOf = (id?: string) => (id ? ctx.nodes.find(n => n.id === id)?.label ?? id : '');
  const edgeOf = (id?: string) => {
    if (!id) return '';
    const e = ctx.edges.find(ed => ed.id === id);
    if (!e) return id;
    return `${labelOf(e.source)}-${labelOf(e.target)}`;
  };

  if (lang === 'sq') {
    switch (step.type) {
      case 'visit-node':
        return `Hapi aktual: vizitohet nyja ${labelOf(step.nodeId)}. Kjo do te thote qe algoritmi e ka zgjedhur ate si nyjen e radhes per perpunim sipas rregullit te tij (FIFO per BFS, LIFO per DFS, distanca minimale per Dijkstra, f = g + h per A*).`;
      case 'traverse-edge':
        return `Hapi aktual: kalohet brinja ${edgeOf(step.edgeId)}. Algoritmi po e "relakson" kete brinje, duke kontrolluar nese kalimi permes saj jep nje distance me te vogel se ajo e ruajtur.`;
      case 'highlight-path':
        return `Hapi aktual: u shfaq rruga finale me ${step.path?.length ?? 0} nyje. Kjo eshte rruga me e mire e gjetur sipas kritereve te algoritmit.`;
      case 'update-matrix-cell':
        return `Hapi aktual: u perditesua nje qelize ne matricen e distancave. Floyd-Warshall e perdor matricen si tabele programimi dinamik.`;
      case 'reset':
        return `Hapi aktual: rivendosje. Algoritmi po pergatit gjendjen fillestare para ekzekutimit.`;
      case 'message':
        return step.message ? `Hapi aktual: ${step.message}` : `Hapi aktual: nje mesazh nga algoritmi (perdor cele celesin "${step.messageKey ?? '—'}").`;
      default:
        return null;
    }
  }

  switch (step.type) {
    case 'visit-node':
      return `Current step: visiting node ${labelOf(step.nodeId)}. The algorithm selected it next according to its rule (FIFO for BFS, LIFO for DFS, smallest distance for Dijkstra, f = g + h for A*).`;
    case 'traverse-edge':
      return `Current step: traversing edge ${edgeOf(step.edgeId)}. The algorithm is "relaxing" this edge — checking whether going through it gives a smaller distance than the one currently stored.`;
    case 'highlight-path':
      return `Current step: a final path with ${step.path?.length ?? 0} nodes was highlighted. This is the best path found according to the algorithm's criteria.`;
    case 'update-matrix-cell':
      return `Current step: a cell of the distance matrix was updated. Floyd-Warshall uses the matrix as a dynamic-programming table.`;
    case 'reset':
      return `Current step: reset. The algorithm is preparing the initial state before running.`;
    case 'message':
      return step.message ? `Current step: ${step.message}` : `Current step: a message from the algorithm (uses message key "${step.messageKey ?? '—'}").`;
    default:
      return null;
  }
}

function commonMistakes(lang: AppLanguage): string {
  if (lang === 'sq') {
    return [
      'Gabime te zakonshme me grafet:',
      '- Te perdorim Dijkstra mbi pesha negative (perdor Bellman-Ford).',
      '- Te harrojme te zgjedhim nyjen fillestare per BFS, DFS, Dijkstra, A*, Bellman-Ford ose Prim.',
      '- Te ekzekutojme Kruskal ose Prim mbi nje graf me brinje me drejtim (kerkohet graf i padrejtuar).',
      '- Te shtojme brinje mes nyjeve qe nuk ekzistojne ose me id te dyfishuara.',
      '- Te pritet rruge me e shkurter nga DFS (DFS nuk e garanton ate).',
    ].join('\n');
  }
  return [
    'Common mistakes with graphs:',
    '- Using Dijkstra with negative weights (use Bellman-Ford instead).',
    '- Forgetting to pick a start node for BFS, DFS, Dijkstra, A*, Bellman-Ford or Prim.',
    '- Running Kruskal or Prim on a graph with directed edges (an undirected graph is required).',
    '- Adding edges between nodes that do not exist, or with duplicate ids.',
    '- Expecting a shortest path from DFS (DFS does not guarantee that).',
  ].join('\n');
}

function fallback(lang: AppLanguage, ctx: ChatbotContext): string {
  const algo = ctx.selectedAlgorithm ? ALGORITHM_INFO[ctx.selectedAlgorithm].label : null;
  if (lang === 'sq') {
    const lines = [
      'Nuk jam i sigurte se cfare po pyet. Mund te provoni:',
      '- "Shpjego algoritmin"',
      '- "Cili eshte kompleksiteti?"',
      '- "BFS kunder DFS"',
      '- "Kur te perdor Dijkstra?"',
      '- "Cfare jane peshat negative?"',
      '- "Cfare eshte MST?"',
    ];
    if (algo) lines.push(`Algoritmi i zgjedhur: ${algo}.`);
    return lines.join('\n');
  }
  const lines = [
    "I'm not sure what you mean. You can try:",
    '- "Explain this algorithm"',
    '- "What is the complexity?"',
    '- "Compare BFS and DFS"',
    '- "When should I use Dijkstra?"',
    '- "What about negative weights?"',
    '- "What is an MST?"',
  ];
  if (algo) lines.push(`Selected algorithm: ${algo}.`);
  return lines.join('\n');
}

function complexityAnswer(target: AlgorithmType | null, ctx: ChatbotContext, lang: AppLanguage): string {
  const algo = target ?? ctx.selectedAlgorithm;
  if (!algo) {
    return lang === 'sq'
      ? 'Per te te treguar kompleksitetin, zgjidh nje algoritem ose permende emrin (p.sh. "kompleksiteti i Dijkstra-s").'
      : 'To answer about complexity, please select an algorithm or name it (e.g. "complexity of Dijkstra").';
  }
  const info = ALGORITHM_INFO[algo];
  return lang === 'sq'
    ? `Kompleksiteti i ${info.label}: ${info.complexity.sq}`
    : `Complexity of ${info.label}: ${info.complexity.en}`;
}

function explainAlgorithm(target: AlgorithmType | null, ctx: ChatbotContext, lang: AppLanguage): string {
  const algo = target ?? ctx.selectedAlgorithm;
  if (!algo) {
    return lang === 'sq'
      ? 'Zgjidh nje algoritem ose permende ate (p.sh. "shpjego Dijkstra-n").'
      : 'Please select an algorithm or name it (e.g. "explain Dijkstra").';
  }
  const info = ALGORITHM_INFO[algo];
  if (lang === 'sq') {
    return [
      `${info.label}:`,
      info.description.sq,
      `Kompleksiteti: ${info.complexity.sq}`,
      `Kur ta perdorim: ${info.whenToUse.sq}`,
      `Shenim: ${info.notes.sq}`,
    ].join('\n');
  }
  return [
    `${info.label}:`,
    info.description.en,
    `Complexity: ${info.complexity.en}`,
    `When to use: ${info.whenToUse.en}`,
    `Note: ${info.notes.en}`,
  ].join('\n');
}

export function generateChatbotResponse(question: string, ctx: ChatbotContext): string {
  const trimmed = question.trim();
  if (!trimmed) {
    return ctx.language === 'sq'
      ? 'Te lutem shkruaj nje pyetje per algoritmet e grafeve.'
      : 'Please type a question about graph algorithms.';
  }
  const lang = pickLanguage(trimmed, ctx.language);
  const q = trimmed.toLowerCase();

  if (/(hello|hi|hey|pershendetje|hello bot|hej)/.test(q)) {
    return lang === 'sq'
      ? `Pershendetje! Une jam asistenti i grafeve. ${describeContext(ctx, lang)}`
      : `Hello! I'm the graph assistant. ${describeContext(ctx, lang)}`;
  }

  if (/(thanks|thank you|faleminderit|flm)/.test(q)) {
    return lang === 'sq' ? 'Me kenaqesi! Pyet sa here te duhet.' : "You're welcome! Ask anytime.";
  }

  if (/(common mistake|gabime|gabim te zakonshme)/.test(q)) {
    return commonMistakes(lang);
  }

  const comparison = detectComparison(q);
  if (comparison) {
    return pick(COMPARISONS[comparison], lang);
  }

  if (/(negative|negativ)/.test(q)) {
    return lang === 'sq'
      ? 'Peshat negative: Dijkstra dhe A* nuk i mbeshtetin. Per pesha negative perdor Bellman-Ford (ose Floyd-Warshall per gjithe ciftet), te cilet gjithashtu detektojne cikle me peshe negative.'
      : 'Negative weights: Dijkstra and A* do not support them. For negative weights use Bellman-Ford (or Floyd-Warshall for all pairs); both also detect negative-weight cycles.';
  }

  if (/(when to use|kur (te |duhet ).*perdor|kur (te |duhet ).*shfryt)/.test(q)) {
    const algo = detectAlgorithm(q) ?? ctx.selectedAlgorithm;
    if (algo) {
      const info = ALGORITHM_INFO[algo];
      return lang === 'sq' ? `Kur ta perdorim ${info.label}: ${info.whenToUse.sq}` : `When to use ${info.label}: ${info.whenToUse.en}`;
    }
  }

  if (/(complexity|kompleks)/.test(q)) {
    return complexityAnswer(detectAlgorithm(q), ctx, lang);
  }

  if (/(why .* first|pse .*(vizitohet|fillon))/.test(q)) {
    if (lang === 'sq') {
      return 'Nje nyje vizitohet "e para" sepse algoritmi zgjedh gjithmone nyjen me prioritet me te larte: BFS zgjedh me te vjetren ne rresht, DFS me te renin ne stiv, Dijkstra/Prim/A* nyjen me distance/prioritet me te vogel.';
    }
    return 'A node is visited "first" because the algorithm always picks the highest-priority node: BFS picks the oldest item in the queue, DFS the newest item on the stack, and Dijkstra/Prim/A* pick the node with the smallest distance/priority.';
  }

  if (/(current step|hap aktual|step now|step now|cili hap)/.test(q)) {
    const explanation = explainCurrentStep(ctx, lang);
    if (explanation) return explanation;
    return lang === 'sq'
      ? 'Per momentin nuk ka hap aktiv. Ekzekuto nje algoritem dhe une do ta shpjegoj hap pas hapi.'
      : 'There is no active step right now. Run an algorithm and I will explain it step by step.';
  }

  const term = detectTerm(q);
  if (term) {
    return pick(TERMS[term], lang);
  }

  const algo = detectAlgorithm(q);
  if (algo && /(explain|shpjeg|cfare ben|si funksionon|describe|trego)/.test(q)) {
    return explainAlgorithm(algo, ctx, lang);
  }
  if (algo) {
    return explainAlgorithm(algo, ctx, lang);
  }

  if (/(explain|shpjeg|cfare ben|si funksionon|describe)/.test(q)) {
    return explainAlgorithm(ctx.selectedAlgorithm, ctx, lang);
  }

  if (/(context|graf aktual|konteksti)/.test(q)) {
    return describeContext(ctx, lang);
  }

  return fallback(lang, ctx);
}

export function getSuggestedQuestions(language: AppLanguage, selectedAlgorithm: AlgorithmType | null): string[] {
  const algoLabel = selectedAlgorithm ? ALGORITHM_INFO[selectedAlgorithm].label : null;
  if (language === 'sq') {
    return [
      algoLabel ? `Shpjego ${algoLabel}` : 'Shpjego algoritmin',
      'Cili eshte kompleksiteti?',
      'BFS kunder DFS',
      'Kur te perdor Dijkstra?',
      'Cfare jane peshat negative?',
      'Cfare eshte MST?',
    ];
  }
  return [
    algoLabel ? `Explain ${algoLabel}` : 'Explain this algorithm',
    'What is the complexity?',
    'Compare BFS and DFS',
    'When should I use Dijkstra?',
    'What about negative weights?',
    'What is an MST?',
  ];
}
