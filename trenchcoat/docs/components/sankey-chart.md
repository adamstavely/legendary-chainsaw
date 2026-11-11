<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Sankey Chart

**Charts** · New

How an amount flows between stages – nodes in columns by step, flows as bands as wide as their value, one node and its flows in the accent, a node's or flow's path lit on hover, and a table view

- **Element:** `<tc-sankey-chart>`
- **Size:** 17.6 KB gzip · 49.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/sankey-chart";` |
| React / Next.js | `import { SankeyChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/sankey-chart";` · tags starting with tc- are custom elements |
| Angular | `import { SankeyChart } from "@adamstavely/trenchcoat/angular/sankey-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/sankey-chart";` |

## Example

The live example is in the gallery at `#/sankey-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How an amount flows between stages: funders to labs to what the labs spend it on. Each name is a node, placed in a
column by its step – sources on the left, ends on the right – and each row of data is a flow, drawn as a band as wide
as its value. A node is as tall as the larger of what comes in and what goes out.

One node is emphasised – by default the largest in the last column – and every flow into or out of it takes the accent
while the rest stay quiet; `highlight` picks others by name or index. Pointing at a node lights its flows and fades the
rest; pointing at a flow lights just that one, and the tooltip gives its share of where it came from. Names and values
sit beside the first and last columns, and on a backing of the card's colour over the flows in between.

The nodes open from their middles column by column, then the flows draw across from left to right; when the data
changes, nodes and bands glide to their new sizes. Ported from ztd-charts (MIT).

### When to use

- Showing how a total splits and recombines across two or more steps: budget to labs to spending, samples through
  intake, sequencing and analysis.
- Comparing the size of flows at a glance, when the path matters as much as the totals.

### When not to use

- Tracing who paid whom, with entity kinds, flags and a list of transfers – use [Money Flow](money-flow.md).
- A chain of linked items from questions to outcomes, one card per item – use [Traceability Spine](traceability-spine.md).
- Exchanges both ways between the same groups – use [Chord Chart](chord-chart.md).
- One split of a total with no steps – use [Bar Chart](bar-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Node** `.ui-snk__node` – one per name, as tall as its total; the emphasised one in the accent
3. **Flow** `.ui-snk__flow` – one per source and target, as wide as its value
4. **Name** `.tc-chart__value` – the node's name, with its value `.tc-chart__tick` under it when there's room
5. **Backing** `.ui-snk__backing` – the card-coloured panel under names that sit over the flows
6. **Tooltip** `.tc-chart__tip` – a node's total and its flows in and out, or a flow's value and share

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. The emphasised node and its flows take
`--tc-plot-accent`; the other flows `--tc-plot-rest`, the other nodes `--tc-plot-line-rest` – override any of them on
the element. Names are written in the text inks beside the nodes, never on a band. `node-width` and `node-padding`
set the nodes' width and the space between them. `still` (or the system's reduced-motion setting) draws everything at
once.

## Usage

### HTML

```html
<tc-sankey-chart heading="Grant funding" description="This year, in millions" unit="M"></tc-sankey-chart>

<script type="module">
  import "@adamstavely/trenchcoat/sankey-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-sankey-chart").data = [
    { source: "Federal grants", target: "Genomics", value: 6.4 },
    { source: "Foundation", target: "Imaging", value: 2.6 },
    { source: "Genomics", target: "Staff", value: 5.2 },
    { source: "Imaging", target: "Instruments", value: 3.1 },
  ];
</script>
```

### React / Next.js

```tsx
import { SankeyChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { source: "Federal grants", target: "Genomics", value: 6.4 },
  { source: "Foundation", target: "Imaging", value: 2.6 },
  { source: "Genomics", target: "Staff", value: 5.2 },
  { source: "Imaging", target: "Instruments", value: 3.1 },
];

