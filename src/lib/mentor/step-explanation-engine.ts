// Step explanation engine (Phase 6).
//
// "Why was this node selected? / Why did A* expand this node? / Why did Kruskal
// reject this edge?" — answered strictly from the *current* execution state
// (currentStep + selectedAlgorithm + graph). When the asked-about detail is not
// available in the current step, it says so rather than inventing facts.
import type { AlgorithmType, AppLanguage, Localized, MentorContext } from './types';
import { normalize } from './nlp';

function pick(l: Localized, lang: AppLanguage): string {
  return l[lang];
}
function L(en: string, sq: string): Localized {
  return { en, sq };
}

function nodeLabel(ctx: MentorContext, id?: string): string {
  if (!id) return '?';
  return ctx.nodes.find(n => n.id === id)?.label ?? id;
}

function edgeLabel(ctx: MentorContext, id?: string): string {
  if (!id) return '?';
  const e = ctx.edges.find(ed => ed.id === id);
  if (!e) return id;
  return `${nodeLabel(ctx, e.source)}-${nodeLabel(ctx, e.target)}`;
}

function visitNodeReason(algo: AlgorithmType | null, label: string, lang: AppLanguage): string {
  const map: Partial<Record<AlgorithmType, Localized>> = {
    bfs: L(
      `BFS selected node ${label} because it was next out of the FIFO queue — the earliest-discovered node, so it sits at the current breadth level.`,
      `BFS zgjodhi nyjen ${label} sepse ishte e radhes qe doli nga rreshti FIFO — nyja e zbuluar me heret, pra ne nivelin aktual te gjeresise.`
    ),
    dfs: L(
      `DFS selected node ${label} because it was on top of the stack — DFS always dives into the most recently discovered node before backtracking.`,
      `DFS zgjodhi nyjen ${label} sepse ishte ne krye te stivit — DFS gjithmone zbret tek nyja e zbuluar me se fundi para se te kthehet pas.`
    ),
    dijkstra: L(
      `Dijkstra expanded node ${label} because, among all unsettled nodes, it had the smallest tentative distance from the start — so its shortest distance can now be finalised.`,
      `Dijkstra zgjeroi nyjen ${label} sepse, nder te gjitha nyjet e papercaktuara, kishte distancen me te vogel te perkohshme nga fillimi — prandaj distanca e saj me e shkurter mund te perfundohet tani.`
    ),
    'a-star': L(
      `A* expanded node ${label} because it had the smallest f = g + h among open nodes — the best combination of distance so far (g) and estimated distance to the goal (h).`,
      `A* zgjeroi nyjen ${label} sepse kishte f = g + h me te voglen nder nyjet e hapura — kombinimi me i mire i distances deri tani (g) dhe distances se vleresuar deri te qellimi (h).`
    ),
    prim: L(
      `Prim selected node ${label} because the cheapest edge leaving the current tree connects to it — Prim always attaches the lightest edge crossing out of the tree.`,
      `Prim zgjodhi nyjen ${label} sepse brinja me e lire qe del nga pema aktuale lidhet me te — Prim gjithmone bashkengjit brinjen me te lehte qe del nga pema.`
    ),
  };
  const localized =
    (algo && map[algo]) ??
    L(
      `Node ${label} was selected because the algorithm's rule made it the highest-priority next node (FIFO for BFS, LIFO for DFS, smallest distance for Dijkstra, smallest f for A*).`,
      `Nyja ${label} u zgjodh sepse rregulli i algoritmit e beri nyjen tjeter me prioritet me te larte (FIFO per BFS, LIFO per DFS, distanca me e vogel per Dijkstra, f me e vogel per A*).`
    );
  return pick(localized, lang);
}

function traverseEdgeReason(algo: AlgorithmType | null, label: string, lang: AppLanguage): string {
  if (algo === 'bfs' || algo === 'dfs') {
    return pick(
      L(
        `Edge ${label} is being traversed to reach a neighbour that has not been visited yet.`,
        `Brinja ${label} po kalohet per te arritur nje fqinje qe nuk eshte vizituar ende.`
      ),
      lang
    );
  }
  if (algo === 'kruskal') {
    return pick(
      L(
        `Kruskal is considering edge ${label} in increasing weight order and checking whether its endpoints are already connected.`,
        `Kruskal po e shqyrton brinjen ${label} sipas rendit rrites te peshes dhe po kontrollon nese skajet e saj jane tashme te lidhura.`
      ),
      lang
    );
  }
  // Weighted relaxation (Dijkstra, A*, Bellman-Ford, Prim candidate).
  return pick(
    L(
      `Edge ${label} is being relaxed: the algorithm checks whether reaching the far node through this edge is cheaper than the best distance known so far, and updates it if so.`,
      `Brinja ${label} po relaksohet: algoritmi kontrollon nese arritja e nyjes tjeter permes kesaj brinje eshte me e lire se distanca me e mire e njohur deri tani, dhe e perditeson nese po.`
    ),
    lang
  );
}

/**
 * Explain why the current step happened, grounded in the live execution state.
 * Always returns a string (the orchestrator only routes here on step-why cues).
 */
