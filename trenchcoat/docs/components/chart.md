<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Chart

**Charts** · New

Any of the library's charts from a JSON spec – checked first, then drawn with the chart the spec names; what's wrong shown instead of a chart; the same specs draw as SVG on a server

- **Element:** `<tc-chart>`
- **Size:** 143.0 KB gzip · 447.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/chart";` |
| React / Next.js | `import { Chart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/chart";` · tags starting with tc- are custom elements |
| Angular | `import { Chart } from "@adamstavely/trenchcoat/angular/chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/chart";` |

## Example

The live example is in the gallery at `#/chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Any of the library's charts from a JSON spec – the kind a tool, a server or a model writes. A spec names the chart
(`type`: "bar", "line", "sankey"…), gives its data (rows, `{ values }`, `{ csv }` or `{ url }`), maps the chart's
channels to fields (`encoding`) and sets its options:

```json
{ "type": "bar", "title": "Samples processed", "data": [{ "lab": "Genomics", "samples": 182 }],
  "encoding": { "x": "lab", "y": "samples" }, "options": { "unit": " samples" } }
```

The spec is checked first: an unknown type, data in the wrong shape, or a channel naming a field the rows don't have is
shown as a list of what's wrong, and reported in `tc-spec-check`, instead of a chart. Then the chart the spec names is
loaded and drawn inside this element. Only properties the chart declares are set, so a spec from outside the page can't
reach anything else. `{ url }` data is fetched first. Specs written for ztd-charts draw as they are – its option names
(`showRates: false`, `animate: false`) are understood. Ported from ztd-charts (MIT).

Specs also draw the library's own Gauge, Heatmap, Radar Chart and Sparkline: their rows are reshaped into those
elements' properties (a heatmap's long rows into its matrix, say). The same specs draw as standalone SVG without a
browser – `renderChartToSVG` in `@adamstavely/trenchcoat/charts`, `trenchcoat chart render` on the command line, or `render_chart`
in the MCP server – except those four, which are drawn in pages only. `suggestCharts` proposes specs for a table.

### When to use

- Charts described as data: from a server, a report definition, a tool, or a model's answer.
- One element that can become any chart, as the data or the reader's choice changes.

### When not to use

- A chart in your own code – use its element (`<tc-bar-chart>`, `<tc-line-chart>`…) directly, with its typed properties.
- A model's whole answer with text, tables and charts – use [Generated UI](generated-ui.md), whose component blocks place charts.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Problem** `.ui-cht__problem` – what's wrong with the spec, in place of the chart

## Looks

It has no look of its own: the chart inside takes the look from the page, or from `look` on this element. The problem
box is a dashed card in the text inks.

## Usage

### HTML

```html
<tc-chart></tc-chart>

<script type="module">
  import "@adamstavely/trenchcoat/chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-chart").spec = {
    type: "bar",
    title: "Samples processed",
    data: [{ lab: "Genomics", samples: 182 }, { lab: "Imaging", samples: 96 }],
    encoding: { x: "lab", y: "samples" },
  };
</script>
```

### React / Next.js

```tsx
import { Chart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const spec = { type: "bar", title: "Samples processed", data: [{ lab: "Genomics", samples: 182 }], encoding: { x: "lab", y: "samples" } };

export function Samples() {
  return <Chart spec={spec} onSpecCheck={(check) => console.log(check.valid)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcChart } from "@adamstavely/trenchcoat/chart";

defineProps<{ spec: TcChart["spec"] }>();
const onSpecCheck = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-chart :spec="spec" @tc-spec-check="onSpecCheck"></tc-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Chart } from "@adamstavely/trenchcoat/angular/chart";
import type { TcChart } from "@adamstavely/trenchcoat/chart";

@Component({
  selector: "app-chart-example",
  imports: [Chart],
  template: `<tc-chart [spec]="spec()" (tc-spec-check)="onSpecCheck($event)"></tc-chart>`,
})
export class ChartExample {
  readonly spec = input.required<TcChart["spec"]>();
  onSpecCheck(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcChart } from "@adamstavely/trenchcoat/chart";

  let { spec }: { spec: TcChart["spec"] } = $props();
  let el: TcChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-spec-check", on);
    return () => el.removeEventListener("tc-spec-check", on);
  });
