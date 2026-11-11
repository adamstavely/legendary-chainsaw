<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Network Graph

**Charts** · New

Any nodes and links laid out by force, so clusters and bridges show for themselves, with groups in their own inks, the most-linked named, a node's neighbourhood lit on hover or focus, and nodes that can be dragged into place.

- **Element:** `<tc-network-graph>`
- **Size:** 20.7 KB gzip · 57.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/network-graph";` |
| React / Next.js | `import { NetworkGraph } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/network-graph";` · tags starting with tc- are custom elements |
| Angular | `import { NetworkGraph } from "@adamstavely/trenchcoat/angular/network-graph";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/network-graph";` |

## Example

The live example is in the gallery at `#/network-graph`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Any nodes and the links between them, laid out by force: linked nodes pull together and the rest push apart, so
clusters, bridges and loners show for themselves. Give it `nodes` and `links`, or rows in `data` with `source`,
`target` and `value` – the nodes are then the ones the links name, which is how a `tc-chart` spec draws one.

With a `group` on the nodes each group takes its own chart ink, with a legend in the header; without groups the
most-linked node takes the accent and the rest stay quiet (`highlight` picks others). A node's size is its `size`, or
how many links it has; a link's width is its `value`, and stronger links are also shorter. The most-linked nodes are
named beside their circles where the names fit, up to `max-labels` (fewer in a narrow card); every node is named in
the tooltip and the table.

Pointing at a node, or moving to it with the arrows, lights it, its links and its neighbours and quiets the rest. With
`drag-nodes`, a node dragged somewhere stays there – drawn with a dashed ring – and the others settle round it;
double-click it, or call `unpin()`, to let it go. The layout has no randomness: the same graph always draws the same
picture, and a changed graph starts from the last layout, so nodes glide rather than jump. Above `canvas-threshold`
nodes (1,500 by default) the links are painted on a canvas under the drawing.

Unlike [Relationship Graph](relationship-graph.md), nothing is put in the middle, and unlike
[Agent Graph](agent-graph.md) it isn't about agents and their calls: the layout comes from the links alone.

### When to use

- Who works with whom, what depends on what, which topics appear together – where the shape of the network is the
  point: clusters, the people who bridge them, the ones on their own.
- A few dozen to a few thousand nodes.

### When not to use

- One person or organisation and their connections, ring by ring – use [Relationship Graph](relationship-graph.md).
- Agents, their tools and live calls – use [Agent Graph](agent-graph.md).
- How much a handful of groups exchange – use [Chord Chart](chord-chart.md).
- Amounts flowing one way through stages – use [Sankey Chart](sankey-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the legend of groups, and the Table button
2. **Link** `.ui-nwg__link` – one per pair of nodes, as wide as its value
3. **Node** `.ui-nwg__node` – a circle sized by `size` or its links, in its group's ink or the emphasis inks; a pinned
4. **Name** `.tc-chart__value` – on a chip of the card's colour `.ui-nwg__chip` beside the node
5. **Tooltip** `.tc-chart__tip` – the node's name, group, number of links and who it's linked to

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Groups take `--tc-plot-ink-1` to `--tc-plot-ink-6`;
without groups the emphasised node takes `--tc-plot-accent` and the rest `--tc-plot-rest`. Links use
`--tc-nwg-link` (by default `--tc-plot-line-rest`); nodes are parted by a ring of `--tc-plot-bg`. Names sit on chips
of the card's colour, never on a node or across a line. `still` (or the system's reduced-motion setting) draws
everything at once.

## Usage

### HTML

```html
<tc-network-graph heading="Co-authors" description="Papers written together this year" drag-nodes></tc-network-graph>

<script type="module">
  import "@adamstavely/trenchcoat/network-graph";
  import "@adamstavely/trenchcoat/tokens.css";
  const graph = document.querySelector("tc-network-graph");
  graph.nodes = [
    { id: "I. Ko", group: "Genomics" },
    { id: "R. Mehta", group: "Genomics" },
    { id: "P. Adeyemi", group: "Imaging" },
    { id: "E. Sato", group: "Imaging" },
  ];
  graph.links = [
    { source: "I. Ko", target: "R. Mehta", value: 3 },
    { source: "I. Ko", target: "P. Adeyemi", value: 1 },
    { source: "P. Adeyemi", target: "E. Sato", value: 2 },
  ];
</script>
```

### React / Next.js

