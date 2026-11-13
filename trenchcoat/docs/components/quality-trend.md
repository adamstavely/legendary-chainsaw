<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Quality Trend

**Data & charts** · New

Judge scores on live chats day by day – a line per criterion with a band from its sample size, the changes pinned on the time axis, a sentence saying what moved since the latest one, a 7 / 30 / 90-day switch, criterion toggles and a table view

- **Element:** `<tc-quality-trend>`
- **Size:** 10.6 KB gzip · 32.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/quality-trend";` |
| React / Next.js | `import { QualityTrend } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/quality-trend";` · tags starting with tc- are custom elements |
| Angular | `import { QualityTrend } from "@adamstavely/trenchcoat/angular/quality-trend";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/quality-trend";` |

## Example

The live example is in the gallery at `#/quality-trend`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How an agent's answers are scoring on live traffic, day by day, and what changed along the way. A judge scores every
chat on a few criteria – correctness, citing the source, helpfulness, tone – and each criterion is a line. Round each
line is a band that is wide on quiet days, when the mean rests on a few chats, and narrow on busy ones. The changes
made to the agent sit on the time axis as pins: a new prompt version, a model switch, a new tool. A sentence above the
chart says what moved since the latest change – "Correctness 4.4 → 3.8 since v14 on 3 Nov" – so the chart is read
before it is studied.

### When to use

- Watching a production agent's judge scores after a release.
- Seeing whether a prompt, model or tool change lines up with a rise or a fall.
- A quality page with a few criteria on one scale (1–5, or 0–1).

### When not to use

