<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Bar Chart

**Charts** · New

Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view

- **Element:** `<tc-bar-chart>`
- **Size:** 19.8 KB gzip · 54.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/bar-chart";` |
| React / Next.js | `import { BarChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/bar-chart";` · tags starting with tc- are custom elements |
| Angular | `import { BarChart } from "@adamstavely/trenchcoat/angular/bar-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/bar-chart";` |

## Example

The live example is in the gallery at `#/bar-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Values by category as bars. One series draws one bar per category, the highest taking the accent and the rest
kept quiet, so the eye lands on what matters; `highlight` picks a different one, or several. Several series sit side
by side (`layout="grouped"`), on top of each other (`"stacked"`) or stacked to 100% (`"percent"`), each in its own
chart ink and named in the legend. `orientation="horizontal"` lays the bars down for long category names. `yDomain` fixes
the value axis's range, so several charts side by side share one scale (Small Multiples sets it for you).

Values sit at the bars' ends, thinned when they'd overlap. The bars grow from the baseline when the chart scrolls into
view and glide to new values when the data changes. Ported from ztd-charts (MIT).

### When to use

- Comparing a value across a handful to a few dozen categories.
- Showing what a total is made of (`stacked`) or how the mix differs (`percent`).

### When not to use

- Change over time with many points – use [Line Chart](line-chart.md).
- A stacked bar people slice by measure and segment – use [Breakdown Chart](breakdown-chart.md).
- One headline metric with its trend – use [KPI Chart](kpi-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Bar** `.ui-brc__bar` – one per category and series; the emphasised one in the accent
3. **Value** `.tc-chart__value` – the value at the bar's end
4. **Axis** `.tc-chart__grid` – the grid lines and their values; the category names under the bars
5. **Tooltip** `.tc-chart__tip` – the category and every series' value there

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` and `--tc-plot-rest` for emphasis, `--tc-plot-ink-1` … `-6` for
categories, `--tc-plot-grid` for grid lines. Values are written in the text inks, beside marks rather than on them, so
they stay legible whatever the inks are. `still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-bar-chart heading="Samples processed" description="This week, by lab"></tc-bar-chart>

<script type="module">
  import "@adamstavely/trenchcoat/bar-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-bar-chart").data = [
    { x: "Genomics", y: 182 },
    { x: "Imaging", y: 96 },
    { x: "Proteomics", y: 124 },
  ];
</script>
```

### React / Next.js

