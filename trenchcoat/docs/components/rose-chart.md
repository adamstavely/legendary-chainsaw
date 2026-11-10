<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Rose Chart

**Charts** · New

A polar area (Nightingale rose) chart: equal-angle wedges whose area shows each value, the largest emphasised, stacked by series with a legend if wanted, with round-value rings.

- **Element:** `<tc-rose-chart>`
- **Size:** 17.0 KB gzip · 47.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/rose-chart";` |
| React / Next.js | `import { RoseChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/rose-chart";` · tags starting with tc- are custom elements |
| Angular | `import { RoseChart } from "@adamstavely/trenchcoat/angular/rose-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/rose-chart";` |

## Example

The live example is in the gallery at `#/rose-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A polar area chart – a Nightingale rose. Each item is a wedge, every wedge the same angle, reaching out as far as its
value. The area grows with the value, not the radius (the radius goes with the value's square root), so a wedge with
twice the value covers twice the area and the eye isn't misled. The largest wedge takes the accent and the rest stay
quiet; `highlight` picks others.

With `series`, each wedge is split into rings, one per series in its own chart ink, stacked out from the centre, with
a legend in the header; the outer edge is the wedge's total. Rings at round values sit under the wedges, their numbers
on chips of the card's colour along the line where the first wedge starts. `start-angle` turns the rose, and
`inner-radius` leaves a hole in the middle. Wedges grow out from the centre when the chart scrolls into view and glide
when the data changes.

### When to use

- A value for each step of a cycle – months, weekdays, hours, compass directions – where the cycle itself matters.
- Seeing which parts of the cycle are busy at a glance, and how a few series make up each part.

### When not to use

- Comparing values precisely – use [Bar Chart](bar-chart.md); lengths are easier to compare than areas.
- Shares of one whole – use [Pie Chart](pie-chart.md).
- Progress towards targets – use [Radial Bar Chart](radial-bar-chart.md).
- Several measures of one item – use [Radar Chart](radar-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the legend (with `series`) and the Table button
2. **Wedge** `.ui-rse__wedge` – one per item, or one ring per series within it; the largest in the accent
3. **Ring** `.ui-rse__grid` – circles at round values under the wedges
4. **Ring value** `.ui-rse__ticks` – each ring's value on a chip where the first wedge starts
5. **Name** `.tc-chart__value` – each wedge's name outside the rim; thinned when the wedges are narrow
6. **Tooltip** `.tc-chart__tip` – the wedge's value, or each series' part and the total

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both. A single series takes `--tc-plot-accent` and `--tc-plot-rest`; series take the chart inks
`--tc-plot-ink-1` to `-6`. Wedges are parted by a line of `--tc-plot-bg`, the rings drawn in `--tc-plot-grid`. No text
sits on a wedge: names are outside the rim and ring values on chips. `still` (or the system's reduced-motion setting)
draws everything at once.

## Usage

### HTML

```html
<tc-rose-chart heading="Grant applications" description="By month, this year"></tc-rose-chart>

<script type="module">
  import "@adamstavely/trenchcoat/rose-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-rose-chart").data = [
    { label: "Jan", value: 35 },
    { label: "Feb", value: 42 },
    { label: "Mar", value: 54 },
    { label: "Apr", value: 33 },
  ];
</script>
```

### React / Next.js

```tsx
import { RoseChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Jan", series: "Council", value: 22 },
  { label: "Jan", series: "Industry", value: 4 },
  { label: "Feb", series: "Council", value: 26 },
  { label: "Feb", series: "Industry", value: 5 },
];

