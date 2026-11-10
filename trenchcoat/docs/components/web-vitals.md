<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Web Vitals

**Workspace & sessions** · New

A tile per measure (LCP, INP, CLS, FCP, TTFB or the page's own) with its value, a Good / Needs improvement / Poor word, a three-zone track and earlier readings, plus an optional Mobile / Desktop switch.

- **Element:** `<tc-web-vitals>`
- **Size:** 7.1 KB gzip · 20.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/web-vitals";` |
| React / Next.js | `import { WebVitals } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/web-vitals";` · tags starting with tc- are custom elements |
| Angular | `import { WebVitals } from "@adamstavely/trenchcoat/angular/web-vitals";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/web-vitals";` |

## Example

The live example is in the gallery at `#/web-vitals`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How a page loads and responds, one tile per measure: the short and full name, the value, a word for how it rates
("Good", "Needs improvement", "Poor"), a track with the three zones and a marker at the value, and a small line of
earlier readings. LCP, INP, CLS, FCP and TTFB know their usual limits; any other measure passes its own `good` and
`poor`. With `device` set, the header has a Mobile / Desktop switch and the page swaps the numbers.

### When to use

- Beside a preview of a page, to show whether a change made it slower or jumpier.
- A route's performance summary in a deploy or review panel.

### When not to use

- A measure over time on its own – use [KPI Chart](kpi-chart.md).
- How full something is – use [Meter Row](meter-row.md).
- Every route's load time at once – use [Route Map](route-map.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tile** `.ui-wvit__tile` – one measure, with its `data-rating`
2. **Short name** `.ui-wvit__short` and **full name** `.ui-wvit__name` – "LCP", "Largest Contentful Paint"
3. **Value** `.ui-wvit__value` – "180 ms", "2.1 s" or "0.08"
4. **Rating** `.ui-wvit__rating` – a mark (circle, triangle or square) and a word
5. **Track** `.ui-wvit__track` – the good, needs-improvement and poor zones, with a **marker** `.ui-wvit__marker` at the value
6. **Trend** `.ui-wvit__spark` – earlier readings, oldest first
7. **Count** `.ui-wvit__count` – how many measures are good, in the header
8. **Device switch** `.ui-wvit__devs` – Mobile and Desktop

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
The tiles reflow from a grid to one column as it narrows. A page can set `--tc-wvit-tile-min`, the narrowest a tile gets
before the grid drops a column, and `--tc-wvit-track-h`, the track's thickness.

## Usage

### HTML

```html
<tc-web-vitals id="vitals" description="/grants · last 28 days" device="mobile"></tc-web-vitals>

<script type="module">
  import "@adamstavely/trenchcoat/web-vitals";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#vitals");
  el.metrics = [
    { id: "lcp", value: 3120, history: [2650, 2900, 3120] },
    { id: "inp", value: 184 },
    { id: "cls", value: 0.28 },
  ];
  el.addEventListener("tc-device-change", (e) => console.log("load numbers for", e.detail.device));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { WebVitals, type WebVital, type WebVitalDevice } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Vitals({ byDevice }: { byDevice: Record<WebVitalDevice, WebVital[]> }) {
  const [device, setDevice] = useState<WebVitalDevice>("mobile");
  return <WebVitals description="/grants" metrics={byDevice[device]} device={device} onDeviceChange={setDevice} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/web-vitals";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";

defineProps<{ metrics: TcWebVitals["metrics"]; labels: TcWebVitals["labels"] }>();
const onDeviceChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-web-vitals :metrics="metrics" :labels="labels" @tc-device-change="onDeviceChange"></tc-web-vitals>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { WebVitals } from "@adamstavely/trenchcoat/angular/web-vitals";
import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";

@Component({
  selector: "app-web-vitals-example",
  imports: [WebVitals],
  template: `<tc-web-vitals [metrics]="metrics()" [labels]="labels()" (tc-device-change)="onDeviceChange($event)"></tc-web-vitals>`,
})
export class WebVitalsExample {
  readonly metrics = input.required<TcWebVitals["metrics"]>();
  readonly labels = input.required<TcWebVitals["labels"]>();
  onDeviceChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/web-vitals";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";

  let { metrics, labels }: { metrics: TcWebVitals["metrics"]; labels: TcWebVitals["labels"] } = $props();
  let el: TcWebVitals;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-device-change", on);
    return () => el.removeEventListener("tc-device-change", on);
  });
</script>

<tc-web-vitals bind:this={el} {metrics} {labels}></tc-web-vitals>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Web vitals"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – the page or route measured |
| `metrics` | – | `WebVital[]` | `[]` | The measures, in order |
| `device` | `device` | `WebVitalDevice \| null` | `null` | Which device the numbers are for; set, the header shows the switch |
| `labels` | – | `Partial<WebVitalsLabels>` | `{}` | Renames the words it uses |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-device-change` | – | Yes | Mobile or Desktop was chosen ({ device }: WebVitalsDeviceChange); cancelable – prevented, `device` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-wvit-tile-min` | `13rem` | both |
| `--tc-wvit-track-h` | `var(--tc-space-1-5)` | both |

#### Design tokens it reads (47)

`--tc-action-secondary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-meter-radius`, `--tc-radius-full`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `webVitalDefaults: Record<WebVitalId, { name: string; unit: WebVitalUnit; good: number; poor: number }>` | The usual limits and names (web.dev, 2024) |
| `rateWebVital(value: number, good: number, poor: number): WebVitalRating` | "good" at or under `good`, "poor" over `poor`, "needs" between |

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
| `metrics` | `el.metrics = …;` | `<… metrics={…} />` | `<tc-web-vitals :metrics="…">` | `<tc-web-vitals [metrics]="…">` | `<tc-web-vitals {metrics}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-web-vitals :labels="…">` | `<tc-web-vitals [labels]="…">` | `<tc-web-vitals {labels}>` |

*Also attributes: `heading`, `description`, `device`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-device-change` | Yes | `el.addEventListener("tc-device-change", (e) => …)` | `ref.current.addEventListener("tc-device-change", …)` | `@tc-device-change="…"` | `(tc-device-change)="…($event)"` | `el.addEventListener("tc-device-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `device` itself unless a listener calls `preventDefault()` on `tc-device-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-web-vitals id="web-vitals"></tc-web-vitals>

<script type="module">
  import "@adamstavely/trenchcoat/web-vitals";

  const el = document.querySelector("#web-vitals");
  el.addEventListener("tc-device-change", (e) => {
    e.preventDefault(); // the element keeps its device…
    if (allowed(e.detail.device)) el.device = e.detail.device; // …until the app sets it
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
import "@adamstavely/trenchcoat/web-vitals";
import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";

const props = defineProps<{ initial: TcWebVitals["device"] }>();
const device = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDeviceChange = (e: CustomEvent<{ device: TcWebVitals["device"] }>) => {
  e.preventDefault();
  device.value = e.detail.device;
};
</script>

<template>
  <tc-web-vitals :device="device" @tc-device-change="onDeviceChange"></tc-web-vitals>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { WebVitals } from "@adamstavely/trenchcoat/angular/web-vitals";
import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";

@Component({
  selector: "app-controlled-web-vitals",
  imports: [WebVitals],
  template: `<tc-web-vitals [device]="device()" (tc-device-change)="onDeviceChange($event)"></tc-web-vitals>`,
})
export class ControlledWebVitals {
  readonly initial = input.required<TcWebVitals["device"]>();
  readonly device = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDeviceChange(e: CustomEvent<{ device: TcWebVitals["device"] }>) {
    e.preventDefault();
    this.device.set(e.detail.device);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/web-vitals";
  import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";

  let { initial }: { initial: TcWebVitals["device"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let device = $derived(initial);
  let el: TcWebVitals;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      device = (e as CustomEvent<{ device: TcWebVitals["device"] }>).detail.device;
    };
    el.addEventListener("tc-device-change", on);
    return () => el.removeEventListener("tc-device-change", on);
  });
</script>

<tc-web-vitals bind:this={el} {device}></tc-web-vitals>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-web-vitals")` returns a `TcWebVitals` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";`
- **React / Next.js:** Props: `import type { WebVitalsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof WebVitals>`. The element class, for refs: `import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWebVitals["metrics"]` with `import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";`
- **Angular:** The directive types the template: `[metrics]` takes `TcWebVitals["metrics"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWebVitals } from "@adamstavely/trenchcoat/web-vitals";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `device` | `WebVitalDevice \| null` | Which device the numbers are for – controlled when given; null hides the switch |
| `defaultDevice` | `WebVitalDevice \| null` | The device at first, when `device` isn't controlled; null hides the switch |
| `onDeviceChange` | `(device: WebVitalDevice) => void` | Mobile or Desktop was chosen |

*Renamed or hidden on the wrapper: `heading`, `device`, `children`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

The tiles are read-only. The device switch is one tab stop.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Switches between Mobile and Desktop |
| Home / End | Chooses Mobile or Desktop |

### Screen readers

The tiles are a list named by the heading; each reads its names, its value and its rating word. The track and the line
are drawn for the eye and hidden; a hidden sentence lists the earlier readings. The device switch is a `radiogroup`
named "Device".

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
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 13.1 KB | 5.0 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **20.4 KB** | **7.1 KB** |
| With Lit – the first component on a page | 41.1 KB | 13.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 106 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of metrics replaced |
| First on the page | 8.1 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | metrics: first render, 1,721 nodes; update 6.6 ms |
| 1,000 items | 132 ms | metrics: first render, 17,021 nodes; update 60 ms |

1,000 items of metrics: 132 ms. It renders every item, so a first render passes 50 ms (a long task) at about 380 items – page or filter longer lists.

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

- Pass values in the unit given: ms for timings unless `unit` says "s", and a plain number for CLS.
- Say where the numbers come from in `description`: the route and the period, or "lab run".
- Give `history` the same unit as `value`, oldest first.

## Do and don't

### Do

- Keep the default limits for the five known measures, so ratings match what people see elsewhere.
- Show the device the numbers are for whenever both are measured.

### Don't

- Don't colour-code a measure with no limits; pass `good` and `poor` or leave it out.
- Don't mix lab and field numbers in one set of tiles.

## Related

- [Preview Frame](preview-frame.md) – a browser pane around a page the app supplies: address, back, forward and reload, phone, tablet and desktop widths zoomed to fit, a console count, tabs, and loading, error and empty states.
- [Meter Row](meter-row.md) – How full something is on one line – a label, a percentage and a tiny bar, with a mark and a word when it's getting full; can open the details or sit compact beside a value.
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Route Map](route-map.md) – An app's routes as an indented list with :params picked out, a status mark and word, load time and last visit; status chips filter it, and pressing a route opens it.
