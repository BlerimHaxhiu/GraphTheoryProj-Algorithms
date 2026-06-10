# Algorithm Engine

The algorithm engine lives in `src/lib/graph-algorithms.ts`. It accepts graph data from the app state and returns ordered `AlgorithmStep[]` objects. Those steps drive the canvas visualization, report panel, matrix highlighting, execution history, and print/report outputs.

## Engine Contract

Input:

- `nodes: Node[]`
- `edges: Edge[]`
- optional `startNodeId`
- optional `endNodeId`

Output:

- `AlgorithmStep[]`

Some steps also carry optional visualization metadata:

- `matrixSnapshot`
- `matrixContext`
- `mstEdges`
- `totalWeight`

Step types:

- `visit-node`
- `traverse-edge`
- `highlight-path`
- `reset`
- `message`
- `update-matrix-cell`

## BFS

Purpose: Traverses the graph in breadth-first order from a start node.

Input: nodes, edges, start node ID.

Output: ordered steps showing node visits and traversed edges.

Constraints: requires a start node.

Current implementation notes: builds an unweighted adjacency map and uses queue semantics.

Complexity: `O(V + E)`.

Visualization strategy: highlight the start node, then highlight each edge traversal and newly visited node.

Known limitations: does not expose shortest-path tree reconstruction as a dedicated final result.

## DFS

Purpose: Traverses the graph in depth-first order from a start node.

Input: nodes, edges, start node ID.

Output: ordered steps showing recursive node visits and edge traversals.

Constraints: requires a start node.

Current implementation notes: uses recursive DFS over an unweighted adjacency map.

Complexity: `O(V + E)`.

Visualization strategy: highlight each visited node and traversed edge in first-visit order.

Known limitations: does not guarantee shortest path and does not expose backtracking as a separate visual step.

## Dijkstra

Purpose: Finds a shortest path between a start and end node when all edge weights are non-negative.

Input: nodes, edges, start node ID, end node ID.

Output: visit/traverse steps, distance update messages, and a final highlighted shortest path when reachable.

Constraints:

- requires a start node,
- requires an end node,
- does not support negative edge weights.

Current implementation notes: builds weighted adjacency and uses an array sorted by priority as a simple priority queue.

Complexity: documented in the UI as `O(E log V)`, but the current array-sorting implementation may not match heap-based complexity on larger graphs.

Visualization strategy: highlight visited nodes, traversed edges, distance update messages, and final path.

Known limitations: negative weights are rejected; priority queue implementation is simple rather than optimized.

## A*

Purpose: Goal-directed shortest path search from a start node to an end node.

Input: nodes, edges, start node ID, end node ID.

Output: visit/traverse steps, score update messages, and a final highlighted path when reachable.

Constraints:

- requires a start node,
- requires an end node,
- does not support negative edge weights.

Current implementation notes: structurally follows A* with `gScore`, `hScore`, `fScore`, `cameFrom`, open set, and closed set.

Supported heuristic modes:

- `euclidean`: default educational mode. Uses node coordinates and the target node to estimate remaining distance.
- `zero`: compatibility/teaching mode. Uses `h(n) = 0`, making A* behave like Dijkstra.

The Euclidean heuristic is scaled by the graph's observed minimum edge-weight-per-pixel ratio. This keeps the heuristic visually understandable while reducing the risk of overestimating cost on user-created graphs with arbitrary weights.

Complexity: worst case similar to Dijkstra; commonly described as `O(E log V)` with an optimized priority queue.

Visualization strategy: highlight visited nodes, traversed edges, score updates, and final path. Report messages expose `g(n)`, `h(n)`, and `f(n)` so students can see why a node was selected.

Known limitations: Euclidean mode is educational and conservative, but graph layout still matters. If node positions do not represent real distance, the heuristic may be less informative.

### A* Heuristic Modes

Zero heuristic mode:

- always returns `0`,
- preserves the previous Dijkstra-equivalent behavior,
- is useful when students want to compare A* and Dijkstra directly.

Euclidean heuristic mode:

- calculates geometric distance between the current node and target node,
- scales that distance by the minimum observed edge cost per pixel,
- keeps shortest-path correctness for the supported test cases,
- gives students a visible `g + h = f` explanation of A* selection.

## Bellman-Ford

Purpose: Computes shortest paths from a single source and detects negative-weight cycles.

Input: nodes, edges, start node ID.

Output: relaxation steps, distance messages, negative-cycle messages, and highlighted paths when no negative cycle is detected.

Constraints: requires a start node.

Current implementation notes: expands undirected edges into both directions and relaxes edges up to `V - 1` times, then checks for additional relaxation.

Complexity: `O(V * E)`.

Visualization strategy: highlight edge relaxations, report iteration progress, and summarize shortest paths or negative-cycle detection.

Known limitations: cycle visualization is reported textually rather than as a dedicated highlighted cycle.

## Floyd-Warshall

Purpose: Computes shortest paths between every pair of nodes.

Input: nodes and edges.

Output: intermediate-node steps, matrix update steps, path summaries, and a final distance matrix in the report log.

Constraints: can run without start/end nodes; empty graphs produce an explanatory message.

Current implementation notes: maintains internal `dist` and `next` matrices, supports directed and undirected edges, and marks pairs affected by negative cycles as `-inf`.

Complexity: `O(V^3)` time and `O(V^2)` space.

Visualization strategy: highlight intermediate nodes, emit matrix update steps, expose a working distance matrix snapshot during execution, and report final paths/matrix.

Known limitations: the matrix view is educational and intentionally derived from step snapshots, so it does not animate every internal array mutation separately.

## Kruskal

Purpose: Builds a minimum spanning tree for an undirected graph.

Input: nodes and edges.

Output: edge consideration steps, accepted/rejected edge messages, selected edge summary, and total MST weight.

Constraints:

- requires an undirected graph,
- does not require a start node.

Current implementation notes: sorts undirected edges by weight and uses a disjoint-set union structure.

Complexity: `O(E log E)`.

Visualization strategy: highlight considered edges, accepted MST edges, cycle rejections, and a final MST edge-set summary that stays visible on the canvas.

Known limitations: cycle rejections are still message-led, and the engine does not animate a separate spanning-tree construction panel.

## Prim

Purpose: Builds a minimum spanning tree by growing from a selected start node.

Input: nodes, edges, start node ID.

Output: node visits, candidate edge updates, accepted edge messages, selected edge summary, and total MST weight.

Constraints:

- requires a start node,
- requires an undirected graph.

Current implementation notes: filters to undirected edges, builds weighted adjacency, and uses an array sorted by key value as a simple priority queue.

Complexity: documented as `O(E log V)` with a heap-style implementation.

Visualization strategy: highlight selected nodes, candidate edges, accepted edges, and a final MST edge-set summary that remains visible at completion.

Known limitations: disconnected graphs report incomplete MST; priority queue implementation is simple rather than optimized.

## Cross-Cutting Notes

- Algorithms do not mutate the React graph state directly.
- All algorithms return steps for the UI to consume.
- Playback controls navigate those returned steps by index; they do not change algorithm output.
- Error and validation behavior is split between UI-level validation and algorithm-level messages.
- The implementation is intentionally educational: steps and messages are as important as final numeric results.
