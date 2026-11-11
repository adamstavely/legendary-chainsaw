<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Experiment Card

**Data & charts**

An A/B test in two lines that quietly unfolds on hover – variants linked to a tiny chart, a metric switch with rolling numbers, and a winner you pick with a click

- **Element:** `<tc-experiment-card>`
- **Size:** 11.8 KB gzip · 48.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/experiment-card";` |
| React / Next.js | `import { ExperimentCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/experiment-card";` · tags starting with tc- are custom elements |
| Angular | `import { ExperimentCard } from "@adamstavely/trenchcoat/angular/experiment-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/experiment-card";` |

## Example

The live example is in the gallery at `#/experiment-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An A/B test in two lines – its name, status, who is ahead and by how much, next to a tiny column per variant – that
unfolds when people point at it or open it. Open, it lists the variants with their value and lift against the
control, and a switch moves between metrics: the numbers roll, the bars glide and the leader follows. Pointing at a
variant lights up its column and says how many visitors it had and how confident the result is. Pressing a variant
picks it as the winner, and an action – “Ship One-page checkout” – appears for it.

### When to use

- A list or dashboard of experiments, where each stays small until someone looks closer.
- Tests with two to four variants and one to three metrics.
- Calling a winner and acting on it (ship, roll out, stop) from where the result is shown.

### When not to use

- A project with subtasks and people – use [Project Card](project-card.md).
- One metric over time – use [KPI Chart](kpi-chart.md).
- Several metrics that moved since last time, without variants – use [Change Summary](change-summary.md).
- A total split into its parts – use [Compact Breakdown](compact-breakdown.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Chart** `.ui-xc__chart` – one column per variant, linked to its row
2. **Status** `.ui-xc__tag` – where the test stands, with `note` beside it
3. **Leader** `.ui-xc__lead` – the variant ahead and its lift, or “No lift yet”
4. **Metric switch** `.ui-xc__switch` – picks the metric every number shows
5. **Variant** `.ui-xc__row` – key, name, value, lift against the control and a bar; press to pick it
6. **Tray** `.ui-xc__foot` – what's under the pointer or picked, and the action

## Looks

Standard sets the white card on a gray tray, the metric switch as a segmented control with a sliding thumb and the
line and action on the tray below. Clean is one white card with hairline shadows: the metrics become separate
outlined options, the tray its last row, and icons a size up with thinner lines. Both roll the numbers and link
columns to rows the same way.

## Usage

### HTML

```html
<tc-experiment-card id="test" heading="Checkout redesign" note="Day 9 of 14"></tc-experiment-card>

<script type="module">
  import "@adamstavely/trenchcoat/experiment-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#test");
  card.status = { label: "Running", tone: "green" };
  card.metrics = [{ id: "conversion", label: "Conversion", format: (n) => `${n.toFixed(2)}%` }];
  card.variants = [
    { id: "a", key: "A", name: "Current checkout", control: true, visitors: 12480, values: { conversion: 3.12 } },
    { id: "b", key: "B", name: "One-page checkout", visitors: 12391, values: { conversion: 3.71 }, confidence: { conversion: 97.4 } },
  ];
  card.action = { label: (v) => `Ship ${v.name}`, onClick: (v) => console.log("ship", v.id) };
  card.addEventListener("tc-winner-change", (e) => console.log(e.detail.winner));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ExperimentCard, type ExperimentMetric, type ExperimentVariant } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const metrics: ExperimentMetric[] = [{ id: "conversion", label: "Conversion", format: (n) => `${n.toFixed(2)}%` }];
const variants: ExperimentVariant[] = [
  { id: "a", key: "A", name: "Current checkout", control: true, visitors: 12480, values: { conversion: 3.12 } },
  { id: "b", key: "B", name: "One-page checkout", visitors: 12391, values: { conversion: 3.71 }, confidence: { conversion: 97.4 } },
];

