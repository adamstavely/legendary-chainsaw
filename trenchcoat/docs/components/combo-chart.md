<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Combo Chart

**Charts** · New

Bars and lines over one shared x, grouped or stacked bars with lines and dots, a second axis at the right when the ranges are far apart, and a legend that tells bars from lines and names their axis.

- **Element:** `<tc-combo-chart>`
- **Size:** 20.7 KB gzip · 57.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/combo-chart";` |
| React / Next.js | `import { ComboChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/combo-chart";` · tags starting with tc- are custom elements |
| Angular | `import { ComboChart } from "@adamstavely/trenchcoat/angular/combo-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/combo-chart";` |

## Example

The live example is in the gallery at `#/combo-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Bars and lines over one shared x. `bars` names the fields drawn as bars, side by side or, with `stacked`, on top of
each other, and `lines` the fields drawn as lines with a dot at each category. It's for a volume next to a rate:
samples processed against turnaround, runs against success rate, spend against budget.

When the lines' range is far from the bars' (more than three times larger or smaller), they get their own axis at the
right. `line-axis` fixes either side. With one bar series and one line the bars stay quiet and the line takes the
accent; more series take the chart inks in order, bars first. The legend draws bars as squares and lines as strokes,
and names the axis each is read against, so colour is never the only cue. Bars grow from the baseline when the chart
scrolls into view, then the lines draw in; both glide to new values when the data changes.

### When to use

- A count or amount and a rate or average that explains it, over the same months or categories.
- Two measures with different units, where a second axis keeps both readable.

### When not to use

- Several series of the same kind – use [Bar Chart](bar-chart.md) or [Line Chart](line-chart.md).
- Bars sorted from the largest with a running share – use [Pareto Chart](pareto-chart.md).
- One headline metric with its trend – use [KPI Chart](kpi-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Bar** `.ui-cmb__bar` – one per category and bar series
3. **Line** `.ui-cmb__line` – one per line series, with a dot `.ui-cmb__dot` at each category
4. **Axes** `.tc-chart__grid` – the left axis's grid lines and values; the right axis's values when there are two; the categories under the bars
5. **Legend** `.ui-cmb__stroke` – a short stroke for a line, the shared square for a bar, and `.ui-cmb__axis` naming its axis
6. **Tooltip** `.tc-chart__tip` – the category and every series' value there

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens: `--tc-plot-accent` and
`--tc-plot-rest` for a bar–line pair, `--tc-plot-ink-1` … `-6` for more series, `--tc-plot-grid` for grid lines.
`--tc-cmb-line-width` and `--tc-cmb-line-width-hi` set the lines' weight. Values are written in the text inks, never on
a bar. `still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-combo-chart heading="Samples and turnaround" line-unit=" h" y-label="Samples" y2-label="Hours"></tc-combo-chart>

<script type="module">
  import "@adamstavely/trenchcoat/combo-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-combo-chart");
  chart.x = "month";
  chart.bars = ["samples"];
  chart.lines = ["hours"];
  chart.seriesLabels = { samples: "Samples", hours: "Median turnaround" };
  chart.data = [
    { month: "2026-01", samples: 278, hours: 41 },
    { month: "2026-02", samples: 300, hours: 44 },
    { month: "2026-03", samples: 328, hours: 47 },
  ];
</script>
```

### React / Next.js

```tsx
import { ComboChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { month: "2026-01", samples: 278, hours: 41 },
  { month: "2026-02", samples: 300, hours: 44 },
  { month: "2026-03", samples: 328, hours: 47 },
];

