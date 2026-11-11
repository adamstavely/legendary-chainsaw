<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Area Chart

**Charts** · New

Totals and their make-up over time as filled areas – stacked, stacked to 100% or overlapping – with names at their ends, the nearest month read across every series, and a table view

- **Element:** `<tc-area-chart>`
- **Size:** 25.4 KB gzip · 70.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/area-chart";` |
| React / Next.js | `import { AreaChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/area-chart";` · tags starting with tc- are custom elements |
| Angular | `import { AreaChart } from "@adamstavely/trenchcoat/angular/area-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/area-chart";` |

## Example

The live example is in the gallery at `#/area-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Totals and their make-up over time, as filled areas. Several series stack (`stack="stacked"`, the default for
several), stack to 100% (`"percent"`) or overlap (`"none"`), each in its own chart ink with its name at its end;
`color-mode="highlight"` paints one and leaves the rest quiet. Stacked layers are thinned by averaging, so they stay
aligned however long the series are.

The pointer reads the nearest x across every layer. Areas rise from the floor when the chart scrolls into view and
glide when the data changes. Ported from ztd-charts (MIT).

Overlapping areas (`stack="none"`) take a band round each edge with `lower` and `upper`, as Line Chart does; stacked
layers have none, since a range on one layer would move every layer above it.

With `brush="select"`, dragging across the plot (or Shift+arrows and Enter) picks a range and shows its change
with its highest and lowest points, firing `tc-brush`; `brush="zoom"` narrows the chart to the range, with a Show
all button to undo it.

### When to use

- How a total grows and what it's made of, over time.
- How the mix of a whole shifts over time (`stack="percent"`).

### When not to use

- Comparing separate trends that don't add up – use [Line Chart](line-chart.md).
- A single period's breakdown – use [Bar Chart](bar-chart.md) with `layout="stacked"`.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading, description and the Table button
2. **Area** `.tc-xy__area` – one per series, stacked or overlapping
3. **Edge** `.tc-xy__edge` – each area's top line
4. **Cursor** `.tc-xy__cursor` – the line at the pointed-at x
5. **Tooltip** `.tc-chart__tip` – the x and every layer's value (and share, at 100%)

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` and `--tc-plot-rest` for emphasis, `--tc-plot-ink-1` … `-6` for
categories, `--tc-plot-grid` for grid lines. Values are written in the text inks, beside marks rather than on them, so
they stay legible whatever the inks are. `still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-area-chart heading="Storage by tier" unit=" TB"></tc-area-chart>

<script type="module">
  import "@adamstavely/trenchcoat/area-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  const chart = document.querySelector("tc-area-chart");
  chart.x = "month";
  chart.y = ["hot", "warm", "archive"];
  chart.data = [
    { month: "2026-01", hot: 120, warm: 340, archive: 610 },
    { month: "2026-02", hot: 134, warm: 352, archive: 630 },
  ];
</script>
```

### React / Next.js

```tsx
import { AreaChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const rows = [
  { month: "2026-01", hot: 120, warm: 340, archive: 610 },
  { month: "2026-02", hot: 134, warm: 352, archive: 630 },
];

export function Storage() {
  return <AreaChart title="Storage by tier" unit=" TB" data={rows} x="month" y={["hot", "warm", "archive"]} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/area-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";

defineProps<{ data: TcAreaChart["data"]; highlight: TcAreaChart["highlight"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-area-chart :data="data" :highlight="highlight" @tc-view-change="onViewChange"></tc-area-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AreaChart } from "@adamstavely/trenchcoat/angular/area-chart";
import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";

@Component({
  selector: "app-area-chart-example",
  imports: [AreaChart],
  template: `<tc-area-chart [data]="data()" [highlight]="highlight()" (tc-view-change)="onViewChange($event)"></tc-area-chart>`,
})
export class AreaChartExample {
  readonly data = input.required<TcAreaChart["data"]>();
  readonly highlight = input.required<TcAreaChart["highlight"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/area-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";

  let { data, highlight }: { data: TcAreaChart["data"]; highlight: TcAreaChart["highlight"] } = $props();
  let el: TcAreaChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-area-chart bind:this={el} {data} {highlight}></tc-area-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `stack` | `stack` | `AreaStack \| undefined` | `undefined` | "none" overlaps the areas, "stacked" piles them up, "percent" stacks them to 100%; by default stacked when there are several |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to an x, or off the chart ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | An x was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |
| `tc-brush` | – | No | A range of x was picked by dragging or Shift+arrows and Enter, or cleared ({ range }: ChartBrushChange) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

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
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-area-chart :data="…">` | `<tc-area-chart [data]="…">` | `<tc-area-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-area-chart :highlight="…">` | `<tc-area-chart [highlight]="…">` | `<tc-area-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-area-chart :format="…">` | `<tc-area-chart [format]="…">` | `<tc-area-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-area-chart :labels="…">` | `<tc-area-chart [labels]="…">` | `<tc-area-chart {labels}>` |

