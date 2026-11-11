<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Metrics Dashboard

**Blocks** · New

Sales overview – KPI cards pick the metric, one chart switches between dotted line and bars, with top products and channels (uses `button`, `segmented-control`)

- **Element:** `<tc-metrics-dashboard>`
- **Size:** 21.9 KB gzip · 85.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/metrics-dashboard";` |
| React / Next.js | `import { MetricsDashboard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/metrics-dashboard";` · tags starting with tc- are custom elements |
| Angular | `import { MetricsDashboard } from "@adamstavely/trenchcoat/angular/metrics-dashboard";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/metrics-dashboard";` |

## Example

The live example is in the gallery at `#/blocks/metrics-dashboard`, in both looks; Replay restarts its animations.

## Overview

A compact sales overview in one block. A bar on top names the shop and the period, with Week / Month / Quarter and
Export. Under it, four KPI cards – revenue, orders, average order and refund rate – each with its change against the
previous period; picking one charts it. The chart is a dotted line or bars, with the previous period on request, and
a tooltip that follows the pointer or the arrow keys. Top products and sales channels close it. Figures count to their
new values and the chart redraws when the period or metric changes.

### When to use

- The top of an analytics or commerce page, where people move between a handful of metrics over the same period.
- A demo or starting point for a dashboard: the layout, keyboard model and motion are done; swap in your own figures.

### When not to use

- One metric on its own card – use [KPI Chart](../components/kpi-chart.md).
- A few figures with their shares, without a chart – use [Compact Breakdown](../components/compact-breakdown.md).
- Rows of figures to sort and filter – use [Data Table](../components/data-table.md).
- Parts of a whole – use [Breakdown Chart](../components/breakdown-chart.md).

## Anatomy

1. **Bar** `.ui-md__bar` – the title, the shop and period, the period switch and Export
2. **KPI card** `.ui-md__kpi` – a metric's name, value and change; a tab for the chart
3. **Change** `.ui-md__delta` – the change against the previous period, green when it moves the good way
4. **Chart** `.ui-md__chart` – the legend, the line / bars switch, the comparison switch and the plot
5. **Plot** `.ui-md__plot` – the line or bars, the axis and dates; focus it to read points
6. **Tooltip** `.ui-md__tip` – the highlighted point's date and value, and the previous period's
7. **List** `.ui-md__list` – top products or channels, each row with a bar for its share

## Looks

Standard puts the bar and the KPI cards on a gray tray, with the chart and lists on a white card below. Clean is one
white card: the bar is its first row and the KPIs are a row of tabs split by hairlines, the chosen one with an accent
line at its foot. `--tc-md-plot-h` sets the plot's height, `--tc-md-area` the fill under the line and `--tc-md-prev`
the previous period's colour.

## Usage

### HTML

```html
<tc-metrics-dashboard id="sales" heading="Sales" site="Northwind Store"></tc-metrics-dashboard>

<script type="module">
  import "@adamstavely/trenchcoat/metrics-dashboard";
  import "@adamstavely/trenchcoat/tokens.css";

  const sales = document.querySelector("#sales");
  sales.onExport = (range, metric) => fetch(`/export?range=${range}&metric=${metric}`);
  sales.addEventListener("tc-metric-change", (e) => console.log(e.detail.metric));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MetricsDashboard, type MetricKey } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Sales() {
  const [metric, setMetric] = useState<MetricKey>("revenue");
  return <MetricsDashboard title="Sales" site="Northwind Store" metric={metric} onMetricChange={setMetric} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/metrics-dashboard";
import "@adamstavely/trenchcoat/tokens.css";

const onRangeChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-metrics-dashboard @tc-range-change="onRangeChange"></tc-metrics-dashboard>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { MetricsDashboard } from "@adamstavely/trenchcoat/angular/metrics-dashboard";

@Component({
  selector: "app-metrics-dashboard-example",
  imports: [MetricsDashboard],
  template: `<tc-metrics-dashboard (tc-range-change)="onRangeChange($event)"></tc-metrics-dashboard>`,
})
export class MetricsDashboardExample {
  onRangeChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/metrics-dashboard";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMetricsDashboard } from "@adamstavely/trenchcoat/metrics-dashboard";

  let el: TcMetricsDashboard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-range-change", on);
    return () => el.removeEventListener("tc-range-change", on);
  });
</script>

<tc-metrics-dashboard bind:this={el}></tc-metrics-dashboard>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Sales"` | Title in the bar on top |
| `site` | `site` | `string` | `"Northwind Store"` | Site or workspace shown under the title |
| `range` | `range` | `RangeKey` | `"30d"` | The period: "7d", "30d" or "90d" |
| `metric` | `metric` | `MetricKey` | `"revenue"` | The charted metric: "revenue", "orders", "aov" or "refunds" |
| `chart` | `chart` | `MetricsChart` | `"line"` | The chart type: "line" or "bars" |
| `compare` | `compare` | `boolean` | `false` | Shows the previous period beside the current one |
| `now` | `now` | `number \| undefined` | `undefined` | Last day of the sample data, as epoch ms – today by default |
| `onExport` | – | `((range: RangeKey, metric: MetricKey) => void \| Promise<unknown>) \| undefined` | `undefined` | Called when Export is pressed, with the current range and metric. Return a promise to show Exporting… until it settles |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-range-change` | – | Yes | The period was picked ({ range }: MetricsRangeChange); cancelable – prevented, `range` stays |
| `tc-metric-change` | – | Yes | A KPI card was picked ({ metric }: MetricsMetricChange); cancelable – prevented, `metric` stays |
| `tc-chart-change` | – | Yes | Line or bars was picked ({ chart }: MetricsChartChange); cancelable – prevented, `chart` stays |
| `tc-compare-change` | – | Yes | The comparison switch was toggled ({ compare }: MetricsCompareChange); cancelable – prevented, `compare` stays |
| `tc-export` | – | No | Export was pressed ({ range, metric }: MetricsExport); `onExport` may return a promise it waits for |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-md-area` | `color-mix(in srgb, var(--tc-chart-1) 18%, transparent)` | both |
| `--tc-md-prev` | `var(--tc-icon-muted)` | both |
| `--tc-md-plot-h` | `168px` | both |

