# Porting ztd-charts to Trenchcoat

Source: https://github.com/Junhan2/ztd-charts (MIT, © 2026 Junhan2), read at its `main` of 2026-11-06. It has 33 chart types
as React components, with a framework-free core underneath (scales, layouts, data parsing, a spring motion engine and a
JSON chart spec) and CLI and MCP tools that render through React on the server.

The port turns the charts into Trenchcoat Lit elements – light DOM `TcElement`, Standard and Clean looks, tokens only,
the gallery, React wrappers, Angular, docs and tests – and brings the core, the spec, server rendering and the agent
tools with them.

## Decisions

- **D1 · Keep ours where they overlap.** Gauge, Heatmap, Radar Chart and Sparkline stay as they are; ztd's versions
  aren't ported. Anything ztd does that ours don't (listed in Part 6) is added to ours instead.
  Breakdown Chart (stacked bars with pickers) and KPI Chart (a metric card) are specific; ztd's general Bar, Line and
  Area are ported as new.
- **D2 · One chart engine.** The framework-free modules move to `src/elements/internal/chart/`, translated to English
  and tidied to our style, each with a header crediting ztd-charts. `THIRD-PARTY-NOTICES.md` carries the MIT notice and
  ships in the package.
- **D3 · A chart base, not a hook.** `TcChartElement` (`internal/chart/element.ts`) does what `useChart` and
  `ChartFrame` did: measures its width (ResizeObserver), starts the entrance when on screen (IntersectionObserver), follows
  `prefers-reduced-motion`, keeps the active mark, handles the keyboard (one tab stop; arrows, Home/End, Enter, Escape),
  shows the tooltip, announces, and renders the header, the Table view and the empty state. Each chart supplies
  `model()` (marks and events from the data) and `draw()` (SVG from the motion's current values).
- **D4 · Motion as a controller.** `MotionController` wraps ztd's `MotionEngine`: one shared rAF loop, a
  `requestUpdate()` per frame only while something moves, the entrance held until on screen, data changes gliding
  from where they are. Off (snapped) under reduced motion or `animate="false"`.
- **D5 · Our colours, ztd's restraint.** ztd paints one accent and leaves the rest neutral. We keep that – `highlight`
  picks what's emphasised – but paint with our tokens: emphasis is `--tc-chart-1` against `--tc-chart-neutral`;
  categorical series take `--tc-chart-1…6` in order. Every chart routes its inks through component tokens
  (`--tc-<ui>-ink-1…`) so a page can override them. Text never sits on a fill whose contrast we can't guarantee: value
  labels go beside marks, or on fills checked by `check:contrast`.
- **D6 · Our shell.** Charts use `cardHead` (icon, heading, description, aside with the legend and a Table button) and
  the Standard tray / Clean card, like Radar Chart. `bare` drops the card for charts placed inside other components.
  Type, spacing, radii, durations and easings are tokens; the tooltip uses the shared inverse surface.
- **D7 · Names.** `tc-<kind>-chart` where "chart" reads naturally (`tc-bar-chart`, `tc-pie-chart`), the kind alone
  where it doesn't (`tc-treemap`, `tc-sankey`, `tc-calendar-heatmap`). Gallery category: a new **Charts** section;
  existing charts stay in Data & charts.
- **D8 · Data in our shape.** Props take rows plus accessors as ztd does (`data`, `x`, `y`, `series`), so the spec maps
  straight onto them. Times are epoch ms or ISO strings. Labels the page can rename and `locale` as elsewhere; ztd's
  Korean strings are dropped.
- **D9 · Canvas fallback stays.** Beeswarm, Bubble, Calendar and Parallel switch to canvas above a mark count, as ztd
  does; the canvas reads its colours from the resolved tokens.
- **D10 · Spec and server.** `tc-chart` draws any chart from a JSON spec (ztd's spec shape, its option names accepted).
  Every chart already has a generative-UI schema, so models place charts through Generated UI's component blocks;
  the spec route is for tools and data. Server rendering builds the chart off-screen and turns its own Lit template
  into a string (no browser, no Lit SSR), the tokens resolved for a look and theme. The CLI and MCP commands join the
  existing `trenchcoat` and `trenchcoat-mcp` rather than separate binaries.

## Parts (one PR each, merged on green)

1. **Foundation** – the engine (scales, geometry, series, stack, format, text, data parsing, highlight, motion),
   `TcChartElement`, `MotionController`, axes and grid, tooltip, legend, Table view, the notices file; with **Bar**,
   **Line / Area** and **Pie / Donut** as the first charts.
2. **Comparison** – Lollipop, Dumbbell, Slope, Bump, Bullet, Segmented, Waterfall, Pareto.
3. **Part-to-whole and flow** – Waffle, Funnel, Marimekko, Treemap, Sunburst, Sankey, Chord.
4. **Distribution and time** – Box, Beeswarm, Ridgeline, Bubble, Candlestick, Stream, Calendar Heatmap,
   Parallel Coordinates, Radial Bar. (Line and Area Chart's drag-to-select range, left out of Part 1, shipped in
   Part 2.)
5. **Spec, server and agents** – `tc-chart`, the schema in generative UI, `renderChartToSVG`, the CLI and the MCP
   server.
6. **Fold into ours** – what ztd's Gauge, Heatmap, Radar and Sparkline have that ours lack: Radar's ring count, round
   rings and motion; Gauge's ticks variant; Heatmap's legend words and canvas; Sparkline's last value.

## Status

- [x] Part 1 (#76)
- [x] Part 2
- [x] Part 3
- [x] Part 4
- [x] Part 5
- [x] Part 6
