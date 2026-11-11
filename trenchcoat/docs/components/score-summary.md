<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Score Summary

**Data & charts** · New

NPS or CSAT results – the score in big type, the change since last time with a sparkline, the target, the bands with shares and counts, and a bar per score you can pick to filter comments

- **Element:** `<tc-score-summary>`
- **Size:** 13.3 KB gzip · 48.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/score-summary";` |
| React / Next.js | `import { ScoreSummary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/score-summary";` · tags starting with tc- are custom elements |
| Angular | `import { ScoreSummary } from "@adamstavely/trenchcoat/angular/score-summary";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/score-summary";` |

## Example

The live example is in the gallery at `#/score-summary`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The results of an NPS or CSAT survey on one card. The score is in big type with its name – “NPS +32”, “CSAT 84%” –
with how many answered, how it changed since last time and a sparkline of the trend, and a meter with the target
marked. Under it, a stacked bar splits the answers into bands – detractors, passives and promoters for NPS, the five
answers for CSAT – each named with its share and count, and a bar per score shows the whole distribution. Picking a
score's bar fires an event, so the page can filter the comments to it.

NPS is the share of promoters (9–10) minus the share of detractors (0–6), from −100 to +100. CSAT is the share of 4s
and 5s. Both are worked out from the counts and rounded once, half away from zero – one detractor, one passive and
one promoter is an NPS of 0. The band percentages are rounded on their own so they add up to 100, so the score can
be 1 away from the difference of the rounded bands.

### When to use

- A survey dashboard: the headline number and what's behind it.
- Comparing a score with last quarter and a target.
- Letting people drill into the comments for one score.

### When not to use

- Asking the question – use [Score Survey](score-survey.md).
- Counts per grade or category without a score – use [Grade Distribution](grade-distribution.md).
- A metric over time as the main thing – use [KPI Chart](kpi-chart.md).
- Splitting a total into parts that aren't survey answers – use [Breakdown Chart](breakdown-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Score** `.ui-ssm__hero` – the name and the number
2. **Change** `.ui-ssm__change` – up, down or no change from the last period, in words with an arrow
3. **Sparkline** `.ui-ssm__spark` – earlier periods and now
4. **Meter** `.ui-ssm__meter` – where the score sits on its range, with the target marked
5. **Bands** `.ui-ssm__bands` – the stacked bar and a key with each band's share and count
6. **Distribution** `.ui-ssm__dist` – a bar per score, each one a button
7. **Picked** `.ui-ssm__picked` – the picked score's count, share and band

## Looks

Standard puts the heading and the response count on a gray tray and the results on a white card. Clean is one white
card with the heading as its first row. Narrow (under 480 px), the meter goes under the score and the counts over the
bars hide. The band colours are component tokens: `--tc-ssm-detractor`, `--tc-ssm-passive`, `--tc-ssm-promoter` and
`--tc-ssm-csat-1` to `--tc-ssm-csat-5`; `--tc-ssm-dist-h` sets the bars' height.

## Usage

### HTML

```html
<tc-score-summary id="nps" kind="nps" description="Riverside Library app · Q3" target="40"></tc-score-summary>

<script type="module">
  import "@adamstavely/trenchcoat/score-summary";
  import "@adamstavely/trenchcoat/tokens.css";

  const nps = document.querySelector("#nps");
  nps.responses = [6, 3, 4, 5, 7, 11, 16, 38, 52, 74, 96];
  nps.trend = [{ label: "Q1", value: 18 }, { label: "Q2", value: 24 }];
  nps.addEventListener("tc-score-select", (e) => console.log("filter comments to", e.detail.score));
</script>
```

### React / Next.js

