<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Week Bars

**Charts** · New

A week of daily totals as rounded bars against a dashed goal line – days that reach it in the accent, the week's total counting up with the average per day, a week switcher the bars glide between, today marked, and a table view

- **Element:** `<tc-week-bars>`
- **Size:** 11.6 KB gzip · 35.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/week-bars";` |
| React / Next.js | `import { WeekBars } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/week-bars";` · tags starting with tc- are custom elements |
| Angular | `import { WeekBars } from "@adamstavely/trenchcoat/angular/week-bars";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/week-bars";` |

## Example

The live example is in the gallery at `#/week-bars`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A week of daily totals as rounded bars – documents reviewed, samples logged, tickets closed – against an optional
daily goal drawn as a dashed line. Days that reach the goal take the accent and the rest stay quiet. The headline is
the week's total, counting up when it changes, with the average per day under it; pointing at a day (or moving to it
with the keys) outlines its bar, writes its value above it and rolls the headline to that day.

A switcher in the header steps between weeks, and the bars glide from one week to the next on one shared scale, so
taller really means more. `today` marks a day of the latest week. The bars grow in when the card first comes on screen.

### When to use

- A daily count where the week is the natural unit and a daily target matters.
- A personal or team card on a dashboard: "how are we doing this week, and against last week".

### When not to use

- Many weeks or a whole year of days at once – use [Calendar Heatmap](calendar-heatmap.md) or
  [Activity Calendar](activity-calendar.md).
