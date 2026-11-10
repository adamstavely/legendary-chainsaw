<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Compact Breakdown

**Data & charts**

A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes

- **Element:** `<tc-compact-breakdown>`
- **Size:** 10.2 KB gzip · 36.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/compact-breakdown";` |
| React / Next.js | `import { CompactBreakdown } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/compact-breakdown";` · tags starting with tc- are custom elements |
| Angular | `import { CompactBreakdown } from "@adamstavely/trenchcoat/angular/compact-breakdown";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/compact-breakdown";` |

## Example

The live example is in the gallery at `#/compact-breakdown`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One total and what it's made of, in a card small enough for a dashboard row: a big number, a thin stacked bar and
the parts as a ranked list with their values and shares. An optional period switch (7D · 30D · 90D) rolls every
number to the new period, glides the bar to the new split and lets the rows trade places when the ranking changes,
so people see what moved rather than a new card. Pointing at a part in the bar or the list dims the rest and rolls
the big number to that part's value.

### When to use

- A total with three to six parts people compare: revenue by channel, spend by team, tokens by model.
- Dashboard cards where the split matters as much as the total.
- Comparing the same split across a few periods – pass `periods` and swap `items` and `delta` on each change.

### When not to use

- Parts over time, or slicing by more than one dimension – use [Breakdown Chart](breakdown-chart.md).
- One metric and its trend line – use [KPI Chart](kpi-chart.md).
- Several unrelated metrics and how each moved – use [Change Summary](change-summary.md).
- Usage against a limit or plan – use [Usage Meter](usage-meter.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a pie icon and the heading, which names the card and the group
2. **Period switch** `.ui-cb__switch` – the periods, with a pill that slides to the chosen one
3. **Total** `.ui-cb__big` – the big number, with the change against the previous period beside it
4. **Bar** `.ui-cb__bar` – every part's share as a segment
5. **Parts** `.ui-cb__list` – each part's colour, label, value and share, largest first
6. **Footer** `.ui-cb__foot` – the largest part, or your own line

## Looks

Standard sets the card in white on a gray tray, with the header in the tray above it and the footer line below. Clean is a single white
card with hairline shadows, the header as its first row and the footer as its last. The numbers, the bar and the ranking move the same way
in both.

## Usage

### HTML

```html
<tc-compact-breakdown id="revenue" heading="Revenue by channel" total-label="Total revenue"></tc-compact-breakdown>

<script type="module">
  import "@adamstavely/trenchcoat/compact-breakdown";
  import "@adamstavely/trenchcoat/tokens.css";

  const data = {
    "7d": [{ id: "organic", label: "Organic search", value: 18420 }, { id: "paid", label: "Paid ads", value: 9310 }],
    "30d": [{ id: "organic", label: "Organic search", value: 64200 }, { id: "paid", label: "Paid ads", value: 48900 }],
  };
  const card = document.querySelector("#revenue");
  card.periods = [{ id: "7d", label: "7D" }, { id: "30d", label: "30D" }];
  card.items = data["7d"];
  card.format = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
  card.addEventListener("tc-period-change", (e) => (card.items = data[e.detail.period]));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CompactBreakdown, type BreakdownItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data: Record<string, BreakdownItem[]> = {
  "7d": [{ id: "organic", label: "Organic search", value: 18420 }, { id: "paid", label: "Paid ads", value: 9310 }],
  "30d": [{ id: "organic", label: "Organic search", value: 64200 }, { id: "paid", label: "Paid ads", value: 48900 }],
};

export function Revenue() {
  const [period, setPeriod] = useState("7d");
  return (
    <CompactBreakdown
      title="Revenue by channel"
      totalLabel="Total revenue"
      periods={[{ id: "7d", label: "7D" }, { id: "30d", label: "30D" }]}
      period={period}
      onPeriodChange={setPeriod}
      items={data[period]}
      format={(n) => `$${Math.round(n).toLocaleString("en-US")}`}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/compact-breakdown";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";

defineProps<{ items: TcCompactBreakdown["items"]; periods: TcCompactBreakdown["periods"] }>();
const onPeriodChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-compact-breakdown :items="items" :periods="periods" @tc-period-change="onPeriodChange"></tc-compact-breakdown>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CompactBreakdown } from "@adamstavely/trenchcoat/angular/compact-breakdown";
import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";

@Component({
  selector: "app-compact-breakdown-example",
  imports: [CompactBreakdown],
  template: `<tc-compact-breakdown [items]="items()" [periods]="periods()" (tc-period-change)="onPeriodChange($event)"></tc-compact-breakdown>`,
})
export class CompactBreakdownExample {
  readonly items = input.required<TcCompactBreakdown["items"]>();
  readonly periods = input.required<TcCompactBreakdown["periods"]>();
  onPeriodChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/compact-breakdown";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";

  let { items, periods }: { items: TcCompactBreakdown["items"]; periods: TcCompactBreakdown["periods"] } = $props();
  let el: TcCompactBreakdown;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-period-change", on);
    return () => el.removeEventListener("tc-period-change", on);
  });
</script>

<tc-compact-breakdown bind:this={el} {items} {periods}></tc-compact-breakdown>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Breakdown"` | The heading, and the group's name |
| `items` | – | `BreakdownItem[]` | `[]` | The parts of the shown period – the list ranks them by value |
| `periods` | – | `BreakdownPeriod[] \| undefined` | `undefined` | Options of the period switch – no switch when left out |
| `period` | `period` | `string \| undefined` | `undefined` | The chosen period id; unset is the first period |
| `delta` | `delta` | `number \| undefined` | `undefined` | Change against the previous period in percent, e.g. 12.4 or -3 – shown as a small pill |
| `format` | – | `(value: number) => string` | `defaultFormat` | Formats every value, e.g. (n) => `$${Math.round(n).toLocaleString("en-US")}` |
| `totalLabel` | `total-label` | `string` | `"Total"` | Text under the big number while nothing is hovered |
| `footer` | – | `Element \| string \| null \| undefined` | `undefined` | Replaces the footer line: text, or an element (cloned); null hides it; unset shows the largest part |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-period-change` | – | Yes | A period was picked; detail `{ period: string }`. Cancelable: preventDefault() keeps the current period (controlled use) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-compact-breakdown-series-1` | `light-dark(rgba(0, 96, 226, 0.765), #4d8dff)` | standard, clean |
| `--tc-compact-breakdown-series-2` | `light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.62))` | standard, clean |
| `--tc-compact-breakdown-series-3` | `light-dark(rgba(0, 96, 226, 0.32), rgba(77, 141, 255, 0.4))` | standard, clean |
| `--tc-compact-breakdown-series-4` | `light-dark(rgba(0, 96, 226, 0.18), rgba(77, 141, 255, 0.22))` | standard, clean |
| `--tc-compact-breakdown-series-5` | `light-dark(rgba(0, 0, 0, 0.14), rgba(255, 255, 255, 0.16))` | standard, clean |

#### Design tokens it reads (72)

`--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-compact-breakdown :items="…">` | `<tc-compact-breakdown [items]="…">` | `<tc-compact-breakdown {items}>` |
| `periods` | `el.periods = …;` | `<… periods={…} />` | `<tc-compact-breakdown :periods="…">` | `<tc-compact-breakdown [periods]="…">` | `<tc-compact-breakdown {periods}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-compact-breakdown :format="…">` | `<tc-compact-breakdown [format]="…">` | `<tc-compact-breakdown {format}>` |
| `footer` | `el.footer = …;` | `<… footer={…} />` | `<tc-compact-breakdown :footer="…">` | `<tc-compact-breakdown [footer]="…">` | `<tc-compact-breakdown {footer}>` |

*Also attributes: `heading`, `period`, `delta`, `total-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-period-change` | Yes | `el.addEventListener("tc-period-change", (e) => …)` | `ref.current.addEventListener("tc-period-change", …)` | `@tc-period-change="…"` | `(tc-period-change)="…($event)"` | `el.addEventListener("tc-period-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `period` itself unless a listener calls `preventDefault()` on `tc-period-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-compact-breakdown id="compact-breakdown"></tc-compact-breakdown>

<script type="module">
  import "@adamstavely/trenchcoat/compact-breakdown";

  const el = document.querySelector("#compact-breakdown");
  el.addEventListener("tc-period-change", (e) => {
    e.preventDefault(); // the element keeps its period…
    if (allowed(e.detail.period)) el.period = e.detail.period; // …until the app sets it
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
import "@adamstavely/trenchcoat/compact-breakdown";
import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";

const props = defineProps<{ initial: TcCompactBreakdown["period"] }>();
const period = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPeriodChange = (e: CustomEvent<{ period: TcCompactBreakdown["period"] }>) => {
  e.preventDefault();
  period.value = e.detail.period;
};
</script>

<template>
  <tc-compact-breakdown :period="period" @tc-period-change="onPeriodChange"></tc-compact-breakdown>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CompactBreakdown } from "@adamstavely/trenchcoat/angular/compact-breakdown";
import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";

@Component({
  selector: "app-controlled-compact-breakdown",
  imports: [CompactBreakdown],
  template: `<tc-compact-breakdown [period]="period()" (tc-period-change)="onPeriodChange($event)"></tc-compact-breakdown>`,
})
export class ControlledCompactBreakdown {
  readonly initial = input.required<TcCompactBreakdown["period"]>();
  readonly period = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPeriodChange(e: CustomEvent<{ period: TcCompactBreakdown["period"] }>) {
    e.preventDefault();
    this.period.set(e.detail.period);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/compact-breakdown";
  import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";

  let { initial }: { initial: TcCompactBreakdown["period"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let period = $derived(initial);
  let el: TcCompactBreakdown;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      period = (e as CustomEvent<{ period: TcCompactBreakdown["period"] }>).detail.period;
    };
    el.addEventListener("tc-period-change", on);
    return () => el.removeEventListener("tc-period-change", on);
  });
</script>

<tc-compact-breakdown bind:this={el} {period}></tc-compact-breakdown>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-compact-breakdown")` returns a `TcCompactBreakdown` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";`
- **React / Next.js:** Props: `import type { CompactBreakdownProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CompactBreakdown>`. The element class, for refs: `import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCompactBreakdown["items"]` with `import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";`
- **Angular:** The directive types the template: `[items]` takes `TcCompactBreakdown["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCompactBreakdown } from "@adamstavely/trenchcoat/compact-breakdown";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the group's accessible name (the element's `heading`) |
| `items` | `TcCompactBreakdown["items"]` | The parts of the shown period – the list ranks them by value |
| `period` | `string` | Controlled period id |
| `defaultPeriod` | `string` | The period chosen on mount when `period` isn't controlled – defaults to the first period |
| `onPeriodChange` | `(id: string) => void` | Called with the new period id – pass the matching `items` and `delta` back in |
| `footer` | `React.ReactNode` | Replaces the footer line (default: the largest part); null hides it |

*Renamed or hidden on the wrapper: `heading`, `footer`, `period`, `items`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the chosen period in the switch, then on |
| → / ↓ | Picks the next period (wraps at the end) |
| ← / ↑ | Picks the previous period (wraps at the start) |
| Home / End | Picks the first or the last period |
| Enter / Space | Picks the focused period |

Highlighting a part follows the pointer only; the list states every part's value and share for keyboard and
screen reader users.

### Screen readers

The card is a `group` named by its heading. The animated big number and its caption are hidden; in their place a
visually hidden line reads the total and the change – “Total revenue: $40,860, up 12.4% against the previous
period”. The period switch is a `radiogroup` named “Period” whose options are radios with `aria-checked`. The
parts are a list, each item reading its label, value and share (“Organic search $18,420 44%”). The bar is hidden.
A period change isn't announced on its own – the newly checked radio is.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.8 KB | 8.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| `src/internal/ease.ts` · Dependency | 0.0 KB | – |
| **Added to a page that already has Lit** | **36.1 KB** | **10.2 KB** |
| With Lit – the first component on a page | 58.8 KB | 17.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 58 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of items replaced |
| First on the page | 9.0 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.6 ms | items: first render, 628 nodes; update 1.2 ms |
| 1,000 items | 44 ms | items: first render, 6,028 nodes; update 13 ms |

1,000 items of items: 44 ms, 6,028 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 5 React commits (clean), 5 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **43 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Make the heading say what's split and by what: “Revenue by channel”, “Spend by team”.
- Set `totalLabel` to name the total (“Total revenue”); it's also what screen readers hear first.
- Keep part labels to one or two words – long ones are cut with an ellipsis and their full text in a tooltip.
- Pass a `format` that suits the unit, like `(n) => "$" + Math.round(n).toLocaleString("en-US")`.
- Use short period labels: “7D”, “30D”, “90D”.

## Do and don't

### Do

- Give each part a stable `id`, so it keeps its colour and place in the bar across periods.
- Pass `delta` for the period shown; it's hidden while a part is highlighted.
- Keep to five parts or fewer for the default colours; group the long tail into “Other”.

### Don't

- Don't use it for values that don't add up to a total – negative values count as zero.
- Don't change `items` without changing `period` (or the other way round) – the card animates whatever pair it's
  given.
- Don't hide the footer just to save space; the largest part is useful context.

## Related

- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Change Summary](change-summary.md) – What moved since last time – one metric per row with a colored trend
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
