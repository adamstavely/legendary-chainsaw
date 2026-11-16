<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Cost Waterfall

**Agents** · New

Where an agent run's money and tokens went – each step a bar stepping up to the total, the costliest in the accent, Cost or Tokens and By cost or In order, a total that rolls up as steps arrive, and details per row

- **Element:** `<tc-cost-waterfall>`
- **Size:** 8.9 KB gzip · 27.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/cost-waterfall";` |
| React / Next.js | `import { CostWaterfall } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/cost-waterfall";` · tags starting with tc- are custom elements |
| Angular | `import { CostWaterfall } from "@adamstavely/trenchcoat/angular/cost-waterfall";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/cost-waterfall";` |

## Example

The live example is in the gallery at `#/cost-waterfall`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where the money and the tokens of one agent run went. Every LLM call, tool call and sub-agent is a step of a
waterfall: its bar starts where the steps before it left off, so the bars step across to the total and the long ones
are where the money went. Each row says the step's name, kind, model, tokens or cost, and time; the costliest step is
in the accent and marked "Costliest", and the total sits under them all. Cost / Tokens switches what the bars measure,
and By cost / In order puts the most expensive step on top or keeps the run's order. In a live run new steps appear,
the bars glide to their new places and the total rolls up to its new figure. A row unfolds its details below it.

### When to use

- Showing what an agent run cost and which steps spent it – next to a chat, in a run log or on a billing page.
- Finding the expensive step: the long bars are where the money went.
- Live runs, where new steps appear and the totals climb while the agent works.

### When not to use

