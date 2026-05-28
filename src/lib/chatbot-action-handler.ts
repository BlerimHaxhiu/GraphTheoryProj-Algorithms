import type { AlgorithmType, Edge, Node } from '@/types/graph';
import type { AppLanguage } from '@/components/language-provider';
import type { ChatbotAction } from '@/lib/chatbot-command-parser';

export interface ChatbotAutomationContext {
  language: AppLanguage;
  nodes: Node[];
  edges: Edge[];
  startNodeId: string | null;
  endNodeId: string | null;
  setStartNodeId: (nodeId: string | null) => void;
  setEndNodeId: (nodeId: string | null) => void;
  runAlgorithm: (algorithm: AlgorithmType, startNodeId?: string, endNodeId?: string) => void;
  clearResult: () => void;
}

export interface ChatbotActionResult {
  handled: boolean;
  success: boolean;
  message: string;
  fallbackToEducation?: boolean;
}

type Localized = { sq: string; en: string };

const ALGO_LABELS: Record<AlgorithmType, string> = {
  bfs: 'BFS',
  dfs: 'DFS',
  dijkstra: 'Dijkstra',
  'a-star': 'A*',
  'bellman-ford': 'Bellman-Ford',
  'floyd-warshall': 'Floyd-Warshall',
  kruskal: 'Kruskal',
  prim: 'Prim',
};

const NEEDS_START_NODE = new Set<AlgorithmType>([
  'bfs',
  'dfs',
  'dijkstra',
  'a-star',
  'bellman-ford',
  'prim',
]);

const NEEDS_END_NODE = new Set<AlgorithmType>(['dijkstra', 'a-star']);

const NEGATIVE_WEIGHT_UNSUPPORTED = new Set<AlgorithmType>(['dijkstra', 'a-star']);

const MST_ALGORITHMS = new Set<AlgorithmType>(['kruskal', 'prim']);

function pick(text: Localized, language: AppLanguage): string {
  return text[language];
}

function findNodeIdByLabel(nodes: Node[], label: string | undefined): string | undefined {
  if (!label) return undefined;
  const normalized = label.toLowerCase();
  const direct = nodes.find(n => n.label.toLowerCase() === normalized);
  if (direct) return direct.id;
  const idMatch = nodes.find(n => n.id.toLowerCase() === normalized);
  return idMatch?.id;
}

function hasNegativeWeights(edges: Edge[]): boolean {
  return edges.some(edge => Number.isFinite(edge.weight) && edge.weight < 0);
}

function hasDirectedEdges(edges: Edge[]): boolean {
  return edges.some(edge => edge.directed === true);
}

function listAvailableLabels(nodes: Node[]): string {
  if (nodes.length === 0) return '—';
  return nodes
    .map(n => n.label)
    .slice(0, 12)
    .join(', ') + (nodes.length > 12 ? '…' : '');
}

