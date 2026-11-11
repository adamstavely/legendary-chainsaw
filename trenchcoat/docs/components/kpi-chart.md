<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# KPI Chart

**Data & charts** · Also in React

Metric card with a multi-line chart and a tooltip that follows the pointer

- **Element:** `<tc-kpi-chart>`
- **Size:** 10.0 KB gzip · 35.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/kpi-chart";` |
| React / Next.js | `import { KpiChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/kpi-chart";` · tags starting with tc- are custom elements |
| Angular | `import { KpiChart } from "@adamstavely/trenchcoat/angular/kpi-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/kpi-chart";` |

## Example

The live example is in the gallery at `#/kpi-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A metric card: a title, the headline value with its change against the previous period, and a line chart of how it
got there. With several lines it compares parts of the metric – subscriptions against services, say – and a
tooltip follows the pointer with each line's value on that day. People read the number first and the trend second,
and can step through the points with the keyboard.

A line can run on into a forecast. Give its series `forecastFrom`, the index into `values` and `labels` where the
forecast starts: from there the line continues dashed, joined to the last actual point with no gap. An optional
`band` – `{ low, high }`, one of each per point – shades the forecast's range in the line's colour behind it, over the
forecast part only, and the y scale takes the band in. A quiet rule and the word “Forecast” (`forecast-label`) mark
where the forecast starts; the tooltip reads forecast points as “Forecast · 14 (11–17)”, and the legend adds a dashed
“Forecast” entry. Without `forecastFrom`, nothing changes.

### When to use

- Dashboards and overviews where one number matters and its recent trend explains it.
- Comparing two to four related series over the same days or weeks.

### When not to use

- Breaking a total down by category rather than over time – use [Breakdown Chart](breakdown-chart.md), or [Compact Breakdown](compact-breakdown.md) in a small
  space.
- Usage against a plan limit – use [Usage Meter](usage-meter.md).
- The result of an A/B test, with its confidence – use [Experiment Card](experiment-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a chart icon and the title, what the metric is
2. **Value** `.ui-kpi__value` – the headline number, already formatted
3. **Change** `.ui-kpi__delta` – a rise in green and a drop in red, or the other way round with `lower-is-better`
4. **Plot** `.ui-kpi__plot` – the lines on three gridlines, with the axis values beside them
5. **Tooltip** `.ui-kpi__tooltip` – the point's date and each line's value, largest first
6. **Legend** `.ui-kpi__legend` – names each line by its colour and stroke pattern, and the forecast's dashes
7. **Forecast** `.ui-kpi__forecast` – a line's dashed forecast part, over its range `.ui-kpi__band`, after the rule

## Looks

Standard puts the header on a gray tray above the white card, with roomier padding, the change as coloured text after
the value, and the footer as a muted line under the chart. Clean is one white card with the header as its first row,
hairline shadows, the change as a tinted pill, and the footer as the
card's last row under a divider.

## Usage

### HTML

```html
<tc-kpi-chart id="revenue" heading="Revenue" value="$96.4k" delta="8.6" footer="Last 3 days" default-index="2"></tc-kpi-chart>
<tc-kpi-chart id="latency" heading="p95 latency" value="420ms" delta="-12" lower-is-better></tc-kpi-chart>

<script type="module">
  import "@adamstavely/trenchcoat/kpi-chart";
  import "@adamstavely/trenchcoat/tokens.css";

  const chart = document.querySelector("#revenue");
  chart.labels = ["Mar 2", "Mar 3", "Mar 4"];
  chart.series = [
    { label: "Subscriptions", values: [4200, 4380, 4610] }, // --tc-chart-1
    { label: "Services", color: "var(--tc-chart-2)", values: [2300, 2210, 2470] },
  ];
  chart.format = (n) => `$${(n / 1000).toFixed(1)}k`;
  chart.deltaFormat = (n) => `${n.toFixed(1)}%`;
  chart.addEventListener("tc-index-change", (e) => console.log(e.detail.index));
