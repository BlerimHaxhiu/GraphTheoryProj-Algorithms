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
  const nodes = [makeNode('A'), makeNode('B'), makeNode('C'), makeNode('D')];
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

  assert.match(lastMessage(kruskal(nodes, edges)), /Total MST weight: 4/);
  assert.match(lastMessage(prim(nodes, edges, 'A')), /Total MST weight: 4/);
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

