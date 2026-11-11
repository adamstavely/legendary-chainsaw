<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Budget Guard

**Agents** · New

Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning

- **Element:** `<tc-budget-guard>`
- **Size:** 10.6 KB gzip · 37.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/budget-guard";` |
| React / Next.js | `import { BudgetGuard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/budget-guard";` · tags starting with tc- are custom elements |
| Angular | `import { BudgetGuard } from "@adamstavely/trenchcoat/angular/budget-guard";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/budget-guard";` |

## Example

The live example is in the gallery at `#/budget-guard`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Spend and token limits for an agent run while it runs. The first limit is the big meter – usually the spend – and
any others sit as thin meters below it, each with a notch where the warning starts. Past `warnAt` the card warns: an
amber note says how much is left and how fast the run is using it (“about 3 min to the cap”), with buttons that raise
the cap right there. At the cap it is a hard stop: the card says the run stopped, tells the app to halt it, and offers
the same raise so the run can pick up where it left off. The card reads no clock – the app passes in the numbers and
the run's status.

### When to use

- Beside a live agent run that costs money or tokens, where someone needs to see the spend and be able to stop it.
- When runs should stop at a hard limit, but a person can decide to let one go further.
- Several limits on one run – spend, tokens, tool calls – with one of them clearly the one that matters most.

### When not to use

- Plan or account usage over a billing period – this is for one live run. Use [Breakdown Chart](breakdown-chart.md) to show where usage
  went.