export function Applications() {
  return <RoseChart title="Applications by funder" data={data} series="series" innerRadius={0.18} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/rose-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";

defineProps<{ label: TcRoseChart["label"]; value: TcRoseChart["value"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-rose-chart :label="label" :value="value" @tc-view-change="onViewChange"></tc-rose-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RoseChart } from "@adamstavely/trenchcoat/angular/rose-chart";
import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";

@Component({
  selector: "app-rose-chart-example",
  imports: [RoseChart],
  template: `<tc-rose-chart [label]="label()" [value]="value()" (tc-view-change)="onViewChange($event)"></tc-rose-chart>`,
})
export class RoseChartExample {
  readonly label = input.required<TcRoseChart["label"]>();
  readonly value = input.required<TcRoseChart["value"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/rose-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";

  let { label, value }: { label: TcRoseChart["label"]; value: TcRoseChart["value"] } = $props();
  let el: TcRoseChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-rose-chart bind:this={el} {label} {value}></tc-rose-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The wedge's name field; by default "label" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field; by default "value" |
| `series` | – | `Accessor<T, string> \| undefined` | `undefined` | The series field: each wedge is split into a ring per series, stacked out from the centre |
| `startAngle` | `start-angle` | `number` | `0` | Where the first wedge starts, in degrees clockwise from 12 o'clock |
| `innerRadius` | `inner-radius` | `number` | `0` | A hole in the middle, as a share of the radius (0–0.6) |
| `roseLabels` | – | `Partial<RoseLabels>` | `{}` | The rose chart's own words, merged over defaultRoseLabels |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a wedge, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A wedge was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-rose-chart :label="…">` | `<tc-rose-chart [label]="…">` | `<tc-rose-chart {label}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-rose-chart :value="…">` | `<tc-rose-chart [value]="…">` | `<tc-rose-chart {value}>` |
| `series` | `el.series = …;` | `<… series={…} />` | `<tc-rose-chart :series="…">` | `<tc-rose-chart [series]="…">` | `<tc-rose-chart {series}>` |
| `roseLabels` | `el.roseLabels = …;` | `<… roseLabels={…} />` | `<tc-rose-chart :roseLabels="…">` | `<tc-rose-chart [roseLabels]="…">` | `<tc-rose-chart {roseLabels}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-rose-chart :data="…">` | `<tc-rose-chart [data]="…">` | `<tc-rose-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-rose-chart :highlight="…">` | `<tc-rose-chart [highlight]="…">` | `<tc-rose-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-rose-chart :format="…">` | `<tc-rose-chart [format]="…">` | `<tc-rose-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-rose-chart :labels="…">` | `<tc-rose-chart [labels]="…">` | `<tc-rose-chart {labels}>` |

*Also attributes: `start-angle`, `inner-radius`, `heading`, `description`, `unit`, `locale`, `height`, `still` and 6 more – see the API table.*

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
<tc-rose-chart id="rose-chart"></tc-rose-chart>

<script type="module">
  import "@adamstavely/trenchcoat/rose-chart";

  const el = document.querySelector("#rose-chart");
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
import "@adamstavely/trenchcoat/rose-chart";
import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";

const props = defineProps<{ initial: TcRoseChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcRoseChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-rose-chart :view="view" @tc-view-change="onViewChange"></tc-rose-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RoseChart } from "@adamstavely/trenchcoat/angular/rose-chart";
import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";

@Component({
  selector: "app-controlled-rose-chart",
  imports: [RoseChart],
  template: `<tc-rose-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-rose-chart>`,
})
export class ControlledRoseChart {
  readonly initial = input.required<TcRoseChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcRoseChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/rose-chart";
  import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";

  let { initial }: { initial: TcRoseChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcRoseChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcRoseChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-rose-chart bind:this={el} {view}></tc-rose-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-rose-chart")` returns a `TcRoseChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";`
- **React / Next.js:** Props: `import type { RoseChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RoseChart>`. The element class, for refs: `import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRoseChart["label"]` with `import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";`
- **Angular:** The directive types the template: `[label]` takes `TcRoseChart["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRoseChart } from "@adamstavely/trenchcoat/rose-chart";`

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
| Arrow keys | Move to the next or previous wedge, clockwise; the tooltip shows it and it's read with its value |
| Home / End | The first or last wedge |
| Enter / Space | Picks the wedge (fires `tc-mark-click`) |
| Escape | Lets go of the wedge; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words: how many wedges, the series, and the largest.
- A table of every wedge's value (each series' part and the total, with `series`) is always there for screen readers;
  the Table button shows it to everyone.
- Moving with the arrows announces the wedge ("Jan: 22, 1 of 12").
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

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 8.8 KB | 4.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.5 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **47.8 KB** | **17.0 KB** |
| With Lit – the first component on a page | 67.3 KB | 23.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 16 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Order the rows the way the cycle runs; the wedges go clockwise from `start-angle` in that order.
- Keep names short – "Jan", "Mon", "NE" – so they fit round the rim.
- Rename the tooltip's and summary's words through `roseLabels`, and the shared ones through `labels`.

## Do and don't

### Do

- Use it when the cycle is the point – a seasonal rhythm reads at once.
- Keep to three or four series when stacking; more rings get hard to tell apart.

### Don't

- Use it for items with no order – the circle implies one.
- Read exact values off it; give the table or the tooltip for that.

## Related

- [Pie Chart](pie-chart.md) – A few shares of a whole as slices, each in its own ink or one emphasised, the shares written beside them and the pointed-at slice lifting out
- [Radial Bar Chart](radial-bar-chart.md) – A few ratios as rings round a centre, each filled towards its target – the largest emphasised, each named with its value where its ring starts, or the emphasised value in a full circle's middle – rings that sweep round in turn
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Radar Chart](radar-chart.md) – A few measures on axes round a centre, joined into a shape – one series with its value on each axis, or up to three compared – as a cross of axes or a web of rings, with a table view
