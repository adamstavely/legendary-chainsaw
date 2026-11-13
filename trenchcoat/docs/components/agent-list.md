<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent List

**Agents** · New

Every agent in a workspace, with the failing ones lifted into Needs attention and why in words – search, status chips, sort by name, last run, failures or cost, and a row that opens the agent

- **Element:** `<tc-agent-list>`
- **Size:** 8.7 KB gzip · 27.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-list";` |
| React / Next.js | `import { AgentList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-list";` · tags starting with tc- are custom elements |
| Angular | `import { AgentList } from "@adamstavely/trenchcoat/angular/agent-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-list";` |

## Example

The live example is in the gallery at `#/agent-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Every agent in a workspace on one list, with the ones that are failing lifted into **Needs attention** at the top. Each of those says why in words. The rest follow, searched, filtered by status and sorted by name, last run, failures or cost. A row opens the agent.

### When to use

- The home of an agent builder: the place to find an agent, and to see first which ones need fixing.
- An admin's view of every agent in a workspace, with who owns each and what it costs.

### When not to use

- One agent in detail – use [Agent Summary](agent-summary.md).
- Agents at work right now – use [Agent Fleet](agent-fleet.md), or [Agent Inbox](agent-inbox.md) for their background tasks.
- Setting up a new agent – use [Agent Create](agent-create.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tools** `.ui-agl__tools` – `.ui-agl__search`, the status `.ui-agl__chip`s and the `.ui-agl__select` for the sort
2. **Groups** `.ui-agl__group` – Needs attention first, then All agents, each with `.ui-agl__group-title`
3. **Row** `.ui-agl__row` – `.ui-agl__name`, `.ui-agl__desc` and `.ui-agl__why`, `.ui-agl__status` with its `.ui-agl__mark`, `.ui-agl__meta`, `.ui-agl__run` and `.ui-agl__figures`
4. **Empty** `.ui-agl__none` – no agents yet, or none matching, with Clear filters

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-agl-mark`, the status mark's size. Below 640px each row stacks its figures under the name.

## Usage

### HTML

