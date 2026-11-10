<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Activity Clock

**Data & charts** · New

When activity happens, a clock per day – an AM ring and a PM ring of hour segments shaded by how busy each hour was, the weekday and date in the middle, and any hour's value there on hover or focus

- **Element:** `<tc-activity-clock>`
- **Size:** 8.6 KB gzip · 25.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/activity-clock";` |
| React / Next.js | `import { ActivityClock } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/activity-clock";` · tags starting with tc- are custom elements |
| Angular | `import { ActivityClock } from "@adamstavely/trenchcoat/angular/activity-clock";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/activity-clock";` |

## Example

The live example is in the gallery at `#/activity-clock`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

When activity happens, a clock per day. Each clock has two rings of twelve hour segments: the inner ring is AM, the
outer ring PM – each labelled at 12 o'clock – with 12 at the top, so the 3 PM segment sits where 3 is on a clock face. Each segment is shaded by how
much happened in that hour, in a few steps from empty to full. The shading is scaled to the busiest hour across every
day shown, so a quiet Sunday looks quiet next to a busy Tuesday. The middle of a clock shows its day – the weekday
and the date – or, under the pointer or focus, the hour and its value. The header names the busiest hour, and selecting
an hour reports it to the page.

### When to use

- When people, agents or systems are busy across the day and the week: runs, messages, sign-ins, deploys, alerts.
- Picking a time for maintenance, a meeting or a release, by seeing when things are quiet.
- Spotting a pattern that a total hides: a night-time spike, a lunch dip, a weekend that isn't quiet.

### When not to use