export function executeChatbotAction(
  action: ChatbotAction,
  ctx: ChatbotAutomationContext
): ChatbotActionResult {
  const { language, nodes, edges } = ctx;

  switch (action.type) {
    case 'EXPLAIN_ONLY':
    case 'UNKNOWN':
      return { handled: false, success: false, message: '', fallbackToEducation: true };

    case 'CLEAR_RESULT':
    case 'RESET_VISUALIZATION': {
      ctx.clearResult();
      const msg: Localized = {
        sq: 'Rezultati u pastrua. Grafi ne kanavace mbetet i njejti.',
        en: 'The result was cleared. The graph on the canvas is unchanged.',
      };
      return { handled: true, success: true, message: pick(msg, language) };
    }

    case 'SET_START_NODE': {
      const id = findNodeIdByLabel(nodes, action.nodeLabel);
      if (!id) {
        return {
          handled: true,
          success: false,
          message: pick(
            {
              sq: `Nuk gjeta nyjen "${action.nodeLabel}". Nyjet aktuale: ${listAvailableLabels(nodes)}.`,
              en: `I couldn't find node "${action.nodeLabel}". Available nodes: ${listAvailableLabels(nodes)}.`,
            },
            language
          ),
        };
      }
      ctx.setStartNodeId(id);
      const msg: Localized = {
        sq: `Nyja fillestare u caktua: ${action.nodeLabel}.`,
        en: `Start node set to: ${action.nodeLabel}.`,
      };
      return { handled: true, success: true, message: pick(msg, language) };
    }

    case 'SET_END_NODE': {
      const id = findNodeIdByLabel(nodes, action.nodeLabel);
      if (!id) {
        return {
          handled: true,
          success: false,
          message: pick(
            {
              sq: `Nuk gjeta nyjen "${action.nodeLabel}". Nyjet aktuale: ${listAvailableLabels(nodes)}.`,
              en: `I couldn't find node "${action.nodeLabel}". Available nodes: ${listAvailableLabels(nodes)}.`,
            },
            language
          ),
        };
      }
      ctx.setEndNodeId(id);
      const msg: Localized = {
        sq: `Nyja perfundimtare u caktua: ${action.nodeLabel}.`,
        en: `End node set to: ${action.nodeLabel}.`,
      };
      return { handled: true, success: true, message: pick(msg, language) };
    }

    case 'RUN_ALGORITHM': {
      const algoLabel = ALGO_LABELS[action.algorithm];

      if (nodes.length === 0) {
        return {
          handled: true,
          success: false,
          message: pick(
            {
              sq: 'Grafi eshte bosh. Se pari shto disa nyje dhe lidhje, pastaj kerko ekzekutimin.',
              en: 'The graph is empty. First add some nodes and edges, then ask me to run the algorithm.',
            },
            language
          ),
        };
      }

      if (
        MST_ALGORITHMS.has(action.algorithm) &&
        hasDirectedEdges(edges)
      ) {
        return {
          handled: true,
          success: false,
          message: pick(
            {
              sq: `${algoLabel} suporton vetem grafe te padrejtuara. Hiq drejtimet ose perdor nje algoritem tjeter.`,
              en: `${algoLabel} only supports undirected graphs. Remove edge directions or pick another algorithm.`,
            },
            language
          ),
        };
      }

      if (
        NEGATIVE_WEIGHT_UNSUPPORTED.has(action.algorithm) &&
        hasNegativeWeights(edges)
      ) {
        return {
          handled: true,
          success: false,
          message: pick(
            {
              sq: `${algoLabel} nuk mund te perdoret me pesha negative. Provo Bellman-Ford.`,
              en: `${algoLabel} cannot be used with negative weights. Try Bellman-Ford instead.`,
            },
            language
          ),
        };
      }

      let startNodeId: string | undefined;
      let endNodeId: string | undefined;

      if (NEEDS_START_NODE.has(action.algorithm)) {
        startNodeId = action.startNodeLabel
          ? findNodeIdByLabel(nodes, action.startNodeLabel)
          : ctx.startNodeId ?? undefined;
        if (action.startNodeLabel && !startNodeId) {
          return {
            handled: true,
            success: false,
            message: pick(
              {
                sq: `Nuk gjeta nyjen "${action.startNodeLabel}". Nyjet aktuale: ${listAvailableLabels(nodes)}.`,
                en: `I couldn't find node "${action.startNodeLabel}". Available nodes: ${listAvailableLabels(nodes)}.`,
              },
              language
            ),
          };
        }
        if (!startNodeId) {
          return {
            handled: true,
            success: false,
            message: pick(
              {
                sq: `Per ${algoLabel} duhet nje nyje fillestare. Shkruaj p.sh. "Ekzekuto ${algoLabel} nga A".`,
                en: `${algoLabel} needs a start node. Try e.g. "Run ${algoLabel} from A".`,
              },
              language
            ),
          };
        }
      }

      if (NEEDS_END_NODE.has(action.algorithm)) {
        endNodeId = action.endNodeLabel
          ? findNodeIdByLabel(nodes, action.endNodeLabel)
          : ctx.endNodeId ?? undefined;
        if (action.endNodeLabel && !endNodeId) {
          return {
            handled: true,
            success: false,
            message: pick(
              {
                sq: `Nuk gjeta nyjen perfundimtare "${action.endNodeLabel}". Nyjet aktuale: ${listAvailableLabels(nodes)}.`,
                en: `I couldn't find end node "${action.endNodeLabel}". Available nodes: ${listAvailableLabels(nodes)}.`,
              },
              language
            ),
          };
        }
        if (!endNodeId) {
          return {
            handled: true,
            success: false,
            message: pick(
              {
                sq: `Per ${algoLabel} duhet edhe nyja perfundimtare. Shkruaj p.sh. "Ekzekuto ${algoLabel} nga A deri te F".`,
                en: `${algoLabel} needs an end node too. Try e.g. "Run ${algoLabel} from A to F".`,
              },
              language
            ),
          };
        }
      }

      if (startNodeId) ctx.setStartNodeId(startNodeId);
      if (endNodeId) ctx.setEndNodeId(endNodeId);
      ctx.runAlgorithm(action.algorithm, startNodeId, endNodeId);

      const startLabel = startNodeId ? nodes.find(n => n.id === startNodeId)?.label : undefined;
      const endLabel = endNodeId ? nodes.find(n => n.id === endNodeId)?.label : undefined;

      let confirmation: Localized;
      if (startLabel && endLabel) {
        confirmation = {
          sq: `U ekzekutua ${algoLabel} nga ${startLabel} deri te ${endLabel}. Rezultati u shfaq ne kanavace dhe ne panelin e raportit.`,
          en: `Ran ${algoLabel} from ${startLabel} to ${endLabel}. The result is showing on the canvas and in the report panel.`,
        };
      } else if (startLabel) {
        confirmation = {
          sq: `U ekzekutua ${algoLabel} duke filluar nga nyja ${startLabel}. Rezultati u shfaq ne kanavace.`,
          en: `Ran ${algoLabel} starting from node ${startLabel}. The result is showing on the canvas.`,
        };
      } else {
        confirmation = {
          sq: `U ekzekutua ${algoLabel}. Rezultati u shfaq ne kanavace dhe ne panelin e raportit.`,
          en: `Ran ${algoLabel}. The result is showing on the canvas and in the report panel.`,
        };
      }
      return { handled: true, success: true, message: pick(confirmation, language) };
    }

    default: {
      const exhaustiveCheck: never = action;
      return {
        handled: false,
        success: false,
        message: '',
        fallbackToEducation: true,
      };
    }
  }
}
