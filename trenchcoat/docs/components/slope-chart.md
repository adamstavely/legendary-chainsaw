<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Slope Chart

**Charts** · New

How each item changed between two moments, as lines from first value to last, the biggest rise emphasised, names and values nudged apart on both sides, lines that draw themselves in, and a table view

- **Element:** `<tc-slope-chart>`
- **Size:** 16.7 KB gzip · 47.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/slope-chart";` |
| React / Next.js | `import { SlopeChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/slope-chart";` · tags starting with tc- are custom elements |
| Angular | `import { SlopeChart } from "@adamstavely/trenchcoat/angular/slope-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/slope-chart";` |

## Example

The live example is in the gallery at `#/slope-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How each item changed between two moments: a line from its first value on the left to its last on the right, so
rises, falls and changes of rank read at a glance. It takes a long table – one row per item and period, with `x` the
period and `value` the number; the first and last periods are drawn – or a wide one, with `start` and `end` naming
the two value fields. The item that rose most takes the accent and the rest stay quiet; `highlight` picks a different
one, or several.

Each side writes the item's name and its value, nudged apart so none overlap; names are shortened before values are.
The sides are headed by the periods, or by `startLabel` and `endLabel`. Lines draw themselves from left to right when
the chart scrolls into view and glide when the data changes. Ported from ztd-charts (MIT).

### When to use

- Comparing a handful of items at two moments, where who overtook whom matters.
- Before and after a change, when both the direction and the new rank count.

### When not to use

- Many moments in between – use [Line Chart](line-chart.md).
- The size of each gap matters more than rank – use [Dumbbell Chart](dumbbell-chart.md).
- One value per item – use [Lollipop Chart](lollipop-chart.md) or [Bar Chart](bar-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Period** `.ui-slc__period` – the heading over each side
3. **Line** `.ui-slc__line` – one per item, from its first value to its last; the emphasised one in the accent
4. **Dot** `.ui-slc__dot` – at each end of a line
5. **Label** `.tc-chart__tick` – the item's name and value on each side
6. **Tooltip** `.tc-chart__tip` – both values and the change

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both, for a chart inside another component. Inks come from the chart tokens through overridable
component tokens on the element: `--tc-plot-accent` for the emphasised line, `--tc-plot-rest` for the quiet ones,
`--tc-plot-line-rest` for the line under the pointer, `--tc-plot-grid` for the two side rules. `--tc-slc-line` and
`--tc-slc-line-hi` set the lines' widths. `still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-slope-chart heading="Grant success rate" start="y2024" end="y2025" start-label="2024" end-label="2025" unit="%"></tc-slope-chart>

<script type="module">
  import "@adamstavely/trenchcoat/slope-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-slope-chart").data = [
    { label: "Genomics", y2024: 31, y2025: 38 },
    { label: "Imaging", y2024: 27, y2025: 22 },
    { label: "Proteomics", y2024: 19, y2025: 29 },
  ];
</script>
```

### React / Next.js

```tsx
import { SlopeChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { label: "Genomics", y2024: 31, y2025: 38 },
  { label: "Imaging", y2024: 27, y2025: 22 },
  { label: "Proteomics", y2024: 19, y2025: 29 },
];

