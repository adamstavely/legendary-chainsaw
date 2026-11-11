<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Sunburst Chart

**Charts** · New

A hierarchy as rings, top level innermost – the largest leaf and its path to the centre emphasised, outer names and shares beside the circle, inner names on card-coloured chips, rings that sweep round in turn

- **Element:** `<tc-sunburst-chart>`
- **Size:** 17.5 KB gzip · 49.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/sunburst-chart";` |
| React / Next.js | `import { SunburstChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/sunburst-chart";` · tags starting with tc- are custom elements |
| Angular | `import { SunburstChart } from "@adamstavely/trenchcoat/angular/sunburst-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/sunburst-chart";` |

## Example

The live example is in the gallery at `#/sunburst-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A hierarchy as rings: the top level innermost, each ring split among its parent's share. Rows become a tree as in
[Treemap](treemap.md) – a flat table with `group`, path columns with `path`, or nested rows with a children field. The
largest leaf takes the accent and the arcs leading to it from the centre a darker quiet ink, so its path through the
hierarchy reads at a glance; `highlight` picks a different leaf, or several.

The outer ring's names and shares sit outside the circle, nudged apart so none overlap. Inner arcs with room carry
their name on a small chip of the card's colour, so the words stay legible whatever the arc's ink. The rings sweep
round from twelve o'clock one after another when the chart scrolls into view and glide to their new shares when the
data changes. Ported from ztd-charts (MIT).

### When to use

- Showing how a total divides through two or three levels – divisions, labs, kinds of cost.
- When the path from the top level to a leaf matters as much as the leaf's size.

### When not to use

- One level of a few shares – use [Donut Chart](donut-chart.md) or [Pie Chart](pie-chart.md).
- Many leaves to compare by size – use [Treemap](treemap.md); areas are easier to compare than outer arcs.
- Precise comparisons – use [Bar Chart](bar-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Arc** `.ui-sbr__arc` – one per node, its angle its share of its parent; the emphasised leaf in the accent
3. **Outer label** `.tc-chart__value` – an outer leaf's name and share, outside the circle
4. **Chip** `.ui-sbr__chip` – an inner arc's name, on the card's colour, where the arc has room
5. **Tooltip** `.tc-chart__tip` – the parent and item, the value and its share of the total

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised leaf, `--tc-plot-rest` for the other leaves,
`--tc-sbr-path` for the arcs leading to the emphasised leaf and `--tc-sbr-branch` for the other inner arcs. The chips
are `--tc-plot-bg`, the card's own colour, so names are never text on an arc's ink. `hole` sets the centre's size.
`still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-sunburst-chart heading="Grant spend" description="This year, k$ – division, lab, cost"></tc-sunburst-chart>

<script type="module">
  import "@adamstavely/trenchcoat/sunburst-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-sunburst-chart");
  chart.path = ["division", "lab"];
  chart.data = [
    { division: "Life sciences", lab: "Genomics", label: "Reagents", value: 420 },
    { division: "Life sciences", lab: "Proteomics", label: "Instruments", value: 280 },
    { division: "Physical sciences", lab: "Climate", label: "Compute", value: 360 },
  ];
</script>
```

### React / Next.js

```tsx
import { SunburstChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { division: "Life sciences", lab: "Genomics", label: "Reagents", value: 420 },
  { division: "Life sciences", lab: "Proteomics", label: "Instruments", value: 280 },
  { division: "Physical sciences", lab: "Climate", label: "Compute", value: 360 },
];

