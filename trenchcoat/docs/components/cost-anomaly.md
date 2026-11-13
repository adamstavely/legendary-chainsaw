<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Cost Anomaly

**Data & charts** · New

One spend spike and what caused it – how far over expected and when, daily spend with the normal range as a band and the spike marked (or as a table), what drove the extra cost with each one's share, the costliest runs as evidence, and Set a limit, Investigate and Mark as expected with Undo

- **Element:** `<tc-cost-anomaly>`
- **Size:** 8.4 KB gzip · 27.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/cost-anomaly";` |
| React / Next.js | `import { CostAnomaly } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/cost-anomaly";` · tags starting with tc- are custom elements |
| Angular | `import { CostAnomaly } from "@adamstavely/trenchcoat/angular/cost-anomaly";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/cost-anomaly";` |

## Example

The live example is in the gallery at `#/cost-anomaly`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One spend spike and what caused it. A headline says how far over expected it went – “$1,240 over expected on 14 Nov”
– and a second line puts it in numbers: “Spent $1,640 against an expected $400 – 310% above”. Under it, a small chart
of daily spend: bars, the normal range as a band and the expected spend as a dashed line, with the spike's bar marked,
summed up in a sentence and switchable to a table. Then what drove the extra cost, the likeliest first, each with its
share; the evidence the page supplies, such as the costliest runs during the spike; and Set a limit, Investigate and
Mark as expected, with Undo.

### When to use

- An alert or admin page, when spend jumps well outside its usual range.
- A spike someone has to look at and either act on or explain.

### When not to use

- Who spends the most over a period – use [Top Spenders](top-spenders.md).
- Capping a live run's spend – use [Budget Guard](budget-guard.md).
- Where one run's time and money went – use [Trace Waterfall](trace-waterfall.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Status** `.ui-coa__status` – Open or Expected, as a mark and a word
2. **Headline** `.ui-coa__headline` – how far over expected, and when
3. **Chart** `.ui-coa__chart` – daily spend, the normal band and expected line, the spike's bar marked
4. **Caption** `.ui-coa__caption` – the chart in a sentence, and Show as table
5. **Causes** `.ui-coa__causes` – what drove it, each with its share of the extra cost
6. **Evidence** `.ui-coa__evidence` – runs or requests during the spike, as buttons
7. **Actions** `.ui-coa__actions` – Set a limit, Investigate and Mark as expected, or Undo

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The spike's bar and the cause bars use `--tc-status-danger-solid`; the other days are
`--tc-chart-neutral` and the normal range `--tc-fill-subtle`. Once marked as expected, the status pill goes quiet.

## Usage

### HTML

```html
<tc-cost-anomaly id="spike" locale="en-US"></tc-cost-anomaly>

<script type="module">
  import "@adamstavely/trenchcoat/cost-anomaly";
  import "@adamstavely/trenchcoat/tokens.css";

  const spike = document.querySelector("#spike");
  const day = 86400000;
  const start = Date.UTC(2026, 10, 8);
  spike.days = [410, 395, 420, 388, 402, 1640].map((spend, i) => ({ date: start + i * day, spend, expected: 400, low: 340, high: 460 }));
  spike.causes = [
    { id: "invoice", kind: "agent", name: "Invoice matcher", share: 0.78, note: "Retried every invoice after a parser change" },
    { id: "large-1", kind: "model", name: "large-1", share: 0.22 },
  ];
  spike.evidence = [{ id: "r1", label: "Run 8f2c · Invoice matcher", detail: "412k tokens · 6 retries", cost: 38 }];
  spike.addEventListener("tc-set-limit", (e) => console.log("limit", e.detail.target?.name));
</script>
```

### React / Next.js

