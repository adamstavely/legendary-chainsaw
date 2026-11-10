<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Activity Calendar

**Data & charts** · New

A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus

- **Element:** `<tc-activity-calendar>`
- **Size:** 8.9 KB gzip · 26.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/activity-calendar";` |
| React / Next.js | `import { ActivityCalendar } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/activity-calendar";` · tags starting with tc- are custom elements |
| Angular | `import { ActivityCalendar } from "@adamstavely/trenchcoat/angular/activity-calendar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/activity-calendar";` |

## Example

The live example is in the gallery at `#/activity-calendar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A year of activity at a glance, in the familiar contribution-graph layout. Each column is a week and each row a
weekday, and every day is a small square shaded by how much happened on it. Month names run along the top and weekday
names down the side. The newest week is on the right and starts in view. The shading goes in a few steps from empty to
full, scaled to the busiest day shown, so streaks, quiet spells and holidays stand out before anyone reads a number.
The header shows the total, the footer reads out the day under the pointer or focus, and selecting a day reports it to
the page.

### When to use

- How regularly someone or something was active over months: reviews, commits, runs, sign-ins, check-ins.
- Showing streaks and gaps – a habit, an on-call rota, a model retraining schedule.
- A profile or account page that sums up a year of work in one glance.

### When not to use

- When in the day activity happens – use [Activity Clock](activity-clock.md).
- One number and its trend over time – use [KPI Chart](kpi-chart.md).
- Picking dates – use [Date Range Picker](date-range-picker.md).
- Which checks cover which parts – use [Coverage Matrix](coverage-matrix.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Total** `.ui-acal__total` – everything counted in the range shown, beside the heading
2. **Months** `.ui-acal__month` – each month's name over the week holding its 1st
3. **Weekdays** `.ui-acal__weekday` – every other weekday's name down the side
4. **Day** `.ui-acal__cell` – a square shaded by its value; outlined when there's no data
5. **Readout** `.ui-acal__readout` – the day under the pointer or focus, or the selected day, and its value
6. **Legend** `.ui-acal__legend` – the shades from less to more, and no data when some days have none

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The squares, readout and legend are the same in both. The shades mix `--tc-acal-ink` (by default
`--tc-chart-1`) into `--tc-acal-track`, and `--tc-acal-cell` sets the size of a day (11 px, 14 px on touch screens);
set any of them on the element.

## Usage

### HTML

```html
<tc-activity-calendar id="cal" heading="Code reviews" unit="reviews" week-start="1"></tc-activity-calendar>

<script type="module">
  import "@adamstavely/trenchcoat/activity-calendar";
  import "@adamstavely/trenchcoat/tokens.css";

  const cal = document.querySelector("#cal");
  cal.end = Date.parse("2026-10-27T12:00");
  cal.days = [
    { date: Date.parse("2026-10-26T12:00"), value: 7 },
    { date: Date.parse("2026-10-27T12:00"), value: 3 },
    { date: Date.parse("2026-10-20T12:00"), value: null },
  ];
  cal.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ActivityCalendar, type ActivityCalendarDay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const days: ActivityCalendarDay[] = [
  { date: Date.parse("2026-10-26T12:00"), value: 7 },
  { date: Date.parse("2026-10-27T12:00"), value: 3 },
  { date: Date.parse("2026-10-20T12:00"), value: null },
];

