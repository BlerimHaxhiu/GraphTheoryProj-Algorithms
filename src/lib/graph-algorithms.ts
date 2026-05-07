import type { Node, Edge, AlgorithmStep } from '@/types/graph';
import { normalizeEdge } from './graph-utils';

const INFINITY = Number.MAX_SAFE_INTEGER;
let stepCounterGlobal = 0; 

const generateStepId = () => `alg-step-${Date.now()}-${stepCounterGlobal++}`;

function messageStep(
  key: string,
  values?: Record<string, string | number>,
  extra?: Partial<AlgorithmStep>
): AlgorithmStep {
  return {
    id: generateStepId(),
    type: 'message',
    messageKey: `algorithmSteps.${key}`,
    messageValues: values,
    ...extra,
  };
}

function labelsForPath(path: string[], nodeMap: Map<string, Node>) {
  return path.map(id => nodeMap.get(id)?.label ?? id).join(' -> ');
}

function edgeLabel(source: string, target: string, nodeMap: Map<string, Node>) {
  return `${nodeMap.get(source)?.label ?? source}-${nodeMap.get(target)?.label ?? target}`;
}

function buildWeightedAdjacency(
  nodes: Node[],
  edges: Edge[]
): Map<string, { target: string; weight: number; edgeId: string }[]> {
  const adj: Map<string, { target: string; weight: number; edgeId: string }[]> = new Map();

  nodes.forEach(node => adj.set(node.id, []));
  edges.forEach(edge => {
    const normalizedEdge = normalizeEdge(edge);
    adj.get(edge.source)!.push({ target: edge.target, weight: normalizedEdge.weight, edgeId: edge.id });
    if (!normalizedEdge.directed && edge.source !== edge.target) {
      adj.get(edge.target)!.push({ target: edge.source, weight: normalizedEdge.weight, edgeId: edge.id });
    }
  });

  return adj;
}

function buildUnweightedAdjacency(
  nodes: Node[],
  edges: Edge[]
): Map<string, { target: string; edgeId: string }[]> {
  const adj: Map<string, { target: string; edgeId: string }[]> = new Map();

  nodes.forEach(node => adj.set(node.id, []));
  edges.forEach(edge => {
    const normalizedEdge = normalizeEdge(edge);
    adj.get(edge.source)!.push({ target: edge.target, edgeId: edge.id });
    if (!normalizedEdge.directed && edge.source !== edge.target) {
      adj.get(edge.target)!.push({ target: edge.source, edgeId: edge.id });
    }
  });

  return adj;
}

// Helper: Euclidean distance for A*
function heuristic(nodeA: Node, nodeB: Node): number {
  // The app allows arbitrary edge weights, so a geometric heuristic can easily
  // overestimate the true path cost and break A* optimality. A neutral heuristic
  // preserves correctness for all supported graphs.
  if (!nodeA || !nodeB) return 0;
  return 0;
}

// Helper: DSU for Kruskal
class DSU {
  parent: Map<string, string>;
  constructor(nodes: Node[]) {
    this.parent = new Map();
    nodes.forEach(node => this.parent.set(node.id, node.id));
  }

  find(nodeId: string): string {
    if (this.parent.get(nodeId) === nodeId) {
      return nodeId;
    }
    const root = this.find(this.parent.get(nodeId)!);
    this.parent.set(nodeId, root);
    return root;
  }

  union(nodeIdA: string, nodeIdB: string): boolean {
    const rootA = this.find(nodeIdA);
    const rootB = this.find(nodeIdB);
    if (rootA !== rootB) {
      this.parent.set(rootB, rootA);
      return true;
    }
    return false;
  }
}


