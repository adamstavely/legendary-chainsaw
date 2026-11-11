<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Tool Call Card

**Agents** · Also in React

An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up

- **Element:** `<tc-tool-call-card>`, `<tc-tool-call-group>`
- **Size:** 13.4 KB gzip · 53.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tool-call-card";` |
| React / Next.js | `import { ToolCallCard, ToolCallGroup } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tool-call-card";` · tags starting with tc- are custom elements |
| Angular | `import { ToolCallCard, ToolCallGroup } from "@adamstavely/trenchcoat/angular/tool-call-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tool-call-card";` |

## Example

The live example is in the gallery at `#/tool-call-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One tool call of an AI agent in a single line: the tool's name, a plain summary of what it did, and its status – a
spinner with a live timer, a check with the duration, or “Failed”. People who want the details open it to see the
arguments and the result as highlighted JSON, each with a copy button; a failed call shows its error and, if you
allow it, a Retry button. `tc-tool-call-group` folds several calls into one line – “Used 3 tools · 5.2s” – so a chat
transcript stays readable.

### When to use

- Showing what an agent did between two messages, in a chat or a run log.
- Letting people check the exact arguments and output of a call without leaving the conversation.
- Several calls in a row – wrap them in `tc-tool-call-group` so they read as one step.

### When not to use

- Long command output from a sandbox, streamed line by line – use [Sandbox Log](sandbox-log.md).
- Timing a whole run step by step – use [Trace Waterfall](trace-waterfall.md).
- Asking permission before a tool runs – use [Permission Request](permission-request.md).
- The plan of steps an agent is working through – use [Agent Plan](agent-plan.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-tc__head` – the whole line; opens and closes the card
2. **Icon** `.ui-tc__icon` – the tool's mark in a tile, a wrench by default
3. **Name** `.ui-tc__name` – the tool name as the agent calls it, in mono
4. **Summary** `.ui-tc__summary` – what the call did, in plain words
5. **Status** `.ui-tc__status` – spinner and live timer, check and duration, or “Failed”
6. **Code** `.ui-tc__code` – the arguments or the result, highlighted, capped with “Show all” when long
7. **Group header** `.ui-tc-group__head` – the stacked icons, “Used 3 tools” and the total time

## Looks

Standard puts the tool's icon in a small bordered gray tile and divides the details from the header with a 1px
line. Clean drops the tile – a bare, muted 16px icon – and uses hairline dividers and a slightly taller header.
Both use the same status marks, timers and JSON colours, and the group's label shimmers while any call is running.

## Usage

### HTML

```html
<tc-tool-call-card id="search" name="search_web" status="running"></tc-tool-call-card>

<script type="module">
  import "@adamstavely/trenchcoat/tool-call-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#search");
  card.summary = "Searched the web for “CRM pricing 2026”";
  card.startedAt = Date.now();
  card.args = { query: "CRM pricing 2026", max_results: 3 };
  card.addEventListener("tc-open-change", (e) => console.log(e.detail.open));

  // Later, when the call returns
  card.result = { results: [{ title: "CRM pricing comparison 2026" }] };
  card.duration = 2400;
  card.status = "success";
</script>
```

### React / Next.js