```tsx
import { ScoreSummary } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SatisfactionCard({ counts, onFilter }: { counts: number[]; onFilter: (score: number | null) => void }) {
  return <ScoreSummary kind="csat" description="Study-room booking · Q3" responses={counts} previous={78} comparedTo="Q2" onScoreSelect={onFilter} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/score-summary";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";

defineProps<{ responses: TcScoreSummary["responses"]; scores: TcScoreSummary["scores"] }>();
const onScoreSelect = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-score-summary :responses="responses" :scores="scores" @tc-score-select="onScoreSelect"></tc-score-summary>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ScoreSummary } from "@adamstavely/trenchcoat/angular/score-summary";
import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";

@Component({
  selector: "app-score-summary-example",
  imports: [ScoreSummary],
  template: `<tc-score-summary [responses]="responses()" [scores]="scores()" (tc-score-select)="onScoreSelect($event)"></tc-score-summary>`,
})
export class ScoreSummaryExample {
  readonly responses = input.required<TcScoreSummary["responses"]>();
  readonly scores = input.required<TcScoreSummary["scores"]>();
  onScoreSelect(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/score-summary";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";

  let { responses, scores }: { responses: TcScoreSummary["responses"]; scores: TcScoreSummary["scores"] } = $props();
  let el: TcScoreSummary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-score-select", on);
    return () => el.removeEventListener("tc-score-select", on);
  });
</script>

<tc-score-summary bind:this={el} {responses} {scores}></tc-score-summary>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; defaults to "Net Promoter Score" or "Customer satisfaction" |
| `description` | `description` | `string` | `""` | The line under the heading – the survey and the period |
| `kind` | `kind` | `ScoreSurveyKind` | `"nps"` | "nps" for 0–10 answers, "csat" for 1–5 |
| `responses` | – | `number[]` | `[]` | Answers per score, lowest score first: 11 for NPS (0–10), 5 for CSAT (1–5) |
| `scores` | – | `number[]` | `[]` | Or the answers themselves, one score each – used when `responses` is empty |
| `previous` | `previous` | `number \| undefined` | `undefined` | The score last time, for the change; defaults to the last `trend` point |
| `trend` | – | `ScoreTrendPoint[]` | `[]` | Earlier scores, oldest first – drawn as a sparkline ending at the current score |
| `comparedTo` | `compared-to` | `string` | `""` | What the change is compared with – "last quarter"; defaults to the last `trend` label, else "last time" |
| `target` | `target` | `number \| undefined` | `undefined` | The score to reach, shown as a marker |
| `selected` | `selected` | `number \| null` | `null` | The picked score. Changed by the user unless a tc-score-select listener calls preventDefault() |
| `labels` | – | `Partial<ScoreSummaryLabels>` | `{}` | Words the page can rename, merged over `defaultScoreSummaryLabels` |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for numbers |
| `summary` | – | `ScoreSummaryResult` | – | The numbers shown: the total, NPS or CSAT, the bands and the counts |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-score-select` | – | Yes | A score's bar was picked or cleared ({ score, selected }: ScoreSummaryScoreSelect); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-ssm-detractor` | `var(--tc-status-danger-solid)` | both |
| `--tc-ssm-passive` | `var(--tc-chart-neutral)` | both |
| `--tc-ssm-promoter` | `var(--tc-status-success-solid)` | both |
| `--tc-ssm-csat-1` | `var(--tc-status-danger-solid)` | both |
| `--tc-ssm-csat-2` | `var(--tc-status-warning-solid)` | both |
| `--tc-ssm-csat-3` | `var(--tc-chart-neutral)` | both |
| `--tc-ssm-csat-4` | `color-mix(in oklab, var(--tc-status-success-solid) 55%, var(--tc-surface-raised))` | both |
| `--tc-ssm-csat-5` | `var(--tc-status-success-solid)` | both |
| `--tc-ssm-dist-h` | `88px` | both |

#### Design tokens it reads (61)

`--tc-accent-text`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-neutral`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-4xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-ssm-band`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `percentsTo100(counts: number[]): number[]` | Rounds shares of `total` so they add up to exactly 100 – largest remainder first |
| `scoreCounts(kind: ScoreSurveyKind, responses: number[], scores: number[]): number[]` | The counts per score from either input: counts lowest score first, or a list of scores |
| `summarizeScores(kind: ScoreSurveyKind, counts: number[], labels: ScoreSummaryLabels): ScoreSummaryResult` | NPS or CSAT, its bands and the counts – what &lt;tc-score-summary> shows |

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
| `responses` | `el.responses = …;` | `<… responses={…} />` | `<tc-score-summary :responses="…">` | `<tc-score-summary [responses]="…">` | `<tc-score-summary {responses}>` |
| `scores` | `el.scores = …;` | `<… scores={…} />` | `<tc-score-summary :scores="…">` | `<tc-score-summary [scores]="…">` | `<tc-score-summary {scores}>` |
| `trend` | `el.trend = …;` | `<… trend={…} />` | `<tc-score-summary :trend="…">` | `<tc-score-summary [trend]="…">` | `<tc-score-summary {trend}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-score-summary :labels="…">` | `<tc-score-summary [labels]="…">` | `<tc-score-summary {labels}>` |

