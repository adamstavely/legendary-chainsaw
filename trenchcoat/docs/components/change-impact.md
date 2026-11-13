<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Change Impact

**Data & charts** · New

Did a change make the agent better or worse – before against after per judge criterion as a dumbbell, the difference and a verdict in words (Better, likely · No clear change · Worse, likely) from the counts, cost and latency, sample sizes, a summing-up line and a segment switch

- **Element:** `<tc-change-impact>`
- **Size:** 8.5 KB gzip · 27.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/change-impact";` |
| React / Next.js | `import { ChangeImpact } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/change-impact";` · tags starting with tc- are custom elements |
| Angular | `import { ChangeImpact } from "@adamstavely/trenchcoat/angular/change-impact";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/change-impact";` |

## Example

The live example is in the gallery at `#/change-impact`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Did this change make the agent better or worse? For one change – a prompt version, a model, a tool – the card sets
the chats before it against the chats after it. Each judge criterion is a row: the two means as a dumbbell, the
difference, and a verdict in words – "Better, likely", "No clear change" or "Worse, likely" – worked out from the
counts the page sends, so a wobble on a quiet week isn't read as a result. Cost per chat and latency follow, with the
sample sizes and a line that sums it all up. A segment switch reads the same change for one slice of the traffic.

### When to use

- Deciding whether to keep a change that has been live for a while, or a canary running beside the old version.
- Explaining a release's effect to people who won't read a chart.
- Finding which slice of the traffic a change hurt or helped.

### When not to use

