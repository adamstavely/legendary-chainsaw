<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Eval Scorecard

**Data & charts** · New

Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer

- **Element:** `<tc-eval-scorecard>`
- **Size:** 24.9 KB gzip · 101.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/eval-scorecard";` |
| React / Next.js | `import { EvalScorecard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/eval-scorecard";` · tags starting with tc- are custom elements |
| Angular | `import { EvalScorecard } from "@adamstavely/trenchcoat/angular/eval-scorecard";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/eval-scorecard";` |

## Example

The live example is in the gallery at `#/eval-scorecard`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A set of test cases run against several versions of a prompt or model, read at three distances. The trend gives each
version its pass rate, the change from the version before and a line through them. The grid gives every case a row
and every version a column, marked pass, fail, error or still running – a failure where the version before passed is
marked regressed. Open a cell and the case's input, the grader's reason and the output sit beside the expected
answer, the differences marked word by word. Filters by tag and by outcome narrow all three, so “how did billing
cases do across versions?” is one click. It answers “is the new version better, and where did it get worse?” before
a change ships, and it stays fast with 10,000 cases.

Given `runs` – each run of the whole set with its pass rate – a run history follows the grid. Each run is a bar
against a dashed line at the baseline's pass rate, and the picked run's change is said in words: “+4 points”, or
“−2 points, 3 new failures”. The cases that passed in the baseline and fail in that run are listed; pick one to open
it. Set as baseline makes another run the one the rest are measured against, and Table shows the same runs as a
table.

### When to use

- Reviewing an eval run before promoting a new prompt or model.
- Finding regressions: cases the latest version fails that the one before passed.
- Comparing pass rates for one slice of the set – a tag such as “billing” or “multilingual”.
- Tracking the set's pass rate run after run against a baseline, and what each run broke.

### When not to use

