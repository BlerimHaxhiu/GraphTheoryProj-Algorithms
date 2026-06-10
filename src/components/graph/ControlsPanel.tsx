// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import type { AStarHeuristicMode, AlgorithmType, Edge, Node } from '@/types/graph';
import {
  CircleDot,
  FileJson,
  GitFork,
  LayoutGrid,
  Play,
  PlusSquare,
  Route,
  Search,
  Settings2,
  Shapes,
  Sheet,
  SlidersHorizontal,
  Sprout,
  Star,
  TreeDeciduous,
  Trash2,
  Waypoints,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';

interface ControlsPanelProps {
  nodes: Node[];
  edges: Edge[];
  hasDirectedEdges: boolean;
  onAddNode: () => void;
  onRunAlgorithm: (
    algorithm: AlgorithmType,
    startNode?: string,
    endNode?: string,
    heuristicMode?: AStarHeuristicMode
  ) => void;
  onClearGraph: () => void;
  startNode: string | null;
  setStartNode: (nodeId: string | null) => void;
  endNode: string | null;
  setEndNode: (nodeId: string | null) => void;
  animationSpeed: number;
  onAnimationSpeedChange: (speed: number) => void;
  aStarHeuristicMode: AStarHeuristicMode;
  onAStarHeuristicModeChange: (mode: AStarHeuristicMode) => void;
  onDrawSuggestedGraph: (suggestionType: string, customData?: { nodeCount?: number; graphType?: string }) => void;
  onGenerateFromMatrix: (matrixString: string) => void;
  onGenerateFromJSON: (jsonString: string) => void;
}

interface AlgorithmOption {
  value: AlgorithmType;
  label: string;
  needsStartNode: boolean;
  needsEndNode: boolean;
}

const algorithmCategories: {
  name: string;
  icon: React.ElementType;
  algorithms: AlgorithmOption[];
}[] = [
  {
    name: 'algorithmCategories.traversal',
    icon: Search,
    algorithms: [
      { value: 'bfs', label: 'BFS', needsStartNode: true, needsEndNode: false },
      { value: 'dfs', label: 'DFS', needsStartNode: true, needsEndNode: false },
    ],
  },
  {
    name: 'algorithmCategories.shortestPath',
    icon: Waypoints,
    algorithms: [
      { value: 'dijkstra', label: 'Dijkstra', needsStartNode: true, needsEndNode: true },
      { value: 'a-star', label: 'A*', needsStartNode: true, needsEndNode: true },
      { value: 'bellman-ford', label: 'Bellman-Ford', needsStartNode: true, needsEndNode: false },
      { value: 'floyd-warshall', label: 'Floyd-Warshall', needsStartNode: false, needsEndNode: false },
    ],
  },
  {
    name: 'algorithmCategories.mst',
    icon: Sprout,
    algorithms: [
      { value: 'kruskal', label: 'Kruskal', needsStartNode: false, needsEndNode: false },
      { value: 'prim', label: 'Prim', needsStartNode: true, needsEndNode: false },
    ],
  },
];

const predefinedSuggestionOptions = [
  { type: 'complete-k4', label: 'graphSuggestions.completeK4', icon: LayoutGrid },
  { type: 'star-s5', label: 'graphSuggestions.starS5', icon: Star },
  { type: 'cycle-c5', label: 'graphSuggestions.cycleC5', icon: CircleDot },
  { type: 'simple-tree', label: 'graphSuggestions.simpleTree', icon: TreeDeciduous },
];

const customGraphTypeOptions: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'complete', label: 'graphSuggestions.complete', icon: LayoutGrid },
  { value: 'star', label: 'graphSuggestions.star', icon: Star },
  { value: 'cycle', label: 'graphSuggestions.cycle', icon: CircleDot },
  { value: 'tree', label: 'graphSuggestions.tree', icon: TreeDeciduous },
  { value: 'path', label: 'graphSuggestions.path', icon: Route },
];

