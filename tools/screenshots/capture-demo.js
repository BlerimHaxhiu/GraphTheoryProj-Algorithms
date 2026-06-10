#!/usr/bin/env node
/* eslint-disable */
/**
 * capture-demo.js — Automated portfolio screenshot capture for the
 * Interactive Graph Algorithm Visualization and Learning Platform.
 *
 * What it does
 *  1. Detects a locally running app (dev server on 9002 / 3000, or 127.0.0.1).
 *  2. If none is running, serves the static export in `out/` itself (after
 *     `npm run build`). If `out/` is missing too, prints manual instructions.
 *  3. Seeds a deterministic demo graph + language via localStorage so every
 *     screenshot is reproducible and never blank.
 *  4. Drives the real UI (no mocking, no faked frames) to capture 12 shots.
 *  5. Verifies each file exists, is non-trivial in size, and that the page had
 *     real app content before the shot — failures are reported, not hidden.
 *
 * Usage:  npm run demo:screenshots
 *
 * It is intentionally dependency-light: only `playwright` (a devDependency) and
 * Node's built-in `http`/`fs`. The static file server is implemented inline so
 * no extra package (serve/http-server) is required.
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(PROJECT_ROOT, 'out');
const SHOT_DIR = path.join(PROJECT_ROOT, 'docs', 'screenshots');
const MANIFEST = path.join(SHOT_DIR, 'capture-manifest.json');
const VIEWPORT = { width: 1440, height: 1000 };
const MIN_BYTES = 4000; // anything smaller is almost certainly blank/broken

const CANDIDATE_URLS = [
  'http://localhost:9002',
  'http://localhost:3000',
  'http://127.0.0.1:9002',
  'http://127.0.0.1:3000',
];

/* ----------------------------------------------------------------------------
 * Deterministic demo graph (6 nodes, 9 undirected weighted edges).
 * Coordinates live inside the 800x600 canvas viewBox (safe area 40..760 / 40..560).
 * Designed so the demos are pedagogically clear:
 *   - Shortest path A -> F is the multi-hop A-C-B-D-E-F with total weight 13.
 *   - Minimum spanning tree is {B-C, A-C, D-E, E-F, B-D} with total weight 13.
 * ------------------------------------------------------------------------- */
const DEMO_GRAPH = {
  isDirected: false,
  nodes: [
    { id: 'n1', label: 'A', x: 130, y: 300 },
    { id: 'n2', label: 'B', x: 330, y: 150 },
    { id: 'n3', label: 'C', x: 330, y: 450 },
    { id: 'n4', label: 'D', x: 540, y: 150 },
    { id: 'n5', label: 'E', x: 540, y: 450 },
    { id: 'n6', label: 'F', x: 720, y: 300 },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', weight: 4, directed: false },
    { id: 'e2', source: 'n1', target: 'n3', weight: 2, directed: false },
    { id: 'e3', source: 'n2', target: 'n3', weight: 1, directed: false },
    { id: 'e4', source: 'n2', target: 'n4', weight: 5, directed: false },
    { id: 'e5', source: 'n3', target: 'n4', weight: 8, directed: false },
    { id: 'e6', source: 'n3', target: 'n5', weight: 10, directed: false },
    { id: 'e7', source: 'n4', target: 'n5', weight: 2, directed: false },
    { id: 'e8', source: 'n4', target: 'n6', weight: 6, directed: false },
    { id: 'e9', source: 'n5', target: 'n6', weight: 3, directed: false },
  ],
};

const results = [];
function log(msg) {
  process.stdout.write(`[capture] ${msg}\n`);
}