```tsx
import { ToolCallCard, ToolCallGroup } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Calls({ retry }: { retry: () => Promise<void> }) {
  return (
    <ToolCallGroup>
      <ToolCallCard
        name="query_db"
        summary="Looked up 3 open deals"
        status="success"
        duration={1200}
        args={{ stage: "open", limit: 3 }}
        result={[{ id: 41, name: "Northwind" }]}
      />
      <ToolCallCard
        name="fetch_page"
        summary="Read the pricing page of attio.com"
        status="error"
        error="Request timed out after 1.5s"
        onRetry={retry}
      />
    </ToolCallGroup>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tool-call-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";

defineProps<{ summary: TcToolCallCard["summary"]; icon: TcToolCallCard["icon"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-tool-call-card :summary="summary" :icon="icon" @tc-open-change="onOpenChange"></tc-tool-call-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ToolCallCard } from "@adamstavely/trenchcoat/angular/tool-call-card";
import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";

@Component({
  selector: "app-tool-call-card-example",
  imports: [ToolCallCard],
  template: `<tc-tool-call-card [summary]="summary()" [icon]="icon()" (tc-open-change)="onOpenChange($event)"></tc-tool-call-card>`,
})
export class ToolCallCardExample {
  readonly summary = input.required<TcToolCallCard["summary"]>();
  readonly icon = input.required<TcToolCallCard["icon"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tool-call-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";

  let { summary, icon }: { summary: TcToolCallCard["summary"]; icon: TcToolCallCard["icon"] } = $props();
  let el: TcToolCallCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-tool-call-card bind:this={el} {summary} {icon}></tc-tool-call-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

### `<tc-tool-call-card>`

*One tool call of an AI agent: name, summary, status with a live timer, arguments and result.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `""` | Tool name as the agent calls it, shown in mono – e.g. "search_web" |
| `summary` | – | `string \| Element \| undefined` | `undefined` | Short human summary – text, or an element (cloned) |
| `icon` | – | `Element \| undefined` | `undefined` | Icon in the tile on the left (cloned) – defaults to a wrench |
| `status` | `status` | `ToolCallStatus` | `"success"` | "running" shows a spinner and a live timer, "success" a check and the duration, "error" "Failed" and the message |
| `args` | – | `unknown` | `undefined` | Arguments the tool was called with – objects are pretty-printed, JSON strings parsed |
| `result` | – | `unknown` | `undefined` | What the tool returned – objects are pretty-printed, JSON strings parsed, other text shown as is |
| `error` | `error` | `string \| undefined` | `undefined` | Error message, shown when status is "error" |
| `startedAt` | `started-at` | `number \| undefined` | `undefined` | When the call started (ms since epoch) – the live timer counts from here |
| `duration` | `duration` | `number \| undefined` | `undefined` | Final duration in ms – otherwise measured while the card shows "running" |
| `open` | `open` | `boolean` | `false` | Expanded. Changed by the user (and on an error) unless a tc-open-change listener calls preventDefault() |
| `openOnError` | `open-on-error` | `boolean` | `true` | Opens the card when the call fails and closes it again on the next run, unless someone toggled it |
| `onRetry` | – | `(() => void \| Promise<unknown>) \| undefined` | `undefined` | Shows a Retry button next to the error – may return a promise: Retry waits for it, a rejection is shown |
| `maxCodeHeight` | `max-code-height` | `number` | `220` | Height in px after which arguments and result are capped with a fade and "Show all" |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The card opens or closes – by the user or on an error ({ open: boolean }); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tool-call-card-code-bg` | `light-dark(#fafafa, #212123)` | standard, clean |
| `--tc-tool-call-card-error-bg` | `light-dark(rgba(217, 58, 43, 0.04), rgba(255, 110, 100, 0.07))` | standard, clean |
| `--tc-tool-call-card-tc-tile` | `light-dark(#f5f5f5, #1d1d20)` | standard |
| `--tc-tool-call-card-syntax-string` | `light-dark(rgba(0, 123, 172, 0.9), #5fc8e8)` | standard, clean |
| `--tc-tool-call-card-syntax-number` | `light-dark(#b25b0c, #f2a65a)` | standard, clean |
| `--tc-tool-call-card-syntax-literal` | `light-dark(#5b5bd6, #a5a5ff)` | clean |

#### Design tokens it reads (60)

`--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-violet-fg`

### `<tc-tool-call-group>`

*Several tool calls folded into one line: "Used 3 tools · 2.4s". The cards go in a `slot="list"` child (see above).*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string \| undefined` | `undefined` | Label once all calls are done – defaults to "Used 3 tools" |
| `runningLabel` | `running-label` | `string` | `"Using tools…"` | Label while any call is running |
| `duration` | `duration` | `number \| undefined` | `undefined` | Total duration in ms – otherwise the sum of the cards' durations, or the time measured while running |
| `open` | `open` | `boolean` | `false` | Expanded. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `cards` | – | `TcToolCallCard[]` | – | The cards in this group, in order |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The group opens or closes ({ open: boolean }); cancelable |

#### Slots

| Slot | Description |
| --- | --- |
| `list` | The body with the cards: `<div slot="list" class="ui-tc__body"><div class="ui-tc__clip"><div class="ui-tc-group__list">…` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tool-call-card-code-bg` | `light-dark(#fafafa, #212123)` | standard, clean |
| `--tc-tool-call-card-error-bg` | `light-dark(rgba(217, 58, 43, 0.04), rgba(255, 110, 100, 0.07))` | standard, clean |
| `--tc-tool-call-card-tc-tile` | `light-dark(#f5f5f5, #1d1d20)` | standard |
| `--tc-tool-call-card-syntax-string` | `light-dark(rgba(0, 123, 172, 0.9), #5fc8e8)` | standard, clean |
| `--tc-tool-call-card-syntax-number` | `light-dark(#b25b0c, #f2a65a)` | standard, clean |
| `--tc-tool-call-card-syntax-literal` | `light-dark(#5b5bd6, #a5a5ff)` | clean |

#### Design tokens it reads (60)

`--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-violet-fg`

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
| `summary` | `el.summary = …;` | `<… summary={…} />` | `<tc-tool-call-card :summary="…">` | `<tc-tool-call-card [summary]="…">` | `<tc-tool-call-card {summary}>` |
| `icon` | `el.icon = …;` | `<… icon={…} />` | `<tc-tool-call-card :icon="…">` | `<tc-tool-call-card [icon]="…">` | `<tc-tool-call-card {icon}>` |
| `args` | `el.args = …;` | `<… args={…} />` | `<tc-tool-call-card :args="…">` | `<tc-tool-call-card [args]="…">` | `<tc-tool-call-card {args}>` |
| `result` | `el.result = …;` | `<… result={…} />` | `<tc-tool-call-card :result="…">` | `<tc-tool-call-card [result]="…">` | `<tc-tool-call-card {result}>` |
| `onRetry` | `el.onRetry = …;` | `<… onRetry={…} />` | `<tc-tool-call-card :onRetry="…">` | `<tc-tool-call-card [onRetry]="…">` | `<tc-tool-call-card {onRetry}>` |

