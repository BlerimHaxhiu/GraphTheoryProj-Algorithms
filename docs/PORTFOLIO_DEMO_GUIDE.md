# Portfolio Demo Guide

How to demo the **Interactive Graph Algorithm Visualization and Learning Platform**
for recruiters, engineers, and interviews.

- **Live demo:** https://teoriaegrafeve.netlify.app
- **Local:** `npm install && npm run dev` → http://localhost:9002

---

## 3-Minute Recruiter Demo Path

Goal: show breadth, polish, and a unique differentiator fast.

1. **Open the landing page** (`/`). One line: *"An interactive platform for learning graph algorithms — build a graph, watch the algorithm run step by step, and ask a built-in tutor why."*
2. **Enter the workspace** → load a sample graph (Graph Suggestions → *Complete K4*) or let the seeded demo graph appear.
3. **Run Dijkstra** (Run Algorithm → Shortest Path → Dijkstra; pick start **A**, end **F**, Run). Watch nodes/edges light up and the shortest path highlight.
4. **Switch A\* to Euclidean mode** and re-run — point out the live `g(n) / h(n) / f(n)` breakdown. *"Same problem, a smarter heuristic — and the app shows the math."*
5. **Open the Algorithm Mentor** (floating button → Mentor tab) and ask *"Which algorithm should I use?"* and *"Compare A\* and Dijkstra."* Emphasize: **deterministic, local, no API key.**
6. **Toggle to Albanian (SQ)** — the entire UI, explanations, and tutor localize. *"Built bilingual from the ground up."*

Closing line: *"Eight algorithms, a step debugger, a deterministic tutor, two languages, tests, and a static deploy on Netlify."*

---

## 5-Minute Technical Demo Path

Goal: show engineering depth and decisions.

1. **Data model & engine** — `src/lib/graph-algorithms.ts` returns an ordered list of typed `AlgorithmStep`s (visit-node, traverse-edge, highlight-path, update-matrix-cell, message). The UI is a pure renderer of these steps; playback just indexes into the array. *This separation is why pause/step-back/restart are trivial.*
2. **A\* admissibility** — open `getMinWeightPerPixel()`. Explain the problem: a Euclidean heuristic in pixel space can overestimate true graph cost and break optimality. The fix scales the heuristic by the minimum weight-per-pixel ratio, keeping it **admissible** so A\* still returns optimal paths. Show the test `aStar euclidean heuristic … keeps the shortest path correct`.
3. **Floyd–Warshall as a teaching tool** — each `k` iteration emits a full matrix snapshot; the adjacency panel swaps to the live working distance matrix and highlights the updated cell. Negative-cycle-affected pairs are marked `-inf`.
4. **Deterministic Mentor** — `src/lib/mentor/`. Walk the pipeline: `classifyMentorIntent()` (regex/NLP, bilingual) → intent engines (recommend / compare / why / step-why / graph-aware). `step-why` is grounded in the *current run step*, so "why was this node selected?" answers from real state, and returns honestly when there is no active step. No LLM, fully testable (13 checks).
5. **Testing & build** — `npm run test:algorithms|playback|chatbot|mentor|translations` + `npm run typecheck`. Static export (`output: 'export'`) → `out/` → Netlify.

---

## What the Screenshots Prove

| Screenshot | Proves |
| --- | --- |
| `01-landing-page` | Product framing & visual polish |
| `02-main-workspace` / `03-graph-editor` | Full interactive workspace + SVG editor |
| `04-dijkstra-run` | Correct shortest-path visualization |
| `05-astar-euclidean-mode` | Heuristic learning with g/h/f breakdown |
| `06-playback-controls` | Step-debugger UX (pause/step/restart) |
| `07-floyd-warshall-matrix` | Dynamic-programming matrix visualization |
| `08-mst-visualization` | Union-Find / greedy MST result |
| `09-algorithm-mentor` | Deterministic, local tutoring |
| `10-algorithm-comparison` | Empirical comparison of runs |
| `11-albanian-language` | Real bilingual localization |
| `12-printable-report` | Export/report workflow |

## How to Explain the Project in an Interview

> "It's an interactive learning platform for graph algorithms. The interesting
> engineering is the **step-stream architecture**: every algorithm emits a typed
> list of steps, and the entire UI — animation, playback, reports, the matrix —
> is a pure function of the current step index. That made the step-debugger and
> the bilingual reports almost free. The two parts I'm proudest of are the
> **admissible A\*** (I scale a Euclidean heuristic so it can't overestimate and
> break optimality) and the **deterministic Algorithm Mentor** — a local,
> testable tutor that recommends, compares, and explains algorithms *and* answers
> 'why was this node selected?' from the live run, with zero API calls."

Be ready to discuss: why determinism over an LLM (testability, offline, cost,
trust), how localization stays in sync (parity tests), and the static-export
deployment model.

## How This Supports an AI Automation Engineer Positioning

- **Intent parsing → action execution:** the assistant turns natural language
  ("Run Dijkstra from A to F", "Create MST using Kruskal") into real app actions
  via a parser + action handler — the core loop of automation work.
- **Deterministic, testable agents:** the Mentor is an "agent" whose behavior is
  fully specified and unit-tested. That mirrors production automation where you
  need reliability and auditability, not just a model call.
- **Grounding in live state:** `step-why` answers from the current execution
  context and refuses to invent — the same discipline (grounding + honest
  fallbacks) that separates robust automation from demos.
- **Bilingual NLP:** intent classification works across English and Albanian,
  showing language-agnostic pipeline design.

See also: `PORTFOLIO_VALUE.md`, `ALGORITHM_MENTOR_ARCHITECTURE.md`, `ASTAR_EDUCATIONAL_GUIDE.md`.
