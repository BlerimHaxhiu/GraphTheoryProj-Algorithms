// @ts-nocheck
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AlgorithmStep, Edge, Node } from '@/types/graph';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { DraftingCompass, Shapes, PencilRuler } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculateCurveOffset, generateEdgeId, normalizeEdge } from '@/lib/graph-utils';

interface GraphCanvasProps {
  svgRef: React.RefObject<SVGSVGElement>;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  currentAlgorithmStep: AlgorithmStep | null;
  startNode: string | null;
  endNode: string | null;
  onDeleteNode: (nodeId: string) => void;
  onAddNode: (x?: number, y?: number) => void;
}

interface EdgeDefaults {
  weight: number;
  curved: boolean;
  directed: boolean;
}

interface ClickState {
  id: string | null;
  count: number;
  timeoutId: number | null;
}

interface EdgeDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  edgeId: string | null;
  source: string | null;
  target: string | null;
}

const NODE_RADIUS = 20;
const ARROW_NODE_GAP = 4;
const MIN_VISIBLE_CURVE_OFFSET = 58;
const CURVED_EDGE_LABEL_LINE_GAP = 16;
const STRAIGHT_EDGE_LABEL_LINE_GAP = 12;
const EDGE_LABEL_HEIGHT = 20;
const EDGE_LABEL_CHAR_WIDTH = 8;
const EDGE_LABEL_MIN_WIDTH = 22;
const CANVAS_PADDING = 20;
const CLICK_DELAY_MS = 300;
const DRAG_SUPPRESSION_THRESHOLD = 4;
const LAST_EDGE_OPTIONS_KEY = 'grafiShqipLastEdgeOptions';

const defaultEdgeOptions: EdgeDefaults = {
  weight: 1,
  curved: false,
  directed: false,
};

const getClientCoords = (event: any): { clientX: number; clientY: number } | null => {
  if (event.touches && event.touches.length > 0) {
    return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
  }
  if (event.nativeEvent && event.nativeEvent.touches && event.nativeEvent.touches.length > 0) {
    return { clientX: event.nativeEvent.touches[0].clientX, clientY: event.nativeEvent.touches[0].clientY };
  }
  if (event.clientX !== undefined && event.clientY !== undefined) {
    return { clientX: event.clientX, clientY: event.clientY };
  }
  if (event.nativeEvent && event.nativeEvent.clientX !== undefined && event.nativeEvent.clientY !== undefined) {
    return { clientX: event.nativeEvent.clientX, clientY: event.nativeEvent.clientY };
  }
  return null;
};