```tsx
import { NetworkGraph } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const nodes = [
  { id: "I. Ko", group: "Genomics" },
  { id: "R. Mehta", group: "Genomics" },
  { id: "P. Adeyemi", group: "Imaging" },
  { id: "E. Sato", group: "Imaging" },
];
const links = [
  { source: "I. Ko", target: "R. Mehta", value: 3 },
  { source: "I. Ko", target: "P. Adeyemi", value: 1 },
  { source: "P. Adeyemi", target: "E. Sato", value: 2 },
];

export function Coauthors() {
  return <NetworkGraph title="Co-authors" description="Papers written together this year" nodes={nodes} links={links} dragNodes onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/network-graph";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";

defineProps<{ nodes: TcNetworkGraph["nodes"]; links: TcNetworkGraph["links"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-network-graph :nodes="nodes" :links="links" @tc-view-change="onViewChange"></tc-network-graph>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { NetworkGraph } from "@adamstavely/trenchcoat/angular/network-graph";
import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";

@Component({
  selector: "app-network-graph-example",
  imports: [NetworkGraph],
  template: `<tc-network-graph [nodes]="nodes()" [links]="links()" (tc-view-change)="onViewChange($event)"></tc-network-graph>`,
})
export class NetworkGraphExample {
  readonly nodes = input.required<TcNetworkGraph["nodes"]>();
  readonly links = input.required<TcNetworkGraph["links"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/network-graph";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";

  let { nodes, links }: { nodes: TcNetworkGraph["nodes"]; links: TcNetworkGraph["links"] } = $props();
  let el: TcNetworkGraph;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-network-graph bind:this={el} {nodes} {links}></tc-network-graph>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `nodes` | – | `NetworkNode[]` | `[]` | The nodes; when empty, the nodes the links name |
| `links` | – | `NetworkLink[]` | `[]` | The links; when empty, links are read from the rows in `data` |
| `source` | – | `Accessor<T, string> \| undefined` | `undefined` | For links read from `data`: the field naming one end; by default "source", or "from" |
| `target` | – | `Accessor<T, string> \| undefined` | `undefined` | For links read from `data`: the field naming the other end; by default "target", or "to" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | For links read from `data`: the link's strength field; by default "value", else 1 |
| `maxLabels` | `max-labels` | `number` | `12` | How many nodes are named beside their circles at most – fewer when the chart is narrow |
| `dragNodes` | `drag-nodes` | `boolean` | `false` | Lets the pointer drag a node; it stays where it's dropped until double-clicked |
| `canvasThreshold` | `canvas-threshold` | `number` | `1500` | Above this many nodes the links are painted on a canvas |
| `networkLabels` | – | `Partial<NetworkGraphLabels>` | `{}` | The network graph's own words, merged over defaultNetworkGraphLabels |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a node, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A node was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `unpin(id?: string)` | `void` | Lets a pinned node go: the layout settles it again |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-nwg-link` | `var(--tc-plot-line-rest)` | both |

#### Design tokens it reads (4)

`--tc-plot-bg`, `--tc-plot-focus`, `--tc-plot-line-rest`, `--tc-text-primary`

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
| `nodes` | `el.nodes = …;` | `<… nodes={…} />` | `<tc-network-graph :nodes="…">` | `<tc-network-graph [nodes]="…">` | `<tc-network-graph {nodes}>` |
| `links` | `el.links = …;` | `<… links={…} />` | `<tc-network-graph :links="…">` | `<tc-network-graph [links]="…">` | `<tc-network-graph {links}>` |
| `source` | `el.source = …;` | `<… source={…} />` | `<tc-network-graph :source="…">` | `<tc-network-graph [source]="…">` | `<tc-network-graph {source}>` |
| `target` | `el.target = …;` | `<… target={…} />` | `<tc-network-graph :target="…">` | `<tc-network-graph [target]="…">` | `<tc-network-graph {target}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-network-graph :value="…">` | `<tc-network-graph [value]="…">` | `<tc-network-graph {value}>` |
| `networkLabels` | `el.networkLabels = …;` | `<… networkLabels={…} />` | `<tc-network-graph :networkLabels="…">` | `<tc-network-graph [networkLabels]="…">` | `<tc-network-graph {networkLabels}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-network-graph :data="…">` | `<tc-network-graph [data]="…">` | `<tc-network-graph {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-network-graph :highlight="…">` | `<tc-network-graph [highlight]="…">` | `<tc-network-graph {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-network-graph :format="…">` | `<tc-network-graph [format]="…">` | `<tc-network-graph {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-network-graph :labels="…">` | `<tc-network-graph [labels]="…">` | `<tc-network-graph {labels}>` |