// Dijkstra's Algorithm
export function dijkstra(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  endNodeId: string
): AlgorithmStep[] {
  stepCounterGlobal = 0; 
  const steps: AlgorithmStep[] = [];
  if (edges.some(edge => edge.weight < 0)) {
    steps.push(messageStep('dijkstraNegativeWeights'));
    return steps;
  }
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = buildWeightedAdjacency(nodes, edges);

  const dist: Map<string, number> = new Map(nodes.map(node => [node.id, INFINITY]));
  const prev: Map<string, { nodeId: string | null; edgeId: string | null }> = new Map(
    nodes.map(node => [node.id, { nodeId: null, edgeId: null }])
  );
  const pq: { id: string; priority: number }[] = []; 

  dist.set(startNodeId, 0);
  pq.push({ id: startNodeId, priority: 0 });
  steps.push(messageStep('dijkstraStart', { start: nodeMap.get(startNodeId)?.label ?? startNodeId, end: nodeMap.get(endNodeId)?.label ?? endNodeId }));
  steps.push({ id: generateStepId(), type: 'visit-node', nodeId: startNodeId, color: 'hsl(var(--accent))' });


  while (pq.length > 0) {
    pq.sort((a, b) => a.priority - b.priority); 
    const { id: u, priority: uDist } = pq.shift()!;

    if (uDist > dist.get(u)!) continue;
    if (u !== startNodeId) { 
        steps.push({ id: generateStepId(), type: 'visit-node', nodeId: u });
    }
    
    if (u === endNodeId) break; 

    (adj.get(u) || []).forEach(({ target: v, weight, edgeId }) => {
      steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId, nodeId: v, highlightSourceNodeId: u });
      if (dist.get(u)! + weight < dist.get(v)!) {
        dist.set(v, dist.get(u)! + weight);
        prev.set(v, { nodeId: u, edgeId });
        pq.push({ id: v, priority: dist.get(v)! });
        steps.push(messageStep('distanceUpdated', { node: nodeMap.get(v)?.label ?? v, distance: dist.get(v)! }));
      }
    });
  }

  const pathNodes: string[] = [];
  let curr = endNodeId;

  if (dist.get(curr) === INFINITY) {
     steps.push(messageStep('noPathBetween', { start: nodeMap.get(startNodeId)?.label ?? startNodeId, end: nodeMap.get(endNodeId)?.label ?? endNodeId }));
  } else {
    let pathReconstructionGuard = 0;
    const maxPathLength = nodes.length > 0 ? nodes.length : 1; // Max simple path length

    while (curr) {
      pathNodes.unshift(curr);
       if (pathReconstructionGuard++ > maxPathLength) {
            steps.push(messageStep('dijkstraReconstructionCycle'));
            return steps; 
        }
      const p = prev.get(curr);
      if (p?.nodeId) { 
        curr = p.nodeId;
      } else {
        break;
      }
    }
    if (pathNodes.length > 0 && pathNodes[0] === startNodeId && dist.get(endNodeId) !== INFINITY) { 
        steps.push({ id: generateStepId(), type: 'highlight-path', path: pathNodes });
        steps.push(messageStep('shortestPath', { path: labelsForPath(pathNodes, nodeMap), weight: dist.get(endNodeId)! }));
    } else if (startNodeId === endNodeId) { 
        steps.push({ id: generateStepId(), type: 'highlight-path', path: [startNodeId] });
        steps.push(messageStep('shortestPath', { path: nodeMap.get(startNodeId)?.label ?? startNodeId, weight: 0 }));
    } else if (dist.get(endNodeId) !== INFINITY) { // Path found but might not start with startNodeId (e.g. if graph is disconnected but endNodeId is reachable from somewhere)
        steps.push(messageStep('pathStartsElsewhere', { path: labelsForPath(pathNodes, nodeMap), weight: dist.get(endNodeId)! }));
    }
  }
  return steps;
}