```tsx
import { CostAnomaly, type AnomalyCause, type CostDay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start = Date.UTC(2026, 10, 8);
const days: CostDay[] = [410, 395, 420, 388, 402, 1640].map((spend, i) => ({ date: start + i * 86400000, spend, expected: 400, low: 340, high: 460 }));
const causes: AnomalyCause[] = [{ id: "invoice", kind: "agent", name: "Invoice matcher", share: 0.78 }];

export function Spike() {
  return <CostAnomaly days={days} causes={causes} onSetLimit={(target) => console.log(target?.name)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/cost-anomaly";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";

defineProps<{ days: TcCostAnomaly["days"]; causes: TcCostAnomaly["causes"] }>();
const onStatusChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-cost-anomaly :days="days" :causes="causes" @tc-status-change="onStatusChange"></tc-cost-anomaly>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CostAnomaly } from "@adamstavely/trenchcoat/angular/cost-anomaly";
import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";

@Component({
  selector: "app-cost-anomaly-example",
  imports: [CostAnomaly],
  template: `<tc-cost-anomaly [days]="days()" [causes]="causes()" (tc-status-change)="onStatusChange($event)"></tc-cost-anomaly>`,
})
export class CostAnomalyExample {
  readonly days = input.required<TcCostAnomaly["days"]>();
  readonly causes = input.required<TcCostAnomaly["causes"]>();
  onStatusChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cost-anomaly";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";

  let { days, causes }: { days: TcCostAnomaly["days"]; causes: TcCostAnomaly["causes"] } = $props();
  let el: TcCostAnomaly;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-status-change", on);
    return () => el.removeEventListener("tc-status-change", on);
  });
</script>

<tc-cost-anomaly bind:this={el} {days} {causes}></tc-cost-anomaly>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Cost spike"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading, e.g. the workspace |
| `days` | – | `CostDay[]` | `[]` | Daily spend around the spike, oldest first |
| `spike` | `spike` | `number \| undefined` | `undefined` | The spike's day, epoch ms; by default the day furthest above what was expected |
| `causes` | – | `AnomalyCause[]` | `[]` | What drove the extra cost, the likeliest first |
| `evidence` | – | `AnomalyEvidence[]` | `[]` | The costliest runs or requests during the spike |
| `status` | `status` | `AnomalyStatus` | `"open"` | "open", or "expected" once marked. Changed by Mark as expected and Undo unless a tc-status-change listener calls preventDefault() |
| `currency` | `currency` | `string` | `"USD"` | The spend's currency, an ISO 4217 code |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "en-GB"; by default the browser's |
| `timeZone` | `time-zone` | `string` | `"UTC"` | The time zone the days are counted in |
| `causeLabels` | – | `Partial<Record<AnomalyCauseKind, string>>` | `{}` | The words for each kind of cause, merged over defaultAnomalyCauseLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-status-change` | – | Yes | Marked as expected, or back to open ({ status }: AnomalyStatusChange); cancelable – prevented, `status` stays as it was |
| `tc-set-limit` | – | No | Set a limit was pressed ({ target }: AnomalyTarget) |
| `tc-investigate` | – | No | Investigate was pressed ({ target }: AnomalyTarget) |
| `tc-evidence-open` | – | No | An evidence row was opened ({ id, evidence }: AnomalyEvidenceOpen) |

#### Design tokens it reads (50)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-neutral`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultAnomalyCauseLabels: Record<AnomalyCauseKind, string>` | The words for each kind of cause |
| `anomalySpike(days: CostDay[], at?: number): void` | The spike: the given day, or the day furthest above what was expected |

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
| `days` | `el.days = …;` | `<… days={…} />` | `<tc-cost-anomaly :days="…">` | `<tc-cost-anomaly [days]="…">` | `<tc-cost-anomaly {days}>` |
| `causes` | `el.causes = …;` | `<… causes={…} />` | `<tc-cost-anomaly :causes="…">` | `<tc-cost-anomaly [causes]="…">` | `<tc-cost-anomaly {causes}>` |
| `evidence` | `el.evidence = …;` | `<… evidence={…} />` | `<tc-cost-anomaly :evidence="…">` | `<tc-cost-anomaly [evidence]="…">` | `<tc-cost-anomaly {evidence}>` |
| `causeLabels` | `el.causeLabels = …;` | `<… causeLabels={…} />` | `<tc-cost-anomaly :causeLabels="…">` | `<tc-cost-anomaly [causeLabels]="…">` | `<tc-cost-anomaly {causeLabels}>` |