- Scores day by day with every change on the axis – use [Quality Trend](quality-trend.md).
- One drop that needs a decision now – use [Quality Drop](quality-drop.md).
- Two single runs step by step – use [Run Compare](run-compare.md).
- Before and after for many items with no verdict – use [Dumbbell Chart](dumbbell-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `.ui-chi__line` – the verdicts in one sentence, and the cost change
2. **Samples** `.ui-chi__samples` – how many chats each side rests on
3. **Segment** `.ui-chi__seg` – all traffic or one slice
4. **Row** `.ui-chi__row` – a criterion: name and chats, the dumbbell, before → after and the difference, the verdict
5. **Examples** `.ui-chi__examples` – buttons for each side's example chats
6. **Cost and latency** `.ui-chi__metrics` – before → after and the change in %

## Looks

Standard puts the header on a gray tray above a white card; Clean is one white card. The overall verdict is a pill in
the header – Better, Worse, Mixed or No clear change. A row's "after" dot and the bar between the dots take
`--tc-change-impact-better`, `--tc-change-impact-worse` or `--tc-change-impact-same`, beside an arrow and the verdict's
words. Narrow, each row stacks: name and verdict, the dumbbell, then the numbers and examples.

## Usage

### HTML

```html
<tc-change-impact id="impact"></tc-change-impact>

<script type="module">
  import "@adamstavely/trenchcoat/change-impact";
  import "@adamstavely/trenchcoat/tokens.css";

  const impact = document.querySelector("#impact");
  impact.change = { label: "Prompt v13 → v14", before: "v13", after: "v14" };
  impact.criteria = [
    { id: "correct", label: "Correctness", before: { mean: 4.42, n: 1240, sd: 0.9 }, after: { mean: 3.81, n: 1184, sd: 1.1 } },
    { id: "cites", label: "Cites policy", before: { passes: 1066, n: 1240 }, after: { passes: 829, n: 1184 } },
    { id: "tone", label: "Tone", before: { mean: 4.31, n: 1240 }, after: { mean: 4.52, n: 1184 } },
  ];
  impact.cost = { before: 0.0118, after: 0.0096 };
  impact.addEventListener("tc-examples-open", (e) => console.log(e.detail.criterion, e.detail.side));
</script>
```

### React / Next.js

```tsx
import { ChangeImpact, type ImpactCriterion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReleaseImpact({ criteria }: { criteria: ImpactCriterion[] }) {
  return (
    <ChangeImpact
      title="Did v14 help?"
      change={{ label: "Prompt v13 → v14", before: "v13", after: "v14" }}
      criteria={criteria}
      onExamplesOpen={(criterion, side) => console.log(criterion, side)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/change-impact";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";

defineProps<{ change: TcChangeImpact["change"]; criteria: TcChangeImpact["criteria"] }>();
const onSegmentChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-change-impact :change="change" :criteria="criteria" @tc-segment-change="onSegmentChange"></tc-change-impact>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ChangeImpact } from "@adamstavely/trenchcoat/angular/change-impact";
import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";

@Component({
  selector: "app-change-impact-example",
  imports: [ChangeImpact],
  template: `<tc-change-impact [change]="change()" [criteria]="criteria()" (tc-segment-change)="onSegmentChange($event)"></tc-change-impact>`,
})
export class ChangeImpactExample {
  readonly change = input.required<TcChangeImpact["change"]>();
  readonly criteria = input.required<TcChangeImpact["criteria"]>();
  onSegmentChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/change-impact";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";

  let { change, criteria }: { change: TcChangeImpact["change"]; criteria: TcChangeImpact["criteria"] } = $props();
  let el: TcChangeImpact;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-segment-change", on);
    return () => el.removeEventListener("tc-segment-change", on);
  });
</script>

<tc-change-impact bind:this={el} {change} {criteria}></tc-change-impact>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Change impact"` | The heading |
| `change` | – | `ImpactChange \| null` | `null` | The change being judged, and the names of its two sides |
| `criteria` | – | `ImpactCriterion[]` | `[]` | One entry per judge criterion, over all traffic |
| `cost` | – | `ImpactMetric \| null` | `null` | Cost per chat before and after, over all traffic |
| `latency` | – | `ImpactMetric \| null` | `null` | Median latency in ms before and after, over all traffic |
| `segments` | – | `ImpactSegment[]` | `[]` | Slices of the traffic, each with its own criteria (and cost and latency, if known) |
| `segment` | – | `string \| null` | `null` | The segment shown; null for all traffic |
| `min` | `min` | `number` | `1` | The lowest judge score – the dumbbells' left edge for scores (pass rates run 0–100%) |
| `max` | `max` | `number` | `5` | The highest judge score |
| `spread` | `spread` | `number` | `1` | A score's spread (standard deviation) when a criterion gives none |
| `z` | `z` | `number` | `1.96` | How many standard errors make a difference "likely" |
| `currency` | `currency` | `string` | `"USD"` | The currency of `cost` |
| `locale` | `locale` | `string` | `"en-US"` | Formats numbers |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-segment-change` | – | Yes | A segment was picked, or all traffic ({ segment }: ChangeImpactSegmentChange); cancelable – prevented, `segment` stays as it was |
| `tc-examples-open` | – | No | A row's before or after examples were asked for ({ criterion, side }: ChangeImpactExamplesOpen) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-change-impact-dot` | `10px` | both |
| `--tc-change-impact-better` | `var(--tc-status-success-solid)` | both |
| `--tc-change-impact-worse` | `var(--tc-status-danger-solid)` | both |
| `--tc-change-impact-same` | `var(--tc-text-muted)` | both |

#### Design tokens it reads (58)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `changeImpact(c: ImpactCriterion, spread: unknown, z: unknown): ImpactResult` | One criterion's before, after, difference, how many standard errors that is, and the verdict |

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
| `change` | `el.change = …;` | `<… change={…} />` | `<tc-change-impact :change="…">` | `<tc-change-impact [change]="…">` | `<tc-change-impact {change}>` |
| `criteria` | `el.criteria = …;` | `<… criteria={…} />` | `<tc-change-impact :criteria="…">` | `<tc-change-impact [criteria]="…">` | `<tc-change-impact {criteria}>` |
| `cost` | `el.cost = …;` | `<… cost={…} />` | `<tc-change-impact :cost="…">` | `<tc-change-impact [cost]="…">` | `<tc-change-impact {cost}>` |
| `latency` | `el.latency = …;` | `<… latency={…} />` | `<tc-change-impact :latency="…">` | `<tc-change-impact [latency]="…">` | `<tc-change-impact {latency}>` |
| `segments` | `el.segments = …;` | `<… segments={…} />` | `<tc-change-impact :segments="…">` | `<tc-change-impact [segments]="…">` | `<tc-change-impact {segments}>` |
| `segment` | `el.segment = …;` | `<… segment={…} />` | `<tc-change-impact :segment="…">` | `<tc-change-impact [segment]="…">` | `<tc-change-impact {segment}>` |

*Also attributes: `heading`, `min`, `max`, `spread`, `z`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-segment-change` | Yes | `el.addEventListener("tc-segment-change", (e) => …)` | `ref.current.addEventListener("tc-segment-change", …)` | `@tc-segment-change="…"` | `(tc-segment-change)="…($event)"` | `el.addEventListener("tc-segment-change", …)` |
| `tc-examples-open` | No | `el.addEventListener("tc-examples-open", (e) => …)` | `onExamplesOpen={…}` | `@tc-examples-open="…"` | `(tc-examples-open)="…($event)"` | `el.addEventListener("tc-examples-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `segment` itself unless a listener calls `preventDefault()` on `tc-segment-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-change-impact id="change-impact"></tc-change-impact>

<script type="module">
  import "@adamstavely/trenchcoat/change-impact";

  const el = document.querySelector("#change-impact");
  el.addEventListener("tc-segment-change", (e) => {
    e.preventDefault(); // the element keeps its segment…
    if (allowed(e.detail.segment)) el.segment = e.detail.segment; // …until the app sets it
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
import "@adamstavely/trenchcoat/change-impact";
import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";

const props = defineProps<{ initial: TcChangeImpact["segment"] }>();
const segment = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSegmentChange = (e: CustomEvent<{ segment: TcChangeImpact["segment"] }>) => {
  e.preventDefault();
  segment.value = e.detail.segment;
};
</script>

<template>
  <tc-change-impact :segment="segment" @tc-segment-change="onSegmentChange"></tc-change-impact>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ChangeImpact } from "@adamstavely/trenchcoat/angular/change-impact";
import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";

@Component({
  selector: "app-controlled-change-impact",
  imports: [ChangeImpact],
  template: `<tc-change-impact [segment]="segment()" (tc-segment-change)="onSegmentChange($event)"></tc-change-impact>`,
})
export class ControlledChangeImpact {
  readonly initial = input.required<TcChangeImpact["segment"]>();
  readonly segment = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSegmentChange(e: CustomEvent<{ segment: TcChangeImpact["segment"] }>) {
    e.preventDefault();
    this.segment.set(e.detail.segment);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/change-impact";
  import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";

  let { initial }: { initial: TcChangeImpact["segment"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let segment = $derived(initial);
  let el: TcChangeImpact;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      segment = (e as CustomEvent<{ segment: TcChangeImpact["segment"] }>).detail.segment;
    };
    el.addEventListener("tc-segment-change", on);
    return () => el.removeEventListener("tc-segment-change", on);
  });
</script>

<tc-change-impact bind:this={el} {segment}></tc-change-impact>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-change-impact")` returns a `TcChangeImpact` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";`
- **React / Next.js:** Props: `import type { ChangeImpactProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ChangeImpact>`. The element class, for refs: `import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcChangeImpact["change"]` with `import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";`
- **Angular:** The directive types the template: `[change]` takes `TcChangeImpact["change"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcChangeImpact } from "@adamstavely/trenchcoat/change-impact";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `segment` | `string \| null` | The segment shown, or null for all traffic. Controlled when defined |
| `defaultSegment` | `string \| null` | The segment at first when `segment` isn't controlled |
| `onSegmentChange` | `(segment: string \| null) => void` | Called with the segment the user picked, controlled or not |
| `onExamplesOpen` | `(criterion: string, side: "before" \| "after") => void` | Called when a row's before or after examples are asked for |

*Renamed or hidden on the wrapper: `heading`, `segment`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the segment switch, then each row's before and after example buttons |
| ↑ / ↓ | In the segment switch, picks another segment |
| Enter / Space | On an example button, asks for that side's example chats (tc-examples-open) |

### Screen readers

The rows are a list named "Criteria"; each reads its name, chats, "4.42 to 3.81 −0.61" and its verdict in words. The
dumbbell is hidden – the numbers say it. The example buttons read "v13 examples, Correctness". Cost and latency are a
description list ("Cost per chat £0.012 to £0.0096, −19%, lower"). Changing the segment says the new summary in a
status region.

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
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
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
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.7 KB** | **8.5 KB** |
| With Lit – the first component on a page | 48.4 KB | 15.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 142 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of criteria replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 20 ms | criteria: first render, 2,422 nodes; update 5.5 ms |
| 1,000 items | 138 ms | criteria: first render, 23,797 nodes; update 40 ms |

1,000 items of criteria: 138 ms. It renders every item, so a first render passes 50 ms (a long task) at about 360 items – page or filter longer lists.

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

- Send pass counts (`{ passes, n }`) for yes/no criteria and means with their spread (`{ mean, n, sd }`) for scores.
- Name the sides as people know them – "v13" and "v14", or "Atlas 2" and "Atlas 3".
- Set `higherIsBetter: false` on a criterion where less is better, such as a refusal rate.
- Compare like with like: the same days of the week, the same traffic mix, on each side.

## Do and don't

### Do

- Wait for enough chats – a "No clear change" on a small sample is an honest answer.
- Add the segments people ask about (topic, language, customer tier).

### Don't

- Don't read "No clear change" as "no change": it means the data can't tell yet.
- Don't mix judges or rubric versions between the two sides.

## Related

- [Quality Trend](quality-trend.md) – Judge scores on live chats day by day – a line per criterion with a band from its sample size, the changes pinned on the time axis, a sentence saying what moved since the latest one, a 7 / 30 / 90-day switch, criterion toggles and a table view
- [Quality Drop](quality-drop.md) – One drop in a judge score on live chats – what fell and since when, a small chart round it, the likely cause with how sure in words and failing chats as quotes, the topics it clusters in, and Roll back (after saying what reverts), Investigate or Dismiss as expected
- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Dumbbell Chart](dumbbell-chart.md) – Two values per item, before and after or target and actual, as a hollow and a solid dot joined by a bar, ordered by the second, the biggest move emphasised, bars that stretch in, and a table view
