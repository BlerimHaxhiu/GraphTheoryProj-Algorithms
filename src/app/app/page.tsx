
// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { ControlsPanel } from '@/components/graph/ControlsPanel';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { AlgorithmReportPanel } from '@/components/graph/AlgorithmReportPanel';
import { AdjacencyMatrixTable } from '@/components/graph/AdjacencyMatrixTable';
import { GraphStatsPanel } from '@/components/graph/GraphStatsPanel';
import { AlgorithmExplanationPanel } from '@/components/graph/AlgorithmExplanationPanel';
import { ExecutionHistoryPanel } from '@/components/graph/ExecutionHistoryPanel';
import { CompareAlgorithmsPanel } from '@/components/graph/CompareAlgorithmsPanel';
import { ExportPanel } from '@/components/graph/ExportPanel';
import { FullscreenSection } from '@/components/ui/fullscreen-section';

import type { Node, Edge, AlgorithmStep, AlgorithmType, ExecutionLogEntry } from '@/types/graph';
import { generateNodeId, getNextNodeLabel, buildAdjacencyMatrix, generateEdgeId, graphHasDirectedEdges, hasNegativeEdgeWeights, normalizeEdge, serializeGraphPayload } from '@/lib/graph-utils';
import { dijkstra, bfs, dfs, aStar, bellmanFord, floydWarshall, kruskal, prim } from '@/lib/graph-algorithms';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { Card } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';


const CANVAS_PADDING = 20;
const NODE_RADIUS = 20;
const MST_ALGORITHMS = new Set<AlgorithmType>(['kruskal', 'prim']);
const NEGATIVE_WEIGHT_UNSUPPORTED_ALGORITHMS = new Set<AlgorithmType>(['dijkstra', 'a-star']);

function validateGraphPayload(parsedData: any, fallbackDirected = false) {
  if (
    !parsedData ||
    typeof parsedData !== 'object' ||
    !Array.isArray(parsedData.nodes) ||
    !Array.isArray(parsedData.edges) ||
    (parsedData.isDirected !== undefined && typeof parsedData.isDirected !== 'boolean')
  ) {
    return {
      error: 'messages.invalidGraphStructure',
    };
  }

  const nodeIds = new Set<string>();
  const nodes: Node[] = [];

  for (const node of parsedData.nodes) {
    if (
      !node ||
      typeof node.id !== 'string' ||
      typeof node.label !== 'string' ||
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y)
    ) {
      return {
        error: 'messages.invalidNodes',
      };
    }

    if (nodeIds.has(node.id)) {
      return {
        error: 'messages.duplicateNodeIds',
      };
    }

    nodeIds.add(node.id);
    nodes.push({
      id: node.id,
      label: node.label,
      x: Number(node.x),
      y: Number(node.y),
    });
  }

  const edgeIds = new Set<string>();
  const edges: Edge[] = [];

  for (const edge of parsedData.edges) {
    if (
      !edge ||
      typeof edge.id !== 'string' ||
      typeof edge.source !== 'string' ||
      typeof edge.target !== 'string' ||
      (edge.weight !== undefined && !Number.isFinite(edge.weight)) ||
      (edge.directed !== undefined && typeof edge.directed !== 'boolean') ||
      (edge.curved !== undefined && typeof edge.curved !== 'boolean') ||
      (edge.curveOffset !== undefined && !Number.isFinite(edge.curveOffset))
    ) {
      return {
        error: 'messages.invalidEdges',
      };
    }

    if (edgeIds.has(edge.id)) {
      return {
        error: 'messages.duplicateEdgeIds',
      };
    }

    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return {
        error: 'messages.edgesNeedExistingNodes',
      };
    }

    edgeIds.add(edge.id);
    edges.push(
      normalizeEdge({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        directed: edge.directed,
        curved: edge.curved,
        curveOffset: edge.curveOffset,
      } as Edge, parsedData.isDirected ?? fallbackDirected)
    );
  }

  return {
    data: {
      nodes,
      edges,
    },
  };
}

function createGraphEdge(
  source: string,
  target: string,
  weight = 1,
  overrides: Partial<Edge> = {}
): Edge {
  return normalizeEdge({
    id: generateEdgeId(),
    source,
    target,
    weight,
    directed: false,
    curved: false,
    curveOffset: 0,
    ...overrides,
  } as Edge);
}