*Also attributes: `max-labels`, `drag-nodes`, `canvas-threshold`, `heading`, `description`, `unit`, `locale`, `height` and 7 more – see the API table.*

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
<tc-network-graph id="network-graph"></tc-network-graph>

<script type="module">
  import "@adamstavely/trenchcoat/network-graph";

  const el = document.querySelector("#network-graph");
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
import "@adamstavely/trenchcoat/network-graph";
import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";

const props = defineProps<{ initial: TcNetworkGraph["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcNetworkGraph["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-network-graph :view="view" @tc-view-change="onViewChange"></tc-network-graph>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { NetworkGraph } from "@adamstavely/trenchcoat/angular/network-graph";
import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";

@Component({
  selector: "app-controlled-network-graph",
  imports: [NetworkGraph],
  template: `<tc-network-graph [view]="view()" (tc-view-change)="onViewChange($event)"></tc-network-graph>`,
})
export class ControlledNetworkGraph {
  readonly initial = input.required<TcNetworkGraph["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcNetworkGraph["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/network-graph";
  import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";

  let { initial }: { initial: TcNetworkGraph["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcNetworkGraph;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcNetworkGraph["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-network-graph bind:this={el} {view}></tc-network-graph>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-network-graph")` returns a `TcNetworkGraph` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";`
- **React / Next.js:** Props: `import type { NetworkGraphProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof NetworkGraph>`. The element class, for refs: `import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcNetworkGraph["nodes"]` with `import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";`
- **Angular:** The directive types the template: `[nodes]` takes `TcNetworkGraph["nodes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcNetworkGraph } from "@adamstavely/trenchcoat/network-graph";`

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
| Arrow keys | Move from node to node, most-linked first; the tooltip shows each, its neighbourhood is lit, and it's read with its links |
| Home / End | The most- or least-linked node |
| Enter / Space | Picks the node (fires `tc-mark-click`) |
| Escape | Lets go; pressed again, it's the page's |

Dragging is for the pointer only; everything it shows is reachable from the keyboard.

### Screen readers

- The plot is a group named by the heading, described in words: how many nodes, links and groups, and the most-linked
  node.
- A table of every node with its group, number of links and neighbours is always there for screen readers (the first
  60, and how many more); the Table button shows it to everyone.
- Moving with the arrows announces each node with its group and who it's linked to ("I. Ko Genomics: 5 links: R.
  Mehta, S. Varga, …, 1 of 40").
- The drawing itself is hidden; groups are named in the legend and the table, never by colour alone.

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
| **This component alone** | 15.3 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.5 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/chart/force` · Shared Trenchcoat code | 4.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/canvas` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **57.5 KB** | **20.7 KB** |
| With Lit – the first component on a page | 76.9 KB | 26.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **7.2 ms** | the gallery demo's data, 157 DOM nodes – to layout, median of 7 |
| Typical update | **4.0 ms** | one item of links replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.2 ms | links: first render, 157 nodes; update 3.5 ms |
| 1,000 items | 6.8 ms | links: first render, 157 nodes; update 4.2 ms |

What it renders doesn't grow with links (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- Timers: `setTimeout`.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give each node a short `label`; the id is used when there isn't one, and names longer than a few words crowd the
  drawing.
- Links name nodes by id, in either direction; links between the same two nodes add up, and a link from a node to
  itself is left out.
- Use `group` for a handful of groups (up to six inks); with more, the inks repeat.

## Do and don't

### Do

- Say in the description what a link means ("papers written together this year").
- Keep `max-labels` low on a busy graph; the tooltip names the rest.

### Don't

- Read distances as measurements – the layout places nodes so the structure shows, not to scale.
- Use it for a strict hierarchy; a [Treemap](treemap.md) or a tree reads better.

## Related

- [Relationship Graph](relationship-graph.md) – Connections between people and organisations around one of them – direct and second-hand rings in a fixed layout, relationships drawn by strength, re-centring on click, and a panel and keyboard list of every connection
- [Agent Graph](agent-graph.md) – Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you
- [Chord Chart](chord-chart.md) – What a handful of groups exchange with each other – an arc per group sized by what it sends and receives, a ribbon per pair showing both directions, the largest group and its ribbons in the accent, and a table view
- [Sankey Chart](sankey-chart.md) – How an amount flows between stages – nodes in columns by step, flows as bands as wide as their value, one node and its flows in the accent, a node's or flow's path lit on hover, and a table view
