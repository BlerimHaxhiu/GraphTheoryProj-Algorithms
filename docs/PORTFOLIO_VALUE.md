# Portfolio Value Assessment

Date: 2026-06-09

Scoring scale: 1 to 10, where 10 means highly portfolio-ready for that category.

## Scores

| Category | Score | Rationale |
| --- | ---: | --- |
| Software Engineering | 7 | Strong algorithm/data modeling and modular structure, but central interactive files still use `@ts-nocheck` and production builds ignore type/lint failures. |
| Frontend Engineering | 8 | Rich interactive SVG editor, responsive panels, dialogs, theming, localization, and export flows. Needs more UI test coverage and keyboard accessibility. |
| Educational Technology | 10 | Strong learning story through step tracing, explanations, reports, matrix visualization, comparison, bilingual content, an accurate A* heuristic demonstration, and now an Algorithm Mentor that recommends, justifies, compares and explains step decisions. |
| AI/Automation Relevance | 7 | A deterministic, test-guarded Algorithm Mentor (recommendation decision tree, structured why/comparison, graph-aware analysis, step explanation) demonstrates intent classification, reasoning engines and a clean, safe seam for a future LLM layer — the core "AI Automation Engineer" pattern. The automation command parser/action handler still shows tool-surface thinking. |
| UX | 7 | Feature-rich workspace with useful panels and controls. Playback controls, accessibility, and large-graph ergonomics need improvement. |
| Testing | 6 | Good lightweight tests for algorithms, parser, and translation parity. Missing browser/e2e tests for the main app workflows. |
| Maintainability | 6 | Good separation between algorithm, utility, UI, and translation modules. Maintainability is limited by `@ts-nocheck`, large page/canvas files, and build config suppressions. |

## Top 5 Strengths

- Broad algorithm coverage across traversal, shortest path, all-pairs shortest path, and MST categories.
- Interactive SVG graph editor with weighted, directed, curved, parallel, and self-loop edge support.
- Strong educational layer through step-by-step reports, matrix visualization, explanations, and comparison panels.
- A* now supports both zero and Euclidean heuristic modes, making the Dijkstra-vs-A* distinction visible to students.
- English and Albanian localization, which gives the project a distinctive accessibility angle.
- Chatbot command parser connects natural language prompts to app actions, demonstrating automation-style product thinking.

## Top 5 Weaknesses

- Core app files use `@ts-nocheck`, reducing confidence in type safety.
- Production build config currently ignores TypeScript and ESLint errors.
- README and branding were previously stale and generic; code metadata still needs alignment in a later phase.
- Shortest-path implementation quality is stronger after the A* update, but the priority queue implementations are still simple array-sorting implementations rather than heap-backed structures.
- No end-to-end tests cover the actual UI workflows for graph creation, algorithm execution, import/export, language switching, or chatbot-triggered actions.

## Highest ROI Improvements For Future Phases

1. Remove `@ts-nocheck` from the main app route, controls panel, and graph canvas in small safe passes.
2. Stop ignoring TypeScript and ESLint errors during production builds after cleanup.
3. Add Playwright coverage for the core user journey: create graph, add weighted edge, run Dijkstra, inspect report, export JSON.
4. Add browser/e2e coverage for the A* mode selector, g/h/f report output, and comparison table.
5. Add final screenshots, a hosted demo link, and GitHub repository topics.
6. Add `docs/ARCHITECTURE_OVERVIEW.md` with diagrams or module flow.
7. Add `docs/SCREENSHOT_CHECKLIST.md` and capture consistent portfolio screenshots.
8. Improve keyboard accessibility for the graph editor.
9. Clarify algorithm comparison metrics so calculation time is not mistaken for full animated runtime.
10. Add CI that runs typecheck and the existing test scripts.

## A* Portfolio Value Added

The A* implementation is now more educational and technically honest because it exposes the concept that defines A*: the heuristic.

Portfolio reviewers can now see:

- a real Euclidean heuristic derived from existing node coordinates,
- a zero-heuristic mode for direct Dijkstra comparison,
- report output that explains `g(n)`, `h(n)`, and `f(n)`,
- comparison panel support for A* heuristic mode,
- regression tests protecting shortest-path correctness across both modes.

This improves the project story from "visualizes many algorithms" to "teaches a subtle algorithmic distinction through implementation, UI, and tests."

## Algorithm Mentor Portfolio Value Added

The Algorithm Mentor (`src/lib/mentor/`) is the strongest single addition for an
AI/automation-leaning portfolio, because it shows reasoning architecture rather
than another feature:

- An intent classifier (`classifyMentorIntent`) mapping natural language to five
  mentor intents, with negative cases tested so it does not over-claim.
- A deterministic recommendation **decision tree** that reasons from problem
  properties (weighted / directed / negative / task) to a justified
  recommendation, with stated assumptions when inputs are missing.
- Structured why and comparison engines, and a graph-aware engine that inspects
  the loaded graph and explains what fits — without ever executing an algorithm.
- A step-explanation engine that justifies live execution decisions ("why did
  Kruskal reject this edge?") and refuses to invent facts when state is absent.
- Full English/Albanian parity and 69 dedicated tests, plus a documented, safe
  seam for a future LLM layer (model explains; deterministic engines decide).

This reframes the AI story from "local rule-based chatbot" to "deterministic,
test-guarded reasoning system designed for safe LLM augmentation" — exactly the
signal an AI Automation Engineer role looks for.

## Recruiter Readiness

After the README rewrite and portfolio docs, the repository is significantly closer to recruiter-ready from a presentation standpoint.

It is ready to show as a feature-rich portfolio project if accompanied by screenshots or a demo.

It is not yet fully engineering-polished because the build configuration suppresses type/lint failures and key interactive files still bypass TypeScript checking. Those issues should be addressed before presenting it as production-grade.
