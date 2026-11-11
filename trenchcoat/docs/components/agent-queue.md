<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Queue

**Agents**

The work waiting for your agents, and how fast it moves – jobs drop into a live queue, glide into free worker slots as growing bars and land in Done or Failed, while a depth chart shows the backlog build up when a rate limit pauses the workers and drain when they resume

- **Element:** `<tc-agent-queue>`
- **Size:** 23.1 KB gzip · 99.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-queue";` |
| React / Next.js | `import { AgentQueue } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-queue";` · tags starting with tc- are custom elements |
| Angular | `import { AgentQueue } from "@adamstavely/trenchcoat/angular/agent-queue";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-queue";` |

## Example

The live example is in the gallery at `#/agent-queue`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The work waiting for your agents, and how fast it moves. Jobs wait in a queue on the left, a free worker pulls the
front one and runs it as a growing bar, and it lands in Done – or flashes into Failed, or goes back in the queue to
retry. Above the flow, four numbers say how it's going (Waiting, Running, Throughput, Wait p95); below it, a chart of
the queue depth over the last minutes shows the backlog build up while the provider rate-limits the workers and
drain when they resume. People can point at or focus any job for its details, pin its card, move it to the front or
cancel it, and pause the queue or change the number of workers.

### When to use

- Monitoring a pool of agent workers that pull from a shared queue – LLM calls, tool calls, sub-agents, reviews.
- Showing rate limits and backpressure as they happen, so people can see why work is slow.
- Operating the queue: pausing it, adding workers, promoting or cancelling a job.

### When not to use

