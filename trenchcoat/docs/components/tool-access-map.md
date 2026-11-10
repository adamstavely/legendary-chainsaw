<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Tool Access Map

**Agents** · New

One agent in the middle and every tool it can reach around it – used, failed, running, not used yet or no access, in words – with each tool's calls and a replay

- **Element:** `<tc-tool-access-map>`
- **Size:** 11.1 KB gzip · 38.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tool-access-map";` |
| React / Next.js | `import { ToolAccessMap } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tool-access-map";` · tags starting with tc- are custom elements |
| Angular | `import { ToolAccessMap } from "@adamstavely/trenchcoat/angular/tool-access-map";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tool-access-map";` |

## Example

The live example is in the gallery at `#/tool-access-map`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One agent in the middle and every tool it can reach in a ring around it. Each tool says in words where it stands:
"Last call 520ms", "Failed", "Running", "Not used yet" or "No access", with a badge for how many calls it took. A line
joins the agent to every tool it has used. A call in flight sends a pulse along the line, and a failed call turns the
line red and dashed. Tools the agent may not use are dashed and quiet, with no line. Open a tool for its calls,
newest first, with their arguments and results, and replay any one of them on its own. The header counts it up:
"5/9 tools · 6 calls · 1 running".

Calls can come with each tool, or as one feed in `calls`, each naming its tool in `to` and, optionally, the agent in
`from`. That's the shape `tc-agent-graph` takes for its calls (`error` and `pending` are read as failed and running),
so one feed can drive both.

### When to use

- Showing what an agent can reach and what it actually used during a run.
- Debugging a run: which tool failed, what it was asked and what came back, with a replay.
- Reviewing an agent's reach before widening or narrowing it.

### When not to use

- Many agents and the tools they share as a live network – use [Agent Graph](agent-graph.md).
- Setting which agent may use which tool – use [Tool Permissions](tool-permissions.md).
- One tool call in a transcript – use [Tool Call Card](tool-call-card.md).
- One agent's steps over time – use [Agent Monitor](agent-monitor.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Agent tabs** `.ui-tam__tabs` – with several `agents`, one tab each over the map
2. **Agent** `.ui-tam__agent` – the agent in the middle: name, model, status in words and its task
3. **Tool** `.ui-tam__tool` – a tool in the ring: its icon, name and state in words
4. **Badge** `.ui-tam__badge` – how many calls it took, "2×"
5. **Link** `.ui-tam__link` – from the agent to a tool it used; red and dashed after a failure
6. **Pulse** `.ui-tam__pulse` – runs along the link while a call is in flight
7. **Panel** `.ui-tam__panel` – the open tool: what it is, and its calls
8. **Call** `.ui-tam__call` – status, what was asked, time, arguments, result and Replay
9. **Replay** `.ui-tam__replay` – runs the call again; busy while `onReplay`'s promise is pending

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The ring is the same in both. The links' colours come from `--tc-tam-link`, `--tc-tam-running` and
`--tc-tam-failed`, and the pulse's speed from `--tc-tam-pulse`; set any of them on the element.

The ring scales with the card between 320 and 500 px. An open tool's calls sit beside the ring while there's room,
then drop below it; narrower than about 390 px the tools become a plain list under the agent. In a small ring, tools
with a `short` name show it, and the full name is still read.

## Usage

### HTML