#### Design tokens it reads (79)

`--tc-accent-subtle`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-chart-1`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display-sm`, `--tc-line-height-relaxed`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-seg-thumb-bg`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-radius`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `niceMax(n: number): void` | A round axis maximum with four equal steps |

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
| `onExport` | `el.onExport = …;` | `<… onExport={…} />` | `<tc-metrics-dashboard :onExport="…">` | `<tc-metrics-dashboard [onExport]="…">` | `<tc-metrics-dashboard {onExport}>` |

*Also attributes: `heading`, `site`, `range`, `metric`, `chart`, `compare`, `now` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-range-change` | Yes | `el.addEventListener("tc-range-change", (e) => …)` | `onRangeChange={…}` | `@tc-range-change="…"` | `(tc-range-change)="…($event)"` | `el.addEventListener("tc-range-change", …)` |
| `tc-metric-change` | Yes | `el.addEventListener("tc-metric-change", (e) => …)` | `onMetricChange={…}` | `@tc-metric-change="…"` | `(tc-metric-change)="…($event)"` | `el.addEventListener("tc-metric-change", …)` |
| `tc-chart-change` | Yes | `el.addEventListener("tc-chart-change", (e) => …)` | `onChartChange={…}` | `@tc-chart-change="…"` | `(tc-chart-change)="…($event)"` | `el.addEventListener("tc-chart-change", …)` |
| `tc-compare-change` | Yes | `el.addEventListener("tc-compare-change", (e) => …)` | `onCompareChange={…}` | `@tc-compare-change="…"` | `(tc-compare-change)="…($event)"` | `el.addEventListener("tc-compare-change", …)` |
| `tc-export` | No | `el.addEventListener("tc-export", (e) => …)` | `ref.current.addEventListener("tc-export", …)` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `range`, `metric`, `chart` and `compare` itself unless a listener calls `preventDefault()` on `tc-range-change`, `tc-metric-change`, `tc-chart-change` or `tc-compare-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-metrics-dashboard id="metrics-dashboard"></tc-metrics-dashboard>

