
import type { Node, Edge, AdjacencyMatrix, GraphData } from '@/types/graph';

export interface GraphStats {
  nodesCount: number;
  edgesCount: number;
  density: number | string; // Can be 'N/A'
  connectedComponents: number;
  isComplete: boolean;
}

export interface DegreeDistribution {
  degree: number;
  count: number;
}

const DEFAULT_CURVE_OFFSET = 40;
const CURVE_OFFSET_STEP = 24;

export function normalizeEdge(edge: Edge, fallbackDirected = false): Edge {
  return {
    ...edge,
    weight: Number.isFinite(edge.weight) ? Number(edge.weight) : 1,
    directed: edge.directed ?? fallbackDirected,
    curved: edge.curved ?? false,
    curveOffset: Number.isFinite(edge.curveOffset) ? Number(edge.curveOffset) : 0,
  };
}

export function normalizeEdges(edges: Edge[], fallbackDirected = false): Edge[] {
  return edges.map(edge => normalizeEdge(edge, fallbackDirected));
}

export function serializeGraphPayload(nodes: Node[], edges: Edge[]) {
  return {
    nodes,
    edges: normalizeEdges(edges),
  };
}

export function graphHasDirectedEdges(edges: Edge[]): boolean {
  return edges.some(edge => normalizeEdge(edge).directed === true);
}

export function buildAdjacencyMatrix(nodes: Node[], edges: Edge[]): AdjacencyMatrix {
  const matrix: AdjacencyMatrix = Array(nodes.length)
    .fill(null)
    .map(() => Array(nodes.length).fill(Infinity));

  const nodeIndexMap = new Map(nodes.map((node, i) => [node.id, i]));

  for (let i = 0; i < nodes.length; i++) {
    matrix[i][i] = 0;
  }

  edges.forEach(edge => {
    const normalizedEdge = normalizeEdge(edge);
    const sourceIndex = nodeIndexMap.get(edge.source);
    const targetIndex = nodeIndexMap.get(edge.target);

    if (sourceIndex !== undefined && targetIndex !== undefined) {
      matrix[sourceIndex][targetIndex] = Math.min(matrix[sourceIndex][targetIndex], normalizedEdge.weight);
      if (!normalizedEdge.directed && sourceIndex !== targetIndex) {
        matrix[targetIndex][sourceIndex] = Math.min(matrix[targetIndex][sourceIndex], normalizedEdge.weight);
      }
    }
  });

  return matrix;
}

export function getGraphRepresentationForAI(
  nodes: Node[],
  edges: Edge[],
  startNodeId?: string | null,
  endNodeId?: string | null
): GraphData {
  const matrix = buildAdjacencyMatrix(nodes, edges);
  const nodeMap = new Map(nodes.map(n => [n.id, n.label]));

  return {
    graphRepresentation: JSON.stringify(matrix),
    nodesCount: nodes.length,
    nodeLabels: nodes.map(n => n.label),
    startNodeLabel: startNodeId ? nodeMap.get(startNodeId) : undefined,
    endNodeLabel: endNodeId ? nodeMap.get(endNodeId) : undefined,
  };
}


export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

