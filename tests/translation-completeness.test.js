// Translation parity / completeness suite.
// Ensures Albanian and English are kept in lock-step for:
//   - keys in translations.ts
//   - algorithmExplanations table
//   - getAlgorithmExplanation (sq vs en field parity)
//   - getAlgorithmExampleSteps (same step count + same step numbers)
//   - English step overrides cover every Albanian step
const { translations, algorithmExplanations } = require('../src/lib/translations.ts');
const { getAlgorithmExplanation } = require('../src/lib/algorithm-explanations.ts');
const { getAlgorithmExampleSteps } = require('../src/lib/algorithm-example-steps.ts');
const { STEP_TEXTS_EN } = require('../src/lib/algorithm-example-steps-en.ts');

const ALGORITHMS = [
  'bfs',
  'dfs',
  'dijkstra',
  'a-star',
  'bellman-ford',
  'floyd-warshall',
  'kruskal',
  'prim',
];

let failed = 0;
function assert(name, ok, detail) {
  if (ok) {
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? `\n      ${detail}` : ''}`);
  }
}

function collectKeys(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...collectKeys(v, `${prefix}${k}.`));
    } else {
      out.push(`${prefix}${k}`);
    }
  }
  return out;
}

// 1. translations.ts sq/en key parity
{
  const sq = new Set(collectKeys(translations.sq));
  const en = new Set(collectKeys(translations.en));
  const inSqOnly = [...sq].filter(k => !en.has(k));
  const inEnOnly = [...en].filter(k => !sq.has(k));
  assert('translations.ts: sq has no extra keys', inSqOnly.length === 0, JSON.stringify(inSqOnly));
  assert('translations.ts: en has no extra keys', inEnOnly.length === 0, JSON.stringify(inEnOnly));
}

// 2. algorithmExplanations table parity
{
  const sqAlgos = Object.keys(algorithmExplanations.sq).sort();
  const enAlgos = Object.keys(algorithmExplanations.en).sort();
  assert(
    'algorithmExplanations: same algorithms in sq and en',
    JSON.stringify(sqAlgos) === JSON.stringify(enAlgos),
    `sq=${sqAlgos} en=${enAlgos}`
  );
  for (const a of sqAlgos) {
    const sqFields = Object.keys(algorithmExplanations.sq[a]).sort();
    const enFields = Object.keys(algorithmExplanations.en[a]).sort();
    assert(
      `algorithmExplanations[${a}]: field parity`,
      JSON.stringify(sqFields) === JSON.stringify(enFields),
      `sq=${sqFields} en=${enFields}`
    );
  }
}

// 3. getAlgorithmExplanation: every required field present in both languages
{
  const requiredString = [
    'shortSummary',
    'theory',
    'overview',
    'timeComplexity',
    'spaceComplexity',
  ];
  const requiredArray = [
    'bulletPoints',
    'whenToUse',
    'dataStructures',
    'detailedSteps',
    'exampleWalkthrough',
    'commonMistakes',
    'limitations',
  ];
  for (const algo of ALGORITHMS) {
    const sq = getAlgorithmExplanation('sq', algo);
    const en = getAlgorithmExplanation('en', algo);
    for (const f of requiredString) {
      assert(
        `explanations[${algo}].${f} is a non-empty string in both languages`,
        typeof sq[f] === 'string' &&
          sq[f].length > 0 &&
          typeof en[f] === 'string' &&
          en[f].length > 0
      );
    }
    for (const f of requiredArray) {
      assert(
        `explanations[${algo}].${f} is a non-empty array in both languages`,
        Array.isArray(sq[f]) &&
          sq[f].length > 0 &&
          Array.isArray(en[f]) &&
          en[f].length > 0
      );
    }
    assert(
      `explanations[${algo}].exampleGraph has nodes and edges`,
      sq.exampleGraph &&
        Array.isArray(sq.exampleGraph.nodes) &&
        sq.exampleGraph.nodes.length > 0 &&
        Array.isArray(sq.exampleGraph.edges)
    );
  }
}

// 4. getAlgorithmExampleSteps parity
{
  for (const algo of ALGORITHMS) {
    const sq = getAlgorithmExampleSteps('sq', algo);
    const en = getAlgorithmExampleSteps('en', algo);
    assert(`exampleSteps[${algo}]: same step count in sq and en`, sq.length === en.length, `sq=${sq.length} en=${en.length}`);
    for (let i = 0; i < sq.length; i += 1) {
      const sqStep = sq[i];
      const enStep = en[i];
      assert(
        `exampleSteps[${algo}][${i}]: same stepNumber`,
        sqStep.stepNumber === enStep.stepNumber,
        `sq=${sqStep.stepNumber} en=${enStep.stepNumber}`
      );
      assert(
        `exampleSteps[${algo}][${i}]: en title is non-empty`,
        typeof enStep.title === 'string' && enStep.title.length > 0
      );
      assert(
        `exampleSteps[${algo}][${i}]: en description is non-empty`,
        typeof enStep.description === 'string' && enStep.description.length > 0
      );
      if (sqStep.changeNote) {
        assert(
          `exampleSteps[${algo}][${i}]: en changeNote present (since sq has one)`,
          typeof enStep.changeNote === 'string' && enStep.changeNote.length > 0
        );
      }
      // Shared visual data — must be identical references / equivalent
      assert(
        `exampleSteps[${algo}][${i}]: graphState shared across languages`,
        sqStep.graphState === enStep.graphState
      );
    }
  }
}

// 5. STEP_TEXTS_EN covers every Albanian step
{
  for (const algo of ALGORITHMS) {
    const sqSteps = getAlgorithmExampleSteps('sq', algo);
    const overrides = STEP_TEXTS_EN[algo] || {};
    for (const sqStep of sqSteps) {
      const ov = overrides[sqStep.stepNumber];
      assert(
        `STEP_TEXTS_EN[${algo}][${sqStep.stepNumber}] exists`,
        Boolean(ov)
      );
      if (ov) {
        assert(
          `STEP_TEXTS_EN[${algo}][${sqStep.stepNumber}].title is set`,
          typeof ov.title === 'string' && ov.title.length > 0
        );
        assert(
          `STEP_TEXTS_EN[${algo}][${sqStep.stepNumber}].description is set`,
          typeof ov.description === 'string' && ov.description.length > 0
        );
      }
    }
  }
}

// 6. No Albanian step note slips through to the English output
{
  const ALBANIAN_GIVEAWAYS = [
    /\bndryshim\b/i,
    /\brruge\b/i,
    /\bnyje\b/i,
    /\bperdor\b/i,
    /\bbrinje\b/i,
    /\bperfundon\b/i,
    /\bperdori\b/i,
    /\bperdorur\b/i,
    /\bvereje\b/i,
    /\bpeshe\b/i,
    /\bgrafi\b/i,
  ];
  for (const algo of ALGORITHMS) {
    const enSteps = getAlgorithmExampleSteps('en', algo);
    for (const step of enSteps) {
      const corpus = [
        step.title,
        step.description,
        step.changeNote ?? '',
        ...((step.algorithmState && step.algorithmState.notes) || []),
      ].join(' ');
      const hit = ALBANIAN_GIVEAWAYS.find(re => re.test(corpus));
      assert(
        `en step ${algo}#${step.stepNumber} has no Albanian giveaway`,
        !hit,
        hit ? `matched ${hit} in: ${corpus.slice(0, 160)}…` : ''
      );
    }
  }
}

if (failed > 0) {
  console.log(`\n${failed} translation checks failed.`);
  process.exit(1);
}
console.log('\nAll translation parity checks passed.');
