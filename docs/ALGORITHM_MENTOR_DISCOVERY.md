# Algorithm Mentor — Discovery (Phase 1)

Date: 2026-06-10

Scope: audit of the **existing** chatbot before transforming it into an
educational guidance system ("Algorithm Mentor"). This document is
discovery-only. No behavior is changed here. It establishes the baseline that
Phases 2–10 build on.

Constraint reminder for the whole initiative: the mentor must stay **fully
deterministic and local**. No external AI, no API calls, no LLM, no OpenAI, no
Genkit recommendation flow. The existing chatbot behavior must keep working
unchanged.

---

## 1. Where the chatbot lives

| Concern | File |
| --- | --- |
| Floating chat UI, send loop, suggestions, welcome | `src/components/chatbot/GraphChatbot.tsx` |
| Deterministic command parser (text → action) | `src/lib/chatbot-command-parser.ts` |
| Action executor (action → app state mutation) | `src/lib/chatbot-action-handler.ts` |
| Educational response generator (text → answer) | `src/lib/chatbot-responses.ts` |
| Wiring into the app (props + automation context) | `src/app/app/page.tsx` (`<GraphChatbot .../>` near line 1252) |
| UI strings (`chatbot.*` keys, both languages) | `src/lib/translations.ts` |
| Parser regression tests | `tests/chatbot-parser.test.js` |

The chatbot is a **two-track system**:

1. **Automation track** — `parseChatbotCommand` → `executeChatbotAction`. Mutates
   app state (runs an algorithm, sets start/end node, clears the result).
2. **Education track** — `generateChatbotResponse`. Produces a text answer and
   never mutates state.

### Send flow (the routing contract)

From `GraphChatbot.handleSend`:

```
user text
  └─ if automation is wired:
       action = parseChatbotCommand(text, { availableLabels })
       if action.type ∉ { EXPLAIN_ONLY, UNKNOWN }:
            result = executeChatbotAction(action, ...)
            if result.handled: reply = result.message
  └─ if reply is still null:
       reply = generateChatbotResponse(text, ctx)
```

