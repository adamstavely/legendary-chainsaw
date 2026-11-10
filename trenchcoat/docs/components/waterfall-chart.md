<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Waterfall Chart

**Charts** · New

How a starting figure becomes an ending one – steps up and down bridged by dashed connectors, totals on the baseline, rises and falls in the status inks with a legend, signed changes beside each bar and a table view

- **Element:** `<tc-waterfall-chart>`
- **Size:** 17.4 KB gzip · 49.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/waterfall-chart";` |
| React / Next.js | `import { WaterfallChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/waterfall-chart";` · tags starting with tc- are custom elements |
| Angular | `import { WaterfallChart } from "@adamstavely/trenchcoat/angular/waterfall-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/waterfall-chart";` |

## Example

The live example is in the gallery at `#/waterfall-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How a starting figure becomes an ending one. Each row is a step up or down from where the last left off; totals stand
on the baseline. The first row is the starting total unless `delta-start` is set, a row with `type: "total"` is a
subtotal (at its value, or the running level when it has none), and `end-total` adds the final level as a last bar.

Increases take the success ink and decreases the danger ink, named in the legend; totals stay quiet. `highlight` gives
steps the accent – an index, a name, or "max" for the largest increase. Dashed connectors carry each level to the
next step, and each change is written above its bar, or below it for a fall. The steps drop in one after another when the chart scrolls
into view and glide when the data changes. Ported from ztd-charts (MIT).

### When to use

- Explaining a change between two totals: a budget's award and what's left, a quarter's opening and closing balance.
- Showing which contributions pushed a figure up and which pulled it down.

### When not to use

- Comparing unrelated categories – use [Bar Chart](bar-chart.md).
- Finding the few causes behind most of a total – use [Pareto Chart](pareto-chart.md).
- A budget's spend against plan over time – use [Budget Burn](budget-burn.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Step** `.ui-wfl__bar` – one per row; a total, a rise or a fall
3. **Connector** `.ui-wfl__link` – the dashed line from one step's level to the next step
4. **Value** `.tc-chart__value` – the change (or a total's level) beside the bar
5. **Axis** `.tc-chart__grid` – the grid lines and their values; the step names under the bars, totals in bold
6. **Tooltip** `.tc-chart__tip` – the step's change and the running level after it

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Rises and falls use the status inks through component
tokens on the element – `--tc-wfl-up`, `--tc-wfl-down` and `--tc-wfl-total` – and the emphasised step
`--tc-plot-accent`. Values are written in the text inks beside the bars, never on them. `still` (or the system's
reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-waterfall-chart heading="Grant budget" description="Year one, in thousands" unit="k" end-total="Remaining"></tc-waterfall-chart>

<script type="module">
  import "@adamstavely/trenchcoat/waterfall-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-waterfall-chart").data = [
    { label: "Awarded", value: 480 },
    { label: "Staff", value: -190 },
    { label: "Supplement", value: 60 },
  ];
</script>
```

### React / Next.js

```tsx
import { WaterfallChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Awarded", value: 480 },
  { label: "Staff", value: -190 },
  { label: "Supplement", value: 60 },
];

export function Budget() {
  return <WaterfallChart title="Grant budget" description="Year one, in thousands" data={data} unit="k" endTotal="Remaining" onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/waterfall-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";

defineProps<{ label: TcWaterfallChart["label"]; value: TcWaterfallChart["value"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-waterfall-chart :label="label" :value="value" @tc-view-change="onViewChange"></tc-waterfall-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { WaterfallChart } from "@adamstavely/trenchcoat/angular/waterfall-chart";
import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";

@Component({
  selector: "app-waterfall-chart-example",
  imports: [WaterfallChart],
  template: `<tc-waterfall-chart [label]="label()" [value]="value()" (tc-view-change)="onViewChange($event)"></tc-waterfall-chart>`,
})
export class WaterfallChartExample {
  readonly label = input.required<TcWaterfallChart["label"]>();
  readonly value = input.required<TcWaterfallChart["value"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/waterfall-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";

  let { label, value }: { label: TcWaterfallChart["label"]; value: TcWaterfallChart["value"] } = $props();
  let el: TcWaterfallChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-waterfall-chart bind:this={el} {label} {value}></tc-waterfall-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The step's name field; by default "label" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The step's change field (a total's level); by default "value" |
| `type` | – | `Accessor<T, string> \| undefined` | `undefined` | The step's type field: "total" makes it a total bar, at its value or, with none, the running level; by default "type" |
| `deltaStart` | `delta-start` | `boolean` | `false` | The first row is a change like the rest, not the starting total |
| `endTotal` | `end-total` | `string \| boolean` | `false` | Adds a total bar at the end: true names it "Total", a string names it |
| `hideConnectors` | `hide-connectors` | `boolean` | `false` | Leaves out the dashed lines carrying each level to the next step |
| `waterfallLabels` | – | `Partial<WaterfallLabels>` | `{}` | The words it shows, merged over defaultWaterfallLabels |
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

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-wfl-up` | `var(--tc-status-success-solid)` | both |
| `--tc-wfl-down` | `var(--tc-status-danger-solid)` | both |
| `--tc-wfl-total` | `var(--tc-plot-rest)` | both |

