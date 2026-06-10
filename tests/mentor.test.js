// Test suite for the deterministic Algorithm Mentor.
// Run with: npm run test:mentor
//
// Covers: intent classification, the recommendation engine (Phase 2), the why
// engine (Phase 3), the comparison engine (Phase 4), graph-based recommendation
// (Phase 5), step explanation (Phase 6) and bilingual knowledge-base parity.
const assert = require('node:assert/strict');

const { classifyMentorIntent, generateMentorResponse } = require('../src/lib/mentor/mentor-engine.ts');
const {
  parseGraphProperties,
  recommend,
  recommendFromText,
} = require('../src/lib/mentor/recommendation-engine.ts');
const { explainWhy, explainWhyFormatted } = require('../src/lib/mentor/why-engine.ts');
const {
  compareAlgorithms,
  compareFormatted,
} = require('../src/lib/mentor/comparison-engine.ts');
const { analyzeGraph, recommendForGraph } = require('../src/lib/mentor/graph-analysis.ts');
const { explainStep } = require('../src/lib/mentor/step-explanation-engine.ts');
const { getKnowledge, ALL_ALGORITHMS } = require('../src/lib/mentor/algorithm-knowledge.ts');
// Ensure the public barrel loads (the app relies on it indirectly).
require('../src/lib/mentor/index.ts');

let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error('      ' + (error && error.message ? error.message : error));
  }
}

function node(id, label, x = 0, y = 0) {
  return { id, label: label ?? id, x, y };
}

// ----------------------------------------------------------------------------
// 1. Intent classification
// ----------------------------------------------------------------------------
const INTENT_CASES = [
  ['which algorithm should I use?', 'recommend'],
  ['recommend an algorithm for shortest path', 'recommend'],
  ['what should I use for this graph?', 'recommend-graph'],
  ['what algorithm should I use for the current graph?', 'recommend-graph'],
  ['why Dijkstra?', 'why'],
  ['why use A*?', 'why'],
  ['compare A* and Dijkstra', 'compare'],
  ['Kruskal vs Prim', 'compare'],
  ['dijkstra and bellman-ford', 'compare'],
  ['why was this node selected?', 'step-why'],
  ['why did A* expand this node?', 'step-why'],
  ['why did Kruskal reject this edge?', 'step-why'],
  // Must NOT be claimed by the mentor (existing handlers own these):
  ['why is a node visited first?', null],
  ['what is the complexity of dijkstra?', null],
  ['when should I use Dijkstra?', null],
  ['hello', null],
  ['', null],
  // Albanian
  ['cilin algoritem te perdor?', 'recommend'],
  ['cfare te perdor per kete graf?', 'recommend-graph'],
  ['pse Dijkstra?', 'why'],
  ['krahaso bfs dhe dfs', 'compare'],
  ['pse u zgjodh kjo nyje?', 'step-why'],
];
for (const [q, expected] of INTENT_CASES) {
  test(`intent: "${q}" -> ${expected}`, () => {
    assert.equal(classifyMentorIntent(q), expected);
  });
}

// ----------------------------------------------------------------------------
// 2. Recommendation engine (Phase 2)
// ----------------------------------------------------------------------------
test('parseGraphProperties: shortest path + negative weights', () => {
  const p = parseGraphProperties('shortest path with negative weights');
  assert.equal(p.task, 'shortest-path');
  assert.equal(p.negativeWeights, true);
});
test('parseGraphProperties: mst', () => {
  assert.equal(parseGraphProperties('build a minimum spanning tree').task, 'mst');
});
test('parseGraphProperties: all-pairs', () => {
  assert.equal(parseGraphProperties('shortest path between all pairs').task, 'all-pairs-shortest-path');
});
test('parseGraphProperties: pathfinding on a map', () => {
  assert.equal(parseGraphProperties('pathfinding on a map').task, 'pathfinding');
});
test('parseGraphProperties: traversal', () => {
  assert.equal(parseGraphProperties('traverse and visit all nodes').task, 'traversal');
});
test('parseGraphProperties: unweighted + directed', () => {
  const p = parseGraphProperties('an unweighted directed graph');
  assert.equal(p.weighted, false);
  assert.equal(p.directed, true);
});

