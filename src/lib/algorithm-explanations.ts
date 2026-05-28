import type { AlgorithmType } from '@/types/graph';
import type { AppLanguage } from '@/components/language-provider';

export type ExampleNodeStatus =
  | 'default'
  | 'start'
  | 'end'
  | 'current'
  | 'visited'
  | 'queued'
  | 'stacked'
  | 'relaxed'
  | 'final'
  | 'mst'
  | 'path'
  | 'ignored';

export type ExampleEdgeStatus =
  | 'default'
  | 'active'
  | 'visited'
  | 'relaxed'
  | 'selected'
  | 'rejected'
  | 'mst'
  | 'path'
  | 'ignored';

export interface ExampleGraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  status?: ExampleNodeStatus;
  badge?: string;
}

export interface ExampleGraphEdge {
  from: string;
  to: string;
  weight?: number;
  directed?: boolean;
  status?: ExampleEdgeStatus;
}

export interface ExampleGraphEdgeHighlight {
  from: string;
  to: string;
}

export interface ExampleGraph {
  nodes: ExampleGraphNode[];
  edges: ExampleGraphEdge[];
  startNode?: string;
  endNode?: string;
  highlightedPath?: string[];
  visitedOrder?: string[];
  highlightedEdges?: ExampleGraphEdgeHighlight[];
  legend?: string;
}

export interface AlgorithmStepAlgoState {
  queue?: string[];
  stack?: string[];
  priorityQueue?: string[];
  distances?: Record<string, string>;
  previous?: Record<string, string | null>;
  visited?: string[];
  mstEdges?: string[];
  selectedEdge?: string;
  rejectedEdge?: string;
  matrix?: { columns: string[]; rows: Array<{ label: string; cells: string[] }> };
  notes?: string[];
}

export interface AlgorithmExampleStep {
  stepNumber: number;
  title: string;
  description: string;
  graphState: ExampleGraph;
  algorithmState?: AlgorithmStepAlgoState;
  changeNote?: string;
}

export interface AlgorithmExplanation {
  id: AlgorithmType;
  name: string;
  shortSummary: string;
  bulletPoints: string[];
  theory: string;
  overview: string;
  whenToUse: string[];
  dataStructures: string[];
  timeComplexity: string;
  spaceComplexity: string;
  detailedSteps: string[];
  exampleGraph: ExampleGraph;
  exampleWalkthrough: string[];
  exampleSteps?: AlgorithmExampleStep[];
  commonMistakes: string[];
  limitations: string[];
}

function buildStepGraph(
  baseNodes: ExampleGraphNode[],
  baseEdges: ExampleGraphEdge[],
  overrides: {
    start?: string;
    end?: string;
    nodeStatus?: Partial<Record<string, ExampleNodeStatus>>;
    nodeBadge?: Partial<Record<string, string>>;
    edgeStatus?: Array<{ from: string; to: string; status: ExampleEdgeStatus }>;
  } = {}
): ExampleGraph {
  const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const statusMap = new Map<string, ExampleEdgeStatus>();
  (overrides.edgeStatus ?? []).forEach(s => statusMap.set(edgeKey(s.from, s.to), s.status));

  return {
    startNode: overrides.start,
    endNode: overrides.end,
    nodes: baseNodes.map(node => ({
      ...node,
      status: overrides.nodeStatus?.[node.id] ?? 'default',
      badge: overrides.nodeBadge?.[node.id],
    })),
    edges: baseEdges.map(edge => ({
      ...edge,
      status: statusMap.get(edgeKey(edge.from, edge.to)) ?? 'default',
    })),
  };
}

const SHARED_TRAVERSAL_EXAMPLE: ExampleGraph = {
  nodes: [
    { id: 'A', label: 'A', x: 200, y: 30 },
    { id: 'B', label: 'B', x: 100, y: 105 },
    { id: 'C', label: 'C', x: 300, y: 105 },
    { id: 'D', label: 'D', x: 50, y: 190 },
    { id: 'E', label: 'E', x: 160, y: 190 },
    { id: 'F', label: 'F', x: 340, y: 190 },
  ],
  edges: [
    { from: 'A', to: 'B' },
    { from: 'A', to: 'C' },
    { from: 'B', to: 'D' },
    { from: 'B', to: 'E' },
    { from: 'C', to: 'F' },
  ],
  startNode: 'A',
};

const DIJKSTRA_EXAMPLE: ExampleGraph = {
  nodes: [
    { id: 'A', label: 'A', x: 60, y: 120 },
    { id: 'B', label: 'B', x: 170, y: 40 },
    { id: 'C', label: 'C', x: 170, y: 200 },
    { id: 'D', label: 'D', x: 290, y: 120 },
    { id: 'E', label: 'E', x: 380, y: 120 },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'C', weight: 2 },
    { from: 'B', to: 'C', weight: 1 },
    { from: 'B', to: 'D', weight: 5 },
    { from: 'C', to: 'D', weight: 8 },
    { from: 'D', to: 'E', weight: 3 },
  ],
  startNode: 'A',
  endNode: 'E',
  highlightedPath: ['A', 'C', 'B', 'D', 'E'],
};

const ASTAR_EXAMPLE: ExampleGraph = {
  nodes: [
    { id: 'A', label: 'A', x: 60, y: 120 },
    { id: 'B', label: 'B', x: 180, y: 50 },
    { id: 'C', label: 'C', x: 180, y: 190 },
    { id: 'D', label: 'D', x: 330, y: 120 },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'C', weight: 2 },
    { from: 'B', to: 'D', weight: 4 },
    { from: 'C', to: 'D', weight: 5 },
  ],
  startNode: 'A',
  endNode: 'D',
  highlightedPath: ['A', 'C', 'D'],
};

const BELLMAN_EXAMPLE: ExampleGraph = {
  nodes: [
    { id: 'A', label: 'A', x: 60, y: 120 },
    { id: 'B', label: 'B', x: 190, y: 50 },
    { id: 'C', label: 'C', x: 190, y: 190 },
    { id: 'D', label: 'D', x: 330, y: 120 },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 4, directed: true },
    { from: 'A', to: 'C', weight: 5, directed: true },
    { from: 'B', to: 'C', weight: -3, directed: true },
    { from: 'B', to: 'D', weight: 4, directed: true },
    { from: 'C', to: 'D', weight: 1, directed: true },
  ],
  startNode: 'A',
  highlightedPath: ['A', 'B', 'C', 'D'],
};

const FLOYD_EXAMPLE: ExampleGraph = {
  nodes: [
    { id: 'A', label: 'A', x: 80, y: 60 },
    { id: 'B', label: 'B', x: 320, y: 60 },
    { id: 'C', label: 'C', x: 80, y: 190 },
    { id: 'D', label: 'D', x: 320, y: 190 },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 3 },
    { from: 'A', to: 'C', weight: 5 },
    { from: 'B', to: 'D', weight: 2 },
    { from: 'C', to: 'D', weight: 1 },
    { from: 'A', to: 'D', weight: 9 },
  ],
};

const KRUSKAL_EXAMPLE: ExampleGraph = {
  nodes: [
    { id: 'A', label: 'A', x: 60, y: 120 },
    { id: 'B', label: 'B', x: 170, y: 40 },
    { id: 'C', label: 'C', x: 290, y: 40 },
    { id: 'D', label: 'D', x: 170, y: 200 },
    { id: 'E', label: 'E', x: 290, y: 200 },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 2 },
    { from: 'A', to: 'D', weight: 5 },
    { from: 'B', to: 'C', weight: 1 },
    { from: 'B', to: 'D', weight: 4 },
    { from: 'C', to: 'E', weight: 3 },
    { from: 'D', to: 'E', weight: 6 },
  ],
  highlightedEdges: [
    { from: 'B', to: 'C' },
    { from: 'A', to: 'B' },
    { from: 'C', to: 'E' },
    { from: 'B', to: 'D' },
  ],
};

