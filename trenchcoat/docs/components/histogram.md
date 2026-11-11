<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Histogram

**Charts** · New

How raw numbers spread, as touching bars on round bin edges, with the tallest bin emphasised, a running total, a density curve and mean and median lines if wanted.

- **Element:** `<tc-histogram>`
- **Size:** 18.8 KB gzip · 52.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/histogram";` |
| React / Next.js | `import { Histogram } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/histogram";` · tags starting with tc- are custom elements |
| Angular | `import { Histogram } from "@adamstavely/trenchcoat/angular/histogram";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/histogram";` |

## Example

The live example is in the gallery at `#/histogram`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How a set of raw numbers spreads. The values are binned on round edges into touching bars, each as tall as the number
of values in its bin. The bin count is worked out from the data (Freedman–Diaconis, kept to 5–40) unless `bins` asks
for about so many or `bin-width` fixes the width; `domain` fixes the range and leaves out anything beyond it. The
tallest bin takes the accent and the rest stay quiet; `highlight` picks others by bin index or range.

`cumulative` turns the bars into a running total. `density` lays a smoothed curve over the bars, scaled to the counts.
`markers` draws the mean, the median or both as dashed lines, named above the plot. Bars grow up from the baseline when
the chart scrolls into view and glide when the data changes.

### When to use

- One measure's shape from many raw values: assay turnaround, response times, sample sizes.
- Spotting skew, a second hump, or a long tail that an average would hide.
- "How many finished within…" questions – with `cumulative`.

### When not to use

- Comparing the spread of several groups – use [Box Plot](box-plot.md) or [Ridgeline Chart](ridgeline-chart.md).
- A few dozen values where each one matters – use [Beeswarm Chart](beeswarm-chart.md).
- Values that are already counts per category – use [Bar Chart](bar-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Bar** `.ui-hst__bar` – one per bin, touching its neighbours; the tallest in the accent
3. **Baseline** `.ui-hst__base` – the zero line under the bars
4. **Density** `.ui-hst__density` – the smoothed curve, with `density`
5. **Marker** `.ui-hst__marker` – the dashed mean or median line, named above the plot
6. **Axis** `.tc-chart__grid` – the count grid and its values; the value ticks under the bars
7. **Tooltip** `.tc-chart__tip` – the bin's range, count and share (and running total)

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both. Bars take `--tc-plot-accent` and `--tc-plot-rest`, parted by a hairline of `--tc-plot-bg`. The
density curve and marker lines take component tokens, `--tc-hst-density` and `--tc-hst-marker`. No text sits on a
bar; the markers' names are on the card above the plot. `still` (or the system's reduced-motion setting) draws
everything at once.

## Usage

### HTML

```html
<tc-histogram heading="Assay turnaround" description="This month, hours" unit=" h" markers="both"></tc-histogram>

<script type="module">
  import "@adamstavely/trenchcoat/histogram";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-histogram").data = [{ value: 21.5 }, { value: 18 }, { value: 24.2 }, { value: 39 }];
</script>
```

### React / Next.js

```tsx
import { Histogram } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [{ value: 21.5 }, { value: 18 }, { value: 24.2 }, { value: 39 }];

export function Turnaround() {
  return <Histogram title="Assay turnaround" description="This month, hours" unit=" h" density markers="both" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/histogram";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";

defineProps<{ value: TcHistogram["value"]; domain: TcHistogram["domain"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-histogram :value="value" :domain="domain" @tc-view-change="onViewChange"></tc-histogram>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Histogram } from "@adamstavely/trenchcoat/angular/histogram";
import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";

@Component({
  selector: "app-histogram-example",
  imports: [Histogram],
  template: `<tc-histogram [value]="value()" [domain]="domain()" (tc-view-change)="onViewChange($event)"></tc-histogram>`,
})
export class HistogramExample {
  readonly value = input.required<TcHistogram["value"]>();
  readonly domain = input.required<TcHistogram["domain"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/histogram";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";

  let { value, domain }: { value: TcHistogram["value"]; domain: TcHistogram["domain"] } = $props();
  let el: TcHistogram;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-histogram bind:this={el} {value} {domain}></tc-histogram>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field; by default "value" |
| `bins` | `bins` | `number \| undefined` | `undefined` | How many bins to aim for (the edges are rounded); by default worked out from the data |
| `binWidth` | `bin-width` | `number \| undefined` | `undefined` | The width of each bin; wins over `bins` |
| `domain` | – | `[number, number] \| undefined` | `undefined` | Only values in [low, high] are counted, and the axis spans exactly that; by default the values' range |
| `cumulative` | `cumulative` | `boolean` | `false` | Each bar is the running total up to its bin's end |
| `density` | `density` | `boolean` | `false` | A smoothed density curve over the bars (counts only, not with `cumulative`) |
| `markers` | `markers` | `HistogramMarkers` | `"none"` | Dashed lines across the bars at the mean, the median, both or neither |
| `histogramLabels` | – | `Partial<HistogramLabels>` | `{}` | The histogram's own words, merged over defaultHistogramLabels |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a bin, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A bin was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-hst-density` | `var(--tc-text-primary)` | both |
| `--tc-hst-marker` | `var(--tc-text-primary)` | both |

