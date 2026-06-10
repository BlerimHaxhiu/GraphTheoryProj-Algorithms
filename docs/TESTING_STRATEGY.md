# Testing Strategy

This document describes the current testing approach and the most important future test coverage for the graph algorithm learning platform.

## Current Tests

### Algorithm Tests

Command:

```bash
npm run test:algorithms
```

What it protects:

- Dijkstra shortest path behavior.
- A* shortest-path behavior in zero-heuristic and Euclidean-heuristic modes.
- A* score reporting for `g(n)`, `h(n)`, and `f(n)`.
- BFS and DFS traversal order on simple graphs.
- Bellman-Ford negative-edge behavior without negative cycles.
- Bellman-Ford reverse-edge handling for undirected graphs.
- Floyd-Warshall all-pairs shortest path output.
- Floyd-Warshall negative-cycle reporting.
- Kruskal and Prim MST total weight agreement.
- Mixed directed and undirected edge behavior.

Expected output:

- Individual `PASS` lines for each algorithm case.
- Exit code `0` when all tests pass.

### Chatbot Parser Tests

Command:

```bash
npm run test:chatbot
```

What it protects:

- English command parsing.
- Albanian command parsing.
- Dijkstra, BFS, DFS, Bellman-Ford, Kruskal, and Prim command detection.
- Shortest path request mapping.
- MST request mapping.
- Explain-only question detection.
- Clear/reset command detection.
- Empty input handling.
- Common typo handling such as `dikstra`.

Expected output:

- `PASS` lines for parser cases.
- Summary similar to `All 27 parser cases passed.`
- Exit code `0` when all cases pass.

### Translation Tests

Command:

```bash
npm run test:translations
```

What it protects:

- English and Albanian translation key parity.
- Algorithm explanation field parity.
- Required explanation field coverage.
- Example-step parity between languages.
- English step override coverage.
- Basic checks that Albanian text does not leak into English example steps.

Expected output:

- Many `PASS` lines for translation and example-step checks.
- Summary similar to `All translation parity checks passed.`
- Exit code `0` when all checks pass.

### Playback Utility Tests

Command:

```bash
npm run test:playback
```

What it protects:

- Step index clamping.
- Next/previous step index behavior.
- Report log reconstruction for manual stepping.
- Completion message appending.
- Progress label formatting.

Expected output:

- `PASS` lines for playback helper cases.
- Exit code `0` when all checks pass.

### Typecheck

Command:

```bash
npm run typecheck
```

What it protects:

- TypeScript project-level type correctness for files not bypassed by `@ts-nocheck`.
- Import correctness.
- General TypeScript configuration health.

Expected output:

- No TypeScript error output.
- Exit code `0` when typecheck passes.

## Coverage Gaps

- No Playwright or browser end-to-end tests.
- No automated test for manual graph creation in the SVG canvas.
- No automated test for node dragging, panning, renaming, or edge editing.
- No automated test for matrix import through the UI.
- No automated test for JSON import through the UI.
- No automated test for PNG export or print report behavior.
- No automated test for language/theme switching in the browser.
- No automated test for chatbot-triggered algorithm execution inside the UI.
- No browser test for pause/resume/next/previous/restart playback controls.
- No visual regression tests for canvas rendering.
- Central interactive files currently use `@ts-nocheck`, reducing the value of TypeScript verification in those areas.

## Most Important Future Playwright Tests

1. Load `/app`, create two nodes, create a weighted edge, and verify it appears on the canvas.
2. Generate a predefined graph and verify node/edge counts update in stats.
3. Import a valid adjacency matrix and verify matrix/table/canvas state.
4. Import valid JSON and verify graph state.
5. Run Dijkstra from a start node to an end node and verify report output and highlighted path.
6. Run BFS and verify traversal report entries appear.
7. Try running Dijkstra with missing start/end node and verify validation messaging.
8. Run A* in Euclidean and zero modes and verify report/comparison mode output.
9. Pause an algorithm run, step forward/backward, resume, finish, and restart the run.
10. Switch between English and Albanian and verify key labels change.
11. Open the chatbot, send a supported command, and verify the algorithm run is triggered.
12. Export JSON and verify downloaded payload shape.

## Recommended Test Policy

- Keep algorithm tests fast and deterministic.
- Keep parser tests broad because command parsing is regex-heavy.
- Keep translation parity tests mandatory for bilingual changes.
- Add Playwright tests before major UI refactors.
- Add CI to run `typecheck`, `test:algorithms`, `test:playback`, `test:chatbot`, and `test:translations`.
