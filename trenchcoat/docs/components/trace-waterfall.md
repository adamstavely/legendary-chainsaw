<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Trace Waterfall

**Agents**

Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent

- **Element:** `<tc-trace-waterfall>`
- **Size:** 18.3 KB gzip · 68.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/trace-waterfall";` |
| React / Next.js | `import { TraceWaterfall } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/trace-waterfall";` · tags starting with tc- are custom elements |
| Angular | `import { TraceWaterfall } from "@adamstavely/trenchcoat/angular/trace-waterfall";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/trace-waterfall";` |

## Example

The live example is in the gallery at `#/trace-waterfall`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where the time and the money of an agent run go. On the left the run is a tree of spans – the agent, its LLM calls,
tool calls and sub-agents – and on the right each span is a bar on a timeline that starts when it started and is as
long as it took. Totals sit above: duration, cost, tokens, the number of LLM and tool calls, and errors. While the run
goes on, running bars grow, a “now” line moves across and the axis rescales when the run outgrows it. The slowest
finished call is marked, branches fold into their parent as small marks, and any span opens a small window with its
model, tokens, cost, input, output and error.

### When to use

- Debugging why a run was slow, expensive or failed – which call took the time, which tool errored.
- Watching a live run's steps arrive, with what they cost so far.
- Developer and operator views of agent runs, where timing and overlap matter.

### When not to use