#### Design tokens it reads (3)

`--tc-plot-bg`, `--tc-plot-zero`, `--tc-text-primary`

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-histogram :value="…">` | `<tc-histogram [value]="…">` | `<tc-histogram {value}>` |
| `domain` | `el.domain = …;` | `<… domain={…} />` | `<tc-histogram :domain="…">` | `<tc-histogram [domain]="…">` | `<tc-histogram {domain}>` |
| `histogramLabels` | `el.histogramLabels = …;` | `<… histogramLabels={…} />` | `<tc-histogram :histogramLabels="…">` | `<tc-histogram [histogramLabels]="…">` | `<tc-histogram {histogramLabels}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-histogram :data="…">` | `<tc-histogram [data]="…">` | `<tc-histogram {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-histogram :highlight="…">` | `<tc-histogram [highlight]="…">` | `<tc-histogram {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-histogram :format="…">` | `<tc-histogram [format]="…">` | `<tc-histogram {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-histogram :labels="…">` | `<tc-histogram [labels]="…">` | `<tc-histogram {labels}>` |

*Also attributes: `bins`, `bin-width`, `cumulative`, `density`, `markers`, `heading`, `description`, `unit` and 9 more – see the API table.*

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
<tc-histogram id="histogram"></tc-histogram>

<script type="module">
  import "@adamstavely/trenchcoat/histogram";

  const el = document.querySelector("#histogram");
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
import "@adamstavely/trenchcoat/histogram";
import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";

const props = defineProps<{ initial: TcHistogram["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcHistogram["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-histogram :view="view" @tc-view-change="onViewChange"></tc-histogram>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Histogram } from "@adamstavely/trenchcoat/angular/histogram";
import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";

@Component({
  selector: "app-controlled-histogram",
  imports: [Histogram],
  template: `<tc-histogram [view]="view()" (tc-view-change)="onViewChange($event)"></tc-histogram>`,
})
export class ControlledHistogram {
  readonly initial = input.required<TcHistogram["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcHistogram["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/histogram";
  import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";

  let { initial }: { initial: TcHistogram["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcHistogram;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcHistogram["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-histogram bind:this={el} {view}></tc-histogram>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-histogram")` returns a `TcHistogram` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";`
- **React / Next.js:** Props: `import type { HistogramProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Histogram>`. The element class, for refs: `import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHistogram["value"]` with `import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";`
- **Angular:** The directive types the template: `[value]` takes `TcHistogram["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHistogram } from "@adamstavely/trenchcoat/histogram";`

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
| Arrow keys | Move to the next or previous bin; the tooltip shows it and it's read with its range, count and share |
| Home / End | The first or last bin |
| Enter / Space | Picks the bin (fires `tc-mark-click`) |
| Escape | Lets go of the bin; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words: how many values, the bins and range, and the
  busiest bin.
- A table of every bin's range, count and share is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces the bin ("[2, 4) h: 5 (50%), 2 of 5"); the last bin's range is closed, "]".
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
| **This component alone** | 10.2 KB | 4.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/stats` · Shared Trenchcoat code | 1.2 KB | – |
| `internal/chart/bins` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **52.5 KB** | **18.8 KB** |
| With Lit – the first component on a page | 71.9 KB | 25.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 77 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of data replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.6 ms | data: first render, 71 nodes; update 0.5 ms |
| 1,000 items | 4.1 ms | data: first render, 131 nodes; update 2.4 ms |

1,000 items of data: 4.1 ms, 131 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Give it raw values, one per row – at least 30 or so for the shape to mean much.
- Give `unit` (" h", " ms") rather than baking it into the values; it follows each range.
- Rename the tooltip's and summary's words through `histogramLabels`, and the shared ones through `labels`.

## Do and don't

### Do

- Let the automatic bins stand unless a round width reads better ("2-hour bins").
- Use `markers="both"` when the mean and median part ways – it shows the skew.

### Don't

- Put spaces between the bars – the bins are continuous; that's what tells it from a bar chart.
- Use `density` with very few values; the curve suggests a smoothness the data doesn't have.

## Related

- [Box Plot](box-plot.md) – How values spread within each group – quartile boxes with medians, whiskers to 1.5 IQR and outlier rings, or violins, or both – the highest median emphasised, boxes that open from their medians, and a table view
- [Ridgeline Chart](ridgeline-chart.md) – How values spread across many groups as overlapping density ridges, each with a tick at its median – the highest median emphasised, sortable by median, ridges that rise and reshape when the data changes, and a table view
- [Beeswarm Chart](beeswarm-chart.md) – A distribution point by point – every value a dot pushed clear of the others, in one row or a row per group with its median marked – the highest group emphasised, dots that grow in, and a canvas for thousands of points
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view

## Changelog

- **`tc-chart`, the CLI and MCP tools:** 36 chart types (`histogram`, `combo`, `venn`); `suggestCharts` proposes a histogram for one measure with no groups, and a combo chart for two measures on very different scales.
