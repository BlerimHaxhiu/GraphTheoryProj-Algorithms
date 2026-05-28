import type { AlgorithmType } from '@/types/graph';
import type { AppLanguage } from '@/components/language-provider';
import type {
  AlgorithmExampleStep,
  ExampleEdgeStatus,
  ExampleGraph,
  ExampleGraphEdge,
  ExampleGraphNode,
  ExampleNodeStatus,
} from '@/lib/algorithm-explanations';
import { STEP_TEXTS_EN } from './algorithm-example-steps-en';

interface StepOverrides {
  start?: string;
  end?: string;
  nodeStatus?: Partial<Record<string, ExampleNodeStatus>>;
  nodeBadge?: Partial<Record<string, string>>;
  edgeStatus?: Array<{ from: string; to: string; status: ExampleEdgeStatus }>;
}

function step(
  baseNodes: ExampleGraphNode[],
  baseEdges: ExampleGraphEdge[],
  overrides: StepOverrides
): ExampleGraph {
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const map = new Map<string, ExampleEdgeStatus>();
  (overrides.edgeStatus ?? []).forEach(s => map.set(key(s.from, s.to), s.status));
  return {
    startNode: overrides.start,
    endNode: overrides.end,
    nodes: baseNodes.map(n => ({
      ...n,
      status: overrides.nodeStatus?.[n.id] ?? 'default',
      badge: overrides.nodeBadge?.[n.id],
    })),
    edges: baseEdges.map(e => ({
      ...e,
      status: map.get(key(e.from, e.to)) ?? 'default',
    })),
  };
}

// ────────────────────────────── BFS ──────────────────────────────
const BFS_NODES: ExampleGraphNode[] = [
  { id: 'A', label: 'A', x: 60, y: 115 },
  { id: 'B', label: 'B', x: 160, y: 55 },
  { id: 'C', label: 'C', x: 160, y: 175 },
  { id: 'D', label: 'D', x: 260, y: 30 },
  { id: 'E', label: 'E', x: 260, y: 175 },
  { id: 'F', label: 'F', x: 360, y: 30 },
];
const BFS_EDGES: ExampleGraphEdge[] = [
  { from: 'A', to: 'B' },
  { from: 'A', to: 'C' },
  { from: 'B', to: 'D' },
  { from: 'C', to: 'E' },
  { from: 'D', to: 'F' },
];

const BFS_STEPS_SQ: AlgorithmExampleStep[] = [
  {
    stepNumber: 1,
    title: 'Inicializimi',
    description:
      '**Fillimi:** nyja `A` futet ne **radhe (queue)** dhe shenohet si *e zbuluar*. Te gjitha nyjet e tjera mbeten te pavizituara.',
    graphState: step(BFS_NODES, BFS_EDGES, { start: 'A', nodeStatus: { A: 'queued' } }),
    algorithmState: {
      queue: ['A'],
      visited: ['A'],
      previous: { A: null, B: '—', C: '—', D: '—', E: '—', F: '—' },
    },
    changeNote: 'A futet ne radhe. Radha ka 1 element.',
  },
  {
    stepNumber: 2,
    title: 'Vizito A — shtohen B dhe C',
    description:
      'Heqim `A` nga **koka e radhes** dhe e shenojme si **te vizituar**. Te gjithe fqinjet e saj te pavizituar (`B` dhe `C`) zbulohen *ne te njejten kohe* dhe shtohen ne **fund te radhes**.',
    graphState: step(BFS_NODES, BFS_EDGES, {
      start: 'A',
      nodeStatus: { A: 'current', B: 'queued', C: 'queued' },
      nodeBadge: { A: '1' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'active' },
        { from: 'A', to: 'C', status: 'active' },
      ],
    }),
    algorithmState: {
      queue: ['B', 'C'],
      visited: ['A', 'B', 'C'],
      previous: { A: null, B: 'A', C: 'A', D: '—', E: '—', F: '—' },
    },
    changeNote:
      'A behet nyja aktuale (nr. 1 i vizituar). B dhe C marrin A si prind dhe futen ne radhe.',
  },
  {
    stepNumber: 3,
    title: 'Vizito B — shtohet D',
    description:
      'Algoritmi heq B (i pari ne radhe sipas FIFO). Vizitohet B dhe fqinji i tij i pavizituar D shtohet ne fund te radhes.',
    graphState: step(BFS_NODES, BFS_EDGES, {
      start: 'A',
      nodeStatus: { A: 'visited', B: 'current', C: 'queued', D: 'queued' },
      nodeBadge: { A: '1', B: '2' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'D', status: 'active' },
      ],
    }),
    algorithmState: {
      queue: ['C', 'D'],
      visited: ['A', 'B', 'C', 'D'],
      previous: { A: null, B: 'A', C: 'A', D: 'B', E: '—', F: '—' },
    },
    changeNote: 'B finalizohet. Distanca e D nga A eshte 2 brinje (D shtohet me prind B).',
  },
  {
    stepNumber: 4,
    title: 'Vizito C — shtohet E',
    description:
      'C eshte ne koke te radhes (u shtua ne hapin 2, para D). Vizitohet C dhe fqinji E shtohet ne fund te radhes.',
    graphState: step(BFS_NODES, BFS_EDGES, {
      start: 'A',
      nodeStatus: { A: 'visited', B: 'visited', C: 'current', D: 'queued', E: 'queued' },
      nodeBadge: { A: '1', B: '2', C: '3' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'visited' },
        { from: 'A', to: 'C', status: 'path' },
        { from: 'B', to: 'D', status: 'visited' },
        { from: 'C', to: 'E', status: 'active' },
      ],
    }),
    algorithmState: {
      queue: ['D', 'E'],
      visited: ['A', 'B', 'C', 'D', 'E'],
      previous: { A: null, B: 'A', C: 'A', D: 'B', E: 'C', F: '—' },
    },
    changeNote: 'Rendi FIFO i radhes garanton qe C u perpunua para D, edhe pse D eshte zbuluar.',
  },
  {
    stepNumber: 5,
    title: 'Vizito D — shtohet F',
    description:
      'Tani vjen D (nivel 2). Vizitohet D dhe fqinji F shtohet ne fund. F eshte ne nivelin 3 — me larg nga A.',
    graphState: step(BFS_NODES, BFS_EDGES, {
      start: 'A',
      nodeStatus: {
        A: 'visited',
        B: 'visited',
        C: 'visited',
        D: 'current',
        E: 'queued',
        F: 'queued',
      },
      nodeBadge: { A: '1', B: '2', C: '3', D: '4' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'visited' },
        { from: 'A', to: 'C', status: 'visited' },
        { from: 'B', to: 'D', status: 'path' },
        { from: 'C', to: 'E', status: 'visited' },
        { from: 'D', to: 'F', status: 'active' },
      ],
    }),
    algorithmState: {
      queue: ['E', 'F'],
      visited: ['A', 'B', 'C', 'D', 'E', 'F'],
      previous: { A: null, B: 'A', C: 'A', D: 'B', E: 'C', F: 'D' },
    },
    changeNote: 'F gjithmone vjen pas E (rregulli FIFO ben renditjen sipas niveleve).',
  },
  {
    stepNumber: 6,
    title: 'Vizito E dhe F — perfundim',
    description:
      'Heqen E dhe F nga radha; asnjeri nuk ka fqinje te pavizituar. Radha eshte e zbrazet — BFS perfundon.',
    graphState: step(BFS_NODES, BFS_EDGES, {
      start: 'A',
      nodeStatus: {
        A: 'visited',
        B: 'visited',
        C: 'visited',
        D: 'visited',
        E: 'final',
        F: 'final',
      },
      nodeBadge: { A: '1', B: '2', C: '3', D: '4', E: '5', F: '6' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'A', to: 'C', status: 'path' },
        { from: 'B', to: 'D', status: 'path' },
        { from: 'C', to: 'E', status: 'path' },
        { from: 'D', to: 'F', status: 'path' },
      ],
    }),
    algorithmState: {
      queue: [],
      visited: ['A', 'B', 'C', 'D', 'E', 'F'],
      notes: [
        'Distancat nga A: B=1, C=1, D=2, E=2, F=3 (numri minimal i brinjeve).',
        'BFS pemen jep duke ndjekur tabelen e prinderve: A → B,C → D,E → F.',
      ],
    },
    changeNote: 'Rendi i vizites pasqyron nivelet: A; B,C; D,E; F.',
  },
];

