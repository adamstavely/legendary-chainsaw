<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Context Map

**Agents**

What fills an agent's context window, as a living treemap – system prompt, tools, memory, every file, the chat and tool results as tiles that glide as it grows, the free space dashed, and compaction squeezing old turns into a summary

- **Element:** `<tc-context-map>`
- **Size:** 16.2 KB gzip · 68.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/context-map";` |
| React / Next.js | `import { ContextMap } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/context-map";` · tags starting with tc- are custom elements |
| Angular | `import { ContextMap } from "@adamstavely/trenchcoat/angular/context-map";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/context-map";` |

## Example

The live example is in the gallery at `#/context-map`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A picture of what fills an agent's context window. Every part – the system prompt, tools, memory, each file it
read, the chat, tool results – is a tile as large as its share of the tokens, and what's left is a dashed free
space. Tiles keep their place and glide as the context grows, so people can watch it fill and see at a glance what
is taking the room. After a compaction, Before and After show what was kept, folded into a summary or dropped.

### When to use

- Explaining why an agent forgot something or slowed down – which files and results crowd its window.
- Long-running agents that compact their context, where people want to see what the compaction cost.
- Comparing agents with different window sizes – `agents` turns the name in the bar into a menu.

### When not to use

- Showing and editing what's in context – pin, remove, undo – next to a composer – use [Context Tray](context-tray.md).
- Letting people remove files and compact the conversation themselves – use [Context Window](context-window.md).
- Spend and token caps that stop a run – use [Budget Guard](budget-guard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a treemap icon, the title, and the status while there is one
2. **Bar** `.ui-cxm__bar` – the agent or model, and how full the window is
3. **Agent menu** `.ui-cxm__agent` – the current agent and its window size; opens a menu of the others
4. **Total** `.ui-cxm__sum` – tokens used out of the window and the share; Before and After join it after a compaction
5. **Tile** `.ui-cxm__tile` – one block of the context, sized by its tokens
6. **Free space** `.ui-cxm__tile[data-kind="free"]` – what's left of the window, dashed
7. **Compaction line** `.ui-cxm__fates` – adds up the last compaction: kept, summarized and dropped

## Looks

Standard sets the header, the bar and the map in a gray tray, the map inset as a white card. Clean drops the tray:
one white card, with the header as its first row, then the bar and the map as a hairline-bordered area. Both colour the
percentage amber from 80% and red from 95%, and behave the same.

## Usage

### HTML

```html
<tc-context-map id="context" limit="200000" model="Sonnet 5"></tc-context-map>

<script type="module">
  import "@adamstavely/trenchcoat/context-map";
  import "@adamstavely/trenchcoat/tokens.css";

  const map = document.querySelector("#context");
  map.blocks = [
    { id: "sys", label: "System prompt", kind: "system", tokens: 3200 },
    { id: "tools", label: "Tools", kind: "tools", tokens: 14800, detail: "7 tool definitions" },
    { id: "f1", label: "checkout.ts", kind: "file", tokens: 18400, detail: "Read at 0:04" },
  ];
  map.compaction = null;
  map.addEventListener("tc-select", (e) => console.log(e.detail?.label ?? "Free"));
</script>
```

### React / Next.js

```tsx
import { ContextMap, type ContextBlock } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const blocks: ContextBlock[] = [
  { id: "sys", label: "System prompt", kind: "system", tokens: 3200 },
  { id: "tools", label: "Tools", kind: "tools", tokens: 14800, detail: "7 tool definitions" },
  { id: "f1", label: "checkout.ts", kind: "file", tokens: 18400, detail: "Read at 0:04" },
];

export function AgentContext({ compacting }: { compacting: boolean }) {
  return (
    <ContextMap
      blocks={blocks}
      limit={200_000}
      model="Sonnet 5"
      compaction={null}
      status={compacting ? "Compacting" : undefined}
      onSelect={(block) => console.log(block?.label ?? "Free")}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/context-map";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";

defineProps<{ blocks: TcContextMap["blocks"]; modelIcon: TcContextMap["modelIcon"] }>();
const onAgentChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-context-map :blocks="blocks" :modelIcon="modelIcon" @tc-agent-change="onAgentChange"></tc-context-map>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ContextMap } from "@adamstavely/trenchcoat/angular/context-map";
import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";

@Component({
  selector: "app-context-map-example",
  imports: [ContextMap],
  template: `<tc-context-map [blocks]="blocks()" [modelIcon]="modelIcon()" (tc-agent-change)="onAgentChange($event)"></tc-context-map>`,
})
export class ContextMapExample {
  readonly blocks = input.required<TcContextMap["blocks"]>();
  readonly modelIcon = input.required<TcContextMap["modelIcon"]>();
  onAgentChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/context-map";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";

  let { blocks, modelIcon }: { blocks: TcContextMap["blocks"]; modelIcon: TcContextMap["modelIcon"] } = $props();
  let el: TcContextMap;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-agent-change", on);
    return () => el.removeEventListener("tc-agent-change", on);
  });
</script>

<tc-context-map bind:this={el} {blocks} {modelIcon}></tc-context-map>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `blocks` | – | `ContextBlock[]` | `[]` | In the order they should sit – the free space always comes last |
| `limit` | `limit` | `number` | `200_000` | The context window's size in tokens – e.g. 200000 |
| `model` | `model` | `string` | `""` | The model, next to the title |
| `modelIcon` | – | `Element \| undefined` | `undefined` | The model maker's logo – on a small white tile before the model (cloned) |
| `agents` | – | `ContextAgent[] \| undefined` | `undefined` | Agents to switch between – the bar shows the current one's name as a menu |
| `agent` | `agent` | `string \| undefined` | `undefined` | The current agent's id; unset is the first one |
| `compaction` | – | `ContextCompaction \| null \| undefined` | `undefined` | The last compaction, to compare before and after – null shows the line for it while there's none yet |
| `view` | `view` | `ContextMapView` | `"after"` | Which side of the compaction shows |
| `status` | `status` | `string` | `""` | A short status in the bar – e.g. "Compacting" |
| `heading` | `heading` | `string` | `"Context"` | The title in the bar, and the map's name |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-agent-change` | – | Yes | The user picked another agent ({ agent }: ContextAgentChange); cancelable |
| `tc-view-change` | – | Yes | Before / After switched ({ view, reset }: ContextViewChange – reset when a new compaction asks for "after"); cancelable |
| `tc-select` | – | No | A tile was clicked; `detail` is the `ContextBlock`, or null for the free space |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-context-map-tools-bg` | `light-dark(rgba(0, 123, 172, 0.085), rgba(40, 170, 220, 0.16))` | standard, clean |
| `--tc-context-map-tools-edge` | `light-dark(rgba(0, 123, 172, 0.28), rgba(70, 190, 235, 0.42))` | standard, clean |
| `--tc-context-map-tools-ink` | `light-dark(#006a94, #6fd0f2)` | standard, clean |
| `--tc-context-map-memory-bg` | `light-dark(rgba(91, 91, 214, 0.1), rgba(120, 120, 255, 0.18))` | standard, clean |
| `--tc-context-map-memory-edge` | `light-dark(rgba(91, 91, 214, 0.3), rgba(150, 150, 255, 0.45))` | standard, clean |
| `--tc-context-map-memory-ink` | `light-dark(#4a4ac2, #b3b3ff)` | standard, clean |
| `--tc-context-map-file-bg` | `light-dark(rgba(0, 96, 226, 0.08), rgba(60, 130, 255, 0.18))` | standard, clean |
| `--tc-context-map-file-edge` | `light-dark(rgba(0, 96, 226, 0.26), rgba(112, 170, 255, 0.45))` | standard, clean |
| `--tc-context-map-file-ink` | `light-dark(#0058cf, #8ab8ff)` | standard, clean |
| `--tc-context-map-chat-bg` | `light-dark(rgba(142, 78, 198, 0.09), rgba(180, 110, 240, 0.17))` | standard, clean |
| `--tc-context-map-chat-edge` | `light-dark(rgba(142, 78, 198, 0.28), rgba(200, 140, 250, 0.42))` | standard, clean |
| `--tc-context-map-chat-ink` | `light-dark(#7b3fb0, #d4a8ff)` | standard, clean |
| `--tc-context-map-result-bg` | `light-dark(rgba(255, 156, 0, 0.13), rgba(255, 160, 40, 0.17))` | standard, clean |
| `--tc-context-map-result-edge` | `light-dark(rgba(214, 120, 0, 0.36), rgba(255, 180, 70, 0.45))` | standard, clean |
| `--tc-context-map-result-ink` | `light-dark(#b35400, #ffc078)` | standard, clean |
| `--tc-context-map-summary-bg` | `light-dark(rgba(0, 164, 51, 0.13), rgba(40, 200, 110, 0.17))` | standard, clean |
| `--tc-context-map-summary-edge` | `light-dark(rgba(0, 140, 50, 0.34), rgba(60, 220, 130, 0.42))` | standard, clean |
| `--tc-context-map-summary-ink` | `light-dark(#007d2e, #6fe0a4)` | standard, clean |
| `--tc-context-map-shine` | `light-dark(rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.35))` | standard, clean |
| `--tc-context-map-height` | `280px` | standard, clean |
| `--tc-context-map-gap` | `3px` | standard, clean |

#### Design tokens it reads (84)

`--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-context-map-tile-bg`, `--tc-context-map-tile-edge`, `--tc-context-map-tile-ink`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xl`, `--tc-radius-2xs`, `--tc-radius-3xl`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-z-dropdown`

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
| `blocks` | `el.blocks = …;` | `<… blocks={…} />` | `<tc-context-map :blocks="…">` | `<tc-context-map [blocks]="…">` | `<tc-context-map {blocks}>` |
| `modelIcon` | `el.modelIcon = …;` | `<… modelIcon={…} />` | `<tc-context-map :modelIcon="…">` | `<tc-context-map [modelIcon]="…">` | `<tc-context-map {modelIcon}>` |
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-context-map :agents="…">` | `<tc-context-map [agents]="…">` | `<tc-context-map {agents}>` |
| `compaction` | `el.compaction = …;` | `<… compaction={…} />` | `<tc-context-map :compaction="…">` | `<tc-context-map [compaction]="…">` | `<tc-context-map {compaction}>` |

*Also attributes: `limit`, `model`, `agent`, `view`, `status`, `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-agent-change` | Yes | `el.addEventListener("tc-agent-change", (e) => …)` | `ref.current.addEventListener("tc-agent-change", …)` | `@tc-agent-change="…"` | `(tc-agent-change)="…($event)"` | `el.addEventListener("tc-agent-change", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `onViewChange={…}` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-select` | No | `el.addEventListener("tc-select", (e) => …)` | `onSelect={…}` | `@tc-select="…"` | `(tc-select)="…($event)"` | `el.addEventListener("tc-select", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `agent` and `view` itself unless a listener calls `preventDefault()` on `tc-agent-change` or `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-context-map id="context-map"></tc-context-map>

<script type="module">
  import "@adamstavely/trenchcoat/context-map";

  const el = document.querySelector("#context-map");
  el.addEventListener("tc-agent-change", (e) => {
    e.preventDefault(); // the element keeps its agent…
    if (allowed(e.detail.agent)) el.agent = e.detail.agent; // …until the app sets it
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
import "@adamstavely/trenchcoat/context-map";
import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";

const props = defineProps<{ initial: TcContextMap["agent"] }>();
const agent = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onAgentChange = (e: CustomEvent<{ agent: TcContextMap["agent"] }>) => {
  e.preventDefault();
  agent.value = e.detail.agent;
};
</script>

<template>
  <tc-context-map :agent="agent" @tc-agent-change="onAgentChange"></tc-context-map>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ContextMap } from "@adamstavely/trenchcoat/angular/context-map";
import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";

@Component({
  selector: "app-controlled-context-map",
  imports: [ContextMap],
  template: `<tc-context-map [agent]="agent()" (tc-agent-change)="onAgentChange($event)"></tc-context-map>`,
})
export class ControlledContextMap {
  readonly initial = input.required<TcContextMap["agent"]>();
  readonly agent = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onAgentChange(e: CustomEvent<{ agent: TcContextMap["agent"] }>) {
    e.preventDefault();
    this.agent.set(e.detail.agent);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/context-map";
  import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";

  let { initial }: { initial: TcContextMap["agent"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let agent = $derived(initial);
  let el: TcContextMap;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      agent = (e as CustomEvent<{ agent: TcContextMap["agent"] }>).detail.agent;
    };
    el.addEventListener("tc-agent-change", on);
    return () => el.removeEventListener("tc-agent-change", on);
  });
</script>

<tc-context-map bind:this={el} {agent}></tc-context-map>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-context-map")` returns a `TcContextMap` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";`
- **React / Next.js:** Props: `import type { ContextMapProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ContextMap>`. The element class, for refs: `import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcContextMap["blocks"]` with `import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";`
- **Angular:** The directive types the template: `[blocks]` takes `TcContextMap["blocks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcContextMap } from "@adamstavely/trenchcoat/context-map";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `blocks` | `ContextBlock[]` | In the order they should sit – the free space always comes last |
| `limit` | `number` | The context window's size in tokens – e.g. 200000 |
| `modelIcon` | `React.ReactNode` | The model maker's logo – on a small white tile before the model |
| `agents` | `ContextAgent[]` | Agents to switch between – the bar shows the current one's name as a menu |
| `agent` | `string` | The current agent's id. Controlled when defined |
| `defaultAgent` | `string` | The agent shown first when `agent` isn't controlled – defaults to the first one |
| `onAgentChange` | `(id: string) => void` | Called with the picked agent's id, controlled or not |
| `compaction` | `ContextCompaction \| null` | The last compaction, to compare before and after – null shows the line for it while there's none yet |
| `view` | `ContextMapView` | Which side of the compaction shows. Controlled when defined |
| `defaultView` | `ContextMapView` | The side shown first when `view` isn't controlled; a new compaction shows "after" again |
| `onViewChange` | `(view: ContextMapView) => void` | Called with the new side on every switch, controlled or not |
| `onSelect` | `(block: ContextBlock \| null) => void` | Called when a tile is clicked, with the block as you passed it – null for the free space |
| `title` | `string` | The title in the bar, and the map's accessible name – "Context" by default |

*Renamed or hidden on the wrapper: `blocks`, `agents`, `agent`, `compaction`, `view`, `heading`, `modelIcon`, `onSelect`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the map – one tile takes focus – and on to the next control |
| ← / → / ↑ / ↓ | Moves to the previous or next tile, in the map's order |
| Home / End | Moves to the first or last tile |
| Enter / Space | On a tile: pins its card, or lets it go; on the agent button: opens the menu |
| Escape | Hides the card without moving focus; in the agent menu, closes it and returns to the button |
| ↓ / ↑ on the agent button | Opens the menu on the first or last agent |
| ↓ / ↑ / Home / End in the menu | Moves between agents, wrapping at the ends |

### Screen readers

The map is a list named by the title. Each tile is a button whose name gives its label, kind and size (“checkout.ts,
File – 18.4k tokens”); before a compaction its fate is part of the name (“…, summarized”). A pinned tile is
`aria-pressed`, and the focused, hovered or pinned tile is described by its card (`role="tooltip"`). The free space
is a list item named “Free – 175k tokens”. The agent button has `aria-haspopup="menu"` and `aria-expanded`; the
menu, “Agents”, holds `menuitemradio` items with the current one checked. Before and After are a “Compaction” group
of `aria-pressed` buttons. `status` is read out through a status region that's there from the start.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 60.6 KB | 13.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **68.6 KB** | **16.2 KB** |
| With Lit – the first component on a page | 90.5 KB | 23.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 30 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of blocks replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.6 ms | blocks: first render, 30 nodes; update 0.7 ms |
| 1,000 items | 11 ms | blocks: first render, 30 nodes; update 4.2 ms |

What it renders doesn't grow with blocks (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 7 React commits (clean), 7 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **60 frames/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document keydown`, `document pointerdown`, `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name blocks as people know them: the file name, the tool call (“run_tests”), “Your request” – not ids.
- Use `detail` for when or why it arrived (“Read at 0:42”, “3 failing: 3DS redirect”), one short line.
- List what a block holds in `items` – the tools in a tool block – rather than packing it into the label.
- Keep `status` to a word or two in the present: “Compacting”, “Reading files”.

## Do and don't

### Do

- Keep blocks in the order they arrived; new ones join where the list puts them, so tiles don't jump.
- Give the compaction `summary` the summary block's id, so its card says what went into it.
- Pass `compaction={null}` before the first compaction to show the line that explains what's to come.

### Don't

- Don't merge every file into one block – the map is useful because people can find the file that's too big.
- Don't change `blocks` many times a second; update when something arrives and let the tiles glide.
- Don't use the map's colours alone to tell blocks apart – the label and kind are on every tile and card.

## Related

- [Context Tray](context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window
- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
