<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Box Plot

**Charts** · New

How values spread within each group – quartile boxes with medians, whiskers to 1.5 IQR and outlier rings, or violins, or both – the highest median emphasised, boxes that open from their medians, and a table view

- **Element:** `<tc-box-plot>`
- **Size:** 18.1 KB gzip · 51.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/box-plot";` |
| React / Next.js | `import { BoxPlot } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/box-plot";` · tags starting with tc- are custom elements |
| Angular | `import { BoxPlot } from "@adamstavely/trenchcoat/angular/box-plot";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/box-plot";` |

## Example

The live example is in the gallery at `#/box-plot`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How values spread within each group. Each group's middle half is a box from the first to the third quartile, with
its median across it; whiskers reach the furthest values within 1.5 times the box's height, and anything beyond is a
small ring. The group with the highest median takes the accent and the rest stay quiet; `highlight` picks a different
one, or several, by group name. `variant="violin"` draws each group's density as a curve mirrored round its middle,
and `"both"` puts a slim box inside each violin.

The boxes open out from their medians when the chart scrolls into view and glide when the data changes. Ported from
ztd-charts (MIT).

### When to use

- Comparing the spread, not just the average, of a measure across a handful of groups: turnaround by lab, run time by
  instrument.
- Spotting groups with long tails or unusual values.

### When not to use