- How full a model's context window is – use [Context Window](context-window.md).
- Where the time and cost of each step went after the fact – use [Trace Waterfall](trace-waterfall.md).
- Asking a person to approve one action before the agent takes it – use [Approval Card](approval-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Amount** `.ui-bgd__figure` – the first limit's used amount against its cap, and the percentage
3. **Meter** `.ui-bgd__bar` – the first limit's bar, with the notch where the warning starts
4. **Other limits** `.ui-bgd__limits` – thin meters for the rest
5. **Note** `.ui-bgd__fold` – the warning or the stop, with the buttons that raise the cap
6. **Footer** `.ui-bgd__foot` – what's left, and Stop run or End run

## Looks

Standard sets the header on the gray tray above a white card, with the footer on the tray below it. Clean is one
white card with a shadow, the header its first row and a little more room in the amount. Both show the same meters, warning and stop.

## Usage

### HTML

```html
<tc-budget-guard id="budget" task="Research agent · competitor pricing"></tc-budget-guard>

<script type="module">
  import "@adamstavely/trenchcoat/budget-guard";
  import "@adamstavely/trenchcoat/tokens.css";

  const guard = document.querySelector("#budget");
  guard.limits = [
    { id: "spend", label: "Spend", kind: "currency", used: 3.62, cap: 5, rate: 0.42 },
    { id: "tokens", label: "Tokens", kind: "tokens", used: 181400, cap: 300000 },
  ];
  guard.addEventListener("tc-cap-reach", (e) => console.log("halt the run:", e.detail.id));
  guard.addEventListener("tc-stop", () => (guard.status = "done"));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { BudgetGuard, type BudgetLimit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start: BudgetLimit[] = [
  { id: "spend", label: "Spend", kind: "currency", used: 3.62, cap: 5, rate: 0.42 },
  { id: "tokens", label: "Tokens", kind: "tokens", used: 181_400, cap: 300_000 },
];

export function RunBudget() {
  const [limits, setLimits] = useState(start);
  const [halted, setHalted] = useState(false);
  return (
    <BudgetGuard
      title="Run budget"
      task="Research agent · competitor pricing"
      status={halted ? "paused" : "running"}
      limits={limits}
      onLimitsChange={setLimits}
      onRaise={() => setHalted(false)}
      onCapReach={() => setHalted(true)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/budget-guard";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";

defineProps<{ limits: TcBudgetGuard["limits"] }>();
const onLimitsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-budget-guard :limits="limits" @tc-limits-change="onLimitsChange"></tc-budget-guard>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BudgetGuard } from "@adamstavely/trenchcoat/angular/budget-guard";
import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";

@Component({
  selector: "app-budget-guard-example",
  imports: [BudgetGuard],
  template: `<tc-budget-guard [limits]="limits()" (tc-limits-change)="onLimitsChange($event)"></tc-budget-guard>`,
})
export class BudgetGuardExample {
  readonly limits = input.required<TcBudgetGuard["limits"]>();
  onLimitsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/budget-guard";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";

  let { limits }: { limits: TcBudgetGuard["limits"] } = $props();
  let el: TcBudgetGuard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-limits-change", on);
    return () => el.removeEventListener("tc-limits-change", on);
  });
</script>

<tc-budget-guard bind:this={el} {limits}></tc-budget-guard>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `limits` | – | `BudgetLimit[]` | `[]` | The limits – the first one is the big meter. Raises apply unless a tc-limits-change listener calls preventDefault() |
| `status` | `status` | `BudgetGuardStatus` | `"running"` | The run: "running", "paused" or "done" – always set by the app |
| `heading` | `heading` | `string` | `"Run budget"` | The heading, and the region's name |
| `task` | `task` | `string` | `""` | What runs, a quiet line under the heading |
| `warnAt` | `warn-at` | `number` | `0.8` | Share of a cap from which the card warns (0–1) |
| `currency` | `currency` | `string` | `"USD"` | Currency of "currency" limits, an ISO 4217 code |
| `locale` | `locale` | `string` | `"en-US"` | Locale for numbers and money |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-limits-change` | – | Yes | A cap was raised (detail: { limits: BudgetLimit[], id: string, cap: number, previous: number }); cancelable |
| `tc-cap-reach` | – | No | A limit reached its cap – halt the run (detail: { id: string, limit: BudgetLimit }) |
| `tc-stop` | – | No | "Stop run" or "End run" pressed (detail: { state: "ok" \| "warn" \| "stop" }) |

#### Design tokens it reads (89)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-4xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-h-hero`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `limits` | `el.limits = …;` | `<… limits={…} />` | `<tc-budget-guard :limits="…">` | `<tc-budget-guard [limits]="…">` | `<tc-budget-guard {limits}>` |

*Also attributes: `status`, `heading`, `task`, `warn-at`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-limits-change` | Yes | `el.addEventListener("tc-limits-change", (e) => …)` | `onRaise={…}` | `@tc-limits-change="…"` | `(tc-limits-change)="…($event)"` | `el.addEventListener("tc-limits-change", …)` |
| `tc-cap-reach` | No | `el.addEventListener("tc-cap-reach", (e) => …)` | `onCapReach={…}` | `@tc-cap-reach="…"` | `(tc-cap-reach)="…($event)"` | `el.addEventListener("tc-cap-reach", …)` |
| `tc-stop` | No | `el.addEventListener("tc-stop", (e) => …)` | `onStop={…}` | `@tc-stop="…"` | `(tc-stop)="…($event)"` | `el.addEventListener("tc-stop", …)` |

### Controlled

The element changes `limits` itself unless a listener calls `preventDefault()` on `tc-limits-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-budget-guard id="budget-guard"></tc-budget-guard>

<script type="module">
  import "@adamstavely/trenchcoat/budget-guard";

  const el = document.querySelector("#budget-guard");
  el.addEventListener("tc-limits-change", (e) => {
    e.preventDefault(); // the element keeps its limits…
    if (allowed(e.detail.limits)) el.limits = e.detail.limits; // …until the app sets it
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
import "@adamstavely/trenchcoat/budget-guard";
import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";

const props = defineProps<{ initial: TcBudgetGuard["limits"] }>();
const limits = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onLimitsChange = (e: CustomEvent<{ limits: TcBudgetGuard["limits"] }>) => {
  e.preventDefault();
  limits.value = e.detail.limits;
};
</script>

<template>
  <tc-budget-guard :limits="limits" @tc-limits-change="onLimitsChange"></tc-budget-guard>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BudgetGuard } from "@adamstavely/trenchcoat/angular/budget-guard";
import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";

@Component({
  selector: "app-controlled-budget-guard",
  imports: [BudgetGuard],
  template: `<tc-budget-guard [limits]="limits()" (tc-limits-change)="onLimitsChange($event)"></tc-budget-guard>`,
})
export class ControlledBudgetGuard {
  readonly initial = input.required<TcBudgetGuard["limits"]>();
  readonly limits = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onLimitsChange(e: CustomEvent<{ limits: TcBudgetGuard["limits"] }>) {
    e.preventDefault();
    this.limits.set(e.detail.limits);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/budget-guard";
  import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";

  let { initial }: { initial: TcBudgetGuard["limits"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let limits = $derived(initial);
  let el: TcBudgetGuard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      limits = (e as CustomEvent<{ limits: TcBudgetGuard["limits"] }>).detail.limits;
    };
    el.addEventListener("tc-limits-change", on);
    return () => el.removeEventListener("tc-limits-change", on);
  });
</script>

<tc-budget-guard bind:this={el} {limits}></tc-budget-guard>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-budget-guard")` returns a `TcBudgetGuard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";`
- **React / Next.js:** Props: `import type { BudgetGuardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BudgetGuard>`. The element class, for refs: `import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBudgetGuard["limits"]` with `import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";`
- **Angular:** The directive types the template: `[limits]` takes `TcBudgetGuard["limits"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBudgetGuard } from "@adamstavely/trenchcoat/budget-guard";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `limits` | `BudgetLimit[]` | The limits – the first one is the big meter. Controlled when defined (a live run passes its numbers in): pair with onLimitsChange or onRaise and pass the raised cap back. Otherwise the component keeps them, starting from `defaultLimits` |
| `defaultLimits` | `BudgetLimit[]` | Initial limits when uncontrolled |
| `onLimitsChange` | `(limits: BudgetLimit[]) => void` | Every raise, with all the limits after it |
| `onRaise` | `(id: string, cap: number, previous: number) => void` | A cap raised from the warning or the stop: the limit's id, its new cap and the one before |
| `onCapReach` | `(id: string, limit: BudgetLimit) => void` | A limit reached its cap – halt the run |
| `onStop` | `(state: BudgetGuardState) => void` | "Stop run" / "End run" pressed |
| `title` | `string` | The heading, and the region's name |

*Renamed or hidden on the wrapper: `limits`, `heading`*

## Accessibility

Follows the WAI-ARIA [Meter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the raise buttons and Stop run / End run |
| Enter / Space | Raises the cap to the focused amount, or stops the run |

After a raise closes the note, focus moves to the status line in the footer rather than back to the page.

### Screen readers

The card is a `region`, named by its heading. Each limit is a `meter` named by its label, with a value such as
“$4.10 of $5.00, close to the cap”. Crossing into the warning is said once in a polite live region (“Spend at 80% of
the $5.00 cap.”); reaching a cap is an alert (“Run stopped: spend reached the $5.00 cap.”). Each raise button names
its result (“Raise the spend cap to $7.50”), and a raise is confirmed (“Spend cap raised to $7.50 – the run can go
on.”).

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
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 29.4 KB | 8.2 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| `src/internal/ease.ts` · Dependency | 0.0 KB | – |
| **Added to a page that already has Lit** | **37.8 KB** | **10.6 KB** |
| With Lit – the first component on a page | 60.5 KB | 18.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.9 ms** | the gallery demo's data, 46 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of limits replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | limits: first render, 725 nodes; update 2.2 ms |
| 1,000 items | 48 ms | limits: first render, 7,025 nodes; update 18 ms |

1,000 items of limits: 48 ms, 7,025 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Put the most expensive limit first – it gets the big meter and the percentage pill.
- Keep labels to one word or two: “Spend”, “Tokens”, “Tool calls”. They are also read lower-case in sentences (“the
  spend cap”).
- Name the run in `task`, so people with several runs open know which one this is.
- Pass `rate` (per minute) on the limits that move, so the warning can say how long is left.

## Do and don't

### Do

- Halt the run when `tc-cap-reach` fires, and keep `status` in step with it (“paused” while halted).
- Offer raises that make sense for the run with `raiseBy`; the defaults are half, all and twice the cap, rounded.
- Set `currency` and `locale` for money that isn't US dollars.

### Don't

- Don't use it as a decoration on a finished run – once `status` is “done”, show the total somewhere calmer.
- Don't set `warnAt` so high that the warning and the stop arrive together; 0.8 leaves time to act.
- Don't raise the cap without a person pressing a button – the stop is the point.

## Related

- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Agent Steering](agent-steering.md) – Steer an agent while it works – queue a note for the next step and watch it glide into the plan when the agent picks it up, or interrupt right away
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent

## Changelog

- `tc-budget-guard` – spend and token caps for a live run: a big meter and thin ones, the pace to the cap, a warning with Raise to buttons at `warnAt`, and a hard stop with an alert. `tc-limits-change` (cancelable), `tc-cap-reach` once per cap, `tc-stop`.