*Also attributes: `heading`, `description`, `kind`, `previous`, `compared-to`, `target`, `selected`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-score-select` | Yes | `el.addEventListener("tc-score-select", (e) => …)` | `ref.current.addEventListener("tc-score-select", …)` | `@tc-score-select="…"` | `(tc-score-select)="…($event)"` | `el.addEventListener("tc-score-select", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-score-select` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-score-summary id="score-summary"></tc-score-summary>

<script type="module">
  import "@adamstavely/trenchcoat/score-summary";

  const el = document.querySelector("#score-summary");
  el.addEventListener("tc-score-select", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/score-summary";
import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";

const props = defineProps<{ initial: TcScoreSummary["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onScoreSelect = (e: CustomEvent<{ selected: TcScoreSummary["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-score-summary :selected="selected" @tc-score-select="onScoreSelect"></tc-score-summary>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ScoreSummary } from "@adamstavely/trenchcoat/angular/score-summary";
import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";

@Component({
  selector: "app-controlled-score-summary",
  imports: [ScoreSummary],
  template: `<tc-score-summary [selected]="selected()" (tc-score-select)="onScoreSelect($event)"></tc-score-summary>`,
})
export class ControlledScoreSummary {
  readonly initial = input.required<TcScoreSummary["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onScoreSelect(e: CustomEvent<{ selected: TcScoreSummary["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/score-summary";
  import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";

  let { initial }: { initial: TcScoreSummary["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcScoreSummary;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcScoreSummary["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-score-select", on);
    return () => el.removeEventListener("tc-score-select", on);
  });
</script>

<tc-score-summary bind:this={el} {selected}></tc-score-summary>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-score-summary")` returns a `TcScoreSummary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";`
- **React / Next.js:** Props: `import type { ScoreSummaryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ScoreSummary>`. The element class, for refs: `import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcScoreSummary["responses"]` with `import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";`
- **Angular:** The directive types the template: `[responses]` takes `TcScoreSummary["responses"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcScoreSummary } from "@adamstavely/trenchcoat/score-summary";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – defaults to "Net Promoter Score" or "Customer satisfaction" |
| `selected` | `number \| null` | The picked score – controlled when given (null for none) |
| `defaultSelected` | `number \| null` | The score picked on mount when `selected` isn't controlled |
| `onScoreSelect` | `(score: number \| null) => void` | A score's bar was picked or cleared |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the distribution (one stop) |
| ← / → | Moves between the scores' bars |
| Home / End | Goes to the first or last score |
| Enter / Space | Picks the focused score, or clears it when it's already picked |
| Escape | Clears the picked score |

### Screen readers

The card is a `group` named by the heading. The score reads as its name and number (“NPS +38”). The sparkline is
hidden and replaced by text (“Trend: Q1 +18, Q2 +24, now +38”). The bands are a list whose items say the band, its
share and its count. The distribution is a `toolbar` named “Answers by score”; each bar is a toggle button with
`aria-pressed`, named by its score, count and share (“9: 74 responses, 24%”).

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
| Container size queries | 105 | 110 | 16 | 16 | itself, score-survey | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, score-survey | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, score-survey, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | score-survey | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| text-wrap: pretty | 117 | No | 26 | 26 | score-survey | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, score-survey, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.0 KB | 7.2 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [score-survey](score-survey.md) · Element it renders | 18.0 KB | – |
| **Added to a page that already has Lit** | **48.7 KB** | **13.3 KB** |
| With Lit – the first component on a page | 69.2 KB | 20.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.1 ms** | the gallery demo's data, 127 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of responses replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.5 ms | responses: first render, 127 nodes; update 0.4 ms |
| 1,000 items | 1.3 ms | responses: first render, 127 nodes; update 0.4 ms |

What it renders doesn't grow with responses (tested to 1,000 items).

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

- Put the survey and the period in `description` – “Riverside Library app · Q3”.
- Give trend points short period labels; the change says “from Q2”, so the label has to read well there.
- Set `comparedTo` when the comparison isn't the last trend point – “last year”.
- Pass every score in `responses`, zeros included, lowest score first.

## Do and don't

### Do

- Show the response count – a score from 12 answers means little.
- Use the same target across periods.
- Filter the comments when a score is picked; that's what makes the distribution useful.

### Don't

- Don't average NPS answers – the score is promoters minus detractors.
- Don't recolour the bands so promoters and detractors look alike.
- Don't compare an NPS with a CSAT.

## Related

- [Score Survey](score-survey.md) – The NPS or CSAT question a person answers – eleven numbers with the bands shown quietly, or five faces with words; number keys pick, a follow-up per band, Submit and a thank-you with Change answer
- [Grade Distribution](grade-distribution.md) – How a set of assessments came out – a count over each grade (Outstanding to Dissatisfactory, or your own), how many were assessed, empty grades muted, an optional bar in proportion and a grade picked as a filter
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table

## Changelog

- `tc-score-summary` – NPS or CSAT results: the score, change and trend, target, bands and a bar per score.
