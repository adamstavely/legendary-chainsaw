<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Parallel Chart

**Charts** · New

Parallel coordinates: rows as lines across a vertical axis per measure, each on its own scale, axes that can run upside down, one row emphasised and named, gaps for missing values, a canvas for many rows, and a table view

- **Element:** `<tc-parallel-chart>`
- **Size:** 17.5 KB gzip · 49.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/parallel-chart";` |
| React / Next.js | `import { ParallelChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/parallel-chart";` · tags starting with tc- are custom elements |
| Angular | `import { ParallelChart } from "@adamstavely/trenchcoat/angular/parallel-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/parallel-chart";` |

## Example

The live example is in the gallery at `#/parallel-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Parallel coordinates: several numeric measures stood up side by side as vertical axes, and each row drawn as a line
crossing every axis at its value – to compare rows across all the measures at once and see which move together. Each
axis is scaled to its own range, written at its ends, and `invert` turns an axis where less is better upside down, so
"good" is up everywhere. One row takes the accent and is named at the right – the first by default; `highlight` picks
others – while the rest stay quiet. A row missing a value has its line broken at that axis rather than drawn to a
false minimum.

The pointer picks the nearest line. Lines draw across from left to right when the chart scrolls into view and glide
to new values when the data changes. Above `canvas-threshold` rows (1,500 by default) the lines are painted on a canvas
under the drawing, fainter the more there are, so the density shows. Ported from ztd-charts (MIT).

### When to use

- Comparing a handful to thousands of items across three to about eight measures: instruments, grants, samples.
- Finding the items that do well on every measure, and trade-offs between measures (where lines cross).
- Following one item's profile against the field.

### When not to use

- One measure across categories – use [Bar Chart](bar-chart.md).
- Change over time – use [Line Chart](line-chart.md).
- Two categories against each other, a value per pair – use [Heatmap](heatmap.md).
- Exact values people will sort and filter – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description and the Table button
2. **Axis** `.ui-pcc__axis` – one per measure, with its name above and its range at the ends (`.tc-chart__tick`)
3. **Line** `.ui-pcc__line` – one per row; the emphasised one in the accent, the active one in the strong ink
4. **Name** `.tc-chart__value` – the emphasised or active row's name, right of the last axis
5. **Tooltip** `.tc-chart__tip` – the row's name and every measure's value
6. **Canvas** `.tc-chart__canvas` – where the lines are painted above `canvas-threshold`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. The emphasised line is `--tc-pcc-hi` (by default
`--tc-plot-accent`), the rest `--tc-pcc-rest` (by default `--tc-plot-line-rest`) and the active one `--tc-pcc-active`
(by default `--tc-plot-focus`); axes take `--tc-plot-zero`. Set any of them on the element; the canvas reads the same
tokens. `still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-parallel-chart heading="Shared instruments" description="This quarter"></tc-parallel-chart>

<script type="module">
  import "@adamstavely/trenchcoat/parallel-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-parallel-chart");
  chart.invert = ["queue"];
  chart.data = [
    { label: "Cryo-EM", uptime: 97, cost: 410, queue: 6 },
    { label: "Mass spec", uptime: 88, cost: 180, queue: 14 },
    { label: "Confocal", uptime: 79, cost: 120, queue: 3 },
  ];
</script>
```

### React / Next.js

```tsx
import { ParallelChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Cryo-EM", uptime: 97, cost: 410, queue: 6 },
  { label: "Mass spec", uptime: 88, cost: 180, queue: 14 },
  { label: "Confocal", uptime: 79, cost: 120, queue: 3 },
];

