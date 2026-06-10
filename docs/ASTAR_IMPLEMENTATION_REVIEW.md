# A* Implementation Review

Date: 2026-06-09

Scope: current A* implementation before the A* quality update.

## Current Implementation

The A* implementation lives in `src/lib/graph-algorithms.ts` as `aStar(...)`.

Current inputs:

- `nodes`
- `edges`
- `startNodeId`
- `endNodeId`

Current output:

- `AlgorithmStep[]`

The implementation uses the expected A* data structures:

- `openSet`
- `closedSet`
- `cameFrom`
- `gScore`
- `fScore`

It builds weighted adjacency from the graph and rejects negative edge weights. It then repeatedly sorts the open set by `fScore`, expands the lowest-scoring node, relaxes outgoing edges, updates predecessor data, and reconstructs the path when the target is reached.

## Current Heuristic Behavior

The current helper is named `heuristic(nodeA, nodeB)`, but it always returns `0`.

That means:

```text
f(n) = g(n) + h(n)
f(n) = g(n) + 0
f(n) = g(n)
```

So A* currently prioritizes nodes using only the known distance from the start node.

## Why Heuristic Equals Zero

The original implementation intentionally used a neutral heuristic because the graph editor allows arbitrary edge weights.

If the app used raw Euclidean distance directly, the heuristic could overestimate the actual remaining path cost. Overestimation can break A* optimality and produce a non-shortest path.

The zero heuristic is always admissible and therefore safe, but it removes the main educational advantage of A*.

## How Closely It Matches Dijkstra

With `h(n) = 0`, A* behaves very closely to Dijkstra:

- both prioritize by known cost from the start,
- both require non-negative weights,
- both find optimal shortest paths under current constraints,
- both expand nodes based on cumulative path cost rather than goal-directed estimation.

The current A* still uses A*-style variable names and reports `gScore`/`fScore`, but because `fScore` equals `gScore`, students cannot see the real difference between Dijkstra and A*.

## Main Educational Gap

Students cannot currently observe:

- how a heuristic estimates remaining distance,
- how `g(n)`, `h(n)`, and `f(n)` interact,
- why A* may expand fewer nodes than Dijkstra,
- when A* reduces to Dijkstra,
- how heuristic quality changes search behavior.

## Recommended Improvement

Add explicit heuristic modes:

- Zero Heuristic: preserves the current Dijkstra-equivalent behavior.
- Euclidean Heuristic: uses node coordinates to estimate remaining cost.

For correctness with arbitrary user edge weights, Euclidean distance should be scaled by the graph's observed minimum cost-per-distance ratio. This keeps the heuristic educational and visually understandable while reducing the risk of overestimating path cost.
