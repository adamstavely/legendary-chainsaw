<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Budget Alerts

**AI configuration** · New

Spend alerts set by dragging markers along the month's budget – spent so far and the forecast hatched beyond it, a line at the budget, each alert a slider ("Alert at $4,000, 80% of budget") moved by pointer or keys, added by clicking the bar, with its channel, recipients and when the forecast crosses it

- **Element:** `<tc-budget-alerts>`
- **Size:** 8.8 KB gzip · 27.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/budget-alerts";` |
| React / Next.js | `import { BudgetAlerts } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/budget-alerts";` · tags starting with tc- are custom elements |
| Angular | `import { BudgetAlerts } from "@adamstavely/trenchcoat/angular/budget-alerts";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/budget-alerts";` |

## Example

The live example is in the gallery at `#/budget-alerts`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Spend alerts set by dragging markers along the month's budget. The bar shows what's spent so far and, hatched beyond
it, the forecast to the month's end, with a line at the budget. Each alert is a marker on the bar at a share of the
budget – drag it, or focus it and use the arrow keys, and it reads “Alert at $4,000, 80% of budget”. Clicking the bar
adds an alert there; Add alert adds one at the next round share. Under the bar each alert lists where it goes – email or
chat, and to whom – and when the forecast crosses it: “Forecast crosses 80% around 24 Nov”, or “Already passed”.

### When to use

- A billing or admin page where people set when they hear about the month's AI spend.
- Showing whether this month's forecast will set off an alert, and when.

### When not to use

