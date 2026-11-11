<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Traceability Spine

**Research & portfolio** · New

The chain from open questions to outcomes – a column per stage from questions and gaps to work, papers and who cites them, linked cards joined by lines, and a card's whole path traced on click with the rest dimmed

- **Element:** `<tc-traceability-spine>`
- **Size:** 9.3 KB gzip · 29.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/traceability-spine";` |
| React / Next.js | `import { TraceabilitySpine } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/traceability-spine";` · tags starting with tc- are custom elements |
| Angular | `import { TraceabilitySpine } from "@adamstavely/trenchcoat/angular/traceability-spine";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/traceability-spine";` |

## Example

The live example is in the gallery at `#/traceability-spine`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The chain from open questions to outcomes, one column per stage. By default the stages are Question, Gap, Work,
Paper and Cited by, but the page can name its own. Each card shows its kind, a status pill and its details: progress
and people for work, a venue and metrics for a paper, the venue, year and sector for a citing work. Lines join linked
cards. Pick a card and its whole path lights up: everything upstream it answers to, and everything downstream that
builds on it. The rest dims, so it's easy to see which question a paper resolved and which gaps nobody is working on.

### When to use

- Showing how research questions turn into gaps, work, papers and impact for a topic or a programme.
- Any staged chain where people ask "where did this come from" or "what came of this": requirements to releases,
  risks to controls to evidence.
- Making uncovered items visible – a gap with no work against it has no line to the right.

### When not to use

