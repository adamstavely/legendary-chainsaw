<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Reliance Gauge

**Trust & calibration** · New

Whether trust in the AI matches how it performs – a reliance index with its trend, signals against review thresholds, and overtrust and undertrust caught

- **Element:** `<tc-reliance-gauge>`
- **Size:** 13.9 KB gzip · 53.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/reliance-gauge";` |
| React / Next.js | `import { RelianceGauge } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/reliance-gauge";` · tags starting with tc- are custom elements |
| Angular | `import { RelianceGauge } from "@adamstavely/trenchcoat/angular/reliance-gauge";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/reliance-gauge";` |

## Example

The live example is in the gallery at `#/reliance-gauge`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Whether people's trust in an AI matches how well it actually performs. A dial shows the reliance–accuracy index –
1 when people rely on the AI exactly as often as it is right – with its trend over recent windows, and says which
way trust leans: overtrust (relying on output that turns out wrong) or undertrust (overriding output that was
right). Behaviour signals, such as output accepted without an edit, sit as thin meters against two thresholds, one
for spot-checks and one for mandatory review. The card counts overtrust and undertrust episodes and recommends a
review level in one sentence; where a level is in force, the footer offers to switch to the recommended one. The
app supplies every number – the card reads no clock and computes no statistics beyond the index.

Two optional sections go further. A calibration table shows, domain by domain, the confidence the AI stated against
how often it was right, banded well calibrated, over-confident or under-confident – so a team can see that the
assistant is reliable on payment terms but too sure of itself on liability caps. A ranking orders agents by the
rating the app gives each one.

### When to use

- On a team or workflow dashboard where people act on AI output and someone owns how closely it is checked.
- When you track reliance and accuracy over time and want drift caught before it becomes a habit.
- To turn behaviour signals into a review decision that a person confirms.

### When not to use

