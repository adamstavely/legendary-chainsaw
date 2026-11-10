<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Calendar Heatmap

**Charts** · New

An amount per day on a grid of weeks, each day shaded from light to the full accent, the busiest outlined, a year per row over several years, a scale legend, weeks that fade in, a canvas for long ranges, and a table view

- **Element:** `<tc-calendar-heatmap>`
- **Size:** 18.4 KB gzip · 52.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/calendar-heatmap";` |
| React / Next.js | `import { CalendarHeatmap } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/calendar-heatmap";` · tags starting with tc- are custom elements |
| Angular | `import { CalendarHeatmap } from "@adamstavely/trenchcoat/angular/calendar-heatmap";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/calendar-heatmap";` |

## Example

The live example is in the gallery at `#/calendar-heatmap`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An amount per day on a grid of weeks: each column is a week, each row a weekday, and each day is a square shaded by
its value. The range runs from the first day in the data to the last; data over several years is drawn a year per
row, January to December, with the year beside it. The shading mixes the accent into the card's colour – light for a
little, the full accent for the most – topped at the 95th percentile so one outlier doesn't wash out the rest. A day
with nothing on it takes the quiet empty ink, and the busiest day is outlined (`highlight` picks others, by ISO date
or a test). A legend in the header gives the scale from its lowest value to its top.

Weeks fade in from left to right when the chart scrolls into view, and the shades cross-fade when the data changes.
Above `canvas-threshold` days (4,000 by default, about eleven years) the days are painted on a canvas under the
drawing, so very long ranges stay smooth. Ported from ztd-charts (MIT).

### When to use

- How an amount spreads over days, weeks and seasons: samples logged, instrument hours, compute spent, audits closed.
- Spotting weekly rhythms, busy runs and closures across months or years of daily data.
- A value per day that can be large or fractional, or negative – the shading follows the value, not a count.

### When not to use

- A year of someone's activity as a contribution graph, with a total, a readout and day selection – use
  [Activity Calendar](activity-calendar.md).
- Two categories against each other – weekday by hour, service by region – rather than dates – use
  [Heatmap](heatmap.md).
- The trend of a daily value, where the exact level matters more than the pattern – use
  [Line Chart](line-chart.md).
- A handful of totals by week or month – use [Bar Chart](bar-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the legend and the Table button
2. **Legend** `.ui-clh__legend` – the lowest value, the empty shade and the ramp of shades, and the top of the scale
3. **Day** `.ui-clh__day` – a square shaded by the day's value; the emphasised day outlined
4. **Labels** `.tc-chart__tick` – month names along the top, every other weekday down the side, and each year's
5. **Ring** `.ui-clh__ring` – round the day under the pointer or the keyboard
6. **Tooltip** `.tc-chart__tip` – the day's date and value
7. **Canvas** `.tc-chart__canvas` – where the days are painted above `canvas-threshold`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both (and the legend with the header), for a chart inside another component. The shades are
`--tc-clh-ink` (by default `--tc-plot-accent`) mixed into `--tc-plot-bg`; empty days take `--tc-clh-empty` (by default
`--tc-plot-grid`) and the outline `--tc-clh-mark` (by default `--tc-plot-focus`). Set any of them on the element; the
canvas reads the same tokens. No value is written on a square – they're in the tooltip and the table. `still` (or the
system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-calendar-heatmap heading="Samples logged" description="January to June, by day" unit=" samples"></tc-calendar-heatmap>

<script type="module">
  import "@adamstavely/trenchcoat/calendar-heatmap";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-calendar-heatmap").data = [
    { date: "2026-03-02", value: 14 },
    { date: "2026-03-03", value: 19 },
    { date: "2026-03-04", value: 11 },
  ];
</script>
```

### React / Next.js

```tsx
import { CalendarHeatmap } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { date: "2026-03-02", value: 14 },
  { date: "2026-03-03", value: 19 },
  { date: "2026-03-04", value: 11 },
];