- One big job split across many parallel tasks, shown as a grid that fills in – use [Fan-out Grid](fan-out-grid.md).
- What each agent is doing over time, with hand-offs between them – use [Agent Lanes](agent-lanes.md).
- Spend and token limits for a run – use [Budget Guard](budget-guard.md).
- A list of background tasks people review and act on one by one – use [Agent Inbox](agent-inbox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Numbers** `.ui-agq__stats` – Waiting, Running, Throughput and Wait p95
3. **Job** `.ui-agq__job` – a waiting card or a running bar; the rest of the backlog is a heap of squares
4. **Worker** `.ui-agq__slot` – one worker and the job it's running, or Idle / Paused
5. **Done and Failed** `.ui-agq__bin` – where finished jobs land, with their counts
6. **Depth chart** `.ui-agq__chart` – waiting jobs over the last minutes, rate-limited stretches and the backpressure line

## Looks

Standard sets the flow and the chart in a white card on the gray tray, with the header on the tray above it. Clean
is one quiet white card with hairlines between its parts. Jobs move, flash and land the same way in both, and the
workers turn amber with a countdown in both while a rate limit is active.

## Usage

### HTML

```html
<tc-agent-queue id="queue" name="support-automation" pausable stepper backpressure="14"></tc-agent-queue>

<script type="module">
  import "@adamstavely/trenchcoat/agent-queue";
  import "@adamstavely/trenchcoat/tokens.css";

  const queue = document.querySelector("#queue");
  queue.workers = [{ id: "w1", name: "Sonnet" }, { id: "w2", name: "Haiku" }];
  queue.jobs = [
    { id: "j1", name: "Summarise ticket", kind: "llm", status: "running", worker: "w1", enqueuedAt: Date.now() - 9000, startedAt: Date.now() - 4000, estimate: 8000 },
    { id: "j2", name: "Refund check", kind: "tool", status: "queued", enqueuedAt: Date.now() - 3000 },
  ];
  queue.addEventListener("tc-paused-change", (e) => fetch("/api/queue", { method: "PATCH", body: JSON.stringify({ paused: e.detail.paused }) }));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AgentQueue, type QueueJob, type QueueWorker } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const workers: QueueWorker[] = [{ id: "w1", name: "Sonnet" }, { id: "w2", name: "Haiku" }];

export function Queue({ jobs }: { jobs: QueueJob[] }) {
  const [paused, setPaused] = useState(false);
  return (
    <AgentQueue
      title="Queue"
      name="support-automation"
      jobs={jobs}
      workers={workers}
      paused={paused}
      onPausedChange={setPaused}
      backpressure={14}
      onCancel={(job) => fetch(`/api/jobs/${job.id}`, { method: "DELETE" })}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-queue";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";

defineProps<{ jobs: TcAgentQueue["jobs"]; workers: TcAgentQueue["workers"] }>();
const onPausedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-queue :jobs="jobs" :workers="workers" @tc-paused-change="onPausedChange"></tc-agent-queue>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentQueue } from "@adamstavely/trenchcoat/angular/agent-queue";
import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";

@Component({
  selector: "app-agent-queue-example",
  imports: [AgentQueue],
  template: `<tc-agent-queue [jobs]="jobs()" [workers]="workers()" (tc-paused-change)="onPausedChange($event)"></tc-agent-queue>`,
})
export class AgentQueueExample {
  readonly jobs = input.required<TcAgentQueue["jobs"]>();
  readonly workers = input.required<TcAgentQueue["workers"]>();
  onPausedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-queue";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";

  let { jobs, workers }: { jobs: TcAgentQueue["jobs"]; workers: TcAgentQueue["workers"] } = $props();
  let el: TcAgentQueue;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-agent-queue bind:this={el} {jobs} {workers}></tc-agent-queue>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `jobs` | – | `QueueJob[]` | `[]` | Waiting and running jobs, plus finished ones for as long as the chart should count them |
| `workers` | – | `QueueWorker[]` | `[]` | The worker slots – their number is the concurrency |
| `now` | `now` | `number \| undefined` | `undefined` | The clock in epoch ms – unset, the element keeps its own while there is work |
| `rateLimits` | – | `QueueRateLimit[]` | `[]` | Stretches when the provider rate-limits – while one is active the workers show as paused |
| `paused` | `paused` | `boolean` | `false` | The queue is paused – no new jobs start |
| `pausable` | `pausable` | `boolean` | `false` | Shows a Pause/Resume button |
| `stepper` | `stepper` | `boolean` | `false` | Shows a – N + stepper for the number of workers |
| `minConcurrency` | `min-concurrency` | `number` | `1` | The fewest workers the stepper allows – its – button is disabled at this number |
| `maxConcurrency` | `max-concurrency` | `number` | `8` | The most workers the stepper allows – its + button is disabled at this number |
| `backpressure` | `backpressure` | `number \| undefined` | `undefined` | A depth that means trouble – drawn as a dashed line on the chart; above it Waiting turns amber |
| `range` | `range` | `` | – | How far back the chart looks, in ms |
| `totals` | – | `{ done?: number; failed?: number } \| undefined` | `undefined` | Counts since the start, when `jobs` only holds the recent ones |
| `openId` | – | `string \| null` | `null` | The id of the job whose card is pinned, or null |
| `promotable` | `promotable` | `boolean` | `false` | Shows "Move to front" in a waiting job's card |
| `cancellable` | `cancellable` | `boolean` | `false` | Shows "Cancel" in a waiting or running job's card |
| `heading` | `heading` | `string` | `"Queue"` | The heading at the top of the card |
| `name` | `name` | `string \| undefined` | `undefined` | The queue's name, muted next to the heading |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-paused-change` | – | Yes | Pause or Resume was pressed ({ paused: boolean }); cancelable |
| `tc-concurrency-change` | – | No | The worker stepper asked for more or fewer workers ({ workers: number }) |
| `tc-open-change` | – | Yes | A job's card was pinned or closed ({ id: string \| null, job?: QueueJob }); cancelable |
| `tc-promote` | – | No | Move to front was pressed in a waiting job's card ({ job: QueueJob }) |
| `tc-cancel` | – | No | Cancel was pressed in a job's card ({ job: QueueJob }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-queue-agent-bg` | `light-dark(#eef0f3, #2c2f35)` | standard |
| `--tc-agent-queue-agent-edge` | `light-dark(#d3d8e0, #41464f)` | standard |
| `--tc-agent-queue-agent-ink` | `light-dark(#4b5363, #b8c0cc)` | standard |
| `--tc-agent-queue-agent-sq` | `light-dark(#d9dde4, #3a3e46)` | standard |
| `--tc-agent-queue-llm-bg` | `light-dark(rgba(91, 91, 214, 0.1), rgba(130, 130, 255, 0.16))` | standard, clean |
| `--tc-agent-queue-llm-edge` | `light-dark(rgba(91, 91, 214, 0.3), rgba(130, 130, 255, 0.38))` | standard, clean |
| `--tc-agent-queue-llm-ink` | `light-dark(#4a4ac2, #b1a9ff)` | standard, clean |
| `--tc-agent-queue-llm-sq` | `light-dark(rgba(91, 91, 214, 0.22), rgba(130, 130, 255, 0.34))` | standard, clean |
| `--tc-agent-queue-tool-bg` | `light-dark(rgba(0, 123, 172, 0.085), rgba(0, 170, 220, 0.13))` | standard, clean |
| `--tc-agent-queue-tool-edge` | `light-dark(rgba(0, 123, 172, 0.28), rgba(0, 170, 220, 0.34))` | standard, clean |
| `--tc-agent-queue-tool-ink` | `light-dark(#006a94, #4ccce6)` | standard, clean |
| `--tc-agent-queue-tool-sq` | `light-dark(rgba(0, 123, 172, 0.2), rgba(0, 170, 220, 0.3))` | standard, clean |
| `--tc-agent-queue-human-bg` | `light-dark(rgba(0, 96, 226, 0.08), rgba(60, 140, 255, 0.14))` | standard, clean |
| `--tc-agent-queue-human-edge` | `light-dark(rgba(0, 96, 226, 0.26), rgba(60, 140, 255, 0.36))` | standard, clean |
| `--tc-agent-queue-human-ink` | `light-dark(#0055c8, #70b8ff)` | standard, clean |
| `--tc-agent-queue-human-sq` | `light-dark(rgba(0, 96, 226, 0.18), rgba(60, 140, 255, 0.3))` | standard, clean |
| `--tc-agent-queue-tray-bg` | `var(--tc-surface-tray)` | standard |
| `--tc-agent-queue-card-bg` | `var(--tc-surface-on-tray)` | standard |
| `--tc-agent-queue-well-bg` | `light-dark(#fafafa, #1f1f22)` | standard |
| `--tc-agent-queue-depth` | `light-dark(rgba(91, 91, 214, 0.9), rgba(150, 150, 255, 0.95))` | standard, clean |
| `--tc-agent-queue-depth-fill` | `light-dark(rgba(91, 91, 214, 0.14), rgba(130, 130, 255, 0.22))` | standard, clean |
| `--tc-agent-queue-depth-fade` | `light-dark(rgba(91, 91, 214, 0), rgba(130, 130, 255, 0))` | standard, clean |
| `--tc-agent-queue-rail-stripe` | `light-dark(rgba(0, 0, 0, 0.022), rgba(255, 255, 255, 0.025))` | standard, clean |

#### Design tokens it reads (119)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-agent-queue-sheen`, `--tc-agent-queue-ymax`, `--tc-avatar-md`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-reveal-slow`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-emphasized`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-success-bg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-caps`, `--tc-tracking-normal`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `jobs` | `el.jobs = …;` | `<… jobs={…} />` | `<tc-agent-queue :jobs="…">` | `<tc-agent-queue [jobs]="…">` | `<tc-agent-queue {jobs}>` |
| `workers` | `el.workers = …;` | `<… workers={…} />` | `<tc-agent-queue :workers="…">` | `<tc-agent-queue [workers]="…">` | `<tc-agent-queue {workers}>` |
| `rateLimits` | `el.rateLimits = …;` | `<… rateLimits={…} />` | `<tc-agent-queue :rateLimits="…">` | `<tc-agent-queue [rateLimits]="…">` | `<tc-agent-queue {rateLimits}>` |
| `totals` | `el.totals = …;` | `<… totals={…} />` | `<tc-agent-queue :totals="…">` | `<tc-agent-queue [totals]="…">` | `<tc-agent-queue {totals}>` |
| `openId` | `el.openId = …;` | `<… openId={…} />` | `<tc-agent-queue :openId="…">` | `<tc-agent-queue [openId]="…">` | `<tc-agent-queue {openId}>` |

*Also attributes: `now`, `paused`, `pausable`, `stepper`, `min-concurrency`, `max-concurrency`, `backpressure`, `range` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-paused-change` | Yes | `el.addEventListener("tc-paused-change", (e) => …)` | `ref.current.addEventListener("tc-paused-change", …)` | `@tc-paused-change="…"` | `(tc-paused-change)="…($event)"` | `el.addEventListener("tc-paused-change", …)` |
| `tc-concurrency-change` | No | `el.addEventListener("tc-concurrency-change", (e) => …)` | `onConcurrencyChange={…}` | `@tc-concurrency-change="…"` | `(tc-concurrency-change)="…($event)"` | `el.addEventListener("tc-concurrency-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-promote` | No | `el.addEventListener("tc-promote", (e) => …)` | `onPromote={…}` | `@tc-promote="…"` | `(tc-promote)="…($event)"` | `el.addEventListener("tc-promote", …)` |
| `tc-cancel` | No | `el.addEventListener("tc-cancel", (e) => …)` | `onCancel={…}` | `@tc-cancel="…"` | `(tc-cancel)="…($event)"` | `el.addEventListener("tc-cancel", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `paused` itself unless a listener calls `preventDefault()` on `tc-paused-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-queue id="agent-queue"></tc-agent-queue>

<script type="module">
  import "@adamstavely/trenchcoat/agent-queue";

  const el = document.querySelector("#agent-queue");
  el.addEventListener("tc-paused-change", (e) => {
    e.preventDefault(); // the element keeps its paused…
    if (allowed(e.detail.paused)) el.paused = e.detail.paused; // …until the app sets it
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
import "@adamstavely/trenchcoat/agent-queue";
import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";

const props = defineProps<{ initial: TcAgentQueue["paused"] }>();
const paused = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPausedChange = (e: CustomEvent<{ paused: TcAgentQueue["paused"] }>) => {
  e.preventDefault();
  paused.value = e.detail.paused;
};
</script>

<template>
  <tc-agent-queue :paused="paused" @tc-paused-change="onPausedChange"></tc-agent-queue>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentQueue } from "@adamstavely/trenchcoat/angular/agent-queue";
import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";

@Component({
  selector: "app-controlled-agent-queue",
  imports: [AgentQueue],
  template: `<tc-agent-queue [paused]="paused()" (tc-paused-change)="onPausedChange($event)"></tc-agent-queue>`,
})
export class ControlledAgentQueue {
  readonly initial = input.required<TcAgentQueue["paused"]>();
  readonly paused = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPausedChange(e: CustomEvent<{ paused: TcAgentQueue["paused"] }>) {
    e.preventDefault();
    this.paused.set(e.detail.paused);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-queue";
  import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";

  let { initial }: { initial: TcAgentQueue["paused"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let paused = $derived(initial);
  let el: TcAgentQueue;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      paused = (e as CustomEvent<{ paused: TcAgentQueue["paused"] }>).detail.paused;
    };
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-agent-queue bind:this={el} {paused}></tc-agent-queue>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-queue")` returns a `TcAgentQueue` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";`
- **React / Next.js:** Props: `import type { AgentQueueProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentQueue>`. The element class, for refs: `import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentQueue["jobs"]` with `import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";`
- **Angular:** The directive types the template: `[jobs]` takes `TcAgentQueue["jobs"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentQueue } from "@adamstavely/trenchcoat/agent-queue";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `jobs` | `QueueJob[]` | Waiting and running jobs, plus finished ones for as long as the chart should count them |
| `workers` | `QueueWorker[]` | The worker slots – their number is the concurrency |
| `paused` | `boolean` | The queue is paused – no new jobs start. Controlled when defined; otherwise the component keeps it, starting from `defaultPaused` |
| `defaultPaused` | `boolean` | Whether the queue starts paused when `paused` isn't controlled |
| `onPausedChange` | `(paused: boolean) => void` | Shows a Pause/Resume button, and hears every change |
| `onConcurrencyChange` | `(workers: number) => void` | Shows a – N + stepper for the number of workers |
| `window` | `number` | How far back the chart looks, in ms (default 2 minutes) |
| `openId` | `string \| null` | The id of the job whose card is pinned. Controlled when defined (null = none); otherwise the component keeps it, starting from `defaultOpenId` |
| `defaultOpenId` | `string \| null` | The job whose card starts pinned when `openId` isn't controlled |
| `onOpenChange` | `(id: string \| null, job?: QueueJob) => void` | Called when a job's card is pinned or closed, with its id (null when closed) and the job |
| `onPromote` | `(job: QueueJob) => void` | Shows "Move to front" in a waiting job's card |
| `onCancel` | `(job: QueueJob) => void` | Shows "Cancel" in a waiting or running job's card |
| `title` | `string` | The heading at the top of the card (the element's `heading`) |

*Renamed or hidden on the wrapper: `jobs`, `workers`, `paused`, `pausable`, `stepper`, `openId`, `promotable`, `cancellable`, `heading`, `range`*

## Accessibility

### Keyboard

The jobs are one tab stop; the arrows walk through the running jobs, then the queue.

| Key | What it does |
|---|---|
| Tab | Moves to the jobs (the last one used), then to the pinned card, if any |
| → / ↓ | Moves to the next job |
| ← / ↑ | Moves to the previous job |
| Home / End | Moves to the first or the last job |
| Enter / Space | Pins the focused job's card, or closes it again |
| Escape | Closes the pinned card (from the job or inside the card); otherwise hides the hover card |

Focusing a job shows the same small card as hovering it. Pause, Resume and the – / + worker buttons are ordinary
buttons in the header.

### Screen readers

Each job is a button whose name starts with what it shows and adds what it is and where it stands – “Summarise
ticket 12s, LLM call, waiting 12s, position 3 of 9, high priority” – with `aria-haspopup="dialog"` and
`aria-expanded` for its card. The jobs sit in a group named “Jobs: 3 running, 9 waiting”. A hovered or focused card
is a `tooltip`; a pinned one is a `dialog` named “Summarise ticket details” with a “Close details” button. The chart
is an image described in words: “Queue depth over the last 2 min: 9 waiting now, peak 14, average 6.2, rate limited
once.” A polite live region reports what matters as it happens – “Rate limited – workers paused for 20 seconds”,
“Rate limit lifted – workers resumed”, “18 jobs waiting – above the backpressure line of 14”, a failure with its
error, and “failed – retrying, attempt 2 of 3”. Pause is a toggle button named “Pause the queue” or “Resume the
queue”; the stepper is a group named “Workers” whose count is announced as it changes.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This component alone** | 90.6 KB | 20.3 KB |
| Lit · the library every element is built on, the parts it uses | 23.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **99.1 KB** | **23.1 KB** |
| With Lit – the first component on a page | 124.1 KB | 31.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.1 ms** | the gallery demo's data, 196 DOM nodes – to layout, median of 7 |
| Typical update | **1.4 ms** | one item of jobs replaced |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |
| 100 items | 17 ms | jobs: first render, 755 nodes; update 1.3 ms |
| 1,000 items | 68 ms | jobs: first render, 4,059 nodes; update 4.2 ms |

1,000 items of jobs: 68 ms. It renders every item, so a first render passes 50 ms (a long task) at about 740 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 14 React commits (clean), 16 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **60 frames/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange`, `window keydown`, `document pointerdown`.
- Reads the clock: `Date.now()`, `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name jobs by what they do, in a few words: “Summarise ticket”, “Refund check” – the name is what people see on a
  small card.
- Use `detail` for the source, target or model, and `error` for what went wrong in plain words.
- Set `name` to the queue's own name (“support-automation”) when there's more than one.
- Name workers by agent or model, so a running bar says who's on it.

## Do and don't

### Do

- Set `backpressure` to the depth that means trouble – above it, Waiting turns amber and the line shows on the chart.
- Pass `rateLimits` with the provider's real windows, so the pause and countdown match what's happening.
- Keep finished jobs in `jobs` for the chart's window, or pass `totals` for counts since the start.

### Don't

- Don't use it for a handful of one-off tasks – a list says more.
- Don't move jobs between statuses faster than people can follow; update a few times a second at most.
- Don't hide failures by removing failed jobs straight away – let them land in Failed.

## Related

- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
