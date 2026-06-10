# A* Educational Guide

Date: 2026-06-09

Audience: students learning shortest-path algorithms through the GraphTheoryProj-Algorithms app.

## Big Idea

Dijkstra and A* both search for the shortest path in graphs with non-negative edge weights.

The difference is that Dijkstra only asks:

```text
How much have I already paid?
```

A* asks:

```text
How much have I already paid, and how far do I probably still need to go?
```

## Dijkstra

Dijkstra uses the known cost from the start node.

```text
priority(n) = distance from start to n
```

This is reliable and optimal for non-negative weights, but it does not know where the destination is. It may explore many correct-but-unhelpful directions before reaching the target.

## A*

A* adds a heuristic estimate.

```text
f(n) = g(n) + h(n)
```

Where:

- `g(n)` is the real cost from the start node to node `n`.
- `h(n)` is the estimated remaining cost from node `n` to the goal.
- `f(n)` is the estimated total path cost through node `n`.

A* chooses the node with the smallest `f(n)`.

## Simple Diagram

```text
Start ---- paid cost ----> n ---- estimated cost ----> Goal

          g(n)                 h(n)

                 f(n) = g(n) + h(n)
```

## Heuristic

A heuristic is an educated guess. It should point the search toward the goal without pretending to know the exact future.

In this app, A* supports two modes:

- Zero Heuristic: `h(n) = 0` for every node.
- Euclidean Heuristic: `h(n)` is based on the straight-line distance from the current node to the target node.

## Zero Heuristic Mode

Zero mode is useful for comparison.

```text
f(n) = g(n) + 0
f(n) = g(n)
```

That means A* behaves like Dijkstra. This is not a bug; it is an educational mode for seeing what the heuristic contributes.

## Euclidean Heuristic Mode

Euclidean mode uses the node positions already visible in the graph editor.

```text
h(n) = straight-line distance from n to target
```

The app scales this distance using the graph's edge weights so the estimate remains conservative for user-created graphs.

This mode is useful when the graph layout has spatial meaning, such as:

- GPS navigation,
- pathfinding in games,
- robotics and motion planning.

## Why A* Can Be Faster

Dijkstra expands outward from the start based only on known cost.

A* can focus toward the target because the heuristic makes nodes closer to the destination look more promising.

Good heuristic:

```text
f(n) helps the search move toward the goal.
```

Weak heuristic:

```text
A* explores more like Dijkstra.
```

Bad heuristic:

```text
If it overestimates too much, A* may lose optimality.
```

## What To Watch In The App

When A* runs, the report shows:

```text
g(n) = known cost
h(n) = heuristic estimate
f(n) = g(n) + h(n)
```

Try this comparison:

1. Build a weighted graph with visible coordinates.
2. Run A* with Euclidean Heuristic.
3. Run A* with Zero Heuristic.
4. Compare the report and algorithm comparison panel.

The shortest path should remain correct, but the visited order and score explanations can differ.
