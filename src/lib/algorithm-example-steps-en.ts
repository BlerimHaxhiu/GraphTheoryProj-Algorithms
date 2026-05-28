import type { AlgorithmType } from '@/types/graph';

// English translations for the per-step content. The graph state, algorithm
// state structure, and step ordering live in algorithm-example-steps.ts; this
// file only carries the language-dependent strings (title / description /
// changeNote / notes), keyed by stepNumber. The resolver merges them onto the
// Albanian source data so every algorithm has the same number of cards and
// the same visual graphs in both languages.

export interface StepTextOverride {
  title?: string;
  description?: string;
  changeNote?: string;
  notes?: string[];
}

export const STEP_TEXTS_EN: Record<AlgorithmType, Record<number, StepTextOverride>> = {
  bfs: {
    1: {
      title: 'Initialization',
      description:
        '**Start:** node `A` is pushed onto the **queue** and marked as *discovered*. Every other node stays unvisited.',
      changeNote: 'A enters the queue. The queue now holds 1 element.',
    },
    2: {
      title: 'Visit A — push B and C',
      description:
        'We pop `A` from the **front of the queue** and mark it as **visited**. All of its unvisited neighbours (`B` and `C`) are discovered *at the same time* and added to the **back of the queue**.',
      changeNote:
        'A becomes the current node (visit #1). B and C get A as their parent and enter the queue.',
    },
    3: {
      title: 'Visit B — push D',
      description:
        'The algorithm pops B (first in the queue per **FIFO**). B is visited and its unvisited neighbour D joins the back of the queue.',
      changeNote: 'B is finalised. D is 2 edges away from A (D is queued with B as its parent).',
    },
    4: {
      title: 'Visit C — push E',
      description:
        'C sits at the front of the queue (it was added in step 2, before D). We visit C and add neighbour E to the back of the queue.',
      changeNote: 'FIFO order guarantees C is processed before D, even though D was discovered earlier.',
    },
    5: {
      title: 'Visit D — push F',
      description:
        'D comes up next (level 2). It is visited and neighbour F joins the back. F is at level 3 — the farthest from A.',
      changeNote: 'F is always processed after E (the FIFO rule produces a level-order traversal).',
    },
    6: {
      title: 'Visit E and F — done',
      description:
        'E and F are popped; neither has any unvisited neighbours. The queue is empty — BFS terminates.',
      changeNote: 'The visit order mirrors the levels: A; B,C; D,E; F.',
      notes: [
        'Distances from A: B=1, C=1, D=2, E=2, F=3 (minimum number of edges).',
        'The BFS tree is reconstructed via the parent table: A → B,C → D,E → F.',
      ],
    },
  },

  dfs: {
    1: {
      title: 'Initialization — A on the stack',
      description: 'We start from A. A is pushed onto the **stack** and marked as visited.',
      changeNote: 'A becomes the root of the DFS tree.',
    },
    2: {
      title: 'Dive into B',
      description:
        'From A we pick the first unvisited neighbour (B). DFS does not look at every neighbour first; it immediately dives deeper.',
      changeNote: 'Key DFS trait: depth before breadth.',
    },
    3: {
      title: 'From B go to D',
      description: 'B has two neighbours (D, E). The first one (D) is chosen. DFS recurses into D.',
      changeNote: 'D has no unvisited neighbours — after visiting it we **backtrack**.',
    },
    4: {
      title: 'Backtrack to B, go to E',
      description:
        'D is a dead end. We return to B and pick its other unvisited neighbour — E. DFS dives into E.',
      changeNote: 'The stack grows and shrinks as exploration descends and pops up through different branches.',
    },
    5: {
      title: 'Backtrack to A, go to C',
      description:
        'E has no unvisited neighbours; neither does B. We return to A and choose the next unvisited neighbour — C.',
      changeNote: 'Note that DFS visit order follows depth, not distance.',
    },
    6: {
      title: 'From C to F — done',
      description:
        'C has one unvisited neighbour (F). After visiting it we backtrack again and the stack empties — DFS terminates.',
      changeNote: 'An empty stack marks the end of DFS.',
      notes: [
        'DFS order: A → B → D → E → C → F (preorder).',
        'Note this is NOT distance order — DFS does not guarantee shortest paths.',
      ],
    },
  },

  dijkstra: {
    1: {
      title: 'Initialise distances',
      description:
        'Set `dist[A] = 0` and every other distance `= ∞`. Push `(A, 0)` onto the **priority queue**.',
      changeNote: 'Only A has a tentative distance; the others are still unreachable.',
    },
    2: {
      title: 'Pop A — relax A-B and A-C',
      description:
        'We pop A from the queue. We relax the outgoing edges: `dist[B] = 0 + 2 = 2`; `dist[C] = 0 + 5 = 5`. A is finalised.',
      changeNote: 'B and C now have tentative routes through A.',
    },
    3: {
      title: 'Pop B — C is updated through B',
      description:
        '`B` has the **smallest distance** (`2`) in the queue. We pop `B`. **Relaxation:** `dist[C] = min(5, 2+1) = 3`; `dist[D] = min(∞, 2+4) = 6`.',
      changeNote: 'C changes its parent from A to B because A→B→C (3) beats A→C (5).',
    },
    4: {
      title: 'Pop C — D is updated through C',
      description:
        'Pop C (dist 3). The stale entry (C, 5) is discarded because C is already finalised. `dist[D] = min(6, 3+1) = 4`.',
      changeNote: 'D switches its parent to C; A→B→C→D (4) beats A→B→D (6).',
    },
    5: {
      title: 'Pop D — relax D-E',
      description: 'Pop D (dist 4). `dist[E] = 4 + 3 = 7`.',
      changeNote: 'The target E receives a tentative cost of 7.',
    },
    6: {
      title: 'Pop E — the target is finalised',
      description:
        'Pop E. Once E leaves the queue its distance is final. We rebuild the path through `prev[]`: E ← D ← C ← B ← A.',
      changeNote: 'The leftover entry (D, 6) is skipped because D is already finalised.',
      notes: ['Result: path A → B → C → D → E with total weight 7.'],
    },
  },

  'a-star': {
    1: {
      title: 'Initialisation with a heuristic',
      description:
        'Set `g(A) = 0` and compute `f(A) = g(A) + h(A) = 0 + 8 = 8`. Heuristics for the rest: `h(B)=7`, `h(C)=8`, `h(D)=3`, `h(E)=0`.',
      changeNote: 'Only A sits in the open-set. The heuristic will steer expansions from here on.',
      notes: ['Heuristic `h(n)` is an estimate of the remaining cost toward goal E.'],
    },
    2: {
      title: 'Expand A — push B and C',
      description:
        'Pop A with f=8. Compute f for the neighbours: `f(B) = 2 + 7 = 9`; `f(C) = 5 + 8 = 13`.',
      changeNote: "C's high heuristic pushes it down the queue — A* predicts B is closer to the goal.",
    },
    3: {
      title: 'Expand B — discover D',
      description:
        'B has the smallest f. We pop B (g=2). For neighbour D: `g(D) = 2 + 4 = 6`, `f(D) = 6 + 3 = 9`.',
      changeNote: 'A* prefers B because the heuristic makes f(B) smaller than f(C).',
    },
    4: {
      title: 'Expand D — close to the goal',
      description:
        'Pop D (f=9). For E: `g(E) = 6 + 3 = 9`, `f(E) = 9 + 0 = 9`. We are nearly done.',
      changeNote: 'C was never expanded — the heuristic kept it out of the processing queue.',
    },
    5: {
      title: 'Expand E — goal reached',
      description:
        'E leaves the queue with f=9 and is the goal. Rebuild the path: E ← D ← B ← A.',
      changeNote: 'C and the edges around it are never expanded — this is the win of A* over Dijkstra.',
      notes: [
        'Result: path A → B → D → E with cost 9.',
        'A* expanded 4 nodes; Dijkstra would have expanded 5 — the heuristic saved one expansion.',
      ],
    },
  },

  'bellman-ford': {
    1: {
      title: 'Initialise distances',
      description: '`dist[A]=0`, `dist[B]=dist[C]=dist[D]=∞`. No iterations yet.',
      changeNote: 'Standard initialisation — only the source A knows itself.',
      notes: ['Bellman-Ford will perform `V - 1 = 3` passes over every edge.'],
    },
    2: {
      title: 'Pass 1 — relax every edge',
      description:
        'For every edge `(u, v, w)`: if `dist[u] + w < dist[v]`, update. A→B: `dist[B]=4`. A→C: `dist[C]=5`. B→C: `4+(-2)=2 < 5` → `dist[C]=2`. C→D: `2+3=5` → `dist[D]=5`. B→D: `4+6=10` — no update.',
      changeNote: 'The negative edge B→C unlocks the cheaper route A→B→C with weight 2.',
      notes: ['The edge B→C with weight -2 enables route A→B→C with weight 2.'],
    },
    3: {
      title: 'Pass 2 — further check',
      description:
        'We repeat relaxation across every edge. No edge lowers a distance further — the algorithm can stop early.',
      changeNote:
        'Classic optimisation: if no edge improves any distance during a pass, the distances are final.',
    },
    4: {
      title: 'Pass 3 — final check',
      description:
        'After V-1 passes the distances should have converged. We verify with one extra pass: if any edge still relaxes, a negative-weight cycle exists.',
      changeNote: 'V-1 = 3 passes are enough when the graph has no negative cycle.',
      notes: ['The extra pass found no relaxation — no negative-weight cycle exists.'],
    },
    5: {
      title: 'Final result',
      description:
        'Shortest distances from A: A=0, B=4, C=2, D=5. Paths are rebuilt via `prev[]`.',
      changeNote: 'The table is final and stable.',
      notes: [
        'Paths: A→A (0); A→B (4); A→B→C (2); A→B→C→D (5).',
        'Bellman-Ford handles the negative weight that would have tricked Dijkstra.',
      ],
    },
  },

  'floyd-warshall': {
    1: {
      title: 'Initial matrix',
      description:
        'Initialise `dist[i][i]=0` and `dist[i][j]=` edge weight (or `∞`). No direct A-C edge — value `∞`.',
      changeNote: 'The matrix reflects the graph with no intermediate nodes used.',
    },
    2: {
      title: 'k = A — use A as the intermediate',
      description:
        'For every (i, j): check whether going via A gives a shorter distance. A sits in a corner of the graph; no improvements.',
      changeNote: 'The matrix is unchanged — A does not bridge any pair of other nodes.',
      notes: ['Formula: `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`.'],
    },
    3: {
      title: 'k = B — use B as the intermediate',
      description:
        'Now B can serve as a bridge. Improvements: `dist[A][C] = min(∞, 3+2) = 5`; `dist[C][A] = min(∞, 2+3) = 5`.',
      changeNote: 'A and C now know each other with distance 5 (through B).',
    },
    4: {
      title: 'k = C — use C as the intermediate',
      description:
        'Improvements: `dist[A][D] = min(10, dist[A][C] + dist[C][D]) = 5+1 = 6`; `dist[B][D] = min(7, 2+1) = 3`.',
      changeNote:
        'The direct edge A-D (10) is replaced by the path A→B→C→D (6); B-D drops from 7 to 3 via C.',
    },
    5: {
      title: 'k = D — done',
      description:
        'We check every (i, j) routed through D — no improvement is found. The matrix is final.',
      changeNote: 'The algorithm terminates after V iterations over the intermediate nodes.',
      notes: [
        'The final matrix gives the shortest distance between every pair.',
        'A→D = 6 (A→B→C→D). B→D = 3 (B→C→D). The rest are unchanged.',
      ],
    },
  },

  kruskal: {
    1: {
      title: 'Sort edges by weight',
      description:
        'The edges are sorted: B-C(1), A-B(2), C-E(3), B-D(4), A-D(5), D-E(6). DSU is initialised: every node in its own set.',
      changeNote: "Sorting the edges is half of Kruskal's; DSU is the other half.",
      notes: ['Components: {A}, {B}, {C}, {D}, {E}. An MST for 5 nodes has 4 edges.'],
    },
    2: {
      title: 'Add B-C (weight 1)',
      description:
        'B and C are in different sets — no cycle. The edge is added to the MST. The sets merge: {B, C}.',
      changeNote: 'B and C now share a DSU group.',
      notes: ['Components: {A}, {B,C}, {D}, {E}.'],
    },
    3: {
      title: 'Add A-B (weight 2)',
      description: 'A and B are in different sets — add it. The components merge: {A, B, C}.',
      changeNote: 'The MST already has 2 edges (halfway there).',
      notes: ['Components: {A,B,C}, {D}, {E}.'],
    },
    4: {
      title: 'Add C-E (weight 3)',
      description: 'C and E are in different sets. Add it. Components: {A, B, C, E} and {D}.',
      changeNote: 'E joins the MST through C.',
      notes: ['Components: {A,B,C,E}, {D}.'],
    },
    5: {
      title: 'Add B-D (weight 4) — MST complete',
      description:
        'B and D are in different sets. Add it. The MST now has V - 1 = 4 edges — it is finished.',
      changeNote: 'Total MST weight: 1 + 2 + 3 + 4 = 10.',
      notes: ['All nodes are in a single DSU group.'],
    },
    6: {
      title: 'A-D (5) and D-E (6) — rejected as cycles',
      description:
        'The remaining edges are checked: A and D are already in the same group — adding A-D would create a cycle. Same for D-E.',
      changeNote: "The DSU cycle check is the heart of Kruskal's algorithm.",
      notes: ['Without DSU, these edges would have created cycles in the MST.'],
    },
  },

  prim: {
    1: {
      title: 'Initialisation — A in the tree',
      description:
        'We start from A. Push every edge leaving A onto the **priority queue**: A-B(2), A-D(5).',
      changeNote: 'A is in the tree; all of its edges are candidates.',
    },
    2: {
      title: 'Add A-B (2) — B joins the tree',
      description:
        'Pop the lightest edge: A-B(2). B is not in the tree — add it. Push the edges from B: B-C(1), B-D(4).',
      changeNote: 'B-C(1) is now the cheapest candidate — the priority queue surfaces it.',
    },
    3: {
      title: 'Add B-C (1) — C joins the tree',
      description: 'Pop B-C(1). Add C. Push the edges from C: C-E(3).',
      changeNote: 'Note: Prim eventually picks B-C(1) even though it was hidden at first.',
    },
    4: {
      title: 'Add C-E (3) — E joins the tree',
      description: 'Pop C-E(3). Add E. Push the edges from E: D-E(6).',
      changeNote: 'Only D is left outside the tree.',
    },
    5: {
      title: 'Add B-D (4) — tree complete',
      description:
        'Pop B-D(4). Add D — every node is now in the tree. The remaining edges (A-D, D-E) are rejected because they lead to nodes already in the tree.',
      changeNote: 'The tree spans all 5 nodes with 4 edges of minimum total weight.',
      notes: [
        'Total MST weight: 2 + 1 + 3 + 4 = 10.',
        "Compare with Kruskal's: the result is identical — only the intermediate choices differ.",
      ],
    },
  },
};
