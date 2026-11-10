<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Lineage Graph

**Trust & calibration** · New

Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away

- **Element:** `<tc-lineage-graph>`
- **Size:** 13.6 KB gzip · 49.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/lineage-graph";` |
| React / Next.js | `import { LineageGraph } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/lineage-graph";` · tags starting with tc- are custom elements |
| Angular | `import { LineageGraph } from "@adamstavely/trenchcoat/angular/lineage-graph";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/lineage-graph";` |

## Example

The live example is in the gallery at `#/lineage-graph`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where an output came from, laid out cause to effect: the run, its turns, the queries and tools they called, the
source chunks that came back, the claims made from them and the artifacts that carry those claims. Point at or focus
any step and its whole lineage lights up – everything it came from and everything it feeds. A weak link, where the
context was truncated and a source may not have reached the model in full, is dashed and named. Click a step for its
record; switch to the event chain to read the same steps in the order they happened.

### When to use

- Answering “where did this sentence in the report come from?” for a finished AI output.
- Auditing which sources actually reached the model, and which only partly did.
- Following a claim forward to every document that carries it, before you correct it.

### When not to use

- Watching agents and tools call each other live – use [Agent Graph](agent-graph.md).
- Timing a run's steps and finding the slow one – use [Trace Waterfall](trace-waterfall.md).
- Showing how much of a document is sourced, synthesised or original – use [Provenance Summary](provenance-summary.md).
- Marking up an answer claim by claim for the reader – use [Claim Answer](claim-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a branching icon, the heading, and at its right how many steps and weak links and the view
2. **View** `.ui-lng__tabs` – Graph or Event chain
3. **Column** `.ui-lng__head` – a column's heading and how many steps it holds
4. **Step** `.ui-lng__node` – one node: its column's mark, what it is and a quieter detail
5. **Legend** `.ui-lng__legend` – a link, a weak link and the lit lineage
6. **Record** `.ui-lng__record` – the open step: its fields and passage, what it came from and what it feeds

## Looks

Standard sets the graph in a white card on a gray tray, with the header on the tray; nodes are raised cards with
semibold titles. Clean drops the tray: the header is the first row of one white card, column headings follow the caption style,
and links and icons are drawn thinner. Both colour each column's mark the same way and dash weak links.

## Usage

### HTML

```html
<tc-lineage-graph id="lineage" heading="Vendor risk memo"></tc-lineage-graph>

<script type="module">
  import "@adamstavely/trenchcoat/lineage-graph";
  import "@adamstavely/trenchcoat/tokens.css";

  const graph = document.querySelector("#lineage");
  graph.nodes = [
    { id: "run", column: "run", label: "Vendor risk review", at: 0 },
    { id: "q1", column: "query", label: "sql: incidents by vendor", at: 4000 },
    { id: "c1", column: "chunk", label: "Incident log", detail: "rows 1–4 of 11", at: 4100 },
    { id: "k1", column: "claim", label: "Outages are getting longer", at: 9600, tone: "amber" },
  ];
  graph.edges = [
    { from: "run", to: "q1" },
    { from: "q1", to: "c1" },
    { from: "c1", to: "k1", weak: true, note: "4 of 11 rows fit the context" },
  ];
  graph.addEventListener("tc-selected-change", (e) => console.log(e.detail.node?.label));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { LineageGraph, type LineageEdge, type LineageNode } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const nodes: LineageNode[] = [
  { id: "run", column: "run", label: "Vendor risk review", at: 0 },
  { id: "c1", column: "chunk", label: "Incident log", detail: "rows 1–4 of 11", at: 4100 },
  { id: "k1", column: "claim", label: "Outages are getting longer", at: 9600, tone: "amber" },
];
const edges: LineageEdge[] = [
  { from: "run", to: "c1" },
  { from: "c1", to: "k1", weak: true, note: "4 of 11 rows fit the context" },
];

export function MemoLineage() {
  const [open, setOpen] = useState<string | null>("k1");
  return <LineageGraph title="Vendor risk memo" nodes={nodes} edges={edges} selected={open} onSelectedChange={setOpen} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/lineage-graph";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";

defineProps<{ columns: TcLineageGraph["columns"]; nodes: TcLineageGraph["nodes"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-lineage-graph :columns="columns" :nodes="nodes" @tc-selected-change="onSelectedChange"></tc-lineage-graph>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { LineageGraph } from "@adamstavely/trenchcoat/angular/lineage-graph";
import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";

@Component({
  selector: "app-lineage-graph-example",
  imports: [LineageGraph],
  template: `<tc-lineage-graph [columns]="columns()" [nodes]="nodes()" (tc-selected-change)="onSelectedChange($event)"></tc-lineage-graph>`,
})
export class LineageGraphExample {
  readonly columns = input.required<TcLineageGraph["columns"]>();
  readonly nodes = input.required<TcLineageGraph["nodes"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/lineage-graph";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";

  let { columns, nodes }: { columns: TcLineageGraph["columns"]; nodes: TcLineageGraph["nodes"] } = $props();
  let el: TcLineageGraph;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-lineage-graph bind:this={el} {columns} {nodes}></tc-lineage-graph>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Lineage"` | The heading in the bar, and the graph's name |
| `columns` | – | `LineageColumn[]` | `[ { id: "run", label: "Run", tone: "neutral" }, { id: "turn", label: "Turns", tone: "blue" }, { id: "query", label: "Queries & tools", tone: "amber" }, { id: "chunk", label: "Source chunks", tone: "teal" }, { id: "claim", label: "Claims", tone: "violet" }, { id: "artifact", label: "Artifacts", tone: "rose" }, ]` | The columns, cause to effect – a node sits in the column its `column` names; columns without nodes don't show |
| `nodes` | – | `LineageNode[]` | `[]` | Everything in the lineage: the run, turns, queries and tools, source chunks, claims, artifacts |
| `edges` | – | `LineageEdge[]` | `[]` | The links, from what came first to what it fed |
| `selected` | `selected` | `string \| null` | `null` | The node whose record is open (null = none). Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `view` | `view` | `LineageView` | `"graph"` | "graph" or "chain" (the event chain). Changed by the user unless a tc-view-change listener calls preventDefault() |
| `weakLabel` | `weak-label` | `string` | `"Truncated context"` | What a weak link means – in the legend, and in a node's links when the link has no note of its own |
| `emptyText` | `empty-text` | `string` | `"No lineage recorded yet"` | Shown when there are no nodes |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A node's record was opened or closed ({ selected, node }: LineageSelectedChange; selected is null when closed); cancelable |
| `tc-view-change` | – | Yes | The Graph or Event chain tab was picked ({ view }: LineageViewChange); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-lineage-graph-tray-bg` | `var(--tc-surface-tray)` | standard |
| `--tc-lineage-graph-panel-bg` | `var(--tc-surface-raised)` | standard, clean |
| `--tc-lineage-graph-node-bg` | `var(--tc-surface-raised)` | standard, clean |
| `--tc-lineage-graph-edge` | `var(--tc-border-strong)` | standard, clean |
| `--tc-lineage-graph-edge-lit` | `var(--tc-accent-text)` | standard, clean |
| `--tc-lineage-graph-tone` | `var(--tc-border-strong)` | not set – this fallback applies |

#### Design tokens it reads (107)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-lineage-graph-tone-bg`, `--tc-lineage-graph-tone-fg`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-8`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-amber-solid`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-pink-solid`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-rose-solid`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-teal-solid`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tone-violet-solid`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `LINEAGE_COLUMNS: LineageColumn[]` | The columns of an AI output's lineage, cause to effect |

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
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-lineage-graph :columns="…">` | `<tc-lineage-graph [columns]="…">` | `<tc-lineage-graph {columns}>` |
| `nodes` | `el.nodes = …;` | `<… nodes={…} />` | `<tc-lineage-graph :nodes="…">` | `<tc-lineage-graph [nodes]="…">` | `<tc-lineage-graph {nodes}>` |
| `edges` | `el.edges = …;` | `<… edges={…} />` | `<tc-lineage-graph :edges="…">` | `<tc-lineage-graph [edges]="…">` | `<tc-lineage-graph {edges}>` |

*Also attributes: `heading`, `selected`, `view`, `weak-label`, `empty-text` – see the API table.*

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
<tc-lineage-graph id="lineage-graph"></tc-lineage-graph>

<script type="module">
  import "@adamstavely/trenchcoat/lineage-graph";

  const el = document.querySelector("#lineage-graph");
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
import "@adamstavely/trenchcoat/lineage-graph";
import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";

const props = defineProps<{ initial: TcLineageGraph["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcLineageGraph["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-lineage-graph :selected="selected" @tc-selected-change="onSelectedChange"></tc-lineage-graph>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { LineageGraph } from "@adamstavely/trenchcoat/angular/lineage-graph";
import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";

@Component({
  selector: "app-controlled-lineage-graph",
  imports: [LineageGraph],
  template: `<tc-lineage-graph [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-lineage-graph>`,
})
export class ControlledLineageGraph {
  readonly initial = input.required<TcLineageGraph["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcLineageGraph["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/lineage-graph";
  import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";

  let { initial }: { initial: TcLineageGraph["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcLineageGraph;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcLineageGraph["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-lineage-graph bind:this={el} {selected}></tc-lineage-graph>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-lineage-graph")` returns a `TcLineageGraph` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";`
- **React / Next.js:** Props: `import type { LineageGraphProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof LineageGraph>`. The element class, for refs: `import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLineageGraph["columns"]` with `import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";`
- **Angular:** The directive types the template: `[columns]` takes `TcLineageGraph["columns"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLineageGraph } from "@adamstavely/trenchcoat/lineage-graph";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading in the bar, and the graph's name |
| `selected` | `string \| null` | The id of the node whose record is open. Controlled when defined (null = none); otherwise the component keeps it, starting at `defaultSelected` |
| `defaultSelected` | `string \| null` | The open record when uncontrolled |
| `onSelectedChange` | `(id: string \| null, node?: LineageNode) => void` | Called with the node whose record opened, or null when it closed |
| `view` | `LineageView` | "graph" or "chain" (the event chain). Controlled when defined; otherwise the component keeps it |
| `defaultView` | `LineageView` | The first view when uncontrolled |
| `onViewChange` | `(view: LineageView) => void` | Called when the Graph or Event chain tab is picked |

*Renamed or hidden on the wrapper: `heading`, `selected`, `view`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

In the graph, the steps are one tab stop.

| Key | What it does |
|---|---|
| Tab | Moves to the view tabs, then into the graph or chain – to the step the keyboard was last on, else the open one, else the first – then into the record |
| ← / → (tabs) | Switches between Graph and Event chain |
| ↓ / ↑ | Moves to the next or previous step in the column (in the chain: the next or previous event) |
| → / ← | Graph: moves along a link to the step it feeds or came from – the linked one nearest in height; without a link, the nearest step in the next or previous column |
| Home / End | The first or last step in the column (in the chain: the first or last event) |
| Ctrl + Home / End | Graph: the first step of the first column, or the last of the last |
| Enter / Space | Opens the step's record, or closes it if it's open |
| Escape | Closes the record; from inside the record, focus returns to its step |

### Screen readers

The component is a region named by its heading. The view is a tablist, “View”, with “Graph” and “Event chain”
controlling one tabpanel. The graph is a grid named by the heading: its first row holds a column header per column
(“Source chunks”), each step is a gridcell whose name reads its label, column and detail, then what it came from and
feeds – “Missed the SLA, Claims, Sourced · 0.86. From SLA report, Incident log (weak link: 4 of 11 rows fit). Feeds
Risk memo.” – and the open step is `aria-selected`. The event chain is a listbox of the same steps, each option adding
“at 2.1s”. The record is a section named by its step's label, with lists headed “Came from” and “Feeds”; a weak link
in them reads “, weak link: 4 of 11 rows fit”. The close button is “Close record”.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 40.1 KB | 10.5 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/layered-graph` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.2 KB | – |
| **Added to a page that already has Lit** | **49.8 KB** | **13.6 KB** |
| With Lit – the first component on a page | 72.4 KB | 21.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 83 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of columns replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.9 ms | columns: first render, 83 nodes; update 0.1 ms |
| 1,000 items | 1.0 ms | columns: first render, 83 nodes; update 0.1 ms |

What it renders doesn't grow with columns (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Label steps by what they are, short enough for a node: “search: renewal clauses”, “Master agreement §7.2”.
- Put the locator or the outcome in `detail` – the file and page, “6 results”, “Sourced · 0.86”.
- Give a weak link a `note` that says how much got through (“4 of 11 rows fit the context”); without one it reads `weakLabel`, “Truncated context”.
- Name columns in your product's words through `columns` – the defaults are Run, Turns, Queries & tools, Source chunks, Claims and Artifacts.

## Do and don't

### Do

- Give every step an `at` so the event chain reads in order and shows when it happened.
- Colour claims by where they came from with a node's own `tone` (green sourced, violet model knowledge, amber inferred).
- Put the passage a chunk returned, or the claim as written, in `text` – the record is where people check it.

### Don't

- Don't mark a link weak unless something was actually cut – dashes are a warning, not decoration.
- Don't use it for a live, changing run; it reads best once the run's lineage is recorded.
- Don't cram a whole paragraph into `label`; the node shows one line.

## Related

- [Agent Graph](agent-graph.md) – Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you
- [Provenance Summary](provenance-summary.md) – What a document is made of – how much came from sources, from AI and from its authors, section by section
- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
