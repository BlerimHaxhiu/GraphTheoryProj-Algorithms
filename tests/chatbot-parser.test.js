// Permanent test suite for the chatbot command parser.
// Run with: npm run test:chatbot
const { parseChatbotCommand } = require('../src/lib/chatbot-command-parser.ts');

const labels = ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4'];

function run(name, message, expected) {
  const actual = parseChatbotCommand(message, { availableLabels: labels });
  const matches = Object.entries(expected).every(([k, v]) => {
    if (typeof v === 'function') return v(actual[k]);
    return actual[k] === v;
  });
  if (!matches) {
    console.log(`FAIL ${name}\n  input    : ${message}\n  expected : ${JSON.stringify(expected)}\n  actual   : ${JSON.stringify(actual)}`);
    return false;
  }
  console.log(`PASS ${name}`);
  return true;
}

const cases = [
  // Albanian
  ['ALB 1 — Ekzekuto Dijkstra A→F',
    'Ekzekuto Dijkstra nga A deri te F',
    { type: 'RUN_ALGORITHM', algorithm: 'dijkstra', startNodeLabel: 'A', endNodeLabel: 'F' }],
  ['ALB 2 — ma gjej rrugen me te shkurter prej A ne E',
    'ma gjej rrugen me te shkurter prej A ne E',
    { type: 'RUN_ALGORITHM', algorithm: 'dijkstra', startNodeLabel: 'A', endNodeLabel: 'E' }],
  ['ALB 3 — nisja bfs prej nyjes A',
    'nisja bfs prej nyjes A',
    { type: 'RUN_ALGORITHM', algorithm: 'bfs', startNodeLabel: 'A' }],
  ['ALB 4 — nise dfs nga 1',
    'nise dfs nga 1',
    { type: 'RUN_ALGORITHM', algorithm: 'dfs', startNodeLabel: '1' }],
  ['ALB 5 — perdor bellman ford nga A deri te D',
    'përdor bellman ford nga A deri te D',
    { type: 'RUN_ALGORITHM', algorithm: 'bellman-ford', startNodeLabel: 'A', endNodeLabel: 'D' }],
  ['ALB 6 — kam pesha negative ... ?',
    'kam pesha negative, cilin algoritëm duhet me përdor?',
    { type: 'EXPLAIN_ONLY' }],
  ['ALB 7 — ma gjej MST → default Kruskal',
    'ma gjej MST',
    { type: 'RUN_ALGORITHM', algorithm: 'kruskal' }],
  ['ALB 8 — ekzekuto kruskal per pemen minimale',
    'ekzekuto kruskal per pemen minimale',
    { type: 'RUN_ALGORITHM', algorithm: 'kruskal' }],
  ['ALB 9 — perdor prim nga A',
    'perdor prim nga A',
    { type: 'RUN_ALGORITHM', algorithm: 'prim', startNodeLabel: 'A' }],
  ['ALB 10 — krahaso bfs dhe dfs',
    'krahaso bfs dhe dfs',
    { type: 'EXPLAIN_ONLY' }],
  ['ALB 11 — dijkstra vs bellman ford',
    'dijkstra vs bellman ford',
    { type: 'EXPLAIN_ONLY' }],
  ['ALB 12 — shpjego si punon floyd warshall',
    'shpjego si punon floyd warshall',
    { type: 'EXPLAIN_ONLY' }],
  ['ALB 13 — sa eshte kompleksiteti i dijkstra',
    'sa eshte kompleksiteti i dijkstra',
    { type: 'EXPLAIN_ONLY' }],
  ['ALB 14 — fshije rezultatin',
    'fshije rezultatin',
    { type: 'CLEAR_RESULT' }],
  ['ALB 15 — rivendose vizualizimin',
    'rivendose vizualizimin',
    { type: 'RESET_VISUALIZATION' }],

  // English
  ['ENG 16 — Run Dijkstra from A to F',
    'Run Dijkstra from A to F',
    { type: 'RUN_ALGORITHM', algorithm: 'dijkstra', startNodeLabel: 'A', endNodeLabel: 'F' }],
  ['ENG 17 — Find the shortest path from A to E',
    'Find the shortest path from A to E',
    { type: 'RUN_ALGORITHM', algorithm: 'dijkstra', startNodeLabel: 'A', endNodeLabel: 'E' }],
  ['ENG 18 — Execute BFS starting from node 1',
    'Execute BFS starting from node 1',
    { type: 'RUN_ALGORITHM', algorithm: 'bfs', startNodeLabel: '1' }],
  ['ENG 19 — Use Bellman-Ford for negative weights',
    'Use Bellman-Ford for negative weights',
    { type: 'RUN_ALGORITHM', algorithm: 'bellman-ford' }],
  ['ENG 20 — Create MST using Kruskal',
    'Create the minimum spanning tree using Kruskal',
    { type: 'RUN_ALGORITHM', algorithm: 'kruskal' }],
  ['ENG 21 — Run Prim from B',
    'Run Prim from B',
    { type: 'RUN_ALGORITHM', algorithm: 'prim', startNodeLabel: 'B' }],
  ['ENG 22 — Compare BFS vs DFS',
    'Compare BFS vs DFS',
    { type: 'EXPLAIN_ONLY' }],
  ['ENG 23 — Explain why Dijkstra cannot ... negative',
    'Explain why Dijkstra cannot be used with negative weights',
    { type: 'EXPLAIN_ONLY' }],
  ['ENG 24 — Clear the current result',
    'Clear the current result',
    { type: 'CLEAR_RESULT' }],
  ['ENG 25 — Reset the algorithm visualization',
    'Reset the algorithm visualization',
    { type: 'RESET_VISUALIZATION' }],

  // Regression / safety cases
  ['REG 26 — empty input → UNKNOWN',
    '',
    { type: 'UNKNOWN' }],
  ['REG 27 — typo dikstra still resolves to dijkstra',
    'run dikstra from A to F',
    { type: 'RUN_ALGORITHM', algorithm: 'dijkstra', startNodeLabel: 'A', endNodeLabel: 'F' }],
];

let failed = 0;
for (const [name, message, expected] of cases) {
  if (!run(name, message, expected)) failed += 1;
}

if (failed > 0) {
  console.log(`\n${failed} of ${cases.length} parser cases failed.`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} parser cases passed.`);
