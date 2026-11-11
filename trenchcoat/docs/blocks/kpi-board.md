<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# KPI Board

**Blocks** · New

The top of a dashboard – three trend cards, an overview chart that compares this period with the last, and a focus card; hover shows any day's value and every number rolls when the range changes (uses `button`)

- **Element:** `<tc-kpi-board>`
- **Size:** 15.6 KB gzip · 54.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/kpi-board";` |
| React / Next.js | `import { KpiBoard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/kpi-board";` · tags starting with tc- are custom elements |
| Angular | `import { KpiBoard } from "@adamstavely/trenchcoat/angular/kpi-board";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/kpi-board";` |

## Example

The live example is in the gallery at `#/blocks/kpi-board`, in both looks; Replay restarts its animations.

## Overview

The top of a dashboard in one piece. One date range sits above everything and changes every card. Three small trend
cards each show a total, its label, the change against the last period and a line of the period. A large overview
compares this period with the last, with its own segment filter. A focus card follows one product or plan: its
total, the change, a line, both periods' numbers and an action. Every chart has one look – a thin angular line, a
quiet fill and dates under the plot. Hover a small card and the day under the pointer gets a dot, its value and its
date; hover the overview for a tooltip comparing both periods that day. Switch the range and every number rolls to
its new value while the lines draw in again.

### When to use

- The first screen of a sales, revenue or product dashboard.
- A weekly or monthly review where people compare this period with the last.
- Anywhere one date range should drive a handful of headline numbers together.

### When not to use

- One metric over time on its own – use [KPI Chart](../components/kpi-chart.md).
- How a total splits into parts – use [Breakdown Chart](../components/breakdown-chart.md).
- Progress against a target or plan – use [Plan vs Actual](../components/plan-vs-actual.md).
- Consumption against a limit or quota – use [Usage Meter](../components/usage-meter.md).

## Anatomy

1. **Bar** `.ui-kb__bar` – the heading and the date range picker (`.ui-kb__pick`)
2. **Trend card** `.ui-kb__stat` – a total, its label, the change (`.ui-kb__change`) and a small plot
3. **Overview** `.ui-kb__overview` – the period's total and change, the segment picker, and both lines
4. **Tooltip** `.ui-kb__tip` – this period and the last at the day under the pointer
5. **Focus card** `.ui-kb__focus` – one product's total, change, line and legend (`.ui-kb__legend`)

## Looks

One look in both Standard and Clean, as the block it came from: cards straight on the page. In Clean, numbers that
would be written in the translucent chart blue use the accent text colour instead. `--tc-kpi-board-stagger` sets
the delay between cards rising in, and `--tc-kpi-board-well` the chart fill.

## Usage

### HTML

