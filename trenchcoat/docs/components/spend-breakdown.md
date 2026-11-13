<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Spend Breakdown

**Data & charts** · New

AI spend split by model, feature, user or team for a period – a ranked list with each slice's cost, share and change on the period before in words, a stacked bar per day, or a table, with picking a slice to filter and the total in the header

- **Element:** `<tc-spend-breakdown>`
- **Size:** 9.2 KB gzip · 29.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/spend-breakdown";` |
| React / Next.js | `import { SpendBreakdown } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/spend-breakdown";` · tags starting with tc- are custom elements |
| Angular | `import { SpendBreakdown } from "@adamstavely/trenchcoat/angular/spend-breakdown";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/spend-breakdown";` |

## Example

The live example is in the gallery at `#/spend-breakdown`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where AI spend goes. A switch splits the period's spend by model, feature, user or team, and a select picks the
period. The ranked view lists each slice biggest first – its cost, its share of the total and its change on the period
before in words (“Up 12%”, “Down 8%”, “New”) – with a bar to compare them. The daily view stacks each day's spend by
the top five slices and Other; the table view gives every slice's numbers with a total. Picking a slice marks it,
fades the others in the daily view and fires `tc-slice-select`, so the page can filter what's around it. The total and
its change sit in the header, in the page's currency.

### When to use

- A usage or billing page that explains a bill: which model, feature or team the money went to.
- Comparing this period's spend with the last, slice by slice.
- Letting people narrow a dashboard to one model, feature or team.

### When not to use