*Also attributes: `stack`, `heading`, `description`, `unit`, `locale`, `height`, `still`, `easing` and 5 more – see the API table.*

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
<tc-area-chart id="area-chart"></tc-area-chart>

<script type="module">
  import "@adamstavely/trenchcoat/area-chart";

  const el = document.querySelector("#area-chart");
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
import "@adamstavely/trenchcoat/area-chart";
import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";

const props = defineProps<{ initial: TcAreaChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcAreaChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-area-chart :view="view" @tc-view-change="onViewChange"></tc-area-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AreaChart } from "@adamstavely/trenchcoat/angular/area-chart";
import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";

@Component({
  selector: "app-controlled-area-chart",
  imports: [AreaChart],
  template: `<tc-area-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-area-chart>`,
})
export class ControlledAreaChart {
  readonly initial = input.required<TcAreaChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcAreaChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/area-chart";
  import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";

  let { initial }: { initial: TcAreaChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcAreaChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcAreaChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-area-chart bind:this={el} {view}></tc-area-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-area-chart")` returns a `TcAreaChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";`
- **React / Next.js:** Props: `import type { AreaChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AreaChart>`. The element class, for refs: `import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAreaChart["data"]` with `import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";`
- **Angular:** The directive types the template: `[data]` takes `TcAreaChart["data"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAreaChart } from "@adamstavely/trenchcoat/area-chart";`

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
| `onBrush` | `(range: XRange \| null) => void` | A range of x was picked (with `brush`), or cleared (null) |

*Renamed or hidden on the wrapper: `heading`, `view`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous point; the tooltip shows it and it's read with its value |
| Home / End | The first or last point |
| Enter / Space | Picks the point (fires `tc-mark-click`) |
| Shift + ← / → | With `brush`, widens a range from the point; Enter settles it (or zooms into it) |
| Escape | Clears a picked range, then a zoom, then lets go of the point; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, with the chart described in words (the series, the range of x and the number of points).
- A table of every value is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the point with its value and position ("Imaging: 96, 2 of 6").
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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/chart/element, internal/card-head, internal/kit, internal/chart/brush, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 2.8 KB | 1.6 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.5 KB | – |
| `internal/chart/xy` · Shared Trenchcoat code | 15.1 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/chart/brush` · Shared Trenchcoat code | 4.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/series` · Shared Trenchcoat code | 2.5 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 2.4 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 2.4 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/stack` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **70.8 KB** | **25.4 KB** |
| With Lit – the first component on a page | 90.1 KB | 31.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 24 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of data replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.9 ms | data: first render, 24 nodes; update 0.4 ms |
| 1,000 items | 1.8 ms | data: first render, 24 nodes; update 0.6 ms |

What it renders doesn't grow with data (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **59 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Order the fields in `y` from the base up – the first is drawn at the bottom.
- Use `unit` for the measure (" TB").

## Do and don't

### Do

- Use percent stacking when the shares matter more than the totals.
- Keep to a few layers; thin ones at the top are hard to read.

### Don't

- Stack series that don't add up to a meaningful total.
- Overlap more than two or three areas with `stack="none"`.

## Related

- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Changelog

- **Area Chart** (`tc-area-chart`): stacked, 100% or overlapping areas over time.
