<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Bubble Chart

**Charts** · New

Points by two values with a third as the circle's area, or a scatter plot without it – the largest emphasised and named where names fit, points by group with a legend that isolates, hides and shows each group, stat tiles under it, and a canvas for thousands of points

- **Element:** `<tc-bubble-chart>`
- **Size:** 21.8 KB gzip · 61.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/bubble-chart";` |
| React / Next.js | `import { BubbleChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/bubble-chart";` · tags starting with tc- are custom elements |
| Angular | `import { BubbleChart } from "@adamstavely/trenchcoat/angular/bubble-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/bubble-chart";` |

## Example

The live example is in the gallery at `#/bubble-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Points placed by two values, x and y, with a third drawn as the circle's area. The largest bubble takes the accent and
the rest stay quiet, so the eye lands on what matters; `highlight` picks others. The emphasised and then the largest
are named beside their circles where the names fit, up to `max-labels`. Without `size` it's a scatter plot: even dots,
none emphasised unless `highlight` says so.

Circles grow in from left to right when the chart scrolls into view and glide when the data changes. Past
`canvas-threshold` points (1,500 by default) they're painted on a canvas under the drawing, which keeps the axes and
the active point. Ported from ztd-charts (MIT).

`trend="linear"` fits a least-squares line across the points' x range, dashed over them, with its r² beside its end
on a chip of the card's colour, and `trend-band` shades the 95% confidence band of the fit. `trend="smooth"` draws a
LOESS curve instead, for a relationship that bends. The summary says which trend is drawn and its r².

`group` names a field that sorts the points into groups – teams, sites, cohorts. Each group takes the next categorical
ink, nothing is emphasised unless `highlight` says so, and the header holds a legend with a toggle button per group.
Pointing at a button, or focusing it, isolates its group: the other groups' points turn a quiet gray. Pressing it hides
or shows the group, firing a cancelable `tc-groups-change` with the groups now shown; set `groups` to own that state.
The axes are fitted to every point, so the others stay put while a group is hidden, and the last group shown can't be
hidden. `stats` adds a row of tiles under the chart – `{ label, value, change? }`, a number written in the chart's
format and a change in % with its sign.

### When to use

- Showing how two measures relate across a set of items – staff and papers, cost and speed.
- Adding a third measure as size, when its rough order is enough.
- Thousands of points as a scatter plot.
- Comparing a few groups' spread on the same two measures – a scatter by group – with headline numbers beside it.

### When not to use

- One value per category – use [Bar Chart](bar-chart.md).
- One measure's spread – use [Beeswarm Chart](beeswarm-chart.md).
- Change over time – use [Line Chart](line-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Circle** `.ui-bbl__dot` – one per point; the emphasised one in the accent
3. **Name** `.tc-chart__value` – a point's name beside its circle
4. **Axis** `.tc-chart__grid` – the y grid lines and their values, the x values below, and the axes' names
5. **Trend** `.ui-bbl__trend` – the fitted line, with its r² and, with `trend-band`, its band `.ui-bbl__band`
6. **Canvas** `.tc-chart__canvas` – the circles, painted, past the threshold
7. **Tooltip** `.tc-chart__tip` – the point's name, its group, x, y and size
8. **Legend** `.ui-bbl__legend` – with `group`, a toggle button `.ui-bbl__key` per group, its swatch `.ui-bbl__swatch`
9. **Stat tile** `.ui-bbl__stat` – with `stats`, a name `.ui-bbl__stat-label` and value `.ui-bbl__stat-value`, and its

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` and `--tc-plot-rest` for emphasis, `--tc-plot-grid` for grid
lines, `--tc-plot-bg` for the line parting overlapping circles, and `--tc-bbl-trend` for the trend line and its band. The canvas reads the same tokens, so it follows the
look and the theme. Groups take `--tc-plot-ink-1` to `--tc-plot-ink-6`; the points the legend isn't isolating take
`--tc-bbl-muted`. A hidden group's swatch turns to an outline and its name is struck through, so it doesn't rest on
colour. Stat tiles are white tiles on the Standard tray and wells in the Clean card, at least `--tc-bbl-stat-min` wide,
wrapping on narrow cards. Names are written in the text inks beside the circles, never on them. `still` (or the system's
reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-bubble-chart heading="Labs by size and output" x-label="Staff" y-label="Papers"></tc-bubble-chart>

<script type="module">
  import "@adamstavely/trenchcoat/bubble-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-bubble-chart");
  chart.x = "staff";
  chart.y = "papers";
  chart.size = "grants";
  chart.data = [
    { label: "Genomics", staff: 24, papers: 41, grants: 3.2 },
    { label: "Imaging", staff: 12, papers: 18, grants: 1.4 },
    { label: "Neuro", staff: 20, papers: 33, grants: 4.5 },
  ];

  // A scatter by group, with stat tiles under it
  const byTeam = document.querySelector("#by-team");
  byTeam.x = "hours";
  byTeam.y = "findings";
  byTeam.group = "team";
  byTeam.stats = [{ label: "Reviews", value: 48 }, { label: "Findings", value: 212, change: 8.5 }];
  byTeam.data = [
    { label: "Review 1", team: "Fraud", hours: 12, findings: 9 },
    { label: "Review 2", team: "Audit", hours: 20, findings: 6 },
    { label: "Review 3", team: "Fraud", hours: 7, findings: 4 },
  ];
  byTeam.addEventListener("tc-groups-change", (e) => console.log(e.detail.groups));
