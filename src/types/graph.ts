

export interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface Edge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  weight: number;
  directed?: boolean;
  curved?: boolean;
  curveOffset?: number;
}

export type AdjacencyMatrix = number[][];

export interface AlgorithmStep {
  id: string; // Unique identifier for the step
  type: 'visit-node' | 'traverse-edge' | 'highlight-path' | 'reset' | 'message' | 'update-matrix-cell';
  nodeId?: string; // For visit-node, this is the visited node. For traverse-edge, this is the target node.
  edgeId?: string;
  highlightSourceNodeId?: string; // For traverse-edge, this is the source node of the traversed edge.
  path?: string[]; // Array of node IDs (for paths or MST edges)
  message?: string;
  messageKey?: string;
  messageValues?: Record<string, string | number>;
  color?: string; // Optional color for highlighting
  matrixCell?: { row: number; col: number; value: number | string }; // For Floyd-Warshall matrix updates
}

export type AlgorithmType = 
  | 'dijkstra' 
  | 'bfs' 
  | 'dfs'
  | 'a-star'
  | 'bellman-ford'
  | 'floyd-warshall'
  | 'kruskal'
  | 'prim';

export type SelectedToolType = 'pointer' | 'add-edge'; // Removed 'add-node' and 'delete-node'
export type EdgeDrawType = 'straight' | 'curved';

export interface GraphData {
  graphRepresentation: string; // JSON string of adjacency matrix
  nodesCount: number;
  nodeLabels: string[]; // List of node labels, corresponding to matrix indices
  startNodeLabel?: string; // Label of the start node, if any
  endNodeLabel?: string;   // Label of the end node, if any (for Dijkstra)
}

export interface GraphStats {
  nodesCount: number;
  edgesCount: number;
  density: number | string;
  connectedComponents: number;
  isComplete: boolean;
}

export interface DegreeDistribution {
  degree: number;
  count: number;
}

export interface ExecutionLogEntry {
  id: string;
  algorithm: AlgorithmType;
  startTime: Date;
  endTime: Date;
  executionTimeMs: number; // Time in milliseconds
  nodesCountSnapshot: number; // V at time of execution
  edgesCountSnapshot: number; // E at time of execution
  startNodeLabel?: string;
  endNodeLabel?: string;
  resultSummary: string;
}
