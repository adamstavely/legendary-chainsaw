<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Coverage Ring

**Research & portfolio** · New

One share at a glance – a large ring with the percentage and a caption, a title and a line, and a bar from healthiest to needs attention that reads out each segment

- **Element:** `<tc-coverage-ring>`
- **Size:** 6.3 KB gzip · 19.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/coverage-ring";` |
| React / Next.js | `import { CoverageRing } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/coverage-ring";` · tags starting with tc- are custom elements |
| Angular | `import { CoverageRing } from "@adamstavely/trenchcoat/angular/coverage-ring";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/coverage-ring";` |

## Example

The live example is in the gallery at `#/coverage-ring`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One share at a glance. A large ring fills to the value, with the percentage in its middle over a caption – “covered”
by default – and a title and a line beside it saying what the share measures. Beneath, an optional bar splits the
items from the healthiest to those that need attention: segments the page names, each sized by its count and drawn in
a tone, with the bar's two ends labelled. Pointing at or focusing a segment reads it out under the bar. When the value
changes, the ring fills to it smoothly.

### When to use

- A portfolio's headline share – gaps with work against them, controls in place, tests passing.
- A dashboard panel beside a list that explains the number, such as `gap-exposure`.
- Showing how the items behind a share spread from healthy to needing attention.

### When not to use

