<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Waffle Chart

**Charts** · New

Shares of a whole as a grid of 100 cells, one category emphasised with its share written large beside it, the rest in the chart inks with a legend, cells that pop in one by one and a share that counts up, and a table view

- **Element:** `<tc-waffle-chart>`
- **Size:** 16.4 KB gzip · 47.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/waffle-chart";` |
| React / Next.js | `import { WaffleChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/waffle-chart";` · tags starting with tc- are custom elements |
| Angular | `import { WaffleChart } from "@adamstavely/trenchcoat/angular/waffle-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/waffle-chart";` |

## Example

The live example is in the gallery at `#/waffle-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Shares of a whole as a grid of cells – 100 by default, ten to a row – each category filling its share of them in
reading order, so "42 of 100 cells" reads at a glance. The cells are handed out by the largest remainder, so they
always add up. The first category (or the one `highlight` picks) takes the accent and its share is written large beside
the grid, with its name and the other categories' values under it; the other categories take the chart inks in order,
named in the legend. With a `total` above the values' sum, the cells left over stay empty.

The cells pop in one after another when the chart scrolls into view and the large share counts up; when the data
changes the cells change ink and the share glides. Ported from ztd-charts (MIT).

### When to use

- One share of a whole that people should feel, not just read: "a third of the cluster's hours".
- A handful of categories whose shares add up to something countable.

### When not to use

- Many small shares, or shares that don't make a whole – use [Bar Chart](bar-chart.md).
- Shares of a whole with a total to show in the middle – use [Donut Chart](donut-chart.md).
- How full one thing is, inline – use [Meter Row](meter-row.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Cell** `.ui-wff__cell` – one of the grid's cells, in its category's ink, or empty
3. **Share** `.ui-wff__figure` – the emphasised category's share, written large
4. **Name** `.ui-wff__name` – the words under the share; the other categories' values under those
5. **Tooltip** `.tc-chart__tip` – the category's value, share and number of cells

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised category, `--tc-plot-ink-2` … `-6` for the
others (`--tc-plot-rest` when there's only one), and `--tc-wff-empty` for the cells left over. `--tc-wff-stagger` sets
the delay between cells as they pop in. The share and its words sit beside the grid, never on it. `still` (or the
system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-waffle-chart heading="GPU hours" description="This quarter, by lab" unit=" h"></tc-waffle-chart>

<script type="module">
  import "@adamstavely/trenchcoat/waffle-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-waffle-chart").data = [
    { label: "Genomics", value: 4120 },
    { label: "Climate", value: 2680 },
    { label: "Imaging", value: 1890 },
  ];
</script>
```

### React / Next.js

```tsx
import { WaffleChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", value: 4120 },
  { label: "Climate", value: 2680 },
  { label: "Imaging", value: 1890 },
];

export function GpuHours() {
  return <WaffleChart title="GPU hours" description="This quarter, by lab" unit=" h" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/waffle-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";

defineProps<{ label: TcWaffleChart["label"]; value: TcWaffleChart["value"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-waffle-chart :label="label" :value="value" @tc-view-change="onViewChange"></tc-waffle-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { WaffleChart } from "@adamstavely/trenchcoat/angular/waffle-chart";
import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";

@Component({
  selector: "app-waffle-chart-example",
  imports: [WaffleChart],
  template: `<tc-waffle-chart [label]="label()" [value]="value()" (tc-view-change)="onViewChange($event)"></tc-waffle-chart>`,
})
export class WaffleChartExample {
  readonly label = input.required<TcWaffleChart["label"]>();
  readonly value = input.required<TcWaffleChart["value"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/waffle-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";

  let { label, value }: { label: TcWaffleChart["label"]; value: TcWaffleChart["value"] } = $props();
  let el: TcWaffleChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-waffle-chart bind:this={el} {label} {value}></tc-waffle-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The category field; by default "label" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field; by default "value" |
| `cells` | `cells` | `number` | `100` | How many cells the grid has |
| `columns` | `columns` | `number` | `10` | How many cells to a row |
| `total` | `total` | `number \| undefined` | `undefined` | The whole the values are shares of; by default their sum. Above it, the cells left over stay empty |
| `hideSummary` | `hide-summary` | `boolean` | `false` | Leaves out the large share beside the grid |
| `summaryLabel` | `summary-label` | `string \| undefined` | `undefined` | The words under the large share; by default the emphasised category's name |
| `summaryNote` | `summary-note` | `string \| undefined` | `undefined` | The line under those; by default the other categories with their values |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a category, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A category's cell was clicked, or the category picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-wff-empty` | `var(--tc-plot-grid)` | both |
| `--tc-wff-stagger` | `7ms` | both |

#### Design tokens it reads (13)