/* ----------------------------------------------------------------------------
 * Minimal static file server for the `out/` export (only used as a fallback).
 * ------------------------------------------------------------------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

function resolveStaticFile(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  let filePath = path.join(OUT_DIR, p);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;
  // Next static export: clean URLs -> `${path}.html`
  if (!path.extname(p)) {
    const htmlPath = path.join(OUT_DIR, `${p}.html`);
    if (fs.existsSync(htmlPath)) return htmlPath;
    const indexPath = path.join(OUT_DIR, p, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
  }
  return null;
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const file = resolveStaticFile(req.url);
      if (!file) {
        // SPA-ish fallback to the app shell so client routing still works.
        const fallback = path.join(OUT_DIR, '404.html');
        if (fs.existsSync(fallback)) {
          res.writeHead(404, { 'Content-Type': MIME['.html'] });
          fs.createReadStream(fallback).pipe(res);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1500 }, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function detectRunningApp() {
  for (const url of CANDIDATE_URLS) {
    // eslint-disable-next-line no-await-in-loop
    if (await probe(url)) return url;
  }
  return null;
}

/* ----------------------------------------------------------------------------
 * Small UI helpers built on top of the verified selectors.
 * ------------------------------------------------------------------------- */
async function ensureExpanded(locator) {
  try {
    const state = await locator.getAttribute('aria-expanded');
    if (state !== 'true') {
      await locator.click();
      await locator.page().waitForTimeout(350);
    }
  } catch (e) {
    /* ignore — caller validates downstream */
  }
}

async function openRunAlgorithm(page) {
  await ensureExpanded(page.locator('button:has(svg.lucide-git-fork)').first());
}

async function openCategory(page, iconClass) {
  await ensureExpanded(page.locator(`button:has(svg.${iconClass})`).first());
}

async function selectAlgorithm(page, label) {
  await page.getByRole('button', { name: label, exact: true }).first().click();
  await page.waitForTimeout(200);
}

async function pickFromSelect(page, triggerId, optionName, optionIndex) {
  await page.locator(`#${triggerId}`).click();
  await page.waitForTimeout(250);
  if (typeof optionIndex === 'number') {
    await page.getByRole('option').nth(optionIndex).click();
  } else {
    await page.getByRole('option', { name: optionName, exact: true }).first().click();
  }
  await page.waitForTimeout(200);
}

async function setFastPlayback(page) {
  try {
    const slider = page.locator('[role="slider"]').first();
    await slider.focus();
    await slider.press('Home'); // jump to minimum (fastest, 200ms/step)
  } catch (e) {
    /* non-fatal */
  }
}

async function clickRun(page) {
  await page.locator('button.w-full:has(svg.lucide-play)').first().click();
}

async function readStepCounter(page) {
  const counters = await page.locator('span.tabular-nums').allTextContents();
  for (const c of counters) {
    const m = c.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return { current: Number(m[1]), total: Number(m[2]) };
  }
  return null;
}

async function waitForPlaybackComplete(page, timeoutMs = 35000) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    const c = await readStepCounter(page);
    if (c && c.total > 0 && c.current >= c.total) return true;
    last = c;
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(350);
  }
  log(`  playback did not report completion (last counter: ${last ? last.current + '/' + last.total : 'n/a'})`);
  return false;
}

async function runAlgorithmToCompletion(page, { category, label, start, end, astarIndex }) {
  await openRunAlgorithm(page);
  await openCategory(page, category);
  await selectAlgorithm(page, label);
  if (typeof astarIndex === 'number') {
    await pickFromSelect(page, 'astar-heuristic-mode', null, astarIndex);
  }
  if (start) await pickFromSelect(page, 'start-node-select', start);
  if (end) await pickFromSelect(page, 'end-node-select', end);
  await clickRun(page);
  await waitForPlaybackComplete(page);
  await page.waitForTimeout(600);
}

async function countNodes(page) {
  return page.locator('[data-node-id]').count();
}

async function shot(page, name, opts = {}) {
  const file = path.join(SHOT_DIR, name);
  const note = opts.note || '';
  try {
    if (opts.element) {
      await opts.element.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(250);
      await opts.element.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file, fullPage: !!opts.fullPage });
    }
    const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
    const ok = size >= MIN_BYTES && (opts.minNodes === undefined || (await countNodes(page)) >= opts.minNodes);
    results.push({ file: name, ok, bytes: size, note });
    log(`${ok ? 'OK ' : 'BAD'}  ${name}  (${size} bytes) ${note}`);
    return ok;
  } catch (e) {
    results.push({ file: name, ok: false, bytes: 0, note: `ERROR: ${e.message}` });
    log(`BAD  ${name}  (capture error: ${e.message})`);
    return false;
  }
}