```tsx
import { BarChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { x: "Genomics", y: 182 },
  { x: "Imaging", y: 96 },
  { x: "Proteomics", y: 124 },
];

export function Samples() {
  return <BarChart title="Samples processed" description="This week, by lab" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/bar-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";

defineProps<{ x: TcBarChart["x"]; y: TcBarChart["y"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-bar-chart :x="x" :y="y" @tc-view-change="onViewChange"></tc-bar-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BarChart } from "@adamstavely/trenchcoat/angular/bar-chart";
import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";

@Component({
  selector: "app-bar-chart-example",
  imports: [BarChart],
  template: `<tc-bar-chart [x]="x()" [y]="y()" (tc-view-change)="onViewChange($event)"></tc-bar-chart>`,
})
export class BarChartExample {
  readonly x = input.required<TcBarChart["x"]>();
  readonly y = input.required<TcBarChart["y"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/bar-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";

  let { x, y }: { x: TcBarChart["x"]; y: TcBarChart["y"] } = $props();
  let el: TcBarChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-bar-chart bind:this={el} {x} {y}></tc-bar-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `x` | – | `Accessor<T, string> \| undefined` | `undefined` | The category field (also for lying-down bars); by default "x" |
| `y` | – | `Accessor<T, number> \| string[] \| undefined` | `undefined` | The value field; a list of fields draws each as a series (a wide table); by default "y" |
| `series` | – | `Accessor<T, string> \| undefined` | `undefined` | The series field, for a long table with one row per category and series |
| `layout` | `layout` | `BarLayout` | `"grouped"` | Several series side by side ("grouped"), on top of each other ("stacked") or stacked to 100% ("percent") |
| `orientation` | `orientation` | `BarOrientation` | `"vertical"` | Upright bars ("vertical") or lying down ("horizontal") |
| `sort` | `sort` | `boolean` | `false` | Orders one series' bars from the largest |
| `yDomain` | – | `[number, number] \| undefined` | `undefined` | A fixed value range, [low, high], to compare several charts on one scale; keep 0 inside it. Not for "percent" |
| `heading` | `heading` | `string` | `""` | The heading, and the chart's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `data` | – | `readonly T[]` | `[]` | The rows to draw |
| `highlight` | – | `Highlight<T> \| undefined` | `undefined` | What to emphasise: an index, a label, a list of them, "max", "min", "first", "last", "none", or a test |
| `format` | – | `FormatSpec \| undefined` | `undefined` | How values are written: "number", "integer", "percent", "compact", "currency", Intl options, or a function |
| `unit` | `unit` | `string` | `""` | The unit after each value: "%", "ms", " runs" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "de"; by default the browser's |
| `height` | `height` | `number \| undefined` | `undefined` | The plot's height in px; by default the chart's own for its width |
| `still` | `still` | `boolean` | `false` | Draws everything at once: no entrance and no transitions |
| `easing` | `easing` | `EasingName` | `"spring"` | How marks move: "spring", "easeOut", "easeInOut" or "linear" |
| `duration` | `duration` | `number \| undefined` | `undefined` | How long a move takes, in ms; by default the chart's own |
| `hideLabels` | `hide-labels` | `boolean` | `false` | Leaves the values off the marks |
| `hideTooltip` | `hide-tooltip` | `boolean` | `false` | No tooltip on hover or focus |
| `bare` | `bare` | `boolean` | `false` | No card: just the plot, for a chart inside another component |
| `view` | `view` | `ChartView` | `"chart"` | The chart or the same numbers as a table. Changed by the Table button unless a tc-view-change listener calls preventDefault() |
| `labels` | – | `Partial<ChartLabels>` | `{}` | The words it shows and says, merged over defaultChartLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-view-change` | – | Yes | The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was |
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a bar, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A bar was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Design tokens it reads (1)

`--tc-plot-bg`

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
| `x` | `el.x = …;` | `<… x={…} />` | `<tc-bar-chart :x="…">` | `<tc-bar-chart [x]="…">` | `<tc-bar-chart {x}>` |
| `y` | `el.y = …;` | `<… y={…} />` | `<tc-bar-chart :y="…">` | `<tc-bar-chart [y]="…">` | `<tc-bar-chart {y}>` |
| `series` | `el.series = …;` | `<… series={…} />` | `<tc-bar-chart :series="…">` | `<tc-bar-chart [series]="…">` | `<tc-bar-chart {series}>` |
| `yDomain` | `el.yDomain = …;` | `<… yDomain={…} />` | `<tc-bar-chart :yDomain="…">` | `<tc-bar-chart [yDomain]="…">` | `<tc-bar-chart {yDomain}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-bar-chart :data="…">` | `<tc-bar-chart [data]="…">` | `<tc-bar-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-bar-chart :highlight="…">` | `<tc-bar-chart [highlight]="…">` | `<tc-bar-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-bar-chart :format="…">` | `<tc-bar-chart [format]="…">` | `<tc-bar-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-bar-chart :labels="…">` | `<tc-bar-chart [labels]="…">` | `<tc-bar-chart {labels}>` |