#### Design tokens it reads (5)

`--tc-plot-accent`, `--tc-plot-rest`, `--tc-plot-zero`, `--tc-status-danger-solid`, `--tc-status-success-solid`

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-waterfall-chart :label="…">` | `<tc-waterfall-chart [label]="…">` | `<tc-waterfall-chart {label}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-waterfall-chart :value="…">` | `<tc-waterfall-chart [value]="…">` | `<tc-waterfall-chart {value}>` |
| `type` | `el.type = …;` | `<… type={…} />` | `<tc-waterfall-chart :type="…">` | `<tc-waterfall-chart [type]="…">` | `<tc-waterfall-chart {type}>` |
| `waterfallLabels` | `el.waterfallLabels = …;` | `<… waterfallLabels={…} />` | `<tc-waterfall-chart :waterfallLabels="…">` | `<tc-waterfall-chart [waterfallLabels]="…">` | `<tc-waterfall-chart {waterfallLabels}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-waterfall-chart :data="…">` | `<tc-waterfall-chart [data]="…">` | `<tc-waterfall-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-waterfall-chart :highlight="…">` | `<tc-waterfall-chart [highlight]="…">` | `<tc-waterfall-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-waterfall-chart :format="…">` | `<tc-waterfall-chart [format]="…">` | `<tc-waterfall-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-waterfall-chart :labels="…">` | `<tc-waterfall-chart [labels]="…">` | `<tc-waterfall-chart {labels}>` |

*Also attributes: `delta-start`, `end-total`, `hide-connectors`, `heading`, `description`, `unit`, `locale`, `height` and 7 more – see the API table.*

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
<tc-waterfall-chart id="waterfall-chart"></tc-waterfall-chart>

<script type="module">
  import "@adamstavely/trenchcoat/waterfall-chart";

  const el = document.querySelector("#waterfall-chart");
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
import "@adamstavely/trenchcoat/waterfall-chart";
import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";

const props = defineProps<{ initial: TcWaterfallChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcWaterfallChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-waterfall-chart :view="view" @tc-view-change="onViewChange"></tc-waterfall-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { WaterfallChart } from "@adamstavely/trenchcoat/angular/waterfall-chart";
import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";

@Component({
  selector: "app-controlled-waterfall-chart",
  imports: [WaterfallChart],
  template: `<tc-waterfall-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-waterfall-chart>`,
})
export class ControlledWaterfallChart {
  readonly initial = input.required<TcWaterfallChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcWaterfallChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/waterfall-chart";
  import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";

  let { initial }: { initial: TcWaterfallChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcWaterfallChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcWaterfallChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-waterfall-chart bind:this={el} {view}></tc-waterfall-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-waterfall-chart")` returns a `TcWaterfallChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";`
- **React / Next.js:** Props: `import type { WaterfallChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof WaterfallChart>`. The element class, for refs: `import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWaterfallChart["label"]` with `import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";`
- **Angular:** The directive types the template: `[label]` takes `TcWaterfallChart["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWaterfallChart } from "@adamstavely/trenchcoat/waterfall-chart";`

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
| Arrow keys | Move to the next or previous step; the tooltip shows it and it's read with its change |
| Home / End | The first or last step |
| Enter / Space | Picks the step (fires `tc-mark-click`) |
| Escape | Lets go of the step; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, with every step described in words ("Awarded 480, Staff −190, …").
- A table of every step is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the step with its change and position ("Staff: −190k, 2 of 7").
- Rises and falls are written with their sign, so nothing is said by colour alone.

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
| **This component alone** | 9.2 KB | 4.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **49.0 KB** | **17.4 KB** |
| With Lit – the first component on a page | 68.4 KB | 23.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 17 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |

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

- Name steps by what moved the figure ("Staff", "Supplement"), not by their sign.
- Give `unit` ("k", " h") rather than baking it into the values; changes are written with + and −.
- Rename the words through `waterfallLabels` when "Increase" and "Decrease" aren't the right ones ("Returned", "Used").

## Do and don't

### Do

- Start from a total and end on one, so the chart reads as a bridge between them.
- Keep the steps in the order they happened or matter.

### Don't

- Use it for more than a dozen or so steps; the names under the bars thin out.
- Colour a step by hand to mean something else – the inks already mean up and down.

## Related

- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Pareto Chart](pareto-chart.md) – Which few items make most of a whole – bars from the largest down, the running share as a line across them, a dashed 80% threshold, the bars that reach it emphasised and their share beside the line, with a table view
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Budget Burn](budget-burn.md) – How fast each budget is being spent – spent against budget, the burn as a bar with a pace marker and Ahead, On or Behind pace in words, people and team, totals in the header and a sort by budget or burn

## Changelog

- **Waterfall Chart** (`tc-waterfall-chart`): steps up and down from a start to an end, with totals.