function getQuadraticPoint(t: number, p0: number, p1: number, p2: number) {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

function getControlPoint(sourceNode: Node, targetNode: Node, curveOffset: number) {
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;

  return {
    controlX: midX + normalX * curveOffset,
    controlY: midY + normalY * curveOffset,
    midX,
    midY,
    normalX,
    normalY,
    dx,
    dy,
    length,
  };
}

function getVisualCurveOffset(sourceNode: Node, targetNode: Node, edge: Edge) {
  const normalizedEdge = normalizeEdge(edge);
  if (!normalizedEdge.curved || !normalizedEdge.curveOffset) {
    return 0;
  }

  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const isDiagonal = Math.abs(dx) > NODE_RADIUS && Math.abs(dy) > NODE_RADIUS;
  const minimumOffset = isDiagonal ? MIN_VISIBLE_CURVE_OFFSET + 12 : MIN_VISIBLE_CURVE_OFFSET;
  const magnitude = Math.max(Math.abs(normalizedEdge.curveOffset), minimumOffset);

  return Math.sign(normalizedEdge.curveOffset || 1) * magnitude;
}

function getLabelIndexOffset(edgeIndex: number) {
  if (edgeIndex <= 0) return 0;
  const direction = edgeIndex % 2 === 0 ? 1 : -1;
  return direction * Math.min(Math.ceil(edgeIndex / 2) * 7, 18);
}

function getEdgePairKeyForRender(edge: Edge) {
  return [edge.source, edge.target].sort().join('::');
}

function getEdgePairIndex(edges: Edge[], edge: Edge) {
  const pairKey = getEdgePairKeyForRender(edge);
  return edges
    .filter(candidate => getEdgePairKeyForRender(candidate) === pairKey)
    .findIndex(candidate => candidate.id === edge.id);
}

function getPathGeometry(sourceNode: Node, targetNode: Node, edge: Edge, edgeIndex = 0) {
  const normalizedEdge = normalizeEdge(edge);

  if (sourceNode.id === targetNode.id) {
    const loopRadius = Math.max(40, Math.abs(normalizedEdge.curveOffset || 0) || 70);
    const labelIndexOffset = getLabelIndexOffset(edgeIndex);
    const startX = sourceNode.x - NODE_RADIUS * 0.55;
    const startY = sourceNode.y - NODE_RADIUS * 0.78;
    const endX = sourceNode.x + NODE_RADIUS * 0.55;
    const endY = sourceNode.y - NODE_RADIUS * 0.78;
    const control1X = sourceNode.x - loopRadius * 0.95;
    const control1Y = sourceNode.y - loopRadius * 1.9;
    const control2X = sourceNode.x + loopRadius * 0.95;
    const control2Y = sourceNode.y - loopRadius * 1.9;

    return {
      path: `M ${startX} ${startY} C ${control1X} ${control1Y} ${control2X} ${control2Y} ${endX} ${endY}`,
      labelX: sourceNode.x + labelIndexOffset,
      labelY: sourceNode.y - loopRadius * 1.45 - Math.abs(labelIndexOffset) * 0.5,
      handleX: sourceNode.x,
      handleY: sourceNode.y - loopRadius * 1.9,
    };
  }

  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;

  if (normalizedEdge.curved && normalizedEdge.curveOffset) {
    const visualCurveOffset = getVisualCurveOffset(sourceNode, targetNode, normalizedEdge);
    const { controlX, controlY, normalX, normalY } = getControlPoint(sourceNode, targetNode, visualCurveOffset);
    const labelIndexOffset = getLabelIndexOffset(edgeIndex);
    const labelGap = CURVED_EDGE_LABEL_LINE_GAP + Math.abs(labelIndexOffset);
    const labelDirection = Math.sign(visualCurveOffset || 1);

    const sourceControlDx = controlX - sourceNode.x;
    const sourceControlDy = controlY - sourceNode.y;
    const sourceControlLength = Math.sqrt(sourceControlDx * sourceControlDx + sourceControlDy * sourceControlDy) || 1;
    const startX = sourceNode.x + (sourceControlDx / sourceControlLength) * NODE_RADIUS;
    const startY = sourceNode.y + (sourceControlDy / sourceControlLength) * NODE_RADIUS;

    const targetControlDx = controlX - targetNode.x;
    const targetControlDy = controlY - targetNode.y;
    const targetControlLength = Math.sqrt(targetControlDx * targetControlDx + targetControlDy * targetControlDy) || 1;
    const endRadius = NODE_RADIUS + (normalizedEdge.directed ? ARROW_NODE_GAP : 0);
    const endX = targetNode.x + (targetControlDx / targetControlLength) * endRadius;
    const endY = targetNode.y + (targetControlDy / targetControlLength) * endRadius;
    const labelBaseX = getQuadraticPoint(0.5, startX, controlX, endX);
    const labelBaseY = getQuadraticPoint(0.5, startY, controlY, endY);

    return {
      path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
      labelX: labelBaseX + normalX * labelGap * labelDirection,
      labelY: labelBaseY + normalY * labelGap * labelDirection,
      handleX: controlX,
      handleY: controlY,
    };
  }

  const labelIndexOffset = getLabelIndexOffset(edgeIndex);
  const normalX = -dy / length;
  const normalY = dx / length;
  const startX = sourceNode.x + (dx / length) * NODE_RADIUS;
  const startY = sourceNode.y + (dy / length) * NODE_RADIUS;
  const endRadius = NODE_RADIUS + (normalizedEdge.directed ? ARROW_NODE_GAP : 0);
  const endX = targetNode.x - (dx / length) * endRadius;
  const endY = targetNode.y - (dy / length) * endRadius;
  const straightLabelGap = STRAIGHT_EDGE_LABEL_LINE_GAP + Math.abs(labelIndexOffset);
  const straightLabelDirection = labelIndexOffset === 0 ? 1 : Math.sign(labelIndexOffset);

  return {
    path: `M ${startX} ${startY} L ${endX} ${endY}`,
    labelX: (startX + endX) / 2 + normalX * straightLabelGap * straightLabelDirection,
    labelY: (startY + endY) / 2 + normalY * straightLabelGap * straightLabelDirection,
    handleX: (sourceNode.x + targetNode.x) / 2,
    handleY: (sourceNode.y + targetNode.y) / 2,
  };
}

function findPathEdge(edges: Edge[], sourceId: string, targetId: string): Edge | undefined {
  return edges.find(candidate => {
    const edge = normalizeEdge(candidate);
    if (edge.directed) {
      return edge.source === sourceId && edge.target === targetId;
    }
    return (
      (edge.source === sourceId && edge.target === targetId) ||
      (edge.source === targetId && edge.target === sourceId)
    );
  });
}

export function GraphCanvas({
  svgRef,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  currentAlgorithmStep,
  startNode,
  endNode,
  onDeleteNode,
  onAddNode,
}: GraphCanvasProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [viewBox, setViewBox] = useState('0 0 800 600');
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeCreationSource, setEdgeCreationSource] = useState<string | null>(null);
  const [renameNodeId, setRenameNodeId] = useState<string | null>(null);
  const [renameLabel, setRenameLabel] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [edgeDialogState, setEdgeDialogState] = useState<EdgeDialogState>({
    open: false,
    mode: 'create',
    edgeId: null,
    source: null,
    target: null,
  });
  const [edgeWeight, setEdgeWeight] = useState<string>('1');
  const [edgeCurved, setEdgeCurved] = useState(false);
  const [edgeDirected, setEdgeDirected] = useState(false);
  const [lastEdgeOptions, setLastEdgeOptions] = useState<EdgeDefaults>(defaultEdgeOptions);
  const [draggingCurveEdgeId, setDraggingCurveEdgeId] = useState<string | null>(null);

  const panOriginRef = useRef({ x: 0, y: 0, width: 800, height: 600 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const edgeDragStartRef = useRef({ x: 0, y: 0 });
  const interactionMovedRef = useRef(false);
  const isDraggingEdgeRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const suppressNextCanvasClickRef = useRef(false);
  const nodeClickStateRef = useRef<ClickState>({ id: null, count: 0, timeoutId: null });
  const edgeClickStateRef = useRef<ClickState>({ id: null, count: 0, timeoutId: null });

  const getSVGCoordinates = useCallback((event: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const clientCoords = getClientCoords(event);
    if (!clientCoords) {
      return { x: 0, y: 0 };
    }

    const point = svgRef.current.createSVGPoint();
    point.x = clientCoords.clientX;
    point.y = clientCoords.clientY;

    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) {
      return { x: 0, y: 0 };
    }

    return point.matrixTransform(ctm.inverse());
  }, [svgRef]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LAST_EDGE_OPTIONS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const normalized = {
        weight: Number.isFinite(parsed?.weight) ? Number(parsed.weight) : defaultEdgeOptions.weight,
        curved: Boolean(parsed?.curved),
        directed: Boolean(parsed?.directed),
      };
      setLastEdgeOptions(normalized);
    } catch (error) {
      console.error('Failed to load last edge options', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_EDGE_OPTIONS_KEY, JSON.stringify(lastEdgeOptions));
  }, [lastEdgeOptions]);

  useEffect(() => {
    if (selectedNodeId && !nodes.some(node => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
    if (edgeCreationSource && !nodes.some(node => node.id === edgeCreationSource)) {
      setEdgeCreationSource(null);
    }
    if (renameNodeId && !nodes.some(node => node.id === renameNodeId)) {
      setRenameNodeId(null);
      setRenameDialogOpen(false);
    }
  }, [edgeCreationSource, nodes, renameNodeId, selectedNodeId]);

  useEffect(() => {
    if (selectedEdgeId && !edges.some(edge => edge.id === selectedEdgeId)) {
      setSelectedEdgeId(null);
    }
    if (draggingCurveEdgeId && !edges.some(edge => edge.id === draggingCurveEdgeId)) {
      setDraggingCurveEdgeId(null);
    }
    if (edgeDialogState.edgeId && !edges.some(edge => edge.id === edgeDialogState.edgeId)) {
      setEdgeDialogState({ open: false, mode: 'create', edgeId: null, source: null, target: null });
    }
  }, [draggingCurveEdgeId, edgeDialogState.edgeId, edges, selectedEdgeId]);

  useEffect(() => {
    return () => {
      if (nodeClickStateRef.current.timeoutId) {
        window.clearTimeout(nodeClickStateRef.current.timeoutId);
      }
      if (edgeClickStateRef.current.timeoutId) {
        window.clearTimeout(edgeClickStateRef.current.timeoutId);
      }
    };
  }, []);

  const resetClickState = (ref: React.MutableRefObject<ClickState>) => {
    if (ref.current.timeoutId) {
      window.clearTimeout(ref.current.timeoutId);
    }
    ref.current = { id: null, count: 0, timeoutId: null };
  };

  const openCreateEdgeDialog = useCallback((sourceId: string, targetId: string) => {
    setSelectedNodeId(sourceId);
    setSelectedEdgeId(null);
    setEdgeCreationSource(null);
    setEdgeDialogState({
      open: true,
      mode: 'create',
      edgeId: null,
      source: sourceId,
      target: targetId,
    });
    setEdgeWeight(String(lastEdgeOptions.weight));
    setEdgeCurved(lastEdgeOptions.curved);
    setEdgeDirected(lastEdgeOptions.directed);
  }, [lastEdgeOptions]);

  const openEditEdgeDialog = useCallback((edgeId: string) => {
    const edge = edges.find(candidate => candidate.id === edgeId);
    if (!edge) return;

    const normalized = normalizeEdge(edge);
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    setEdgeCreationSource(null);
    setEdgeDialogState({
      open: true,
      mode: 'edit',
      edgeId,
      source: edge.source,
      target: edge.target,
    });
    setEdgeWeight(String(normalized.weight));
    setEdgeCurved(Boolean(normalized.curved));
    setEdgeDirected(Boolean(normalized.directed));
  }, [edges]);

  const openRenameDialog = useCallback((nodeId: string) => {
    const node = nodes.find(candidate => candidate.id === nodeId);
    if (!node) return;
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setEdgeCreationSource(null);
    setRenameNodeId(nodeId);
    setRenameLabel(node.label);
    setRenameDialogOpen(true);
  }, [nodes]);

  const queueCountedClick = (
    ref: React.MutableRefObject<ClickState>,
    id: string,
    handler: (clickedId: string, count: number) => void
  ) => {
    const current = ref.current;
    const isSameTarget = current.id === id;

    if (current.id && current.id !== id && current.timeoutId) {
      window.clearTimeout(current.timeoutId);
      handler(current.id, current.count);
      ref.current = { id: null, count: 0, timeoutId: null };
    }

    ref.current.id = id;
    ref.current.count = isSameTarget ? ref.current.count + 1 : 1;

    if (current.timeoutId) {
      window.clearTimeout(current.timeoutId);
    }

    ref.current.timeoutId = window.setTimeout(() => {
      const clickedId = ref.current.id;
      const count = ref.current.count;
      ref.current = { id: null, count: 0, timeoutId: null };
      if (clickedId) {
        handler(clickedId, count);
      }
    }, CLICK_DELAY_MS);
  };

  const handleMouseDownSVG = (event: React.MouseEvent<SVGSVGElement>) => {
    if (event.target !== svgRef.current) return;
    interactionMovedRef.current = false;
    setIsPanning(true);
    const coords = getSVGCoordinates(event);
    setPanStart(coords);
    const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
    panOriginRef.current = { x: vx, y: vy, width: vw, height: vh };
  };

  const handleMouseUpSVG = () => {
    setIsPanning(false);
  };

  const handleMouseLeaveSVG = () => {
    setIsPanning(false);
    if (isDraggingNode) setIsDraggingNode(null);
    if (draggingCurveEdgeId) {
      if (hasDraggedRef.current) {
        suppressNextCanvasClickRef.current = true;
      }
      isDraggingEdgeRef.current = false;
      setDraggingCurveEdgeId(null);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (suppressNextCanvasClickRef.current) {
      suppressNextCanvasClickRef.current = false;
      return;
    }

    if (event.target !== svgRef.current) {
      return;
    }

    resetClickState(nodeClickStateRef);
    resetClickState(edgeClickStateRef);

    if (interactionMovedRef.current) {
      interactionMovedRef.current = false;
      return;
    }

    setSelectedEdgeId(null);
    setSelectedNodeId(null);

    if (edgeCreationSource) {
      setEdgeCreationSource(null);
    }
  };

  const handleCanvasDoubleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (isDraggingEdgeRef.current || suppressNextCanvasClickRef.current) {
      suppressNextCanvasClickRef.current = false;
      return;
    }

    if (interactionMovedRef.current) {
      interactionMovedRef.current = false;
      return;
    }

    const target = event.target as Element;
    if (
      target.closest('[data-node-id]') ||
      target.closest('[data-edge-id]') ||
      target.closest('[data-edge-handle]') ||
      target.closest('[data-edge-label]')
    ) {
      return;
    }

    const coords = getSVGCoordinates(event);
    onAddNode(coords.x, coords.y);
  };

  const handleNodeMouseDown = (event: React.MouseEvent | React.TouchEvent, nodeId: string) => {
    event.stopPropagation();
    interactionMovedRef.current = false;
    setIsDraggingNode(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    const node = nodes.find(candidate => candidate.id === nodeId);
    const coords = getSVGCoordinates(event);
    if (node) {
      dragStartRef.current = coords;
      setDragOffset({ x: coords.x - node.x, y: coords.y - node.y });
    }
  };

  const handleNodeMouseUp = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    setIsDraggingNode(null);
  };

  const handleNodeClick = (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();

    if (suppressNextCanvasClickRef.current) {
      suppressNextCanvasClickRef.current = false;
      return;
    }

    if (interactionMovedRef.current) {
      interactionMovedRef.current = false;
      return;
    }

    if (edgeCreationSource) {
      openCreateEdgeDialog(edgeCreationSource, nodeId);
      return;
    }

    queueCountedClick(nodeClickStateRef, nodeId, (clickedId, count) => {
      if (count >= 3) {
        openRenameDialog(clickedId);
        return;
      }

      if (count === 2) {
        setSelectedNodeId(clickedId);
        setSelectedEdgeId(null);
        setEdgeCreationSource(clickedId);
        return;
      }

      setSelectedNodeId(clickedId);
      setSelectedEdgeId(null);
    });
  };

  const handleNodeDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleNodeContextMenu = (event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    onDeleteNode(nodeId);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setEdgeCreationSource(null);
    setRenameDialogOpen(false);
  };

  const handleEdgeClick = (event: React.MouseEvent, edgeId: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (suppressNextCanvasClickRef.current) {
      suppressNextCanvasClickRef.current = false;
      return;
    }

    if (interactionMovedRef.current) {
      interactionMovedRef.current = false;
      return;
    }

    queueCountedClick(edgeClickStateRef, edgeId, (clickedId, count) => {
      if (count >= 2) {
        openEditEdgeDialog(clickedId);
        return;
      }

      setSelectedEdgeId(clickedId);
      setSelectedNodeId(null);
      setEdgeCreationSource(null);
    });
  };

  const handleEdgeDoubleClick = (event: React.MouseEvent, edgeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    resetClickState(edgeClickStateRef);
    openEditEdgeDialog(edgeId);
  };

  const handleCurveHandleStart = (event: React.MouseEvent | React.TouchEvent, edgeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    const coords = getSVGCoordinates(event);
    edgeDragStartRef.current = coords;
    isDraggingEdgeRef.current = true;
    hasDraggedRef.current = false;
    interactionMovedRef.current = false;
    setDraggingCurveEdgeId(edgeId);
  };

  const handleRenameSave = () => {
    const trimmed = renameLabel.trim();
    if (!trimmed || !renameNodeId) {
      toast({ title: t('messages.nodeNameRequired'), variant: 'destructive' });
      return;
    }

    onNodesChange(
      nodes.map(node => (node.id === renameNodeId ? { ...node, label: trimmed } : node))
    );
    setRenameDialogOpen(false);
    toast({ title: t('messages.nodeRenamed'), variant: 'default' });
  };

  const closeEdgeDialog = () => {
    setEdgeDialogState({ open: false, mode: 'create', edgeId: null, source: null, target: null });
  };

  const handleSaveEdge = () => {
    const parsedWeight = Number.parseFloat(edgeWeight);
    const normalizedWeight = Number.isFinite(parsedWeight) ? parsedWeight : 0;

    const userOptions: EdgeDefaults = {
      weight: normalizedWeight,
      curved: edgeCurved,
      directed: edgeDirected,
    };

    setLastEdgeOptions(userOptions);

    if (edgeDialogState.mode === 'edit' && edgeDialogState.edgeId) {
      onEdgesChange(
        edges.map(edge => {
          if (edge.id !== edgeDialogState.edgeId) return edge;

          const existing = normalizeEdge(edge);
          const shouldCurve = edgeCurved;
          const nextCurveOffset =
            shouldCurve
              ? existing.curved && existing.curveOffset
                ? existing.curveOffset
                : calculateCurveOffset(edge.source, edge.target, edges.filter(candidate => candidate.id !== edge.id))
              : 0;

          return normalizeEdge({
            ...edge,
            weight: normalizedWeight,
            directed: edgeDirected,
            curved: shouldCurve,
            curveOffset: nextCurveOffset,
          });
        })
      );
      closeEdgeDialog();
      return;
    }

    if (!edgeDialogState.source || !edgeDialogState.target) {
      closeEdgeDialog();
      return;
    }

    const parallelExists = edges.some(edge => {
      const normalized = normalizeEdge(edge);
      if (edge.source === edgeDialogState.source && edge.target === edgeDialogState.target) return true;
      if (!normalized.directed && edge.source === edgeDialogState.target && edge.target === edgeDialogState.source) return true;
      return edge.source === edgeDialogState.target && edge.target === edgeDialogState.source;
    });

    const effectiveCurved = edgeCurved || parallelExists;
    const curveOffset = effectiveCurved
      ? calculateCurveOffset(edgeDialogState.source, edgeDialogState.target, edges)
      : 0;

    const newEdge = normalizeEdge({
      id: generateEdgeId(),
      source: edgeDialogState.source,
      target: edgeDialogState.target,
      weight: normalizedWeight,
      directed: edgeDirected,
      curved: effectiveCurved,
      curveOffset,
    });

    onEdgesChange([...edges, newEdge]);
    setSelectedEdgeId(newEdge.id);
    closeEdgeDialog();

    if (!edgeCurved && effectiveCurved) {
      toast({ title: t('messages.duplicateCurved'), variant: 'default' });
    }
  };

  useEffect(() => {
    const handleGlobalPointerMove = (event: MouseEvent | TouchEvent) => {
      if (draggingCurveEdgeId && svgRef.current) {
        const edge = edges.find(candidate => candidate.id === draggingCurveEdgeId);
        if (!edge) return;
        const sourceNode = nodes.find(node => node.id === edge.source);
        const targetNode = nodes.find(node => node.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const coords = getSVGCoordinates(event);
        if ('cancelable' in event && event.cancelable) {
          event.preventDefault();
        }
        if (
          Math.abs(coords.x - edgeDragStartRef.current.x) > DRAG_SUPPRESSION_THRESHOLD ||
          Math.abs(coords.y - edgeDragStartRef.current.y) > DRAG_SUPPRESSION_THRESHOLD
        ) {
          hasDraggedRef.current = true;
          interactionMovedRef.current = true;
        }
        if (!hasDraggedRef.current) {
          return;
        }

        const normalizedEdge = normalizeEdge(edge);
        let nextCurveOffset = normalizedEdge.curveOffset || 0;
        let nextCurved = true;

        if (sourceNode.id === targetNode.id) {
          nextCurveOffset = Math.max(40, sourceNode.y - coords.y);
        } else {
          const { midX, midY, normalX, normalY } = getControlPoint(sourceNode, targetNode, normalizedEdge.curveOffset || 0);
          const projectedOffset = (coords.x - midX) * normalX + (coords.y - midY) * normalY;
          if (Math.abs(projectedOffset) < 4) {
            nextCurved = false;
            nextCurveOffset = 0;
          } else {
            nextCurveOffset = Math.round(projectedOffset);
          }
        }

        onEdgesChange(
          edges.map(candidate =>
            candidate.id === draggingCurveEdgeId
              ? normalizeEdge({
                  ...candidate,
                  curved: nextCurved,
                  curveOffset: nextCurveOffset,
                })
              : candidate
          )
        );
        return;
      }

      if (isDraggingNode && svgRef.current) {
        const coords = getSVGCoordinates(event);
        if ('cancelable' in event && event.cancelable) {
          event.preventDefault();
        }

        const vb = svgRef.current.viewBox.baseVal;
        let newX = coords.x - dragOffset.x;
        let newY = coords.y - dragOffset.y;

        if (Math.abs(coords.x - dragStartRef.current.x) > 2 || Math.abs(coords.y - dragStartRef.current.y) > 2) {
          interactionMovedRef.current = true;
        }

        newX = Math.max(NODE_RADIUS + CANVAS_PADDING, Math.min(newX, vb.width - NODE_RADIUS - CANVAS_PADDING));
        newY = Math.max(NODE_RADIUS + CANVAS_PADDING, Math.min(newY, vb.height - NODE_RADIUS - CANVAS_PADDING));

        onNodesChange(
          nodes.map(node => (node.id === isDraggingNode ? { ...node, x: newX, y: newY } : node))
        );
        return;
      }

      if (isPanning && svgRef.current) {
        const coords = getSVGCoordinates(event);
        if ('cancelable' in event && event.cancelable) {
          event.preventDefault();
        }
        const dx = coords.x - panStart.x;
        const dy = coords.y - panStart.y;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          interactionMovedRef.current = true;
        }
        const origin = panOriginRef.current;
        setViewBox(`${origin.x - dx} ${origin.y - dy} ${origin.width} ${origin.height}`);
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDraggingNode) setIsDraggingNode(null);
      if (isPanning) setIsPanning(false);
      if (draggingCurveEdgeId) {
        if (hasDraggedRef.current) {
          suppressNextCanvasClickRef.current = true;
        }
        isDraggingEdgeRef.current = false;
        hasDraggedRef.current = false;
        setDraggingCurveEdgeId(null);
      }
    };

    window.addEventListener('mousemove', handleGlobalPointerMove as EventListener);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchmove', handleGlobalPointerMove as EventListener, { passive: false });
    window.addEventListener('touchend', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalPointerMove as EventListener);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchmove', handleGlobalPointerMove as EventListener);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [
    dragOffset,
    draggingCurveEdgeId,
    edges,
    getSVGCoordinates,
    isDraggingNode,
    isPanning,
    nodes,
    onEdgesChange,
    onNodesChange,
    panStart,
    svgRef,
  ]);

  let highlightedNodes = new Set<string>();
  let highlightedEdges = new Set<string>();
  let currentPathNodes = new Set<string>();
  let currentPathEdges = new Set<string>();
  let currentMstEdges = new Set<string>();
  let currentMstNodes = new Set<string>();

  if (currentAlgorithmStep) {
    if (currentAlgorithmStep.type === 'visit-node' && currentAlgorithmStep.nodeId) {
      highlightedNodes.add(currentAlgorithmStep.nodeId);
    }
    if (currentAlgorithmStep.type === 'traverse-edge' && currentAlgorithmStep.edgeId) {
      highlightedEdges.add(currentAlgorithmStep.edgeId);
      const edge = edges.find(candidate => candidate.id === currentAlgorithmStep.edgeId);
      if (edge) {
        highlightedNodes.add(edge.target);
        if (currentAlgorithmStep.highlightSourceNodeId) {
          highlightedNodes.add(currentAlgorithmStep.highlightSourceNodeId);
        }
      }
    }
    if (currentAlgorithmStep.type === 'highlight-path' && currentAlgorithmStep.path) {
      currentAlgorithmStep.path.forEach(nodeId => currentPathNodes.add(nodeId));
      for (let i = 0; i < currentAlgorithmStep.path.length - 1; i++) {
        const edge = findPathEdge(edges, currentAlgorithmStep.path[i], currentAlgorithmStep.path[i + 1]);
        if (edge) currentPathEdges.add(edge.id);
      }
    }
    if (currentAlgorithmStep.mstEdges?.length) {
      currentAlgorithmStep.mstEdges.forEach(edgeId => {
        currentMstEdges.add(edgeId);
        const edge = edges.find(candidate => candidate.id === edgeId);
        if (edge) {
          currentMstNodes.add(edge.source);
          currentMstNodes.add(edge.target);
        }
      });
    }
  }

  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const edgeBeingEdited = edgeDialogState.edgeId ? edges.find(edge => edge.id === edgeDialogState.edgeId) : null;
  const edgeDialogSource = edgeDialogState.source ? nodeMap.get(edgeDialogState.source) : null;
  const edgeDialogTarget = edgeDialogState.target ? nodeMap.get(edgeDialogState.target) : null;

  return (
    <div className="relative w-full h-full bg-card rounded-lg shadow-inner overflow-hidden border border-border touch-none">
      <svg
        ref={svgRef}
        className={cn(
          'w-full h-full',
          isPanning || isDraggingNode ? 'cursor-grabbing' : 'cursor-grab',
          edgeCreationSource && 'cursor-crosshair'
        )}
        viewBox={viewBox}
        onMouseDown={handleMouseDownSVG}
        onMouseUp={handleMouseUpSVG}
        onMouseLeave={handleMouseLeaveSVG}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onTouchStart={e => {
          if (e.target === svgRef.current) {
            interactionMovedRef.current = false;
            setIsPanning(true);
            const coords = getSVGCoordinates(e);
            setPanStart(coords);
            const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
            panOriginRef.current = { x: vx, y: vy, width: vw, height: vh };
          }
        }}
        onTouchMove={e => {
          if (isPanning) {
            e.preventDefault();
          }
        }}
        onTouchEnd={() => setIsPanning(false)}
      >
        <defs>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse" fill="hsl(var(--foreground))" fillOpacity="0.7">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
          <marker id="arrowhead-highlight" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" fill="hsl(var(--accent))">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
          <marker id="arrowhead-primary" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" fill="hsl(var(--primary))">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
          <marker id="arrowhead-ring" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" fill="hsl(var(--ring))">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>

        {edges.map((edge, edgeIndex) => {
          const sourceNode = nodeMap.get(edge.source);
          const targetNode = nodeMap.get(edge.target);
          if (!sourceNode || !targetNode) return null;

          const normalizedEdge = normalizeEdge(edge);
          const pairIndex = getEdgePairIndex(edges, edge);
          const geometry = getPathGeometry(sourceNode, targetNode, normalizedEdge, pairIndex >= 0 ? pairIndex : edgeIndex);
          const isHighlighted = highlightedEdges.has(edge.id);
          const isCurrentPath = currentPathEdges.has(edge.id);
          const isMstEdge = currentMstEdges.has(edge.id);
          const isSelected = edge.id === selectedEdgeId;

          let stroke = 'hsl(var(--muted-foreground))';
          let edgeTextFill = 'hsl(var(--foreground))';
          let markerId = 'arrowhead';

          if (isMstEdge) {
            stroke = 'hsl(var(--primary))';
            edgeTextFill = 'hsl(var(--primary))';
            markerId = 'arrowhead-primary';
          } else if (isCurrentPath) {
            stroke = 'hsl(var(--accent))';
            edgeTextFill = 'hsl(var(--accent))';
            markerId = 'arrowhead-highlight';
          } else if (isHighlighted) {
            stroke = 'hsl(var(--primary))';
            edgeTextFill = 'hsl(var(--primary))';
            markerId = 'arrowhead-primary';
          } else if (isSelected) {
            stroke = 'hsl(var(--ring))';
            edgeTextFill = 'hsl(var(--ring))';
            markerId = 'arrowhead-ring';
          }

          const strokeWidth = isMstEdge || isCurrentPath || isHighlighted || isSelected ? 2.5 : 1.5;
          const labelValue = String(normalizedEdge.weight);
          const labelWidth = Math.max(EDGE_LABEL_MIN_WIDTH, labelValue.length * EDGE_LABEL_CHAR_WIDTH + 12);

          return (
            <g
              key={edge.id}
              data-edge-id={edge.id}
              className="group/edge"
              onDoubleClick={event => handleEdgeDoubleClick(event, edge.id)}
            >
              <path
                data-edge-id={edge.id}
                d={geometry.path}
                stroke={stroke}
                strokeWidth={strokeWidth + 10}
                fill="none"
                strokeOpacity="0"
                className="cursor-pointer"
                style={{ pointerEvents: 'stroke' }}
                onMouseDown={event => handleCurveHandleStart(event, edge.id)}
                onTouchStart={event => handleCurveHandleStart(event, edge.id)}
                onClick={event => handleEdgeClick(event, edge.id)}
              />
              <path
                data-edge-id={edge.id}
                d={geometry.path}
                stroke={stroke}
                strokeWidth={strokeWidth}
                fill="none"
                markerEnd={normalizedEdge.directed ? `url(#${markerId})` : undefined}
                className={cn(isSelected && 'drop-shadow-sm')}
              />
              <rect
                data-edge-label
                data-edge-id={edge.id}
                x={geometry.labelX - labelWidth / 2}
                y={geometry.labelY - EDGE_LABEL_HEIGHT / 2}
                width={labelWidth}
                height={EDGE_LABEL_HEIGHT}
                rx="5"
                fill="hsl(var(--background))"
                stroke="hsl(var(--border))"
                strokeWidth="0.75"
                opacity="0.96"
                onMouseDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={event => handleEdgeClick(event, edge.id)}
                className="cursor-pointer"
              />
              <text
                data-edge-label
                data-edge-id={edge.id}
                x={geometry.labelX}
                y={geometry.labelY + 5}
                textAnchor="middle"
                fontSize="14px"
                fontWeight="600"
                fill={edgeTextFill}
                onMouseDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={event => handleEdgeClick(event, edge.id)}
                className="cursor-pointer select-none"
              >
                {labelValue}
              </text>

              {isSelected && (
                <circle
                  data-edge-handle
                  data-edge-id={edge.id}
                  cx={geometry.handleX}
                  cy={geometry.handleY}
                  r={7}
                  fill="hsl(var(--ring))"
                  stroke="hsl(var(--card))"
                  strokeWidth="2"
                  className="cursor-grab"
                  style={{ pointerEvents: 'all' }}
                  onMouseDown={event => handleCurveHandleStart(event, edge.id)}
                  onMouseUp={event => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onTouchStart={event => handleCurveHandleStart(event, edge.id)}
                  onTouchEnd={event => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={event => handleEdgeClick(event, edge.id)}
                  onDoubleClick={event => handleEdgeDoubleClick(event, edge.id)}
                />
              )}
            </g>
          );
        })}

        {nodes.map(node => {
          const isAlgorithmVisitNode = highlightedNodes.has(node.id) && (currentAlgorithmStep?.type === 'visit-node' || currentAlgorithmStep?.type === 'traverse-edge');
          const isPathNode = currentPathNodes.has(node.id);
          const isMstNode = currentMstNodes.has(node.id);
          const isStart = node.id === startNode;
          const isEnd = node.id === endNode;
          const isSelected = node.id === selectedNodeId;
          const isEdgeSource = node.id === edgeCreationSource;

          let nodeFill = 'hsl(var(--card))';
          let nodeStroke = 'hsl(var(--foreground))';
          let nodeStrokeWidth = 1.5;

          if (isMstNode) {
            nodeFill = 'hsl(var(--primary)/0.18)';
            nodeStroke = 'hsl(var(--primary))';
            nodeStrokeWidth = 2.75;
          } else if (isPathNode) {
            nodeFill = 'hsl(var(--accent))';
            nodeStroke = 'hsl(var(--accent))';
            nodeStrokeWidth = 2.5;
          } else if (isAlgorithmVisitNode) {
            nodeFill = currentAlgorithmStep?.color || 'hsl(var(--primary))';
            nodeStroke = currentAlgorithmStep?.color || 'hsl(var(--primary))';
            nodeStrokeWidth = 2.5;
          }

          if (isStart) {
            if (!isPathNode && !isMstNode && !isAlgorithmVisitNode) nodeFill = 'hsl(var(--accent)/0.3)';
            if (!isMstNode) nodeStroke = 'hsl(var(--accent))';
            nodeStrokeWidth = Math.max(nodeStrokeWidth, 2.5);
          }

          if (isEnd) {
            if (!isPathNode && !isMstNode && !isAlgorithmVisitNode) nodeFill = 'hsl(var(--destructive)/0.3)';
            if (!isMstNode) nodeStroke = 'hsl(var(--destructive))';
            nodeStrokeWidth = Math.max(nodeStrokeWidth, 2.5);
          }

          if (isSelected && !isPathNode && !isMstNode && !isAlgorithmVisitNode && !isStart && !isEnd) {
            nodeStroke = 'hsl(var(--ring))';
            nodeStrokeWidth = 2.75;
            nodeFill = 'hsl(var(--ring)/0.12)';
          }

          if (isEdgeSource) {
            nodeStroke = 'hsl(var(--ring))';
            nodeStrokeWidth = 3;
            nodeFill = 'hsl(var(--ring)/0.2)';
          }

          return (
            <g
              data-node-id={node.id}
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={event => handleNodeMouseDown(event, node.id)}
              onMouseUp={handleNodeMouseUp}
              onClick={event => handleNodeClick(event, node.id)}
              onDoubleClick={handleNodeDoubleClick}
              onContextMenu={event => handleNodeContextMenu(event, node.id)}
              onTouchStart={event => handleNodeMouseDown(event, node.id)}
              onTouchEnd={handleNodeMouseUp}
              className={cn('cursor-pointer group/node transition-opacity duration-150', isEdgeSource && 'animate-pulse')}
            >
              <circle
                r={NODE_RADIUS}
                fill={nodeFill}
                stroke={nodeStroke}
                strokeWidth={nodeStrokeWidth}
                className="transition-all duration-150"
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Arial, Helvetica, sans-serif"
                fontSize="16px"
                fontWeight="600"
                fill="hsl(var(--foreground))"
                stroke="hsl(var(--card))"
                strokeWidth="0.5px"
                paintOrder="stroke"
                className="select-none pointer-events-none transition-colors duration-150"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {nodes.length === 0 && !edgeDialogState.open && !renameDialogOpen && (
          <foreignObject x="0" y="0" width="100%" height="100%" style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center justify-center h-full text-center pointer-events-none p-4 text-muted-foreground">
              <DraftingCompass className="w-24 h-24 text-muted-foreground/30 mb-6" data-ai-hint="compass sketch" />
              <h3 className="text-xl font-semibold mb-2">{t('graphCanvas.emptyTitle')}</h3>
              <p className="text-sm max-w-xs mb-2">{t('graphCanvas.emptyLineOne')}</p>
              <p className="text-sm max-w-xs">
                {t('graphCanvas.emptyLineTwoStart')} <PencilRuler className="inline h-4 w-4 text-accent align-text-bottom" /> &quot;{t('graphCanvas.emptyTool')}&quot; {t('graphCanvas.emptyLineTwoMiddle')} <Shapes className="inline h-4 w-4 text-accent align-text-bottom" /> &quot;{t('graphCanvas.emptySuggestion')}&quot;.
              </p>
            </div>
          </foreignObject>
        )}
      </svg>

      <Dialog
        open={edgeDialogState.open}
        onOpenChange={open => {
          if (!open) {
            closeEdgeDialog();
          } else {
            setEdgeDialogState(prev => ({ ...prev, open }));
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {edgeDialogState.mode === 'edit' ? t('edgeModal.editTitle') : t('edgeModal.createTitle')}
            </DialogTitle>
            <DialogDescription>{t('edgeModal.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(edgeDialogSource || edgeDialogTarget) && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <div className="text-xs text-muted-foreground">{t('edgeModal.source')}</div>
                  <div className="font-medium">{edgeDialogSource?.label || edgeBeingEdited?.source}</div>
                </div>
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <div className="text-xs text-muted-foreground">{t('edgeModal.target')}</div>
                  <div className="font-medium">{edgeDialogTarget?.label || edgeBeingEdited?.target}</div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edge-weight-input">{t('edgeModal.weight')}</Label>
              <Input
                id="edge-weight-input"
                type="number"
                step="any"
                value={edgeWeight}
                onChange={event => setEdgeWeight(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('edgeModal.edgeType')}</Label>
              <Select value={edgeCurved ? 'curved' : 'straight'} onValueChange={value => setEdgeCurved(value === 'curved')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">{t('edgeModal.straight')}</SelectItem>
                  <SelectItem value="curved">{t('edgeModal.curved')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{t('edgeModal.direction')}</Label>
              <Select value={edgeDirected ? 'directed' : 'undirected'} onValueChange={value => setEdgeDirected(value === 'directed')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undirected">{t('edgeModal.undirected')}</SelectItem>
                  <SelectItem value="directed">{t('edgeModal.directed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdgeDialog}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdge}>
              {edgeDialogState.mode === 'edit' ? t('edgeModal.saveChanges') : t('edgeModal.addEdge')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('nodeModal.renameTitle')}</DialogTitle>
            <DialogDescription>{t('nodeModal.renameDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="rename-node-input">{t('nodeModal.label')}</Label>
            <Input
              id="rename-node-input"
              value={renameLabel}
              onChange={event => setRenameLabel(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  handleRenameSave();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleRenameSave}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentAlgorithmStep?.type === 'message' && (currentAlgorithmStep.messageKey || currentAlgorithmStep.message) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-2rem)] bg-background/95 text-foreground p-2.5 px-4 rounded-lg shadow-xl text-xs sm:text-sm border border-border z-20 text-center">
          {currentAlgorithmStep.messageKey
            ? t(currentAlgorithmStep.messageKey, currentAlgorithmStep.messageValues)
            : currentAlgorithmStep.message}
        </div>
      )}
    </div>
  );
}