*Also attributes: `layout`, `orientation`, `sort`, `heading`, `description`, `unit`, `locale`, `height` and 7 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-mark-hover` | No | `el.addEventListener("tc-mark-hover", (e) => …)` | `onMarkHover={…}` | `@tc-mark-hover="…"` | `(tc-mark-hover)="…($event)"` | `el.addEventListener("tc-mark-hover", …)` |
| `tc-mark-click` | No | `el.addEventListener("tc-mark-click", (e) => …)` | `onMarkClick={…}` | `@tc-mark-click="…"` | `(tc-mark-click)="…($event)"` | `el.addEventListener("tc-mark-click", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view` itself unless a listener calls `preventDefault()` on `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-bar-chart id="bar-chart"></tc-bar-chart>

<script type="module">
  import "@adamstavely/trenchcoat/bar-chart";

  const el = document.querySelector("#bar-chart");
  el.addEventListener("tc-view-change", (e) => {
    e.preventDefault(); // the element keeps its view…
    if (allowed(e.detail.view)) el.view = e.detail.view; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

*The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref.*

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/bar-chart";
import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";

const props = defineProps<{ initial: TcBarChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcBarChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-bar-chart :view="view" @tc-view-change="onViewChange"></tc-bar-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BarChart } from "@adamstavely/trenchcoat/angular/bar-chart";
import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";

@Component({
  selector: "app-controlled-bar-chart",
  imports: [BarChart],
  template: `<tc-bar-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-bar-chart>`,
})
export class ControlledBarChart {
  readonly initial = input.required<TcBarChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcBarChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/bar-chart";
  import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";

  let { initial }: { initial: TcBarChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcBarChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcBarChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-bar-chart bind:this={el} {view}></tc-bar-chart>
```

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-bar-chart")` returns a `TcBarChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";`
- **React / Next.js:** Props: `import type { BarChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BarChart>`. The element class, for refs: `import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBarChart["x"]` with `import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";`
- **Angular:** The directive types the template: `[x]` takes `TcBarChart["x"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBarChart } from "@adamstavely/trenchcoat/bar-chart";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the chart's name |
| `view` | `ChartView` | The chart or the table – controlled when given |
| `defaultView` | `ChartView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: ChartView) => void` | The Table button was pressed |
| `onMarkHover` | `(event: ChartEvent \| null) => void` | The pointer or keyboard moved to a mark (null: off them) |
| `onMarkClick` | `(event: ChartEvent) => void` | A mark was clicked, or picked with Enter or Space |

*Renamed or hidden on the wrapper: `heading`, `view`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous bar; the tooltip shows it and it's read with its value |
| Home / End | The first or last bar |
| Enter / Space | Picks the bar (fires `tc-mark-click`) |
| Escape | Lets go of the bar; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, with the chart described in words (each category and its value).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the bar with its value and position ("Imaging: 96, 2 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/chart/element, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | internal/chart/element | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit, internal/chart/element | Focus rings for keyboard users. |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/chart/accessor | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, internal/chart/element, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/chart/element | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/chart/element | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | internal/chart/element | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/chart/element, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 10.2 KB | 4.8 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.5 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/chart/series` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/stack` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **54.6 KB** | **19.8 KB** |
| With Lit – the first component on a page | 74.1 KB | 26.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 41 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of data replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.1 ms | data: first render, 41 nodes; update 0.3 ms |
| 1,000 items | 2.6 ms | data: first render, 41 nodes; update 0.9 ms |

What it renders doesn't grow with data (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **59 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep category names short; long ones read better with `orientation="horizontal"`.
- Give `unit` (" ms", "%") rather than baking it into the values.
- Sort with `sort` when the order of categories carries no meaning.

## Do and don't

### Do

- Let one bar carry the accent – the point of the chart.
- Use `layout="percent"` when the mix matters more than the totals.

### Don't

- Stack more than about six series; the inks repeat after six.
- Start a bar chart's axis anywhere but zero – it's set for you.

## Related

- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Area Chart](area-chart.md) – Totals and their make-up over time as filled areas – stacked, stacked to 100% or overlapping – with names at their ends, the nearest month read across every series, and a table view
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer

## Changelog

- **Bar Chart** (`tc-bar-chart`): grouped, stacked or 100% bars, upright or lying down, the highest emphasised.
