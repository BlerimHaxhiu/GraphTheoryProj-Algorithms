# Algorithm Mentor — Architecture

Date: 2026-06-10

The Algorithm Mentor turns the existing graph chatbot from a Q&A/automation
assistant into an **educational guidance system**. It helps a student decide
*which* algorithm to use, understand *why* an algorithm fits, see *how*
algorithms differ, reason about *their own graph*, and understand *why a
particular step happened* — all **deterministically and locally**.

No LLM. No API calls. No OpenAI/Genkit. Every answer is produced by pure
functions over a hand-authored, bilingual knowledge base.

See `ALGORITHM_MENTOR_DISCOVERY.md` for the pre-work audit that motivated this
design.

---

## 1. Design goals and non-goals

Goals:

- Deterministic, technically-correct, educational answers.
- Full English/Albanian parity.
- Zero regression to the existing chatbot (automation + education tracks).
- Clear separation between *intent classification*, *reasoning engines* and
  *presentation*, so each is independently testable.

Non-goals (explicit constraints):

- No generative AI / LLM / network calls.
- No UI redesign — only a small additive Mentor-mode toggle.
- No removal of existing chatbot functionality.

---

## 2. Module map

All mentor code lives in `src/lib/mentor/`:

| File | Responsibility |
| --- | --- |
| `types.ts` | Shared types: `Localized`, `AlgorithmKnowledge`, `GraphProperties`, `RecommendationResult`, `ComparisonResult`, `WhyResult`, `GraphAnalysis`, `MentorIntent`, `MentorContext`. |
| `algorithm-knowledge.ts` | **Single source of truth.** Bilingual purpose / strengths / weaknesses / use-cases / complexity + machine-readable capability flags for all 8 algorithms. |
| `nlp.ts` | Text normalization + `detectAlgorithms` / `detectSingleAlgorithm`. |
| `recommendation-engine.ts` | Phase 2. `parseGraphProperties` → `recommend` (decision tree) → `formatRecommendation`. |
| `why-engine.ts` | Phase 3. `explainWhy` → `formatWhy`. |
| `comparison-engine.ts` | Phase 4. `compareAlgorithms` (curated + generic) → `formatComparison`. |
| `graph-analysis.ts` | Phase 5. `analyzeGraph` (reuses `graph-utils`) → `recommendForGraph`. |
| `step-explanation-engine.ts` | Phase 6. `explainStep` grounded in live execution state. |
| `mentor-engine.ts` | Orchestrator. `classifyMentorIntent` + `generateMentorResponse`. |
| `index.ts` | Public barrel. |

Integration points (additive edits only):

- `src/lib/chatbot-responses.ts` — one import + one early call to
  `generateMentorResponse`; mode-aware `getSuggestedQuestions`.
- `src/components/chatbot/GraphChatbot.tsx` — Mentor-mode toggle + welcome.
- `src/lib/translations.ts` — new `chatbot.*` mode strings (both languages).

---

## 3. Integration seam (why it's safe)

The chatbot routes every non-mutating question to `generateChatbotResponse`
(see discovery doc §1). The mentor hooks in there as a **single early call**:

```ts
// src/lib/chatbot-responses.ts (inside generateChatbotResponse)
const mentorReply = generateMentorResponse(trimmed, ctx);
if (mentorReply) return mentorReply;
// …existing handlers run unchanged when mentorReply is null
```

`generateMentorResponse` returns `null` unless a mentor intent **confidently**
matches, so:

- The command parser and action handler are untouched — the automation track is
  byte-for-byte unchanged.
- Existing education intents (greeting, thanks, complexity, when-to-use, terms,
  generic current-step) keep their handlers; the mentor never claims them.
- Mentor intents that previously hit the generic fallback (recommendation) or a
  flat answer (comparison, why) are now upgraded.

---

## 4. Intent system

`classifyMentorIntent(text): MentorIntent | null` is pure and text-only. It
checks intents in priority order and returns the first match:

