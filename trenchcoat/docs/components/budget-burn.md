<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Budget Burn

**Research & portfolio** · New

How fast each budget is being spent – spent against budget, the burn as a bar with a pace marker and Ahead, On or Behind pace in words, people and team, totals in the header and a sort by budget or burn

- **Element:** `<tc-budget-burn>`
- **Size:** 7.9 KB gzip · 25.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/budget-burn";` |
| React / Next.js | `import { BudgetBurn } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/budget-burn";` · tags starting with tc- are custom elements |
| Angular | `import { BudgetBurn } from "@adamstavely/trenchcoat/angular/budget-burn";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/budget-burn";` |

## Example

The live example is in the gallery at `#/budget-burn`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How fast each budget is being spent. Every row shows what's funded and who leads it, spent against budget – “$1.9M /
$3.8M” – the burn as a percentage and a bar, the people on it and their initials, and an optional priority badge.
With `period` set to how far through the year or project you are, a line on each bar marks where spend should be by
now, and the row says “Ahead of pace”, “On pace” or “Behind pace” in words. The header totals what's allocated, spent
and committed, and a small segmented control sorts the rows by budget or by burn.

### When to use

- Mid-year budget reviews across topics, projects or programs.
- Spotting work that's burning faster than planned, or money that isn't moving.
- Any list of budgets where spend against plan matters more than the absolute numbers.

### When not to use

- Whether money follows priority across tiers – use [Investment Balance](investment-balance.md).
- How loaded each person is – use [Capacity Bars](capacity-bars.md).
- One plan's usage against its limit – use [Usage Meter](usage-meter.md).
- Spend as a trend over time – use [KPI Chart](kpi-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Sort** `.ui-bburn__sort` – Budget or Burn, as a segmented control
2. **Totals** `.ui-bburn__totals` – allocated, spent, committed and how far through the period
3. **Item** `.ui-bburn__what` – the priority badge, name and owner
4. **Money** `.ui-bburn__money` – spent against budget
5. **Burn** `.ui-bburn__burn` – the burn percentage, the pace in words and the bar
6. **Pace marker** `.ui-bburn__marker` – where spend should be by now
7. **People** `.ui-bburn__people` – FTE and the team's initials

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Bars use the meter tokens; a row ahead of pace fills with `--tc-status-warning-solid`, and
says so in words.

## Usage

### HTML

```html
<tc-budget-burn id="burn" period="0.45"></tc-budget-burn>

<script type="module">
  import "@adamstavely/trenchcoat/budget-burn";
  import "@adamstavely/trenchcoat/tokens.css";

  const burn = document.querySelector("#burn");
  burn.items = [
    { id: "nc", priority: "1", label: "Neuromorphic Computing", owner: "Marcus Okonkwo", budget: 3800000, spent: 1900000, people: 2, team: ["Marcus Okonkwo", "Jonah Tran"] },
    { id: "qs", priority: "2", label: "Quantum Sensing", owner: "Priya Raman", budget: 2400000, spent: 1300000, people: 0.5 },
  ];
  burn.addEventListener("tc-open", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { BudgetBurn, type BurnItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: BurnItem[] = [
  { id: "nc", priority: "1", label: "Neuromorphic Computing", owner: "Marcus Okonkwo", budget: 3800000, spent: 1900000, people: 2, team: ["Marcus Okonkwo", "Jonah Tran"] },
  { id: "qs", priority: "2", label: "Quantum Sensing", owner: "Priya Raman", budget: 2400000, spent: 1300000, people: 0.5 },
];

export function Burn() {
  return <BudgetBurn items={items} period={0.45} onOpen={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/budget-burn";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";

defineProps<{ items: TcBudgetBurn["items"] }>();
const onSortChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-budget-burn :items="items" @tc-sort-change="onSortChange"></tc-budget-burn>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BudgetBurn } from "@adamstavely/trenchcoat/angular/budget-burn";
import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";

@Component({
  selector: "app-budget-burn-example",
  imports: [BudgetBurn],
  template: `<tc-budget-burn [items]="items()" (tc-sort-change)="onSortChange($event)"></tc-budget-burn>`,
})
export class BudgetBurnExample {
  readonly items = input.required<TcBudgetBurn["items"]>();
  onSortChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/budget-burn";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";

  let { items }: { items: TcBudgetBurn["items"] } = $props();
  let el: TcBudgetBurn;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-sort-change", on);
    return () => el.removeEventListener("tc-sort-change", on);
  });
</script>

<tc-budget-burn bind:this={el} {items}></tc-budget-burn>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Budget burn"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `BurnItem[]` | `[]` | The items |
| `period` | `period` | `number \| undefined` | `undefined` | How far through the period we are, from 0 to 1; unset hides the pace marker and words |
| `tolerance` | `tolerance` | `number` | `0.1` | How far, as a share of the budget, spend may sit from the pace before it's ahead or behind |
| `sort` | `sort` | `BurnSort` | `"budget"` | "budget" puts the biggest budgets first, "burn" the highest burn. Changed by the user unless a tc-sort-change listener calls preventDefault() |
| `currency` | `currency` | `string` | `"USD"` | The budget's currency, an ISO 4217 code |
| `peopleUnit` | `people-unit` | `string` | `"FTE"` | The unit people are counted in: "FTE", "people" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-sort-change` | – | Yes | The sort was changed ({ sort }: BurnSortChange); cancelable – prevented, `sort` stays as it was |
| `tc-open` | – | No | A row was opened ({ id, item }: BurnOpen) |

#### Design tokens it reads (61)

`--tc-avatar-font-weight`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-info-fg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-budget-burn :items="…">` | `<tc-budget-burn [items]="…">` | `<tc-budget-burn {items}>` |

*Also attributes: `heading`, `description`, `period`, `tolerance`, `sort`, `currency`, `people-unit`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-sort-change` | Yes | `el.addEventListener("tc-sort-change", (e) => …)` | `ref.current.addEventListener("tc-sort-change", …)` | `@tc-sort-change="…"` | `(tc-sort-change)="…($event)"` | `el.addEventListener("tc-sort-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `sort` itself unless a listener calls `preventDefault()` on `tc-sort-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-budget-burn id="budget-burn"></tc-budget-burn>

<script type="module">
  import "@adamstavely/trenchcoat/budget-burn";

  const el = document.querySelector("#budget-burn");
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
import "@adamstavely/trenchcoat/budget-burn";
import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";

const props = defineProps<{ initial: TcBudgetBurn["sort"] }>();
const sort = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSortChange = (e: CustomEvent<{ sort: TcBudgetBurn["sort"] }>) => {
  e.preventDefault();
  sort.value = e.detail.sort;
};
</script>

<template>
  <tc-budget-burn :sort="sort" @tc-sort-change="onSortChange"></tc-budget-burn>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BudgetBurn } from "@adamstavely/trenchcoat/angular/budget-burn";
