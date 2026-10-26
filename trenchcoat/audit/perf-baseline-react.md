# React baseline for the Lit port

2026-10-26 · Remediation step 2.1. The React numbers the Lit elements are measured against (lit-port-plan.md,
acceptance check 7 and 8, and remediation step 2.7). Commit `c41f3fb` (Part 1 merged), Apple M4 Pro, Chromium
headless through Playwright, production React 19.3, no CPU throttling. Scripts: `scripts/perf/` (see its README);
raw output in `.perf/` (not committed).

## Bundle size (each published file bundled on its own, esbuild, minified)

| Library | Files | Median min | Median gzip | Total min | Total gzip |
|---|---|---|---|---|---|
| components (Standard files; Clean twins are the same size) | 64 | 53.7 KB | 11.5 KB | 3,603 KB | 745 KB |
| illustrations | 22 | 15.0 KB | 5.7 KB | 513 KB | 179 KB |
| motion | 8 | 5.1 KB | 1.9 KB | 40 KB | 16 KB |
| blocks (not ported) | 11 | 29.0 KB | 8.3 KB | 343 KB | 105 KB |
| screens (not ported) | 15 | 27.4 KB | 8.0 KB | 385 KB | 116 KB |

Components grew from a 44.7 KB median at the perf audit: the accessibility pass, the pattern tokens' longer
`var()` references, and Part 1's forced-colours block and spacing tokens. Each file still carries both looks, its
token fallbacks and its own copy of the `src/internal` helpers – the Lit package drops the last two.

## Mount (every demo, mounted 3×)

Median first mount to first frame 16.0 ms (render 3.4 ms); warm 15.6 ms (render 1.3 ms).

## Large data

| Component / input | Mount (to frame) | Interaction | DOM |
|---|---|---|---|
| data-table, 200 rows | 29.5 ms | – | 678 nodes (windowed from 60 rows) |
| data-table, 10,000 rows | 6.4 ms | – | 678 nodes |
| combobox, 5,000 options | 9.7 ms | open 0.3 ms, 3 forced layouts (0.3 ms); typing ≤ 1.7 ms | 22 options in DOM |
| command-menu, 5,000 commands | 8.4 ms | typing ≤ 3.5 ms (max task 18.6 ms) | 200 results shown |
| filter-menu, 5,000 options | 114.4 ms (one 106 ms task) | toggle 0.3 ms | 20,047 nodes – not windowed (remediation 2.6) |
| agent-graph, 200 nodes / 5,000 calls | 61.7 ms | tick 6.4 ms + 3.4 ms layout | 2,630 |
| agent-queue, 4,000 jobs | 42.5 ms | tick 8.5 ms + 6.3 ms layout | 1,131 |
| trace-waterfall, 4,000 spans | 6.7 ms | tick 1.8 ms | 600 (windowed) |
| fan-out-grid, 1,000 tasks | 60.7 ms | select 0.4 ms | 1,033 |
| fan-out-grid, 5,000 tasks | 320.5 ms (layout 215 ms) | tick 6.1 ms + 25 ms layout; select 29 ms | 5,033 |
| inline-diff, 5,000 words | 26.9 ms | accept 0.4 ms (37 ms layout) | 2,545, 1,008 changes |

fan-out-grid at 5,000 tasks is slower than at the audit (6.4 + 159 ms): decision C spaces the cells 24 px apart,
so the grid is about 2.25× the area. It isn't windowed; that stays a known cost for very large fan-outs.

## Animations

6 of 121 demos keep infinite CSS animations running while scrolled away (25 at the audit): screens/agent-run,
tool-call-card (spinner), ai-answer, dropzone, plan-vs-actual and illustrations/agent-team. Most are spinners or
indicators that run only while their state lasts.
