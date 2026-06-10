# Screenshot Capture Report

**Captured:** 2026-06-10
**Tool:** `tools/screenshots/capture-demo.js` (Playwright + Chromium)
**Command:** `npm run demo:screenshots`
**Source served:** static export `out/` via the script's built-in HTTP server
(no dev server was running on 9002/3000; the script fell back to `out/`).
**Base URL used:** `http://127.0.0.1:<ephemeral>` (local static server)
**Viewport:** 1440 × 1000

## Result: 12 / 12 captured and verified ✅

Every screenshot passed automated verification (file size ≥ 4 KB, expected node
count present, correct language) **and** was visually reviewed to confirm it
shows real application UI — not a blank or error page.

| File | Scene | Verified content |
| --- | --- | --- |
| `01-landing-page.png` | Landing / hero | "Build. Run. Understand graphs.", 8+ algorithms, CTA, particles |
| `02-main-workspace.png` | Full workspace | Controls + canvas + matrix + panels with the seeded 6-node graph |
| `03-graph-editor.png` | Editor + controls | Algorithm controls expanded (Shortest Path category) |
| `04-dijkstra-run.png` | Dijkstra | Start A (green) / End F (red); history: "Shortest path: A → C → B → D → E → F. Weight: 13" |
| `05-astar-euclidean-mode.png` | A\* Euclidean | A\* Mode = "Euclidean heuristic"; history: "Best path (A\*, euclidean): … Cost: 13" |
| `06-playback-controls.png` | Playback | Paused mid-run; Resume / Previous / Next / Restart controls |
| `07-floyd-warshall-matrix.png` | Floyd–Warshall | All-pairs distance matrix + report |
| `08-mst-visualization.png` | Kruskal MST | history: "MST: B-C, A-C, D-E, E-F, B-D. Total weight: 13" |
| `09-algorithm-mentor.png` | Algorithm Mentor | Mentor tab active; deterministic Q&A ("Which algorithm should I use?") |
| `10-algorithm-comparison.png` | Comparison | Compare panel with multiple runs (Dijkstra, A\*, Floyd–Warshall, Kruskal) |
| `11-albanian-language.png` | Albanian (SQ) | Fully localized UI ("Vizualizuesi i Algoritmeve te Grafeve", `html lang="sq"`) |
| `12-printable-report.png` | Printable report | Print-media report: title, algorithm, nodes/edges, rendered graph |

## Failures

None. All 12 captured on the first verified run.

## Notes / honesty log

- Screenshots are of the **production static build** (`npm run build` → `out/`),
  so they reflect the deployed app exactly (same code path as Netlify).
- The demo graph is seeded deterministically via `localStorage` so results are
  reproducible (shortest path and MST both total weight 13 by design).
- A real i18n bug was found *via* this capture pass — the MST result summary in
  Execution History rendered the raw key `messages.mstSummary`. It was fixed
  (`src/app/app/page.tsx` now uses the existing `algorithmSteps.mstSummary`
  key) and the screenshots were re-captured. See `08-mst-visualization.png`.
- `12-printable-report.png` is produced with Playwright print-media emulation,
  which is what the app's print stylesheet targets; it is the genuine printable
  report, not a mock.

## Manual fallback

If the automated run cannot launch a browser (e.g., CI without Chromium):

```bash
npm install
npx playwright install chromium
npm run build
npm run demo:screenshots
```

If you prefer to capture against a live dev server instead of the static export:

```bash
npm run dev            # http://localhost:9002
# in another shell:
npm run demo:screenshots
```

The script auto-detects the dev server on ports 9002/3000 and uses it; otherwise
it serves `out/` itself. See `docs/SCREENSHOT_CAPTURE_GUIDE.md` for details.