- When each step ran and how long it took – use [Trace Waterfall](trace-waterfall.md).
- A printable cost record with tables per model and tool – use [Run Receipt](run-receipt.md).
- A general bridge from one figure to another – use [Waterfall Chart](waterfall-chart.md).
- Spend across many runs, by model, feature or team – use [Spend Breakdown](spend-breakdown.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Switches** `.ui-cwf__bar` – Cost / Tokens and By cost / In order, each a radio group `.ui-cwf__seg`
2. **Steps** `.ui-cwf__rows` – a row per step `.ui-cwf__row`: its kind mark `.ui-cwf__mark`, name `.ui-cwf__title` and kind `.ui-cwf__kind`, model `.ui-cwf__model`, bar `.ui-cwf__step`, value `.ui-cwf__value` and time `.ui-cwf__time`
3. **Details** `.ui-cwf__detail` – model, cost, tokens in and out, time, share of the total, input and output
4. **Total** `.ui-cwf__row--total` – the total bar and figure `.ui-cwf__total-value`
5. **Empty** `.ui-cwf__empty` – "No steps yet"

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Each bar starts where the one above it ended, with a dashed riser joining them; the costliest step's bar is in
the accent, the rest are quiet gray, and the total's bar is the strong ink. The kinds have a coloured mark of their own
shape – a circle for LLM calls, a square for tools, a diamond for sub-agents – and their name in words. The header's
right side repeats the total. A page can set `--tc-cwf-bar-h` (a bar's height) and the kind inks `--tc-cwf-llm`,
`--tc-cwf-tool` and `--tc-cwf-subagent`. Narrower than 520 px, the model and time columns are left out; the details
still have them.

## Usage

### HTML

```html
<tc-cost-waterfall id="costs" subtitle="Q3 water-quality report"></tc-cost-waterfall>

<script type="module">
  import "@adamstavely/trenchcoat/cost-waterfall";
  import "@adamstavely/trenchcoat/tokens.css";

  const costs = document.querySelector("#costs");
  costs.steps = [
    { id: "plan", name: "Plan the report", kind: "llm", model: "large-1", tokensIn: 1840, tokensOut: 412, cost: 0.0584, duration: 2300 },
    { id: "research", name: "Researcher", kind: "subagent", model: "small-2", tokensIn: 14200, tokensOut: 1130, cost: 0.0412, duration: 13600 },
    { id: "pdf", name: "PDF reader", kind: "tool", cost: 0.024, duration: 6100 },
    { id: "write", name: "Write two pages", kind: "llm", model: "large-1", tokensIn: 12400, tokensOut: 2210, cost: 0.3312, duration: 16300 },
  ];
  costs.addEventListener("tc-measure-change", (e) => console.log(e.detail.measure));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CostWaterfall, type CostStep, type CostWaterfallMeasure } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RunCosts({ steps }: { steps: CostStep[] }) {
  const [measure, setMeasure] = useState<CostWaterfallMeasure>("cost");
  return <CostWaterfall subtitle="Q3 water-quality report" steps={steps} measure={measure} onMeasureChange={setMeasure} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/cost-waterfall";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";

defineProps<{ steps: TcCostWaterfall["steps"]; labels: TcCostWaterfall["labels"] }>();
const onMeasureChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-cost-waterfall :steps="steps" :labels="labels" @tc-measure-change="onMeasureChange"></tc-cost-waterfall>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CostWaterfall } from "@adamstavely/trenchcoat/angular/cost-waterfall";
import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";

@Component({
  selector: "app-cost-waterfall-example",
  imports: [CostWaterfall],
  template: `<tc-cost-waterfall [steps]="steps()" [labels]="labels()" (tc-measure-change)="onMeasureChange($event)"></tc-cost-waterfall>`,
})
export class CostWaterfallExample {
  readonly steps = input.required<TcCostWaterfall["steps"]>();
  readonly labels = input.required<TcCostWaterfall["labels"]>();
  onMeasureChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cost-waterfall";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";

  let { steps, labels }: { steps: TcCostWaterfall["steps"]; labels: TcCostWaterfall["labels"] } = $props();
  let el: TcCostWaterfall;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-measure-change", on);
    return () => el.removeEventListener("tc-measure-change", on);
  });
</script>

<tc-cost-waterfall bind:this={el} {steps} {labels}></tc-cost-waterfall>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Cost waterfall"` | The heading; empty leaves the header out |
| `subtitle` | `subtitle` | `string` | `""` | A line under the heading – the run or the agent |
| `steps` | – | `CostStep[]` | `[]` | The run's steps, in the order they ran |
| `measure` | `measure` | `CostWaterfallMeasure` | `"cost"` | What the bars measure: "cost" or "tokens" |
| `order` | `order` | `CostWaterfallOrder` | `"cost"` | "cost" puts the most expensive step on top; "run" keeps the run's order |
| `openId` | `open-id` | `string \| null` | `null` | Id of the step whose details are open |
| `currency` | `currency` | `string` | `"USD"` | ISO 4217 currency code for every amount |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for numbers and amounts |
| `labels` | – | `Partial<CostWaterfallLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-measure-change` | – | Yes | Cost or Tokens was picked ({ measure }: CostWaterfallMeasureChange); cancelable – prevented, `measure` stays as it was |
| `tc-order-change` | – | Yes | By cost or In order was picked ({ order }: CostWaterfallOrderChange); cancelable – prevented, `order` stays as it was |
| `tc-open-change` | – | Yes | A step's details opened or closed ({ openId, step }: CostWaterfallOpenChange); cancelable – prevented, `openId` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cwf-bar-h` | `10px` | both |
| `--tc-cwf-mark` | `10px` | both |
| `--tc-cwf-llm` | `var(--tc-chart-1)` | both |
| `--tc-cwf-tool` | `var(--tc-chart-2)` | both |
| `--tc-cwf-subagent` | `var(--tc-chart-3)` | both |
| `--tc-cwf-quiet` | `light-dark(color-mix(in oklab, var(--tc-text-muted) 38%, transparent), color-mix(in oklab, var(--tc-text-muted) 55%, transparent))` | both |
| `--tc-cwf-columns` | `minmax(0, 1.4fr) minmax(0, 1.4fr) 5rem 1rem` | both |

#### Design tokens it reads (56)

`--tc-accent`, `--tc-accent-text`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-2`, `--tc-chart-3`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-cwf-from`, `--tc-cwf-ink`, `--tc-cwf-to`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-slow`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-info-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `stepTokens(s: CostStep): void` | A step's tokens, in and out together |
| `stepValue(s: CostStep, measure: CostWaterfallMeasure): void` | What a step measures: its cost or its tokens |
| `costWaterfall(steps: CostStep[], measure: CostWaterfallMeasure, order: CostWaterfallOrder): void` | The rows of the waterfall: the steps in the order shown, each with where its bar starts and ends |

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-cost-waterfall :steps="…">` | `<tc-cost-waterfall [steps]="…">` | `<tc-cost-waterfall {steps}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-cost-waterfall :labels="…">` | `<tc-cost-waterfall [labels]="…">` | `<tc-cost-waterfall {labels}>` |

*Also attributes: `heading`, `subtitle`, `measure`, `order`, `open-id`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-measure-change` | Yes | `el.addEventListener("tc-measure-change", (e) => …)` | `onMeasureChange={…}` | `@tc-measure-change="…"` | `(tc-measure-change)="…($event)"` | `el.addEventListener("tc-measure-change", …)` |
| `tc-order-change` | Yes | `el.addEventListener("tc-order-change", (e) => …)` | `onOrderChange={…}` | `@tc-order-change="…"` | `(tc-order-change)="…($event)"` | `el.addEventListener("tc-order-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `measure` and `order` itself unless a listener calls `preventDefault()` on `tc-measure-change` or `tc-order-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-cost-waterfall id="cost-waterfall"></tc-cost-waterfall>

<script type="module">
  import "@adamstavely/trenchcoat/cost-waterfall";

  const el = document.querySelector("#cost-waterfall");
  el.addEventListener("tc-measure-change", (e) => {
    e.preventDefault(); // the element keeps its measure…
    if (allowed(e.detail.measure)) el.measure = e.detail.measure; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { CostWaterfall } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof CostWaterfall>;
type Props = Omit<Own, "measure" | "onMeasureChange"> & { initial: NonNullable<Own["measure"]> };

// Controlled: passing measure makes the wrapper prevent the element's own change; the app sets it
export function ControlledCostWaterfall({ initial, ...props }: Props) {
  const [measure, setMeasure] = useState<Own["measure"]>(initial);
  return <CostWaterfall {...props} measure={measure} onMeasureChange={(next) => setMeasure(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/cost-waterfall";
import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";

const props = defineProps<{ initial: TcCostWaterfall["measure"] }>();
const measure = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMeasureChange = (e: CustomEvent<{ measure: TcCostWaterfall["measure"] }>) => {
  e.preventDefault();
  measure.value = e.detail.measure;
};
</script>

<template>
  <tc-cost-waterfall :measure="measure" @tc-measure-change="onMeasureChange"></tc-cost-waterfall>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CostWaterfall } from "@adamstavely/trenchcoat/angular/cost-waterfall";
import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";

@Component({
  selector: "app-controlled-cost-waterfall",
  imports: [CostWaterfall],
  template: `<tc-cost-waterfall [measure]="measure()" (tc-measure-change)="onMeasureChange($event)"></tc-cost-waterfall>`,
})
export class ControlledCostWaterfall {
  readonly initial = input.required<TcCostWaterfall["measure"]>();
  readonly measure = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMeasureChange(e: CustomEvent<{ measure: TcCostWaterfall["measure"] }>) {
    e.preventDefault();
    this.measure.set(e.detail.measure);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cost-waterfall";
  import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";

  let { initial }: { initial: TcCostWaterfall["measure"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let measure = $derived(initial);
  let el: TcCostWaterfall;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      measure = (e as CustomEvent<{ measure: TcCostWaterfall["measure"] }>).detail.measure;
    };
    el.addEventListener("tc-measure-change", on);
    return () => el.removeEventListener("tc-measure-change", on);
  });
</script>

<tc-cost-waterfall bind:this={el} {measure}></tc-cost-waterfall>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-cost-waterfall")` returns a `TcCostWaterfall` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";`
- **React / Next.js:** Props: `import type { CostWaterfallProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CostWaterfall>`. The element class, for refs: `import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCostWaterfall["steps"]` with `import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";`
- **Angular:** The directive types the template: `[steps]` takes `TcCostWaterfall["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCostWaterfall } from "@adamstavely/trenchcoat/cost-waterfall";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `measure` | `CostWaterfallMeasure` | Controlled measure: "cost" or "tokens" |
| `defaultMeasure` | `CostWaterfallMeasure` | The measure on mount when `measure` isn't controlled |
| `onMeasureChange` | `(measure: CostWaterfallMeasure) => void` | Called when Cost or Tokens is picked |
| `order` | `CostWaterfallOrder` | Controlled order: "cost" (most expensive first) or "run" |
| `defaultOrder` | `CostWaterfallOrder` | The order on mount when `order` isn't controlled |
| `onOrderChange` | `(order: CostWaterfallOrder) => void` | Called when By cost or In order is picked |
| `openId` | `string \| null` | Controlled id of the step whose details are open |
| `defaultOpenId` | `string \| null` | The open step on mount when `openId` isn't controlled |
| `onOpenChange` | `(openId: string \| null, step?: CostStep) => void` | Called when a step's details open (with the step) or close (null) |

*Renamed or hidden on the wrapper: `heading`, `measure`, `order`, `openId`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the two switches and the steps – one stop each |
| ← / → | Picks the other option of a switch |
| ↑ / ↓ | Moves between steps |
| Home / End | Goes to the first or last step |
| Enter / Space | Opens or closes a step's details |

### Screen readers

The switches are radio groups named "Measure" and "Order". The steps are a list of buttons, each read with its name,
kind, model, value and time, and saying whether its details are expanded; the details are a region named after the
step. The bars are drawn and hidden – the value in words says the same.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
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

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.0 KB | 6.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.6 KB** | **8.9 KB** |
| With Lit – the first component on a page | 48.3 KB | 15.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.0 ms** | the gallery demo's data, 161 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of steps replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | steps: first render, 1,556 nodes; update 1.9 ms |
| 1,000 items | 76 ms | steps: first render, 15,056 nodes; update 17 ms |

1,000 items of steps: 76 ms. It renders every item, so a first render passes 50 ms (a long task) at about 660 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give each step a short name that says what it did ("Write two pages"), and the model as the provider writes it.
- `cost` is in the element's `currency`; amounts under a cent keep more decimals so they don't read as zero.
- Pass `tokensIn` and `tokensOut` for model calls so Tokens has something to show; tools usually have none.
- Mark a step that's still going with `running`.

## Do and don't

### Do

- Keep the default By cost order when the question is "where did the money go".
- Use In order when the page also shows the run's trace, so the rows line up with it.

### Don't

- Don't mix currencies in one run – the element doesn't convert.
- Don't use it for spend over days and weeks – it shows one run.

## Related

- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Run Receipt](run-receipt.md) – What one agent run cost, set out like a receipt – run id with Copy, when, duration and status in words, line-item tables for models (calls, input, output and cached tokens), tools, web lookups and retries, the subtotal, cache savings and total, the costliest step with its share, and Open trace and Download CSV
- [Waterfall Chart](waterfall-chart.md) – How a starting figure becomes an ending one – steps up and down bridged by dashed connectors, totals on the baseline, rises and falls in the status inks with a legend, signed changes beside each bar and a table view
- [Spend Breakdown](spend-breakdown.md) – AI spend split by model, feature, user or team for a period – a ranked list with each slice's cost, share and change on the period before in words, a stacked bar per day, or a table, with picking a slice to filter and the total in the header