- Caps that stop spend per member, team or key – use [Spend Limits](spend-limits.md).
- A live run's cap – use [Budget Guard](budget-guard.md).
- Alerts on quality rather than money – use [Quality Alerts](quality-alerts.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Bar** `.ui-bal__bar` – the month's scale; click it to add an alert
2. **Spent** `.ui-bal__spent` – what's spent so far
3. **Forecast** `.ui-bal__forecast` – the hatched stretch to the month-end forecast
4. **Budget line** `.ui-bal__budget`
5. **Marker** `.ui-bal__marker` – an alert, with its share above it
6. **Alert row** `.ui-bal__alert` – amount, share, when the forecast crosses it, channel, recipients and Remove
7. **Add alert** `.ui-bal__add`

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. Markers use `--tc-accent-solid`, and one already passed turns the warning colour. `--tc-bal-bar-h` and
`--tc-bal-marker-w` size the bar and the markers.

## Usage

### HTML

```html
<tc-budget-alerts id="alerts" budget="5000" spent="2140" forecast="5460" currency="USD"></tc-budget-alerts>

<script type="module">
  import "@adamstavely/trenchcoat/budget-alerts";
  import "@adamstavely/trenchcoat/tokens.css";

  const alerts = document.querySelector("#alerts");
  alerts.alerts = [
    { id: "a50", at: 0.5, channel: "email", recipients: ["finance@example.org"] },
    { id: "a80", at: 0.8, channel: "chat", recipients: ["#finance-ops"] },
  ];
  alerts.addEventListener("tc-alerts-change", (e) => console.log(e.detail.change, e.detail.alerts));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { BudgetAlerts, type BudgetAlert } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Alerts() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([{ id: "a80", at: 0.8, channel: "email", recipients: ["finance@example.org"] }]);
  return <BudgetAlerts budget={5000} spent={2140} forecast={5460} alerts={alerts} onAlertsChange={(next) => setAlerts(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/budget-alerts";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";

defineProps<{ alerts: TcBudgetAlerts["alerts"] }>();
const onAlertsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-budget-alerts :alerts="alerts" @tc-alerts-change="onAlertsChange"></tc-budget-alerts>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BudgetAlerts } from "@adamstavely/trenchcoat/angular/budget-alerts";
import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";

@Component({
  selector: "app-budget-alerts-example",
  imports: [BudgetAlerts],
  template: `<tc-budget-alerts [alerts]="alerts()" (tc-alerts-change)="onAlertsChange($event)"></tc-budget-alerts>`,
})
export class BudgetAlertsExample {
  readonly alerts = input.required<TcBudgetAlerts["alerts"]>();
  onAlertsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/budget-alerts";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";

  let { alerts }: { alerts: TcBudgetAlerts["alerts"] } = $props();
  let el: TcBudgetAlerts;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-alerts-change", on);
    return () => el.removeEventListener("tc-alerts-change", on);
  });
</script>

<tc-budget-alerts bind:this={el} {alerts}></tc-budget-alerts>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Budget alerts"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `budget` | `budget` | `number` | `0` | The month's budget, in `currency` |
| `spent` | `spent` | `number` | `0` | Spent so far this month, in `currency` |
| `forecast` | `forecast` | `number \| undefined` | `undefined` | The forecast for the month's end, in `currency`; unset leaves the hatched forecast out |
| `alerts` | – | `BudgetAlert[]` | `[]` | The alerts. Changed by dragging, the keys and the fields unless a tc-alerts-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | Now, as epoch ms; with `end` it dates the forecast's crossings |
| `end` | `end` | `number \| undefined` | `undefined` | The period's last moment, as epoch ms |
| `currency` | `currency` | `string` | `"USD"` | The currency, an ISO 4217 code |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "en-GB"; by default the browser's |
| `timeZone` | `time-zone` | `string \| undefined` | `undefined` | The time zone the crossing dates are given in, e.g. "Europe/London"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-alerts-change` | – | Yes | An alert was moved, added or removed, or its channel or recipients changed ({ alerts, change, id }: BudgetAlertsChange); cancelable – prevented, `alerts` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `valueText(a: Pick<BudgetAlert, "at">)` | `void` | "Alert at $4,000, 80% of budget" |
| `crossingWords(a: Pick<BudgetAlert, "at">)` | `void` | "Forecast crosses 80% around 24 Nov", "Already passed", or "" when it can't be worked out or won't happen |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-bal-bar-h` | `14px` | both |
| `--tc-bal-marker-w` | `14px` | both |

#### Design tokens it reads (57)

`--tc-accent-solid`, `--tc-action-ghost-bg-hover`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-solid`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `BUDGET_ALERT_MIN: number` | The lowest and highest an alert may be set, as shares of the budget |
| `budgetCrossing(amount: number, { spent, forecast, now, end }: { spent: number; forecast: number; now: number; end: number }): number \| null` | When spend reaches `amount`, drawing a straight line from `spent` at `now` to `forecast` at `end`; null when it never does within the period, and `now` when it already has |

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
| `alerts` | `el.alerts = …;` | `<… alerts={…} />` | `<tc-budget-alerts :alerts="…">` | `<tc-budget-alerts [alerts]="…">` | `<tc-budget-alerts {alerts}>` |

*Also attributes: `heading`, `description`, `budget`, `spent`, `forecast`, `now`, `end`, `currency` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-alerts-change` | Yes | `el.addEventListener("tc-alerts-change", (e) => …)` | `ref.current.addEventListener("tc-alerts-change", …)` | `@tc-alerts-change="…"` | `(tc-alerts-change)="…($event)"` | `el.addEventListener("tc-alerts-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `alerts` itself unless a listener calls `preventDefault()` on `tc-alerts-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-budget-alerts id="budget-alerts"></tc-budget-alerts>

<script type="module">
  import "@adamstavely/trenchcoat/budget-alerts";

  const el = document.querySelector("#budget-alerts");
  el.addEventListener("tc-alerts-change", (e) => {
    e.preventDefault(); // the element keeps its alerts…
    if (allowed(e.detail.alerts)) el.alerts = e.detail.alerts; // …until the app sets it
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
import "@adamstavely/trenchcoat/budget-alerts";
import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";

const props = defineProps<{ initial: TcBudgetAlerts["alerts"] }>();
const alerts = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onAlertsChange = (e: CustomEvent<{ alerts: TcBudgetAlerts["alerts"] }>) => {
  e.preventDefault();
  alerts.value = e.detail.alerts;
};
</script>

<template>
  <tc-budget-alerts :alerts="alerts" @tc-alerts-change="onAlertsChange"></tc-budget-alerts>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BudgetAlerts } from "@adamstavely/trenchcoat/angular/budget-alerts";
import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";

@Component({
  selector: "app-controlled-budget-alerts",
  imports: [BudgetAlerts],
  template: `<tc-budget-alerts [alerts]="alerts()" (tc-alerts-change)="onAlertsChange($event)"></tc-budget-alerts>`,
})
export class ControlledBudgetAlerts {
  readonly initial = input.required<TcBudgetAlerts["alerts"]>();
  readonly alerts = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onAlertsChange(e: CustomEvent<{ alerts: TcBudgetAlerts["alerts"] }>) {
    e.preventDefault();
    this.alerts.set(e.detail.alerts);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/budget-alerts";
  import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";

  let { initial }: { initial: TcBudgetAlerts["alerts"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let alerts = $derived(initial);
  let el: TcBudgetAlerts;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      alerts = (e as CustomEvent<{ alerts: TcBudgetAlerts["alerts"] }>).detail.alerts;
    };
    el.addEventListener("tc-alerts-change", on);
    return () => el.removeEventListener("tc-alerts-change", on);
  });
</script>

<tc-budget-alerts bind:this={el} {alerts}></tc-budget-alerts>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-budget-alerts")` returns a `TcBudgetAlerts` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";`
- **React / Next.js:** Props: `import type { BudgetAlertsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BudgetAlerts>`. The element class, for refs: `import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBudgetAlerts["alerts"]` with `import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";`
- **Angular:** The directive types the template: `[alerts]` takes `TcBudgetAlerts["alerts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBudgetAlerts } from "@adamstavely/trenchcoat/budget-alerts";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `alerts` | `BudgetAlert[]` | The alerts – controlled when given |
| `defaultAlerts` | `BudgetAlert[]` | The alerts on mount when `alerts` isn't controlled |
| `onAlertsChange` | `(alerts: BudgetAlert[], change: BudgetAlertsChange["change"], id: string) => void` | An alert was moved, added or removed, or its channel or recipients changed |

*Renamed or hidden on the wrapper: `heading`, `alerts`, `children`*

## Accessibility

### Keyboard

Each marker is a slider and a tab stop.

| Key | What it does |
|---|---|
| ← / → (↓ / ↑) | Moves the alert by 1% of the budget |
| Shift + arrow, Page Up / Page Down | Moves it by 10% |
| Home / End | Moves it to 1% or 150% |
| Delete / Backspace | Removes the alert |
| Tab | Moves between the markers, each alert's fields, and Add alert |

### Screen readers

Each marker is a `slider` named “Alert at 80%”, with value text “Alert at $4,000, 80% of budget” and a description of
its keys. The bar's drawing is otherwise decorative; the header says spent of the budget and the forecast in words.
Each alert row's select and recipients field have labels naming the alert. Moving with the keys, adding and removing
are confirmed in a polite status message.

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
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 20.1 KB | 6.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.5 KB** | **8.8 KB** |
| With Lit – the first component on a page | 49.4 KB | 16.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.4 ms** | the gallery demo's data, 87 DOM nodes – to layout, median of 7 |
| Typical update | **1.2 ms** | one item of alerts replaced |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |
| 100 items | 26 ms | alerts: first render, 1,736 nodes; update 15 ms |
| 1,000 items | 226 ms | alerts: first render, 17,036 nodes; update 123 ms |

1,000 items of alerts: 226 ms. It renders every item, so a first render passes 50 ms (a long task) at about 220 items – page or filter longer lists.

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

- Pass `now` and `end` (epoch ms) for the dates the forecast crosses each alert; the element never reads the clock.
- Use the forecast your billing already makes; the element draws a straight line from today's spend to it.

## Do and don't

### Do

- Keep a few alerts – at half, most and all of the budget.
- Send the last alert to someone who can act on it.

### Don't

- Don't set alerts past 150% – set a cap in `spend-limits` instead.

## Related

- [Spend Limits](spend-limits.md) – Spend caps per member, team or API key – the workspace default on top, each row's spent of its cap in words and a meter, over-limit rows first, the cap edited in place, Block / Warn / Notify at the cap, Remove and Add limit
- [Spend Breakdown](spend-breakdown.md) – AI spend split by model, feature, user or team for a period – a ranked list with each slice's cost, share and change on the period before in words, a stacked bar per day, or a table, with picking a slice to filter and the total in the header
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Quality Alerts](quality-alerts.md) – Alert rules that read as sentences – "Alert #ops-quality when Correctness drops below 3.5 over 24 hours on at least 50 chats", each slot a labelled field, with an on/off switch, when it last fired, how often it would have fired in the last 30 days, and problems in words
