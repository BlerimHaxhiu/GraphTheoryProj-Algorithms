// Public surface of the deterministic Algorithm Mentor.
//
// The chatbot only needs `generateMentorResponse`; the rest is exported for
// tests and potential reuse. Everything here is pure, local and deterministic.
export * from './types';
export { generateMentorResponse, classifyMentorIntent } from './mentor-engine';
export {
  getKnowledge,
  labelOf,
  categoryOf,
  ALL_ALGORITHMS,
  KNOWLEDGE,
} from './algorithm-knowledge';
export {
  parseGraphProperties,
  recommend,
  formatRecommendation,
  recommendFromText,
} from './recommendation-engine';
export { explainWhy, formatWhy, explainWhyFormatted } from './why-engine';
export { compareAlgorithms, formatComparison, compareFormatted } from './comparison-engine';
export { analyzeGraph, recommendForGraph, recommendForGraphFromState } from './graph-analysis';
export { explainStep } from './step-explanation-engine';
export { detectAlgorithms, detectSingleAlgorithm } from './nlp';