test('recommend: MST -> Kruskal + Prim', () => {
  assert.deepEqual(recommend({ task: 'mst' }).recommended, ['kruskal', 'prim']);
});
test('recommend: directed MST flags the undirected constraint', () => {
  const r = recommend({ task: 'mst', directed: true });
  const text = r.tradeoffs.map(t => t.en).join(' ');
  assert.match(text, /undirected/i);
});
test('recommend: unweighted shortest path -> BFS', () => {
  assert.deepEqual(recommend({ task: 'shortest-path', weighted: false }).recommended, ['bfs']);
});
test('recommend: negative-weight shortest path -> Bellman-Ford', () => {
  const r = recommend({ task: 'shortest-path', weighted: true, negativeWeights: true });
  assert.deepEqual(r.recommended, ['bellman-ford']);
});
test('recommend: non-negative weighted shortest path -> Dijkstra (A* alt)', () => {
  const r = recommend({ task: 'shortest-path', weighted: true, negativeWeights: false });
  assert.deepEqual(r.recommended, ['dijkstra']);
  assert.deepEqual(r.alternatives, ['a-star']);
});
test('recommend: shortest path with unknown weights records an assumption', () => {
  const r = recommend({ task: 'shortest-path', weighted: null, negativeWeights: null });
  assert.deepEqual(r.recommended, ['dijkstra']);
  assert.ok(r.assumptions.length >= 1, 'expected at least one stated assumption');
});
test('recommend: all-pairs -> Floyd-Warshall', () => {
  assert.deepEqual(recommend({ task: 'all-pairs-shortest-path' }).recommended, ['floyd-warshall']);
});
test('recommend: all-pairs with negatives keeps Floyd-Warshall, Bellman-Ford alt', () => {
  const r = recommend({ task: 'all-pairs-shortest-path', negativeWeights: true });
  assert.deepEqual(r.recommended, ['floyd-warshall']);
  assert.deepEqual(r.alternatives, ['bellman-ford']);
});
test('recommend: pathfinding -> A* (Dijkstra alt)', () => {
  const r = recommend({ task: 'pathfinding', negativeWeights: false });
  assert.deepEqual(r.recommended, ['a-star']);
  assert.deepEqual(r.alternatives, ['dijkstra']);
});
test('recommend: pathfinding with negatives -> Bellman-Ford', () => {
  assert.deepEqual(
    recommend({ task: 'pathfinding', negativeWeights: true }).recommended,
    ['bellman-ford']
  );
});
test('recommend: traversal -> BFS + DFS', () => {
  assert.deepEqual(recommend({ task: 'traversal' }).recommended, ['bfs', 'dfs']);
});
test('recommend: unknown task -> decision guide (no single pick)', () => {
  const r = recommend({ task: null });
  assert.deepEqual(r.recommended, []);
  assert.ok(r.reasons.length >= 4, 'guide should list multiple branches');
});
test('recommendFromText end-to-end picks Bellman-Ford for negative shortest path', () => {
  const out = recommendFromText('shortest path with negative weights', 'en');
  assert.match(out, /Bellman-Ford/);
});

// ----------------------------------------------------------------------------
// 3. Why engine (Phase 3)
// ----------------------------------------------------------------------------
test('explainWhy returns structured purpose/strengths/weaknesses/useCases', () => {
  const w = explainWhy('dijkstra');
  assert.equal(w.label, 'Dijkstra');
  assert.ok(w.purpose.en.length > 0 && w.purpose.sq.length > 0);
  assert.ok(w.strengths.en.length === 3 && w.weaknesses.en.length === 3 && w.useCases.en.length === 3);
});
test('formatted why (en) has the required sections', () => {
  const out = explainWhyFormatted('bfs', 'en');
  for (const section of ['Purpose', 'Strengths', 'Weaknesses', 'Common use cases']) {
    assert.match(out, new RegExp(section));
  }
});
test('formatted why (sq) is localized', () => {
  const out = explainWhyFormatted('dijkstra', 'sq');
  assert.match(out, /Pikat e forta/);
  assert.match(out, /Qellimi/);
});

// ----------------------------------------------------------------------------
// 4. Comparison engine (Phase 4)
// ----------------------------------------------------------------------------
test('compareAlgorithms: canonical pair is curated (order-independent)', () => {
  assert.equal(compareAlgorithms('a-star', 'dijkstra').curated, true);
  assert.equal(compareAlgorithms('dijkstra', 'a-star').curated, true);
});
test('compareAlgorithms: non-canonical pair falls back to generic', () => {
  const c = compareAlgorithms('bfs', 'kruskal');
  assert.equal(c.curated, false);
  assert.ok(c.chooseWhen.a.en.length > 0 && c.chooseWhen.b.en.length > 0);
});
test('formatted comparison has key difference + when-to-choose + both blocks', () => {
  const out = compareFormatted('bfs', 'dfs', 'en');
  assert.match(out, /Key difference/);
  assert.match(out, /When to choose/);
  assert.match(out, /Complexity/);
});
test('formatted comparison is localized in Albanian', () => {
  const out = compareFormatted('kruskal', 'prim', 'sq');
  assert.match(out, /Dallimi kryesor/);
  assert.match(out, /Kur te zgjedhesh/);
});

