<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Beeswarm Chart

**Charts** · New

A distribution point by point – every value a dot pushed clear of the others, in one row or a row per group with its median marked – the highest group emphasised, dots that grow in, and a canvas for thousands of points

- **Element:** `<tc-beeswarm-chart>`
- **Size:** 18.0 KB gzip · 50.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/beeswarm-chart";` |
| React / Next.js | `import { BeeswarmChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/beeswarm-chart";` · tags starting with tc- are custom elements |
| Angular | `import { BeeswarmChart } from "@adamstavely/trenchcoat/angular/beeswarm-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/beeswarm-chart";` |

## Example

The live example is in the gallery at `#/beeswarm-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A distribution drawn point by point. Every value is a dot along one axis, pushed up or down just enough that none
overlap, so clusters, gaps and outliers show where a histogram or a box would hide them. With `group` each group gets
its own row with its median marked by a dashed line; the group with the highest median takes the accent and the rest
stay quiet, and `highlight` picks others. Without groups the dots share one row and the highest one takes the accent.

The dots grow in from their row's middle, left to right, when the chart scrolls into view and glide when the data
changes. Past `canvas-threshold` points (2,000 by default) they're painted on a canvas under the drawing, which keeps
the axis, the medians and the active dot. Ported from ztd-charts (MIT).

### When to use

- Showing how values spread – turnaround times, measurements, scores – with every value still visible.
- Comparing a few groups' distributions and medians side by side.

### When not to use

- A value per category – use [Bar Chart](bar-chart.md).
- Two values per point, or three with a size – use [Bubble Chart](bubble-chart.md).
- Change over time – use [Line Chart](line-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Dot** `.ui-bsw__dot` – one per value; the emphasised group's in the accent
3. **Median** `.ui-bsw__median` – each group's median, a dashed line with its value above
4. **Axis** `.tc-chart__grid` – the value grid lines and their values; the group names at the left
5. **Canvas** `.tc-chart__canvas` – the dots, painted, past the threshold
6. **Tooltip** `.tc-chart__tip` – the dot's name, group and value

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` and `--tc-plot-rest` for emphasis, `--tc-plot-grid` for grid lines,
`--tc-bsw-median` for the median lines. The canvas reads the same tokens, so it follows the look and the theme. Values
are written in the text inks beside the dots, never on them. `still` (or the system's reduced-motion setting) draws
everything at once.

## Usage

### HTML

```html
<tc-beeswarm-chart heading="Assay turnaround" description="This month, by lab" unit=" h"></tc-beeswarm-chart>

<script type="module">
  import "@adamstavely/trenchcoat/beeswarm-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-beeswarm-chart");
  chart.value = "hours";
  chart.group = "lab";
  chart.data = [
    { lab: "Genomics", hours: 4.2 },
    { lab: "Genomics", hours: 5.1 },
    { lab: "Imaging", hours: 8.1 },
    { lab: "Imaging", hours: 7.4 },
  ];
</script>
```

### React / Next.js

```tsx
import { BeeswarmChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { lab: "Genomics", hours: 4.2 },
  { lab: "Genomics", hours: 5.1 },
  { lab: "Imaging", hours: 8.1 },
  { lab: "Imaging", hours: 7.4 },
];

export function Turnaround() {
  return <BeeswarmChart title="Assay turnaround" description="This month, by lab" data={data} value="hours" group="lab" unit=" h" onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/beeswarm-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";

defineProps<{ value: TcBeeswarmChart["value"]; group: TcBeeswarmChart["group"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-beeswarm-chart :value="value" :group="group" @tc-view-change="onViewChange"></tc-beeswarm-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BeeswarmChart } from "@adamstavely/trenchcoat/angular/beeswarm-chart";
import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";

@Component({
  selector: "app-beeswarm-chart-example",
  imports: [BeeswarmChart],
  template: `<tc-beeswarm-chart [value]="value()" [group]="group()" (tc-view-change)="onViewChange($event)"></tc-beeswarm-chart>`,
})
export class BeeswarmChartExample {
  readonly value = input.required<TcBeeswarmChart["value"]>();
  readonly group = input.required<TcBeeswarmChart["group"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/beeswarm-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";

  let { value, group }: { value: TcBeeswarmChart["value"]; group: TcBeeswarmChart["group"] } = $props();
  let el: TcBeeswarmChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-beeswarm-chart bind:this={el} {value} {group}></tc-beeswarm-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field; by default "value" |
| `group` | – | `Accessor<T, string> \| undefined` | `undefined` | The group field – a row per group; without it, one row |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The dot's name field, for the tooltip and table; by default "label", else "#n" |
| `radius` | `radius` | `number \| undefined` | `undefined` | The dots' radius in px; by default sized to how many there are |
| `hideMedian` | `hide-median` | `boolean` | `false` | Leaves off each group's median line |
| `canvasThreshold` | `canvas-threshold` | `number` | `2000` | Above this many points the dots are painted on a canvas |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a dot, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A dot was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-bsw-median` | `var(--tc-text-primary)` | both |

#### Design tokens it reads (3)

`--tc-plot-bg`, `--tc-plot-focus`, `--tc-text-primary`

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-beeswarm-chart :value="…">` | `<tc-beeswarm-chart [value]="…">` | `<tc-beeswarm-chart {value}>` |
| `group` | `el.group = …;` | `<… group={…} />` | `<tc-beeswarm-chart :group="…">` | `<tc-beeswarm-chart [group]="…">` | `<tc-beeswarm-chart {group}>` |
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-beeswarm-chart :label="…">` | `<tc-beeswarm-chart [label]="…">` | `<tc-beeswarm-chart {label}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-beeswarm-chart :data="…">` | `<tc-beeswarm-chart [data]="…">` | `<tc-beeswarm-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-beeswarm-chart :highlight="…">` | `<tc-beeswarm-chart [highlight]="…">` | `<tc-beeswarm-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-beeswarm-chart :format="…">` | `<tc-beeswarm-chart [format]="…">` | `<tc-beeswarm-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-beeswarm-chart :labels="…">` | `<tc-beeswarm-chart [labels]="…">` | `<tc-beeswarm-chart {labels}>` |

*Also attributes: `radius`, `hide-median`, `canvas-threshold`, `heading`, `description`, `unit`, `locale`, `height` and 7 more – see the API table.*

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
<tc-beeswarm-chart id="beeswarm-chart"></tc-beeswarm-chart>

<script type="module">
  import "@adamstavely/trenchcoat/beeswarm-chart";

  const el = document.querySelector("#beeswarm-chart");
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
import "@adamstavely/trenchcoat/beeswarm-chart";
import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";

const props = defineProps<{ initial: TcBeeswarmChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcBeeswarmChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-beeswarm-chart :view="view" @tc-view-change="onViewChange"></tc-beeswarm-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BeeswarmChart } from "@adamstavely/trenchcoat/angular/beeswarm-chart";
import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";

@Component({
  selector: "app-controlled-beeswarm-chart",
  imports: [BeeswarmChart],
  template: `<tc-beeswarm-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-beeswarm-chart>`,
})
export class ControlledBeeswarmChart {
  readonly initial = input.required<TcBeeswarmChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcBeeswarmChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/beeswarm-chart";
  import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";

  let { initial }: { initial: TcBeeswarmChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcBeeswarmChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcBeeswarmChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-beeswarm-chart bind:this={el} {view}></tc-beeswarm-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-beeswarm-chart")` returns a `TcBeeswarmChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";`
- **React / Next.js:** Props: `import type { BeeswarmChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BeeswarmChart>`. The element class, for refs: `import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBeeswarmChart["value"]` with `import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";`
- **Angular:** The directive types the template: `[value]` takes `TcBeeswarmChart["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBeeswarmChart } from "@adamstavely/trenchcoat/beeswarm-chart";`

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
| Arrow keys | Move to the next or previous dot, in data order; the tooltip shows it and it's read with its value |
| Home / End | The first or last dot |
| Enter / Space | Picks the dot (fires `tc-mark-click`) |
| Escape | Lets go of the dot; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words: how many points and groups, and each group's median.
- A table of the values is always there for screen readers (the first 60, and how many more); the Table button shows
  it to everyone.
- Moving with the arrows announces the dot with its group, value and position ("S1 Genomics: 4.2 h, 1 of 144").
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
| **This component alone** | 9.8 KB | 4.6 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/stats` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/chart/canvas` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **50.3 KB** | **18.0 KB** |
| With Lit – the first component on a page | 69.7 KB | 24.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 19 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |

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

- Keep group names short – they share the left edge with the plot.
- Give each point a `label` so the tooltip and table name it; without one it's numbered.
- Give `unit` (" h", " ms") rather than baking it into the values.

## Do and don't

### Do

- Use a handful of groups – about five rows read well.
- Let the median carry the comparison; the dots show the spread behind it.

### Don't

- Use it for a few values – a bar or a list says it more plainly.
- Lower `canvas-threshold` to force a canvas on small data; SVG dots are crisper and animate one by one.

## Related

- [Bubble Chart](bubble-chart.md) – Points by two values with a third as the circle's area, or a scatter plot without it – the largest emphasised and named where names fit, the circle under the pointer picked, and a canvas for thousands of points
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view

## Changelog

- **Beeswarm Chart** (`tc-beeswarm-chart`) and **Bubble Chart** (`tc-bubble-chart`): every point drawn, switching to a canvas for thousands of them.
