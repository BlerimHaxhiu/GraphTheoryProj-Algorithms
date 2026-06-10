# Current State Audit

Date audited: 2026-06-09

Scope: GraphTheoryProj-Algorithms / `grafishqipp` Next.js app. This audit is documentation-only and does not refactor or add features.

## Executive Summary

The app is a bilingual graph algorithm visualization tool with a landing page at `/` and the main interactive workspace at `/app`. Users can build graphs visually, import them from an adjacency matrix or JSON, run graph algorithms, inspect matrix/report/stat panels, save/export/print results, and ask a small local chatbot for algorithm help or command execution.

The strongest parts are the algorithm coverage, the interactive SVG graph editor, localized educational explanations, and lightweight regression tests for algorithms, chatbot parsing, and translation parity.

The main weaknesses are production readiness and portfolio polish: critical interactive files use `@ts-nocheck`, production builds ignore TypeScript and ESLint failures, README metadata is stale, and several features are implemented as custom app logic without end-to-end UI tests.

## What The App Currently Does

- Provides a marketing/intro landing page with theme and language toggles.
- Provides a full graph workspace at `/app`.
- Lets users create, edit, drag, pan, and inspect SVG graph nodes and edges.
- Supports weighted, directed/undirected, straight/curved, parallel, and self-loop edges.
- Lets users rename nodes and edit edge weight/type/direction through dialogs.
- Generates predefined graphs: complete K4, star S5, cycle C5, simple tree.
- Generates custom complete, star, cycle, tree, and path graphs with up to 50 nodes.
- Imports graphs from an adjacency matrix.
- Imports graphs from validated JSON.
- Saves the current graph to `localStorage`.
- Loads a saved graph from `localStorage` on app startup.
- Exports graph JSON.
- Exports the current SVG graph view as PNG.
- Prints a dedicated printable graph report.
- Shows an adjacency matrix and a working distance matrix view during Floyd-Warshall.
- Shows algorithm execution steps in a report panel, including final MST summaries.
- Provides playback controls for pausing, resuming, stepping forward/backward, and resetting the current run.
- Shows graph statistics: node count, edge count, density, weak connected components, complete/not complete.
- Tracks execution history.
- Compares recent algorithm runs by measured execution time and stated complexity.
- Shows compact or expanded algorithm explanations.
- Provides English and Albanian UI text.
- Includes a local chatbot for algorithm explanations, comparison answers, current-step explanations, and command execution.

## Supported Algorithms

The supported algorithm type union and implementations currently cover:

- BFS
- DFS
- Dijkstra
- A*
- Bellman-Ford
- Floyd-Warshall
- Kruskal
- Prim

Current constraints:

- Dijkstra and A* reject negative edge weights before execution.
- Kruskal and Prim are disabled/rejected when the graph contains directed edges.
- BFS, DFS, Dijkstra, A*, Bellman-Ford, and Prim require a start node.
- Dijkstra and A* require an end node.
- Floyd-Warshall and Kruskal do not require start/end node selection.
- Bellman-Ford and Floyd-Warshall include negative-cycle handling in the algorithm layer.

Important nuance: A* now supports two heuristic modes. Euclidean heuristic is the default educational mode, while zero heuristic is preserved as a Dijkstra-equivalent comparison mode.

## Main Files And Modules

Routing and app shell:

- `src/app/layout.tsx`: root layout, theme provider, language provider, tooltip provider, metadata.
- `src/app/page.tsx`: landing page with animated particle background, CTA to `/app`, language/theme toggles.
- `src/app/app/layout.tsx`: layout wrapper for the main app route.
- `src/app/app/page.tsx`: main application state container and orchestration for graph creation, algorithms, save/export/import, and panels.
- `src/app/globals.css`: global styles and print-only report behavior.

Graph UI:

- `src/components/graph/GraphCanvas.tsx`: interactive SVG canvas; node dragging, panning, node rename, edge creation/editing, self-loops, curved edges, directed arrows, algorithm highlighting.
- `src/components/graph/ControlsPanel.tsx`: graph generation/import controls, algorithm selection, start/end node selection, animation speed, clear graph.
- `src/components/graph/AdjacencyMatrixTable.tsx`: displays current adjacency matrix and highlights traversal/path cells.
- `src/components/graph/AlgorithmReportPanel.tsx`: displays algorithm step log.
- `src/components/graph/PlaybackControls.tsx`: compact educational playback controls for algorithm runs.
- `src/components/graph/GraphStatsPanel.tsx`: displays graph stats.
- `src/components/graph/ExecutionHistoryPanel.tsx`: displays previous runs.
- `src/components/graph/CompareAlgorithmsPanel.tsx`: compares run history by measured time, complexity, V, E, and summary.
- `src/components/graph/ExportPanel.tsx`: save/export/print actions.
- `src/components/graph/AlgorithmExplanationPanel.tsx`: compact and detailed algorithm explanations.
- `src/components/graph/PrintableGraphReport.tsx`: print-specific graph/result report portal.

