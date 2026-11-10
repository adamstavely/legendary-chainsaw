<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Day Rhythm

**Data & charts** · New

A typical day as a strip of blocks by kind of place or activity – Home, Work, Transit – one row per kind of day, with hour ticks, a now marker, a legend and the block under the pointer named in full

- **Element:** `<tc-day-rhythm>`
- **Size:** 7.5 KB gzip · 22.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/day-rhythm";` |
| React / Next.js | `import { DayRhythm } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/day-rhythm";` · tags starting with tc- are custom elements |
| Angular | `import { DayRhythm } from "@adamstavely/trenchcoat/angular/day-rhythm";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/day-rhythm";` |

## Example

The live example is in the gallery at `#/day-rhythm`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A typical day as a strip of blocks, midnight to midnight. Each block is a kind of place or activity – Home, Work,
Transit, Focus – named by the page, and can name the place itself. Show one strip, or a row per kind of day, such as
weekdays and the weekend, with the row's name beside it. Hour ticks run along the bottom, a legend names the kinds,
and an optional marker shows the time now. Each block carries its kind's colour as a tint with a solid edge, and its
kind in words when it's wide enough. The readout under the strips names the block under the pointer or focus in
full: “Work · 08:00–18:00 · Harbour office”.

### When to use

- A routine at a glance: when someone usually works, travels, rests or is reachable.
- Comparing the shape of different days – weekdays against the weekend, this month against last.
- Planning around a routine: on-call cover, delivery windows, the best time to reach someone.

### When not to use

- How busy each hour was, rather than what it was spent on – use [Activity Clock](activity-clock.md).
- Activity across months – use [Activity Calendar](activity-calendar.md).
- One number over time – use [KPI Chart](kpi-chart.md).
- Shares of a whole by category – use [Breakdown Chart](breakdown-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-drh__row-label` – the kind of day, beside its strip, when there's more than one row
2. **Block** `.ui-drh__seg` – a stretch of the day, in its kind's colour, with the kind in words when wide enough
3. **Ticks** `.ui-drh__ticks` – 00, 06, 12, 18 and 24 along the bottom
4. **Now** `.ui-drh__now` – the time now, on the ticks and as a line through every strip
5. **Readout** `.ui-drh__readout` – the block under the pointer or focus, in full
6. **Legend** `.ui-drh__legend` – each kind and its colour

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight row names. Clean is
one white card with the header as its first row. The strips, ticks and legend are the same in both. A kind takes a
chart colour, `--tc-chart-1` to `-6` in order, or the one its `color` names.

## Usage

### HTML

```html
<tc-day-rhythm id="day" heading="Daily rhythm" now="860"></tc-day-rhythm>

<script type="module">
  import "@adamstavely/trenchcoat/day-rhythm";
  import "@adamstavely/trenchcoat/tokens.css";

  const day = document.querySelector("#day");
  day.kinds = [
    { id: "home", label: "Home" },
    { id: "work", label: "Work" },
    { id: "transit", label: "Transit" },
  ];
  day.rows = [
    {
      id: "weekdays",
      label: "Weekdays",
      segments: [
        { start: 1170, end: 450, kind: "home", place: "Home" },
        { start: 450, end: 495, kind: "transit", place: "Tram 4" },
        { start: 495, end: 1050, kind: "work", place: "Harbour office" },
      ],
    },
  ];
  day.addEventListener("tc-select", (e) => console.log(e.detail.row, e.detail.segment));
</script>
```

### React / Next.js

```tsx
import { DayRhythm, type RhythmKind, type RhythmRow } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const kinds: RhythmKind[] = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
];
const rows: RhythmRow[] = [
  { id: "weekdays", label: "Weekdays", segments: [{ start: 1170, end: 480, kind: "home" }, { start: 480, end: 1050, kind: "work", place: "Harbour office" }] },
];

