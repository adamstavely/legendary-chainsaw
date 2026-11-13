<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Workflow Canvas

**AI configuration** · New

An agent workflow as a node graph – step cards with their kind, status in a mark and a word, and curved labelled connectors; pan and zoom, drag steps and connect them from their ports or the keyboard (M moves, C connects, A adds), a flowing connector into the running step, and the same graph as a list

- **Element:** `<tc-workflow-canvas>`
- **Size:** 14.4 KB gzip · 48.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/workflow-canvas";` |
| React / Next.js | `import { WorkflowCanvas } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/workflow-canvas";` · tags starting with tc- are custom elements |
| Angular | `import { WorkflowCanvas } from "@adamstavely/trenchcoat/angular/workflow-canvas";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/workflow-canvas";` |

## Example

The live example is in the gallery at `#/workflow-canvas`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An agent workflow drawn as a node graph. Each step is a compact card: its kind's icon, the kind (Trigger, AI, Tool,
Condition, Approval, Output), the title, a one-line summary and, during a run, its status in a mark and a word.
Curved connectors with arrowheads join the steps, labelled where a branch needs it ("over 10k"). While a run is in
flight, the steps colour by status and the connector into the running step flows.

People build the workflow on the canvas. They drag steps to arrange them and drag from a step's output port onto
another step to connect them. The keyboard does everything the pointer does: move a step, connect it from a menu,
add a step after it, or remove it. The same graph is also a list of steps and where each one leads, for screen
readers and narrow screens.

### When to use

- Building or editing an agent workflow with branches – conditions, approvals, several outputs.
- Watching a workflow run, step by step, with failures standing out.
- Any small directed graph people arrange by hand: a pipeline, a routing plan, an escalation path.

### When not to use

- A playbook set out phase by phase, without a free layout – use [Playbook Canvas](playbook-canvas.md).
- Agents calling tools as a live network, laid out for you – use [Agent Graph](agent-graph.md).
- Adding a step from a catalogue – use [Step Picker](step-picker.md), opened from this canvas's `tc-add-request`.
- Editing one step's inputs – use [Step Inspector](step-inspector.md) for the selected step.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Toolbar** `.ui-wfc__tools` – zoom out, zoom in, Fit, Add step, Connect, Move, Delete and List, and the zoom level
2. **Canvas** `.ui-wfc__viewport` – the dotted surface you pan and zoom
3. **Step** `.ui-wfc__node` – a step card: icon, kind, title, summary and status
4. **Status** `.ui-wfc__status` – the run status as a mark and a word
5. **Port** `.ui-wfc__port` – the dot on a step's right edge to drag a connector from
6. **Connector** `.ui-wfc__edge` – a curved line with an arrowhead, and its label `.ui-wfc__edge-label`
7. **Connect menu** `.ui-wfc__menu` – "Connect … to", a checkable list of the other steps
8. **List** `.ui-wfc__list` – the same steps as a numbered list, each with where it leads

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The canvas, steps and connectors are the same in both. Set the canvas height with
`--tc-wfc-h`, and each kind's icon colour with `--tc-wfc-trigger`, `--tc-wfc-llm`, `--tc-wfc-tool`,
`--tc-wfc-condition`, `--tc-wfc-approval` and `--tc-wfc-output`.

## Usage

### HTML

