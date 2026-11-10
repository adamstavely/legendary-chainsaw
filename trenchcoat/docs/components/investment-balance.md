<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Investment Balance

**Research & portfolio** · New

Are dollars and people following priority? – each tier's share of items, budget and people side by side as numbers and bars, over- and under-invested tiers flagged in words, and the biggest mismatch said in one line

- **Element:** `<tc-investment-balance>`
- **Size:** 7.8 KB gzip · 24.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/investment-balance";` |
| React / Next.js | `import { InvestmentBalance } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/investment-balance";` · tags starting with tc- are custom elements |
| Angular | `import { InvestmentBalance } from "@adamstavely/trenchcoat/angular/investment-balance";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/investment-balance";` |

## Example

The live example is in the gallery at `#/investment-balance`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Are dollars and people flowing to the work that matters most? Each priority tier – Top priority, High, Medium,
Watching, or your own – gets a row with three shares side by side: its share of the items (topics, projects), of the
budget and of the people, each a number and a bar. When a tier's budget or people share sits more than `threshold`
away from its share of items, the measure is flagged Over or Under, with an arrow, so a mismatch reads without colour.
The finding at the top says the biggest mismatch in one line – “Top priority is 9% of topics but draws 30% of the
budget.” – and the page can write its own.

### When to use

- Checking whether a portfolio's money and people follow its priorities: research topics, product bets, programs.
- A planning review, comparing the plan as allocated with a rebalanced one.
- Any split across ranked tiers where the share of resources should track the share of work.

### When not to use