- One drop to act on – what fell, why, and a rollback – use [Quality Drop](quality-drop.md).
- Before against after for one change, with how sure the difference is – use [Change Impact](change-impact.md).
- One metric with a headline number and a delta – use [KPI Chart](kpi-chart.md).
- A fixed set of test cases across versions – use [Eval Scorecard](eval-scorecard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `.ui-qtr__summary` – what moved since the latest change in range, in words
2. **Range** `.ui-qtr__range` – 7, 30 or 90 days
3. **Table** `.ui-qtr__view` – swaps the chart for the same days as a table
4. **Legend** `.ui-qtr__legend` – a toggle per criterion, with its line style and average
5. **Chart** `.ui-qtr__plot` – a line and a band per criterion, the score scale and the dates
6. **Change pins** `.ui-qtr__pins` – a mark per change on its date, with a tooltip

## Looks

Standard puts the header on a gray tray above a white card; Clean is one white card with the header as its first row.
Criteria take `--tc-chart-1…6` in order, or their own `color`, and each is drawn solid, dashed, dotted or dash-dot too.
The band's strength is `--tc-quality-trend-band` (0.14); the pin's size `--tc-quality-trend-pin`.

## Usage

### HTML

```html
<tc-quality-trend id="trend" heading="Policy Q&A · judge scores" range="7d"></tc-quality-trend>

<script type="module">
  import "@adamstavely/trenchcoat/quality-trend";
  import "@adamstavely/trenchcoat/tokens.css";

  const DAY = 86400000;
  const end = Date.UTC(2026, 10, 10);
  const trend = document.querySelector("#trend");
  trend.criteria = [
    { id: "correct", label: "Correctness" },
    { id: "cites", label: "Cites policy" },
  ];
  trend.days = Array.from({ length: 7 }, (_, i) => ({
    date: end - (6 - i) * DAY,
    scores: { correct: { mean: i < 3 ? 4.4 : 3.8, n: 160 }, cites: { mean: i < 3 ? 4.1 : 3.7, n: 160 } },
  }));
  trend.changes = [{ id: "v14", at: end - 3 * DAY, label: "Prompt v13 → v14", short: "v14", kind: "prompt" }];
  trend.addEventListener("tc-change-open", (e) => console.log(e.detail.change.label));
</script>
```

### React / Next.js

```tsx
import { QualityTrend, type QualityChange, type QualityCriterion, type QualityDay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function JudgeScores({ criteria, days, changes }: { criteria: QualityCriterion[]; days: QualityDay[]; changes: QualityChange[] }) {
  return (
    <QualityTrend
      title="Policy Q&A · judge scores"
      criteria={criteria}
      days={days}
      changes={changes}
      defaultRange="30d"
      onChangeOpen={(change) => console.log("Open", change.id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/quality-trend";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";

defineProps<{ criteria: TcQualityTrend["criteria"]; days: TcQualityTrend["days"] }>();
const onRangeChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-quality-trend :criteria="criteria" :days="days" @tc-range-change="onRangeChange"></tc-quality-trend>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { QualityTrend } from "@adamstavely/trenchcoat/angular/quality-trend";
import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";

@Component({
  selector: "app-quality-trend-example",
  imports: [QualityTrend],
  template: `<tc-quality-trend [criteria]="criteria()" [days]="days()" (tc-range-change)="onRangeChange($event)"></tc-quality-trend>`,
})
export class QualityTrendExample {
  readonly criteria = input.required<TcQualityTrend["criteria"]>();
  readonly days = input.required<TcQualityTrend["days"]>();
  onRangeChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/quality-trend";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";

  let { criteria, days }: { criteria: TcQualityTrend["criteria"]; days: TcQualityTrend["days"] } = $props();
  let el: TcQualityTrend;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-range-change", on);
    return () => el.removeEventListener("tc-range-change", on);
  });
</script>

<tc-quality-trend bind:this={el} {criteria} {days}></tc-quality-trend>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Quality on live chats"` | The heading |
| `description` | `description` | `string` | `""` | A line under the heading – the agent, the judge |
| `criteria` | – | `QualityCriterion[]` | `[]` | The criteria the judge scores, in legend order |
| `days` | – | `QualityDay[]` | `[]` | One entry per day, any order – the last day is the end of every range |
| `changes` | – | `QualityChange[]` | `[]` | The changes made to the agent – prompts, models, tools – pinned where they went live |
| `range` | `range` | `QualityRange` | `"30d"` | How many days show: "7d", "30d" or "90d" |
| `shown` | – | `string[] \| null` | `null` | The ids of the criteria drawn; null draws every one |
| `view` | `view` | `QualityTrendView` | `"chart"` | "chart", or "table" for the same days as a table |
| `min` | `min` | `number` | `1` | The lowest score on the scale |
| `max` | `max` | `number` | `5` | The highest score on the scale |
| `spread` | `spread` | `number` | `1` | A score's spread (standard deviation) when a day gives none – sets the band's width with the day's chats |
| `threshold` | `threshold` | `number` | `0.1` | How far a mean must move for the summary to call it a change |
| `locale` | `locale` | `string` | `"en-US"` | Formats dates and numbers |
| `timeZone` | `time-zone` | `string` | `"UTC"` | The time zone dates are read in – UTC by default, so a day's midnight stays that day |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-range-change` | – | Yes | 7, 30 or 90 days was picked ({ range }: QualityTrendRangeChange); cancelable – prevented, `range` stays as it was |
| `tc-shown-change` | – | Yes | A criterion was shown or hidden ({ shown }: QualityTrendShownChange); cancelable – prevented, `shown` stays as it was |
| `tc-view-change` | – | Yes | Table was pressed ({ view }: QualityTrendViewChange); cancelable – prevented, `view` stays as it was |
| `tc-change-open` | – | No | A change pin was clicked or picked with Enter ({ id, change }: QualityTrendChangeOpen) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-quality-trend-band` | `0.14` | both |
| `--tc-quality-trend-tip-w` | `220px` | both |
| `--tc-quality-trend-pin` | `22px` | both |

#### Design tokens it reads (62)

`--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-quality-trend-ink`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `qualityBand(score: QualityScore, spread: unknown, z: unknown): void` | Half the width of a score's band: z × standard error, from its own spread or the element's `spread` |
| `qualityShift(days: readonly QualityDay[], id: string, at: number): QualityShift` | A criterion's mean on the days before `at` and on the days from it, each weighted by the day's chats |

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
| `criteria` | `el.criteria = …;` | `<… criteria={…} />` | `<tc-quality-trend :criteria="…">` | `<tc-quality-trend [criteria]="…">` | `<tc-quality-trend {criteria}>` |
| `days` | `el.days = …;` | `<… days={…} />` | `<tc-quality-trend :days="…">` | `<tc-quality-trend [days]="…">` | `<tc-quality-trend {days}>` |
| `changes` | `el.changes = …;` | `<… changes={…} />` | `<tc-quality-trend :changes="…">` | `<tc-quality-trend [changes]="…">` | `<tc-quality-trend {changes}>` |
| `shown` | `el.shown = …;` | `<… shown={…} />` | `<tc-quality-trend :shown="…">` | `<tc-quality-trend [shown]="…">` | `<tc-quality-trend {shown}>` |

*Also attributes: `heading`, `description`, `range`, `view`, `min`, `max`, `spread`, `threshold` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-range-change` | Yes | `el.addEventListener("tc-range-change", (e) => …)` | `ref.current.addEventListener("tc-range-change", …)` | `@tc-range-change="…"` | `(tc-range-change)="…($event)"` | `el.addEventListener("tc-range-change", …)` |
| `tc-shown-change` | Yes | `el.addEventListener("tc-shown-change", (e) => …)` | `ref.current.addEventListener("tc-shown-change", …)` | `@tc-shown-change="…"` | `(tc-shown-change)="…($event)"` | `el.addEventListener("tc-shown-change", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-change-open` | No | `el.addEventListener("tc-change-open", (e) => …)` | `onChangeOpen={…}` | `@tc-change-open="…"` | `(tc-change-open)="…($event)"` | `el.addEventListener("tc-change-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `range`, `shown` and `view` itself unless a listener calls `preventDefault()` on `tc-range-change`, `tc-shown-change` or `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-quality-trend id="quality-trend"></tc-quality-trend>

<script type="module">
  import "@adamstavely/trenchcoat/quality-trend";

  const el = document.querySelector("#quality-trend");
  el.addEventListener("tc-range-change", (e) => {
    e.preventDefault(); // the element keeps its range…
    if (allowed(e.detail.range)) el.range = e.detail.range; // …until the app sets it
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
import "@adamstavely/trenchcoat/quality-trend";
import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";

const props = defineProps<{ initial: TcQualityTrend["range"] }>();
const range = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRangeChange = (e: CustomEvent<{ range: TcQualityTrend["range"] }>) => {
  e.preventDefault();
  range.value = e.detail.range;
};
</script>

<template>
  <tc-quality-trend :range="range" @tc-range-change="onRangeChange"></tc-quality-trend>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { QualityTrend } from "@adamstavely/trenchcoat/angular/quality-trend";
import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";

@Component({
  selector: "app-controlled-quality-trend",
  imports: [QualityTrend],
  template: `<tc-quality-trend [range]="range()" (tc-range-change)="onRangeChange($event)"></tc-quality-trend>`,
})
export class ControlledQualityTrend {
  readonly initial = input.required<TcQualityTrend["range"]>();
  readonly range = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRangeChange(e: CustomEvent<{ range: TcQualityTrend["range"] }>) {
    e.preventDefault();
    this.range.set(e.detail.range);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/quality-trend";
  import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";

  let { initial }: { initial: TcQualityTrend["range"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let range = $derived(initial);
  let el: TcQualityTrend;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      range = (e as CustomEvent<{ range: TcQualityTrend["range"] }>).detail.range;
    };
    el.addEventListener("tc-range-change", on);
    return () => el.removeEventListener("tc-range-change", on);
  });
</script>

<tc-quality-trend bind:this={el} {range}></tc-quality-trend>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-quality-trend")` returns a `TcQualityTrend` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";`
- **React / Next.js:** Props: `import type { QualityTrendProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof QualityTrend>`. The element class, for refs: `import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcQualityTrend["criteria"]` with `import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";`
- **Angular:** The directive types the template: `[criteria]` takes `TcQualityTrend["criteria"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcQualityTrend } from "@adamstavely/trenchcoat/quality-trend";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `range` | `QualityRange` | How many days show – "7d", "30d" or "90d". Controlled when defined |
| `defaultRange` | `QualityRange` | The range at first when `range` isn't controlled |
| `onRangeChange` | `(range: QualityRange) => void` | Called with the range the user picked, controlled or not |
| `shown` | `string[] \| null` | The ids of the criteria drawn (null: all). Controlled when defined |
| `defaultShown` | `string[] \| null` | The criteria drawn at first when `shown` isn't controlled |
| `onShownChange` | `(shown: string[] \| null) => void` | Called with the criteria drawn after one is toggled, controlled or not |
| `view` | `QualityTrendView` | "chart" or "table". Controlled when defined |
| `defaultView` | `QualityTrendView` | The view at first when `view` isn't controlled |
| `onViewChange` | `(view: QualityTrendView) => void` | Called when Table is pressed, controlled or not |
| `onChangeOpen` | `(change: QualityChange) => void` | Called when a change pin is clicked or picked with Enter |

*Renamed or hidden on the wrapper: `heading`, `range`, `shown`, `view`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the range, Table, each criterion toggle, the change pins, then the table when it shows |
| ← / → / ↑ / ↓ | In the range, picks the previous or next range |
| ← / → / Home / End | In the change pins, moves between them and shows each one's tooltip |
| Enter / Space | On a pin, opens the change (tc-change-open); on a toggle, shows or hides the criterion |
| Escape | Hides the open pin's tooltip |

### Screen readers

The chart is a `figure` named by the heading and described by the summary sentence; the drawing itself is hidden,
because the summary and the table carry its numbers. Table switches to a real `table` of the days, newest first, with
each criterion's mean and chats. The range is a `radiogroup` named "Range" ("7d, last 7 days"). The criterion toggles
are a group of buttons with `aria-pressed`, each read with its average. The pins are a `toolbar` named "Changes", each
read as "Prompt v13 → v14, 3 Nov" with its detail. Changing the range or a toggle is said in a status region.

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
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This component alone** | 24.6 KB | 8.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **32.9 KB** | **10.6 KB** |
| With Lit – the first component on a page | 53.6 KB | 17.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 84 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of days replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.3 ms | days: first render, 84 nodes; update 0.3 ms |
| 1,000 items | 1.5 ms | days: first render, 84 nodes; update 0.6 ms |

What it renders doesn't grow with days (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep criteria to two to five, named as the judge names them.
- Give each change a short name for the summary (`short: "v14"`) and a label that says what changed.
- Send the day's chat count with each score – the band and the summary weigh by it.
- Send days as midnight UTC, or set `time-zone` to the zone they were cut in.

## Do and don't

### Do

- Put every release on the axis, even the ones you expect nothing from – a flat line after a change is news too.
- Set `min` and `max` to the judge's scale, so a fall of 0.5 looks like what it is.

### Don't

- Don't plot criteria on different scales together.
- Don't hide the band to make a line look steadier.
- Don't use it to compare two versions running side by side – the dates mix them; use `change-impact`.

## Related

- [Quality Drop](quality-drop.md) – One drop in a judge score on live chats – what fell and since when, a small chart round it, the likely cause with how sure in words and failing chats as quotes, the topics it clusters in, and Roll back (after saying what reverts), Investigate or Dismiss as expected
- [Change Impact](change-impact.md) – Did a change make the agent better or worse – before against after per judge criterion as a dumbbell, the difference and a verdict in words (Better, likely · No clear change · Worse, likely) from the counts, cost and latency, sample sizes, a summing-up line and a segment switch
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
