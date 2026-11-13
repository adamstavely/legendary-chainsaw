<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Run Log

**Agents** · New

Every agent run on one line – status as a mark and a word, agent, trigger, when, duration, steps, tokens, cost and user; status, agent and trigger chips, search and a time range, failed runs that open to their error, and in live mode new runs held behind "Show 3 new runs" instead of shifting the list

- **Element:** `<tc-run-log>`
- **Size:** 10.1 KB gzip · 32.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/run-log";` |
| React / Next.js | `import { RunLog } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/run-log";` · tags starting with tc- are custom elements |
| Angular | `import { RunLog } from "@adamstavely/trenchcoat/angular/run-log";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/run-log";` |

## Example

The live example is in the gallery at `#/run-log`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Every agent run on one line: its status as a mark and a word, the agent, what started it, when, how long it took, its
steps, tokens and cost, and who it ran for. Chips filter by status, agent and trigger, a search matches any text on the
line, and a time range keeps the recent ones. A failed run opens in place to its error, and Enter opens the run itself.
With `live`, runs that arrive after the first render wait behind "Show 3 new runs" – announced, but never pushing the
rows the reader is looking at – until they're let in.

### When to use

- The run history of a workspace or of one agent, where people look for what failed and when.
- An operations page that keeps receiving runs, with `live`, so the list doesn't jump under the reader.
- Finding a run by its id, user or error text before opening its trace.

### When not to use

- Runs that need a person's answer – use [Agent Inbox](agent-inbox.md).
- One run's steps and timing – use [Trace Waterfall](trace-waterfall.md).
- What one run cost, line by line – use [Run Receipt](run-receipt.md).
- A general table of records – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Search and range** `.ui-runl__tools` – the search field `.ui-runl__query` and the time range `.ui-runl__range`
2. **Filters** `.ui-runl__filters` – chip groups `.ui-runl__chips` for status, agent and trigger, each chip `.ui-runl__chip` with its count
3. **Show new** `.ui-runl__new` – in live mode, how many runs are waiting
4. **Header row** `.ui-runl__head` – the column names
5. **Run** `.ui-runl__row` – status `.ui-runl__status` with its mark `.ui-runl__mark`, agent `.ui-runl__agent`, trigger `.ui-runl__trigger`, started `.ui-runl__started`, duration, steps, tokens, cost `.ui-runl__cost` and user `.ui-runl__user`
6. **Error** `.ui-runl__error` – a failed run's error, under its line
7. **Footer** `.ui-runl__foot` – how many runs show, how many failed and what they cost
8. **Empty** `.ui-runl__empty` – "No runs yet", or "No runs match" with Clear filters `.ui-runl__clear`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Each status has a mark and a word as well as a colour: a check for Succeeded, a cross for Failed, a dot for
Running and Queued, a slash for Cancelled. Failed runs have a chevron that turns when their error is open, and the error
sits on a red-tinted row in a monospace face. A page can set `--tc-runl-cols` and `--tc-runl-cols-narrow`, the column
widths, and `--tc-runl-icon`. When the card is narrower than 560 px only status, agent, started and cost show.

## Usage

### HTML

