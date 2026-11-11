<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Relationship Graph

**People & profiles** · New

Connections between people and organisations around one of them – direct and second-hand rings in a fixed layout, relationships drawn by strength, re-centring on click, and a panel and keyboard list of every connection

- **Element:** `<tc-relationship-graph>`
- **Size:** 10.4 KB gzip · 34.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/relationship-graph";` |
| React / Next.js | `import { RelationshipGraph } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/relationship-graph";` · tags starting with tc- are custom elements |
| Angular | `import { RelationshipGraph } from "@adamstavely/trenchcoat/angular/relationship-graph";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/relationship-graph";` |

## Example

The live example is in the gallery at `#/relationship-graph`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Who's connected to whom, around one person or organisation. The one in focus (the ego) sits in the middle. Their
direct connections are on a ring around them; at depth 2, their connections' connections are on an outer ring. People
are circles and organisations are rounded squares. Each line is a relationship ("employs", "co-author", "funds"),
thicker the stronger it is. The layout comes from the data alone: each ring is sorted by kind, then name. The same
data always draws the same picture.

Click someone to put them in the middle; the nodes glide to their new places. The panel beside the drawing names
what's selected and lists its connections by relationship, with counts. A list of every node shown is the way in for
keyboards and screen readers.

### When to use

- A person's or an organisation's page, to show who they work with, for and alongside.
- Exploring a small network – a consortium, a supplier's links, a research group – one hop or two at a time.

### When not to use

- Money moving between parties – use [Money Flow](money-flow.md).
- Who appears with whom across events, ranked – use [Co-occurrence](co-occurrence.md).
- Agents and the work they hand each other – use [Agent Graph](agent-graph.md).
- Hundreds of nodes at once – a radial ego view is for tens; filter or page the data first.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Depth** `.ui-rgr__depth` – Direct or 2 steps, in the header
2. **Legend** `.ui-rgr__legend` – each kind with its colour and shape; pressing one hides or shows it
3. **Drawing** `.ui-rgr__svg` – the ego in the middle, rings of connections, lines by strength
4. **Panel** `.ui-rgr__panel` – what's selected and its connections, grouped by relationship
5. **Node list** `.ui-rgr__list` – every node shown, in ring order: the keyboard's way in

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
Each kind takes a tone: people violet, organisations teal, then amber, pink and rose in the order kinds appear. Lines
run from 1 to 4 px by `weight` (1–5). Below 620 px the panel goes under the drawing. A page can set
`--tc-rgr-side-w` for the panel's width.

## Usage

### HTML

```html
<tc-relationship-graph heading="Consortium"></tc-relationship-graph>
<script type="module">
  const g = document.querySelector("tc-relationship-graph");
  g.nodes = [
    { id: "ines", label: "Ines Okafor", kind: "person" },
    { id: "uni", label: "Northfield University", kind: "organisation" },
  ];
  g.edges = [{ from: "uni", to: "ines", label: "employs", weight: 5 }];
  g.addEventListener("tc-ego-change", (e) => console.log("centred on", e.detail.node.label));
</script>
```

### React / Next.js

```tsx
import { RelationshipGraph, type RelationEdge, type RelationNode } from "@adamstavely/trenchcoat/react";

export function Network({ nodes, edges }: { nodes: RelationNode[]; edges: RelationEdge[] }) {
  return <RelationshipGraph title="Consortium" nodes={nodes} edges={edges} defaultDepth={1} onEgoChange={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/relationship-graph";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";

defineProps<{ nodes: TcRelationshipGraph["nodes"]; edges: TcRelationshipGraph["edges"] }>();
const onEgoChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-relationship-graph :nodes="nodes" :edges="edges" @tc-ego-change="onEgoChange"></tc-relationship-graph>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RelationshipGraph } from "@adamstavely/trenchcoat/angular/relationship-graph";
import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";

@Component({
  selector: "app-relationship-graph-example",
  imports: [RelationshipGraph],
  template: `<tc-relationship-graph [nodes]="nodes()" [edges]="edges()" (tc-ego-change)="onEgoChange($event)"></tc-relationship-graph>`,
})
export class RelationshipGraphExample {
  readonly nodes = input.required<TcRelationshipGraph["nodes"]>();
  readonly edges = input.required<TcRelationshipGraph["edges"]>();
  onEgoChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/relationship-graph";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";

  let { nodes, edges }: { nodes: TcRelationshipGraph["nodes"]; edges: TcRelationshipGraph["edges"] } = $props();
  let el: TcRelationshipGraph;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-ego-change", on);
    return () => el.removeEventListener("tc-ego-change", on);
  });
</script>

<tc-relationship-graph bind:this={el} {nodes} {edges}></tc-relationship-graph>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Relationships"` | The heading, and the graph's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `nodes` | – | `RelationNode[]` | `[]` | People, organisations and anything else, each with a kind |
| `edges` | – | `RelationEdge[]` | `[]` | The relationships between them |
| `ego` | `ego` | `string \| null` | `null` | The node in the middle (the ego); by default the first person. Changed by the user unless tc-ego-change is prevented |
| `depth` | `depth` | `1 \| 2` | `1` | How far out to draw: 1 (direct connections) or 2 (theirs too). Changed by the user unless tc-depth-change is prevented |
| `kinds` | – | `string[]` | `[]` | The kinds shown; empty for all. Changed from the legend unless tc-kinds-change is prevented |
| `selected` | `selected` | `string \| null` | `null` | What's selected: a node id, "edge:&lt;edge id>", or null. Changed by the user unless tc-selected-change is prevented |
| `kindLabels` | – | `Record<string, string>` | `{}` | Names for the kinds in the legend: { organisation: "Organisation" } |
| `centre` | – | `RelationNode \| undefined` | – | The node in the middle: `ego`, or the first person, or the first node |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-ego-change` | – | Yes | A node was put in the middle ({ ego, node }: RelationEgoChange); cancelable – prevented, `ego` stays as it was |
| `tc-depth-change` | – | Yes | Depth 1 or 2 was chosen ({ depth }: RelationDepthChange); cancelable – prevented, `depth` stays as it was |
| `tc-kinds-change` | – | Yes | A kind was shown or hidden from the legend ({ kinds }: RelationKindsChange); cancelable – prevented, `kinds` stays as it was |
| `tc-selected-change` | – | Yes | A node or a relationship was selected, or nothing ({ selected, node, edge }: RelationSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rgr-side-w` | `260px` | clean |

