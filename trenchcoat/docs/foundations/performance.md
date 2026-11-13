<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

# Performance

Each component page has a **Performance** section: what the component costs to download, how long it takes to render
and update, how far it scales, and what it does when nobody's using it. The numbers come from `npm run measure:perf`
and live in `app/src/docs/perf.json`; each page says when it was measured.

*453 components measured, between 2026-10-27 and 2026-11-13, in headless Chromium 156.0.8078.4 on Apple M4 Pro.*

### Largest, on a page that has Lit

| Component | Gzip | Minified | Own code (gzip) |
| --- | --- | --- | --- |
| [generated-ui](../components/generated-ui.md) | 2626.2 KB | 10530.9 KB | 10.6 KB |
| [ai-side-pane](../blocks/ai-side-pane.md) | 163.1 KB | 687.1 KB | 11.2 KB |
| [small-multiples](../components/small-multiples.md) | 146.4 KB | 457.5 KB | 6.0 KB |
| [chart](../components/chart.md) | 143.0 KB | 447.5 KB | 2.4 KB |
| [ai-workspace](../blocks/ai-workspace.md) | 101.9 KB | 434.2 KB | 13.6 KB |
| [chat-composer](../components/chat-composer.md) | 86.8 KB | 372.7 KB | 32.1 KB |
| [trigger-builder](../components/trigger-builder.md) | 40.4 KB | 172.0 KB | 10.5 KB |
| [output-schema-builder](../components/output-schema-builder.md) | 39.8 KB | 159.4 KB | 12.3 KB |

### Slowest first render

| Component | First render | Update | DOM nodes |
| --- | --- | --- | --- |
| [activity-calendar](../components/activity-calendar.md) | 14.4 ms | 11.6 ms | 964 |
| [eval-scorecard](../components/eval-scorecard.md) | 9.7 ms | 1.3 ms | 1989 |
| [retrieval-inspector](../components/retrieval-inspector.md) | 9.7 ms | 0.6 ms | 1336 |
| [multi-calendar](../components/multi-calendar.md) | 9.1 ms | 1.5 ms | 1368 |
| [evaluation-dataset-editor](../components/evaluation-dataset-editor.md) | 8.3 ms | 2.4 ms | 1049 |
| [active-days](../components/active-days.md) | 7.9 ms | 5.2 ms | 718 |
| [network-graph](../components/network-graph.md) | 7.2 ms | 4 ms | 157 |
| [fan-out-grid](../components/fan-out-grid.md) | 6.6 ms | 0.7 ms | 176 |

## Bundle

Measured with esbuild, minified and gzipped, from the component's module:

- **This component alone** – its own module, with every import left out.
- **Shared code it pulls in** – Lit, the shared `internal/*` modules (base class, card header, controllers, styles) and
  any other component it renders (tool-configuration renders code-block and inline-diff). Shared code loads once per
  page, so a second component that uses the same modules adds only its own code. These rows show each part's share of
  the minified bundle.
- **Added to a page that already has Lit** – the component and everything it imports except Lit. This is the number
  to compare components by, and the one in each page's header.
- **With Lit** – the cost of the first Trenchcoat component on a page.

## Rendering

Measured in headless Chromium on `app/perf.html`, one component per page load:

- **First render** – a new element with the gallery demo's data, from being added to the page until it and every
  element inside it have finished updating and the page has laid it out (not painted). The median of 7 runs.
- **Typical update** – one item of its largest list replaced by a copy, or, with no list, a re-render with the same
  data: the least work any change costs.
- **First on the page** – the first instance, with default properties: it includes adding the component's CSS to the
  document, which happens once.
- **Scale** – windowed lists (data-table, chat-history, trace-waterfall…) are measured with **10,000 rows**, and say how
  many DOM nodes that makes. Other components with a list are measured at 100 and 1,000 items; the page says where a
  first render would pass 50 ms, the point where it blocks the page as a long task.

These are one machine's numbers – compare components with each other, not with your users' devices. A mid-range phone
is several times slower.

## Render budgets

`tests/render-budgets.json` holds each gallery demo's **render budget**: how many times React re-rendered it over 5
simulated seconds when the baseline was recorded. The smoke test fails when a demo goes 30 % over (and at least 15
commits), and when anything re-renders on most animation frames. The budgets measure the demos, so a demo that streams
or ticks has a high one; the component's own cost is the timings above. `UPDATE_BUDGETS=1 npm test` re-records them
after an intended change.

## Runtime

Each page lists, from the source, the timers and animation-frame loops the component runs, its infinite CSS
animations, the observers it creates, the page-level listeners it adds and whether it reads the clock – and whether it
stops off screen, in a hidden tab or under reduced motion. `measure:perf` then counts animation frames and timer
callbacks per second with the demo's data: on screen, scrolled far away, and with `prefers-reduced-motion: reduce`. A
component that shows 0 when scrolled away and under reduced motion costs nothing while it waits.

## Keeping it current

- `npm run measure:perf` measures every component (about 15 minutes); `npm run measure:perf -- <slug>` measures one, and
  `-- --missing` only those without an entry or whose code changed since.
- Each entry keeps a hash of the component's bundle. `check:docs` warns when a page has no entry or a stale one – a
  component added or changed since the last run is "not measured yet", not a failure. With `PERF_STRICT=1` it fails
  instead, for a pipeline that runs `npm run measure:perf -- --missing` first (the CI workflow is
  `.github/workflows/trenchcoat-ci.yml` at the repository root).
