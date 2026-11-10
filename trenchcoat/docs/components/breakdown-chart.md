<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Breakdown Chart

**Data & charts**

Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table

- **Element:** `<tc-breakdown-chart>`
- **Size:** 12.5 KB gzip · 47.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/breakdown-chart";` |
| React / Next.js | `import { BreakdownChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/breakdown-chart";` · tags starting with tc- are custom elements |
| Angular | `import { BreakdownChart } from "@adamstavely/trenchcoat/angular/breakdown-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/breakdown-chart";` |

## Example

The live example is in the gallery at `#/breakdown-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A stacked bar chart that people can re-cut themselves. Three pickers choose what to measure (a count, or the sum of
a field), how to slice the bars and how to segment them; hovering or focusing a bar shows its breakdown, and the
legend hides and shows segments. A table under the chart holds the same numbers, so they can be read exactly and
by screen readers. It answers “where is the work, and what is it made of” without building a chart for every
question.

### When to use

- Workload, spend or usage broken down by two fields at once – status by priority, team by type.
- Dashboards where people explore the same records from several angles.
- Any chart whose exact numbers matter as much as its shape.

### When not to use

- One breakdown in a small space, without pickers – use [Compact Breakdown](compact-breakdown.md).
- A metric over time – use [KPI Chart](kpi-chart.md).
- Many columns of record-level detail to sort and filter – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Pickers** `.ui-bc__controls` – Measure, Slice and Segment
3. **Bar** `.ui-bc__col` – one slice value, stacked by segment; hover or focus shows its breakdown
4. **Breakdown** `.ui-bc__tooltip` – the bar's total and each segment's share, largest first
5. **Table** `.ui-bc__table` – the same numbers, one row per bar and one column per segment
6. **Legend** `.ui-bc__foot` – a chip per segment value to hide or show it, wrapping onto more rows when narrow, and Show all

## Looks

Standard sets the pickers, chart and table on a white card in the gray tray, with the legend on the tray below.
Clean has no tray: one white card with the title and total on top, quiet white pickers, hairline gridlines and the
legend as the card's last row. Each look has its own segment palette, every colour at least 3:1 against the
surface in both themes. In both looks the legend wraps onto more rows when the chips don't fit, so none is cut off on
a phone. Both stop at 560 px wide; set `fill` to let the chart take its container's whole width on a dashboard.

## Usage

### HTML

```html
<tc-breakdown-chart id="work" heading="Sprint 24 workload" fill></tc-breakdown-chart>

<script type="module">
  import "@adamstavely/trenchcoat/breakdown-chart";
  import "@adamstavely/trenchcoat/tokens.css";

  const chart = document.querySelector("#work");
  chart.dimensions = [
    { key: "status", label: "Status", values: ["Todo", "In progress", "Done"] },
    { key: "priority", label: "Priority", values: ["High", "Low"], colors: { High: "#db2777", Low: "#2f6bff" } },
  ];
  chart.measures = [
    { key: "count", label: "Count", unit: "tasks" },
    { key: "points", label: "Points", unit: "points", field: "points" },
  ];
  chart.records = [
    { status: "Todo", priority: "High", points: 3 },
    { status: "In progress", priority: "Low", points: 5 },
    { status: "Done", priority: "High", points: 2 },
  ];
  chart.addEventListener("tc-segment-change", (e) => console.log(e.detail.segment));
</script>
```

### React / Next.js

```tsx
import { BreakdownChart, type BreakdownRecord, type Dimension, type Measure } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const dimensions: Dimension[] = [
  { key: "status", label: "Status", values: ["Todo", "In progress", "Done"] },
  { key: "priority", label: "Priority", values: ["High", "Low"] },
];
const measures: Measure[] = [{ key: "count", label: "Count", unit: "tasks" }];

