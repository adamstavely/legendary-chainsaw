<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Rate Limit Planner

**AI configuration** · New

Plan when agent runs happen under one API rate limit – the day's load as a stepped area against the limit with the overflow hatched, the peak and time over in words, a bar per run to drag or move with the arrow keys, fixed runs, and Spread out to lower the peak

- **Element:** `<tc-rate-limit-planner>`
- **Size:** 9.8 KB gzip · 30.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/rate-limit-planner";` |
| React / Next.js | `import { RateLimitPlanner } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/rate-limit-planner";` · tags starting with tc- are custom elements |
| Angular | `import { RateLimitPlanner } from "@adamstavely/trenchcoat/angular/rate-limit-planner";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/rate-limit-planner";` |

## Example

The live example is in the gallery at `#/rate-limit-planner`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Plan when agent runs happen so they stay under one API rate limit, in tokens a minute. On top, the day's load as a
stepped area with the limit as a line; whatever goes over it is hatched in the danger colour. Below, a row per run –
its name, agent, times and tokens a minute – with a bar on the same time axis that you drag, or focus and move with the
arrow keys, and the chart follows as it moves. The words above the chart say the peak and how far over it goes (“Peak
570K a minute at 02:00 – 43% over the limit”) and when (“Over the limit for 1 h 30 min: 01:00–02:30”). Spread out
proposes start times that lower the peak; the page may accept them or not.

### When to use

- Scheduling agent runs, cron jobs or batch work against one API rate limit.
- Showing why a night's runs hit 429s – which overlap and when the load goes over.
- An ops or settings page where people move their own jobs and watch the peak change.

### When not to use

- Live usage against each model's limits – use [Rate Limit Status](rate-limit-status.md).
- Placing tasks into sessions under usage limits across a week – use [Scheduled Runs](scheduled-runs.md).
- One recurring task and its next run – use [Schedule Card](schedule-card.md).
- Several limits at once (per model, per key) – use one planner per limit.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Words** `.ui-rlp__words` – the peak and the time over the limit
2. **Chart** `.ui-rlp__chart` – the load as a stepped area
3. **Limit** `.ui-rlp__limit` – the dashed line, labelled
4. **Overflow** `.ui-rlp__over` – the load above the limit, hatched
5. **Time axis** `.ui-rlp__ticks`
6. **Run row** `.ui-rlp__row` – name, agent, times and tokens a minute
7. **Bar** `.ui-rlp__bar` – the run on the axis; drag it or use the keys. Striped where it runs while over the limit;
8. **Spread out** `.ui-rlp__spread`

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The load uses the accent, the limit and the overflow the danger colour. `--tc-rlp-names` sets the name
column, `--tc-rlp-chart-h` the chart's height, `--tc-rlp-bar-h` a bar's height and `--tc-rlp-min` the narrowest the
axis gets before it scrolls sideways.

## Usage

### HTML