export function Checkout() {
  const [winner, setWinner] = useState<string | null>(null);
  return (
    <ExperimentCard
      title="Checkout redesign"
      status={{ label: "Running", tone: "green" }}
      note="Day 9 of 14"
      variants={variants}
      metrics={metrics}
      winner={winner}
      onWinnerChange={setWinner}
      action={{ label: (v) => `Ship ${v.name}`, onClick: (v) => console.log("ship", v.id) }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/experiment-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";

defineProps<{ variants: TcExperimentCard["variants"]; metrics: TcExperimentCard["metrics"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-experiment-card :variants="variants" :metrics="metrics" @tc-open-change="onOpenChange"></tc-experiment-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ExperimentCard } from "@adamstavely/trenchcoat/angular/experiment-card";
import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";

@Component({
  selector: "app-experiment-card-example",
  imports: [ExperimentCard],
  template: `<tc-experiment-card [variants]="variants()" [metrics]="metrics()" (tc-open-change)="onOpenChange($event)"></tc-experiment-card>`,
})
export class ExperimentCardExample {
  readonly variants = input.required<TcExperimentCard["variants"]>();
  readonly metrics = input.required<TcExperimentCard["metrics"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/experiment-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";

  let { variants, metrics }: { variants: TcExperimentCard["variants"]; metrics: TcExperimentCard["metrics"] } = $props();
  let el: TcExperimentCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-experiment-card bind:this={el} {variants} {metrics}></tc-experiment-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The test's name |
| `variants` | – | `ExperimentVariant[]` | `[]` | The variants under test, the control first (or marked `control`) – one row and one chart column each |
| `metrics` | – | `ExperimentMetric[]` | `[]` | The metrics to compare on; with more than one, a switch picks which one the card shows |
| `metric` | `metric` | `string \| undefined` | `undefined` | The metric id shown; unset shows the first metric |
| `winner` | `winner` | `string \| null` | `null` | The id of the variant picked as the winner, or null |
| `status` | – | `ExperimentStatus \| undefined` | `undefined` | The tag under the title, e.g. { label: "Running", tone: "green" } |
| `note` | `note` | `string` | `""` | Short text next to the status, e.g. "Day 9 of 14" |
| `action` | – | `ExperimentAction \| undefined` | `undefined` | The button that appears on the tray once a winner is picked |
| `hint` | `hint` | `string \| Element \| undefined` | `undefined` | Replaces the line on the tray while nothing is hovered or picked: text, or an element (cloned) |
| `trigger` | `trigger` | `"hover" \| "click"` | `"hover"` | "hover" opens under the pointer (taps and the keyboard still toggle), "click" only on click |
| `open` | `open` | `boolean` | `false` | Whether the card is unfolded, showing the metric switch, the variants and the tray |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The card opens or closes; detail `{ open: boolean }`. Cancelable. |
| `tc-metric-change` | – | Yes | Another metric was picked; detail `{ metric: string }`. Cancelable. |
| `tc-winner-change` | – | Yes | A variant was picked as the winner, or the pick cleared; detail `{ winner: string \| null }`. Cancelable. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-experiment-card-series-control` | `light-dark(rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.3))` | standard, clean |
| `--tc-experiment-card-series-1` | `light-dark(rgba(0, 96, 226, 0.765), #4d8dff)` | standard, clean |
| `--tc-experiment-card-series-2` | `light-dark(#5b5bd6, #8585f0)` | standard, clean |
| `--tc-experiment-card-series-3` | `#e8a20c` | standard, clean |
| `--tc-experiment-card-series-4` | `#1a9a52` | standard, clean |

#### Design tokens it reads (104)

`--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-experiment-card-color`, `--tc-experiment-card-size`, `--tc-experiment-card-tag-bg`, `--tc-experiment-card-tag-fg`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `variants` | `el.variants = …;` | `<… variants={…} />` | `<tc-experiment-card :variants="…">` | `<tc-experiment-card [variants]="…">` | `<tc-experiment-card {variants}>` |
| `metrics` | `el.metrics = …;` | `<… metrics={…} />` | `<tc-experiment-card :metrics="…">` | `<tc-experiment-card [metrics]="…">` | `<tc-experiment-card {metrics}>` |
| `status` | `el.status = …;` | `<… status={…} />` | `<tc-experiment-card :status="…">` | `<tc-experiment-card [status]="…">` | `<tc-experiment-card {status}>` |
| `action` | `el.action = …;` | `<… action={…} />` | `<tc-experiment-card :action="…">` | `<tc-experiment-card [action]="…">` | `<tc-experiment-card {action}>` |

*Also attributes: `heading`, `metric`, `winner`, `note`, `hint`, `trigger`, `open` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-metric-change` | Yes | `el.addEventListener("tc-metric-change", (e) => …)` | `ref.current.addEventListener("tc-metric-change", …)` | `@tc-metric-change="…"` | `(tc-metric-change)="…($event)"` | `el.addEventListener("tc-metric-change", …)` |
| `tc-winner-change` | Yes | `el.addEventListener("tc-winner-change", (e) => …)` | `ref.current.addEventListener("tc-winner-change", …)` | `@tc-winner-change="…"` | `(tc-winner-change)="…($event)"` | `el.addEventListener("tc-winner-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `metric`, `winner` and `open` itself unless a listener calls `preventDefault()` on `tc-metric-change`, `tc-winner-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-experiment-card id="experiment-card"></tc-experiment-card>

<script type="module">
  import "@adamstavely/trenchcoat/experiment-card";

  const el = document.querySelector("#experiment-card");
  el.addEventListener("tc-metric-change", (e) => {
    e.preventDefault(); // the element keeps its metric…
    if (allowed(e.detail.metric)) el.metric = e.detail.metric; // …until the app sets it
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
import "@adamstavely/trenchcoat/experiment-card";
import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";

const props = defineProps<{ initial: TcExperimentCard["metric"] }>();
const metric = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMetricChange = (e: CustomEvent<{ metric: TcExperimentCard["metric"] }>) => {
  e.preventDefault();
  metric.value = e.detail.metric;
};
</script>

<template>
  <tc-experiment-card :metric="metric" @tc-metric-change="onMetricChange"></tc-experiment-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ExperimentCard } from "@adamstavely/trenchcoat/angular/experiment-card";
import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";

@Component({
  selector: "app-controlled-experiment-card",
  imports: [ExperimentCard],
  template: `<tc-experiment-card [metric]="metric()" (tc-metric-change)="onMetricChange($event)"></tc-experiment-card>`,
})
export class ControlledExperimentCard {
  readonly initial = input.required<TcExperimentCard["metric"]>();
  readonly metric = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMetricChange(e: CustomEvent<{ metric: TcExperimentCard["metric"] }>) {
    e.preventDefault();
    this.metric.set(e.detail.metric);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/experiment-card";
  import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";

  let { initial }: { initial: TcExperimentCard["metric"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let metric = $derived(initial);
  let el: TcExperimentCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      metric = (e as CustomEvent<{ metric: TcExperimentCard["metric"] }>).detail.metric;
    };
    el.addEventListener("tc-metric-change", on);
    return () => el.removeEventListener("tc-metric-change", on);
  });
</script>

<tc-experiment-card bind:this={el} {metric}></tc-experiment-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-experiment-card")` returns a `TcExperimentCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";`
- **React / Next.js:** Props: `import type { ExperimentCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ExperimentCard>`. The element class, for refs: `import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcExperimentCard["variants"]` with `import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";`
- **Angular:** The directive types the template: `[variants]` takes `TcExperimentCard["variants"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcExperimentCard } from "@adamstavely/trenchcoat/experiment-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The test's name |
| `variants` | `ExperimentVariant[]` | The variants under test, the control first (or marked `control`) – one row and one chart column each |
| `metrics` | `ExperimentMetric[]` | The metrics to compare on; with more than one, a switch picks which one the card shows |
| `metric` | `string` | Controlled metric id |
| `defaultMetric` | `string` | Starting metric id when `metric` isn't controlled – defaults to the first metric |
| `onMetricChange` | `(id: string) => void` | Called with the id of the metric picked |
| `winner` | `string \| null` | Controlled id of the variant picked as the winner |
| `defaultWinner` | `string \| null` | Starting winner when `winner` isn't controlled – defaults to none |
| `onWinnerChange` | `(id: string \| null) => void` | Called with the id of the variant picked as the winner, or null when the pick is cleared |
| `status` | `{ label: string; tone?: ExperimentTone }` | The tag under the title, e.g. { label: "Running", tone: "green" } |
| `note` | `string` | Short text next to the status, e.g. "Day 9 of 14" |
| `action` | `{ label: string \| ((variant: ExperimentVariant) => string); onClick: (variant: ExperimentVariant) => void \| Promise<unknown> }` | The button that appears on the tray (Clean: in the last row) once a winner is picked. `label` gets the picked variant. `onClick` may return a promise: the button waits while it runs, and a rejection says so on the tray and lets you try again |
| `hint` | `React.ReactNode` | Replaces the line on the tray (Clean: in the last row) while nothing is hovered or picked |
| `trigger` | `"hover" \| "click"` | "hover" opens under the pointer (taps and the keyboard still toggle), "click" only on click |
| `open` | `boolean` | Controlled open state |
| `defaultOpen` | `boolean` | Whether the card starts unfolded when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | Called when the card opens or closes |

*Renamed or hidden on the wrapper: `heading`, `variants`, `metrics`, `metric`, `winner`, `status`, `note`, `action`, `hint`, `trigger`, `open`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the head: opens or closes the card. On a variant: picks it as the winner, or clears the pick |
| ← → ↑ ↓ | In the metric switch: picks the previous or next metric, wrapping |
| Home / End | In the metric switch: picks the first or last metric |
| Escape | Closes the card and moves focus to the head |
| Tab | Moves through the head, and with the card open, the metric switch, the variants and the action |

### Screen readers

The head is a button with `aria-expanded` that reads the test, its status and the leader: “Checkout redesign,
Running, One-page checkout is ahead by 18.9 percent”. The metric switch is a radio group named “Metric”. Variants are
toggle buttons with `aria-pressed` in a group named “Winner”, each named with what the row shows and what the
pointer would reveal: “B One-page checkout 3.71% +18.9%, up 18.9 percent, better, 12,391 visitors, 97% confidence”.
The chart is hidden. A polite status region says “One-page checkout picked”, or “Couldn’t finish One-page checkout –
try again” when the action's promise rejects; while it runs the action button is `aria-busy`.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 40.9 KB | 9.5 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| `src/internal/ease.ts` · Dependency | 0.0 KB | – |
| **Added to a page that already has Lit** | **48.8 KB** | **11.8 KB** |
| With Lit – the first component on a page | 71.5 KB | 19.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.1 ms** | the gallery demo's data, 68 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of variants replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 22 ms | variants: first render, 1,263 nodes; update 2.2 ms |
| 1,000 items | 119 ms | variants: first render, 12,363 nodes; update 21 ms |

1,000 items of variants: 119 ms. It renders every item, so a first render passes 50 ms (a long task) at about 420 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the test after what changes: “Checkout redesign”.
- Give variants a one-letter `key` and a name that says what's different: “One-page checkout”, “Express pay first”.
- Format each metric the way people read it (`format`: “3.12%”, “$4.86”) and set `lowerIsBetter` for bounce rate
  or cost, so a drop reads as better.
- Keep `note` to where the test is in time: “Day 9 of 14”.
- Make the action's `label` a function of the picked variant, so the button names it: “Ship One-page checkout”.

## Do and don't

### Do

- Pass `confidence` per metric so people can see whether a lift is worth acting on.
- Return a promise from the action's `onClick` for work that takes time – the card waits and offers a retry.
- Update `status` and `note` once the action has run (“Concluded”, “Shipped today”).

### Don't

- Don't add more than four variants – the columns and rows stop fitting.
- Don't show values without a control: the first variant is the baseline unless one is marked `control`.
- Don't use the leader chip as the decision – it shows the biggest lift, not whether it's significant.

## Related

- [Project Card](project-card.md) – A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Change Summary](change-summary.md) – What moved since last time – one metric per row with a colored trend
- [Compact Breakdown](compact-breakdown.md) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes
