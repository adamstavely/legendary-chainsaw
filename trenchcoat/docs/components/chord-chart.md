<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Chord Chart

**Charts** · New

What a handful of groups exchange with each other – an arc per group sized by what it sends and receives, a ribbon per pair showing both directions, the largest group and its ribbons in the accent, and a table view

- **Element:** `<tc-chord-chart>`
- **Size:** 16.7 KB gzip · 47.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/chord-chart";` |
| React / Next.js | `import { ChordChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/chord-chart";` · tags starting with tc- are custom elements |
| Angular | `import { ChordChart } from "@adamstavely/trenchcoat/angular/chord-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/chord-chart";` |

## Example

The live example is in the gallery at `#/chord-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What a handful of groups exchange with each other: hours each lab books on another's instruments, staff moving
between teams. Each group is an arc round a circle, sized by everything it sends and receives; each pair is joined by
a ribbon whose two ends are what each side sent the other, so a lopsided ribbon shows which way most of it went.

The largest group is emphasised and every ribbon touching it takes the accent while the rest stay quiet; `highlight`
picks others by name or index. Pointing at a group lights its ribbons and fades the rest, with what it sent and
received in the tooltip; pointing at a ribbon lights just that one and gives both directions. Names sit outside the
arcs.

The arcs sweep round from twelve o'clock and the ribbons fade in after them; when the data changes, arcs and ribbons
glide to their new angles. Ported from ztd-charts (MIT).

### When to use

- Exchanges in both directions among three to about ten groups, where who trades most with whom is the point.
- Showing that one group dominates the traffic, or that a pair is lopsided.

### When not to use

- Flows that move in one direction through steps – use [Sankey Chart](sankey-chart.md).
- Who paid whom, with entity kinds and flagged transfers – use [Money Flow](money-flow.md).
- How data or work items derive from each other – use [Lineage Graph](lineage-graph.md).
- Shares of one whole with no exchange – use [Pie Chart](pie-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Arc** `.ui-cdc__arc` – one per group, as long as what it sends and receives; the emphasised one in the accent
3. **Ribbon** `.ui-cdc__ribbon` – one per pair, each end as wide as what that side sent
4. **Name** `.tc-chart__value` – the group's name outside its arc
5. **Tooltip** `.tc-chart__tip` – a group's sent and received, or a pair's two directions

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. The emphasised group and its ribbons take
`--tc-plot-accent`; the other ribbons `--tc-plot-rest`, the other arcs `--tc-plot-line-rest` – override any of them
on the element. Ribbons are parted by a hairline of the card's colour. `pad-angle` sets the gap between groups in
radians. `still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-chord-chart heading="Shared instrument time" description="Hours booked across labs" unit=" h"></tc-chord-chart>

<script type="module">
  import "@adamstavely/trenchcoat/chord-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-chord-chart").data = [
    { source: "Genomics", target: "Imaging", value: 40 },
    { source: "Imaging", target: "Genomics", value: 28 },
    { source: "Genomics", target: "Proteomics", value: 62 },
    { source: "Proteomics", target: "Genomics", value: 55 },
  ];
</script>
```

### React / Next.js

```tsx
import { ChordChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { source: "Genomics", target: "Imaging", value: 40 },
  { source: "Imaging", target: "Genomics", value: 28 },
  { source: "Genomics", target: "Proteomics", value: 62 },
  { source: "Proteomics", target: "Genomics", value: 55 },
];