function GraphAppPageContent() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [currentAlgorithmStep, setCurrentAlgorithmStep] = useState<AlgorithmStep | null>(null);
  const [algorithmStepsQueue, setAlgorithmStepsQueue] = useState<AlgorithmStep[]>([]);
  const [algorithmReportLog, setAlgorithmReportLog] = useState<AlgorithmStep[]>([]);
  const algorithmReportLogRef = useRef(algorithmReportLog);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionLogEntry[]>([]);
  const [lastExecutedAlgorithm, setLastExecutedAlgorithm] = useState<AlgorithmType | null>(null);
  const [fullscreenSection, setFullscreenSection] = useState<string | null>(null);


  const { toast } = useToast();
  const { t } = useLanguage();

  const toggleFullscreen = useCallback((sectionId: string) => {
    setFullscreenSection(prev => (prev === sectionId ? null : sectionId));
  }, []);

  const clearStepInterval = useCallback(() => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
  }, []);

  const resetExecutionState = useCallback(() => {
    clearStepInterval();
    setCurrentAlgorithmStep(null);
    setAlgorithmStepsQueue([]);
    setAlgorithmReportLog([]);
    setStartNode(null);
    setEndNode(null);
    setLastExecutedAlgorithm(null);
  }, [clearStepInterval]);

  useEffect(() => {
    algorithmReportLogRef.current = algorithmReportLog;
  }, [algorithmReportLog]);

  useEffect(() => {
    const savedGraph = localStorage.getItem('grafiShqipGraph');
    if (savedGraph) {
      try {
        const parsedGraph = JSON.parse(savedGraph);
        const validatedGraph = validateGraphPayload(
          parsedGraph?.nodes && parsedGraph?.edges
            ? parsedGraph
            : {
                nodes: parsedGraph?.savedNodes,
                edges: parsedGraph?.savedEdges,
                isDirected: parsedGraph?.savedIsDirected,
              }
        );

        if (validatedGraph.data) {
          setNodes(validatedGraph.data.nodes);
          setEdges(validatedGraph.data.edges);
          toast({ title: t('messages.graphLoaded'), description: t('messages.graphLoadedDescription'), variant: 'default' });
        } else {
          toast({ title: t('messages.loadError'), description: t(validatedGraph.error), variant: 'destructive' });
        }
      } catch (error) {
        console.error("Failed to load graph from localStorage", error);
        toast({ title: t('messages.loadError'), description: t('messages.graphLoadFailed'), variant: 'destructive' });
      }
    }
  }, [toast]);


  const [startNode, setStartNode] = useState<string | null>(null);
  const [endNode, setEndNode] = useState<string | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1000);
  const hasDirectedEdges = useMemo(() => graphHasDirectedEdges(edges), [edges]);

  const adjacencyMatrix = useMemo(() => {
    return buildAdjacencyMatrix(nodes, edges);
  }, [nodes, edges]);

  const svgRef = useRef<SVGSVGElement>(null);

  const handleAddNode = useCallback((clickX?: number, clickY?: number) => {
    const canvasWidth = svgRef.current?.viewBox.baseVal.width ?? 800;
    const canvasHeight = svgRef.current?.viewBox.baseVal.height ?? 600;

    let xPos: number;
    let yPos: number;

    if (clickX !== undefined && clickY !== undefined) {
      xPos = clickX;
      yPos = clickY;
    } else {
      if (nodes.length > 0) {
        const lastNode = nodes[nodes.length - 1];
        xPos = lastNode.x + NODE_RADIUS * 3 + (Math.random() * 40 - 20);
        yPos = lastNode.y + (Math.random() * 40 - 20);
      } else {
        xPos = canvasWidth / 2 + (Math.random() * 100 - 50);
        yPos = canvasHeight / 2 + (Math.random() * 100 - 50);
      }
    }

    xPos = Math.max(NODE_RADIUS + CANVAS_PADDING, Math.min(xPos, canvasWidth - NODE_RADIUS - CANVAS_PADDING));
    yPos = Math.max(NODE_RADIUS + CANVAS_PADDING, Math.min(yPos, canvasHeight - NODE_RADIUS - CANVAS_PADDING));

    const newNode: Node = {
      id: generateNodeId(),
      x: xPos,
      y: yPos,
      label: getNextNodeLabel(nodes),
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
    toast({ title: t('messages.nodeAdded'), description: t('messages.nodeCreated', { label: newNode.label }), variant: 'default' });
  }, [nodes, svgRef, toast]);


  const handleDeleteNode = (nodeIdToDelete: string) => {
    const nodeToDelete = nodes.find(n => n.id === nodeIdToDelete);
    setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeIdToDelete));
    setEdges(prevEdges => prevEdges.filter(edge => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete));
    if (startNode === nodeIdToDelete) setStartNode(null);
    if (endNode === nodeIdToDelete) setEndNode(null);
    toast({ title: t('messages.nodeDeleted'), description: t('messages.nodeDeletedDescription', { label: nodeToDelete?.label ?? nodeIdToDelete }), variant: 'default' });
  };

  const processAlgorithmStep = useCallback(() => {
    setAlgorithmStepsQueue(prevQueue => {
      if (prevQueue.length === 0) {
        clearStepInterval();

        const alreadyLoggedCompletion = algorithmReportLogRef.current.some(
          log => log.type === 'message' && log.messageKey === 'messages.algorithmComplete'
        );

        if (!alreadyLoggedCompletion) {
          const newCompletionStep = { id: `step-completion-${Date.now()}-${Math.random()}`, type: 'message' as const, messageKey: 'messages.algorithmComplete' };
          setAlgorithmReportLog(prevLog => {
            const lastEntryIsCompletion = prevLog.length > 0 &&
                                        prevLog[prevLog.length - 1].type === 'message' &&
                                        prevLog[prevLog.length - 1].messageKey === 'messages.algorithmComplete';
            if (lastEntryIsCompletion) return prevLog;
            return [...prevLog, newCompletionStep];
          });
          setCurrentAlgorithmStep(newCompletionStep);
        } else {
           const lastStep = algorithmReportLogRef.current[algorithmReportLogRef.current.length -1];
           if(lastStep && lastStep.type === 'message' && lastStep.messageKey === 'messages.algorithmComplete') {
             setCurrentAlgorithmStep(lastStep);
           } else {
             setCurrentAlgorithmStep(null);
           }
        }
        return [];
      }

      const [nextStepFromQueue, ...restOfQueue] = prevQueue;
       if (!nextStepFromQueue) return restOfQueue;

      const nextStep = { ...nextStepFromQueue, id: nextStepFromQueue.id || `step-runtime-${Date.now()}-${Math.random()}` };

      setCurrentAlgorithmStep(nextStep);

      setAlgorithmReportLog(prevLog => {
        const isDuplicate = prevLog.length > 0 && prevLog[prevLog.length - 1].id === nextStep.id && prevLog[prevLog.length - 1].type === nextStep.type;
        if (isDuplicate) {
          return prevLog;
        }
        return [...prevLog, nextStep];
      });
      return restOfQueue;
    });
  }, [clearStepInterval]);

  const runAlgorithm = (algorithm: AlgorithmType, selectedStartNode?: string, selectedEndNode?: string) => {
    const opStartTime = performance.now();
    const entryStartTime = new Date();
    setLastExecutedAlgorithm(algorithm);


    clearStepInterval();
    const initialResetStepId = `step-reset-${Date.now()}-${Math.random()}`;
    const initialMessageStepId = `step-initial-msg-${Date.now()}-${Math.random()}`;

    setCurrentAlgorithmStep({ type: 'reset', id: initialResetStepId, messageKey: 'messages.preparingAlgorithm' });
    setAlgorithmReportLog([{ type: 'message', id: initialMessageStepId, messageKey: 'messages.algorithmStart', messageValues: { algorithm: algorithm.toUpperCase() } }]);

    let steps: AlgorithmStep[] = [];
    const sNode = selectedStartNode || startNode;
    const eNode = selectedEndNode || endNode;
    const nodeMap = new Map(nodes.map(n => [n.id, n.label]));


    const algorithmNeedsStartNode = ['dijkstra', 'bfs', 'dfs', 'a-star', 'bellman-ford', 'prim'].includes(algorithm);
    const algorithmNeedsEndNode = ['dijkstra', 'a-star'].includes(algorithm);

    if (algorithmNeedsStartNode && !sNode) {
        const errorMsgId = `step-error-nostart-${Date.now()}-${Math.random()}`;
        toast({ title: t('common.error'), description: t('messages.startNodeMissing'), variant: "destructive" });
        setAlgorithmReportLog(prev => [...prev, {id: errorMsgId, type: 'message', messageKey: 'messages.startNodeMissingReport'}]);
        setCurrentAlgorithmStep({id: errorMsgId, type: 'message', messageKey: 'messages.startNodeMissingReport'});
        return;
    }
     if (algorithmNeedsEndNode && !eNode) {
        const errorMsgId = `step-error-noend-${algorithm}-${Date.now()}-${Math.random()}`;
        toast({ title: t('common.error'), description: t('messages.endNodeMissing', { algorithm: algorithm.toUpperCase() }), variant: "destructive" });
        setAlgorithmReportLog(prev => [...prev, {id: errorMsgId, type: 'message', messageKey: 'messages.endNodeMissingReport', messageValues: { algorithm: algorithm.toUpperCase() }}]);
        setCurrentAlgorithmStep({id: errorMsgId, type: 'message', messageKey: 'messages.endNodeMissingReport', messageValues: { algorithm: algorithm.toUpperCase() }});
        return;
    }

    if (MST_ALGORITHMS.has(algorithm) && hasDirectedEdges) {
        const errorMsgId = `step-error-mst-directed-${algorithm}-${Date.now()}-${Math.random()}`;
        toast({ title: t('common.error'), description: t('messages.mstDirectedError'), variant: "destructive" });
        setAlgorithmReportLog(prev => [...prev, {id: errorMsgId, type: 'message', messageKey: 'messages.mstDirectedReport'}]);
        setCurrentAlgorithmStep({id: errorMsgId, type: 'message', messageKey: 'messages.mstDirectedReport'});
        return;
    }

    if (NEGATIVE_WEIGHT_UNSUPPORTED_ALGORITHMS.has(algorithm) && hasNegativeEdgeWeights(edges)) {
        const errorMsgId = `step-error-negative-weights-${algorithm}-${Date.now()}-${Math.random()}`;
        toast({ title: t('common.error'), description: t('messages.negativeWeightsError', { algorithm: algorithm.toUpperCase() }), variant: "destructive" });
        setAlgorithmReportLog(prev => [...prev, {id: errorMsgId, type: 'message', messageKey: 'messages.negativeWeightsReport', messageValues: { algorithm: algorithm.toUpperCase() }}]);
        setCurrentAlgorithmStep({id: errorMsgId, type: 'message', messageKey: 'messages.negativeWeightsReport', messageValues: { algorithm: algorithm.toUpperCase() }});
        return;
    }

    switch (algorithm) {
      case 'dijkstra':
        steps = dijkstra(nodes, edges, sNode!, eNode!);
        break;
      case 'bfs':
        steps = bfs(nodes, edges, sNode!);
        break;
      case 'dfs':
        steps = dfs(nodes, edges, sNode!);
        break;
      case 'a-star':
        steps = aStar(nodes, edges, sNode!, eNode!);
        break;
      case 'bellman-ford':
        steps = bellmanFord(nodes, edges, sNode!);
        break;
      case 'floyd-warshall':
        steps = floydWarshall(nodes, edges);
        break;
      case 'kruskal':
        steps = kruskal(nodes, edges);
        break;
      case 'prim':
        steps = prim(nodes, edges, sNode!);
        break;
      default:
        const exhaustiveCheck: never = algorithm;
        console.error(`Unknown algorithm: ${exhaustiveCheck}`);
        return;
    }

    const opEndTime = performance.now();
    const executionTimeMs = opEndTime - opStartTime;

    const validSteps = steps.filter(step => step && step.id);
    setAlgorithmStepsQueue(validSteps);

    let resultSummary = t('messages.algorithmComplete');
    if (validSteps.length > 0) {
        const lastStep = validSteps[validSteps.length - 1];
        if (lastStep.type === 'message') {
            resultSummary = lastStep.messageKey ? t(lastStep.messageKey, lastStep.messageValues) : lastStep.message || resultSummary;
        } else if (lastStep.type === 'highlight-path' && lastStep.path) {
             resultSummary = t('messages.pathSummary', { path: lastStep.path.map(id => nodeMap.get(id) || id).join(' -> ') });
        }
    } else {
        resultSummary = t('messages.algorithmNoSteps');
    }

    setExecutionHistory(prevHistory => [
      ...prevHistory,
      {
        id: `exec-${Date.now()}`,
        algorithm,
        startTime: entryStartTime,
        endTime: new Date(),
        executionTimeMs: executionTimeMs,
        nodesCountSnapshot: nodes.length,
        edgesCountSnapshot: edges.length,
        startNodeLabel: sNode ? nodeMap.get(sNode) : undefined,
        endNodeLabel: eNode ? nodeMap.get(eNode) : undefined,
        resultSummary,
      }
    ]);


    if (validSteps.length > 0) {
        processAlgorithmStep();
        stepIntervalRef.current = setInterval(processAlgorithmStep, animationSpeed);
    } else {
        const noStepsMsgId = `step-nosteps-${Date.now()}-${Math.random()}`;
        setCurrentAlgorithmStep({ type: 'message', id: noStepsMsgId, messageKey: 'messages.algorithmNoStepsDetailed' });
        setAlgorithmReportLog(prev => [...prev, { type: 'message', id: noStepsMsgId, messageKey: 'messages.algorithmNoStepsDetailed'}]);
    }
  };

  useEffect(() => {
    return () => {
      clearStepInterval();
    };
  }, [clearStepInterval]);


  const handleClearGraph = useCallback(() => {
    resetExecutionState();
    setNodes([]);
    setEdges([]);
    setCurrentAlgorithmStep(null);
    setAlgorithmStepsQueue([]);
    setAlgorithmReportLog([]);
    setStartNode(null);
    setEndNode(null);
    setLastExecutedAlgorithm(null);
    toast({ title: t('messages.graphCleared'), description: t('messages.graphClearedDescription'), variant: 'default' });
  }, [resetExecutionState, toast]);

  const handleDrawSuggestedGraph = useCallback((suggestionType: string, customData?: { nodeCount?: number; graphType?: string }) => {
    const canvasWidth = svgRef.current?.viewBox.baseVal.width ?? 800;
    const canvasHeight = svgRef.current?.viewBox.baseVal.height ?? 600;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    let radius = Math.min(canvasWidth, canvasHeight) / 3.5;

    let newNodes: Node[] = [];
    let newEdges: Edge[] = [];
    const n = customData?.nodeCount || 5; 

    let finalGraphType = suggestionType;
    let toastMessageTitle = t('messages.graphDrawn');
    let toastMessageDescription = '';

    if (suggestionType === 'custom-graph' && customData?.graphType) {
        finalGraphType = customData.graphType;
    }

    if (finalGraphType !== 'custom-graph' && (n <= 0 || n > 50) && suggestionType.startsWith('custom-')) { 
        toast({ title: t('common.error'), description: t('messages.invalidNodeCount'), variant: 'destructive'});
        return;
    }


    switch (finalGraphType) {
      case 'complete-k4': 
      case 'complete': {
        const count = finalGraphType === 'complete-k4' ? 4 : n;
        if (count > 15) radius *= 1.5; 
        else if (count > 10) radius *= 1.2;


        for (let i = 0; i < count; i++) {
          newNodes.push({
            id: generateNodeId(),
            x: centerX + radius * Math.cos(2 * Math.PI * i / count - Math.PI / 2),
            y: centerY + radius * Math.sin(2 * Math.PI * i / count - Math.PI / 2),
            label: getNextNodeLabel(newNodes),
          });
        }
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            newEdges.push(createGraphEdge(newNodes[i].id, newNodes[j].id));
          }
        }
        toastMessageDescription = t('messages.completeGraphCreated', { count });
        break;
      }
      case 'star-s5': 
      case 'star': {
        const numPeripheral = finalGraphType === 'star-s5' ? 4 : n - 1;
        if (numPeripheral < 0) { 
             if (n === 1) { 
                newNodes.push({ id: generateNodeId(), x: centerX, y: centerY, label: getNextNodeLabel([]) });
             }
             toastMessageDescription = t('messages.graphWithNodesCreated', { count: n });
             break;
        }

        const centerNode: Node = {
          id: generateNodeId(),
          x: centerX,
          y: centerY,
          label: getNextNodeLabel([]),
        };
        newNodes.push(centerNode);

        for (let i = 0; i < numPeripheral; i++) {
          const peripheralNode: Node = {
            id: generateNodeId(),
            x: centerX + radius * Math.cos(2 * Math.PI * i / numPeripheral),
            y: centerY + radius * Math.sin(2 * Math.PI * i / numPeripheral),
            label: getNextNodeLabel(newNodes),
          };
          newNodes.push(peripheralNode);
          newEdges.push(createGraphEdge(centerNode.id, peripheralNode.id));
        }
        toastMessageDescription = t('messages.starGraphCreated', { count: n });
        break;
      }
      case 'cycle-c5': 
      case 'cycle': {
        const count = finalGraphType === 'cycle-c5' ? 5 : n;
        if (count < 1) {
             toastMessageDescription = t('messages.cycleTooSmall');
             break;
        }
        if (count === 1) { 
            newNodes.push({ id: generateNodeId(), x: centerX, y: centerY, label: getNextNodeLabel([]) });
            toastMessageDescription = t('messages.oneNodeNoCycle');
            break;
        }
         if (count === 2) { 
            newNodes.push({ id: generateNodeId(), x: centerX - radius/3, y: centerY, label: getNextNodeLabel(newNodes) });
            newNodes.push({ id: generateNodeId(), x: centerX + radius/3, y: centerY, label: getNextNodeLabel(newNodes) });
            newEdges.push(createGraphEdge(newNodes[0].id, newNodes[1].id));
            toastMessageDescription = t('messages.cycleGraphCreated', { count });
            break;
        }


        for (let i = 0; i < count; i++) {
          newNodes.push({
            id: generateNodeId(),
            x: centerX + radius * Math.cos(2 * Math.PI * i / count - Math.PI / 2),
            y: centerY + radius * Math.sin(2 * Math.PI * i / count - Math.PI / 2),
            label: getNextNodeLabel(newNodes),
          });
        }
        for (let i = 0; i < count; i++) {
          newEdges.push(createGraphEdge(newNodes[i].id, newNodes[(i + 1) % count].id));
        }
        toastMessageDescription = t('messages.cycleGraphCreated', { count });
        break;
      }
      case 'simple-tree': 
      case 'tree': { 
        const count = finalGraphType === 'simple-tree' ? 7 : n;
        if (finalGraphType === 'simple-tree') {
            const nodePositions = [
              { x: centerX, y: centerY - radius * 0.6 }, 
              { x: centerX - radius * 0.5, y: centerY }, 
              { x: centerX + radius * 0.5, y: centerY }, 
              { x: centerX - radius * 0.75, y: centerY + radius * 0.6 }, 
              { x: centerX - radius * 0.25, y: centerY + radius * 0.6 }, 
              { x: centerX + radius * 0.25, y: centerY + radius * 0.6 }, 
              { x: centerX + radius * 0.75, y: centerY + radius * 0.6 }, 
            ];
            for(let i=0; i < count; i++) {
              newNodes.push({
                id: generateNodeId(),
                x: nodePositions[i].x,
                y: nodePositions[i].y,
                label: getNextNodeLabel(newNodes)
              });
            }
            const treeEdgesDefinition = [
              { sourceIdx: 0, targetIdx: 1 }, { sourceIdx: 0, targetIdx: 2 },
              { sourceIdx: 1, targetIdx: 3 }, { sourceIdx: 1, targetIdx: 4 },
              { sourceIdx: 2, targetIdx: 5 }, { sourceIdx: 2, targetIdx: 6 },
            ];
            treeEdgesDefinition.forEach(def => {
              newEdges.push(createGraphEdge(newNodes[def.sourceIdx].id, newNodes[def.targetIdx].id));
            });
            toastMessageDescription = t('messages.simpleTreeCreated');
        } else { // finalGraphType === 'tree' (custom N)
             if (count <= 0) {
                 toastMessageDescription = t('messages.positiveNodeCount');
                 break;
             }
             if (count === 1) {
                newNodes.push({ id: generateNodeId(), x: centerX, y: centerY, label: getNextNodeLabel([]) });
                toastMessageDescription = t('messages.treeGraphCreated', { count: 1 });
                break;
             }

            // Generate all nodes first
            for (let i = 0; i < count; i++) {
                newNodes.push({
                    id: generateNodeId(),
                    x: 0, // Temporary, will be set by layout
                    y: 0, // Temporary
                    label: getNextNodeLabel(newNodes)
                });
            }

            // Create edges for a binary-like tree structure
            // Node i is connected to parent Math.floor((i-1)/2)
            for (let i = 1; i < count; i++) {
                const parentIndex = Math.floor((i - 1) / 2);
                if (parentIndex >= 0 && parentIndex < i) {
                    newEdges.push(createGraphEdge(newNodes[parentIndex].id, newNodes[i].id));
                }
            }
            
            // Position nodes in a tree-like layout using BFS to determine levels
            const nodeLevels: string[][] = [];
            const positionedNodes = new Set<string>();

            if (newNodes.length > 0) {
                const q: { nodeId: string; depth: number }[] = [{ nodeId: newNodes[0].id, depth: 0 }];
                const visitedLayout = new Set<string>();
                visitedLayout.add(newNodes[0].id);
                
                let head = 0;
                while(head < q.length) {
                    const { nodeId: u, depth: d } = q[head++];
                    if (!nodeLevels[d]) nodeLevels[d] = [];
                    nodeLevels[d].push(u);

                    const children = newEdges
                        .filter(edge => edge.source === u && !visitedLayout.has(edge.target))
                        .map(edge => edge.target);
                    
                    for (const v of children) {
                        if (!visitedLayout.has(v)) {
                            visitedLayout.add(v);
                            q.push({ nodeId: v, depth: d + 1 });
                        }
                    }
                }
            }
            
            const ySpacing = Math.max(80, (canvasHeight - 2 * CANVAS_PADDING - 2 * NODE_RADIUS) / Math.max(1, nodeLevels.length));
            const baseYSvg = CANVAS_PADDING + NODE_RADIUS + (nodeLevels.length === 1 ? (canvasHeight/2 - (CANVAS_PADDING + NODE_RADIUS)) : 30) ;

            nodeLevels.forEach((level, depth) => {
                const levelWidth = canvasWidth - 2 * CANVAS_PADDING - 2 * NODE_RADIUS;
                const xSpacing = levelWidth / (level.length + 1);
                level.forEach((nodeId, indexInLevel) => {
                    const nodeToUpdate = newNodes.find(n => n.id === nodeId);
                    if (nodeToUpdate) {
                        nodeToUpdate.x = CANVAS_PADDING + NODE_RADIUS + xSpacing * (indexInLevel + 1);
                        nodeToUpdate.y = baseYSvg + depth * ySpacing;
                        
                        nodeToUpdate.x = Math.max(NODE_RADIUS + CANVAS_PADDING, Math.min(nodeToUpdate.x, canvasWidth - NODE_RADIUS - CANVAS_PADDING));
                        nodeToUpdate.y = Math.max(NODE_RADIUS + CANVAS_PADDING, Math.min(nodeToUpdate.y, canvasHeight - NODE_RADIUS - CANVAS_PADDING));
                        positionedNodes.add(nodeId);
                    }
                });
            });
            
            // Position any unpositioned nodes (e.g. if graph was disconnected, though tree logic shouldn't cause this)
            newNodes.forEach(node => {
                if (!positionedNodes.has(node.id)) {
                    node.x = centerX + (Math.random() * radius - radius / 2);
                    node.y = centerY + (Math.random() * radius - radius / 2);
                }
            });
            toastMessageDescription = t('messages.treeGraphCreated', { count });
        }
        break;
      }
      case 'path': {
        if (n <= 0) {toastMessageDescription = t('messages.positiveNodeCount'); break;}
        const spacing = (canvasWidth - 2 * CANVAS_PADDING - 2 * NODE_RADIUS) / Math.max(1, n -1);
        for (let i = 0; i < n; i++) {
          newNodes.push({
            id: generateNodeId(),
            x: CANVAS_PADDING + NODE_RADIUS + i * spacing,
            y: centerY,
            label: getNextNodeLabel(newNodes),
          });
        }
        if (n > 1) { 
            for (let i = 0; i < n - 1; i++) {
              newEdges.push(createGraphEdge(newNodes[i].id, newNodes[i + 1].id));
            }
        }
        toastMessageDescription = t('messages.pathGraphCreated', { count: n });
        break;
      }
      default:
        toastMessageTitle = t('messages.unknownType');
        toastMessageDescription = t('messages.unknownSuggestion', { suggestion: suggestionType, type: customData?.graphType ?? '' });
        return;
    }
    resetExecutionState();
    setNodes(newNodes);
    setEdges(newEdges);
    if(toastMessageDescription) {
        toast({ title: toastMessageTitle, description: toastMessageDescription, variant: 'default' });
    }
  }, [resetExecutionState, svgRef, toast]); 

  const handleSaveGraph = () => {
    try {
      const graphToSave = JSON.stringify(serializeGraphPayload(nodes, edges));
      localStorage.setItem('grafiShqipGraph', graphToSave);
      toast({ title: t('messages.graphSaved'), description: t('messages.graphSavedDescription'), variant: 'default' });
    } catch (error) {
      console.error("Failed to save graph to localStorage", error);
      toast({ title: t('messages.saveError'), description: t('messages.graphSaveFailed'), variant: 'destructive' });
    }
  };

  const handleExportJSON = () => {
    const graphJSON = JSON.stringify(serializeGraphPayload(nodes, edges), null, 2);
    const blob = new Blob([graphJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grafi.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: t('messages.graphExportedJson'), description: t('messages.graphExportedJsonDescription'), variant: 'default' });
  };

  const getThemeCssVariables = () => {
    if (typeof window === 'undefined') return '';
    const rootStyle = getComputedStyle(document.documentElement);
    const variables = [
      '--background', '--foreground', '--card', '--card-foreground',
      '--popover', '--popover-foreground', '--primary', '--primary-foreground',
      '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
      '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
      '--border', '--input', '--ring', '--font-geist-sans'
    ];
    let cssText = ':root {\n';
    variables.forEach(variable => {
      const value = rootStyle.getPropertyValue(variable).trim();
      if (value) {
        cssText += `  ${variable}: ${value};\n`;
      }
    });
    if (!rootStyle.getPropertyValue('--font-geist-sans').trim()) {
        const bodyFont = getComputedStyle(document.body).fontFamily;
        if (bodyFont) {
            cssText += `  --font-geist-sans: ${bodyFont};\n`;
        }
    }
    cssText += '}';
    return cssText;
  };

  const handleExportPNG = () => {
    const svgElement = svgRef.current;
    if (svgElement) {
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      
      const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
      styleElement.textContent = getThemeCssVariables();
      svgClone.prepend(styleElement);

      const elementsToStyle = svgClone.querySelectorAll('circle, path, text, rect'); 
      elementsToStyle.forEach(el => {
        const originalEl = svgElement.querySelector(`[id="${el.id}"]`) || svgElement.querySelector(el.tagName + (el.getAttribute('d') ? `[d="${el.getAttribute('d')}"]` : '')); 
        if (originalEl) {
          const computedStyle = getComputedStyle(originalEl);
          if (!el.getAttribute('fill') && computedStyle.fill && computedStyle.fill !== 'rgb(0, 0, 0)') { 
            el.setAttribute('fill', computedStyle.fill);
          }
          if (!el.getAttribute('stroke') && computedStyle.stroke && computedStyle.stroke !== 'none') {
            el.setAttribute('stroke', computedStyle.stroke);
          }
          if (!el.getAttribute('stroke-width') && computedStyle.strokeWidth) {
            el.setAttribute('stroke-width', computedStyle.strokeWidth);
          }
           if (el.tagName === 'text') {
                if (!el.getAttribute('font-family') && computedStyle.fontFamily) {
                    el.setAttribute('font-family', computedStyle.fontFamily);
                }
                if (!el.getAttribute('font-size') && computedStyle.fontSize) {
                    el.setAttribute('font-size', computedStyle.fontSize);
                }
                if (!el.getAttribute('font-weight') && computedStyle.fontWeight) {
                    el.setAttribute('font-weight', computedStyle.fontWeight);
                }
                if (!el.getAttribute('fill') && computedStyle.color && computedStyle.color !== 'rgb(0, 0, 0)') { 
                     el.setAttribute('fill', computedStyle.color);
                }
           }
        }
      });


      const svgData = new XMLSerializer().serializeToString(svgClone);
      const canvas = document.createElement('canvas');

      const { width: svgNativeWidth, height: svgNativeHeight } = svgElement.viewBox.baseVal;
      const scaleFactor = 2; 
      canvas.width = svgNativeWidth * scaleFactor;
      canvas.height = svgNativeHeight * scaleFactor;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || 'hsl(0 0% 100%)';
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = 'grafi.png';
          downloadLink.href = pngFile;
          document.body.appendChild(downloadLink); 
          downloadLink.click();
          document.body.removeChild(downloadLink);
          toast({ title: t('messages.graphExportedPng'), description: t('messages.graphExportedPngDescription'), variant: 'default' });
        };
        img.onerror = () => {
          toast({ title: t('messages.pngExportError'), description: t('messages.svgLoadFailed'), variant: 'destructive'});
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      } else {
         toast({ title: t('messages.pngExportError'), description: t('messages.canvasContextFailed'), variant: 'destructive'});
      }
    } else {
       toast({ title: t('messages.pngExportError'), description: t('messages.svgMissing'), variant: 'destructive'});
    }
  };

  const handleGenerateFromMatrix = useCallback((matrixString: string) => {
    try {
        const rows = matrixString.trim().split('\n').map(row => row.trim()).filter(Boolean);
        const numericMatrix = rows.map(row => 
            row.trim().split(/[\s,]+/).map(val => {
                const num = parseFloat(val);
                return isNaN(num) ? (val.toLowerCase() === 'inf' || val.toLowerCase() === 'infinity' ? Infinity : NaN) : num;
            })
        );

        const n = numericMatrix.length;
        if (n === 0 || numericMatrix.some(row => row.length !== n || row.some(isNaN))) {
            toast({ title: t('messages.invalidMatrix'), description: t('messages.invalidMatrixDescription'), variant: "destructive" });
            return;
        }

        let isSymmetric = true;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (numericMatrix[i][j] !== numericMatrix[j][i]) {
                    isSymmetric = false;
                    break;
                }
            }
            if (!isSymmetric) break;
        }

        const canvasWidth = svgRef.current?.viewBox.baseVal.width ?? 800;
        const canvasHeight = svgRef.current?.viewBox.baseVal.height ?? 600;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = Math.min(canvasWidth, canvasHeight) / 3;

        const newNodes: Node[] = [];
        for (let i = 0; i < n; i++) {
            newNodes.push({
                id: generateNodeId(),
                label: getNextNodeLabel(newNodes),
                x: centerX + radius * Math.cos(2 * Math.PI * i / n - Math.PI / 2),
                y: centerY + radius * Math.sin(2 * Math.PI * i / n - Math.PI / 2),
            });
        }

        const newEdges: Edge[] = [];
        if (isSymmetric) {
            for (let i = 0; i < n; i++) {
                for (let j = i; j < n; j++) {
                    if (numericMatrix[i][j] !== 0 && numericMatrix[i][j] !== Infinity) {
                        newEdges.push(
                            createGraphEdge(newNodes[i].id, newNodes[j].id, numericMatrix[i][j], {
                                directed: false,
                            })
                        );
                    }
                }
            }
        } else {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (numericMatrix[i][j] !== 0 && numericMatrix[i][j] !== Infinity) {
                        newEdges.push(
                            createGraphEdge(newNodes[i].id, newNodes[j].id, numericMatrix[i][j], {
                                directed: true,
                            })
                        );
                    }
                }
            }
        }
        resetExecutionState();
        setNodes(newNodes);
        setEdges(newEdges);
        toast({ title: t('messages.graphGenerated'), description: t('messages.generatedFromMatrix'), variant: "default" });
    } catch (error) {
        console.error("Error generating graph from matrix:", error);
        toast({ title: t('messages.generateError'), description: t('messages.matrixProcessingError'), variant: "destructive" });
    }
  }, [resetExecutionState, svgRef, toast]);

  const handleGenerateFromJSON = useCallback((jsonString: string) => {
    try {
        const parsedData = JSON.parse(jsonString);
        const validatedGraph = validateGraphPayload(parsedData);
        if (validatedGraph.data) {
            resetExecutionState();
            setNodes(validatedGraph.data.nodes);
            setEdges(validatedGraph.data.edges);
            toast({ title: t('messages.graphGenerated'), description: t('messages.generatedFromJson'), variant: "default" });
        } else {
            toast({ title: t('messages.invalidJson'), description: t(validatedGraph.error), variant: "destructive" });
        }
        return;
    } catch (error) {
        console.error("Error generating graph from JSON:", error);
        toast({ title: t('messages.jsonProcessingError'), description: t('messages.jsonProcessingErrorDescription'), variant: "destructive" });
    }
  }, [resetExecutionState, toast]);


  return (
     <div className="flex flex-col h-screen text-foreground bg-background overflow-hidden">
      <AppHeader />
      <div className="grid grid-cols-1 md:grid-cols-[minmax(320px,380px)_1fr] gap-4 p-4 flex-1 overflow-hidden">
        <FullscreenSection
          isActive={fullscreenSection === 'controls'}
          onToggle={() => toggleFullscreen('controls')}
          className="w-full md:w-auto flex flex-col gap-4 overflow-y-auto print:hidden h-full p-1 custom-scrollbar"
        >
          <aside className="h-full">
              <ControlsPanel
                nodes={nodes}
                edges={edges}
                hasDirectedEdges={hasDirectedEdges}
                onAddNode={handleAddNode}
                onRunAlgorithm={runAlgorithm}
                onClearGraph={handleClearGraph}
                startNode={startNode}
                setStartNode={setStartNode}
                endNode={endNode}
                setEndNode={setEndNode}
                animationSpeed={animationSpeed}
                onAnimationSpeedChange={setAnimationSpeed}
                onDrawSuggestedGraph={handleDrawSuggestedGraph}
                onGenerateFromMatrix={handleGenerateFromMatrix}
                onGenerateFromJSON={handleGenerateFromJSON}
              />
          </aside>
        </FullscreenSection>

        <main className="flex-1 flex flex-col gap-4 overflow-y-auto h-full custom-scrollbar"> 
          <FullscreenSection
            isActive={fullscreenSection === 'canvas'}
            onToggle={() => toggleFullscreen('canvas')}
            className="flex-grow-[2] flex-shrink basis-0 min-h-[350px] sm:min-h-[400px] md:min-h-[450px]"
            buttonClassName="right-4 top-4"
          >
            <Card className="h-full flex flex-col shadow-lg overflow-hidden rounded-xl border">
                <GraphCanvas
                  svgRef={svgRef}
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={setNodes}
                  onEdgesChange={setEdges}
                  currentAlgorithmStep={currentAlgorithmStep}
                  startNode={startNode}
                  endNode={endNode}
                  onDeleteNode={handleDeleteNode}
                  onAddNode={handleAddNode}
                />
            </Card>
          </FullscreenSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[250px] flex-grow-[1] flex-shrink basis-0 print:hidden">
            <FullscreenSection
              isActive={fullscreenSection === 'matrix'}
              onToggle={() => toggleFullscreen('matrix')}
              className="min-h-[250px]"
            >
              <AdjacencyMatrixTable
                matrix={adjacencyMatrix}
                nodes={nodes}
                currentAlgorithmStep={currentAlgorithmStep}
              />
            </FullscreenSection>
            <FullscreenSection
              isActive={fullscreenSection === 'report'}
              onToggle={() => toggleFullscreen('report')}
              className="min-h-[250px]"
            >
              <AlgorithmReportPanel
                reportLog={algorithmReportLog}
                nodes={nodes}
                edges={edges}
              />
            </FullscreenSection>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-4 items-stretch pb-4 print:hidden md:grid-cols-2 xl:grid-cols-3">
            <FullscreenSection
              isActive={fullscreenSection === 'stats'}
              onToggle={() => toggleFullscreen('stats')}
              className="h-full"
            >
              <GraphStatsPanel nodes={nodes} edges={edges} />
            </FullscreenSection>
            <FullscreenSection
              isActive={fullscreenSection === 'history'}
              onToggle={() => toggleFullscreen('history')}
              className="h-full"
            >
              <ExecutionHistoryPanel history={executionHistory} />
            </FullscreenSection>
            <FullscreenSection
              isActive={fullscreenSection === 'export'}
              onToggle={() => toggleFullscreen('export')}
              className="h-full"
            >
              <ExportPanel
                onSaveGraph={handleSaveGraph}
                onExportJSON={handleExportJSON}
                onExportPNG={handleExportPNG}
              />
            </FullscreenSection>
            <FullscreenSection
              isActive={fullscreenSection === 'explanation'}
              onToggle={() => toggleFullscreen('explanation')}
            >
              <AlgorithmExplanationPanel algorithm={lastExecutedAlgorithm} />
            </FullscreenSection>
            <FullscreenSection
              isActive={fullscreenSection === 'compare'}
              onToggle={() => toggleFullscreen('compare')}
              className="md:col-span-2 xl:col-span-2"
            >
              <CompareAlgorithmsPanel history={executionHistory} nodes={nodes} edges={edges} />
            </FullscreenSection>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function GraphAppPage() {
  const [isClient, setIsClient] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex flex-col h-screen text-foreground overflow-hidden bg-background">
        <AppHeader />
        <div className="flex items-center justify-center flex-1 p-4">
          <div className="flex flex-col items-center text-muted-foreground">
            <BrainCircuit className="w-16 h-16 mb-4 animate-pulse" />
            <p className="text-xl">{t('common.loadingTitle')}</p>
            <p className="text-sm">{t('common.loadingSubtitle')}</p>
          </div>
        </div>
      </div>
    );
  }
  return <GraphAppPageContent />;
}