// Breadth-First Search (BFS)
export function bfs(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string
): AlgorithmStep[] {
  stepCounterGlobal = 0;
  const steps: AlgorithmStep[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = buildUnweightedAdjacency(nodes, edges);

  const visited: Set<string> = new Set();
  const queue: string[] = [];
  
  steps.push(messageStep('bfsStart', { start: nodeMap.get(startNodeId)?.label ?? startNodeId }));
  
  visited.add(startNodeId);
  queue.push(startNodeId);
  steps.push({ id: generateStepId(), type: 'visit-node', nodeId: startNodeId, color: 'hsl(var(--accent))' });

  let head = 0;
  while(head < queue.length) {
    const u = queue[head++];
    
    (adj.get(u) || []).forEach(({ target: v, edgeId }) => {
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);
        steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId, nodeId: v, highlightSourceNodeId: u });
        steps.push({ id: generateStepId(), type: 'visit-node', nodeId: v });
      }
    });
  }
  steps.push(messageStep('bfsComplete', { nodes: queue.map(id => nodeMap.get(id)?.label ?? id).join(', ') }));
  return steps;
}

// Depth-First Search (DFS)
export function dfs(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string
): AlgorithmStep[] {
  stepCounterGlobal = 0;
  const steps: AlgorithmStep[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = buildUnweightedAdjacency(nodes, edges);

  const visited: Set<string> = new Set();
  const pathForHighlight: string[] = []; 

  function dfsVisit(u: string) {
    visited.add(u);
    pathForHighlight.push(u);
    steps.push({ id: generateStepId(), type: 'visit-node', nodeId: u, color: 'hsl(var(--accent))' });

    (adj.get(u) || []).forEach(({ target: v, edgeId }) => {
      if (!visited.has(v)) {
        steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId, nodeId: v, highlightSourceNodeId: u });
        dfsVisit(v);
      }
    });
  }
  
  steps.push(messageStep('dfsStart', { start: nodeMap.get(startNodeId)?.label ?? startNodeId }));
  dfsVisit(startNodeId);
  
  steps.push(messageStep('dfsComplete', { nodes: labelsForPath(pathForHighlight, nodeMap) }));
  return steps;
}


