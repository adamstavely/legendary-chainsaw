<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Priority List

**Research & portfolio** · New

A portfolio's topics or projects by priority – a tier badge, owner and team, health in words, momentum as a line with its change, coverage as a bar, what's open and the work in flight, with health filters and groups per priority

- **Element:** `<tc-priority-list>`
- **Size:** 11.6 KB gzip · 39.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/priority-list";` |
| React / Next.js | `import { PriorityList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/priority-list";` · tags starting with tc- are custom elements |
| Angular | `import { PriorityList } from "@adamstavely/trenchcoat/angular/priority-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/priority-list";` |

## Example

The live example is in the gallery at `#/priority-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A portfolio's topics or projects by priority, each on one dense row. A badge carries its tier – 1 is the top, in ink;
the others are outlined – beside the name, the owner and team, and its health in words: at risk, watch or on track. The
momentum is a small line over the last few periods with its change, green and ▲ when it's rising, red and ▼ when it's
falling. Coverage is a slim bar with its share, red when it's low. A pill says what's open ("5 gaps") and a mono count
says how much work is in flight ("3·wk"). `figures` adds columns of the page's own after Work – papers published last
month and this, say – each filled from the row's `figures` by the column's id. A column is 56px, room for "This mo.";
give it a `width` for a longer heading ("This month" takes about 88px) and the name column gives up the room. Chips in the header count each health and
filter by one; with `grouped`, rows fall under a header per priority that counts what's at risk.

A row with no `priority` shows its `badge` instead, a short code such as "CEC" in a neutral badge, so the same list can
summarise things that have no tier: centres, teams, programmes. With `grouped`, those rows come last, under no header.

Such a row can show a logo instead: `badgeImage` is an image URL (through `safeMediaUrl`, so a data: image works too)
drawn at the code badge's height, contained in the column's width with the badge's rounded corners. It has `alt=""` –
the `badge` code stays as the row's screen-reader text. A missing or unsafe URL, or an image that fails to load, shows
the code badge instead; a failed logo isn't retried, so it never flickers, and the column keeps its width.

### When to use

- A directorate's or a programme's portfolio, ranked so the most important and most at-risk items stand out.
- A dashboard panel that leads into each topic's or project's page.
- A summary of centres or teams that looks just like the priorities beside it, with codes for badges.
- Comparing items by momentum and coverage at once, without opening each one.

### When not to use

- The gaps or risks themselves – use [Gap Exposure](gap-exposure.md).
- One share across the whole portfolio – use [Coverage Ring](coverage-ring.md).
- Many columns people sort, filter and edit – use [Data Table](data-table.md).
- One number and its trend in detail – use [KPI Chart](kpi-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Filters** `.ui-prl__filters` – each health with its count; pressing one shows only that health, again shows all
2. **Columns** `.ui-prl__columns` – the headings over the rows
3. **Group header** `.ui-prl__group-head` – with `grouped`: the tier, how many it holds and how many are at risk
4. **Row** `.ui-prl__row` – one topic or project; opens on Enter or a click
5. **Priority** `.ui-prl__badge` – the tier's number: ink for the top tier, outlined for the rest; or the row's code,
6. **Health** `.ui-prl__health` – at risk, watch or on track, in words with a dot
7. **Momentum** `.ui-prl__momentum` – the line and the change, with an arrow and a colour
8. **Coverage** `.ui-prl__coverage` – the share covered over a slim bar
9. **Open** `.ui-prl__open` – what's open, as a pill
10. **Work** `.ui-prl__work` – how much work is in flight
11. **Figure** `.ui-prl__fig` – a value in one of the page's `figures` columns

## Looks

Standard is a white card on a gray tray, with the header and the filters on the tray above it. Clean is one white
card with the header as its first row. The rows are the same in both.

The columns fold on the list's own width, not the window's, so it works in a side column as well as a full page, and
the name always keeps at least 140px from 300px up. As the list narrows, the momentum line folds to just its change
(680px), then the work count goes (560px), then the figures (540px) and the open pill (480px), then the momentum's
change and the coverage bar, leaving the coverage share (400px). With figures – about two – the line, the work count
and the open pill go sooner (760px) to make room for them.

`keep-trend-line` (`keepTrendLine`) keeps the momentum line wherever the momentum column shows – it still folds below
400px – at the column's full 108px, beside the change. The name column gives up the difference, so names truncate
sooner: use it when the names are short, such as a centre's code (“AFMC”, “EAPMC”) in place of its full name. It works
with `hide` – a 460px rail with coverage, open, work and health hidden keeps the line and two figures.

## Usage

### HTML

```html
<tc-priority-list id="topics" heading="Priorities" grouped></tc-priority-list>