```html
<tc-tool-access-map id="reach" heading="Tool access"></tc-tool-access-map>

<script type="module">
  import "@adamstavely/trenchcoat/tool-access-map";
  import "@adamstavely/trenchcoat/tokens.css";

  const reach = document.querySelector("#reach");
  reach.agent = { name: "Data steward", model: "Reasoning model", status: "running", task: "Load the November surveys" };
  reach.tools = [
    { id: "repo", name: "Repository", calls: [{ id: "r1", at: Date.UTC(2026, 10, 6, 14, 2), ms: 520, label: "read schema.yaml" }] },
    { id: "terminal", name: "Terminal", calls: [{ id: "t1", at: Date.UTC(2026, 10, 6, 14, 5), ms: 4200, status: "failed" }] },
    { id: "search", name: "Web search" },
    { id: "mail", name: "Mail", access: "none" },
  ];
  reach.onReplay = (tool, call) => fetch(`/replay/${call.id}`, { method: "POST" });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ToolAccessMap, type ToolAccessTool } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const tools: ToolAccessTool[] = [
  { id: "repo", name: "Repository", calls: [{ id: "r1", at: Date.UTC(2026, 10, 6, 14, 2), ms: 520 }] },
  { id: "mail", name: "Mail", access: "none" },
];

export function Reach() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <ToolAccessMap
      title="Tool access"
      agent={{ name: "Data steward", status: "running" }}
      tools={tools}
      selected={selected}
      onSelectedChange={setSelected}
      onReplay={async (tool, call) => {
        await fetch(`/replay/${call.id}`, { method: "POST" });
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tool-access-map";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";

defineProps<{ agent: TcToolAccessMap["agent"]; tools: TcToolAccessMap["tools"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-tool-access-map :agent="agent" :tools="tools" @tc-selected-change="onSelectedChange"></tc-tool-access-map>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ToolAccessMap } from "@adamstavely/trenchcoat/angular/tool-access-map";
import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";

@Component({
  selector: "app-tool-access-map-example",
  imports: [ToolAccessMap],
  template: `<tc-tool-access-map [agent]="agent()" [tools]="tools()" (tc-selected-change)="onSelectedChange($event)"></tc-tool-access-map>`,
})
export class ToolAccessMapExample {
  readonly agent = input.required<TcToolAccessMap["agent"]>();
  readonly tools = input.required<TcToolAccessMap["tools"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tool-access-map";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";

  let { agent, tools }: { agent: TcToolAccessMap["agent"]; tools: TcToolAccessMap["tools"] } = $props();
  let el: TcToolAccessMap;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-tool-access-map bind:this={el} {agent} {tools}></tc-tool-access-map>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Tool access"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `agent` | – | `ToolAccessAgent \| null` | `null` | The agent in the middle |
| `tools` | – | `ToolAccessTool[]` | `[]` | Every tool it can reach, clockwise from the top |
| `calls` | – | `ToolAccessFeedCall[]` | `[]` | Calls as one feed, each naming its tool in `to` – added to the tools' own `calls` |
| `selected` | – | `string \| null` | `null` | The open tool. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `agents` | – | `ToolAccessAgentTab[]` | `[]` | Agents to switch between, as tabs over the map – leave empty for none |
| `agentId` | `agent-id` | `string \| null` | `null` | The chosen agent tab. Changed by the user unless a tc-agent-id-change listener calls preventDefault() |
| `onReplay` | – | `((tool: ToolAccessTool, call: ToolAccessCall) => unknown) \| undefined` | `undefined` | Called on Replay (after tc-replay, unless it was prevented). May return a promise: the button is busy until it settles |
| `statusLabels` | – | `Partial<Record<ToolAccessAgentStatus, string>>` | `{}` | The agent's status words, merged over defaultToolAccessAgentLabels |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for call times |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A tool was opened or closed ({ selected, tool }: ToolAccessSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-agent-id-change` | – | Yes | An agent tab was chosen ({ agentId }: ToolAccessAgentIdChange); cancelable – prevented, `agentId` stays as it was |
| `tc-replay` | – | Yes | Replay was pressed on a call ({ tool, call }: ToolAccessReplay); cancelable – prevented, `onReplay` isn't called |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tam-link` | `var(--tc-border-strong)` | both |
| `--tc-tam-running` | `var(--tc-accent-solid)` | both |
| `--tc-tam-failed` | `var(--tc-status-danger-solid)` | both |
| `--tc-tam-pulse` | `var(--tc-duration-shimmer)` | both |
| `--tc-tam-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (78)

`--tc-accent-solid`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `agent` | `el.agent = …;` | `<… agent={…} />` | `<tc-tool-access-map :agent="…">` | `<tc-tool-access-map [agent]="…">` | `<tc-tool-access-map {agent}>` |
| `tools` | `el.tools = …;` | `<… tools={…} />` | `<tc-tool-access-map :tools="…">` | `<tc-tool-access-map [tools]="…">` | `<tc-tool-access-map {tools}>` |
| `calls` | `el.calls = …;` | `<… calls={…} />` | `<tc-tool-access-map :calls="…">` | `<tc-tool-access-map [calls]="…">` | `<tc-tool-access-map {calls}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-tool-access-map :selected="…">` | `<tc-tool-access-map [selected]="…">` | `<tc-tool-access-map {selected}>` |
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-tool-access-map :agents="…">` | `<tc-tool-access-map [agents]="…">` | `<tc-tool-access-map {agents}>` |
| `onReplay` | `el.onReplay = …;` | `<… onReplay={…} />` | `<tc-tool-access-map :onReplay="…">` | `<tc-tool-access-map [onReplay]="…">` | `<tc-tool-access-map {onReplay}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-tool-access-map :statusLabels="…">` | `<tc-tool-access-map [statusLabels]="…">` | `<tc-tool-access-map {statusLabels}>` |