#### Design tokens it reads (74)

`--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-pill-h`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-amber-solid`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-pink-solid`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-rose-solid`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-teal-solid`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tone-violet-solid`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `relationEdgeId(e: RelationEdge): void` | An edge's id: its own, or one made from its ends and words |

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
| `nodes` | `el.nodes = …;` | `<… nodes={…} />` | `<tc-relationship-graph :nodes="…">` | `<tc-relationship-graph [nodes]="…">` | `<tc-relationship-graph {nodes}>` |
| `edges` | `el.edges = …;` | `<… edges={…} />` | `<tc-relationship-graph :edges="…">` | `<tc-relationship-graph [edges]="…">` | `<tc-relationship-graph {edges}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-relationship-graph :kinds="…">` | `<tc-relationship-graph [kinds]="…">` | `<tc-relationship-graph {kinds}>` |
| `kindLabels` | `el.kindLabels = …;` | `<… kindLabels={…} />` | `<tc-relationship-graph :kindLabels="…">` | `<tc-relationship-graph [kindLabels]="…">` | `<tc-relationship-graph {kindLabels}>` |

*Also attributes: `heading`, `description`, `ego`, `depth`, `selected` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-ego-change` | Yes | `el.addEventListener("tc-ego-change", (e) => …)` | `ref.current.addEventListener("tc-ego-change", …)` | `@tc-ego-change="…"` | `(tc-ego-change)="…($event)"` | `el.addEventListener("tc-ego-change", …)` |
| `tc-depth-change` | Yes | `el.addEventListener("tc-depth-change", (e) => …)` | `ref.current.addEventListener("tc-depth-change", …)` | `@tc-depth-change="…"` | `(tc-depth-change)="…($event)"` | `el.addEventListener("tc-depth-change", …)` |
| `tc-kinds-change` | Yes | `el.addEventListener("tc-kinds-change", (e) => …)` | `ref.current.addEventListener("tc-kinds-change", …)` | `@tc-kinds-change="…"` | `(tc-kinds-change)="…($event)"` | `el.addEventListener("tc-kinds-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `ego`, `depth`, `kinds` and `selected` itself unless a listener calls `preventDefault()` on `tc-ego-change`, `tc-depth-change`, `tc-kinds-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-relationship-graph id="relationship-graph"></tc-relationship-graph>