</script>
<tc-bubble-chart id="by-team" heading="Review hours and findings" x-label="Hours" y-label="Findings"></tc-bubble-chart>
```

### React / Next.js

```tsx
import { useState } from "react";
import { BubbleChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", staff: 24, papers: 41, grants: 3.2 },
  { label: "Imaging", staff: 12, papers: 18, grants: 1.4 },
  { label: "Neuro", staff: 20, papers: 33, grants: 4.5 },
];

const reviews = [
  { label: "Review 1", team: "Fraud", hours: 12, findings: 9 },
  { label: "Review 2", team: "Audit", hours: 20, findings: 6 },
  { label: "Review 3", team: "Fraud", hours: 7, findings: 4 },
];

export function ReviewsByTeam() {
  const [groups, setGroups] = useState<string[] | undefined>(undefined);
  return (
    <BubbleChart
      title="Review hours and findings"
      data={reviews}
      x="hours"
      y="findings"
      group="team"
      groups={groups}
      onGroupsChange={setGroups}
      stats={[{ label: "Reviews", value: 48 }, { label: "Findings", value: 212, change: 8.5 }]}
    />
  );
}

export function Labs() {
  return <BubbleChart title="Labs by size and output" data={data} x="staff" y="papers" size="grants" xLabel="Staff" yLabel="Papers" onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/bubble-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";

defineProps<{ x: TcBubbleChart["x"]; y: TcBubbleChart["y"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-bubble-chart :x="x" :y="y" @tc-view-change="onViewChange"></tc-bubble-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BubbleChart } from "@adamstavely/trenchcoat/angular/bubble-chart";
import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";

@Component({
  selector: "app-bubble-chart-example",
  imports: [BubbleChart],
  template: `<tc-bubble-chart [x]="x()" [y]="y()" (tc-view-change)="onViewChange($event)"></tc-bubble-chart>`,
})
export class BubbleChartExample {
  readonly x = input.required<TcBubbleChart["x"]>();
  readonly y = input.required<TcBubbleChart["y"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/bubble-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";

  let { x, y }: { x: TcBubbleChart["x"]; y: TcBubbleChart["y"] } = $props();
  let el: TcBubbleChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-bubble-chart bind:this={el} {x} {y}></tc-bubble-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `x` | – | `Accessor<T, number> \| undefined` | `undefined` | The x field; by default "x" |
| `y` | – | `Accessor<T, number> \| undefined` | `undefined` | The y field; by default "y" |
| `size` | – | `Accessor<T, number> \| undefined` | `undefined` | The size field, drawn as the circle's area; without it the chart is a scatter plot |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The point's name field, for its label, the tooltip and the table; by default "label", else "#n" |
| `sizeRange` | – | `[number, number] \| undefined` | `undefined` | The circles' smallest and largest radius in px; by default [4, about a 22nd of the width] |
| `xLabel` | `x-label` | `string` | `""` | The x axis's name, at its right end |
| `yLabel` | `y-label` | `string` | `""` | The y axis's name, above it |
| `zero` | `zero` | `boolean` | `false` | Starts both axes at zero |
| `maxLabels` | `max-labels` | `number` | `6` | How many points are named beside their circles at most |
| `canvasThreshold` | `canvas-threshold` | `number` | `1500` | Above this many points the circles are painted on a canvas |
| `xFormat` | – | `FormatSpec \| undefined` | `undefined` | How x values are written; `format` writes y |
| `trend` | `trend` | `BubbleTrend` | `"none"` | A line fitted through the points: "linear" (least squares, its r² beside it) or "smooth" (LOESS); none by default |
| `trendBand` | `trend-band` | `boolean` | `false` | Shades the 95% confidence band round a linear trend |
| `group` | – | `Accessor<T, string> \| undefined` | `undefined` | The group field: points of a group share an ink, and the header's legend can isolate, hide and show each group |
| `groups` | – | `string[] \| undefined` | `undefined` | The groups shown; by default all of them. Changed by the legend unless a tc-groups-change listener calls preventDefault() |
| `stats` | – | `BubbleStat[]` | `[]` | Stat tiles under the chart: { label, value, change? } |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a point, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A point was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |
| `tc-groups-change` | – | Yes | A legend button hid or showed a group ({ groups }: BubbleGroupsChange); cancelable – prevented, `groups` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-bbl-trend` | `var(--tc-text-primary)` | both |
| `--tc-bbl-muted` | `var(--tc-border-default)` | both |
| `--tc-bbl-stat-min` | `120px` | both |

#### Design tokens it reads (27)

`--tc-bbl-key`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-size-lg`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-line-height-tight`, `--tc-plot-bg`, `--tc-plot-focus`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

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
| `x` | `el.x = …;` | `<… x={…} />` | `<tc-bubble-chart :x="…">` | `<tc-bubble-chart [x]="…">` | `<tc-bubble-chart {x}>` |
| `y` | `el.y = …;` | `<… y={…} />` | `<tc-bubble-chart :y="…">` | `<tc-bubble-chart [y]="…">` | `<tc-bubble-chart {y}>` |
| `size` | `el.size = …;` | `<… size={…} />` | `<tc-bubble-chart :size="…">` | `<tc-bubble-chart [size]="…">` | `<tc-bubble-chart {size}>` |
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-bubble-chart :label="…">` | `<tc-bubble-chart [label]="…">` | `<tc-bubble-chart {label}>` |
| `sizeRange` | `el.sizeRange = …;` | `<… sizeRange={…} />` | `<tc-bubble-chart :sizeRange="…">` | `<tc-bubble-chart [sizeRange]="…">` | `<tc-bubble-chart {sizeRange}>` |
| `xFormat` | `el.xFormat = …;` | `<… xFormat={…} />` | `<tc-bubble-chart :xFormat="…">` | `<tc-bubble-chart [xFormat]="…">` | `<tc-bubble-chart {xFormat}>` |
| `group` | `el.group = …;` | `<… group={…} />` | `<tc-bubble-chart :group="…">` | `<tc-bubble-chart [group]="…">` | `<tc-bubble-chart {group}>` |
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-bubble-chart :groups="…">` | `<tc-bubble-chart [groups]="…">` | `<tc-bubble-chart {groups}>` |
| `stats` | `el.stats = …;` | `<… stats={…} />` | `<tc-bubble-chart :stats="…">` | `<tc-bubble-chart [stats]="…">` | `<tc-bubble-chart {stats}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-bubble-chart :data="…">` | `<tc-bubble-chart [data]="…">` | `<tc-bubble-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-bubble-chart :highlight="…">` | `<tc-bubble-chart [highlight]="…">` | `<tc-bubble-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-bubble-chart :format="…">` | `<tc-bubble-chart [format]="…">` | `<tc-bubble-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-bubble-chart :labels="…">` | `<tc-bubble-chart [labels]="…">` | `<tc-bubble-chart {labels}>` |

*Also attributes: `x-label`, `y-label`, `zero`, `max-labels`, `canvas-threshold`, `trend`, `trend-band`, `heading` and 11 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-mark-hover` | No | `el.addEventListener("tc-mark-hover", (e) => …)` | `onMarkHover={…}` | `@tc-mark-hover="…"` | `(tc-mark-hover)="…($event)"` | `el.addEventListener("tc-mark-hover", …)` |
| `tc-mark-click` | No | `el.addEventListener("tc-mark-click", (e) => …)` | `onMarkClick={…}` | `@tc-mark-click="…"` | `(tc-mark-click)="…($event)"` | `el.addEventListener("tc-mark-click", …)` |
| `tc-groups-change` | Yes | `el.addEventListener("tc-groups-change", (e) => …)` | `ref.current.addEventListener("tc-groups-change", …)` | `@tc-groups-change="…"` | `(tc-groups-change)="…($event)"` | `el.addEventListener("tc-groups-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `groups` and `view` itself unless a listener calls `preventDefault()` on `tc-groups-change` or `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-bubble-chart id="bubble-chart"></tc-bubble-chart>

<script type="module">
  import "@adamstavely/trenchcoat/bubble-chart";

  const el = document.querySelector("#bubble-chart");
  el.addEventListener("tc-groups-change", (e) => {
    e.preventDefault(); // the element keeps its groups…
    if (allowed(e.detail.groups)) el.groups = e.detail.groups; // …until the app sets it
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
import "@adamstavely/trenchcoat/bubble-chart";
import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";

const props = defineProps<{ initial: TcBubbleChart["groups"] }>();
const groups = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onGroupsChange = (e: CustomEvent<{ groups: TcBubbleChart["groups"] }>) => {
  e.preventDefault();
  groups.value = e.detail.groups;
};
</script>

<template>
  <tc-bubble-chart :groups="groups" @tc-groups-change="onGroupsChange"></tc-bubble-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BubbleChart } from "@adamstavely/trenchcoat/angular/bubble-chart";
import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";

@Component({
  selector: "app-controlled-bubble-chart",
  imports: [BubbleChart],
  template: `<tc-bubble-chart [groups]="groups()" (tc-groups-change)="onGroupsChange($event)"></tc-bubble-chart>`,
})
export class ControlledBubbleChart {
  readonly initial = input.required<TcBubbleChart["groups"]>();
  readonly groups = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onGroupsChange(e: CustomEvent<{ groups: TcBubbleChart["groups"] }>) {
    e.preventDefault();
    this.groups.set(e.detail.groups);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/bubble-chart";
  import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";

  let { initial }: { initial: TcBubbleChart["groups"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let groups = $derived(initial);
  let el: TcBubbleChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      groups = (e as CustomEvent<{ groups: TcBubbleChart["groups"] }>).detail.groups;
    };
    el.addEventListener("tc-groups-change", on);
    return () => el.removeEventListener("tc-groups-change", on);
  });
</script>

<tc-bubble-chart bind:this={el} {groups}></tc-bubble-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-bubble-chart")` returns a `TcBubbleChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";`
- **React / Next.js:** Props: `import type { BubbleChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BubbleChart>`. The element class, for refs: `import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBubbleChart["x"]` with `import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";`
- **Angular:** The directive types the template: `[x]` takes `TcBubbleChart["x"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBubbleChart } from "@adamstavely/trenchcoat/bubble-chart";`

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
| `groups` | `string[]` | The groups shown – controlled when given; by default all of them |
| `defaultGroups` | `string[]` | The groups shown on mount when `groups` isn't controlled; by default all of them |
| `onGroupsChange` | `(groups: string[]) => void` | A legend button hid or showed a group |

*Renamed or hidden on the wrapper: `heading`, `view`, `groups`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous point, in data order; the tooltip shows it and it's read with its values |
| Home / End | The first or last point |
| Enter / Space | Picks the point (fires `tc-mark-click`) |
| Escape | Lets go of the point; pressed again, it's the page's |

The legend, with `group`, is a toolbar with one tab stop of its own:

| Key | Does |
| --- | --- |
| Tab | Reaches the legend's last focused button, which isolates its group |
| Arrow keys / Home / End | Move between the groups' buttons |
| Enter / Space | Hides or shows the group (fires `tc-groups-change`) |

### Screen readers

- The plot is a group named by the heading, described in words: how many points and the range of x and y.
- A table of the points is always there for screen readers (the first 60, and how many more); the Table button shows
  it to everyone.
- Moving with the arrows announces the point with its values and position ("Genomics: x 24, y 41, size 3.2, 1 of 8").
- With `group`, the description says how many groups there are and which are shown; the table has a Group column; the
  legend is a toolbar named "Groups" of toggle buttons, each pressed while its group is shown.
- Stat tiles are a description list: each name a term, its value the definition.
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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, internal/chart/element | Focus rings for keyboard users. |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/chart/accessor | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, internal/chart/element, tokens.css | Every rule is keyed on :where() so the page can override it. |
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
| **This component alone** | 19.4 KB | 8.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.5 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/stats` · Shared Trenchcoat code | 1.2 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 1.2 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.2 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/canvas` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **61.7 KB** | **21.8 KB** |
| With Lit – the first component on a page | 81.1 KB | 28.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 47 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of data replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.5 ms | data: first render, 205 nodes; update 1.3 ms |
| 1,000 items | 8.0 ms | data: first render, 205 nodes; update 3.0 ms |

1,000 items of data: 8.0 ms, 205 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Name the axes with `x-label` and `y-label`, and say what size means in the description.
- Give each point a `label` so it can be named; without one it's numbered.
- Use `x-format` and `format` for the two axes' numbers.
- Draw a trend only where a straight (or smooth) relationship is the point; say in the description what it shows.
- Keep groups to six or fewer – the inks repeat after six – and name them in a word or two.
- Give stat tiles short names and the numbers the chart's reader would ask for next: totals, averages, the change.

## Do and don't

### Do

- Size by a value people compare roughly – funding, headcount – not one they need exactly.
- Keep `max-labels` low; the tooltip and table have every name.

### Don't

- Size by a value that can be negative – a circle can't be smaller than nothing.
- Start the axes at zero unless zero matters (`zero`); the points' spread is the story.

## Related

- [Beeswarm Chart](beeswarm-chart.md) – A distribution point by point – every value a dot pushed clear of the others, in one row or a row per group with its median marked – the highest group emphasised, dots that grow in, and a canvas for thousands of points
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view

## Changelog

- **Beeswarm Chart** (`tc-beeswarm-chart`) and **Bubble Chart** (`tc-bubble-chart`): every point drawn, switching to a canvas for thousands of them.
