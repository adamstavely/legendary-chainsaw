<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Grade Distribution

**Research & portfolio** · New

How a set of assessments came out – a count over each grade (Outstanding to Dissatisfactory, or your own), how many were assessed, empty grades muted, an optional bar in proportion and a grade picked as a filter

- **Element:** `<tc-grade-distribution>`
- **Size:** 6.0 KB gzip · 17.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/grade-distribution";` |
| React / Next.js | `import { GradeDistribution } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/grade-distribution";` · tags starting with tc- are custom elements |
| Angular | `import { GradeDistribution } from "@adamstavely/trenchcoat/angular/grade-distribution";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/grade-distribution";` |

## Example

The live example is in the gallery at `#/grade-distribution`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How a set of assessments came out, in one compact strip. Each grade shows its count over its name – by default
Outstanding, Excellent, Satisfactory and Dissatisfactory – and the heading says how many were assessed: “Paper grades
· 10 assessed”. Grades with no assessments are muted, so the ones that happened stand out. An optional bar underneath
shows the grades in proportion, and with `selectable` a grade can be picked as a filter for a list beside it.

### When to use

- Summing up how papers, proposals, reviews or projects were assessed.
- A filter above a list of assessed items, where the counts help people choose.
- A small summary on an overview page, next to a topic's or a team's other numbers.

### When not to use