**Key consequence for the mentor work:** every question the parser classifies as
`EXPLAIN_ONLY` or `UNKNOWN` falls through to `generateChatbotResponse`. All
mentor question classes ("which algorithm should I use?", "why Dijkstra?",
"compare A* and Dijkstra", "what should I use for this graph?", "why was this
node selected?") are non-mutating and resolve to `EXPLAIN_ONLY`/`UNKNOWN`.
**Therefore the mentor can be added almost entirely inside the education track,
behind a single new entry point, without touching the parser or the action
handler.** This is the lowest-risk integration seam.

---

## 2. Supported intents today

### 2.1 Parser actions (`ChatbotAction` union)

`RUN_ALGORITHM`, `SET_START_NODE`, `SET_END_NODE`, `CLEAR_RESULT`,
`RESET_VISUALIZATION`, `EXPLAIN_ONLY`, `UNKNOWN`.

The parser detects:

- **Algorithm names + misspellings** — `bfs/dfs/dijkstra (dikstra, djikstra…)/
  a-star (a*, a yje)/bellman-ford/floyd-warshall/kruskal/prim`, including
  Albanian phrasings (`gjeresi`, `thellesi`, `kerkim heuristik`).
- **Execution verbs** — bilingual (`run/execute/find/compute…`,
  `ekzekuto/nis/gjej/llogarit…`).
- **Shortest-path phrases**, **MST phrases**, **compare phrases**,
  **explain verbs**, **negative-weight keywords**, **clear/reset phrases**.
- **Start/end node extraction** — `from A to F`, `nga A deri te F`, `A -> F`,
  `starting from node 1`.
- **Defaults** — unnamed "shortest path" request → Dijkstra; unnamed "MST"
  request → Kruskal.

Disambiguation rules already present (important to preserve):

- A trailing `?` or an explain prefix (`why/how/what/explain/kur/when/sa eshte`)
  suppresses execution and forces `EXPLAIN_ONLY`.
- `compare/vs/krahaso/dallim` → `EXPLAIN_ONLY`.
- Negative-weight keyword + algorithm, without an execution verb → `EXPLAIN_ONLY`.

### 2.2 Education-track intents (`generateChatbotResponse`)

Handled, in priority order:

1. Greeting (`hello/pershendetje`) + context summary.
2. Thanks.
3. Common mistakes.
4. Comparison — 5 curated pairs (`bfs-dfs`, `dijkstra-bellman`,
   `dijkstra-astar`, `kruskal-prim`, `floyd-dijkstra`).
5. Negative weights.
6. When-to-use `<algo>`.
7. Complexity `<algo>`.
8. "Why is a node visited first?" (generic priority-rule answer).
9. Current step explanation (reads `currentStep`).
10. Term definitions — 12 terms (node, edge, weight, queue, stack, priority
    queue, mst, shortest path, visited, distance table, parent table,
    heuristic).
11. Algorithm explanation (`explainAlgorithm`) — description + complexity +
    whenToUse + notes.
12. Context summary.
13. Fallback (suggested questions).

### 2.3 Knowledge already encoded

- `ALGORITHM_INFO` (in `chatbot-responses.ts`): per-algorithm
  `description / complexity / whenToUse / notes`, bilingual.
- `COMPARISONS`: 5 pairs, single localized blob each.
- `TERMS`: 12 definitions, bilingual.
- `algorithmExplanations` (in `translations.ts`): title/description/complexity
  per algorithm, bilingual (used by the explanation panel, not the chatbot).

---

## 3. Current limitations (the gap the mentor closes)

| # | Limitation | Mentor phase that fixes it |
| --- | --- | --- |
| L1 | **No "which algorithm should I use?" engine.** Such a question hits the generic fallback. There is no reasoning from problem properties (weighted/directed/negative/task) to a recommendation. | Phase 2 |
| L2 | **No graph-aware recommendation.** The bot can read graph state for a *context summary* only; it never reasons "your graph is weighted+undirected+connected ⇒ use X". | Phase 5 |
| L3 | **"Why X?" is shallow.** `explainAlgorithm` returns a description, not a structured purpose / strengths / weaknesses / use-cases breakdown. | Phase 3 |
| L4 | **Comparison is a flat blob and limited to 5 hard-coded pairs.** No structured purpose/complexity/strengths/weaknesses/use-cases, no generic pair support. | Phase 4 |
| L5 | **Step explanation is generic.** `explainCurrentStep` describes the step type but cannot answer "why did A* expand *this* node?" or "why did Kruskal *reject* this edge?" using the step's `messageKey`/metadata. | Phase 6 |
| L6 | **No dedicated educational mode.** One flat assistant persona; nothing frames the experience as guided tutoring vs. casual Q&A. | Phase 7 |
| L7 | **Recommendation/why/compare content is not yet covered by parity tests** because it does not exist. | Phases 8–9 |

None of these are bugs in the current chatbot — they are *missing capabilities*.
The existing behavior is correct within its scope.

---

## 4. Parser behavior — verified routing for mentor questions

Traced against `parseChatbotCommand` to confirm the mentor seam is safe (no
parser change required):

| Input | Parser result | Reaches `generateChatbotResponse`? |
| --- | --- | --- |
| `which algorithm should I use?` | `EXPLAIN_ONLY` (trailing `?`) | ✅ |
| `what algorithm should I use for this graph?` | `EXPLAIN_ONLY` (trailing `?`; "use" execution verb suppressed by `?`) | ✅ |
| `recommend an algorithm` | `UNKNOWN` (no execution verb, no algo, no `?`) | ✅ |
| `why Dijkstra?` | `EXPLAIN_ONLY` | ✅ |
| `compare A* and Dijkstra` | `EXPLAIN_ONLY` (compare cue) | ✅ |
| `why was this edge selected?` | `EXPLAIN_ONLY` (trailing `?`) | ✅ |

Critically, the unnamed-shortest-path → Dijkstra and unnamed-MST → Kruskal
*execution* defaults only fire when there is **no** explain cue, so mentor
questions never accidentally run an algorithm.

**Decision:** the parser and action handler are left untouched. The mentor is
introduced as one new call inside `generateChatbotResponse`, plus isolated new
modules. This guarantees zero regression to the automation track.

---

## 5. Response generation logic — integration plan (preview)

A new orchestrator `generateMentorResponse(question, ctx)` returns a localized
string when it **confidently** owns a mentor-class intent, or `null` otherwise.
`generateChatbotResponse` calls it early (after greeting/thanks) and returns its
result when non-null; on `null` the existing pipeline runs unchanged.

The orchestrator is intentionally **tight** — it only claims:

- recommendation (`which/what algorithm should I use`, `recommend/suggest`),
- graph recommendation (recommendation cue **+** "this/the/current graph"),
- structured comparison (`compare/vs` or two distinct algorithms + connector),
- why (`why <algo>` / `why use <algo>`),
- step-why (`why was this node/edge selected/expanded/rejected/chosen`).

It deliberately does **not** claim complexity-only, when-to-use, term, greeting,
or generic current-step questions, so those keep their existing handlers.

---

## 6. Reusable assets

The mentor reuses, rather than re-implements:

- `calculateGraphStats`, `graphHasDirectedEdges`, `hasNegativeEdgeWeights`
  (`src/lib/graph-utils.ts`) for Phase 5 graph analysis.
- `AlgorithmType`, `AlgorithmStep`, `Node`, `Edge` (`src/types/graph.ts`).
- `AppLanguage` and the `{ sq, en }` localization idiom already used across
  `chatbot-responses.ts`.
- The `node -r sucrase/register/ts` test harness. **Constraint:** new modules
  must import `@/...` only as `import type` (erased by sucrase) and import
  cross-module **values** via relative paths, exactly like
  `graph-algorithms.ts` does (`import { normalizeEdge } from './graph-utils'`).

---

## 7. Risks and how the design avoids them

| Risk | Mitigation |
| --- | --- |
| Breaking the automation track | Parser/action handler untouched; mentor lives in the education track only. |
| Mentor swallowing existing intents | Orchestrator returns `null` unless a tight, explicit cue matches. |
| Test harness can't resolve `@/` value imports | Types via `import type`; values via relative imports. |
| Localization drift | All UI strings go through `translations.ts` (covered by the existing parity test); KB/engine strings carry `{ sq, en }` and get a dedicated parity test. |
| "Don't redesign the UI" | Phase 7 adds only a small additive mode toggle + mentor welcome/suggestions; Assistant mode stays byte-for-byte identical. |

---

## 8. Definition of done (success criteria from the brief)

A student can ask and receive deterministic, correct, educational answers to:

1. Which algorithm should I use?
2. Why Dijkstra?
3. Compare A* and Dijkstra.
4. What algorithm should I use for this graph?
5. Why was this edge selected?
6. Why was this node selected?

— in **both** English and Albanian, with tests guarding each engine.