```html
<tc-kpi-board id="board" heading="Overview"></tc-kpi-board>

<script type="module">
  import "@adamstavely/trenchcoat/kpi-board";
  import "@adamstavely/trenchcoat/tokens.css";

  const labels = ["22 Oct", "23 Oct", "24 Oct"];
  const board = document.querySelector("#board");
  board.ranges = [{ id: "7d", label: "Last 7 days" }];
  board.data = {
    "7d": {
      stats: [{ id: "orders", label: "Orders", kind: "count", labels, values: [120, 132, 128], previous: 360 }],
      overview: { title: "Gross volume", labels, current: [4200, 4500, 4400], previous: [3900, 4100, 4000] },
      focus: { title: "Pro plan", metric: "Product sales rate", unit: "items", labels, values: [38, 41, 40], previous: 110 },
    },
  };
  board.addEventListener("tc-range-change", (e) => console.log(e.detail.range));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { KpiBoard, type KpiBoardData } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const labels = ["22 Oct", "23 Oct", "24 Oct"];
const week: KpiBoardData = {
  stats: [{ id: "orders", label: "Orders", kind: "count", labels, values: [120, 132, 128], previous: 360 }],
  overview: { title: "Gross volume", labels, current: [4200, 4500, 4400], previous: [3900, 4100, 4000] },
  focus: { title: "Pro plan", metric: "Product sales rate", unit: "items", labels, values: [38, 41, 40], previous: 110 },
};

export function Dashboard() {
  const [range, setRange] = useState("7d");
  return (
    <KpiBoard
      title="Overview"
      data={{ "7d": week }}
      ranges={[{ id: "7d", label: "Last 7 days" }]}
      range={range}
      onRangeChange={setRange}
      action={{ label: "View product report", onClick: () => console.log("report") }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/kpi-board";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";

defineProps<{ data: TcKpiBoard["data"]; ranges: TcKpiBoard["ranges"] }>();
const onRangeChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-kpi-board :data="data" :ranges="ranges" @tc-range-change="onRangeChange"></tc-kpi-board>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { KpiBoard } from "@adamstavely/trenchcoat/angular/kpi-board";
import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";

@Component({
  selector: "app-kpi-board-example",
  imports: [KpiBoard],
  template: `<tc-kpi-board [data]="data()" [ranges]="ranges()" (tc-range-change)="onRangeChange($event)"></tc-kpi-board>`,
})
export class KpiBoardExample {
  readonly data = input.required<TcKpiBoard["data"]>();
  readonly ranges = input.required<TcKpiBoard["ranges"]>();
  onRangeChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/kpi-board";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";

  let { data, ranges }: { data: TcKpiBoard["data"]; ranges: TcKpiBoard["ranges"] } = $props();
  let el: TcKpiBoard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-range-change", on);
    return () => el.removeEventListener("tc-range-change", on);
  });
</script>

<tc-kpi-board bind:this={el} {data} {ranges}></tc-kpi-board>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | Heading on the left of the bar above the cards – none by default |
| `data` | – | `Record<string, KpiBoardData>` | `{}` | One data set per range id |
| `ranges` | – | `KpiOption[]` | `[]` | The date ranges, e.g. Last 7 / 30 / 90 days |
| `range` | `range` | `string \| undefined` | `undefined` | The range shown – unset, the first one |
| `segments` | – | `KpiOption[] \| undefined` | `undefined` | A filter inside the overview card, e.g. All plans / Pro / Team – it only switches the overview's lines |
| `segment` | `segment` | `string \| undefined` | `undefined` | The segment shown – unset, the first one |
| `compareLabel` | `compare-label` | `string` | `"vs. last period"` | Words after every change, e.g. "vs. last month" |
| `currentLabel` | `current-label` | `string` | `"This period"` | Name of this period's line |
| `previousLabel` | `previous-label` | `string` | `"Last period"` | Name of the last period's line |
| `formatMoney` | – | `(value: number) => string` | `kpiMoney` | Formats money amounts – "$1,234.50" by default |
| `icon` | – | `Element \| TemplateResult \| undefined` | `undefined` | Icon in the focus card: a DOM node (cloned) or a Lit template – a box by default |
| `setup` | – | `KpiButton \| undefined` | `undefined` | The small button at the top right of the focus card, e.g. Set up |
| `action` | – | `KpiButton \| undefined` | `undefined` | The button at the bottom of the focus card |
| `rangeId` | – | `` | – | The range in effect: `range`, else the first |
| `segmentId` | – | `` | – | The segment in effect: `segment`, else the first ("" when there is no filter) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-range-change` | – | Yes | Another date range was picked (`{ range }`: KpiRangeChange); cancelable – prevented, `range` stays as it was |
| `tc-segment-change` | – | Yes | Another overview segment was picked (`{ segment }`: KpiSegmentChange); cancelable – prevented, `segment` stays as it was |
| `tc-setup` | – | No | The focus card's setup button was pressed; detail: null |
| `tc-action` | – | No | The focus card's action button was pressed; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-kb-space-5px` | `5px` | both |
| `--tc-kb-space-0_5px` | `0.5px` | both |
| `--tc-kb-space-7px` | `7px` | both |
| `--tc-kb-space-9px` | `9px` | both |
| `--tc-kb-space-11px` | `11px` | both |
| `--tc-kb-space-3px` | `3px` | both |
| `--tc-kpi-board-well` | `light-dark(#f6f6f8, #202024)` | both |
| `--tc-kpi-board-stagger` | `60ms` | both |
| `--tc-kpi-board-series-soft` | `light-dark(#a9c4ff, #37508f)` | both |
| `--tc-kpi-board-tip-bg` | `light-dark(#1c1c20, #2c2c32)` | both |
| `--tc-kpi-board-tip-fg` | `rgba(255, 255, 255, 0.72)` | both |
| `--tc-kpi-board-tip-strong` | `#ffffff` | both |
| `--tc-kpi-board-tip-total` | `#4ade9b` | both |
| `--tc-kpi-board-tip-series` | `#7ea2ff` | both |
| `--tc-kpi-board-tip-series-soft` | `#8c9bc4` | both |