export function GrantSuccess() {
  return <SlopeChart title="Grant success rate" data={data} start="y2024" end="y2025" startLabel="2024" endLabel="2025" unit="%" onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/slope-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";

defineProps<{ label: TcSlopeChart["label"]; x: TcSlopeChart["x"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-slope-chart :label="label" :x="x" @tc-view-change="onViewChange"></tc-slope-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SlopeChart } from "@adamstavely/trenchcoat/angular/slope-chart";
import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";

@Component({
  selector: "app-slope-chart-example",
  imports: [SlopeChart],
  template: `<tc-slope-chart [label]="label()" [x]="x()" (tc-view-change)="onViewChange($event)"></tc-slope-chart>`,
})
export class SlopeChartExample {
  readonly label = input.required<TcSlopeChart["label"]>();
  readonly x = input.required<TcSlopeChart["x"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/slope-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";

  let { label, x }: { label: TcSlopeChart["label"]; x: TcSlopeChart["x"] } = $props();
  let el: TcSlopeChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-slope-chart bind:this={el} {label} {x}></tc-slope-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | – | `Accessor<T, string> \| undefined` | `undefined` | The item's name field; by default "label" |
| `x` | – | `Accessor<T, string> \| undefined` | `undefined` | A long table's period field – the first and last periods are drawn; by default "x" |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | A long table's value field; by default "value" |
| `start` | `start` | `string \| undefined` | `undefined` | A wide table's first value field – with `end`, used instead of `x` and `value` |
| `end` | `end` | `string \| undefined` | `undefined` | A wide table's last value field |
| `startLabel` | `start-label` | `string \| undefined` | `undefined` | The left side's heading; by default the first period or the `start` field |
| `endLabel` | `end-label` | `string \| undefined` | `undefined` | The right side's heading; by default the last period or the `end` field |
| `changeLabel` | `change-label` | `string` | `"Change"` | The name of the change in the tooltip |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a line, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A line was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-slc-line` | `1.6` | both |
| `--tc-slc-line-hi` | `2.8` | both |
| `--tc-slc-hit` | `12` | both |

#### Design tokens it reads (1)

`--tc-font-weight-strong`

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-slope-chart :label="…">` | `<tc-slope-chart [label]="…">` | `<tc-slope-chart {label}>` |
| `x` | `el.x = …;` | `<… x={…} />` | `<tc-slope-chart :x="…">` | `<tc-slope-chart [x]="…">` | `<tc-slope-chart {x}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-slope-chart :value="…">` | `<tc-slope-chart [value]="…">` | `<tc-slope-chart {value}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-slope-chart :data="…">` | `<tc-slope-chart [data]="…">` | `<tc-slope-chart {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-slope-chart :highlight="…">` | `<tc-slope-chart [highlight]="…">` | `<tc-slope-chart {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-slope-chart :format="…">` | `<tc-slope-chart [format]="…">` | `<tc-slope-chart {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-slope-chart :labels="…">` | `<tc-slope-chart [labels]="…">` | `<tc-slope-chart {labels}>` |

*Also attributes: `start`, `end`, `start-label`, `end-label`, `change-label`, `heading`, `description`, `unit` and 9 more – see the API table.*

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
<tc-slope-chart id="slope-chart"></tc-slope-chart>

<script type="module">
  import "@adamstavely/trenchcoat/slope-chart";

  const el = document.querySelector("#slope-chart");
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
import "@adamstavely/trenchcoat/slope-chart";
import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";

const props = defineProps<{ initial: TcSlopeChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcSlopeChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-slope-chart :view="view" @tc-view-change="onViewChange"></tc-slope-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SlopeChart } from "@adamstavely/trenchcoat/angular/slope-chart";
import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";

@Component({
  selector: "app-controlled-slope-chart",
  imports: [SlopeChart],
  template: `<tc-slope-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-slope-chart>`,
})
export class ControlledSlopeChart {
  readonly initial = input.required<TcSlopeChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcSlopeChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/slope-chart";
  import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";

  let { initial }: { initial: TcSlopeChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcSlopeChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcSlopeChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-slope-chart bind:this={el} {view}></tc-slope-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-slope-chart")` returns a `TcSlopeChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";`
- **React / Next.js:** Props: `import type { SlopeChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SlopeChart>`. The element class, for refs: `import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSlopeChart["label"]` with `import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";`
- **Angular:** The directive types the template: `[label]` takes `TcSlopeChart["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSlopeChart } from "@adamstavely/trenchcoat/slope-chart";`

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
| Arrow keys | Move to the next or previous line; the tooltip shows it and it's read with both values |
| Home / End | The first or last line |
| Enter / Space | Picks the line (fires `tc-mark-click`) |
| Escape | Lets go of the line; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, with the chart described in words (the two periods, then each item from
  one value to the other).
- A table of every item is always there for screen readers; the Table button shows it to everyone.
- Moving with the arrows announces the item with both values and its position ("Genomics: 2024 31% → 2025 38%, 1 of 5").
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
| **This component alone** | 8.6 KB | 3.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 1.0 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **47.5 KB** | **16.7 KB** |
| With Lit – the first component on a page | 67.0 KB | 22.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 17 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |

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

- Keep to about ten items; past that the labels crowd and get nudged far from their lines.
- Keep item names short – they share each side with the value.
- Give `unit` ("%", " pts") rather than baking it into the values; the tooltip's change uses it too.

## Do and don't

### Do

- Let one line carry the accent – the change the chart is about.
- Name the periods plainly with `startLabel` and `endLabel` when the field names aren't words.

### Don't

- Use it for more than two moments – the ones in between are ignored.
- Compare items measured in different units on one chart.

## Related

- [Dumbbell Chart](dumbbell-chart.md) – Two values per item, before and after or target and actual, as a hollow and a solid dot joined by a bar, ordered by the second, the biggest move emphasised, bars that stretch in, and a table view
- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Lollipop Chart](lollipop-chart.md) – One value per item as a thin stem and dot, ordered from the largest, lying down or upright, the largest emphasised, values past the dots, missing ones written "–", stems that grow in and glide when the data changes, and a table view
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view

## Changelog

- **Slope Chart** (`tc-slope-chart`): how each item changed between two moments.