- Use against a limit or a plan – use [Usage Meter](usage-meter.md).
- A number's trend over time – use [KPI Chart](kpi-chart.md).
- The gaps themselves – use [Gap Exposure](gap-exposure.md).
- Items ranked with their own coverage – use [Priority List](priority-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Ring** `.ui-covr__ring` – filled to the value, in its tone
2. **Percentage** `.ui-covr__num` – the value, with the caption under it
3. **Title** `.ui-covr__title` – what the share is
4. **Description** `.ui-covr__desc` – one line on what it measures
5. **Bar** `.ui-covr__bar` – the segments from healthiest to needs attention, each sized by its count
6. **Ends** `.ui-covr__ends` – the bar's end labels, or the segment under the pointer or focus

## Looks

Standard is a white card on a gray tray. Clean is one white card. The ring, bar and text are the same in both.

## Usage

### HTML

```html
<tc-coverage-ring id="cov" heading="Gap coverage" description="Share of open gaps with active work assigned." value="0.61" unit="topics" unit-one="topic"></tc-coverage-ring>

<script type="module">
  import "@adamstavely/trenchcoat/coverage-ring";
  import "@adamstavely/trenchcoat/tokens.css";

  const cov = document.querySelector("#cov");
  cov.segments = [
    { id: "strong", label: "Well covered", count: 5, tone: "success" },
    { id: "thin", label: "Thin", count: 2, tone: "warning" },
    { id: "bare", label: "Uncovered", count: 1, tone: "danger" },
  ];
  cov.addEventListener("tc-select", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { CoverageRing, type CoverageSegment } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const segments: CoverageSegment[] = [
  { id: "strong", label: "Well covered", count: 5, tone: "success" },
  { id: "thin", label: "Thin", count: 2, tone: "warning" },
  { id: "bare", label: "Uncovered", count: 1, tone: "danger" },
];

export function GapCoverage() {
  return <CoverageRing title="Gap coverage" description="Share of open gaps with active work assigned." value={0.61} unit="topics" unitOne="topic" segments={segments} onSegmentSelect={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/coverage-ring";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCoverageRing } from "@adamstavely/trenchcoat/coverage-ring";

defineProps<{ segments: TcCoverageRing["segments"] }>();
const onSelect = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-coverage-ring :segments="segments" @tc-select="onSelect"></tc-coverage-ring>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CoverageRing } from "@adamstavely/trenchcoat/angular/coverage-ring";
import type { TcCoverageRing } from "@adamstavely/trenchcoat/coverage-ring";

@Component({
  selector: "app-coverage-ring-example",
  imports: [CoverageRing],
  template: `<tc-coverage-ring [segments]="segments()" (tc-select)="onSelect($event)"></tc-coverage-ring>`,
})
export class CoverageRingExample {
  readonly segments = input.required<TcCoverageRing["segments"]>();
  onSelect(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/coverage-ring";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCoverageRing } from "@adamstavely/trenchcoat/coverage-ring";

  let { segments }: { segments: TcCoverageRing["segments"] } = $props();
  let el: TcCoverageRing;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-select", on);
    return () => el.removeEventListener("tc-select", on);
  });
</script>

<tc-coverage-ring bind:this={el} {segments}></tc-coverage-ring>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Coverage"` | The title beside the ring |
| `description` | `description` | `string \| undefined` | `undefined` | One line saying what the share measures |
| `value` | `value` | `number` | `0` | The share, from 0 to 1 |
| `caption` | `caption` | `string` | `"covered"` | The word under the percentage |
| `tone` | `tone` | `CoverageTone` | `"success"` | The ring's colour |
| `segments` | – | `CoverageSegment[]` | `[]` | The bar beneath, from the healthiest segment to the one that needs most attention; none when empty |
| `startLabel` | `start-label` | `string` | `"Healthiest"` | The label at the bar's start |
| `endLabel` | `end-label` | `string` | `"Needs attention"` | The label at the bar's end |
| `unit` | `unit` | `string` | `"items"` | What the segments count, after the number: "12 topics" |
| `unitOne` | `unit-one` | `string \| undefined` | `undefined` | The unit for a count of one, e.g. "topic"; by default `unit` |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-select` | – | No | A segment of the bar was chosen with Enter or a click ({ id, segment }: CoverageSelect) |

#### Design tokens it reads (45)

`--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-duration-fast`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `segments` | `el.segments = …;` | `<… segments={…} />` | `<tc-coverage-ring :segments="…">` | `<tc-coverage-ring [segments]="…">` | `<tc-coverage-ring {segments}>` |

*Also attributes: `heading`, `description`, `value`, `caption`, `tone`, `start-label`, `end-label`, `unit` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-select` | No | `el.addEventListener("tc-select", (e) => …)` | `onSegmentSelect={…}` | `@tc-select="…"` | `(tc-select)="…($event)"` | `el.addEventListener("tc-select", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-coverage-ring")` returns a `TcCoverageRing` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCoverageRing } from "@adamstavely/trenchcoat/coverage-ring";`
- **React / Next.js:** Props: `import type { CoverageRingProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CoverageRing>`. The element class, for refs: `import type { TcCoverageRing } from "@adamstavely/trenchcoat/coverage-ring";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCoverageRing["segments"]` with `import type { TcCoverageRing } from "@adamstavely/trenchcoat/coverage-ring";`
- **Angular:** The directive types the template: `[segments]` takes `TcCoverageRing["segments"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCoverageRing } from "@adamstavely/trenchcoat/coverage-ring";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCoverageRing } from "@adamstavely/trenchcoat/coverage-ring";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The title beside the ring |
| `onSegmentSelect` | `(id: string, segment: CoverageSegment) => void` | A segment of the bar was chosen with Enter or a click (named apart from React's DOM onSelect) |

*Renamed or hidden on the wrapper: `heading`, `onSelect`, `children`*

## Accessibility

### Keyboard

The segments are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next segment |
| Home / End | Moves to the first or last segment |
| Enter / Space | Fires `tc-select` with the segment |
| Tab | Leaves the bar |

### Screen readers

The ring is an image named by its value and caption, “61% covered”; the percentage in the middle repeats it and is
hidden. The title is a heading. The bar is a group named by the title, and each segment a button that reads its label,
count and share, “Uncovered: 1 topics, 8%”. The readout under the bar repeats the focused segment and is hidden.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 12.6 KB | 4.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **19.2 KB** | **6.4 KB** |
| With Lit – the first component on a page | 41.0 KB | 13.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 21 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of segments replaced |
| First on the page | 9.0 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.1 ms | segments: first render, 117 nodes; update 1.9 ms |
| 1,000 items | 28 ms | segments: first render, 1,017 nodes; update 23 ms |

1,000 items of segments: 28 ms, 1,017 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Set `unit` to what the segments count, plural, and `unit-one` to its singular: “topics” and “topic”.
- Keep the title short, the name of the share: “Gap coverage”.
- Say what's counted in the description, so the number can't be misread: “Share of open gaps with active work
  assigned.”
- Order `segments` from healthiest to needing most attention, and name them as states: “Well covered”, “Thin”.
- Set `unit` to what the segments count: “topics”, “teams”.

## Do and don't

### Do

- Use the success tone for a share where more is better, and a status tone that matches when it isn't.
- Keep segments to five or fewer so each stays wide enough to point at.
- Put the list that explains the share next to it.

### Don't

- Don't show a share that can go above 100% – it's clamped.
- Don't use the ring for a count; it's for a share of a whole.
- Don't add segments that don't add up to the items behind the share.

## Related

- [Gap Exposure](gap-exposure.md) – Gaps or risks and whether anyone is working on them – severity in words and a mark, the item and its priority, coverage, owner and what's invested, with the severe uncovered ones called out, grouping by priority or severity and an uncovered-only switch
- [Priority List](priority-list.md) – A portfolio's topics or projects by priority – a tier badge, owner and team, health in words, momentum as a line with its change, coverage as a bar, what's open and the work in flight, with health filters and groups per priority
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer

## Changelog

- **`tc-coverage-ring`:** one share as a large ring. - **Bar:** runs from healthiest to needs attention, and reads out each segment.
