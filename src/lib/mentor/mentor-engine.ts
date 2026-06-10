// Mentor orchestrator.
//
// generateMentorResponse(question, ctx) is the *single* entry point the chatbot
// calls. It classifies a question into a mentor intent and delegates to the
// matching engine, returning a localized string — or null when no mentor intent
// confidently matches, so the existing chatbot pipeline runs unchanged.
import type { AppLanguage, MentorContext, MentorIntent } from './types';
import { normalize, detectAlgorithms, detectSingleAlgorithm } from './nlp';
import { recommendFromText } from './recommendation-engine';
import { explainWhyFormatted } from './why-engine';
import { compareFormatted } from './comparison-engine';
import { analyzeGraph, recommendForGraph } from './graph-analysis';
import { explainStep } from './step-explanation-engine';

const WHY_WORD = /\b(why|pse)\b/;

// Concrete, step-specific cues (deliberately excludes generic "visited"/"first"
// so conceptual questions like "why is a node visited first?" are NOT captured).
const STEP_VERB =
  /(selected|chosen|expand\w*|reject\w*|ignored|picked|accepted|\badded\b|highlighted|relaxed|zgjedh\w*|zgjodh\w*|refuz\w*|zgjerua\w*|pranua\w*|injoru\w*|theksua\w*)/;
const THIS_NODE_EDGE =
  /(this|that|current|the selected|kete|ketij|ky|kjo|aktual\w*)\s+(node|edge|vertex|nyj\w*|kulm\w*|brinj\w*)/;

const RECOMMEND_CUE =
  /(which|what)\s+(algorithm|algo|approach|method)\b|what should i use|which (one )?should i use|\brecommend\b|\bsuggest\b|help me (choose|pick|decide)|cil(?:in|i|en|at)\s+algorit\w*|cfare\s+(te\s+)?(perdor|algorit)\w*|qfar\w*\s+(te\s+)?(perdor|algorit)\w*|cilin\s+(te\s+)?(perdor|duhet)|rekomando\w*|sugjero\w*/;
const GRAPH_REF =
  /(this|the|my|current|loaded)\s+graph|ket(?:e|ij)\s+graf|grafin?\s+(aktual|tim|qe kam)|per\s+ket\w*\s+graf|grafit\s+tim/;

const COMPARE_CUE =
  /(compare|versus|\bvs\.?\b|differences? between|krahas\w*|dallim\w*|ndryshim\w*|\bkunder\b|diferenc\w*)/;
const CONNECTOR = /\b(and|or|vs|versus|dhe|ose|apo)\b|,/;

const SQ_MARKERS =
  /[ëçÇË]|\b(pse|cili|cilin|cilen|cfare|cka|qka|krahaso|krahas|dallim|ndryshim|perdor|nyje|nyja|brinje|peshe|rruga|rrugen|grafi|grafin|kete|ketij|shpjego|shpjegoj|kunder|ekzekuto|gjej|llogarit)\b/i;

function resolveLang(question: string, fallback: AppLanguage): AppLanguage {
  return SQ_MARKERS.test(question) ? 'sq' : fallback;
}

/** Classify a question into a mentor intent, or null. Text-only (pure). */
export function classifyMentorIntent(text: string): MentorIntent | null {
  const n = normalize(text);

  // 1. Step-why: about a concrete node/edge event in the current run.
  if (WHY_WORD.test(n) && (STEP_VERB.test(n) || THIS_NODE_EDGE.test(n))) {
    return 'step-why';
  }

  // 2/3. Recommendation (graph-aware first).
  if (RECOMMEND_CUE.test(n)) {
    return GRAPH_REF.test(n) ? 'recommend-graph' : 'recommend';
  }

  // 4. Comparison: a compare cue, or two distinct algorithms joined by a connector.
  const algos = detectAlgorithms(text);
  if (algos.length >= 2 && (COMPARE_CUE.test(n) || CONNECTOR.test(n))) {
    return 'compare';
  }

  // 5. Why <single algorithm>.
  if (WHY_WORD.test(n) && detectSingleAlgorithm(text) !== null) {
    return 'why';
  }

  return null;
}

/**
 * Produce a mentor answer, or null if no mentor intent matches. The returned
 * string is already localized; on null the caller keeps its existing behavior.
 */
export function generateMentorResponse(question: string, ctx: MentorContext): string | null {
  const intent = classifyMentorIntent(question);
  if (!intent) return null;

  const lang = resolveLang(question, ctx.language);

  switch (intent) {
    case 'step-why':
      return explainStep({ ...ctx, language: lang }, question);

    case 'recommend-graph':
      return recommendForGraph(analyzeGraph(ctx.nodes, ctx.edges), lang);

    case 'recommend':
      return recommendFromText(question, lang);

    case 'compare': {
      const algos = detectAlgorithms(question);
      if (algos.length < 2) return null;
      return compareFormatted(algos[0], algos[1], lang);
    }

    case 'why': {
      const algo = detectSingleAlgorithm(question);
      if (!algo) return null;
      return explainWhyFormatted(algo, lang);
    }

    default:
      return null;
  }
}
