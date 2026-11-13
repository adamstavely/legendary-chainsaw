<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Rate Limit Status

**AI configuration** · New

How close each model is to its provider's rate limits – requests, input and output tokens a minute as meters, the headroom in words (Plenty, Near limit, Limited with a reset countdown), 429s in the last hour, the tier and a sparkline of the last hour's peak, tightest first

- **Element:** `<tc-rate-limit-status>`
- **Size:** 8.0 KB gzip · 24.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/rate-limit-status";` |
| React / Next.js | `import { RateLimitStatus } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/rate-limit-status";` · tags starting with tc- are custom elements |
| Angular | `import { RateLimitStatus } from "@adamstavely/trenchcoat/angular/rate-limit-status";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/rate-limit-status";` |

## Example

The live example is in the gallery at `#/rate-limit-status`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How close each model is to its provider's rate limits, this minute. Each row is one provider and model: requests,
input tokens and output tokens a minute, each a meter against its limit with the numbers beside it. The headroom says
it in words – Plenty, Near limit, or Limited with a countdown to when the window resets – taken from the fullest of
the three meters. Under the meters sit how many requests were turned away with a 429 in the last hour, and a
sparkline of the last hour's peak use against a dashed line at the limit. The tightest rows come first.

### When to use

- An operations or settings page for teams calling model providers directly, where hitting a limit means failed or
  slow requests.
- Deciding whether to ask a provider for a higher tier, or to spread traffic onto another model.
- A health panel beside a fallback setup, to see why traffic moved.

### When not to use