- Spend against each item's own budget – use [Budget Burn](budget-burn.md).
- How loaded each person is – use [Capacity Bars](capacity-bars.md).
- A share of a whole across categories with no ranking – use [Breakdown Chart](breakdown-chart.md).
- Use against a single limit – use [Usage Meter](usage-meter.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Finding** `.ui-invb__finding` – the biggest mismatch in one line, or the page's own
2. **Tier** `.ui-invb__tier` – the tier's badge and name
3. **Measure** `.ui-invb__measure` – a share: the value, its percentage and a bar
4. **Flag** `.ui-invb__flag` – Over or Under, with an arrow, when a share is off balance
5. **Total** `.ui-invb__total` – the items, budget and people across every tier

## Looks

Standard is a white card on a gray tray, with the header on the tray and medium-weight column names. Clean is one
white card with the header as its first row. The bars use `--tc-fill-strong` for items, `--tc-chart-1` for budget and
`--tc-chart-2` for people in both.

## Usage

### HTML

```html
<tc-investment-balance id="balance" item-label="topics"></tc-investment-balance>

<script type="module">
  import "@adamstavely/trenchcoat/investment-balance";
  import "@adamstavely/trenchcoat/tokens.css";

  const balance = document.querySelector("#balance");
  balance.tiers = [
    { id: "p1", badge: "1", label: "Top priority", items: 18, budget: 14200000, people: 38 },
    { id: "p2", badge: "2", label: "High", items: 46, budget: 16800000, people: 49 },
    { id: "p3", badge: "3", label: "Medium", items: 64, budget: 9700000, people: 32 },
  ];
  balance.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { InvestmentBalance, type InvestmentTier } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const tiers: InvestmentTier[] = [
  { id: "p1", badge: "1", label: "Top priority", items: 18, budget: 14200000, people: 38 },
  { id: "p2", badge: "2", label: "High", items: 46, budget: 16800000, people: 49 },
  { id: "p3", badge: "3", label: "Medium", items: 64, budget: 9700000, people: 32 },
];

export function Balance() {
  const [selected, setSelected] = useState<string | null>(null);
  return <InvestmentBalance tiers={tiers} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/investment-balance";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";

defineProps<{ tiers: TcInvestmentBalance["tiers"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-investment-balance :tiers="tiers" @tc-selected-change="onSelectedChange"></tc-investment-balance>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { InvestmentBalance } from "@adamstavely/trenchcoat/angular/investment-balance";
import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";

@Component({
  selector: "app-investment-balance-example",
  imports: [InvestmentBalance],
  template: `<tc-investment-balance [tiers]="tiers()" (tc-selected-change)="onSelectedChange($event)"></tc-investment-balance>`,
})
export class InvestmentBalanceExample {
  readonly tiers = input.required<TcInvestmentBalance["tiers"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/investment-balance";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";

  let { tiers }: { tiers: TcInvestmentBalance["tiers"] } = $props();
  let el: TcInvestmentBalance;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-investment-balance bind:this={el} {tiers}></tc-investment-balance>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Investment vs priority"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `"Are dollars and people flowing to our top-priority work?"` | One line under the heading |
| `tiers` | – | `InvestmentTier[]` | `[]` | The tiers, most important first |
| `itemLabel` | `item-label` | `string` | `"topics"` | What the items are, plural: "topics", "projects" |
| `peopleUnit` | `people-unit` | `string` | `"FTE"` | The unit people are counted in: "FTE", "people" |
| `currency` | `currency` | `string` | `"USD"` | The budget's currency, an ISO 4217 code |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `threshold` | `threshold` | `number` | `0.1` | How far, as a share from 0 to 1, a budget or people share may sit from the items share before it's marked |
| `finding` | `finding` | `string \| undefined` | `undefined` | The finding at the top, in place of the one worked out; an empty string hides it |
| `selected` | `selected` | `string \| null` | `null` | The selected tier's id. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A tier was selected or cleared ({ selected, tier }: InvestmentSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Design tokens it reads (57)

`--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-2`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-weight`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `tiers` | `el.tiers = …;` | `<… tiers={…} />` | `<tc-investment-balance :tiers="…">` | `<tc-investment-balance [tiers]="…">` | `<tc-investment-balance {tiers}>` |

*Also attributes: `heading`, `description`, `item-label`, `people-unit`, `currency`, `locale`, `threshold`, `finding` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-investment-balance id="investment-balance"></tc-investment-balance>

<script type="module">
  import "@adamstavely/trenchcoat/investment-balance";

  const el = document.querySelector("#investment-balance");
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
import "@adamstavely/trenchcoat/investment-balance";
import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";

const props = defineProps<{ initial: TcInvestmentBalance["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcInvestmentBalance["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-investment-balance :selected="selected" @tc-selected-change="onSelectedChange"></tc-investment-balance>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { InvestmentBalance } from "@adamstavely/trenchcoat/angular/investment-balance";
import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";

@Component({
  selector: "app-controlled-investment-balance",
  imports: [InvestmentBalance],
  template: `<tc-investment-balance [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-investment-balance>`,
})
export class ControlledInvestmentBalance {
  readonly initial = input.required<TcInvestmentBalance["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcInvestmentBalance["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/investment-balance";
  import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";

  let { initial }: { initial: TcInvestmentBalance["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcInvestmentBalance;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcInvestmentBalance["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-investment-balance bind:this={el} {selected}></tc-investment-balance>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-investment-balance")` returns a `TcInvestmentBalance` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";`
- **React / Next.js:** Props: `import type { InvestmentBalanceProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof InvestmentBalance>`. The element class, for refs: `import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcInvestmentBalance["tiers"]` with `import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";`
- **Angular:** The directive types the template: `[tiers]` takes `TcInvestmentBalance["tiers"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcInvestmentBalance } from "@adamstavely/trenchcoat/investment-balance";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `selected` | `string \| null` | The selected tier's id – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The tier selected on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, tier?: InvestmentTier) => void` | A tier was selected or cleared; `tier` is the selected tier |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

The tiers are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next tier |
| Home / End | Moves to the first or last tier |
| Enter / Space | Selects the tier, or clears it if it's selected |
| Escape | Clears the selected tier |
| Tab | Leaves the list |

### Screen readers

The tiers are a `listbox` named by the heading. Each tier is an option that reads every value in one go: “Top
priority: 18 topics, 9%; budget $14.2M, 30%, over-invested; people 38 FTE, 27%, over-invested”. The selected tier is
`aria-selected`, and selecting is confirmed in a polite status message, “Selected Top priority”, or “Selection
cleared”. The column names and bars repeat what the options say, so they're hidden.

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

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 17.1 KB | 5.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.5 KB** | **7.9 KB** |
| With Lit – the first component on a page | 46.3 KB | 15.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 139 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of tiers replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 22 ms | tiers: first render, 2,429 nodes; update 14 ms |
| 1,000 items | 359 ms | tiers: first render, 24,029 nodes; update 267 ms |

1,000 items of tiers: 359 ms. It renders every item, so a first render passes 50 ms (a long task) at about 140 items – page or filter longer lists.

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

- Order the tiers from most to least important – the finding names them as given.
- Set `item-label` to what the items are, plural: “topics”, “projects”, “bets”.
- Set `threshold` to the gap your team acts on; 0.1 (ten points) is the default.
- Write your own `finding` when the computed one misses the point, or set it to an empty string to hide it.

## Do and don't

### Do

- Pair a selected tier with the list of its items, or with `budget-burn` filtered to it.
- Use the same tiers across pages, so a tier means one thing.

### Don't

- Don't mix currencies in one view – `currency` applies to every tier.
- Don't use it for fewer than two tiers – there's nothing to balance.
- Don't treat Over as bad by itself: top priorities may well deserve more than their share. The flag says where to
  look, not what to do.

## Related

- [Budget Burn](budget-burn.md) – How fast each budget is being spent – spent against budget, the burn as a bar with a pace marker and Ahead, On or Behind pace in words, people and team, totals in the header and a sort by budget or burn
- [Capacity Bars](capacity-bars.md) – How loaded each person is – their allocation split by what they work on, against their capacity on one shared scale, each piece named with its amount, anyone over capacity marked and counted
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Changelog

- **`tc-investment-balance`:** each priority tier's share of items, budget and people, side by side. - **Flags:** over- and under-invested tiers are flagged in words. - **Summary:** the biggest mismatch is said in one line.
