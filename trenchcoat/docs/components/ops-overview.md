<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Ops Overview

**Data & charts** · New

An operations overview in one dense strip – a status line, a health pill and count tiles, each with its change since the last period in words and green or red by which way is good, an optional sparkline and tone, optionally opening what it counts

- **Element:** `<tc-ops-overview>`
- **Size:** 7.1 KB gzip · 20.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ops-overview";` |
| React / Next.js | `import { OpsOverview } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ops-overview";` · tags starting with tc- are custom elements |
| Angular | `import { OpsOverview } from "@adamstavely/trenchcoat/angular/ops-overview";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ops-overview";` |

## Example

The live example is in the gallery at `#/ops-overview`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An operations overview in one dense strip, for the top of a team's dashboard. The header has a title, a one-line
status – “All operations active · 3 analysts on watch” – and a health pill for the feeds or systems: Nominal,
Degraded or Down. Below it, a row of count tiles, each with:
- its label and value, and an optional sub-line;
- the change since the last period as a +/- badge, green when it went the right way and red when it didn't;
- an optional sparkline of recent values;
- an optional tone, such as red for “Critical risk”.

Whether a rise is good is each tile's call: more cases closed is good, more alerts is not. With `actionable` the tiles
open what they count.

### When to use

- The first row of an operations, support or security team's dashboard.
- A handful of counts people check several times a day, where the change matters as much as the number.
- A status strip above a live feed or a queue.

### When not to use

