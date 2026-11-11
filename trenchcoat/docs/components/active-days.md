<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Active Days

**Data & charts** · New

A daily goal month by month – each day's date in a small ring filled towards the goal, a check when it's met, months running on down with their names sticking, the month's days at goal, best streak and busiest weekday, and any day's value and share of the goal on hover or focus

- **Element:** `<tc-active-days>`
- **Size:** 9.6 KB gzip · 28.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/active-days";` |
| React / Next.js | `import { ActiveDays } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/active-days";` · tags starting with tc- are custom elements |
| Angular | `import { ActiveDays } from "@adamstavely/trenchcoat/angular/active-days";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/active-days";` |

## Example

The live example is in the gallery at `#/active-days`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How many days met their goal, month by month. A calendar runs on down the card, a block per month under a name that
sticks while it scrolls. Each day is its date inside a small ring filled to how much of the daily goal it reached: a
full ring and a check when it met it, an empty outline when there's no data, and no ring on days still to come. Above
the calendar, for the month in view, the header counts the days at goal and a line gives the goal, the best streak and
the busiest weekday. The footer reads out the day under the pointer or focus with its share of the goal, and selecting
a day reports it to the page.

### When to use

- A daily target people work towards: reviews done, records checked, hours logged, check-ins.
- Showing streaks and misses over the last few months at a size you can read day by day.
- A team or personal page where the month's progress matters more than the year's shape.

### When not to use

