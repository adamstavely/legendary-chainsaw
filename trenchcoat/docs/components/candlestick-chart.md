<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Candlestick Chart

**Charts** · New

A reading's open, high, low and close per period as candles – hollow when it rose, solid when it fell – with moving averages, a volume strip, the latest close tagged, a range to pick or zoom into, and a table view

- **Element:** `<tc-candlestick-chart>`
- **Size:** 21.9 KB gzip · 63.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/candlestick-chart";` |
| React / Next.js | `import { CandlestickChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/candlestick-chart";` · tags starting with tc- are custom elements |
| Angular | `import { CandlestickChart } from "@adamstavely/trenchcoat/angular/candlestick-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/candlestick-chart";` |

## Example

The live example is in the gallery at `#/candlestick-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A reading's open, high, low and close for each period, as candles: a thin wick from the low to the high and a body
from the open to the close. A period that closed higher than it opened is a hollow body outlined in the "up" ink; one
that closed lower is a solid body in the "down" ink, so the shape tells them apart as well as the colour. The
highlighted period – by default the last – has its close drawn across the plot and tagged on the value axis at the
right.

`ma` adds moving averages of the close (up to three, each with its own ink and dash), `volume` a strip of bars under
the candles, and periods too many for the width merge into fewer candles (`max-candles`). Candles sweep in from the
left when the chart scrolls into view and glide when the data changes. Ported from ztd-charts (MIT).

With `brush="select"`, dragging across the candles (or Shift+arrows and Enter) picks a range and shows its change
from the first open to the last close, with its high and low, firing `tc-brush`; `brush="zoom"` narrows the chart to
the range, with a Show all button to undo it.

### When to use

- A measurement sampled many times per period where the range matters as well as the trend: a freezer's daily
  temperature, an instrument's hourly drift, a queue's daily depth.

### When not to use

- One value per period – use [Line Chart](line-chart.md) or [Area Chart](area-chart.md).
- The spread of many values without an order in time – use [Box Plot](box-plot.md).
- A trend inside a sentence or a table cell – use [Sparkline](sparkline.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the key (up, down, averages) and the Table button
2. **Candle** `.ui-cdl__candle` – one per period, `data-dir="up"` or `"down"`
3. **Body** `.ui-cdl__body` – open to close; hollow when it rose
4. **Wick** `.ui-cdl__wick` – low to high
5. **Moving average** `.ui-cdl__ma` – a line per period in `ma`, its value at the top left
6. **Volume** `.ui-cdl__volume` – a bar per period under the candles, with `volume`
7. **Close tag** `.ui-cdl__last` – the highlighted close across the plot and on the axis
8. **Axis** `.tc-chart__grid` – the value grid at the right, the dates below
9. **Tooltip** `.tc-chart__tip` – open, high, low, close, change from the previous close, volume and averages

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Up and down take the status inks through component
tokens, `--tc-cdl-up` (`--tc-status-success-solid`) and `--tc-cdl-down` (`--tc-status-danger-solid`); override them
on the element where rising is bad. The averages are `--tc-cdl-ma-1` … `-3`, solid, dashed and dotted. The close tag
is outlined rather than filled, so its number stays in the text ink. `still` (or the system's reduced-motion setting)
draws everything at once.

## Usage

### HTML

```html
<tc-candlestick-chart heading="Freezer B" description="October, daily temperature" unit=" °C"></tc-candlestick-chart>

<script type="module">
  import "@adamstavely/trenchcoat/candlestick-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const el = document.querySelector("tc-candlestick-chart");
  el.ma = [5];
  el.data = [
    { date: "2026-10-01", open: -80.1, high: -79.2, low: -80.4, close: -79.4 },
    { date: "2026-10-02", open: -79.4, high: -78.8, low: -79.9, close: -79.1 },
    { date: "2026-10-03", open: -79.1, high: -78.9, low: -80.2, close: -80.0 },
  ];
