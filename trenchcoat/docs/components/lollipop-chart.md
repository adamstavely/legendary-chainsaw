<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Lollipop Chart

**Charts** · New

One value per item as a thin stem and dot, ordered from the largest, lying down or upright, the largest emphasised, values past the dots, missing ones written "–", stems that grow in and glide when the data changes, and a table view

- **Element:** `<tc-lollipop-chart>`
- **Size:** 17.0 KB gzip · 47.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/lollipop-chart";` |
| React / Next.js | `import { LollipopChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/lollipop-chart";` · tags starting with tc- are custom elements |
| Angular | `import { LollipopChart } from "@adamstavely/trenchcoat/angular/lollipop-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/lollipop-chart";` |

## Example

The live example is in the gallery at `#/lollipop-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One value per item as a thin stem with a dot at its end – the same reading as a bar chart, with far less ink, so it
stays light when there are many items. Items are ordered from the largest (`sort="false"` keeps the data's order);
the largest takes the accent and the rest stay quiet, so the eye lands on what matters, and `highlight` picks a
different one, or several. The stems lie down with the names on the left by default; `orientation="vertical"` stands
them up with the names below.

Values sit past the dots. A missing value is drawn at zero and written "–", so it never reads as 0. Stems grow from
the baseline when the chart scrolls into view and glide to new values, and new places, when the data changes.
Ported from ztd-charts (MIT).

### When to use

- Ranking a dozen or more items by one value, where a wall of bars would feel heavy.
- A value per item whose names are long – lying down, they read in full on the left.

### When not to use

- Several series per category, stacked or grouped – use [Bar Chart](bar-chart.md).
- Two values per item, before and after – use [Dumbbell Chart](dumbbell-chart.md).
- A stacked bar people slice by measure and segment – use [Breakdown Chart](breakdown-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Stem** `.ui-lpp__stem` – from the baseline to the value; the emphasised one in the accent
3. **Dot** `.ui-lpp__dot` – at the value, ringed in the card's colour
4. **Value** `.tc-chart__value` – the value past the dot
5. **Axis** `.tc-chart__grid` – the grid lines and their values; the item names beside or under the stems
6. **Tooltip** `.tc-chart__tip` – the item and its value

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised item, `--tc-plot-rest` and
`--tc-plot-line-rest` for the quiet stems and dots, `--tc-plot-grid` for grid lines. `--tc-lpp-stem` sets the stem's
width. Values are written in the text inks beside the dots, never on them. `still` (or the system's reduced-motion
setting) draws everything at once.

## Usage

### HTML

```html
<tc-lollipop-chart heading="GPU hours" description="This month, by lab" unit=" h"></tc-lollipop-chart>

<script type="module">
  import "@adamstavely/trenchcoat/lollipop-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-lollipop-chart").data = [
    { label: "Genomics", value: 412 },
    { label: "Imaging", value: 236 },
    { label: "Neuro", value: 377 },
  ];
</script>
```

### React / Next.js

```tsx
import { LollipopChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", value: 412 },
  { label: "Imaging", value: 236 },
  { label: "Neuro", value: 377 },
];