1. **`step-why`** — `why` + a concrete step cue (`selected/expanded/rejected/…`
   or `this/that/current node|edge`). Deliberately excludes generic
   "why is a node *visited first*?" so that conceptual question keeps its
   existing answer.
2. **`recommend-graph`** — a recommendation cue **and** a graph reference
   (`this/the/current/my graph`, `kete graf`, …).
3. **`recommend`** — a recommendation cue without a graph reference.
4. **`compare`** — a compare cue (`compare/vs/krahaso/…`) **or** two distinct
   algorithms joined by a connector (`and/or/dhe/ose/,`).
5. **`why`** — `why` + exactly one named algorithm.

Cues are bilingual. Language for the *answer* is resolved per-question
(`resolveLang`) so an Albanian question is answered in Albanian even if the app
language is English (matching the existing chatbot behavior).

Classification is covered by 22 cases in `tests/mentor.test.js`, including the
negative cases the mentor must **not** claim.

---

## 5. Recommendation engine (Phase 2)

Two pure stages plus a formatter:

```
parseGraphProperties(text) -> GraphProperties { task, weighted, directed, negativeWeights }
recommend(props)           -> RecommendationResult { recommended, alternatives, reasons, tradeoffs, assumptions, ... }
formatRecommendation(...)  -> localized string
```

The decision tree (deterministic, technically correct):

| Task | Recommendation | Key reasoning |
| --- | --- | --- |
| `mst` | Kruskal + Prim | undirected required; sparse→Kruskal, dense→Prim |
| `all-pairs` | Floyd-Warshall (alt: Dijkstra/Bellman-Ford) | O(V³) simple; sparse→repeated Dijkstra; negatives→FW/BF |
| `traversal` | BFS + DFS | level-order/components vs cycle/topo/SCC |
| `pathfinding` | A* (alt: Dijkstra); BF if negative | heuristic guides to the goal |
| `shortest-path`, unweighted | BFS | fewest edges |
| `shortest-path`, negative | Bellman-Ford (alt: FW) | Dijkstra/A* unsafe; detect negative cycle |
| `shortest-path`, weighted non-negative | Dijkstra (alt: A*) | optimal + efficient |
| unknown | decision guide | asks for the goal, lists every branch |

Missing properties are **filled with stated assumptions** (e.g. "I assumed
weighted edges; if unweighted, use BFS") rather than silent guesses.

---

## 6. Why engine (Phase 3)

`explainWhy(type)` projects the knowledge base into a `WhyResult`
(purpose / strengths / weaknesses / use-cases). `formatWhy` renders the four
sections. This is the structured upgrade over the old flat algorithm blurb.

## 7. Comparison engine (Phase 4)

`compareAlgorithms(a, b)` returns a structured `ComparisonResult` with a
`keyDifference` and per-algorithm `chooseWhen`. Five canonical pairs
(BFS↔DFS, A*↔Dijkstra, Kruskal↔Prim, Bellman-Ford↔Dijkstra,
Dijkstra↔Floyd-Warshall) have hand-curated guidance; **any other pair** gets a
generic comparison derived from the KB (categories + complexity +
`whenToUse`). `formatComparison` renders purpose, complexity, strengths,
weaknesses and typical use cases for each side — the five fields the brief asks
for. Pair lookup is order-independent.

---

## 8. Graph analysis (Phase 5)

`analyzeGraph(nodes, edges)` reuses the app's own `graph-utils`
(`calculateGraphStats`, `graphHasDirectedEdges`, `hasNegativeEdgeWeights`,
`normalizeEdge`) to produce a read-only `GraphAnalysis`: counts, weighted /
uniform-weights / directed / negative flags, connectivity + components,
completeness, density and a size bucket.

`recommendForGraph(analysis, lang)` then:

- describes the graph in one line,
- gives a per-task recommendation (shortest path / all-pairs / MST / traversal)
  computed by the **same** `recommend()` engine, keeping advice consistent,
- raises constraint **notes** triggered by the actual graph (directed ⇒ MST
  needs undirected; negatives ⇒ Bellman-Ford; disconnected ⇒ partial coverage;
  uniform weights ⇒ BFS also optimal),
- explicitly states it **will not run anything automatically**.

It only inspects and explains — never executes — as required.

---

## 9. Step explanation (Phase 6)

`explainStep(ctx, question)` answers "why was this node/edge selected /
expanded / rejected?" strictly from the **current execution state**
(`currentStep` + `selectedAlgorithm` + graph):

- `visit-node` → the algorithm's selection rule (FIFO / LIFO / min-distance /
  min-f / lightest crossing edge), naming the actual node.