const PRIM_EXAMPLE: ExampleGraph = {
  nodes: [
    { id: 'A', label: 'A', x: 60, y: 120 },
    { id: 'B', label: 'B', x: 170, y: 40 },
    { id: 'C', label: 'C', x: 290, y: 40 },
    { id: 'D', label: 'D', x: 170, y: 200 },
    { id: 'E', label: 'E', x: 290, y: 200 },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 2 },
    { from: 'A', to: 'D', weight: 5 },
    { from: 'B', to: 'C', weight: 1 },
    { from: 'B', to: 'D', weight: 4 },
    { from: 'C', to: 'E', weight: 3 },
    { from: 'D', to: 'E', weight: 6 },
  ],
  startNode: 'A',
  highlightedEdges: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'E' },
    { from: 'B', to: 'D' },
  ],
};

const EXPLANATIONS_SQ: Record<AlgorithmType, AlgorithmExplanation> = {
  bfs: {
    id: 'bfs',
    name: 'Kerkimi ne Gjeresi (BFS)',
    shortSummary:
      '*BFS* eksploron grafin **nivel pas niveli** duke perdorur nje **radhe (queue)**, duke vizituar te gjithe fqinjet para se te shkoje me thelle.',
    bulletPoints: [
      'Perdor radhe (queue) si strukture kryesore.',
      'Viziton nyjet nivel pas niveli, nga me e afertja te me e larga.',
      'Gjen rrugen me te shkurter ne grafe pa pesha.',
      'Kompleksiteti kohor: O(V + E).',
    ],
    theory:
      '*BFS* (Breadth-First Search) eshte nje algoritem klasik per **kalimin e grafit**. Ai e perpunon grafin si "shtresa": fillon nga nje **nyje burim** dhe me radhe i viziton te gjithe fqinjet e drejtperdrejte, pastaj fqinjet e fqinjeve, e keshtu me radhe. Ky rend i jep BFS-se nje garanci te fuqishme: ne nje **graf pa pesha**, rruga nga burimi te cdo nyje e arritshme eshte gjithmone me **me pak brinje te mundshme**.',
    overview:
      'Algoritmi mban nje **radhe** me nyjet qe duhen perpunuar dhe nje **grup** me nyjet e vizituara. Ne cdo hap, nxjerr **nyjen e pare** nga radha, shenon te gjithe fqinjet e saj te pavizituar si "te zbuluar" dhe i shton ne **fund te radhes**. Rendi *FIFO* siguron qe asnje nyje ne nivelin `k+1` te perpunohet para nje nyje ne nivelin `k`.',
    whenToUse: [
      'Gjetja e rruges me te shkurter ne grafe pa pesha.',
      'Kontrolli i lidhshmerise se grafit dhe komponenteve te lidhura.',
      'Llogaritja e distancave (numri i brinjeve) nga nje nyje fillestare.',
      'Kalim sipas niveleve ne peme dhe ne grafe te pergjithshem.',
    ],
    dataStructures: [
      'Radhe (queue) FIFO per nyjet qe duhen vizituar.',
      'Grup (set) ose tabele booleane per te shenuar nyjet e vizituara.',
      'Tabela e prinderve per te rindertuar rrugen pas perfundimit.',
    ],
    timeComplexity: 'O(V + E) — cdo nyje dhe cdo brinje perpunohen nje here.',
    spaceComplexity: 'O(V) — radha dhe tabela e vizituara mbajne deri ne V nyje.',
    detailedSteps: [
      'Shto nyjen fillestare ne radhe dhe shenoje si te vizituar.',
      'Sa kohe qe radha nuk eshte e zbrazet, hiq nyjen e pare u.',
      'Per cdo fqinj v te pavizituar te u: shenoje v si te vizituar, ruaj prind[v] = u, shto v ne fund te radhes.',
      'Perserit derisa radha te zbrazet.',
      'Per rikrijim te rruges, ndiq tabelen e prinderve mbrapsht nga destinacioni te fillimi.',
    ],
    exampleGraph: SHARED_TRAVERSAL_EXAMPLE,
    exampleWalkthrough: [
      'Fillojme nga A. Radha: [A], vizituar: {A}.',
      'Heqim A. Shtojme fqinjet B dhe C. Radha: [B, C], vizituar: {A,B,C}.',
      'Heqim B. Shtojme D dhe E. Radha: [C, D, E], vizituar: {A,B,C,D,E}.',
      'Heqim C. Shtojme F. Radha: [D, E, F], vizituar: {A,B,C,D,E,F}.',
      'Heqim D, E, F (pa fqinje te rinj). Algoritmi perfundon.',
      'Rendi i vizites: A → B → C → D → E → F. Te gjitha distancat jane sipas numrit te brinjeve.',
    ],
    commonMistakes: [
      'Te perdoresh stack ne vend te radhes — kjo e shnderron BFS-ne ne DFS.',
      'Te shenosh nyjen si te vizituar kur del nga radha (jo kur futet) — kjo mund te coje ne perpunime te dyfishta.',
      'Te aplikohet ne grafe me pesha duke pritur rrugen me te shkurter sipas peshes — BFS injoron peshat.',
    ],
    limitations: [
      'Nuk merr parasysh peshat e brinjeve; per pesha jo-negative perdor Dijkstra.',
      'Mund te konsumoje shume memorie ne grafe te gjere (degezim i larte).',
    ],
  },
  dfs: {
    id: 'dfs',
    name: 'Kerkimi ne Thellesi (DFS)',
    shortSummary:
      '*DFS* zbret sa **me thelle** ne nje dege para se te kthehet prapa, duke perdorur **stack** ose **rekursion**.',
    bulletPoints: [
      'Perdor stack (ose rekursion) si strukture kryesore.',
      'Eksploron nje dege deri ne fund, pastaj kthehet prapa.',
      'I dobishem per cikle, renditje topologjike dhe SCC.',
      'Kompleksiteti kohor: O(V + E).',
    ],
    theory:
      '*DFS* (Depth-First Search) ndjek strategjine **LIFO**: ben hapin tjeter sa me thelle qe te mundet ne nje dege para se te ktheje pas. Mund te implementohet me **rekursion** (stack i implicit i thirrjeve) ose me nje **stack te qarte**. DFS pasqyron menyren se si njerezit eksplorojne labirinthet — provo nje korridor, nese mbyll, kthehu dhe provo tjetrin.',
    overview:
      'Filloni nga nje **nyje burim**. Vizitoni ate dhe me pas thirrni **rekursivisht** DFS per fqinjet e pavizituar. Nese arrini ne nje nyje pa fqinje te pavizituar, *back-track* — ktheheni te thirrja paraardhese. Ky model ben qe DFS te jete shume i pershtatshem per **zbulim ciklesh** dhe per algoritme te avancuara.',
    whenToUse: [
      'Detektim i cikleve ne nje graf.',
      'Renditje topologjike ne grafe te orientuar aciklik (DAG).',
      'Gjetje e komponenteve te lidhura fuqimisht (Tarjan, Kosaraju).',
      'Eksplorim i te gjitha rrugeve te mundshme (backtracking).',
    ],
    dataStructures: [
      'Stack LIFO (i qarte ose stack i rekursionit).',
      'Tabela e vizituara per te shmangur perserish te njejtat nyje.',
      'Tabela e prinderve per rindertim rrugesh ose ndertim peme DFS.',
    ],
    timeComplexity: 'O(V + E) — cdo nyje dhe brinje perpunohen nje here.',
    spaceComplexity: 'O(V) — thellesia e stack-ut mund te arrije V ne rastin me te keq.',
    detailedSteps: [
      'Shenoje nyjen fillestare si te vizituar.',
      'Per cdo fqinj te pavizituar, thirr DFS rekursivisht.',
      'Kur nuk ka me fqinje te pavizituar, kthehu prapa te thirrja paraardhese.',
      'Mund te ruash kohen e fillimit dhe te perfundimit per analiza te metejshme.',
    ],
    exampleGraph: { ...SHARED_TRAVERSAL_EXAMPLE, visitedOrder: ['A', 'B', 'D', 'E', 'C', 'F'] },
    exampleWalkthrough: [
      'Fillojme nga A. Stack: [A], vizituar: {A}.',
      'Shkojme te B (fqinji i pare i A). Stack: [A, B].',
      'Nga B, shkojme te D. Stack: [A, B, D]. D nuk ka fqinje te pavizituar — kthehemi te B.',
      'Nga B, shkojme te E. Stack: [A, B, E]. E nuk ka fqinje te pavizituar — kthehemi te B → A.',
      'Nga A, shkojme te C. Stack: [A, C]. Pastaj te F. Stack: [A, C, F].',
      'Te gjitha nyjet jane vizituar. Rendi DFS: A → B → D → E → C → F.',
    ],
    commonMistakes: [
      'Te pritet rruga me e shkurter — DFS nuk e garanton ate.',
      'Te harrohet shenimi i nyjes si te vizituar — krijon cikle te pafundme.',
      'Te perdoret pa kontrolluar stack overflow per grafe me thellesi te madhe.',
    ],
    limitations: [
      'Nuk garanton rrugen me te shkurter.',
      'Mund te shkaktoje stack overflow ne implementime rekursive te thelle.',
    ],
  },
  dijkstra: {
    id: 'dijkstra',
    name: 'Algoritmi i Dijkstra-s',
    shortSummary:
      '*Dijkstra* gjen **rrugen me te shkurter** nga nje burim ne nje graf me **pesha jo-negative** duke perdorur **radhe me prioritet**.',
    bulletPoints: [
      'Perdor radhe me prioritet (priority queue / min-heap).',
      'Funksionon vetem me pesha jo-negative.',
      'Ne cdo hap zgjedh nyjen me distance minimale te papercaktuar.',
      'Kompleksiteti kohor: O((V + E) log V).',
    ],
    theory:
      'Algoritmi i *Dijkstra-s* eshte nje algoritem **"lakmitar" (greedy)** qe gjen rrugen me te shkurter nga nje nyje burim drejt te gjitha nyjeve te tjera. Ai mban nje **tabele distancash**, fillon te gjitha distancat me **infinit** (pervec burimit qe ka distance `0`) dhe perserit nje proces **"relaksimi"**: per cdo brinje `(u, v)` me peshe `w`, nese `dist[u] + w < dist[v]`, perditeso `dist[v]`. Per shkak te zgjedhjes lakmitare, distancat e finalizuara **nuk mund te ulen me tej** kur peshat jane jo-negative.',
    overview:
      'Mbaj nje **radhe me prioritet** me celes distancen aktuale. Nxirr nyjen me **distance me te vogel**, **finalizoje** dhe **relaksoje** cdo brinje qe del prej saj. Perserit derisa radha te zbrazet ose te arrish **destinacionin**.',
    whenToUse: [
      'Rrjete rrugesh, hartografi dhe rutim ne internet.',
      'Llogaritja e shtegut me te lire kur peshat jane jo-negative (kosto, kohe, distance).',
      'Si nje komponent ne algoritme me te medha (p.sh. A* me heuristike 0).',
    ],
    dataStructures: [
      'Radhe me prioritet (min-heap) per zgjedhjen e nyjes me distance me te vogel.',
      'Tabela e distancave dist[v].',
      'Tabela e prinderve prev[v] per rindertim rruge.',
      'Grup i nyjeve te vizituara (te finalizuara).',
    ],
    timeComplexity: 'O((V + E) log V) me binary heap.',
    spaceComplexity: 'O(V) per tabelat dhe radhen me prioritet.',
    detailedSteps: [
      'Inicializo dist[start] = 0 dhe dist[v] = ∞ per cdo nyje tjeter.',
      'Shto (start, 0) ne radhen me prioritet.',
      'Sa kohe qe radha s\'eshte e zbrazet: pop nyjen u me distance me te vogel.',
      'Per cdo brinje (u, v) me peshe w: nese dist[u] + w < dist[v], perditeso dist[v] = dist[u] + w, prev[v] = u, shto (v, dist[v]) ne radhe.',
      'Kur arrish destinacionin (ose radha zbrazet), rindertoj rrugen permes prev[].',
    ],
    exampleGraph: DIJKSTRA_EXAMPLE,
    exampleWalkthrough: [
      'Fillim: dist[A]=0; te tjeret = ∞. Radha: [(A,0)].',
      'Pop A. Relaksim: dist[B]=4, dist[C]=2. Radha: [(C,2), (B,4)].',
      'Pop C. dist[B] mbetet 4 (2+1=3 me i mire → dist[B]=3, prev[B]=C). dist[D] = 2+8 = 10.',
      'Pop B (dist=3). dist[D] = 3+5 = 8 (me i mire se 10). prev[D]=B.',
      'Pop D (dist=8). dist[E] = 8+3 = 11. prev[E]=D.',
      'Pop E. Algoritmi perfundon. Rruga me e shkurter A → E: A → C → B → D → E me peshe 11.',
    ],
    commonMistakes: [
      'Te perdoret me pesha negative — Dijkstra mund te jape rezultate te gabuara.',
      'Te shenosh nyjen si te finalizuar para se ta heqesh nga radha — sjell rrugime te gabuara.',
      'Te ndalosh ne nyjen e gabuar (vetem kur del destinacioni nga radha, ai finalizohet).',
    ],
    limitations: [
      'Kerkon pesha jo-negative.',
      'Per gjithe ciftet eshte me efikase Floyd-Warshall (ne grafe te dendur) ose Dijkstra nga cdo nyje (ne grafe te shperhapur).',
    ],
  },
  'a-star': {
    id: 'a-star',
    name: 'Algoritmi A*',
    shortSummary:
      'A* eshte **Dijkstra + heuristike**: zgjedh nyjet sipas `f(n) = g(n) + h(n)` per t\'iu afruar me shpejt qellimit.',
    bulletPoints: [
      'Kombinon koston aktuale g(n) me vleresimin heuristik h(n).',
      'Me heuristike te pranueshme, gjen rrugen optimale.',
      'Me i shpejte se Dijkstra kur ka heuristike te mire.',
      'Funksionon vetem me pesha jo-negative.',
    ],
    theory:
      'A* eshte nje algoritem i **informuar** i kerkimit qe perdor nje **heuristike** `h(n)` — nje vleresim te kostos se mbetur nga `n` drejt qellimit. Cdo nyje renditet sipas `f(n) = g(n) + h(n)`, ku `g(n)` eshte **kostoja reale** nga burimi. Nese heuristika eshte **"e pranueshme"** (nuk e mbivlereson kurre koston e vertete), A* **garanton** gjetjen e rruges me te shkurter. Me heuristike `0`, A* sillet identikisht me *Dijkstra*.',
    overview:
      'Mbaj nje **radhe me prioritet** me celes `f(n)`. Nxirr nyjen me `f` me te vogel, **relaksoj** fqinjet sipas `g + h`. Kur arrin **qellimin**, rikrijo rrugen.',
    whenToUse: [
      'Gjetje rruge ne harta dhe navigim (Google Maps style).',
      'AI ne lojra (pathfinding ne grid).',
      'Probleme me hapesire te madhe gjendjesh por me nje heuristike te dobishme.',
    ],
    dataStructures: [
      'Radhe me prioritet me celes f(n) = g(n) + h(n).',
      'Tabela gScore[v] dhe fScore[v].',
      'Tabela e prinderve per rindertim rruge.',
    ],
    timeComplexity: 'Varet nga heuristika; me heuristike te plote O(d), me heuristike 0 si Dijkstra.',
    spaceComplexity: 'O(V) ne rastin me te keq — mund te ruaje shume nyje ne open-set.',
    detailedSteps: [
      'Inicializo gScore[start]=0, fScore[start]=h(start).',
      'Shto start ne open-set me celes f=h(start).',
      'Pop nyjen u me f me te vogel.',
      'Nese u = qellimi, rindertoj rrugen permes prev[].',
      'Per cdo fqinj v te u: nese g_provisore = gScore[u] + w < gScore[v], perditeso gScore[v], fScore[v] = gScore[v] + h(v), prev[v]=u.',
      'Perserit derisa qellimi te gjendet ose open-set te zbrazet.',
    ],
    exampleGraph: ASTAR_EXAMPLE,
    exampleWalkthrough: [
      'Burimi A, qellimi D. Supozojme heuristike h(A)=6, h(B)=4, h(C)=5, h(D)=0.',
      'f(A) = 0 + 6 = 6. Open: {A}.',
      'Pop A. Fqinjet: B (g=4, f=4+4=8), C (g=2, f=2+5=7).',
      'Pop C (f=7). Fqinj: D (g=2+5=7, f=7+0=7).',
      'Pop D — qellimi i arritur. Rruga A → C → D, kosto 7.',
      'Verejmë qe B nuk u zgjerua, sepse f(C) ishte me e vogel — heuristika fokusoj kerkimin.',
    ],
    commonMistakes: [
      'Te perdoret heuristike jo e pranueshme (mbivleresuese) — rezultati mund te mos jete optimal.',
      'Te perdoret me pesha negative — A* deshton, si Dijkstra.',
      'Te konsiderohet nje nyje "perfunduar" pa e nxjerre nga open-set.',
    ],
    limitations: [
      'Kerkon nje heuristike te mire per te qene me i shpejte se Dijkstra.',
      'Konsumon memorie te ndjeshme per probleme te medha.',
      'Kerkon pesha jo-negative.',
    ],
  },
  'bellman-ford': {
    id: 'bellman-ford',
    name: 'Algoritmi Bellman-Ford',
    shortSummary:
      '*Bellman-Ford* llogarit rruget me te shkurtra **edhe me pesha negative** dhe **detekton cikle** me peshe negative.',
    bulletPoints: [
      'Relakson cdo brinje V - 1 here.',
      'Suporton pesha negative.',
      'Detekton cikle me peshe negative ne nje hap shtese.',
      'Kompleksiteti kohor: O(V · E).',
    ],
    theory:
      '*Bellman-Ford* bazohet ne nje rezultat te thjeshte: ne nje graf pa cikle negative, cdo rruge me e shkurter ka **me se shumti `V - 1` brinje**. Duke relaksuar cdo brinje `V - 1` here, garantohet qe te gjitha distancat te konvergjojne. Nese ne nje hap te `V`-te ndodh **ende relaksim**, kjo do te thote qe ka nje **cikel me peshe negative**.',
    overview:
      'Inicializo `dist[start]=0`, te tjeret = `∞`. Per `i` nga `1` ne `V-1`, kalo neper te gjitha brinjet dhe **relaksoji**. Pas perfundimit, nese ende ka relaksim ne **pasimin e V-te**, ka **cikel negativ**.',
    whenToUse: [
      'Grafe me pesha negative (p.sh. arbitrazh valutor).',
      'Detektim ciklesh me peshe negative.',
      'Si komponent ne algoritme te tjera (p.sh. Johnson-Algorithm per all-pairs).',
    ],
    dataStructures: [
      'Lista e brinjeve.',
      'Tabela e distancave dist[v].',
      'Tabela e prinderve prev[v].',
    ],
    timeComplexity: 'O(V · E) — V-1 iteracione, secili kalim mbi te gjitha brinjet.',
    spaceComplexity: 'O(V).',
    detailedSteps: [
      'Inicializo dist[start] = 0, dist[v] = ∞ per cdo nyje tjeter.',
      'Per i = 1 ne V - 1, perserit:',
      '  Per cdo brinje (u, v, w): nese dist[u] + w < dist[v], perditeso dist[v] dhe prev[v].',
      'Pas iteracioneve, ben nje pasim shtese; nese ende ka relaksim, raporto cikel negativ.',
    ],
    exampleGraph: BELLMAN_EXAMPLE,
    exampleWalkthrough: [
      'Fillim: dist[A]=0, dist[B]=dist[C]=dist[D]=∞.',
      'Iteracioni 1: relaksim mbi te gjitha brinjet. dist[B]=4, dist[C]=5, dist[D] mund te bije te 4+4=8 ose 5+1=6.',
      'Iteracioni 2: brinja B→C me peshe -3 jep dist[C] = 4 + (-3) = 1. Pastaj dist[D] = 1 + 1 = 2.',
      'Iteracioni 3: nuk ka me ndryshime — algoritmi mund te ndalet heret.',
      'Rezultat: dist[A]=0, dist[B]=4, dist[C]=1, dist[D]=2. Pa cikle negative.',
    ],
    commonMistakes: [
      'Te harrohet pasimi i V-te per detektim te ciklit negativ.',
      'Te perdoret kur Dijkstra mjafton — Bellman-Ford eshte O(V·E), me i ngadalshem.',
      'Te keqkuptohet shenja: cikel me peshe pozitive ≠ cikel negativ.',
    ],
    limitations: [
      'Me i ngadalshem se Dijkstra kur peshat jane jo-negative.',
      'Ne prezence te cikleve negative te arritshme, distancat nuk jane te perkufizuara (∞ ne -∞).',
    ],
  },
  'floyd-warshall': {
    id: 'floyd-warshall',
    name: 'Algoritmi Floyd-Warshall',
    shortSummary:
      '*Floyd-Warshall* llogarit rruget me te shkurtra **per cdo cift nyjesh** duke perdorur **programim dinamik** mbi matricen e distancave.',
    bulletPoints: [
      'All-pairs shortest path ne nje algoritem te vetem.',
      'Perdor programim dinamik me 3 cikle te brendshem.',
      'Suporton pesha negative (pa cikle negative).',
      'Kompleksiteti kohor: O(V³).',
    ],
    theory:
      '*Floyd-Warshall* bazohet ne nje ide te thjeshte: rruga me e shkurter nga `i` ne `j` permes **nyjes se ndermjetme** `k` eshte me e mire nese `dist[i][k] + dist[k][j] < dist[i][j]`. Duke perseritur kete kontroll per cdo `k` nga `1` ne `V` dhe per cdo cift `(i, j)`, arrijme matricen e plote te distancave. Ky eshte nje shembull klasik i **programimit dinamik**.',
    overview:
      'Inicializo matricen e distancave me peshat e brinjeve (`∞` kur nuk ka brinje). Pastaj per cdo `k`, per cdo `i`, per cdo `j`: `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`.',
    whenToUse: [
      'Kur duhet matrica e plote e distancave me nje pasim.',
      'Grafe te vegjel ose mesatare te dendur (V ≤ ~500).',
      'Llogaritje e mbylljes transitive (reachability).',
      'Detektim ciklesh negative (nese dist[i][i] < 0 per ndonje i).',
    ],
    dataStructures: [
      'Matrice 2D e distancave (V × V).',
      'Opsionale: matrice 2D e nyjeve te ndermjetme per rindertim rrugesh.',
    ],
    timeComplexity: 'O(V³) — tre cikle te brendshem.',
    spaceComplexity: 'O(V²) per matricen e distancave.',
    detailedSteps: [
      'Inicializo dist[i][i] = 0 dhe dist[i][j] = peshe e brinjes (i, j) ose ∞.',
      'Per k = 1 ne V: per i = 1 ne V: per j = 1 ne V:',
      '  Nese dist[i][k] + dist[k][j] < dist[i][j], perditeso dist[i][j].',
      'Pas perfundimit, dist[i][j] eshte rruga me e shkurter nga i te j.',
      'Per cikle negative: nese ekziston i me dist[i][i] < 0, ka cikel negativ.',
    ],
    exampleGraph: FLOYD_EXAMPLE,
    exampleWalkthrough: [
      'Matrica fillestare ka 3, 5, 9, 2, 1 si peshat direkte; cdo gje tjeter ∞.',
      'Me k = A: distancat e tjera nuk ulen permes A.',
      'Me k = B: dist[A][D] mund te ulet permes B: 3 + 2 = 5 (me i mire se 9). Perditeso.',
      'Me k = C: dist[A][D] permes C: 5 + 1 = 6. Aktuali eshte 5, nuk perditesohet.',
      'Me k = D: distancat jane finalizuar.',
      'Rezultat: dist[A][D] = 5 (A → B → D), dist[A][C] = 5, dist[B][C] = 3 (B → D → C).',
    ],
    commonMistakes: [
      'Te perdoret per grafe te medha (V³ behet i papranueshem).',
      'Te harrohet kontrolli i cikleve negative (dist[i][i] < 0).',
      'Te perdoret matrice me 0 ne vend te ∞ per brinje qe nuk ekzistojne.',
    ],
    limitations: [
      'O(V³) eshte i ngadalshem per grafe te medha.',
      'Konsumon O(V²) memorie.',
      'Nuk jep rezultat te dobishem ne prezence ciklesh negative pa kontroll shtese.',
    ],
  },
  kruskal: {
    id: 'kruskal',
    name: 'Algoritmi i Kruskal-it',
    shortSummary:
      '*Kruskal* nderton **Pemen Minimale Shtrirese (MST)** duke shtuar gradualisht **brinjet me peshen me te vogel** pa formuar cikle.',
    bulletPoints: [
      'Rendit te gjitha brinjet sipas peshes ne rritje.',
      'Perdor Union-Find per te shmangur ciklet.',
      'Funksionon vetem ne grafe te paorientuar te lidhur.',
      'Kompleksiteti kohor: O(E log E).',
    ],
    theory:
      '*Kruskal* ndjek nje strategji **lakmitare globale**: rendit te gjitha brinjet sipas peshes dhe i shton nje per nje, duke kapercyer ato qe do te krijonin nje **cikel**. Per te detektuar ciklet ne menyre efikase, perdor **Union-Find** (Disjoint Set Union — DSU). Nje MST per nje graf me `V` nyje ka **saktesisht `V - 1` brinje**.',
    overview:
      'Rendit brinjet. Inicializo **DSU** me cdo nyje ne grupin e vet. Per cdo brinje `(u, v)` sipas rendit: nese `u` dhe `v` jane ne **grupe te ndryshme**, bashkoji dhe shtoje brinjen ne MST. Ndaloji kur ke `V - 1` brinje.',
    whenToUse: [
      'Grafe te shperhapur ku numri i brinjeve nuk eshte shume i madh.',
      'Ndertim rrjetesh komunikimi me kosto minimale (kabllo, elektricitet).',
      'Clustering hierarkik (single-linkage).',
    ],
    dataStructures: [
      'Lista e brinjeve, e renditur sipas peshes.',
      'Union-Find (Disjoint Set Union) per kontroll cikle.',
      'Lista e brinjeve te MST-se.',
    ],
    timeComplexity: 'O(E log E) — dominanca eshte renditja e brinjeve.',
    spaceComplexity: 'O(V + E).',
    detailedSteps: [
      'Mblidh te gjitha brinjet dhe renditi sipas peshes ne rritje.',
      'Inicializo DSU: cdo nyje eshte ne grupin e vet.',
      'Per cdo brinje (u, v) sipas rendit: nese find(u) ≠ find(v), shtoje brinjen ne MST dhe ben union(u, v).',
      'Ndaloj kur MST ka V - 1 brinje ose lista e brinjeve mbaron.',
    ],
    exampleGraph: KRUSKAL_EXAMPLE,
    exampleWalkthrough: [
      'Renditja e brinjeve: B-C(1), A-B(2), C-E(3), B-D(4), A-D(5), D-E(6).',
      'B-C(1): grupe te ndryshme → shto. MST = {B-C}.',
      'A-B(2): A dhe B ne grupe te ndryshme → shto. MST = {B-C, A-B}.',
      'C-E(3): grupe te ndryshme → shto. MST = {B-C, A-B, C-E}.',
      'B-D(4): grupe te ndryshme → shto. MST = {B-C, A-B, C-E, B-D}. Tashme kemi V-1 = 4 brinje.',
      'Pesha totale e MST: 1 + 2 + 3 + 4 = 10.',
    ],
    commonMistakes: [
      'Te perdoret ne graf te orientuar — Kruskal kerkon graf te paorientuar.',
      'Te harrohet kontrolli i ciklit (pa DSU shfaqen cikle).',
      'Te ndalohet para se MST te kete V-1 brinje.',
    ],
    limitations: [
      'Funksionon vetem ne grafe te paorientuar.',
      'Per grafe te dendur, Prim mund te jete me efikas.',
      'Kerkon qe grafi te jete i lidhur per nje MST te plote.',
    ],
  },
  prim: {
    id: 'prim',
    name: 'Algoritmi i Prim-it',
    shortSummary:
      '*Prim* rrit MST-ne nga nje **nyje fillestare** duke shtuar gjithmone **brinjen me te lehte** qe lidh nje nyje te re.',
    bulletPoints: [
      'Fillon nga nje nyje dhe rrit nje peme te vetme.',
      'Perdor radhe me prioritet per zgjedhjen e brinjes me te lehte.',
      'Funksionon vetem ne grafe te paorientuar te lidhur.',
      'Kompleksiteti kohor: O(E log V).',
    ],
    theory:
      '*Prim* eshte gjithashtu nje algoritem **lakmitar**, por strategjia eshte **lokale**: ne cdo hap, zgjeron MST-ne ne ndertim duke shtuar nyjen me te re te lidhur me **brinjen me te lehte**. Kjo e ben Prim **strukturalisht te ngjashem** me *Dijkstra-n* — qe te dy rrisin nje **"kufi" nyjesh** duke perdorur **radhe me prioritet**.',
    overview:
      'Inicializo nje grup **"ne peme"** me nje nyje fillestare. Mbaj nje **radhe me prioritet** me brinjet qe dalin nga grupi. Nxirr brinjen me peshen me te vogel; nese te con ne **nyje te re**, shtoje. Perserit derisa **te gjitha nyjet** te jene ne peme.',
    whenToUse: [
      'Grafe te dendur ku numri i brinjeve eshte i madh.',
      'Kur grafi jepet me liste fqinjesie.',
      'Ndertim MST-ne kur kemi nje nyje fillestare natyrale.',
    ],
    dataStructures: [
      'Radhe me prioritet (min-heap) me celes peshen e brinjeve kandidate.',
      'Tabela e nyjeve qe jane ne peme.',
      'Tabela e brinjeve te MST-se.',
    ],
    timeComplexity: 'O(E log V) me binary heap.',
    spaceComplexity: 'O(V + E).',
    detailedSteps: [
      'Inicializo: shto nyjen fillestare ne grupin "ne peme".',
      'Shto te gjitha brinjet qe dalin nga nyja fillestare ne radhen me prioritet.',
      'Pop brinjen me peshen me te vogel (u, v).',
      'Nese v eshte ne peme, hidh tutje.',
      'Perndryshe: shto v ne peme, shto brinjen (u, v) ne MST, shto te gjitha brinjet e v-se ne radhe.',
      'Perserit derisa te gjitha nyjet te jene ne peme.',
    ],
    exampleGraph: PRIM_EXAMPLE,
    exampleWalkthrough: [
      'Fillim: A ne peme. Radha: A-B(2), A-D(5).',
      'Pop A-B(2). Shto B. MST = {A-B}. Shto B-C(1), B-D(4) ne radhe.',
      'Pop B-C(1). Shto C. MST = {A-B, B-C}. Shto C-E(3).',
      'Pop C-E(3). Shto E. MST = {A-B, B-C, C-E}. Shto E-D(6).',
      'Pop B-D(4). Shto D. MST = {A-B, B-C, C-E, B-D}.',
      'Te gjitha nyjet jane ne peme. Pesha totale = 2 + 1 + 3 + 4 = 10.',
    ],
    commonMistakes: [
      'Te perdoret ne graf te orientuar.',
      'Te harrohet kontrolli nese nyja tjeter eshte tashme ne peme.',
      'Te perdoret pa nyje fillestare (Prim e kerkon nje nyje fillestare).',
    ],
    limitations: [
      'Funksionon vetem ne grafe te paorientuar.',
      'Kerkon qe grafi te jete i lidhur per nje MST te plote.',
      'Per grafe te shperhapur, Kruskal mund te jete me i thjeshte.',
    ],
  },
};

