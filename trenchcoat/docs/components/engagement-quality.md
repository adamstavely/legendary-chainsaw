<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Engagement Quality

**Trust & calibration** · New

Whether reviews are genuine – an index from reused text, time on the source, batch dismissals and repeated commitments, shown as quality, not a violation

- **Element:** `<tc-engagement-quality>`
- **Size:** 9.6 KB gzip · 32.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/engagement-quality";` |
| React / Next.js | `import { EngagementQuality } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/engagement-quality";` · tags starting with tc- are custom elements |
| Angular | `import { EngagementQuality } from "@adamstavely/trenchcoat/angular/engagement-quality";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/engagement-quality";` |

## Example

The live example is in the gallery at `#/engagement-quality`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Whether people's reviews of AI output are genuine engagement or going through the motions. An index from 0 to 1 –
1 is fully genuine – leads the card with its band (Low, Mixed, Strong), its trend over recent sessions, and one
sentence naming the signals that hold it back. Below, the signals it is built from: reused wording, time on the
source before a verdict, batch dismissals and repeated commitments, or the app's own. Each shows its value, what was
observed, a plain explanation and, folded away, an example. It is presented as quality, not as a violation: neutral
words, a low score in amber rather than red, and an optional note saying who else sees it and that it isn't a
performance rating.

### When to use

- Beside a review or verification workflow, to show a reviewer how far their own review record can be relied on.
- In a team lead's view, as a starting point for a conversation about calibration.
- When review outcomes feed a model or a metric, to flag sessions whose reviews should count for less.

### When not to use

