import type { AlgorithmType } from '@/types/graph';

export type ChatbotAction =
  | {
      type: 'RUN_ALGORITHM';
      algorithm: AlgorithmType;
      startNodeLabel?: string;
      endNodeLabel?: string;
    }
  | {
      type: 'SET_START_NODE';
      nodeLabel: string;
    }
  | {
      type: 'SET_END_NODE';
      nodeLabel: string;
    }
  | {
      type: 'CLEAR_RESULT';
    }
  | {
      type: 'RESET_VISUALIZATION';
    }
  | {
      type: 'EXPLAIN_ONLY';
      topic: string;
    }
  | {
      type: 'UNKNOWN';
      reason: string;
    };

interface ParseContext {
  availableLabels: string[];
}

const ALGORITHM_KEYWORDS: Array<{ pattern: RegExp; algorithm: AlgorithmType }> = [
  {
    pattern:
      /(a\s*-?\s*star|a\s*\*|a\s*yje|a\s*ylli?|kerkim\w*\s+heuristik|heuristic\s+search)/i,
    algorithm: 'a-star',
  },
  {
    pattern: /bellman[\s-]?ford|bellmanford|\bbellman\b|\bford\b/i,
    algorithm: 'bellman-ford',
  },
  {
    pattern: /floyd[\s-]?warshall|floydwarshall|\bfloyd\b|\bwarshall\b/i,
    algorithm: 'floyd-warshall',
  },
  { pattern: /kruskal('?s)?/i, algorithm: 'kruskal' },
  { pattern: /\bprim('?s)?\b/i, algorithm: 'prim' },
  { pattern: /(dijkstra('?s)?|dikstra|dijsktra|djkstra|djikstra|dijstra)/i, algorithm: 'dijkstra' },
  {
    pattern:
      /\bbfs\b|breadth[\s-]?first(?:\s+search)?|search\s+in\s+breadth|kerkim[a-z]*\s+ne\s+gjeresi|algoritmi\s+i\s+gjeresise|gjeresi|gjerësi|level[\s-]?order|level\s+traversal|vizitim\s+nivel/i,
    algorithm: 'bfs',
  },
  {
    pattern:
      /\bdfs\b|depth[\s-]?first(?:\s+search)?|search\s+in\s+depth|kerkim[a-z]*\s+ne\s+thellesi|algoritmi\s+i\s+thellesise|thellesi|thellësi|backtracking|stack\s+traversal/i,
    algorithm: 'dfs',
  },
];

const EXECUTION_VERB_PATTERN =
  /\b(?:ma\s+)?(?:run|execute|start|launch|perform|use|apply|find|compute|calculate|show|display|generate|build|ekzekuto(?:je|ni|jeni|jme)?|nis(?:e|ja|ni|eni|jme)?|fillo(?:je|ni)?|starto(?:je|ni)?|lesho(?:je|ni)?|lshoje|lsho|perdor(?:e|im|ni)?|aplik(?:o|oj|oje|oni)?|zbat(?:o|oje|oni)?|gjej(?:e|me|ni)?|llogarit(?:e|ni)?|kalkulo(?:je|ni)?|nxirr(?:e|ni)?|shfaq(?:e|ni)?|trego(?:je|ni)?|qit(?:e|ni)?|bo(?:n|je|ne|ni)|be(?:je|ni)|krijo(?:je|ni)?|gjenero(?:je|ni)?|ndertoj?)\b/i;

const EXECUTION_HINT_PATTERN = /\b(?:ma\s+(?:qit|gjej|nise|llogarit|ekzekuto|shfaq|trego)|me\s+(?:gjete|gjej|nis))\b/i;

const SHORTEST_PATH_PHRASES =
  /(shortest\s+(?:path|route|distance|way)|minimum\s+(?:path|distance|route)|optimal\s+path|rrug[a-z]*\s+(?:me|më)\s+(?:te|të)\s+shkurt|path\s+(?:me|më)\s+i\s+shkurt|distanca\s+(?:minimale|me\s+e\s+vogel|më\s+e\s+vogël)|rrug[a-z]*\s+(?:minimale|optimale))/i;

const MST_PHRASES =
  /(minimum\s+spanning\s+tree|minimum\s+tree|optimal\s+spanning\s+tree|spanning\s+tree|\bmst\b|pem[a-z]{0,4}\s+(?:e\s+)?(?:minimale|shtri|mbuluese)|rrjeti\s+minimal|kosto\s+minimale|lidh\s+te\s+gjitha\s+nyjet)/i;

const CLEAR_PHRASES =
  /(clear(?:\s+(?:the\s+)?(?:result|output|chat))?|remove\s+(?:the\s+)?result|fshi(?:je|ni)?|pastro(?:je|ni)?|hiq\s+(?:rezultat\w*|result)|largo\s+(?:rezultat\w*|result))/i;

const RESET_PHRASES =
  /(reset(?:\s+(?:the\s+)?(?:visualization|animation|algorithm|result))?|rivendos(?:e|ni|im)?|restart|rinis(?:e|ni)?|reseto(?:je|ni)?)/i;

const COMPARE_PHRASES =
  /(\bcompare\b|krahas[a-z]*|dallim[a-z]*|ndryshim[a-z]*|diferenc[a-z]*|cili\s+eshte\s+me\s+i\s+mire|a\s+eshte\s+me\s+mire|which\s+is\s+better|when\s+to\s+use|kunder|\bvs\.?\b|versus)/i;

const EXPLAIN_VERBS =
  /(why|how|what\s+is|what\s+does|explain|shpjeg[a-z]*|ma\s+shpjego|me\s+shpjego|cfare\s+(eshte|ben)|cka\s+eshte|qka\s+eshte|si\s+(funksionon|punon|vepron)|trego(?:\s+teori|\s+kompleks)?|kur\s+(?:te\s+)?perdor(?:et)?|kompleksitet[a-z]*|complexity|time\s+complexity|space\s+complexity|sa\s+eshte)/i;

const NEGATIVE_KEYWORDS =
  /(negative\s+(?:weights?|edges?|cycle)|pesh[a-z]*\s+negativ|cikel\s+negativ|cikël\s+negativ|negative\s+cycle)/i;

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function hasPhrase(pattern: RegExp, raw: string, normalized: string): boolean {
  return pattern.test(raw) || pattern.test(normalized);
}

function detectAlgorithm(message: string, normalized: string): AlgorithmType | null {
  for (const entry of ALGORITHM_KEYWORDS) {
    if (entry.pattern.test(message) || entry.pattern.test(normalized)) {
      return entry.algorithm;
    }
  }
  return null;
}

function detectExecutionIntent(message: string, normalized: string): boolean {
  if (EXECUTION_VERB_PATTERN.test(message) || EXECUTION_VERB_PATTERN.test(normalized)) {
    return true;
  }
  if (EXECUTION_HINT_PATTERN.test(message) || EXECUTION_HINT_PATTERN.test(normalized)) {
    return true;
  }
  if (hasPhrase(SHORTEST_PATH_PHRASES, message, normalized)) {
    return true;
  }
  if (
    hasPhrase(MST_PHRASES, message, normalized) &&
    /(krijo|ndertoj|build|generate|gjenero|ma\s+gjej|find|nxirr|ma\s+qit|shfaq|trego|llogarit|kalkulo|run|execute|use|perdor|apliko)/i.test(
      normalized
    )
  ) {
    return true;
  }
  return false;
}

function findLabelToken(
  segment: string,
  availableLabels: string[]
): string | undefined {
  if (!segment) return undefined;
  const normalizedLabels = new Map<string, string>();
  for (const label of availableLabels) {
    normalizedLabels.set(normalize(label), label);
  }
  const tokens = segment
    .replace(/[.,;:!?'"`()\[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  for (const token of tokens) {
    const norm = normalize(token);
    if (normalizedLabels.has(norm)) {
      return normalizedLabels.get(norm);
    }
  }
  for (const token of tokens) {
    const cleaned = token
      .replace(/^node$|^vertex$|^kulm[a-z]*$|^nyj[a-z]*$|^burim[a-z]*$|^source$|^target$|^destination$|^destinacion[a-z]*$|^goal$|^fund$/i, '')
      .trim();
    if (cleaned.length >= 1 && cleaned.length <= 3 && /^[a-z0-9_-]+$/i.test(cleaned)) {
      return cleaned.toUpperCase();
    }
  }
  return undefined;
}

interface NodeMatches {
  startNodeLabel?: string;
  endNodeLabel?: string;
}

const SOURCE_PREFIX = '(?:from|nga|prej|fillo\\s+nga|nis(?:e|ur)?\\s+nga|starting\\s+(?:from|at))';
const TARGET_PREFIX =
  '(?:to|towards|deri\\s+(?:te|tek|në|ne)|tek|te|ne|në|drejt|target|destination|destinacion[a-z]*|goal)';
const NODE_PHRASE = '(?:(?:the|kjo|kete|një|nje)\\s+)?(?:node\\s+|vertex\\s+|kulm[a-z]*\\s+|nyj\\w*\\s+|burim[a-z]*\\s+|source\\s+)?';
const TOKEN = '([\\w\\-]+)';

function extractStartEnd(message: string, availableLabels: string[]): NodeMatches {
  const result: NodeMatches = {};
  const fromToPattern = new RegExp(
    `${SOURCE_PREFIX}\\s+${NODE_PHRASE}${TOKEN}(?:\\s+${TARGET_PREFIX}\\s+${NODE_PHRASE}${TOKEN})?`,
    'i'
  );
  const fromMatch = fromToPattern.exec(message);
  if (fromMatch) {
    const fromCandidate = findLabelToken(fromMatch[1], availableLabels);
    if (fromCandidate) result.startNodeLabel = fromCandidate;
    if (fromMatch[2]) {
      const toCandidate = findLabelToken(fromMatch[2], availableLabels);
      if (toCandidate) result.endNodeLabel = toCandidate;
    }
  }

  if (!result.endNodeLabel) {
    const toPattern = new RegExp(`${TARGET_PREFIX}\\s+${NODE_PHRASE}${TOKEN}`, 'i');
    const toMatch = toPattern.exec(message);
    if (toMatch) {
      const candidate = findLabelToken(toMatch[1], availableLabels);
      if (candidate && candidate !== result.startNodeLabel) {
        result.endNodeLabel = candidate;
      }
    }
  }

  if (!result.startNodeLabel) {
    const startingPattern = new RegExp(
      `(?:starting\\s+(?:from|at)|duke\\s+filluar\\s+nga|filluar\\s+nga|nis(?:ur|ja)?\\s+nga|fillo\\s+nga|prej)\\s+${NODE_PHRASE}${TOKEN}`,
      'i'
    );
    const startingMatch = startingPattern.exec(message);
    if (startingMatch) {
      const candidate = findLabelToken(startingMatch[1], availableLabels);
      if (candidate) result.startNodeLabel = candidate;
    }
  }

  if (!result.startNodeLabel && !result.endNodeLabel) {
    const arrowPattern = /\b([a-z0-9_-]{1,3})\s*(?:->|→|=>|—|–)\s*([a-z0-9_-]{1,3})\b/i;
    const arrowMatch = arrowPattern.exec(message);
    if (arrowMatch) {
      const fromCandidate = findLabelToken(arrowMatch[1], availableLabels);
      const toCandidate = findLabelToken(arrowMatch[2], availableLabels);
      if (fromCandidate) result.startNodeLabel = fromCandidate;
      if (toCandidate) result.endNodeLabel = toCandidate;
    }
  }

  return result;
}

export function parseChatbotCommand(
  message: string,
  context: ParseContext = { availableLabels: [] }
): ChatbotAction {
  const trimmed = message.trim();
  if (!trimmed) {
    return { type: 'UNKNOWN', reason: 'empty' };
  }
  const labels = context.availableLabels;
  const lower = trimmed.toLowerCase();
  const normalized = normalize(trimmed);

  if (hasPhrase(COMPARE_PHRASES, trimmed, normalized)) {
    return { type: 'EXPLAIN_ONLY', topic: trimmed };
  }

  if (
    hasPhrase(RESET_PHRASES, trimmed, normalized) &&
    /(vizual|visualization|animacion|animation)/.test(normalized)
  ) {
    return { type: 'RESET_VISUALIZATION' };
  }

  if (
    hasPhrase(CLEAR_PHRASES, trimmed, normalized) &&
    /(result|rezultat|chat|bisedj|output)/.test(normalized)
  ) {
    return { type: 'CLEAR_RESULT' };
  }

  if (
    hasPhrase(RESET_PHRASES, trimmed, normalized) &&
    /(result|rezultat|algorithm|algoritm|vizual|animation|animacion)/.test(normalized)
  ) {
    return { type: 'RESET_VISUALIZATION' };
  }

  // Bare "fshi/clear" without explicit object still maps to CLEAR_RESULT.
  if (
    /^(clear|fshi(?:je|ni)?|pastro(?:je|ni)?)\s*$/i.test(normalized)
  ) {
    return { type: 'CLEAR_RESULT' };
  }

  // Bare "reset" without explicit object still maps to RESET_VISUALIZATION.
  if (
    /^(reset|rivendos(?:e|ni)?|restart|rinis(?:e|ni)?)\s*$/i.test(normalized)
  ) {
    return { type: 'RESET_VISUALIZATION' };
  }

  const algorithm = detectAlgorithm(trimmed, normalized);
  const endsWithQuestion = /\?\s*$/.test(trimmed);
  const explainPrefixPattern =
    /^\s*(why|how|what|explain|shpjeg|ma\s+shpjego|me\s+shpjego|cfare|çfare|cka|qka|kur|when|sa\s+eshte)\b/i;
  const startsWithExplainCue =
    explainPrefixPattern.test(normalized) || explainPrefixPattern.test(trimmed);
  const wantsExecution =
    detectExecutionIntent(trimmed, normalized) && !endsWithQuestion && !startsWithExplainCue;
  const hasExplainCue =
    (hasPhrase(EXPLAIN_VERBS, trimmed, normalized) || endsWithQuestion || startsWithExplainCue) &&
    !wantsExecution;

  if (algorithm && hasExplainCue) {
    return { type: 'EXPLAIN_ONLY', topic: trimmed };
  }

  if (algorithm && hasPhrase(NEGATIVE_KEYWORDS, trimmed, normalized) && !wantsExecution) {
    return { type: 'EXPLAIN_ONLY', topic: trimmed };
  }

  if (
    algorithm &&
    (wantsExecution ||
      hasPhrase(SHORTEST_PATH_PHRASES, trimmed, normalized) ||
      hasPhrase(MST_PHRASES, trimmed, normalized))
  ) {
    const { startNodeLabel, endNodeLabel } = extractStartEnd(trimmed, labels);
    return {
      type: 'RUN_ALGORITHM',
      algorithm,
      startNodeLabel,
      endNodeLabel,
    };
  }

  // No algorithm named, but the user clearly wants a shortest path → default to Dijkstra.
  if (!algorithm && hasPhrase(SHORTEST_PATH_PHRASES, trimmed, normalized) && !hasExplainCue) {
    const { startNodeLabel, endNodeLabel } = extractStartEnd(trimmed, labels);
    return {
      type: 'RUN_ALGORITHM',
      algorithm: 'dijkstra',
      startNodeLabel,
      endNodeLabel,
    };
  }

  // No algorithm named, but the user clearly wants an MST → default to Kruskal.
  if (
    !algorithm &&
    hasPhrase(MST_PHRASES, trimmed, normalized) &&
    (wantsExecution ||
      /(krijo|ndertoj|build|generate|gjenero|ma\s+gjej|find|nxirr|ma\s+qit|run|execute)/i.test(normalized))
  ) {
    return { type: 'RUN_ALGORITHM', algorithm: 'kruskal' };
  }

  const setStartPattern =
    /(?:set|use|cakto|vendos|zgjidh)\s+(?:(?:the|kjo|kete)\s+)?(?:node\s+|nyj\w*\s+)?([\w\-]+)\s+(?:as|si|per)\s+(?:start|fillim|fillestare)/i;
  const setStartMatch = setStartPattern.exec(trimmed);
  if (setStartMatch) {
    const candidate = findLabelToken(setStartMatch[1], labels);
    if (candidate) return { type: 'SET_START_NODE', nodeLabel: candidate };
  }
  const setEndPattern =
    /(?:set|use|cakto|vendos|zgjidh)\s+(?:(?:the|kjo|kete)\s+)?(?:node\s+|nyj\w*\s+)?([\w\-]+)\s+(?:as|si|per)\s+(?:end|destinacion|perfundimtare)/i;
  const setEndMatch = setEndPattern.exec(trimmed);
  if (setEndMatch) {
    const candidate = findLabelToken(setEndMatch[1], labels);
    if (candidate) return { type: 'SET_END_NODE', nodeLabel: candidate };
  }

  if (hasExplainCue || hasPhrase(EXPLAIN_VERBS, trimmed, normalized)) {
    return { type: 'EXPLAIN_ONLY', topic: trimmed };
  }

  // Lower used only for downstream tooling; keep it referenced so future tweaks don't drop it.
  void lower;

  return { type: 'UNKNOWN', reason: 'no-action' };
}