*Also attributes: `heading`, `description`, `spike`, `status`, `currency`, `locale`, `time-zone` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-status-change` | Yes | `el.addEventListener("tc-status-change", (e) => …)` | `ref.current.addEventListener("tc-status-change", …)` | `@tc-status-change="…"` | `(tc-status-change)="…($event)"` | `el.addEventListener("tc-status-change", …)` |
| `tc-set-limit` | No | `el.addEventListener("tc-set-limit", (e) => …)` | `onSetLimit={…}` | `@tc-set-limit="…"` | `(tc-set-limit)="…($event)"` | `el.addEventListener("tc-set-limit", …)` |
| `tc-investigate` | No | `el.addEventListener("tc-investigate", (e) => …)` | `onInvestigate={…}` | `@tc-investigate="…"` | `(tc-investigate)="…($event)"` | `el.addEventListener("tc-investigate", …)` |
| `tc-evidence-open` | No | `el.addEventListener("tc-evidence-open", (e) => …)` | `onEvidenceOpen={…}` | `@tc-evidence-open="…"` | `(tc-evidence-open)="…($event)"` | `el.addEventListener("tc-evidence-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `status` itself unless a listener calls `preventDefault()` on `tc-status-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-cost-anomaly id="cost-anomaly"></tc-cost-anomaly>

<script type="module">
  import "@adamstavely/trenchcoat/cost-anomaly";

  const el = document.querySelector("#cost-anomaly");
  el.addEventListener("tc-status-change", (e) => {
    e.preventDefault(); // the element keeps its status…
    if (allowed(e.detail.status)) el.status = e.detail.status; // …until the app sets it
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
import "@adamstavely/trenchcoat/cost-anomaly";
import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";

const props = defineProps<{ initial: TcCostAnomaly["status"] }>();
const status = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStatusChange = (e: CustomEvent<{ status: TcCostAnomaly["status"] }>) => {
  e.preventDefault();
  status.value = e.detail.status;
};
</script>

<template>
  <tc-cost-anomaly :status="status" @tc-status-change="onStatusChange"></tc-cost-anomaly>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CostAnomaly } from "@adamstavely/trenchcoat/angular/cost-anomaly";
import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";

@Component({
  selector: "app-controlled-cost-anomaly",
  imports: [CostAnomaly],
  template: `<tc-cost-anomaly [status]="status()" (tc-status-change)="onStatusChange($event)"></tc-cost-anomaly>`,
})
export class ControlledCostAnomaly {
  readonly initial = input.required<TcCostAnomaly["status"]>();
  readonly status = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStatusChange(e: CustomEvent<{ status: TcCostAnomaly["status"] }>) {
    e.preventDefault();
    this.status.set(e.detail.status);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cost-anomaly";
  import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";

  let { initial }: { initial: TcCostAnomaly["status"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let status = $derived(initial);
  let el: TcCostAnomaly;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      status = (e as CustomEvent<{ status: TcCostAnomaly["status"] }>).detail.status;
    };
    el.addEventListener("tc-status-change", on);
    return () => el.removeEventListener("tc-status-change", on);
  });
</script>

<tc-cost-anomaly bind:this={el} {status}></tc-cost-anomaly>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-cost-anomaly")` returns a `TcCostAnomaly` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";`
- **React / Next.js:** Props: `import type { CostAnomalyProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CostAnomaly>`. The element class, for refs: `import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCostAnomaly["days"]` with `import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";`
- **Angular:** The directive types the template: `[days]` takes `TcCostAnomaly["days"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCostAnomaly } from "@adamstavely/trenchcoat/cost-anomaly";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `status` | `AnomalyStatus` | "open" or "expected" – controlled when given |
| `defaultStatus` | `AnomalyStatus` | The status on mount, when `status` isn't controlled |
| `onStatusChange` | `(status: AnomalyStatus) => void` | Marked as expected, or back to open |
| `onSetLimit` | `(target: AnomalyCause \| null) => void` | Set a limit was pressed, for the likely cause |
| `onInvestigate` | `(target: AnomalyCause \| null) => void` | Investigate was pressed, for the likely cause |
| `onEvidenceOpen` | `(id: string, evidence: AnomalyEvidence) => void` | An evidence row was opened |

*Renamed or hidden on the wrapper: `heading`, `status`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Show as table, the evidence rows and the actions |
| Enter / Space | Presses the focused button |

After Mark as expected, focus moves to Undo; after Undo, back to Mark as expected.

### Screen readers

The chart is hidden; its caption says what it shows: “Daily spend from 1 Nov to 14 Nov. Usually $340–$470 a day; on 14
Nov it was $1,640.” Show as table is a toggle button (`aria-pressed`) that puts a real table with a caption in the
chart's place. Causes and evidence are lists under their own headings. Set a limit adds the cause's name for screen
readers – “Set a limit on Invoice matcher”. A status change is confirmed politely: “Marked as expected”.

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
| **This component alone** | 20.2 KB | 6.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.9 KB** | **8.4 KB** |
| With Lit – the first component on a page | 47.5 KB | 14.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 97 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of days replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.0 ms | days: first render, 183 nodes; update 1.0 ms |
| 1,000 items | 11 ms | days: first render, 1,083 nodes; update 2.3 ms |

1,000 items of days: 11 ms, 1,083 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Give two weeks or so of `days` around the spike, each with `low` and `high` for the band, or `expected` alone.
- Put the likeliest cause first; shares are of the extra cost, not the whole day's.
- Keep evidence to the few runs or requests that explain it, costliest first.

## Do and don't

### Do

- Say why in a cause's `note` – “Retried every invoice up to 6 times after Thursday's parser change”.
- Let Mark as expected record who decided and why, on your side.

### Don't

- Don't show a spike without the normal range – the band is what makes it read as a spike.
- Don't use it for slow drift; it's for one day or a few.

## Related

- [Top Spenders](top-spenders.md) – Who is behind most of the AI spend, ranked – members, teams, API keys and agents with their share as a bar, the amount, the change on the previous period in words ("Up 42%"), the model they used most and a daily sparkline; kind chips, the long tail folded into "and 38 others – $1,204", and a row that opens
- [Seat Usage](seat-usage.md) – Seats paid for against seats used – "112 of 150 seats used · 34 idle", one bar of active, idle and unassigned seats with their cost, a breakdown by plan or team, and idle members with when each was last active, to tick and reclaim after a confirmation that says who loses access
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