```html
<tc-run-log id="runs"></tc-run-log>

<script type="module">
  import "@adamstavely/trenchcoat/run-log";
  import "@adamstavely/trenchcoat/tokens.css";

  const log = document.querySelector("#runs");
  const now = Date.UTC(2026, 10, 3, 11, 0);
  log.now = now;
  log.runs = [
    { id: "run_9a07", status: "succeeded", agent: "Policy Q&A", trigger: "Chat", startedAt: now - 360000, duration: 4200, steps: 2, tokens: 3100, cost: 0.011 },
    { id: "run_9a02", status: "failed", agent: "Invoice matcher", trigger: "Webhook", startedAt: now - 840000, duration: 31800, steps: 5, tokens: 41200, cost: 0.29, error: "Purchase order not found" },
  ];
  log.addEventListener("tc-run-open", (e) => console.log("open", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { RunLog, type RunLogRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Runs({ runs, now }: { runs: RunLogRun[]; now: number }) {
  return <RunLog runs={runs} now={now} live defaultRange="24h" onRunOpen={(id) => console.log("open", id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/run-log";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";

defineProps<{ runs: TcRunLog["runs"]; filter: TcRunLog["filter"] }>();
const onFilterChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-run-log :runs="runs" :filter="filter" @tc-filter-change="onFilterChange"></tc-run-log>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RunLog } from "@adamstavely/trenchcoat/angular/run-log";
import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";

@Component({
  selector: "app-run-log-example",
  imports: [RunLog],
  template: `<tc-run-log [runs]="runs()" [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-run-log>`,
})
export class RunLogExample {
  readonly runs = input.required<TcRunLog["runs"]>();
  readonly filter = input.required<TcRunLog["filter"]>();
  onFilterChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-log";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";

  let { runs, filter }: { runs: TcRunLog["runs"]; filter: TcRunLog["filter"] } = $props();
  let el: TcRunLog;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-run-log bind:this={el} {runs} {filter}></tc-run-log>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Runs"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading |
| `runs` | – | `RunLogRun[]` | `[]` | The runs, in any order – the list shows the newest first |
| `filter` | – | `RunLogFilter` | `{ status: [], agents: [], triggers: [] }` | The status, agent and trigger chips that are on; an empty list means all |
| `query` | `query` | `string` | `""` | The search text |
| `range` | `range` | `RunLogRange` | `"all"` | How far back runs show, from `now` (or the newest run when `now` isn't given) |
| `expanded` | – | `string[]` | `[]` | The failed runs whose error is open |
| `live` | `live` | `boolean` | `false` | Holds runs that arrive after the first render behind Show new |
| `now` | `now` | `number \| null` | `null` | The current time, epoch ms – "Started" reads relative to it; without it, a date and time |
| `currency` | `currency` | `string` | `"USD"` | ISO 4217 currency code for costs |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for dates, numbers and amounts |
| `maxHeight` | `max-height` | `number` | `420` | Height in px at which the list scrolls |
| `labels` | – | `Partial<RunLogLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-filter-change` | – | Yes | A status, agent or trigger chip was toggled, or the filters cleared ({ filter }: RunLogFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-query-change` | – | Yes | The search changed ({ query }: RunLogQueryChange); cancelable – prevented, `query` stays as it was |
| `tc-range-change` | – | Yes | The time range changed ({ range }: RunLogRangeChange); cancelable – prevented, `range` stays as it was |
| `tc-expanded-change` | – | Yes | A failed run's error was shown or hidden ({ expanded, id, open }: RunLogExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-run-open` | – | No | A run was opened: Enter on its line, or a click ({ id, run }: RunLogOpen) |
| `tc-show-new` | – | No | Show new let the waiting runs in ({ ids }: RunLogShowNew) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-runl-cols` | `7.5rem minmax(6rem, 1.4fr) minmax(5rem, 1fr) 6.5rem 4.5rem 3.5rem 4rem 4.5rem minmax(4rem, 1fr)` | both |
| `--tc-runl-cols-narrow` | `6.5rem minmax(0, 1fr) 5.5rem 4.5rem` | both |
| `--tc-runl-icon` | `14px` | both |

#### Design tokens it reads (47)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-border-control`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pill-radius`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `filterRuns(runs: RunLogRun[], filter: RunLogFilter, query: string, range: RunLogRange, reference: number): void` | The runs a filter, search and range keep, newest first. `reference` is "now" for the range |

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
| `runs` | `el.runs = …;` | `<… runs={…} />` | `<tc-run-log :runs="…">` | `<tc-run-log [runs]="…">` | `<tc-run-log {runs}>` |
| `filter` | `el.filter = …;` | `<… filter={…} />` | `<tc-run-log :filter="…">` | `<tc-run-log [filter]="…">` | `<tc-run-log {filter}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-run-log :expanded="…">` | `<tc-run-log [expanded]="…">` | `<tc-run-log {expanded}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-run-log :labels="…">` | `<tc-run-log [labels]="…">` | `<tc-run-log {labels}>` |

*Also attributes: `heading`, `description`, `query`, `range`, `live`, `now`, `currency`, `locale` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-range-change` | Yes | `el.addEventListener("tc-range-change", (e) => …)` | `ref.current.addEventListener("tc-range-change", …)` | `@tc-range-change="…"` | `(tc-range-change)="…($event)"` | `el.addEventListener("tc-range-change", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-run-open` | No | `el.addEventListener("tc-run-open", (e) => …)` | `onRunOpen={…}` | `@tc-run-open="…"` | `(tc-run-open)="…($event)"` | `el.addEventListener("tc-run-open", …)` |
| `tc-show-new` | No | `el.addEventListener("tc-show-new", (e) => …)` | `onShowNew={…}` | `@tc-show-new="…"` | `(tc-show-new)="…($event)"` | `el.addEventListener("tc-show-new", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `filter`, `query`, `range` and `expanded` itself unless a listener calls `preventDefault()` on `tc-filter-change`, `tc-query-change`, `tc-range-change` or `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-run-log id="run-log"></tc-run-log>

<script type="module">
  import "@adamstavely/trenchcoat/run-log";

  const el = document.querySelector("#run-log");
  el.addEventListener("tc-filter-change", (e) => {
    e.preventDefault(); // the element keeps its filter…
    if (allowed(e.detail.filter)) el.filter = e.detail.filter; // …until the app sets it
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
import "@adamstavely/trenchcoat/run-log";
import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";

const props = defineProps<{ initial: TcRunLog["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcRunLog["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-run-log :filter="filter" @tc-filter-change="onFilterChange"></tc-run-log>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RunLog } from "@adamstavely/trenchcoat/angular/run-log";
import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";

@Component({
  selector: "app-controlled-run-log",
  imports: [RunLog],
  template: `<tc-run-log [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-run-log>`,
})
export class ControlledRunLog {
  readonly initial = input.required<TcRunLog["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcRunLog["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-log";
  import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";

  let { initial }: { initial: TcRunLog["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcRunLog;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcRunLog["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-run-log bind:this={el} {filter}></tc-run-log>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-run-log")` returns a `TcRunLog` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";`
- **React / Next.js:** Props: `import type { RunLogProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RunLog>`. The element class, for refs: `import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRunLog["runs"]` with `import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";`
- **Angular:** The directive types the template: `[runs]` takes `TcRunLog["runs"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRunLog } from "@adamstavely/trenchcoat/run-log";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `filter` | `RunLogFilter` | The status, agent and trigger chips that are on – controlled when given |
| `defaultFilter` | `RunLogFilter` | The chips on at first, when `filter` isn't controlled |
| `onFilterChange` | `(filter: RunLogFilter) => void` | A chip was toggled or the filters cleared |
| `query` | `string` | The search text – controlled when given |
| `defaultQuery` | `string` | The search at first, when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | The search changed |
| `range` | `RunLogRange` | How far back runs show – controlled when given |
| `defaultRange` | `RunLogRange` | The range at first, when `range` isn't controlled |
| `onRangeChange` | `(range: RunLogRange) => void` | The range changed |
| `expanded` | `string[]` | The failed runs whose error is open – controlled when given |
| `defaultExpanded` | `string[]` | The errors open at first, when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: string[]) => void` | A failed run's error was shown or hidden |
| `onRunOpen` | `(id: string, run: RunLogRun) => void` | A run was opened |
| `onShowNew` | `(ids: string[]) => void` | Show new let the waiting runs in |

*Renamed or hidden on the wrapper: `heading`, `filter`, `query`, `range`, `expanded`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The search, the range, each chip group, Show new and the list are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in a chip group | Move between chips |
| Enter / Space on a chip | Turns that filter on or off |
| ↑ / ↓ | Move between runs |
| Home / End | Go to the newest or oldest run shown |
| Enter | Opens the run |
| → / Space on a failed run | Shows its error |
| ← / Space on a failed run | Hides its error |

### Screen readers

The list is a `treegrid` named by the heading, with column headers: each run is a level-1 row, and a failed run's
error is its level-2 child row. A failed run's row has `aria-expanded`, and when open, `aria-controls` points at its
error row. Every row is described by a hidden line saying Enter opens it and → or Space
shows a failed run's error. Status marks are hidden; the word is read. The chips are toggle buttons with `aria-pressed`
in named groups ("Filter by status"…). In live mode a `role="status"` says "3 new runs" when runs arrive, and Show new
moves focus to the newest run.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.0 KB | 7.9 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **32.4 KB** | **10.1 KB** |
| With Lit – the first component on a page | 53.1 KB | 16.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 198 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of runs replaced |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.4 ms | runs: first render, 1,532 nodes; update 4.5 ms |
| 1,000 items | 86 ms | runs: first render, 14,582 nodes; update 42 ms |

1,000 items of runs: 86 ms. It renders every item, so a first render passes 50 ms (a long task) at about 580 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give `startedAt` in epoch ms. Pass `now` for relative times ("4 minutes ago"); without it, a date and time show.
- Leave `duration` out while a run is going; the cell shows a dash.
- Keep `trigger` to a word or two ("Webhook", "Schedule", "Chat"); the chips are built from it.
- Write `error` as the reason a person can act on, not a stack trace.

## Do and don't

### Do

- Use `live` on pages that keep receiving runs, so readers keep their place.
- Keep `filter`, `query` and `range` in the URL when the page is shared.

### Don't

- Don't put personal data in `user` beyond what the reader may see.
- Don't pass thousands of runs at once; page them on the server and pass a window.

## Related

- [Run Receipt](run-receipt.md) – What one agent run cost, set out like a receipt – run id with Copy, when, duration and status in words, line-item tables for models (calls, input, output and cached tokens), tools, web lookups and retries, the subtotal, cache savings and total, the costliest step with its share, and Open trace and Download CSV
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
