<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Memory Graph

**Agents** · New

What an agent remembers and the tools it can reach, around it – each memory a card with the file, chat or email it came from, each tool with what it may do where, joined by rounded connectors; a light runs out to the tool in use and in from what it recalls or learns, and you can switch any card off, forget a memory with Undo, or add a file or connect a tool from the agent

- **Element:** `<tc-memory-graph>`
- **Size:** 13.0 KB gzip · 45.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/memory-graph";` |
| React / Next.js | `import { MemoryGraph } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/memory-graph";` · tags starting with tc- are custom elements |
| Angular | `import { MemoryGraph } from "@adamstavely/trenchcoat/angular/memory-graph";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/memory-graph";` |

## Example

The live example is in the gallery at `#/memory-graph`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What an assistant or agent knows, and what it can reach, drawn around it. The agent sits in the middle. What it
remembers fills the left half of a ring, each memory a card with where it came from: a file, a chat or an email, by
name. The tools it can reach fill the right half, each with what it may do there and where ("Read · Exhibitions
space"). Rounded connectors join every card to the agent.

The agent says what it's doing: "Using Spreadsheet" while `using` names a tool, "Learning…" while `learning` names a
memory, "Recalling 2 memories" while `recalling` lists some, or the page's own words in `agent.activity`. A light runs
along the connectors to match: out to the tool in use, in from each memory being recalled, and in from the tool a new
memory came through (its `via`), then out to that memory. Every card a light reaches lights up.

There are six memory spots. With more memories, the last spot says "+N more" and opens the rest. Open any card for its
details: switch a memory or a tool off, forget a memory (Undo stays for a few seconds), or open the file it came from.
The agent itself is a button that offers **Add a file** and **Connect a tool**; the page does the work.

### When to use

- Showing what an assistant knows about a person and their work, and where each piece came from.
- Showing which tools an agent can reach, what it may do with them, and which one it's using right now.
- Letting people manage that in one place: switch a memory or tool off, forget a memory, add a file or connect a tool.

### When not to use

- A long, editable list of memories with categories and search – use [Memory Panel](memory-panel.md).
- What fills one run's context window – use [Context Map](context-map.md).
- Every tool an agent called in one run, with its calls and a replay – use [Tool Access Map](tool-access-map.md).
- Who started whom in a multi-agent run – use [Agent Tree](agent-tree.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Agent** `.ui-mgr__agent` – in the middle: its mark, name and what it's doing; a button that opens the menu
2. **Menu** `.ui-mgr__menu` – Add a file and Connect a tool
3. **Memory** `.ui-mgr__memory` – what it remembers, and where from: "budget-winter.xlsx · File"
4. **More** `.ui-mgr__more` – the last memory spot when there are more than six: "+3 more"
5. **Tool** `.ui-mgr__tool` – a tool's name, and what it may do where
6. **Link** `.ui-mgr__link` – the rounded connector from the agent to a card; dashed when the card is off
7. **Pulse** `.ui-mgr__pulse` – the light running along a connector, out or in
8. **Panel** `.ui-mgr__panel` – the open card's details, switch and Forget
9. **Undo** `.ui-mgr__undo` – after forgetting a memory, for `undo-for` ms

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The ring is the same in both. The connectors' colours come from `--tc-mgr-link` and
`--tc-mgr-light`, and the light's speed from `--tc-mgr-pulse`; set any of them on the element.

The ring fills the card's width, with cards between 150 and 232 px wide. When the card is too narrow for that, the
agent sits on top with Memories and Tools as two lists under it. With reduced motion the light doesn't run: the
connectors it would use turn the accent colour instead.

## Usage

### HTML

```html
<tc-memory-graph id="knows" heading="What the assistant knows"></tc-memory-graph>

<script type="module">
  import "@adamstavely/trenchcoat/memory-graph";
  import "@adamstavely/trenchcoat/tokens.css";

  const knows = document.querySelector("#knows");
  knows.agent = { name: "Assistant", subtitle: "Exhibitions team" };
  knows.memories = [
    { id: "m1", text: "Prefers short answers", source: "You asked for it twice", artifact: { name: "Feedback", kind: "chat" } },
    { id: "m2", text: "Winter exhibition budget €48k", artifact: { name: "budget-winter.xlsx" }, via: "sheet" },
    { id: "m3", text: "Opening moved to 11 December", artifact: { name: "Standup notes" }, via: "wiki" },
  ];
  knows.tools = [
    { id: "wiki", name: "Wiki", access: "Read", scope: "Exhibitions space" },
    { id: "sheet", name: "Spreadsheet", access: "Read & write", scope: "Budget sheets" },
  ];
  knows.using = "sheet";
  knows.addEventListener("tc-memories-change", (e) => console.log(e.detail.change, e.detail.memory.text));
  knows.addEventListener("tc-action", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MemoryGraph, type MemoryGraphMemory, type MemoryGraphTool } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start: MemoryGraphMemory[] = [
  { id: "m1", text: "Prefers short answers", artifact: { name: "Feedback", kind: "chat" } },
  { id: "m2", text: "Winter exhibition budget €48k", artifact: { name: "budget-winter.xlsx" }, via: "sheet" },
];
const startTools: MemoryGraphTool[] = [{ id: "sheet", name: "Spreadsheet", access: "Read & write", scope: "Budget sheets" }];

export function Knows() {
  const [memories, setMemories] = useState(start);
  const [tools, setTools] = useState(startTools);
  return (
    <MemoryGraph
      title="What the assistant knows"
      agent={{ name: "Assistant", subtitle: "Exhibitions team" }}
      memories={memories}
      onMemoriesChange={setMemories}
      tools={tools}
      onToolsChange={setTools}
      recalling={["m2"]}
      onAction={(id) => console.log(id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/memory-graph";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";

defineProps<{ agent: TcMemoryGraph["agent"]; memories: TcMemoryGraph["memories"] }>();
const onMemoriesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-memory-graph :agent="agent" :memories="memories" @tc-memories-change="onMemoriesChange"></tc-memory-graph>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MemoryGraph } from "@adamstavely/trenchcoat/angular/memory-graph";
import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";

@Component({
  selector: "app-memory-graph-example",
  imports: [MemoryGraph],
  template: `<tc-memory-graph [agent]="agent()" [memories]="memories()" (tc-memories-change)="onMemoriesChange($event)"></tc-memory-graph>`,
})
export class MemoryGraphExample {
  readonly agent = input.required<TcMemoryGraph["agent"]>();
  readonly memories = input.required<TcMemoryGraph["memories"]>();
  onMemoriesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/memory-graph";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";

  let { agent, memories }: { agent: TcMemoryGraph["agent"]; memories: TcMemoryGraph["memories"] } = $props();
  let el: TcMemoryGraph;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-memories-change", on);
    return () => el.removeEventListener("tc-memories-change", on);
  });
</script>

<tc-memory-graph bind:this={el} {agent} {memories}></tc-memory-graph>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Memory"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `agent` | – | `MemoryGraphAgent \| null` | `null` | The agent in the middle |
| `memories` | – | `MemoryGraphMemory[]` | `[]` | What it remembers, on the left of the ring from the top. Ids are unique across memories and tools |
| `tools` | – | `MemoryGraphTool[]` | `[]` | The tools it can reach, on the right of the ring from the top |
| `using` | `using` | `string \| null` | `null` | The id of the tool it's using right now – a light runs out to it |
| `learning` | `learning` | `string \| null` | `null` | The id of a memory it's learning right now – a light runs in from its `via` tool, through the agent, out to it |
| `recalling` | – | `string[]` | `[]` | The ids of memories it's recalling right now – a light runs in from each |
| `selected` | – | `string \| null` | `null` | The card whose details are open (a memory's or tool's id, or MEMORY_GRAPH_MORE). Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `undoFor` | `undo-for` | `number` | `5000` | How long Undo stays after a memory is forgotten, in ms |
| `kindLabels` | – | `Partial<Record<MemoryGraphSourceKind, string>>` | `{}` | The source kinds' words, merged over defaultMemoryGraphKindLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-memories-change` | – | Yes | A memory was switched off or on, forgotten or brought back ({ memories, memory, change }: MemoryGraphMemoriesChange); cancelable – prevented, `memories` stays as it was |
| `tc-tools-change` | – | Yes | A tool was switched off or on ({ tools, tool, change }: MemoryGraphToolsChange); cancelable – prevented, `tools` stays as it was |
| `tc-selected-change` | – | Yes | A card's details were opened or closed ({ selected, memory, tool }: MemoryGraphSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-action` | – | No | Add a file or Connect a tool was chosen on the agent ({ id }: MemoryGraphAction) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-mgr-link` | `var(--tc-border-strong)` | both |
| `--tc-mgr-light` | `var(--tc-accent-solid)` | both |
| `--tc-mgr-pulse` | `var(--tc-duration-shimmer)` | both |
| `--tc-mgr-track-w` | `var(--tc-space-7)` | both |
| `--tc-mgr-track-h` | `var(--tc-space-4)` | both |
| `--tc-mgr-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (69)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `MEMORY_GRAPH_MORE: string` | The "+N more" spot's id, as `selected` |

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
| `agent` | `el.agent = …;` | `<… agent={…} />` | `<tc-memory-graph :agent="…">` | `<tc-memory-graph [agent]="…">` | `<tc-memory-graph {agent}>` |
| `memories` | `el.memories = …;` | `<… memories={…} />` | `<tc-memory-graph :memories="…">` | `<tc-memory-graph [memories]="…">` | `<tc-memory-graph {memories}>` |
| `tools` | `el.tools = …;` | `<… tools={…} />` | `<tc-memory-graph :tools="…">` | `<tc-memory-graph [tools]="…">` | `<tc-memory-graph {tools}>` |
| `recalling` | `el.recalling = …;` | `<… recalling={…} />` | `<tc-memory-graph :recalling="…">` | `<tc-memory-graph [recalling]="…">` | `<tc-memory-graph {recalling}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-memory-graph :selected="…">` | `<tc-memory-graph [selected]="…">` | `<tc-memory-graph {selected}>` |
| `kindLabels` | `el.kindLabels = …;` | `<… kindLabels={…} />` | `<tc-memory-graph :kindLabels="…">` | `<tc-memory-graph [kindLabels]="…">` | `<tc-memory-graph {kindLabels}>` |

*Also attributes: `heading`, `description`, `using`, `learning`, `undo-for` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-memories-change` | Yes | `el.addEventListener("tc-memories-change", (e) => …)` | `ref.current.addEventListener("tc-memories-change", …)` | `@tc-memories-change="…"` | `(tc-memories-change)="…($event)"` | `el.addEventListener("tc-memories-change", …)` |
| `tc-tools-change` | Yes | `el.addEventListener("tc-tools-change", (e) => …)` | `ref.current.addEventListener("tc-tools-change", …)` | `@tc-tools-change="…"` | `(tc-tools-change)="…($event)"` | `el.addEventListener("tc-tools-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `memories`, `tools` and `selected` itself unless a listener calls `preventDefault()` on `tc-memories-change`, `tc-tools-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-memory-graph id="memory-graph"></tc-memory-graph>

<script type="module">
  import "@adamstavely/trenchcoat/memory-graph";

  const el = document.querySelector("#memory-graph");
  el.addEventListener("tc-memories-change", (e) => {
    e.preventDefault(); // the element keeps its memories…
    if (allowed(e.detail.memories)) el.memories = e.detail.memories; // …until the app sets it
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
import "@adamstavely/trenchcoat/memory-graph";
import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";

const props = defineProps<{ initial: TcMemoryGraph["memories"] }>();
const memories = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMemoriesChange = (e: CustomEvent<{ memories: TcMemoryGraph["memories"] }>) => {
  e.preventDefault();
  memories.value = e.detail.memories;
};
</script>

<template>
  <tc-memory-graph :memories="memories" @tc-memories-change="onMemoriesChange"></tc-memory-graph>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MemoryGraph } from "@adamstavely/trenchcoat/angular/memory-graph";
import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";

@Component({
  selector: "app-controlled-memory-graph",
  imports: [MemoryGraph],
  template: `<tc-memory-graph [memories]="memories()" (tc-memories-change)="onMemoriesChange($event)"></tc-memory-graph>`,
})
export class ControlledMemoryGraph {
  readonly initial = input.required<TcMemoryGraph["memories"]>();
  readonly memories = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMemoriesChange(e: CustomEvent<{ memories: TcMemoryGraph["memories"] }>) {
    e.preventDefault();
    this.memories.set(e.detail.memories);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/memory-graph";
  import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";

  let { initial }: { initial: TcMemoryGraph["memories"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let memories = $derived(initial);
  let el: TcMemoryGraph;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      memories = (e as CustomEvent<{ memories: TcMemoryGraph["memories"] }>).detail.memories;
    };
    el.addEventListener("tc-memories-change", on);
    return () => el.removeEventListener("tc-memories-change", on);
  });
</script>

<tc-memory-graph bind:this={el} {memories}></tc-memory-graph>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-memory-graph")` returns a `TcMemoryGraph` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";`
- **React / Next.js:** Props: `import type { MemoryGraphProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MemoryGraph>`. The element class, for refs: `import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMemoryGraph["agent"]` with `import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";`
- **Angular:** The directive types the template: `[agent]` takes `TcMemoryGraph["agent"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMemoryGraph } from "@adamstavely/trenchcoat/memory-graph";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `agent` | `MemoryGraphAgent \| null` | The agent in the middle; its icon can be a React node |
| `memories` | `MemoryGraphMemory[]` | What it remembers – controlled when given. Ids are unique across memories and tools |
| `defaultMemories` | `MemoryGraphMemory[]` | The memories to start with when `memories` isn't controlled |
| `onMemoriesChange` | `(memories: MemoryGraphMemory[]) => void` | Called with the whole list after a memory is switched, forgotten or brought back – in both modes |
| `tools` | `MemoryGraphTool[]` | The tools it can reach – controlled when given |
| `defaultTools` | `MemoryGraphTool[]` | The tools to start with when `tools` isn't controlled |
| `onToolsChange` | `(tools: MemoryGraphTool[]) => void` | Called with the whole list after a tool is switched – in both modes |
| `selected` | `string \| null` | The card whose details are open – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The card open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null) => void` | A card's details were opened or closed |
| `onAction` | `(id: MemoryGraphAction["id"]) => void` | Add a file or Connect a tool was chosen on the agent |

*Renamed or hidden on the wrapper: `heading`, `agent`, `memories`, `tools`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

The cards are one tab stop; the agent and the open card's controls are their own.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves down or up the side you're on |
| → / ← | Crosses to the other side, to the card at about the same height |
| Home / End | Moves to the first memory or the last tool |
| Enter / Space | Opens the card's details, or closes them |
| Escape | Closes the details |
| Delete / Backspace | Forgets the memory in focus; Undo appears under the graph |
| Enter on the agent | Opens Add a file and Connect a tool; Escape closes them |

### Screen readers

The cards are a listbox named by the heading and described by the keys. Inside it, two groups are named "Memories" and
"Tools". Each card is an option, selected while its details are open, whose name is its words: "Winter exhibition
budget €48k budget-winter.xlsx · File", with "Off" first when it's switched off. The agent's button is named by its
name and what it's doing, plus ", add a file or connect a tool", and says whether its menu is expanded. The switches
in the details are real switches ("Use this memory", "Let Assistant use Calendar"). Opening, switching, forgetting and
bringing back are confirmed in a polite status message. The connectors and the light are hidden; the agent's words
say what it's doing.

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

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 37.4 KB | 10.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **45.0 KB** | **13.0 KB** |
| With Lit – the first component on a page | 66.7 KB | 20.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.5 ms** | the gallery demo's data, 128 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of memories replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.1 ms | memories: first render, 142 nodes; update 0.7 ms |
| 1,000 items | 3.4 ms | memories: first render, 142 nodes; update 0.8 ms |

1,000 items of memories: 3.4 ms, 142 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write a memory as the fact itself, short: "Opening moved to 11 December", not "The user said that…".
- Give `source` as a line on how it was learned: "Agreed in Monday's standup".
- Name the artifact the way people know it: "budget-winter.xlsx", "Standup notes".
- Give a tool's `access` in two or three words ("Read", "Read & write") and its `scope` as the place: "Budget sheets".
- Keep `agent.activity` to a few words, as the agent would say it: "Checking the loans list".

## Do and don't

### Do

- Set `via` on memories learned through a tool, so a new one lights the way it came in.
- Keep `using`, `learning` and `recalling` true to what the agent is doing right now, and clear them when it stops.
- Listen to `tc-memories-change` and `tc-tools-change` and save the switches; they're the person's choices.

### Don't

- Don't put more than about eight tools on one side; the ring grows tall.
- Don't treat a memory that's switched off as forgotten; it's kept, only not used.
- Don't use colour alone for a lit or switched-off card; the agent's words and "Off" carry it.

## Related

- [Memory Panel](memory-panel.md) – What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray
- [Tool Access Map](tool-access-map.md) – One agent in the middle and every tool it can reach around it – used, failed, running, not used yet or no access, in words – with each tool's calls and a replay
- [Context Map](context-map.md) – What fills an agent's context window, as a living treemap – system prompt, tools, memory, every file, the chat and tool results as tiles that glide as it grows, the free space dashed, and compaction squeezing old turns into a summary
- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