export function Funding() {
  return <SankeyChart title="Grant funding" description="This year, in millions" unit="M" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/sankey-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";

defineProps<{ source: TcSankeyChart["source"]; target: TcSankeyChart["target"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-sankey-chart :source="source" :target="target" @tc-view-change="onViewChange"></tc-sankey-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SankeyChart } from "@adamstavely/trenchcoat/angular/sankey-chart";
import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";

@Component({
  selector: "app-sankey-chart-example",
  imports: [SankeyChart],
  template: `<tc-sankey-chart [source]="source()" [target]="target()" (tc-view-change)="onViewChange($event)"></tc-sankey-chart>`,
})
export class SankeyChartExample {
  readonly source = input.required<TcSankeyChart["source"]>();
  readonly target = input.required<TcSankeyChart["target"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sankey-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";

  let { source, target }: { source: TcSankeyChart["source"]; target: TcSankeyChart["target"] } = $props();
  let el: TcSankeyChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-sankey-chart bind:this={el} {source} {target}></tc-sankey-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `source` | – | `Accessor<T, string> \| undefined` | `undefined` | The field naming where a flow starts; by default "source" |
| `target` | – | `Accessor<T, string> \| undefined` | `undefined` | The field naming where a flow ends; by default "target" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The flow's amount field; by default "value" |
| `nodeWidth` | `node-width` | `number` | `10` | How wide each node is, in px |
| `nodePadding` | `node-padding` | `number` | `14` | The space between nodes in a column, in px |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a node or flow, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A node or flow was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

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
| `source` | `el.source = …;` | `<… source={…} />` | `<tc-sankey-chart :source="…">` | `<tc-sankey-chart [source]="…">` | `<tc-sankey-chart {source}>` |
| `target` | `el.target = …;` | `<… target={…} />` | `<tc-sankey-chart :target="…">` | `<tc-sankey-chart [target]="…">` | `<tc-sankey-chart {target}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-sankey-chart :value="…">` | `<tc-sankey-chart [value]="…">` | `<tc-sankey-chart {value}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-sankey-chart :data="…">` | `<tc-sankey-chart [data]="…">` | `<tc-sankey-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-sankey-chart :highlight="…">` | `<tc-sankey-chart [highlight]="…">` | `<tc-sankey-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-sankey-chart :format="…">` | `<tc-sankey-chart [format]="…">` | `<tc-sankey-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-sankey-chart :labels="…">` | `<tc-sankey-chart [labels]="…">` | `<tc-sankey-chart {labels}>` |

*Also attributes: `node-width`, `node-padding`, `heading`, `description`, `unit`, `locale`, `height`, `still` and 6 more – see the API table.*

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
<tc-sankey-chart id="sankey-chart"></tc-sankey-chart>

<script type="module">
  import "@adamstavely/trenchcoat/sankey-chart";

  const el = document.querySelector("#sankey-chart");
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
import "@adamstavely/trenchcoat/sankey-chart";
import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";

const props = defineProps<{ initial: TcSankeyChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcSankeyChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-sankey-chart :view="view" @tc-view-change="onViewChange"></tc-sankey-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SankeyChart } from "@adamstavely/trenchcoat/angular/sankey-chart";
import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";

@Component({
  selector: "app-controlled-sankey-chart",
  imports: [SankeyChart],
  template: `<tc-sankey-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-sankey-chart>`,
})
export class ControlledSankeyChart {
  readonly initial = input.required<TcSankeyChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcSankeyChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sankey-chart";
  import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";

  let { initial }: { initial: TcSankeyChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcSankeyChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcSankeyChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-sankey-chart bind:this={el} {view}></tc-sankey-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-sankey-chart")` returns a `TcSankeyChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";`
- **React / Next.js:** Props: `import type { SankeyChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SankeyChart>`. The element class, for refs: `import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSankeyChart["source"]` with `import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";`
- **Angular:** The directive types the template: `[source]` takes `TcSankeyChart["source"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSankeyChart } from "@adamstavely/trenchcoat/sankey-chart";`

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
| Arrow keys | Move through the nodes, then the flows; the tooltip shows each and it's read with its value |
| Home / End | The first node or the last flow |
| Enter / Space | Picks the node or flow (fires `tc-mark-click`) |
| Escape | Lets go; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words: how many nodes and flows, and the three largest flows.
- A table of every node and flow with its value is always there for screen readers; the Table button shows it to
  everyone.
- Moving with the arrows announces each node or flow with its value and position ("Federal → Genomics: 6, 7 of 13").
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
| **This component alone** | 8.8 KB | 4.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/sankey` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **49.8 KB** | **17.6 KB** |
| With Lit – the first component on a page | 69.2 KB | 23.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.8 ms** | the gallery demo's data, 103 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of data replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.6 ms | data: first render, 204 nodes; update 1.1 ms |
| 1,000 items | 4.0 ms | data: first render, 204 nodes; update 1.7 ms |

1,000 items of data: 4.0 ms, 204 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **9 frames/s** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- One row per flow: `source`, `target` and `value` (rename the fields with the accessors).
- Keep node names short – the first and last columns give them at most a fifth of the width each.
- Flows that loop back to an earlier node are drawn but don't push columns apart; avoid them where you can.

## Do and don't

### Do

- Emphasise the node the reader should follow – the outcome, or the source in question.
- Give `unit` and `format` so the values read as amounts ("4.2M").

### Don't

- Use more than about four columns or a dozen nodes per column; the bands turn to hairlines.
- Draw flows whose values don't add up between steps without saying why – a node's height is the larger side.

## Related

- [Chord Chart](chord-chart.md) – What a handful of groups exchange with each other – an arc per group sized by what it sends and receives, a ribbon per pair showing both directions, the largest group and its ribbons in the accent, and a table view
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Money Flow](money-flow.md) – How money moved between entities – people, companies, shells and banks in columns, transfers as bands sized by amount with flag chips, an entity's or a transfer's flows lit with a readout in words, a list of every transfer and a table view
- [Traceability Spine](traceability-spine.md) – The chain from open questions to outcomes – a column per stage from questions and gaps to work, papers and who cites them, linked cards joined by lines, and a card's whole path traced on click with the rest dimmed

## Changelog

- **Sankey Chart** (`tc-sankey-chart`): flows between stages as bands as wide as their value.
