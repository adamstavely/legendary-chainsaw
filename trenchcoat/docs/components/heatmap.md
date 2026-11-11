<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Heatmap

**Data & charts** · New

A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view

- **Element:** `<tc-heatmap>`
- **Size:** 12.2 KB gzip · 40.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/heatmap";` |
| React / Next.js | `import { Heatmap } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/heatmap";` · tags starting with tc- are custom elements |
| Angular | `import { Heatmap } from "@adamstavely/trenchcoat/angular/heatmap";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/heatmap";` |

## Example

The live example is in the gallery at `#/heatmap`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A matrix of rows by columns, each cell shaded by its value – instrument use by weekday and hour, error rates by
service and region, scores by team and quarter. The scale is sequential, from light to dark, or diverging, with two
colours either side of a midpoint for a change or a difference. It bins the values into a few shades (5 by default) or
shades them continuously. A legend says what the shades mean, the footer names the highest and lowest cells, and a
cell with no data is hatched. Pointing at or focusing a cell shows “Row · Column: value”, and Enter or a click selects
it. The Table button swaps the chart for the same numbers as a plain table. `legendLabels` puts words at the legend's
ends – “Fewer” and “More” – in place of the end values.

Big matrices – more than `canvas-threshold` cells, 2,500 by default – are painted on a canvas that fits the card's
width, as ztd-charts does (MIT, © 2026 Junhan2). The interaction layer stays on top: the keyboard, the tooltip, the
crosshair, selection and the Table view work as before, but only the focused cell is an element, the row and column
labels thin out to what fits, and `show-values` is off because the cells are too small to write in.

### When to use

- Patterns across two dimensions: busy hours in the week, hot spots by region and service.
- Comparing many cells at once, where the shape matters more than any one number.
- A change or difference against a baseline – with the diverging scale.

### When not to use

- A year of activity by day – use [Activity Calendar](activity-calendar.md).
- When in the day something happens, as a ring – use [Activity Clock](activity-clock.md).
- Which checks cover which parts, with a status per cell – use [Coverage Matrix](coverage-matrix.md).
- Exact values people will sort, filter and compare row by row – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Table** `.ui-heat__toggle` – swaps the chart for the table, in the header
2. **Row label** `.ui-heat__rowhead` – down the side, staying put while the grid scrolls
3. **Column label** `.ui-heat__colhead` – along the top
4. **Cell** `.ui-heat__cell` – a square shaded by its value; hatched when there's no data
5. **Value** `.ui-heat__num` – the value in the cell, with `show-values`
6. **Tooltip** `.ui-heat__tip` – “Row · Column: value” for the cell under the pointer or focus
7. **Summary** `.ui-heat__summary` – the highest and lowest cells
8. **Legend** `.ui-heat__legend` – the scale's ends and its shades, and no data when some cells have none
9. **Data table** `.ui-heat__table` – the table view
10. **Plot** `.ui-heat__plot` – canvas mode: the painted cells under the focused cell `.ui-heat__vcell` and the

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The cells mix `--tc-heat-ink` (by default `--tc-chart-1`) into `--tc-heat-track`; a diverging scale
uses `--tc-heat-ink-low` (`--tc-chart-3`) below the midpoint. `--tc-heat-cell-w`, `--tc-heat-cell-h`,
`--tc-heat-label` and `--tc-heat-gap` size the cells, the row labels and the gaps. All can be set on the element.
The canvas reads the same inks, resolved to real colours when it paints.

## Usage

### HTML