`--tc-duration-fast`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-font-size-3xl`, `--tc-font-size-4xl`, `--tc-font-size-sm`, `--tc-font-weight-strong`, `--tc-plot-focus`, `--tc-plot-grid`, `--tc-text-primary`, `--tc-tracking-tight`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `allocateCells(values: readonly number[], cells: number, total?: number): number[]` | Hands out `cells` cells by the largest remainder, so the counts add up to exactly `cells` – or, with a `total` above the values' sum, to their share of it |

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-waffle-chart :label="…">` | `<tc-waffle-chart [label]="…">` | `<tc-waffle-chart {label}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-waffle-chart :value="…">` | `<tc-waffle-chart [value]="…">` | `<tc-waffle-chart {value}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-waffle-chart :data="…">` | `<tc-waffle-chart [data]="…">` | `<tc-waffle-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-waffle-chart :highlight="…">` | `<tc-waffle-chart [highlight]="…">` | `<tc-waffle-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-waffle-chart :format="…">` | `<tc-waffle-chart [format]="…">` | `<tc-waffle-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-waffle-chart :labels="…">` | `<tc-waffle-chart [labels]="…">` | `<tc-waffle-chart {labels}>` |

*Also attributes: `cells`, `columns`, `total`, `hide-summary`, `summary-label`, `summary-note`, `heading`, `description` and 10 more – see the API table.*

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
<tc-waffle-chart id="waffle-chart"></tc-waffle-chart>

<script type="module">
  import "@adamstavely/trenchcoat/waffle-chart";

  const el = document.querySelector("#waffle-chart");
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
import "@adamstavely/trenchcoat/waffle-chart";
import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";

const props = defineProps<{ initial: TcWaffleChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcWaffleChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-waffle-chart :view="view" @tc-view-change="onViewChange"></tc-waffle-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { WaffleChart } from "@adamstavely/trenchcoat/angular/waffle-chart";
import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";

@Component({
  selector: "app-controlled-waffle-chart",
  imports: [WaffleChart],
  template: `<tc-waffle-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-waffle-chart>`,
})
export class ControlledWaffleChart {
  readonly initial = input.required<TcWaffleChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcWaffleChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/waffle-chart";
  import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";

  let { initial }: { initial: TcWaffleChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcWaffleChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcWaffleChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-waffle-chart bind:this={el} {view}></tc-waffle-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-waffle-chart")` returns a `TcWaffleChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";`
- **React / Next.js:** Props: `import type { WaffleChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof WaffleChart>`. The element class, for refs: `import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWaffleChart["label"]` with `import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";`
- **Angular:** The directive types the template: `[label]` takes `TcWaffleChart["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWaffleChart } from "@adamstavely/trenchcoat/waffle-chart";`

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
| Arrow keys | Move to the next or previous category; its cells are ringed, the tooltip shows it and it's read with its value |
| Home / End | The first or last category |
| Enter / Space | Picks the category (fires `tc-mark-click`) |
| Escape | Lets go of the category; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words ("Out of 100 cells: Genomics 42, Climate 27, …").
- A table of every category's value and share is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces the category with its value, share and position ("Climate: 2,680 h · 27%, 2 of 4").
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
| **This component alone** | 9.6 KB | 4.3 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **47.0 KB** | **16.4 KB** |
| With Lit – the first component on a page | 67.1 KB | 22.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 44 DOM nodes – to layout, median of 7 |
| Typical update | **2.1 ms** | one item of data replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.7 ms | data: first render, 406 nodes; update 0.6 ms |
| 1,000 items | 13 ms | data: first render, 2,206 nodes; update 2.2 ms |

1,000 items of data: 13 ms, 2,206 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Keep to about five categories; past that the inks repeat and the cells get hard to tell apart.
- Use `summary-label` when the share needs a sentence ("of the cluster's hours") rather than the category's name.
- Set `total` when the categories don't make the whole – the rest of the grid stays empty and says so.

## Do and don't

### Do

- Put the category that matters first, or name it in `highlight`.
- Use 100 cells so each one is a percent.

### Don't

- Use a waffle for values that don't add up to a whole.
- Lean on the grid for small differences – 27 and 29 cells look alike; the table has the numbers.

## Related

- [Pie Chart](pie-chart.md) – A few shares of a whole as slices, each in its own ink or one emphasised, the shares written beside them and the pointed-at slice lifting out
- [Donut Chart](donut-chart.md) – Shares of a whole round a hole holding the total, with a legend of every slice and its share beside or under it, slices that sweep round and a total that counts up
- [Funnel Chart](funnel-chart.md) – How many are left at each step of a process as centred bars narrowing down the page, joined by curved necks, each step's rate against the one before or the first, the biggest drop emphasised, and a table view
- [Marimekko Chart](marimekko-chart.md) – Two shares in one picture – columns as wide as their share of the whole, each stacked to 100% by series – one series emphasised and named in a legend, blocks that rise and glide when the data changes, and a table view
- [Meter Row](meter-row.md) – How full something is on one line – a label, a percentage and a tiny bar, with a mark and a word when it's getting full; can open the details or sit compact beside a value.

## Changelog

- **Waffle Chart** (`tc-waffle-chart`): shares as a grid of 100 cells, one emphasised with its share written large.
