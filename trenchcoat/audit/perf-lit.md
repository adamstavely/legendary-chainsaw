# The Lit package against the React baseline

2026-10-26 · Remediation step 2.7. The same bench as [perf-baseline-react.md](perf-baseline-react.md) (scripts in
`scripts/perf/`), now mounting every ported piece through its React wrapper – what a React app gets from the
package. Same machine (Apple M4 Pro), Chromium headless through Playwright, no CPU throttling. Where a React file is
still in the repo (the 15 components blocks and screens import), it was measured again in the same session
(`BENCH_REACT=1`); the rest compare with the 2.1 numbers.

## Mount (every gallery demo, mounted 3×)

| | React (2.1) | Lit through the wrappers |
|---|---|---|
| Median first mount to first frame | 16.0 ms | 16.0 ms |
| Median warm mount to first frame | 15.6 ms | 15.6 ms |

Both are bound by the frame. The React "render" share drops from 3.4 to 0.9 ms (the wrappers render little; the
elements render in Lit's update).

## Large data

| Component / input | React | Lit | |
|---|---|---|---|
| data-table, 10,000 rows: mount to frame | 6.5 ms (same session) | 8.3 ms | |
| data-table, 10,000 rows: worst task while scrolling (sorted) | 3.6 ms (same session) | 6.1 ms | was 72.5 ms before the fix below |
| data-table, 10,000 rows: select all | 2.9 ms | 3.4 ms | was 66.7 ms |
| combobox, 5,000 options: open | 0.3 ms | 0.3 ms | 22 options in the DOM |
| command-menu, 5,000 commands: typing, worst task | 18.6 ms | 2.2 ms | |
| filter-menu, 5,000 options: mount | 112.8 ms (same session) | 7.0 ms | windowed (2.6): 288 nodes instead of 20,047 |
| agent-graph, 200 nodes / 5,000 calls: mount | 61.7 ms | 60.9 ms | |
| agent-queue, 4,000 jobs: mount | 42.5 ms | 39.9 ms | |
| trace-waterfall, 4,000 spans: mount | 6.7 ms | 11.2 ms | windowed, 600 nodes |
| fan-out-grid, 5,000 tasks: mount | 320.5 ms | 335.1 ms | not windowed – known cost, as in 2.1 |
| inline-diff, 5,000 words: mount / accept worst task | 23.7 / 131.3 ms (same session) | 19.2 / 131.2 ms | the accept relayout is the same in both |

**Fixed on the way:** data-table re-sorted all its rows on every update – each scroll step and each selection –
where the React version memoized the sorted view. It now sorts only when rows, sort or columns change. The React
wrapper also memoizes the row array it hands the element.

## Off-screen animations

5 of 121 demos keep infinite CSS animations running while scrolled away (6 at 2.1): screens/agent-run (React),
tool-call-card, ai-answer, plan-vs-actual and illustrations/agent-team – spinners and indicators that run while
their state lasts. dropzone no longer does.

## Size (each element bundled on its own, minified, Lit external)

| Library | Files | Median gzip, React (2.1) | Median gzip, Lit | Total gzip, React | Total gzip, Lit |
|---|---|---|---|---|---|
| components | 65 | 11.5 KB | 12.0 KB | 745 KB | 788 KB |
| illustrations | 22 | 5.7 KB | 8.8 KB | 179 KB | 230 KB |
| motion | 8 | 1.9 KB | 4.2 KB | 16 KB | 34 KB |

Each element's own bundle includes what it uses of the shared internals – the base class, controllers, look context
and style adoption, 4.4 KB gzip in all – which an app loads once; the React files included `src/internal` the same
way. That share is most of the difference for the small motion pieces. The Lit runtime is 8.0 KB gzip, once per
app, where React apps already carry React.

## Update budgets

`tests/elements/update-budgets.test.ts` replaces the React render budgets for the elements: all 104 elements mounted
at once with no props, then 3 s idle, counting Lit updates. Budgets (`tests/elements/update-budgets.json`) are the
recorded counts plus 30 % (at least 5). Five elements update while idle (agent-graph 3, plan-vs-actual 3,
thinking-loader 2, thinking-state 1, trace-waterfall 1); the rest don't. Recording them found compact-breakdown and
usage-meter running a frame-by-frame tween from 0 to 0 when empty – they now skip a tween with nothing to move.

The React smoke test keeps its commit budgets for the gallery demos (which include demo timers).

## Not measured here

Firefox, WebKit, 4× CPU throttling and INP are step 2.8.
