<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Score Ring

**Data & charts** · New

One overall score from weighted sub-scores – a ring with a segment per part as long as its weight and filled to its score, the score and its band in the middle, a row per part that isolates its segment, and the metrics behind the score

- **Element:** `<tc-score-ring>`
- **Size:** 11.1 KB gzip · 33.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/score-ring";` |
| React / Next.js | `import { ScoreRing } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/score-ring";` · tags starting with tc- are custom elements |
| Angular | `import { ScoreRing } from "@adamstavely/trenchcoat/angular/score-ring";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/score-ring";` |

## Example

The live example is in the gallery at `#/score-ring`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One overall score and the parts it's made of. The ring is split into a segment per sub-score: each segment is as long
as that part's weight and filled as far as its own score, so a heavy part that scores badly shows as a long, half-empty
stretch. The overall score sits large in the middle with its band – Good, Fair or Needs attention – and a caption.
Beside the ring a row per sub-score gives its share of the score and its value. Pointing at a segment or a row, or
focusing the row, isolates it: the other segments go quiet and the middle shows that part. Below, metric rows give
the plain facts behind the score, each with its change. The segments sweep round in turn when the ring first comes on
screen.

### When to use

- A composite score people need to trust: data quality, a health check, readiness, a review score.
- When the question after "what's the score?" is "which part is pulling it down?".
- Pairing the score with the few raw numbers it's built from.

### When not to use