export function Turnaround() {
  return (
    <ComboChart
      title="Samples and turnaround"
      data={data}
      x="month"
      bars={["samples"]}
      lines={["hours"]}
      seriesLabels={{ samples: "Samples", hours: "Median turnaround" }}
      lineUnit=" h"
      onMarkClick={(e) => console.log(e.label)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/combo-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";

defineProps<{ x: TcComboChart["x"]; bars: TcComboChart["bars"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-combo-chart :x="x" :bars="bars" @tc-view-change="onViewChange"></tc-combo-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ComboChart } from "@adamstavely/trenchcoat/angular/combo-chart";
import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";

@Component({
  selector: "app-combo-chart-example",
  imports: [ComboChart],
  template: `<tc-combo-chart [x]="x()" [bars]="bars()" (tc-view-change)="onViewChange($event)"></tc-combo-chart>`,
})
export class ComboChartExample {
  readonly x = input.required<TcComboChart["x"]>();
  readonly bars = input.required<TcComboChart["bars"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/combo-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";

  let { x, bars }: { x: TcComboChart["x"]; bars: TcComboChart["bars"] } = $props();
  let el: TcComboChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-combo-chart bind:this={el} {x} {bars}></tc-combo-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `x` | – | `Accessor<T, unknown> \| undefined` | `undefined` | The x field – categories or dates, each drawn as a band; by default "x" |
| `bars` | – | `string[]` | `[]` | The fields drawn as bars, in order |
| `lines` | – | `string[]` | `[]` | The fields drawn as lines, in order |
| `seriesLabels` | – | `Record<string, string>` | `{}` | Display names for the fields; a field without one is shown as it is |
| `stacked` | `stacked` | `boolean` | `false` | Stacks several bar series instead of setting them side by side |
| `lineAxis` | `line-axis` | `ComboLineAxis \| undefined` | `undefined` | The axis the lines are read against; by default the right one when their range is far from the bars' |
| `lineFormat` | – | `FormatSpec \| undefined` | `undefined` | How the lines' values are written, as `format`; by default `format` when they share the left axis |
| `lineUnit` | `line-unit` | `string \| undefined` | `undefined` | The unit after each line value: "h", "%"; by default `unit` when they share the left axis |
| `curve` | `curve` | `Curve` | `"linear"` | How lines bend between points: "smooth", "linear" or "step" |
| `yLabel` | `y-label` | `string \| undefined` | `undefined` | The left axis' title, above it: "Samples" |
| `y2Label` | `y2-label` | `string \| undefined` | `undefined` | The right axis' title, above it: "Hours" |
| `comboLabels` | – | `Partial<ComboChartLabels>` | `{}` | The combo chart's own words, merged over defaultComboChartLabels |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to an x, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | An x was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cmb-line-width` | `2` | both |
| `--tc-cmb-line-width-hi` | `2.6` | both |

#### Design tokens it reads (6)

`--tc-cmb-ink`, `--tc-plot-bg`, `--tc-radius-full`, `--tc-space-1`, `--tc-space-3-5`, `--tc-text-muted`

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
| `x` | `el.x = …;` | `<… x={…} />` | `<tc-combo-chart :x="…">` | `<tc-combo-chart [x]="…">` | `<tc-combo-chart {x}>` |
| `bars` | `el.bars = …;` | `<… bars={…} />` | `<tc-combo-chart :bars="…">` | `<tc-combo-chart [bars]="…">` | `<tc-combo-chart {bars}>` |
| `lines` | `el.lines = …;` | `<… lines={…} />` | `<tc-combo-chart :lines="…">` | `<tc-combo-chart [lines]="…">` | `<tc-combo-chart {lines}>` |
| `seriesLabels` | `el.seriesLabels = …;` | `<… seriesLabels={…} />` | `<tc-combo-chart :seriesLabels="…">` | `<tc-combo-chart [seriesLabels]="…">` | `<tc-combo-chart {seriesLabels}>` |
| `lineFormat` | `el.lineFormat = …;` | `<… lineFormat={…} />` | `<tc-combo-chart :lineFormat="…">` | `<tc-combo-chart [lineFormat]="…">` | `<tc-combo-chart {lineFormat}>` |
| `comboLabels` | `el.comboLabels = …;` | `<… comboLabels={…} />` | `<tc-combo-chart :comboLabels="…">` | `<tc-combo-chart [comboLabels]="…">` | `<tc-combo-chart {comboLabels}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-combo-chart :data="…">` | `<tc-combo-chart [data]="…">` | `<tc-combo-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-combo-chart :highlight="…">` | `<tc-combo-chart [highlight]="…">` | `<tc-combo-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-combo-chart :format="…">` | `<tc-combo-chart [format]="…">` | `<tc-combo-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-combo-chart :labels="…">` | `<tc-combo-chart [labels]="…">` | `<tc-combo-chart {labels}>` |

*Also attributes: `stacked`, `line-axis`, `line-unit`, `curve`, `y-label`, `y2-label`, `heading`, `description` and 10 more – see the API table.*

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
<tc-combo-chart id="combo-chart"></tc-combo-chart>

<script type="module">
  import "@adamstavely/trenchcoat/combo-chart";

  const el = document.querySelector("#combo-chart");
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
import "@adamstavely/trenchcoat/combo-chart";
import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";

const props = defineProps<{ initial: TcComboChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcComboChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-combo-chart :view="view" @tc-view-change="onViewChange"></tc-combo-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ComboChart } from "@adamstavely/trenchcoat/angular/combo-chart";
import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";

@Component({
  selector: "app-controlled-combo-chart",
  imports: [ComboChart],
  template: `<tc-combo-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-combo-chart>`,
})
export class ControlledComboChart {
  readonly initial = input.required<TcComboChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcComboChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/combo-chart";
  import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";

  let { initial }: { initial: TcComboChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcComboChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcComboChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-combo-chart bind:this={el} {view}></tc-combo-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-combo-chart")` returns a `TcComboChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";`
- **React / Next.js:** Props: `import type { ComboChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ComboChart>`. The element class, for refs: `import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcComboChart["x"]` with `import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";`
- **Angular:** The directive types the template: `[x]` takes `TcComboChart["x"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcComboChart } from "@adamstavely/trenchcoat/combo-chart";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the chart's name |
| `view` | `ChartView` | The chart or the table – controlled when given |
| `defaultView` | `ChartView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: ChartView) => void` | The Table button was pressed |
| `onMarkHover` | `(event: ChartEvent \| null) => void` | The pointer or keyboard moved to an x (null: off them) |
| `onMarkClick` | `(event: ChartEvent) => void` | An x was clicked, or picked with Enter or Space |

*Renamed or hidden on the wrapper: `heading`, `view`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous category; the tooltip shows it and every series is read |
| Home / End | The first or last category |
| Enter / Space | Picks the category (fires `tc-mark-click`) |
| Escape | Lets go; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words: the span of x, which series are bars and which are lines, and the axis the lines use.
- A table of every category with each series' value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows reads the category with every series ("Mar: Genomics 210, Proteomics 118, Median turnaround 47 h, 3 of 12").
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
| **This component alone** | 12.9 KB | 5.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.5 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/chart/series` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/stack` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **57.4 KB** | **20.7 KB** |
| With Lit – the first component on a page | 76.8 KB | 26.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 70 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of data replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.2 ms | data: first render, 70 nodes; update 0.7 ms |
| 1,000 items | 3.5 ms | data: first render, 70 nodes; update 1.4 ms |

What it renders doesn't grow with data (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **6 frames/s** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give each field a display name in `seriesLabels`.
- Put units in `unit` for the bars and `line-unit` for the lines rather than in the values.
- Title both axes with `y-label` and `y2-label` when there are two.

## Do and don't

### Do

- Pair one volume with one rate – the clearest combo.
- Let the second axis appear only when the ranges are far apart; a shared axis is easier to read.

### Don't

- Put more than two or three series on one combo chart.
- Use a second axis to make two unrelated measures look related.

## Related

- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Pareto Chart](pareto-chart.md) – Which few items make most of a whole – bars from the largest down, the running share as a line across them, a dashed 80% threshold, the bars that reach it emphasised and their share beside the line, with a table view