// ────────────────────────────── DFS ──────────────────────────────
const DFS_NODES: ExampleGraphNode[] = [
  { id: 'A', label: 'A', x: 60, y: 115 },
  { id: 'B', label: 'B', x: 160, y: 55 },
  { id: 'C', label: 'C', x: 160, y: 175 },
  { id: 'D', label: 'D', x: 280, y: 30 },
  { id: 'E', label: 'E', x: 280, y: 90 },
  { id: 'F', label: 'F', x: 280, y: 175 },
];
const DFS_EDGES: ExampleGraphEdge[] = [
  { from: 'A', to: 'B' },
  { from: 'A', to: 'C' },
  { from: 'B', to: 'D' },
  { from: 'B', to: 'E' },
  { from: 'C', to: 'F' },
];

const DFS_STEPS_SQ: AlgorithmExampleStep[] = [
  {
    stepNumber: 1,
    title: 'Inicializimi — A ne stiv',
    description: 'Fillojme nga A. A shtohet ne stiv dhe shenohet si e vizituar.',
    graphState: step(DFS_NODES, DFS_EDGES, {
      start: 'A',
      nodeStatus: { A: 'stacked' },
    }),
    algorithmState: { stack: ['A'], visited: ['A'] },
    changeNote: 'A behet rrenja e pemes DFS.',
  },
  {
    stepNumber: 2,
    title: 'Shko thelle te B',
    description:
      'Nga A zgjidhet fqinji i pare i pavizituar (B). DFS nuk pret te shohi te gjithe fqinjet; zbret menjehere ne thellesi.',
    graphState: step(DFS_NODES, DFS_EDGES, {
      start: 'A',
      nodeStatus: { A: 'visited', B: 'current' },
      nodeBadge: { A: '1', B: '2' },
      edgeStatus: [{ from: 'A', to: 'B', status: 'active' }],
    }),
    algorithmState: { stack: ['A', 'B'], visited: ['A', 'B'] },
    changeNote: 'Karakteristika kryesore e DFS: thellesia para se gjeresia.',
  },
  {
    stepNumber: 3,
    title: 'Nga B shko te D',
    description: 'B ka dy fqinje (D, E). Zgjidhet i pari (D). DFS thirret rekursivisht per D.',
    graphState: step(DFS_NODES, DFS_EDGES, {
      start: 'A',
      nodeStatus: { A: 'visited', B: 'visited', D: 'current' },
      nodeBadge: { A: '1', B: '2', D: '3' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'D', status: 'active' },
      ],
    }),
    algorithmState: { stack: ['A', 'B', 'D'], visited: ['A', 'B', 'D'] },
    changeNote: 'D nuk ka fqinje te pavizituar — pas vizites kthehemi pas (backtrack).',
  },
  {
    stepNumber: 4,
    title: 'Backtrack ne B, shko te E',
    description:
      'D eshte i pavlefshem. Kthehemi te B dhe zgjedhim fqinjin tjeter te pavizituar — E. DFS zbret ne E.',
    graphState: step(DFS_NODES, DFS_EDGES, {
      start: 'A',
      nodeStatus: { A: 'visited', B: 'visited', D: 'visited', E: 'current' },
      nodeBadge: { A: '1', B: '2', D: '3', E: '4' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'D', status: 'visited' },
        { from: 'B', to: 'E', status: 'active' },
      ],
    }),
    algorithmState: { stack: ['A', 'B', 'E'], visited: ['A', 'B', 'D', 'E'] },
    changeNote: 'Stivi rritet dhe ulet ndersa eksplorimi zbret dhe ngrihet ne dege te ndryshme.',
  },
  {
    stepNumber: 5,
    title: 'Backtrack ne A, shko te C',
    description:
      'E nuk ka fqinje te pavizituar; B as. Kthehemi te A dhe zgjedhim fqinjin tjeter te pavizituar — C.',
    graphState: step(DFS_NODES, DFS_EDGES, {
      start: 'A',
      nodeStatus: {
        A: 'visited',
        B: 'visited',
        D: 'visited',
        E: 'visited',
        C: 'current',
      },
      nodeBadge: { A: '1', B: '2', D: '3', E: '4', C: '5' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'visited' },
        { from: 'A', to: 'C', status: 'active' },
        { from: 'B', to: 'D', status: 'visited' },
        { from: 'B', to: 'E', status: 'visited' },
      ],
    }),
    algorithmState: { stack: ['A', 'C'], visited: ['A', 'B', 'D', 'E', 'C'] },
    changeNote: 'Vereje qe rendi i vizites te DFS nuk eshte sipas distances, por sipas thellesise.',
  },
  {
    stepNumber: 6,
    title: 'Nga C te F — perfundim',
    description:
      'C ka nje fqinj te pavizituar (F). Pasi e vizitojme, kthehemi pas dhe stivi zbrazet — DFS perfundon.',
    graphState: step(DFS_NODES, DFS_EDGES, {
      start: 'A',
      nodeStatus: {
        A: 'visited',
        B: 'visited',
        D: 'visited',
        E: 'visited',
        C: 'visited',
        F: 'final',
      },
      nodeBadge: { A: '1', B: '2', D: '3', E: '4', C: '5', F: '6' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'A', to: 'C', status: 'path' },
        { from: 'B', to: 'D', status: 'path' },
        { from: 'B', to: 'E', status: 'path' },
        { from: 'C', to: 'F', status: 'path' },
      ],
    }),
    algorithmState: {
      stack: [],
      visited: ['A', 'B', 'D', 'E', 'C', 'F'],
      notes: [
        'Rendi DFS: A → B → D → E → C → F (preorder).',
        'Vereje qe ky NUK eshte renditja sipas distancave — DFS nuk garanton rrugen me te shkurter.',
      ],
    },
    changeNote: 'Stivi i zbrazet shenjon perfundimin e DFS.',
  },
];