export function Workload({ records }: { records: BreakdownRecord[] }) {
  return <BreakdownChart title="Sprint 24 workload" records={records} dimensions={dimensions} measures={measures} defaultSegment="priority" fill />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/breakdown-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";

defineProps<{ records: TcBreakdownChart["records"]; dimensions: TcBreakdownChart["dimensions"] }>();
const onMeasureChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-breakdown-chart :records="records" :dimensions="dimensions" @tc-measure-change="onMeasureChange"></tc-breakdown-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BreakdownChart } from "@adamstavely/trenchcoat/angular/breakdown-chart";
import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";

@Component({
  selector: "app-breakdown-chart-example",
  imports: [BreakdownChart],
  template: `<tc-breakdown-chart [records]="records()" [dimensions]="dimensions()" (tc-measure-change)="onMeasureChange($event)"></tc-breakdown-chart>`,
})
export class BreakdownChartExample {
  readonly records = input.required<TcBreakdownChart["records"]>();
  readonly dimensions = input.required<TcBreakdownChart["dimensions"]>();
  onMeasureChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/breakdown-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";

  let { records, dimensions }: { records: TcBreakdownChart["records"]; dimensions: TcBreakdownChart["dimensions"] } = $props();
  let el: TcBreakdownChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-measure-change", on);
    return () => el.removeEventListener("tc-measure-change", on);
  });
</script>

<tc-breakdown-chart bind:this={el} {records} {dimensions}></tc-breakdown-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Workload"` | The heading, and the region's name |
| `fill` | `fill` | `boolean` | `false` | Grow to the container's width instead of stopping at 560px |
| `records` | – | `BreakdownRecord[]` | `[]` | The rows to chart – one object per item, with a value for each dimension key and each measure field |
| `dimensions` | – | `BreakdownDimension[]` | `[]` | The fields people can slice and segment by, with their values in display order |
| `measures` | – | `BreakdownMeasure[]` | `[]` | What the bars can measure – a count of records, or the sum of a field |
| `measure` | `measure` | `string \| undefined` | `undefined` | Measure key; unset is the first measure |
| `slice` | `slice` | `string \| undefined` | `undefined` | Dimension key the bars are sliced by; unset is the first dimension |
| `segment` | `segment` | `string \| undefined` | `undefined` | Dimension key the bars are segmented by, or "none" for single-color bars; unset is the second dimension |
| `hiddenSegments` | – | `string[]` | `[]` | Segment values hidden from the bars and totals; picking another segment clears it (`hidden` is the HTML attribute) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-measure-change` | – | Yes | The measure was picked; detail `{ measure: string }`. Cancelable (controlled use) |
| `tc-slice-change` | – | Yes | The slice dimension was picked; detail `{ slice: string }`. Cancelable |
| `tc-segment-change` | – | Yes | The segment dimension was picked ("none" for single-color bars); detail `{ segment: string }`. Cancelable |
| `tc-hidden-change` | – | Yes | Segment values were hidden or shown; detail `{ hidden: string[] }`. Cancelable |

#### Design tokens it reads (91)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-breakdown-chart-tip-gap`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-7`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `breakdownStatusIcon({ kind, color = "currentColor", look }: { kind: BreakdownStatusKind; color?: string; look?: Look }): SVGSVGElement` | A small status icon element, for a dimension's `icons`. Without `look` it takes the chart's look |

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
| `records` | `el.records = …;` | `<… records={…} />` | `<tc-breakdown-chart :records="…">` | `<tc-breakdown-chart [records]="…">` | `<tc-breakdown-chart {records}>` |
| `dimensions` | `el.dimensions = …;` | `<… dimensions={…} />` | `<tc-breakdown-chart :dimensions="…">` | `<tc-breakdown-chart [dimensions]="…">` | `<tc-breakdown-chart {dimensions}>` |
| `measures` | `el.measures = …;` | `<… measures={…} />` | `<tc-breakdown-chart :measures="…">` | `<tc-breakdown-chart [measures]="…">` | `<tc-breakdown-chart {measures}>` |
| `hiddenSegments` | `el.hiddenSegments = …;` | `<… hiddenSegments={…} />` | `<tc-breakdown-chart :hiddenSegments="…">` | `<tc-breakdown-chart [hiddenSegments]="…">` | `<tc-breakdown-chart {hiddenSegments}>` |

*Also attributes: `heading`, `fill`, `measure`, `slice`, `segment` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-measure-change` | Yes | `el.addEventListener("tc-measure-change", (e) => …)` | `ref.current.addEventListener("tc-measure-change", …)` | `@tc-measure-change="…"` | `(tc-measure-change)="…($event)"` | `el.addEventListener("tc-measure-change", …)` |
| `tc-slice-change` | Yes | `el.addEventListener("tc-slice-change", (e) => …)` | `ref.current.addEventListener("tc-slice-change", …)` | `@tc-slice-change="…"` | `(tc-slice-change)="…($event)"` | `el.addEventListener("tc-slice-change", …)` |
| `tc-segment-change` | Yes | `el.addEventListener("tc-segment-change", (e) => …)` | `ref.current.addEventListener("tc-segment-change", …)` | `@tc-segment-change="…"` | `(tc-segment-change)="…($event)"` | `el.addEventListener("tc-segment-change", …)` |
| `tc-hidden-change` | Yes | `el.addEventListener("tc-hidden-change", (e) => …)` | `ref.current.addEventListener("tc-hidden-change", …)` | `@tc-hidden-change="…"` | `(tc-hidden-change)="…($event)"` | `el.addEventListener("tc-hidden-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `measure`, `slice` and `segment` itself unless a listener calls `preventDefault()` on `tc-measure-change`, `tc-slice-change` or `tc-segment-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-breakdown-chart id="breakdown-chart"></tc-breakdown-chart>

