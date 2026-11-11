<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Fan-out Grid

**Agents**

One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover

- **Element:** `<tc-fan-out-grid>`
- **Size:** 12.1 KB gzip · 41.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/fan-out-grid";` |
| React / Next.js | `import { FanoutGrid } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/fan-out-grid";` · tags starting with tc- are custom elements |
| Angular | `import { FanOutGrid } from "@adamstavely/trenchcoat/angular/fan-out-grid";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/fan-out-grid";` |

## Example

The live example is in the gallery at `#/fan-out-grid`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One agent hands a big job to many workers, and every task is a cell on a grid that fills in as they get through
it. Cells are tinted by state – queued, running with a sweeping shine, retrying, done, failed – and the bar on top
counts what is done, what it cost and the time left. Pointing at a cell, or moving to it with the arrow keys, shows
the task's details; the counts under the grid filter it to one state, and failed tasks can be sent again together.
People see the shape of a large run at once and can still find the one task that went wrong.

### When to use

- Batch jobs an agent splits into dozens to thousands of similar tasks: enriching leads, tagging documents,
  checking pages.
- Showing progress, failures and cost of a run while it goes on, and what to retry when it ends.

### When not to use

- A queue of different jobs waiting for an agent – use [Agent Queue](agent-queue.md).
- A few attempts at the same task, compared side by side – use [Parallel Attempts](parallel-attempts.md).
- A handful of dependent steps with planned times – use [Plan vs Actual](plan-vs-actual.md).
- Assigning work between agents and people – use [Delegate Board](delegate-board.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the title, the job, done of total, the cost and the time left
2. **Grid** `.ui-fog__grid` – every task as a cell, tinted by its state
3. **Cell** `.ui-fog__cell` – one task; hover, focus or click shows its details
4. **Details** `.ui-fog__tip` – the task's label and state, worker, time, cost, attempts, and its result or error
5. **Counts** `.ui-fog__legend` – done, running, retrying and failed; each one filters the grid
6. **Retry failed** `.ui-fog__retry` – sends the failed tasks again, while some have failed

## Looks

Standard puts the header on the gray tray above the grid's white card, with the counts and Retry on the tray under it.
Clean has no tray: one white card, the header as its first row, then the grid with the counts as a quiet line under
it. The cells, states and keys are the same in both.

## Usage

### HTML

```html
<tc-fan-out-grid id="job" heading="Lead enrichment" job="Enrich 3 leads"></tc-fan-out-grid>

<script type="module">
  import "@adamstavely/trenchcoat/fan-out-grid";
  import "@adamstavely/trenchcoat/tokens.css";

  const grid = document.querySelector("#job");
  grid.tasks = [
    { id: "t1", label: "northwind.io", status: "done", start: 0, end: 4200, cost: 0.012, result: "Found 3 contacts" },
    { id: "t2", label: "acme.dev", status: "failed", start: 0, end: 3100, error: "Site blocked the crawler" },
    { id: "t3", label: "globex.com", status: "running", start: 3100, worker: "Researcher 2" },
  ];
  grid.elapsed = 5000;
  grid.onRetry = (ids) => console.log("retry", ids);
  grid.addEventListener("tc-select", (e) => console.log(e.detail.task));
</script>
```

### React / Next.js

```tsx
import { FanoutGrid, type FanoutTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Enrichment({ tasks, elapsed, retry }: { tasks: FanoutTask[]; elapsed: number; retry: (ids: string[]) => Promise<void> }) {
  return <FanoutGrid title="Lead enrichment" job={`Enrich ${tasks.length} leads`} tasks={tasks} elapsed={elapsed} workers={8} onRetry={retry} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/fan-out-grid";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";

defineProps<{ tasks: TcFanOutGrid["tasks"]; selected: TcFanOutGrid["selected"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-fan-out-grid :tasks="tasks" :selected="selected" @tc-selected-change="onSelectedChange"></tc-fan-out-grid>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FanOutGrid } from "@adamstavely/trenchcoat/angular/fan-out-grid";
import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";

@Component({
  selector: "app-fan-out-grid-example",
  imports: [FanOutGrid],
  template: `<tc-fan-out-grid [tasks]="tasks()" [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-fan-out-grid>`,
})
export class FanOutGridExample {
  readonly tasks = input.required<TcFanOutGrid["tasks"]>();
  readonly selected = input.required<TcFanOutGrid["selected"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/fan-out-grid";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";

  let { tasks, selected }: { tasks: TcFanOutGrid["tasks"]; selected: TcFanOutGrid["selected"] } = $props();
  let el: TcFanOutGrid;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-fan-out-grid bind:this={el} {tasks} {selected}></tc-fan-out-grid>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `tasks` | – | `FanoutTask[]` | `[]` | Every task in the job, one cell each, in order – its label, state, worker, times, cost, result or error |
| `job` | `job` | `string` | `""` | What the whole job does – e.g. "Enrich 240 leads" |
| `workers` | `workers` | `number \| undefined` | `undefined` | How many workers run at once – used for the time left (defaults to the tasks running now) |
| `now` | `now` | `number \| undefined` | `undefined` | The clock, in epoch ms – without it (and without `elapsed`) the element reads the clock and ticks while tasks run |
| `startedAt` | `started-at` | `number \| undefined` | `undefined` | When the job started, in epoch ms – defaults to the earliest task start |
| `elapsed` | `elapsed` | `number \| undefined` | `undefined` | The clock as ms from the start of the job; task start/end are then job-relative too. Wins over `now` |
| `onRetry` | – | `((ids: string[]) => void \| Promise<unknown>) \| undefined` | `undefined` | "Retry failed" sends the failed tasks' ids here – unset, the button doesn't show. A promise holds the button while it runs; a rejection says so and the button stays to try again |
| `selected` | – | `string \| null` | `null` | The id of the task whose window is kept open (null: none). Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `filter` | – | `FanoutStatus \| null` | `null` | The state every other cell steps back from (null: none). Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – defaults to dollars, e.g. "$0.014" |
| `heading` | `heading` | `string` | `"Fan-out"` | The title in the header |
| `icon` | – | `Element \| undefined` | `undefined` | The header's icon (cloned); unset shows the default |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | The task kept open changes ({ selected: string \| null }); cancelable |
| `tc-filter-change` | – | Yes | The state filter changes ({ filter: FanoutStatus \| null }); cancelable |
| `tc-select` | – | No | A task was picked with a click or Enter, or let go ({ task: FanoutTask \| null }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-fan-out-grid-cell` | `12px` | both |
| `--tc-fan-out-grid-gap` | `12px` | both |

#### Design tokens it reads (89)

`--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fan-out-grid-status-bg`, `--tc-fan-out-grid-status-edge`, `--tc-fan-out-grid-status-fill`, `--tc-fan-out-grid-status-ink`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-fan-out-grid :tasks="…">` | `<tc-fan-out-grid [tasks]="…">` | `<tc-fan-out-grid {tasks}>` |
| `onRetry` | `el.onRetry = …;` | `<… onRetry={…} />` | `<tc-fan-out-grid :onRetry="…">` | `<tc-fan-out-grid [onRetry]="…">` | `<tc-fan-out-grid {onRetry}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-fan-out-grid :selected="…">` | `<tc-fan-out-grid [selected]="…">` | `<tc-fan-out-grid {selected}>` |
| `filter` | `el.filter = …;` | `<… filter={…} />` | `<tc-fan-out-grid :filter="…">` | `<tc-fan-out-grid [filter]="…">` | `<tc-fan-out-grid {filter}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-fan-out-grid :formatCost="…">` | `<tc-fan-out-grid [formatCost]="…">` | `<tc-fan-out-grid {formatCost}>` |
| `icon` | `el.icon = …;` | `<… icon={…} />` | `<tc-fan-out-grid :icon="…">` | `<tc-fan-out-grid [icon]="…">` | `<tc-fan-out-grid {icon}>` |

*Also attributes: `job`, `workers`, `now`, `started-at`, `elapsed`, `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-select` | No | `el.addEventListener("tc-select", (e) => …)` | `onSelect={…}` | `@tc-select="…"` | `(tc-select)="…($event)"` | `el.addEventListener("tc-select", …)` |

### Controlled

The element changes `selected` and `filter` itself unless a listener calls `preventDefault()` on `tc-selected-change` or `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-fan-out-grid id="fan-out-grid"></tc-fan-out-grid>

<script type="module">
  import "@adamstavely/trenchcoat/fan-out-grid";

  const el = document.querySelector("#fan-out-grid");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { FanoutGrid } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof FanoutGrid>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledFanOutGrid({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <FanoutGrid {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/fan-out-grid";
import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";

const props = defineProps<{ initial: TcFanOutGrid["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcFanOutGrid["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-fan-out-grid :selected="selected" @tc-selected-change="onSelectedChange"></tc-fan-out-grid>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FanOutGrid } from "@adamstavely/trenchcoat/angular/fan-out-grid";
import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";

@Component({
  selector: "app-controlled-fan-out-grid",
  imports: [FanOutGrid],
  template: `<tc-fan-out-grid [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-fan-out-grid>`,
})
export class ControlledFanOutGrid {
  readonly initial = input.required<TcFanOutGrid["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcFanOutGrid["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/fan-out-grid";
  import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";

  let { initial }: { initial: TcFanOutGrid["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcFanOutGrid;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcFanOutGrid["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-fan-out-grid bind:this={el} {selected}></tc-fan-out-grid>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-fan-out-grid")` returns a `TcFanOutGrid` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";`
- **React / Next.js:** Props: `import type { FanoutGridProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FanoutGrid>`. The element class, for refs: `import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFanOutGrid["tasks"]` with `import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";`
- **Angular:** The directive types the template: `[tasks]` takes `TcFanOutGrid["tasks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFanOutGrid } from "@adamstavely/trenchcoat/fan-out-grid";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `tasks` | `FanoutTask[]` | Every task in the job, one cell each, in order – its label, state, worker, times, cost, result or error |
| `job` | `string` | What the whole job does – e.g. "Enrich 240 leads" |
| `selected` | `string \| null` | The id of the task whose window is kept open. Controlled when defined (null: none) |
| `defaultSelected` | `string \| null` | The task kept open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(id: string \| null) => void` | Called with the id of the task kept open (null when let go), controlled or not |
| `onSelect` | `(task: FanoutTask \| null) => void` | A task was picked (click or Enter) – null when it's let go |
| `filter` | `FanoutStatus \| null` | The state every other cell steps back from. Controlled when defined (null: no filter) |
| `defaultFilter` | `FanoutStatus \| null` | The filter on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: FanoutStatus \| null) => void` | Called with the new filter, controlled or not |
| `title` | `string` | The title on the bar (default "Fan-out") |
| `icon` | `React.ReactNode` | A small mark before the title, e.g. the agent's logo |

*Renamed or hidden on the wrapper: `heading`, `icon`, `selected`, `filter`, `onSelect`, `job`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the grid – on the kept task, or the first – and on to the counts and Retry failed |
| ← / → / ↑ / ↓ | Moves from cell to cell, row by row; the details follow |
| Home / End | Moves to the first or last task |
| Enter / Space | Keeps the task's details open, or lets them go |
| Escape | Closes the details and lets go of the kept task; with the pointer on a cell, hides its details |

### Screen readers

The grid is a listbox named with the number of tasks and how to use it (“140 tasks – arrow keys move, Enter keeps the
details”), with the active cell given by `aria-activedescendant` and the details as its description. Each cell is an
option named with its label and state (“northwind.io, failed”); the kept task is `aria-selected`. The counts are
toggle buttons in a group named “Show only”. A polite live region reports progress in steps of ten percent (“40% of
140 tasks done.”) and then the result (“Finished: 132 done, 8 failed, $1.84.”). If Retry failed fails, an alert says
“Couldn't retry the failed tasks.”

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

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
| **This component alone** | 32.2 KB | 9.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **41.4 KB** | **12.1 KB** |
| With Lit – the first component on a page | 64.1 KB | 19.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **6.6 ms** | the gallery demo's data, 176 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of tasks replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.5 ms | tasks: first render, 136 nodes; update 0.4 ms |
| 1,000 items | 35 ms | tasks: first render, 1,036 nodes; update 2.5 ms |

1,000 items of tasks: 35 ms, 1,036 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 36 React commits (clean), 36 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`, `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document keydown`, `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Label tasks with the thing they work on, as short as it can be: a domain, a file name, an id people recognise.
- Write `error` as what went wrong, in a few words – “Site blocked the crawler”, not a stack trace.
- Write `result` as one line of what came out: “Found 3 contacts”.
- Name `job` with a verb and the number: “Enrich 240 leads”.

## Do and don't

### Do

- Pass `workers` so the time left counts what really runs at once.
- Set `onRetry` when failed tasks can be run again; return a promise so the button waits while it runs.
- Pass `elapsed` from the job's own clock, so the grid and the job agree.

### Don't

- Don't use it for fewer than about twenty tasks – a list says more.
- Don't change task ids as they are retried – the cell would jump and lose its place.
- Don't hide failures behind a filter by default; let people choose to look away.

## Related

- [Agent Queue](agent-queue.md) – The work waiting for your agents, and how fast it moves – jobs drop into a live queue, glide into free worker slots as growing bars and land in Done or Failed, while a depth chart shows the backlog build up when a rate limit pauses the workers and drain when they resume
- [Parallel Attempts](parallel-attempts.md) – An agent tries the same task several ways at once and the best one wins – every attempt races as a row with its model, approach and live bar, then gets a score; the best is marked and picked, and you can switch to another
- [Plan vs Actual](plan-vs-actual.md) – An agent's plan against what really happens – every step's bar grows over its dashed planned ghost, overruns turn amber, the steps after it slide right, and the expected finish moves away from the planned one
- [Delegate Board](delegate-board.md) – Hand work to your agents by dragging it onto them – each agent previews its new “busy until” time, or switch to Auto and every new task goes to whoever is free first

## Changelog

- fan-out-grid cells and agent-queue backlog squares stay 12 px but sit 24 px apart, and each takes clicks across 24 px (WCAG 2.5.8) – the grids show fewer items per row.
