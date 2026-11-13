<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Spend Limits

**AI configuration** · New

Spend caps per member, team or API key – the workspace default on top, each row's spent of its cap in words and a meter, over-limit rows first, the cap edited in place, Block / Warn / Notify at the cap, Remove and Add limit

- **Element:** `<tc-spend-limits>`
- **Size:** 8.6 KB gzip · 27.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/spend-limits";` |
| React / Next.js | `import { SpendLimits } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/spend-limits";` · tags starting with tc- are custom elements |
| Angular | `import { SpendLimits } from "@adamstavely/trenchcoat/angular/spend-limits";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/spend-limits";` |

## Example

The live example is in the gallery at `#/spend-limits`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Spend caps per member, team or API key. The workspace's default cap – what every member gets unless a row says
otherwise – sits at the top. Under it each limit is a row: who or what it's for, spent of the cap in words and as a bar
(“$1,640 of $2,000 a month, 82%”), the period, and what happens at the cap – Block, Warn or Notify. Rows over their cap
come first, say “Over limit” and by how much. The cap is edited in place, the action is a select, Remove takes a limit
away, and Add limit picks a kind and a member, team or key from the page's list.

### When to use

- An admin page that sets how much each person, team or integration may spend on AI.
- Showing who's close to or over their cap, and what will happen when they get there.

### When not to use

- A live run's cap while it runs – use [Budget Guard](budget-guard.md).
- One plan's usage against its limit – use [Usage Meter](usage-meter.md).
- Where the spend went – use [Spend Breakdown](spend-breakdown.md).
- Alerts on the whole month's budget – use [Budget Alerts](budget-alerts.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Workspace default** `.ui-spl__default` – the cap every member gets, editable
2. **Limit row** `.ui-spl__row` – kind, name and an Over or Near limit flag
3. **Meter** `.ui-spl__track` – spent of the cap, with the words under it
4. **Cap** `.ui-spl__cap` – the cap, a button that edits it in place
5. **Action** `.ui-spl__action` – Block, Warn or Notify at the cap
6. **Remove** `.ui-spl__remove`
7. **Add limit** `.ui-spl__add` – kind, who, amount, period and action

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. Meters use the meter tokens; near the cap (80%) they turn the warning colour and over it the danger colour,
and the row says so in words.

## Usage

### HTML

```html
<tc-spend-limits id="limits" currency="USD"></tc-spend-limits>

<script type="module">
  import "@adamstavely/trenchcoat/spend-limits";
  import "@adamstavely/trenchcoat/tokens.css";

  const limits = document.querySelector("#limits");
  limits.defaultLimit = { limit: 150, period: "month", action: "warn" };
  limits.limits = [
    { id: "t-audit", kind: "team", name: "Audit", limit: 2000, spent: 1640, period: "month", action: "warn" },
    { id: "k-ingest", kind: "key", name: "invoice-ingest (prod)", limit: 40, spent: 31.5, period: "day", action: "block" },
  ];
  limits.addEventListener("tc-limits-change", (e) => console.log(e.detail.change, e.detail.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SpendLimits, type SpendLimit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Limits() {
  const [limits, setLimits] = useState<SpendLimit[]>([
    { id: "t-audit", kind: "team", name: "Audit", limit: 2000, spent: 1640, period: "month", action: "warn" },
  ]);
  return <SpendLimits limits={limits} onLimitsChange={(next) => setLimits(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/spend-limits";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";

defineProps<{ limits: TcSpendLimits["limits"]; defaultLimit: TcSpendLimits["defaultLimit"] }>();
const onLimitsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-spend-limits :limits="limits" :defaultLimit="defaultLimit" @tc-limits-change="onLimitsChange"></tc-spend-limits>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SpendLimits } from "@adamstavely/trenchcoat/angular/spend-limits";
import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";

@Component({
  selector: "app-spend-limits-example",
  imports: [SpendLimits],
  template: `<tc-spend-limits [limits]="limits()" [defaultLimit]="defaultLimit()" (tc-limits-change)="onLimitsChange($event)"></tc-spend-limits>`,
})
export class SpendLimitsExample {
  readonly limits = input.required<TcSpendLimits["limits"]>();
  readonly defaultLimit = input.required<TcSpendLimits["defaultLimit"]>();
  onLimitsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/spend-limits";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";

  let { limits, defaultLimit }: { limits: TcSpendLimits["limits"]; defaultLimit: TcSpendLimits["defaultLimit"] } = $props();
  let el: TcSpendLimits;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-limits-change", on);
    return () => el.removeEventListener("tc-limits-change", on);
  });
</script>

<tc-spend-limits bind:this={el} {limits} {defaultLimit}></tc-spend-limits>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Spend limits"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `limits` | – | `SpendLimit[]` | `[]` | The limits. Changed by editing unless a tc-limits-change listener calls preventDefault() |
| `defaultLimit` | – | `SpendDefaultLimit \| null` | `null` | The workspace's default cap, or null for none. Changed by editing unless a tc-default-limit-change listener calls preventDefault() |
| `targets` | – | `SpendLimitTarget[]` | `[]` | Members, teams and keys that Add limit offers; ones that already have a limit are left out |
| `currency` | `currency` | `string` | `"USD"` | The currency, an ISO 4217 code |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-limits-change` | – | Yes | A limit was edited, added or removed, or its action changed ({ limits, change, id }: SpendLimitsChange); cancelable – prevented, `limits` stays as it was |
| `tc-default-limit-change` | – | Yes | The workspace default was edited ({ defaultLimit }: SpendDefaultLimitChange); cancelable – prevented, `defaultLimit` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `usedWords(l: Pick<SpendLimit, "spent" \| "limit" \| "period">)` | `void` | "$420 of $500 a month, 84%" – and "over by $40" past the cap |