#### Design tokens it reads (73)

`--tc-accent-text`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-neutral`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-slowest`, `--tc-ease-emphasized`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-hover`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `kpiMoney(n: number): void` | "$1,234.50" under ten thousand, "$12,345" above |
| `kpiResample(values: number[] \| undefined, n: number): number[]` | A series stretched or squeezed to a fixed number of points, so lines of different lengths can glide into each other |
| `kpiTrace(values: number[], lo: number, hi: number, top: unknown, bottom: unknown): void` | Straight segments through evenly spaced points in a 0–100 box: the line, and the same shape closed to the floor |

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
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-kpi-board :data="…">` | `<tc-kpi-board [data]="…">` | `<tc-kpi-board {data}>` |
| `ranges` | `el.ranges = …;` | `<… ranges={…} />` | `<tc-kpi-board :ranges="…">` | `<tc-kpi-board [ranges]="…">` | `<tc-kpi-board {ranges}>` |
| `segments` | `el.segments = …;` | `<… segments={…} />` | `<tc-kpi-board :segments="…">` | `<tc-kpi-board [segments]="…">` | `<tc-kpi-board {segments}>` |
| `formatMoney` | `el.formatMoney = …;` | `<… formatMoney={…} />` | `<tc-kpi-board :formatMoney="…">` | `<tc-kpi-board [formatMoney]="…">` | `<tc-kpi-board {formatMoney}>` |
| `icon` | `el.icon = …;` | `<… icon={…} />` | `<tc-kpi-board :icon="…">` | `<tc-kpi-board [icon]="…">` | `<tc-kpi-board {icon}>` |
| `setup` | `el.setup = …;` | `<… setup={…} />` | `<tc-kpi-board :setup="…">` | `<tc-kpi-board [setup]="…">` | `<tc-kpi-board {setup}>` |
| `action` | `el.action = …;` | `<… action={…} />` | `<tc-kpi-board :action="…">` | `<tc-kpi-board [action]="…">` | `<tc-kpi-board {action}>` |

*Also attributes: `heading`, `range`, `segment`, `compare-label`, `current-label`, `previous-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-range-change` | Yes | `el.addEventListener("tc-range-change", (e) => …)` | `ref.current.addEventListener("tc-range-change", …)` | `@tc-range-change="…"` | `(tc-range-change)="…($event)"` | `el.addEventListener("tc-range-change", …)` |
| `tc-segment-change` | Yes | `el.addEventListener("tc-segment-change", (e) => …)` | `ref.current.addEventListener("tc-segment-change", …)` | `@tc-segment-change="…"` | `(tc-segment-change)="…($event)"` | `el.addEventListener("tc-segment-change", …)` |
| `tc-setup` | No | `el.addEventListener("tc-setup", (e) => …)` | `onTcSetup={…}` | `@tc-setup="…"` | `(tc-setup)="…($event)"` | `el.addEventListener("tc-setup", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `range` and `segment` itself unless a listener calls `preventDefault()` on `tc-range-change` or `tc-segment-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-kpi-board id="kpi-board"></tc-kpi-board>