<script type="module">
  import "@adamstavely/trenchcoat/relationship-graph";

  const el = document.querySelector("#relationship-graph");
  el.addEventListener("tc-ego-change", (e) => {
    e.preventDefault(); // the element keeps its ego…
    if (allowed(e.detail.ego)) el.ego = e.detail.ego; // …until the app sets it
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
import "@adamstavely/trenchcoat/relationship-graph";
import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";

const props = defineProps<{ initial: TcRelationshipGraph["ego"] }>();
const ego = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onEgoChange = (e: CustomEvent<{ ego: TcRelationshipGraph["ego"] }>) => {
  e.preventDefault();
  ego.value = e.detail.ego;
};
</script>

<template>
  <tc-relationship-graph :ego="ego" @tc-ego-change="onEgoChange"></tc-relationship-graph>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RelationshipGraph } from "@adamstavely/trenchcoat/angular/relationship-graph";
import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";

@Component({
  selector: "app-controlled-relationship-graph",
  imports: [RelationshipGraph],
  template: `<tc-relationship-graph [ego]="ego()" (tc-ego-change)="onEgoChange($event)"></tc-relationship-graph>`,
})
export class ControlledRelationshipGraph {
  readonly initial = input.required<TcRelationshipGraph["ego"]>();
  readonly ego = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onEgoChange(e: CustomEvent<{ ego: TcRelationshipGraph["ego"] }>) {
    e.preventDefault();
    this.ego.set(e.detail.ego);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/relationship-graph";
  import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";

  let { initial }: { initial: TcRelationshipGraph["ego"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let ego = $derived(initial);
  let el: TcRelationshipGraph;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      ego = (e as CustomEvent<{ ego: TcRelationshipGraph["ego"] }>).detail.ego;
    };
    el.addEventListener("tc-ego-change", on);
    return () => el.removeEventListener("tc-ego-change", on);
  });
</script>

<tc-relationship-graph bind:this={el} {ego}></tc-relationship-graph>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-relationship-graph")` returns a `TcRelationshipGraph` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";`
- **React / Next.js:** Props: `import type { RelationshipGraphProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RelationshipGraph>`. The element class, for refs: `import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRelationshipGraph["nodes"]` with `import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";`
- **Angular:** The directive types the template: `[nodes]` takes `TcRelationshipGraph["nodes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRelationshipGraph } from "@adamstavely/trenchcoat/relationship-graph";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the graph's name |
| `ego` | `string \| null` | The node in the middle – controlled when given |
| `defaultEgo` | `string \| null` | The node in the middle on mount when `ego` isn't controlled; by default the first person |
| `onEgoChange` | `(ego: string, node: RelationNode) => void` | A node was put in the middle |
| `depth` | `1 \| 2` | 1 (direct) or 2 (their connections too) – controlled when given |
| `defaultDepth` | `1 \| 2` | The depth on mount when `depth` isn't controlled |
| `onDepthChange` | `(depth: 1 \| 2) => void` | The depth changed |
| `kinds` | `string[]` | The kinds shown, empty for all – controlled when given |
| `defaultKinds` | `string[]` | The kinds shown on mount when `kinds` isn't controlled |
| `onKindsChange` | `(kinds: string[]) => void` | A kind was shown or hidden |
| `selected` | `string \| null` | What's selected: a node id, "edge:&lt;id>" or null – controlled when given |
| `defaultSelected` | `string \| null` | The selection on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, detail: RelationSelectedChange) => void` | A node or relationship was selected, or nothing |

*Renamed or hidden on the wrapper: `heading`, `ego`, `depth`, `kinds`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | Does |
| --- | --- |
| ↑ / ↓ in the node list | The previous / next node, in ring order; the drawing rings it |
| Home / End | The first (the ego) / last node |
| Enter | Puts the node in the middle |
| Space | Selects the node, or unselects |
| ← / → on the depth switch | Direct or 2 steps |

### Screen readers

- The drawing is hidden from assistive tech. The node list is a `listbox` with the same nodes, each saying its ring,
  kind and number of connections.
- The panel's connections are buttons that put that node in the middle.
- The legend's kinds are toggle buttons with their pressed state.
- Re-centring is announced in a polite status line: "Ines Okafor in the middle, 5 connections".

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 27.1 KB | 8.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.7 KB** | **10.4 KB** |
| With Lit – the first component on a page | 56.4 KB | 17.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 148 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of edges replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.9 ms | edges: first render, 419 nodes; update 0.6 ms |
| 1,000 items | 24 ms | edges: first render, 3,245 nodes; update 5.1 ms |

1,000 items of edges: 24 ms, 3,245 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give each relationship a short verb in the present tense ("employs", "funds", "co-author").
- Keep kinds few – person, organisation and one or two more – and name them in `kindLabels`.
- Use `weight` for strength people can explain (shared papers, years, money), not decoration.

## Do and don't

### Do

- Start the ego on the person or organisation the page is about.
- Offer depth 2 for exploring, but open at depth 1.

### Don't

- Draw relationships you can't explain in the panel.
- Rely on colour alone: shape and the kind's name go with it.

## Related

- [Money Flow](money-flow.md) – How money moved between entities – people, companies, shells and banks in columns, transfers as bands sized by amount with flag chips, an entity's or a transfer's flows lit with a readout in words, a list of every transfer and a table view
- [Co-Occurrence](co-occurrence.md) – Who keeps turning up alongside a subject – accounts, cards, devices or people ranked by shared events, each with a strength in words and bars, a score, the share of events, a count per source and when last seen, opening onto the shared events themselves
- [Agent Graph](agent-graph.md) – Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you
- [Profile Header](profile-header.md) – The top of a person's or an account's page – picture or initials, name, status and tags, other names as chips, a line of key facts, the page's actions and a row of section tabs

## Changelog

- **People & profiles** - **Org Chart** (`tc-org-chart`) – reporting lines that fold, search that opens the way, pan and zoom, an outline when narrow. - **Person Hovercard** (`tc-person-hovercard`) – the profile card behind any name, with status and local time. - **Team Roster** (`tc-team-roster`) – a directory with everyone's local time and the team's best hour to meet. - **Relationship Graph** (`tc-relationship-graph`) – people and organisations around one of them, re-centring on click, with a keyboard list of every connection.