- Categories that aren't days, or several series – use [Bar Chart](bar-chart.md).
- A trend over time with a headline – use [KPI Chart](kpi-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the week switcher and the Table button
2. **Week switcher** `.ui-wkb__switch` – previous and next buttons `.ui-wkb__step` round the week's label `.ui-wkb__week`
3. **Headline** `.ui-wkb__big` – the week's total, or the pointed-at day's value; the caption `.ui-wkb__caption` has the average per day
4. **Plot** `.ui-wkb__plot` – the bars, one tab stop
5. **Bar** `.ui-wkb__bar` – one per day; at or over the goal in the accent
6. **Value** `.ui-wkb__value` – the pointed-at day's value, above its bar
7. **Goal** `.ui-wkb__goal` – the dashed line with its label `.ui-wkb__goal-label`
8. **Day name** `.ui-wkb__label` – under each bar; today's in the strong weight with a dot under it
9. **Table** `.ui-wkb__table` – the table view: each day's total and whether it met the goal

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Inks are component tokens on the element: `--tc-wkb-met` for days at or over the goal (all days when there's no
goal), `--tc-wkb-rest` for the others and `--tc-wkb-goal` for the line; `--tc-wkb-plot-h` sets the bars' height.
While a day is in front, the other bars fade by colour, not opacity. `still` (or the system's reduced-motion setting)
draws everything at once.

## Usage

### HTML

```html
<tc-week-bars heading="Documents reviewed" goal="400" today="3"></tc-week-bars>

<script type="module">
  import "@adamstavely/trenchcoat/week-bars";
  import "@adamstavely/trenchcoat/tokens.css";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const week = (label, values) => ({ label, days: days.map((d, i) => ({ label: d, value: values[i] })) });
  const bars = document.querySelector("tc-week-bars");
  bars.weeks = [week("Mar 10–16", [428, 395, 452, 410, 386, 140, 90]), week("Mar 17–23", [446, 472, 381, 412, 0, 0, 0])];
  bars.addEventListener("tc-week-change", (e) => console.log(e.detail.week));
</script>
```

### React / Next.js

```tsx
import { WeekBars } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";
import { useState } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const week = (label: string, values: number[]) => ({ label, days: days.map((d, i) => ({ label: d, value: values[i] })) });
const weeks = [week("Mar 10–16", [428, 395, 452, 410, 386, 140, 90]), week("Mar 17–23", [446, 472, 381, 412, 0, 0, 0])];

export function Reviewed() {
  const [w, setW] = useState(1);
  return <WeekBars title="Documents reviewed" weeks={weeks} week={w} onWeekChange={setW} goal={400} today={3} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/week-bars";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";

defineProps<{ weeks: TcWeekBars["weeks"]; format: TcWeekBars["format"] }>();
const onWeekChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-week-bars :weeks="weeks" :format="format" @tc-week-change="onWeekChange"></tc-week-bars>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { WeekBars } from "@adamstavely/trenchcoat/angular/week-bars";
import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";

@Component({
  selector: "app-week-bars-example",
  imports: [WeekBars],
  template: `<tc-week-bars [weeks]="weeks()" [format]="format()" (tc-week-change)="onWeekChange($event)"></tc-week-bars>`,
})
export class WeekBarsExample {
  readonly weeks = input.required<TcWeekBars["weeks"]>();
  readonly format = input.required<TcWeekBars["format"]>();
  onWeekChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/week-bars";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";

  let { weeks, format }: { weeks: TcWeekBars["weeks"]; format: TcWeekBars["format"] } = $props();
  let el: TcWeekBars;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-week-change", on);
    return () => el.removeEventListener("tc-week-change", on);
  });
</script>

<tc-week-bars bind:this={el} {weeks} {format}></tc-week-bars>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Daily totals"` | The heading, and the plot's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `weeks` | – | `WeekBarsWeek[]` | `[]` | The weeks, oldest first, each with its days |
| `week` | `week` | `number \| undefined` | `undefined` | The shown week's index; unset is the last (latest) week |
| `goal` | `goal` | `number \| undefined` | `undefined` | The daily goal, drawn as a dashed line; days at or over it take the accent |
| `today` | `today` | `number \| undefined` | `undefined` | The index of today in the last week, marked under its bar |
| `format` | – | `(value: number) => string` | – | Formats every value |
| `view` | `view` | `WeekBarsView` | `"chart"` | The bars or the table |
| `still` | `still` | `boolean` | `false` | Draws everything where it ends, with no entrance or glide |
| `labels` | – | `Partial<WeekBarsLabels>` | `{}` | Words the page can rename, merged over `defaultWeekBarsLabels` |
| `shownWeek` | – | `number` | – | The shown week's index (the last when `week` is unset or out of range) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-week-change` | – | Yes | The switcher or PageUp/PageDown moved to another week ({ week }: WeekBarsWeekChange); cancelable – prevented, `week` stays as it was |
| `tc-view-change` | – | Yes | The Table button was pressed ({ view }: WeekBarsViewChange); cancelable – prevented, `view` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-wkb-met` | `var(--tc-chart-1)` | both |
| `--tc-wkb-rest` | `var(--tc-chart-neutral)` | both |
| `--tc-wkb-goal` | `var(--tc-text-muted)` | both |
| `--tc-wkb-plot-h` | `168px` | both |

#### Design tokens it reads (52)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-neutral`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-icon-muted`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-radius`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `weeks` | `el.weeks = …;` | `<… weeks={…} />` | `<tc-week-bars :weeks="…">` | `<tc-week-bars [weeks]="…">` | `<tc-week-bars {weeks}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-week-bars :format="…">` | `<tc-week-bars [format]="…">` | `<tc-week-bars {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-week-bars :labels="…">` | `<tc-week-bars [labels]="…">` | `<tc-week-bars {labels}>` |

*Also attributes: `heading`, `description`, `week`, `goal`, `today`, `view`, `still` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-week-change` | Yes | `el.addEventListener("tc-week-change", (e) => …)` | `ref.current.addEventListener("tc-week-change", …)` | `@tc-week-change="…"` | `(tc-week-change)="…($event)"` | `el.addEventListener("tc-week-change", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `week` and `view` itself unless a listener calls `preventDefault()` on `tc-week-change` or `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-week-bars id="week-bars"></tc-week-bars>

<script type="module">
  import "@adamstavely/trenchcoat/week-bars";

  const el = document.querySelector("#week-bars");
  el.addEventListener("tc-week-change", (e) => {
    e.preventDefault(); // the element keeps its week…
    if (allowed(e.detail.week)) el.week = e.detail.week; // …until the app sets it
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
import "@adamstavely/trenchcoat/week-bars";
import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";

const props = defineProps<{ initial: TcWeekBars["week"] }>();
const week = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onWeekChange = (e: CustomEvent<{ week: TcWeekBars["week"] }>) => {
  e.preventDefault();
  week.value = e.detail.week;
};
</script>

<template>
  <tc-week-bars :week="week" @tc-week-change="onWeekChange"></tc-week-bars>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { WeekBars } from "@adamstavely/trenchcoat/angular/week-bars";
import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";

@Component({
  selector: "app-controlled-week-bars",
  imports: [WeekBars],
  template: `<tc-week-bars [week]="week()" (tc-week-change)="onWeekChange($event)"></tc-week-bars>`,
})
export class ControlledWeekBars {
  readonly initial = input.required<TcWeekBars["week"]>();
  readonly week = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onWeekChange(e: CustomEvent<{ week: TcWeekBars["week"] }>) {
    e.preventDefault();
    this.week.set(e.detail.week);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/week-bars";
  import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";

  let { initial }: { initial: TcWeekBars["week"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let week = $derived(initial);
  let el: TcWeekBars;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      week = (e as CustomEvent<{ week: TcWeekBars["week"] }>).detail.week;
    };
    el.addEventListener("tc-week-change", on);
    return () => el.removeEventListener("tc-week-change", on);
  });
</script>

<tc-week-bars bind:this={el} {week}></tc-week-bars>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-week-bars")` returns a `TcWeekBars` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";`
- **React / Next.js:** Props: `import type { WeekBarsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof WeekBars>`. The element class, for refs: `import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWeekBars["weeks"]` with `import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";`
- **Angular:** The directive types the template: `[weeks]` takes `TcWeekBars["weeks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWeekBars } from "@adamstavely/trenchcoat/week-bars";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the plot's name |
| `week` | `number` | The shown week's index – controlled when given |
| `defaultWeek` | `number` | The week on mount when `week` isn't controlled – by default the last |
| `onWeekChange` | `(week: number) => void` | The switcher or PageUp/PageDown moved to another week |
| `view` | `WeekBarsView` | The bars or the table – controlled when given |
| `defaultView` | `WeekBarsView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: WeekBarsView) => void` | The Table button was pressed |

*Renamed or hidden on the wrapper: `heading`, `week`, `view`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop; the switcher's buttons and the Table button come before it |
| ← / → | Move to the previous or next day; it's outlined, its value shown and read out |
| Home / End | The first or last day |
| Page Up / Page Down | The week before or after (fires `tc-week-change`) |
| Escape | Lets go of the day |

### Screen readers

- The plot is a group named by the heading and described in words: every day's total, whether it met the goal, and
  the week's total.
- Moving with the arrows announces the day ("Tue: 472, goal met, 2 of 7"); today is said as "today".
- The switcher's buttons are "Previous week" and "Next week", and the week's label is read when it changes.
- The bars are hidden; the Table button shows the same numbers as a table.

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
| **This component alone** | 20.5 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **35.6 KB** | **11.6 KB** |
| With Lit – the first component on a page | 56.3 KB | 18.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 79 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of weeks replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.0 ms | weeks: first render, 79 nodes; update 0.2 ms |
| 1,000 items | 1.2 ms | weeks: first render, 79 nodes; update 0.4 ms |

What it renders doesn't grow with weeks (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **66 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop), `requestAnimationFrame, cancelled` (internal/controllers – RollingController).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock), `performance.now()` (internal/controllers – RollingController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Day names are short ("Mon"); give `short` when the first letter isn't the right narrow name.
- Week labels are short spans: "Mar 17–23".
- Days still to come are 0 – they draw as a hairline, so the week still reads as seven days.
- Rename the words with `labels` – "a day" after the average, "Goal", "goal met".

## Do and don't

### Do

- Set a `goal` when there is one: the line and the colours answer "did we make it" at a glance.
- Keep weeks oldest first, so the next button moves forward in time.

### Don't

- Change the scale between weeks – one scale across every week is what makes the glide honest.
- Put more than a week in one week's `days`; use another chart for longer spans.

## Related

- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Activity Calendar](activity-calendar.md) – A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Calendar Heatmap](calendar-heatmap.md) – An amount per day on a grid of weeks, each day shaded from light to the full accent, the busiest outlined, a year per row over several years, a scale legend, weeks that fade in, a canvas for long ranges, and a table view
- [Stage Bars](stage-bars.md) – A funnel as a list – a rounded pill per stage sized to its share of the first, the count and share beside it, a headline that follows the pointer with the change chip, stat tiles, an optional period switch that re-grows the pills, and a table view
