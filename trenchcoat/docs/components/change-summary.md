<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Change Summary

**Data & charts**

What moved since last time – one metric per row with a colored trend

- **Element:** `<tc-change-summary>`
- **Size:** 5.9 KB gzip · 19.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/change-summary";` |
| React / Next.js | `import { ChangeSummary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/change-summary";` · tags starting with tc- are custom elements |
| Angular | `import { ChangeSummary } from "@adamstavely/trenchcoat/angular/change-summary";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/change-summary";` |

## Example

The live example is in the gallery at `#/change-summary`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A short list of what moved since the last time someone looked: one metric per row, what happened to it in words,
and a mark that says whether that's good, bad or neither. It answers “what should I notice?” before anyone opens a
chart. The direction of the arrow and the tone are separate, so a rise can be bad (churn up) and a fall good
(response time down).

### When to use

- The top of a dashboard, a weekly email-style digest or a report, where three to six metrics changed.
- Summing up a period (“This week”, “Since Monday”) next to the detail it summarises.
- Changes that need a judgement as well as a number – the tone carries it.

### When not to use

- Showing how a metric moved over time – use [KPI Chart](kpi-chart.md).
- Showing what a total is made of – use [Breakdown Chart](breakdown-chart.md).
- Showing use against a limit or a plan – use [Usage Meter](usage-meter.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Period** `.ui-cs__period` – the time the changes cover
3. **Row** `.ui-cs__row` – one metric and its change
4. **Label** `.ui-cs__label` – the metric's name
5. **Trend** `.ui-cs__trend` – green arrow, red outlined arrow or gray dash
6. **Change** `.ui-cs__text` – what happened, in words

## Looks

Standard puts the header on a gray tray and the rows on a white card inside it, with larger
text and a little more height per row. Clean is one white card with hairline shadows: the header is its first
row, the strokes are thinner and the trend marks are smaller tinted squares. In both, the rows fade
in one after another, and below 400px wide each metric stacks above its change so the text wraps instead of being
cut off.

## Usage

### HTML

```html
<tc-change-summary id="changes" period="This week"></tc-change-summary>

<script type="module">
  import "@adamstavely/trenchcoat/change-summary";
  import "@adamstavely/trenchcoat/tokens.css";

  const summary = document.querySelector("#changes");
  summary.changes = [
    { label: "Active users", change: "Up 6.1% to 18.2K", tone: "good" },
    { label: "Churned accounts", change: "Up 12 to 41", tone: "bad", direction: "up" },
    { label: "Avg. response time", change: "Down 80 ms to 212 ms", tone: "good", direction: "down" },
    { label: "Open tickets", change: "Unchanged at 57", tone: "neutral" },
  ];
  // It fires no events: it only displays
</script>
```

### React / Next.js

```tsx
import { ChangeSummary, type MetricChange } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const changes: MetricChange[] = [
  { label: "Active users", change: "Up 6.1% to 18.2K", tone: "good" },
  { label: "Churned accounts", change: "Up 12 to 41", tone: "bad", direction: "up" },
  { label: "Open tickets", change: "Unchanged at 57", tone: "neutral" },
];

export function WeeklyChanges() {
  return <ChangeSummary title="What's changed" period="This week" changes={changes} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/change-summary";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcChangeSummary } from "@adamstavely/trenchcoat/change-summary";

defineProps<{ icon: TcChangeSummary["icon"]; changes: TcChangeSummary["changes"] }>();
</script>

<template>
  <tc-change-summary :icon="icon" :changes="changes"></tc-change-summary>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ChangeSummary } from "@adamstavely/trenchcoat/angular/change-summary";
import type { TcChangeSummary } from "@adamstavely/trenchcoat/change-summary";

@Component({
  selector: "app-change-summary-example",
  imports: [ChangeSummary],
  template: `<tc-change-summary [icon]="icon()" [changes]="changes()"></tc-change-summary>`,
})
export class ChangeSummaryExample {
  readonly icon = input.required<TcChangeSummary["icon"]>();
  readonly changes = input.required<TcChangeSummary["changes"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/change-summary";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcChangeSummary } from "@adamstavely/trenchcoat/change-summary";

  let { icon, changes }: { icon: TcChangeSummary["icon"]; changes: TcChangeSummary["changes"] } = $props();
  let el: TcChangeSummary;
</script>

<tc-change-summary bind:this={el} {icon} {changes}></tc-change-summary>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"What's changed"` | The heading, and the region's name |
| `period` | `period` | `string` | `""` | Small text on the right of the heading, e.g. "This week" |
| `icon` | – | `Element \| undefined` | `undefined` | An icon element in front of the heading (cloned); unset shows the default |
| `changes` | – | `MetricChange[]` | `[]` | The metrics, one row each, in the order given |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Design tokens it reads (43)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-1`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `icon` | `el.icon = …;` | `<… icon={…} />` | `<tc-change-summary :icon="…">` | `<tc-change-summary [icon]="…">` | `<tc-change-summary {icon}>` |
| `changes` | `el.changes = …;` | `<… changes={…} />` | `<tc-change-summary :changes="…">` | `<tc-change-summary [changes]="…">` | `<tc-change-summary {changes}>` |

*Also attributes: `heading`, `period` – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-change-summary")` returns a `TcChangeSummary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcChangeSummary } from "@adamstavely/trenchcoat/change-summary";`
- **React / Next.js:** Props: `import type { ChangeSummaryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ChangeSummary>`. The element class, for refs: `import type { TcChangeSummary } from "@adamstavely/trenchcoat/change-summary";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcChangeSummary["icon"]` with `import type { TcChangeSummary } from "@adamstavely/trenchcoat/change-summary";`
- **Angular:** The directive types the template: `[icon]` takes `TcChangeSummary["icon"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcChangeSummary } from "@adamstavely/trenchcoat/change-summary";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcChangeSummary } from "@adamstavely/trenchcoat/change-summary";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `icon` | `React.ReactNode` | Icon in front of the title |

*Renamed or hidden on the wrapper: `heading`, `icon`*

## Accessibility

Follows the WAI-ARIA [Landmark regions pattern](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/).

### Keyboard

There is nothing to operate: the summary takes no focus and handles no keys.

### Screen readers

The host is a region named by the heading (“What's changed”); an `aria-label` or `aria-labelledby` the page sets on
it stays. The rows are a description list – the metric is the term, the change its description. A good or bad
change is said in words before the text (“Good change: Up 6.1% to 18.2K”, “Bad change: Up 12 to 41”); a neutral one
is read as written. The arrows and the dash are hidden. Labels and changes that may be cut off keep their full text
in a `title`.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 11.7 KB | 3.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **19.0 KB** | **6.0 KB** |
| With Lit – the first component on a page | 39.7 KB | 12.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 50 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of changes replaced |
| First on the page | 9.0 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.4 ms | changes: first render, 791 nodes; update 0.5 ms |
| 1,000 items | 42 ms | changes: first render, 7,811 nodes; update 3.9 ms |

1,000 items of changes: 42 ms, 7,811 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the metric as a noun people already use on the dashboard: “Active users”, not “Users (active, 7d)”.
- Write the change as a sentence fragment with the direction, the amount and where it landed: “Up 6.1% to 18.2K”,
  “Down 80 ms to 212 ms”.
- Say “Unchanged at 57” or “Holding at 46” for a neutral row rather than “0%”.
- Keep the period short: “This week”, “Since 1 May”.

## Do and don't

### Do

- Set `tone` by what the change means for the business, and `direction` by which way the number went.
- Keep it to the three to six changes that matter; link to the full report for the rest.
- Order rows by importance, not alphabetically.

### Don't

- Don't rely on the colour: always write the direction in `change`.
- Don't mark a change `bad` because the number fell – a fall in errors is `good` with `direction: "down"`.
- Don't put whole sentences of explanation in a row; they wrap or get cut off.

## Related

- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
