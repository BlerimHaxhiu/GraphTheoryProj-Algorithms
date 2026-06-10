# Floyd-Warshall And MST Visualization

Date: 2026-06-09

## Problem Addressed

The app already executed Floyd-Warshall, Kruskal, and Prim correctly, but the visual feedback was weaker than the rest of the platform:

- Floyd-Warshall showed update messages, but the matrix panel did not clearly present the evolving distance matrix.
- Kruskal and Prim reported selected MST edges in text, but the final tree was not clearly persistent on the canvas.

## Files Changed

- `src/lib/graph-algorithms.ts`
- `src/types/graph.ts`
- `src/components/graph/AdjacencyMatrixTable.tsx`
- `src/components/graph/AlgorithmReportPanel.tsx`
- `src/components/graph/GraphCanvas.tsx`
- `src/app/app/page.tsx`
- `src/lib/translations.ts`
- `tests/graph-algorithms.test.js`

## New Step Data

Algorithm steps now optionally carry:

- `matrixSnapshot`
- `matrixContext`
- `mstEdges`
- `totalWeight`

Floyd-Warshall uses the matrix snapshot to show the working distance matrix during playback, along with `k/i/j` context when available.

Kruskal and Prim now end with a final MST step that keeps the selected tree edges visible.

## UI Behavior

- The matrix panel switches to `Working Distance Matrix` during Floyd-Warshall playback.
- Updated cells are highlighted.
- The matrix panel shows a small context line for `k`, `i`, and `j` when the current step provides them.
- The graph canvas highlights final MST edges and their incident nodes.
- The report panel labels the final tree as `Final MST` and shows total weight.

## Playback Compatibility

The new metadata works with:

- autoplay
- pause
- resume
- next step
- previous step
- restart run

The current playback step remains the source of truth, so stepping backward restores the same matrix snapshot or MST highlight that was visible at that step.

## Tests Added

- Floyd-Warshall working-matrix snapshot coverage
- Floyd-Warshall matrix-context coverage
- Kruskal final MST metadata coverage
- Prim final MST metadata coverage

## Remaining Limitations

- The distance matrix is shown as snapshots from algorithm steps, not as a fully animated internal solver.
- MST cycle rejection is still message-led rather than a separate visual subpanel.
- Browser/e2e checks are still the main missing verification layer for the new visuals.
