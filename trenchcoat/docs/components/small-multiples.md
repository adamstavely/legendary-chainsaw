<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Small Multiples

**Charts** · New

One chart repeated in a grid, a panel per value of a field – any chart a spec can draw – on a shared scale, with one legend, linked pointing and columns that fit the width.

- **Element:** `<tc-small-multiples>`
- **Size:** 142.0 KB gzip · 444.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/small-multiples";` |
| React / Next.js | `import { SmallMultiples } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/small-multiples";` · tags starting with tc- are custom elements |
| Angular | `import { SmallMultiples } from "@adamstavely/trenchcoat/angular/small-multiples";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/small-multiples";` |

## Example

The live example is in the gallery at `#/small-multiples`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One chart repeated in a grid, a panel per value of a field: samples by month as a line per lab, instrument time as a
donut per site. It takes the same JSON spec as [Chart](chart.md) – any chart type a spec can draw – plus `facet`, the
field whose values make the panels; or set `type`, `data`, `encoding` and `options` directly. The spec is checked once,
before the rows are split, and a problem – a missing `facet` field among them – is shown instead of the grid and
reported in `tc-spec-check`.

Each panel is the chart drawn bare under its facet value, all in one card with the heading, the description and, for
Line, Area and Bar charts with several series, one legend for every panel; each panel then has every series in the
same order, so its inks match the legend. Panels follow the data's order, `sort="alpha"`, or `sort="value"` – the
largest total of the value channel first.

`shared="y"`, the default, gives every panel the same value axis so their heights compare honestly. It applies to the
charts with a value range to set – Line, Area and Bar (their `yDomain`) – counting stacked totals when the chart
stacks; other charts, a donut or a treemap, always fit their own data. `shared="both"` also gives Line, Area and Bar
panels the same x values, a gap where a panel has no row; `"none"` lets each panel fit itself.

Columns fit the width: as many as fit at `min-panel-width` (220px by default), down to one. `columns` fixes the count,
but never so many that a panel drops under 160px. Pointing at an x in one panel shows the same x in every other panel,
without their tooltips, so a month can be read across labs at a glance.

### When to use

- Comparing the shape of one measure across many groups – more than a few series would tangle on one chart.
- The same breakdown for each site, team or period, side by side.

### When not to use