// A* Algorithm
export function aStar(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  endNodeId: string
): AlgorithmStep[] {
  stepCounterGlobal = 0;
  const steps: AlgorithmStep[] = [];
  if (edges.some(edge => edge.weight < 0)) {
    steps.push({
      id: generateStepId(),
      type: 'message',
      messageKey: 'algorithmSteps.aStarNegativeWeights',
    });
    return steps;
  }
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = buildWeightedAdjacency(nodes, edges);

  const openSet: { id: string; fScore: number }[] = []; // Array acting as PQ
  const closedSet: Set<string> = new Set(); // Set to keep track of processed nodes
  const cameFrom: Map<string, { nodeId: string | null; edgeId: string | null }> = new Map();

  const gScore: Map<string, number> = new Map(nodes.map(node => [node.id, INFINITY]));
  gScore.set(startNodeId, 0);

  const fScore: Map<string, number> = new Map(nodes.map(node => [node.id, INFINITY]));
  const startNodeObj = nodeMap.get(startNodeId);
  const endNodeObj = nodeMap.get(endNodeId);

  if (!startNodeObj || !endNodeObj) {
    steps.push(messageStep('startOrEndMissing'));
    return steps;
  }

  fScore.set(startNodeId, heuristic(startNodeObj, endNodeObj));
  openSet.push({ id: startNodeId, fScore: fScore.get(startNodeId)! });

  steps.push(messageStep('aStarStart', { start: startNodeObj.label, end: endNodeObj.label }));
  steps.push({ id: generateStepId(), type: 'visit-node', nodeId: startNodeId, color: 'hsl(var(--accent))' });

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.fScore - b.fScore); 
    const { id: currentId } = openSet.shift()!; 

    if (closedSet.has(currentId)) { 
        continue;
    }
    closedSet.add(currentId); 

    if (currentId === endNodeId) { 
      const pathNodes: string[] = [];
      let curr: string | null = endNodeId;
      let pathReconstructionGuard = 0;
      // Max simple path length in a graph with V nodes is V.
      // If path reconstruction exceeds this, it implies a cycle in `cameFrom` or other issue.
      const maxPathLength = nodes.length > 0 ? nodes.length : 1; 

      while (curr) {
        pathNodes.unshift(curr);
        if (pathReconstructionGuard++ > maxPathLength) { 
            steps.push(messageStep('aStarReconstructionCycle'));
            return steps; 
        }
        const prev = cameFrom.get(curr);
        curr = prev ? prev.nodeId : null;
      }
      if (pathNodes[0] !== startNodeId && startNodeId !== endNodeId) {
         steps.push(messageStep('aStarInvalidStart'));
      } else {
        steps.push({ id: generateStepId(), type: 'highlight-path', path: pathNodes });
        steps.push(messageStep('aStarBestPath', { path: labelsForPath(pathNodes, nodeMap), cost: gScore.get(endNodeId)! }));
      }
      return steps;
    }

    if (currentId !== startNodeId) { 
         steps.push({ id: generateStepId(), type: 'visit-node', nodeId: currentId });
    }

    (adj.get(currentId) || []).forEach(({ target: neighborId, weight, edgeId }) => {
      if (closedSet.has(neighborId)) { 
        return; 
      }

      const neighborNode = nodeMap.get(neighborId)!; // Should exist
      const tentativeGScore = gScore.get(currentId)! + weight;

      steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId, nodeId: neighborId, highlightSourceNodeId: currentId });

      if (tentativeGScore < (gScore.get(neighborId) || INFINITY)) {
        cameFrom.set(neighborId, { nodeId: currentId, edgeId });
        gScore.set(neighborId, tentativeGScore);
        const newFScore = tentativeGScore + heuristic(neighborNode, endNodeObj);
        fScore.set(neighborId, newFScore);
        
        const openSetIndex = openSet.findIndex(item => item.id === neighborId);
        if (openSetIndex > -1) {
          openSet[openSetIndex].fScore = newFScore; 
        } else {
          openSet.push({ id: neighborId, fScore: newFScore }); 
        }
        steps.push(messageStep('aStarScoreUpdated', { node: neighborNode.label, gScore: gScore.get(neighborId)!, fScore: fScore.get(neighborId)! }));
      }
    });
  }

  steps.push(messageStep('aStarNoPath', { start: startNodeObj.label, end: endNodeObj.label }));
  return steps;
}

