<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Hexbin Chart

**Charts** · New

Thousands of points by x and y gathered into hexagons shaded by count, or the sum or mean of a value, with a ramp legend and the densest ringed.

- **Element:** `<tc-hexbin-chart>`
- **Size:** 17.5 KB gzip · 49.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/hexbin-chart";` |
| React / Next.js | `import { HexbinChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/hexbin-chart";` · tags starting with tc- are custom elements |
| Angular | `import { HexbinChart } from "@adamstavely/trenchcoat/angular/hexbin-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/hexbin-chart";` |

## Example

The live example is in the gallery at `#/hexbin-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Many points by x and y, gathered into hexagons and shaded by how many fell in each – where the points crowd, for
scatters too dense to read point by point. `aggregate="sum"` or `"mean"` shades by the sum or mean of a `value`
instead, so the shape shows where the points are and the shade what they're like there. Empty hexagons aren't drawn;
the densest is ringed; a ramp in the header names the shades' ends.

The hexagons are `radius` px from centre to corner (12 by default), smaller on narrow widths, and larger if there
would be more than 3,000 of them. Binning is one pass over the points, so 50,000 are fine. Hexagons grow in from left
to right when the chart scrolls into view and change shade smoothly when the data changes.

### When to use

- Thousands of points where a scatter plot would be a solid blot: readings, events, measurements.
- Where points crowd, and what they're like there – with `aggregate`.

### When not to use

- A few hundred points or fewer, where each one matters – use [Bubble Chart](bubble-chart.md) as a scatter plot.
- Two categories rather than two numbers – use [Heatmap](heatmap.md).
- One measure's spread – use [Histogram](histogram.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the shade legend and the Table button
2. **Hexagon** `.ui-hxb__hex` – one per hexagon with points, shaded from the track to the ink
3. **Densest** `.ui-hxb__peak` – the ring round the hexagon with the most points
4. **Legend** `.ui-hxb__legend` – what the shade shows, its lowest and highest value, and the ramp between
5. **Axis** `.tc-chart__grid` – the y grid lines and their values, the x values below, and the axes' names
6. **Tooltip** `.tc-chart__tip` – the hexagon's x and y range, its count and aggregate

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both. Shades mix `--tc-hxb-ink` (the accent) into `--tc-hxb-track` (the grid ink), from 18% for the
lowest value to full ink for the highest; hexagons are parted by a hairline of `--tc-plot-bg` and the densest is ringed
in `--tc-hxb-peak`. No text sits on a hexagon. `still` (or the system's reduced-motion setting) draws everything at
once.

## Usage

### HTML

```html
<tc-hexbin-chart heading="Calibration readings" x-label="Room temperature (°C)" y-label="Drift"></tc-hexbin-chart>

<script type="module">
  import "@adamstavely/trenchcoat/hexbin-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-hexbin-chart");
  chart.x = "temperature";
  chart.y = "drift";
  chart.data = [
    { temperature: 21.2, drift: 0.12 },
    { temperature: 20.8, drift: 0.05 },
    { temperature: 25.9, drift: 0.61 },
  ];