<script type="module">
  import "@adamstavely/trenchcoat/kpi-board";

  const el = document.querySelector("#kpi-board");
  el.addEventListener("tc-range-change", (e) => {
    e.preventDefault(); // the element keeps its range…
    if (allowed(e.detail.range)) el.range = e.detail.range; // …until the app sets it
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
import "@adamstavely/trenchcoat/kpi-board";
import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";

const props = defineProps<{ initial: TcKpiBoard["range"] }>();
const range = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRangeChange = (e: CustomEvent<{ range: TcKpiBoard["range"] }>) => {
  e.preventDefault();
  range.value = e.detail.range;
};
</script>

<template>
  <tc-kpi-board :range="range" @tc-range-change="onRangeChange"></tc-kpi-board>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { KpiBoard } from "@adamstavely/trenchcoat/angular/kpi-board";
import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";

@Component({
  selector: "app-controlled-kpi-board",
  imports: [KpiBoard],
  template: `<tc-kpi-board [range]="range()" (tc-range-change)="onRangeChange($event)"></tc-kpi-board>`,
})
export class ControlledKpiBoard {
  readonly initial = input.required<TcKpiBoard["range"]>();
  readonly range = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRangeChange(e: CustomEvent<{ range: TcKpiBoard["range"] }>) {
    e.preventDefault();
    this.range.set(e.detail.range);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/kpi-board";
  import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";

  let { initial }: { initial: TcKpiBoard["range"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let range = $derived(initial);
  let el: TcKpiBoard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      range = (e as CustomEvent<{ range: TcKpiBoard["range"] }>).detail.range;
    };
    el.addEventListener("tc-range-change", on);
    return () => el.removeEventListener("tc-range-change", on);
  });
</script>

<tc-kpi-board bind:this={el} {range}></tc-kpi-board>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-kpi-board")` returns a `TcKpiBoard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";`
- **React / Next.js:** Props: `import type { KpiBoardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof KpiBoard>`. The element class, for refs: `import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcKpiBoard["data"]` with `import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";`
- **Angular:** The directive types the template: `[data]` takes `TcKpiBoard["data"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcKpiBoard } from "@adamstavely/trenchcoat/kpi-board";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Heading on the left of the bar above the cards |
| `range` | `string` | The range shown (controlled) |
| `defaultRange` | `string` | The range at first, when `range` isn't set – the first by default |
| `onRangeChange` | `(id: string) => void` | Called with the picked range id |
| `segment` | `string` | The overview's segment (controlled) |
| `defaultSegment` | `string` | The segment at first, when `segment` isn't set – the first by default |
| `onSegmentChange` | `(id: string) => void` | Called with the picked segment id |
| `icon` | `React.ReactNode` | Icon in the focus card – a React node |

*Renamed or hidden on the wrapper: `heading`, `range`, `segment`, `icon`, `children`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

The pickers follow the select-only combobox pattern.

| Key | What it does |
|---|---|
| Tab | Moves to the date range, the segment picker and the focus card's buttons |
| ↓ / ↑ | Opens a picker; inside it, moves between options (the active one gets a ring) |
| Home / End | Moves to the first or last option |
| Enter / Space | Picks the active option and closes the picker |
| Escape | Closes the picker, keeping focus on it |

The charts follow the pointer only; their numbers are all in the cards' text.

### Screen readers

Each card is a section named by its label: "Orders", "Gross volume", "Pro plan". The pickers are comboboxes named
"Date range" and "Segment" whose listbox marks the picked option. The charts, dots, tags and axes are hidden – the
totals and changes are text. Rolling numbers are written into the same text, so a reader that reads mid-roll hears a
number, and reads the final one afterwards.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, button, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | button | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, button | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, button, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 33.9 KB | 10.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **54.5 KB** | **15.6 KB** |
| With Lit – the first component on a page | 76.3 KB | 22.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | default properties, 1 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 4.3 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pick three trend cards people check daily; label them with the plain metric: "Revenue", "Orders", "Refunds".
- Set `lowerIsBetter` on metrics where a fall is good news, so its change shows in green.
- Give `formatMoney` your currency and abbreviation rules – "$137k" reads faster than "$137,042.00" on a card.
- Keep labels on each point short and in one format: "24 Oct".

## Do and don't

### Do

- Give every range the same three stats, in the same order, so numbers roll in place.
- Use the segment filter for a slice of the overview only – the cards stay on the whole.
- Control `range` when the page's other charts follow it too.

### Don't

- Don't put more than three trend cards in the first row – they get too narrow to read.
- Don't mix currencies across the cards.
- Don't hide the date range – every number depends on it.

## Related

- [KPI Chart](../components/kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Breakdown Chart](../components/breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Plan vs Actual](../components/plan-vs-actual.md) – An agent's plan against what really happens – every step's bar grows over its dashed planned ghost, overruns turn amber, the steps after it slide right, and the expected finish moves away from the planned one
- [Usage Meter](../components/usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