const EXPLANATIONS_EN: Record<AlgorithmType, AlgorithmExplanation> = {
  bfs: {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    shortSummary:
      'BFS explores the graph layer by layer using a queue, visiting all neighbours before going deeper.',
    bulletPoints: [
      'Uses a FIFO queue as its core data structure.',
      'Visits nodes level by level from the start node.',
      'Finds shortest paths in unweighted graphs.',
      'Time complexity: O(V + E).',
    ],
    theory:
      'BFS is a classic graph traversal that processes the graph in "layers": starting from a source node, it visits all direct neighbours first, then their neighbours, and so on. This ordering gives BFS a strong guarantee: in an unweighted graph, the path from source to any reachable node uses the fewest possible edges.',
    overview:
      'Maintain a queue of nodes to process and a set of visited nodes. At each step, dequeue the front node, mark all unvisited neighbours as discovered and enqueue them. The FIFO order ensures no node at level k+1 is processed before any node at level k.',
    whenToUse: [
      'Shortest path in unweighted graphs.',
      'Connectivity and connected-component analysis.',
      'Distance (edge count) from a start node.',
      'Level-order traversal of trees and graphs.',
    ],
    dataStructures: [
      'FIFO queue for nodes to visit.',
      'Visited set or boolean array.',
      'Parent table for path reconstruction.',
    ],
    timeComplexity: 'O(V + E) — every node and edge is processed once.',
    spaceComplexity: 'O(V) for the queue and visited set.',
    detailedSteps: [
      'Enqueue the source node and mark it visited.',
      'While the queue is not empty, dequeue node u.',
      'For each unvisited neighbour v of u: mark v visited, store parent[v] = u, enqueue v.',
      'Repeat until the queue is empty.',
      'To reconstruct a path, walk back from the target via parent[].',
    ],
    exampleGraph: SHARED_TRAVERSAL_EXAMPLE,
    exampleWalkthrough: [
      'Start from A. Queue: [A], visited: {A}.',
      'Dequeue A. Add neighbours B and C. Queue: [B, C].',
      'Dequeue B. Add D and E. Queue: [C, D, E].',
      'Dequeue C. Add F. Queue: [D, E, F].',
      'Dequeue D, E, F (no new neighbours). Done.',
      'Visit order: A → B → C → D → E → F.',
    ],
    commonMistakes: [
      'Using a stack instead of a queue (that turns BFS into DFS).',
      'Marking a node visited when dequeued instead of when enqueued — leads to duplicates.',
      'Applying it to weighted graphs expecting shortest weighted paths — BFS ignores weights.',
    ],
    limitations: [
      'Ignores edge weights; use Dijkstra for non-negative weighted graphs.',
      'Can use a lot of memory on wide graphs (high branching factor).',
    ],
  },
  dfs: {
    id: 'dfs',
    name: 'Depth-First Search (DFS)',
    shortSummary:
      'DFS goes as deep as possible along a branch before backtracking, using a stack or recursion.',
    bulletPoints: [
      'Uses a stack (or recursion).',
      'Explores one branch to the end, then backtracks.',
      'Useful for cycles, topological sort, SCCs.',
      'Time complexity: O(V + E).',
    ],
    theory:
      'DFS follows the LIFO strategy: at each step it dives as deep as possible into a branch before backtracking. It can be implemented with recursion (implicit call stack) or an explicit stack. DFS mirrors how people explore mazes — try a corridor; if it dead-ends, back up and try another.',
    overview:
      'Start at a source node. Visit it, then recursively call DFS on each unvisited neighbour. When a node has no unvisited neighbours, back-track to the previous call.',
    whenToUse: [
      'Cycle detection.',
      'Topological sorting on DAGs.',
      'Strongly connected components (Tarjan/Kosaraju).',
      'Exhaustive path search and backtracking.',
    ],
    dataStructures: [
      'LIFO stack (explicit or recursion).',
      'Visited table.',
      'Parent table for DFS-tree reconstruction.',
    ],
    timeComplexity: 'O(V + E).',
    spaceComplexity: 'O(V) — stack depth can reach V in the worst case.',
    detailedSteps: [
      'Mark the source visited.',
      'For each unvisited neighbour, recurse.',
      'When no unvisited neighbours remain, backtrack.',
      'Optionally record start/end times for further analysis.',
    ],
    exampleGraph: { ...SHARED_TRAVERSAL_EXAMPLE, visitedOrder: ['A', 'B', 'D', 'E', 'C', 'F'] },
    exampleWalkthrough: [
      'Start from A. Stack: [A], visited: {A}.',
      'Go to B (first neighbour). Stack: [A, B].',
      'From B go to D. Stack: [A, B, D]. D has no unvisited neighbours — backtrack to B.',
      'From B go to E. Stack: [A, B, E]. Backtrack to B → A.',
      'From A go to C. Stack: [A, C]. Then F. Stack: [A, C, F].',
      'All nodes visited. DFS order: A → B → D → E → C → F.',
    ],
    commonMistakes: [
      'Expecting shortest paths — DFS does not guarantee them.',
      'Forgetting to mark visited — creates infinite loops.',
      'Recursing too deep on huge graphs — risk of stack overflow.',
    ],
    limitations: [
      'Does not guarantee shortest paths.',
      'Recursive implementation can overflow the stack.',
    ],
  },
  dijkstra: {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    shortSummary:
      "Dijkstra finds shortest paths from a source in a graph with non-negative weights using a min-priority queue.",
    bulletPoints: [
      'Uses a priority queue (min-heap).',
      'Works only with non-negative weights.',
      'At each step expands the node with smallest tentative distance.',
      'Time complexity: O((V + E) log V).',
    ],
    theory:
      "Dijkstra's algorithm is greedy. It keeps tentative distances starting at ∞ (except 0 for the source) and repeatedly relaxes edges: for every edge (u, v) with weight w, if dist[u] + w < dist[v] then update dist[v]. With non-negative weights, finalised distances never decrease again.",
    overview:
      'Maintain a min-priority queue keyed by current distance. Pop the smallest-distance node, finalise it, and relax every outgoing edge.',
    whenToUse: [
      'Road networks, mapping, internet routing.',
      'Cheapest path with non-negative weights.',
      'As a building block for A* (with h = 0).',
    ],
    dataStructures: [
      'Min-priority queue.',
      'Distance table dist[v].',
      'Parent table prev[v].',
      'Visited / finalised set.',
    ],
    timeComplexity: 'O((V + E) log V) with a binary heap.',
    spaceComplexity: 'O(V).',
    detailedSteps: [
      'Set dist[start] = 0, dist[v] = ∞ for others.',
      'Push (start, 0) on the priority queue.',
      'While the queue is non-empty: pop the smallest node u.',
      'For each edge (u, v) with weight w: if dist[u] + w < dist[v], update dist[v], set prev[v]=u, push v.',
      'Reconstruct the path through prev[] when the target is popped.',
    ],
    exampleGraph: DIJKSTRA_EXAMPLE,
    exampleWalkthrough: [
      'Init: dist[A]=0, others ∞.',
      'Pop A. Relax: dist[B]=4, dist[C]=2.',
      'Pop C. dist[B] updates to 3 via C; dist[D] becomes 10 via C.',
      'Pop B (dist=3). dist[D] becomes 3+5=8.',
      'Pop D (dist=8). dist[E] = 11.',
      'Pop E. Shortest A→E: A → C → B → D → E with cost 11.',
    ],
    commonMistakes: [
      'Using negative weights.',
      'Finalising a node before popping it from the queue.',
      'Stopping too early (the target is finalised only when popped).',
    ],
    limitations: [
      'Requires non-negative weights.',
      'For all-pairs, prefer Floyd-Warshall or repeated Dijkstra.',
    ],
  },
  'a-star': {
    id: 'a-star',
    name: 'A* Algorithm',
    shortSummary:
      'A* is Dijkstra + a heuristic: it expands nodes by f(n) = g(n) + h(n) to reach the goal faster.',
    bulletPoints: [
      'Combines actual cost g(n) and heuristic h(n).',
      'With an admissible heuristic, finds the optimal path.',
      'Faster than Dijkstra when the heuristic is good.',
      'Requires non-negative weights.',
    ],
    theory:
      'A* is an informed search using a heuristic h(n) — an estimate of the remaining cost to the goal. Nodes are ordered by f(n) = g(n) + h(n). With an admissible heuristic (never overestimating), A* is guaranteed optimal. With h ≡ 0, A* reduces to Dijkstra.',
    overview:
      'Maintain a priority queue keyed by f. Pop the smallest, relax neighbours, push them with new f-values. Reconstruct the path when the goal is popped.',
    whenToUse: [
      'Pathfinding on maps and grids.',
      'Game AI.',
      'Problems with a useful heuristic.',
    ],
    dataStructures: [
      'Priority queue keyed by f(n).',
      'gScore[v], fScore[v].',
      'Parent table.',
    ],
    timeComplexity: 'Depends on the heuristic; same worst case as Dijkstra.',
    spaceComplexity: 'O(V) in the worst case.',
    detailedSteps: [
      'Init gScore[start]=0, fScore[start]=h(start).',
      'Push start onto the open-set.',
      'Pop the node with smallest f.',
      'If it is the goal, reconstruct the path via prev[].',
      'For each neighbour v: if g_provisional = gScore[u] + w < gScore[v], update gScore[v], fScore[v]=gScore[v]+h(v), prev[v]=u.',
    ],
    exampleGraph: ASTAR_EXAMPLE,
    exampleWalkthrough: [
      'Source A, goal D, heuristic h(A)=6, h(B)=4, h(C)=5, h(D)=0.',
      'f(A) = 6. Open: {A}.',
      'Pop A. Neighbours: B (g=4, f=8), C (g=2, f=7).',
      'Pop C (f=7). Neighbour D (g=7, f=7).',
      'Pop D — goal reached. Path A → C → D, cost 7.',
      'B is never expanded because the heuristic steers the search.',
    ],
    commonMistakes: [
      'Using a non-admissible heuristic — optimality is lost.',
      'Using A* with negative weights — it fails like Dijkstra.',
      'Treating a node as finalised before popping it.',
    ],
    limitations: [
      'Needs a good heuristic to outperform Dijkstra.',
      'Memory-heavy for large problems.',
      'Requires non-negative weights.',
    ],
  },
  'bellman-ford': {
    id: 'bellman-ford',
    name: 'Bellman-Ford Algorithm',
    shortSummary:
      'Bellman-Ford computes shortest paths even with negative weights and detects negative-weight cycles.',
    bulletPoints: [
      'Relaxes every edge V - 1 times.',
      'Supports negative weights.',
      'Detects negative-weight cycles in an extra pass.',
      'Time complexity: O(V · E).',
    ],
    theory:
      'In a graph without negative cycles, any shortest path has at most V - 1 edges. Relaxing every edge V - 1 times therefore lets distances converge. If a V-th pass still relaxes an edge, a negative-weight cycle is reachable.',
    overview:
      'Initialise dist[start]=0, others ∞. Repeat V-1 times: relax every edge. Then one more pass; any relaxation indicates a negative cycle.',
    whenToUse: [
      'Graphs with negative weights (e.g. currency arbitrage).',
      'Negative-cycle detection.',
      "As a sub-routine inside Johnson's algorithm.",
    ],
    dataStructures: [
      'List of edges.',
      'Distance table dist[v].',
      'Parent table prev[v].',
    ],
    timeComplexity: 'O(V · E).',
    spaceComplexity: 'O(V).',
    detailedSteps: [
      'Init dist[start]=0, others ∞.',
      'For i from 1 to V-1: for every edge (u, v, w), if dist[u]+w < dist[v], update.',
      'Do one extra pass; if any update happens, report a negative cycle.',
    ],
    exampleGraph: BELLMAN_EXAMPLE,
    exampleWalkthrough: [
      'Init: dist[A]=0, others ∞.',
      'Iter 1: dist[B]=4, dist[C]=5, dist[D] becomes min(8, 6) = 6.',
      'Iter 2: B→C with weight -3 gives dist[C] = 1. Then dist[D] = 2.',
      'Iter 3: no changes — algorithm can stop early.',
      'Result: dist[A]=0, dist[B]=4, dist[C]=1, dist[D]=2. No negative cycle.',
    ],
    commonMistakes: [
      'Skipping the V-th pass for negative-cycle detection.',
      'Using it when Dijkstra suffices (Bellman-Ford is slower).',
      'Confusing positive-weight cycles with negative ones.',
    ],
    limitations: [
      'Slower than Dijkstra on non-negative graphs.',
      'Distances are not defined when negative cycles are reachable.',
    ],
  },
  'floyd-warshall': {
    id: 'floyd-warshall',
    name: 'Floyd-Warshall Algorithm',
    shortSummary:
      'Floyd-Warshall computes shortest paths between every pair of nodes via dynamic programming on the distance matrix.',
    bulletPoints: [
      'All-pairs shortest paths in one pass.',
      'Uses three nested loops over an intermediate node.',
      'Supports negative weights (no negative cycles).',
      'Time complexity: O(V³).',
    ],
    theory:
      'The shortest path from i to j passing through intermediate node k is better when dist[i][k] + dist[k][j] < dist[i][j]. Iterating this check for every k, i, j produces the full distance matrix — a textbook dynamic programming pattern.',
    overview:
      'Init the distance matrix from edge weights (∞ otherwise). For k from 1 to V, for i, for j: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).',
    whenToUse: [
      'When the full distance matrix is needed.',
      'Small/medium dense graphs (V ≤ ~500).',
      'Transitive closure.',
      'Negative-cycle detection (any dist[i][i] < 0).',
    ],
    dataStructures: [
      '2-D distance matrix (V × V).',
      'Optional intermediate-node matrix for path reconstruction.',
    ],
    timeComplexity: 'O(V³).',
    spaceComplexity: 'O(V²).',
    detailedSteps: [
      'Init dist[i][i]=0, dist[i][j] = edge weight or ∞.',
      'For k, i, j loop: if dist[i][k] + dist[k][j] < dist[i][j], update.',
      'After the loop, dist[i][j] is the shortest distance.',
      'For negative-cycle detection, check dist[i][i] < 0.',
    ],
    exampleGraph: FLOYD_EXAMPLE,
    exampleWalkthrough: [
      'Initial matrix uses direct edge weights and ∞ elsewhere.',
      'With k = A: no improvements via A.',
      'With k = B: dist[A][D] becomes 3 + 2 = 5 (better than 9). Update.',
      'With k = C: dist[A][D] via C would be 5 + 1 = 6 — not better.',
      'With k = D: distances are finalised.',
      'Result: dist[A][D] = 5 (A → B → D), dist[A][C] = 5, dist[B][C] = 3 (B → D → C).',
    ],
    commonMistakes: [
      'Using it on large graphs (V³ blows up).',
      'Forgetting the dist[i][i] < 0 check for negative cycles.',
      'Using 0 instead of ∞ for missing edges.',
    ],
    limitations: [
      'O(V³) is slow for big graphs.',
      'Uses O(V²) memory.',
      'Needs extra care around negative cycles.',
    ],
  },
  kruskal: {
    id: 'kruskal',
    name: "Kruskal's Algorithm",
    shortSummary:
      'Kruskal builds a Minimum Spanning Tree (MST) by adding the lightest edges that do not form a cycle.',
    bulletPoints: [
      'Sorts all edges by weight.',
      'Uses Union-Find to avoid cycles.',
      'Works only on connected undirected graphs.',
      'Time complexity: O(E log E).',
    ],
    theory:
      'Kruskal is globally greedy: sort all edges by weight and add them one by one, skipping any that would form a cycle. Cycles are detected efficiently with Union-Find. An MST of a graph with V nodes has exactly V - 1 edges.',
    overview:
      'Sort edges. Initialise DSU with one set per node. For each edge (u, v) in order: if find(u) ≠ find(v), add it to the MST and union the sets. Stop after V - 1 edges.',
    whenToUse: [
      'Sparse graphs.',
      'Network design (cables, power lines).',
      'Single-linkage hierarchical clustering.',
    ],
    dataStructures: [
      'Sorted list of edges.',
      'Union-Find / DSU.',
      'List of MST edges.',
    ],
    timeComplexity: 'O(E log E) (sorting dominates).',
    spaceComplexity: 'O(V + E).',
    detailedSteps: [
      'Collect and sort all edges by weight ascending.',
      'Init DSU: every node in its own set.',
      'For each edge (u, v) in order: if find(u) ≠ find(v), add to MST and union(u, v).',
      'Stop when MST has V - 1 edges or the list is exhausted.',
    ],
    exampleGraph: KRUSKAL_EXAMPLE,
    exampleWalkthrough: [
      'Sorted edges: B-C(1), A-B(2), C-E(3), B-D(4), A-D(5), D-E(6).',
      'B-C(1): different sets → add. MST = {B-C}.',
      'A-B(2): different sets → add. MST = {B-C, A-B}.',
      'C-E(3): different sets → add. MST = {B-C, A-B, C-E}.',
      'B-D(4): different sets → add. MST = {B-C, A-B, C-E, B-D}. We have V-1 = 4 edges.',
      'Total MST weight: 1 + 2 + 3 + 4 = 10.',
    ],
    commonMistakes: [
      'Running it on a directed graph.',
      'Skipping the cycle check (no DSU).',
      'Stopping before reaching V - 1 edges.',
    ],
    limitations: [
      'Requires undirected graphs.',
      'Prim may be faster on dense graphs.',
      'Needs the graph to be connected for a full MST.',
    ],
  },
  prim: {
    id: 'prim',
    name: "Prim's Algorithm",
    shortSummary:
      "Prim grows an MST from a starting node, always adding the lightest edge connecting a new node.",
    bulletPoints: [
      'Starts at a node and grows a single tree.',
      'Uses a priority queue for the lightest candidate edge.',
      'Works on connected undirected graphs.',
      'Time complexity: O(E log V).',
    ],
    theory:
      'Prim is also greedy but the strategy is local: at each step, extend the in-progress MST by adding the new node reached via the lightest connecting edge. Structurally Prim looks a lot like Dijkstra — both grow a frontier with a priority queue.',
    overview:
      'Init an "in-tree" set with the start node. Maintain a priority queue of edges leaving the set. Pop the lightest edge; if it leads to a new node, add it. Repeat until all nodes are in the tree.',
    whenToUse: [
      'Dense graphs.',
      'When the graph is given as an adjacency list.',
      'When there is a natural starting node.',
    ],
    dataStructures: [
      'Min-priority queue of candidate edges.',
      'In-tree set.',
      'MST edge list.',
    ],
    timeComplexity: 'O(E log V) with a binary heap.',
    spaceComplexity: 'O(V + E).',
    detailedSteps: [
      'Add the start node to the in-tree set.',
      'Push every edge leaving start onto the priority queue.',
      'Pop the smallest edge (u, v).',
      'If v is already in the tree, discard it.',
      'Otherwise add v, add edge (u, v) to the MST, push every edge from v.',
      'Repeat until every node is in the tree.',
    ],
    exampleGraph: PRIM_EXAMPLE,
    exampleWalkthrough: [
      'Start: A in tree. Queue: A-B(2), A-D(5).',
      'Pop A-B(2). Add B. MST = {A-B}. Push B-C(1), B-D(4).',
      'Pop B-C(1). Add C. MST = {A-B, B-C}. Push C-E(3).',
      'Pop C-E(3). Add E. MST = {A-B, B-C, C-E}.',
      'Pop B-D(4). Add D. MST = {A-B, B-C, C-E, B-D}.',
      'All nodes in tree. Total weight = 2 + 1 + 3 + 4 = 10.',
    ],
    commonMistakes: [
      'Running it on a directed graph.',
      'Forgetting to skip edges that lead back into the tree.',
      'Calling it without a start node.',
    ],
    limitations: [
      'Requires undirected graphs.',
      'Needs the graph to be connected for a full MST.',
      'On sparse graphs, Kruskal can be simpler.',
    ],
  },
};