<script type="module">
  import "@adamstavely/trenchcoat/metrics-dashboard";

  const el = document.querySelector("#metrics-dashboard");
  el.addEventListener("tc-range-change", (e) => {
    e.preventDefault(); // the element keeps its range…
    if (allowed(e.detail.range)) el.range = e.detail.range; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { MetricsDashboard } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof MetricsDashboard>;
type Props = Omit<Own, "range" | "onRangeChange"> & { initial: NonNullable<Own["range"]> };

// Controlled: passing range makes the wrapper prevent the element's own change; the app sets it
export function ControlledMetricsDashboard({ initial, ...props }: Props) {
  const [range, setRange] = useState<Own["range"]>(initial);
  return <MetricsDashboard {...props} range={range} onRangeChange={(next) => setRange(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/metrics-dashboard";
import type { TcMetricsDashboard } from "@adamstavely/trenchcoat/metrics-dashboard";

const props = defineProps<{ initial: TcMetricsDashboard["range"] }>();
const range = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRangeChange = (e: CustomEvent<{ range: TcMetricsDashboard["range"] }>) => {
  e.preventDefault();
  range.value = e.detail.range;
};
</script>

<template>
  <tc-metrics-dashboard :range="range" @tc-range-change="onRangeChange"></tc-metrics-dashboard>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MetricsDashboard } from "@adamstavely/trenchcoat/angular/metrics-dashboard";
import type { TcMetricsDashboard } from "@adamstavely/trenchcoat/metrics-dashboard";

@Component({
  selector: "app-controlled-metrics-dashboard",
  imports: [MetricsDashboard],
  template: `<tc-metrics-dashboard [range]="range()" (tc-range-change)="onRangeChange($event)"></tc-metrics-dashboard>`,
})
export class ControlledMetricsDashboard {
  readonly initial = input.required<TcMetricsDashboard["range"]>();
  readonly range = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRangeChange(e: CustomEvent<{ range: TcMetricsDashboard["range"] }>) {
    e.preventDefault();
    this.range.set(e.detail.range);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/metrics-dashboard";
  import type { TcMetricsDashboard } from "@adamstavely/trenchcoat/metrics-dashboard";

  let { initial }: { initial: TcMetricsDashboard["range"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let range = $derived(initial);
  let el: TcMetricsDashboard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      range = (e as CustomEvent<{ range: TcMetricsDashboard["range"] }>).detail.range;
    };
    el.addEventListener("tc-range-change", on);
    return () => el.removeEventListener("tc-range-change", on);
  });
</script>

<tc-metrics-dashboard bind:this={el} {range}></tc-metrics-dashboard>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-metrics-dashboard")` returns a `TcMetricsDashboard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMetricsDashboard } from "@adamstavely/trenchcoat/metrics-dashboard";`
- **React / Next.js:** Props: `import type { MetricsDashboardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MetricsDashboard>`. The element class, for refs: `import type { TcMetricsDashboard } from "@adamstavely/trenchcoat/metrics-dashboard";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMetricsDashboard["onExport"]` with `import type { TcMetricsDashboard } from "@adamstavely/trenchcoat/metrics-dashboard";`
- **Angular:** The directive types the template: `[onExport]` takes `TcMetricsDashboard["onExport"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMetricsDashboard } from "@adamstavely/trenchcoat/metrics-dashboard";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMetricsDashboard } from "@adamstavely/trenchcoat/metrics-dashboard";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Title in the bar on top |
| `range` | `RangeKey` | The period (controlled) – pass `onRangeChange` with it |
| `defaultRange` | `RangeKey` | Range to start on |
| `onRangeChange` | `(range: RangeKey) => void` | A period was picked |
| `metric` | `MetricKey` | The charted metric (controlled) – pass `onMetricChange` with it |
| `defaultMetric` | `MetricKey` | Metric to start on |
| `onMetricChange` | `(metric: MetricKey) => void` | A metric was picked |
| `chart` | `MetricsChart` | Line or bars (controlled) |
| `defaultChart` | `MetricsChart` | The chart type at first (uncontrolled) |
| `onChartChange` | `(chart: MetricsChart) => void` | The chart type was switched |
| `compare` | `boolean` | The previous-period comparison (controlled) |
| `defaultCompare` | `boolean` | Comparing with the previous period at first (uncontrolled) |
| `onCompareChange` | `(compare: boolean) => void` | Comparison was turned on or off |

*Renamed or hidden on the wrapper: `heading`, `range`, `metric`, `chart`, `compare`, `title`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the period switch, Export, the chosen KPI, the chart tools and the plot |
| ← / → on a KPI | Moves to the previous or next KPI and charts it |
| Home / End on a KPI | Moves to the first or last KPI |
| ← / → on the plot | Moves the highlighted point |
| Home / End on the plot | Highlights the first or last point |
| Escape on the plot | Hides the tooltip; focus stays on the plot |
| Space | Toggles the comparison switch |

### Screen readers

The KPI cards are a tablist named "Metric", and the chart is their tabpanel. Each card reads its name, value and
change in words: "Revenue $293,528 8.7% up versus the previous period". The plot is an image whose name gives the
metric, the period and its first and last values; points picked with the arrow keys are announced in a polite status
message ("Oct 27: Revenue $9,880"), points under the pointer are not. The comparison is a switch named "Compare to
previous period". Export says "Exported" or "Export failed" in a status message.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, button, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, button, internal/kit, segmented-control | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | button | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, button | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself, segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, button, internal/base, segmented-control, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button, segmented-control | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button, segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 35.2 KB | 11.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **85.8 KB** | **21.9 KB** |
| With Lit – the first component on a page | 108.1 KB | 29.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.5 ms** | default properties, 197 DOM nodes – to layout, median of 7 |
| Typical update | **1.7 ms** | re-render with the same data |
| First on the page | 34 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`, `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout`, `setTimeout` (segmented-control).
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (segmented-control).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep `heading` short – "Sales", "Store" – and put the shop or workspace in `site`.
- The figures are sample data generated for the last 180 days up to `now`; pass `now` for the same figures on every
  load, e.g. in tests and screenshots.
- `onExport` receives the period and metric; return a promise to show "Exporting…" until it settles.

## Do and don't

### Do

- Control `range` and `metric` when they belong in the URL, so a shared link opens the same view.
- Let the chart switch to bars for short periods and counts; keep the line for trends.

### Don't

- Don't add more than four KPIs – the row is built for four, two by two on a phone.
- Don't colour-code changes yourself – the pill's tone, arrow and words already say whether it's good.

## Related

- [KPI Chart](../components/kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Compact Breakdown](../components/compact-breakdown.md) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes
- [Data Table](../components/data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Breakdown Chart](../components/breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Segmented Control](../components/segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