</script>
```

### React / Next.js

```tsx
import { KpiChart, type KpiSeries } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const series: KpiSeries[] = [
  { label: "Subscriptions", values: [4200, 4380, 4610] },
  { label: "Services", color: "var(--tc-chart-2)", values: [2300, 2210, 2470] },
];

export function Revenue() {
  return (
    <KpiChart
      title="Revenue"
      value="$96.4k"
      delta={8.6}
      deltaFormat={(n) => `${n.toFixed(1)}%`}
      labels={["Mar 2", "Mar 3", "Mar 4"]}
      series={series}
      format={(n) => `$${(n / 1000).toFixed(1)}k`}
      footer="Last 3 days"
      defaultIndex={2}
    />
  );
}

export function Latency() {
  return <KpiChart title="p95 latency" value="420ms" delta={-12} lowerIsBetter labels={["Mar 2", "Mar 3", "Mar 4"]} series={[{ label: "p95", values: [480, 450, 420] }]} format={(n) => `${n}ms`} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/kpi-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";

defineProps<{ deltaFormat: TcKpiChart["deltaFormat"]; labels: TcKpiChart["labels"] }>();
const onIndexChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-kpi-chart :deltaFormat="deltaFormat" :labels="labels" @tc-index-change="onIndexChange"></tc-kpi-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { KpiChart } from "@adamstavely/trenchcoat/angular/kpi-chart";
import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";

@Component({
  selector: "app-kpi-chart-example",
  imports: [KpiChart],
  template: `<tc-kpi-chart [deltaFormat]="deltaFormat()" [labels]="labels()" (tc-index-change)="onIndexChange($event)"></tc-kpi-chart>`,
})
export class KpiChartExample {
  readonly deltaFormat = input.required<TcKpiChart["deltaFormat"]>();
  readonly labels = input.required<TcKpiChart["labels"]>();
  onIndexChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/kpi-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";

  let { deltaFormat, labels }: { deltaFormat: TcKpiChart["deltaFormat"]; labels: TcKpiChart["labels"] } = $props();
  let el: TcKpiChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-kpi-chart bind:this={el} {deltaFormat} {labels}></tc-kpi-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The card's title |
| `value` | `value` | `string` | `""` | Headline value, already formatted, e.g. "$96.4k" |
| `delta` | `delta` | `number \| undefined` | `undefined` | Change against the previous period – a rise is green and a drop red, unless `lowerIsBetter` |
| `lowerIsBetter` | `lower-is-better` | `boolean` | `false` | A drop is the good direction (latency, cost, error rate): a negative `delta` shows green, a positive one red |
| `deltaFormat` | – | `((n: number) => string) \| undefined` | `undefined` | Formats the change on its own, e.g. as a percentage – unset uses `format` |
| `labels` | – | `string[]` | `[]` | Short labels along the x-axis, e.g. "Mar 4" |
| `tooltipLabels` | – | `string[] \| undefined` | `undefined` | Longer labels for the tooltip header, e.g. "Tue, Mar 4" – falls back to `labels` |
| `series` | – | `KpiSeries[]` | `[]` | The lines, each with a label, an optional colour and one value per label – every line also gets its own stroke pattern |
| `format` | – | `(n: number) => string` | `compact` | Formats the axis, tooltip and delta values |
| `footer` | `footer` | `string` | `""` | Line under the chart |
| `legend` | `legend` | `boolean \| undefined` | `undefined` | A legend naming each line – unset shows it when there are two or more lines; legend="false" hides it |
| `defaultIndex` | `default-index` | `number \| undefined` | `undefined` | Point that stays highlighted while nobody hovers – unset hides the tooltip at rest |
| `index` | `index` | `number \| null` | `null` | The highlighted point, or null for none (then `defaultIndex` shows) |
| `fill` | `fill` | `boolean` | `false` | Fill the container: no max-width, the card stretches and the plot grows with its height |
| `forecastLabel` | `forecast-label` | `string` | `"Forecast"` | The word for forecast points: the label at the rule where the forecast starts, in the legend and tooltip |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-index-change` | – | Yes | The highlighted point changes by pointer or keyboard; detail `{ index: number \| null }`. Cancelable: prevent it to control `index` |

#### Design tokens it reads (64)

`--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-tracking`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-quick`, `--tc-duration-reveal-slow`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-3xl`, `--tc-font-size-4xl`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-kpi-chart-shift`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-xs`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `niceRange(values: number[]): [min: number, max: number]` | Picks an axis range that halves cleanly and always includes 0: 30 → 15 → 0, $8k → $4k → $0, 10 → 0 → −10. Empty or non-finite data falls back to 0–2 instead of NaN. |

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
| `deltaFormat` | `el.deltaFormat = …;` | `<… deltaFormat={…} />` | `<tc-kpi-chart :deltaFormat="…">` | `<tc-kpi-chart [deltaFormat]="…">` | `<tc-kpi-chart {deltaFormat}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-kpi-chart :labels="…">` | `<tc-kpi-chart [labels]="…">` | `<tc-kpi-chart {labels}>` |
| `tooltipLabels` | `el.tooltipLabels = …;` | `<… tooltipLabels={…} />` | `<tc-kpi-chart :tooltipLabels="…">` | `<tc-kpi-chart [tooltipLabels]="…">` | `<tc-kpi-chart {tooltipLabels}>` |
| `series` | `el.series = …;` | `<… series={…} />` | `<tc-kpi-chart :series="…">` | `<tc-kpi-chart [series]="…">` | `<tc-kpi-chart {series}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-kpi-chart :format="…">` | `<tc-kpi-chart [format]="…">` | `<tc-kpi-chart {format}>` |

*Also attributes: `heading`, `value`, `delta`, `lower-is-better`, `footer`, `legend`, `default-index`, `index` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-index-change` | Yes | `el.addEventListener("tc-index-change", (e) => …)` | `ref.current.addEventListener("tc-index-change", …)` | `@tc-index-change="…"` | `(tc-index-change)="…($event)"` | `el.addEventListener("tc-index-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `index` itself unless a listener calls `preventDefault()` on `tc-index-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-kpi-chart id="kpi-chart"></tc-kpi-chart>

<script type="module">
  import "@adamstavely/trenchcoat/kpi-chart";

  const el = document.querySelector("#kpi-chart");
  el.addEventListener("tc-index-change", (e) => {
    e.preventDefault(); // the element keeps its index…
    if (allowed(e.detail.index)) el.index = e.detail.index; // …until the app sets it
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
import "@adamstavely/trenchcoat/kpi-chart";
import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";

const props = defineProps<{ initial: TcKpiChart["index"] }>();
const index = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onIndexChange = (e: CustomEvent<{ index: TcKpiChart["index"] }>) => {
  e.preventDefault();
  index.value = e.detail.index;
};
</script>

<template>
  <tc-kpi-chart :index="index" @tc-index-change="onIndexChange"></tc-kpi-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { KpiChart } from "@adamstavely/trenchcoat/angular/kpi-chart";
import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";

@Component({
  selector: "app-controlled-kpi-chart",
  imports: [KpiChart],
  template: `<tc-kpi-chart [index]="index()" (tc-index-change)="onIndexChange($event)"></tc-kpi-chart>`,
})
export class ControlledKpiChart {
  readonly initial = input.required<TcKpiChart["index"]>();
  readonly index = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onIndexChange(e: CustomEvent<{ index: TcKpiChart["index"] }>) {
    e.preventDefault();
    this.index.set(e.detail.index);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/kpi-chart";
  import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";

  let { initial }: { initial: TcKpiChart["index"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let index = $derived(initial);
  let el: TcKpiChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      index = (e as CustomEvent<{ index: TcKpiChart["index"] }>).detail.index;
    };
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-kpi-chart bind:this={el} {index}></tc-kpi-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-kpi-chart")` returns a `TcKpiChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";`
- **React / Next.js:** Props: `import type { KpiChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof KpiChart>`. The element class, for refs: `import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcKpiChart["deltaFormat"]` with `import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";`
- **Angular:** The directive types the template: `[deltaFormat]` takes `TcKpiChart["deltaFormat"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcKpiChart } from "@adamstavely/trenchcoat/kpi-chart";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The card's title – it also names the chart for screen readers |
| `value` | `string` | Headline value, already formatted, e.g. "$96.4k" |
| `defaultIndex` | `number` | Point that stays highlighted while nobody hovers – leave empty to hide the tooltip at rest |
| `index` | `number \| null` | The highlighted point (controlled), or null for none |
| `onIndexChange` | `(index: number \| null) => void` | Called with the point under the pointer or keyboard, or null when it leaves |

*Renamed or hidden on the wrapper: `heading`, `index`, `defaultIndex`, `value`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the plot |
| → / ← | Highlights the next or previous point and opens its tooltip |
| Home / End | Highlights the first or last point |
| Escape | Closes the tooltip – also from anywhere on the page while the chart highlighted the point itself |

### Screen readers

The plot is a focusable group named after the title (“Revenue chart – use the arrow keys to read the values per
day”). As the arrow keys move, a status region reads the point: its tooltip label, then each line's value (“Tue, Mar
4: Subscriptions $4.6k, Services $2.5k, One-off $1.1k”). The axes, lines and tooltip are hidden from assistive
technology – the status region carries the same numbers. The legend is a list labelled “Lines”. Each line has its own
stroke pattern as well as its colour, so the series don't rely on colour alone. With a forecast, the plot's name says
where it starts (“…; the forecast starts at May”), and forecast points are read as such (“Jun: Papers forecast 17
(13–40)”).

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 27.6 KB | 7.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **35.1 KB** | **10.0 KB** |
| With Lit – the first component on a page | 57.7 KB | 17.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.2 ms** | the gallery demo's data, 63 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of labels replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.7 ms | labels: first render, 63 nodes; update 0.6 ms |
| 1,000 items | 2.5 ms | labels: first render, 63 nodes; update 0.8 ms |

What it renders doesn't grow with labels (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 4 React commits (clean), 4 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window keydown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title the card with the metric, not the chart: “Revenue”, “Active users”.
- Format `value` the way the product shows the number elsewhere, and pass the same formatting as `format` – it is
  used for the axis, the tooltip and the change. When the change is a percentage of a money value, give it its own
  `deltaFormat` (“+8.6%”), so it doesn't read as money (“+$9”).
- For a metric where less is better – latency, cost, error rate – set `lower-is-better`: a drop then shows green and a
  rise red. The sign still says which way it moved.
- Leave a series' `color` unset to take the look's chart palette (`--tc-chart-1` to `--tc-chart-6`, in order), or set
  any CSS colour, including a token such as `var(--tc-chart-2)` or `var(--tc-status-danger-fg)`. Colours are applied
  as styles, so custom properties resolve in both themes.
- Keep `labels` short for the axis (“Mar 4”) and put the longer form in `tooltipLabels` (“Tue, Mar 4”) – screen
  readers hear the tooltip labels.
- Use `footer` for the period and freshness: “Last 14 days · updated live”.
- The plot's name says “values per day”; it reads oddly for weekly or monthly points.

## Do and don't

### Do

- Give every series the same number of values as there are `labels`.
- Set `default-index` to the latest point when the newest day matters most – its tooltip shows at rest.
- Keep to four lines or fewer; after that the patterns repeat.
- Prefer the chart tokens to literal colours, so the lines follow the look and the dark theme.

### Don't

- Don't pass a percentage as `delta` with a money `format` and no `deltaFormat` – the change would read as money.
- Don't colour a falling cost red by hand – set `lower-is-better`.
- Don't use it for a single number without a trend; a plain stat says it with less.
- Don't rely on the line colours alone in the text around the chart – name the series.

## Related

- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Experiment Card](experiment-card.md) – An A/B test in two lines that quietly unfolds on hover – variants linked to a tiny chart, a metric switch with rolling numbers, and a winner you pick with a click
- [Compact Breakdown](compact-breakdown.md) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes

## Changelog

- kpi-chart, progress-tracker, setup-guide and writing-assistant now sit on the Standard tray.
- kpi-chart `fill`, inline-diff `fill`, usage-meter `layout="wide"` – what screens used to force by overriding internals.
