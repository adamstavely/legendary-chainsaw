<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Year List

**Inputs & controls** · New

Years to choose one from, newest first – a column, or a row that scrolls – with a count on each, keyboard moves that don't choose, and typing a year to jump to it

- **Element:** `<tc-year-list>`
- **Size:** 5.7 KB gzip · 15.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/year-list";` |
| React / Next.js | `import { YearList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/year-list";` · tags starting with tc- are custom elements |
| Angular | `import { YearList } from "@adamstavely/trenchcoat/angular/year-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/year-list";` |

## Example

The live example is in the gallery at `#/year-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A column of years to choose one from, newest first, beside a page that shows one year at a time – contributions,
annual reports, statements. The chosen year is filled; each year can carry a count. Give it `from` and `to` for an
unbroken run of years, or `years` for any list. On a narrow page `orientation="horizontal"` lays it out as a row
that scrolls. Typing a year's digits jumps to it.

### When to use

- Switching a page between years of the same records, where every year is a choice and the list is long.
- Beside an activity calendar or a yearly report, as the page's year navigation.

### When not to use

- Two to six options of any kind – use [Segmented Control](segmented-control.md).
- A range of dates, or any date inside a year – use [Date Range Picker](date-range-picker.md).
- Going up a hierarchy – use [Breadcrumbs](breadcrumbs.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **List** `.ui-yl__list` – the years, named by `label`
2. **Year** `.ui-yl__year` – one year; the chosen one is filled
3. **Count** `.ui-yl__count` – the year's count, when `counts` has one

## Looks

Both looks are the bare list, with no card. In Standard the chosen year is a filled accent pill; in Clean it's a
tinted row. A page can set `--tc-yl-width` (a column's width, 136 px), `--tc-yl-chosen-bg` and `--tc-yl-chosen-fg`.

## Usage

### HTML

```html
<tc-year-list id="years" label="Report year" from="2013" to="2026" selected="2026" count-label="reports"></tc-year-list>

