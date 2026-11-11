<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Radar Chart

**Data & charts** · New

A few measures on axes round a centre, joined into a shape – one series with its value on each axis, or up to three compared – as a cross of axes or a web of rings, with a table view

- **Element:** `<tc-radar-chart>`
- **Size:** 10.6 KB gzip · 30.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/radar-chart";` |
| React / Next.js | `import { RadarChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/radar-chart";` · tags starting with tc- are custom elements |
| Angular | `import { RadarChart } from "@adamstavely/trenchcoat/angular/radar-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/radar-chart";` |

## Example

The live example is in the gallery at `#/radar-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A few measures of one thing on axes round a centre, with the values joined into a shape. Each axis runs from nothing
at the centre to `max` at its end – by default the largest value, or 100 when the unit is “%”. One series shows its
value over each axis's name (“90% Commits”), so the shape and the numbers read together; up to three series compare,
each in its own colour, named in a legend. `grid="web"` adds polygon rings and `grid="circle"` round ones, at each
quarter or as many steps as `levels` says. The shapes grow from the centre when the chart comes on screen and glide to
their new places when the data changes; `still` or reduced motion draws them in place at once. The Table button swaps
the drawing for the same numbers as a plain table.

### When to use

- How one thing splits across a handful of kinds of activity: commits, reviews, issues and pull requests.
- Two or three things scored on the same few measures, where the overall shape matters more than any one number.
- A profile of strengths and gaps across five to eight skills or practices.

### When not to use

- A total split into parts that add up – use [Breakdown Chart](breakdown-chart.md) or [Coverage Ring](coverage-ring.md).
- Many rows by many columns – use [Heatmap](heatmap.md).
- Scores people need to compare exactly – use [Eval Scorecard](eval-scorecard.md) or a bar chart.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Drawing** `.ui-rdr__plot` – the axes, rings and shapes, an image named by the heading
2. **Axes** `.ui-rdr__axis` – a line from the centre to each axis's end
3. **Rings** `.ui-rdr__ring` – `levels` steps out to the edge (quarters by default): polygons with `grid="web"`,
4. **Shape** `.ui-rdr__shape` – a series' values joined, with `.ui-rdr__dot` at each value
5. **Axis name** `.ui-rdr__label` – each axis's name at its end, with `.ui-rdr__value` over it for one series
6. **Legend** `.ui-rdr__legend` – the series' names and colours, when there's more than one
7. **Table** `.ui-rdr__table` – the same numbers, from the Table button

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. The drawing is the same in both. A page can set `--tc-rdr-width` (the drawing's widest, 420 px; narrower, it shrinks to fit), `--tc-rdr-axis`
(the axes' colour) and `--tc-rdr-ink-1` to `--tc-rdr-ink-3` (each series' colour, from the chart palette).

The motion is the same as the other charts': the entrance waits until a quarter of the chart is on screen, each series
following the one before by a moment; a data change glides every shape from wherever it is, a new series growing from
the centre and a removed one shrinking back into it. `still` turns it off for that chart, and the system's reduced
motion setting turns it off everywhere. `replay()` plays the entrance again.

## Usage

### HTML

```html
<tc-radar-chart id="activity" heading="Activity overview" description="Contributions in 2026" unit="%"></tc-radar-chart>

<script type="module">
  import "@adamstavely/trenchcoat/radar-chart";
  import "@adamstavely/trenchcoat/tokens.css";

  const chart = document.querySelector("#activity");
  chart.axes = ["Code review", "Issues", "Pull requests", "Commits"];
  chart.series = [{ name: "Contributions", values: [0, 0, 10, 90] }];