export function Instruments() {
  return <ChordChart title="Shared instrument time" description="Hours booked across labs" unit=" h" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/chord-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";

defineProps<{ source: TcChordChart["source"]; target: TcChordChart["target"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-chord-chart :source="source" :target="target" @tc-view-change="onViewChange"></tc-chord-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ChordChart } from "@adamstavely/trenchcoat/angular/chord-chart";
import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";

@Component({
  selector: "app-chord-chart-example",
  imports: [ChordChart],
  template: `<tc-chord-chart [source]="source()" [target]="target()" (tc-view-change)="onViewChange($event)"></tc-chord-chart>`,
})
export class ChordChartExample {
  readonly source = input.required<TcChordChart["source"]>();
  readonly target = input.required<TcChordChart["target"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/chord-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";

  let { source, target }: { source: TcChordChart["source"]; target: TcChordChart["target"] } = $props();
  let el: TcChordChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-chord-chart bind:this={el} {source} {target}></tc-chord-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | – | `Accessor<T, string> \| undefined` | `undefined` | The field naming who sends; by default "source", or "from" when the rows have no "source" |
| `target` | – | `Accessor<T, string> \| undefined` | `undefined` | The field naming who receives; by default "target", or "to" when the rows have no "target" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The amount sent field; by default "value" |
| `padAngle` | `pad-angle` | `number` | `0.05` | The gap between groups, in radians |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a group or ribbon, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A group or ribbon was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cdc-part` | `0.6` | both |

#### Design tokens it reads (2)

`--tc-plot-bg`, `--tc-plot-focus`

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
| `source` | `el.source = …;` | `<… source={…} />` | `<tc-chord-chart :source="…">` | `<tc-chord-chart [source]="…">` | `<tc-chord-chart {source}>` |
| `target` | `el.target = …;` | `<… target={…} />` | `<tc-chord-chart :target="…">` | `<tc-chord-chart [target]="…">` | `<tc-chord-chart {target}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-chord-chart :value="…">` | `<tc-chord-chart [value]="…">` | `<tc-chord-chart {value}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-chord-chart :data="…">` | `<tc-chord-chart [data]="…">` | `<tc-chord-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-chord-chart :highlight="…">` | `<tc-chord-chart [highlight]="…">` | `<tc-chord-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-chord-chart :format="…">` | `<tc-chord-chart [format]="…">` | `<tc-chord-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-chord-chart :labels="…">` | `<tc-chord-chart [labels]="…">` | `<tc-chord-chart {labels}>` |

*Also attributes: `pad-angle`, `heading`, `description`, `unit`, `locale`, `height`, `still`, `easing` and 5 more – see the API table.*

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
<tc-chord-chart id="chord-chart"></tc-chord-chart>

<script type="module">
  import "@adamstavely/trenchcoat/chord-chart";

  const el = document.querySelector("#chord-chart");
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
import "@adamstavely/trenchcoat/chord-chart";
import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";

const props = defineProps<{ initial: TcChordChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcChordChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-chord-chart :view="view" @tc-view-change="onViewChange"></tc-chord-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ChordChart } from "@adamstavely/trenchcoat/angular/chord-chart";
import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";

@Component({
  selector: "app-controlled-chord-chart",
  imports: [ChordChart],
  template: `<tc-chord-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-chord-chart>`,
})
export class ControlledChordChart {
  readonly initial = input.required<TcChordChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcChordChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/chord-chart";
  import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";

  let { initial }: { initial: TcChordChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcChordChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcChordChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-chord-chart bind:this={el} {view}></tc-chord-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-chord-chart")` returns a `TcChordChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";`
- **React / Next.js:** Props: `import type { ChordChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ChordChart>`. The element class, for refs: `import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcChordChart["source"]` with `import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";`
- **Angular:** The directive types the template: `[source]` takes `TcChordChart["source"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcChordChart } from "@adamstavely/trenchcoat/chord-chart";`

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
| Arrow keys | Move through the groups, then the ribbons; the tooltip shows each and it's read with its values |
| Home / End | The first group or the last ribbon |
| Enter / Space | Picks the group or ribbon (fires `tc-mark-click`) |
| Escape | Lets go; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words: each group with its total.
- A table of every group and pair with its values is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces each group with its share, and each pair with both directions ("Genomics ↔
  Imaging: Genomics → Imaging 40, Imaging → Genomics 28, 4 of 6").
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
| **This component alone** | 8.5 KB | 3.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/chord` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **47.5 KB** | **16.7 KB** |
| With Lit – the first component on a page | 66.9 KB | 22.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 64 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of data replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.6 ms | data: first render, 64 nodes; update 0.4 ms |
| 1,000 items | 3.0 ms | data: first render, 64 nodes; update 0.8 ms |

What it renders doesn't grow with data (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **1 frames/s** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- One row per direction: `source`, `target` and `value`; rows with `from` and `to` work too. Rows for the same pair
  and direction add up.
- Keep group names short; they sit outside the circle and shrink it as they grow.
- A row from a group to itself draws a loop back into its own arc.

## Do and don't

### Do

- Emphasise the group the reader should follow.
- Give `unit` (" h", " people") so both directions read as amounts.

### Don't

- Draw more than about ten groups; the arcs and ribbons get too thin to point at.
- Use it for one-way flows – the ribbon's two ends would be one value and nothing.

## Related

- [Sankey Chart](sankey-chart.md) – How an amount flows between stages – nodes in columns by step, flows as bands as wide as their value, one node and its flows in the accent, a node's or flow's path lit on hover, and a table view
- [Pie Chart](pie-chart.md) – A few shares of a whole as slices, each in its own ink or one emphasised, the shares written beside them and the pointed-at slice lifting out
- [Money Flow](money-flow.md) – How money moved between entities – people, companies, shells and banks in columns, transfers as bands sized by amount with flag chips, an entity's or a transfer's flows lit with a readout in words, a list of every transfer and a table view
- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away

## Changelog

- **Chord Chart** (`tc-chord-chart`): what groups exchange, as arcs and ribbons.