```html
<tc-rate-limit-planner id="plan" limit="400000" hours="12" time-zone="UTC"></tc-rate-limit-planner>

<script type="module">
  import "@adamstavely/trenchcoat/rate-limit-planner";
  import "@adamstavely/trenchcoat/tokens.css";

  const plan = document.querySelector("#plan");
  const day = Date.UTC(2026, 10, 16);
  const at = (h, m = 0) => day + (h * 60 + m) * 60000;
  plan.day = day;
  plan.runs = [
    { id: "wire", name: "Wire summaries", agent: "Wire desk", start: at(0, 30), minutes: 150, tokensPerMinute: 180000 },
    { id: "translate", name: "Translation batch", agent: "Languages desk", start: at(1), minutes: 120, tokensPerMinute: 160000 },
    { id: "archive", name: "Archive tagging", agent: "Archive", start: at(1, 30), minutes: 180, tokensPerMinute: 140000 },
    { id: "briefing", name: "Morning briefing", agent: "Briefing", start: at(5), minutes: 60, tokensPerMinute: 120000, fixed: true },
  ];
  plan.addEventListener("tc-runs-change", (e) => console.log(e.detail.change, e.detail.runs));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RateLimitPlanner, type PlannedRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const day = Date.UTC(2026, 10, 16);

export function Overnight() {
  const [runs, setRuns] = useState<PlannedRun[]>([
    { id: "wire", name: "Wire summaries", start: day + 30 * 60_000, minutes: 150, tokensPerMinute: 180_000 },
    { id: "translate", name: "Translation batch", start: day + 60 * 60_000, minutes: 120, tokensPerMinute: 160_000 },
  ]);
  return <RateLimitPlanner limit={300_000} day={day} hours={12} runs={runs} onRunsChange={(next) => setRuns(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/rate-limit-planner";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";

defineProps<{ runs: TcRateLimitPlanner["runs"] }>();
const onRunsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-rate-limit-planner :runs="runs" @tc-runs-change="onRunsChange"></tc-rate-limit-planner>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RateLimitPlanner } from "@adamstavely/trenchcoat/angular/rate-limit-planner";
import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";

@Component({
  selector: "app-rate-limit-planner-example",
  imports: [RateLimitPlanner],
  template: `<tc-rate-limit-planner [runs]="runs()" (tc-runs-change)="onRunsChange($event)"></tc-rate-limit-planner>`,
})
export class RateLimitPlannerExample {
  readonly runs = input.required<TcRateLimitPlanner["runs"]>();
  onRunsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/rate-limit-planner";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";

  let { runs }: { runs: TcRateLimitPlanner["runs"] } = $props();
  let el: TcRateLimitPlanner;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-runs-change", on);
    return () => el.removeEventListener("tc-runs-change", on);
  });
</script>

<tc-rate-limit-planner bind:this={el} {runs}></tc-rate-limit-planner>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Rate limit plan"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `runs` | – | `PlannedRun[]` | `[]` | The runs. Changed by dragging, the keys and Spread out unless a tc-runs-change listener calls preventDefault() |
| `limit` | `limit` | `number` | `0` | The limit, in tokens per minute |
| `day` | `day` | `number \| undefined` | `undefined` | Where the time axis starts, as epoch ms; by default the UTC midnight before the first run |
| `hours` | `hours` | `number` | `24` | How many hours the axis covers |
| `step` | `step` | `number` | `15` | The minutes a run moves by, and the chart's resolution |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and times, e.g. "en-GB"; by default the browser's |
| `timeZone` | `time-zone` | `string \| undefined` | `undefined` | The time zone times are shown in, e.g. "Europe/London"; by default the browser's |
| `summary` | – | `` | – | The peak, when it is, and the stretches over the limit |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-runs-change` | – | Yes | A run was moved, or Spread out proposed new start times ({ runs, change, id }: RateLimitRunsChange); cancelable – prevented, `runs` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `peakWords()` | `void` | "Peak 520K a minute at 01:15 – 30% over the limit" or "Peak 310K a minute at 04:00 – 78% of the limit" |
| `overWords()` | `void` | "Over the limit for 1 h 15 min: 01:00–02:15" or "Under the limit all day" |
| `valueText(r: PlannedRun)` | `void` | – |
| `moveTo(id: string, start: number, announce: unknown)` | `void` | Moves a run to start at `start`, snapped to `step` and kept inside the day |
| `spread()` | `void` | Proposes start times that lower the peak, and applies them unless the page prevents it |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rlp-names` | `148px` | both |
| `--tc-rlp-chart-h` | `140px` | both |
| `--tc-rlp-bar-h` | `18px` | both |
| `--tc-rlp-min` | `640px` | both |
| `--tc-rlp-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (55)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `rateLoad(runs: readonly PlannedRun[], from: number, minutes: number, step: unknown): number[]` | The total load in each `step`-minute slot from `from` for `minutes` |
| `spreadRuns(runs: readonly PlannedRun[], { day, hours = 24, step = 15 }: { day: number; hours?: number; step?: number }): PlannedRun[]` | Start times that lower the day's peak: fixed runs stay; the others, biggest first, each go where the load they'd add to is lowest, nearest their own start on a tie. Runs come back in the order given |

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
| `runs` | `el.runs = …;` | `<… runs={…} />` | `<tc-rate-limit-planner :runs="…">` | `<tc-rate-limit-planner [runs]="…">` | `<tc-rate-limit-planner {runs}>` |