- One metric over time with a chart – use [KPI Chart](kpi-chart.md).
- How well service levels are met – use [SLA Status](sla-status.md).
- The alerts themselves – use [Alert Feed](alert-feed.md).
- Use against a plan or a limit – use [Usage Meter](usage-meter.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Status** `.tc-head__sub` – one line on how things stand
2. **Health** `.ui-opo__health` – the feeds' or systems' health as a tint, a mark and a word
3. **Tile** `.ui-opo__tile` – one count
4. **Label** `.ui-opo__label` – what it counts
5. **Value** `.ui-opo__value` – the count, tinted when the tile has a tone
6. **Change** `.ui-opo__change` – the change since the last period, with its direction
7. **Sub-line** `.ui-opo__sub` – one quiet line of context
8. **Sparkline** `.ui-opo__spark` – recent values

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The tiles, badges and sparklines are the same in both. In a narrow container the tiles go two across.

## Usage

### HTML

```html
<tc-ops-overview id="ops" heading="Command overview" status="All operations active" health="nominal" change-label="since last week"></tc-ops-overview>

<script type="module">
  import "@adamstavely/trenchcoat/ops-overview";
  import "@adamstavely/trenchcoat/tokens.css";

  const ops = document.querySelector("#ops");
  ops.tiles = [
    { id: "cases", label: "Active cases", value: 12, change: 2, goodWhen: "none" },
    { id: "alerts", label: "Alerts · 24h", value: 5, change: 4, goodWhen: "down" },
  ];
  ops.actionable = true;
  ops.addEventListener("tc-action", (e) => console.log("open", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { OpsOverview, type OpsTile } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const tiles: OpsTile[] = [
  { id: "cases", label: "Active cases", value: 12, change: 2, goodWhen: "none" },
  { id: "alerts", label: "Alerts · 24h", value: 5, change: 4, goodWhen: "down", trend: [2, 1, 3, 5] },
];

export function Ops() {
  return <OpsOverview title="Command overview" status="All operations active" health="nominal" tiles={tiles} actionable onAction={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ops-overview";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcOpsOverview } from "@adamstavely/trenchcoat/ops-overview";

defineProps<{ healthLabels: TcOpsOverview["healthLabels"]; tiles: TcOpsOverview["tiles"] }>();
const onAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-ops-overview :healthLabels="healthLabels" :tiles="tiles" @tc-action="onAction"></tc-ops-overview>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { OpsOverview } from "@adamstavely/trenchcoat/angular/ops-overview";
import type { TcOpsOverview } from "@adamstavely/trenchcoat/ops-overview";

@Component({
  selector: "app-ops-overview-example",
  imports: [OpsOverview],
  template: `<tc-ops-overview [healthLabels]="healthLabels()" [tiles]="tiles()" (tc-action)="onAction($event)"></tc-ops-overview>`,
})
export class OpsOverviewExample {
  readonly healthLabels = input.required<TcOpsOverview["healthLabels"]>();
  readonly tiles = input.required<TcOpsOverview["tiles"]>();
  onAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ops-overview";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcOpsOverview } from "@adamstavely/trenchcoat/ops-overview";

  let { healthLabels, tiles }: { healthLabels: TcOpsOverview["healthLabels"]; tiles: TcOpsOverview["tiles"] } = $props();
  let el: TcOpsOverview;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-action", on);
    return () => el.removeEventListener("tc-action", on);
  });
</script>

<tc-ops-overview bind:this={el} {healthLabels} {tiles}></tc-ops-overview>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Overview"` | The heading |
| `status` | `status` | `string \| undefined` | `undefined` | The one-line status under the heading: "All operations active · 3 analysts on watch" |
| `health` | `health` | `OpsHealth \| undefined` | `undefined` | The feeds' or systems' health; unset hides the pill |
| `healthLabels` | – | `Partial<Record<OpsHealth, string>>` | `{}` | The health states' names, merged over the defaults (Feeds nominal, Feeds degraded, Feeds down) |
| `tiles` | – | `OpsTile[]` | `[]` | The count tiles, in order |
| `changeLabel` | `change-label` | `string` | `"since last period"` | What a change is measured against, for screen readers and titles: "since last week" |
| `actionable` | `actionable` | `boolean` | `false` | Makes the tiles buttons that fire tc-action |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-action` | – | No | An actionable tile was pressed ({ id, tile }: OpsAction) |

#### Design tokens it reads (54)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-eyebrow-color`, `--tc-eyebrow-font-size`, `--tc-eyebrow-font-weight`, `--tc-eyebrow-line-height`, `--tc-eyebrow-tracking`, `--tc-eyebrow-transform`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-md`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultOpsHealthLabels: Record<OpsHealth, string>` | The health states' names used when the page gives none |

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
| `healthLabels` | `el.healthLabels = …;` | `<… healthLabels={…} />` | `<tc-ops-overview :healthLabels="…">` | `<tc-ops-overview [healthLabels]="…">` | `<tc-ops-overview {healthLabels}>` |
| `tiles` | `el.tiles = …;` | `<… tiles={…} />` | `<tc-ops-overview :tiles="…">` | `<tc-ops-overview [tiles]="…">` | `<tc-ops-overview {tiles}>` |

*Also attributes: `heading`, `status`, `health`, `change-label`, `actionable`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ops-overview")` returns a `TcOpsOverview` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcOpsOverview } from "@adamstavely/trenchcoat/ops-overview";`
- **React / Next.js:** Props: `import type { OpsOverviewProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof OpsOverview>`. The element class, for refs: `import type { TcOpsOverview } from "@adamstavely/trenchcoat/ops-overview";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcOpsOverview["healthLabels"]` with `import type { TcOpsOverview } from "@adamstavely/trenchcoat/ops-overview";`
- **Angular:** The directive types the template: `[healthLabels]` takes `TcOpsOverview["healthLabels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcOpsOverview } from "@adamstavely/trenchcoat/ops-overview";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcOpsOverview } from "@adamstavely/trenchcoat/ops-overview";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `onAction` | `(id: string, tile: OpsTile) => void` | An actionable tile was pressed |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

Without `actionable`, the strip has nothing to focus. With it, the tiles are one tab stop.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the previous or next tile |
| Home / End | Moves to the first or last tile |
| Enter / Space | Opens what the tile counts |
| Tab | Leaves the strip |

### Screen readers

The tiles are a list named by the heading. Each reads its label, value and change in words, “Alerts · 24h, 5, up 4
since last week”, then its sub-line; the arrows and sparklines are hidden. The health pill reads its word, “Feeds
degraded”. Actionable tiles are buttons with the same name.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 13.4 KB | 4.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **20.9 KB** | **7.1 KB** |
| With Lit – the first component on a page | 42.7 KB | 14.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 74 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of tiles replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 15 ms | tiles: first render, 1,195 nodes; update 3.9 ms |
| 1,000 items | 86 ms | tiles: first render, 11,815 nodes; update 18 ms |

1,000 items of tiles: 86 ms. It renders every item, so a first render passes 50 ms (a long task) at about 580 items – page or filter longer lists.

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

- Keep labels to two or three words, and units in the value or sub-line: “1.8 d”, “was 2.2 days”.
- Set `goodWhen` on every tile where a rise is bad – alerts, risks, resolution time – so the badge colour tells the
  truth; use `none` for counts that are neither.
- Set `change-label` to the period you compare against: “since last week”.
- Write the status line as how things stand, not a greeting.

## Do and don't

### Do

- Keep to five or six tiles; more belongs on a page of its own.
- Use a tone only for the one or two counts that need attention.
- Make tiles actionable when there's a list behind each count.

### Don't

- Don't leave `goodWhen` at its default for counts where up is bad – a green badge on rising alerts misleads.
- Don't use the health pill for anything but the feeds or systems the numbers come from.
- Don't put long text in tiles; they truncate.

## Related

- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [SLA Status](sla-status.md) – How well service levels are met – the share on time, a Met / At risk / Breached split in words and marks, a weekly trend, a bar per type of request with a readout, and a period chooser
- [Alert Feed](alert-feed.md) – A live feed of alerts, newest first – category, severity as an edge, mark and word, a fresh relative time, Escalate and Acknowledge on each, Pause feed with new alerts held back, and polite announcements
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Changelog

- **Data & charts:** - `tc-ops-overview`: a dense strip of a health pill and count tiles with their change. - `tc-sla-status`: on-time share, a Met / At risk / Breached split, a trend and a bar per type.
