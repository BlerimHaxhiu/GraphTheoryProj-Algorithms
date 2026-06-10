const assert = require('node:assert/strict');

const {
  dijkstra,
  bfs,
  dfs,
  aStar,
  bellmanFord,
  floydWarshall,
  kruskal,
  prim,
} = require('../src/lib/graph-algorithms.ts');
const { getTranslation } = require('../src/lib/translations.ts');

function renderStepMessage(step, language = 'en') {
  if (!step) return undefined;
  return step.messageKey
    ? getTranslation(language, step.messageKey, step.messageValues)
    : step.message;
}

function lastMessage(steps) {
  return renderStepMessage(steps.filter(step => step.type === 'message').at(-1));
}

function lastPath(steps) {
  return steps.filter(step => step.type === 'highlight-path').at(-1)?.path ?? null;
}

function messagesByKey(steps, key) {
  return steps.filter(step => step.messageKey === key).map(step => renderStepMessage(step));
}

function makeNode(id, x = 0, y = 0) {
  return { id, label: id, x, y };
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

runTest('dijkstra finds the expected shortest path', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'BC', source: 'B', target: 'C', weight: 2 },
    { id: 'AC', source: 'A', target: 'C', weight: 5 },
    { id: 'CD', source: 'C', target: 'D', weight: 1 },
    { id: 'BD', source: 'B', target: 'D', weight: 10 },
  ];

  const steps = dijkstra(nodes, edges, 'A', 'D');

  assert.deepEqual(lastPath(steps), ['A', 'B', 'C', 'D']);
  assert.match(lastMessage(steps), /Weight: 4/);
});

runTest('aStar matches the optimal path on non-negative weights', () => {
  const nodes = [
    makeNode('A', 0, 0),
    makeNode('B', 1, 0),
    makeNode('C', 2, 0),
    makeNode('D', 3, 0),
  ];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'BC', source: 'B', target: 'C', weight: 2 },
    { id: 'AC', source: 'A', target: 'C', weight: 5 },
    { id: 'CD', source: 'C', target: 'D', weight: 1 },
  ];

  const steps = aStar(nodes, edges, 'A', 'D');

  assert.deepEqual(lastPath(steps), ['A', 'B', 'C', 'D']);
  assert.match(lastMessage(steps), /Cost: 4/);
});

runTest('aStar zero heuristic behaves like cost-only A* and reports zero h values', () => {
  const nodes = [
    makeNode('A', 0, 0),
    makeNode('B', 1, 0),
    makeNode('C', 0, 1),
    makeNode('D', 2, 0),
  ];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'BD', source: 'B', target: 'D', weight: 1 },
    { id: 'AC', source: 'A', target: 'C', weight: 2 },
    { id: 'CD', source: 'C', target: 'D', weight: 2.2 },
  ];

  const steps = aStar(nodes, edges, 'A', 'D', 'zero');
  const scoreMessages = messagesByKey(steps, 'algorithmSteps.aStarScoreState');

  assert.deepEqual(lastPath(steps), ['A', 'B', 'D']);
  assert.ok(scoreMessages.length > 0);
  assert.ok(scoreMessages.every(message => message.includes('h(n) = 0.00')));
  assert.match(lastMessage(steps), /zero/);
});

runTest('aStar euclidean heuristic reports non-zero h values and keeps the shortest path correct', () => {
  const nodes = [
    makeNode('A', 0, 0),
    makeNode('B', 1, 0),
    makeNode('C', 0, 1),
    makeNode('D', 2, 0),
  ];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'BD', source: 'B', target: 'D', weight: 1 },
    { id: 'AC', source: 'A', target: 'C', weight: 2 },
    { id: 'CD', source: 'C', target: 'D', weight: 2.2 },
  ];

  const steps = aStar(nodes, edges, 'A', 'D', 'euclidean');
  const scoreMessages = messagesByKey(steps, 'algorithmSteps.aStarScoreState');

  assert.deepEqual(lastPath(steps), ['A', 'B', 'D']);
  assert.ok(scoreMessages.some(message => !message.includes('h(n) = 0.00')));
  assert.match(lastMessage(steps), /euclidean/);
});

runTest('bfs and dfs report the expected traversal order on a simple chain', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'BC', source: 'B', target: 'C', weight: 1 },
    { id: 'CD', source: 'C', target: 'D', weight: 1 },
  ];

  const bfsSteps = bfs(nodes, edges, 'A');
  const dfsSteps = dfs(nodes, edges, 'A');

  assert.equal(lastMessage(bfsSteps), 'BFS completed. Visited nodes (discovery order): A, B, C, D');
  assert.equal(lastMessage(dfsSteps), 'DFS completed. Visited nodes (first visit order): A -> B -> C -> D');
});

runTest('bellmanFord handles negative edges without negative cycles', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 4 },
    { id: 'AC', source: 'A', target: 'C', weight: 5 },
    { id: 'BC', source: 'B', target: 'C', weight: -2 },
    { id: 'CD', source: 'C', target: 'D', weight: 3 },
  ];

  const steps = bellmanFord(
    nodes,
    edges.map(edge => ({ ...edge, directed: true })),
    'A'
  );
  const messages = steps.filter(step => step.type === 'message').map(step => renderStepMessage(step));

  assert.ok(messages.includes('Shortest path to C: A -> B -> C. Weight: 2'));
  assert.ok(messages.includes('Shortest path to D: A -> B -> C -> D. Weight: 5'));
});

