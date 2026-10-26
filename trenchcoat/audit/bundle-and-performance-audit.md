# Trenchcoat – bundle size and runtime performance audit

Date: 2026-10-25 · Commit `ad3e428` (working tree had uncommitted edits in `blocks/` from parallel work; block numbers are a snapshot) · Apple M4 Pro, Node 24.4, esbuild 0.25.12, Vite 6.4.5, Playwright 1.64 / Chromium headless, React 19.3.1 production build.

## Verdict

- **Components are small per file but mostly CSS.** The median published component is **44.7 KB min / 9.3 KB gzip / 8.3 KB brotli**. **73 % of the minified bytes are the CSS string.** That CSS ships **both looks**, so about **35 % of every file (18 % gzipped) is the look you don't use**. The token-fallback blocks are another **16 % (10 % gzipped)**. The inlined `src/internal` helpers are only **1.4 %**, so a shared runtime package isn't worth the change.
- **`-clean.tsx` files are byte-for-byte copies of the Standard file apart from one constant.** Each file already has both looks' CSS, so a consumer who copies both pays twice for nothing.
- **Runtime is mostly healthy:**
  - Mount takes 1–3 ms per component, with a median sync render+commit of 2.9 ms cold and 1.2 ms warm.
  - CSS is injected **once per document**, not once per instance.
  - Mount/unmount leaves nothing behind.
  - Virtualisation in data-table works.
  - Common interactions force almost no layout.
- **The real runtime problem is CSS animation, not React.**
  - Infinite `background-position` shimmers aren't composited and keep running off-screen.
  - The cost grows with item count. Idle CPU is **37 % for fan-out-grid with 1,000 tasks** and **93 % with 5,000**. trace-waterfall uses **~100 % CPU with 1,000 spans**, on- or off-screen.
  - 25 of 123 demos keep infinite CSS animations running while scrolled away.
- **trace-waterfall isn't virtualised.** With 1,000 spans each `elapsed` tick costs ~90 ms (11.5 ms React plus 77 ms layout). With 4,000 spans it costs ~300 ms.
- **combobox, command-menu and filter-menu render every option.** This works up to ~500 options. At 5,000, opening the combobox is a 112 ms task and the first keystroke in command-menu costs ~170 ms.
- **The gallery entry chunk is 7.8 MB (1.74 MB gzip).** 92 % of that is two icon packs pulled in by the icon-comparison page: `import * as` Hugeicons, plus lucide's `icons` map. That page is imported statically.

## Method

All scripts are in `/private/tmp/claude-501/-Users-adamstavely-Lockin-resolve/79595907-1212-49ec-9fe0-d84778023bc8/scratchpad/perf-audit/`, and all runs started from there. Nothing in the repo was changed except this report.

