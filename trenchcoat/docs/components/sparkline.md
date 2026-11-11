<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Sparkline

**Data & charts** · New

A small trend chart that sits in text or a table cell – line, area, bars or win-loss, sized from the text – with markers, a reference line, a tone for which way it went and, when interactive, a tooltip per point

- **Element:** `<tc-sparkline>`
- **Size:** 7.9 KB gzip · 23.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/sparkline";` |
| React / Next.js | `import { Sparkline } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/sparkline";` · tags starting with tc- are custom elements |
| Angular | `import { Sparkline } from "@adamstavely/trenchcoat/angular/sparkline";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/sparkline";` |

## Example

The live example is in the gallery at `#/sparkline`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A small trend chart that sits in a sentence or a table cell. It shows the shape of a series – rising, falling, steady,
spiky – without axes or labels, and takes its height from the text around it, so it lines up with the words beside
it. It draws a line, an area, bars from zero, or win-loss bars (up for a gain, down for a loss). Gaps in the data break
the line. Markers can pick out the last, first, highest and lowest points, a dashed reference line can show a target,
and with `good` it turns green when it moved the good way and red when it didn't. With `interactive` it becomes one tab
stop that steps through the points with a tooltip. `show-value` writes the last value after it, in the text's ink and
with its `format` or `unit` (after ztd-charts' showValue, MIT, © 2026 Junhan2), so the shape and today's figure read
as one phrase.

### When to use

- A trend beside a number in a table row, a list or a KPI tile: throughput, latency, sign-ups.
- A trend inside a sentence, so the reader sees the shape without leaving the text.
- Many small series compared at a glance, each on its own scale.

### When not to use

- One metric where the exact values, axes and several series matter – use [KPI Chart](kpi-chart.md).
- A dashboard strip of counts with their changes – use [Ops Overview](ops-overview.md), which can carry its own sparkline.
- Values across two dimensions, such as weekday by hour – use [Heatmap](heatmap.md).
- A survey score with its bands and comments – use [Score Summary](score-summary.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Plot** `.ui-spk__plot` – the chart's box: an image, or a group in interactive mode
2. **Line** `.ui-spk__line` – the series, broken at gaps; with `area`, filled by `.ui-spk__area`
3. **Bar** `.ui-spk__bar` – one per value for `bars` and `win-loss`
4. **Reference** `.ui-spk__ref` – the dashed line at `reference`
5. **Marker** `.ui-spk__dot` – the last, first, highest or lowest point, and the point being read
6. **Tooltip** `.ui-spk__tip` – the point's label and value, in interactive mode
7. **Value** `.ui-spk__value` – the last value after the chart, with `show-value`

## Looks

There's no tray or card: it's inline, so Standard and Clean draw it the same. It takes the colour of its tone –
`--tc-spk-ink`, by default `--tc-chart-1` – and its size from `--tc-spk-w` (5em) and `--tc-spk-h` (1.25em), or from
`width` and `height` in px. `--tc-spk-stroke` sets the line's width. All of them can be set on the element. The value
from `show-value` is set at the surrounding font size in `--tc-text-primary`, centred beside the chart, so the whole
thing is still no taller than the line it sits in.

## Usage

### HTML

```html
<p>Samples this week <tc-sparkline id="spark" label="Samples per day" unit="samples" good="up" markers="last max" show-value></tc-sparkline></p>

<script type="module">
  import "@adamstavely/trenchcoat/sparkline";
  import "@adamstavely/trenchcoat/tokens.css";

  const spark = document.querySelector("#spark");
  spark.values = [112, 120, 98, 131, 152, 148];
  spark.reference = 140;
</script>
```

### React / Next.js

```tsx
import { Sparkline } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Throughput({ values, days }: { values: number[]; days: string[] }) {
  return (
    <p>
      Sequencing ran <Sparkline interactive label="Runs per day" unit="runs" values={values} labels={days} reference={50} good="up" showValue onPointFocus={(i, v) => console.log(i, v)} /> this fortnight.
    </p>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/sparkline";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSparkline } from "@adamstavely/trenchcoat/sparkline";

defineProps<{ values: TcSparkline["values"]; labels: TcSparkline["labels"] }>();
const onPointFocus = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-sparkline :values="values" :labels="labels" @tc-point-focus="onPointFocus"></tc-sparkline>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Sparkline } from "@adamstavely/trenchcoat/angular/sparkline";
import type { TcSparkline } from "@adamstavely/trenchcoat/sparkline";

@Component({
  selector: "app-sparkline-example",
  imports: [Sparkline],
  template: `<tc-sparkline [values]="values()" [labels]="labels()" (tc-point-focus)="onPointFocus($event)"></tc-sparkline>`,
})
export class SparklineExample {
  readonly values = input.required<TcSparkline["values"]>();
  readonly labels = input.required<TcSparkline["labels"]>();
  onPointFocus(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sparkline";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSparkline } from "@adamstavely/trenchcoat/sparkline";

  let { values, labels }: { values: TcSparkline["values"]; labels: TcSparkline["labels"] } = $props();
  let el: TcSparkline;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-point-focus", on);
    return () => el.removeEventListener("tc-point-focus", on);
  });
</script>

<tc-sparkline bind:this={el} {values} {labels}></tc-sparkline>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `values` | – | `(number \| null)[]` | `[]` | The values, oldest first; null is a gap |
| `labels` | – | `string[] \| undefined` | `undefined` | A label per value, e.g. dates – read in the tooltip and announcements |
| `type` | `type` | `SparklineType` | `"line"` | How it's drawn |
| `label` | `label` | `string \| undefined` | `undefined` | What it measures, e.g. "Samples per day" – starts the accessible summary; by default "Trend" |
| `min` | `min` | `number \| undefined` | `undefined` | The bottom of the scale; by default the lowest value (0 for bars) |
| `max` | `max` | `number \| undefined` | `undefined` | The top of the scale; by default the highest value |
| `reference` | `reference` | `number \| undefined` | `undefined` | A value to draw as a dashed line, e.g. a target |
| `referenceLabel` | `reference-label` | `string` | `"Target"` | What the reference line is, for the summary |
| `markers` | `markers` | `string` | `"last"` | Points to mark, space-separated: any of "last", "first", "min", "max"; "none" for none |
| `good` | `good` | `"up" \| "down" \| undefined` | `undefined` | Which way is good: "up" or "down"; with tone "auto", it's green when it moved that way and red when it didn't |
| `tone` | `tone` | `SparklineTone` | `"auto"` | The colour: "auto" follows `good` (neutral without it), or a fixed tone |
| `width` | `width` | `number \| undefined` | `undefined` | Width in px; by default 5em |
| `height` | `height` | `number \| undefined` | `undefined` | Height in px; by default 1.25em, so it matches the text |
| `interactive` | `interactive` | `boolean` | `false` | One tab stop: the arrow keys step through the points with a tooltip |
| `format` | – | `((value: number) => string) \| undefined` | `undefined` | Writes a value, e.g. (v) => `${v} °C`; replaces the number and `unit` |
| `unit` | `unit` | `string \| undefined` | `undefined` | What the values count, after the number: "148 samples" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `showValue` | `show-value` | `boolean` | `false` | Writes the last value after the line, in the text's ink, with `format` / `unit` |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-point-focus` | – | No | A point was stepped to or pointed at, in interactive mode ({ index, value, label }: SparklinePointFocus) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-spk-w` | `5em` | both |
| `--tc-spk-h` | `1.25em` | both |
| `--tc-spk-ink` | `var(--tc-chart-1)` | both |
| `--tc-spk-stroke` | `1.5px` | both |

#### Design tokens it reads (28)

`--tc-border-default`, `--tc-border-strong`, `--tc-chart-1`, `--tc-chart-neutral`, `--tc-duration-fast`, `--tc-ease-out`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-weight-medium`, `--tc-line-height-none`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-space-1`, `--tc-space-1-5`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`

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
| `values` | `el.values = …;` | `<… values={…} />` | `<tc-sparkline :values="…">` | `<tc-sparkline [values]="…">` | `<tc-sparkline {values}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-sparkline :labels="…">` | `<tc-sparkline [labels]="…">` | `<tc-sparkline {labels}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-sparkline :format="…">` | `<tc-sparkline [format]="…">` | `<tc-sparkline {format}>` |

*Also attributes: `type`, `label`, `min`, `max`, `reference`, `reference-label`, `markers`, `good` and 7 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-point-focus` | No | `el.addEventListener("tc-point-focus", (e) => …)` | `onPointFocus={…}` | `@tc-point-focus="…"` | `(tc-point-focus)="…($event)"` | `el.addEventListener("tc-point-focus", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-sparkline")` returns a `TcSparkline` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSparkline } from "@adamstavely/trenchcoat/sparkline";`
- **React / Next.js:** Props: `import type { SparklineProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Sparkline>`. The element class, for refs: `import type { TcSparkline } from "@adamstavely/trenchcoat/sparkline";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSparkline["values"]` with `import type { TcSparkline } from "@adamstavely/trenchcoat/sparkline";`
- **Angular:** The directive types the template: `[values]` takes `TcSparkline["values"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSparkline } from "@adamstavely/trenchcoat/sparkline";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSparkline } from "@adamstavely/trenchcoat/sparkline";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onPointFocus` | `(index: number, value: number \| null, label?: string) => void` | A point was stepped to or pointed at, in interactive mode |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

### Keyboard

Only in interactive mode, where it's one tab stop.

| Key | What it does |
|---|---|
| ← / → | Steps to the previous or next point; the first press starts at the newest |
| Home / End | Goes to the first or last point |
| Escape | Hides the tooltip |
| Tab | Leaves the chart |

### Screen readers

It's an image named by its summary: “Samples per day: from 112 to 148, high 152, low 98”, with “; target 140” when
there's a reference line. Win-loss charts count instead: “Trend: 7 up, 3 down, 1 level”. In interactive mode it's a
group with the role description “sparkline”, the same name, and the description “Left and right arrows step through
the points”; each step is announced politely, “Wed 21: 148 runs, 7 of 14”. The value from `show-value` is hidden from
screen readers – the summary already ends on it.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 16.4 KB | 5.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **23.2 KB** | **7.9 KB** |
| With Lit – the first component on a page | 42.8 KB | 14.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 7 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of values replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.6 ms | values: first render, 7 nodes; update 0.2 ms |
| 1,000 items | 2.6 ms | values: first render, 7 nodes; update 1.2 ms |

What it renders doesn't grow with values (tested to 1,000 items).

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

- Set `label` to what it measures, so the summary starts with it rather than “Trend”.
- Set `unit` (plural) or `format`, so the summary and tooltip read as values, not bare numbers.
- Pass `labels` – usually dates – when it's interactive, so each point says when it was.
- Use null for a missing value: the line breaks there instead of dropping to zero.

## Do and don't

### Do

- Keep it next to the number it explains – or let `show-value` write it, when the number is simply the latest value.
- Set `min` and `max` when sparklines in one table should share a scale.
- Use `good` when the direction matters, so the colour says whether the change is welcome.

### Don't

- Don't use it for exact values – that's what the number beside it, or `kpi-chart`, is for.
- Don't make every sparkline in a long table interactive – one tab stop per row adds up.
- Don't rely on its colour alone – the summary and the numbers around it carry the meaning.

## Related

- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Ops Overview](ops-overview.md) – An operations overview in one dense strip – a status line, a health pill and count tiles, each with its change since the last period in words and green or red by which way is good, an optional sparkline and tone, optionally opening what it counts
- [Score Summary](score-summary.md) – NPS or CSAT results – the score in big type, the change since last time with a sparkline, the target, the bands with shares and counts, and a bar per score you can pick to filter comments
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view

## Changelog

- **Sparkline** (`tc-sparkline`), **Heatmap** (`tc-heatmap`) and **Gauge** (`tc-gauge`) – an inline trend, a shaded matrix with legend, selection and table view, and a value against its bands as a dial, half dial or bar (optionally a slider).