runTest('bellmanFord reuses the real edge id when relaxing reverse edges in undirected graphs', () => {
  const nodes = [makeNode('A'), makeNode('B')];
  const edges = [{ id: 'AB', source: 'A', target: 'B', weight: 2 }];

  const steps = bellmanFord(nodes, edges, 'B');
  const reverseRelaxation = steps.find(
    step =>
      step.type === 'traverse-edge' &&
      step.highlightSourceNodeId === 'B' &&
      step.nodeId === 'A'
  );

  assert.ok(reverseRelaxation);
  assert.equal(reverseRelaxation.edgeId, 'AB');
});

runTest('floydWarshall reports the expected all-pairs shortest paths on a positive graph', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 3 },
    { id: 'BC', source: 'B', target: 'C', weight: 4 },
    { id: 'AC', source: 'A', target: 'C', weight: 10 },
  ];

  const steps = floydWarshall(
    nodes,
    edges.map(edge => ({ ...edge, directed: true }))
  );
  const messages = steps.filter(step => step.type === 'message').map(step => renderStepMessage(step));

  assert.ok(messages.includes('-> C: A -> B -> C (distance: 7)'));
  assert.ok(messages.includes('A\t0\t3\t7'));
});

runTest('floydWarshall emits working matrix snapshots and update context', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 3 },
    { id: 'BC', source: 'B', target: 'C', weight: 4 },
    { id: 'AC', source: 'A', target: 'C', weight: 10 },
  ];

  const steps = floydWarshall(
    nodes,
    edges.map(edge => ({ ...edge, directed: true }))
  );
  const updateStep = steps.find(step => step.type === 'update-matrix-cell');

  assert.ok(updateStep);
  assert.ok(Array.isArray(updateStep.matrixSnapshot));
  assert.equal(updateStep.matrixCell?.row, 0);
  assert.equal(updateStep.matrixCell?.col, 2);
  assert.equal(updateStep.matrixCell?.value, 7);
  assert.deepEqual(updateStep.matrixContext, { k: 1, i: 0, j: 2, viaNodeId: 'B' });
  assert.deepEqual(updateStep.matrixSnapshot?.[0], [0, 3, 7]);
});

runTest('floydWarshall marks distances touched by negative cycles as -inf', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'BC', source: 'B', target: 'C', weight: -2 },
    { id: 'CA', source: 'C', target: 'A', weight: -2 },
  ];

  const steps = floydWarshall(
    nodes,
    edges.map(edge => ({ ...edge, directed: true }))
  );
  const messages = steps.filter(step => step.type === 'message').map(step => renderStepMessage(step));
  const highlightPaths = steps.filter(step => step.type === 'highlight-path');

  assert.ok(
    messages.some(message => message.includes('negative cycles')),
    'Expected a negative-cycle summary message'
  );
  assert.ok(messages.includes('A\t-inf\t-inf\t-inf'));
  assert.equal(highlightPaths.length, 0);
});

runTest('kruskal and prim agree on the MST total weight', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'AC', source: 'A', target: 'C', weight: 4 },
    { id: 'BC', source: 'B', target: 'C', weight: 2 },
    { id: 'BD', source: 'B', target: 'D', weight: 5 },
    { id: 'CD', source: 'C', target: 'D', weight: 1 },
  ];

  assert.match(lastMessage(kruskal(nodes, edges)), /Final MST/);
  assert.match(lastMessage(prim(nodes, edges, 'A')), /Final MST/);
});

runTest('kruskal emits final MST edge metadata', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'AC', source: 'A', target: 'C', weight: 4 },
    { id: 'BC', source: 'B', target: 'C', weight: 2 },
    { id: 'BD', source: 'B', target: 'D', weight: 5 },
    { id: 'CD', source: 'C', target: 'D', weight: 1 },
  ];

  const steps = kruskal(nodes, edges);
  const finalStep = steps.find(step => step.mstEdges?.length);

  assert.ok(finalStep);
  assert.deepEqual(finalStep.mstEdges, ['AB', 'CD', 'BC']);
  assert.equal(finalStep.totalWeight, 4);
  assert.match(renderStepMessage(finalStep), /Final MST/);
});

runTest('prim emits final MST edge metadata', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1 },
    { id: 'AC', source: 'A', target: 'C', weight: 4 },
    { id: 'BC', source: 'B', target: 'C', weight: 2 },
    { id: 'BD', source: 'B', target: 'D', weight: 5 },
    { id: 'CD', source: 'C', target: 'D', weight: 1 },
  ];

  const steps = prim(nodes, edges, 'A');
  const finalStep = steps.find(step => step.mstEdges?.length);

  assert.ok(finalStep);
  assert.deepEqual(finalStep.mstEdges, ['AB', 'BC', 'CD']);
  assert.equal(finalStep.totalWeight, 4);
  assert.match(renderStepMessage(finalStep), /Final MST/);
});

runTest('mixed directed and undirected edges are respected per edge', () => {
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C')];
  const edges = [
    { id: 'AB', source: 'A', target: 'B', weight: 1, directed: true },
    { id: 'BC', source: 'B', target: 'C', weight: 1, directed: false },
  ];

  const fromA = bfs(nodes, edges, 'A');
  const fromC = bfs(nodes, edges, 'C');

  assert.match(lastMessage(fromA), /A, B, C$/);
  assert.match(lastMessage(fromC), /C, B$/);
});

