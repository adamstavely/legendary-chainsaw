<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Run Compare

**Agents** · New

Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted

- **Element:** `<tc-run-compare>`
- **Size:** 19.8 KB gzip · 78.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/run-compare";` |
| React / Next.js | `import { RunCompare } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/run-compare";` · tags starting with tc- are custom elements |
| Angular | `import { RunCompare } from "@adamstavely/trenchcoat/angular/run-compare";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/run-compare";` |

## Example

The live example is in the gallery at `#/run-compare`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Two runs of an agent, or two versions of a prompt, side by side – the baseline on the left, the candidate on the
right – with every difference highlighted. Outputs and prompts are compared word by word; steps are lined up by name
and marked Added, Dropped or Changed; time, cost, tokens, steps and score sit under each run, the candidate's with
its change against the baseline in green or red. It answers “what did my change actually do?” before someone ships a
new prompt or model. A candidate that is still running streams in, and the comparison follows as it grows.

### When to use

- Checking a new prompt or model against the current one on the same input, before rolling it out.
- Explaining why one run cost more, took longer or failed where another didn't.
- Letting people keep the better of two runs – turn on `can-pick` (or pass `onPick`) for “Use this”.

### When not to use

- Two models' answers to a chat prompt, for people to vote on – use [Answer Arena](answer-arena.md).
- Three or more attempts at once – use [Parallel Attempts](parallel-attempts.md).
- A change to one piece of text, to accept or reject – use [Inline Diff](inline-diff.md).
- Where one run spent its time, step by step – use [Trace Waterfall](trace-waterfall.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the heading, the number of differences and the tabs
2. **Tabs** `.ui-rc__tabs` – Output, Steps and Prompt, each with its count of differences
3. **Run** `.ui-rc__run` – one side's label, model, status and numbers
4. **Numbers** `.ui-rc__nums` – time, cost, tokens, steps and score, with the candidate's change
5. **Comparison** `.ui-rc__panel` – the open tab: the two texts or the lined-up steps

## Looks

Standard puts the header on a gray tray and the comparison on a white card inside it. Clean is one white card with
hairline dividers, and its struck words are gray and its added words keep the text colour, over the same tints. Both stack the
two sides – baseline above candidate – when the component is narrow.

## Usage

### HTML

```html
<tc-run-compare id="compare" heading="Refund reply" can-pick></tc-run-compare>

<script type="module">
  import "@adamstavely/trenchcoat/run-compare";
  import "@adamstavely/trenchcoat/tokens.css";

  const compare = document.querySelector("#compare");
  compare.baseline = { id: "v3", label: "Prompt v3", output: "I've started a refund of $89.00.", duration: 5200, cost: 0.031 };
  compare.candidate = { id: "v4", label: "Prompt v4", output: "Your refund of $89.00 is on its way.", duration: 4300, cost: 0.024 };
  compare.addEventListener("tc-pick", (e) => console.log(e.detail.run.id));
</script>
```

### React / Next.js

```tsx
import { RunCompare, type RunCompareRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const v3: RunCompareRun = { id: "v3", label: "Prompt v3", output: "I've started a refund of $89.00.", duration: 5200, cost: 0.031 };
const v4: RunCompareRun = { id: "v4", label: "Prompt v4", output: "Your refund of $89.00 is on its way.", duration: 4300, cost: 0.024 };

export function PromptReview({ onKeep }: { onKeep: (id: string) => void }) {
  return <RunCompare title="Refund reply" baseline={v3} candidate={v4} onPick={(pick) => onKeep(pick.run.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/run-compare";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";

defineProps<{ baseline: TcRunCompare["baseline"]; candidate: TcRunCompare["candidate"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-run-compare :baseline="baseline" :candidate="candidate" @tc-view-change="onViewChange"></tc-run-compare>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RunCompare } from "@adamstavely/trenchcoat/angular/run-compare";
import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";

@Component({
  selector: "app-run-compare-example",
  imports: [RunCompare],
  template: `<tc-run-compare [baseline]="baseline()" [candidate]="candidate()" (tc-view-change)="onViewChange($event)"></tc-run-compare>`,
})
export class RunCompareExample {
  readonly baseline = input.required<TcRunCompare["baseline"]>();
  readonly candidate = input.required<TcRunCompare["candidate"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-compare";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";

  let { baseline, candidate }: { baseline: TcRunCompare["baseline"]; candidate: TcRunCompare["candidate"] } = $props();
  let el: TcRunCompare;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-run-compare bind:this={el} {baseline} {candidate}></tc-run-compare>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `baseline` | – | `RunCompareRun \| undefined` | `undefined` | The run to compare against – on the left |
| `candidate` | – | `RunCompareRun \| undefined` | `undefined` | The run being judged – on the right; its numbers carry the change against the baseline |
| `view` | `view` | `RunCompareView` | `"output"` | The open tab |
| `heading` | `heading` | `string` | `"Compare runs"` | The heading – e.g. the task both runs did |
| `canPick` | `can-pick` | `boolean` | `false` | Shows "Use this" on each finished run (fires tc-pick) |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – defaults to dollars, e.g. "$0.03" |
| `formatDuration` | – | `(ms: number) => string` | `took` | Formats every duration in ms – defaults to e.g. "4.2s" |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-view-change` | – | Yes | Another tab was picked ({ view }: RunCompareViewChange); cancelable |
| `tc-pick` | – | No | "Use this" was pressed on a run ({ run, side }: RunComparePick) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-run-compare-strike` | `light-dark(rgba(229, 72, 77, 0.6), rgba(255, 120, 120, 0.7))` | both, clean |
| `--tc-run-compare-del-hot` | `light-dark(rgba(220, 60, 60, 0.2), rgba(240, 90, 90, 0.28))` | both |
| `--tc-run-compare-ins-hot` | `light-dark(rgba(34, 160, 90, 0.22), rgba(60, 200, 120, 0.28))` | both |
| `--tc-run-compare-blink` | `1100ms` | both |

#### Design tokens it reads (81)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `alignRunSteps(a: RunCompareStep[], b: RunCompareStep[]): RunCompareStepRow[]` | Lines up two runs' steps: matched by name in order (longest common subsequence), the rest added or dropped |

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
| `baseline` | `el.baseline = …;` | `<… baseline={…} />` | `<tc-run-compare :baseline="…">` | `<tc-run-compare [baseline]="…">` | `<tc-run-compare {baseline}>` |
| `candidate` | `el.candidate = …;` | `<… candidate={…} />` | `<tc-run-compare :candidate="…">` | `<tc-run-compare [candidate]="…">` | `<tc-run-compare {candidate}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-run-compare :formatCost="…">` | `<tc-run-compare [formatCost]="…">` | `<tc-run-compare {formatCost}>` |
| `formatDuration` | `el.formatDuration = …;` | `<… formatDuration={…} />` | `<tc-run-compare :formatDuration="…">` | `<tc-run-compare [formatDuration]="…">` | `<tc-run-compare {formatDuration}>` |

*Also attributes: `view`, `heading`, `can-pick` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-pick` | No | `el.addEventListener("tc-pick", (e) => …)` | `onPick={…}` | `@tc-pick="…"` | `(tc-pick)="…($event)"` | `el.addEventListener("tc-pick", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view` itself unless a listener calls `preventDefault()` on `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-run-compare id="run-compare"></tc-run-compare>

<script type="module">
  import "@adamstavely/trenchcoat/run-compare";

  const el = document.querySelector("#run-compare");
  el.addEventListener("tc-view-change", (e) => {
    e.preventDefault(); // the element keeps its view…
    if (allowed(e.detail.view)) el.view = e.detail.view; // …until the app sets it
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
import "@adamstavely/trenchcoat/run-compare";
import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";

const props = defineProps<{ initial: TcRunCompare["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcRunCompare["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-run-compare :view="view" @tc-view-change="onViewChange"></tc-run-compare>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RunCompare } from "@adamstavely/trenchcoat/angular/run-compare";
import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";

@Component({
  selector: "app-controlled-run-compare",
  imports: [RunCompare],
  template: `<tc-run-compare [view]="view()" (tc-view-change)="onViewChange($event)"></tc-run-compare>`,
})
export class ControlledRunCompare {
  readonly initial = input.required<TcRunCompare["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcRunCompare["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-compare";
  import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";

  let { initial }: { initial: TcRunCompare["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcRunCompare;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcRunCompare["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-run-compare bind:this={el} {view}></tc-run-compare>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-run-compare")` returns a `TcRunCompare` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";`
- **React / Next.js:** Props: `import type { RunCompareProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RunCompare>`. The element class, for refs: `import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRunCompare["baseline"]` with `import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";`
- **Angular:** The directive types the template: `[baseline]` takes `TcRunCompare["baseline"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRunCompare } from "@adamstavely/trenchcoat/run-compare";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – e.g. the task both runs did |
| `view` | `RunCompareView` | The open tab. Controlled when defined; otherwise the component keeps it, starting from `defaultView` |
| `defaultView` | `RunCompareView` | The tab open at first when `view` isn't controlled |
| `onViewChange` | `(view: RunCompareView) => void` | Called with the tab the user picked, controlled or not |
| `onPick` | `(pick: RunComparePick) => void` | Shows "Use this" on each finished run |

*Renamed or hidden on the wrapper: `heading`, `view`, `canPick`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the open tab, then into the comparison (and to “Use this”, when shown) |
| → / ← | Opens the next or previous tab, wrapping round |
| Home / End | Opens the first or last tab |
| Enter / Space | On “Use this”, picks that run |

### Screen readers

The tabs are a `tablist` named by the heading; each `tab` has `aria-selected` and its count read as words (“Output,
3 differences”), and controls one `tabpanel`. Words only one run has are `<del>` (baseline) and `<ins>` (candidate)
elements. Each side's numbers are a description list named “Prompt v4 in numbers”, and the candidate's changes are
read with their tone: “(−18%, better)”. Steps say Added, Dropped, Changed, Failed and Skipped in words, and the
missing side reads “Not in this run” or “Not taken”. Once both runs are through, a `status` region sums up: “Prompt
v4 against Prompt v3: 12 differences in the output, 2 steps differ. −18% time, better”. “Use this” buttons are named
with the run: “Use this: Prompt v4”.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |

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
| **This component alone** | 28.6 KB | 8.6 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| **Added to a page that already has Lit** | **78.7 KB** | **19.9 KB** |
| With Lit – the first component on a page | 98.1 KB | 26.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 106 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 9.7 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (inline-diff).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Make the heading the task both runs did: “Refund reply”, not “Comparison”.
- Label runs so people can tell them apart at a glance – “Prompt v4”, “Run #4182” – and use `model` for what else
  sets them apart.
- Give steps stable names (a tool's name works) – steps are matched by name, so a renamed step reads as one dropped
  and one added.
- Keep step details to one line: the arguments or the result that matters.

## Do and don't

### Do

- Put the version people already trust on the left as `baseline`.
- Pass a `formatCost` that matches your billing – the default is dollars.
- Add `score` from your evals, so the comparison isn't only about speed and cost.

### Don't

- Don't compare runs on different inputs – the differences would be about the input, not your change.
- Don't rely on colour alone in your own surroundings; the component already says better and worse in words.
- Don't offer “Use this” when nothing happens after a pick.

## Related

- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason
- [Parallel Attempts](parallel-attempts.md) – An agent tries the same task several ways at once and the best one wins – every attempt races as a row with its model, approach and live bar, then gets a score; the best is marked and picked, and you can switch to another
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent

## Changelog

- `tc-run-compare` – two runs or prompt versions side by side: outputs and prompts word-diffed with inline-diff's Myers diff, steps aligned and marked Added / Dropped / Changed, cost, time and tokens marked better or worse. Tabs; `tc-view-change`, `tc-pick`.