export function GrantSpend() {
  return <SunburstChart title="Grant spend" description="This year, k$ – division, lab, cost" path={["division", "lab"]} data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/sunburst-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";

defineProps<{ label: TcSunburstChart["label"]; value: TcSunburstChart["value"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-sunburst-chart :label="label" :value="value" @tc-view-change="onViewChange"></tc-sunburst-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SunburstChart } from "@adamstavely/trenchcoat/angular/sunburst-chart";
import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";

@Component({
  selector: "app-sunburst-chart-example",
  imports: [SunburstChart],
  template: `<tc-sunburst-chart [label]="label()" [value]="value()" (tc-view-change)="onViewChange($event)"></tc-sunburst-chart>`,
})
export class SunburstChartExample {
  readonly label = input.required<TcSunburstChart["label"]>();
  readonly value = input.required<TcSunburstChart["value"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sunburst-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";

  let { label, value }: { label: TcSunburstChart["label"]; value: TcSunburstChart["value"] } = $props();
  let el: TcSunburstChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-sunburst-chart bind:this={el} {label} {value}></tc-sunburst-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The name field; by default "label" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field; by default "value" |
| `group` | – | `Accessor<T, string> \| undefined` | `undefined` | The parent-group field of a flat table: the groups make the inner ring |
| `path` | – | `string[] \| undefined` | `undefined` | Several levels: path fields from the centre out, e.g. ["division", "lab"] |
| `childrenField` | `children-field` | `string \| undefined` | `undefined` | The children field of nested rows; by default "children" |
| `sort` | `sort` | `boolean` | `false` | Orders each ring's arcs from the largest; by default the data's order |
| `hole` | `hole` | `number` | `0.3` | The hole's share of the radius, 0–0.9; by default 0.3 |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to an arc, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | An arc was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sbr-path` | `var(--tc-plot-line-rest)` | both |
| `--tc-sbr-branch` | `color-mix(in srgb, var(--tc-plot-rest) 55%, var(--tc-plot-line-rest))` | both |

#### Design tokens it reads (3)

`--tc-plot-bg`, `--tc-plot-line-rest`, `--tc-plot-rest`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `labelRoom(r0: number, r1: number, a0: number, a1: number, h: number, pad: number): number` | The widest label box of height h centred in a ring piece, with every corner `pad` inside its edges (ztd's labelRoom). At the ring's left and right a level box lies across the ring's thickness, so it's far narrower than the arc's length. |

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-sunburst-chart :label="…">` | `<tc-sunburst-chart [label]="…">` | `<tc-sunburst-chart {label}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-sunburst-chart :value="…">` | `<tc-sunburst-chart [value]="…">` | `<tc-sunburst-chart {value}>` |
| `group` | `el.group = …;` | `<… group={…} />` | `<tc-sunburst-chart :group="…">` | `<tc-sunburst-chart [group]="…">` | `<tc-sunburst-chart {group}>` |
| `path` | `el.path = …;` | `<… path={…} />` | `<tc-sunburst-chart :path="…">` | `<tc-sunburst-chart [path]="…">` | `<tc-sunburst-chart {path}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-sunburst-chart :data="…">` | `<tc-sunburst-chart [data]="…">` | `<tc-sunburst-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-sunburst-chart :highlight="…">` | `<tc-sunburst-chart [highlight]="…">` | `<tc-sunburst-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-sunburst-chart :format="…">` | `<tc-sunburst-chart [format]="…">` | `<tc-sunburst-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-sunburst-chart :labels="…">` | `<tc-sunburst-chart [labels]="…">` | `<tc-sunburst-chart {labels}>` |

*Also attributes: `children-field`, `sort`, `hole`, `heading`, `description`, `unit`, `locale`, `height` and 7 more – see the API table.*

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
<tc-sunburst-chart id="sunburst-chart"></tc-sunburst-chart>

<script type="module">
  import "@adamstavely/trenchcoat/sunburst-chart";

  const el = document.querySelector("#sunburst-chart");
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
import "@adamstavely/trenchcoat/sunburst-chart";
import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";

const props = defineProps<{ initial: TcSunburstChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcSunburstChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-sunburst-chart :view="view" @tc-view-change="onViewChange"></tc-sunburst-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SunburstChart } from "@adamstavely/trenchcoat/angular/sunburst-chart";
import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";

@Component({
  selector: "app-controlled-sunburst-chart",
  imports: [SunburstChart],
  template: `<tc-sunburst-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-sunburst-chart>`,
})
export class ControlledSunburstChart {
  readonly initial = input.required<TcSunburstChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcSunburstChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sunburst-chart";
  import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";

  let { initial }: { initial: TcSunburstChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcSunburstChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcSunburstChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-sunburst-chart bind:this={el} {view}></tc-sunburst-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-sunburst-chart")` returns a `TcSunburstChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";`
- **React / Next.js:** Props: `import type { SunburstChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SunburstChart>`. The element class, for refs: `import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSunburstChart["label"]` with `import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";`
- **Angular:** The directive types the template: `[label]` takes `TcSunburstChart["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSunburstChart } from "@adamstavely/trenchcoat/sunburst-chart";`

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
| Arrow keys | Move to the next or previous arc – each parent, then its children; the tooltip shows it and it's read with its parent, value and share |
| Home / End | The first or last arc |
| Enter / Space | Picks the arc (fires `tc-mark-click`) |
| Escape | Lets go of the arc; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words: the number of levels, the total and the innermost
  ring's shares.
- A table of every arc with its parent, value and share is always there for screen readers; the Table button shows it
  to everyone.
- Moving with the arrows announces the arc with its parent, value and share ("Genomics Life sciences: 730 · 33%,
  2 of 15").
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
| **This component alone** | 9.0 KB | 4.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/chart/hierarchy` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **49.0 KB** | **17.5 KB** |
| With Lit – the first component on a page | 68.5 KB | 23.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 72 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of data replaced |
| First on the page | 26 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.4 ms | data: first render, 72 nodes; update 0.4 ms |
| 1,000 items | 1.4 ms | data: first render, 72 nodes; update 0.5 ms |

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

- Keep to two or three levels; outer arcs get thin fast.
- Keep names short – outer labels need room beside the circle, and chips show what fits.
- Give `unit` rather than baking it into the values.

## Do and don't

### Do

- Let one leaf and its path carry the emphasis – the point of the chart.
- Use `sort` when the data's order means nothing, so the large arcs come first.

### Don't

- Use it for a flat list – a donut or bars read better.
- Expect thin arcs to be named; their names are in the tooltip and the table.

## Related

- [Treemap](treemap.md) – Parts of a whole as squarified tiles sized by value, nested under group headers with their shares – the largest emphasised, names and shares on card-coloured chips in tiles big enough, tiles that grow in and glide on change
- [Donut Chart](donut-chart.md) – Shares of a whole round a hole holding the total, with a legend of every slice and its share beside or under it, slices that sweep round and a total that counts up
- [Pie Chart](pie-chart.md) – A few shares of a whole as slices, each in its own ink or one emphasised, the shares written beside them and the pointed-at slice lifting out
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view

## Changelog

- **Sunburst Chart** (`tc-sunburst-chart`): a hierarchy as rings, the largest leaf's path emphasised.
