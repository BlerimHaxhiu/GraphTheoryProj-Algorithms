# Final Portfolio Report

**Project:** Interactive Graph Algorithm Visualization and Learning Platform
**Author:** Blerim Haxhiu
**Date:** 2026-06-10
**Repository:** https://github.com/BlerimHaxhiu/GraphTheoryProj-Algorithms
**Live demo:** https://teoriaegrafeve.netlify.app

---

## 1. Final project status

✅ **Portfolio-ready and deployed.** The application is feature-complete for its
scope, tested, documented, committed to GitHub, and live on Netlify. All nine
preparation phases are complete.

## 2. Features implemented

- **8 graph algorithms** (BFS, DFS, Dijkstra, A\*, Bellman–Ford, Floyd–Warshall,
  Kruskal, Prim) implemented as typed step emitters.
- **Interactive SVG editor** — weighted/unweighted, directed/undirected, curved &
  parallel edges, self-loops; generators + matrix/JSON import.
- **A\* learning mode** — Euclidean (admissibly scaled) and zero heuristics with
  live `g(n)/h(n)/f(n)`.
- **Manual playback** — pause/resume/step/restart over the step stream.
- **Floyd–Warshall** working distance matrix; **Kruskal/Prim** MST highlight.
- **Deterministic Algorithm Mentor** — local, no API: recommend, graph-aware
  recommend, compare, explain, and step-why.
- **Bilingual** English/Albanian UI, explanations, and tutor.
- **Export** JSON/PNG + printable report; execution history + comparison.

## 3. Tests passed

| Suite | Cases | Result |
| --- | --- | --- |
| `typecheck` | `tsc --noEmit` | ✅ clean |
| `test:algorithms` | 14 | ✅ |
| `test:playback` | 5 | ✅ |
| `test:chatbot` | 27 | ✅ |
| `test:mentor` | 13 | ✅ |
| `test:translations` | parity | ✅ |
| `build` | static export | ✅ compiled + exported |

## 4. Screenshots created

12/12 captured and visually verified, in `docs/screenshots/` — landing,
workspace, editor, Dijkstra, A\* Euclidean, playback, Floyd–Warshall matrix, MST,
Algorithm Mentor, comparison, Albanian UI, printable report. Reproducible via
`npm run demo:screenshots`.

## 5. GitHub repo status

✅ Committed and pushed to `main` (fast-forward, no force).
- Commit: `feat: portfolio-ready graph algorithm learning platform` (`af06897`)
- Remote: `origin` → `https://github.com/BlerimHaxhiu/GraphTheoryProj-Algorithms.git`
- No secrets, no `node_modules`, no build output committed (verified).

## 6. Netlify deploy status

✅ Production deploy live and verified (HTTP 200 on `/` and `/app`, byte sizes
matching the local build).
- URL: https://teoriaegrafeve.netlify.app
- Method: `netlify deploy --prod --dir=out --no-build` (CLI authenticated + linked).
- Details: `docs/NETLIFY_DEPLOYMENT_REPORT.md`.

## 7. Known limitations

- Assistant + Mentor are intentionally **deterministic** (no LLM) — a design
  choice for testability and offline use, not a missing feature.
- Tuned for small/medium teaching graphs.
- `typescript.ignoreBuildErrors` / `eslint.ignoreDuringBuilds` are enabled for
  smooth deploys; type safety is enforced via `npm run typecheck` (clean).
- No Playwright assertion tests in CI yet (the screenshot script exercises the UI
  but is a capture tool).

## 8. Recommended CV bullet points

- Built an interactive, bilingual graph-algorithm learning platform (Next.js,
  TypeScript) implementing **8 algorithms** with step-by-step visualization and a
  manual step-debugger; deployed as a static site on Netlify.
- Designed a **step-stream architecture** where the entire UI (animation,
  playback, reports, live matrix) is a pure function of a typed `AlgorithmStep[]`,
  making playback and bilingual reporting trivial to add.
- Engineered an **admissibly scaled A\*** heuristic that keeps Euclidean guidance
  optimal on weighted graphs, with live `g/h/f` reporting for teaching.
- Created a **deterministic, local "Algorithm Mentor"** that classifies intent
  and answers recommend/compare/explain questions — including *"why was this node
  selected?"* grounded in live run state — fully unit-tested, no API calls.
- Added **Playwright screenshot automation** that seeds deterministic state and
  verifies each capture (size + content), and authored a full documentation set.

## 9. Recommended interview explanation

> "It's an interactive platform for learning graph algorithms. The core idea is a
> step-stream architecture: each algorithm emits a typed list of steps, and the
> whole UI is a pure renderer of the current step index — so the step-debugger,
> the synchronized report, and the bilingual output were almost free. The two
> pieces I'm proudest of are an **admissible A\*** (I scale a Euclidean heuristic
> so it can't overestimate and break optimality) and a **deterministic Algorithm
> Mentor** — a local, tested tutor that recommends, compares, and explains
> algorithms and answers 'why was this node selected?' from the live run, with
> zero API calls. I deliberately chose determinism over an LLM for testability,
> offline use, and trust."

Follow-up topics to be ready for: admissibility/optimality of heuristics,
union-find in Kruskal, why the step model simplifies the UI, how localization
stays in sync (parity tests), and the static-export deployment model.

## 10. Suggested next project

A natural progression that builds on the same strengths:

- **"Algorithm Mentor, online":** add an optional LLM tier *behind* the existing
  deterministic interface — the deterministic engine becomes the ground-truth /
  guardrail layer, and the LLM only paraphrases or handles open-ended questions.
  This demonstrates the modern "deterministic core + LLM shell" automation
  pattern and is a direct story for an **AI Automation Engineer** role.
- Alternatively, a **graph-algorithm playground with shareable URLs + recorded
  runs** (encode the graph + algorithm in the URL, replay deterministically),
  extending the step-stream model into a shareable, embeddable widget.