- One number and its trend over time – use [KPI Chart](kpi-chart.md).
- A share of a whole across categories – use [Breakdown Chart](breakdown-chart.md).
- Use against a limit or a plan – use [Usage Meter](usage-meter.md).
- Which checks cover which parts – use [Coverage Matrix](coverage-matrix.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Busiest** `.ui-aclk__peak` – the busiest day and hour shown, beside the heading
2. **Clock** `.ui-aclk__clock` – one day: the AM ring inside, the PM ring outside
3. **Segment** `.ui-aclk__seg` – an hour, shaded by its value; outlined with a dashed line when there's no data
4. **Ring labels** `.ui-aclk__ring-label` – at 12 o'clock: AM just inside the inner ring, PM just outside the outer one
5. **Middle** `.ui-aclk__centre` – the weekday and date, “Tue 27”, or the hour under the pointer or focus and its value
6. **Legend** `.ui-aclk__legend` – the shades from less to more, no data, and which ring is which

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight weekdays. Clean is
one white card with the header as its first row and quieter labels. The rings, shades and legend are the same in both.
The shades mix `--tc-aclk-ink` (by default `--tc-chart-1`) into `--tc-aclk-track`; set either on the element to
change them.

## Usage

### HTML

```html
<tc-activity-clock id="clock" heading="Agent runs by hour" unit="runs"></tc-activity-clock>

<script type="module">
  import "@adamstavely/trenchcoat/activity-clock";
  import "@adamstavely/trenchcoat/tokens.css";

  const clock = document.querySelector("#clock");
  clock.days = [
    { date: Date.parse("2026-10-26T12:00"), values: [0, 0, 0, 0, 0, 1, 3, 8, 20, 31, 42, 38, 22, 25, 33, 36, 30, 18, 9, 6, 4, 2, 1, 0] },
    { date: Date.parse("2026-10-27T12:00"), values: [0, 0, 0, 0, 1, 2, 5, 11, 24, 35, 40, 33, 19, 28, 41, 39, 27, 15, 8, 5, null, null, 1, 0] },
  ];
  clock.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ActivityClock, type ActivityDay, type ActivityHourRef } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const days: ActivityDay[] = [
  { date: Date.parse("2026-10-26T12:00"), values: [0, 0, 0, 0, 0, 1, 3, 8, 20, 31, 42, 38, 22, 25, 33, 36, 30, 18, 9, 6, 4, 2, 1, 0] },
  { date: Date.parse("2026-10-27T12:00"), values: [0, 0, 0, 0, 1, 2, 5, 11, 24, 35, 40, 33, 19, 28, 41, 39, 27, 15, 8, 5, null, null, 1, 0] },
];

export function Runs() {
  const [selected, setSelected] = useState<ActivityHourRef | null>(null);
  return <ActivityClock title="Agent runs by hour" unit="runs" days={days} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/activity-clock";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";

defineProps<{ days: TcActivityClock["days"]; format: TcActivityClock["format"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-activity-clock :days="days" :format="format" @tc-selected-change="onSelectedChange"></tc-activity-clock>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ActivityClock } from "@adamstavely/trenchcoat/angular/activity-clock";
import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";

@Component({
  selector: "app-activity-clock-example",
  imports: [ActivityClock],
  template: `<tc-activity-clock [days]="days()" [format]="format()" (tc-selected-change)="onSelectedChange($event)"></tc-activity-clock>`,
})
export class ActivityClockExample {
  readonly days = input.required<TcActivityClock["days"]>();
  readonly format = input.required<TcActivityClock["format"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/activity-clock";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";

  let { days, format }: { days: TcActivityClock["days"]; format: TcActivityClock["format"] } = $props();
  let el: TcActivityClock;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-activity-clock bind:this={el} {days} {format}></tc-activity-clock>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Activity"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `days` | – | `ActivityDay[]` | `[]` | The days, a clock each, in the order given |
| `max` | `max` | `number \| undefined` | `undefined` | The value that shades a segment fully; by default the busiest hour across every day shown |
| `levels` | `levels` | `number` | `5` | How many shades, counting empty: 5 is empty and four steps of activity |
| `unit` | `unit` | `string` | `"events"` | What the values count, after the number: "12 events" |
| `format` | – | `((value: number) => string) \| undefined` | `undefined` | Writes a value in full, e.g. (v) => `${v} min active`; replaces the number and `unit` |
| `selected` | – | `ActivityHourRef \| null` | `null` | The selected hour. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for day names and numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | An hour was selected or cleared ({ selected, value }: ActivitySelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-aclk-ink` | `var(--tc-chart-1)` | both |
| `--tc-aclk-track` | `var(--tc-fill-default)` | both |

#### Design tokens it reads (47)

`--tc-aclk-mix`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `days` | `el.days = …;` | `<… days={…} />` | `<tc-activity-clock :days="…">` | `<tc-activity-clock [days]="…">` | `<tc-activity-clock {days}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-activity-clock :format="…">` | `<tc-activity-clock [format]="…">` | `<tc-activity-clock {format}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-activity-clock :selected="…">` | `<tc-activity-clock [selected]="…">` | `<tc-activity-clock {selected}>` |

*Also attributes: `heading`, `description`, `max`, `levels`, `unit`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-activity-clock id="activity-clock"></tc-activity-clock>

<script type="module">
  import "@adamstavely/trenchcoat/activity-clock";

  const el = document.querySelector("#activity-clock");
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
import "@adamstavely/trenchcoat/activity-clock";
import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";

const props = defineProps<{ initial: TcActivityClock["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcActivityClock["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-activity-clock :selected="selected" @tc-selected-change="onSelectedChange"></tc-activity-clock>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ActivityClock } from "@adamstavely/trenchcoat/angular/activity-clock";
import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";

@Component({
  selector: "app-controlled-activity-clock",
  imports: [ActivityClock],
  template: `<tc-activity-clock [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-activity-clock>`,
})
export class ControlledActivityClock {
  readonly initial = input.required<TcActivityClock["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcActivityClock["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/activity-clock";
  import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";

  let { initial }: { initial: TcActivityClock["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcActivityClock;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcActivityClock["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-activity-clock bind:this={el} {selected}></tc-activity-clock>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-activity-clock")` returns a `TcActivityClock` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";`
- **React / Next.js:** Props: `import type { ActivityClockProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ActivityClock>`. The element class, for refs: `import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcActivityClock["days"]` with `import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";`
- **Angular:** The directive types the template: `[days]` takes `TcActivityClock["days"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcActivityClock } from "@adamstavely/trenchcoat/activity-clock";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `selected` | `ActivityHourRef \| null` | The selected hour – controlled when given (null for none) |
| `defaultSelected` | `ActivityHourRef \| null` | The hour selected on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: ActivityHourRef \| null, value?: number \| null) => void` | An hour was selected or cleared; `value` is its value (null when it has no data) |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The clocks are one tab stop; inside them the arrows move between hours.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next hour of the day |
| ↑ / ↓ | Moves to the same hour on the previous or next day |
| Page Up / Page Down | Moves between the AM and PM ring: 3 AM ↔ 3 PM |
| Home / End | Moves to the day's first or last hour |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first hour of the first day, or the last hour of the last day |
| Enter / Space | Selects the hour, or clears it if it's selected |
| Escape | Clears the selected hour |
| Tab | Leaves the clocks |

### Screen readers

The clocks are a `grid` named by the heading and described by “Left and right arrows move an hour, up and down a
day; Enter selects the hour”. Each day is a row named by its full date, “Tuesday, October 27”, and each hour a
cell that reads its range and value, “3 PM to 4 PM, 42 runs”, or “no data”. The selected hour is `aria-selected`.
Selecting is confirmed in a polite status message, “Selected Tuesday, October 27, 3 PM to 4 PM: 42 runs”, and
clearing with “Selection cleared”. The middle of each clock and the AM and PM labels repeat what the row and cells
say, so they're hidden from screen readers.

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
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
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
| **This component alone** | 18.1 KB | 6.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/activity-scale` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **25.8 KB** | **8.6 KB** |
| With Lit – the first component on a page | 47.6 KB | 15.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.2 ms** | the gallery demo's data, 285 DOM nodes – to layout, median of 7 |
| Typical update | **2.7 ms** | one item of days replaced |
| First on the page | 8.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 82 ms | days: first render, 3,633 nodes; update 66 ms |
| 1,000 items | 4974 ms | days: first render, 36,033 nodes; update 4872 ms |

1,000 items of days: 4974 ms. It renders every item, so a first render passes 50 ms (a long task) at about 10 items – page or filter longer lists.

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

- Set `unit` to what the values count, plural: “runs”, “messages”, “sign-ins”. For anything else, pass `format`.
- Use null for an hour you have no data for, not 0 – the two look different, and 0 means nothing happened.
- Give `date` as any moment in the day, in the viewer's time zone; set `label` when the weekday isn't enough, such as
  “Today” – it replaces the weekday in the middle, above the date.

## Do and don't

### Do

- Show whole weeks, or another fixed stretch, so the days compare fairly.
- Set `max` when several activity clocks on a page should share one scale.
- Pair a selected hour with a detail panel or a filtered list of what happened in it.

### Don't

- Don't show more than about fourteen days – past that, the clocks get too small to read.
- Don't use the shades for anything but how busy an hour was – one colour, one meaning.
- Don't leave hours out of `values` to mean zero – a missing hour reads as no data.

## Related

- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Changelog

- **`tc-activity-clock`:** activity by hour, a clock per day. - **Rings:** an inner AM ring and an outer PM ring of twelve hour segments, labelled at 12 o'clock, with 12 at the top. - **Shading:** each segment shaded by its value in `levels` steps, scaled to the busiest hour shown or `max`. An hour with no data is outlined, not shaded. - **Middle:** the weekday and date, or the hour under the pointer or focus and its value. - **Header and selection:** the busiest hour in the header, and a selected hour reported with a cancelable `tc-selected-change`. - **Keyboard:** a grid with a row per day; ← → move an hour, ↑ ↓ a day, Page keys switch between AM and PM.