export function ControlsPanel({
  nodes,
  edges,
  hasDirectedEdges,
  onRunAlgorithm,
  onClearGraph,
  startNode,
  setStartNode,
  endNode,
  setEndNode,
  animationSpeed,
  onAnimationSpeedChange,
  aStarHeuristicMode,
  onAStarHeuristicModeChange,
  onDrawSuggestedGraph,
  onGenerateFromMatrix,
  onGenerateFromJSON,
}: ControlsPanelProps) {
  const { t } = useLanguage();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmOption | null>(null);
  const [openMenu, setOpenMenu] = useState<string>('');
  const [customNodeCount, setCustomNodeCount] = useState<number>(5);
  const [customGraphType, setCustomGraphType] = useState<string>('path');
  const [matrixInput, setMatrixInput] = useState<string>('');
  const [jsonInput, setJsonInput] = useState<string>('');
  const isMstSelection = selectedAlgorithm?.value === 'kruskal' || selectedAlgorithm?.value === 'prim';

  const translateLabel = (label: string) => {
    return t(label);
  };

  const handleSelectAlgorithm = (algo: AlgorithmOption) => {
    setSelectedAlgorithm(algo);
    if (!algo.needsStartNode) setStartNode(null);
    if (!algo.needsEndNode) setEndNode(null);
  };

  const handleRunAlgorithm = () => {
    if (!selectedAlgorithm) {
      toast({
        title: t('common.error'),
        description: t('messages.selectAlgorithm'),
        variant: 'destructive',
      });
      return;
    }

    if (nodes.length === 0 && (selectedAlgorithm.needsStartNode || selectedAlgorithm.value === 'floyd-warshall' || selectedAlgorithm.value === 'kruskal')) {
      toast({
        title: t('common.error'),
        description: t('messages.addNodesBeforeRun'),
        variant: 'destructive',
      });
      return;
    }

    if (selectedAlgorithm.needsStartNode && !startNode) {
      toast({
        title: t('common.error'),
        description: t('messages.startNodeMissing'),
        variant: 'destructive',
      });
      return;
    }

    if (selectedAlgorithm.needsEndNode && !endNode) {
      toast({
        title: t('common.error'),
        description: t('messages.endNodeMissing', { algorithm: selectedAlgorithm.label }),
        variant: 'destructive',
      });
      return;
    }

    if (hasDirectedEdges && isMstSelection) {
      toast({
        title: t('common.error'),
        description: t('messages.mstDirectedError'),
        variant: 'destructive',
      });
      return;
    }

    onRunAlgorithm(
      selectedAlgorithm.value,
      startNode,
      endNode,
      selectedAlgorithm.value === 'a-star' ? aStarHeuristicMode : undefined
    );
  };

  useEffect(() => {
    if (selectedAlgorithm) {
      if (!selectedAlgorithm.needsStartNode) setStartNode(null);
      if (!selectedAlgorithm.needsEndNode) setEndNode(null);
    }
  }, [selectedAlgorithm, setEndNode, setStartNode]);

  useEffect(() => {
    if (hasDirectedEdges && isMstSelection) {
      setSelectedAlgorithm(null);
      setStartNode(null);
      setEndNode(null);
    }
  }, [hasDirectedEdges, isMstSelection, setEndNode, setStartNode]);

  const handleCustomNodeCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(event.target.value, 10);
    if (!isNaN(count) && count > 0 && count <= 50) {
      setCustomNodeCount(count);
    } else if (event.target.value === '') {
      setCustomNodeCount(0);
    }
  };

  const handleGenerateCustomGraph = () => {
    if (customNodeCount > 0 && customNodeCount <= 50) {
      onDrawSuggestedGraph('custom-graph', { nodeCount: customNodeCount, graphType: customGraphType });
      return;
    }

    toast({
      title: t('common.invalidValue'),
      description: t('messages.enterNodeCount'),
      variant: 'destructive',
    });
  };

  const handleGenerateFromMatrixClick = () => {
    if (!matrixInput.trim()) {
      toast({
        title: t('messages.emptyMatrix'),
        description: t('messages.enterMatrix'),
        variant: 'destructive',
      });
      return;
    }
    onGenerateFromMatrix(matrixInput);
  };

  const handleGenerateFromJSONClick = () => {
    if (!jsonInput.trim()) {
      toast({
        title: t('messages.emptyJson'),
        description: t('messages.enterJson'),
        variant: 'destructive',
      });
      return;
    }
    onGenerateFromJSON(jsonInput);
  };

  return (
    <Card className="h-full flex flex-col shadow-md rounded-lg border bg-card">
      <CardHeader className="p-3 pt-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>{t('controls.title')}</span>
        </CardTitle>
        <CardDescription className="text-xs">
          {t('controls.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-3 overflow-y-auto p-3 custom-scrollbar">
        <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {t('controls.hint')}
        </div>

        <div className="w-full">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            {t('controls.animationSpeed')}
          </div>
          <div className="flex items-center gap-3 p-2.5 rounded-md border bg-card shadow-sm">
            <Slider
              value={[animationSpeed]}
              max={3000}
              min={200}
              step={50}
              onValueChange={value => onAnimationSpeedChange(value[0])}
              className="flex-1"
              aria-label={t('controls.animationSpeedAria')}
            />
            <span className="text-xs text-muted-foreground w-14 text-center tabular-nums">
              {(animationSpeed / 1000).toFixed(1)} s
            </span>
          </div>
        </div>

        <Accordion
          type="single"
          collapsible
          className="w-full space-y-2"
          value={openMenu}
          onValueChange={value => setOpenMenu(value || '')}
        >
          <AccordionItem value="suggestions-accordion" className="border-b-0">
            <AccordionTrigger className="text-xs sm:text-sm hover:no-underline py-2 px-2 bg-muted/30 rounded-md data-[state=open]:bg-muted data-[state=open]:text-foreground font-medium">
              <div className="flex items-center gap-2 text-muted-foreground data-[state=open]:text-foreground">
                <Shapes className="h-4 w-4" /> {t('controls.graphSuggestions')}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1">
              <div className="grid grid-cols-1 gap-1 p-1">
                {predefinedSuggestionOptions.map(suggestion => (
                  <Button
                    key={suggestion.type}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={() => onDrawSuggestedGraph(suggestion.type)}
                  >
                    <suggestion.icon className="h-4 w-4 mr-2" />
                    {translateLabel(suggestion.label)}
                  </Button>
                ))}
                <Separator className="my-2" />
                <div className="space-y-2 p-1">
                  <Label htmlFor="custom-node-count" className="text-xs sm:text-sm block mb-1">
                    {t('controls.generateCustom')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="custom-node-count"
                      type="number"
                      value={customNodeCount === 0 && nodes.length === 0 ? '' : customNodeCount}
                      onChange={handleCustomNodeCountChange}
                      min="1"
                      max="50"
                      className="h-8 text-sm w-20"
                      placeholder={t('controls.nodeCountPlaceholder')}
                    />
                    <Select value={customGraphType} onValueChange={setCustomGraphType}>
                      <SelectTrigger id="custom-graph-type-select" aria-label={t('controls.chooseGraphType')} className="text-xs sm:text-sm h-8 flex-1">
                        <SelectValue placeholder={t('controls.graphType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {customGraphTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {translateLabel(option.label)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs sm:text-sm mt-2"
                    onClick={handleGenerateCustomGraph}
                    disabled={customNodeCount <= 0 || customNodeCount > 50}
                  >
                    <PlusSquare className="h-4 w-4 mr-2" />
                    {t('controls.generateCustomGraph')}
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="matrix-input-accordion" className="border-b-0">
            <AccordionTrigger className="text-xs sm:text-sm hover:no-underline py-2 px-2 bg-muted/30 rounded-md data-[state=open]:bg-muted data-[state=open]:text-foreground font-medium">
              <div className="flex items-center gap-2 text-muted-foreground data-[state=open]:text-foreground">
                <Sheet className="h-4 w-4" /> {t('controls.generateFromMatrix')}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 space-y-2">
              <Label htmlFor="matrix-input-area" className="text-xs sm:text-sm">
                {t('controls.matrixLabel')}
              </Label>
              <Textarea
                id="matrix-input-area"
                value={matrixInput}
                onChange={e => setMatrixInput(e.target.value)}
                placeholder={t('controls.matrixPlaceholder')}
                className="text-xs sm:text-sm min-h-[80px]"
              />
              <Button onClick={handleGenerateFromMatrixClick} variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                <PlusSquare className="h-4 w-4 mr-2" /> {t('controls.generateGraph')}
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="json-input-accordion" className="border-b-0">
            <AccordionTrigger className="text-xs sm:text-sm hover:no-underline py-2 px-2 bg-muted/30 rounded-md data-[state=open]:bg-muted data-[state=open]:text-foreground font-medium">
              <div className="flex items-center gap-2 text-muted-foreground data-[state=open]:text-foreground">
                <FileJson className="h-4 w-4" /> {t('controls.generateFromJson')}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 space-y-2">
              <Label htmlFor="json-input-area" className="text-xs sm:text-sm">
                {t('controls.jsonLabel')}
              </Label>
              <Textarea
                id="json-input-area"
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder={
                  t('controls.jsonPlaceholder')
                }
                className="text-xs sm:text-sm min-h-[120px]"
              />
              <Button onClick={handleGenerateFromJSONClick} variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                <PlusSquare className="h-4 w-4 mr-2" /> {t('controls.generateGraph')}
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="algorithms-accordion" className="border-b-0">
            <AccordionTrigger className="text-xs sm:text-sm hover:no-underline py-2 px-2 bg-muted/30 rounded-md data-[state=open]:bg-muted data-[state=open]:text-foreground font-medium">
              <div className="flex items-center gap-2 text-muted-foreground data-[state=open]:text-foreground">
                <GitFork className="h-4 w-4" /> {t('controls.runAlgorithm')}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1">
              <Accordion type="single" collapsible className="w-full space-y-0.5">
                {algorithmCategories.map((category, index) => (
                  <AccordionItem value={`category-${index}`} key={category.name} className="border-b-0">
                    <AccordionTrigger className="text-xs sm:text-sm hover:no-underline py-1.5 px-2 bg-muted/20 hover:bg-muted/40 rounded-md data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4" />
                        {translateLabel(category.name)}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-0.5 pb-0">
                      <div className="grid grid-cols-1 gap-0.5 p-0.5">
                        {category.algorithms.map(algo => {
                          const disabledForDirectedEdges = hasDirectedEdges && (algo.value === 'kruskal' || algo.value === 'prim');

                          return (
                            <Button
                              key={algo.value}
                              variant={selectedAlgorithm?.value === algo.value ? 'default' : 'ghost'}
                              size="sm"
                              className="w-full justify-start text-xs sm:text-sm h-auto py-1.5"
                              onClick={() => handleSelectAlgorithm(algo)}
                              disabled={disabledForDirectedEdges}
                            >
                              {algo.label}
                              {disabledForDirectedEdges ? t('controls.requiresUndirected') : ''}
                            </Button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {selectedAlgorithm?.label && (
                <div className="p-2 mt-1.5 border rounded-md bg-muted/20 text-center">
                  <p className="text-xs text-muted-foreground">
                    {t('controls.selectedAlgorithm')} <span className="font-semibold text-primary">{selectedAlgorithm.label}</span>
                  </p>
                </div>
              )}

              {selectedAlgorithm?.value === 'a-star' && (
                <div className="mt-1.5 space-y-2 rounded-md border bg-muted/20 p-2">
                  <Label htmlFor="astar-heuristic-mode" className="text-xs sm:text-sm">
                    {t('controls.aStarMode')}
                  </Label>
                  <Select
                    value={aStarHeuristicMode}
                    onValueChange={value => onAStarHeuristicModeChange(value as AStarHeuristicMode)}
                  >
                    <SelectTrigger
                      id="astar-heuristic-mode"
                      aria-label={t('controls.aStarMode')}
                      className="text-xs sm:text-sm"
                    >
                      <SelectValue placeholder={t('controls.aStarMode')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="euclidean" className="text-xs sm:text-sm">
                        {t('controls.aStarModeEuclidean')}
                      </SelectItem>
                      <SelectItem value="zero" className="text-xs sm:text-sm">
                        {t('controls.aStarModeZero')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    {t('controls.aStarModeHint')}
                  </p>
                </div>
              )}

              {nodes.length > 0 && selectedAlgorithm?.needsStartNode && (
                <Select value={startNode || ''} onValueChange={setStartNode}>
                  <SelectTrigger id="start-node-select" aria-label={t('controls.chooseStartNode')} className="text-xs sm:text-sm mt-1.5">
                    <SelectValue placeholder={t('controls.startNode')} />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map(node => (
                      <SelectItem key={node.id} value={node.id} className="text-xs sm:text-sm">
                        {node.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {nodes.length > 0 && selectedAlgorithm?.needsEndNode && startNode && (
                <Select value={endNode || ''} onValueChange={setEndNode}>
                  <SelectTrigger id="end-node-select" aria-label={t('controls.chooseEndNode')} className="text-xs sm:text-sm mt-1.5">
                    <SelectValue placeholder={t('controls.endNode')} />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map(node => (
                      <SelectItem key={node.id} value={node.id} disabled={node.id === startNode} className="text-xs sm:text-sm">
                        {node.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasDirectedEdges && isMstSelection && (
                <div className="mt-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  {t('controls.mstDisabled')}
                </div>
              )}

              <Button
                onClick={handleRunAlgorithm}
                className="w-full text-xs sm:text-sm mt-1.5"
                size="default"
                disabled={
                  !selectedAlgorithm ||
                  (nodes.length === 0 && (selectedAlgorithm.needsStartNode || selectedAlgorithm.value === 'floyd-warshall' || selectedAlgorithm.value === 'kruskal')) ||
                  (selectedAlgorithm.needsStartNode && !startNode) ||
                  (selectedAlgorithm.needsEndNode && !endNode) ||
                  (hasDirectedEdges && isMstSelection)
                }
                aria-label={t('controls.runAlgorithm')}
              >
                <Play className="h-4 w-4 mr-1" aria-hidden="true" /> {t('common.run')}
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      <CardFooter className="p-3 border-t mt-auto">
        <Button
          onClick={onClearGraph}
          variant="destructive"
          className="w-full text-xs sm:text-sm"
          size="default"
          aria-label={t('controls.clearGraph')}
        >
          <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" /> {t('controls.clearGraph')}
        </Button>
      </CardFooter>
    </Card>
  );
}