| What | How | Measured / estimated |
|---|---|---|
| Per-file size | `bundle.mjs`: esbuild bundle of each published file (187 files), `minify`, ESM, `NODE_ENV=production`. External: `react`, `react-dom`, `lucide-react` and `@/components/ui/*` (siblings counted separately). Sizes are gzip -9 and brotli q11 of the output. | Measured |
| Cost split | Each part is the size difference after removing it from the source and rebundling. Removed in turn: (a) all `/* css */` template bodies; (b) the fallback block plus the `var(--tc-x, var(--_tc-x))` → `var(--tc-x)` rewrite; (c) the inlined `src/internal` section (replaced by an external import). JS logic = total − CSS − internals. | Measured (differences between bundles, so parts don't add up exactly under gzip) |
| Build options | Same pipeline with the change applied to the source. CSS minify uses esbuild's CSS minifier on each template, with `${}` kept. "One look" removes the rules whose selectors only target the other `data-look`. "Lean" combines tokens.css, CSS minify and one look. | Measured on the transformed source; the transforms are prototypes, not build changes |
| Multi-component cost | `combo.mjs`: one esbuild bundle exporting 1 / 5 / 10 / 64 components, siblings resolved, each option applied | Measured |
| Gallery | `npx vite build --outDir <scratch>/dist`, plus a sourcemap build attributed per source with `source-map-js` (`srcmap.mjs`) | Measured |
| Runtime | `bench/`: one esbuild page bundling every demo with production React. `react-dom/client` is aliased to `react-dom/profiling` so `<Profiler>` counts commits. `window` listeners, `document` listeners, RO/IO/MO, timers and rAF are instrumented. Driven by Playwright Chromium (1280×900, `tokens.css` loaded). Timings come from `performance.now()` in the page, CDP `Performance.getMetrics` and CDP traces. "Forced layout" means a `Layout` event nested inside a JS event. | Measured; desktop CPU, no throttling |

## Bundle size

### Per library (each file bundled on its own, as a consumer copies it)

| Library | Files | Min total | Gzip total | Brotli total | Median min | Median gzip | CSS share of min | Fallbacks (min) | Inlined helpers (min) |
|---|---|---|---|---|---|---|---|---|---|
| components (Standard + Clean) | 129 | 5,872 KB | 1,270 KB | 1,116 KB | 44.6 KB | 9.3 KB | 73 % | 958 KB (16 %) | 81 KB |
| components, Standard only | 64 | 2,920 KB | 631 KB | 554 KB | 44.7 KB | 9.3 KB | 73 % | 479 KB | 40 KB |
| blocks | 11 | 324 KB | 98 KB | 86 KB | 27.8 KB | 7.8 KB | 51 % | – | – |
| screens | 15 | 355 KB | 108 KB | 94 KB | 25.2 KB | 7.6 KB | 50 % | – | – |
| illustrations | 24 | 644 KB | 237 KB | 209 KB | 12.9 KB | 4.8 KB | 24 % | – | – |
| motion | 8 | 35 KB | 15 KB | 13 KB | 4.6 KB | 1.8 KB | 51 % | – | – |
| **all 187 files** | 187 | 7,230 KB | 1,728 KB | 1,518 KB | 35.9 KB | 8.8 KB | 66 % | 958 KB | 81 KB |

Notes:

- Smallest components: thinking-loader (12.7 KB min / 3.7 KB gz), reaction-bar (13.3 / 3.8), change-summary (14.1 / 3.1) and button (19.0 / 4.3). CSS is 85–87 % of button, tips-panel, parallel-attempts and change-summary.
- The gzipped size of every Standard component: review-center 22.4, chat-composer 22.3, agent-queue 21.2, agent-graph 18.7, agent-cursors 17.7, integration-picker 14.5, decision-tree 14.4, trace-waterfall 14.3, stepper-form 13.5, data-table 13.2, memory-panel 13.1, agent-plan 12.6, ai-answer 12.6, … down to change-summary 3.1 (KB).

### Largest 20 files

Standard/Clean pairs are listed once; the Clean twin is identical in size. Units are KB. "CSS" is the CSS string without the fallbacks; "fallbacks" is the generated block plus the per-use `var(…, var(--_tc-…))`. "Other look" is what removing the unused look's rules saves.

| File | min | gzip | brotli | JS logic | CSS | fallbacks | internals | other look |
|---|---|---|---|---|---|---|---|---|
| illustrations/region-dach | 149.5 | 48.9 | 42.6 | 143.1 | 6.4 | – | – | – |
| illustrations/project-flow | 135.9 | 56.9 | 52.4 | 110.7 | 25.1 | – | – | – |
| components/review-center | 112.6 | 22.4 | 19.4 | 30.7 | 66.6 | 14.4 | 0.9 | 35.2 |
| components/chat-composer | 104.6 | 22.3 | 18.7 | 40.6 | 56.3 | 7.1 | 0.5 | 29.6 |
| components/agent-queue | 101.8 | 21.2 | 18.5 | 32.1 | 55.2 | 13.8 | 0.8 | 31.8 |
| components/agent-cursors | 81.3 | 17.7 | 15.7 | 21.2 | 48.3 | 11.3 | 0.5 | 27.1 |
| components/agent-graph | 80.8 | 18.7 | 16.6 | 28.7 | 40.9 | 10.3 | 0.9 | 22.5 |
| components/stepper-form | 72.4 | 13.5 | 11.8 | 14.8 | 46.3 | 10.8 | 0.5 | 27.7 |
| components/trace-waterfall | 71.9 | 14.3 | 12.6 | 17.5 | 42.9 | 10.7 | 0.8 | 23.5 |
| screens/app-shell | 68.5 | 16.4 | 14.3 | 19.8 | 48.7 | – | – | – |
| components/decision-tree | 66.8 | 14.4 | 12.7 | 20.0 | 35.9 | 10.3 | 0.6 | 18.7 |
| components/memory-panel | 65.3 | 13.1 | 11.6 | 19.0 | 36.2 | 9.3 | 0.8 | 23.2 |
| components/agent-plan | 63.7 | 12.6 | 11.2 | 17.1 | 37.2 | 8.6 | 0.7 | 21.9 |
| components/integration-picker | 59.9 | 14.5 | 12.5 | 18.7 | 31.2 | 8.3 | 1.7 | 20.5 |
| components/context-map | 58.1 | 12.0 | 10.6 | 14.0 | 34.6 | 9.0 | 0.5 | 19.5 |
| components/data-table | 58.0 | 13.2 | 11.7 | 18.8 | 29.7 | 8.7 | 0.8 | 19.3 |
| components/ai-answer | 57.9 | 12.6 | 11.2 | 16.0 | 32.7 | 8.4 | 0.7 | 18.8 |
| components/date-range-picker | 56.2 | 11.2 | 9.9 | 13.0 | 33.6 | 8.9 | 0.7 | 21.2 |
| components/usage-meter | 55.1 | 11.5 | 10.2 | 13.8 | 31.6 | 9.0 | 0.8 | 19.7 |
| components/email-draft | 53.5 | 9.7 | 8.4 | 8.9 | 33.8 | 10.0 | 0.8 | 23.6 |

### Dependencies through `@/components/ui/*`

Measured full closures (own file plus every sibling it pulls in), min / gzip:

- screens/agent-run: 330 / 69 KB. It pulls in button, agent-plan, tool-call-card, approval-card, inline-diff, thinking-loader and app-shell.
- screens/evals: 237 / 50 KB.
- screens/settings-billing: 228 / 48 KB.
- screens/app-shell: 129 / 27 KB. It pulls in filter-menu and setup-guide.
- blocks/ai-workspace: 148 / 33 KB (chat-composer).

Every screen pays for app-shell (68.5 KB) plus its own dependencies.

### Duplication and what a consumer pays for several components

Measured as one esbuild chunk containing the set (gzip/brotli over the whole chunk), compared with the sum of the individual files. min / gzip / brotli, KB:

| Set | As shipped | Shared `src/internal` runtime | tokens.css, no fallbacks | CSS minified | tokens + minified | tokens + minified + shared runtime | CSS extracted (JS left) | Sum of single files |
|---|---|---|---|---|---|---|---|---|
| 1 (button) | 19.1 / 4.4 / 3.9 | 19.6 / 4.5 / 4.0 | 14.5 / 3.7 / 3.2 | 16.5 / 3.9 / 3.4 | 12.2 / 3.2 / 2.8 | 12.6 / 3.3 / 2.9 | 2.6 / 1.3 / 1.2 | 19.1 / 4.4 / 3.9 |
| 5 (button, segmented-control, combobox, data-table, toaster) | 187.6 / 41.6 / 31.9 | 186.4 / 41.1 / 31.8 | 157.2 / 37.2 / 30.3 | 167.0 / 37.0 / 28.7 | 138.4 / 32.7 / 27.2 | 137.2 / 32.3 / 27.2 | 56.4 / 19.9 / 17.9 | 187.5 / 44.9 / 39.7 |
| 10 (+ command-menu, filter-menu, date-range-picker, chat-composer, tool-call-card) | 467.2 / 99.1 / 68.8 | 461.3 / 96.6 / 68.6 | 401.4 / 90.0 / 66.4 | 418.8 / 88.4 / 62.4 | 356.7 / 79.1 / 60.2 | 350.8 / 76.8 / 59.9 | 150.5 / 49.7 / 40.8 | 466.8 / 106.4 / 92.9 |
| all 64 | 2,931 / 586 / 347 | 2,889 / 567 / 345 | 2,452 / 521 / 338 | 2,620 / 521 / 317 | 2,166 / 459 / 308 | 2,124 / 442 / 305 | 800 / 258 / 200 | 2,927 / 635 / 559 |

How to read this table:

- **Repetition across files is real but only partly recoverable.** For all 64 components, one brotli stream is 347 KB against 559 KB for the separate files, so about 38 % of the bytes repeat across files. The repeats are fallback blocks, the same `:where([data-look=…], [data-look=…] *)` prefixes, ~24 near-identical shimmer keyframes and the helpers. gzip's 32 KB window recovers only 8 %. A real app splits code by route, so it won't get the brotli figure.
- **Standard vs Clean files:** 100 % duplicate (they differ only in `DEFAULT_LOOK`). Shipping both copies doubles the cost and adds no capability, because the `look` prop already switches looks inside one file.
- **Inlined helpers:** 40 KB min / 20 KB gzip across all 64 components, about 0.6 KB min per file. All of `src/internal` bundled together is only 4.6 KB min / 2.1 KB gz.

**Savings per option** (Standard components; the 5- and 10-component sets are measured as single chunks):

| Option | Per median file | 5 components | 10 components | All 64 (per-file sum) | Behaviour change |
|---|---|---|---|---|---|
| Ship `tokens.css` and drop the fallbacks | ~16 % min, ~10 % gz | −30.4 KB min / −4.3 KB gz | −65.8 / −8.9 | −479 / −61 | Needs tokens.css (25.8 KB min / **3.6 KB gz** once). Net win from about 4 components, or immediately if the app loads tokens.css anyway for theming. The single-file promise ends unless the fallbacks stay opt-in. |
| Minify the CSS strings at build time | 11 % min, 9.5 % gz | −20.6 / −4.5 | −48.4 / −10.4 | −311 / −60 (brotli −48) | None at runtime. The published source becomes harder to read and edit, and readable source is the selling point of a copy-paste library. Better as a second "min" output or a consumer-side plugin. |
| Drop the look the file doesn't default to | 35 % min, 18 % gz | −63.2 / −7.7 | −154 / −18.9 | −1,021 / −116 | `look="clean"` on a Standard file stops working. Needs per-look files that truly contain one look, with the `look` prop documented as "the file's look". The biggest single win. |
| Shared runtime package for `src/internal` | ~0.6 KB min | −1.2 / −0.5 | −5.9 / −2.5 | −42 / −20 | Breaks self-containment. **Not worth it.** |
| CSS extraction to `.css` files | 0 bytes saved (moved) | JS falls to 56 KB min / 20 KB gz; the rest becomes 131 KB min / 22 KB gz of cacheable CSS | JS 150 / 50 | JS 800 / 258 | No runtime `<style>` hoisting, CSS parsed in parallel and cached separately. Breaks the single-file model. Runtime gain is small (see "CSS injection cost" below: 0.5–2 ms per stylesheet). |
| All of the above except extraction ("lean") | −47 % min, −27 % gz (median 23.1 KB min / 6.7 KB gz) | 102 / 33 (from 187 / 45) | 263 / 78 (from 466 / 106) | 1,553 / 458 (from 2,920 / 631) | All of the above. |

### lucide-react

- **Imports are named and tree-shakeable.** Only `screens/*` import lucide; no component, block, illustration or motion file does. All 14 importing files use named `import { XIcon } from "lucide-react"`, and `lucide-react@1.55.0` declares `"sideEffects": false`.
- **Cost per icon set.** The runtime (`createLucideIcon`, `Icon`, defaults) is 4.1 KB min / 1.8 KB gz once. Each icon then adds 216–379 bytes min, ~300 on average.
  - agent-chat: 28 icons, 13.7 KB min / 4.9 KB gz. It also builds custom icons with `createLucideIcon`.
  - agent-run: 23 icons, 11.4 / 4.2.
  - app-shell: 21 icons, 10.1 / 3.7.
  - crm: 21 icons, 10.6 / 3.9.
  - assistant-home: 20 icons, 11.0 / 4.1.
  - settings-billing: 18 icons, 9.7 / 3.7.
  - The rest are smaller.
  - The union across all screens is 95 icons, 36.3 KB min / 11.0 KB gz.
- **The one non-tree-shakeable use is in the gallery:** `app/src/IconCompare.tsx:4` imports the `icons` map, which is every lucide icon (see the next section).

### Gallery app (`vite build`)

| | Size | gzip |
|---|---|---|
| Whole `dist/assets` (186 files) | 15.0 MB | 3.46 MB |
| Entry chunk `index-*.js` | **7,980 KB** | **1,766 KB** |
| 185 lazy chunks (one per library file, Standard and Clean apart) | 7.2 MB | 1.72 MB |

Sourcemap attribution of the entry chunk:

| Source | Size | Share |
|---|---|---|
| `@hugeicons/core-free-icons` | 6,225 KB | 79.9 % |
| `lucide-react` | 937 KB | 12.0 % |
| react-dom | 206 KB | 2.6 % |
| demos | 168 KB | – |
| screens/app-shell, components/filter-menu, components/setup-guide | ~130 KB | – |
| registry plus README `?raw` | ~50 KB | – |

- **The icon packs** come in through `app/src/IconCompare.tsx:2` (`import * as Huge from "@hugeicons/core-free-icons"`) and `:4` (`import { icons as lucide }`). `app/src/App.tsx:3` imports that page statically.
- **app-shell, filter-menu and setup-guide end up in the entry chunk** because 3 screen demos import runtime values (`Tabs, SectionHead, SearchField`) from `@/components/ui/app-shell`. The affected demos are `app/src/demos/screens/app-shell-flat.tsx:3`, `app-shell-workspace.tsx:3` and `app-shell-workspace-flat.tsx:3`.
- **Library files are code-split; demos are not.** Each library file is its own lazy chunk (`import.meta.glob` without `eager`). Demos are `eager: true` (`app/src/registry.ts`), which costs ~170 KB, so that is acceptable.
- **Estimated gain:** lazy-loading IconCompare should bring the entry chunk to about 600 KB (≈ −92 %). Moving the three app-shell imports onto `ui` should bring it to about 480 KB.

### Other heavy content

- **`illustrations/region-dach.tsx`: 131 KB of SVG path strings, 143 KB of the 149.5 KB minified.** It holds outlines for DACH, the US, China, India, Brazil and Japan (land plus neighbours; `CN_NEIGHBORS` alone is 27.9 KB). All six regions ship although one is shown at a time. Coordinates are 1-decimal; the neighbour outlines that fade out could be simplified hard.
  - Options: split each region into its own module loaded on demand, or simplify the neighbour paths.
  - Estimated saving: 60–80 % of the file.
- **`illustrations/project-flow.tsx:733-751`: 19 data-URI assets.** 58.6 KB are base64 PNGs ("memoji" avatars, a framer logo) and 22.7 KB are URL-encoded SVGs, inline in JS (base64 also inflates the bytes ~33 % and compresses badly). This is why project-flow has the worst gzip ratio in the repo (135.9 KB min → 56.9 KB gz).
  - Fix: inline SVG elements, or separate image files.
  - Estimated saving: ~60 KB min / ~35 KB gz.
- **Dead CSS (static spot-check, `deadcss.mjs`).** Every `.ui-…` class in the CSS was checked against the JS part of the same file, allowing for template-built class names.
  - **Components:** effectively no dead class rules. The only hit is `ui-agt__sum-wait` / `ui-agt__sum-fail` in `src/components/agent-tree.tsx:1008-1009` (174 bytes). Their only use is as `__portal` fallback roots.
  - **Screens:** the hits there are overrides of child components' classes (e.g. `.ui-kpi`, `.ui-dt`) and are live.
  - **The real dead CSS is the unused look:** 1,021 KB min across the 64 Standard files, measured above.
  - Not done: a full runtime "selector never matched" pass across all states.
- **Dev-only code left in production.**
  - **Bug:** `src/internal/use-controllable.ts:15-16` reads `globalThis.process?.env?.NODE_ENV`.
    - Bundlers only replace the literal `process.env.NODE_ENV`, so this check is never folded.
    - In a Vite or browser bundle `globalThis.process` is undefined, so the guard is `undefined !== "production"`. **The "controlled without handler" warning therefore fires in production**, and its text stays in 54 of 64 files.
    - Fix: `process.env.NODE_ENV !== "production"` behind a `typeof process !== "undefined"` guard.
  - **Production warnings by design:** chat-composer (`src/components/chat-composer.tsx:134`), comments-panel (`:95`), email-draft (`:101`), dropzone (`:125`), message-actions (`:121`), integration-settings (`:80`) and writing-assistant (`:91`) warn once per page about simulated behaviour. These look intended for production; if not, gate them the same way.
- **Shimmer keyframes are re-implemented in ~24 files.** Examples are `ui-*-sweep` and `ui-*-shimmer` in agent-lanes:795, agent-queue:1928, ai-answer:1485, review-center:2249 and fan-out-grid:625. This is size duplication, and it is the cause of the main runtime finding below.

## Runtime performance

### Mount cost and CSS injection (measured)

- **Demo mount.** Each demo was mounted 3× in one page. Times are sync render + commit + layout effects (`flushSync`), plus a forced style/layout.
  - Components: median **2.9 ms** cold (first mount, with its CSS parsed and the code JIT-compiled), **1.2 ms** warm. All 64 component demos together: 294 ms cold, 105 ms warm.
  - Slowest cold: agent-cursors 19.5 ms (1.7 warm), screens/settings-billing 15.3 (7.2), blocks/agent-gallery 12.2 (7.0; 861 nodes), agent-steering 12.1 (2.4), screens/agent-chat 11.8, billing-schedule 10.8, agent-queue 10.8 (4.1).
- **`<style>` injection.** Every component uses React 19 `<style href=… precedence="default">`, which **deduplicates per document**. With 1, 10 and 100 instances there was exactly **one** `<style data-href="ui-button">` (likewise segmented-control, data-table and toaster).
- **CSS parse and recalc for one stylesheet** (inserted with the demo mounted, then a forced recalc): button 16.5 KB 0.5–1.5 ms, toaster 21.6 KB 0.2–0.5, segmented-control 22.9 KB 0.7–1.2, data-table 38.4 KB 0.9–1.2, chat-composer 63.4 KB 1.7–1.9, review-center 80.9 KB 1.4–2.2.
- **N instances** (fresh page per N; cold includes the first CSS insert; warm is a second mount in the same page):

  | Component | 1 | 10 | 100 | Per instance at 100 (warm) | Observers |
  |---|---|---|---|---|---|
  | button | 3.8 ms cold / 0.4 warm | 4.3 / 0.3 | 6.0 / 1.2 (+2.4 layout) | 0.012 ms | 1 ResizeObserver per instance (`src/components/button.tsx:138`) |
  | segmented-control | 11.5 / 0.8 | 17.9 / 5.9 | 35.7 / 22.0 | 0.22 ms | 1 RO per instance (`src/components/segmented-control.tsx:198`); measures in layout effects |
  | data-table (8 rows) | 13.8 / 1.6 | 24.8 / 7.9 | 83.2 / 78.7 | 0.8 ms | 1 RO per instance |
  | toaster (inline) | 4.2 / 0.4 | 5.1 / 0.6 | 7.7 / 1.7 | 0.017 ms | 1 `visibilitychange` listener on `document` per toaster |

  Per-instance cost is linear, and the stylesheet is not re-injected. One RO per button is fine at this scale. A shared observer would only matter for tables with hundreds of buttons.

### Steady state (render budgets re-read, measured in Chromium)

Each of the 123 demos ran 2 s after a 0.7 s settle, in view and then pushed 4,000 px below the fold. The run counted React commits per second (Profiler), rAF callbacks, timer callbacks and CDP task/layout metrics (`steady.mjs`).

**Highest values in `tests/render-budgets.json`** (commits per 5 simulated seconds):

| Demo | Budget | Browser commits/s | Driver |
|---|---|---|---|
| plan-vs-actual:clean | 51 | 10.5 | Demo: `setInterval(…, 100)` → `setNow` (`app/src/demos/plan-vs-actual.tsx:52`) |
| agent-cursors | 50 | 9 | Demo: `setTick` interval (`app/src/demos/agent-cursors.tsx:113`) |
| blocks/kpi-board | 49 | **0** | Steady state; the jsdom figure covers start-up (the roll-in on mount) |
| illustrations/agent-team | 43 | **0** | Writes to the DOM, pauses off-screen; same as kpi-board |
| fan-out-grid | 36 | 8.5 | Demo interval (`app/src/demos/fan-out-grid.tsx:81`); the component's own 1 s clock adds ~1/s |
| agent-tree | 32 | 6 | Demo: `setNow` every 250 ms (`app/src/demos/agent-tree.tsx:91`) |
| screens/agent-run | 30 | 8 | Demo-driven |
| ai-answer | 27 | 7 | Demo streams words every 160 ms (`app/src/demos/ai-answer.tsx:62-63`) |
| permission-request | 21 | 4 | Demo: 250 ms interval |
| agent-graph, agent-queue | 19 | 3.5 / 1.5 | Demo data plus the components' own clocks |

**The remaining high budgets are demo-driven.** Off-screen commit rates equal in-view rates because the demos keep pushing props. The components re-render only when their props change.

Recommendations:

- Record budgets per demo *and* with a static-props harness, so component regressions aren't hidden by demo traffic.
- Re-record kpi-board and agent-team.

**Per-frame work that ignores visibility:**

| Demo | Component code | In view: rAF/s, CPU % | Off-screen: rAF/s, CPU % | Severity |
|---|---|---|---|---|
| ai-answer | `src/components/ai-answer.tsx:751-772` | 52, 4.8 % | **52, 4.2 %** | Medium. The writing loop keeps running every frame while `streaming` with nothing left to reveal, which is busy-waiting. There is no `useOnScreen`. |
| context-map | `src/components/context-map.tsx:428-430` | 42, 3.9 % | **42, 3.5 %** | Medium. The `moving` loop keeps running while the target changes; the demo changes it every interval. |
| agent-tree | `src/components/agent-tree.tsx:392-401` (`follow`) | 35, 2.8 % | **36, 2.7 %** | Low–Medium. The connector follow loop is re-armed by every data update, even off-screen. |
| approval-card | `src/components/approval-card.tsx:136-153` | – | **60 rAF/s** | Low–Medium. Each frame updates a countdown whose text changes once per second. One 1 s timeout (or a frame loop only for the last second) would do. |
| context-window | `src/components/context-window.tsx:193-197` | – | 20 rAF/s | Low. A tween runs per data change, demo-driven. |
| tool-call-card | `src/components/tool-call-card.tsx:561` | 50 interval callbacks/s | 50/s (no-ops) | Low. A 10 Hz interval per running card keeps firing off-screen with nothing to paint; clear it when IO reports off-screen. |

Components that pause properly off-screen (rAF dropped to 0): agent-queue, agent-lanes, agent-graph, usage-meter, glow-cloud, frost-cloud, voice-orb, integration-beam, testimonial-wall, logo-marquee, number-ticker and others.

### CSS animations (the biggest runtime cost)

`anims-all.mjs` checked `document.getAnimations()` for each demo while it was off-screen. **25 of 123 demos keep infinite CSS animations running.** Most of them animate `background-position` (the shimmer sweep), which is not composited and needs style recalc and paint every frame. Others animate `width`, `height` (ai-answer, parallel-attempts: layout every frame), `filter`, `box-shadow` or `stroke-dashoffset`.

| Demo | Infinite animations off-screen | Non-composited properties |
|---|---|---|
| screens/agent-run | 26 | filter, stroke-dashoffset, background-position |
| thinking-loader | 18 | background-position |
| trace-waterfall | 11 | background-position |
| fan-out-grid | 10 | background-position (+ box-shadow and background-color transitions) |
| motion/shimmer-loader | 10 | background-position |
| agent-queue | 8 | background-position, filter |
| parallel-attempts | 8 | **width** (60 layouts/s, on- or off-screen) |
| ai-answer | 5 | **height**, background-position, filter |
| plan-vs-actual, tool-call-card, agent-cursors, agent-steering, agent-tree, thinking-state, review-center, agent-lanes, context-map | 1–5 each | background-position |

The cost grows with data, because there is one animated pseudo-element per running item (`anim.mjs`, 3 s idle after mount):

| Case | Running animations | CPU in view | CPU off-screen | Style recalc time per second |
|---|---|---|---|---|
| fan-out-grid, 100 tasks | 40 | 3.2 % | 3.2 % | 9 ms/s |
| fan-out-grid, 1,000 tasks | 400 | **36.6 %** | **36.8 %** | 85 ms/s, plus 55 ms/s layout |
| fan-out-grid, 5,000 tasks | 3,274 | **93.5 %** | **93.4 %** | 71–139 ms/s, plus 108–212 ms/s layout |
| trace-waterfall, 100 spans (2/3 running) | 216 | **32.2 %** | 15.5 % | 141 ms/s |
| trace-waterfall, 1,000 spans | 2,416 | **100 %** | **99.6 %** | 625 ms/s |

- **Sources:** `src/components/fan-out-grid.tsx:569,572` (`.ui-fog__cell[data-status="running"]::before`, `background-position` sweep, `@keyframes ui-fog-cell-sweep` at :625) and `src/components/trace-waterfall.tsx:1190,1210` (`ui-tw-shine`, `ui-tw-pulse`, `ui-tw-spin`).
- **Corroborating CPU profile:** fan-out-grid with 5,000 tasks spent 3,021 ms of 3.2 s in "(program)", which is native style and paint work, and only single-digit milliseconds in JS.
- **otp-input and parallel-attempts' sweep (`ui-pa-sweep`) already use `transform: translateX`.** That is the pattern to copy. parallel-attempts still animates `width` elsewhere.

### Large-data behaviour (measured, `large.mjs`)

Times are in-page `performance.now()`. "Forced" means `Layout` events inside JS, from a CDP trace.

| Component / input | Mount | Interaction | DOM | Scaling |
|---|---|---|---|---|
| data-table, 200 rows (not virtualised) | **42.5 ms**, 1 long task (50 ms) | sort 0.9 ms | 3,463 nodes, 200 rows | – |
| data-table, 201 rows | 4.3 ms | sort 0.4 ms, select-all 0.3 ms | 677 nodes, 37 rows | **Cliff at `VIRTUAL_FROM = 200`** (`src/components/data-table.tsx:115`): 200 rows costs 10× more than 10,000 |
| data-table, 1,000 rows | 3.8 ms | sort 0.3 ms; scroll 10×1,500 px: 34–50 rows in DOM, 0 forced layouts, max task 4.3 ms | 677 nodes | Flat ✓ |
| data-table, 10,000 rows | 4.5 ms | sort 0.3 ms, select-all 3.0 ms, scroll max task 5.2 ms | 677 nodes | Flat ✓ (virtualisation verified) |
| combobox, 100 options | 3.8 ms | open: 4 forced layouts, 8.7 ms; type 7 chars: 0.3–1.4 ms each | 100 options | – |
| combobox, 1,000 | 0.7 ms (closed) | open: 4 forced, 7 ms, task 20 ms; first keystroke 6.8 ms + 6.6 ms layout | **1,000 options rendered** | Linear |
| combobox, 5,000 | 1.2 ms | open: **task 112 ms**, 41 ms forced layout; first keystroke **32 ms + 33.5 ms layout**; long task 194 ms | 5,000 options | Linear, no windowing (`src/components/combobox.tsx:445-510`) |
| command-menu, 1,000 commands | 24.6 ms | first keystroke 15.5 ms, 4 forced layouts (14.6 ms) | 5,020 nodes | Linear |
| command-menu, 5,000 | **126.5 ms** | first keystroke **83.7 ms** + 88 ms forced layout; **max task 245 ms** | 25,020 nodes | Linear, no windowing (`src/components/command-menu.tsx:706-712`) |
| filter-menu, 1,000 options | 19.1 ms | toggle 0.2 ms | 4,046 nodes | Linear |
| filter-menu, 5,000 | **95.4 ms** + 37 ms layout | toggle 0.2 ms | 20,046 nodes | Linear (`src/components/filter-menu.tsx:138`) |
| agent-graph, 20 nodes / 200 calls | 7 + 3.3 ms | `now` tick 0.9 ms; node click 2 forced layouts, 1.4 ms | 262 | – |
| agent-graph, 200 nodes / 5,000 calls | 29.5 + 17.2 ms | tick 6.5 + 2.8 ms; click 0.8 ms forced | 2,225 | Linear ✓ (the call index from Phase 4 holds) |
| agent-queue, 1,000 jobs | 21.9 + 19.5 ms | tick 4.7 + **18.5 ms layout** | 2,005 (capped) | – |
| agent-queue, 4,000 jobs | 33.2 + 19.8 ms | tick 9.8 + 20.9 ms layout | 2,005 (capped) | Sub-linear ✓; layout per tick is the cost |
| trace-waterfall, 100 spans | 4.7 + 9.8 ms | `elapsed` tick 1.4 + 7.6 ms layout | 1,762 | – |
| trace-waterfall, 1,000 spans | 21 + **89 ms layout** (task 112 ms) | **tick 11.5 ms + 77 ms layout**; collapse 3.2 ms | 17,131 | Linear, no virtualisation |
| trace-waterfall, 4,000 spans | 82 + **427 ms** (task 544 ms) | **tick 60 ms + 248 ms layout** | 68,270 | Linear, but each tick re-lays out every bar |
| fan-out-grid, 1,000 tasks | 1.7 + 28.4 ms | tick 1.2 + 3.8 ms | 1,033 | – |
| fan-out-grid, 5,000 tasks | 6.4 + 159 ms | tick 5 + 35 ms; select 28 ms; long tasks up to 835 ms come from the animations above | 5,033 | Linear (no windowing; the cells are tiny) |
| inline-diff, 500 / 1,000 words | 3–6 ms / 11 ms | `diffWords` alone: 2.2 ms / 8.9 ms | 240 / 440 | **O(n·m)** LCS (`src/components/inline-diff.tsx:110-135`) |
| inline-diff, ≥1,500 words | 0.6–8 ms | – | 44 nodes, **9 marks instead of ~300** | `MAX_CELLS = 4,000,000` (`:99`) turns the whole middle into one replacement. Fast, but a silent UX cliff. |

Notes on the table:

- **Nothing is quadratic in time** within the tested ranges, apart from inline-diff's LCS, which is capped.
- **The O(n) components are fine up to a few hundred items.** Above that, the cost is DOM size: no windowing in combobox, command-menu, filter-menu or trace-waterfall.
- **trace-waterfall is the one that hurts in normal use.** A running trace updates `elapsed` continuously, and every bar's `left`/`width` is a `calc()` against the range, so every tick re-lays out every row.
- The first inline-diff measurement in the batch run (124 ms layout at 500 words) didn't reproduce in a fresh page (1 ms). It was a cold effect and is excluded.

### Layout during common interactions (measured, `interact.mjs`)

- **Opening menus is cheap.** Opening or clicking the first control in profile-menu, filter-menu, date-range-picker, model-picker, combobox, message-actions, segmented-control, reaction-bar, command-menu and integration-picker gave 0 forced layouts in 9 of 10. message-actions had 1 (0.1 ms). The longest task was ≤ 2 ms, except profile-menu at 25 ms, which was a single task.
- **Combobox opening** (the real `[role=combobox]` click in the large-data run) always takes **4 forced layouts**: 8.7 ms at 100 options, 41 ms at 5,000. It positions the popover after rendering all options. Rendering fewer options, or reading geometry before writing, would fix it.
- **Typing** in combobox and command-menu forces 1–4 layouts per sequence; this only matters at 1,000+ options.
- **Resizing the viewport** 5 times (1280 → 760 → 1280) with chat-composer, segmented-control, data-table, review-center, agent-graph, context-map or screens/crm mounted gave 0 forced layouts, max task ≤ 1.5 ms. Caveat: the harness host has a fixed 1,100 px width, so most of these components did not change size.

### Memory and leaks (measured, `leak.mjs`, `leak2.mjs`)

- **Mount/unmount cycles left nothing behind.** Every demo was mounted and unmounted 200 times (component demos) or 50 times (blocks, screens, illustrations, motion), after 2 warm-up cycles, followed by GC. The following were all **0 after the cycles, for all 123 demos**:
  - live `window`/`document` listeners;
  - live ResizeObserver, IntersectionObserver and MutationObserver instances;
  - live intervals, pending timeouts and pending rAF;
  - CDP `Nodes` and `JSEventListeners` deltas.
- **The heap plateaus.** It doesn't grow with cycles (KB after each batch of 200):
  - agent-cursors 9,495 → 10,544 → 10,627 → 10,652 → 10,653
  - review-center 10,653 → 11,123 → 11,184 → 11,205 → 11,209
  - chat-composer 11,209 → 11,566 → 11,636 → 11,780 → 11,783
  - toaster 11,783 → 11,614 → 11,618 → 11,636 → 11,637

  The first step is JIT and code caches.
- **Module-level state, checked statically.** `toaster` keeps one module store (`src/components/toaster.tsx:128-133`; `resetToasts()` exists for tests). button keeps a `WeakMap` of icon ids (`src/components/button.tsx:177`). usage-meter keeps an `Intl` formatter cache (`src/components/usage-meter.tsx:115,122`; it grows with each distinct locale/options key, which is fine). Several components keep once-per-page "warned" flags. No unbounded registries were found.

## Findings by severity

**High**

1. **Non-composited infinite CSS animations run off-screen and scale with item count.** fan-out-grid 1,000 tasks uses 37 % CPU idle and 5,000 tasks 93 %. trace-waterfall uses 32 % (in view) / 15 % (off) with 100 spans and 100 % with 1,000. 25 of 123 demos are affected; 24 component files define `background-position` sweeps. *(fan-out-grid.tsx:569-572,625; trace-waterfall.tsx:1190-1210; agent-queue.tsx:1928; ai-answer.tsx:1485; review-center.tsx:2249; …)*
2. **trace-waterfall has no row windowing, and each `elapsed` tick re-lays out all bars.** 1,000 spans: 141 ms mount and ~89 ms per tick. 4,000 spans: 644 ms mount and ~308 ms per tick.
3. **The gallery entry chunk is 7.8 MB / 1.74 MB gzip**, 92 % of it icon packs from a statically imported, rarely visited page. *(app/src/App.tsx:3, app/src/IconCompare.tsx:2,4)*

**Medium**

4. **Every file ships both looks.** The unused look is 35 % of minified bytes (1.0 MB across the 64 Standard components). The `-clean.tsx` twins are pure duplicates.
5. **Fallback blocks in every file** add 16 % min / 10 % gzip (479 KB / 61 KB across 64 components), compared with 3.6 KB gzip for tokens.css.
6. **combobox, command-menu and filter-menu render every option.** 5,000 options: combobox opens in a 112 ms task; command-menu mounts in 127 ms with a 245 ms task on the first keystroke; filter-menu mounts in 95 ms. combobox open costs 4 forced layouts.
7. **data-table virtualisation cliff:** 200 rows takes 42.5 ms to mount; 201 rows takes 4.3 ms. *(data-table.tsx:115)*
8. **rAF loops not tied to visibility.** ai-answer busy-waits at 60 fps while streaming (`ai-answer.tsx:751-772`). approval-card's countdown runs at 60 fps for a once-a-second label (`approval-card.tsx:136-153`). context-map (`:428`) and agent-tree's `follow` (`:392-401`) keep going off-screen.
9. **The dev warning in `useControllable` is never stripped and fires in production browser bundles.** *(src/internal/use-controllable.ts:15-16)*
10. **Large inline data:** region-dach has 131 KB of path strings for 6 regions; project-flow has 81 KB of data URIs, 58.6 KB of them base64 PNG.

**Low**

11. **One ResizeObserver per instance** in button, segmented-control and data-table. Measured cost is small: 100 buttons take +1.2 ms and 100 segmented controls 22 ms.
12. **tool-call-card's 10 Hz interval keeps firing (as a no-op) off-screen.** *(tool-call-card.tsx:561)*
13. **inline-diff's 4 M-cell cap** silently turns texts over ~1,500 words into one replacement. The LCS itself is O(n·m): 8.9 ms at 1,000 words, ~35 ms just under the cap, run during render.
14. **CSS strings aren't minified:** 11 % min / 9.5 % gzip.
15. **Render budgets mix demo traffic with component behaviour.** kpi-board (49) and agent-team (43) show 0 commits/s at steady state in a real browser.
16. **Shimmer keyframes are duplicated** in ~24 files. Shared `src/internal` code is *not* a meaningful cost (0.6 KB per file).

## Prioritised fix list

| # | Fix | Expected gain | Effort |
|---|---|---|---|
| 1 | Gallery: `lazy(() => import("./IconCompare"))` in `App.tsx`, and render Hugeicons by name from a small subset. Optionally move the 3 runtime imports in the app-shell screen demos onto `ui`. | Entry chunk 7.98 MB → ~0.6 MB (−92 %), ~1.7 MB → ~0.2 MB gzip (estimate) | XS |
| 2 | One composited shimmer pattern for all ~24 files: animate `transform: translateX` on a pseudo-element (as otp-input and parallel-attempts' `ui-pa-sweep` do). Pause with `[data-offscreen] … { animation-play-state: paused }` from the existing `useOnScreen`. In fan-out-grid and trace-waterfall, cap shimmering items (e.g. first 20 running), or use one sweep over the grid instead of one per cell. Replace the `width`/`height` keyframes in parallel-attempts and ai-answer. | fan-out-grid 1,000: ~37 % → low single digits; trace-waterfall 1,000 spans: ~100 % → low single digits; off-screen demos to ~0 (estimate) | M (mechanical, many files) |
| 3 | trace-waterfall: window rows like data-table. Position and scale bars with `transform` (`translateX`/`scaleX`) under one container-level range variable, so a tick doesn't invalidate layout. | 1,000-span tick ~89 ms → < 10 ms; mount 141 ms → ~10 ms (estimate) | M |
| 4 | Build: emit truly single-look files (`button.tsx` = Standard only, `button-clean.tsx` = Clean only), or add an opt-in `--one-look` output. Document that `look` then picks only from the looks in the file. | −35 % min / −18 % gzip per file; −1.0 MB min / −116 KB gzip across 64 | S (build-lib already scopes by `data-look`), plus a breaking-change note |
| 5 | Windowing for combobox, command-menu and filter-menu above ~200–300 options, reusing data-table's `useRowWindow` idea (move it to `src/internal`). Read the combobox popover geometry once, before writes. | 5,000 options: open 112 ms → < 10 ms, first keystroke 245 ms → < 16 ms (estimate) | M |
| 6 | data-table: lower `VIRTUAL_FROM` to ~50–60. | 200 rows 42.5 ms → ~5 ms | XS (check keyboard and visual tests) |
| 7 | rAF hygiene: ai-answer stops looping when caught up and restarts when text grows; approval-card uses a 1 s timer (rAF only in the last second if needed); pause context-map, agent-tree `follow` and context-window off-screen; tool-call-card clears its interval while off-screen. | Off-screen idle work → 0 for these; ~4 % CPU each in the demos | S |
| 8 | Fix the env check in `src/internal/use-controllable.ts` (`typeof process !== "undefined" && process.env.NODE_ENV !== "production"`). | Correct production behaviour; ~0.3 KB less per file after DCE | XS |
| 9 | Opt-in fallback-free output (consumer loads tokens.css). | −16 % min / −10 % gzip per file; net positive from ~4 components | S |
| 10 | Optional minified-CSS output (keep the readable source as the default copy-paste file). | −11 % min / −9.5 % gzip | S |
| 11 | region-dach: one module per region loaded on demand, or simplified neighbour outlines. project-flow: inline SVG or separate image files instead of base64 PNGs. | region-dach −60–80 %; project-flow ~−60 KB min / ~−35 KB gzip (estimate) | S |
| 12 | Render budgets: also measure each component with static props (no demo timers); re-record kpi-board and agent-team. | Budgets catch component regressions, not demo cadence | S |
| 13 | inline-diff: Myers O(ND) diff instead of a capped LCS table. Or at least show "too long to compare word by word" when the cap is hit. | Diffs of long texts stay granular; less work in render | M |
| – | **Not recommended:** a shared runtime package for `src/internal` (saves ~0.6 KB per file, 20 KB gzip across all 64, and breaks self-containment); CSS extraction purely for performance (stylesheet parse is 0.5–2 ms once per document). | – | – |

## Measured vs estimated, and what wasn't measured

- **Measured:**
  - every size in the bundle tables, savings tables, lucide numbers and gallery build;
  - mount, instance, steady-state, large-data, interaction, animation and leak numbers (Chromium headless on an M4 Pro, production React, no CPU throttling).
- **Estimated:** the "expected gain" column (apart from rows 4, 6, 9 and 10, which come from the measured transforms), and the gallery entry size after the fixes (derived from sourcemap attribution).
- **Not measured:**
  - **Other bundlers and browsers:** webpack, Next.js and Turbopack builds (esbuild stands in for "a consumer's bundler"); Firefox and Safari.
  - **Slower hardware:** mobile or throttled CPUs. Expect roughly 4–6× slower times on a mid-range phone.
  - **INP:** real user input latency via the Event Timing API (in-page dispatch timing and traces were used instead).
  - **Fallback blocks at runtime:** tokens.css was loaded in the harness, so the fallback custom properties weren't exercised; their style-resolution cost is unmeasured but expected to be negligible.
  - **Resize:** only a fixed-width host was tested.
  - **Dead CSS:** a full runtime "never-matching selector" pass across all interactive states (only a static class check was done).
  - **Accuracy of the cost split:** the JS / CSS / fallback / internals split comes from rebuilding with each part removed. Under gzip the parts interact, so they don't sum exactly.
  - **Block sizes:** `blocks/` was being edited while this ran, so those numbers are a snapshot.
- **Reproduce:** run, in `/private/tmp/claude-501/-Users-adamstavely-Lockin-resolve/79595907-1212-49ec-9fe0-d84778023bc8/scratchpad/perf-audit/`:
  - `bundle.mjs`, `report-sizes.mjs`, `combo.mjs`, `lucide.mjs`, `srcmap.mjs`, `deadcss.mjs`;
  - `bench/build.mjs`, then `bench/{mount,instances,steady,large,anim,anims-all,interact,leak,leak2,follow}.mjs`.

  Raw results are in `sizes.json`, `combo.txt` and `bench/*.json`.