</script>
```

### React / Next.js

```tsx
import { HexbinChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Readings({ readings }: { readings: { temperature: number; drift: number; size: number }[] }) {
  return <HexbinChart title="Calibration readings" data={readings} x="temperature" y="drift" value="size" aggregate="mean" xLabel="Room temperature (°C)" yLabel="Drift" onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/hexbin-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";

defineProps<{ x: TcHexbinChart["x"]; y: TcHexbinChart["y"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-hexbin-chart :x="x" :y="y" @tc-view-change="onViewChange"></tc-hexbin-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { HexbinChart } from "@adamstavely/trenchcoat/angular/hexbin-chart";
import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";

@Component({
  selector: "app-hexbin-chart-example",
  imports: [HexbinChart],
  template: `<tc-hexbin-chart [x]="x()" [y]="y()" (tc-view-change)="onViewChange($event)"></tc-hexbin-chart>`,
})
export class HexbinChartExample {
  readonly x = input.required<TcHexbinChart["x"]>();
  readonly y = input.required<TcHexbinChart["y"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/hexbin-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";

  let { x, y }: { x: TcHexbinChart["x"]; y: TcHexbinChart["y"] } = $props();
  let el: TcHexbinChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-hexbin-chart bind:this={el} {x} {y}></tc-hexbin-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `x` | – | `Accessor<T, number> \| undefined` | `undefined` | The x field; by default "x" |
| `y` | – | `Accessor<T, number> \| undefined` | `undefined` | The y field; by default "y" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field summed or averaged with `aggregate`; by default "value" |
| `aggregate` | `aggregate` | `HexbinAggregate` | `"count"` | What the shade shows: "count" of points, or the "sum" or "mean" of `value` |
| `radius` | `radius` | `number` | `12` | The hexagons' radius in px (centre to corner); smaller on narrow widths |
| `xLabel` | `x-label` | `string` | `""` | The x axis's name, at its right end |
| `yLabel` | `y-label` | `string` | `""` | The y axis's name, above it |
| `xFormat` | – | `FormatSpec \| undefined` | `undefined` | How x values are written; `format` writes y |
| `valueFormat` | – | `FormatSpec \| undefined` | `undefined` | How the aggregate is written; by default as numbers |
| `hexbinLabels` | – | `Partial<HexbinLabels>` | `{}` | The hexbin chart's own words, merged over defaultHexbinLabels |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a hexagon, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A hexagon was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-hxb-ink` | `var(--tc-plot-accent)` | both |
| `--tc-hxb-track` | `var(--tc-plot-grid)` | both |
| `--tc-hxb-peak` | `var(--tc-text-primary)` | both |

#### Design tokens it reads (9)

`--tc-font-size-sm`, `--tc-plot-accent`, `--tc-plot-bg`, `--tc-plot-grid`, `--tc-radius-2xs`, `--tc-space-1`, `--tc-space-1-5`, `--tc-text-primary`, `--tc-text-secondary`

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
| `x` | `el.x = …;` | `<… x={…} />` | `<tc-hexbin-chart :x="…">` | `<tc-hexbin-chart [x]="…">` | `<tc-hexbin-chart {x}>` |
| `y` | `el.y = …;` | `<… y={…} />` | `<tc-hexbin-chart :y="…">` | `<tc-hexbin-chart [y]="…">` | `<tc-hexbin-chart {y}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-hexbin-chart :value="…">` | `<tc-hexbin-chart [value]="…">` | `<tc-hexbin-chart {value}>` |
| `xFormat` | `el.xFormat = …;` | `<… xFormat={…} />` | `<tc-hexbin-chart :xFormat="…">` | `<tc-hexbin-chart [xFormat]="…">` | `<tc-hexbin-chart {xFormat}>` |
| `valueFormat` | `el.valueFormat = …;` | `<… valueFormat={…} />` | `<tc-hexbin-chart :valueFormat="…">` | `<tc-hexbin-chart [valueFormat]="…">` | `<tc-hexbin-chart {valueFormat}>` |
| `hexbinLabels` | `el.hexbinLabels = …;` | `<… hexbinLabels={…} />` | `<tc-hexbin-chart :hexbinLabels="…">` | `<tc-hexbin-chart [hexbinLabels]="…">` | `<tc-hexbin-chart {hexbinLabels}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-hexbin-chart :data="…">` | `<tc-hexbin-chart [data]="…">` | `<tc-hexbin-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-hexbin-chart :highlight="…">` | `<tc-hexbin-chart [highlight]="…">` | `<tc-hexbin-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-hexbin-chart :format="…">` | `<tc-hexbin-chart [format]="…">` | `<tc-hexbin-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-hexbin-chart :labels="…">` | `<tc-hexbin-chart [labels]="…">` | `<tc-hexbin-chart {labels}>` |

*Also attributes: `aggregate`, `radius`, `x-label`, `y-label`, `heading`, `description`, `unit`, `locale` and 8 more – see the API table.*

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
<tc-hexbin-chart id="hexbin-chart"></tc-hexbin-chart>

<script type="module">
  import "@adamstavely/trenchcoat/hexbin-chart";

  const el = document.querySelector("#hexbin-chart");
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
import "@adamstavely/trenchcoat/hexbin-chart";
import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";

const props = defineProps<{ initial: TcHexbinChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcHexbinChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-hexbin-chart :view="view" @tc-view-change="onViewChange"></tc-hexbin-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { HexbinChart } from "@adamstavely/trenchcoat/angular/hexbin-chart";
import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";

@Component({
  selector: "app-controlled-hexbin-chart",
  imports: [HexbinChart],
  template: `<tc-hexbin-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-hexbin-chart>`,
})
export class ControlledHexbinChart {
  readonly initial = input.required<TcHexbinChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcHexbinChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/hexbin-chart";
  import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";

  let { initial }: { initial: TcHexbinChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcHexbinChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcHexbinChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-hexbin-chart bind:this={el} {view}></tc-hexbin-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-hexbin-chart")` returns a `TcHexbinChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";`
- **React / Next.js:** Props: `import type { HexbinChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof HexbinChart>`. The element class, for refs: `import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHexbinChart["x"]` with `import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";`
- **Angular:** The directive types the template: `[x]` takes `TcHexbinChart["x"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHexbinChart } from "@adamstavely/trenchcoat/hexbin-chart";`

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
| Arrow keys | Move to the next or previous hexagon in reading order – by row from the top, then left to right |
| Home / End | The first or last hexagon |
| Enter / Space | Picks the hexagon (fires `tc-mark-click`) |
| Escape | Lets go of the hexagon; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words: how many points and hexagons, and where the densest
  is.
- A table of the hexagons (the first 60, and how many more) is always there for screen readers, in the same reading
  order as the keyboard; the Table button shows it to everyone.
- Moving with the arrows announces the hexagon ("x 20.5–21.4, y 0.1–0.2: 184, 12 of 210").
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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, internal/chart/element, tokens.css | Tints and washes mixed from the tokens. |
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
| **This component alone** | 10.6 KB | 4.8 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/hexbin` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **49.4 KB** | **17.5 KB** |
| With Lit – the first component on a page | 68.8 KB | 23.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.3 ms** | the gallery demo's data, 180 DOM nodes – to layout, median of 7 |
| Typical update | **3.3 ms** | one item of data replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.0 ms | data: first render, 108 nodes; update 0.2 ms |
| 1,000 items | 1.0 ms | data: first render, 147 nodes; update 0.4 ms |

1,000 items of data: 1.0 ms, 147 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **54 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the axes with `x-label` and `y-label`, and say in the description what the shade shows.
- Use `x-format`, `format` and `value-format` for the x axis, the y axis and the aggregate.
- Rename the legend's and summary's words through `hexbinLabels`.

## Do and don't

### Do

- Pick a radius that shows the pattern: smaller for detail, larger for a calmer picture.
- Switch to `aggregate="mean"` to ask what the points are like where they crowd.

### Don't

- Use it for a handful of points – a scatter plot shows them better.
- Read the shade as exact; point at a hexagon, or open the table, for the number.

## Related

- [Bubble Chart](bubble-chart.md) – Points by two values with a third as the circle's area, or a scatter plot without it – the largest emphasised and named where names fit, points by group with a legend that isolates, hides and shows each group, stat tiles under it, and a canvas for thousands of points
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view
- [Histogram](histogram.md) – How raw numbers spread, as touching bars on round bin edges, with the tallest bin emphasised, a running total, a density curve and mean and median lines if wanted.
- [Calendar Heatmap](calendar-heatmap.md) – An amount per day on a grid of weeks, each day shaded from light to the full accent, the busiest outlined, a year per row over several years, a scale legend, weeks that fade in, a canvas for long ranges, and a table view