</script>

<tc-chart bind:this={el} {spec}></tc-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `spec` | – | `ChartSpec \| null` | `null` | The chart as JSON: { type, data, encoding?, options?, title?, description? } |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-spec-check` | – | No | The spec was checked ({ valid, errors, warnings }: ChartSpecCheck) |

#### Design tokens it reads (13)

`--tc-border-strong`, `--tc-card-radius`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-strong`, `--tc-line-height-normal`, `--tc-space-1-5`, `--tc-space-4`, `--tc-surface-raised`, `--tc-text-primary`, `--tc-text-secondary`

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Lists, objects and functions are properties, not attributes – bind them as properties:*

| Property | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- |
| `spec` | `el.spec = …;` | `<… spec={…} />` | `<tc-chart :spec="…">` | `<tc-chart [spec]="…">` | `<tc-chart {spec}>` |

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-spec-check` | No | `el.addEventListener("tc-spec-check", (e) => …)` | `onSpecCheck={…}` | `@tc-spec-check="…"` | `(tc-spec-check)="…($event)"` | `el.addEventListener("tc-spec-check", …)` |

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-chart")` returns a `TcChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcChart } from "@adamstavely/trenchcoat/chart";`
- **React / Next.js:** Props: `import type { ChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Chart>`. The element class, for refs: `import type { TcChart } from "@adamstavely/trenchcoat/chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcChart["spec"]` with `import type { TcChart } from "@adamstavely/trenchcoat/chart";`
- **Angular:** The directive types the template: `[spec]` takes `TcChart["spec"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcChart } from "@adamstavely/trenchcoat/chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcChart } from "@adamstavely/trenchcoat/chart";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onSpecCheck` | `(check: ChartSpecCheck) => void` | The spec was checked: valid, with its errors and warnings |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

### Keyboard

The chart inside has its own keyboard model: Tab reaches its plot, arrows move through its marks. Nothing more here.

### Screen readers

