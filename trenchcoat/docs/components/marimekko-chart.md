<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Marimekko Chart

**Charts** · New

Two shares in one picture – columns as wide as their share of the whole, each stacked to 100% by series – one series emphasised and named in a legend, blocks that rise and glide when the data changes, and a table view

- **Element:** `<tc-marimekko-chart>`
- **Size:** 16.4 KB gzip · 46.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/marimekko-chart";` |
| React / Next.js | `import { MarimekkoChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/marimekko-chart";` · tags starting with tc- are custom elements |
| Angular | `import { MarimekkoChart } from "@adamstavely/trenchcoat/angular/marimekko-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/marimekko-chart";` |

## Example

The live example is in the gallery at `#/marimekko-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Two shares in one picture: each column is as wide as its share of the whole, and the series stacked in it fill it to
100%, so every block's area is its share of everything. A budget by lab and kind of spend shows at once which labs are
big and what each spends on. The first series (or the one `highlight` names) takes the accent and the others the chart
inks after it, named in the legend; under each column sit its name and its share of the whole. Rows with the same
column and series add up.

The blocks rise column after column when the chart scrolls into view, and widths and heights glide when the data
changes. Ported from ztd-charts (MIT).

### When to use

- A whole split two ways, where both splits matter: spend by lab and by kind, samples by site and by outcome.
- A few columns (up to about eight) and a few series (up to about five).

### When not to use

- Only the mix matters, not the columns' sizes – use [Bar Chart](bar-chart.md) with `layout="percent"`.
- The make-up changing over time – use [Area Chart](area-chart.md).
- One split of a whole – use [Waffle Chart](waffle-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Block** `.ui-mmk__block` – one per column and series, its height the share in the column
3. **Axis** `.tc-chart__grid` – the 0, 50 and 100% lines and their values
4. **Column label** `.tc-chart__tick` – each column's name and its share of the whole, under it
5. **Tooltip** `.tc-chart__tip` – the block's share in its column, its value and the column's share

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised series, `--tc-plot-ink-2` … `-6` for the others
(`--tc-plot-rest` when there's only one), and blocks are parted by lines of `--tc-plot-bg`. Shares are left to the
tooltip and the table rather than written on the blocks, so they stay legible whatever the inks are. `still` (or the
system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-marimekko-chart heading="Spend by lab" description="This year, k€"></tc-marimekko-chart>

<script type="module">
  import "@adamstavely/trenchcoat/marimekko-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-marimekko-chart").data = [
    { x: "Genomics", series: "Staff", value: 820 },
    { x: "Genomics", series: "Instruments", value: 540 },
    { x: "Imaging", series: "Staff", value: 460 },
    { x: "Imaging", series: "Instruments", value: 610 },
  ];
</script>
```

### React / Next.js