- A year of activity at a glance, without a goal – use [Activity Calendar](activity-calendar.md).
- An amount per day over several years, shaded – use [Calendar Heatmap](calendar-heatmap.md).
- Picking dates or showing events on them – use [Multi Calendar](multi-calendar.md).
- One score made of parts – use [Score Ring](score-ring.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Count** `.ui-acd__total` – the days at goal in the month in view, beside the heading
2. **Facts** `.ui-acd__stats` – the goal, the month's best streak and its busiest weekday
3. **Weekdays** `.ui-acd__weekdays` – the weekday initials, fixed at the top while the months scroll
4. **Month** `.ui-acd__month-name` – each month's name, sticking under the weekdays
5. **Day** `.ui-acd__cell` – the date in a ring filled towards the goal, a check when it's met
6. **Readout** `.ui-acd__readout` – the day under the pointer or focus, its value and share of the goal

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The calendar, facts and readout are the same in both. `--tc-acd-ink` fills a ring towards the goal
(by default `--tc-chart-1`), `--tc-acd-met` fills a ring that met it (`--tc-status-success-fg`), `--tc-acd-track` is
the empty ring, `--tc-acd-cell` the size of a day (40 px, 30 px when the card is narrower than 360 px) and
`--tc-acd-height` how tall the calendar gets before it scrolls (360 px); set any of them on the element.

## Usage

### HTML

```html
<tc-active-days id="reviews" heading="Daily reviews" unit="reviews" goal="40" week-start="1"></tc-active-days>

<script type="module">
  import "@adamstavely/trenchcoat/active-days";
  import "@adamstavely/trenchcoat/tokens.css";

  const cal = document.querySelector("#reviews");
  cal.now = Date.parse("2026-10-27T12:00");
  cal.days = [
    { date: "2026-10-26", value: 44 },
    { date: "2026-10-27", value: 31 },
    { date: "2026-10-23", value: null },
  ];
  cal.addEventListener("tc-date-change", (e) => console.log(e.detail.date, e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ActiveDays, type ActiveDaysDay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const days: ActiveDaysDay[] = [
  { date: "2026-10-26", value: 44 },
  { date: "2026-10-27", value: 31 },
];

export function Reviews() {
  const [date, setDate] = useState<string | null>(null);
  return <ActiveDays title="Daily reviews" unit="reviews" goal={40} days={days} now={Date.parse("2026-10-27T12:00")} weekStart={1} date={date} onDateChange={setDate} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/active-days";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";

defineProps<{ days: TcActiveDays["days"] }>();
const onDateChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-active-days :days="days" @tc-date-change="onDateChange"></tc-active-days>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ActiveDays } from "@adamstavely/trenchcoat/angular/active-days";
import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";

@Component({
  selector: "app-active-days-example",
  imports: [ActiveDays],
  template: `<tc-active-days [days]="days()" (tc-date-change)="onDateChange($event)"></tc-active-days>`,
})
export class ActiveDaysExample {
  readonly days = input.required<TcActiveDays["days"]>();
  onDateChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/active-days";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";

  let { days }: { days: TcActiveDays["days"] } = $props();
  let el: TcActiveDays;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-date-change", on);
    return () => el.removeEventListener("tc-date-change", on);
  });
</script>

<tc-active-days bind:this={el} {days}></tc-active-days>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Active days"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `days` | – | `ActiveDaysDay[]` | `[]` | The days with activity, "YYYY-MM-DD", in any order; a day not listed has no data |
| `goal` | `goal` | `number` | `1` | The daily goal: a day at or over it is a full ring |
| `month` | `month` | `string \| undefined` | `undefined` | The month in view first, "YYYY-MM"; by default the latest month in `days` |
| `now` | `now` | `number \| undefined` | `undefined` | Today, as epoch ms – days after it are blank; by default the clock |
| `weekStart` | `week-start` | `number` | `0` | The first day of the week: 0 Sunday, 1 Monday … 6 Saturday |
| `unit` | `unit` | `string` | `"events"` | What the values count, after the number: "12 reviews" |
| `date` | `date` | `string \| null` | `null` | The selected day, "YYYY-MM-DD". Changed by the user unless a tc-date-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for month, weekday and number names, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-date-change` | – | Yes | A day was selected or cleared ({ date, value }: ActiveDaysDateChange); cancelable – prevented, `date` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-acd-ink` | `var(--tc-chart-1)` | both |
| `--tc-acd-met` | `var(--tc-status-success-fg)` | both |
| `--tc-acd-track` | `var(--tc-meter-track)` | both |
| `--tc-acd-cell` | `30px` | both |
| `--tc-acd-height` | `360px` | both |
| `--tc-acd-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (40)

`--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-track`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `days` | `el.days = …;` | `<… days={…} />` | `<tc-active-days :days="…">` | `<tc-active-days [days]="…">` | `<tc-active-days {days}>` |

*Also attributes: `heading`, `description`, `goal`, `month`, `now`, `week-start`, `unit`, `date` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-date-change` | Yes | `el.addEventListener("tc-date-change", (e) => …)` | `ref.current.addEventListener("tc-date-change", …)` | `@tc-date-change="…"` | `(tc-date-change)="…($event)"` | `el.addEventListener("tc-date-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `date` itself unless a listener calls `preventDefault()` on `tc-date-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-active-days id="active-days"></tc-active-days>

<script type="module">
  import "@adamstavely/trenchcoat/active-days";

  const el = document.querySelector("#active-days");
  el.addEventListener("tc-date-change", (e) => {
    e.preventDefault(); // the element keeps its date…
    if (allowed(e.detail.date)) el.date = e.detail.date; // …until the app sets it
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
import "@adamstavely/trenchcoat/active-days";
import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";

const props = defineProps<{ initial: TcActiveDays["date"] }>();
const date = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDateChange = (e: CustomEvent<{ date: TcActiveDays["date"] }>) => {
  e.preventDefault();
  date.value = e.detail.date;
};
</script>

<template>
  <tc-active-days :date="date" @tc-date-change="onDateChange"></tc-active-days>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ActiveDays } from "@adamstavely/trenchcoat/angular/active-days";
import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";

@Component({
  selector: "app-controlled-active-days",
  imports: [ActiveDays],
  template: `<tc-active-days [date]="date()" (tc-date-change)="onDateChange($event)"></tc-active-days>`,
})
export class ControlledActiveDays {
  readonly initial = input.required<TcActiveDays["date"]>();
  readonly date = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDateChange(e: CustomEvent<{ date: TcActiveDays["date"] }>) {
    e.preventDefault();
    this.date.set(e.detail.date);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/active-days";
  import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";

  let { initial }: { initial: TcActiveDays["date"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let date = $derived(initial);
  let el: TcActiveDays;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      date = (e as CustomEvent<{ date: TcActiveDays["date"] }>).detail.date;
    };
    el.addEventListener("tc-date-change", on);
    return () => el.removeEventListener("tc-date-change", on);
  });
</script>

<tc-active-days bind:this={el} {date}></tc-active-days>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-active-days")` returns a `TcActiveDays` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";`
- **React / Next.js:** Props: `import type { ActiveDaysProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ActiveDays>`. The element class, for refs: `import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcActiveDays["days"]` with `import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";`
- **Angular:** The directive types the template: `[days]` takes `TcActiveDays["days"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcActiveDays } from "@adamstavely/trenchcoat/active-days";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `date` | `string \| null` | The selected day, "YYYY-MM-DD" – controlled when given (null for none) |
| `defaultDate` | `string \| null` | The day selected on mount when `date` isn't controlled |
| `onDateChange` | `(date: string \| null, value?: number \| null) => void` | A day was selected or cleared; `value` is its value (null when it has no data) |

*Renamed or hidden on the wrapper: `heading`, `date`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The calendar is one tab stop, on the selected day, else today; inside it the arrows move between days.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next day |
| ↑ / ↓ | Moves to the same weekday in the previous or next week |
| Home / End | Moves to the first or last day of the week |
| Page Up / Page Down | Moves to the same date in the previous or next month |
| Enter / Space | Selects the day, or clears it if it's selected |
| Escape | Clears the selected day |
| Tab | Leaves the calendar |

The header's count and facts follow the month of the focused day, and a day moved to off the edge scrolls into view.

### Screen readers

The calendar is a `grid` named by the heading and described by “Left and right arrows move a day, up and down a week,
Page Up and Page Down a month; Enter selects the day”. Weekdays are column headers and each month's name a row header.
Each day reads its value, its share of the goal and its date: “Goal met: 44 reviews, 110% of the goal, Tuesday, October
27, 2026”, “No data, …” or “…, upcoming”, and the selected day is `aria-selected`. Selecting is confirmed in a polite
status message, “Selected Tuesday, October 27, 2026: 44 reviews”, and clearing with “Selection cleared”. The readout
repeats what the focused day says, so it's hidden from screen readers.

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.2 KB | 7.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.8 KB** | **9.6 KB** |
| With Lit – the first component on a page | 48.4 KB | 15.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **7.9 ms** | the gallery demo's data, 718 DOM nodes – to layout, median of 7 |
| Typical update | **5.2 ms** | one item of days replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.3 ms | days: first render, 727 nodes; update 4.7 ms |
| 1,000 items | 11 ms | days: first render, 898 nodes; update 6.0 ms |

1,000 items of days: 11 ms, 898 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Set `unit` to what the values count, plural: “reviews”, “check-ins”, “hours”.
- Set `goal` to the daily target; a day at or over it is a full ring.
- Only list days you have numbers for: a day not in `days` has no data. Use 0 for a day with nothing done.
- Pass `now` when “today” should be a fixed day, such as in a report.

## Do and don't

### Do

- Show two to four months, so streaks across month ends read.
- Set `week-start` to match the viewer's calendar: 1 for Monday in most of Europe.
- Pair a selected day with what was done on it.

### Don't

- Don't use it without a meaningful goal – a ring that's always full or always empty says nothing.
- Don't change the goal from day to day – the rings stop being comparable.
- Don't pass 0 for days without data – a 0 reads as a missed day, a missing day as a gap in the record.

## Related

- [Activity Calendar](activity-calendar.md) – A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus
- [Calendar Heatmap](calendar-heatmap.md) – An amount per day on a grid of weeks, each day shaded from light to the full accent, the busiest outlined, a year per row over several years, a scale legend, weeks that fade in, a canvas for long ranges, and a table view
- [Multi Calendar](multi-calendar.md) – A calendar of calendars: many people's Google, Outlook, Exchange and iCal calendars in one Day, Week, Month, Agenda or People view, with show/hide per calendar, conflicts across a person's calendars, and create, edit, drag-to-move and delete on writable ones
- [Score Ring](score-ring.md) – One overall score from weighted sub-scores – a ring with a segment per part as long as its weight and filled to its score, the score and its band in the middle, a row per part that isolates its segment, and the metrics behind the score
