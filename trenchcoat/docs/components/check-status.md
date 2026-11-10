<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Check Status

**Workspace & sessions** · New

The automated checks on a change – a summary in words and a row for each, failing first, with Re-run, or just a mark and "5/11" for a list row.

- **Element:** `<tc-check-status>`
- **Size:** 7.2 KB gzip · 21.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/check-status";` |
| React / Next.js | `import { CheckStatus } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/check-status";` · tags starting with tc- are custom elements |
| Angular | `import { CheckStatus } from "@adamstavely/trenchcoat/angular/check-status";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/check-status";` |

## Example

The live example is in the gallery at `#/check-status`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The automated checks on a change, from any system that runs them. A summary says how it went in words, such as "5 of 11
passed, 1 failed", and each check is a row with a mark and a word, the failing ones first. `compact` draws only a mark and
"5/11", to sit in a list row. Skipped checks aren't in the total.

### When to use

- Showing whether a change, build or release is ready, with what went wrong.
- A small indicator in a row, with `compact`, when the details are a click away.

### When not to use

- Steps that happen in a fixed order – use [Status Tracker](status-tracker.md).
- Test cases compared across prompt or model versions – use [Eval Scorecard](eval-scorecard.md).
- Malware scanning of a file – use [Scan Status](scan-status.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `.ui-cks__summary` – how it went, in words
2. **Row** `.ui-cks__row` – one check
3. **Mark** `.ui-cks__mark` – the state's shape
4. **Word** `.ui-cks__word` – the state's name
5. **Re-run** `.ui-cks__retry` – on failing checks, with `retryable`
6. **Compact** `.ui-cks__compact` – the mark and `.ui-cks__tally`, in place of the rest

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card, for a place that already has one.

## Usage

### HTML

```html
<tc-check-status id="checks" retryable></tc-check-status>

<script type="module">
  import "@adamstavely/trenchcoat/check-status";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#checks");
  el.checks = [
    { id: "unit", name: "Unit tests", state: "failing", detail: "2 of 480 failed" },
    { id: "lint", name: "Lint", state: "passing" },
  ];
  el.addEventListener("tc-retry", (e) => console.log("Re-run", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { CheckStatus, type CheckItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const checks: CheckItem[] = [
  { id: "unit", name: "Unit tests", state: "failing", detail: "2 of 480 failed" },
  { id: "lint", name: "Lint", state: "passing" },
];

export function Checks({ onRetry }: { onRetry: (id: string) => void }) {
  return <CheckStatus checks={checks} retryable onTcRetry={(e) => onRetry(e.detail.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/check-status";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCheckStatus } from "@adamstavely/trenchcoat/check-status";

defineProps<{ checks: TcCheckStatus["checks"]; counts: TcCheckStatus["counts"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-check-status :checks="checks" :counts="counts" @tc-open="onOpen"></tc-check-status>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CheckStatus } from "@adamstavely/trenchcoat/angular/check-status";
import type { TcCheckStatus } from "@adamstavely/trenchcoat/check-status";

@Component({
  selector: "app-check-status-example",
  imports: [CheckStatus],
  template: `<tc-check-status [checks]="checks()" [counts]="counts()" (tc-open)="onOpen($event)"></tc-check-status>`,
})
export class CheckStatusExample {
  readonly checks = input.required<TcCheckStatus["checks"]>();
  readonly counts = input.required<TcCheckStatus["counts"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/check-status";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCheckStatus } from "@adamstavely/trenchcoat/check-status";

  let { checks, counts }: { checks: TcCheckStatus["checks"]; counts: TcCheckStatus["counts"] } = $props();
  let el: TcCheckStatus;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-check-status bind:this={el} {checks} {counts}></tc-check-status>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Checks"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `checks` | – | `CheckItem[] \| undefined` | `undefined` | The checks. Wins over `counts` |
| `counts` | – | `CheckCounts \| undefined` | `undefined` | Totals, when there are no details |
| `compact` | `compact` | `boolean` | `false` | Just a mark and "5/11", to sit inline in a list row |
| `retryable` | `retryable` | `boolean` | `false` | Offers Re-run on failing checks |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and card |
| `statusLabels` | – | `Partial<CheckStatusLabels>` | `{}` | Rename any state's word, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | A check's row was pressed ({ id, check }: CheckOpen) |
| `tc-retry` | – | No | Re-run was pressed on a failing check ({ id, check }: CheckRetry) |

#### Design tokens it reads (31)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultCheckStatusLabels: CheckStatusLabels` | The words used when the page gives none |
| `countChecks(checks: readonly CheckItem[]): CheckCounts` | How many checks are in each state |
| `overallCheckState(counts: CheckCounts): CheckState \| null` | The state that speaks for the whole set: failing over pending over passing, and null when nothing has run |

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
| `checks` | `el.checks = …;` | `<… checks={…} />` | `<tc-check-status :checks="…">` | `<tc-check-status [checks]="…">` | `<tc-check-status {checks}>` |
| `counts` | `el.counts = …;` | `<… counts={…} />` | `<tc-check-status :counts="…">` | `<tc-check-status [counts]="…">` | `<tc-check-status {counts}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-check-status :statusLabels="…">` | `<tc-check-status [statusLabels]="…">` | `<tc-check-status {statusLabels}>` |

*Also attributes: `heading`, `description`, `compact`, `retryable`, `bare` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-retry` | No | `el.addEventListener("tc-retry", (e) => …)` | `onTcRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-check-status")` returns a `TcCheckStatus` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCheckStatus } from "@adamstavely/trenchcoat/check-status";`
- **React / Next.js:** Props: `import type { CheckStatusProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CheckStatus>`. The element class, for refs: `import type { TcCheckStatus } from "@adamstavely/trenchcoat/check-status";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCheckStatus["checks"]` with `import type { TcCheckStatus } from "@adamstavely/trenchcoat/check-status";`
- **Angular:** The directive types the template: `[checks]` takes `TcCheckStatus["checks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCheckStatus } from "@adamstavely/trenchcoat/check-status";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCheckStatus } from "@adamstavely/trenchcoat/check-status";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

The rows' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between rows |
| ← / → | Move between a row and its Re-run |
| Home / End | Go to the first or last row |
| Enter / Space | Open the check, or re-run it |

### Screen readers

The rows are a list named by the heading. Each row's button says the check's name and state. `compact` reads the whole
summary, not "5/11". Pressing Re-run is announced through `role="status"`.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
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
| **This component alone** | 12.7 KB | 4.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **21.0 KB** | **7.2 KB** |
| With Lit – the first component on a page | 42.8 KB | 14.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 69 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of checks replaced |
| First on the page | 8.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.3 ms | checks: first render, 948 nodes; update 0.5 ms |
| 1,000 items | 29 ms | checks: first render, 9,348 nodes; update 4.1 ms |

1,000 items of checks: 29 ms, 9,348 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name checks for what they check: "Unit tests", not a job's internal id.
- Keep `detail` to one line about what went wrong.
- Use `counts` only when there are no details to show.

## Do and don't

### Do

- Update the data after `tc-retry`: the element doesn't change a check's state itself.
- Use `countChecks()` to feed a compact view from the same data.

### Don't

- Don't rely on `retryable` for permission: the server still has to check who may re-run.
- Don't count skipped checks as passed; the total leaves them out on purpose.

## Related

- [Change List](change-list.md) – Proposed code changes as compact rows – state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.
- [Status Tracker](status-tracker.md) – Where work stands in a fixed sequence of steps – gates or stages on a line, each cleared, pending, blocked or not reached in words and marks, the line filling as they clear, the current step marked, a legend, and a step's evidence record on click
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Scan Status](scan-status.md) – Where a file stands in malware scanning – queued, scanning, clean, suspicious, quarantined or failed, inline or as a card, with Rescan and Request review