- Spend against a cap per member, team or key – use [Spend Limits](spend-limits.md).
- Setting alerts on the month's budget – use [Budget Alerts](budget-alerts.md).
- A general-purpose stacked bar with measure and segment pickers – use [Breakdown Chart](breakdown-chart.md).
- Budgets per project against their plan – use [Budget Burn](budget-burn.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Total** `.ui-spb__total` – the period's spend and its change on the period before
2. **Dimension switch** `.ui-spb__seg` – Model, Feature, User or Team
3. **Period** `.ui-spb__select` – the period the page passes entries for
4. **Slice** `.ui-spb__slice` – a ranked row: name, cost, share, change and bar
5. **Daily chart** `.ui-spb__daily` – a stacked bar per day with a legend
6. **Table** `.ui-spb__table` – every slice's cost, share and change, with a total
7. **Filter line** `.ui-spb__filter` – the picked slice, with Clear

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. Slices take the chart palette (`--tc-chart-1` to `--tc-chart-5`, then `--tc-chart-neutral` for Other).
`--tc-spb-chart-h` sets the daily chart's height. A rise in spend is shown in the warning colour and a fall in the
success colour, always with the words.

## Usage

### HTML

```html
<tc-spend-breakdown id="spend" currency="USD"></tc-spend-breakdown>

<script type="module">
  import "@adamstavely/trenchcoat/spend-breakdown";
  import "@adamstavely/trenchcoat/tokens.css";

  const spend = document.querySelector("#spend");
  spend.entries = [
    { date: "2026-11-02", cost: 412, by: { model: "large-1", feature: "Invoice matcher", team: "Audit" } },
    { date: "2026-11-02", cost: 96, by: { model: "small-2", feature: "Policy Q&A", team: "Operations" } },
    { date: "2026-11-03", cost: 388, by: { model: "large-1", feature: "Report drafting", team: "Research" } },
  ];
  spend.addEventListener("tc-slice-select", (e) => console.log(e.detail.dimension, e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { SpendBreakdown, type SpendEntry } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const entries: SpendEntry[] = [
  { date: "2026-11-02", cost: 412, by: { model: "large-1", feature: "Invoice matcher", team: "Audit" } },
  { date: "2026-11-02", cost: 96, by: { model: "small-2", feature: "Policy Q&A", team: "Operations" } },
];

export function Spend() {
  return <SpendBreakdown entries={entries} defaultDimension="feature" onSliceSelect={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/spend-breakdown";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";

defineProps<{ entries: TcSpendBreakdown["entries"]; previous: TcSpendBreakdown["previous"] }>();
const onDimensionChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-spend-breakdown :entries="entries" :previous="previous" @tc-dimension-change="onDimensionChange"></tc-spend-breakdown>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SpendBreakdown } from "@adamstavely/trenchcoat/angular/spend-breakdown";
import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";

@Component({
  selector: "app-spend-breakdown-example",
  imports: [SpendBreakdown],
  template: `<tc-spend-breakdown [entries]="entries()" [previous]="previous()" (tc-dimension-change)="onDimensionChange($event)"></tc-spend-breakdown>`,
})
export class SpendBreakdownExample {
  readonly entries = input.required<TcSpendBreakdown["entries"]>();
  readonly previous = input.required<TcSpendBreakdown["previous"]>();
  onDimensionChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/spend-breakdown";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";

  let { entries, previous }: { entries: TcSpendBreakdown["entries"]; previous: TcSpendBreakdown["previous"] } = $props();
  let el: TcSpendBreakdown;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-dimension-change", on);
    return () => el.removeEventListener("tc-dimension-change", on);
  });
</script>

<tc-spend-breakdown bind:this={el} {entries} {previous}></tc-spend-breakdown>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"AI spend"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `entries` | – | `SpendEntry[]` | `[]` | The period's spend, one entry per day and slice |
| `previous` | – | `SpendEntry[] \| null` | `null` | The period before's spend, for the change in words; null leaves the change out |
| `dimension` | `dimension` | `SpendDimension` | `"model"` | What to split by. Changed by the switch unless a tc-dimension-change listener calls preventDefault() |
| `dimensions` | – | `SpendDimension[]` | `["model", "feature", "user", "team"]` | The dimensions the switch offers, in order |
| `dimensionLabels` | – | `Partial<Record<SpendDimension, string>>` | `{}` | The switch's words for each dimension |
| `period` | `period` | `string` | `"month"` | The period shown. Changed by the select unless a tc-period-change listener calls preventDefault() |
| `periods` | – | `SpendPeriod[]` | `[ { id: "month", label: "This month" }, { id: "30d", label: "Last 30 days" }, { id: "quarter", label: "This quarter" }, ]` | The periods the select offers |
| `view` | `view` | `SpendView` | `"ranked"` | Ranked bars, a stacked bar per day, or a table. Changed by the switch unless a tc-view-change listener calls preventDefault() |
| `selected` | `selected` | `string \| null` | `null` | The picked slice's id, or null for all. Changed by picking unless a tc-slice-select listener calls preventDefault() |
| `currency` | `currency` | `string` | `"USD"` | The currency, an ISO 4217 code |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-dimension-change` | – | Yes | The dimension was switched ({ dimension }: SpendDimensionChange); cancelable – prevented, `dimension` stays as it was |
| `tc-period-change` | – | Yes | Another period was picked ({ period }: SpendPeriodChange); cancelable – prevented, `period` stays as it was |
| `tc-view-change` | – | Yes | The view was switched ({ view }: SpendViewChange); cancelable – prevented, `view` stays as it was |
| `tc-slice-select` | – | Yes | A slice was picked or cleared ({ dimension, id, selected }: SpendSliceSelect); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-spb-chart-h` | `140px` | both |

#### Design tokens it reads (63)

`--tc-accent-text`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-2`, `--tc-chart-3`, `--tc-chart-4`, `--tc-chart-5`, `--tc-chart-neutral`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `spendSlices(entries: SpendEntry[], dimension: SpendDimension, previous: SpendEntry[] \| null): SpendSlice[]` | Each slice's cost and share in `entries`, biggest first, with its cost in `previous` (null when it had none) |

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
| `entries` | `el.entries = …;` | `<… entries={…} />` | `<tc-spend-breakdown :entries="…">` | `<tc-spend-breakdown [entries]="…">` | `<tc-spend-breakdown {entries}>` |
| `previous` | `el.previous = …;` | `<… previous={…} />` | `<tc-spend-breakdown :previous="…">` | `<tc-spend-breakdown [previous]="…">` | `<tc-spend-breakdown {previous}>` |
| `dimensions` | `el.dimensions = …;` | `<… dimensions={…} />` | `<tc-spend-breakdown :dimensions="…">` | `<tc-spend-breakdown [dimensions]="…">` | `<tc-spend-breakdown {dimensions}>` |
| `dimensionLabels` | `el.dimensionLabels = …;` | `<… dimensionLabels={…} />` | `<tc-spend-breakdown :dimensionLabels="…">` | `<tc-spend-breakdown [dimensionLabels]="…">` | `<tc-spend-breakdown {dimensionLabels}>` |
| `periods` | `el.periods = …;` | `<… periods={…} />` | `<tc-spend-breakdown :periods="…">` | `<tc-spend-breakdown [periods]="…">` | `<tc-spend-breakdown {periods}>` |

*Also attributes: `heading`, `description`, `dimension`, `period`, `view`, `selected`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-dimension-change` | Yes | `el.addEventListener("tc-dimension-change", (e) => …)` | `ref.current.addEventListener("tc-dimension-change", …)` | `@tc-dimension-change="…"` | `(tc-dimension-change)="…($event)"` | `el.addEventListener("tc-dimension-change", …)` |
| `tc-period-change` | Yes | `el.addEventListener("tc-period-change", (e) => …)` | `ref.current.addEventListener("tc-period-change", …)` | `@tc-period-change="…"` | `(tc-period-change)="…($event)"` | `el.addEventListener("tc-period-change", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-slice-select` | Yes | `el.addEventListener("tc-slice-select", (e) => …)` | `ref.current.addEventListener("tc-slice-select", …)` | `@tc-slice-select="…"` | `(tc-slice-select)="…($event)"` | `el.addEventListener("tc-slice-select", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `dimension`, `period`, `view` and `selected` itself unless a listener calls `preventDefault()` on `tc-dimension-change`, `tc-period-change`, `tc-view-change` or `tc-slice-select` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-spend-breakdown id="spend-breakdown"></tc-spend-breakdown>

<script type="module">
  import "@adamstavely/trenchcoat/spend-breakdown";

  const el = document.querySelector("#spend-breakdown");
  el.addEventListener("tc-dimension-change", (e) => {
    e.preventDefault(); // the element keeps its dimension…
    if (allowed(e.detail.dimension)) el.dimension = e.detail.dimension; // …until the app sets it
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
import "@adamstavely/trenchcoat/spend-breakdown";
import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";

const props = defineProps<{ initial: TcSpendBreakdown["dimension"] }>();
const dimension = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDimensionChange = (e: CustomEvent<{ dimension: TcSpendBreakdown["dimension"] }>) => {
  e.preventDefault();
  dimension.value = e.detail.dimension;
};
</script>

<template>
  <tc-spend-breakdown :dimension="dimension" @tc-dimension-change="onDimensionChange"></tc-spend-breakdown>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SpendBreakdown } from "@adamstavely/trenchcoat/angular/spend-breakdown";
import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";

@Component({
  selector: "app-controlled-spend-breakdown",
  imports: [SpendBreakdown],
  template: `<tc-spend-breakdown [dimension]="dimension()" (tc-dimension-change)="onDimensionChange($event)"></tc-spend-breakdown>`,
})
export class ControlledSpendBreakdown {
  readonly initial = input.required<TcSpendBreakdown["dimension"]>();
  readonly dimension = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDimensionChange(e: CustomEvent<{ dimension: TcSpendBreakdown["dimension"] }>) {
    e.preventDefault();
    this.dimension.set(e.detail.dimension);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/spend-breakdown";
  import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";

  let { initial }: { initial: TcSpendBreakdown["dimension"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let dimension = $derived(initial);
  let el: TcSpendBreakdown;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      dimension = (e as CustomEvent<{ dimension: TcSpendBreakdown["dimension"] }>).detail.dimension;
    };
    el.addEventListener("tc-dimension-change", on);
    return () => el.removeEventListener("tc-dimension-change", on);
  });
</script>

<tc-spend-breakdown bind:this={el} {dimension}></tc-spend-breakdown>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-spend-breakdown")` returns a `TcSpendBreakdown` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";`
- **React / Next.js:** Props: `import type { SpendBreakdownProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SpendBreakdown>`. The element class, for refs: `import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSpendBreakdown["entries"]` with `import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";`
- **Angular:** The directive types the template: `[entries]` takes `TcSpendBreakdown["entries"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSpendBreakdown } from "@adamstavely/trenchcoat/spend-breakdown";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `dimension` | `SpendDimension` | What to split by – controlled when given |
| `defaultDimension` | `SpendDimension` | The dimension on mount when `dimension` isn't controlled |
| `onDimensionChange` | `(dimension: SpendDimension) => void` | The dimension was switched |
| `period` | `string` | The period's id – controlled when given |
| `defaultPeriod` | `string` | The period on mount when `period` isn't controlled |
| `onPeriodChange` | `(period: string) => void` | Another period was picked: pass that period's entries |
| `view` | `SpendView` | Ranked, daily or table – controlled when given |
| `defaultView` | `SpendView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: SpendView) => void` | The view was switched |
| `selected` | `string \| null` | The picked slice's id, or null for all – controlled when given |
| `defaultSelected` | `string \| null` | The picked slice on mount when `selected` isn't controlled |
| `onSliceSelect` | `(selected: string \| null, dimension: SpendDimension) => void` | A slice was picked, or the pick cleared (null) |

*Renamed or hidden on the wrapper: `heading`, `dimension`, `period`, `view`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

The ranked slices are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next slice |
| Home / End | Moves to the first or last slice |
| Enter / Space | Picks the slice, or clears the pick |
| Tab | Moves between the switches, the period select, the slices and Clear |

### Screen readers

The ranked view is a listbox named by the heading; each option reads its name, cost, share of the total and change,
and says whether it's selected. The switches are groups (“Split by”, “View”) of toggle buttons with `aria-pressed`. The
daily chart is hidden from screen readers and replaced by a caption naming the highest day; the table view carries
every number, with a caption. Switching the dimension and picking a slice are confirmed in a polite status message.

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

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.9 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.3 KB** | **9.2 KB** |
| With Lit – the first component on a page | 51.2 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 66 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of entries replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.0 ms | entries: first render, 66 nodes; update 0.2 ms |
| 1,000 items | 1.1 ms | entries: first render, 66 nodes; update 0.2 ms |

What it renders doesn't grow with entries (tested to 1,000 items).

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

- Pass one entry per day and slice; the element sums them, so finer entries work too.
- Give `previous` the period before's entries to get the change in words, or leave it null.
- Keep slice names short – a model id, a feature's name, a person or a team.

## Do and don't

### Do

- Load the new period's entries when `tc-period-change` fires.
- Use the pick to filter the rest of the page.

### Don't

- Don't mix currencies – `currency` applies to every number.
- Don't read “Up” as bad on its own: a feature that's growing on purpose will be up.

## Related

- [Spend Limits](spend-limits.md) – Spend caps per member, team or API key – the workspace default on top, each row's spent of its cap in words and a meter, over-limit rows first, the cap edited in place, Block / Warn / Notify at the cap, Remove and Add limit
- [Budget Alerts](budget-alerts.md) – Spend alerts set by dragging markers along the month's budget – spent so far and the forecast hatched beyond it, a line at the budget, each alert a slider ("Alert at $4,000, 80% of budget") moved by pointer or keys, added by clicking the bar, with its channel, recipients and when the forecast crosses it
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Budget Burn](budget-burn.md) – How fast each budget is being spent – spent against budget, the burn as a bar with a pace marker and Ahead, On or Behind pace in words, people and team, totals in the header and a sort by budget or burn
