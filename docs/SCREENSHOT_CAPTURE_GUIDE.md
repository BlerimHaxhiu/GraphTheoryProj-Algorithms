# Screenshot Capture Guide

Automated, reproducible portfolio screenshots via Playwright.

- **Script:** `tools/screenshots/capture-demo.js`
- **Command:** `npm run demo:screenshots`
- **Output:** `docs/screenshots/*.png` + `docs/screenshots/capture-manifest.json`

---

## Quick start

```bash
npm install                 # installs playwright (devDependency)
npx playwright install chromium   # one-time browser download
npm run build               # produces the static export in out/
npm run demo:screenshots    # captures + verifies all 12 screenshots
```

That's it. The script prints an `OK / BAD` line per screenshot and a summary.

## How it works

1. **Source detection.** It first probes for a running app at
   `http://localhost:9002`, `:3000`, and the `127.0.0.1` equivalents. If one is
   live, it uses it.
2. **Static fallback.** If no dev server is running, it serves the static export
   in `out/` from a tiny built-in Node HTTP server on an ephemeral port (no extra
   dependency). This is the recommended, most deterministic path.
3. **Deterministic seeding.** Before each page loads, it seeds `localStorage`:
   - `app-language` → `en` (or `sq` for the Albanian shot)
   - `grafiShqipGraph` → a fixed 6-node weighted demo graph (A–F)
   so the workspace always renders the same graph and the same results.
4. **Real interaction.** It drives the actual UI — opens the algorithm controls,
   selects algorithms, picks start/end nodes, switches the A\* heuristic mode,
   runs to completion, exercises playback, opens the Mentor, switches language.
   Nothing is mocked or faked.
5. **Verification.** Each capture is rejected (marked `BAD`) unless the file is a
   sane size **and** the page had real content (e.g. ≥ 6 graph nodes for
   workspace shots). Results are written to `capture-manifest.json`.

## If the app is not running

The script tells you exactly what to do and exits non-zero:

```
No running app detected and no static export found in out/.
  Option A (static, recommended):  npm install  &&  npm run build
  Option B (dev server):           npm install  &&  npm run dev
Then:  npm run demo:screenshots
```

## The demo graph

Six nodes (A–F) with nine undirected weighted edges, placed inside the 800×600
canvas. It is designed so the demos are clear:

- **Shortest path A → F:** `A → C → B → D → E → F`, total weight **13**.
- **Minimum spanning tree:** `{B-C, A-C, D-E, E-F, B-D}`, total weight **13**.

## Captured screenshots

| File | Scene |
| --- | --- |
| `01-landing-page.png` | Landing / hero |
| `02-main-workspace.png` | Full workspace with the seeded graph |
| `03-graph-editor.png` | Editor + algorithm controls |
| `04-dijkstra-run.png` | Dijkstra shortest path A→F |
| `05-astar-euclidean-mode.png` | A\* with the Euclidean heuristic |
| `06-playback-controls.png` | Paused mid-run, step controls active |
| `07-floyd-warshall-matrix.png` | All-pairs distance matrix |
| `08-mst-visualization.png` | Kruskal MST highlighted |
| `09-algorithm-mentor.png` | Deterministic Mentor Q&A |
| `10-algorithm-comparison.png` | Comparison of recent runs |
| `11-albanian-language.png` | Albanian (SQ) UI |
| `12-printable-report.png` | Printable / export report |

## Configuration

- **Viewport:** 1440×1000 (`VIEWPORT` in the script).
- **Browser:** Chromium (headless).
- To target a specific running instance, start it on port 9002 or 3000 before
  running the script; otherwise it serves `out/` itself.

## Troubleshooting

- *"browserType.launch: Executable doesn't exist"* → run `npx playwright install chromium`.
- *A shot is marked `BAD`* → check `capture-manifest.json` for the reason
  (size/`minNodes`/error). Re-run after `npm run build`; ensure no stale dev
  server is interfering on Windows (a running `next dev` can lock `.next`).
- *Blank graph* → confirm the build is current (`npm run build`) so the latest UI
  is in `out/`.