#### Design tokens it reads (59)

`--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `parseLimit(text: string): number \| null` | A cap typed by a person: a positive number, with a currency sign, spaces and thousands separators ignored; null when it isn't one |

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
| `limits` | `el.limits = …;` | `<… limits={…} />` | `<tc-spend-limits :limits="…">` | `<tc-spend-limits [limits]="…">` | `<tc-spend-limits {limits}>` |
| `defaultLimit` | `el.defaultLimit = …;` | `<… defaultLimit={…} />` | `<tc-spend-limits :defaultLimit="…">` | `<tc-spend-limits [defaultLimit]="…">` | `<tc-spend-limits {defaultLimit}>` |
| `targets` | `el.targets = …;` | `<… targets={…} />` | `<tc-spend-limits :targets="…">` | `<tc-spend-limits [targets]="…">` | `<tc-spend-limits {targets}>` |

*Also attributes: `heading`, `description`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-limits-change` | Yes | `el.addEventListener("tc-limits-change", (e) => …)` | `ref.current.addEventListener("tc-limits-change", …)` | `@tc-limits-change="…"` | `(tc-limits-change)="…($event)"` | `el.addEventListener("tc-limits-change", …)` |
| `tc-default-limit-change` | Yes | `el.addEventListener("tc-default-limit-change", (e) => …)` | `ref.current.addEventListener("tc-default-limit-change", …)` | `@tc-default-limit-change="…"` | `(tc-default-limit-change)="…($event)"` | `el.addEventListener("tc-default-limit-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `limits` and `defaultLimit` itself unless a listener calls `preventDefault()` on `tc-limits-change` or `tc-default-limit-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-spend-limits id="spend-limits"></tc-spend-limits>

<script type="module">
  import "@adamstavely/trenchcoat/spend-limits";

  const el = document.querySelector("#spend-limits");
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
import "@adamstavely/trenchcoat/spend-limits";
import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";

const props = defineProps<{ initial: TcSpendLimits["limits"] }>();
const limits = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onLimitsChange = (e: CustomEvent<{ limits: TcSpendLimits["limits"] }>) => {
  e.preventDefault();
  limits.value = e.detail.limits;
};
</script>

<template>
  <tc-spend-limits :limits="limits" @tc-limits-change="onLimitsChange"></tc-spend-limits>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SpendLimits } from "@adamstavely/trenchcoat/angular/spend-limits";
import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";