- Plan usage and credits for a whole account – use [Usage Meter](usage-meter.md).
- Spend against a budget for one run – use [Budget Guard](budget-guard.md).
- Which model a request is routed to, and when it falls back – use [Model Routing](model-routing.md) or [Fallback Chain](fallback-chain.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Sort** `.ui-rlst__sort` – Tightest first or By name, a native select
2. **Row** `.ui-rlst__row` – one provider and model
3. **Model** `.ui-rlst__model` – the model's name, with the provider after it
4. **Tier** `.ui-rlst__tier` – the account's tier with that provider
5. **Headroom** `.ui-rlst__headroom` – a mark and a word: Plenty, Near limit, or Limited with the reset countdown
6. **Meter** `.ui-rlst__meter` – one limit: requests, input tokens or output tokens a minute
7. **429s** `.ui-rlst__throttled` – requests turned away in the last hour
8. **Sparkline** `.ui-rlst__spark` – the last hour's peak use, with the limit as a dashed line and the peak in words

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Meters below 70% use the meter colour; near and over the limit they take the warning and danger
tones, and the headroom badge says so in words with its own mark. Below 520 px the three meters stack.

## Usage

### HTML

```html
<tc-rate-limit-status id="limits" heading="Rate limits"></tc-rate-limit-status>

<script type="module">
  import "@adamstavely/trenchcoat/rate-limit-status";
  import "@adamstavely/trenchcoat/tokens.css";

  const limits = document.querySelector("#limits");
  limits.rows = [
    {
      id: "large-1",
      provider: "Model provider",
      model: "large-1",
      tier: "Tier 3",
      requests: { used: 4620, limit: 5000 },
      inputTokens: { used: 812000, limit: 800000 },
      outputTokens: { used: 96000, limit: 160000 },
      resetAt: Date.now() + 18000,
      throttled: 37,
      history: [0.7, 0.75, 0.82, 0.9, 0.96, 1.02],
    },
    {
      id: "small-2",
      provider: "Model provider",
      model: "small-2",
      tier: "Tier 3",
      requests: { used: 3900, limit: 10000 },
      inputTokens: { used: 1150000, limit: 2000000 },
    },
  ];
  limits.addEventListener("tc-sort-change", (e) => console.log(e.detail.sort));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RateLimitStatus, type RateLimitRow, type RateLimitSort } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Limits({ rows, now }: { rows: RateLimitRow[]; now: number }) {
  const [sort, setSort] = useState<RateLimitSort>("tightest");
  return <RateLimitStatus title="Rate limits" rows={rows} now={now} sort={sort} onSortChange={setSort} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/rate-limit-status";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";

defineProps<{ rows: TcRateLimitStatus["rows"]; labels: TcRateLimitStatus["labels"] }>();
const onSortChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-rate-limit-status :rows="rows" :labels="labels" @tc-sort-change="onSortChange"></tc-rate-limit-status>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RateLimitStatus } from "@adamstavely/trenchcoat/angular/rate-limit-status";
import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";

@Component({
  selector: "app-rate-limit-status-example",
  imports: [RateLimitStatus],
  template: `<tc-rate-limit-status [rows]="rows()" [labels]="labels()" (tc-sort-change)="onSortChange($event)"></tc-rate-limit-status>`,
})
export class RateLimitStatusExample {
  readonly rows = input.required<TcRateLimitStatus["rows"]>();
  readonly labels = input.required<TcRateLimitStatus["labels"]>();
  onSortChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/rate-limit-status";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";

  let { rows, labels }: { rows: TcRateLimitStatus["rows"]; labels: TcRateLimitStatus["labels"] } = $props();
  let el: TcRateLimitStatus;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-sort-change", on);
    return () => el.removeEventListener("tc-sort-change", on);
  });
</script>

<tc-rate-limit-status bind:this={el} {rows} {labels}></tc-rate-limit-status>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Rate limits"` | The heading |
| `description` | `description` | `string` | `""` | A line under the heading, e.g. the window the numbers cover |
| `rows` | – | `RateLimitRow[]` | `[]` | One row per provider and model |
| `sort` | `sort` | `RateLimitSort` | `"tightest"` | The order: the tightest headroom first, or by provider and model. Changed by the user unless a tc-sort-change listener calls preventDefault() |
| `hideSort` | `hide-sort` | `boolean` | `false` | Hides the sort select |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms, for the reset countdown; leave it unset and the element keeps its own clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `labels` | – | `RateLimitStatusLabelsInput` | `{}` | The element's words, merged over defaultRateLimitStatusLabels |
| `ordered` | – | `` | – | The rows in their order: tightest share first, or provider then model |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-sort-change` | – | Yes | The sort was changed ({ sort }: RateLimitSortChange); cancelable – prevented, `sort` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `headroomText(row: RateLimitRow)` | `void` | A row's headroom in words: "Limited – resets in 18 s", "Near limit", "Plenty" |

#### Design tokens it reads (53)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-shadow`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-rlst-tone`, `--tc-rlst-tone-bg`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `rateLimitShare(row: RateLimitRow): void` | The fullest of a row's meters, as a share of its limit (0 when it has none) |
| `rateLimitHeadroom(row: RateLimitRow): RateLimitHeadroom` | Plenty under 70% of the limit, Near limit under 100%, Limited at or over it |
| `rateLimitCountdown(ms: number): void` | "18 s", "2 min 5 s" – the time until a reset |

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
| `rows` | `el.rows = …;` | `<… rows={…} />` | `<tc-rate-limit-status :rows="…">` | `<tc-rate-limit-status [rows]="…">` | `<tc-rate-limit-status {rows}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-rate-limit-status :labels="…">` | `<tc-rate-limit-status [labels]="…">` | `<tc-rate-limit-status {labels}>` |

*Also attributes: `heading`, `description`, `sort`, `hide-sort`, `now`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-sort-change` | Yes | `el.addEventListener("tc-sort-change", (e) => …)` | `ref.current.addEventListener("tc-sort-change", …)` | `@tc-sort-change="…"` | `(tc-sort-change)="…($event)"` | `el.addEventListener("tc-sort-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `sort` itself unless a listener calls `preventDefault()` on `tc-sort-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-rate-limit-status id="rate-limit-status"></tc-rate-limit-status>

<script type="module">
  import "@adamstavely/trenchcoat/rate-limit-status";

  const el = document.querySelector("#rate-limit-status");
  el.addEventListener("tc-sort-change", (e) => {
    e.preventDefault(); // the element keeps its sort…
    if (allowed(e.detail.sort)) el.sort = e.detail.sort; // …until the app sets it
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
import "@adamstavely/trenchcoat/rate-limit-status";
import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";

const props = defineProps<{ initial: TcRateLimitStatus["sort"] }>();
const sort = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSortChange = (e: CustomEvent<{ sort: TcRateLimitStatus["sort"] }>) => {
  e.preventDefault();
  sort.value = e.detail.sort;
};
</script>

<template>
  <tc-rate-limit-status :sort="sort" @tc-sort-change="onSortChange"></tc-rate-limit-status>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RateLimitStatus } from "@adamstavely/trenchcoat/angular/rate-limit-status";
import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";

@Component({
  selector: "app-controlled-rate-limit-status",
  imports: [RateLimitStatus],
  template: `<tc-rate-limit-status [sort]="sort()" (tc-sort-change)="onSortChange($event)"></tc-rate-limit-status>`,
})
export class ControlledRateLimitStatus {
  readonly initial = input.required<TcRateLimitStatus["sort"]>();
  readonly sort = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSortChange(e: CustomEvent<{ sort: TcRateLimitStatus["sort"] }>) {
    e.preventDefault();
    this.sort.set(e.detail.sort);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/rate-limit-status";
  import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";

  let { initial }: { initial: TcRateLimitStatus["sort"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let sort = $derived(initial);
  let el: TcRateLimitStatus;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      sort = (e as CustomEvent<{ sort: TcRateLimitStatus["sort"] }>).detail.sort;
    };
    el.addEventListener("tc-sort-change", on);
    return () => el.removeEventListener("tc-sort-change", on);
  });
</script>

<tc-rate-limit-status bind:this={el} {sort}></tc-rate-limit-status>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-rate-limit-status")` returns a `TcRateLimitStatus` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";`
- **React / Next.js:** Props: `import type { RateLimitStatusProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RateLimitStatus>`. The element class, for refs: `import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRateLimitStatus["rows"]` with `import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";`
- **Angular:** The directive types the template: `[rows]` takes `TcRateLimitStatus["rows"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRateLimitStatus } from "@adamstavely/trenchcoat/rate-limit-status";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `sort` | `RateLimitSort` | The order – controlled when given |
| `defaultSort` | `RateLimitSort` | The order on mount, when `sort` isn't controlled |
| `onSortChange` | `(sort: RateLimitSort) => void` | Called with the order the user picked |

*Renamed or hidden on the wrapper: `heading`, `sort`, `children`*

## Accessibility

### Keyboard

The rows aren't interactive; the sort select is the one tab stop.

| Key | What it does |
|---|---|
| Tab | Moves to the sort select |
| ↑ / ↓ | In the select, changes the order |

### Screen readers

The rows are a list named by the heading. Each meter is a `meter` named by its label – “Input tokens / min” – with a
value text that reads the numbers in full: “812,000 of 800,000 input tokens a minute, 101%”. The headroom is text, so
“Limited – resets in 18 s” is read as it is; the countdown doesn't announce itself every second. The sparkline is
hidden and its peak is said in words: “Peak in the last hour: 102% of the limit”. Status is never colour alone – each
headroom has a mark (a tick, a warning sign or a no-entry sign) and a word.

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
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/util | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 16.9 KB | 5.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.5 KB** | **8.0 KB** |
| With Lit – the first component on a page | 46.3 KB | 15.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 121 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of rows replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 29 ms | rows: first render, 3,419 nodes; update 8.6 ms |
| 1,000 items | 201 ms | rows: first render, 34,019 nodes; update 66 ms |

1,000 items of rows: 201 ms. It renders every item, so a first render passes 50 ms (a long task) at about 250 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the model as the provider does (“large-1”), and the provider plainly.
- Give `resetAt` for limited rows, so the countdown can say when it clears.
- Keep the history to the last hour, one point a minute; values are shares of the tightest limit, so 1 is the line.

## Do and don't

### Do

- Pass `now` when the page already keeps a clock, so the countdown matches the rest of the page.
- Leave the default sort on, so the rows that need attention come first.
- Show the tier, so people know what raising it would mean.

### Don't

- Don't show limits you don't enforce – leave that metric out of the row.
- Don't use the meters for spend; they're about requests and tokens a minute.
- Don't rely on the tones – the headroom words are the message.

## Related

- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Model Routing](model-routing.md) – Routing rules as a route with a fallback chain, target health, breakers and residency, and a route test that lights up the path taken
- [Fallback Chain](fallback-chain.md) – One request finding a model that answers, as a small flow – each model in fallback order, waiting, trying, failed, answered or skipped, with reasons and timings