export function explainStep(ctx: MentorContext, question: string): string {
  const lang = ctx.language;
  const step = ctx.currentStep;
  const n = normalize(question);
  const asksReject = /(reject|ignored|discard|skip|refuz|anashkal|injoro|perjasht)/.test(n);

  if (!step) {
    return pick(
      L(
        'There is no active step right now. Run an algorithm, pause on a step, then ask "why was this node/edge selected?" and I will explain it from the live state.',
        'Per momentin nuk ka hap aktiv. Ekzekuto nje algoritem, ndalo ne nje hap, pastaj pyet "pse u zgjodh kjo nyje/brinje?" dhe une do ta shpjegoj nga gjendja e drejtperdrejte.'
      ),
      lang
    );
  }

  const algo = ctx.selectedAlgorithm;
  const key = step.messageKey ?? '';

  // Kruskal/Prim accept/reject are message-key driven.
  if (/IgnoredCycle/i.test(key)) {
    const edge = step.edgeId ? edgeLabel(ctx, step.edgeId) : (lang === 'sq' ? 'kjo brinje' : 'this edge');
    return pick(
      L(
        `Kruskal rejected edge ${edge} because its endpoints are already connected — Union-Find finds them in the same set, so adding the edge would create a cycle. A spanning tree must stay acyclic.`,
        `Kruskal e refuzoi brinjen ${edge} sepse skajet e saj jane tashme te lidhura — Union-Find i gjen ne te njejten bashkesi, pra shtimi i brinjes do te krijonte cikel. Nje peme shtrirese duhet te mbetet pa cikle.`
      ),
      lang
    );
  }
  if (/mstEdgeAdded/i.test(key)) {
    const edge = step.edgeId ? edgeLabel(ctx, step.edgeId) : (lang === 'sq' ? 'kjo brinje' : 'this edge');
    return pick(
      L(
        `This edge ${edge} was accepted because it is the lightest remaining edge whose endpoints lie in different components, so adding it cannot form a cycle and it lowers the total tree weight.`,
        `Kjo brinje ${edge} u pranua sepse eshte brinja me e lehte e mbetur me skaje ne komponente te ndryshme, pra shtimi i saj nuk formon cikel dhe ul peshen totale te pemes.`
      ),
      lang
    );
  }
  if (/primCandidateUpdated/i.test(key)) {
    return pick(
      L(
        'Prim updated this node\'s best connecting edge because a lighter edge from the current tree to it was found — Prim keeps, for every outside node, the cheapest edge that would attach it.',
        'Prim e perditesoi brinjen me te mire lidhese te kesaj nyje sepse u gjet nje brinje me e lehte nga pema aktuale tek ajo — Prim mban, per cdo nyje te jashtme, brinjen me te lire qe do ta bashkengjiste.'
      ),
      lang
    );
  }

  let body: string;
  switch (step.type) {
    case 'visit-node':
      body = visitNodeReason(algo, nodeLabel(ctx, step.nodeId), lang);
      break;
    case 'traverse-edge':
      body = traverseEdgeReason(algo, edgeLabel(ctx, step.edgeId), lang);
      break;
    case 'highlight-path':
      body = pick(
        L(
          'This is the final path the algorithm settled on. Following the predecessor links from the target back to the start reproduces it, and by the algorithm\'s rule no better path exists.',
          'Kjo eshte rruga finale qe zgjodhi algoritmi. Duke ndjekur lidhjet e paraardhesve nga qellimi mbrapsht te fillimi e rikrijon ate, dhe sipas rregullit te algoritmit nuk ekziston rruge me e mire.'
        ),
        lang
      );
      break;
    case 'update-matrix-cell':
      body = pick(
        L(
          'Floyd-Warshall updated this matrix cell because routing dist[i][j] through the current intermediate node k turned out shorter than the previous best.',
          'Floyd-Warshall e perditesoi kete qelize sepse kalimi i dist[i][j] permes nyjes se ndermjetme aktuale k doli me i shkurter se me i miri i meparshem.'
        ),
        lang
      );
      break;
    case 'reset':
      body = pick(
        L(
          'This is a reset step: the algorithm is preparing its initial state (distances, queues, sets) before exploring.',
          'Ky eshte nje hap rivendosjeje: algoritmi po pergatit gjendjen fillestare (distanca, rreshta, bashkesi) para eksplorimit.'
        ),
        lang
      );
      break;
    default:
      body = step.message
        ? `${lang === 'sq' ? 'Hapi aktual' : 'Current step'}: ${step.message}`
        : pick(
            L(
              'The current step is an informational message from the algorithm.',
              'Hapi aktual eshte nje mesazh informues nga algoritmi.'
            ),
            lang
          );
  }

  // Honest guidance when the user asked about a rejection that this step isn't.
  if (asksReject && !/IgnoredCycle/i.test(key)) {
    const prefix = pick(
      L(
        "The current step isn't an edge rejection, so here's what it actually is — step to a Kruskal \"forms a cycle\" message to see a rejected edge. ",
        'Hapi aktual nuk eshte refuzim brinje, prandaj ja cfare eshte ne te vertete — kalo te nje mesazh i Kruskal "formon cikel" per te pare nje brinje te refuzuar. '
      ),
      lang
    );
    return prefix + body;
  }

  return body;
}