// ────────────────────────────── Dijkstra ──────────────────────────────
const DIJK_NODES: ExampleGraphNode[] = [
  { id: 'A', label: 'A', x: 60, y: 115 },
  { id: 'B', label: 'B', x: 160, y: 40 },
  { id: 'C', label: 'C', x: 160, y: 190 },
  { id: 'D', label: 'D', x: 260, y: 115 },
  { id: 'E', label: 'E', x: 360, y: 115 },
];
const DIJK_EDGES: ExampleGraphEdge[] = [
  { from: 'A', to: 'B', weight: 2 },
  { from: 'A', to: 'C', weight: 5 },
  { from: 'B', to: 'C', weight: 1 },
  { from: 'B', to: 'D', weight: 4 },
  { from: 'C', to: 'D', weight: 1 },
  { from: 'D', to: 'E', weight: 3 },
];

const DIJK_STEPS_SQ: AlgorithmExampleStep[] = [
  {
    stepNumber: 1,
    title: 'Inicializimi i distancave',
    description:
      'Vendosim `dist[A] = 0` dhe te gjitha distancat e tjera `= ∞`. Shtojme `(A, 0)` ne **radhen me prioritet**.',
    graphState: step(DIJK_NODES, DIJK_EDGES, { start: 'A', end: 'E' }),
    algorithmState: {
      priorityQueue: ['A(0)'],
      distances: { A: '0', B: '∞', C: '∞', D: '∞', E: '∞' },
      previous: { A: '—', B: '—', C: '—', D: '—', E: '—' },
      visited: [],
    },
    changeNote: 'Vetem A ka distance te perkohshme; te tjeret jane ende te paarritshem.',
  },
  {
    stepNumber: 2,
    title: 'Heqim A — relaksohen A-B dhe A-C',
    description:
      'Nxjerrim A nga radha. Relaksojme brinjet qe dalin: dist[B] = 0 + 2 = 2; dist[C] = 0 + 5 = 5. A finalizohet.',
    graphState: step(DIJK_NODES, DIJK_EDGES, {
      start: 'A',
      end: 'E',
      nodeStatus: { A: 'current', B: 'relaxed', C: 'relaxed' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'relaxed' },
        { from: 'A', to: 'C', status: 'relaxed' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['B(2)', 'C(5)'],
      distances: { A: '0', B: '2', C: '5', D: '∞', E: '∞' },
      previous: { A: '—', B: 'A', C: 'A', D: '—', E: '—' },
      visited: ['A'],
    },
    changeNote: 'B dhe C kane fituar nje rruge te perkohshme permes A.',
  },
  {
    stepNumber: 3,
    title: 'Heqim B — perditesohet C permes B',
      description:
        '`B` ka **distancen me te vogel** (`2`) ne radhe. Heqim `B`. **Relaksimi:** `dist[C] = min(5, 2+1) = 3`; `dist[D] = min(∞, 2+4) = 6`.',
    graphState: step(DIJK_NODES, DIJK_EDGES, {
      start: 'A',
      end: 'E',
      nodeStatus: { A: 'visited', B: 'current', C: 'relaxed', D: 'relaxed' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'C', status: 'relaxed' },
        { from: 'B', to: 'D', status: 'relaxed' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['C(3)', 'C(5)', 'D(6)'],
      distances: { A: '0', B: '2', C: '3', D: '6', E: '∞' },
      previous: { A: '—', B: 'A', C: 'B', D: 'B', E: '—' },
      visited: ['A', 'B'],
    },
    changeNote: 'C ndryshon prindin nga A ne B sepse rruga A→B→C (3) eshte me e mire se A→C (5).',
  },
  {
    stepNumber: 4,
    title: 'Heqim C — perditesohet D permes C',
    description:
      'Pop C (dist 3). Hyrja e mevonshme (C, 5) hidhet tutje sepse C eshte tashme i finalizuar. dist[D] = min(6, 3+1) = 4.',
    graphState: step(DIJK_NODES, DIJK_EDGES, {
      start: 'A',
      end: 'E',
      nodeStatus: { A: 'visited', B: 'visited', C: 'current', D: 'relaxed' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'C', status: 'path' },
        { from: 'C', to: 'D', status: 'relaxed' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['D(4)', 'D(6)'],
      distances: { A: '0', B: '2', C: '3', D: '4', E: '∞' },
      previous: { A: '—', B: 'A', C: 'B', D: 'C', E: '—' },
      visited: ['A', 'B', 'C'],
    },
    changeNote: 'D ndryshon prindin ne C; rruga A→B→C→D (4) rreh A→B→D (6).',
  },
  {
    stepNumber: 5,
    title: 'Heqim D — relaksohet D-E',
    description: 'Pop D (dist 4). dist[E] = 4 + 3 = 7.',
    graphState: step(DIJK_NODES, DIJK_EDGES, {
      start: 'A',
      end: 'E',
      nodeStatus: { A: 'visited', B: 'visited', C: 'visited', D: 'current', E: 'relaxed' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'C', status: 'path' },
        { from: 'C', to: 'D', status: 'path' },
        { from: 'D', to: 'E', status: 'relaxed' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['E(7)', 'D(6)'],
      distances: { A: '0', B: '2', C: '3', D: '4', E: '7' },
      previous: { A: '—', B: 'A', C: 'B', D: 'C', E: 'D' },
      visited: ['A', 'B', 'C', 'D'],
    },
    changeNote: 'Destinacioni E mer rruge te perkohshme me peshe 7.',
  },
  {
    stepNumber: 6,
    title: 'Heqim E — destinacioni finalizohet',
    description:
      'Pop E. Pasi E del nga radha, distanca e tij eshte finale. Ndertojme rrugen permes prev[]: E ← D ← C ← B ← A.',
    graphState: step(DIJK_NODES, DIJK_EDGES, {
      start: 'A',
      end: 'E',
      nodeStatus: { A: 'final', B: 'final', C: 'final', D: 'final', E: 'final' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'C', status: 'path' },
        { from: 'C', to: 'D', status: 'path' },
        { from: 'D', to: 'E', status: 'path' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['D(6)'],
      distances: { A: '0', B: '2', C: '3', D: '4', E: '7' },
      previous: { A: '—', B: 'A', C: 'B', D: 'C', E: 'D' },
      visited: ['A', 'B', 'C', 'D', 'E'],
      notes: ['Rezultat: rruga A → B → C → D → E me peshe totale 7.'],
    },
    changeNote: 'Hyrja e mbetur (D,6) injorohet sepse D eshte tashme i finalizuar.',
  },
];

// ────────────────────────────── A* ──────────────────────────────
const ASTAR_NODES: ExampleGraphNode[] = [
  { id: 'A', label: 'A', x: 60, y: 115 },
  { id: 'B', label: 'B', x: 160, y: 40 },
  { id: 'C', label: 'C', x: 160, y: 190 },
  { id: 'D', label: 'D', x: 260, y: 115 },
  { id: 'E', label: 'E', x: 360, y: 115 },
];
const ASTAR_EDGES: ExampleGraphEdge[] = [
  { from: 'A', to: 'B', weight: 2 },
  { from: 'A', to: 'C', weight: 5 },
  { from: 'B', to: 'D', weight: 4 },
  { from: 'C', to: 'D', weight: 1 },
  { from: 'D', to: 'E', weight: 3 },
];
// Heuristic h(n) toward goal E: A=8, B=7, C=8, D=3, E=0

const ASTAR_STEPS_SQ: AlgorithmExampleStep[] = [
  {
    stepNumber: 1,
    title: 'Inicializimi me heuristike',
    description:
      'Vendosim g(A) = 0 dhe llogarisim f(A) = g(A) + h(A) = 0 + 8 = 8. Heuristikat e nyjeve te tjera: h(B)=7, h(C)=8, h(D)=3, h(E)=0.',
    graphState: step(ASTAR_NODES, ASTAR_EDGES, {
      start: 'A',
      end: 'E',
      nodeBadge: { A: 'h=8', B: 'h=7', C: 'h=8', D: 'h=3', E: 'h=0' },
    }),
    algorithmState: {
      priorityQueue: ['A(f=8)'],
      distances: { A: 'g=0', B: '∞', C: '∞', D: '∞', E: '∞' },
      visited: [],
      notes: ['Heuristika h(n) eshte nje vleresim i kostos se mbetur drejt qellimit E.'],
    },
    changeNote: 'Vetem A eshte ne open-set. Heuristika do te udheheqi zgjerimet.',
  },
  {
    stepNumber: 2,
    title: 'Zgjerojme A — futen B dhe C',
    description:
      'Heqim A me f=8. Llogarisim f per fqinjet: f(B) = 2 + 7 = 9; f(C) = 5 + 8 = 13.',
    graphState: step(ASTAR_NODES, ASTAR_EDGES, {
      start: 'A',
      end: 'E',
      nodeStatus: { A: 'current', B: 'queued', C: 'queued' },
      nodeBadge: { A: 'h=8', B: 'f=9', C: 'f=13', D: 'h=3', E: 'h=0' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'relaxed' },
        { from: 'A', to: 'C', status: 'relaxed' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['B(f=9)', 'C(f=13)'],
      distances: { A: 'g=0', B: 'g=2', C: 'g=5', D: '∞', E: '∞' },
      previous: { A: '—', B: 'A', C: 'A', D: '—', E: '—' },
      visited: ['A'],
    },
    changeNote: 'Heuristika e larte e C e shtyn ate poshte ne radhe — A* parashikon qe B eshte me afer qellimit.',
  },
  {
    stepNumber: 3,
    title: 'Zgjerojme B — gjendet D',
    description:
      'B ka f-vleren me te vogel. Heqim B (g=2). Per fqinjin D: g(D) = 2 + 4 = 6, f(D) = 6 + 3 = 9.',
    graphState: step(ASTAR_NODES, ASTAR_EDGES, {
      start: 'A',
      end: 'E',
      nodeStatus: { A: 'visited', B: 'current', C: 'queued', D: 'queued' },
      nodeBadge: { A: 'h=8', B: 'f=9', C: 'f=13', D: 'f=9', E: 'h=0' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'D', status: 'relaxed' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['D(f=9)', 'C(f=13)'],
      distances: { A: 'g=0', B: 'g=2', C: 'g=5', D: 'g=6', E: '∞' },
      previous: { A: '—', B: 'A', C: 'A', D: 'B', E: '—' },
      visited: ['A', 'B'],
    },
    changeNote: 'A* zgjedh me prioritet B sepse heuristika e ben f(B) me te ulet se f(C).',
  },
  {
    stepNumber: 4,
    title: 'Zgjerojme D — afrohemi qellimit',
    description:
      'Heqim D (f=9). Per E: g(E) = 6 + 3 = 9, f(E) = 9 + 0 = 9. Tashme jemi shume afer fundit.',
    graphState: step(ASTAR_NODES, ASTAR_EDGES, {
      start: 'A',
      end: 'E',
      nodeStatus: { A: 'visited', B: 'visited', C: 'queued', D: 'current', E: 'queued' },
      nodeBadge: { A: 'h=8', B: 'f=9', C: 'f=13', D: 'f=9', E: 'f=9' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'D', status: 'path' },
        { from: 'D', to: 'E', status: 'relaxed' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['E(f=9)', 'C(f=13)'],
      distances: { A: 'g=0', B: 'g=2', C: 'g=5', D: 'g=6', E: 'g=9' },
      previous: { A: '—', B: 'A', C: 'A', D: 'B', E: 'D' },
      visited: ['A', 'B', 'D'],
    },
    changeNote: 'C nuk u zgjerua kurre — heuristika e mbajti larg nga radha e perpunimit.',
  },
  {
    stepNumber: 5,
    title: 'Zgjerojme E — qellimi i arritur',
    description:
      'E del nga radha me f=9 dhe eshte qellimi. Rikrijojme rrugen: E ← D ← B ← A.',
    graphState: step(ASTAR_NODES, ASTAR_EDGES, {
      start: 'A',
      end: 'E',
      nodeStatus: { A: 'final', B: 'final', C: 'ignored', D: 'final', E: 'final' },
      nodeBadge: { A: 'h=8', B: 'f=9', C: 'f=13', D: 'f=9', E: 'f=9' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'D', status: 'path' },
        { from: 'D', to: 'E', status: 'path' },
        { from: 'A', to: 'C', status: 'ignored' },
        { from: 'C', to: 'D', status: 'ignored' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['C(f=13)'],
      distances: { A: 'g=0', B: 'g=2', C: 'g=5', D: 'g=6', E: 'g=9' },
      previous: { A: '—', B: 'A', C: 'A', D: 'B', E: 'D' },
      visited: ['A', 'B', 'D', 'E'],
      notes: [
        'Rezultat: rruga A → B → D → E me kosto 9.',
        'A* zgjeroi 4 nyje, Dijkstra do te zgjeronte 5 — heuristika e bera te ndaloje nje veprim.',
      ],
    },
    changeNote: 'C dhe brinjet rreth tij mbeten pa u zgjeruar — kjo eshte fitorja e A* karshi Dijkstra-s.',
  },
];

// ────────────────────────────── Bellman-Ford ──────────────────────────────
const BF_NODES: ExampleGraphNode[] = [
  { id: 'A', label: 'A', x: 60, y: 115 },
  { id: 'B', label: 'B', x: 170, y: 40 },
  { id: 'C', label: 'C', x: 170, y: 190 },
  { id: 'D', label: 'D', x: 320, y: 115 },
];
const BF_EDGES: ExampleGraphEdge[] = [
  { from: 'A', to: 'B', weight: 4, directed: true },
  { from: 'A', to: 'C', weight: 5, directed: true },
  { from: 'B', to: 'C', weight: -2, directed: true },
  { from: 'C', to: 'D', weight: 3, directed: true },
  { from: 'B', to: 'D', weight: 6, directed: true },
];

const BF_STEPS_SQ: AlgorithmExampleStep[] = [
  {
    stepNumber: 1,
    title: 'Inicializimi i distancave',
    description: 'dist[A]=0, dist[B]=dist[C]=dist[D]=∞. Pa iteracione ende.',
    graphState: step(BF_NODES, BF_EDGES, { start: 'A' }),
    algorithmState: {
      distances: { A: '0', B: '∞', C: '∞', D: '∞' },
      previous: { A: '—', B: '—', C: '—', D: '—' },
      notes: ['Bellman-Ford do te beje V - 1 = 3 pasime mbi te gjitha brinjet.'],
    },
    changeNote: 'Inicializim standard — vetem burimi A njeh veten.',
  },
  {
    stepNumber: 2,
    title: 'Pasimi 1 — relaksim te te gjitha brinjeve',
    description:
      'Per cdo brinje (u,v,w): nese dist[u]+w < dist[v], perditeso. A→B: dist[B]=4. A→C: dist[C]=5. B→C: 4+(-2)=2 < 5 → dist[C]=2. C→D: 2+3=5 → dist[D]=5. B→D: 4+6=10 — nuk perditesohet.',
    graphState: step(BF_NODES, BF_EDGES, {
      start: 'A',
      nodeStatus: { A: 'final', B: 'relaxed', C: 'relaxed', D: 'relaxed' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'relaxed' },
        { from: 'A', to: 'C', status: 'relaxed' },
        { from: 'B', to: 'C', status: 'relaxed' },
        { from: 'C', to: 'D', status: 'relaxed' },
      ],
    }),
    algorithmState: {
      distances: { A: '0', B: '4', C: '2', D: '5' },
      previous: { A: '—', B: 'A', C: 'B', D: 'C' },
      notes: ['Brinja B→C me peshe -2 e perdoreshi rrugen A→B→C me peshe 2.'],
    },
    changeNote: 'Pesha negative B→C ben te mundur nje rruge A→B→C te lire (2) ne vend te A→C (5).',
  },
  {
    stepNumber: 3,
    title: 'Pasimi 2 — kontroll i metejshem',
    description:
      'Perserisim relaksimin per cdo brinje. Asnje brinje nuk e ul me tej distancen — algoritmi mund te ndalet heret.',
    graphState: step(BF_NODES, BF_EDGES, {
      start: 'A',
      nodeStatus: { A: 'final', B: 'final', C: 'final', D: 'final' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'C', status: 'path' },
        { from: 'C', to: 'D', status: 'path' },
      ],
    }),
    algorithmState: {
      distances: { A: '0', B: '4', C: '2', D: '5' },
      previous: { A: '—', B: 'A', C: 'B', D: 'C' },
    },
    changeNote:
      'Nje optimizim klasik: nese asnje brinje nuk perditeson distancen ne nje pasim, distancat jane finale.',
  },
  {
    stepNumber: 4,
    title: 'Pasimi 3 — kontrolli i fundit',
    description:
      'Pas V-1 pasimeve, distancat duhet te jene konverguar. Verifikohet me nje pasim shtese: nese ndonje brinje perditesohet, ekziston cikel me peshe negative.',
    graphState: step(BF_NODES, BF_EDGES, {
      start: 'A',
      nodeStatus: { A: 'final', B: 'final', C: 'final', D: 'final' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'C', status: 'path' },
        { from: 'C', to: 'D', status: 'path' },
      ],
    }),
    algorithmState: {
      distances: { A: '0', B: '4', C: '2', D: '5' },
      previous: { A: '—', B: 'A', C: 'B', D: 'C' },
      notes: ['Pasimi shtese nuk gjeti relaksim — pra nuk ka cikel me peshe negative.'],
    },
    changeNote: 'V-1 = 3 pasime mjaftojne kur grafi nuk ka cikle negative.',
  },
  {
    stepNumber: 5,
    title: 'Rezultat final',
    description:
      'Distancat me te shkurtra nga A jane: A=0, B=4, C=2, D=5. Rruget rikrijohen permes prev[].',
    graphState: step(BF_NODES, BF_EDGES, {
      start: 'A',
      nodeStatus: { A: 'final', B: 'final', C: 'final', D: 'final' },
      nodeBadge: { A: 'd=0', B: 'd=4', C: 'd=2', D: 'd=5' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'C', status: 'path' },
        { from: 'C', to: 'D', status: 'path' },
      ],
    }),
    algorithmState: {
      distances: { A: '0', B: '4', C: '2', D: '5' },
      previous: { A: '—', B: 'A', C: 'B', D: 'C' },
      notes: [
        'Rruget: A→A (0); A→B (4); A→B→C (2); A→B→C→D (5).',
        'Bellman-Ford perballon peshat negative aty ku Dijkstra do te kishte gabuar.',
      ],
    },
    changeNote: 'Distancat e tabeles jane finale dhe te qendrueshme.',
  },
];

// ────────────────────────────── Floyd-Warshall ──────────────────────────────
const FW_NODES: ExampleGraphNode[] = [
  { id: 'A', label: 'A', x: 80, y: 50 },
  { id: 'B', label: 'B', x: 320, y: 50 },
  { id: 'C', label: 'C', x: 80, y: 180 },
  { id: 'D', label: 'D', x: 320, y: 180 },
];
const FW_EDGES: ExampleGraphEdge[] = [
  { from: 'A', to: 'B', weight: 3 },
  { from: 'A', to: 'D', weight: 10 },
  { from: 'B', to: 'C', weight: 2 },
  { from: 'B', to: 'D', weight: 7 },
  { from: 'C', to: 'D', weight: 1 },
];

const FW_STEPS_SQ: AlgorithmExampleStep[] = [
  {
    stepNumber: 1,
    title: 'Matrica fillestare',
    description:
      'Inicializo dist[i][i]=0 dhe dist[i][j]=peshe e brinjes (ose ∞). Pa lidhje direkte A-C — vlera ∞.',
    graphState: step(FW_NODES, FW_EDGES, {}),
    algorithmState: {
      matrix: {
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          { label: 'A', cells: ['0', '3', '∞', '10'] },
          { label: 'B', cells: ['3', '0', '2', '7'] },
          { label: 'C', cells: ['∞', '2', '0', '1'] },
          { label: 'D', cells: ['10', '7', '1', '0'] },
        ],
      },
    },
    changeNote: 'Matrica pasqyron grafin pa nyje te ndermjetme.',
  },
  {
    stepNumber: 2,
    title: 'k = A — perdorim A si nyje te ndermjetme',
    description:
      'Per cdo (i, j): kontrollohet nese kalimi permes A jep distance me te vogel. A eshte ne kend te grafit; nuk ka permiresime.',
    graphState: step(FW_NODES, FW_EDGES, {
      nodeStatus: { A: 'current' },
    }),
    algorithmState: {
      matrix: {
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          { label: 'A', cells: ['0', '3', '∞', '10'] },
          { label: 'B', cells: ['3', '0', '2', '7'] },
          { label: 'C', cells: ['∞', '2', '0', '1'] },
          { label: 'D', cells: ['10', '7', '1', '0'] },
        ],
      },
      notes: ['Formula: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).'],
    },
    changeNote: 'Matrica nuk ndryshon — A nuk ndihmon si ure mes nyjeve te tjera.',
  },
  {
    stepNumber: 3,
    title: 'k = B — perdorim B si nyje te ndermjetme',
    description:
      'Tani B mund te perdoret si ure. Permiresime: dist[A][C] = min(∞, 3+2) = 5; dist[C][A] = min(∞, 2+3) = 5.',
    graphState: step(FW_NODES, FW_EDGES, {
      nodeStatus: { B: 'current', A: 'relaxed', C: 'relaxed' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'active' },
        { from: 'B', to: 'C', status: 'active' },
      ],
    }),
    algorithmState: {
      matrix: {
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          { label: 'A', cells: ['0', '3', '5', '10'] },
          { label: 'B', cells: ['3', '0', '2', '7'] },
          { label: 'C', cells: ['5', '2', '0', '1'] },
          { label: 'D', cells: ['10', '7', '1', '0'] },
        ],
      },
    },
    changeNote: 'A dhe C tashme njohin njera-tjetren me peshe 5 (permes B).',
  },
  {
    stepNumber: 4,
    title: 'k = C — perdorim C si nyje te ndermjetme',
    description:
      'Permiresime: dist[A][D] = min(10, dist[A][C] + dist[C][D]) = 5+1 = 6; dist[B][D] = min(7, 2+1) = 3.',
    graphState: step(FW_NODES, FW_EDGES, {
      nodeStatus: { C: 'current', A: 'relaxed', B: 'relaxed', D: 'relaxed' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'visited' },
        { from: 'B', to: 'C', status: 'visited' },
        { from: 'C', to: 'D', status: 'active' },
      ],
    }),
    algorithmState: {
      matrix: {
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          { label: 'A', cells: ['0', '3', '5', '6'] },
          { label: 'B', cells: ['3', '0', '2', '3'] },
          { label: 'C', cells: ['5', '2', '0', '1'] },
          { label: 'D', cells: ['6', '3', '1', '0'] },
        ],
      },
    },
    changeNote:
      'Brinja direkte A-D (10) zevendesohet me rrugen A→B→C→D (6); B-D bie nga 7 ne 3 permes C.',
  },
  {
    stepNumber: 5,
    title: 'k = D — perfundim',
    description:
      'Per cdo (i, j) kontrollohet kalimi permes D — asnje permiresim nuk gjendet. Matrica eshte finale.',
    graphState: step(FW_NODES, FW_EDGES, {
      nodeStatus: { D: 'current', A: 'final', B: 'final', C: 'final' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'path' },
        { from: 'B', to: 'C', status: 'path' },
        { from: 'C', to: 'D', status: 'path' },
      ],
    }),
    algorithmState: {
      matrix: {
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          { label: 'A', cells: ['0', '3', '5', '6'] },
          { label: 'B', cells: ['3', '0', '2', '3'] },
          { label: 'C', cells: ['5', '2', '0', '1'] },
          { label: 'D', cells: ['6', '3', '1', '0'] },
        ],
      },
      notes: [
        'Matrica finale jep rrugen me te shkurter mes cdo cifti.',
        'A→D = 6 (A→B→C→D). B→D = 3 (B→C→D). Tjera te pandryshuara.',
      ],
    },
    changeNote: 'Algoritmi perfundon pas V iteracioneve mbi nyjet e ndermjetme.',
  },
];

// ────────────────────────────── Kruskal ──────────────────────────────
const KRUS_NODES: ExampleGraphNode[] = [
  { id: 'A', label: 'A', x: 60, y: 115 },
  { id: 'B', label: 'B', x: 170, y: 40 },
  { id: 'C', label: 'C', x: 290, y: 40 },
  { id: 'D', label: 'D', x: 170, y: 190 },
  { id: 'E', label: 'E', x: 290, y: 190 },
];
const KRUS_EDGES: ExampleGraphEdge[] = [
  { from: 'A', to: 'B', weight: 2 },
  { from: 'A', to: 'D', weight: 5 },
  { from: 'B', to: 'C', weight: 1 },
  { from: 'B', to: 'D', weight: 4 },
  { from: 'C', to: 'E', weight: 3 },
  { from: 'D', to: 'E', weight: 6 },
];

const KRUS_STEPS_SQ: AlgorithmExampleStep[] = [
  {
    stepNumber: 1,
    title: 'Renditja e brinjeve sipas peshes',
    description:
      'Brinjet renditen: B-C(1), A-B(2), C-E(3), B-D(4), A-D(5), D-E(6). DSU inicializohet: cdo nyje ne grupin e vet.',
    graphState: step(KRUS_NODES, KRUS_EDGES, {}),
    algorithmState: {
      mstEdges: [],
      notes: ['Komponente: {A}, {B}, {C}, {D}, {E}. Nje MST per 5 nyje ka 4 brinje.'],
    },
    changeNote: 'Renditja e brinjeve eshte gjysma e Kruskal-it; DSU eshte gjysma tjeter.',
  },
  {
    stepNumber: 2,
    title: 'Shtohet B-C (peshe 1)',
    description:
      'B dhe C jane ne grupe te ndryshme — pa cikel. Shtohet brinja ne MST. Bashkohen grupet: {B, C}.',
    graphState: step(KRUS_NODES, KRUS_EDGES, {
      nodeStatus: { B: 'mst', C: 'mst' },
      edgeStatus: [{ from: 'B', to: 'C', status: 'selected' }],
    }),
    algorithmState: {
      mstEdges: ['B-C (1)'],
      selectedEdge: 'B-C (1)',
      notes: ['Komponente: {A}, {B,C}, {D}, {E}.'],
    },
    changeNote: 'B dhe C tashme ne te njejtin grup DSU.',
  },
  {
    stepNumber: 3,
    title: 'Shtohet A-B (peshe 2)',
    description: 'A dhe B ne grupe te ndryshme — shto. Komponentet bashkohen: {A, B, C}.',
    graphState: step(KRUS_NODES, KRUS_EDGES, {
      nodeStatus: { A: 'mst', B: 'mst', C: 'mst' },
      edgeStatus: [
        { from: 'B', to: 'C', status: 'mst' },
        { from: 'A', to: 'B', status: 'selected' },
      ],
    }),
    algorithmState: {
      mstEdges: ['B-C (1)', 'A-B (2)'],
      selectedEdge: 'A-B (2)',
      notes: ['Komponente: {A,B,C}, {D}, {E}.'],
    },
    changeNote: 'MST tashme ka 2 brinje (gjysma e nevojshme).',
  },
  {
    stepNumber: 4,
    title: 'Shtohet C-E (peshe 3)',
    description: 'C dhe E ne grupe te ndryshme. Shto. Komponentet: {A, B, C, E} dhe {D}.',
    graphState: step(KRUS_NODES, KRUS_EDGES, {
      nodeStatus: { A: 'mst', B: 'mst', C: 'mst', E: 'mst' },
      edgeStatus: [
        { from: 'B', to: 'C', status: 'mst' },
        { from: 'A', to: 'B', status: 'mst' },
        { from: 'C', to: 'E', status: 'selected' },
      ],
    }),
    algorithmState: {
      mstEdges: ['B-C (1)', 'A-B (2)', 'C-E (3)'],
      selectedEdge: 'C-E (3)',
      notes: ['Komponente: {A,B,C,E}, {D}.'],
    },
    changeNote: 'E lidhet me MST-ne permes C.',
  },
  {
    stepNumber: 5,
    title: 'Shtohet B-D (peshe 4) — MST perfundon',
    description:
      'B dhe D ne grupe te ndryshme. Shto. MST ka tani V - 1 = 4 brinje — perfundoi.',
    graphState: step(KRUS_NODES, KRUS_EDGES, {
      nodeStatus: { A: 'mst', B: 'mst', C: 'mst', D: 'mst', E: 'mst' },
      edgeStatus: [
        { from: 'B', to: 'C', status: 'mst' },
        { from: 'A', to: 'B', status: 'mst' },
        { from: 'C', to: 'E', status: 'mst' },
        { from: 'B', to: 'D', status: 'selected' },
      ],
    }),
    algorithmState: {
      mstEdges: ['B-C (1)', 'A-B (2)', 'C-E (3)', 'B-D (4)'],
      selectedEdge: 'B-D (4)',
      notes: ['Te gjitha nyjet ne nje grup DSU.'],
    },
    changeNote: 'Pesha totale e MST: 1 + 2 + 3 + 4 = 10.',
  },
  {
    stepNumber: 6,
    title: 'A-D (5) dhe D-E (6) — refuzohen si cikle',
    description:
      'Brinjet e mbetura kontrollohen: A dhe D jane tashme ne te njejtin grup — shtimi i A-D do te krijonte nje cikel. Njejte per D-E.',
    graphState: step(KRUS_NODES, KRUS_EDGES, {
      nodeStatus: { A: 'mst', B: 'mst', C: 'mst', D: 'mst', E: 'mst' },
      edgeStatus: [
        { from: 'B', to: 'C', status: 'mst' },
        { from: 'A', to: 'B', status: 'mst' },
        { from: 'C', to: 'E', status: 'mst' },
        { from: 'B', to: 'D', status: 'mst' },
        { from: 'A', to: 'D', status: 'rejected' },
        { from: 'D', to: 'E', status: 'rejected' },
      ],
    }),
    algorithmState: {
      mstEdges: ['B-C (1)', 'A-B (2)', 'C-E (3)', 'B-D (4)'],
      rejectedEdge: 'A-D (5), D-E (6)',
      notes: ['Pa DSU, ato do te krijonin cikle ne MST.'],
    },
    changeNote: 'Kontrolli i DSU parandalon ciklet — kjo eshte zemra e Kruskal-it.',
  },
];

// ────────────────────────────── Prim ──────────────────────────────
const PRIM_NODES = KRUS_NODES;
const PRIM_EDGES = KRUS_EDGES;

const PRIM_STEPS_SQ: AlgorithmExampleStep[] = [
  {
    stepNumber: 1,
    title: 'Inicializimi — A ne peme',
    description:
      'Fillojme nga A. Shtojme te gjitha brinjet qe dalin nga A ne radhen me prioritet: A-B(2), A-D(5).',
    graphState: step(PRIM_NODES, PRIM_EDGES, {
      start: 'A',
      nodeStatus: { A: 'mst' },
    }),
    algorithmState: {
      priorityQueue: ['A-B(2)', 'A-D(5)'],
      mstEdges: [],
      visited: ['A'],
    },
    changeNote: 'A eshte ne peme; te gjitha brinjet e tij jane kandidate.',
  },
  {
    stepNumber: 2,
    title: 'Shtohet A-B (2) — B hyn ne peme',
    description:
      'Pop brinja me peshe me te vogel: A-B(2). B nuk eshte ne peme — shtohet. Brinjet e B-se shtohen ne radhe: B-C(1), B-D(4).',
    graphState: step(PRIM_NODES, PRIM_EDGES, {
      start: 'A',
      nodeStatus: { A: 'mst', B: 'mst' },
      edgeStatus: [{ from: 'A', to: 'B', status: 'selected' }],
    }),
    algorithmState: {
      priorityQueue: ['B-C(1)', 'B-D(4)', 'A-D(5)'],
      mstEdges: ['A-B (2)'],
      selectedEdge: 'A-B (2)',
      visited: ['A', 'B'],
    },
    changeNote: 'B-C(1) tani eshte kandidati me i lire — radha e prioritetit e prioritizon.',
  },
  {
    stepNumber: 3,
    title: 'Shtohet B-C (1) — C hyn ne peme',
    description: 'Pop B-C(1). C shtohet. Brinjet e C-se shtohen: C-E(3).',
    graphState: step(PRIM_NODES, PRIM_EDGES, {
      start: 'A',
      nodeStatus: { A: 'mst', B: 'mst', C: 'mst' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'mst' },
        { from: 'B', to: 'C', status: 'selected' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['C-E(3)', 'B-D(4)', 'A-D(5)'],
      mstEdges: ['A-B (2)', 'B-C (1)'],
      selectedEdge: 'B-C (1)',
      visited: ['A', 'B', 'C'],
    },
    changeNote: 'Vereje: Prim e zgjedh me ne fund B-C(1), edhe pse fillimisht nuk ishte dukur.',
  },
  {
    stepNumber: 4,
    title: 'Shtohet C-E (3) — E hyn ne peme',
    description: 'Pop C-E(3). E shtohet. Brinjet e E-se shtohen: D-E(6).',
    graphState: step(PRIM_NODES, PRIM_EDGES, {
      start: 'A',
      nodeStatus: { A: 'mst', B: 'mst', C: 'mst', E: 'mst' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'mst' },
        { from: 'B', to: 'C', status: 'mst' },
        { from: 'C', to: 'E', status: 'selected' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['B-D(4)', 'A-D(5)', 'D-E(6)'],
      mstEdges: ['A-B (2)', 'B-C (1)', 'C-E (3)'],
      selectedEdge: 'C-E (3)',
      visited: ['A', 'B', 'C', 'E'],
    },
    changeNote: 'Mbeti vetem D pa u perfshire ne peme.',
  },
  {
    stepNumber: 5,
    title: 'Shtohet B-D (4) — peme komplete',
    description:
      'Pop B-D(4). D shtohet — te gjitha nyjet tani jane ne peme. Brinjet e mbetura (A-D, D-E) refuzohen sepse cojne ne nyje qe jane tashme ne peme.',
    graphState: step(PRIM_NODES, PRIM_EDGES, {
      start: 'A',
      nodeStatus: { A: 'mst', B: 'mst', C: 'mst', D: 'mst', E: 'mst' },
      edgeStatus: [
        { from: 'A', to: 'B', status: 'mst' },
        { from: 'B', to: 'C', status: 'mst' },
        { from: 'C', to: 'E', status: 'mst' },
        { from: 'B', to: 'D', status: 'selected' },
        { from: 'A', to: 'D', status: 'ignored' },
        { from: 'D', to: 'E', status: 'ignored' },
      ],
    }),
    algorithmState: {
      priorityQueue: ['A-D(5)', 'D-E(6)'],
      mstEdges: ['A-B (2)', 'B-C (1)', 'C-E (3)', 'B-D (4)'],
      selectedEdge: 'B-D (4)',
      visited: ['A', 'B', 'C', 'D', 'E'],
      notes: [
        'Pesha totale e MST: 2 + 1 + 3 + 4 = 10.',
        'Krahaso me Kruskal-in: rezultati eshte i njejti — ndryshojne vetem zgjedhjet e ndermjetme.',
      ],
    },
    changeNote: 'Pema mbulon te gjitha 5 nyjet me 4 brinje me peshe minimale.',
  },
];

const STEPS_SQ: Record<AlgorithmType, AlgorithmExampleStep[]> = {
  bfs: BFS_STEPS_SQ,
  dfs: DFS_STEPS_SQ,
  dijkstra: DIJK_STEPS_SQ,
  'a-star': ASTAR_STEPS_SQ,
  'bellman-ford': BF_STEPS_SQ,
  'floyd-warshall': FW_STEPS_SQ,
  kruskal: KRUS_STEPS_SQ,
  prim: PRIM_STEPS_SQ,
};

function applyLanguage(
  language: AppLanguage,
  algorithm: AlgorithmType,
  base: AlgorithmExampleStep
): AlgorithmExampleStep {
  if (language === 'sq') return base;
  const override = STEP_TEXTS_EN[algorithm]?.[base.stepNumber];
  if (!override) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        `[i18n] Missing English step override for ${algorithm} step ${base.stepNumber}`
      );
    }
    return base;
  }
  return {
    ...base,
    title: override.title ?? base.title,
    description: override.description ?? base.description,
    changeNote: override.changeNote ?? base.changeNote,
    algorithmState: base.algorithmState
      ? {
          ...base.algorithmState,
          notes: override.notes ?? base.algorithmState.notes,
        }
      : base.algorithmState,
  };
}

export function getAlgorithmExampleSteps(
  language: AppLanguage,
  algorithm: AlgorithmType
): AlgorithmExampleStep[] {
  const base = STEPS_SQ[algorithm] ?? [];
  return base.map(step => applyLanguage(language, algorithm, step));
}