- Where an AI output came from, run by run – use [Lineage Graph](lineage-graph.md).
- Which checks cover which parts as a grid – use [Coverage Matrix](coverage-matrix.md).
- A plan of steps to run in order – use [Agent Plan](agent-plan.md).
- Counts of how assessments came out – use [Grade Distribution](grade-distribution.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Legend** `.ui-tsp__legend` – the stages in order, each with its colour
2. **Stage** `.ui-tsp__stage` – a column's name and how many items it has, kept in view while the page scrolls
3. **Card** `.ui-tsp__node` – an item: its kind, status pill, title, details, progress and people
4. **Pill** `.ui-tsp__pill` – the status, and a warning pill such as “Uncovered”
5. **Lines** `.ui-tsp__lines` – the links between cards, the traced path drawn darker
6. **More** `.ui-tsp__more` – “+80 more citing works” under a stage with items not shown

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The columns, cards and lines are the same in both. Each stage's colour comes from
`--tc-tsp-question`, `--tc-tsp-gap`, `--tc-tsp-work`, `--tc-tsp-paper` and `--tc-tsp-cited`, and the column width from
`--tc-tsp-col`; set any of them on the element.

## Usage

### HTML

```html
<tc-traceability-spine id="spine" heading="Neuromorphic computing"></tc-traceability-spine>

<script type="module">
  import "@adamstavely/trenchcoat/traceability-spine";
  import "@adamstavely/trenchcoat/tokens.css";

  const spine = document.querySelector("#spine");
  spine.nodes = [
    { id: "q1", stage: "question", title: "Can spiking nets match dense accuracy at 1% of the energy?", status: "Open", links: ["g1"] },
    { id: "g1", stage: "gap", title: "No energy-normalised benchmark suite.", status: "High", tone: "warning", links: ["w1"] },
    { id: "w1", stage: "work", title: "Benchmark harness", status: "Active", tone: "info", progress: 0.6, links: ["p1"] },
    { id: "p1", stage: "paper", title: "Sparse spiking networks at 40× lower energy", meta: "↓ 18k · 73 cites" },
  ];
  spine.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.path));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TraceabilitySpine, type SpineNode } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const nodes: SpineNode[] = [
  { id: "q1", stage: "question", title: "Can spiking nets match dense accuracy at 1% of the energy?", status: "Open", links: ["g1"] },
  { id: "g1", stage: "gap", title: "No energy-normalised benchmark suite.", status: "High", tone: "warning", links: ["w1"] },
  { id: "w1", stage: "work", title: "Benchmark harness", status: "Active", tone: "info", progress: 0.6 },
];

export function Topic() {
  const [selected, setSelected] = useState<string | null>(null);
  return <TraceabilitySpine title="Neuromorphic computing" nodes={nodes} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/traceability-spine";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";

defineProps<{ stages: TcTraceabilitySpine["stages"]; nodes: TcTraceabilitySpine["nodes"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-traceability-spine :stages="stages" :nodes="nodes" @tc-selected-change="onSelectedChange"></tc-traceability-spine>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TraceabilitySpine } from "@adamstavely/trenchcoat/angular/traceability-spine";
import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";

@Component({
  selector: "app-traceability-spine-example",
  imports: [TraceabilitySpine],
  template: `<tc-traceability-spine [stages]="stages()" [nodes]="nodes()" (tc-selected-change)="onSelectedChange($event)"></tc-traceability-spine>`,
})
export class TraceabilitySpineExample {
  readonly stages = input.required<TcTraceabilitySpine["stages"]>();
  readonly nodes = input.required<TcTraceabilitySpine["nodes"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/traceability-spine";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";

  let { stages, nodes }: { stages: TcTraceabilitySpine["stages"]; nodes: TcTraceabilitySpine["nodes"] } = $props();
  let el: TcTraceabilitySpine;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-traceability-spine bind:this={el} {stages} {nodes}></tc-traceability-spine>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Traceability"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `stages` | – | `SpineStage[]` | `[ { id: "question", label: "Questions", noun: ["question", "questions"] }, { id: "gap", label: "Gaps", noun: ["gap", "gaps"] }, { id: "work", label: "Work in flight", noun: ["work item", "work items"] }, { id: "paper", label: "Papers", noun: ["paper", "papers"] }, { id: "cited", label: "Cited by", noun: ["citing work", "citing works"] }, ]` | The stages, a column each, left to right |
| `nodes` | – | `SpineNode[]` | `[]` | The items, each in a stage, with the ids it links to |
| `selected` | – | `string \| null` | `null` | The card whose path is traced. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A card's path was traced or cleared ({ selected, path }: SpineSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-action` | – | No | "+N more" was pressed under a stage ({ action: "more", stage }: SpineAction) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tsp-question` | `var(--tc-icon-muted)` | both |
| `--tc-tsp-gap` | `var(--tc-chart-1)` | both |
| `--tc-tsp-work` | `var(--tc-tone-violet-solid)` | both |
| `--tc-tsp-paper` | `var(--tc-status-success-solid)` | both |
| `--tc-tsp-cited` | `var(--tc-tone-amber-solid)` | both |
| `--tc-tsp-col` | `176px` | both |
| `--tc-tsp-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (81)

`--tc-action-ghost-bg-hover`, `--tc-avatar-font-weight`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-solid`, `--tc-tone-violet-solid`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-tsp-cols`, `--tc-tsp-edge`

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
| `stages` | `el.stages = …;` | `<… stages={…} />` | `<tc-traceability-spine :stages="…">` | `<tc-traceability-spine [stages]="…">` | `<tc-traceability-spine {stages}>` |
| `nodes` | `el.nodes = …;` | `<… nodes={…} />` | `<tc-traceability-spine :nodes="…">` | `<tc-traceability-spine [nodes]="…">` | `<tc-traceability-spine {nodes}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-traceability-spine :selected="…">` | `<tc-traceability-spine [selected]="…">` | `<tc-traceability-spine {selected}>` |

*Also attributes: `heading`, `description` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onMore={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-traceability-spine id="traceability-spine"></tc-traceability-spine>

<script type="module">
  import "@adamstavely/trenchcoat/traceability-spine";

  const el = document.querySelector("#traceability-spine");
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
import "@adamstavely/trenchcoat/traceability-spine";
import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";

const props = defineProps<{ initial: TcTraceabilitySpine["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcTraceabilitySpine["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-traceability-spine :selected="selected" @tc-selected-change="onSelectedChange"></tc-traceability-spine>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TraceabilitySpine } from "@adamstavely/trenchcoat/angular/traceability-spine";
import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";

@Component({
  selector: "app-controlled-traceability-spine",
  imports: [TraceabilitySpine],
  template: `<tc-traceability-spine [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-traceability-spine>`,
})
export class ControlledTraceabilitySpine {
  readonly initial = input.required<TcTraceabilitySpine["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcTraceabilitySpine["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/traceability-spine";
  import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";

  let { initial }: { initial: TcTraceabilitySpine["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcTraceabilitySpine;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcTraceabilitySpine["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-traceability-spine bind:this={el} {selected}></tc-traceability-spine>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-traceability-spine")` returns a `TcTraceabilitySpine` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";`
- **React / Next.js:** Props: `import type { TraceabilitySpineProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TraceabilitySpine>`. The element class, for refs: `import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTraceabilitySpine["stages"]` with `import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";`
- **Angular:** The directive types the template: `[stages]` takes `TcTraceabilitySpine["stages"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTraceabilitySpine } from "@adamstavely/trenchcoat/traceability-spine";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `selected` | `string \| null` | The card whose path is traced – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The card traced on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, path: string[]) => void` | A card's path was traced or cleared; `path` is every id on it |
| `onMore` | `(stage: string) => void` | "+N more" was pressed under a stage |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

The cards are one tab stop; inside the board the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next card in the column |
| ← / → | Moves to the nearest card, by height, in the previous or next column |
| Home / End | Moves to the first or last card in the column |
| Enter / Space | Traces the card's path, or clears it if it's the traced card |
| Escape | Clears the trace |
| Tab | Leaves the board; “+N more” buttons come after it |

### Screen readers

The board is a group named by the heading. Each stage is a section headed with its name and count. Each card is a
toggle button – pressed while it's the traced card – that reads its kind, status, title, details and people, and is
described by “Enter traces this card's path; arrow keys move between cards”. Tracing is confirmed in a polite status
message, “Traced 1 question, 1 gap, 1 work item, 1 paper and 3 citing works”, and clearing with “Trace cleared”. The
lines and the stage colours are hidden; the path is in the message.

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
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.3 KB | 7.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.8 KB** | **9.3 KB** |
| With Lit – the first component on a page | 51.6 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.2 ms** | the gallery demo's data, 194 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of nodes replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | nodes: first render, 742 nodes; update 1.8 ms |
| 1,000 items | 72 ms | nodes: first render, 6,907 nodes; update 19 ms |

1,000 items of nodes: 72 ms. It renders every item, so a first render passes 50 ms (a long task) at about 690 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write questions as questions and gaps as what's missing: “Memristor endurance data above 10⁸ cycles is missing.”
- Keep statuses to one or two words: “Open”, “Partial”, “Blocked”, “In review”.
- Use `flag` for the one thing that needs attention, such as “Uncovered” for a gap with no work.
- Give each stage a `noun` so the announcement reads naturally: `["work item", "work items"]`.

## Do and don't

### Do

- Link every card to the cards it leads to, so a trace reaches all the way through.
- Show the most recent citing works and count the rest with `more`.
- Keep to five or six stages so the columns fit without much sideways scrolling.

### Don't

- Don't use tone for anything but status – the stage colours already say which column a card is in.
- Don't put long paragraphs in a card; link to the item's own page instead.
- Don't trace on load unless the page was opened for that item.

## Related

- [Grade Distribution](grade-distribution.md) – How a set of assessments came out – a count over each grade (Outstanding to Dissatisfactory, or your own), how many were assessed, empty grades muted, an optional bar in proportion and a grade picked as a filter
- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away
- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step

## Changelog

- **`tc-traceability-spine`:** the chain from open questions to outcomes. - **Columns:** one per stage – Question, Gap, Work, Paper, Cited by, or your own stages. - **Linking and tracing:** linked cards are joined by lines. Clicking a card, or pressing Enter on it, traces its whole path and dims the rest.