Algorithm and data logic:

- `src/types/graph.ts`: graph, edge, algorithm step, algorithm type, and execution history types.
- `src/lib/graph-algorithms.ts`: BFS, DFS, Dijkstra, A*, Bellman-Ford, Floyd-Warshall, Kruskal, Prim.
- `src/lib/graph-utils.ts`: edge normalization, adjacency matrix, graph stats, node/edge ID generation, labels, curve offsets, serialization.
- `src/lib/algorithm-explanations.ts`: detailed theory/explanation data.
- `src/lib/algorithm-example-steps.ts`: visual example step data.
- `src/lib/algorithm-example-steps-en.ts`: English step text overrides.
- `src/lib/translations.ts`: UI translations and older algorithm explanation table.

Chatbot:

- `src/components/chatbot/GraphChatbot.tsx`: floating chatbot UI.
- `src/lib/chatbot-command-parser.ts`: regex/rule parser for bilingual graph commands.
- `src/lib/chatbot-action-handler.ts`: executes parsed chatbot commands against app state.
- `src/lib/chatbot-responses.ts`: local educational chatbot responses.

Project/config:

- `package.json`: scripts and dependencies.
- `next.config.ts`: static export config, currently ignores TypeScript and ESLint errors during build.
- `netlify.toml`: Netlify static export build/publish config.
- `tests/*.test.js`: Node-based regression tests for algorithms, chatbot parser, and translation completeness.

## UI Structure

The app has two main experiences:

1. Landing page (`/`)
   - Full-screen animated particle background.
   - Language and theme toggles.
   - CTA into the app.
   - Feature/stat cards for algorithms, visualization, and export.

2. Main workspace (`/app`)
   - Sticky `AppHeader` with home link, app title, language toggle, theme toggle.
   - Left controls panel with:
     - animation speed slider,
     - graph suggestions,
     - matrix import,
     - JSON import,
     - algorithm selection,
     - start/end node selectors,
     - run button,
     - clear graph button.
   - Main content area with:
     - graph canvas,
     - adjacency matrix,
     - algorithm report,
     - graph statistics,
     - execution history,
     - export panel,
     - algorithm explanation,
     - algorithm comparison.
   - Floating chatbot in the bottom-right corner.
   - Hidden print portal for generated reports.
   - Most major sections can be toggled into a fullscreen-style section wrapper.

## Graph Creation Flow

Manual graph creation:

1. Double-click empty canvas space to add a node at that position.
2. Drag nodes to reposition them.
3. Click/select nodes to start edge creation flow.
4. Select a target node to open the edge dialog.
5. Configure edge weight, straight/curved type, and directed/undirected direction.
6. Save the edge.
7. Double-click nodes to rename them.
8. Right-click/delete action removes nodes and connected edges.
9. Double-click edges to edit them.
10. Drag the edge handle to adjust a curve.

Generated graph flow:

1. Open graph suggestions.
2. Choose a fixed graph or custom graph type/count.
3. Existing execution state is reset.
4. New nodes/edges replace the current graph.

Matrix import flow:

1. Paste a square numeric matrix.
2. `0` means no edge, except the diagonal remains zero.
3. `inf`/`infinity` means no edge.
4. If the matrix is symmetric, the app creates undirected edges.
5. If the matrix is not symmetric, the app creates directed edges.
6. Nodes are laid out in a circle.

JSON import flow:

1. Paste JSON containing `nodes` and `edges`.
2. The app validates node IDs, labels, positions, edge IDs, endpoints, weights, direction, and curve metadata.
3. If valid, current graph state is replaced.

Persistence/export flow:

1. Save stores normalized graph data in `localStorage` under `grafiShqipGraph`.
2. Startup attempts to load `grafiShqipGraph`.
3. JSON export downloads `grafi.json`.
4. PNG export serializes the SVG into a canvas image and downloads `grafi.png`.
5. Print opens the browser print flow using a print-only report component.

## Algorithm Execution Flow

1. User selects an algorithm in `ControlsPanel`.
2. UI asks for required start/end nodes depending on the algorithm.
3. `runAlgorithm` in `src/app/app/page.tsx` clears any active interval and initializes report state.
4. It validates missing nodes, directed MST restrictions, and negative-weight restrictions.
5. It calls the relevant function from `src/lib/graph-algorithms.ts`.
6. The algorithm returns an ordered `AlgorithmStep[]`.
7. The page stores valid steps in `algorithmStepsHistory` and remaining steps in `algorithmStepsQueue`.
8. `processAlgorithmStep` advances one step at a time using `setInterval` and the selected animation speed.
9. Playback controls can pause the interval, resume it, step forward/backward by index, or reset the current run.
10. Current step drives:
   - canvas node/edge/path highlighting,
   - adjacency matrix highlighting,
   - bottom canvas message overlay,
   - algorithm report log.
11. Completion is appended as a final report message.
12. A run summary is saved into `executionHistory`.
13. History feeds the execution history panel and comparison panel.
14. The last executed algorithm feeds the explanation panel.