- Test cases passing and failing across versions – use [Eval Scorecard](eval-scorecard.md).
- Rating one answer against criteria – use [Feedback Rubric](feedback-rubric.md).
- A share of a whole across many categories – use [Compact Breakdown](compact-breakdown.md).
- Tracing what came of a question – use [Traceability Spine](traceability-spine.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Heading** `.ui-grd__head` – the name and how many were assessed
2. **Grade** `.ui-grd__grade` – a count over its name, coloured by its tone; muted at zero
3. **Pick** `.ui-grd__pick` – with `selectable`, the grade as a toggle button
4. **Bar** `.ui-grd__bar` – with `bar`, the grades in proportion

## Looks

Standard puts the heading on a gray tray above a white card. Clean is one white card with the heading as its first
row. The counts, colours and bar are the same in both.

## Usage

### HTML

```html
<tc-grade-distribution id="grades" heading="Paper grades" bar selectable></tc-grade-distribution>

<script type="module">
  import "@adamstavely/trenchcoat/grade-distribution";
  import "@adamstavely/trenchcoat/tokens.css";

  const grades = document.querySelector("#grades");
  grades.grades = [
    { id: "outstanding", label: "Outstanding", count: 1, tone: "success" },
    { id: "excellent", label: "Excellent", count: 0, tone: "info" },
    { id: "satisfactory", label: "Satisfactory", count: 1 },
    { id: "dissatisfactory", label: "Dissatisfactory", count: 0, tone: "danger" },
  ];
  grades.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { GradeDistribution, type Grade } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const grades: Grade[] = [
  { id: "outstanding", label: "Outstanding", count: 1, tone: "success" },
  { id: "satisfactory", label: "Satisfactory", count: 1 },
];

export function Grades() {
  const [selected, setSelected] = useState<string | null>(null);
  return <GradeDistribution title="Paper grades" grades={grades} bar selectable selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/grade-distribution";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";

defineProps<{ grades: TcGradeDistribution["grades"]; selected: TcGradeDistribution["selected"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-grade-distribution :grades="grades" :selected="selected" @tc-selected-change="onSelectedChange"></tc-grade-distribution>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GradeDistribution } from "@adamstavely/trenchcoat/angular/grade-distribution";
import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";

@Component({
  selector: "app-grade-distribution-example",
  imports: [GradeDistribution],
  template: `<tc-grade-distribution [grades]="grades()" [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-grade-distribution>`,
})
export class GradeDistributionExample {
  readonly grades = input.required<TcGradeDistribution["grades"]>();
  readonly selected = input.required<TcGradeDistribution["selected"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/grade-distribution";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";

  let { grades, selected }: { grades: TcGradeDistribution["grades"]; selected: TcGradeDistribution["selected"] } = $props();
  let el: TcGradeDistribution;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-grade-distribution bind:this={el} {grades} {selected}></tc-grade-distribution>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Grades"` | The heading |
| `assessedLabel` | `assessed-label` | `string` | `"assessed"` | What was assessed, after the count: "2 assessed" |
| `grades` | – | `Grade[]` | `[ { id: "outstanding", label: "Outstanding", count: 0, tone: "success" }, { id: "excellent", label: "Excellent", count: 0, tone: "info" }, { id: "satisfactory", label: "Satisfactory", count: 0, tone: "neutral" }, { id: "dissatisfactory", label: "Dissatisfactory", count: 0, tone: "danger" }, ]` | The grades in order, best first, each with its count |
| `bar` | `bar` | `boolean` | `false` | Shows a bar in proportion under the counts |
| `selectable` | `selectable` | `boolean` | `false` | Grades can be picked as a filter |
| `selected` | – | `string \| null` | `null` | The grade picked as a filter. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A grade was picked or cleared as a filter ({ selected, grade }: GradeSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Design tokens it reads (54)

`--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-md`, `--tc-font-size-xs`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display-sm`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-meter-radius`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `grades` | `el.grades = …;` | `<… grades={…} />` | `<tc-grade-distribution :grades="…">` | `<tc-grade-distribution [grades]="…">` | `<tc-grade-distribution {grades}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-grade-distribution :selected="…">` | `<tc-grade-distribution [selected]="…">` | `<tc-grade-distribution {selected}>` |

*Also attributes: `heading`, `assessed-label`, `bar`, `selectable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-grade-distribution id="grade-distribution"></tc-grade-distribution>

<script type="module">
  import "@adamstavely/trenchcoat/grade-distribution";

  const el = document.querySelector("#grade-distribution");
  el.addEventListener("tc-selected-change", (e) => {
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
import "@adamstavely/trenchcoat/grade-distribution";
import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";

const props = defineProps<{ initial: TcGradeDistribution["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcGradeDistribution["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-grade-distribution :selected="selected" @tc-selected-change="onSelectedChange"></tc-grade-distribution>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { GradeDistribution } from "@adamstavely/trenchcoat/angular/grade-distribution";
import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";

@Component({
  selector: "app-controlled-grade-distribution",
  imports: [GradeDistribution],
  template: `<tc-grade-distribution [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-grade-distribution>`,
})
export class ControlledGradeDistribution {
  readonly initial = input.required<TcGradeDistribution["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcGradeDistribution["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/grade-distribution";
  import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";

  let { initial }: { initial: TcGradeDistribution["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcGradeDistribution;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcGradeDistribution["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-grade-distribution bind:this={el} {selected}></tc-grade-distribution>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-grade-distribution")` returns a `TcGradeDistribution` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";`
- **React / Next.js:** Props: `import type { GradeDistributionProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GradeDistribution>`. The element class, for refs: `import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGradeDistribution["grades"]` with `import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";`
- **Angular:** The directive types the template: `[grades]` takes `TcGradeDistribution["grades"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGradeDistribution } from "@adamstavely/trenchcoat/grade-distribution";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `selected` | `string \| null` | The grade picked as a filter – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The grade picked on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, grade?: Grade) => void` | A grade was picked or cleared; `grade` is the picked grade |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

Without `selectable` the strip has no tab stops. With it, the grades are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next grade |
| Home / End | Moves to the first or last grade |
| Enter / Space | Picks the grade as a filter, or clears it if it's picked |
| Escape | Clears the picked grade |
| Tab | Leaves the strip |

### Screen readers

The grades are a list – or, with `selectable`, a toolbar – named “Paper grades, 10 assessed”. Each grade reads its
count and name, “3 Outstanding”; picked, its toggle button is pressed. The bar is hidden; the counts say the same.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
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
| **This component alone** | 11.1 KB | 4.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **17.9 KB** | **6.0 KB** |
| With Lit – the first component on a page | 39.7 KB | 13.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 25 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of grades replaced |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.6 ms | grades: first render, 481 nodes; update 0.9 ms |
| 1,000 items | 29 ms | grades: first render, 4,756 nodes; update 3.8 ms |

1,000 items of grades: 29 ms, 4,756 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Order grades from best to worst, and keep the names to one word.
- Set `assessed-label` to what was assessed when “assessed” isn't clear: “papers graded”.
- Use tones that match the grades' meaning: success for the best, danger for the worst.

## Do and don't

### Do

- Show every grade, even at zero, so the scale is clear.
- Pair `selectable` with a list that filters as a grade is picked.

### Don't

- Don't use more than five or six grades – past that, use a chart.
- Don't make it selectable when nothing on the page filters.

## Related

- [Traceability Spine](traceability-spine.md) – The chain from open questions to outcomes – a column per stage from questions and gaps to work, papers and who cites them, linked cards joined by lines, and a card's whole path traced on click with the rest dimmed
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals
- [Compact Breakdown](compact-breakdown.md) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes

## Changelog

- **`tc-grade-distribution`:** a count over each assessment grade. - **Display:** grades with no assessments are muted, and an optional bar shows their proportions. - **Filtering:** a grade can be picked as a filter.