</script>
```

### React / Next.js

```tsx
import { CandlestickChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { date: "2026-10-01", open: -80.1, high: -79.2, low: -80.4, close: -79.4 },
  { date: "2026-10-02", open: -79.4, high: -78.8, low: -79.9, close: -79.1 },
  { date: "2026-10-03", open: -79.1, high: -78.9, low: -80.2, close: -80.0 },
];

export function FreezerB() {
  return <CandlestickChart title="Freezer B" unit=" °C" data={data} ma={[5]} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/candlestick-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";

defineProps<{ x: TcCandlestickChart["x"]; open: TcCandlestickChart["open"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-candlestick-chart :x="x" :open="open" @tc-view-change="onViewChange"></tc-candlestick-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CandlestickChart } from "@adamstavely/trenchcoat/angular/candlestick-chart";
import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";

@Component({
  selector: "app-candlestick-chart-example",
  imports: [CandlestickChart],
  template: `<tc-candlestick-chart [x]="x()" [open]="open()" (tc-view-change)="onViewChange($event)"></tc-candlestick-chart>`,
})
export class CandlestickChartExample {
  readonly x = input.required<TcCandlestickChart["x"]>();
  readonly open = input.required<TcCandlestickChart["open"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/candlestick-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";

  let { x, open }: { x: TcCandlestickChart["x"]; open: TcCandlestickChart["open"] } = $props();
  let el: TcCandlestickChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-candlestick-chart bind:this={el} {x} {open}></tc-candlestick-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `x` | – | `Accessor<T, unknown> \| undefined` | `undefined` | The period field – dates (ISO strings or epoch ms) or labels; by default "date" |
| `open` | – | `Accessor<T, number> \| undefined` | `undefined` | The opening value field; by default "open" (missing: the previous close) |
| `high` | – | `Accessor<T, number> \| undefined` | `undefined` | The high field; by default "high" |
| `low` | – | `Accessor<T, number> \| undefined` | `undefined` | The low field; by default "low" |
| `close` | – | `Accessor<T, number> \| undefined` | `undefined` | The closing value field; by default "close" (rows without one are left out) |
| `volume` | – | `Accessor<T, number> \| undefined` | `undefined` | A volume field, drawn as a strip of bars under the candles |
| `ma` | – | `number[] \| undefined` | `undefined` | Moving averages of the close to draw, in periods, e.g. [5, 20]; up to three |
| `maxCandles` | `max-candles` | `number \| undefined` | `undefined` | Merges neighbouring periods above this many candles; by default a candle per 4px of plot |
| `yDomain` | – | `[number, number] \| undefined` | `undefined` | Fixes the value axis to [min, max] |
| `candleLabels` | – | `Partial<CandlestickLabels>` | `{}` | The candlestick chart's own words, merged over defaultCandlestickLabels |
| `brush` | `brush` | `BrushMode` | `"none"` | Dragging across the candles (or Shift+arrows, then Enter) picks a range: "select" shows its change, high and low; "zoom" narrows the chart to it |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a candle, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A candle was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |
| `tc-brush` | – | No | A range of candles was picked by dragging or Shift+arrows and Enter, or cleared ({ range }: CandlestickBrushChange) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cdl-up` | `var(--tc-status-success-solid)` | both |
| `--tc-cdl-down` | `var(--tc-status-danger-solid)` | both |
| `--tc-cdl-ma-1` | `var(--tc-text-primary)` | both |
| `--tc-cdl-ma-2` | `var(--tc-text-muted)` | both |
| `--tc-cdl-ma-3` | `var(--tc-plot-zero)` | both |
| `--tc-cdl-stroke` | `1.5px` | both |

#### Design tokens it reads (10)

`--tc-cdl-ink`, `--tc-plot-bg`, `--tc-plot-line-rest`, `--tc-plot-zero`, `--tc-space-2-5`, `--tc-space-4`, `--tc-status-danger-solid`, `--tc-status-success-solid`, `--tc-text-muted`, `--tc-text-primary`

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
| `x` | `el.x = …;` | `<… x={…} />` | `<tc-candlestick-chart :x="…">` | `<tc-candlestick-chart [x]="…">` | `<tc-candlestick-chart {x}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-candlestick-chart :open="…">` | `<tc-candlestick-chart [open]="…">` | `<tc-candlestick-chart {open}>` |
| `high` | `el.high = …;` | `<… high={…} />` | `<tc-candlestick-chart :high="…">` | `<tc-candlestick-chart [high]="…">` | `<tc-candlestick-chart {high}>` |
| `low` | `el.low = …;` | `<… low={…} />` | `<tc-candlestick-chart :low="…">` | `<tc-candlestick-chart [low]="…">` | `<tc-candlestick-chart {low}>` |
| `close` | `el.close = …;` | `<… close={…} />` | `<tc-candlestick-chart :close="…">` | `<tc-candlestick-chart [close]="…">` | `<tc-candlestick-chart {close}>` |
| `volume` | `el.volume = …;` | `<… volume={…} />` | `<tc-candlestick-chart :volume="…">` | `<tc-candlestick-chart [volume]="…">` | `<tc-candlestick-chart {volume}>` |
| `ma` | `el.ma = …;` | `<… ma={…} />` | `<tc-candlestick-chart :ma="…">` | `<tc-candlestick-chart [ma]="…">` | `<tc-candlestick-chart {ma}>` |
| `yDomain` | `el.yDomain = …;` | `<… yDomain={…} />` | `<tc-candlestick-chart :yDomain="…">` | `<tc-candlestick-chart [yDomain]="…">` | `<tc-candlestick-chart {yDomain}>` |
| `candleLabels` | `el.candleLabels = …;` | `<… candleLabels={…} />` | `<tc-candlestick-chart :candleLabels="…">` | `<tc-candlestick-chart [candleLabels]="…">` | `<tc-candlestick-chart {candleLabels}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-candlestick-chart :data="…">` | `<tc-candlestick-chart [data]="…">` | `<tc-candlestick-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-candlestick-chart :highlight="…">` | `<tc-candlestick-chart [highlight]="…">` | `<tc-candlestick-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-candlestick-chart :format="…">` | `<tc-candlestick-chart [format]="…">` | `<tc-candlestick-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-candlestick-chart :labels="…">` | `<tc-candlestick-chart [labels]="…">` | `<tc-candlestick-chart {labels}>` |

*Also attributes: `max-candles`, `brush`, `heading`, `description`, `unit`, `locale`, `height`, `still` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-mark-hover` | No | `el.addEventListener("tc-mark-hover", (e) => …)` | `onMarkHover={…}` | `@tc-mark-hover="…"` | `(tc-mark-hover)="…($event)"` | `el.addEventListener("tc-mark-hover", …)` |
| `tc-mark-click` | No | `el.addEventListener("tc-mark-click", (e) => …)` | `onMarkClick={…}` | `@tc-mark-click="…"` | `(tc-mark-click)="…($event)"` | `el.addEventListener("tc-mark-click", …)` |
| `tc-brush` | No | `el.addEventListener("tc-brush", (e) => …)` | `onBrush={…}` | `@tc-brush="…"` | `(tc-brush)="…($event)"` | `el.addEventListener("tc-brush", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view` itself unless a listener calls `preventDefault()` on `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-candlestick-chart id="candlestick-chart"></tc-candlestick-chart>

<script type="module">
  import "@adamstavely/trenchcoat/candlestick-chart";

  const el = document.querySelector("#candlestick-chart");
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
import "@adamstavely/trenchcoat/candlestick-chart";
import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";

const props = defineProps<{ initial: TcCandlestickChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcCandlestickChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-candlestick-chart :view="view" @tc-view-change="onViewChange"></tc-candlestick-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CandlestickChart } from "@adamstavely/trenchcoat/angular/candlestick-chart";
import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";

@Component({
  selector: "app-controlled-candlestick-chart",
  imports: [CandlestickChart],
  template: `<tc-candlestick-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-candlestick-chart>`,
})
export class ControlledCandlestickChart {
  readonly initial = input.required<TcCandlestickChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcCandlestickChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/candlestick-chart";
  import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";

  let { initial }: { initial: TcCandlestickChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcCandlestickChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcCandlestickChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-candlestick-chart bind:this={el} {view}></tc-candlestick-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-candlestick-chart")` returns a `TcCandlestickChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";`
- **React / Next.js:** Props: `import type { CandlestickChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CandlestickChart>`. The element class, for refs: `import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCandlestickChart["x"]` with `import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";`
- **Angular:** The directive types the template: `[x]` takes `TcCandlestickChart["x"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCandlestickChart } from "@adamstavely/trenchcoat/candlestick-chart";`

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
| `onBrush` | `(range: XRange \| null) => void` | A range of candles was picked (with `brush`), or cleared (null) |

*Renamed or hidden on the wrapper: `heading`, `view`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous candle; the tooltip shows it and it's read with its open, high, low and close |
| Home / End | The first or last candle |
| Enter / Space | Picks the candle (fires `tc-mark-click`) |
| Shift + ← / → | With `brush`, widens a range from the candle; Enter settles it (or zooms into it) |
| Escape | Clears a picked range, then a zoom, then lets go of the candle; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words (the span, the first open, the last close and the
  change, the high and the low).
- A table of every candle is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the candle ("Oct 3, 2026: open -79.1, high -78.9, low -80.2, close -80, 3 of 30").
- The drawing itself is hidden; up and down are told apart by shape and in the tooltip's words, not by colour alone.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/chart/element, internal/kit | Focus rings for keyboard users. |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/chart/accessor | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/chart/element, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/chart/element | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/chart/element | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | internal/chart/element | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/chart/element, internal/chart/brush, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.2 KB | 7.5 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/chart/brush` · Shared Trenchcoat code | 4.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 2.4 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **63.1 KB** | **21.9 KB** |
| With Lit – the first component on a page | 82.5 KB | 28.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.9 ms** | the gallery demo's data, 124 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of data replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.7 ms | data: first render, 216 nodes; update 0.9 ms |
| 1,000 items | 5.1 ms | data: first render, 216 nodes; update 2.1 ms |

1,000 items of data: 5.1 ms, 216 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **56 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give dates as ISO strings ("2026-10-03") or epoch ms; anything else is a label, in data order.
- Give `unit` (" °C") rather than baking it into the values.
- Rename the tooltip's and key's words through `candleLabels`, and the shared ones through `labels`.

## Do and don't

### Do

- Keep to one or two moving averages; three is the most it draws.
- Swap `--tc-cdl-up` and `--tc-cdl-down` when a rise is the bad news, as for a freezer warming.

### Don't

- Use it for prices or trades in a product that isn't about them – a line chart is plainer.
- Pack in more periods than the width holds; let them merge, or show a shorter span.

## Related

- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Area Chart](area-chart.md) – Totals and their make-up over time as filled areas – stacked, stacked to 100% or overlapping – with names at their ends, the nearest month read across every series, and a table view
- [Box Plot](box-plot.md) – How values spread within each group – quartile boxes with medians, whiskers to 1.5 IQR and outlier rings, or violins, or both – the highest median emphasised, boxes that open from their medians, and a table view
- [Sparkline](sparkline.md) – A small trend chart that sits in text or a table cell – line, area, bars or win-loss, sized from the text – with markers, a reference line, a tone for which way it went and, when interactive, a tooltip per point

## Changelog

- **Candlestick Chart** (`tc-candlestick-chart`): open, high, low and close per period, hollow when rising, with moving averages, volume, and a range to pick or zoom into (`brush`).