export function GpuHours() {
  return <LollipopChart title="GPU hours" description="This month, by lab" data={data} unit=" h" onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/lollipop-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";

defineProps<{ label: TcLollipopChart["label"]; value: TcLollipopChart["value"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-lollipop-chart :label="label" :value="value" @tc-view-change="onViewChange"></tc-lollipop-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { LollipopChart } from "@adamstavely/trenchcoat/angular/lollipop-chart";
import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";

@Component({
  selector: "app-lollipop-chart-example",
  imports: [LollipopChart],
  template: `<tc-lollipop-chart [label]="label()" [value]="value()" (tc-view-change)="onViewChange($event)"></tc-lollipop-chart>`,
})
export class LollipopChartExample {
  readonly label = input.required<TcLollipopChart["label"]>();
  readonly value = input.required<TcLollipopChart["value"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/lollipop-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";

  let { label, value }: { label: TcLollipopChart["label"]; value: TcLollipopChart["value"] } = $props();
  let el: TcLollipopChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-lollipop-chart bind:this={el} {label} {value}></tc-lollipop-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The item's name field; by default "label" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field; by default "value" |
| `orientation` | `orientation` | `LollipopOrientation` | `"horizontal"` | Stems lying down with the names on the left ("horizontal") or upright with the names below ("vertical") |
| `sort` | `sort` | `boolean` | `true` | Orders the items from the largest; sort="false" keeps the data's order |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to an item, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | An item was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-lpp-stem` | `2.2` | both |

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-lollipop-chart :label="…">` | `<tc-lollipop-chart [label]="…">` | `<tc-lollipop-chart {label}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-lollipop-chart :value="…">` | `<tc-lollipop-chart [value]="…">` | `<tc-lollipop-chart {value}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-lollipop-chart :data="…">` | `<tc-lollipop-chart [data]="…">` | `<tc-lollipop-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-lollipop-chart :highlight="…">` | `<tc-lollipop-chart [highlight]="…">` | `<tc-lollipop-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-lollipop-chart :format="…">` | `<tc-lollipop-chart [format]="…">` | `<tc-lollipop-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-lollipop-chart :labels="…">` | `<tc-lollipop-chart [labels]="…">` | `<tc-lollipop-chart {labels}>` |

*Also attributes: `orientation`, `sort`, `heading`, `description`, `unit`, `locale`, `height`, `still` and 6 more – see the API table.*

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
<tc-lollipop-chart id="lollipop-chart"></tc-lollipop-chart>

<script type="module">
  import "@adamstavely/trenchcoat/lollipop-chart";

  const el = document.querySelector("#lollipop-chart");
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
import "@adamstavely/trenchcoat/lollipop-chart";
import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";

const props = defineProps<{ initial: TcLollipopChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcLollipopChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-lollipop-chart :view="view" @tc-view-change="onViewChange"></tc-lollipop-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { LollipopChart } from "@adamstavely/trenchcoat/angular/lollipop-chart";
import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";

@Component({
  selector: "app-controlled-lollipop-chart",
  imports: [LollipopChart],
  template: `<tc-lollipop-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-lollipop-chart>`,
})
export class ControlledLollipopChart {
  readonly initial = input.required<TcLollipopChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcLollipopChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/lollipop-chart";
  import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";

  let { initial }: { initial: TcLollipopChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcLollipopChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcLollipopChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-lollipop-chart bind:this={el} {view}></tc-lollipop-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-lollipop-chart")` returns a `TcLollipopChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";`
- **React / Next.js:** Props: `import type { LollipopChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof LollipopChart>`. The element class, for refs: `import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLollipopChart["label"]` with `import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";`
- **Angular:** The directive types the template: `[label]` takes `TcLollipopChart["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLollipopChart } from "@adamstavely/trenchcoat/lollipop-chart";`

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
| Arrow keys | Move to the next or previous item; the tooltip shows it and it's read with its value |
| Home / End | The first or last item |
| Enter / Space | Picks the item (fires `tc-mark-click`) |
| Escape | Lets go of the item; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, with the chart described in words (each item and its value, in order).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the item with its value and position ("Neuro: 377 h, 2 of 8").
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
| **This component alone** | 7.8 KB | 3.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **47.8 KB** | **17.0 KB** |
| With Lit – the first component on a page | 67.3 KB | 23.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 48 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of data replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.1 ms | data: first render, 206 nodes; update 0.8 ms |
| 1,000 items | 8.4 ms | data: first render, 206 nodes; update 2.9 ms |

1,000 items of data: 8.4 ms, 206 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Keep item names short enough to read whole; long ones are shortened with an ellipsis at about a third of the width.
- Give `unit` (" h", "%") rather than baking it into the values.
- Leave a missing value missing (null) rather than 0 – it's written "–".

## Do and don't

### Do

- Let one item carry the accent – the point of the chart.
- Keep the default order unless the data's own order means something (`sort="false"`).

### Don't

- Use it for a handful of items where bars would read faster – use [Bar Chart](bar-chart.md).
- Put more than one value per item on it.

## Related

- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Dumbbell Chart](dumbbell-chart.md) – Two values per item, before and after or target and actual, as a hollow and a solid dot joined by a bar, ordered by the second, the biggest move emphasised, bars that stretch in, and a table view
- [Slope Chart](slope-chart.md) – How each item changed between two moments, as lines from first value to last, the biggest rise emphasised, names and values nudged apart on both sides, lines that draw themselves in, and a table view
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table

## Changelog

- **Lollipop Chart** (`tc-lollipop-chart`): one value per item as a stem and dot, from the largest.