import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";

@Component({
  selector: "app-controlled-budget-burn",
  imports: [BudgetBurn],
  template: `<tc-budget-burn [sort]="sort()" (tc-sort-change)="onSortChange($event)"></tc-budget-burn>`,
})
export class ControlledBudgetBurn {
  readonly initial = input.required<TcBudgetBurn["sort"]>();
  readonly sort = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSortChange(e: CustomEvent<{ sort: TcBudgetBurn["sort"] }>) {
    e.preventDefault();
    this.sort.set(e.detail.sort);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/budget-burn";
  import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";

  let { initial }: { initial: TcBudgetBurn["sort"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let sort = $derived(initial);
  let el: TcBudgetBurn;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      sort = (e as CustomEvent<{ sort: TcBudgetBurn["sort"] }>).detail.sort;
    };
    el.addEventListener("tc-sort-change", on);
    return () => el.removeEventListener("tc-sort-change", on);
  });
</script>

<tc-budget-burn bind:this={el} {sort}></tc-budget-burn>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-budget-burn")` returns a `TcBudgetBurn` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";`
- **React / Next.js:** Props: `import type { BudgetBurnProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BudgetBurn>`. The element class, for refs: `import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBudgetBurn["items"]` with `import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";`
- **Angular:** The directive types the template: `[items]` takes `TcBudgetBurn["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBudgetBurn } from "@adamstavely/trenchcoat/budget-burn";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `sort` | `BurnSort` | The sort – controlled when given |
| `defaultSort` | `BurnSort` | The sort on mount when `sort` isn't controlled |
| `onSortChange` | `(sort: BurnSort) => void` | The sort was changed |
| `onOpen` | `(id: string, item: BurnItem) => void` | A row was opened |

*Renamed or hidden on the wrapper: `heading`, `sort`, `children`*

## Accessibility

### Keyboard

The rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row |
| Tab | Moves between the sort buttons and the rows |

### Screen readers

The rows are a list of buttons, named by the heading. Each button reads the whole row: “Neuromorphic Computing, Marcus
Okonkwo; $1.9M of $3.8M spent, 50%; On pace; 2 FTE; priority 1”. The sort is a group labelled “Sort by” of two
toggle buttons (`aria-pressed`), and a change is confirmed in a polite status message, “Sorted by burn”. The totals
are a description list.

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
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 17.9 KB | 5.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **25.4 KB** | **7.9 KB** |
| With Lit – the first component on a page | 47.3 KB | 15.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.4 ms** | the gallery demo's data, 195 DOM nodes – to layout, median of 7 |
| Typical update | **1.5 ms** | one item of items replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 30 ms | items: first render, 2,402 nodes; update 12 ms |
| 1,000 items | 236 ms | items: first render, 23,744 nodes; update 132 ms |

1,000 items of items: 236 ms. It renders every item, so a first render passes 50 ms (a long task) at about 210 items – page or filter longer lists.

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

- Set `period` from your own calendar – the element never guesses where you are in the year.
- Use `committed` for money under contract but not yet spent, so the header shows what's really left.
- Keep `owner` to a name; put teams in `team`.

## Do and don't

### Do

- Sort by burn in reviews to see the fastest spenders first.
- Set `tolerance` to the gap your finance team cares about; 0.1 (ten points) is the default.

### Don't

- Don't mix currencies in one view – `currency` applies to every row.
- Don't read “Ahead of pace” as bad by itself: front-loaded work burns early. The words say where to look.

## Related

- [Investment Balance](investment-balance.md) – Are dollars and people following priority? – each tier's share of items, budget and people side by side as numbers and bars, over- and under-invested tiers flagged in words, and the biggest mismatch said in one line
- [Capacity Bars](capacity-bars.md) – How loaded each person is – their allocation split by what they work on, against their capacity on one shared scale, each piece named with its amount, anyone over capacity marked and counted
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer

## Changelog

- **`tc-budget-burn`:** spent against budget for each item, with a pace marker. - **Pace:** Ahead, On or Behind pace in words. - **Totals and sorting:** totals in the header, and a sort by budget or burn.