- Who started whom, with status and cost per agent but without a timeline – use [Agent Tree](agent-tree.md).
- One tool call's arguments and result, inline in a conversation – use [Tool Call Card](tool-call-card.md).
- Setting or watching a spending limit for the run – use [Budget Guard](budget-guard.md).
- Comparing two runs side by side – use [Run Compare](run-compare.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the heading, the task and the run's status (Live, Done, Failed)
2. **Totals** `.ui-tw__stats` – duration, cost, tokens, LLM calls, tool calls and errors
3. **Axis** `.ui-tw__layer` – the time ticks and, while the run goes on, the “now” line
4. **Span** `.ui-tw__row` – one span: its name, detail, duration and cost on the left, its bar on the right
5. **Bar** `.ui-tw__bar` – when the span ran, tinted by kind; red when it failed
6. **Slowest** `.ui-tw__slow` – the mark on the slowest finished LLM or tool call

## Looks

Standard sets the header on the gray tray above a white card, and tints every bar by kind – agents, LLM calls and
tool calls each in their own colour. Clean puts everything in one card, draws agent and sub-agent bars in neutral
gray so the LLM and tool calls stand out, and uses slightly larger axis and duration labels. Both fold, rescale and
open details the same way.

## Usage

### HTML

```html
<tc-trace-waterfall id="trace" heading="Trace"></tc-trace-waterfall>

<script type="module">
  import "@adamstavely/trenchcoat/trace-waterfall";
  import "@adamstavely/trenchcoat/tokens.css";

  const trace = document.querySelector("#trace");
  trace.root = {
    id: "run", name: "Research agent", kind: "agent", status: "done", start: 0, end: 4100,
    input: "Compare CRM vendors for a 20-person team",
    children: [
      { id: "plan", name: "Plan the research", kind: "llm", status: "done", start: 100, end: 2400,
        model: "claude-opus", tokensIn: 1840, tokensOut: 412, cost: 0.058 },
      { id: "search", name: "search_web", kind: "tool", status: "done", start: 2500, end: 4100,
        detail: "CRM pricing 2026" },
    ],
  };
  trace.addEventListener("tc-open-change", (e) => console.log(e.detail.openId));
</script>
```

### React / Next.js

```tsx
import { TraceWaterfall, type TraceSpan } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const run: TraceSpan = {
  id: "run",
  name: "Research agent",
  kind: "agent",
  status: "running",
  start: 0,
  input: "Compare CRM vendors for a 20-person team",
  children: [
    { id: "plan", name: "Plan the research", kind: "llm", status: "done", start: 100, end: 2400, cost: 0.058 },
    { id: "search", name: "search_web", kind: "tool", status: "running", start: 2500 },
  ],
};

export function Trace({ startedAt }: { startedAt: number }) {
  return <TraceWaterfall root={run} startedAt={startedAt} onOpenChange={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/trace-waterfall";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";

defineProps<{ root: TcTraceWaterfall["root"]; collapsed: TcTraceWaterfall["collapsed"] }>();
const onCollapsedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-trace-waterfall :root="root" :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-trace-waterfall>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TraceWaterfall } from "@adamstavely/trenchcoat/angular/trace-waterfall";
import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";

@Component({
  selector: "app-trace-waterfall-example",
  imports: [TraceWaterfall],
  template: `<tc-trace-waterfall [root]="root()" [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-trace-waterfall>`,
})
export class TraceWaterfallExample {
  readonly root = input.required<TcTraceWaterfall["root"]>();
  readonly collapsed = input.required<TcTraceWaterfall["collapsed"]>();
  onCollapsedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/trace-waterfall";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";

  let { root, collapsed }: { root: TcTraceWaterfall["root"]; collapsed: TcTraceWaterfall["collapsed"] } = $props();
  let el: TcTraceWaterfall;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-trace-waterfall bind:this={el} {root} {collapsed}></tc-trace-waterfall>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `root` | – | `TraceSpan` | `{ id: "run", name: "Run", kind: "agent", status: "done", start: 0, end: 0 }` | The run: its root span, with the others as children |
| `elapsed` | `elapsed` | `number \| undefined` | `undefined` | The clock, in ms from the start of the run – e.g. a faster one for a demo |
| `now` | `now` | `number \| undefined` | `undefined` | The clock in epoch ms, read against `startedAt` (without `startedAt`: ms from the start of the run) |
| `startedAt` | `started-at` | `number \| undefined` | `undefined` | When the run started (epoch ms) – with `now`, or the element's own clock while spans run |
| `collapsed` | – | `string[]` | `[]` | Ids of folded spans |
| `openId` | `open-id` | `string \| null` | `null` | Id of the span whose details are open |
| `markSlowest` | `mark-slowest` | `boolean` | `true` | Marks the slowest finished LLM or tool call (default true; mark-slowest="false" turns it off) |
| `minRange` | `min-range` | `` | – | The shortest time the axis shows, in ms (default 10s) |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – defaults to dollars, e.g. "$0.042" |
| `heading` | `heading` | `string` | `"Trace"` | The heading, and the tree's name |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-collapsed-change` | – | Yes | Spans were folded or unfolded; detail `{ collapsed: string[] }`. Cancelable: preventDefault() keeps the folds (controlled use) |
| `tc-open-change` | – | Yes | A span's details opened or closed; detail `{ openId: string \| null, span?: TraceSpan }`. Cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-trace-waterfall-guide` | `light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1))` | standard, clean |
| `--tc-trace-waterfall-now` | `light-dark(rgba(0, 96, 226, 0.45), rgba(91, 154, 255, 0.55))` | standard, clean |
| `--tc-trace-waterfall-tick-zero` | `light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12))` | standard, clean |
| `--tc-trace-waterfall-agent-bg` | `light-dark(#eef0f3, #2c2f35)` | standard |
| `--tc-trace-waterfall-agent-edge` | `light-dark(#d3d8e0, #41464f)` | standard |
| `--tc-trace-waterfall-agent-ink` | `light-dark(#4b5363, #b8c0cc)` | standard |
| `--tc-trace-waterfall-agent-mark` | `light-dark(rgba(0, 0, 0, 0.3), rgba(255, 255, 255, 0.4))` | standard, clean |
| `--tc-trace-waterfall-llm-bg` | `light-dark(rgba(91, 91, 214, 0.1), rgba(130, 130, 255, 0.16))` | standard, clean |
| `--tc-trace-waterfall-llm-edge` | `light-dark(rgba(91, 91, 214, 0.3), rgba(130, 130, 255, 0.38))` | standard, clean |
| `--tc-trace-waterfall-llm-ink` | `light-dark(#4a4ac2, #b1a9ff)` | standard, clean |
| `--tc-trace-waterfall-llm-mark` | `light-dark(rgba(91, 91, 214, 0.72), rgba(140, 140, 255, 0.8))` | standard, clean |
| `--tc-trace-waterfall-tool-bg` | `light-dark(rgba(0, 123, 172, 0.085), rgba(0, 170, 220, 0.13))` | standard, clean |
| `--tc-trace-waterfall-tool-edge` | `light-dark(rgba(0, 123, 172, 0.28), rgba(0, 170, 220, 0.34))` | standard, clean |
| `--tc-trace-waterfall-tool-ink` | `light-dark(#006a94, #4ccce6)` | standard, clean |
| `--tc-trace-waterfall-tool-mark` | `light-dark(rgba(0, 123, 172, 0.62), rgba(40, 180, 225, 0.75))` | standard, clean |
| `--tc-trace-waterfall-row` | `30px` | standard, clean |
| `--tc-trace-waterfall-bar` | `14px` | standard, clean |
| `--tc-trace-waterfall-bar-radius` | `var(--tc-radius-xs)` | standard, clean |
| `--tc-trace-waterfall-axis` | `30px` | standard, clean |
| `--tc-trace-waterfall-name` | `232px` | standard, clean |
| `--tc-trace-waterfall-pad` | `10px` | standard, clean |
| `--tc-trace-waterfall-gap` | `14px` | standard, clean |
| `--tc-trace-waterfall-end` | `16px` | standard, clean |
| `--tc-trace-waterfall-indent` | `14px` | standard, clean |
| `--tc-trace-waterfall-range` | `10000` | standard, clean |

#### Design tokens it reads (102)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xl`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-trace-waterfall-at`, `--tc-trace-waterfall-span-bg`, `--tc-trace-waterfall-span-edge`, `--tc-trace-waterfall-span-ink`, `--tc-trace-waterfall-span-mark`, `--tc-tracking-normal`, `--tc-tracking-snug`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `root` | `el.root = …;` | `<… root={…} />` | `<tc-trace-waterfall :root="…">` | `<tc-trace-waterfall [root]="…">` | `<tc-trace-waterfall {root}>` |
| `collapsed` | `el.collapsed = …;` | `<… collapsed={…} />` | `<tc-trace-waterfall :collapsed="…">` | `<tc-trace-waterfall [collapsed]="…">` | `<tc-trace-waterfall {collapsed}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-trace-waterfall :formatCost="…">` | `<tc-trace-waterfall [formatCost]="…">` | `<tc-trace-waterfall {formatCost}>` |

*Also attributes: `elapsed`, `now`, `started-at`, `open-id`, `mark-slowest`, `min-range`, `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `ref.current.addEventListener("tc-collapsed-change", …)` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `collapsed` itself unless a listener calls `preventDefault()` on `tc-collapsed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-trace-waterfall id="trace-waterfall"></tc-trace-waterfall>

<script type="module">
  import "@adamstavely/trenchcoat/trace-waterfall";

  const el = document.querySelector("#trace-waterfall");
  el.addEventListener("tc-collapsed-change", (e) => {
    e.preventDefault(); // the element keeps its collapsed…
    if (allowed(e.detail.collapsed)) el.collapsed = e.detail.collapsed; // …until the app sets it
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
import "@adamstavely/trenchcoat/trace-waterfall";
import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";

const props = defineProps<{ initial: TcTraceWaterfall["collapsed"] }>();
const collapsed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCollapsedChange = (e: CustomEvent<{ collapsed: TcTraceWaterfall["collapsed"] }>) => {
  e.preventDefault();
  collapsed.value = e.detail.collapsed;
};
</script>

<template>
  <tc-trace-waterfall :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-trace-waterfall>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TraceWaterfall } from "@adamstavely/trenchcoat/angular/trace-waterfall";
import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";

@Component({
  selector: "app-controlled-trace-waterfall",
  imports: [TraceWaterfall],
  template: `<tc-trace-waterfall [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-trace-waterfall>`,
})
export class ControlledTraceWaterfall {
  readonly initial = input.required<TcTraceWaterfall["collapsed"]>();
  readonly collapsed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCollapsedChange(e: CustomEvent<{ collapsed: TcTraceWaterfall["collapsed"] }>) {
    e.preventDefault();
    this.collapsed.set(e.detail.collapsed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/trace-waterfall";
  import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";

  let { initial }: { initial: TcTraceWaterfall["collapsed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let collapsed = $derived(initial);
  let el: TcTraceWaterfall;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      collapsed = (e as CustomEvent<{ collapsed: TcTraceWaterfall["collapsed"] }>).detail.collapsed;
    };
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-trace-waterfall bind:this={el} {collapsed}></tc-trace-waterfall>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-trace-waterfall")` returns a `TcTraceWaterfall` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";`
- **React / Next.js:** Props: `import type { TraceWaterfallProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TraceWaterfall>`. The element class, for refs: `import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTraceWaterfall["root"]` with `import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";`
- **Angular:** The directive types the template: `[root]` takes `TcTraceWaterfall["root"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTraceWaterfall } from "@adamstavely/trenchcoat/trace-waterfall";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `root` | `TraceSpan` | The run: its root span, with the others as children |
| `title` | `string` | The heading, and the tree's name |
| `collapsed` | `string[]` | Controlled ids of folded spans |
| `defaultCollapsed` | `string[]` | Ids of the spans folded on mount when `collapsed` isn't controlled |
| `onCollapsedChange` | `(collapsed: string[]) => void` | Called with the ids of every folded span after a fold or an unfold |
| `openId` | `string \| null` | Controlled id of the span whose details are open |
| `defaultOpenId` | `string \| null` | Id of the span whose details are open on mount when `openId` isn't controlled |
| `onOpenChange` | `(id: string \| null, span?: TraceSpan) => void` | Called when a span's details open (with the span) or close (null) |

*Renamed or hidden on the wrapper: `root`, `heading`, `collapsed`, `openId`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

One span is in the tab order at a time; the arrow keys move between spans.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous span |
| Home / End | Moves to the first or last span |
| → | Unfolds a folded span; on an unfolded one, moves to its first child |
| ← | Folds an unfolded span; on a folded one or a leaf, moves to its parent |
| Enter / Space | Opens or closes the span's details and moves focus into them |
| Escape | Closes the details; from inside them, focus goes back to the span |

Moving to another span closes the open details, so they never cover the rows being read.

### Screen readers

The spans are a `tree` named by the heading (“Trace”), each a `treeitem` with its level, position, `aria-expanded`
when it has children, and `aria-selected` while its details are open. A span reads its name, detail, kind and status,
then its duration and cost (“Plan the research claude-opus, LLM call, Done, 2.3s · $0.058”); a folded span adds how
many spans it hides (“+5 folded”), and the slowest call says “Slowest”. The run's status in the header is a polite
live region, so “Done” or “Failed” is read when the run ends. The details are a `dialog` named “Plan the research
details”, with the stats as a description list and a “Close details” button.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 57.8 KB | 14.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 3.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.2 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **68.8 KB** | **18.3 KB** |
| With Lit – the first component on a page | 91.4 KB | 25.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.9 ms** | the gallery demo's data, 92 DOM nodes – to layout, median of 7 |
| Typical update | **1.1 ms** | re-render with the same data |
| First on the page | 29 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 8 React commits (clean), 8 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **9 timer callbacks/s** on screen, **nothing** scrolled away, **9 timer callbacks/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`, `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- Timers: `setInterval, cleared`, `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document pointerdown`, `document visibilitychange` (internal/controllers – OnScreenController), `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `Date.now()`, `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name spans by what they do – “Plan the research”, “search_web” – and put the model, the query or the target in
  `detail`.
- Give LLM calls their `model`, `tokensIn`, `tokensOut` and `cost`; an agent's cost and tokens are added up from its
  children.
- Keep `input` and `output` to a short preview; the details window is small.
- Say what went wrong in `error`, in the words of the system that failed (“403 Forbidden – blocked by bot
  protection”).

## Do and don't

### Do

- Give the run's goal as the root span's `input` – the header shows it as the task.
- Pass `startedAt` for a live run and let the element keep its own clock; pass `elapsed` to drive the clock yourself.
- Fold long sub-agent branches by default (`collapsed`) so the top level reads first.

### Don't

- Don't use it for a single call – a timeline of one bar says nothing a duration doesn't.
- Don't format costs in a currency the run isn't billed in; set `formatCost` instead.
- Don't leave `end` on a span that's still running – it stops the bar from growing.

## Related

- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted

## Changelog

- trace-waterfall rows show an outline when focused in forced-colours mode (their ring was a box-shadow, which forced colours removes). data-table sorts only when its rows, sort or columns change – scrolling 10,000 sorted rows was 72 ms per step.
- trace-waterfall `now` without `startedAt` → `elapsed`