</script>
```

### React / Next.js

```tsx
import { RadarChart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function LabPractices() {
  return (
    <RadarChart
      title="Lab practices"
      grid="circle"
      levels={5}
      max={5}
      axes={["Testing", "Documentation", "Code review", "Reproducibility", "Data handling"]}
      series={[
        { name: "Genomics", values: [4.5, 3, 4, 4.5, 3.5] },
        { name: "Imaging", values: [3, 4.5, 3.5, 2.5, 4] },
      ]}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/radar-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";

defineProps<{ axes: TcRadarChart["axes"]; series: TcRadarChart["series"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-radar-chart :axes="axes" :series="series" @tc-view-change="onViewChange"></tc-radar-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RadarChart } from "@adamstavely/trenchcoat/angular/radar-chart";
import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";

@Component({
  selector: "app-radar-chart-example",
  imports: [RadarChart],
  template: `<tc-radar-chart [axes]="axes()" [series]="series()" (tc-view-change)="onViewChange($event)"></tc-radar-chart>`,
})
export class RadarChartExample {
  readonly axes = input.required<TcRadarChart["axes"]>();
  readonly series = input.required<TcRadarChart["series"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/radar-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";

  let { axes, series }: { axes: TcRadarChart["axes"]; series: TcRadarChart["series"] } = $props();
  let el: TcRadarChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-radar-chart bind:this={el} {axes} {series}></tc-radar-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Radar chart"` | The heading, and the drawing's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `axes` | – | `string[]` | `[]` | The axes' names, clockwise from the top |
| `series` | – | `RadarSeries[]` | `[]` | The series to draw – the first three; each has a value per axis |
| `max` | `max` | `number \| undefined` | `undefined` | The value at the edge; by default the largest value (100 when the unit is "%") |
| `grid` | `grid` | `RadarGrid` | `"axes"` | Bare axes from the centre ("axes"), or rings as well: polygons ("web") or circles ("circle") |
| `levels` | `levels` | `number` | `4` | How many rings the grid has, evenly spaced out to the edge, when `grid` is "web" or "circle" |
| `still` | `still` | `boolean` | `false` | Draws the shapes in place at once: no growing from the centre and no gliding to new values |
| `unit` | `unit` | `string \| undefined` | `undefined` | The unit after each number: "%", "pts" |
| `format` | – | `((value: number) => string) \| undefined` | `undefined` | Writes a value, e.g. (v) => `${v} of 5`; replaces the number and `unit` |
| `hideValues` | `hide-values` | `boolean` | `false` | Leaves the values off the axes' names, for one series |
| `axisHeader` | `axis-header` | `string` | `"Measure"` | The table's corner: what the axes are |
| `view` | `view` | `RadarView` | `"chart"` | The chart or the same numbers as a table. Changed by the Table button unless a tc-view-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-view-change` | – | Yes | The chart / table switch was pressed ({ view }: RadarViewChange); cancelable – prevented, `view` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Grows the shapes from the centre again |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rdr-width` | `420px` | both |
| `--tc-rdr-axis` | `var(--tc-border-strong)` | both |
| `--tc-rdr-ink-1` | `var(--tc-chart-1)` | both |
| `--tc-rdr-ink-2` | `var(--tc-chart-2)` | both |
| `--tc-rdr-ink-3` | `var(--tc-chart-3)` | both |
| `--tc-rdr-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (34)

`--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-2`, `--tc-chart-3`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-xs`, `--tc-rdr-ink`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `axes` | `el.axes = …;` | `<… axes={…} />` | `<tc-radar-chart :axes="…">` | `<tc-radar-chart [axes]="…">` | `<tc-radar-chart {axes}>` |
| `series` | `el.series = …;` | `<… series={…} />` | `<tc-radar-chart :series="…">` | `<tc-radar-chart [series]="…">` | `<tc-radar-chart {series}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-radar-chart :format="…">` | `<tc-radar-chart [format]="…">` | `<tc-radar-chart {format}>` |

*Also attributes: `heading`, `description`, `max`, `grid`, `levels`, `still`, `unit`, `hide-values` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view` itself unless a listener calls `preventDefault()` on `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-radar-chart id="radar-chart"></tc-radar-chart>

<script type="module">
  import "@adamstavely/trenchcoat/radar-chart";

  const el = document.querySelector("#radar-chart");
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
import "@adamstavely/trenchcoat/radar-chart";
import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";

const props = defineProps<{ initial: TcRadarChart["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcRadarChart["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-radar-chart :view="view" @tc-view-change="onViewChange"></tc-radar-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RadarChart } from "@adamstavely/trenchcoat/angular/radar-chart";
import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";

@Component({
  selector: "app-controlled-radar-chart",
  imports: [RadarChart],
  template: `<tc-radar-chart [view]="view()" (tc-view-change)="onViewChange($event)"></tc-radar-chart>`,
})
export class ControlledRadarChart {
  readonly initial = input.required<TcRadarChart["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcRadarChart["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/radar-chart";
  import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";

  let { initial }: { initial: TcRadarChart["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcRadarChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcRadarChart["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-radar-chart bind:this={el} {view}></tc-radar-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-radar-chart")` returns a `TcRadarChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";`
- **React / Next.js:** Props: `import type { RadarChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RadarChart>`. The element class, for refs: `import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRadarChart["axes"]` with `import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";`
- **Angular:** The directive types the template: `[axes]` takes `TcRadarChart["axes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRadarChart } from "@adamstavely/trenchcoat/radar-chart";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the drawing's name |
| `view` | `RadarView` | The chart or the table – controlled when given |
| `defaultView` | `RadarView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: RadarView) => void` | The Table button was pressed |

*Renamed or hidden on the wrapper: `heading`, `view`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the Table button |
| Enter / Space | Switches between the drawing and the table |

The drawing itself takes no focus; the table holds the same numbers.

### Screen readers

The drawing is an image named by the heading and read as its numbers: “Activity overview, Code review 0%, Issues 0%,
Pull requests 10%, Commits 90%”, or each series in turn when there are several. The names and values drawn on it
repeat that, so they're hidden. The Table button is a toggle (`aria-pressed`), and the table has the heading as its
caption, the axes as row headers and the series as column headers.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 16.5 KB | 5.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **30.8 KB** | **10.6 KB** |
| With Lit – the first component on a page | 50.5 KB | 16.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 41 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of axes replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.4 ms | axes: first render, 329 nodes; update 1.0 ms |
| 1,000 items | 29 ms | axes: first render, 3,029 nodes; update 3.9 ms |

1,000 items of axes: 29 ms, 3,029 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **46 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use three to eight axes; fewer reads better as bars, more crowds the names.
- Keep axis names short – two words – since they sit at the ends of the axes.
- Give every series a value for every axis; `null` is drawn at the centre and read as “No data”.
- Set `max` when the scale has a natural top (“out of 5”); leave it for shares, which top out at 100%.

## Do and don't

### Do

- Order the axes so related measures sit next to each other – the shape means more.
- Use `grid="web"` when people will judge distances from the centre, not just the shape; `grid="circle"` when the
  axes are many and a polygon web would look busy.
- Match `levels` to the scale – five rings for scores out of 5 – so each ring is a value people can name.
- Keep to one series where you can; compare at most three.

### Don't

- Don't use it for values that add up to a total – the shape's area means nothing there.
- Don't rely on colour alone to tell series apart – the legend names them and the table lists them.
- Don't mix units across axes; scale them to one measure first.
- Don't set `still` just to calm a page – reduced motion already turns the motion off for those who ask.

## Related

- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Coverage Ring](coverage-ring.md) – One share at a glance – a large ring with the percentage and a caption, a title and a line, and a bar from healthiest to needs attention that reads out each segment
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer

## Changelog

- **Radar Chart** (`tc-radar-chart`) – a few measures on axes round a centre, joined into a shape: one series with its value over each axis's name, or up to three compared in their own colours with a legend. A cross of axes or a web of rings (`grid="web"`), scaled to the largest value, 100 for “%”, or `max`; read as its numbers, with a Table view.
