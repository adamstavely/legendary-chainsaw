<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Graph

**Agents**

Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you

- **Element:** `<tc-agent-graph>`
- **Size:** 22.6 KB gzip · 89.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-graph";` |
| React / Next.js | `import { AgentGraph } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-graph";` · tags starting with tc- are custom elements |
| Angular | `import { AgentGraph } from "@adamstavely/trenchcoat/angular/agent-graph";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-graph";` |

## Example

The live example is in the gallery at `#/agent-graph`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A live map of a multi-agent run: the lead agent in the middle, the agents it hands work to around it, and the
tools, data sources and you on an outer ring. Every call sends a pulse along its link and the answer travels back,
busy links stand out, and an agent that needs you turns amber and shows up as a chip in the bar. It answers “who
is talking to what right now, and does anyone need me?” at a glance; a click on any node opens a card with what it
is doing, its latest calls and its cost.

### When to use

- Watching several agents and their tools work at the same time, where the shape of the work matters more than
  the order of steps.
- Spotting the agent that is waiting for a person, or the tool that keeps failing, in a busy run.
- A run overview next to a detailed log – the graph for orientation, the log for the details.

### When not to use

- One agent working through its steps in order – use [Agent Plan](agent-plan.md) or [Trace Waterfall](trace-waterfall.md).
- Who delegated to whom, as a hierarchy that stays put – use [Agent Tree](agent-tree.md).
- When each agent was doing what, over time – use [Agent Lanes](agent-lanes.md).
- The arguments and result of a single call – use [Tool Call Card](tool-call-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Totals** `.ui-agg__sum` – agents, tools, calls per minute and the total cost
3. **Pause** `.ui-agg__still` – stops and restarts all motion
4. **Lead agent** `.ui-agg__node[data-lead] .ui-agg__disc` – the agent in the middle; the other agents sit on the inner ring
5. **Tool** `.ui-agg__node[data-kind="tool"] .ui-agg__disc` – a tool or data source on the outer ring, turned towards the agents that use it
6. **Link** `.ui-agg__edge` – a pair that has called each other, or a fixed edge; pulses run along it
7. **Legend** `.ui-agg__legend` – what the pulses and lines mean

## Looks

Standard sits on the gray tray with the graph on a white panel: calls are dots with a tail – solid on the way out,
hollow on the way back – and busy links grow thicker. Clean drops the tray, keeps every link one thin gray line,
and draws calls as short coloured streaks with a soft glow; a stroke turns around each node and a shine passes over
nodes that are waiting or failed. Both use the same layout, cards and keys, and stop every loop with reduced motion
or Pause.

## Usage

### HTML

```html
<tc-agent-graph id="graph"></tc-agent-graph>

<script type="module">
  import "@adamstavely/trenchcoat/agent-graph";
  import "@adamstavely/trenchcoat/tokens.css";

  const graph = document.querySelector("#graph");
  graph.heading = "Pricing review";
  graph.nodes = [
    { id: "lead", name: "Lead", kind: "agent", lead: true, status: "working" },
    {
      id: "research",
      name: "Researcher",
      kind: "agent",
      status: "working",
      doing: "Comparing competitor plans",
    },
    { id: "search", name: "Web search", short: "Search", kind: "tool", detail: "Search API" },
  ];
  graph.edges = [["lead", "research"]];
  graph.calls = [
    {
      id: "c1",
      from: "research",
      to: "search",
      label: "search: pricing linear.app",
      status: "pending",
      at: Date.now(),
    },
  ];
  graph.addEventListener("tc-select", (e) => console.log(e.detail.node?.name));
</script>
```

### React / Next.js

```tsx
import { AgentGraph, type GraphCall, type GraphNode } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const nodes: GraphNode[] = [
  { id: "lead", name: "Lead", kind: "agent", lead: true, status: "working" },
  {
    id: "research",
    name: "Researcher",
    kind: "agent",
    status: "working",
    doing: "Comparing competitor plans",
  },
  { id: "search", name: "Web search", short: "Search", kind: "tool", detail: "Search API" },
];

export function RunGraph({ calls }: { calls: GraphCall[] }) {
  return (
    <AgentGraph
      title="Pricing review"
      nodes={nodes}
      calls={calls}
      edges={[["lead", "research"]]}
      onSelect={(n) => console.log(n?.name)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-graph";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";

defineProps<{ nodes: TcAgentGraph["nodes"]; calls: TcAgentGraph["calls"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-graph :nodes="nodes" :calls="calls" @tc-selected-change="onSelectedChange"></tc-agent-graph>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentGraph } from "@adamstavely/trenchcoat/angular/agent-graph";
import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";

@Component({
  selector: "app-agent-graph-example",
  imports: [AgentGraph],
  template: `<tc-agent-graph [nodes]="nodes()" [calls]="calls()" (tc-selected-change)="onSelectedChange($event)"></tc-agent-graph>`,
})
export class AgentGraphExample {
  readonly nodes = input.required<TcAgentGraph["nodes"]>();
  readonly calls = input.required<TcAgentGraph["calls"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-graph";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";

  let { nodes, calls }: { nodes: TcAgentGraph["nodes"]; calls: TcAgentGraph["calls"] } = $props();
  let el: TcAgentGraph;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-agent-graph bind:this={el} {nodes} {calls}></tc-agent-graph>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `nodes` | – | `GraphNode[]` | `[]` | The agents, tools and people in the graph – the lead agent in the middle, the other agents around it, the rest outside |
| `calls` | – | `GraphCall[]` | `[]` | Recent calls, newest last – every new id sends a pulse. Calls also draw the links they need |
| `edges` | – | `[string, string][]` | `[]` | Links that are always there, even before their first call |
| `now` | `now` | `number \| undefined` | `undefined` | The clock for calls per minute and link heat, in epoch ms – defaults to an internal clock that ticks every second while the graph is on screen |
| `heatWindow` | `heat-window` | `number` | `20000` | How far back calls make a link thicker (ms) |
| `selected` | `selected` | `string \| null` | `null` | The node whose card is open (null = none). Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `height` | `height` | `number \| undefined` | `undefined` | Fixed height of the graph in px – defaults to one that fits the width |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – defaults to dollars, e.g. "$0.42" |
| `paused` | `paused` | `boolean` | `false` | Stops the moving parts, as the bar's Pause button does. Changed by the user unless a tc-paused-change listener calls preventDefault() |
| `heading` | `heading` | `string` | `"Agent graph"` | The heading in the bar, and the start of the graph's name |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A card opened or closed ({ selected, removed }: GraphSelectedChange; removed when the open node went away); cancelable |
| `tc-select` | – | No | A node or a chip was clicked, or the card was closed ({ node }: GraphSelect, null when closed) |
| `tc-paused-change` | – | Yes | The Pause button was pressed ({ paused }: GraphPausedChange); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-graph-link` | `light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.08))` | standard, clean |
| `--tc-agent-graph-pulse` | `light-dark(rgba(0, 96, 226, 0.8), #70b8ff)` | standard, clean |
| `--tc-agent-graph-glow` | `light-dark(rgba(130, 188, 255, 0.16), rgba(79, 143, 219, 0.14))` | standard, clean |
| `--tc-agent-graph-breath` | `light-dark(rgba(0, 96, 226, 0.12), rgba(112, 184, 255, 0.16))` | standard, clean |
| `--tc-agent-graph-breath-out` | `light-dark(rgba(0, 96, 226, 0.02), rgba(112, 184, 255, 0.03))` | standard, clean |
| `--tc-agent-graph-user-bg` | `var(--tc-surface-inverse)` | standard, clean |
| `--tc-agent-graph-user-fg` | `var(--tc-text-on-inverse)` | standard, clean |
| `--tc-agent-graph-glyph-size` | `7.5px` | standard |
| `--tc-agent-graph-tray-bg` | `var(--tc-surface-tray)` | standard |
| `--tc-agent-graph-panel-bg` | `var(--tc-surface-on-tray)` | standard |
| `--tc-agent-graph-card-bg` | `var(--tc-surface-overlay)` | standard, clean |
| `--tc-agent-graph-breathe` | `2600ms` | standard, clean |
| `--tc-agent-graph-breathe-fast` | `1500ms` | standard |
| `--tc-agent-graph-turn-time` | `1200ms` | standard, clean |
| `--tc-agent-graph-shine-time` | `2400ms` | standard, clean |
| `--tc-agent-graph-halo-time` | `1200ms` | standard, clean |
| `--tc-agent-graph-shine` | `light-dark(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.16))` | clean |
| `--tc-agent-graph-b1` | `6px` | not set – this fallback applies |
| `--tc-agent-graph-b2` | `13px` | not set – this fallback applies |

#### Design tokens it reads (89)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-agent-graph-r`, `--tc-agent-graph-state`, `--tc-agent-graph-state-bg`, `--tc-agent-graph-turn`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-radius`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `nodes` | `el.nodes = …;` | `<… nodes={…} />` | `<tc-agent-graph :nodes="…">` | `<tc-agent-graph [nodes]="…">` | `<tc-agent-graph {nodes}>` |
| `calls` | `el.calls = …;` | `<… calls={…} />` | `<tc-agent-graph :calls="…">` | `<tc-agent-graph [calls]="…">` | `<tc-agent-graph {calls}>` |
| `edges` | `el.edges = …;` | `<… edges={…} />` | `<tc-agent-graph :edges="…">` | `<tc-agent-graph [edges]="…">` | `<tc-agent-graph {edges}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-agent-graph :formatCost="…">` | `<tc-agent-graph [formatCost]="…">` | `<tc-agent-graph {formatCost}>` |

*Also attributes: `now`, `heat-window`, `selected`, `height`, `paused`, `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-select` | No | `el.addEventListener("tc-select", (e) => …)` | `onSelect={…}` | `@tc-select="…"` | `(tc-select)="…($event)"` | `el.addEventListener("tc-select", …)` |
| `tc-paused-change` | Yes | `el.addEventListener("tc-paused-change", (e) => …)` | `onPausedChange={…}` | `@tc-paused-change="…"` | `(tc-paused-change)="…($event)"` | `el.addEventListener("tc-paused-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` and `paused` itself unless a listener calls `preventDefault()` on `tc-selected-change` or `tc-paused-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-graph id="agent-graph"></tc-agent-graph>

<script type="module">
  import "@adamstavely/trenchcoat/agent-graph";

  const el = document.querySelector("#agent-graph");
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
import "@adamstavely/trenchcoat/agent-graph";
import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";

const props = defineProps<{ initial: TcAgentGraph["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcAgentGraph["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-agent-graph :selected="selected" @tc-selected-change="onSelectedChange"></tc-agent-graph>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentGraph } from "@adamstavely/trenchcoat/angular/agent-graph";
import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";

@Component({
  selector: "app-controlled-agent-graph",
  imports: [AgentGraph],
  template: `<tc-agent-graph [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-agent-graph>`,
})
export class ControlledAgentGraph {
  readonly initial = input.required<TcAgentGraph["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcAgentGraph["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-graph";
  import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";

  let { initial }: { initial: TcAgentGraph["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcAgentGraph;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcAgentGraph["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-agent-graph bind:this={el} {selected}></tc-agent-graph>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-graph")` returns a `TcAgentGraph` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";`
- **React / Next.js:** Props: `import type { AgentGraphProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentGraph>`. The element class, for refs: `import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentGraph["nodes"]` with `import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";`
- **Angular:** The directive types the template: `[nodes]` takes `TcAgentGraph["nodes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentGraph } from "@adamstavely/trenchcoat/agent-graph";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `nodes` | `GraphNode[]` | The agents, tools and people in the graph; icons can be React nodes |
| `onSelect` | `(node: GraphNode \| null) => void` | A click on a node – it also opens its card; null when the card closes |
| `selected` | `string \| null` | The node whose card is open. Controlled when defined (null = none); otherwise the component keeps it, starting from `defaultSelected`. Changes are reported to `onSelectedChange` (and `onSelect`, with the node) |
| `defaultSelected` | `string \| null` | The node whose card is open at first, when `selected` isn't set |
| `onSelectedChange` | `(id: string \| null) => void` | Called with the node id when a card opens, and null when it closes |
| `paused` | `boolean` | Stops the moving parts – pulses, ripples, floating and the breathing rings – as the bar's Pause button does. Controlled when defined; otherwise the component keeps it, starting from `defaultPaused` |
| `defaultPaused` | `boolean` | Whether the motion starts paused, when `paused` isn't set |
| `onPausedChange` | `(paused: boolean) => void` | Called when the Pause button is pressed, with the new paused state |
| `title` | `string` | The heading in the bar, and the start of the graph's accessible name – "Agent graph" by default |

*Renamed or hidden on the wrapper: `nodes`, `selected`, `paused`, `heading`, `onSelect`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the chips in the bar, Pause and the nodes; focusing a node lights up its links and neighbours |
| Enter / Space | On a node or a chip: opens its card and moves focus to the card's Close button; on an open node: closes it |
| Escape | In the card: closes it and returns focus to the node or chip that opened it |

A pointer press outside the card also closes it.

### Screen readers

Each node is a button named with what it is and what it's doing – “Researcher, agent, working: Comparing
competitor plans. 3 calls in the last minute” – with `aria-haspopup="dialog"` and `aria-expanded`. The card is a
`dialog` labelled with the node's name, and its “Latest calls” list says “To” or “From” before each call. The graph
area is a group named “Pricing review: 4 agents and 5 tools”; the drawing itself is hidden, and a visually hidden
list repeats every node with its calls in the last minute and its cost. A status region announces who needs
attention – “Writer needs you. Browser failed” – as it changes. Pause is a toggle button, “Pause motion”, with
`aria-pressed`.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| conic-gradient() | 69 (Edge 79) | 83 | 12.1 | 12.1 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself, internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| @property | 85 | 128 | 16.4 | 16.4 | itself | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 80.8 KB | 19.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **89.8 KB** | **22.6 KB** |
| With Lit – the first component on a page | 112.4 KB | 30.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.5 ms** | the gallery demo's data, 161 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of nodes replaced |
| First on the page | 29 ms | default properties; includes adding its CSS to the document |
| 100 items | 32 ms | nodes: first render, 1,115 nodes; update 2.5 ms |
| 1,000 items | 508 ms | nodes: first render, 10,655 nodes; update 8.2 ms |

1,000 items of nodes: 508 ms. It renders every item, so a first render passes 50 ms (a long task) at about 100 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 20 React commits (clean), 19 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setInterval, cleared`, `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange`, `document pointerdown`, `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`, `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents by their role (“Researcher”, “Writer”) and tools by what they are (“Web search”, “Warehouse”); give
  long names a `short` for narrow containers.
- Use `detail` for the model or the kind of tool – one short line.
- Write `doing` as a present-tense phrase: “Comparing competitor plans”, “Waiting for you to approve the framing”.
- Label calls as verb and object: “search: pricing linear.app”, “run: forecast.py”.
- Set `heading` (`title` in React) to the name of the run, not “Agent graph”.

## Do and don't

### Do

- Keep `calls` to a recent window (the demo keeps the last 60) – old calls only feed the totals.
- Set `status: "waiting"` on the agent that needs a person, and send its call `to` the user node, so the link turns
  amber too.
- Pass `now` when you already run a clock, so the calls per minute match the rest of your page.
- Use `formatCost` for any currency other than dollars.

### Don't

- Don't put more than about a dozen tools on one graph – the outer ring gets crowded; split the run instead.
- Don't use the graph as the only place a request for approval appears – pair it with `approval-card` or `handoff`.
- Don't send a call between a node and itself – it draws nothing.

## Related

- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