// Bellman-Ford Algorithm
export function bellmanFord(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string
): AlgorithmStep[] {
  stepCounterGlobal = 0;
  const steps: AlgorithmStep[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const dist: Map<string, number> = new Map(nodes.map(node => [node.id, INFINITY]));
  const prev: Map<string, { nodeId: string | null; edgeId: string | null }> = new Map();
  dist.set(startNodeId, 0);

  steps.push(messageStep('bellmanFordStart', { start: nodeMap.get(startNodeId)?.label ?? startNodeId }));
  steps.push({ id: generateStepId(), type: 'visit-node', nodeId: startNodeId, color: 'hsl(var(--accent))' });

  const allEdgesForBellmanFord: Array<{ source: string; target: string; weight: number; edgeId: string }> = [];
  edges.forEach(edge => {
    const normalizedEdge = normalizeEdge(edge);
    allEdgesForBellmanFord.push({ source: edge.source, target: edge.target, weight: normalizedEdge.weight, edgeId: edge.id });
    if (!normalizedEdge.directed && edge.source !== edge.target) { 
        allEdgesForBellmanFord.push({ source: edge.target, target: edge.source, weight: normalizedEdge.weight, edgeId: edge.id });
    }
  });


  for (let i = 0; i < nodes.length - 1; i++) {
    steps.push(messageStep('iteration', { current: i + 1, total: nodes.length - 1 }));
    let changedInIteration = false;
    for (const edge of allEdgesForBellmanFord) {
      if (dist.get(edge.source)! !== INFINITY && dist.get(edge.source)! + edge.weight < dist.get(edge.target)!) {
        dist.set(edge.target, dist.get(edge.source)! + edge.weight);
        prev.set(edge.target, { nodeId: edge.source, edgeId: edge.edgeId });
        steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId: edge.edgeId, nodeId: edge.target, highlightSourceNodeId: edge.source });
        steps.push(messageStep('relaxation', { source: nodeMap.get(edge.source)?.label ?? edge.source, target: nodeMap.get(edge.target)?.label ?? edge.target, distance: dist.get(edge.target)! }));
        changedInIteration = true;
      }
    }
    if (!changedInIteration && i < nodes.length -2) { // Optimization: if no changes in an iteration (except the last one for cycle check)
        steps.push(messageStep('noIterationChanges', { iteration: i + 1 }));
        break; 
    }
  }

  let negativeCycleDetected = false;
  for (const edge of allEdgesForBellmanFord) {
    if (dist.get(edge.source)! !== INFINITY && dist.get(edge.source)! + edge.weight < dist.get(edge.target)!) {
      steps.push(messageStep('negativeCycleNearEdge', { edge: edgeLabel(edge.source, edge.target, nodeMap) }));
      negativeCycleDetected = true;
      steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId: edge.edgeId, nodeId: edge.target, highlightSourceNodeId: edge.source, color: 'hsl(var(--destructive))' });
      // Optionally, can try to trace and highlight the cycle itself, but this is complex.
      // To avoid further complex path display if a cycle is found:
      dist.set(edge.target, -INFINITY); // Mark nodes reachable by negative cycles
      // break; // Can break after first detection or continue to find all problematic edges.
    }
  }

  if (!negativeCycleDetected) {
    steps.push(messageStep('bellmanFordComplete'));
    nodes.forEach(node => {
        if (node.id !== startNodeId && dist.get(node.id) !== INFINITY) {
            const pathNodes: string[] = [];
            let curr: string | null = node.id;
            let pathReconstructionGuard = 0;
            const maxPathLength = nodes.length > 0 ? nodes.length : 1;
            while(curr) {
                pathNodes.unshift(curr);
                if (pathReconstructionGuard++ > maxPathLength) {
                     pathNodes.unshift("... (cycle?)"); 
                     break;
                }
                const p = prev.get(curr);
                curr = p ? p.nodeId : null;
            }
            if (pathNodes[0] === startNodeId || (pathNodes.length > 1 && pathNodes[1] === startNodeId)) { 
                 steps.push({ id: generateStepId(), type: 'highlight-path', path: pathNodes.filter(p => p !== "... (cycle?)"), color: 'hsl(var(--primary))' });
                 steps.push(messageStep('shortestPathTo', { node: nodeMap.get(node.id)?.label ?? node.id, path: labelsForPath(pathNodes, nodeMap), weight: dist.get(node.id)! }));
            } else if (dist.get(node.id) !== INFINITY) {
                 steps.push(messageStep('distanceCannotReconstruct', { node: nodeMap.get(node.id)?.label ?? node.id, distance: dist.get(node.id)! }));
            }
        } else if (node.id === startNodeId) {
            steps.push(messageStep('distanceTo', { node: nodeMap.get(startNodeId)?.label ?? startNodeId, distance: 0 }));
        } else if (dist.get(node.id) === INFINITY) {
             steps.push(messageStep('noPathTo', { node: nodeMap.get(node.id)?.label ?? node.id }));
        }
    });

  } else {
     steps.push(messageStep('bellmanFordNegativeCycle'));
  }
  return steps;
}


