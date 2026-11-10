<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# SLA Status

**Data & charts** · New

How well service levels are met – the share on time, a Met / At risk / Breached split in words and marks, a weekly trend, a bar per type of request with a readout, and a period chooser

- **Element:** `<tc-sla-status>`
- **Size:** 13.8 KB gzip · 54.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/sla-status";` |
| React / Next.js | `import { SlaStatus } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/sla-status";` · tags starting with tc- are custom elements |
| Angular | `import { SlaStatus } from "@adamstavely/trenchcoat/angular/sla-status";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/sla-status";` |

## Example

The live example is in the gallery at `#/sla-status`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How well service levels are being met, at a glance. A headline gives the share on time – “94% on time” – beside a
legend that counts the work in each outcome: Met, At risk and Breached, in words and marks as well as colour. An
optional trend draws the on-time share week by week. Below, a bar splits the whole period, and optional rows split each
type of request – Review, Approval, Clearance – so the type that's slipping stands out. A period chooser (7d / 30d /
90d) asks the page for another period's numbers.

### When to use

- A legal, support or operations team's on-time delivery against its service levels.
- Comparing service levels across types of request or teams.
- The SLA panel of a team metrics page, beside its workload and capacity.

### When not to use

- A strip of counts with their changes – use [Ops Overview](ops-overview.md).
- Any share of a whole across categories – use [Breakdown Chart](breakdown-chart.md).
- One metric over time – use [KPI Chart](kpi-chart.md).
- How loaded each person is – use [Capacity Bars](capacity-bars.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Periods** `.ui-sla__periods` – the period shown: 7d, 30d or 90d
2. **Headline** `.ui-sla__headline` – the share on time
3. **Legend** `.ui-sla__legend` – each outcome's mark, name, count and share
4. **Trend** `.ui-sla__trend` – the on-time share week by week
5. **Bar** `.ui-sla__row` – the whole period, then one per type, with its on-time share
6. **Segment** `.ui-sla__seg` – an outcome's part of a bar, sized by its count
7. **Readout** `.ui-sla__readout` – the segment under the pointer or focus

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and a medium-weight whole-period row.
Clean is one white card with the header as its first row. The bars, marks and readout are the same in both. In a narrow
container each bar's label sits above it.

## Usage

### HTML

```html
<tc-sla-status id="sla" heading="SLA performance" unit="requests"></tc-sla-status>

<script type="module">
  import "@adamstavely/trenchcoat/sla-status";
  import "@adamstavely/trenchcoat/tokens.css";

  const sla = document.querySelector("#sla");
  sla.split = { met: 233, atRisk: 10, breached: 5 };
  sla.rows = [
    { id: "review", label: "Review", met: 92, atRisk: 3, breached: 1 },
    { id: "approval", label: "Approval", met: 70, atRisk: 4, breached: 3 },
  ];
  sla.trend = [0.89, 0.91, 0.93, 0.94];
  sla.addEventListener("tc-period-change", (e) => console.log("load", e.detail.period));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SlaStatus, type SlaSplit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const split: SlaSplit = { met: 233, atRisk: 10, breached: 5 };

export function Sla() {
  const [period, setPeriod] = useState("30d");
  return <SlaStatus title="SLA performance" split={split} trend={[0.89, 0.91, 0.94]} period={period} onPeriodChange={setPeriod} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/sla-status";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";

defineProps<{ split: TcSlaStatus["split"]; rows: TcSlaStatus["rows"] }>();
const onPeriodChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-sla-status :split="split" :rows="rows" @tc-period-change="onPeriodChange"></tc-sla-status>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SlaStatus } from "@adamstavely/trenchcoat/angular/sla-status";
import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";

@Component({
  selector: "app-sla-status-example",
  imports: [SlaStatus],
  template: `<tc-sla-status [split]="split()" [rows]="rows()" (tc-period-change)="onPeriodChange($event)"></tc-sla-status>`,
})
export class SlaStatusExample {
  readonly split = input.required<TcSlaStatus["split"]>();
  readonly rows = input.required<TcSlaStatus["rows"]>();
  onPeriodChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sla-status";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";

  let { split, rows }: { split: TcSlaStatus["split"]; rows: TcSlaStatus["rows"] } = $props();
  let el: TcSlaStatus;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-period-change", on);
    return () => el.removeEventListener("tc-period-change", on);
  });
</script>

<tc-sla-status bind:this={el} {split} {rows}></tc-sla-status>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"SLA performance"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `split` | – | `SlaSplit` | `{ met: 0, atRisk: 0, breached: 0 }` | The counts for the whole period |
| `rows` | – | `SlaRow[]` | `[]` | Counts per type of request, each drawn as its own bar |
| `trend` | – | `number[]` | `[]` | The on-time share per week, oldest first, from 0 to 1 |
| `labels` | – | `Partial<Record<SlaOutcome, string>>` | `{}` | The outcomes' names, merged over the defaults (Met, At risk, Breached) |
| `periods` | – | `string[]` | `["7d", "30d", "90d"]` | The periods to choose from; empty hides the chooser |
| `period` | `period` | `string` | `"30d"` | The period shown. Changed by the user unless a tc-period-change listener calls preventDefault() |
| `unit` | `unit` | `string` | `"requests"` | What the counts are, after the number: "12 requests" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-period-change` | – | Yes | A period was picked ({ period }: SlaPeriodChange); cancelable – prevented, `period` stays as it was |

#### Design tokens it reads (45)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-xs`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSlaLabels: Record<SlaOutcome, string>` | The outcomes' names used when the page gives none |

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
| `split` | `el.split = …;` | `<… split={…} />` | `<tc-sla-status :split="…">` | `<tc-sla-status [split]="…">` | `<tc-sla-status {split}>` |
| `rows` | `el.rows = …;` | `<… rows={…} />` | `<tc-sla-status :rows="…">` | `<tc-sla-status [rows]="…">` | `<tc-sla-status {rows}>` |
| `trend` | `el.trend = …;` | `<… trend={…} />` | `<tc-sla-status :trend="…">` | `<tc-sla-status [trend]="…">` | `<tc-sla-status {trend}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-sla-status :labels="…">` | `<tc-sla-status [labels]="…">` | `<tc-sla-status {labels}>` |
| `periods` | `el.periods = …;` | `<… periods={…} />` | `<tc-sla-status :periods="…">` | `<tc-sla-status [periods]="…">` | `<tc-sla-status {periods}>` |

*Also attributes: `heading`, `description`, `period`, `unit`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-period-change` | Yes | `el.addEventListener("tc-period-change", (e) => …)` | `ref.current.addEventListener("tc-period-change", …)` | `@tc-period-change="…"` | `(tc-period-change)="…($event)"` | `el.addEventListener("tc-period-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `period` itself unless a listener calls `preventDefault()` on `tc-period-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-sla-status id="sla-status"></tc-sla-status>

<script type="module">
  import "@adamstavely/trenchcoat/sla-status";

  const el = document.querySelector("#sla-status");
  el.addEventListener("tc-period-change", (e) => {
    e.preventDefault(); // the element keeps its period…
    if (allowed(e.detail.period)) el.period = e.detail.period; // …until the app sets it
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
import "@adamstavely/trenchcoat/sla-status";
import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";

const props = defineProps<{ initial: TcSlaStatus["period"] }>();
const period = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPeriodChange = (e: CustomEvent<{ period: TcSlaStatus["period"] }>) => {
  e.preventDefault();
  period.value = e.detail.period;
};
</script>

<template>
  <tc-sla-status :period="period" @tc-period-change="onPeriodChange"></tc-sla-status>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SlaStatus } from "@adamstavely/trenchcoat/angular/sla-status";
import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";

@Component({
  selector: "app-controlled-sla-status",
  imports: [SlaStatus],
  template: `<tc-sla-status [period]="period()" (tc-period-change)="onPeriodChange($event)"></tc-sla-status>`,
})
export class ControlledSlaStatus {
  readonly initial = input.required<TcSlaStatus["period"]>();
  readonly period = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPeriodChange(e: CustomEvent<{ period: TcSlaStatus["period"] }>) {
    e.preventDefault();
    this.period.set(e.detail.period);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sla-status";
  import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";

  let { initial }: { initial: TcSlaStatus["period"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let period = $derived(initial);
  let el: TcSlaStatus;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      period = (e as CustomEvent<{ period: TcSlaStatus["period"] }>).detail.period;
    };
    el.addEventListener("tc-period-change", on);
    return () => el.removeEventListener("tc-period-change", on);
  });
</script>

<tc-sla-status bind:this={el} {period}></tc-sla-status>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-sla-status")` returns a `TcSlaStatus` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";`
- **React / Next.js:** Props: `import type { SlaStatusProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SlaStatus>`. The element class, for refs: `import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSlaStatus["split"]` with `import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";`
- **Angular:** The directive types the template: `[split]` takes `TcSlaStatus["split"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSlaStatus } from "@adamstavely/trenchcoat/sla-status";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `period` | `string` | The period shown – controlled when given |
| `defaultPeriod` | `string` | The period on mount when `period` isn't controlled |
| `onPeriodChange` | `(period: string) => void` | A period was picked |

*Renamed or hidden on the wrapper: `heading`, `period`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The bars are one tab stop; inside them the arrows move between segments. The period chooser is a radio group of its
own.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next segment in the bar |
| ↑ / ↓ | Moves to the same outcome in the previous or next bar, skipping empty ones |
| Home / End | Moves to the bar's first or last segment |
| Tab | Leaves the bars |

### Screen readers

The bars are a `grid` named by the heading and described by “Left and right arrows move between a bar's segments, up
and down between bars”. Each bar is a row headed by its name and on-time share; each segment reads its outcome, count
and share, “Breached: 2 requests, 6%”. The legend is a list labelled “Outcomes”; the trend is an image labelled “On
time over 4 weeks, from 89% to 94%”. The readout repeats the focused segment, so it's hidden from screen readers. The
period chooser is a radio group labelled “Period”.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 16.6 KB | 5.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **54.8 KB** | **13.9 KB** |
| With Lit – the first component on a page | 76.5 KB | 21.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 98 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of rows replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.6 ms | rows: first render, 746 nodes; update 5.7 ms |
| 1,000 items | 81 ms | rows: first render, 6,821 nodes; update 55 ms |

1,000 items of rows: 81 ms. It renders every item, so a first render passes 50 ms (a long task) at about 620 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Set `unit` to what's counted, plural: “requests”, “tickets”.
- Rename outcomes to your team's words with `labels`: `{ atRisk: "Due soon" }`.
- Keep rows to the four to six types people manage separately.
- Supply the numbers for the period shown; listen for `tc-period-change` and pass the new ones.

## Do and don't

### Do

- Order rows by volume, or in the order work flows.
- Show the trend when people ask “is it getting better?”.
- Pair a row with the list of its breached requests.

### Don't

- Don't use the outcome tones for anything else on the page.
- Don't mix periods: the bars, legend and trend should all be for the period picked.
- Don't hide At risk – it's the part people can still do something about.

## Related

- [Ops Overview](ops-overview.md) – An operations overview in one dense strip – a status line, a health pill and count tiles, each with its change since the last period in words and green or red by which way is good, an optional sparkline and tone, optionally opening what it counts
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Capacity Bars](capacity-bars.md) – How loaded each person is – their allocation split by what they work on, against their capacity on one shared scale, each piece named with its amount, anyone over capacity marked and counted

## Changelog

- **Data & charts:** - `tc-ops-overview`: a dense strip of a health pill and count tiles with their change. - `tc-sla-status`: on-time share, a Met / At risk / Breached split, a trend and a bar per type.
