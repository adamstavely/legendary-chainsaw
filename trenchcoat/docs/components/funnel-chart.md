<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Funnel Chart

**Charts** · New

How many are left at each step of a process as centred bars narrowing down the page, joined by curved necks, each step's rate against the one before or the first, the biggest drop emphasised, and a table view

- **Element:** `<tc-funnel-chart>`
- **Size:** 15.9 KB gzip · 45.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/funnel-chart";` |
| React / Next.js | `import { FunnelChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/funnel-chart";` · tags starting with tc- are custom elements |
| Angular | `import { FunnelChart } from "@adamstavely/trenchcoat/angular/funnel-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/funnel-chart";` |

## Example

The live example is in the gallery at `#/funnel-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How many are left at each step of a process – proposals drafted, submitted, shortlisted, funded – as centred bars
narrowing down the page, joined by curved necks so the losses read as a flow. Each step's name and count sit at the
left and its conversion rate at the right, measured against the step before (or the first, `rate-base="first"`). The
step with the lowest rate – where most are lost – takes the accent and the rest stay quiet; `highlight` picks another.

The bars widen out step after step when the chart scrolls into view and glide to new counts when the data changes.
Ported from ztd-charts (MIT).

### When to use

- A process people pass through in order, where the question is where they drop out.
- Comparing one round of a process with another (this year against last).

### When not to use

- Categories with no order between them – use [Bar Chart](bar-chart.md).
- Shares of a whole – use [Waffle Chart](waffle-chart.md).
- A total split by two measures – use [Breakdown Chart](breakdown-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Bar** `.ui-fnl__bar` – one per step, as wide as its count; the emphasised one in the accent
3. **Neck** `.ui-fnl__neck` – the curve joining a step to the next
4. **Name and count** `.tc-chart__value` – at the left of each bar; the rate at the right
5. **Rate heading** `.tc-chart__tick` – what the rates are measured against
6. **Tooltip** `.tc-chart__tip` – the step's count, rate and drop-off from the step before

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised step, `--tc-plot-rest` for the others and the
necks. Names, counts and rates are written beside the bars, never on them. `still` (or the system's reduced-motion
setting) draws everything at once.

## Usage

### HTML

```html
<tc-funnel-chart heading="Grant proposals" description="This year's round"></tc-funnel-chart>

<script type="module">
  import "@adamstavely/trenchcoat/funnel-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-funnel-chart").data = [
    { label: "Drafted", value: 148 },
    { label: "Submitted", value: 104 },
    { label: "Shortlisted", value: 39 },
    { label: "Funded", value: 27 },
  ];
</script>
```

### React / Next.js

```tsx
import { FunnelChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Drafted", value: 148 },
  { label: "Submitted", value: 104 },
  { label: "Shortlisted", value: 39 },
  { label: "Funded", value: 27 },
];