export function Instruments() {
  return <ParallelChart title="Shared instruments" description="This quarter" data={data} invert={["queue"]} dimensionLabels={{ cost: "Cost / hour" }} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/parallel-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";

defineProps<{ dimensions: TcParallelChart["dimensions"]; dimensionLabels: TcParallelChart["dimensionLabels"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-parallel-chart :dimensions="dimensions" :dimensionLabels="dimensionLabels" @tc-view-change="onViewChange"></tc-parallel-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ParallelChart } from "@adamstavely/trenchcoat/angular/parallel-chart";
import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";

@Component({
  selector: "app-parallel-chart-example",
  imports: [ParallelChart],
  template: `<tc-parallel-chart [dimensions]="dimensions()" [dimensionLabels]="dimensionLabels()" (tc-view-change)="onViewChange($event)"></tc-parallel-chart>`,
})
export class ParallelChartExample {
  readonly dimensions = input.required<TcParallelChart["dimensions"]>();
  readonly dimensionLabels = input.required<TcParallelChart["dimensionLabels"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/parallel-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";

  let { dimensions, dimensionLabels }: { dimensions: TcParallelChart["dimensions"]; dimensionLabels: TcParallelChart["dimensionLabels"] } = $props();
  let el: TcParallelChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-parallel-chart bind:this={el} {dimensions} {dimensionLabels}></tc-parallel-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `dimensions` | – | `string[] \| undefined` | `undefined` | The numeric fields to stand up as axes, in order; by default every field that's a number in the first 20 rows |
| `dimensionLabels` | – | `Record<string, string> \| undefined` | `undefined` | Names for the axes by field: { uptime: "Uptime (%)" } |
| `formats` | – | `Record<string, FormatSpec> \| undefined` | `undefined` | How each axis's values are written, by field; the others use `format` |
| `invert` | – | `string[] \| undefined` | `undefined` | Fields where less is better: their axes run upside down |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The row-name field; by default "label" |
| `canvasThreshold` | `canvas-threshold` | `number` | `1500` | Above this many rows the lines are painted on a canvas instead of drawn in SVG |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a line, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A line was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-pcc-hi` | `var(--tc-plot-accent)` | both |
| `--tc-pcc-rest` | `var(--tc-plot-line-rest)` | both |
| `--tc-pcc-active` | `var(--tc-plot-focus)` | both |

#### Design tokens it reads (6)

`--tc-duration-fast`, `--tc-ease-standard`, `--tc-plot-accent`, `--tc-plot-focus`, `--tc-plot-line-rest`, `--tc-plot-zero`

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
| `dimensions` | `el.dimensions = …;` | `<… dimensions={…} />` | `<tc-parallel-chart :dimensions="…">` | `<tc-parallel-chart [dimensions]="…">` | `<tc-parallel-chart {dimensions}>` |
| `dimensionLabels` | `el.dimensionLabels = …;` | `<… dimensionLabels={…} />` | `<tc-parallel-chart :dimensionLabels="…">` | `<tc-parallel-chart [dimensionLabels]="…">` | `<tc-parallel-chart {dimensionLabels}>` |
| `formats` | `el.formats = …;` | `<… formats={…} />` | `<tc-parallel-chart :formats="…">` | `<tc-parallel-chart [formats]="…">` | `<tc-parallel-chart {formats}>` |
| `invert` | `el.invert = …;` | `<… invert={…} />` | `<tc-parallel-chart :invert="…">` | `<tc-parallel-chart [invert]="…">` | `<tc-parallel-chart {invert}>` |
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-parallel-chart :label="…">` | `<tc-parallel-chart [label]="…">` | `<tc-parallel-chart {label}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-parallel-chart :data="…">` | `<tc-parallel-chart [data]="…">` | `<tc-parallel-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-parallel-chart :highlight="…">` | `<tc-parallel-chart [highlight]="…">` | `<tc-parallel-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-parallel-chart :format="…">` | `<tc-parallel-chart [format]="…">` | `<tc-parallel-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-parallel-chart :labels="…">` | `<tc-parallel-chart [labels]="…">` | `<tc-parallel-chart {labels}>` |

*Also attributes: `canvas-threshold`, `heading`, `description`, `unit`, `locale`, `height`, `still`, `easing` and 5 more – see the API table.*

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
<tc-parallel-chart id="parallel-chart"></tc-parallel-chart>

<script type="module">
  import "@adamstavely/trenchcoat/parallel-chart";

  const el = document.querySelector("#parallel-chart");
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
import "@adamstavely/trenchcoat/parallel-chart";
import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";

const props = defineProps<{ initial: TcParallelChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcParallelChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-parallel-chart :view="view" @tc-view-change="onViewChange"></tc-parallel-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ParallelChart } from "@adamstavely/trenchcoat/angular/parallel-chart";
import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";

@Component({
  selector: "app-controlled-parallel-chart",
  imports: [ParallelChart],
  template: `<tc-parallel-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-parallel-chart>`,
})
export class ControlledParallelChart {
  readonly initial = input.required<TcParallelChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcParallelChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/parallel-chart";
  import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";

  let { initial }: { initial: TcParallelChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcParallelChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcParallelChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-parallel-chart bind:this={el} {view}></tc-parallel-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-parallel-chart")` returns a `TcParallelChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";`
- **React / Next.js:** Props: `import type { ParallelChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ParallelChart>`. The element class, for refs: `import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcParallelChart["dimensions"]` with `import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";`
- **Angular:** The directive types the template: `[dimensions]` takes `TcParallelChart["dimensions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcParallelChart } from "@adamstavely/trenchcoat/parallel-chart";`

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
| Arrow keys | The next or previous row; the tooltip shows it and it's read with every measure |
| Home / End | The first or last row |
| Enter / Space | Picks the row (fires `tc-mark-click`) |
| Escape | Lets go of the row; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words (how many rows and the axes' names).
- A table of every row with all its measures is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces the row with every measure and its position ("Cryo-EM: uptime 97, cost 41,
  queue 6, 1 of 5").
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
| **This component alone** | 10.3 KB | 4.6 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/canvas` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **49.4 KB** | **17.5 KB** |
| With Lit – the first component on a page | 68.9 KB | 23.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 53 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of data replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.7 ms | data: first render, 205 nodes; update 0.9 ms |
| 1,000 items | 8.0 ms | data: first render, 205 nodes; update 4.1 ms |

1,000 items of data: 8.0 ms, 205 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the rows with a `label` field (or the `label` accessor); unnamed rows are read as "#1", "#2".
- Give axes readable names with `dimensionLabels` and units with `formats` – one per field.
- Pick `dimensions` to set the order: neighbours are what the eye compares.

## Do and don't

### Do

- Use `invert` so the better end of every axis is at the top.
- Emphasise one or two rows; the shape of the rest is the context.

### Don't

- Stand up more than about eight axes – the spaces between them get too narrow to read.
- Use it for measures that aren't numbers; categories belong in another chart.

## Related

- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Calendar Heatmap](calendar-heatmap.md) – An amount per day on a grid of weeks, each day shaded from light to the full accent, the busiest outlined, a year per row over several years, a scale legend, weeks that fade in, a canvas for long ranges, and a table view
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **Parallel Chart** (`tc-parallel-chart`): parallel coordinates, a canvas for many rows.