- The chart inside is named and described as any chart is.
- A refused spec is an alert: "This bar chart can't be drawn", then each problem.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **120** | light-dark() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 4.8 KB | 2.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.0 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.7 KB | – |
| `internal/chart/spec` · Shared Trenchcoat code | 16.7 KB | – |
| `internal/chart/xy` · Shared Trenchcoat code | 15.3 KB | – |
| `internal/chart/pie` · Shared Trenchcoat code | 6.3 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/chart/brush` · Shared Trenchcoat code | 4.3 KB | – |
| `internal/chart/force` · Shared Trenchcoat code | 4.2 KB | – |
| `internal/chart/stats` · Shared Trenchcoat code | 3.5 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 3.3 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 3.2 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 3.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.1 KB | – |
| `internal/chart/sankey` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/series` · Shared Trenchcoat code | 2.5 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 2.4 KB | – |
| `internal/chart/loaders` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/chart/hierarchy` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/stack` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/bins` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/chord` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/hexbin` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/canvas` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| [heatmap](heatmap.md) · Element it renders | 30.1 KB | – |
| [gauge](gauge.md) · Element it renders | 19.9 KB | – |
| [bubble-chart](bubble-chart.md) · Element it renders | 16.8 KB | – |
| [candlestick-chart](candlestick-chart.md) · Element it renders | 15.5 KB | – |
| [sparkline](sparkline.md) · Element it renders | 14.4 KB | – |
| [radar-chart](radar-chart.md) · Element it renders | 14.4 KB | – |
| [network-graph](network-graph.md) · Element it renders | 12.8 KB | – |
| [radial-bar-chart](radial-bar-chart.md) · Element it renders | 10.9 KB | – |
| [calendar-heatmap](calendar-heatmap.md) · Element it renders | 10.6 KB | – |
| [combo-chart](combo-chart.md) · Element it renders | 10.5 KB | – |
| [venn-diagram](venn-diagram.md) · Element it renders | 9.3 KB | – |
| [hexbin-chart](hexbin-chart.md) · Element it renders | 8.2 KB | – |
| [parallel-chart](parallel-chart.md) · Element it renders | 7.7 KB | – |
| [histogram](histogram.md) · Element it renders | 7.6 KB | – |
| [bar-chart](bar-chart.md) · Element it renders | 7.6 KB | – |
| [box-plot](box-plot.md) · Element it renders | 7.2 KB | – |
| [waffle-chart](waffle-chart.md) · Element it renders | 7.2 KB | – |
| [beeswarm-chart](beeswarm-chart.md) · Element it renders | 7.1 KB | – |
| [waterfall-chart](waterfall-chart.md) · Element it renders | 6.7 KB | – |
| [sunburst-chart](sunburst-chart.md) · Element it renders | 6.6 KB | – |
| [dumbbell-chart](dumbbell-chart.md) · Element it renders | 6.5 KB | – |
| [bullet-chart](bullet-chart.md) · Element it renders | 6.5 KB | – |
| [sankey-chart](sankey-chart.md) · Element it renders | 6.4 KB | – |
| [rose-chart](rose-chart.md) · Element it renders | 6.3 KB | – |
| [slope-chart](slope-chart.md) · Element it renders | 6.2 KB | – |
| [stream-graph](stream-graph.md) · Element it renders | 6.1 KB | – |
| [ridgeline-chart](ridgeline-chart.md) · Element it renders | 6.1 KB | – |
| [chord-chart](chord-chart.md) · Element it renders | 6.0 KB | – |
| [pareto-chart](pareto-chart.md) · Element it renders | 5.9 KB | – |
| [bump-chart](bump-chart.md) · Element it renders | 5.8 KB | – |
| [lollipop-chart](lollipop-chart.md) · Element it renders | 5.3 KB | – |
| [treemap](treemap.md) · Element it renders | 5.3 KB | – |
| [funnel-chart](funnel-chart.md) · Element it renders | 4.9 KB | – |
| [segmented-bar](segmented-bar.md) · Element it renders | 4.7 KB | – |
| [marimekko-chart](marimekko-chart.md) · Element it renders | 4.5 KB | – |
| [donut-chart](donut-chart.md) · Element it renders | 1.4 KB | – |
| [area-chart](area-chart.md) · Element it renders | 0.8 KB | – |
| [line-chart](line-chart.md) · Element it renders | 0.8 KB | – |
| [pie-chart](pie-chart.md) · Element it renders | 0.7 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **447.5 KB** | **143.0 KB** |
| With Lit – the first component on a page | 464.5 KB | 148.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **1.1 ms** | re-render with the same data |
| First on the page | 2.0 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **57 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the chart's fields in `encoding` rather than renaming columns to the channels' names.
- Give `title` and `description`; they become the chart's heading and description.
- Keep data inline where you can; `{ url }` is fetched every time the spec changes.

## Do and don't

### Do

- Check specs from outside with `validateSpec` (or `tc-spec-check`) before showing them to people.
- Use `suggestCharts` to propose a first chart for a table someone has uploaded.

### Don't

- Put functions in a spec – a spec is JSON; use the chart's element for formatters and accessors.
- Trust a spec to have the fields you expect: the problem list is there for when it doesn't.

## Related

- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Pie Chart](pie-chart.md) – A few shares of a whole as slices, each in its own ink or one emphasised, the shares written beside them and the pointed-at slice lifting out
- [Generated UI](generated-ui.md) – A model's answer drawn as real components – tables, charts, metrics, forms and callouts from a spec, checked as it arrives, with plain text for anything unknown

## Changelog

- **`tc-chart`, the CLI and MCP tools:** 39 chart types (`rose`, `hexbin`, `network`); `suggestCharts` proposes a hexbin for thousands of points, a rose for a 7-, 12- or 24-step cycle and a network graph for looping links.
- **`tc-chart`, the CLI and MCP tools:** 36 chart types (`histogram`, `combo`, `venn`); `suggestCharts` proposes a histogram for one measure with no groups, and a combo chart for two measures on very different scales.
- **Chart** (`tc-chart`): any chart from a JSON spec – `{ type, data, encoding, options, title, description }` – checked first, what's wrong shown instead of a chart, only declared properties set. ztd-charts' specs draw as they are, and specs also draw Gauge, Heatmap, Radar Chart and Sparkline, their rows reshaped into those elements' properties.
