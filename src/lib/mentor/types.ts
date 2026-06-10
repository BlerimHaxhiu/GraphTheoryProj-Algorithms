// Shared types for the deterministic Algorithm Mentor.
//
// Design rules (see docs/ALGORITHM_MENTOR_DISCOVERY.md):
//  - Pure, deterministic, local. No LLM, no network, no app-state mutation.
//  - `@/...` imports are type-only (erased by the sucrase test harness);
//    cross-module *values* are imported via relative paths.
import type { AlgorithmType } from '@/types/graph';
import type { AppLanguage } from '@/components/language-provider';

/** A string available in both supported languages. */
export type Localized = { sq: string; en: string };

/** A bullet list available in both supported languages (kept in lock-step). */
export type LocalizedList = { sq: string[]; en: string[] };

/** Re-export so engine consumers don't need to reach into app types. */
export type { AlgorithmType, AppLanguage };

/** The four algorithm families this app teaches. */
export type AlgorithmCategory =
  | 'traversal'
  | 'shortest-path'
  | 'all-pairs-shortest-path'
  | 'mst';

/**
 * Machine-readable capabilities used by the recommendation, graph-analysis and
 * step engines to reason about constraints (not for prose).
 */
export interface AlgorithmCapabilities {
  category: AlgorithmCategory;
  requiresStartNode: boolean;
  requiresEndNode: boolean;
  /** Uses edge weights as costs (false for BFS/DFS). */
  weightAware: boolean;
  supportsNegativeWeights: boolean;
  detectsNegativeCycle: boolean;
  /** MST algorithms require an undirected graph. */
  requiresUndirected: boolean;
}

/** Single source of truth describing one algorithm for the mentor. */
export interface AlgorithmKnowledge {
  type: AlgorithmType;
  /** Language-neutral display label, e.g. "Dijkstra", "A*". */
  label: string;
  /** Language-neutral Big-O strings. */
  timeComplexity: string;
  spaceComplexity: string;
  capabilities: AlgorithmCapabilities;
  purpose: Localized;
  /** One-line "use this when…" used by recommendation tradeoffs + comparisons. */
  whenToUse: Localized;
  strengths: LocalizedList;
  weaknesses: LocalizedList;
  useCases: LocalizedList;
}

/** The kind of problem a student is trying to solve. */
export type TaskKind =
  | 'shortest-path'
  | 'all-pairs-shortest-path'
  | 'mst'
  | 'traversal'
  | 'pathfinding';

/**
 * Problem properties extracted from a natural-language question (Phase 2) or
 * synthesized from a loaded graph (Phase 5). `null` means "unknown / not stated".
 */
export interface GraphProperties {
  task: TaskKind | null;
  weighted: boolean | null;
  directed: boolean | null;
  negativeWeights: boolean | null;
}

/** Structured output of the recommendation engine (Phase 2). */
export interface RecommendationResult {
  /** Primary recommended algorithm(s), best first. */
  recommended: AlgorithmType[];
  /** Reasonable secondary options. */
  alternatives: AlgorithmType[];
  /** Why these were chosen. */
  reasons: Localized[];
  /** Tradeoffs / cautions the student should know. */
  tradeoffs: Localized[];
  /** Assumptions made when properties were missing. */
  assumptions: Localized[];
  /** The (possibly inferred) task this recommendation answers. */
  task: TaskKind | null;
  /** Properties after defaults/inference were applied. */
  resolvedProperties: GraphProperties;
}

/** Structured output of the comparison engine (Phase 4). */
export interface ComparisonResult {
  a: AlgorithmType;
  b: AlgorithmType;
  keyDifference: Localized;
  /** When to prefer each algorithm. */
  chooseWhen: { a: Localized; b: Localized };
  /** True when this pair has hand-curated guidance (vs. generic KB-derived). */
  curated: boolean;
}

/** Structured output of the why engine (Phase 3). */
export interface WhyResult {
  type: AlgorithmType;
  label: string;
  purpose: Localized;
  strengths: LocalizedList;
  weaknesses: LocalizedList;
  useCases: LocalizedList;
}

/** Read-only snapshot of a loaded graph (Phase 5). */
export interface GraphAnalysis {
  nodeCount: number;
  edgeCount: number;
  weighted: boolean;
  /** True when every edge has the same weight (BFS would also be optimal). */
  uniformWeights: boolean;
  directed: boolean;
  hasNegativeWeights: boolean;
  connected: boolean;
  components: number;
  isComplete: boolean;
  density: number | string;
  sizeBucket: 'empty' | 'tiny' | 'small' | 'medium' | 'large';
}

/** The mentor intents the orchestrator can recognise. */
export type MentorIntent =
  | 'recommend'
  | 'recommend-graph'
  | 'compare'
  | 'why'
  | 'step-why';

/**
 * Read-only context handed to the mentor. Structurally compatible with the
 * chatbot's existing `ChatbotContext`, so the response layer can forward it
 * directly.
 */
export interface MentorContext {
  language: AppLanguage;
  selectedAlgorithm: AlgorithmType | null;
  nodes: Array<{ id: string; label: string; x: number; y: number }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    weight: number;
    directed?: boolean;
  }>;
  startNodeId?: string | null;
  endNodeId?: string | null;
  currentStep?: {
    type: string;
    nodeId?: string;
    edgeId?: string;
    messageKey?: string;
    message?: string;
    path?: string[];
  } | null;
}