*Also attributes: `name`, `status`, `error`, `started-at`, `duration`, `open`, `open-on-error`, `max-code-height` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-tool-call-card id="tool-call-card"></tc-tool-call-card>

<script type="module">
  import "@adamstavely/trenchcoat/tool-call-card";

  const el = document.querySelector("#tool-call-card");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ToolCallCard } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ToolCallCard>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledToolCallCard({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <ToolCallCard {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/tool-call-card";
import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";

const props = defineProps<{ initial: TcToolCallCard["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcToolCallCard["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-tool-call-card :open="open" @tc-open-change="onOpenChange"></tc-tool-call-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ToolCallCard } from "@adamstavely/trenchcoat/angular/tool-call-card";
import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";

@Component({
  selector: "app-controlled-tool-call-card",
  imports: [ToolCallCard],
  template: `<tc-tool-call-card [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-tool-call-card>`,
})
export class ControlledToolCallCard {
  readonly initial = input.required<TcToolCallCard["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcToolCallCard["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tool-call-card";
  import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";

  let { initial }: { initial: TcToolCallCard["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcToolCallCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcToolCallCard["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-tool-call-card bind:this={el} {open}></tc-tool-call-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tool-call-card")` returns a `TcToolCallCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";`
- **React / Next.js:** Props: `import type { ToolCallCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ToolCallCard>`. The element class, for refs: `import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcToolCallCard["summary"]` with `import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";`
- **Angular:** The directive types the template: `[summary]` takes `TcToolCallCard["summary"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcToolCallCard } from "@adamstavely/trenchcoat/tool-call-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

#### ToolCallCard

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | Tool name as the agent calls it, shown in mono – e.g. "search_web" |
| `status` | `TcToolCallCard["status"]` | "running" shows a spinner and a live timer, "success" a check and the duration, "error" "Failed" and the message |
| `summary` | `React.ReactNode` | Short human summary – e.g. "Searched the web for 'CRM pricing 2026'" |
| `icon` | `React.ReactNode` | Icon in the tile on the left – defaults to a wrench |
| `defaultOpen` | `boolean` | Start expanded (uncontrolled) |
| `open` | `boolean` | Expanded state (controlled) |
| `onOpenChange` | `(open: boolean) => void` | Called when the card opens or closes – by a click, or on its own when the call fails |

*Renamed or hidden on the wrapper: `summary`, `icon`, `open`, `name`, `status`*

#### ToolCallGroup

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | ToolCallCard elements – the group reads their name, icon, status and duration |
| `defaultOpen` | `boolean` | Start expanded (uncontrolled) |
| `open` | `boolean` | Expanded state (controlled) |
| `onOpenChange` | `(open: boolean) => void` | Called when the group opens or closes |

*Renamed or hidden on the wrapper: `open`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On a header: opens or closes the card or the group |
| Tab | Moves to the next header; in an open card, through Copy, “Show all” and Retry |

A closed card's details are inert, so Tab skips them.

### Screen readers

The header is a button with `aria-expanded` and `aria-controls`; its name reads the tool name, the summary and the
status – “search_web Searched the web for ‘CRM pricing 2026’ 2.4s”, or “running” while the call runs (the ticking
timer is hidden). A status region announces the outcome once: “search_web finished” or “fetch_page failed: Request
timed out after 1.5s (ETIMEDOUT)”. Inside a group the cards stay quiet and the group says it for all of them:
“Used 3 tools, 1 failed”. The copy buttons are named “Copy arguments” and “Copy result” and confirm with “Copied”;
“Show all” has `aria-expanded`; a failed retry is an alert: “Retry failed: …”.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This component alone** | 45.4 KB | 11.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **53.4 KB** | **13.4 KB** |
| With Lit – the first component on a page | 76.1 KB | 20.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.8 ms** | the gallery demo's data, 42 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | re-render with the same data |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 9 React commits (clean), 9 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **9 timer callbacks/s** on screen, **nothing** scrolled away, **9 timer callbacks/s** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`, `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `IntersectionObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `name` is the tool's real identifier (`search_web`) – people who debug agents look for it.
- Write `summary` in the past tense, as what happened: “Searched the web for ‘CRM pricing 2026’”, “Read
  q4-targets.md”.
- Pass `error` as the message people can act on, not a stack trace; without one the card says “The tool call
  failed.”
- Use the group's `label` only when “Used 3 tools” doesn't fit – e.g. “Checked the pipeline”.

## Do and don't

### Do

- Set `startedAt` on a running call, so the timer counts from when it really started.
- Pass `duration` once a call finishes, for an exact time.
- Pass `onRetry` only when running the call again is safe; return a promise so Retry waits and reports a failure.

### Don't

- Don't open every card by default – the line is the point; keep `open` for the call people need to see.
- Don't put secrets in `args` – they are shown and copied as they are.
- Don't nest groups inside groups.

## Related

- [Sandbox Log](sandbox-log.md) – Command output from the agent's sandbox – a block per step with the command, exit code and time, streaming text in colour, copy and search, fast with long logs
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