export function Proposals() {
  return <FunnelChart title="Grant proposals" description="This year's round" rateBase="first" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/funnel-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";

defineProps<{ label: TcFunnelChart["label"]; value: TcFunnelChart["value"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-funnel-chart :label="label" :value="value" @tc-view-change="onViewChange"></tc-funnel-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FunnelChart } from "@adamstavely/trenchcoat/angular/funnel-chart";
import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";

@Component({
  selector: "app-funnel-chart-example",
  imports: [FunnelChart],
  template: `<tc-funnel-chart [label]="label()" [value]="value()" (tc-view-change)="onViewChange($event)"></tc-funnel-chart>`,
})
export class FunnelChartExample {
  readonly label = input.required<TcFunnelChart["label"]>();
  readonly value = input.required<TcFunnelChart["value"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/funnel-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";

  let { label, value }: { label: TcFunnelChart["label"]; value: TcFunnelChart["value"] } = $props();
  let el: TcFunnelChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-funnel-chart bind:this={el} {label} {value}></tc-funnel-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The step's name field; by default "label" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The count field; by default "value" |
| `hideRates` | `hide-rates` | `boolean` | `false` | Leaves out the rates at the right |
| `rateBase` | `rate-base` | `FunnelRateBase` | `"previous"` | What each rate is measured against: "previous" (the step before) or "first" |
| `rateLabel` | `rate-label` | `string \| undefined` | `undefined` | The rates' column heading; by default "vs. previous" or "vs. first" |
| `heading` | `heading` | `string` | `""` | The heading, and the chart's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `data` | – | `readonly T[]` | `[]` | The rows to draw |
| `highlight` | – | `Highlight<T> \| undefined` | `undefined` | What to emphasise: an index, a label, a list of them, "max", "min", "first", "last", "none", or a test |
| `format` | – | `FormatSpec \| undefined` | `undefined` | How values are written: "number", "integer", "percent", "compact", "currency", Intl options, or a function |
| `unit` | `unit` | `string` | `""` | The unit after each value: "%", "ms", " runs" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "de"; by default the browser's |
| `height` | `height` | `number \| undefined` | `undefined` | The plot's height in px; by default the chart's own for its width |
| `still` | `still` | `boolean` | `false` | Draws everything at once: no entrance and no transitions |
| `easing` | `easing` | `EasingName` | `"spring"` | How marks move: "spring", "easeOut", "easeInOut" or "linear" |
| `duration` | `duration` | `number \| undefined` | `undefined` | How long a move takes, in ms; by default the chart's own |
| `hideLabels` | `hide-labels` | `boolean` | `false` | Leaves the values off the marks |
| `hideTooltip` | `hide-tooltip` | `boolean` | `false` | No tooltip on hover or focus |
| `bare` | `bare` | `boolean` | `false` | No card: just the plot, for a chart inside another component |
| `view` | `view` | `ChartView` | `"chart"` | The chart or the same numbers as a table. Changed by the Table button unless a tc-view-change listener calls preventDefault() |
| `labels` | – | `Partial<ChartLabels>` | `{}` | The words it shows and says, merged over defaultChartLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-view-change` | – | Yes | The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was |
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a step, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A step was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Design tokens it reads (1)

`--tc-plot-rest`

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-funnel-chart :label="…">` | `<tc-funnel-chart [label]="…">` | `<tc-funnel-chart {label}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-funnel-chart :value="…">` | `<tc-funnel-chart [value]="…">` | `<tc-funnel-chart {value}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-funnel-chart :data="…">` | `<tc-funnel-chart [data]="…">` | `<tc-funnel-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-funnel-chart :highlight="…">` | `<tc-funnel-chart [highlight]="…">` | `<tc-funnel-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-funnel-chart :format="…">` | `<tc-funnel-chart [format]="…">` | `<tc-funnel-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-funnel-chart :labels="…">` | `<tc-funnel-chart [labels]="…">` | `<tc-funnel-chart {labels}>` |

*Also attributes: `hide-rates`, `rate-base`, `rate-label`, `heading`, `description`, `unit`, `locale`, `height` and 7 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-mark-hover` | No | `el.addEventListener("tc-mark-hover", (e) => …)` | `onMarkHover={…}` | `@tc-mark-hover="…"` | `(tc-mark-hover)="…($event)"` | `el.addEventListener("tc-mark-hover", …)` |
| `tc-mark-click` | No | `el.addEventListener("tc-mark-click", (e) => …)` | `onMarkClick={…}` | `@tc-mark-click="…"` | `(tc-mark-click)="…($event)"` | `el.addEventListener("tc-mark-click", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view` itself unless a listener calls `preventDefault()` on `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-funnel-chart id="funnel-chart"></tc-funnel-chart>

<script type="module">
  import "@adamstavely/trenchcoat/funnel-chart";

  const el = document.querySelector("#funnel-chart");
  el.addEventListener("tc-view-change", (e) => {
    e.preventDefault(); // the element keeps its view…
    if (allowed(e.detail.view)) el.view = e.detail.view; // …until the app sets it
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
import "@adamstavely/trenchcoat/funnel-chart";
import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";

const props = defineProps<{ initial: TcFunnelChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcFunnelChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-funnel-chart :view="view" @tc-view-change="onViewChange"></tc-funnel-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FunnelChart } from "@adamstavely/trenchcoat/angular/funnel-chart";
import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";

@Component({
  selector: "app-controlled-funnel-chart",
  imports: [FunnelChart],
  template: `<tc-funnel-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-funnel-chart>`,
})
export class ControlledFunnelChart {
  readonly initial = input.required<TcFunnelChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcFunnelChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/funnel-chart";
  import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";

  let { initial }: { initial: TcFunnelChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcFunnelChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcFunnelChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-funnel-chart bind:this={el} {view}></tc-funnel-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-funnel-chart")` returns a `TcFunnelChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";`
- **React / Next.js:** Props: `import type { FunnelChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FunnelChart>`. The element class, for refs: `import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFunnelChart["label"]` with `import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";`
- **Angular:** The directive types the template: `[label]` takes `TcFunnelChart["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFunnelChart } from "@adamstavely/trenchcoat/funnel-chart";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the chart's name |
| `view` | `ChartView` | The chart or the table – controlled when given |
| `defaultView` | `ChartView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: ChartView) => void` | The Table button was pressed |
| `onMarkHover` | `(event: ChartEvent \| null) => void` | The pointer or keyboard moved to a mark (null: off them) |
| `onMarkClick` | `(event: ChartEvent) => void` | A mark was clicked, or picked with Enter or Space |

*Renamed or hidden on the wrapper: `heading`, `view`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous step; the tooltip shows it and it's read with its count and rate |
| Home / End | The first or last step |
| Enter / Space | Picks the step (fires `tc-mark-click`) |
| Escape | Lets go of the step; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words ("6 steps: Ideas logged 212, Drafted 148 (70%), …").
- A table of every step's count and rate is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the step with its count, rate and position ("Drafted: 148 · 70% of previous step,
  2 of 6").
- The drawing itself is hidden; nothing is said by colour alone.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/chart/element, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | internal/chart/element | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit, internal/chart/element | Focus rings for keyboard users. |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/chart/accessor | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, internal/chart/element, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/chart/element | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/chart/element | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | internal/chart/element | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/chart/element, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 7.3 KB | 3.5 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **45.1 KB** | **15.9 KB** |
| With Lit – the first component on a page | 64.6 KB | 22.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 14 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name steps with short verbs or states: "Submitted", "Shortlisted".
- Keep to the steps that matter – three to seven read best.
- Rename the rate heading with `rate-label` when "vs. previous" isn't the team's word.

## Do and don't

### Do

- Let the biggest drop carry the accent – it's the step to work on.
- Use `rate-base="first"` when people ask "how many of those who started got through".

### Don't

- Use a funnel for counts that can grow from step to step – it reads as a narrowing.
- Hide the rates when the counts differ by orders of magnitude; the widths alone won't show the small steps.

## Related

- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Waffle Chart](waffle-chart.md) – Shares of a whole as a grid of 100 cells, one category emphasised with its share written large beside it, the rest in the chart inks with a legend, cells that pop in one by one and a share that counts up, and a table view
- [Marimekko Chart](marimekko-chart.md) – Two shares in one picture – columns as wide as their share of the whole, each stacked to 100% by series – one series emphasised and named in a legend, blocks that rise and glide when the data changes, and a table view
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table

## Changelog

- **Funnel Chart** (`tc-funnel-chart`): what's left at each step, with each step's rate and the biggest drop.