async function centerOn(page, locator) {
  try {
    await locator.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
    await page.waitForTimeout(400);
  } catch (e) {
    /* ignore */
  }
}

/* ----------------------------------------------------------------------------
 * Main capture flow.
 * ------------------------------------------------------------------------- */
async function main() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });

  let baseUrl = await detectRunningApp();
  let server = null;
  let mode = 'detected dev server';

  if (baseUrl) {
    log(`Detected a running app at ${baseUrl}`);
  } else if (fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    const started = await startStaticServer();
    server = started.server;
    baseUrl = started.url;
    mode = 'static export (out/)';
    log(`No dev server found. Serving static export from out/ at ${baseUrl}`);
  } else {
    log('');
    log('No running app detected and no static export found in out/.');
    log('To produce screenshots, do ONE of the following, then re-run this script:');
    log('  Option A (static, recommended):  npm install  &&  npm run build');
    log('  Option B (dev server):           npm install  &&  npm run dev   (serves http://localhost:9002)');
    log('Then:  npm run demo:screenshots');
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch();
  const seed = JSON.stringify(DEMO_GRAPH);

  async function makeContext(lang) {
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    await ctx.addInitScript(
      ({ language, graph }) => {
        try {
          window.localStorage.setItem('app-language', language);
          window.localStorage.setItem('grafiShqipGraph', graph);
        } catch (e) {
          /* storage disabled — app falls back to defaults */
        }
      },
      { language: lang, graph: seed }
    );
    return ctx;
  }

  // ---- English context: shots 01-10 and 12 -------------------------------
  const ctx = await makeContext('en');
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);

  // 01 — Landing page
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('a[href="/app"]').first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500); // let particles + fonts settle
  await shot(page, '01-landing-page.png', { note: 'landing / hero' });

  // Go to the workspace (seeded graph renders from localStorage)
  await page.goto(`${baseUrl}/app`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-node-id]').first().waitFor({ timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500); // let the "graph loaded" toast disappear
  await setFastPlayback(page);

  // 02 — Main workspace
  await shot(page, '02-main-workspace.png', { minNodes: 6, note: 'full workspace + seeded graph' });

  // 03 — Graph editor / controls (open the algorithm controls)
  await openRunAlgorithm(page);
  await openCategory(page, 'lucide-waypoints'); // shortest-path category
  await page.waitForTimeout(400);
  await shot(page, '03-graph-editor.png', { minNodes: 6, note: 'editor + algorithm controls' });

  // 04 — Dijkstra run (final shortest path A -> F highlighted)
  await runAlgorithmToCompletion(page, {
    category: 'lucide-waypoints',
    label: 'Dijkstra',
    start: 'A',
    end: 'F',
  });
  await shot(page, '04-dijkstra-run.png', { minNodes: 6, note: 'Dijkstra shortest path A->F' });

  // 06 — Playback controls (replay the current run, pause mid-way)
  try {
    await page.locator('button:has(svg.lucide-rotate-ccw)').first().click(); // restart run
    await page.waitForTimeout(700);
    await page.locator('button:has(svg.lucide-pause)').first().click().catch(() => {}); // pause
    await page.waitForTimeout(400);
    const playbackCard = page.locator('button:has(svg.lucide-skip-forward)').first();
    await centerOn(page, playbackCard);
  } catch (e) {
    log(`  playback setup note: ${e.message}`);
  }
  await shot(page, '06-playback-controls.png', { note: 'paused mid-run, step controls active' });

  // 05 — A* Euclidean heuristic mode
  await runAlgorithmToCompletion(page, {
    category: 'lucide-waypoints',
    label: 'A*',
    start: 'A',
    end: 'F',
    astarIndex: 0, // euclidean is the first option
  });
  await shot(page, '05-astar-euclidean-mode.png', { minNodes: 6, note: 'A* with Euclidean heuristic' });

  // 07 — Floyd-Warshall distance matrix
  await runAlgorithmToCompletion(page, {
    category: 'lucide-waypoints',
    label: 'Floyd-Warshall',
  });
  // Bring the adjacency / distance matrix panel into view
  await centerOn(page, page.locator('table').first());
  await page.waitForTimeout(400);
  await shot(page, '07-floyd-warshall-matrix.png', { note: 'all-pairs distance matrix' });

  // 08 — MST visualization (Kruskal)
  await runAlgorithmToCompletion(page, {
    category: 'lucide-sprout',
    label: 'Kruskal',
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await centerOn(page, page.locator('[data-node-id]').first());
  await shot(page, '08-mst-visualization.png', { minNodes: 6, note: 'Kruskal MST highlighted' });

  // 10 — Algorithm comparison (history now has 4 runs)
  const comparePanel = page.locator('table').last();
  await centerOn(page, comparePanel);
  await page.waitForTimeout(400);
  await shot(page, '10-algorithm-comparison.png', { note: 'comparison of recent runs' });

  // 09 — Algorithm Mentor (open, switch to Mentor mode, ask 3 questions)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('button:has(svg.lucide-message-circle)').first().click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
  // Switch to the Mentor tab (second tab)
  await page.locator('[role="tab"]').nth(1).click().catch(() => {});
  await page.waitForTimeout(400);
  const mentorQuestions = [
    'Which algorithm should I use?',
    'Compare A* and Dijkstra',
    'Why was this node selected?',
  ];
  const chatInput = dialog.getByRole('textbox').first();
  for (const q of mentorQuestions) {
    // eslint-disable-next-line no-await-in-loop
    await chatInput.fill(q);
    // eslint-disable-next-line no-await-in-loop
    await chatInput.press('Enter');
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(600);
  await shot(page, '09-algorithm-mentor.png', { element: dialog, note: 'deterministic mentor Q&A' });
  // Close the chatbot so it doesn't overlay later shots
  await page.locator('button:has(svg.lucide-x)').first().click().catch(() => {});
  await page.waitForTimeout(300);

  // 12 — Printable report (print media shows the print-only report)
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(500);
  const printedOk = await shot(page, '12-printable-report.png', { fullPage: true, note: 'print media report' });
  await page.emulateMedia({ media: 'screen' });
  if (!printedOk) {
    // Fallback: capture the on-screen Export panel instead.
    await centerOn(page, page.locator('button:has(svg.lucide-printer)').first());
    await shot(page, '12-printable-report.png', { note: 'export & print panel (fallback)' });
  }

  await ctx.close();

  // ---- Albanian context: shot 11 ----------------------------------------
  const ctxSq = await makeContext('sq');
  const pageSq = await ctxSq.newPage();
  pageSq.setDefaultTimeout(15000);
  await pageSq.goto(`${baseUrl}/app`, { waitUntil: 'domcontentloaded' });
  await pageSq.locator('[data-node-id]').first().waitFor({ timeout: 20000 }).catch(() => {});
  await pageSq.waitForTimeout(2500);
  await setFastPlayback(pageSq);
  // Run Dijkstra so the Albanian report panel has real content
  await runAlgorithmToCompletion(pageSq, {
    category: 'lucide-waypoints',
    label: 'Dijkstra',
    start: 'A',
    end: 'F',
  });
  const sqLang = await pageSq.evaluate(() => document.documentElement.lang);
  await shot(pageSq, '11-albanian-language.png', {
    minNodes: 6,
    note: `Albanian UI (html lang="${sqLang}")`,
  });
  await ctxSq.close();

  await browser.close();
  if (server) server.close();

  // ---- Summary -----------------------------------------------------------
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok);
  fs.writeFileSync(
    MANIFEST,
    JSON.stringify({ baseUrl, mode, capturedAt: new Date().toISOString(), results }, null, 2)
  );
  log('');
  log(`Done. ${ok}/${results.length} screenshots OK. Source: ${mode} (${baseUrl}).`);
  if (bad.length) {
    log(`Needs attention: ${bad.map((b) => b.file).join(', ')}`);
    process.exitCode = 2;
  }
  log(`Manifest: ${path.relative(PROJECT_ROOT, MANIFEST)}`);
}

main().catch((err) => {
  log(`Fatal: ${err.stack || err.message}`);
  process.exitCode = 1;
});