export function generateEdgeId(): string {
  return `edge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

export function getEdgePairKey(source: string, target: string): string {
  return [source, target].sort().join('::');
}

export function getParallelEdges(edges: Edge[], source: string, target: string): Edge[] {
  const pairKey = getEdgePairKey(source, target);
  return edges.filter(edge => getEdgePairKey(edge.source, edge.target) === pairKey);
}

export function calculateCurveOffset(source: string, target: string, edges: Edge[]): number {
  if (source === target) {
    const loopCount = edges.filter(edge => edge.source === source && edge.target === target).length;
    return 70 + loopCount * 20;
  }

  const parallelEdges = getParallelEdges(edges, source, target).map(edge => normalizeEdge(edge));
  const usedOffsets = parallelEdges
    .map(edge => edge.curved ? edge.curveOffset || DEFAULT_CURVE_OFFSET : 0)
    .filter(offset => offset !== 0);

  let magnitude = DEFAULT_CURVE_OFFSET;
  const usedMagnitudes = new Set(usedOffsets.map(offset => Math.abs(offset)));
  while (usedMagnitudes.has(magnitude)) {
    magnitude += CURVE_OFFSET_STEP;
  }

  const positiveCount = usedOffsets.filter(offset => offset > 0).length;
  const negativeCount = usedOffsets.filter(offset => offset < 0).length;
  const sign = positiveCount <= negativeCount ? 1 : -1;

  return magnitude * sign;
}

export function hasNegativeEdgeWeights(edges: Edge[]): boolean {
  return edges.some(edge => normalizeEdge(edge).weight < 0);
}

export function getNextNodeLabel(existingNodes: Node[]): string {
  const existingLabels = new Set(existingNodes.map(n => n.label));
  let charCodeA = 'A'.charCodeAt(0);
  let label = '';
  let count = 0;

  while (true) {
    let tempLabel = '';
    let num = count;
    do {
      tempLabel = String.fromCharCode(charCodeA + (num % 26)) + tempLabel;
      num = Math.floor(num / 26) -1; 
    } while (num >=0);
    
    label = tempLabel;
    if (!existingLabels.has(label)) {
      return label;
    }
    count++;
  }
}

function getConnectedComponents(nodes: Node[], edges: Edge[]): number {
  if (nodes.length === 0) return 0;

  const adj = new Map<string, string[]>();
  nodes.forEach(node => adj.set(node.id, []));
  edges.forEach(edge => {
    adj.get(edge.source)!.push(edge.target);
    // For directed graphs we report weakly connected components.
    adj.get(edge.target)!.push(edge.source);
  });

  const visited = new Set<string>();
  let components = 0;

  function dfs(nodeId: string) {
    visited.add(nodeId);
    (adj.get(nodeId) || []).forEach(neighbor => {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    });
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
      components++;
    }
  });
  return components;
}

export function calculateGraphStats(nodes: Node[], edges: Edge[]): GraphStats {
  const V = nodes.length;
  const E = edges.length;
  let density: number | string;
  let isComplete = false;
  const orderedEdgeKeys = new Set<string>();

  edges.forEach(edge => {
    const normalizedEdge = normalizeEdge(edge);
    if (edge.source === edge.target) {
      return;
    }

    orderedEdgeKeys.add(`${edge.source}->${edge.target}`);
    if (!normalizedEdge.directed) {
      orderedEdgeKeys.add(`${edge.target}->${edge.source}`);
    }
  });

  const effectiveEdgesCount = orderedEdgeKeys.size;

  if (V < 2) {
    density = V === 0 ? 0 : 'N/A';
    isComplete = V === 1 || V === 0; // A single node or no nodes can be considered "complete" vacuously
  } else {
    density = effectiveEdgesCount / (V * (V - 1));
    isComplete = effectiveEdgesCount === V * (V - 1);
    density = parseFloat(density.toFixed(3));
  }
  
  const connectedComponents = getConnectedComponents(nodes, edges);

  return {
    nodesCount: V,
    edgesCount: E,
    density,
    connectedComponents,
    isComplete,
  };
}

export function calculateDegreeDistribution(nodes: Node[], edges: Edge[]): DegreeDistribution[] {
  if (nodes.length === 0) return [];

  const degrees = new Map<string, number>();
  nodes.forEach(node => degrees.set(node.id, 0));

  edges.forEach(edge => {
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
    if (edge.source !== edge.target) {
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    }
  });

  const distributionMap = new Map<number, number>();
  degrees.forEach(degree => {
    distributionMap.set(degree, (distributionMap.get(degree) || 0) + 1);
  });

  return Array.from(distributionMap.entries())
    .map(([degree, count]) => ({ degree, count }))
    .sort((a, b) => a.degree - b.degree);
}