<script type="module">
  import "@adamstavely/trenchcoat/priority-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const topics = document.querySelector("#topics");
  topics.items = [
    { id: "neuro", name: "Neuromorphic Computing", owner: "Marcus Okonkwo", team: "Cognitive Systems", priority: 1, health: "at-risk", trend: [7, 6.9, 6.6, 6.3], change: -0.08, coverage: 0.42, open: 4, work: 4 },
    { id: "carbon", name: "Carbon-Negative Materials", owner: "Sofia Almeida", priority: 1, health: "on-track", trend: [6, 6.5, 7, 6.7], change: 0.12, coverage: 0.71, open: 2, work: 5 },
  ];
  topics.addEventListener("tc-open", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PriorityList, type PriorityFilter, type PriorityItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: PriorityItem[] = [
  { id: "neuro", name: "Neuromorphic Computing", owner: "Marcus Okonkwo", team: "Cognitive Systems", priority: 1, health: "at-risk", trend: [7, 6.9, 6.6, 6.3], change: -0.08, coverage: 0.42, open: 4, work: 4 },
  { id: "carbon", name: "Carbon-Negative Materials", owner: "Sofia Almeida", priority: 1, health: "on-track", trend: [6, 6.5, 7, 6.7], change: 0.12, coverage: 0.71, open: 2, work: 5 },
];

export function Topics() {
  const [filter, setFilter] = useState<PriorityFilter>("all");
  return <PriorityList title="Priorities" items={items} grouped filter={filter} onFilterChange={setFilter} onOpen={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/priority-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";

defineProps<{ items: TcPriorityList["items"]; figures: TcPriorityList["figures"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-priority-list :items="items" :figures="figures" @tc-open="onOpen"></tc-priority-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PriorityList } from "@adamstavely/trenchcoat/angular/priority-list";
import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";

@Component({
  selector: "app-priority-list-example",
  imports: [PriorityList],
  template: `<tc-priority-list [items]="items()" [figures]="figures()" (tc-open)="onOpen($event)"></tc-priority-list>`,
})
export class PriorityListExample {
  readonly items = input.required<TcPriorityList["items"]>();
  readonly figures = input.required<TcPriorityList["figures"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/priority-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";

  let { items, figures }: { items: TcPriorityList["items"]; figures: TcPriorityList["figures"] } = $props();
  let el: TcPriorityList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-priority-list bind:this={el} {items} {figures}></tc-priority-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Priorities"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `PriorityItem[]` | `[]` | The topics or projects, in the order to show them (within a group when grouped) |
| `hide` | `hide` | `PriorityColumn[]` | `[]` | Built-in columns to leave out of the header and the rows – space-separated as an attribute, e.g. `hide="coverage open work"`; the name and the other columns take the room. "health" leaves the health word out from under each name (screen readers still hear it); with no owner either, the name stands alone |
| `figures` | – | `PriorityFigureColumn[]` | `[]` | More columns after Work, in order, filled from each row's `figures` |
| `grouped` | `grouped` | `boolean` | `false` | Puts the rows under a header per priority; rows without one come last, under no header |
| `filter` | `filter` | `PriorityFilter` | `"all"` | The health shown. Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `noFilters` | `no-filters` | `boolean` | `false` | Shows the health filter chips with their counts |
| `tiers` | – | `Record<number, string>` | `{}` | The tiers' names by number, merged over the defaults (Top priority, High, Medium, Watching) |
| `healthLabels` | – | `Partial<Record<PriorityHealth, string>>` | `{}` | The healths' names, merged over the defaults (At risk, Watch, On track) |
| `keepTrendLine` | `keep-trend-line` | `boolean` | `false` | Keeps the momentum line at every width where the momentum column shows (it still folds below 400px), at its full width beside the change; the name takes the difference and truncates sooner – for short names such as codes |
| `nameLabel` | `name-label` | `string` | `"Topic"` | The first column's heading |
| `nameAlign` | `name-align` | `"start" \| "center"` | `"start"` | Names at the start of their column (the default), or centered with their heading over them – for short names such as codes |
| `momentumLabel` | `momentum-label` | `string` | `"Momentum"` | The momentum column's heading, also read before each row's change: "Trend" |
| `openUnit` | `open-unit` | `string` | `"gaps"` | What's open, after its count: "5 gaps" |
| `openUnitOne` | `open-unit-one` | `string \| undefined` | `undefined` | What's open when there's one: "1 gap"; `open-unit` when unset |
| `workUnit` | `work-unit` | `string` | `"wk"` | The short unit after the work count: "3·wk" |
| `workLabel` | `work-label` | `string` | `"work items"` | The work count in words, for screen readers: "3 work items" |
| `coverageWarn` | `coverage-warn` | `number` | `0.45` | Coverage under this share, from 0 to 1, is drawn in the danger colour |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `empty` | `empty` | `string` | `"Nothing to show."` | Shown when nothing matches |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | A row was opened with Enter or a click ({ id, item }: PriorityOpen) |
| `tc-filter-change` | – | Yes | A health filter was chosen or cleared ({ filter }: PriorityFilterChange); cancelable – prevented, `filter` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-prl-cols` | `minmax(0, 1fr) 108px 120px 72px 40px` | both |
| `--tc-prl-f-momentum` | `0px` | not set – this fallback applies |
| `--tc-prl-f-coverage` | `0px` | not set – this fallback applies |
| `--tc-prl-f-open` | `0px` | not set – this fallback applies |
| `--tc-prl-f-work` | `0px` | not set – this fallback applies |

#### Design tokens it reads (78)

`--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-prl-c-coverage`, `--tc-prl-c-momentum`, `--tc-prl-c-open`, `--tc-prl-c-work`, `--tc-prl-figs`, `--tc-prl-freed`, `--tc-prl-lead`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-control`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultPriorityTiers: Record<number, string>` | The tiers' names used when the page gives none |
| `defaultPriorityHealthLabels: Record<PriorityHealth, string>` | The healths' names used when the page gives none |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-priority-list :items="…">` | `<tc-priority-list [items]="…">` | `<tc-priority-list {items}>` |
| `figures` | `el.figures = …;` | `<… figures={…} />` | `<tc-priority-list :figures="…">` | `<tc-priority-list [figures]="…">` | `<tc-priority-list {figures}>` |
| `tiers` | `el.tiers = …;` | `<… tiers={…} />` | `<tc-priority-list :tiers="…">` | `<tc-priority-list [tiers]="…">` | `<tc-priority-list {tiers}>` |
| `healthLabels` | `el.healthLabels = …;` | `<… healthLabels={…} />` | `<tc-priority-list :healthLabels="…">` | `<tc-priority-list [healthLabels]="…">` | `<tc-priority-list {healthLabels}>` |

*Also attributes: `heading`, `description`, `hide`, `grouped`, `filter`, `no-filters`, `keep-trend-line`, `name-label` and 9 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `filter` itself unless a listener calls `preventDefault()` on `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-priority-list id="priority-list"></tc-priority-list>

<script type="module">
  import "@adamstavely/trenchcoat/priority-list";

  const el = document.querySelector("#priority-list");
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
import "@adamstavely/trenchcoat/priority-list";
import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";

const props = defineProps<{ initial: TcPriorityList["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcPriorityList["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-priority-list :filter="filter" @tc-filter-change="onFilterChange"></tc-priority-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PriorityList } from "@adamstavely/trenchcoat/angular/priority-list";
import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";

@Component({
  selector: "app-controlled-priority-list",
  imports: [PriorityList],
  template: `<tc-priority-list [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-priority-list>`,
})
export class ControlledPriorityList {
  readonly initial = input.required<TcPriorityList["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcPriorityList["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/priority-list";
  import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";

  let { initial }: { initial: TcPriorityList["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcPriorityList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcPriorityList["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-priority-list bind:this={el} {filter}></tc-priority-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-priority-list")` returns a `TcPriorityList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";`
- **React / Next.js:** Props: `import type { PriorityListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PriorityList>`. The element class, for refs: `import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPriorityList["items"]` with `import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";`
- **Angular:** The directive types the template: `[items]` takes `TcPriorityList["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPriorityList } from "@adamstavely/trenchcoat/priority-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `filter` | `PriorityFilter` | The health shown – controlled when given |
| `defaultFilter` | `PriorityFilter` | The health shown on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: PriorityFilter) => void` | A health filter was chosen or cleared |
| `onOpen` | `(id: string, item: PriorityItem) => void` | A row was opened with Enter or a click |

*Renamed or hidden on the wrapper: `heading`, `filter`, `children`*

## Accessibility

### Keyboard

The filters come first in the tab order, then the rows as one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row, across groups |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row: fires `tc-open`; on a filter, presses or releases it |
| Tab | Moves between the filters, then into and out of the rows |

### Screen readers

Each row is a button that reads the whole row: “Priority 1, Top priority. Neuromorphic Computing Marcus Okonkwo ·
Cognitive Systems. At risk. Momentum down 8%. Coverage 42%. 4 gaps. 4 work items”, then each figure with its column's
label: “2 Last mo.”. A row with a code reads it in place of the tier: “CEC. Energy & Climate …”. The line, arrows and bar are
hidden; their meaning is in the words. The filters are a group labelled “Filter by health”, each a toggle button
that's pressed while its health is shown. With `grouped`, each group is a region named by its tier and count.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 31.5 KB | 9.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **39.3 KB** | **11.6 KB** |
| With Lit – the first component on a page | 61.1 KB | 18.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.4 ms** | the gallery demo's data, 363 DOM nodes – to layout, median of 7 |
| Typical update | **1.3 ms** | one item of items replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 31 ms | items: first render, 3,730 nodes; update 7.7 ms |
| 1,000 items | 183 ms | items: first render, 37,030 nodes; update 46 ms |

1,000 items of items: 183 ms. It renders every item, so a first render passes 50 ms (a long task) at about 270 items – page or filter longer lists.

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

- Name items as people know them: “Neuromorphic Computing”, not a code. A code belongs in `badge`, for rows without a
  tier.
- Keep figure labels short – the column is narrow: “This mo.”, not “Published this month”.
- Give `change` as a fraction of the period's start: -0.14 for a 14% fall.
- Set `open-unit` and `open-unit-one` to what's open: “gaps” and “gap”, “risks” and “risk”.
- Rename the tiers with `tiers` to match your own scale, keeping 1 as the top.

## Do and don't

### Do

- Order items by what matters most to your readers: risk first, or the tier, then health.
- Use `grouped` when there are more than about eight items and the tiers mean something to the reader.
- Set `coverage-warn` to the share your team treats as too low.

### Don't

- Don't put actions in the rows; open the item and act there.
- Don't use momentum for something that isn't a trend over time.
- Don't show health by colour alone elsewhere on the page – match the words.

## Related

- [Gap Exposure](gap-exposure.md) – Gaps or risks and whether anyone is working on them – severity in words and a mark, the item and its priority, coverage, owner and what's invested, with the severe uncovered ones called out, grouping by priority or severity and an uncovered-only switch
- [Coverage Ring](coverage-ring.md) – One share at a glance – a large ring with the percentage and a caption, a title and a line, and a bar from healthiest to needs attention that reads out each segment
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer

## Changelog

- **`tc-priority-list`:** topics or projects by priority. - **Each row:** health, a momentum line with its change, a coverage bar, what's open and the work in flight. - **Filtering and grouping:** health filters, and groups per priority.