```html
<tc-heatmap id="use" heading="Instrument use" unit="%" row-header="Day" crosshair canvas-threshold="2500"></tc-heatmap>

<script type="module">
  import "@adamstavely/trenchcoat/heatmap";
  import "@adamstavely/trenchcoat/tokens.css";

  const map = document.querySelector("#use");
  map.rows = ["Mon", "Tue", "Wed"];
  map.columns = ["08:00", "10:00", "12:00", "14:00"];
  map.values = [
    [12, 48, 40, 66],
    [20, 71, null, 80],
    [35, 88, 92, 96],
  ];
  map.legendLabels = ["Quieter", "Busier"];
  map.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Heatmap, type HeatmapCell } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function InstrumentUse({ values }: { values: (number | null)[][] }) {
  const [selected, setSelected] = useState<HeatmapCell | null>(null);
  return (
    <Heatmap
      title="Instrument use"
      unit="%"
      rows={["Mon", "Tue", "Wed"]}
      columns={["08:00", "10:00", "12:00", "14:00"]}
      values={values}
      crosshair
      legendLabels={["Quieter", "Busier"]}
      selected={selected}
      onSelectedChange={setSelected}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/heatmap";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";

defineProps<{ rows: TcHeatmap["rows"]; columns: TcHeatmap["columns"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-heatmap :rows="rows" :columns="columns" @tc-selected-change="onSelectedChange"></tc-heatmap>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Heatmap } from "@adamstavely/trenchcoat/angular/heatmap";
import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";

@Component({
  selector: "app-heatmap-example",
  imports: [Heatmap],
  template: `<tc-heatmap [rows]="rows()" [columns]="columns()" (tc-selected-change)="onSelectedChange($event)"></tc-heatmap>`,
})
export class HeatmapExample {
  readonly rows = input.required<TcHeatmap["rows"]>();
  readonly columns = input.required<TcHeatmap["columns"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/heatmap";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";

  let { rows, columns }: { rows: TcHeatmap["rows"]; columns: TcHeatmap["columns"] } = $props();
  let el: TcHeatmap;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-heatmap bind:this={el} {rows} {columns}></tc-heatmap>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Heatmap"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `rows` | – | `string[]` | `[]` | The rows' labels, top to bottom |
| `columns` | – | `string[]` | `[]` | The columns' labels, left to right |
| `values` | – | `(number \| null)[][]` | `[]` | The values, a row at a time: values[row][column]; null (or missing) is no data |
| `scale` | `scale` | `HeatmapScale` | `"sequential"` | Light to dark ("sequential"), or two colours either side of `midpoint` ("diverging") |
| `midpoint` | `midpoint` | `number` | `0` | The value between the two colours of a diverging scale |
| `steps` | `steps` | `number` | `5` | How many shades the legend bins the values into; 0 shades continuously |
| `min` | `min` | `number \| undefined` | `undefined` | The bottom of the scale; by default the lowest value |
| `max` | `max` | `number \| undefined` | `undefined` | The top of the scale; by default the highest value |
| `unit` | `unit` | `string \| undefined` | `undefined` | The unit after the number: "%", "runs" |
| `format` | – | `((value: number) => string) \| undefined` | `undefined` | Writes a value, e.g. (v) => `${v} runs`; replaces the number and `unit` |
| `showValues` | `show-values` | `boolean` | `false` | Writes each value in its cell |
| `crosshair` | `crosshair` | `boolean` | `false` | Lights up the row and column of the cell under the pointer or focus |
| `rowHeader` | `row-header` | `string` | `"Row"` | What the rows are, for the table's corner: "Day" |
| `selected` | – | `HeatmapCell \| null` | `null` | The selected cell. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `view` | `view` | `HeatmapView` | `"chart"` | The chart or the same numbers as a table. Changed by the Table button unless a tc-view-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `legendLabels` | – | `[string, string] \| undefined` | `undefined` | Words at the two ends of the legend, low then high, e.g. ["Fewer", "More"]; by default the end values |
| `canvasThreshold` | `canvas-threshold` | `number` | `2500` | Above this many cells (rows × columns) they're painted on a canvas; the focused cell stays in the DOM |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A cell was selected or cleared ({ selected, value }: HeatmapSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-view-change` | – | Yes | The chart / table switch was pressed ({ view }: HeatmapViewChange); cancelable – prevented, `view` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-heat-ink` | `var(--tc-chart-1)` | both |
| `--tc-heat-ink-low` | `var(--tc-chart-3)` | both |
| `--tc-heat-track` | `var(--tc-fill-default)` | both |
| `--tc-heat-cell-w` | `36px` | both |
| `--tc-heat-cell-h` | `32px` | both |
| `--tc-heat-label` | `56px` | both |
| `--tc-heat-gap` | `2px` | both |
| `--tc-heat-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (49)

`--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-3`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-heat-min`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `rows` | `el.rows = …;` | `<… rows={…} />` | `<tc-heatmap :rows="…">` | `<tc-heatmap [rows]="…">` | `<tc-heatmap {rows}>` |
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-heatmap :columns="…">` | `<tc-heatmap [columns]="…">` | `<tc-heatmap {columns}>` |
| `values` | `el.values = …;` | `<… values={…} />` | `<tc-heatmap :values="…">` | `<tc-heatmap [values]="…">` | `<tc-heatmap {values}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-heatmap :format="…">` | `<tc-heatmap [format]="…">` | `<tc-heatmap {format}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-heatmap :selected="…">` | `<tc-heatmap [selected]="…">` | `<tc-heatmap {selected}>` |
| `legendLabels` | `el.legendLabels = …;` | `<… legendLabels={…} />` | `<tc-heatmap :legendLabels="…">` | `<tc-heatmap [legendLabels]="…">` | `<tc-heatmap {legendLabels}>` |

*Also attributes: `heading`, `description`, `scale`, `midpoint`, `steps`, `min`, `max`, `unit` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` and `view` itself unless a listener calls `preventDefault()` on `tc-selected-change` or `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-heatmap id="heatmap"></tc-heatmap>

<script type="module">
  import "@adamstavely/trenchcoat/heatmap";

  const el = document.querySelector("#heatmap");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/heatmap";
import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";