```html
<tc-workflow-canvas id="flow" heading="Invoice approval"></tc-workflow-canvas>

<script type="module">
  import "@adamstavely/trenchcoat/workflow-canvas";
  import "@adamstavely/trenchcoat/tokens.css";

  const flow = document.querySelector("#flow");
  flow.nodes = [
    { id: "received", kind: "trigger", title: "Invoice received", x: 0, y: 80, status: "done" },
    { id: "extract", kind: "llm", title: "Extract fields", summary: "Vendor, amount, PO number", x: 250, y: 80, status: "running" },
    { id: "post", kind: "output", title: "Post to ledger", x: 500, y: 80 },
  ];
  flow.edges = [
    { from: "received", to: "extract" },
    { from: "extract", to: "post" },
  ];
  flow.addEventListener("tc-add-request", (e) => console.log("add a step after", e.detail.after));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { WorkflowCanvas, type WorkflowEdge, type WorkflowNode } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function InvoiceFlow({ onAdd }: { onAdd: (after: string | null) => void }) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: "received", kind: "trigger", title: "Invoice received", x: 0, y: 80 },
    { id: "post", kind: "output", title: "Post to ledger", x: 250, y: 80 },
  ]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([{ from: "received", to: "post" }]);
  return <WorkflowCanvas title="Invoice approval" nodes={nodes} edges={edges} onNodesChange={setNodes} onEdgesChange={setEdges} onAddRequest={onAdd} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/workflow-canvas";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";

defineProps<{ nodes: TcWorkflowCanvas["nodes"]; edges: TcWorkflowCanvas["edges"] }>();
const onNodesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-workflow-canvas :nodes="nodes" :edges="edges" @tc-nodes-change="onNodesChange"></tc-workflow-canvas>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { WorkflowCanvas } from "@adamstavely/trenchcoat/angular/workflow-canvas";
import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";

@Component({
  selector: "app-workflow-canvas-example",
  imports: [WorkflowCanvas],
  template: `<tc-workflow-canvas [nodes]="nodes()" [edges]="edges()" (tc-nodes-change)="onNodesChange($event)"></tc-workflow-canvas>`,
})
export class WorkflowCanvasExample {
  readonly nodes = input.required<TcWorkflowCanvas["nodes"]>();
  readonly edges = input.required<TcWorkflowCanvas["edges"]>();
  onNodesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/workflow-canvas";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";

  let { nodes, edges }: { nodes: TcWorkflowCanvas["nodes"]; edges: TcWorkflowCanvas["edges"] } = $props();
  let el: TcWorkflowCanvas;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-nodes-change", on);
    return () => el.removeEventListener("tc-nodes-change", on);
  });
</script>

<tc-workflow-canvas bind:this={el} {nodes} {edges}></tc-workflow-canvas>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Workflow"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `nodes` | – | `WorkflowNode[]` | `[]` | The steps, each with its position on the canvas |
| `edges` | – | `WorkflowEdge[]` | `[]` | The connectors between steps |
| `selected` | – | `string \| null` | `null` | The selected step. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `view` | `view` | `WorkflowView` | `"canvas"` | "canvas" (the default) or "list" – the same steps as a list. Changed by the user unless prevented |
| `readonly` | `readonly` | `boolean` | `false` | Watching only: no moving, connecting, adding or removing |
| `kinds` | – | `Record<string, Partial<WorkflowKindInfo>>` | `{}` | Labels and icons for kinds, merged over the defaults (trigger, llm, tool, condition, approval, output) |
| `statusLabels` | – | `Partial<Record<WorkflowStatus, string>>` | `{}` | Words for each run status, merged over `defaultWorkflowStatusLabels` |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-nodes-change` | – | Yes | A step was moved or removed ({ nodes, reason, id }: WorkflowNodesChange); cancelable – prevented, `nodes` stays as it was |
| `tc-edges-change` | – | Yes | Steps were connected or disconnected, or a removed step took its connectors ({ edges, reason, edge }: WorkflowEdgesChange); cancelable – prevented, `edges` stays as it was |
| `tc-selected-change` | – | Yes | A step was selected or the selection cleared ({ selected, node }: WorkflowSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-add-request` | – | No | Add step was asked for, after the given step or at the start ({ after }: WorkflowAddRequest) – the page opens a step picker |
| `tc-view-change` | – | Yes | The canvas or the list was chosen ({ view }: WorkflowViewChange); cancelable – prevented, `view` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `fit()` | `void` | Frames every step, never zooming past 100% or below FIT_MIN so step cards stay readable; a workflow too big for that starts at its first step, and the rest is a pan away |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-wfc-h` | `360px` | both |
| `--tc-wfc-trigger` | `var(--tc-tone-amber-solid)` | both |
| `--tc-wfc-llm` | `var(--tc-tone-violet-solid)` | both |
| `--tc-wfc-tool` | `var(--tc-chart-1)` | both |
| `--tc-wfc-condition` | `var(--tc-tone-teal-solid)` | both |
| `--tc-wfc-approval` | `var(--tc-tone-pink-solid)` | both |
| `--tc-wfc-output` | `var(--tc-status-success-solid)` | both |
| `--tc-wfc-dot` | `10px` | both |
| `--tc-wfc-bg` | `var(--tc-surface-raised)` | standard, clean |
| `--tc-wfc-kind` | `var(--tc-icon-muted)` | not set – this fallback applies |

#### Design tokens it reads (99)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-solid`, `--tc-tone-pink-solid`, `--tc-tone-teal-solid`, `--tc-tone-violet-solid`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `WORKFLOW_NODE_W: number` | A step card's size on the canvas, px at 100% zoom – connectors leave and arrive at its vertical middle |
| `workflowKind(kind: string, kinds: Record<string, Partial<WorkflowKindInfo>>): WorkflowKindInfo` | A kind's label and icon: the page's own first, then the defaults, then the kind itself and a box |
| `workflowKindIcon(kind: string, kinds?: Record<string, Partial<WorkflowKindInfo>>): void` | The kind's icon as a 24×24 stroked SVG |
| `workflowEdgePath(from: { x: number; y: number }, to: { x: number; y: number }): void` | The connector from one card's right edge to the next card's left edge, as an SVG path, and its middle |

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
| `nodes` | `el.nodes = …;` | `<… nodes={…} />` | `<tc-workflow-canvas :nodes="…">` | `<tc-workflow-canvas [nodes]="…">` | `<tc-workflow-canvas {nodes}>` |
| `edges` | `el.edges = …;` | `<… edges={…} />` | `<tc-workflow-canvas :edges="…">` | `<tc-workflow-canvas [edges]="…">` | `<tc-workflow-canvas {edges}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-workflow-canvas :selected="…">` | `<tc-workflow-canvas [selected]="…">` | `<tc-workflow-canvas {selected}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-workflow-canvas :kinds="…">` | `<tc-workflow-canvas [kinds]="…">` | `<tc-workflow-canvas {kinds}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-workflow-canvas :statusLabels="…">` | `<tc-workflow-canvas [statusLabels]="…">` | `<tc-workflow-canvas {statusLabels}>` |

*Also attributes: `heading`, `description`, `view`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-nodes-change` | Yes | `el.addEventListener("tc-nodes-change", (e) => …)` | `ref.current.addEventListener("tc-nodes-change", …)` | `@tc-nodes-change="…"` | `(tc-nodes-change)="…($event)"` | `el.addEventListener("tc-nodes-change", …)` |
| `tc-edges-change` | Yes | `el.addEventListener("tc-edges-change", (e) => …)` | `ref.current.addEventListener("tc-edges-change", …)` | `@tc-edges-change="…"` | `(tc-edges-change)="…($event)"` | `el.addEventListener("tc-edges-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-add-request` | No | `el.addEventListener("tc-add-request", (e) => …)` | `onAddRequest={…}` | `@tc-add-request="…"` | `(tc-add-request)="…($event)"` | `el.addEventListener("tc-add-request", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `nodes`, `edges`, `selected` and `view` itself unless a listener calls `preventDefault()` on `tc-nodes-change`, `tc-edges-change`, `tc-selected-change` or `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-workflow-canvas id="workflow-canvas"></tc-workflow-canvas>

<script type="module">
  import "@adamstavely/trenchcoat/workflow-canvas";

  const el = document.querySelector("#workflow-canvas");
  el.addEventListener("tc-nodes-change", (e) => {
    e.preventDefault(); // the element keeps its nodes…
    if (allowed(e.detail.nodes)) el.nodes = e.detail.nodes; // …until the app sets it
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
import "@adamstavely/trenchcoat/workflow-canvas";
import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";

const props = defineProps<{ initial: TcWorkflowCanvas["nodes"] }>();
const nodes = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onNodesChange = (e: CustomEvent<{ nodes: TcWorkflowCanvas["nodes"] }>) => {
  e.preventDefault();
  nodes.value = e.detail.nodes;
};
</script>

<template>
  <tc-workflow-canvas :nodes="nodes" @tc-nodes-change="onNodesChange"></tc-workflow-canvas>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { WorkflowCanvas } from "@adamstavely/trenchcoat/angular/workflow-canvas";
import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";

@Component({
  selector: "app-controlled-workflow-canvas",
  imports: [WorkflowCanvas],
  template: `<tc-workflow-canvas [nodes]="nodes()" (tc-nodes-change)="onNodesChange($event)"></tc-workflow-canvas>`,
})
export class ControlledWorkflowCanvas {
  readonly initial = input.required<TcWorkflowCanvas["nodes"]>();
  readonly nodes = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onNodesChange(e: CustomEvent<{ nodes: TcWorkflowCanvas["nodes"] }>) {
    e.preventDefault();
    this.nodes.set(e.detail.nodes);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/workflow-canvas";
  import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";

  let { initial }: { initial: TcWorkflowCanvas["nodes"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let nodes = $derived(initial);
  let el: TcWorkflowCanvas;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      nodes = (e as CustomEvent<{ nodes: TcWorkflowCanvas["nodes"] }>).detail.nodes;
    };
    el.addEventListener("tc-nodes-change", on);
    return () => el.removeEventListener("tc-nodes-change", on);
  });
</script>

<tc-workflow-canvas bind:this={el} {nodes}></tc-workflow-canvas>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-workflow-canvas")` returns a `TcWorkflowCanvas` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";`
- **React / Next.js:** Props: `import type { WorkflowCanvasProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof WorkflowCanvas>`. The element class, for refs: `import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWorkflowCanvas["nodes"]` with `import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";`
- **Angular:** The directive types the template: `[nodes]` takes `TcWorkflowCanvas["nodes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWorkflowCanvas } from "@adamstavely/trenchcoat/workflow-canvas";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `nodes` | `WorkflowNode[]` | The steps – controlled when given |
| `defaultNodes` | `WorkflowNode[]` | The steps on mount when `nodes` isn't controlled |
| `onNodesChange` | `(nodes: WorkflowNode[], detail: WorkflowNodesChange) => void` | A step was moved or removed |
| `edges` | `WorkflowEdge[]` | The connectors – controlled when given |
| `defaultEdges` | `WorkflowEdge[]` | The connectors on mount when `edges` isn't controlled |
| `onEdgesChange` | `(edges: WorkflowEdge[], detail: WorkflowEdgesChange) => void` | Steps were connected or disconnected |
| `selected` | `string \| null` | The selected step – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The step selected on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, node: WorkflowNode \| null) => void` | A step was selected, or the selection cleared |
| `view` | `WorkflowView` | Canvas or list – controlled when given |
| `defaultView` | `WorkflowView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: WorkflowView) => void` | The canvas or the list was chosen |
| `onAddRequest` | `(after: string \| null) => void` | Add step was asked for, after this step (null: at the start) – open a step picker |

*Renamed or hidden on the wrapper: `heading`, `nodes`, `edges`, `selected`, `view`, `children`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

The toolbar, the canvas and the steps are a tab stop each.

| Key | What it does |
|---|---|
| ← / → | In the toolbar, move between its buttons |
| Arrow keys | On the canvas, pan; on a step, move to the nearest step in that direction |
| + / − / 0 | On the canvas, zoom in, zoom out, or fit every step – never below 75%, so a large workflow opens at its first step and the rest is a pan away |
| Enter / Space | Selects the step |
| M | Starts moving the step: arrows move it 8 px (Shift: 32 px), Enter or M keeps it, Escape puts it back |
| C | Opens "Connect … to": ↑ / ↓ move, Enter connects or disconnects, Escape closes |
| A | Asks the page to add a step after this one |
| Delete / Backspace | Removes the step and its connectors |
| Escape | Clears the selection |
| Home / End | Moves to the first or last step |

### Screen readers

The canvas is a group named by the heading and described by its keys. Each step is a toggle button, pressed while
it's selected, that reads its kind, title, summary, status and where it leads ("Leads to Manager approval (over
10k), Post to ledger (10k or less)"), and is described by the step keys. The connectors, ports and labels are hidden;
each step's description carries them. The toolbar is a toolbar; Connect opens a menu of checkable items, one per
step. Selecting, moving, connecting, removing and zooming are confirmed in a polite status message. The List view
is a numbered list of the same steps.

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
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 41.4 KB | 12.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **48.9 KB** | **14.4 KB** |
| With Lit – the first component on a page | 70.7 KB | 21.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 184 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of nodes replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.4 ms | nodes: first render, 1,421 nodes; update 0.9 ms |
| 1,000 items | 89 ms | nodes: first render, 13,379 nodes; update 20 ms |

1,000 items of nodes: 89 ms. It renders every item, so a first render passes 50 ms (a long task) at about 560 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title steps with a verb and an object: "Extract fields", "Match purchase order", "Post to ledger".
- Use `summary` for the one thing worth knowing at a glance – the mailbox, the rule, the system it writes to.
- Label a connector only where it's a branch: "over 10k", "approved", "rejected".
- Place steps left to right in the order they run; branches above and below.

## Do and don't

### Do

- Open a `step-picker` on `tc-add-request`, and place the new step to the right of `after`.
- Show `status` only while a run is in flight or just finished.
- Keep the page's copy of `nodes` and `edges` in step through `tc-nodes-change` and `tc-edges-change`.

### Don't

- Don't use colour alone for a step's status – the mark and the word come with it.
- Don't draw more than a couple of dozen steps; group them into sub-workflows instead.
- Don't let a connector loop back on the same step.

## Related

- [Step Picker](step-picker.md) – What to add next to a workflow – a search over step kinds and tools grouped as Triggers, AI, Tools, Logic, People and Output, led by suggested steps with why and recent ones, inline or as a popover by the button that opened it
- [Step Inspector](step-inspector.md) – One workflow step's settings – its title and each input with where it comes from, typed in or mapped from an earlier step's output as a chip ("Extract fields › amount"), what's missing in words, Test with sample, and the last run's input and output as JSON
- [Playbook Canvas](playbook-canvas.md) – An agent workflow, phase by phase – triggers, intake, context, analysis and review as steps you add and order, with review gates, versions and a dry run
- [Agent Graph](agent-graph.md) – Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you