- Many groups, or when the shape matters more than the quartiles – use [Ridgeline Chart](ridgeline-chart.md).
- One number per category – use [Bar Chart](bar-chart.md).
- A value per period that opens and closes – use [Candlestick Chart](candlestick-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Box** `.ui-bxp__box` – the first to third quartile; the emphasised group's in the accent
3. **Median** `.ui-bxp__median` – the line across the box
4. **Whisker** `.ui-bxp__whisker` – out to the furthest values within 1.5 IQR
5. **Outlier** `.ui-bxp__outlier` – a ring for each value beyond the whiskers
6. **Violin** `.ui-bxp__violin` – the density curve, with `variant="violin"` or `"both"`
7. **Axis** `.tc-chart__grid` – the grid lines and their values; the group names under the boxes
8. **Tooltip** `.tc-chart__tip` – the whiskers, quartiles, median and sample size

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Boxes take `--tc-plot-accent` and `--tc-plot-rest`;
whiskers and outliers `--tc-plot-line-rest`. The median's ink is a component token, `--tc-bxp-median`
(`--tc-bxp-median-on-accent` across the accent box). No text sits on a box; values are in the tooltip and the table.
`still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-box-plot heading="Assay turnaround" description="This quarter, days by lab" unit=" d"></tc-box-plot>

<script type="module">
  import "@adamstavely/trenchcoat/box-plot";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-box-plot").data = [
    { group: "Genomics", value: 4.1 },
    { group: "Genomics", value: 3.6 },
    { group: "Imaging", value: 6.9 },
    { group: "Imaging", value: 7.4 },
  ];
</script>
```

### React / Next.js

```tsx
import { BoxPlot } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { group: "Genomics", value: 4.1 },
  { group: "Genomics", value: 3.6 },
  { group: "Imaging", value: 6.9 },
  { group: "Imaging", value: 7.4 },
];

export function Turnaround() {
  return <BoxPlot title="Assay turnaround" description="This quarter, days by lab" unit=" d" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/box-plot";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";

defineProps<{ group: TcBoxPlot["group"]; value: TcBoxPlot["value"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-box-plot :group="group" :value="value" @tc-view-change="onViewChange"></tc-box-plot>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BoxPlot } from "@adamstavely/trenchcoat/angular/box-plot";
import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";

@Component({
  selector: "app-box-plot-example",
  imports: [BoxPlot],
  template: `<tc-box-plot [group]="group()" [value]="value()" (tc-view-change)="onViewChange($event)"></tc-box-plot>`,
})
export class BoxPlotExample {
  readonly group = input.required<TcBoxPlot["group"]>();
  readonly value = input.required<TcBoxPlot["value"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/box-plot";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";

  let { group, value }: { group: TcBoxPlot["group"]; value: TcBoxPlot["value"] } = $props();
  let el: TcBoxPlot;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-box-plot bind:this={el} {group} {value}></tc-box-plot>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `group` | – | `Accessor<T, string> \| undefined` | `undefined` | The group field; by default "group" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field; by default "value" |
| `variant` | `variant` | `BoxPlotVariant` | `"box"` | Boxes ("box"), density curves ("violin"), or a slim box inside each violin ("both") |
| `hideOutliers` | `hide-outliers` | `boolean` | `false` | Leaves out the rings for values beyond the whiskers |
| `zero` | `zero` | `boolean` | `false` | Starts the value axis at zero |
| `boxLabels` | – | `Partial<BoxPlotLabels>` | `{}` | The box plot's own words, merged over defaultBoxPlotLabels |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a group, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A group was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-bxp-median` | `var(--tc-text-primary)` | both |
| `--tc-bxp-median-on-accent` | `var(--tc-plot-bg)` | both |
| `--tc-bxp-inner` | `var(--tc-text-primary)` | both |

#### Design tokens it reads (4)

`--tc-plot-accent`, `--tc-plot-bg`, `--tc-plot-line-rest`, `--tc-text-primary`

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
| `group` | `el.group = …;` | `<… group={…} />` | `<tc-box-plot :group="…">` | `<tc-box-plot [group]="…">` | `<tc-box-plot {group}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-box-plot :value="…">` | `<tc-box-plot [value]="…">` | `<tc-box-plot {value}>` |
| `boxLabels` | `el.boxLabels = …;` | `<… boxLabels={…} />` | `<tc-box-plot :boxLabels="…">` | `<tc-box-plot [boxLabels]="…">` | `<tc-box-plot {boxLabels}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-box-plot :data="…">` | `<tc-box-plot [data]="…">` | `<tc-box-plot {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-box-plot :highlight="…">` | `<tc-box-plot [highlight]="…">` | `<tc-box-plot {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-box-plot :format="…">` | `<tc-box-plot [format]="…">` | `<tc-box-plot {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-box-plot :labels="…">` | `<tc-box-plot [labels]="…">` | `<tc-box-plot {labels}>` |

*Also attributes: `variant`, `hide-outliers`, `zero`, `heading`, `description`, `unit`, `locale`, `height` and 7 more – see the API table.*

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
<tc-box-plot id="box-plot"></tc-box-plot>

<script type="module">
  import "@adamstavely/trenchcoat/box-plot";

  const el = document.querySelector("#box-plot");
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
import "@adamstavely/trenchcoat/box-plot";
import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";

const props = defineProps<{ initial: TcBoxPlot["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcBoxPlot["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-box-plot :view="view" @tc-view-change="onViewChange"></tc-box-plot>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BoxPlot } from "@adamstavely/trenchcoat/angular/box-plot";
import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";

@Component({
  selector: "app-controlled-box-plot",
  imports: [BoxPlot],
  template: `<tc-box-plot [view]="view()" (tc-view-change)="onViewChange($event)"></tc-box-plot>`,
})
export class ControlledBoxPlot {
  readonly initial = input.required<TcBoxPlot["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcBoxPlot["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/box-plot";
  import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";

  let { initial }: { initial: TcBoxPlot["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcBoxPlot;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcBoxPlot["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-box-plot bind:this={el} {view}></tc-box-plot>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-box-plot")` returns a `TcBoxPlot` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";`
- **React / Next.js:** Props: `import type { BoxPlotProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BoxPlot>`. The element class, for refs: `import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBoxPlot["group"]` with `import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";`
- **Angular:** The directive types the template: `[group]` takes `TcBoxPlot["group"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBoxPlot } from "@adamstavely/trenchcoat/box-plot";`

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
| Arrow keys | Move to the next or previous group; the tooltip shows it and it's read with its median and quartiles |
| Home / End | The first or last group |
| Enter / Space | Picks the group (fires `tc-mark-click`) |
| Escape | Lets go of the group; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words (each group and its median).
- A table of every group's median and quartiles is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces the group ("Imaging: median 8, IQR 7.5 to 9.5, 2 of 3").
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
| **This component alone** | 9.7 KB | 4.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/stats` · Shared Trenchcoat code | 1.2 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **51.1 KB** | **18.1 KB** |
| With Lit – the first component on a page | 70.5 KB | 24.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 22 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |

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

- Give each group at least five or so values; fewer and the quartiles mean little.
- Give `unit` (" d", " ms") rather than baking it into the values.
- Rename the tooltip's words through `boxLabels`, and the shared ones through `labels`.

## Do and don't

### Do

- Let one group carry the accent – the one the reader should compare against.
- Use `variant="both"` when groups have two humps a box would hide.

### Don't

- Use it for a handful of values per group – show the values themselves.
- Start the axis at zero when it hides the spread; `zero` is off by default for that reason.

## Related

- [Ridgeline Chart](ridgeline-chart.md) – How values spread across many groups as overlapping density ridges, each with a tick at its median – the highest median emphasised, sortable by median, ridges that rise and reshape when the data changes, and a table view
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Candlestick Chart](candlestick-chart.md) – A reading's open, high, low and close per period as candles – hollow when it rose, solid when it fell – with moving averages, a volume strip, the latest close tagged, a range to pick or zoom into, and a table view
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view

## Changelog

- **Box Plot** (`tc-box-plot`) and **Ridgeline Chart** (`tc-ridgeline-chart`): spreads within groups – boxes, violins and density ridges.