- Spend or token limits for a run – use [Budget Guard](budget-guard.md).
- Plan or account usage over a billing period – use [Usage Meter](usage-meter.md).
- A metric over time with no thresholds or recommendation – use [KPI Chart](kpi-chart.md).
- Working through the items that need review – use [Review Center](review-center.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the title, what the numbers cover, and the band's pill (Calibrated, Drifting, Miscalibrated)
2. **Dial** `.ui-rlg__dial` – the index from 0 to 1, with cuts where the bands start; beside it, which way trust leans
3. **Trend** `.ui-rlg__plot` – the index over recent windows, with the two band lines behind it
4. **Signals** `.ui-rlg__signals` – one thin meter per signal, ticked at the spot-check and mandatory thresholds, under the overtrust and undertrust counts
5. **Calibration by domain** `.ui-rlg__domains` – per domain, the confidence stated against the accuracy, banded well calibrated, over- or under-confident
6. **Agent ranking** `.ui-rlg__agents` – agents in order of the rating the app gives them
7. **Recommendation** `.ui-rlg__advice` – the recommended review level and the sentence that explains it

## Looks

Standard sets a white card in the gray tray, with the level in force and the switch on the tray below. Clean is one
white card with a shadow: the footer becomes its last row under a hairline, the arc and trend line are thinner, and
the trend's and sections' labels are small captions. Both show the same dial, signals, table, ranking and
recommendation. Below 400px the table puts each domain on two lines – the name and its band, then the confidence and
the accuracy – and each agent's bar drops under its name.

## Usage

### HTML

```html
<tc-reliance-gauge id="trust" scope="Last 30 days · 412 outputs" reliance="0.9" accuracy="0.74" review-level="routine" browsable></tc-reliance-gauge>

<script type="module">
  import "@adamstavely/trenchcoat/reliance-gauge";
  import "@adamstavely/trenchcoat/tokens.css";

  const gauge = document.querySelector("#trust");
  gauge.trend = [
    { label: "Week 1", index: 0.95 },
    { label: "Week 2", index: 0.9 },
    { label: "Week 3", index: 0.84 },
  ];
  gauge.signals = [
    { id: "unedited", label: "Accepted unedited", value: 0.71, hint: "Used without a change" },
    { id: "unopened", label: "Sources not opened", value: 0.42 },
  ];
  gauge.overtrust = 6;
  gauge.undertrust = 1;
  gauge.domains = [
    { id: "payment", label: "Payment terms", confidence: 0.86, accuracy: 0.84, count: 142 },
    { id: "liability", label: "Liability caps", confidence: 0.88, accuracy: 0.66, count: 96 },
  ];
  gauge.agents = [
    { id: "summariser", label: "Clause summariser", rating: 0.91 },
    { id: "redliner", label: "Redline drafter", rating: 0.67 },
  ];
  gauge.addEventListener("tc-review-level-change", (e) => console.log("now", e.detail.level));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RelianceGauge, type RelianceReviewLevel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function TrustPanel() {
  const [level, setLevel] = useState<RelianceReviewLevel>("routine");
  return (
    <RelianceGauge
      title="Reliance"
      scope="Last 30 days · 412 outputs"
      reliance={0.9}
      accuracy={0.74}
      trend={[
        { label: "Week 1", index: 0.95 },
        { label: "Week 2", index: 0.9 },
        { label: "Week 3", index: 0.84 },
      ]}
      signals={[{ id: "unedited", label: "Accepted unedited", value: 0.71 }]}
      overtrust={6}
      undertrust={1}
      domains={[{ id: "liability", label: "Liability caps", confidence: 0.88, accuracy: 0.66, count: 96 }]}
      agents={[{ id: "summariser", label: "Clause summariser", rating: 0.91, detail: "412 answers" }]}
      reviewLevel={level}
      onReviewLevelChange={setLevel}
      onOpenEpisodes={(kind) => console.log("show", kind)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/reliance-gauge";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";

defineProps<{ trend: TcRelianceGauge["trend"]; signals: TcRelianceGauge["signals"] }>();
const onReviewLevelChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-reliance-gauge :trend="trend" :signals="signals" @tc-review-level-change="onReviewLevelChange"></tc-reliance-gauge>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RelianceGauge } from "@adamstavely/trenchcoat/angular/reliance-gauge";
import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";

@Component({
  selector: "app-reliance-gauge-example",
  imports: [RelianceGauge],
  template: `<tc-reliance-gauge [trend]="trend()" [signals]="signals()" (tc-review-level-change)="onReviewLevelChange($event)"></tc-reliance-gauge>`,
})
export class RelianceGaugeExample {
  readonly trend = input.required<TcRelianceGauge["trend"]>();
  readonly signals = input.required<TcRelianceGauge["signals"]>();
  onReviewLevelChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/reliance-gauge";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";

  let { trend, signals }: { trend: TcRelianceGauge["trend"]; signals: TcRelianceGauge["signals"] } = $props();
  let el: TcRelianceGauge;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-review-level-change", on);
    return () => el.removeEventListener("tc-review-level-change", on);
  });
</script>

<tc-reliance-gauge bind:this={el} {trend} {signals}></tc-reliance-gauge>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Reliance"` | The heading, and the region's name |
| `scope` | `scope` | `string` | `""` | What the numbers cover, a quiet line under the heading – e.g. "Last 30 days · 412 answers" |
| `index` | `index` | `number \| undefined` | `undefined` | The reliance–accuracy index, 0–1 (1: trust matches accuracy). Unset, it is 1 − \|reliance − accuracy\| |
| `reliance` | `reliance` | `number \| undefined` | `undefined` | How often people relied on the AI's output, 0–1 – compared with `accuracy` to say which way trust leans |
| `accuracy` | `accuracy` | `number \| undefined` | `undefined` | How often the AI's output was right, 0–1 |
| `trend` | – | `RelianceWindow[]` | `[]` | The index over recent windows, oldest first – drawn as the trend line |
| `calibratedAt` | `calibrated-at` | `number` | `0.9` | Index from which the dial reads "Calibrated" (0–1) |
| `driftAt` | `drift-at` | `number` | `0.8` | Index from which the dial reads "Drifting"; below it, "Miscalibrated" (0–1) |
| `signals` | – | `RelianceSignal[]` | `[]` | Behaviour signals, each a 0–1 value where higher means more reason to review |
| `spotCheckAt` | `spot-check-at` | `number` | `0.6` | Signal value from which a spot-check is recommended (0–1) |
| `mandatoryAt` | `mandatory-at` | `number` | `0.8` | Signal value from which review of every output is recommended (0–1) |
| `overtrust` | `overtrust` | `number` | `0` | Overtrust episodes: output relied on, then found wrong |
| `undertrust` | `undertrust` | `number` | `0` | Undertrust episodes: output overridden, then found right |
| `browsable` | `browsable` | `boolean` | `false` | The episode counts are buttons that fire tc-episodes-open |
| `reviewLevel` | `review-level` | `RelianceReviewLevel \| undefined` | `undefined` | The review level in force – when it differs from the recommendation, the footer offers to switch |
| `recommended` | `recommended` | `RelianceReviewLevel \| undefined` | `undefined` | Overrides the recommended level worked out from the signals and the index |
| `reason` | `reason` | `string` | `""` | Overrides the sentence that explains the recommendation |
| `levelLabels` | – | `Partial<Record<RelianceReviewLevel, string>>` | `{}` | Names of the review levels |
| `domains` | – | `RelianceDomain[]` | `[]` | The calibration table: one row per domain, the AI's accuracy against the confidence it stated; empty hides it |
| `calibrationTolerance` | `calibration-tolerance` | `number` | `0.05` | How far confidence may sit from accuracy (0–1) and still read "Well calibrated" |
| `calibrationLabels` | – | `Partial<Record<RelianceCalibration, string>>` | `{}` | The names of the calibration bands – in place of Well calibrated, Over-confident and Under-confident |
| `domainsLabel` | `domains-label` | `string` | `"Calibration by domain"` | The calibration table's caption |
| `agents` | – | `RelianceAgent[]` | `[]` | Agents to rank by the rating the app gives each; empty hides the ranking |
| `agentsLabel` | `agents-label` | `string` | `"Agents by rating"` | The ranking's caption |
| `locale` | `locale` | `string` | `"en-US"` | Locale for numbers |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-review-level-change` | – | Yes | The footer's switch was pressed ({ level, reviewLevel, previous }: RelianceReviewLevelChange – reviewLevel is the new level); cancelable – prevent it to keep `reviewLevel` yourself |
| `tc-episodes-open` | – | No | An episode count was pressed, with `browsable` set (detail: { kind: "overtrust" \| "undertrust" }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-reliance-gauge-card` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (100)

`--tc-accent`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `trend` | `el.trend = …;` | `<… trend={…} />` | `<tc-reliance-gauge :trend="…">` | `<tc-reliance-gauge [trend]="…">` | `<tc-reliance-gauge {trend}>` |
| `signals` | `el.signals = …;` | `<… signals={…} />` | `<tc-reliance-gauge :signals="…">` | `<tc-reliance-gauge [signals]="…">` | `<tc-reliance-gauge {signals}>` |
| `levelLabels` | `el.levelLabels = …;` | `<… levelLabels={…} />` | `<tc-reliance-gauge :levelLabels="…">` | `<tc-reliance-gauge [levelLabels]="…">` | `<tc-reliance-gauge {levelLabels}>` |
| `domains` | `el.domains = …;` | `<… domains={…} />` | `<tc-reliance-gauge :domains="…">` | `<tc-reliance-gauge [domains]="…">` | `<tc-reliance-gauge {domains}>` |
| `calibrationLabels` | `el.calibrationLabels = …;` | `<… calibrationLabels={…} />` | `<tc-reliance-gauge :calibrationLabels="…">` | `<tc-reliance-gauge [calibrationLabels]="…">` | `<tc-reliance-gauge {calibrationLabels}>` |
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-reliance-gauge :agents="…">` | `<tc-reliance-gauge [agents]="…">` | `<tc-reliance-gauge {agents}>` |

*Also attributes: `heading`, `scope`, `index`, `reliance`, `accuracy`, `calibrated-at`, `drift-at`, `spot-check-at` and 11 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-review-level-change` | Yes | `el.addEventListener("tc-review-level-change", (e) => …)` | `onReviewLevelChange={…}` | `@tc-review-level-change="…"` | `(tc-review-level-change)="…($event)"` | `el.addEventListener("tc-review-level-change", …)` |
| `tc-episodes-open` | No | `el.addEventListener("tc-episodes-open", (e) => …)` | `onOpenEpisodes={…}` | `@tc-episodes-open="…"` | `(tc-episodes-open)="…($event)"` | `el.addEventListener("tc-episodes-open", …)` |

### Controlled

The element changes `reviewLevel` itself unless a listener calls `preventDefault()` on `tc-review-level-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-reliance-gauge id="reliance-gauge"></tc-reliance-gauge>

<script type="module">
  import "@adamstavely/trenchcoat/reliance-gauge";

  const el = document.querySelector("#reliance-gauge");
  el.addEventListener("tc-review-level-change", (e) => {
    e.preventDefault(); // the element keeps its reviewLevel…
    if (allowed(e.detail.reviewLevel)) el.reviewLevel = e.detail.reviewLevel; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { RelianceGauge } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RelianceGauge>;
type Props = Omit<Own, "reviewLevel" | "onReviewLevelChange"> & { initial: NonNullable<Own["reviewLevel"]> };

// Controlled: passing reviewLevel makes the wrapper prevent the element's own change; the app sets it
export function ControlledRelianceGauge({ initial, ...props }: Props) {
  const [reviewLevel, setReviewLevel] = useState<Own["reviewLevel"]>(initial);
  return <RelianceGauge {...props} reviewLevel={reviewLevel} onReviewLevelChange={(next) => setReviewLevel(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/reliance-gauge";
import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";

const props = defineProps<{ initial: TcRelianceGauge["reviewLevel"] }>();
const reviewLevel = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onReviewLevelChange = (e: CustomEvent<{ reviewLevel: TcRelianceGauge["reviewLevel"] }>) => {
  e.preventDefault();
  reviewLevel.value = e.detail.reviewLevel;
};
</script>

<template>
  <tc-reliance-gauge :reviewLevel="reviewLevel" @tc-review-level-change="onReviewLevelChange"></tc-reliance-gauge>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RelianceGauge } from "@adamstavely/trenchcoat/angular/reliance-gauge";
import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";

@Component({
  selector: "app-controlled-reliance-gauge",
  imports: [RelianceGauge],
  template: `<tc-reliance-gauge [reviewLevel]="reviewLevel()" (tc-review-level-change)="onReviewLevelChange($event)"></tc-reliance-gauge>`,
})
export class ControlledRelianceGauge {
  readonly initial = input.required<TcRelianceGauge["reviewLevel"]>();
  readonly reviewLevel = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onReviewLevelChange(e: CustomEvent<{ reviewLevel: TcRelianceGauge["reviewLevel"] }>) {
    e.preventDefault();
    this.reviewLevel.set(e.detail.reviewLevel);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/reliance-gauge";
  import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";

  let { initial }: { initial: TcRelianceGauge["reviewLevel"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let reviewLevel = $derived(initial);
  let el: TcRelianceGauge;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      reviewLevel = (e as CustomEvent<{ reviewLevel: TcRelianceGauge["reviewLevel"] }>).detail.reviewLevel;
    };
    el.addEventListener("tc-review-level-change", on);
    return () => el.removeEventListener("tc-review-level-change", on);
  });
</script>

<tc-reliance-gauge bind:this={el} {reviewLevel}></tc-reliance-gauge>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-reliance-gauge")` returns a `TcRelianceGauge` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";`
- **React / Next.js:** Props: `import type { RelianceGaugeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RelianceGauge>`. The element class, for refs: `import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRelianceGauge["trend"]` with `import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";`
- **Angular:** The directive types the template: `[trend]` takes `TcRelianceGauge["trend"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRelianceGauge } from "@adamstavely/trenchcoat/reliance-gauge";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `reviewLevel` | `RelianceReviewLevel` | The review level in force. Controlled when defined: pair with onReviewLevelChange and pass the new level back. Otherwise the component keeps it, starting from `defaultReviewLevel` |
| `defaultReviewLevel` | `RelianceReviewLevel` | The level in force at first, when uncontrolled – leave both unset for no footer |
| `onReviewLevelChange` | `(level: RelianceReviewLevel, previous: RelianceReviewLevel) => void` | The footer's switch was pressed: the new level and the one before |
| `onOpenEpisodes` | `(kind: RelianceEpisodeKind) => void` | Makes the episode counts buttons; called with the kind pressed |

*Renamed or hidden on the wrapper: `heading`, `reviewLevel`, `browsable`*

## Accessibility

Follows the WAI-ARIA [Meter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the trend, the episode counts (when `browsable`) and the switch button |
| ← / ↓ | On the trend: reads the previous window – the first press reads the latest |
| → / ↑ | On the trend: reads the next window |
| Home / End | On the trend: reads the first or the latest window |
| Escape | On the trend: goes back to the change over all windows |
| Enter / Space | Opens the episodes, or switches the review level |

### Screen readers

The card is a `region`, named by its heading. The dial is a `meter` named “Reliance–accuracy index” with a value
such as “0.83 of 1, drifting, leaning to overtrust”; each signal is a `meter` named by its label, its value saying
when it is over a threshold (“72%, past the spot-check threshold (60%)”). The trend is a group whose name gives the
range (“Index over the last 4 windows, from 0.94 to 0.83”); the arrow keys read each window in a polite live region
(“Week 3: 0.89, drifting”). The recommendation is a group named by its title. The live region also says when the
recommendation changes (“Recommended review is now spot-check.”) and when a switch applies (“Review level set to
spot-check.”). The calibration table is a real table named by its caption (“Calibration by domain”), with a row
header per domain and column headers Domain, Confidence, Accuracy and Calibration; each band is written out
(“Over-confident”). The ranking is an ordered list named “Agents by rating”, each item read as the agent and its
rating (“Clause summariser 412 answers, rated 0.91”).

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 45.4 KB | 11.5 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **53.5 KB** | **13.9 KB** |
| With Lit – the first component on a page | 76.2 KB | 21.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 185 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of domains replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.9 ms | domains: first render, 1,241 nodes; update 0.6 ms |
| 1,000 items | 37 ms | domains: first render, 11,141 nodes; update 5.8 ms |

1,000 items of domains: 37 ms, 11,141 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **27 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RollingController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `performance.now()` (internal/controllers – RollingController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Phrase signals so that higher means more reason to review: “Accepted unedited”, “Sources not opened”.
- Use `hint` to say what a signal measures in a few words – “Too quick to have read the source”.
- Name what the numbers cover in `scope`: the period and how many outputs.
- Rename the levels with `levelLabels` to match your process, and keep them short – they are read in sentences
  (“Switch to spot-check”).
- Write `reason` only when a rule, not the signals, sets the level; otherwise let the card explain itself.
- Name domains the way the people reviewing them do (“Liability caps”, not a taxonomy code), and give `count` so a
  band resting on a dozen outputs reads as the thin evidence it is.
- Say what an agent's rating is in `agentsLabel` when it isn't obvious – “Agents by accuracy”.

## Do and don't

### Do

- Pass `reliance` and `accuracy` together, so the card can say which way trust leans.
- Set `spotCheckAt`, `mandatoryAt` and per-signal thresholds from your own review policy.
- Keep `reviewLevel` in step with what is actually in force, and log who switched it.
- Set `calibrationTolerance` to the gap your evaluation treats as noise; set a row's `band` outright when your own
  calibration model has already decided it.

### Don't

- Don't switch the review level automatically – the recommendation is for a person to confirm.
- Don't mix signals where higher means better with ones where higher means worse.
- Don't show it for a handful of outputs; the index and signals need enough volume to mean anything.
- Don't rank agents on a rating that mixes different tasks – rank like with like.

## Related

- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Review Center](review-center.md) – A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in

## Changelog

- **Event details:** four change events gained a field named after the property they change. The existing fields stay. The docs' controlled examples read these names, which the events lacked; the new Angular type check caught it. - `tc-artifact-panel`'s `tc-selected-change`: `selected`. - `tc-email-draft`'s `tc-recipient-change`: `recipient`. - `tc-reliance-gauge`'s `tc-review-level-change`: `reviewLevel`. - `tc-transcript-review`'s `tc-translation-mode-change`: `translationMode`.
- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