- `traverse-edge` → relaxation (or Kruskal "considering in sorted order").
- Kruskal accept/reject is read from the step's `messageKey`
  (`mstEdgeAdded` / `mstEdgeIgnoredCycle`) and explained via the Union-Find
  cycle argument.
- `highlight-path` / `update-matrix-cell` / `reset` → grounded explanations.

When the asked-about detail is absent (no active step, or the current step is
not the rejection asked about), it **says so and does not invent facts** — it
points the student at how to reach that state.

---

## 10. Educational mode (Phase 7)

`GraphChatbot.tsx` gains a small, additive **Assistant ⇄ Mentor** segmented
toggle (a `tablist`) under the header. Mentor mode changes only:

- the welcome message (`chatbot.mentorWelcome`),
- the subtitle (`chatbot.mentorSubtitle`),
- the header avatar (graduation-cap),
- the suggested questions (recommendation / why / compare / graph prompts).

Mentor *capabilities* are available in **both** modes (they can only help), so
switching modes never gates functionality and Assistant mode behaves exactly as
before. The welcome refreshes only while the conversation hasn't started, so an
ongoing chat is never wiped.

---

## 11. Localization (Phase 8)

- UI strings live in `translations.ts` and are covered by the existing
  sq/en key-parity test.
- Engine/knowledge prose carries `{ sq, en }` and `{ sq: string[], en:
  string[] }` (lists kept in lock-step), covered by the KB parity checks in
  `tests/mentor.test.js`.

---

## 12. Testing (Phase 9)

`tests/mentor.test.js` (run via `npm run test:mentor`) covers 69 checks:
intent classification (incl. negatives + Albanian), the recommendation decision
tree, the why engine, curated vs generic comparison, graph analysis + graph
recommendation (directed / negative / disconnected / empty), step explanation
(incl. graceful/honest fallbacks), and full KB bilingual parity.

All existing suites (`test:algorithms`, `test:chatbot`, `test:translations`,
`test:playback`) and `tsc --noEmit` remain green.

---

## 13. Educational philosophy

- **Reason, don't recite.** The recommendation engine encodes *why* an
  algorithm fits a property profile, not a lookup table of names.
- **Honesty over confidence.** Missing inputs become stated assumptions;
  unavailable step detail is acknowledged, never fabricated.
- **Consistency.** Graph-aware advice flows through the same decision tree as
  text-based advice, so the mentor never contradicts itself.
- **Bilingual by construction.** Parity is enforced by tests, not goodwill.
- **Show the trade-offs.** Every recommendation/comparison surfaces weaknesses
  and "when to choose the other", which is the actual learning.

---

## 14. Future AI opportunities (documentation only — not implemented)

The deterministic core is a deliberate foundation for an optional future
LLM layer, kept safe by design:

- Keep `parseChatbotCommand` + `executeChatbotAction` as the only path that can
  mutate app state.
- Use the knowledge base and engine outputs as **grounding/context** for an LLM
  that paraphrases or tutors in free-form language.
- Have the model emit a *structured intent* that is validated by
  `classifyMentorIntent` / the action layer before anything runs — the model
  explains, the deterministic engines decide.
- Use the existing bilingual KB as the retrieval corpus (RAG) so generated
  answers stay technically correct and on-curriculum.
- The recommendation decision tree doubles as an **eval oracle**: an LLM's
  recommendation can be auto-graded against `recommend()`.

This is exactly the "AI Automation Engineer" pattern: a deterministic,
test-guarded tool surface with a clean seam where a model can be added without
giving it authority over side effects.