*Also attributes: `heading`, `description`, `agent-id`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-agent-id-change` | Yes | `el.addEventListener("tc-agent-id-change", (e) => …)` | `ref.current.addEventListener("tc-agent-id-change", …)` | `@tc-agent-id-change="…"` | `(tc-agent-id-change)="…($event)"` | `el.addEventListener("tc-agent-id-change", …)` |
| `tc-replay` | Yes | `el.addEventListener("tc-replay", (e) => …)` | `ref.current.addEventListener("tc-replay", …)` | `@tc-replay="…"` | `(tc-replay)="…($event)"` | `el.addEventListener("tc-replay", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` and `agentId` itself unless a listener calls `preventDefault()` on `tc-selected-change` or `tc-agent-id-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-tool-access-map id="tool-access-map"></tc-tool-access-map>

<script type="module">
  import "@adamstavely/trenchcoat/tool-access-map";

  const el = document.querySelector("#tool-access-map");
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
import "@adamstavely/trenchcoat/tool-access-map";
import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";

const props = defineProps<{ initial: TcToolAccessMap["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcToolAccessMap["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-tool-access-map :selected="selected" @tc-selected-change="onSelectedChange"></tc-tool-access-map>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ToolAccessMap } from "@adamstavely/trenchcoat/angular/tool-access-map";
import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";

@Component({
  selector: "app-controlled-tool-access-map",
  imports: [ToolAccessMap],
  template: `<tc-tool-access-map [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-tool-access-map>`,
})
export class ControlledToolAccessMap {
  readonly initial = input.required<TcToolAccessMap["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcToolAccessMap["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tool-access-map";
  import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";

  let { initial }: { initial: TcToolAccessMap["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcToolAccessMap;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcToolAccessMap["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-tool-access-map bind:this={el} {selected}></tc-tool-access-map>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tool-access-map")` returns a `TcToolAccessMap` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";`
- **React / Next.js:** Props: `import type { ToolAccessMapProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ToolAccessMap>`. The element class, for refs: `import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcToolAccessMap["agent"]` with `import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";`
- **Angular:** The directive types the template: `[agent]` takes `TcToolAccessMap["agent"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcToolAccessMap } from "@adamstavely/trenchcoat/tool-access-map";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `agent` | `ToolAccessAgent \| null` | The agent in the middle; its icon can be a React node |
| `tools` | `ToolAccessTool[]` | Every tool it can reach, clockwise from the top; icons can be React nodes |
| `selected` | `string \| null` | The open tool – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The tool open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, tool: ToolAccessTool \| null) => void` | A tool was opened or closed |
| `agentId` | `string \| null` | The chosen agent tab – controlled when given |
| `defaultAgentId` | `string \| null` | The agent tab chosen on mount when `agentId` isn't controlled |
| `onAgentIdChange` | `(agentId: string \| null) => void` | An agent tab was chosen |
| `onReplay` | `(tool: ToolAccessTool, call: ToolAccessCall) => unknown` | Replay was pressed on a call. May return a promise: the button is busy until it settles |

*Renamed or hidden on the wrapper: `heading`, `agent`, `tools`, `selected`, `agentId`, `onReplay`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

The tools are one tab stop; inside the ring the arrows move between them.

| Key | What it does |
|---|---|
| → / ↓ | Moves to the next tool clockwise, wrapping round |
| ← / ↑ | Moves to the previous tool, wrapping round |
| Home / End | Moves to the first or last tool |
| Enter / Space | Opens the tool's calls, or closes them if they're open |
| Escape | Closes the calls |
| ← / → on the agent tabs | Moves to and chooses the previous or next agent |
| Tab | Leaves the ring; the panel's Close and Replay buttons come after it |

### Screen readers

The tools are a listbox named by the heading and described by "Arrow keys move between tools; Enter opens a tool's
calls". Each tool is an option, selected while it's open, whose name is its name, its state in words and how many
calls it took: "Repository Last call 520ms, 2 calls". The agent tabs are a tab list named "Agents". Each Replay
button's name starts with its visible word and adds which call: "Replay call 2 to Repository". Opening a tool and
replaying a call are confirmed in a polite status message: "Opened Terminal", "Replayed the call to Terminal". The
links and the pulse are hidden; the words carry them.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
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
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 31.4 KB | 9.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **38.8 KB** | **11.1 KB** |
| With Lit – the first component on a page | 60.6 KB | 18.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 181 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of tools replaced |
| First on the page | 8.2 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.0 ms | tools: first render, 1,344 nodes; update 4.8 ms |
| 1,000 items | 67 ms | tools: first render, 12,844 nodes; update 24 ms |

1,000 items of tools: 67 ms. It renders every item, so a first render passes 50 ms (a long task) at about 740 items – page or filter longer lists.

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

- Name tools for what they are to the agent: "Repository", "Lab notebook", not product names.
- Give long names a `short` one for small rings: "Notebook" for "Lab notebook".
- Keep a call's `label` to what was asked, in a few words: "read schema.yaml".
- Pass `args` and `result` as strings or plain objects; objects are shown as JSON.

## Do and don't

### Do

- List every tool the agent could reach, including the ones it has no access to, so the reach is clear.
- Keep running calls `running` until they finish, so the pulse and the word stay true.
- Return a promise from `onReplay` so the button shows the replay is in progress.

### Don't

- Don't put more than about twelve tools in one ring; split them across agents instead.
- Don't use colour alone for a tool's state; the word under its name is what people read.
- Don't replay calls that change things without asking first; prevent `tc-replay` and confirm.

## Related

- [Agent Graph](agent-graph.md) – Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
- [Agent Monitor](agent-monitor.md) – One agent at work as a compact card – its current step with a clock and the cost so far, a strip of steps sized by duration, the finished steps, and Pause and Stop

## Changelog

- **Tool Access Map** (`tc-tool-access-map`): one agent with every tool it can reach in a ring – used, failed, running, not used yet or no access, in words – each tool's calls with arguments, results and a cancelable `tc-replay`. Takes the same call feed as Agent Graph.
