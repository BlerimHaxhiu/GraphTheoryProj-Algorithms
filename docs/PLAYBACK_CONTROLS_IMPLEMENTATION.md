# Playback Controls Implementation

Date: 2026-06-09

Scope: manual algorithm playback controls for the GraphTheoryProj-Algorithms app.

## Files Changed

- `src/app/app/page.tsx`
- `src/components/graph/PlaybackControls.tsx`
- `src/lib/playback-utils.ts`
- `src/lib/translations.ts`
- `tests/playback-utils.test.js`
- `package.json`
- `README.md`
- `docs/CURRENT_STATE_AUDIT.md`
- `docs/ARCHITECTURE_OVERVIEW.md`
- `docs/TESTING_STRATEGY.md`
- `docs/DOCUMENTATION_INDEX.md`

## State Model

Playback state is owned by `src/app/app/page.tsx`.

Tracked state:

- `algorithmStepsQueue`: remaining steps after the current playback position.
- `algorithmStepsHistory`: full immutable step list for the current run.
- `currentStepIndex`: selected step index in `algorithmStepsHistory`.
- `currentAlgorithmStep`: step currently driving canvas and matrix highlighting.
- `algorithmReportLog`: visible report entries up to `currentStepIndex`.
- `playbackIntroStep`: initial "Starting algorithm" report entry.
- `playbackCompletionStep`: generated completion message.
- `isPlaybackRunning`: auto-play interval is active.
- `isPlaybackPaused`: run is paused for manual stepping.
- `isPlaybackFinished`: run reached completion.

Refs mirror the step/history/index state so the interval callback can advance reliably without stale closures.

## UI Behavior

The playback controls are shown directly above the algorithm report panel.

Controls:

- Pause: stops the auto-play interval.
- Resume: restarts auto-play from the current step.
- Previous Step: moves one step backward when playback is not running.
- Next Step: moves one step forward when playback is not running.
- Restart Run: clears the current visualization, report, queue, and playback state without changing the graph.

The existing Run button still starts auto-play immediately.

## Report And Visualization Behavior

The app rebuilds the report log from:

```text
intro step + steps[0..currentStepIndex] + optional completion step
```

This keeps the report consistent when moving backward or forward.

The graph canvas and matrix continue to use `currentAlgorithmStep`, so manual stepping uses the same visual contract as auto-play.

## Edge Cases

- No algorithm run yet: controls are disabled.
- Algorithm finished: resume and next are disabled; previous and restart remain available.
- New algorithm run: previous playback state is cleared and a new step history is created.
- Graph cleared: playback state is cleared.
- Graph edited after a run: playback state is cleared so old highlights do not apply to changed graph data.
- Algorithm validation error: report shows the error and Restart Run can clear it.

## Tests

Added `npm run test:playback`.

Covered helper behavior:

- step index clamping,
- next/previous index calculation,
- report log slicing up to the selected step,
- optional completion message appending,
- progress label formatting.

## Manual Test Checklist

Run the app with `npm run dev`, open `/app`, then:

1. Generate or draw a graph.
2. Run BFS and confirm auto-play starts.
3. Click Pause and confirm graph/report stop advancing.
4. Click Next Step and confirm graph, matrix, and report advance one step.
5. Click Previous Step and confirm graph, matrix, and report move back one step.
6. Click Resume and confirm auto-play continues.
7. Let the run finish and confirm completion appears once.
8. From the finished state, click Previous Step and confirm completion disappears.
9. Click Restart Run and confirm highlights/report/playback state clear while graph remains.
10. Start a new algorithm and confirm old playback state is replaced.
11. Edit the graph after a run and confirm old playback state clears.
12. Switch language and confirm playback labels are translated.

## Remaining Limitations

- Manual stepping is not covered by browser/e2e tests yet.
- The canvas still visualizes the selected/current step rather than accumulated visited history.
- Floyd-Warshall matrix update steps are still reported, but the visible matrix remains the base adjacency matrix.
- Keyboard shortcuts for playback controls are not implemented.