export function Routine() {
  return <DayRhythm title="Daily rhythm" kinds={kinds} rows={rows} now={860} onSelect={(row, segment) => console.log(row, segment.place)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/day-rhythm";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDayRhythm } from "@adamstavely/trenchcoat/day-rhythm";

defineProps<{ kinds: TcDayRhythm["kinds"]; rows: TcDayRhythm["rows"] }>();
const onSelect = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-day-rhythm :kinds="kinds" :rows="rows" @tc-select="onSelect"></tc-day-rhythm>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DayRhythm } from "@adamstavely/trenchcoat/angular/day-rhythm";
import type { TcDayRhythm } from "@adamstavely/trenchcoat/day-rhythm";

@Component({
  selector: "app-day-rhythm-example",
  imports: [DayRhythm],
  template: `<tc-day-rhythm [kinds]="kinds()" [rows]="rows()" (tc-select)="onSelect($event)"></tc-day-rhythm>`,
})
export class DayRhythmExample {
  readonly kinds = input.required<TcDayRhythm["kinds"]>();
  readonly rows = input.required<TcDayRhythm["rows"]>();
  onSelect(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/day-rhythm";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDayRhythm } from "@adamstavely/trenchcoat/day-rhythm";

  let { kinds, rows }: { kinds: TcDayRhythm["kinds"]; rows: TcDayRhythm["rows"] } = $props();
  let el: TcDayRhythm;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-select", on);
    return () => el.removeEventListener("tc-select", on);
  });
</script>

<tc-day-rhythm bind:this={el} {kinds} {rows}></tc-day-rhythm>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Daily rhythm"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading, e.g. "Typical day, last 30 days" |
| `kinds` | – | `RhythmKind[]` | `[]` | The kinds of place or activity, in legend order |
| `rows` | – | `RhythmRow[]` | `[]` | The strips, top to bottom |
| `now` | `now` | `number \| undefined` | `undefined` | A marker at this time, in minutes from midnight; none when unset |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-select` | – | No | A block was chosen with Enter, Space or a click ({ row, segment }: RhythmSelect) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-drh-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (41)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-drh-color`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `rhythmTime(m: number): void` | "08:00", "24:00" |

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
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-day-rhythm :kinds="…">` | `<tc-day-rhythm [kinds]="…">` | `<tc-day-rhythm {kinds}>` |
| `rows` | `el.rows = …;` | `<… rows={…} />` | `<tc-day-rhythm :rows="…">` | `<tc-day-rhythm [rows]="…">` | `<tc-day-rhythm {rows}>` |

*Also attributes: `heading`, `description`, `now` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-select` | No | `el.addEventListener("tc-select", (e) => …)` | `onSelect={…}` | `@tc-select="…"` | `(tc-select)="…($event)"` | `el.addEventListener("tc-select", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-day-rhythm")` returns a `TcDayRhythm` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDayRhythm } from "@adamstavely/trenchcoat/day-rhythm";`
- **React / Next.js:** Props: `import type { DayRhythmProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DayRhythm>`. The element class, for refs: `import type { TcDayRhythm } from "@adamstavely/trenchcoat/day-rhythm";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDayRhythm["kinds"]` with `import type { TcDayRhythm } from "@adamstavely/trenchcoat/day-rhythm";`
- **Angular:** The directive types the template: `[kinds]` takes `TcDayRhythm["kinds"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDayRhythm } from "@adamstavely/trenchcoat/day-rhythm";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDayRhythm } from "@adamstavely/trenchcoat/day-rhythm";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `onSelect` | `(row: string, segment: RhythmSegment) => void` | A block was chosen with Enter, Space or a click: its row's id and the block |

*Renamed or hidden on the wrapper: `heading`, `onSelect`, `children`*

## Accessibility

### Keyboard

The blocks are one tab stop; inside it the arrows move between blocks.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next block in the row |
| ↑ / ↓ | Moves to the block at the same time of day in the row above or below |
| Home / End | Moves to the first or last block in the row |
| Enter / Space | Chooses the block: fires `tc-select` |
| Tab | Leaves the strips |

### Screen readers

Each strip is a list named by its row, “Weekdays” (or by the heading, with a single unnamed row), and described by
“Arrow keys move between blocks; up and down move between rows”. Each block is a button that reads in full, “Work ·
08:00–18:00 · Harbour office”. The time now is read once, “Now 14:20”. The words on the blocks, the ticks and the
readout repeat what the buttons say, so they're hidden from screen readers; the legend is a list labelled “Legend”.

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

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 15.4 KB | 5.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.8 KB** | **7.5 KB** |
| With Lit – the first component on a page | 42.4 KB | 13.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 85 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of kinds replaced |
| First on the page | 7.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.5 ms | kinds: first render, 275 nodes; update 0.2 ms |
| 1,000 items | 9.6 ms | kinds: first render, 2,075 nodes; update 3.4 ms |

1,000 items of kinds: 9.6 ms, 2,075 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Name kinds by what the time is for, in a word: “Home”, “Work”, “Transit”.
- Name places as people know them: “Harbour office”, “Riverside gym”, not addresses or ids.
- Give times in minutes from midnight; a block that runs past midnight has an `end` before its `start`.
- Name rows as the kind of day: “Weekdays”, “Weekend”, “On-call days”.

## Do and don't

### Do

- Keep to about six kinds, so the colours stay distinct and the legend fits on one line.
- Leave gaps where the routine isn't known, rather than filling them with a guess.
- Use `now` on a live view, so people can see where they are in the day.

### Don't

- Don't use it for a single day's real timeline with exact events – it's for a typical day.
- Don't give two kinds the same colour.
- Don't make every block a different kind – the pattern is the point.

## Related

- [Activity Clock](activity-clock.md) – When activity happens, a clock per day – an AM ring and a PM ring of hour segments shaded by how busy each hour was, the weekday and date in the middle, and any hour's value there on hover or focus
- [Activity Calendar](activity-calendar.md) – A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table

## Changelog

- **`tc-day-rhythm`:** a typical day as a strip of blocks by kind of place or activity. - **Layout:** one row per kind of day, with hour ticks, a now marker and a legend. - **Interaction:** the block under the pointer or focus is named in full.