<script type="module">
  import "@adamstavely/trenchcoat/year-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const years = document.querySelector("#years");
  years.counts = { 2026: 41, 2025: 128, 2024: 117 };
  years.addEventListener("tc-selected-change", (e) => console.log("Load", e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { YearList } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReportYears() {
  const [year, setYear] = useState<number | null>(2026);
  return <YearList label="Report year" from={2013} to={2026} selected={year} onSelectedChange={setYear} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/year-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcYearList } from "@adamstavely/trenchcoat/year-list";

defineProps<{ years: TcYearList["years"]; counts: TcYearList["counts"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-year-list :years="years" :counts="counts" @tc-selected-change="onSelectedChange"></tc-year-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { YearList } from "@adamstavely/trenchcoat/angular/year-list";
import type { TcYearList } from "@adamstavely/trenchcoat/year-list";

@Component({
  selector: "app-year-list-example",
  imports: [YearList],
  template: `<tc-year-list [years]="years()" [counts]="counts()" (tc-selected-change)="onSelectedChange($event)"></tc-year-list>`,
})
export class YearListExample {
  readonly years = input.required<TcYearList["years"]>();
  readonly counts = input.required<TcYearList["counts"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/year-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcYearList } from "@adamstavely/trenchcoat/year-list";

  let { years, counts }: { years: TcYearList["years"]; counts: TcYearList["counts"] } = $props();
  let el: TcYearList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-year-list bind:this={el} {years} {counts}></tc-year-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `"Year"` | What the years are for – the list's accessible name |
| `years` | – | `number[]` | `[]` | The years, in the order shown; when empty, `to` down to `from` |
| `from` | `from` | `number \| undefined` | `undefined` | The oldest year, when `years` isn't given |
| `to` | `to` | `number \| undefined` | `undefined` | The newest year, when `years` isn't given |
| `selected` | `selected` | `number \| null` | `null` | The chosen year. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `counts` | – | `Record<number, number> \| undefined` | `undefined` | A count to show beside each year, by year: { 2026: 1204 } |
| `countLabel` | `count-label` | `string` | `"items"` | What the counts are, said after each: "contributions" |
| `orientation` | `orientation` | `YearListOrientation` | `"vertical"` | A column ("vertical") or a row that scrolls ("horizontal") |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for counts, e.g. "de"; by default the browser's |
| `list` | – | `number[]` | – | The years shown, in order (read-only): `years`, or `to` down to `from` |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A year was chosen ({ selected }: YearListSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-yl-width` | `136px` | both |
| `--tc-yl-chosen-bg` | `var(--tc-fill-selected)` | both, clean |
| `--tc-yl-chosen-fg` | `var(--tc-text-primary)` | both, clean |

#### Design tokens it reads (22)

`--tc-accent-solid`, `--tc-control-h-md`, `--tc-control-px-lg`, `--tc-control-radius-md`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-line-height-tight`, `--tc-space-1`, `--tc-space-2`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`

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
| `years` | `el.years = …;` | `<… years={…} />` | `<tc-year-list :years="…">` | `<tc-year-list [years]="…">` | `<tc-year-list {years}>` |
| `counts` | `el.counts = …;` | `<… counts={…} />` | `<tc-year-list :counts="…">` | `<tc-year-list [counts]="…">` | `<tc-year-list {counts}>` |

*Also attributes: `label`, `from`, `to`, `selected`, `count-label`, `orientation`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-year-list id="year-list"></tc-year-list>

<script type="module">
  import "@adamstavely/trenchcoat/year-list";

  const el = document.querySelector("#year-list");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/year-list";
import type { TcYearList } from "@adamstavely/trenchcoat/year-list";

const props = defineProps<{ initial: TcYearList["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcYearList["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-year-list :selected="selected" @tc-selected-change="onSelectedChange"></tc-year-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { YearList } from "@adamstavely/trenchcoat/angular/year-list";
import type { TcYearList } from "@adamstavely/trenchcoat/year-list";

@Component({
  selector: "app-controlled-year-list",
  imports: [YearList],
  template: `<tc-year-list [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-year-list>`,
})
export class ControlledYearList {
  readonly initial = input.required<TcYearList["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcYearList["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/year-list";
  import type { TcYearList } from "@adamstavely/trenchcoat/year-list";

  let { initial }: { initial: TcYearList["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcYearList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcYearList["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-year-list bind:this={el} {selected}></tc-year-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-year-list")` returns a `TcYearList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcYearList } from "@adamstavely/trenchcoat/year-list";`
- **React / Next.js:** Props: `import type { YearListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof YearList>`. The element class, for refs: `import type { TcYearList } from "@adamstavely/trenchcoat/year-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcYearList["years"]` with `import type { TcYearList } from "@adamstavely/trenchcoat/year-list";`
- **Angular:** The directive types the template: `[years]` takes `TcYearList["years"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcYearList } from "@adamstavely/trenchcoat/year-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcYearList } from "@adamstavely/trenchcoat/year-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `selected` | `number \| null` | The chosen year – controlled when given (null for none) |
| `defaultSelected` | `number \| null` | The year chosen on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: number \| null) => void` | A year was chosen |

*Renamed or hidden on the wrapper: `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

One tab stop: the chosen year, or the one last moved to.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous year (→ / ← in a row) |
| Home / End | Moves to the first or last year |
| Enter / Space | Chooses the year |
| Digits | Jumps to the year that starts or ends with them: “2019” or “19” |

Moving doesn't choose, so a page that loads a year on `tc-selected-change` loads only the one chosen.

### Screen readers

It's a `listbox` named by `label`, vertical or horizontal, with each year an `option` and the chosen one
`aria-selected`. A count is read after its year with `count-label` (“2025, 128 reports”), and choosing is announced
(“2025 chosen”).

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 9.2 KB | 3.8 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.8 KB** | **5.7 KB** |
| With Lit – the first component on a page | 35.5 KB | 12.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 58 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 6.4 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the list for what the years select: “Report year”, “Contribution year”.
- Put the newest year first – the default for `from` and `to`.
- Set `count-label` to what the counts are when you give `counts`.

## Do and don't

### Do

- Keep it beside the content it switches, so the change is seen.
- Use the row on narrow pages rather than a long column above the content.

### Don't

- Don't use it for a handful of non-year options – that's `segmented-control`.
- Don't load a year as focus moves; load on `tc-selected-change`.

## Related

- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Date Range Picker](date-range-picker.md) – Presets and two calendars with a hover preview, comparison with the previous period or year, full keyboard control
- [Activity Calendar](activity-calendar.md) – A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus
- [Breadcrumbs](breadcrumbs.md) – Where you are in a hierarchy as a trail of links: the current page last, the middle folding into "…" when it doesn't fit or passes `max`, a cancelable `tc-navigate` for routing, and Copy path

## Changelog

- **Year List** (`tc-year-list`) – years to choose one from, newest first, as a column or a row that scrolls: a `listbox` with one tab stop, keys that move without choosing, Enter or Space to choose, typing a year to jump to it, an optional count on each year and a cancelable `tc-selected-change`.