const EMPTY_FALLBACK_SQ = {
  title: 'Asnje algoritem i zgjedhur',
  message: 'Zgjedh nje algoritem per te pare shpjegimin.',
  generalPoints: [
    'BFS dhe DFS jane algoritme te kalimit (traversal).',
    'Dijkstra, A*, Bellman-Ford dhe Floyd-Warshall gjejne rrugen me te shkurter.',
    'Kruskal dhe Prim ndertojne Pemen Minimale Shtrirese (MST).',
    'Cdo algoritem ka kufizimet e veta (pesha negative, drejtim, lidhshmeri).',
  ],
};

const EMPTY_FALLBACK_EN = {
  title: 'No algorithm selected',
  message: 'Select an algorithm to see the explanation.',
  generalPoints: [
    'BFS and DFS are traversal algorithms.',
    'Dijkstra, A*, Bellman-Ford and Floyd-Warshall solve shortest paths.',
    'Kruskal and Prim build a Minimum Spanning Tree (MST).',
    'Every algorithm has its limits (negative weights, direction, connectivity).',
  ],
};

export function getAlgorithmExplanation(
  language: AppLanguage,
  algorithm: AlgorithmType
): AlgorithmExplanation {
  const table = language === 'sq' ? EXPLANATIONS_SQ : EXPLANATIONS_EN;
  return table[algorithm];
}

export function getEmptyExplanationFallback(language: AppLanguage) {
  return language === 'sq' ? EMPTY_FALLBACK_SQ : EMPTY_FALLBACK_EN;
}