- One share with no parts – use [Coverage Ring](coverage-ring.md).
- Several separate ratios, each towards its own target – use [Radial Bar Chart](radial-bar-chart.md).
- One value against a range with bands and a target line – use [Gauge](gauge.md).
- NPS or CSAT results with their bands and comments – use [Score Summary](score-summary.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Ring** `.ui-scrg__ring` – the segments round the overall score, named by a text summary
2. **Segment** `.ui-scrg__seg` – a sub-score: its length is its weight, its fill its score
3. **Score** `.ui-scrg__num` – the overall score, or the isolated sub-score
4. **Band** `.ui-scrg__band` – the band's word with a dot in its tone
5. **Row** `.ui-scrg__row` – a sub-score's swatch, name, share of the score and value
6. **Metrics** `.ui-scrg__metrics` – the facts behind the score, each with its unit and change

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The ring, rows and metrics are the same in both. Segments take the chart palette in turn unless a
sub-score gives its own `color`. `--tc-scrg-track` sets the empty part of each segment and `--tc-scrg-size` the ring's
size (152 px); set either on the element. When the card is narrower than 420 px the rows sit under the ring.

## Usage

### HTML

```html
<tc-score-ring id="quality" heading="Data quality" caption="out of 100"></tc-score-ring>

<script type="module">
  import "@adamstavely/trenchcoat/score-ring";
  import "@adamstavely/trenchcoat/tokens.css";

  const ring = document.querySelector("#quality");
  ring.subscores = [
    { id: "complete", label: "Completeness", score: 91, weight: 4 },
    { id: "accurate", label: "Accuracy", score: 84, weight: 3 },
    { id: "fresh", label: "Freshness", score: 62, weight: 2 },
  ];
  ring.metrics = [{ label: "Records checked", value: 48210 }, { label: "Median age", value: 19, unit: "days", change: "+3 days", trend: "bad" }];
  ring.addEventListener("tc-subscore-change", (e) => console.log(e.detail.subscore, e.detail.item));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ScoreRing, type ScoreRingSubscore } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const subscores: ScoreRingSubscore[] = [
  { id: "complete", label: "Completeness", score: 91, weight: 4 },
  { id: "accurate", label: "Accuracy", score: 84, weight: 3 },
  { id: "fresh", label: "Freshness", score: 62, weight: 2 },
];

export function DataQuality() {
  const [subscore, setSubscore] = useState<string | null>(null);
  return <ScoreRing title="Data quality" subscores={subscores} subscore={subscore} onSubscoreChange={setSubscore} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/score-ring";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";

defineProps<{ subscores: TcScoreRing["subscores"]; bands: TcScoreRing["bands"] }>();
const onSubscoreChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-score-ring :subscores="subscores" :bands="bands" @tc-subscore-change="onSubscoreChange"></tc-score-ring>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ScoreRing } from "@adamstavely/trenchcoat/angular/score-ring";
import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";

@Component({
  selector: "app-score-ring-example",
  imports: [ScoreRing],
  template: `<tc-score-ring [subscores]="subscores()" [bands]="bands()" (tc-subscore-change)="onSubscoreChange($event)"></tc-score-ring>`,
})
export class ScoreRingExample {
  readonly subscores = input.required<TcScoreRing["subscores"]>();
  readonly bands = input.required<TcScoreRing["bands"]>();
  onSubscoreChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/score-ring";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";

  let { subscores, bands }: { subscores: TcScoreRing["subscores"]; bands: TcScoreRing["bands"] } = $props();
  let el: TcScoreRing;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-subscore-change", on);
    return () => el.removeEventListener("tc-subscore-change", on);
  });
</script>

<tc-score-ring bind:this={el} {subscores} {bands}></tc-score-ring>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Score"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `subscores` | – | `ScoreRingSubscore[]` | `[]` | The parts of the score, in the order they go round the ring from the top |
| `score` | `score` | `number \| undefined` | `undefined` | The overall score, 0–100; by default the sub-scores' average weighted by `weight` |
| `bands` | – | `ScoreRingBand[]` | `[ { min: 80, label: "Good", tone: "success" }, { min: 60, label: "Fair", tone: "warning" }, { min: 0, label: "Needs attention", tone: "danger" }, ]` | The words for score ranges, any order; by default Good (80+), Fair (60+) and Needs attention |
| `caption` | `caption` | `string` | `"out of 100"` | The line under the band word |
| `metrics` | – | `ScoreRingMetric[]` | `[]` | The facts behind the score, as rows under the ring |
| `subscore` | `subscore` | `string \| null` | `null` | The selected sub-score's id, isolated until cleared. Changed by the user unless a tc-subscore-change listener calls preventDefault() |
| `still` | `still` | `boolean` | `false` | Draw without motion |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-subscore-change` | – | Yes | A sub-score was selected or cleared ({ subscore, item }: ScoreRingSubscoreChange); cancelable – prevented, `subscore` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the sweep again |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-scrg-track` | `var(--tc-meter-track)` | both |
| `--tc-scrg-size` | `152px` | both |

#### Design tokens it reads (53)

`--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-4xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-scrg-ink`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultScoreRingBands: ScoreRingBand[]` | The bands when the page gives none: 80 and up Good, 60 and up Fair, else Needs attention |

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
| `subscores` | `el.subscores = …;` | `<… subscores={…} />` | `<tc-score-ring :subscores="…">` | `<tc-score-ring [subscores]="…">` | `<tc-score-ring {subscores}>` |
| `bands` | `el.bands = …;` | `<… bands={…} />` | `<tc-score-ring :bands="…">` | `<tc-score-ring [bands]="…">` | `<tc-score-ring {bands}>` |
| `metrics` | `el.metrics = …;` | `<… metrics={…} />` | `<tc-score-ring :metrics="…">` | `<tc-score-ring [metrics]="…">` | `<tc-score-ring {metrics}>` |

*Also attributes: `heading`, `description`, `score`, `caption`, `subscore`, `still`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-subscore-change` | Yes | `el.addEventListener("tc-subscore-change", (e) => …)` | `ref.current.addEventListener("tc-subscore-change", …)` | `@tc-subscore-change="…"` | `(tc-subscore-change)="…($event)"` | `el.addEventListener("tc-subscore-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `subscore` itself unless a listener calls `preventDefault()` on `tc-subscore-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-score-ring id="score-ring"></tc-score-ring>

<script type="module">
  import "@adamstavely/trenchcoat/score-ring";

  const el = document.querySelector("#score-ring");
  el.addEventListener("tc-subscore-change", (e) => {
    e.preventDefault(); // the element keeps its subscore…
    if (allowed(e.detail.subscore)) el.subscore = e.detail.subscore; // …until the app sets it
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
import "@adamstavely/trenchcoat/score-ring";
import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";

const props = defineProps<{ initial: TcScoreRing["subscore"] }>();
const subscore = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSubscoreChange = (e: CustomEvent<{ subscore: TcScoreRing["subscore"] }>) => {
  e.preventDefault();
  subscore.value = e.detail.subscore;
};
</script>

<template>
  <tc-score-ring :subscore="subscore" @tc-subscore-change="onSubscoreChange"></tc-score-ring>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ScoreRing } from "@adamstavely/trenchcoat/angular/score-ring";
import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";

@Component({
  selector: "app-controlled-score-ring",
  imports: [ScoreRing],
  template: `<tc-score-ring [subscore]="subscore()" (tc-subscore-change)="onSubscoreChange($event)"></tc-score-ring>`,
})
export class ControlledScoreRing {
  readonly initial = input.required<TcScoreRing["subscore"]>();
  readonly subscore = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSubscoreChange(e: CustomEvent<{ subscore: TcScoreRing["subscore"] }>) {
    e.preventDefault();
    this.subscore.set(e.detail.subscore);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/score-ring";
  import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";

  let { initial }: { initial: TcScoreRing["subscore"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let subscore = $derived(initial);
  let el: TcScoreRing;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      subscore = (e as CustomEvent<{ subscore: TcScoreRing["subscore"] }>).detail.subscore;
    };
    el.addEventListener("tc-subscore-change", on);
    return () => el.removeEventListener("tc-subscore-change", on);
  });
</script>

<tc-score-ring bind:this={el} {subscore}></tc-score-ring>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-score-ring")` returns a `TcScoreRing` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";`
- **React / Next.js:** Props: `import type { ScoreRingProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ScoreRing>`. The element class, for refs: `import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcScoreRing["subscores"]` with `import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";`
- **Angular:** The directive types the template: `[subscores]` takes `TcScoreRing["subscores"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcScoreRing } from "@adamstavely/trenchcoat/score-ring";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `subscore` | `string \| null` | The selected sub-score's id – controlled when given (null for none) |
| `defaultSubscore` | `string \| null` | The sub-score selected on mount when `subscore` isn't controlled |
| `onSubscoreChange` | `(subscore: string \| null, item?: ScoreRingSubscore) => void` | A sub-score was selected or cleared |

*Renamed or hidden on the wrapper: `heading`, `subscore`, `children`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

The sub-score rows are one tab stop, on the selected row or else the first.

| Key | What it does |
|---|---|
| ↑ / ↓ or ← / → | Moves to the previous or next sub-score, isolating it |
| Home / End | Moves to the first or last sub-score |
| Enter / Space | Selects the sub-score, or clears it if it's selected |
| Escape | Clears the selected sub-score |
| Tab | Leaves the rows |

### Screen readers

The ring is an image named by a summary: “Data quality: 80 out of 100, Good. Completeness 91, Accuracy 84, Freshness
62, Consistency 71”. The rows are a group of toggle buttons named “Data quality sub-scores” and described by the keys;
each button reads its name, share and value, “Completeness 36% of the score 91”, and is `aria-pressed` when selected.
Selecting is confirmed in a polite status message, “Selected Freshness: 62”, and clearing with “Selection cleared”.
The metrics are a description list.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This component alone** | 18.9 KB | 6.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **33.6 KB** | **11.1 KB** |
| With Lit – the first component on a page | 55.4 KB | 18.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.8 ms** | the gallery demo's data, 65 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of subscores replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 15 ms | subscores: first render, 833 nodes; update 4.1 ms |
| 1,000 items | 90 ms | subscores: first render, 8,033 nodes; update 40 ms |

1,000 items of subscores: 90 ms. It renders every item, so a first render passes 50 ms (a long task) at about 560 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name sub-scores with short nouns: “Completeness”, not “How complete the records are”.
- Give `weight` as relative numbers; the rows show each as a share of the score.
- Write bands that say what to do or how it's going, and keep to three or four.
- Write metric changes with their sign and unit, “+3 days”, and set `trend` to whether it's good news.

## Do and don't

### Do

- Order sub-scores by weight or by how people think about them, and keep the order stable.
- Pass `score` when the overall score isn't a weighted average, so the middle matches your system of record.
- Pair a selected sub-score with what's behind it: the failing checks, the stale records.

### Don't

- Don't use more than about six sub-scores – the segments get too short to read.
- Don't use colour alone for a band – the word is what people read.
- Don't fill the metrics with numbers that don't feed the score.

## Related

- [Coverage Ring](coverage-ring.md) – One share at a glance – a large ring with the percentage and a caption, a title and a line, and a bar from healthiest to needs attention that reads out each segment
- [Radial Bar Chart](radial-bar-chart.md) – A few ratios as rings round a centre, each filled towards its target – the largest emphasised, each named with its value where its ring starts, or activity rings with a lap past each target and a tile per ring – rings that sweep round in turn
- [Gauge](gauge.md) – One value against its range as a 270° dial, a half dial or a bar – the value in big type with the band it's in, bands and ticks round it, a target line and the change since last time; optionally a slider you drag or move with the keys
- [Score Summary](score-summary.md) – NPS or CSAT results – the score in big type, the change since last time with a sparkline, the target, the bands with shares and counts, and a bar per score you can pick to filter comments