```html
<tc-agent-list id="agents" heading="Operations agents"></tc-agent-list>

<script type="module">
  import "@adamstavely/trenchcoat/agent-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#agents");
  list.agents = [
    { id: "invoice", name: "Invoice matcher", status: "failing", runs7d: 48, failureRate: 0.25, cost7d: 6.4, attention: "The purchase-order export timed out on 12 runs." },
    { id: "policy", name: "Policy Q&A", status: "live", runs7d: 312, failureRate: 0.01, cost7d: 18.75 },
    { id: "grant", name: "Grant report drafter", status: "draft" },
  ];
  list.addEventListener("tc-agent-open", (e) => console.log("Open", e.detail.id));
  list.addEventListener("tc-sort-change", (e) => console.log("Sort", e.detail.sort));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AgentList, type AgentListItem, type AgentListSort } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Agents({ agents, open }: { agents: AgentListItem[]; open: (id: string) => void }) {
  const [sort, setSort] = useState<AgentListSort>("failures");
  return <AgentList title="Operations agents" agents={agents} sort={sort} onSortChange={setSort} onAgentOpen={open} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";

defineProps<{ agents: TcAgentList["agents"]; filter: TcAgentList["filter"] }>();
const onAgentOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-list :agents="agents" :filter="filter" @tc-agent-open="onAgentOpen"></tc-agent-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentList } from "@adamstavely/trenchcoat/angular/agent-list";
import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";

@Component({
  selector: "app-agent-list-example",
  imports: [AgentList],
  template: `<tc-agent-list [agents]="agents()" [filter]="filter()" (tc-agent-open)="onAgentOpen($event)"></tc-agent-list>`,
})
export class AgentListExample {
  readonly agents = input.required<TcAgentList["agents"]>();
  readonly filter = input.required<TcAgentList["filter"]>();
  onAgentOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";

  let { agents, filter }: { agents: TcAgentList["agents"]; filter: TcAgentList["filter"] } = $props();
  let el: TcAgentList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-agent-open", on);
    return () => el.removeEventListener("tc-agent-open", on);
  });
</script>

<tc-agent-list bind:this={el} {agents} {filter}></tc-agent-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Agents"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `agents` | – | `AgentListItem[]` | `[]` | The agents |
| `sort` | `sort` | `AgentListSort` | `"name"` | The order: "name", "lastRun", "failures" or "cost". Changed by the user unless a tc-sort-change listener calls preventDefault() |
| `filter` | – | `AgentListStatus[]` | `[]` | The statuses shown; empty shows every one. Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `query` | `query` | `string` | `""` | The search text. Changed by the user unless a tc-query-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | "Now", epoch ms – last runs read as "2 h ago" when it's given, else as a date |
| `currency` | `currency` | `string` | `"USD"` | The cost's currency, an ISO 4217 code |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates, numbers and money |
| `labels` | – | `Partial<AgentListLabels>` | `{}` | Rename any of the words |
| `visible` | – | `{ attention: AgentListItem[]; others: AgentListItem[] }` | – | The agents the search and filter let through, in order: Needs attention first, then the rest |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-agent-open` | – | No | A row was opened ({ id, agent }: AgentListOpen) |
| `tc-sort-change` | – | Yes | The sort changed ({ sort }: AgentListSortChange); cancelable – prevented, `sort` stays as it was |
| `tc-filter-change` | – | Yes | The status filter changed ({ filter }: AgentListFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-query-change` | – | Yes | The search changed ({ query }: AgentListQueryChange); cancelable – prevented, `query` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agl-mark` | `var(--tc-space-2)` | both |

#### Design tokens it reads (49)

`--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `needsAttention(a: AgentListItem): void` | Whether an agent goes in Needs attention: it's failing, or the page said why |
| `sortAgents(agents: AgentListItem[], sort: AgentListSort): void` | The agents in the order a sort puts them: name A–Z, the rest highest first; ties by name |

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-agent-list :agents="…">` | `<tc-agent-list [agents]="…">` | `<tc-agent-list {agents}>` |
| `filter` | `el.filter = …;` | `<… filter={…} />` | `<tc-agent-list :filter="…">` | `<tc-agent-list [filter]="…">` | `<tc-agent-list {filter}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-list :labels="…">` | `<tc-agent-list [labels]="…">` | `<tc-agent-list {labels}>` |

*Also attributes: `heading`, `description`, `sort`, `query`, `now`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-agent-open` | No | `el.addEventListener("tc-agent-open", (e) => …)` | `onAgentOpen={…}` | `@tc-agent-open="…"` | `(tc-agent-open)="…($event)"` | `el.addEventListener("tc-agent-open", …)` |
| `tc-sort-change` | Yes | `el.addEventListener("tc-sort-change", (e) => …)` | `ref.current.addEventListener("tc-sort-change", …)` | `@tc-sort-change="…"` | `(tc-sort-change)="…($event)"` | `el.addEventListener("tc-sort-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `sort`, `filter` and `query` itself unless a listener calls `preventDefault()` on `tc-sort-change`, `tc-filter-change` or `tc-query-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-list id="agent-list"></tc-agent-list>

<script type="module">
  import "@adamstavely/trenchcoat/agent-list";

  const el = document.querySelector("#agent-list");
  el.addEventListener("tc-sort-change", (e) => {
    e.preventDefault(); // the element keeps its sort…
    if (allowed(e.detail.sort)) el.sort = e.detail.sort; // …until the app sets it
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
import "@adamstavely/trenchcoat/agent-list";
import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";

const props = defineProps<{ initial: TcAgentList["sort"] }>();
const sort = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSortChange = (e: CustomEvent<{ sort: TcAgentList["sort"] }>) => {
  e.preventDefault();
  sort.value = e.detail.sort;
};
</script>

<template>
  <tc-agent-list :sort="sort" @tc-sort-change="onSortChange"></tc-agent-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentList } from "@adamstavely/trenchcoat/angular/agent-list";
import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";

@Component({
  selector: "app-controlled-agent-list",
  imports: [AgentList],
  template: `<tc-agent-list [sort]="sort()" (tc-sort-change)="onSortChange($event)"></tc-agent-list>`,
})
export class ControlledAgentList {
  readonly initial = input.required<TcAgentList["sort"]>();
  readonly sort = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSortChange(e: CustomEvent<{ sort: TcAgentList["sort"] }>) {
    e.preventDefault();
    this.sort.set(e.detail.sort);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-list";
  import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";

  let { initial }: { initial: TcAgentList["sort"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let sort = $derived(initial);
  let el: TcAgentList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      sort = (e as CustomEvent<{ sort: TcAgentList["sort"] }>).detail.sort;
    };
    el.addEventListener("tc-sort-change", on);
    return () => el.removeEventListener("tc-sort-change", on);
  });
</script>

<tc-agent-list bind:this={el} {sort}></tc-agent-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-list")` returns a `TcAgentList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";`
- **React / Next.js:** Props: `import type { AgentListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentList>`. The element class, for refs: `import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentList["agents"]` with `import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";`
- **Angular:** The directive types the template: `[agents]` takes `TcAgentList["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentList } from "@adamstavely/trenchcoat/agent-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `sort` | `AgentListSort` | The order – controlled when given |
| `defaultSort` | `AgentListSort` | The order on mount when `sort` isn't controlled |
| `onSortChange` | `(sort: AgentListSort) => void` | The order changed |
| `filter` | `AgentListStatus[]` | The statuses shown – controlled when given |
| `defaultFilter` | `AgentListStatus[]` | The statuses shown on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: AgentListStatus[]) => void` | The status filter changed |
| `query` | `string` | The search text – controlled when given |
| `defaultQuery` | `string` | The search text on mount when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | The search changed |
| `onAgentOpen` | `(id: string, agent: AgentListItem) => void` | A row was opened |

*Renamed or hidden on the wrapper: `heading`, `sort`, `filter`, `query`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Search, the status chips, the sort, then the rows as one stop |
| ↑ ↓ | Move between agents, across both groups |
| Home / End | Go to the first or last agent |
| Enter / Space | Open the agent |

### Screen readers

The groups are sections named by their headings, and each row is a button whose name holds the agent's name, description, why it needs attention, status, model, owner, last run and figures. A hidden description says how the arrow keys move. The status chips are toggle buttons (`aria-pressed`). After a search or filter, a polite status says how many agents are shown. Status is always a word, never only a colour.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

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
| **This component alone** | 19.3 KB | 6.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **27.7 KB** | **8.7 KB** |
| With Lit – the first component on a page | 48.4 KB | 15.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 131 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of agents replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | agents: first render, 1,822 nodes; update 2.8 ms |
| 1,000 items | 97 ms | agents: first render, 17,842 nodes; update 26 ms |

1,000 items of agents: 97 ms. It renders every item, so a first render passes 50 ms (a long task) at about 520 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `attention` says why an agent needs looking at, in a sentence: what failed and how often. Without it, the list works one out from `runs7d`, `failureRate` and the last run.
- Give `now` to show last runs as "2 hr. ago"; without it they're dates, and the element keeps no clock.
- `cost7d` is a number in `currency`, an ISO 4217 code.

## Do and don't

### Do

- Keep the attention sentence about the cause ("the purchase-order export timed out"), not only the symptom.
- Own `sort`, `filter` and `query` when the page keeps them in its URL.

### Don't

- Don't put healthy agents in Needs attention to promote them – it's for what's broken.

## Related

- [Agent Summary](agent-summary.md) – One agent's profile – status, model, tools, owner, live and draft versions, two weeks of runs as a daily chart that switches to a table, success rate, median run and cost, recent failures with their errors, and Edit, Run test and Pause
- [Agent Fleet](agent-fleet.md) – Several top-level agents side by side – each card sums up its sub-agents in words, with status, cost and time, and a click opens its tree beside it while the last one folds back into its card
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Agent Create](agent-create.md) – Describe an agent and get a working draft – a request with example chips, Generate, then the draft streamed in to edit: name, instructions, tools as switches, model, triggers, and the model's open questions to answer before Create