- Whether people trust the AI as much as it deserves – use [Reliance Gauge](reliance-gauge.md).
- How often the AI agreed with the person in this session – use [Agreement Tracker](agreement-tracker.md).
- Working through the items waiting for review – use [Review Center](review-center.md) or [Verification Queue](verification-queue.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the title, what the numbers cover, and the band's pill
2. **Index** `.ui-egq__score` – the index, out of 1
3. **Summary** `.ui-egq__read` – the band in words and the signals holding it back
4. **Band scale** `.ui-egq__scale` – the index on a track cut where the Mixed and Strong bands start
5. **Trend** `.ui-egq__trend` – one column per recent window and the change across them
6. **Signal** `.ui-egq__signal` – its value and meter, what was observed, the explanation and the Example disclosure
7. **Shared note** `.ui-egq__note` – who else sees the score

## Looks

Standard sets the header on the gray tray above a white card, with the shared note on the tray below. Clean is one
white card with a shadow: the note becomes its last row under a hairline, the index is a step smaller, the section
label is a small caption, and strokes are thinner.

## Usage

### HTML

```html
<tc-engagement-quality id="quality" scope="Last 5 sessions · 38 reviews" shared-with="your team lead" browsable></tc-engagement-quality>

<script type="module">
  import "@adamstavely/trenchcoat/engagement-quality";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#quality");
  card.trend = [
    { label: "Session 1", index: 0.58 },
    { label: "Session 2", index: 0.63 },
    { label: "Session 3", index: 0.7 },
  ];
  card.signals = [
    { id: "words", kind: "boilerplate", value: 0.82, reading: "1 of 12 notes reused earlier wording" },
    { id: "time", kind: "source-time", value: 0.41, reading: "Median 9 s with the source open", example: "Verdict 4 s after opening a 12-page source" },
    { id: "batch", kind: "batch-dismissal", value: 0.66, reading: "2 batches of 6 or more" },
    { id: "commit", kind: "repeated-commitment", value: 0.9 },
  ];
  card.addEventListener("tc-signal-open", (e) => console.log("show reviews behind", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { EngagementQuality } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReviewQuality() {
  return (
    <EngagementQuality
      scope="Last 5 sessions · 38 reviews"
      sharedWith="your team lead"
      trend={[
        { label: "Session 1", index: 0.58 },
        { label: "Session 2", index: 0.7 },
      ]}
      signals={[
        { id: "words", kind: "boilerplate", value: 0.82, reading: "1 of 12 notes reused earlier wording" },
        { id: "time", kind: "source-time", value: 0.41, reading: "Median 9 s with the source open", example: "Verdict 4 s after opening a 12-page source" },
      ]}
      onOpenSignal={(id) => console.log("show reviews behind", id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/engagement-quality";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEngagementQuality } from "@adamstavely/trenchcoat/engagement-quality";

defineProps<{ signals: TcEngagementQuality["signals"]; trend: TcEngagementQuality["trend"] }>();
const onSignalOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-engagement-quality :signals="signals" :trend="trend" @tc-signal-open="onSignalOpen"></tc-engagement-quality>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EngagementQuality } from "@adamstavely/trenchcoat/angular/engagement-quality";
import type { TcEngagementQuality } from "@adamstavely/trenchcoat/engagement-quality";

@Component({
  selector: "app-engagement-quality-example",
  imports: [EngagementQuality],
  template: `<tc-engagement-quality [signals]="signals()" [trend]="trend()" (tc-signal-open)="onSignalOpen($event)"></tc-engagement-quality>`,
})
export class EngagementQualityExample {
  readonly signals = input.required<TcEngagementQuality["signals"]>();
  readonly trend = input.required<TcEngagementQuality["trend"]>();
  onSignalOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/engagement-quality";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEngagementQuality } from "@adamstavely/trenchcoat/engagement-quality";

  let { signals, trend }: { signals: TcEngagementQuality["signals"]; trend: TcEngagementQuality["trend"] } = $props();
  let el: TcEngagementQuality;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-signal-open", on);
    return () => el.removeEventListener("tc-signal-open", on);
  });
</script>

<tc-engagement-quality bind:this={el} {signals} {trend}></tc-engagement-quality>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Engagement quality"` | The heading, and the region's name |
| `scope` | `scope` | `string` | `""` | What the numbers cover, a quiet line under the heading – e.g. "Last 5 sessions · 38 reviews" |
| `index` | `index` | `number \| undefined` | `undefined` | The index, 0–1 (1: fully genuine). Unset, it is the weighted mean of the signals |
| `signals` | – | `EngagementSignal[]` | `[]` | The signals behind the index, each 0–1 where higher means more genuine |
| `trend` | – | `EngagementWindow[]` | `[]` | The index over recent windows, oldest first – drawn as small columns with the change |
| `strongAt` | `strong-at` | `number` | `0.75` | Index from which the band reads "Strong" (0–1) |
| `mixedAt` | `mixed-at` | `number` | `0.5` | Index from which the band reads "Mixed"; below it, "Low" (0–1) |
| `bandLabels` | – | `Partial<Record<EngagementBand, string>>` | `{}` | Names of the bands |
| `summary` | `summary` | `string` | `""` | Overrides the sentence under the index that says which signals hold it back |
| `sharedWith` | `shared-with` | `string` | `""` | Who else sees the score – a role or a name, e.g. "your team lead". Unset: no note |
| `sharedNote` | `shared-note` | `string` | `""` | Overrides the whole shared note |
| `browsable` | `browsable` | `boolean` | `false` | Each signal's example offers "Show these reviews", which fires tc-signal-open |
| `locale` | `locale` | `string` | `"en-US"` | Locale for numbers |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-signal-open` | – | No | "Show these reviews" was pressed inside a signal's example, with `browsable` set (detail: { id }) |

#### Design tokens it reads (85)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-neutral`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-h`, `--tc-meter-h-hero`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-amber-solid`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `ENGAGEMENT_SIGNAL_KINDS: Record<EngagementSignalKind, { label: string; explanation: string }>` | The built-in signals' default label and explanation |
| `engagementIndex(signals: EngagementSignal[]): number \| undefined` | The index the signals make: their weighted mean, or undefined with no signals |

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
| `signals` | `el.signals = …;` | `<… signals={…} />` | `<tc-engagement-quality :signals="…">` | `<tc-engagement-quality [signals]="…">` | `<tc-engagement-quality {signals}>` |
| `trend` | `el.trend = …;` | `<… trend={…} />` | `<tc-engagement-quality :trend="…">` | `<tc-engagement-quality [trend]="…">` | `<tc-engagement-quality {trend}>` |
| `bandLabels` | `el.bandLabels = …;` | `<… bandLabels={…} />` | `<tc-engagement-quality :bandLabels="…">` | `<tc-engagement-quality [bandLabels]="…">` | `<tc-engagement-quality {bandLabels}>` |

*Also attributes: `heading`, `scope`, `index`, `strong-at`, `mixed-at`, `summary`, `shared-with`, `shared-note` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-signal-open` | No | `el.addEventListener("tc-signal-open", (e) => …)` | `onOpenSignal={…}` | `@tc-signal-open="…"` | `(tc-signal-open)="…($event)"` | `el.addEventListener("tc-signal-open", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-engagement-quality")` returns a `TcEngagementQuality` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEngagementQuality } from "@adamstavely/trenchcoat/engagement-quality";`
- **React / Next.js:** Props: `import type { EngagementQualityProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EngagementQuality>`. The element class, for refs: `import type { TcEngagementQuality } from "@adamstavely/trenchcoat/engagement-quality";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEngagementQuality["signals"]` with `import type { TcEngagementQuality } from "@adamstavely/trenchcoat/engagement-quality";`
- **Angular:** The directive types the template: `[signals]` takes `TcEngagementQuality["signals"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEngagementQuality } from "@adamstavely/trenchcoat/engagement-quality";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEngagementQuality } from "@adamstavely/trenchcoat/engagement-quality";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `onOpenSignal` | `(id: string) => void` | Adds "Show these reviews" to each signal's example; called with the signal's id |

*Renamed or hidden on the wrapper: `heading`, `browsable`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to each signal's Example button and, with `browsable`, the “Show these reviews” button inside an open example |
| Enter / Space | Opens or closes an example, or fires `tc-signal-open` |

### Screen readers

The card is a `region`, named by its heading. The band scale is a `meter` named “Engagement quality index”, with a
value such as “0.70 of 1, mixed”; with no data it is hidden and the summary says “No reviews to measure yet.”. The
signals are a list named “What it's built from”; each signal's bar is a `meter` named by its label, its value text
adding the band and the reading (“0.41 of 1, low – Median 9 s with the source open”). Each Example button reports
`aria-expanded` and names its signal (“Example – Time on the source”). The trend's columns are hidden; a sentence
reads the range instead (“From 0.58 in Session 1 to 0.70 in Session 3.”).

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.4 KB | 7.6 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **32.7 KB** | **9.6 KB** |
| With Lit – the first component on a page | 55.3 KB | 17.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 112 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of signals replaced |
| First on the page | 9.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.3 ms | signals: first render, 1,648 nodes; update 1.3 ms |
| 1,000 items | 79 ms | signals: first render, 16,048 nodes; update 10 ms |

1,000 items of signals: 79 ms. It renders every item, so a first render passes 50 ms (a long task) at about 640 items – page or filter longer lists.

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

- Keep higher meaning more genuine, for the index and every signal, so the card never mixes directions.
- Use `reading` for what was observed, in numbers a person recognises: “Median 9 s with the source open”, “2 batches
  of 6 or more”.
- Make `example` one real instance from the person's own reviews, quoted or described in a sentence.
- Name a role in `sharedWith` (“your team lead”) rather than a name, and keep the developmental framing if you write
  your own `sharedNote`.
- The built-in kinds supply the label and explanation; override them only to match your product's words.

## Do and don't

### Do

- Show it to the reviewer first, and to a supervisor only with the shared note on.
- Compute signals over enough reviews to mean something – a session or a week, not a single item.
- Set `strongAt` and `mixedAt` from your own data once you know what normal looks like.

### Don't

- Don't use it as a performance score or rank people by it.
- Don't add red or alarming wording for a low score – it describes how reliable the record is.
- Don't show signals the person can't act on; each one should point at a habit they can change.

## Related

- [Reliance Gauge](reliance-gauge.md) – Whether trust in the AI matches how it performs – a reliance index with its trend, signals against review thresholds, and overtrust and undertrust caught
- [Agreement Tracker](agreement-tracker.md) – How often the AI agreed with you versus pushed back this session – it turns amber on a run of agreement and points to the counter-argument
- [Review Center](review-center.md) – A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