const props = defineProps<{ initial: TcHeatmap["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcHeatmap["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-heatmap :selected="selected" @tc-selected-change="onSelectedChange"></tc-heatmap>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Heatmap } from "@adamstavely/trenchcoat/angular/heatmap";
import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";

@Component({
  selector: "app-controlled-heatmap",
  imports: [Heatmap],
  template: `<tc-heatmap [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-heatmap>`,
})
export class ControlledHeatmap {
  readonly initial = input.required<TcHeatmap["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcHeatmap["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/heatmap";
  import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";

  let { initial }: { initial: TcHeatmap["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcHeatmap;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcHeatmap["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-heatmap bind:this={el} {selected}></tc-heatmap>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-heatmap")` returns a `TcHeatmap` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";`
- **React / Next.js:** Props: `import type { HeatmapProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Heatmap>`. The element class, for refs: `import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHeatmap["rows"]` with `import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";`
- **Angular:** The directive types the template: `[rows]` takes `TcHeatmap["rows"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHeatmap } from "@adamstavely/trenchcoat/heatmap";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `selected` | `HeatmapCell \| null` | The selected cell – controlled when given (null for none) |
| `defaultSelected` | `HeatmapCell \| null` | The cell selected on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: HeatmapCell \| null, value?: number \| null) => void` | A cell was selected or cleared; `value` is its value (null when it has no data) |
| `view` | `HeatmapView` | The chart or the table – controlled when given |
| `defaultView` | `HeatmapView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: HeatmapView) => void` | The Table button was pressed |

*Renamed or hidden on the wrapper: `heading`, `selected`, `view`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The chart is one tab stop, on the selected cell or else the first; inside it the arrows move between cells.

| Key | What it does |
|---|---|
| ↑ / ↓ / ← / → | Moves one cell |
| Home / End | Moves to the first or last cell in the row |
| Page Up / Page Down | Moves to the first or last cell in the column |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last cell |
| Enter / Space | Selects the cell, or clears it if it's selected |
| Escape | Clears the selection, or hides the tooltip |
| Tab | Leaves the chart |

A cell moved to off the edge of the scrolling area scrolls into view. Canvas mode keeps the same keys.

### Screen readers

The chart is a `grid` named by the heading and described by “Arrow keys move between cells; Enter selects the cell”
and the summary, “Highest Wed · 14:00 100%. Lowest Mon · 08:00 0%.” Rows are labelled by row headers and columns by
column headers; each cell reads “Wed · 14:00: 96%”, or “No data”, and the selected cell is `aria-selected`. Selecting
is confirmed politely, “Selected Wed · 14:00: 96%”. The Table button is a toggle (`aria-pressed`), and the table view
is a plain data table captioned by the heading. With `legendLabels` the legend's ends read as the word and the value,
“Fewer (0%)”.

In canvas mode the grid holds only the focused cell, with `aria-rowcount` and `aria-colcount` for the whole matrix and
`aria-rowindex` / `aria-colindex` for where the cell is, and that cell's row and column headers; it reads the same
“Wed · 14:00: 96%”. The canvas itself is `aria-hidden`. The Table view has every value.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 32.2 KB | 9.6 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/canvas` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **40.3 KB** | **12.2 KB** |
| With Lit – the first component on a page | 59.9 KB | 18.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.7 ms** | the gallery demo's data, 251 DOM nodes – to layout, median of 7 |
| Typical update | **2.1 ms** | one item of columns replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 19 ms | columns: first render, 1,659 nodes; update 3.3 ms |
| 1,000 items | 2.0 ms | columns: first render, 155 nodes; update 0.6 ms |

1,000 items of columns: 2.0 ms, 155 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep row and column labels short – “Mon”, “08:00”, “eu-west” – they sit beside small cells.
- Set `unit` or `format` so the tooltip, legend and summary read as values.
- Use null for a cell you have no data for: it's hatched and read as “No data”, not as zero.
- For a change, use `scale="diverging"` with `midpoint` at no change (usually 0), and `min` / `max` equal either side.
- Legend words are short and plain – “Fewer” / “More”, “Quieter” / “Busier” – low first.

## Do and don't

### Do

- Set `min` and `max` when several heatmaps on a page should share one scale.
- Keep the default five steps unless the exact shade matters – bins are easier to read than a gradient.
- Pair a selected cell with what's behind it: the bookings, the errors, the runs.

### Don't

- Don't use a diverging scale for values that only go one way – it suggests a meaning the data doesn't have.
- Don't use more than about 30 columns for a grid people point at cell by cell – past that, let it go to the canvas
  and lean on the keyboard, the tooltip and the Table view for single values.
- Don't rely on shade alone to compare two close cells – the tooltip and the table give the numbers.

## Related

- [Activity Calendar](activity-calendar.md) – A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus
- [Activity Clock](activity-clock.md) – When activity happens, a clock per day – an AM ring and a PM ring of hour segments shaded by how busy each hour was, the weekday and date in the middle, and any hour's value there on hover or focus
- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **Sparkline** (`tc-sparkline`), **Heatmap** (`tc-heatmap`) and **Gauge** (`tc-gauge`) – an inline trend, a shaded matrix with legend, selection and table view, and a value against its bands as a dial, half dial or bar (optionally a slider).