export function Reviews() {
  const [selected, setSelected] = useState<number | null>(null);
  return <ActivityCalendar title="Code reviews" unit="reviews" days={days} end={Date.parse("2026-10-27T12:00")} weekStart={1} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/activity-calendar";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";

defineProps<{ days: TcActivityCalendar["days"]; format: TcActivityCalendar["format"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-activity-calendar :days="days" :format="format" @tc-selected-change="onSelectedChange"></tc-activity-calendar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ActivityCalendar } from "@adamstavely/trenchcoat/angular/activity-calendar";
import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";

@Component({
  selector: "app-activity-calendar-example",
  imports: [ActivityCalendar],
  template: `<tc-activity-calendar [days]="days()" [format]="format()" (tc-selected-change)="onSelectedChange($event)"></tc-activity-calendar>`,
})
export class ActivityCalendarExample {
  readonly days = input.required<TcActivityCalendar["days"]>();
  readonly format = input.required<TcActivityCalendar["format"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/activity-calendar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";

  let { days, format }: { days: TcActivityCalendar["days"]; format: TcActivityCalendar["format"] } = $props();
  let el: TcActivityCalendar;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-activity-calendar bind:this={el} {days} {format}></tc-activity-calendar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Activity"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `days` | – | `ActivityCalendarDay[]` | `[]` | The days with activity, in any order; a day not listed counts as 0 |
| `end` | `end` | `number \| undefined` | `undefined` | The last day shown, as epoch ms of any moment in it; by default the latest day in `days` |
| `weeks` | `weeks` | `number` | `53` | How many weeks to show, ending with the week of `end` |
| `weekStart` | `week-start` | `number` | `0` | The first day of the week, as the first row: 0 Sunday, 1 Monday … 6 Saturday |
| `max` | `max` | `number \| undefined` | `undefined` | The value that shades a day fully; by default the busiest day shown |
| `levels` | `levels` | `number` | `5` | How many shades, counting empty: 5 is empty and four steps of activity |
| `unit` | `unit` | `string` | `"events"` | What the values count, after the number: "12 events" |
| `format` | – | `((value: number) => string) \| undefined` | `undefined` | Writes a value in full, e.g. (v) => `${v} reviews`; replaces the number and `unit` |
| `selected` | – | `number \| null` | `null` | The selected day, as epoch ms of its local midnight. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for month, weekday and number names, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A day was selected or cleared ({ selected, value }: ActivityCalendarSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-acal-ink` | `var(--tc-chart-1)` | both |
| `--tc-acal-track` | `var(--tc-fill-default)` | both |
| `--tc-acal-cell` | `14px` | both |
| `--tc-acal-gap` | `3px` | both |
| `--tc-acal-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (35)

`--tc-acal-mix`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `days` | `el.days = …;` | `<… days={…} />` | `<tc-activity-calendar :days="…">` | `<tc-activity-calendar [days]="…">` | `<tc-activity-calendar {days}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-activity-calendar :format="…">` | `<tc-activity-calendar [format]="…">` | `<tc-activity-calendar {format}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-activity-calendar :selected="…">` | `<tc-activity-calendar [selected]="…">` | `<tc-activity-calendar {selected}>` |

*Also attributes: `heading`, `description`, `end`, `weeks`, `week-start`, `max`, `levels`, `unit` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-activity-calendar id="activity-calendar"></tc-activity-calendar>

<script type="module">
  import "@adamstavely/trenchcoat/activity-calendar";

  const el = document.querySelector("#activity-calendar");
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
import "@adamstavely/trenchcoat/activity-calendar";
import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";

const props = defineProps<{ initial: TcActivityCalendar["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcActivityCalendar["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-activity-calendar :selected="selected" @tc-selected-change="onSelectedChange"></tc-activity-calendar>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ActivityCalendar } from "@adamstavely/trenchcoat/angular/activity-calendar";
import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";

@Component({
  selector: "app-controlled-activity-calendar",
  imports: [ActivityCalendar],
  template: `<tc-activity-calendar [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-activity-calendar>`,
})
export class ControlledActivityCalendar {
  readonly initial = input.required<TcActivityCalendar["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcActivityCalendar["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/activity-calendar";
  import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";

  let { initial }: { initial: TcActivityCalendar["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcActivityCalendar;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcActivityCalendar["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-activity-calendar bind:this={el} {selected}></tc-activity-calendar>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-activity-calendar")` returns a `TcActivityCalendar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";`
- **React / Next.js:** Props: `import type { ActivityCalendarProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ActivityCalendar>`. The element class, for refs: `import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcActivityCalendar["days"]` with `import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";`
- **Angular:** The directive types the template: `[days]` takes `TcActivityCalendar["days"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcActivityCalendar } from "@adamstavely/trenchcoat/activity-calendar";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `selected` | `number \| null` | The selected day as epoch ms of its local midnight – controlled when given (null for none) |
| `defaultSelected` | `number \| null` | The day selected on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: number \| null, value?: number \| null) => void` | A day was selected or cleared; `value` is its value (null when it has no data) |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The calendar is one tab stop, on the selected day or else the last day; inside it the arrows move between days.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next day |
| ← / → | Moves to the same weekday in the previous or next week |
| Page Up / Page Down | Moves four weeks back or forward |
| Home / End | Moves to the first or last week in the row |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last day shown |
| Enter / Space | Selects the day, or clears it if it's selected |
| Escape | Clears the selected day |
| Tab | Leaves the calendar |

A day moved to off the edge of the scrolling area scrolls into view.

### Screen readers

The calendar is a `grid` named by the heading and described by “Up and down arrows move a day, left and right a week;
Enter selects the day”. Weekdays are row headers and weeks column headers, named by their month or “Week of Oct 5”.
Each day reads its value and date, “12 reviews, Tuesday, October 27, 2026”, or “No data, …”, and the selected day is
`aria-selected`. Selecting is confirmed in a polite status message, “Selected Tuesday, October 27, 2026: 12 reviews”,
and clearing with “Selection cleared”. The readout repeats what the focused day says, so it's hidden from screen
readers.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 19.1 KB | 6.6 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/activity-scale` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.8 KB** | **9.0 KB** |
| With Lit – the first component on a page | 46.4 KB | 15.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **16 ms** | the gallery demo's data, 964 DOM nodes – to layout, median of 7 |
| Typical update | **12 ms** | one item of days replaced |
| First on the page | 8.4 ms | default properties; includes adding its CSS to the document |
| 100 items | 16 ms | days: first render, 962 nodes; update 13 ms |
| 1,000 items | 16 ms | days: first render, 964 nodes; update 14 ms |

1,000 items of days: 16 ms, 964 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Set `unit` to what the values count, plural: “reviews”, “commits”, “runs”. For anything else, pass `format`.
- Only list days with activity: a day not in `days` counts as 0. Use null for a day you have no data for.
- Give `end` when the range should end on a fixed day, such as today, rather than on the latest day with data.
- Set `week-start` to match the viewer's calendar: 1 for Monday in most of Europe.

## Do and don't

### Do

- Show a whole year (53 weeks), or a fixed stretch people know, so the shape is familiar.
- Set `max` when several calendars on a page should share one scale.
- Pair a selected day with a list of what happened on it.

### Don't

- Don't use it for fewer than about eight weeks – a short stretch reads better as a bar chart.
- Don't use the shades for anything but how much happened – one colour, one meaning.
- Don't pass 0 for days without data – a 0 reads as a quiet day, null as a gap in the record.

## Related

- [Activity Clock](activity-clock.md) – When activity happens, a clock per day – an AM ring and a PM ring of hour segments shaded by how busy each hour was, the weekday and date in the middle, and any hour's value there on hover or focus
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Date Range Picker](date-range-picker.md) – Presets and two calendars with a hover preview, comparison with the previous period or year, full keyboard control
- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail

## Changelog

- **`tc-activity-calendar`:** a year of activity, contribution-graph style. - **Layout:** a column per week and a row per weekday, ending on `end`, with `weeks` and `week-start` settings. - **Labels:** month names along the top, and weekday names pinned down the side while the weeks scroll. The newest week starts in view. - **Values:** a missing day counts as 0, and null is outlined as no data. - **Header, footer and selection:** the total in the header; the footer reads out the day under the pointer or focus. A selected day is reported with a cancelable `tc-selected-change`. - **Keyboard:** ↑ ↓ move a day, ← → a week, Page keys four weeks.