export function Intake() {
  return <CalendarHeatmap title="Samples logged" description="January to June, by day" data={data} unit=" samples" weekStart={1} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/calendar-heatmap";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";

defineProps<{ date: TcCalendarHeatmap["date"]; value: TcCalendarHeatmap["value"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-calendar-heatmap :date="date" :value="value" @tc-view-change="onViewChange"></tc-calendar-heatmap>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CalendarHeatmap } from "@adamstavely/trenchcoat/angular/calendar-heatmap";
import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";

@Component({
  selector: "app-calendar-heatmap-example",
  imports: [CalendarHeatmap],
  template: `<tc-calendar-heatmap [date]="date()" [value]="value()" (tc-view-change)="onViewChange($event)"></tc-calendar-heatmap>`,
})
export class CalendarHeatmapExample {
  readonly date = input.required<TcCalendarHeatmap["date"]>();
  readonly value = input.required<TcCalendarHeatmap["value"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/calendar-heatmap";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";

  let { date, value }: { date: TcCalendarHeatmap["date"]; value: TcCalendarHeatmap["value"] } = $props();
  let el: TcCalendarHeatmap;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-calendar-heatmap bind:this={el} {date} {value}></tc-calendar-heatmap>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `date` | – | `Accessor<T, unknown> \| undefined` | `undefined` | The date field: epoch ms, an ISO date or a Date; by default "date". Rows on the same day are added up |
| `value` | – | `Accessor<T, number> \| undefined` | `undefined` | The value field; by default "value" |
| `weekStart` | `week-start` | `0 \| 1` | `0` | The first day of the week: 0 Sunday, 1 Monday |
| `gap` | `gap` | `number` | `2.5` | The space between days, in px |
| `canvasThreshold` | `canvas-threshold` | `number` | `4000` | Above this many days the grid is painted on a canvas instead of drawn in SVG |
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
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a day, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A day was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-clh-ink` | `var(--tc-plot-accent)` | both |
| `--tc-clh-empty` | `var(--tc-plot-grid)` | both |
| `--tc-clh-mark` | `var(--tc-plot-focus)` | both |

#### Design tokens it reads (12)

`--tc-clh-delay`, `--tc-duration-slow`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-font-size-xs`, `--tc-line-height-tight`, `--tc-plot-accent`, `--tc-plot-focus`, `--tc-plot-grid`, `--tc-space-0-5`, `--tc-space-1-5`, `--tc-text-muted`

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
| `date` | `el.date = …;` | `<… date={…} />` | `<tc-calendar-heatmap :date="…">` | `<tc-calendar-heatmap [date]="…">` | `<tc-calendar-heatmap {date}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-calendar-heatmap :value="…">` | `<tc-calendar-heatmap [value]="…">` | `<tc-calendar-heatmap {value}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-calendar-heatmap :data="…">` | `<tc-calendar-heatmap [data]="…">` | `<tc-calendar-heatmap {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-calendar-heatmap :highlight="…">` | `<tc-calendar-heatmap [highlight]="…">` | `<tc-calendar-heatmap {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-calendar-heatmap :format="…">` | `<tc-calendar-heatmap [format]="…">` | `<tc-calendar-heatmap {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-calendar-heatmap :labels="…">` | `<tc-calendar-heatmap [labels]="…">` | `<tc-calendar-heatmap {labels}>` |

*Also attributes: `week-start`, `gap`, `canvas-threshold`, `heading`, `description`, `unit`, `locale`, `height` and 7 more – see the API table.*

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
<tc-calendar-heatmap id="calendar-heatmap"></tc-calendar-heatmap>

<script type="module">
  import "@adamstavely/trenchcoat/calendar-heatmap";

  const el = document.querySelector("#calendar-heatmap");
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
import "@adamstavely/trenchcoat/calendar-heatmap";
import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";

const props = defineProps<{ initial: TcCalendarHeatmap["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcCalendarHeatmap["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-calendar-heatmap :view="view" @tc-view-change="onViewChange"></tc-calendar-heatmap>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CalendarHeatmap } from "@adamstavely/trenchcoat/angular/calendar-heatmap";
import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";

@Component({
  selector: "app-controlled-calendar-heatmap",
  imports: [CalendarHeatmap],
  template: `<tc-calendar-heatmap [view]="view()" (tc-view-change)="onViewChange($event)"></tc-calendar-heatmap>`,
})
export class ControlledCalendarHeatmap {
  readonly initial = input.required<TcCalendarHeatmap["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcCalendarHeatmap["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/calendar-heatmap";
  import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";

  let { initial }: { initial: TcCalendarHeatmap["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcCalendarHeatmap;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcCalendarHeatmap["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-calendar-heatmap bind:this={el} {view}></tc-calendar-heatmap>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-calendar-heatmap")` returns a `TcCalendarHeatmap` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";`
- **React / Next.js:** Props: `import type { CalendarHeatmapProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CalendarHeatmap>`. The element class, for refs: `import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCalendarHeatmap["date"]` with `import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";`
- **Angular:** The directive types the template: `[date]` takes `TcCalendarHeatmap["date"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCalendarHeatmap } from "@adamstavely/trenchcoat/calendar-heatmap";`

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
| ↑ / ↓ | The previous or next day; the tooltip shows it and it's read with its value |
| ← / → | The same weekday a week earlier or later; past either end, the previous or next day |
| Home / End | The first or last day |
| Enter / Space | Picks the day (fires `tc-mark-click`) |
| Escape | Lets go of the day; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words (how many days, and the most on one).
- A table of every day and its value is always there for screen readers (the first 60, then how many more); the
  Table button shows it to everyone.
- Moving with the arrows announces the day with its value and position ("Mon, June 1: 3, 1 of 14").
- The legend is an image named by its range ("Shading from 0 to 15 or more"); the drawing itself is hidden.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, internal/chart/element, tokens.css | Tints and washes mixed from the tokens. |
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
| **This component alone** | 13.2 KB | 5.9 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/canvas` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **52.1 KB** | **18.4 KB** |
| With Lit – the first component on a page | 72.1 KB | 24.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 23 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give one row per day, or several – rows on the same day are added up. Dates may be ISO strings, epoch ms or Dates.
- Give `unit` (" samples", " h") rather than baking it into the values.
- Start the week on Monday with `week-start="1"` where that's the custom.

## Do and don't

### Do

- Let the shading show the pattern and leave exact values to the tooltip and the table.
- Use it for daily data over months – the grid needs a few weeks before a rhythm shows.

### Don't

- Use it for a few days or a few totals – a bar chart reads faster.
- Lower `canvas-threshold` without need: the SVG keeps crisp outlines and fades week by week.

## Related

- [Activity Calendar](activity-calendar.md) – A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view
- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Parallel Chart](parallel-chart.md) – Parallel coordinates: rows as lines across a vertical axis per measure, each on its own scale, axes that can run upside down, one row emphasised and named, gaps for missing values, a canvas for many rows, and a table view

## Changelog

- **Calendar Heatmap** (`tc-calendar-heatmap`): a value per day on a grid of weeks, years stacked.