@Component({
  selector: "app-controlled-spend-limits",
  imports: [SpendLimits],
  template: `<tc-spend-limits [limits]="limits()" (tc-limits-change)="onLimitsChange($event)"></tc-spend-limits>`,
})
export class ControlledSpendLimits {
  readonly initial = input.required<TcSpendLimits["limits"]>();
  readonly limits = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onLimitsChange(e: CustomEvent<{ limits: TcSpendLimits["limits"] }>) {
    e.preventDefault();
    this.limits.set(e.detail.limits);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/spend-limits";
  import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";

  let { initial }: { initial: TcSpendLimits["limits"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let limits = $derived(initial);
  let el: TcSpendLimits;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      limits = (e as CustomEvent<{ limits: TcSpendLimits["limits"] }>).detail.limits;
    };
    el.addEventListener("tc-limits-change", on);
    return () => el.removeEventListener("tc-limits-change", on);
  });
</script>

<tc-spend-limits bind:this={el} {limits}></tc-spend-limits>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-spend-limits")` returns a `TcSpendLimits` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";`
- **React / Next.js:** Props: `import type { SpendLimitsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SpendLimits>`. The element class, for refs: `import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSpendLimits["limits"]` with `import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";`
- **Angular:** The directive types the template: `[limits]` takes `TcSpendLimits["limits"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSpendLimits } from "@adamstavely/trenchcoat/spend-limits";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `limits` | `SpendLimit[]` | The limits – controlled when given |
| `defaultLimits` | `SpendLimit[]` | The limits on mount when `limits` isn't controlled |
| `onLimitsChange` | `(limits: SpendLimit[], change: SpendLimitsChange["change"], id: string) => void` | A limit was edited, added or removed, or its action changed |
| `workspaceDefault` | `SpendDefaultLimit \| null` | The workspace default – controlled when given (null for none) |
| `defaultWorkspaceDefault` | `SpendDefaultLimit \| null` | The workspace default on mount when `workspaceDefault` isn't controlled |
| `onWorkspaceDefaultChange` | `(defaultLimit: SpendDefaultLimit) => void` | The workspace default was edited |

*Renamed or hidden on the wrapper: `heading`, `limits`, `defaultLimit`, `children`*

## Accessibility

### Keyboard

Every control is native and in reading order.

| Key | What it does |
|---|---|
| Tab | Moves through each row's cap, action and Remove, then Add limit |
| Enter | On a cap, edits it; in the field, saves |
| Escape | Cancels the edit, or closes Add limit |

### Screen readers

The rows are a list named by the heading. Each row's bar is a meter named after its member, team or key, with value
text such as “$3,720 of $3,500 a month, 106%, over by $220”. A cap's button reads its amount and “edit Audit's limit”;
the edit field has a label, and a problem is announced. Saving, adding, removing and changing an action are confirmed
in a polite status message.

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
| **This component alone** | 20.3 KB | 6.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.8 KB** | **8.6 KB** |
| With Lit – the first component on a page | 49.6 KB | 15.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.3 ms** | the gallery demo's data, 100 DOM nodes – to layout, median of 7 |
| Typical update | **1.2 ms** | one item of targets replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.2 ms | targets: first render, 100 nodes; update 0.8 ms |
| 1,000 items | 2.1 ms | targets: first render, 100 nodes; update 0.5 ms |

What it renders doesn't grow with targets (tested to 1,000 items).

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

- Name keys by what they're for, with the environment: “invoice-ingest (prod)”.
- Use `period: "day"` for keys that run automatically, so a runaway loop stops the same day.

## Do and don't

### Do

- Block at the cap for keys; warn or notify for people, so work isn't cut off mid-task.
- Pass `targets` with every member, team and key, so Add limit can offer them.

### Don't

- Don't use a limit as a budget forecast – show where the money's going with `spend-breakdown`.

## Related

- [Spend Breakdown](spend-breakdown.md) – AI spend split by model, feature, user or team for a period – a ranked list with each slice's cost, share and change on the period before in words, a stacked bar per day, or a table, with picking a slice to filter and the total in the header
- [Budget Alerts](budget-alerts.md) – Spend alerts set by dragging markers along the month's budget – spent so far and the forecast hatched beyond it, a line at the budget, each alert a slider ("Alert at $4,000, 80% of budget") moved by pointer or keys, added by clicking the bar, with its channel, recipients and when the forecast crosses it
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