The chatbot can also trigger this same execution path by parsing commands such as "Run Dijkstra from A to F" or Albanian equivalents.

## Bugs Or Incomplete Features

- `src/app/app/page.tsx`, `src/components/graph/ControlsPanel.tsx`, and `src/components/graph/GraphCanvas.tsx` use `@ts-nocheck`. These are central interactive files, so type safety is mostly absent where regressions are most likely.
- `next.config.ts` has `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. Production builds can succeed even with TypeScript or lint problems.
- A* now has a real Euclidean heuristic mode, but its usefulness still depends on graph layout having spatial meaning. Zero-heuristic mode remains available for comparison.
- The package name is still `nextn`, which weakens project identity.
- README is stale in multiple places: it says Next.js 14 while `package.json` uses Next 15, and it tells users to open port 3000 while the dev script runs port 9002.
- The blueprint says a generative AI algorithm recommendation feature should exist, but the current app uses a local rule/response chatbot and no visible Genkit recommendation flow.
- `src/ai/genkit.ts` and `src/ai/dev.ts` exist, but AI integration does not appear central to the current visible app.
- Execution timing measures only algorithm step generation time, not animation time or full user-perceived runtime. The comparison panel can therefore look more scientific than it really is.
- The comparison complexity table states heap-style complexities, but the implementations use arrays sorted each loop for priority queues. The educational complexity and actual implementation complexity can diverge.
- The UI has rich manual interactions but no end-to-end browser tests for creating/editing graphs, importing data, exporting, printing, or running algorithms through the UI.
- Playback controls now exist, but they still need browser/e2e coverage.
- Error handling is mostly toast-based. Invalid JSON/matrix/localStorage states are handled, but there is no broader recovery UX for malformed browser storage or failed PNG export beyond a toast.
- Large graphs are partly limited in generated graph input, but manual or JSON-imported large graphs could create performance/usability issues.
- Accessibility is mixed: many controls have labels/ARIA, but the SVG editor's graph editing workflow is mostly pointer-driven and likely hard to use from the keyboard.

## GitHub Portfolio Weaknesses

- README does not match the current app/runtime details.
- README has generic clone placeholders instead of real repository/project links.
- The project name in `package.json` is generic (`nextn`) rather than portfolio-ready.
- Build config hides TypeScript and lint failures, which is a red flag for reviewers.
- Core files using `@ts-nocheck` reduce confidence in engineering quality.
- No screenshots, GIFs, or hosted demo link are documented in the README.
- No architecture diagram or feature walkthrough is included.
- No explicit test/status badge or "how to verify" section for the three existing test scripts.
- No license file is visible even though README says MIT license.
- Dependencies include Firebase, Genkit, TanStack Query Firebase, and Netlify CLI, but current visible app usage does not clearly justify all of them.
- The app has strong bilingual/educational value, but the README undersells that differentiator.
- The repo appears to contain unrelated `.docx` and `.pptx` files outside the app folder, which can distract from the portfolio project.

## Best Improvement Opportunities

Highest impact:

- Remove `@ts-nocheck` from the main page, controls panel, and graph canvas in small stages.
- Stop ignoring TypeScript and ESLint during production builds once the codebase is clean.
- Update README with the real app name, port 9002, Next 15, screenshots, demo link, supported algorithms, and test commands.
- Add browser/e2e tests for the A* mode selector, Euclidean/zero comparison, and `g(n)`, `h(n)`, `f(n)` report output.
- Add Playwright tests for the main user flows: add nodes, add edge, run Dijkstra, import matrix, import JSON, export JSON, switch language/theme.

Algorithm/UX improvements:

- Add browser/e2e tests for playback controls: pause, resume, next step, previous step, reset result.
- Add browser/e2e tests for the Floyd-Warshall working distance matrix and final MST visualization states.
- Make comparison metrics clearer: "calculation time" instead of implying total algorithm runtime.
- Align displayed complexity with the actual implementation or update the implementation to use real priority queues.
- Add graph validation warnings for negative cycles, disconnected MST input, self-loops, and parallel edges where relevant.

Portfolio polish:

- Rename package/project metadata to match GrafiShqip or Graph Algorithm Visualizer.
- Add a concise architecture section explaining `page.tsx -> graph modules -> algorithm engine -> panels`.
- Add a "Why this project matters" section focused on algorithm education, bilingual support, and visualization.
- Add screenshots of the main canvas, algorithm report, matrix, and chatbot.
- Add a license file or remove the README license claim.
- Move non-repo documents out of the project root or document why they are included.

## Verification Snapshot

Commands run during audit:

- `npm run test:algorithms`: passed.
- `npm run test:chatbot`: passed, all 27 parser cases passed.
- `npm run test:translations`: passed.
- `npm run typecheck`: passed.

Not run:

- `npm run build`. Build output was not generated during this audit to avoid adding build artifacts while the task was documentation-only.