// Floyd-Warshall Algorithm
export function floydWarshall(
  nodes: Node[],
  edges: Edge[]
): AlgorithmStep[] {
  stepCounterGlobal = 0;
  const steps: AlgorithmStep[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const nodeIndexMap = new Map(nodes.map((node, i) => [node.id, i]));
  const numNodes = nodes.length;

  if (numNodes === 0) {
    steps.push(messageStep('floydWarshallEmpty'));
    return steps;
  }

  const dist: number[][] = Array(numNodes).fill(null).map(() => Array(numNodes).fill(INFINITY));
  const next: (number | null)[][] = Array(numNodes).fill(null).map(() => Array(numNodes).fill(null));

  for (let i = 0; i < numNodes; i++) {
    dist[i][i] = 0;
  }

  edges.forEach(edge => {
    const normalizedEdge = normalizeEdge(edge);
    const u = nodeIndexMap.get(edge.source)!;
    const v = nodeIndexMap.get(edge.target)!;
    if (u === undefined || v === undefined) return;

    if (normalizedEdge.weight < dist[u][v]) {
      dist[u][v] = normalizedEdge.weight;
      next[u][v] = v;
    }
    if (!normalizedEdge.directed && u !== v && normalizedEdge.weight < dist[v][u]) {
      dist[v][u] = normalizedEdge.weight;
      next[v][u] = u;
    }
  });

  steps.push(messageStep('floydWarshallStart'));

  for (let k_idx = 0; k_idx < numNodes; k_idx++) {
    const k_node = nodes[k_idx];
    steps.push({
      id: generateStepId(),
      type: 'visit-node',
      nodeId: k_node.id,
      messageKey: 'algorithmSteps.intermediateNode',
      messageValues: { node: k_node.label, index: k_idx },
      color: 'hsl(var(--secondary-foreground))',
    });

    for (let i_idx = 0; i_idx < numNodes; i_idx++) {
      for (let j_idx = 0; j_idx < numNodes; j_idx++) {
        if (
          dist[i_idx][k_idx] !== INFINITY &&
          dist[k_idx][j_idx] !== INFINITY &&
          dist[i_idx][k_idx] + dist[k_idx][j_idx] < dist[i_idx][j_idx]
        ) {
          const oldDist = dist[i_idx][j_idx];
          dist[i_idx][j_idx] = dist[i_idx][k_idx] + dist[k_idx][j_idx];
          next[i_idx][j_idx] = next[i_idx][k_idx];

          steps.push({
            id: generateStepId(),
            type: 'update-matrix-cell',
            messageKey: 'algorithmSteps.matrixDistanceUpdated',
            messageValues: {
              from: nodes[i_idx].label,
              to: nodes[j_idx].label,
              oldDistance: oldDist === INFINITY ? 'inf' : oldDist,
              newDistance: dist[i_idx][j_idx],
              via: k_node.label,
            },
            matrixCell: { row: i_idx, col: j_idx, value: dist[i_idx][j_idx] },
          });
        }
      }
    }
  }

  const negativeCycleIndices = new Set<number>();
  for (let i = 0; i < numNodes; i++) {
    if (dist[i][i] < 0) {
      negativeCycleIndices.add(i);
      steps.push(messageStep('negativeCycleIncludesNode', { node: nodes[i].label }));
    }
  }

  const affectedPairKey = (i: number, j: number) => `${i}:${j}`;
  const affectedPairs = new Set<string>();
  negativeCycleIndices.forEach(cycleIndex => {
    for (let i = 0; i < numNodes; i++) {
      if (dist[i][cycleIndex] === INFINITY) continue;
      for (let j = 0; j < numNodes; j++) {
        if (dist[cycleIndex][j] === INFINITY) continue;
        affectedPairs.add(affectedPairKey(i, j));
      }
    }
  });

  steps.push(messageStep(negativeCycleIndices.size > 0 ? 'floydWarshallCompleteNegative' : 'floydWarshallComplete'));

  function getPath(i: number, j: number): string[] {
    if (next[i][j] === null || affectedPairs.has(affectedPairKey(i, j))) return [];
    const path: string[] = [nodes[i].id];
    let current = i;
    const visited = new Set<number>([i]);

    while (current !== j) {
      current = next[current][j]!;
      if (visited.has(current)) return [];
      visited.add(current);
      path.push(nodes[current].id);
      if (path.length > numNodes + 1) return [];
    }

    return path;
  }

  const pathsByStartNode = new Map<string, { target: string; path: string[]; distance: number }[]>();

  for (let i = 0; i < numNodes; i++) {
    const paths: { target: string; path: string[]; distance: number }[] = [];

    for (let j = 0; j < numNodes; j++) {
      if (i !== j && dist[i][j] !== INFINITY && !affectedPairs.has(affectedPairKey(i, j))) {
        const path = getPath(i, j);
        if (path.length > 0) {
          paths.push({ target: nodes[j].id, path, distance: dist[i][j] });
        }
      }
    }

    if (paths.length > 0) {
      pathsByStartNode.set(nodes[i].id, paths);
    }
  }

  pathsByStartNode.forEach((paths, startNodeId) => {
    const startNode = nodeMap.get(startNodeId)!;
    steps.push(messageStep('pathsFrom', { node: startNode.label }));

    paths.forEach(({ target, path, distance }) => {
      const targetNode = nodeMap.get(target)!;
      steps.push({
        id: generateStepId(),
        type: 'highlight-path',
        path,
        color: 'hsl(var(--primary))',
      });
      steps.push(messageStep('pathDistance', { target: targetNode.label, path: labelsForPath(path, nodeMap), distance }));
    });
  });

  steps.push(messageStep('distanceMatrix'));

  const headerRow = ['', ...nodes.map(n => n.label)];
  steps.push({ id: generateStepId(), type: 'message', message: headerRow.join('\t') });

  nodes.forEach((node, i) => {
    const row = [
      node.label,
      ...nodes.map((_, j) => {
        if (affectedPairs.has(affectedPairKey(i, j))) return '-inf';
        return dist[i][j] === INFINITY ? 'inf' : dist[i][j];
      }),
    ];
    steps.push({ id: generateStepId(), type: 'message', message: row.join('\t') });
  });

  return steps;
}

// Kruskal's Algorithm (MST)
export function kruskal(
  nodes: Node[],
  edges: Edge[]
): AlgorithmStep[] {
  stepCounterGlobal = 0;
  const steps: AlgorithmStep[] = [];
  if (nodes.length === 0) {
    steps.push(messageStep('graphEmpty'));
    return steps;
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const sortedEdges = [...edges]
    .map(edge => normalizeEdge(edge))
    .filter(edge => !edge.directed)
    .sort((a, b) => a.weight - b.weight);
  const dsu = new DSU(nodes);
  const mstEdges: Edge[] = [];
  let mstWeight = 0;

  steps.push(messageStep('kruskalStart'));

  for (const edge of sortedEdges) {
    steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId: edge.id, nodeId: edge.target, highlightSourceNodeId: edge.source, color: 'hsl(var(--muted-foreground))' });
    if (dsu.union(edge.source, edge.target)) {
      mstEdges.push(edge);
      mstWeight += edge.weight;
      steps.push(messageStep('mstEdgeAddedColon', { edge: edgeLabel(edge.source, edge.target, nodeMap), weight: edge.weight }));
      steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId: edge.id, nodeId: edge.target, highlightSourceNodeId: edge.source, color: 'hsl(var(--accent))' });
      if (mstEdges.length === nodes.length - 1 && nodes.length > 0) break;
    } else {
      steps.push(messageStep('mstEdgeIgnoredCycle', { edge: edgeLabel(edge.source, edge.target, nodeMap) }));
    }
  }

  if (mstEdges.length < nodes.length - 1 && nodes.length > 1 && nodes.some(n => dsu.find(n.id) !== dsu.find(nodes[0].id))) {
    steps.push(messageStep('mstDisconnected'));
  }

  if (mstEdges.length > 0) {
    steps.push(messageStep('mstSelectedEdges', {
      edges: mstEdges.map(edge => edgeLabel(edge.source, edge.target, nodeMap)).join(', '),
    }));
  }

  steps.push(messageStep('kruskalComplete', { weight: mstWeight }));
  return steps;
}