- Two to four series that read well together – use one [Line Chart](line-chart.md) or [Bar Chart](bar-chart.md).
- One chart from a spec – use [Chart](chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading, description and the series legend
2. **Grid** `.ui-sml__grid` – a list of the panels, as many columns as fit
3. **Panel** `.ui-sml__panel` – a list item: its facet value `.ui-sml__name` and its chart, drawn bare
4. **Problem** `.ui-sml__problem` – what's wrong with the spec, in place of the grid

## Looks

Standard puts the header on the gray tray above one white card holding the grid; Clean is one white card with the
header as its first row. The panels are bare charts – no tray or card of their own – so the grid reads as one figure.
The legend uses the charts' own swatches and inks; the facet names are in the strong text ink above each panel.

## Usage

### HTML

```html
<tc-small-multiples facet="lab" sort="value"></tc-small-multiples>

<script type="module">
  import "@adamstavely/trenchcoat/small-multiples";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-small-multiples").spec = {
    type: "line",
    title: "Samples processed by lab",
    data: [
      { lab: "Genomics", month: "2026-01", samples: 182 },
      { lab: "Genomics", month: "2026-02", samples: 196 },
      { lab: "Imaging", month: "2026-01", samples: 96 },
      { lab: "Imaging", month: "2026-02", samples: 102 },
    ],
    encoding: { x: "month", y: "samples" },
  };
</script>
```

### React / Next.js

```tsx
import { SmallMultiples } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const rows = [
  { lab: "Genomics", month: "2026-01", samples: 182 },
  { lab: "Imaging", month: "2026-01", samples: 96 },
];

export function Labs() {
  return <SmallMultiples title="Samples processed by lab" spec={{ type: "line", data: rows, encoding: { x: "month", y: "samples" } }} facet="lab" onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/small-multiples";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSmallMultiples } from "@adamstavely/trenchcoat/small-multiples";

defineProps<{ spec: TcSmallMultiples["spec"]; data: TcSmallMultiples["data"] }>();
const onSpecCheck = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-small-multiples :spec="spec" :data="data" @tc-spec-check="onSpecCheck"></tc-small-multiples>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SmallMultiples } from "@adamstavely/trenchcoat/angular/small-multiples";
import type { TcSmallMultiples } from "@adamstavely/trenchcoat/small-multiples";

@Component({
  selector: "app-small-multiples-example",
  imports: [SmallMultiples],
  template: `<tc-small-multiples [spec]="spec()" [data]="data()" (tc-spec-check)="onSpecCheck($event)"></tc-small-multiples>`,
})
export class SmallMultiplesExample {
  readonly spec = input.required<TcSmallMultiples["spec"]>();
  readonly data = input.required<TcSmallMultiples["data"]>();
  onSpecCheck(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/small-multiples";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSmallMultiples } from "@adamstavely/trenchcoat/small-multiples";

  let { spec, data }: { spec: TcSmallMultiples["spec"]; data: TcSmallMultiples["data"] } = $props();
  let el: TcSmallMultiples;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-spec-check", on);
    return () => el.removeEventListener("tc-spec-check", on);
  });
</script>

<tc-small-multiples bind:this={el} {spec} {data}></tc-small-multiples>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default the spec's title, else "{chart} by {facet}" |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading; by default the spec's description |
| `spec` | – | `ChartSpec \| null` | `null` | The chart as JSON, as tc-chart takes it – the rows are split by `facet` |
| `facet` | `facet` | `string` | `""` | The field whose values make the panels |
| `type` | `type` | `string \| undefined` | `undefined` | The chart type, without a spec: "line", "bar", "donut"… |
| `data` | – | `SpecData` | `[]` | The rows, without a spec |
| `encoding` | – | `Record<string, string \| string[]> \| undefined` | `undefined` | Channel → field, without a spec |
| `options` | – | `Record<string, unknown> \| undefined` | `undefined` | The chart's other properties, without a spec |
| `columns` | `columns` | `number \| undefined` | `undefined` | How many panels in a row; by default as many as fit at `min-panel-width` |
| `minPanelWidth` | `min-panel-width` | `number` | `220` | The narrowest a panel gets before the grid drops a column, in px |
| `sort` | `sort` | `SmallMultiplesSort` | `"data"` | The panels' order: the data's ("data"), by name ("alpha"), or the largest total first ("value") |
| `shared` | `shared` | `SmallMultiplesShared` | `"y"` | Which scales the panels share: the value axis ("y"), x too ("both"), or none |
| `panelHeight` | `panel-height` | `number \| undefined` | `undefined` | Each panel's chart height, in px; by default the chart's own for its width |
| `smallMultiplesLabels` | – | `Partial<SmallMultiplesLabels>` | `{}` | The grid's own words, merged over defaultSmallMultiplesLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-spec-check` | – | No | The spec was checked ({ valid, errors, warnings }: SmallMultiplesCheck) |
| `tc-mark-hover` | – | No | A panel's pointer or keyboard moved to a mark, or off them – from the panel's chart ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A panel's mark was clicked or picked – from the panel's chart ({ event }: ChartMarkClick) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sml-cols` | `2` | not set – this fallback applies |

#### Design tokens it reads (23)

`--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-strong`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-4`, `--tc-space-5`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `spec` | `el.spec = …;` | `<… spec={…} />` | `<tc-small-multiples :spec="…">` | `<tc-small-multiples [spec]="…">` | `<tc-small-multiples {spec}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-small-multiples :data="…">` | `<tc-small-multiples [data]="…">` | `<tc-small-multiples {data}>` |
| `encoding` | `el.encoding = …;` | `<… encoding={…} />` | `<tc-small-multiples :encoding="…">` | `<tc-small-multiples [encoding]="…">` | `<tc-small-multiples {encoding}>` |
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-small-multiples :options="…">` | `<tc-small-multiples [options]="…">` | `<tc-small-multiples {options}>` |
| `smallMultiplesLabels` | `el.smallMultiplesLabels = …;` | `<… smallMultiplesLabels={…} />` | `<tc-small-multiples :smallMultiplesLabels="…">` | `<tc-small-multiples [smallMultiplesLabels]="…">` | `<tc-small-multiples {smallMultiplesLabels}>` |

*Also attributes: `heading`, `description`, `facet`, `type`, `columns`, `min-panel-width`, `sort`, `shared` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-spec-check` | No | `el.addEventListener("tc-spec-check", (e) => …)` | `onSpecCheck={…}` | `@tc-spec-check="…"` | `(tc-spec-check)="…($event)"` | `el.addEventListener("tc-spec-check", …)` |
| `tc-mark-hover` | No | `el.addEventListener("tc-mark-hover", (e) => …)` | `onMarkHover={…}` | `@tc-mark-hover="…"` | `(tc-mark-hover)="…($event)"` | `el.addEventListener("tc-mark-hover", …)` |
| `tc-mark-click` | No | `el.addEventListener("tc-mark-click", (e) => …)` | `onMarkClick={…}` | `@tc-mark-click="…"` | `(tc-mark-click)="…($event)"` | `el.addEventListener("tc-mark-click", …)` |

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-small-multiples")` returns a `TcSmallMultiples` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSmallMultiples } from "@adamstavely/trenchcoat/small-multiples";`
- **React / Next.js:** Props: `import type { SmallMultiplesProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SmallMultiples>`. The element class, for refs: `import type { TcSmallMultiples } from "@adamstavely/trenchcoat/small-multiples";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSmallMultiples["spec"]` with `import type { TcSmallMultiples } from "@adamstavely/trenchcoat/small-multiples";`
- **Angular:** The directive types the template: `[spec]` takes `TcSmallMultiples["spec"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSmallMultiples } from "@adamstavely/trenchcoat/small-multiples";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSmallMultiples } from "@adamstavely/trenchcoat/small-multiples";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default the spec's title |
| `onSpecCheck` | `(check: SmallMultiplesCheck) => void` | The spec was checked: valid, with its errors and warnings |
| `onMarkHover` | `(event: ChartEvent \| null) => void` | A panel's pointer or keyboard moved to a mark (null: off them) |
| `onMarkClick` | `(event: ChartEvent) => void` | A panel's mark was clicked, or picked with Enter or Space |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

Each panel's chart is its own tab stop: Tab moves panel to panel, and inside one the arrows move through its marks as
in any chart. Moving with the arrows lights the same x in the other panels too.

### Screen readers

- The grid is a list named "6 charts, one per lab"; each panel is a list item whose chart is named by its facet value.
- Each chart is described, tabled and announced as any chart is; the linked highlight in other panels says nothing.
- A refused spec is an alert: "These charts can't be drawn", then each problem.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, internal/chart/element, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | internal/chart/element | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, internal/chart/element, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.9 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.8 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.7 KB | – |
| `internal/chart/spec` · Shared Trenchcoat code | 16.7 KB | – |
| `internal/chart/xy` · Shared Trenchcoat code | 15.3 KB | – |
| `internal/chart/pie` · Shared Trenchcoat code | 6.3 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/chart/brush` · Shared Trenchcoat code | 4.3 KB | – |
| `internal/chart/force` · Shared Trenchcoat code | 4.2 KB | – |
| `internal/chart/stats` · Shared Trenchcoat code | 3.5 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 3.3 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 3.2 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 3.2 KB | – |
| `internal/chart/sankey` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/chart/series` · Shared Trenchcoat code | 2.5 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 2.4 KB | – |
| `internal/chart/loaders` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/chart/hierarchy` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/stack` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/bins` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/chord` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/hexbin` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/canvas` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| [heatmap](heatmap.md) · Element it renders | 30.1 KB | – |
| [gauge](gauge.md) · Element it renders | 19.9 KB | – |
| [candlestick-chart](candlestick-chart.md) · Element it renders | 15.5 KB | – |
| [sparkline](sparkline.md) · Element it renders | 14.4 KB | – |
| [radar-chart](radar-chart.md) · Element it renders | 14.4 KB | – |
| [network-graph](network-graph.md) · Element it renders | 12.8 KB | – |
| [calendar-heatmap](calendar-heatmap.md) · Element it renders | 10.6 KB | – |
| [bubble-chart](bubble-chart.md) · Element it renders | 10.5 KB | – |
| [combo-chart](combo-chart.md) · Element it renders | 10.5 KB | – |
| [venn-diagram](venn-diagram.md) · Element it renders | 9.3 KB | – |
| [hexbin-chart](hexbin-chart.md) · Element it renders | 8.2 KB | – |
| [parallel-chart](parallel-chart.md) · Element it renders | 7.7 KB | – |
| [histogram](histogram.md) · Element it renders | 7.6 KB | – |
| [bar-chart](bar-chart.md) · Element it renders | 7.6 KB | – |
| [box-plot](box-plot.md) · Element it renders | 7.2 KB | – |
| [waffle-chart](waffle-chart.md) · Element it renders | 7.2 KB | – |
| [beeswarm-chart](beeswarm-chart.md) · Element it renders | 7.1 KB | – |
| [waterfall-chart](waterfall-chart.md) · Element it renders | 6.7 KB | – |
| [sunburst-chart](sunburst-chart.md) · Element it renders | 6.6 KB | – |
| [dumbbell-chart](dumbbell-chart.md) · Element it renders | 6.5 KB | – |
| [bullet-chart](bullet-chart.md) · Element it renders | 6.5 KB | – |
| [sankey-chart](sankey-chart.md) · Element it renders | 6.4 KB | – |
| [rose-chart](rose-chart.md) · Element it renders | 6.3 KB | – |
| [slope-chart](slope-chart.md) · Element it renders | 6.2 KB | – |
| [stream-graph](stream-graph.md) · Element it renders | 6.1 KB | – |
| [ridgeline-chart](ridgeline-chart.md) · Element it renders | 6.1 KB | – |
| [chord-chart](chord-chart.md) · Element it renders | 6.0 KB | – |
| [pareto-chart](pareto-chart.md) · Element it renders | 5.9 KB | – |
| [bump-chart](bump-chart.md) · Element it renders | 5.8 KB | – |
| [lollipop-chart](lollipop-chart.md) · Element it renders | 5.3 KB | – |
| [treemap](treemap.md) · Element it renders | 5.3 KB | – |
| [funnel-chart](funnel-chart.md) · Element it renders | 4.9 KB | – |
| [segmented-bar](segmented-bar.md) · Element it renders | 4.7 KB | – |
| [marimekko-chart](marimekko-chart.md) · Element it renders | 4.5 KB | – |
| [radial-bar-chart](radial-bar-chart.md) · Element it renders | 4.1 KB | – |
| [donut-chart](donut-chart.md) · Element it renders | 1.4 KB | – |
| [area-chart](area-chart.md) · Element it renders | 0.8 KB | – |
| [line-chart](line-chart.md) · Element it renders | 0.8 KB | – |
| [pie-chart](pie-chart.md) · Element it renders | 0.7 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **444.1 KB** | **142.0 KB** |
| With Lit – the first component on a page | 463.0 KB | 147.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 16 DOM nodes – to layout, median of 7 |
| Typical update | **1.6 ms** | re-render with the same data |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pick a `facet` with a handful to a couple of dozen values; past that, the panels get too small to read.
- Keep the label order the same in every group for pies and donuts, so a slice's ink means the same thing in each.
- Say in the description what the scale is shared over ("on one scale").

## Do and don't

### Do

- Leave `shared="y"` on when the point is comparing sizes across groups.
- Sort by value when the order of the groups means nothing.

### Don't

- Turn off the shared scale and then compare heights between panels.
- Put a whole dashboard of different charts in it – every panel is the same chart.

## Related

- [Chart](chart.md) – Any of the library's charts from a JSON spec – checked first, then drawn with the chart the spec names; what's wrong shown instead of a chart; the same specs draw as SVG on a server
- [Line Chart](line-chart.md) – Values over time as lines – one emphasised against quiet others or each in its own ink – with names at their ends, reference lines and the nearest point read across every series
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