- Two runs of one task side by side, step by step – use [Run Compare](run-compare.md).
- Editing case data or labels in a spreadsheet-like table – use [Data Table](data-table.md).
- One metric over time, without cases behind it – use [KPI Chart](kpi-chart.md).
- Rating a single answer so it can become a case – use [Feedback Rubric](feedback-rubric.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Trend** `.ui-evs__trend` – each version's pass rate, its change, and a line through them
2. **Filters** `.ui-evs__filters` – All, Failing or Regressed, and the tags with their counts
3. **Grid** `.ui-evs__grid` – a row per case, a column per version, an outcome in each cell
4. **Open case** `.ui-evs__detail` – the version buttons, the grader's verdict and the case's input
5. **Comparison** `.ui-evs__pair` – the expected answer beside the output, differences marked
6. **Run history** `.ui-evs__history` – with `runs`: the baseline's name and rate, and Table
7. **Bars** `.ui-evs__bars` – a bar per run, the baseline's pass rate as a dashed line across them
8. **Runs** `.ui-evs__pick` – the runs as radio buttons, the baseline marked
9. **Picked run** `.ui-evs__run-detail` – its pass rate, its change in words, Set as baseline and its regressions

## Looks

Standard puts the header on a gray tray and the scorecard on a white card inside it. Clean is one white card, the header as its first row, with
hairline dividers, uppercase captions on the grid and the open case, and plain text on its marked words. Wide (from
860 px), the open case sits beside the grid; narrower, it opens below, the columns tighten and the case's tags give
way.

The run history's bars are grey for a run level with the baseline, green for one that gained and red for one that
lost points or broke cases; the baseline's own bar and line use `--tc-eval-scorecard-line`. Their height is
`--tc-eval-scorecard-history` (72 px).

## Usage

### HTML

```html
<tc-eval-scorecard id="evals" heading="Support replies"></tc-eval-scorecard>

<script type="module">
  import "@adamstavely/trenchcoat/eval-scorecard";
  import "@adamstavely/trenchcoat/tokens.css";

  const evals = document.querySelector("#evals");
  evals.versions = [{ id: "v3", label: "v3" }, { id: "v4", label: "v4", detail: "Opus" }];
  evals.cases = [
    {
      id: "refund-1",
      name: "Refund for a damaged blender",
      tags: ["refunds"],
      expected: "I've refunded $89.00 – no need to send it back.",
      results: { v3: { outcome: "pass" }, v4: { outcome: "fail", output: "Please send it back first.", reason: "Asked for a return" } },
    },
  ];
  evals.runs = [
    { id: "v3", label: "Run 3 · v3", at: Date.UTC(2026, 10, 5), passRate: 1, passed: 1, total: 1, baseline: true },
    { id: "v4", label: "Run 4 · v4", at: Date.UTC(2026, 10, 6), passRate: 0, passed: 0, total: 1 },
  ];
  evals.addEventListener("tc-open-change", (e) => console.log(e.detail.open));
  evals.addEventListener("tc-baseline-change", (e) => console.log("baseline", e.detail.baseline));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EvalScorecard, type EvalCase, type EvalRun, type EvalVersion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const versions: EvalVersion[] = [{ id: "v3", label: "v3" }, { id: "v4", label: "v4", detail: "Opus" }];

export function EvalReview({ cases, runs }: { cases: EvalCase[]; runs: EvalRun[] }) {
  const [baseline, setBaseline] = useState<string | null>("v3");
  return (
    <EvalScorecard
      title="Support replies"
      versions={versions}
      cases={cases}
      runs={runs}
      baseline={baseline}
      onBaselineChange={setBaseline}
      defaultShow="regressed"
      onOpenChange={(open) => console.log(open)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/eval-scorecard";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";

defineProps<{ versions: TcEvalScorecard["versions"]; cases: TcEvalScorecard["cases"] }>();
const onTagsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-eval-scorecard :versions="versions" :cases="cases" @tc-tags-change="onTagsChange"></tc-eval-scorecard>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EvalScorecard } from "@adamstavely/trenchcoat/angular/eval-scorecard";
import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";

@Component({
  selector: "app-eval-scorecard-example",
  imports: [EvalScorecard],
  template: `<tc-eval-scorecard [versions]="versions()" [cases]="cases()" (tc-tags-change)="onTagsChange($event)"></tc-eval-scorecard>`,
})
export class EvalScorecardExample {
  readonly versions = input.required<TcEvalScorecard["versions"]>();
  readonly cases = input.required<TcEvalScorecard["cases"]>();
  onTagsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/eval-scorecard";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";

  let { versions, cases }: { versions: TcEvalScorecard["versions"]; cases: TcEvalScorecard["cases"] } = $props();
  let el: TcEvalScorecard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-tags-change", on);
    return () => el.removeEventListener("tc-tags-change", on);
  });
</script>

<tc-eval-scorecard bind:this={el} {versions} {cases}></tc-eval-scorecard>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Evals"` | The heading – the eval set's name |
| `versions` | – | `EvalVersion[]` | `[]` | The versions in the order they were made – the last one is judged by the Failing and Regressed filters |
| `cases` | – | `EvalCase[]` | `[]` | The test cases, each with its results per version |
| `tags` | – | `string[]` | `[]` | The picked tags – a case with any of them shows; none picked shows every case |
| `show` | `show` | `EvalScorecardShow` | `"all"` | Which cases show: "all", "failing" (on the latest version) or "regressed" (passed on the one before, fails now) |
| `open` | – | `EvalScorecardOpen \| null` | `null` | The open case and version, or null for none |
| `maxHeight` | `max-height` | `number` | `360` | The grid's height before it scrolls, in px |
| `formatRate` | – | `(rate: number) => string` | `percent` | Formats a pass rate (0–1) – defaults to a whole percentage, e.g. "86%" |
| `runs` | – | `EvalRun[]` | `[]` | Runs of the whole set, oldest first – turns on the run history. A run whose id is a version's id gets its regressions from `cases` |
| `baseline` | `baseline` | `string \| null` | `null` | The id of the run the others are compared with; null uses the run marked `baseline`, else the first. Changed by Set as baseline unless tc-baseline-change is prevented |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-tags-change` | – | Yes | The picked tags changed ({ tags }: EvalScorecardTagsChange); cancelable |
| `tc-show-change` | – | Yes | All, Failing or Regressed was picked ({ show }: EvalScorecardShowChange); cancelable |
| `tc-open-change` | – | Yes | A case was opened, switched to another version or closed ({ open }: EvalScorecardOpenChange); cancelable |
| `tc-baseline-change` | – | Yes | Set as baseline was pressed ({ baseline, id }: EvalScorecardBaselineChange – the run's id); cancelable – prevented, `baseline` stays as it was |
| `tc-case-open` | – | Yes | A regression in the run history was picked ({ caseId, runId }: EvalScorecardCaseOpen); cancelable – unless prevented, the case opens on that run when the run is a version |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-eval-scorecard-col` | `48px` | both, clean |
| `--tc-eval-scorecard-row` | `34px` | both, clean |
| `--tc-eval-scorecard-line` | `var(--tc-accent)` | both |
| `--tc-eval-scorecard-side` | `400px` | both |
| `--tc-eval-scorecard-history` | `72px` | both |
| `--tc-eval-scorecard-bar-gap` | `6px` | both |

#### Design tokens it reads (95)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-neutral`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-eval-scorecard-runs`, `--tc-eval-scorecard-versions`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `evalStats(versions: EvalVersion[], cases: readonly EvalCase[]): EvalVersionStats[]` | Pass rate per version over a set of cases: passes over everything that finished; null when nothing has |
| `evalRegressed(c: EvalCase, versions: EvalVersion[]): void` | Whether a case failed on the latest version after passing on the one before |
| `evalBaselineRun(runs: readonly EvalRun[], baseline: string \| null): void` | Which run the others are compared with: `baseline` by id, else the run marked `baseline`, else the first |
| `evalRunDelta(run: EvalRun, base: EvalRun, cases: readonly EvalCase[]): EvalRunDelta` | A run against the baseline: the change in whole points, and the cases that passed there and fail here |
| `evalDeltaText(d: EvalRunDelta): void` | A run's change in words: "+4 points", "−2 points, 3 new failures", "Same as the baseline" |

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
| `versions` | `el.versions = …;` | `<… versions={…} />` | `<tc-eval-scorecard :versions="…">` | `<tc-eval-scorecard [versions]="…">` | `<tc-eval-scorecard {versions}>` |
| `cases` | `el.cases = …;` | `<… cases={…} />` | `<tc-eval-scorecard :cases="…">` | `<tc-eval-scorecard [cases]="…">` | `<tc-eval-scorecard {cases}>` |
| `tags` | `el.tags = …;` | `<… tags={…} />` | `<tc-eval-scorecard :tags="…">` | `<tc-eval-scorecard [tags]="…">` | `<tc-eval-scorecard {tags}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-eval-scorecard :open="…">` | `<tc-eval-scorecard [open]="…">` | `<tc-eval-scorecard {open}>` |
| `formatRate` | `el.formatRate = …;` | `<… formatRate={…} />` | `<tc-eval-scorecard :formatRate="…">` | `<tc-eval-scorecard [formatRate]="…">` | `<tc-eval-scorecard {formatRate}>` |
| `runs` | `el.runs = …;` | `<… runs={…} />` | `<tc-eval-scorecard :runs="…">` | `<tc-eval-scorecard [runs]="…">` | `<tc-eval-scorecard {runs}>` |

*Also attributes: `heading`, `show`, `max-height`, `baseline` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-tags-change` | Yes | `el.addEventListener("tc-tags-change", (e) => …)` | `ref.current.addEventListener("tc-tags-change", …)` | `@tc-tags-change="…"` | `(tc-tags-change)="…($event)"` | `el.addEventListener("tc-tags-change", …)` |
| `tc-show-change` | Yes | `el.addEventListener("tc-show-change", (e) => …)` | `ref.current.addEventListener("tc-show-change", …)` | `@tc-show-change="…"` | `(tc-show-change)="…($event)"` | `el.addEventListener("tc-show-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-baseline-change` | Yes | `el.addEventListener("tc-baseline-change", (e) => …)` | `ref.current.addEventListener("tc-baseline-change", …)` | `@tc-baseline-change="…"` | `(tc-baseline-change)="…($event)"` | `el.addEventListener("tc-baseline-change", …)` |
| `tc-case-open` | Yes | `el.addEventListener("tc-case-open", (e) => …)` | `onCaseOpen={…}` | `@tc-case-open="…"` | `(tc-case-open)="…($event)"` | `el.addEventListener("tc-case-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `tags`, `show`, `open` and `baseline` itself unless a listener calls `preventDefault()` on `tc-tags-change`, `tc-show-change`, `tc-open-change` or `tc-baseline-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-eval-scorecard id="eval-scorecard"></tc-eval-scorecard>

<script type="module">
  import "@adamstavely/trenchcoat/eval-scorecard";

  const el = document.querySelector("#eval-scorecard");
  el.addEventListener("tc-tags-change", (e) => {
    e.preventDefault(); // the element keeps its tags…
    if (allowed(e.detail.tags)) el.tags = e.detail.tags; // …until the app sets it
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
import "@adamstavely/trenchcoat/eval-scorecard";
import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";

const props = defineProps<{ initial: TcEvalScorecard["tags"] }>();
const tags = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTagsChange = (e: CustomEvent<{ tags: TcEvalScorecard["tags"] }>) => {
  e.preventDefault();
  tags.value = e.detail.tags;
};
</script>

<template>
  <tc-eval-scorecard :tags="tags" @tc-tags-change="onTagsChange"></tc-eval-scorecard>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EvalScorecard } from "@adamstavely/trenchcoat/angular/eval-scorecard";
import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";

@Component({
  selector: "app-controlled-eval-scorecard",
  imports: [EvalScorecard],
  template: `<tc-eval-scorecard [tags]="tags()" (tc-tags-change)="onTagsChange($event)"></tc-eval-scorecard>`,
})
export class ControlledEvalScorecard {
  readonly initial = input.required<TcEvalScorecard["tags"]>();
  readonly tags = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTagsChange(e: CustomEvent<{ tags: TcEvalScorecard["tags"] }>) {
    e.preventDefault();
    this.tags.set(e.detail.tags);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/eval-scorecard";
  import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";

  let { initial }: { initial: TcEvalScorecard["tags"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let tags = $derived(initial);
  let el: TcEvalScorecard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      tags = (e as CustomEvent<{ tags: TcEvalScorecard["tags"] }>).detail.tags;
    };
    el.addEventListener("tc-tags-change", on);
    return () => el.removeEventListener("tc-tags-change", on);
  });
</script>

<tc-eval-scorecard bind:this={el} {tags}></tc-eval-scorecard>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-eval-scorecard")` returns a `TcEvalScorecard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";`
- **React / Next.js:** Props: `import type { EvalScorecardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EvalScorecard>`. The element class, for refs: `import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEvalScorecard["versions"]` with `import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";`
- **Angular:** The directive types the template: `[versions]` takes `TcEvalScorecard["versions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEvalScorecard } from "@adamstavely/trenchcoat/eval-scorecard";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – the eval set's name |
| `tags` | `string[]` | The picked tags. Controlled when defined; otherwise the component keeps them, starting from `defaultTags` |
| `defaultTags` | `string[]` | The tags picked at first when `tags` isn't controlled |
| `onTagsChange` | `(tags: string[]) => void` | Called with the picked tags after a tag is toggled or cleared, controlled or not |
| `show` | `EvalScorecardShow` | Which cases show – "all", "failing" or "regressed". Controlled when defined |
| `defaultShow` | `EvalScorecardShow` | Which cases show at first when `show` isn't controlled |
| `onShowChange` | `(show: EvalScorecardShow) => void` | Called with the outcome filter the user picked, controlled or not |
| `open` | `EvalScorecardOpen \| null` | The open case and version, or null. Controlled when defined |
| `defaultOpen` | `EvalScorecardOpen \| null` | The case open at first when `open` isn't controlled |
| `onOpenChange` | `(open: EvalScorecardOpen \| null) => void` | Called when a case is opened, switched to another version or closed, controlled or not |
| `baseline` | `string \| null` | The id of the run the others are compared with, or null for the run marked `baseline`. Controlled when defined |
| `defaultBaseline` | `string \| null` | The baseline at first when `baseline` isn't controlled |
| `onBaselineChange` | `(baseline: string) => void` | Called with the run's id when Set as baseline is pressed, controlled or not |
| `onCaseOpen` | `(caseId: string, runId: string) => boolean \| void` | Called when a regression in the run history is picked; return false to keep the case from opening |

*Renamed or hidden on the wrapper: `heading`, `tags`, `show`, `open`, `baseline`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the outcome filter, each tag, the grid, then the open case's Close and its version buttons |
| ← / → / ↑ / ↓ | In the outcome filter, picks the previous or next option, wrapping round |
| ↑ / ↓ / ← / → | In the grid, moves the active cell |
| Home / End | In the grid, moves to the first or last cell of the row |
| Ctrl + Home / Ctrl + End | In the grid, moves to the first or last cell of the grid (⌘ on a Mac also works) |
| Page Up / Page Down | In the grid, moves ten rows |
| Enter / Space | In the grid, opens the active cell's case for that version – the case column opens the latest version |
| Escape | Closes the open case; from inside the open case, focus goes back to the grid |
| ← / → / Home / End | In the version buttons, moves between them; Enter or Space shows that version's run |
| ← / → / ↑ / ↓ / Home / End | In the run history's runs, picks the previous, next, first or last run |
| Enter / Space | On Table, switches between bars and the table; on a regression, opens that case |

### Screen readers

The grid is a `grid` named by the heading, with `aria-rowcount` and `aria-colcount` for every case, rendered or not.
Focus stays on the grid; `aria-activedescendant` points at the active cell. Each outcome is said in words – “Pass”,
“Fail, regressed from v3”, “Running”, “Not run”. The trend is a list named “Pass rate by version”, each item read as
“v4 · Opus 84%, +9 points, 2.0k / 2.4k passed”. The outcome filter is a `radiogroup` named “Show”, the tags a
`group` named “Tags” of toggle buttons with `aria-pressed`, each with its count (“refunds, 800 cases”). After a
filter changes, a status region says what is left: “312 cases of 10,000” or “Failing: 38 cases”. The open case is a
region named by the case; its version buttons are a `toolbar` named “Versions”, the shown one pressed and each named
with its outcome (“Fail, v4”). Words only the expected answer has are `<del>` and words only the output has are
`<ins>`.

The run history is a region named “Run history”. Its bars are hidden from screen readers: the runs are a
`radiogroup` named “Runs”, each read with its rate (“Run 4 · v4, 86%, Baseline”), and the picked run reads as a
sentence – “Run 5 · v5 · Nov 7 · 89% (2,136 of 2,400 cases passed) +3 points, 41 new failures against Run 3 · v3”.
Table is a toggle button (`aria-pressed`) controlling a real `table` with a caption, a row per run. Set as baseline
moves focus to the picked run and says “Baseline: Run 5”.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself, inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 47.8 KB | 12.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 3.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| **Added to a page that already has Lit** | **101.4 KB** | **24.9 KB** |
| With Lit – the first component on a page | 123.7 KB | 32.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **9.4 ms** | the gallery demo's data, 2,074 DOM nodes – to layout, median of 7 |
| Typical update | **1.6 ms** | one item of cases replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 11 ms | cases: first render, 2,074 nodes; update 3.2 ms |

Windowed: 10,000 items of cases render 2,074 nodes in 11 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- Timers: `setTimeout` (inline-diff).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (inline-diff).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController), `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name cases by what they test, in a few words – “Refund for a damaged item”, not an id.
- Keep version labels short (“v4”, “Prompt 12”) – they head narrow columns – and put the model in `detail`.
- Give failures a `reason` in one line: what the grader saw, not the score again.
- Use a handful of tags people would filter by – the topic, the language, the risk.
- Label runs so they can be told apart at a glance – “Nightly 3 Nov”, “Run 14 · v5” – and give each its time in `at`.
- Give a run the same id as its version when there is one: its regressions then come from the cases' results, and
  picking one opens the case on that run.

## Do and don't

### Do

- List versions oldest first: Failing and Regressed judge the last one.
- Set `status: "running"` on a version whose results are still arriving, and mark its unfinished cases `pending`.
- Fill in `expected` and each result's `output`, so a failure can be read, not only counted.
- Pick a baseline people agree on – the version in production – and move it with Set as baseline when that changes.

### Don't

- Don't show more than six or seven versions at once – the columns get too narrow to scan.
- Don't count pending results as failures; leave them pending until they finish.
- Don't use the scorecard for live traffic – it is for a fixed set of cases.

## Related

- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals

## Changelog

- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`, `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`, `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