// Prim's Algorithm (MST)
export function prim(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string
): AlgorithmStep[] {
  stepCounterGlobal = 0;
  const steps: AlgorithmStep[] = [];
  if (nodes.length === 0) {
    steps.push(messageStep('graphEmpty'));
    return steps;
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = buildWeightedAdjacency(nodes, edges.map(edge => normalizeEdge(edge)).filter(edge => !edge.directed));

  const key: Map<string, number> = new Map(nodes.map(node => [node.id, INFINITY]));
  const parent: Map<string, { nodeId: string | null; edgeId: string | null }> = new Map();
  const inMST: Set<string> = new Set();
  const pq: { id: string; keyVal: number }[] = [];

  key.set(startNodeId, 0);
  pq.push({ id: startNodeId, keyVal: 0 });

  steps.push(messageStep('primStart', { start: nodeMap.get(startNodeId)?.label ?? startNodeId }));

  const mstPathForHighlight: string[] = [];
  let mstWeight = 0;

  while (pq.length > 0) {
    pq.sort((a, b) => a.keyVal - b.keyVal);
    const { id: u_id, keyVal: u_key } = pq.shift()!;

    if (inMST.has(u_id)) continue;

    inMST.add(u_id);
    mstPathForHighlight.push(u_id);

    if (parent.has(u_id)) {
      mstWeight += u_key;
    }

    steps.push({ id: generateStepId(), type: 'visit-node', nodeId: u_id, color: 'hsl(var(--accent))' });
    const pEdgeInfo = parent.get(u_id);
    if (pEdgeInfo?.nodeId && pEdgeInfo?.edgeId) {
      steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId: pEdgeInfo.edgeId, nodeId: u_id, highlightSourceNodeId: pEdgeInfo.nodeId, color: 'hsl(var(--primary))' });
      steps.push(messageStep('mstEdgeAdded', { edge: edgeLabel(pEdgeInfo.nodeId, u_id, nodeMap), weight: u_key }));
    }

    (adj.get(u_id) || []).forEach(({ target: v_id, weight, edgeId }) => {
      if (!inMST.has(v_id) && weight < key.get(v_id)!) {
        key.set(v_id, weight);
        parent.set(v_id, { nodeId: u_id, edgeId });

        const pqEntryIndex = pq.findIndex(item => item.id === v_id);
        if (pqEntryIndex > -1) {
          pq[pqEntryIndex].keyVal = weight;
        } else {
          pq.push({ id: v_id, keyVal: weight });
        }

        steps.push({ id: generateStepId(), type: 'traverse-edge', edgeId, nodeId: v_id, highlightSourceNodeId: u_id, color: 'hsl(var(--muted-foreground))' });
        steps.push(messageStep('primCandidateUpdated', { node: nodeMap.get(v_id)?.label ?? v_id, weight, source: nodeMap.get(u_id)?.label ?? u_id }));
      }
    });

    if (inMST.size === nodes.length) break;
  }

  if (mstPathForHighlight.length < nodes.length && nodes.length > 0) {
    steps.push(messageStep('mstDisconnectedAllNodes'));
  }

  if (parent.size > 0) {
    const mstEdges = Array.from(parent.entries())
      .filter(([, info]) => info.nodeId && info.edgeId)
      .map(([nodeId, info]) => edgeLabel(info.nodeId!, nodeId, nodeMap));

    if (mstEdges.length > 0) {
      steps.push(messageStep('mstSelectedEdges', { edges: mstEdges.join(', ') }));
    }
  }

  steps.push(messageStep('primComplete', { weight: mstWeight }));
  return steps;
}