```tsx
import { MarimekkoChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { x: "Genomics", series: "Staff", value: 820 },
  { x: "Genomics", series: "Instruments", value: 540 },
  { x: "Imaging", series: "Staff", value: 460 },
  { x: "Imaging", series: "Instruments", value: 610 },
];

export function Spend() {
  return <MarimekkoChart title="Spend by lab" description="This year, k€" data={data} onMarkClick={(e) => console.log(e.label, e.series)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/marimekko-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";

defineProps<{ x: TcMarimekkoChart["x"]; series: TcMarimekkoChart["series"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-marimekko-chart :x="x" :series="series" @tc-view-change="onViewChange"></tc-marimekko-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MarimekkoChart } from "@adamstavely/trenchcoat/angular/marimekko-chart";
import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";

@Component({
  selector: "app-marimekko-chart-example",
  imports: [MarimekkoChart],
  template: `<tc-marimekko-chart [x]="x()" [series]="series()" (tc-view-change)="onViewChange($event)"></tc-marimekko-chart>`,
})
export class MarimekkoChartExample {
  readonly x = input.required<TcMarimekkoChart["x"]>();
  readonly series = input.required<TcMarimekkoChart["series"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/marimekko-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";

  let { x, series }: { x: TcMarimekkoChart["x"]; series: TcMarimekkoChart["series"] } = $props();
  let el: TcMarimekkoChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-marimekko-chart bind:this={el} {x} {series}></tc-marimekko-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `x` | – | `Accessor<T, string> \| undefined` | `undefined` | The column field; by default "x" |
| `series` | – | `Accessor<T, string> \| undefined` | `undefined` | The series field, stacked in each column; by default "series" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field; rows with the same column and series add up; by default "value" |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a block, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A block was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

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
| `x` | `el.x = …;` | `<… x={…} />` | `<tc-marimekko-chart :x="…">` | `<tc-marimekko-chart [x]="…">` | `<tc-marimekko-chart {x}>` |
| `series` | `el.series = …;` | `<… series={…} />` | `<tc-marimekko-chart :series="…">` | `<tc-marimekko-chart [series]="…">` | `<tc-marimekko-chart {series}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-marimekko-chart :value="…">` | `<tc-marimekko-chart [value]="…">` | `<tc-marimekko-chart {value}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-marimekko-chart :data="…">` | `<tc-marimekko-chart [data]="…">` | `<tc-marimekko-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-marimekko-chart :highlight="…">` | `<tc-marimekko-chart [highlight]="…">` | `<tc-marimekko-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-marimekko-chart :format="…">` | `<tc-marimekko-chart [format]="…">` | `<tc-marimekko-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-marimekko-chart :labels="…">` | `<tc-marimekko-chart [labels]="…">` | `<tc-marimekko-chart {labels}>` |

*Also attributes: `heading`, `description`, `unit`, `locale`, `height`, `still`, `easing`, `duration` and 4 more – see the API table.*

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
<tc-marimekko-chart id="marimekko-chart"></tc-marimekko-chart>

<script type="module">
  import "@adamstavely/trenchcoat/marimekko-chart";

  const el = document.querySelector("#marimekko-chart");
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
import "@adamstavely/trenchcoat/marimekko-chart";
import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";

const props = defineProps<{ initial: TcMarimekkoChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcMarimekkoChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-marimekko-chart :view="view" @tc-view-change="onViewChange"></tc-marimekko-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MarimekkoChart } from "@adamstavely/trenchcoat/angular/marimekko-chart";
import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";

@Component({
  selector: "app-controlled-marimekko-chart",
  imports: [MarimekkoChart],
  template: `<tc-marimekko-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-marimekko-chart>`,
})
export class ControlledMarimekkoChart {
  readonly initial = input.required<TcMarimekkoChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcMarimekkoChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/marimekko-chart";
  import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";

  let { initial }: { initial: TcMarimekkoChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcMarimekkoChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcMarimekkoChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-marimekko-chart bind:this={el} {view}></tc-marimekko-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-marimekko-chart")` returns a `TcMarimekkoChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";`
- **React / Next.js:** Props: `import type { MarimekkoChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MarimekkoChart>`. The element class, for refs: `import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMarimekkoChart["x"]` with `import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";`
- **Angular:** The directive types the template: `[x]` takes `TcMarimekkoChart["x"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMarimekkoChart } from "@adamstavely/trenchcoat/marimekko-chart";`

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
| Arrow keys | Move to the next or previous block, up each column then on to the next; the tooltip shows it and it's read with its share |
| Home / End | The first or last block |
| Enter / Space | Picks the block (fires `tc-mark-click`) |
| Escape | Lets go of the block; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words (each column with its share, then the series).
- A table of every block's share and value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the column and series with the share and position ("Imaging Staff: 40% · 460,
  4 of 15").
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
| **This component alone** | 7.0 KB | 3.5 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **46.1 KB** | **16.4 KB** |
| With Lit – the first component on a page | 65.5 KB | 22.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 75 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of data replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.2 ms | data: first render, 75 nodes; update 0.6 ms |
| 1,000 items | 3.7 ms | data: first render, 75 nodes; update 1.1 ms |

What it renders doesn't grow with data (tested to 1,000 items).

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

- Name columns briefly – a narrow column truncates its name.
- Put the series that matters first, or name it in `highlight`.
- Give `unit` and `format` for the values; the shares are written for you.

## Do and don't

### Do

- Order columns by size when their order carries no meaning.
- Keep the same series order in every column – it's set by first appearance.

### Don't

- Use it for negative values; they count as zero.
- Use more than about five series; the thin blocks become hard to point at.

## Related

- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Area Chart](area-chart.md) – Totals and their make-up over time as filled areas – stacked, stacked to 100% or overlapping – with names at their ends, the nearest month read across every series, and a table view
- [Waffle Chart](waffle-chart.md) – Shares of a whole as a grid of 100 cells, one category emphasised with its share written large beside it, the rest in the chart inks with a legend, cells that pop in one by one and a share that counts up, and a table view
- [Funnel Chart](funnel-chart.md) – How many are left at each step of a process as centred bars narrowing down the page, joined by curved necks, each step's rate against the one before or the first, the biggest drop emphasised, and a table view
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table

## Changelog

- **Marimekko Chart** (`tc-marimekko-chart`): columns as wide as their share, each stacked to 100%.