*Also attributes: `heading`, `description`, `limit`, `day`, `hours`, `step`, `locale`, `time-zone` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-runs-change` | Yes | `el.addEventListener("tc-runs-change", (e) => …)` | `ref.current.addEventListener("tc-runs-change", …)` | `@tc-runs-change="…"` | `(tc-runs-change)="…($event)"` | `el.addEventListener("tc-runs-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `runs` itself unless a listener calls `preventDefault()` on `tc-runs-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-rate-limit-planner id="rate-limit-planner"></tc-rate-limit-planner>

<script type="module">
  import "@adamstavely/trenchcoat/rate-limit-planner";

  const el = document.querySelector("#rate-limit-planner");
  el.addEventListener("tc-runs-change", (e) => {
    e.preventDefault(); // the element keeps its runs…
    if (allowed(e.detail.runs)) el.runs = e.detail.runs; // …until the app sets it
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
import "@adamstavely/trenchcoat/rate-limit-planner";
import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";

const props = defineProps<{ initial: TcRateLimitPlanner["runs"] }>();
const runs = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRunsChange = (e: CustomEvent<{ runs: TcRateLimitPlanner["runs"] }>) => {
  e.preventDefault();
  runs.value = e.detail.runs;
};
</script>

<template>
  <tc-rate-limit-planner :runs="runs" @tc-runs-change="onRunsChange"></tc-rate-limit-planner>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RateLimitPlanner } from "@adamstavely/trenchcoat/angular/rate-limit-planner";
import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";

@Component({
  selector: "app-controlled-rate-limit-planner",
  imports: [RateLimitPlanner],
  template: `<tc-rate-limit-planner [runs]="runs()" (tc-runs-change)="onRunsChange($event)"></tc-rate-limit-planner>`,
})
export class ControlledRateLimitPlanner {
  readonly initial = input.required<TcRateLimitPlanner["runs"]>();
  readonly runs = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRunsChange(e: CustomEvent<{ runs: TcRateLimitPlanner["runs"] }>) {
    e.preventDefault();
    this.runs.set(e.detail.runs);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/rate-limit-planner";
  import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";

  let { initial }: { initial: TcRateLimitPlanner["runs"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let runs = $derived(initial);
  let el: TcRateLimitPlanner;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      runs = (e as CustomEvent<{ runs: TcRateLimitPlanner["runs"] }>).detail.runs;
    };
    el.addEventListener("tc-runs-change", on);
    return () => el.removeEventListener("tc-runs-change", on);
  });
</script>

<tc-rate-limit-planner bind:this={el} {runs}></tc-rate-limit-planner>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-rate-limit-planner")` returns a `TcRateLimitPlanner` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";`
- **React / Next.js:** Props: `import type { RateLimitPlannerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RateLimitPlanner>`. The element class, for refs: `import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRateLimitPlanner["runs"]` with `import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";`
- **Angular:** The directive types the template: `[runs]` takes `TcRateLimitPlanner["runs"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRateLimitPlanner } from "@adamstavely/trenchcoat/rate-limit-planner";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `runs` | `PlannedRun[]` | The runs – controlled when given |
| `defaultRuns` | `PlannedRun[]` | The runs on mount when `runs` isn't controlled |
| `onRunsChange` | `(runs: PlannedRun[], change: RateLimitRunsChange["change"], id: string \| null) => void` | A run was moved, or Spread out proposed new start times |

*Renamed or hidden on the wrapper: `heading`, `runs`, `children`*

## Accessibility

### Keyboard

The bars are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Moves the run by `step` minutes (15) |
| Shift + ← / → | Moves it by an hour |
| Home / End | Moves it to the start or the end of the day |
| ↑ / ↓ | Goes to the run above or below |
| Tab | Leaves the runs for Spread out |

### Screen readers

Each movable bar is a `slider` named “Wire summaries start”, with value text “Starts 00:30, ends 03:00, while over the
limit” and a description of its keys. A fixed run says so in words. The chart is an image named by the peak and the time
over the limit, and the same words are on the page above it. Moving with the keys and Spread out are confirmed in a
polite status message with the new peak.

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
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.9 KB | 7.6 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **30.3 KB** | **9.8 KB** |
| With Lit – the first component on a page | 52.2 KB | 17.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.6 ms** | the gallery demo's data, 90 DOM nodes – to layout, median of 7 |
| Typical update | **1.5 ms** | one item of runs replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 20 ms | runs: first render, 736 nodes; update 11 ms |
| 1,000 items | 179 ms | runs: first render, 6,856 nodes; update 141 ms |

1,000 items of runs: 179 ms. It renders every item, so a first render passes 50 ms (a long task) at about 280 items – page or filter longer lists.

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

- Pass `day` (epoch ms) for where the axis starts and `time-zone` for the times people plan in.
- Give each run the load it puts on the limit while it runs, in tokens a minute.
- Mark runs that must run when they do as `fixed`.

## Do and don't

### Do

- Keep it to about ten runs; group small ones per agent first.
- Show the limit your provider enforces, not the one you'd like.

### Don't

- Don't use it for live monitoring – it plans a day.

## Related

- [Rate Limit Status](rate-limit-status.md) – How close each model is to its provider's rate limits – requests, input and output tokens a minute as meters, the headroom in words (Plenty, Near limit, Limited with a reset countdown), 429s in the last hour, the tier and a sparkline of the last hour's peak, tightest first
- [Scheduled Runs](scheduled-runs.md) – Agent tasks placed into a week's sessions under usage limits – pinned first, big tasks split into linked parts, small ones filling gaps, and an Unscheduled list
- [Schedule Card](schedule-card.md) – A recurring agent task at a glance – the schedule in words, a live countdown to the next run, the last runs as marks in words with when and how long, and Run now, Pause / Resume and Edit
- [Budget Alerts](budget-alerts.md) – Spend alerts set by dragging markers along the month's budget – spent so far and the forecast hatched beyond it, a line at the budget, each alert a slider ("Alert at $4,000, 80% of budget") moved by pointer or keys, added by clicking the bar, with its channel, recipients and when the forecast crosses it