<script type="module">
  import "@adamstavely/trenchcoat/breakdown-chart";

  const el = document.querySelector("#breakdown-chart");
  el.addEventListener("tc-measure-change", (e) => {
    e.preventDefault(); // the element keeps its measure…
    if (allowed(e.detail.measure)) el.measure = e.detail.measure; // …until the app sets it
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
import "@adamstavely/trenchcoat/breakdown-chart";
import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";

const props = defineProps<{ initial: TcBreakdownChart["measure"] }>();
const measure = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMeasureChange = (e: CustomEvent<{ measure: TcBreakdownChart["measure"] }>) => {
  e.preventDefault();
  measure.value = e.detail.measure;
};
</script>

<template>
  <tc-breakdown-chart :measure="measure" @tc-measure-change="onMeasureChange"></tc-breakdown-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BreakdownChart } from "@adamstavely/trenchcoat/angular/breakdown-chart";
import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";

@Component({
  selector: "app-controlled-breakdown-chart",
  imports: [BreakdownChart],
  template: `<tc-breakdown-chart [measure]="measure()" (tc-measure-change)="onMeasureChange($event)"></tc-breakdown-chart>`,
})
export class ControlledBreakdownChart {
  readonly initial = input.required<TcBreakdownChart["measure"]>();
  readonly measure = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMeasureChange(e: CustomEvent<{ measure: TcBreakdownChart["measure"] }>) {
    e.preventDefault();
    this.measure.set(e.detail.measure);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/breakdown-chart";
  import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";

  let { initial }: { initial: TcBreakdownChart["measure"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let measure = $derived(initial);
  let el: TcBreakdownChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      measure = (e as CustomEvent<{ measure: TcBreakdownChart["measure"] }>).detail.measure;
    };
    el.addEventListener("tc-measure-change", on);
    return () => el.removeEventListener("tc-measure-change", on);
  });
</script>

<tc-breakdown-chart bind:this={el} {measure}></tc-breakdown-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-breakdown-chart")` returns a `TcBreakdownChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";`
- **React / Next.js:** Props: `import type { BreakdownChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BreakdownChart>`. The element class, for refs: `import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBreakdownChart["records"]` with `import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";`
- **Angular:** The directive types the template: `[records]` takes `TcBreakdownChart["records"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBreakdownChart } from "@adamstavely/trenchcoat/breakdown-chart";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `records` | `TcBreakdownChart["records"]` | The rows to chart – one object per item, with a value for each dimension key and each measure field |
| `dimensions` | `Dimension[]` | The fields people can slice and segment by; `icons` takes React nodes |
| `measures` | `Measure[]` | What the bars can measure – a count of records, or the sum of a field |
| `title` | `string` | The heading, and the region's name (default "Workload") |
| `measure` | `string` | Measure key (controlled). Leave undefined and use `defaultMeasure` to let the chart keep it |
| `defaultMeasure` | `string` | The measure picked at first, when `measure` is not controlled – defaults to the first |
| `onMeasureChange` | `(measure: string) => void` | Called when another measure is picked |
| `slice` | `string` | Dimension key the bars are sliced by (controlled) |
| `defaultSlice` | `string` | The slice picked at first, when `slice` is not controlled – defaults to the first dimension |
| `onSliceChange` | `(slice: string) => void` | Called when another slice is picked |
| `segment` | `string` | Dimension key the bars are segmented by, or "none" for single-color bars (controlled) |
| `defaultSegment` | `string` | The segment picked at first, when `segment` is not controlled – defaults to the second dimension |
| `onSegmentChange` | `(segment: string) => void` | Called when another segment is picked |
| `hidden` | `string[]` | Segment values hidden from the bars and totals (controlled); picking another segment clears it |
| `defaultHidden` | `string[]` | The segment values hidden at first, when `hidden` is not controlled |
| `onHiddenChange` | `(hidden: string[]) => void` | Called when legend chips hide or show segment values, or Show all is pressed |

*Renamed or hidden on the wrapper: `heading`, `dimensions`, `records`, `measures`, `hiddenSegments`, `measure`, `slice`, `segment`, `hidden`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the pickers, the bars, the legend chips and Show all; the table too when it scrolls sideways |
| ↓ / ↑ (on a picker) | Opens its list on the picked option; Enter and Space open it too |
| ↓ / ↑, Home / End (in a list) | Moves through the options |
| Enter / Space (in a list) | Picks the option and closes the list |
| Escape | Closes a picker's list, back on its button; on a bar, closes the breakdown without moving focus |
| Enter / Space (on a legend chip) | Hides or shows that segment |

### Screen readers

The chart is a region named by its title. Each picker is a button that opens a listbox, named by its label and
value (“Segment Priority”), with the picked option `aria-selected`. Each bar is a button named with its total
(“In progress: 14 tasks”) and, while its breakdown is open, described by it. The legend is a group named
“Priority – click to show or hide”, its chips toggle buttons whose `aria-pressed` says whether the segment is shown.
The table has row and column headers, and when it is wider than the card it becomes a scrollable region named
“Sprint 24 workload table”.

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 40.0 KB | 10.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **47.7 KB** | **12.6 KB** |
| With Lit – the first component on a page | 70.3 KB | 20.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 207 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of records replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.8 ms | records: first render, 206 nodes; update 0.4 ms |
| 1,000 items | 1.9 ms | records: first render, 207 nodes; update 0.5 ms |

1,000 items of records: 1.9 ms, 207 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/controllers – SmoothHeightController).
- Listens on the page: `document keydown`, `window pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title the chart with what the records are and their scope: “Sprint 24 workload”, not “Chart”.
- Give each measure a plural `unit` people would say – “tasks”, “points”, “hours” – it follows every total.
- List dimension `values` in their natural order (Backlog → Done, Urgent → Low), not alphabetically.
- Keep values short; long ones are cut under the bars and shown in full on hover and in the table.

## Do and don't

### Do

- Give segment values `colors` that mean something (red for Urgent) and keep each at 3:1 against the surface.
- Add `icons` for status-like values – the chart shows them under the bars and in the table.
- Offer a count and at least one summed measure, so people can switch between “how many” and “how much”.

### Don't

- Don't segment by a dimension with more than about seven values – the colours stop being distinguishable.
- Don't slice by time; use `kpi-chart` for trends.
- Don't hide the table to save room – it is the accessible form of the chart.
- Don't stretch a chart with two or three bars across a wide page with `fill`; keep `fill` for many slice values or a
  dashboard column.

## Related

- [Compact Breakdown](compact-breakdown.md) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