// ----------------------------------------------------------------------------
// 5. Graph analysis + graph-based recommendation (Phase 5)
// ----------------------------------------------------------------------------
const undirectedWeighted = {
  nodes: [node('n1', 'A'), node('n2', 'B'), node('n3', 'C')],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', weight: 4 },
    { id: 'e2', source: 'n2', target: 'n3', weight: 2 },
    { id: 'e3', source: 'n1', target: 'n3', weight: 5 },
  ],
};
test('analyzeGraph: weighted, undirected, connected', () => {
  const a = analyzeGraph(undirectedWeighted.nodes, undirectedWeighted.edges);
  assert.equal(a.weighted, true);
  assert.equal(a.directed, false);
  assert.equal(a.connected, true);
  assert.equal(a.components, 1);
  assert.equal(a.hasNegativeWeights, false);
});
test('recommendForGraph: describes the graph and suggests per task', () => {
  const a = analyzeGraph(undirectedWeighted.nodes, undirectedWeighted.edges);
  const out = recommendForGraph(a, 'en');
  assert.match(out, /Your graph/);
  assert.match(out, /Dijkstra/);
  assert.match(out, /Kruskal/);
  assert.match(out, /won't run anything automatically/);
});
test('recommendForGraph: directed graph flags the MST undirected constraint', () => {
  const a = analyzeGraph(
    [node('n1', 'A'), node('n2', 'B')],
    [{ id: 'e1', source: 'n1', target: 'n2', weight: 3, directed: true }]
  );
  assert.equal(a.directed, true);
  assert.match(recommendForGraph(a, 'en'), /undirected/i);
});
test('recommendForGraph: negative weights steer toward Bellman-Ford', () => {
  const a = analyzeGraph(
    [node('n1', 'A'), node('n2', 'B')],
    [{ id: 'e1', source: 'n1', target: 'n2', weight: -3 }]
  );
  assert.equal(a.hasNegativeWeights, true);
  assert.match(recommendForGraph(a, 'en'), /Bellman-Ford/);
});
test('recommendForGraph: disconnected graph is reported', () => {
  const a = analyzeGraph(
    [node('n1', 'A'), node('n2', 'B'), node('n3', 'C')],
    [{ id: 'e1', source: 'n1', target: 'n2', weight: 1 }]
  );
  assert.equal(a.connected, false);
  assert.equal(a.components, 2);
  assert.match(recommendForGraph(a, 'en'), /disconnected/i);
});
test('recommendForGraph: empty graph is handled gracefully', () => {
  assert.match(recommendForGraph(analyzeGraph([], []), 'en'), /empty/i);
});
test('generateMentorResponse routes a graph question through analysis', () => {
  const out = generateMentorResponse('what algorithm should I use for this graph?', {
    language: 'en',
    selectedAlgorithm: null,
    nodes: undirectedWeighted.nodes,
    edges: undirectedWeighted.edges,
    startNodeId: null,
    endNodeId: null,
    currentStep: null,
  });
  assert.match(out, /Your graph/);
});

// ----------------------------------------------------------------------------
// 6. Step explanation (Phase 6)
// ----------------------------------------------------------------------------
function ctxWith(step, selectedAlgorithm = null) {
  return {
    language: 'en',
    selectedAlgorithm,
    nodes: undirectedWeighted.nodes,
    edges: undirectedWeighted.edges,
    startNodeId: null,
    endNodeId: null,
    currentStep: step,
  };
}
test('step-why: Kruskal cycle rejection explained from messageKey', () => {
  const out = explainStep(
    ctxWith({ type: 'message', edgeId: 'e3', messageKey: 'mstEdgeIgnoredCycle' }, 'kruskal'),
    'why did Kruskal reject this edge?'
  );
  assert.match(out, /cycle/i);
  assert.match(out, /A-C/);
});
test('step-why: A* node expansion explains f = g + h', () => {
  const out = explainStep(
    ctxWith({ type: 'visit-node', nodeId: 'n2' }, 'a-star'),
    'why did A* expand this node?'
  );
  assert.match(out, /f = g \+ h/);
  assert.match(out, /B/);
});
test('step-why: no active step is handled gracefully (no invention)', () => {
  const out = explainStep(ctxWith(null, 'dijkstra'), 'why was this node selected?');
  assert.match(out, /no active step/i);
});
test('step-why: asking about rejection when step is not one is honest', () => {
  const out = explainStep(
    ctxWith({ type: 'visit-node', nodeId: 'n1' }, 'bfs'),
    'why was this edge rejected?'
  );
  assert.match(out, /isn't an edge rejection/i);
});

// ----------------------------------------------------------------------------
// 7. Knowledge-base bilingual parity
// ----------------------------------------------------------------------------
for (const algo of ALL_ALGORITHMS) {
  test(`knowledge[${algo}]: bilingual parity and completeness`, () => {
    const k = getKnowledge(algo);
    assert.ok(k.label.length > 0, 'label');
    assert.ok(k.timeComplexity.length > 0 && k.spaceComplexity.length > 0, 'complexity');
    assert.ok(k.purpose.en.length > 0 && k.purpose.sq.length > 0, 'purpose');
    assert.ok(k.whenToUse.en.length > 0 && k.whenToUse.sq.length > 0, 'whenToUse');
    for (const field of ['strengths', 'weaknesses', 'useCases']) {
      assert.equal(k[field].en.length, k[field].sq.length, `${field} length parity`);
      assert.ok(k[field].en.length >= 2, `${field} has content`);
      assert.ok(
        k[field].en.every(s => s.length > 0) && k[field].sq.every(s => s.length > 0),
        `${field} non-empty entries`
      );
    }
  });
}

// ----------------------------------------------------------------------------
if (failed > 0) {
  console.log(`\n${failed} mentor checks failed.`);
  process.exit(1);
}
console.log('\nAll mentor checks passed.');
