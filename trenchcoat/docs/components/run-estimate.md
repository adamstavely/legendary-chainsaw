<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Run Estimate

**Data & charts** · New

What a bulk AI run will cost before it starts – the cost as a low–high range, cells, tokens, web lookups and time in words and figures, a table of where the money goes, the budget left with a warning when the run could go over it, Run on 50 rows first, a spend cap, and Start

- **Element:** `<tc-run-estimate>`
- **Size:** 10.4 KB gzip · 34.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/run-estimate";` |
| React / Next.js | `import { RunEstimate } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/run-estimate";` · tags starting with tc- are custom elements |
| Angular | `import { RunEstimate } from "@adamstavely/trenchcoat/angular/run-estimate";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/run-estimate";` |

## Example

The live example is in the gallery at `#/run-estimate`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What a bulk run will cost before it starts. A run fills so many rows times so many AI columns – that many cells –
and each cell sends tokens to a model, gets tokens back and, for columns that search the web, makes lookups. The card
does the sums and says them in words and numbers: the cost as a range (replies vary in length, so it's low to high),
the cells, tokens, lookups and how long the run should take at its concurrency. A table shows where the money goes,
the budget left is a meter with a warning when the run could go over it, and two choices make a big run safer: run
on a sample of rows first, and stop when spend reaches a cap. Start hands what was chosen to the app.

The sums are `estimateRun()`, exported for the page to use in its own checks.

### When to use

- Before a bulk AI run over a table – enrichment, classification, extraction – where the cost depends on how many
  rows and columns there are.
- When people should see the cost before they commit, and be able to try a sample or set a cap first.

### When not to use

- Watching spend while a run is going – use [Budget Guard](budget-guard.md).
- Usage over a billing period – use [Usage Meter](usage-meter.md).
- Where a finished run's time and money went, step by step – use [Trace Waterfall](trace-waterfall.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Range** `.ui-rest__figure` – the cost from low to high, big
3. **Sentence** `.ui-rest__sentence` – the run in words: cells, tokens, lookups and time
4. **Figures** `.ui-rest__stats` – cells, tokens, web lookups and time side by side
5. **Breakdown** `.ui-rest__table` – input tokens, output tokens and web lookups, each with its amount, rate and cost
6. **Budget** `.ui-rest__budget` – what's left, how much of it the run uses, and a meter with the run's range on it
7. **Warning** `.ui-rest__notice` – when the run could go over, or is over, the budget
8. **Choices** `.ui-rest__options` – run on a sample first, and the spend cap
9. **Footer** `.ui-rest__foot` – the expected cost (or the sample's) and Start

## Looks

Standard sets the header on the gray tray above a white card, with Start on the tray below. Clean is one white card
with a shadow, the header its first row and the footer its last. Both show the same figures, table, budget and choices.

## Usage

### HTML

```html
<tc-run-estimate id="estimate" rows="2000" lookup-price="0.005" budget="60" description="Vendor list · 3 AI columns"></tc-run-estimate>

<script type="module">
  import "@adamstavely/trenchcoat/run-estimate";
  import "@adamstavely/trenchcoat/tokens.css";

  const estimate = document.querySelector("#estimate");
  estimate.model = { name: "Analyst model", inputPrice: 3, outputPrice: 15 };
  estimate.columns = [
    { id: "category", name: "Category", tokensIn: 420, tokensOut: 40 },
    { id: "tier", name: "Risk tier", tokensIn: 900, tokensOut: 220 },
    { id: "site", name: "Website and HQ", tokensIn: 2400, tokensOut: 160, lookups: 2 },
  ];
  estimate.addEventListener("tc-start", (e) => console.log("start", e.detail.sample, e.detail.cap, e.detail.estimate.cost));
</script>
```

### React / Next.js

```tsx
import { RunEstimate, type RunEstimateColumn } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const columns: RunEstimateColumn[] = [
  { id: "category", name: "Category", tokensIn: 420, tokensOut: 40 },
  { id: "tier", name: "Risk tier", tokensIn: 900, tokensOut: 220 },
  { id: "site", name: "Website and HQ", tokensIn: 2_400, tokensOut: 160, lookups: 2 },
];

export function VendorRunEstimate({ start }: { start: (sample: boolean, cap: number | null) => void }) {
  return (
    <RunEstimate
      title="Run estimate"
      rows={2000}
      columns={columns}
      model={{ name: "Analyst model", inputPrice: 3, outputPrice: 15 }}
      lookupPrice={0.005}
      budget={60}
      defaultSample
      onStart={(s) => start(s.sample, s.cap)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/run-estimate";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";

defineProps<{ columns: TcRunEstimate["columns"]; model: TcRunEstimate["model"] }>();
const onSampleChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-run-estimate :columns="columns" :model="model" @tc-sample-change="onSampleChange"></tc-run-estimate>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RunEstimate } from "@adamstavely/trenchcoat/angular/run-estimate";
import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";

@Component({
  selector: "app-run-estimate-example",
  imports: [RunEstimate],
  template: `<tc-run-estimate [columns]="columns()" [model]="model()" (tc-sample-change)="onSampleChange($event)"></tc-run-estimate>`,
})
export class RunEstimateExample {
  readonly columns = input.required<TcRunEstimate["columns"]>();
  readonly model = input.required<TcRunEstimate["model"]>();
  onSampleChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-estimate";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";

  let { columns, model }: { columns: TcRunEstimate["columns"]; model: TcRunEstimate["model"] } = $props();
  let el: TcRunEstimate;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-sample-change", on);
    return () => el.removeEventListener("tc-sample-change", on);
  });
</script>

<tc-run-estimate bind:this={el} {columns} {model}></tc-run-estimate>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Run estimate"` | The heading, and the region's name |
| `description` | `description` | `string` | `""` | A quiet line under the heading – what the run is |
| `rows` | `rows` | `number` | `0` | How many rows the run fills |
| `columns` | – | `RunEstimateColumn[]` | `[]` | The AI columns it fills, each with its own averages if they differ from the run's |
| `model` | – | `RunEstimateModel \| null` | `null` | The model and its prices per million tokens |
| `tokensIn` | `tokens-in` | `number` | `600` | Average input tokens per cell |
| `tokensOut` | `tokens-out` | `number` | `150` | Average output tokens per cell |
| `lookups` | `lookups` | `number` | `0` | Web lookups per cell, for columns that don't say |
| `lookupPrice` | `lookup-price` | `number` | `0` | Price of one web lookup |
| `concurrency` | `concurrency` | `number` | `8` | Cells worked on at once |
| `secondsPerCell` | `seconds-per-cell` | `number` | `4` | Average seconds one cell takes |
| `spread` | `spread` | `number` | `0.25` | How far the cost may land either side of the estimate, as a share (0.25 is ±25%) |
| `budget` | `budget` | `number \| null` | `null` | The budget left, in `currency`; unset hides the budget |
| `sample` | `sample` | `boolean` | `false` | Run on the first `sampleRows` rows first. Changed by its checkbox unless a tc-sample-change listener calls preventDefault() |
| `sampleRows` | `sample-rows` | `number` | `50` | How many rows the sample run takes |
| `cap` | `cap` | `number \| null` | `null` | The spend cap – the run stops when it reaches it; null for none. Changed by its field unless a tc-cap-change listener calls preventDefault() |
| `disabled` | `disabled` | `boolean` | `false` | Start can't be pressed – while the app is starting the run, say |
| `currency` | `currency` | `string` | `"USD"` | ISO 4217 currency of every price and amount |
| `locale` | `locale` | `string` | `"en-US"` | Locale for numbers and money |
| `estimate` | – | `RunEstimateResult \| null` | – | The whole run's estimate, or null without a model (read-only) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-sample-change` | – | Yes | "Run on a sample first" was switched ({ sample }: RunEstimateSampleChange); cancelable – prevented, `sample` stays as it was |
| `tc-cap-change` | – | Yes | The spend cap was set or cleared ({ cap }: RunEstimateCapChange); cancelable – prevented, `cap` stays as it was |
| `tc-start` | – | Yes | Start was pressed ({ sample, cap, rows, estimate }: RunEstimateStart); cancelable – prevented, nothing is announced |

#### Design tokens it reads (81)

`--tc-accent`, `--tc-accent-subtle`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `estimateRun(input: RunEstimateInput): RunEstimateResult` | The sums behind the card: cells, tokens, lookups, cost and time for a run |
| `runTime(seconds: number): void` | "under a minute", "about 25 min", "about 2 h 10 min" |

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
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-run-estimate :columns="…">` | `<tc-run-estimate [columns]="…">` | `<tc-run-estimate {columns}>` |
| `model` | `el.model = …;` | `<… model={…} />` | `<tc-run-estimate :model="…">` | `<tc-run-estimate [model]="…">` | `<tc-run-estimate {model}>` |

*Also attributes: `heading`, `description`, `rows`, `tokens-in`, `tokens-out`, `lookups`, `lookup-price`, `concurrency` and 9 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-sample-change` | Yes | `el.addEventListener("tc-sample-change", (e) => …)` | `ref.current.addEventListener("tc-sample-change", …)` | `@tc-sample-change="…"` | `(tc-sample-change)="…($event)"` | `el.addEventListener("tc-sample-change", …)` |
| `tc-cap-change` | Yes | `el.addEventListener("tc-cap-change", (e) => …)` | `ref.current.addEventListener("tc-cap-change", …)` | `@tc-cap-change="…"` | `(tc-cap-change)="…($event)"` | `el.addEventListener("tc-cap-change", …)` |
| `tc-start` | Yes | `el.addEventListener("tc-start", (e) => …)` | `onStart={…}` | `@tc-start="…"` | `(tc-start)="…($event)"` | `el.addEventListener("tc-start", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `sample` and `cap` itself unless a listener calls `preventDefault()` on `tc-sample-change` or `tc-cap-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-run-estimate id="run-estimate"></tc-run-estimate>

<script type="module">
  import "@adamstavely/trenchcoat/run-estimate";

  const el = document.querySelector("#run-estimate");
  el.addEventListener("tc-sample-change", (e) => {
    e.preventDefault(); // the element keeps its sample…
    if (allowed(e.detail.sample)) el.sample = e.detail.sample; // …until the app sets it
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
import "@adamstavely/trenchcoat/run-estimate";
import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";

const props = defineProps<{ initial: TcRunEstimate["sample"] }>();
const sample = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSampleChange = (e: CustomEvent<{ sample: TcRunEstimate["sample"] }>) => {
  e.preventDefault();
  sample.value = e.detail.sample;
};
</script>

<template>
  <tc-run-estimate :sample="sample" @tc-sample-change="onSampleChange"></tc-run-estimate>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RunEstimate } from "@adamstavely/trenchcoat/angular/run-estimate";
import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";

@Component({
  selector: "app-controlled-run-estimate",
  imports: [RunEstimate],
  template: `<tc-run-estimate [sample]="sample()" (tc-sample-change)="onSampleChange($event)"></tc-run-estimate>`,
})
export class ControlledRunEstimate {
  readonly initial = input.required<TcRunEstimate["sample"]>();
  readonly sample = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSampleChange(e: CustomEvent<{ sample: TcRunEstimate["sample"] }>) {
    e.preventDefault();
    this.sample.set(e.detail.sample);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-estimate";
  import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";

  let { initial }: { initial: TcRunEstimate["sample"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let sample = $derived(initial);
  let el: TcRunEstimate;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      sample = (e as CustomEvent<{ sample: TcRunEstimate["sample"] }>).detail.sample;
    };
    el.addEventListener("tc-sample-change", on);
    return () => el.removeEventListener("tc-sample-change", on);
  });
</script>

<tc-run-estimate bind:this={el} {sample}></tc-run-estimate>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-run-estimate")` returns a `TcRunEstimate` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";`
- **React / Next.js:** Props: `import type { RunEstimateProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RunEstimate>`. The element class, for refs: `import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRunEstimate["columns"]` with `import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";`
- **Angular:** The directive types the template: `[columns]` takes `TcRunEstimate["columns"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRunEstimate } from "@adamstavely/trenchcoat/run-estimate";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `sample` | `boolean` | Run on a sample of rows first – controlled when given |
| `defaultSample` | `boolean` | Initial sample choice when uncontrolled |
| `onSampleChange` | `(sample: boolean) => void` | Called with the next `sample` |
| `cap` | `number \| null` | The spend cap, or null for none – controlled when given |
| `defaultCap` | `number \| null` | Initial cap when uncontrolled |
| `onCapChange` | `(cap: number \| null) => void` | Called with the next `cap` |
| `onStart` | `(start: RunEstimateStart, estimate: RunEstimateResult) => void \| boolean` | Start was pressed, with what was chosen and the estimate of what runs. Return false to stop the announcement |

*Renamed or hidden on the wrapper: `heading`, `sample`, `cap`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the sample checkbox, the cap field and Start |
| Space | Switches the sample run on or off |
| Enter / Tab out | Sets the cap typed into the field |
| Enter / Space on Start | Starts the run |

### Screen readers

The card is a `region` named by its heading. The breakdown is a real table with a caption. The budget is a `meter`
whose value reads as the range against what's left (“$1.36 – $2.26 of $10.00 left”). The cap field is a labelled
number field, described by its note; a cap that can't be used marks it invalid and says why. Start is `aria-disabled`
when there's nothing to run, with the reason as its description. Going over the budget or back under it, setting the
cap and starting are said once in a polite live region.

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
| **This component alone** | 27.4 KB | 8.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.9 KB** | **10.4 KB** |
| With Lit – the first component on a page | 56.3 KB | 17.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 89 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of columns replaced |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.7 ms | columns: first render, 89 nodes; update 0.3 ms |
| 1,000 items | 3.2 ms | columns: first render, 96 nodes; update 0.4 ms |

1,000 items of columns: 3.2 ms, 96 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Give each column its own averages when they differ – a column that reads web pages sends far more tokens in.
- Use averages from a real sample of the table, not guesses: the range is only as good as they are.
- Name the model the way the rest of the product does; it's the pill in the header.
- Set `spread` to how much reply length varies – 0.25 (±25%) suits short answers, more for free text.

## Do and don't

### Do

- Start on a sample for runs over a few hundred rows, and let people check the answers before the rest.
- Pass the budget left, so the card can warn before the run goes over it.
- Halt the run when it reaches the cap the person set.

### Don't

- Don't show a single number as the cost – a range is honest about replies varying.
- Don't start a run that's over the budget without someone pressing Start.
- Don't use it for a live run – once it starts, switch to `budget-guard`.

## Related

- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
