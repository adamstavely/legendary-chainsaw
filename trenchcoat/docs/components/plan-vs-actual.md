<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Plan vs Actual

**Agents**

An agent's plan against what really happens – every step's bar grows over its dashed planned ghost, overruns turn amber, the steps after it slide right, and the expected finish moves away from the planned one

- **Element:** `<tc-plan-vs-actual>`
- **Size:** 12.6 KB gzip · 45.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/plan-vs-actual";` |
| React / Next.js | `import { PlanVsActual } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/plan-vs-actual";` · tags starting with tc- are custom elements |
| Angular | `import { PlanVsActual } from "@adamstavely/trenchcoat/angular/plan-vs-actual";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/plan-vs-actual";` |

## Example

The live example is in the gallery at `#/plan-vs-actual`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An agent's plan set against what is really happening, as a live Gantt chart. Every step shows its planned time as a
dashed ghost, with its real bar growing over it; the part that runs past the plan turns amber, the steps that wait
on it slide right, and the expected finish moves away from the planned one. The bar on top keeps time and cost so
far against the plan, and says whether the run is on plan, behind or ahead. People see at a glance whether a run
will finish when it was meant to – and which step is to blame if it won't.

### When to use

- Long agent runs with a plan of dependent steps, where finishing on time or within budget matters.
- Explaining afterwards why a run took longer or cost more than planned.
- Any multi-step job with estimates per step and a live clock.

### When not to use

- Following the steps of a plan without timings – use [Agent Plan](agent-plan.md).
- Timing the calls inside one request or one step – use [Trace Waterfall](trace-waterfall.md).
- Hundreds of parallel tasks rather than a handful of planned steps – use [Fan-out Grid](fan-out-grid.md).
- Watching spend against a hard cap – use [Budget Guard](budget-guard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-pvac__head` – the heading, the task, time and cost against the plan, and the verdict
2. **Verdict** `.ui-pvac__verdict` – “On plan”, “+12s behind”, “8s ahead”, then “late” or “early” once finished
3. **Step** `.ui-pvac__row` – the step's state, its title and its bars
4. **Plan ghost** `.ui-pvac__ghost` – the dashed bar where the step was planned to run
5. **Actual bar** `.ui-pvac__bar` – where it really ran, or is now expected to; the overrun is amber
6. **Finish lines** `.ui-pvac__finish` – the planned finish (dashed) and the expected finish (solid)

## Looks

Clean only: the element always renders the Clean look – one white card with hairline gridlines – whatever `look` or
the page's provider say.

## Usage

### HTML

```html
<tc-plan-vs-actual id="run" task="Ship the pricing page"></tc-plan-vs-actual>

<script type="module">
  import "@adamstavely/trenchcoat/plan-vs-actual";
  import "@adamstavely/trenchcoat/tokens.css";

  const chart = document.querySelector("#run");
  chart.steps = [
    { id: "brief", title: "Read the brief", plan: 6000, start: 0, end: 5000 },
    { id: "copy", title: "Draft the copy", plan: 14000, deps: ["brief"], start: 5000 },
    { id: "layout", title: "Build the layout", plan: 18000, deps: ["brief"], start: 5000 },
  ];
  chart.elapsed = 21000;
</script>
```

### React / Next.js

```tsx
import { PlanVsActual, type PlanVsActualStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const steps: PlanVsActualStep[] = [
  { id: "brief", title: "Read the brief", plan: 6000, start: 0, end: 5000, cost: 0.02, planCost: 0.02 },
  { id: "copy", title: "Draft the copy", plan: 14000, deps: ["brief"], start: 5000, cost: 0.14, planCost: 0.12 },
];

export function RunPlan({ elapsed }: { elapsed: number }) {
  return <PlanVsActual task="Ship the pricing page" steps={steps} elapsed={elapsed} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/plan-vs-actual";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPlanVsActual } from "@adamstavely/trenchcoat/plan-vs-actual";

defineProps<{ steps: TcPlanVsActual["steps"]; now: TcPlanVsActual["now"] }>();
</script>

<template>
  <tc-plan-vs-actual :steps="steps" :now="now"></tc-plan-vs-actual>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PlanVsActual } from "@adamstavely/trenchcoat/angular/plan-vs-actual";
import type { TcPlanVsActual } from "@adamstavely/trenchcoat/plan-vs-actual";

@Component({
  selector: "app-plan-vs-actual-example",
  imports: [PlanVsActual],
  template: `<tc-plan-vs-actual [steps]="steps()" [now]="now()"></tc-plan-vs-actual>`,
})
export class PlanVsActualExample {
  readonly steps = input.required<TcPlanVsActual["steps"]>();
  readonly now = input.required<TcPlanVsActual["now"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/plan-vs-actual";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPlanVsActual } from "@adamstavely/trenchcoat/plan-vs-actual";

  let { steps, now }: { steps: TcPlanVsActual["steps"]; now: TcPlanVsActual["now"] } = $props();
  let el: TcPlanVsActual;
</script>

<tc-plan-vs-actual bind:this={el} {steps} {now}></tc-plan-vs-actual>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `resolvedLook` | – | `Look` | – | One look only: always Clean |
| `steps` | – | `PlanVsActualStep[]` | `[]` | The plan's steps, in order – each with its planned time, what it waits for, and its real start and end so far |
| `now` | – | `number \| undefined` | `undefined` | The clock, in epoch ms – without it (and without `elapsed`) the chart reads the clock after it connects and ticks while the run goes on |
| `startedAt` | – | `number \| undefined` | `undefined` | When the run started, in epoch ms – defaults to the earliest step start |
| `elapsed` | – | `number \| undefined` | `undefined` | Where the run is now as ms from its start; step start/end are then run-relative too. Takes precedence over `now` |
| `task` | `task` | `string` | `""` | What the run is for – e.g. "Ship the pricing page" |
| `heading` | `heading` | `string` | `"Plan vs actual"` | The heading, and the list's name |
| `formatTime` | – | `(ms: number) => string` | `clock` | Formats a time – defaults to 0:42 / 1:05 |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats a cost – defaults to dollars |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-plan-vs-actual-ghost` | `light-dark(rgba(0, 0, 0, 0.26), rgba(255, 255, 255, 0.3))` | both |
| `--tc-plan-vs-actual-link` | `light-dark(rgba(0, 0, 0, 0.5), rgba(255, 255, 255, 0.55))` | both |
| `--tc-plan-vs-actual-actual-bg` | `light-dark(rgba(91, 91, 214, 0.1), rgba(130, 130, 255, 0.16))` | both |
| `--tc-plan-vs-actual-actual-edge` | `light-dark(rgba(91, 91, 214, 0.3), rgba(130, 130, 255, 0.38))` | both |
| `--tc-plan-vs-actual-actual-mark` | `light-dark(rgba(91, 91, 214, 0.72), rgba(140, 140, 255, 0.8))` | both |
| `--tc-plan-vs-actual-forecast-bg` | `light-dark(rgba(0, 0, 0, 0.035), rgba(255, 255, 255, 0.05))` | both |
| `--tc-plan-vs-actual-forecast-edge` | `light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.09))` | both |
| `--tc-plan-vs-actual-gap-late-bg` | `light-dark(rgba(255, 140, 0, 0.07), rgba(255, 140, 30, 0.07))` | both |
| `--tc-plan-vs-actual-gap-early-bg` | `light-dark(rgba(0, 164, 51, 0.06), rgba(40, 200, 110, 0.06))` | both |
| `--tc-plan-vs-actual-now` | `light-dark(rgba(0, 96, 226, 0.4), rgba(91, 154, 255, 0.55))` | both |
| `--tc-plan-vs-actual-chip` | `light-dark(rgba(0, 0, 0, 0.045), rgba(255, 255, 255, 0.07))` | both |
| `--tc-plan-vs-actual-spin` | `900ms` | both |
| `--tc-plan-vs-actual-glow` | `1100ms` | both |
| `--tc-plan-vs-actual-row` | `32px` | both |
| `--tc-plan-vs-actual-bar` | `14px` | both |
| `--tc-plan-vs-actual-axis` | `30px` | both |
| `--tc-plan-vs-actual-foot` | `40px` | both |
| `--tc-plan-vs-actual-name` | `188px` | both |
| `--tc-plan-vs-actual-pad` | `16px` | both |
| `--tc-plan-vs-actual-gap` | `14px` | both |
| `--tc-plan-vs-actual-end` | `16px` | both |

#### Design tokens it reads (62)

`--tc-accent-text`, `--tc-avatar-radius-agent`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-plan-vs-actual-kind-bg`, `--tc-plan-vs-actual-kind-edge`, `--tc-plan-vs-actual-range`, `--tc-plan-vs-actual-x0`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-plan-vs-actual :steps="…">` | `<tc-plan-vs-actual [steps]="…">` | `<tc-plan-vs-actual {steps}>` |
| `now` | `el.now = …;` | `<… now={…} />` | `<tc-plan-vs-actual :now="…">` | `<tc-plan-vs-actual [now]="…">` | `<tc-plan-vs-actual {now}>` |
| `startedAt` | `el.startedAt = …;` | `<… startedAt={…} />` | `<tc-plan-vs-actual :startedAt="…">` | `<tc-plan-vs-actual [startedAt]="…">` | `<tc-plan-vs-actual {startedAt}>` |
| `elapsed` | `el.elapsed = …;` | `<… elapsed={…} />` | `<tc-plan-vs-actual :elapsed="…">` | `<tc-plan-vs-actual [elapsed]="…">` | `<tc-plan-vs-actual {elapsed}>` |
| `formatTime` | `el.formatTime = …;` | `<… formatTime={…} />` | `<tc-plan-vs-actual :formatTime="…">` | `<tc-plan-vs-actual [formatTime]="…">` | `<tc-plan-vs-actual {formatTime}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-plan-vs-actual :formatCost="…">` | `<tc-plan-vs-actual [formatCost]="…">` | `<tc-plan-vs-actual {formatCost}>` |

*Also attributes: `task`, `heading` – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-plan-vs-actual")` returns a `TcPlanVsActual` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPlanVsActual } from "@adamstavely/trenchcoat/plan-vs-actual";`
- **React / Next.js:** Props: `import type { PlanVsActualProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PlanVsActual>`. The element class, for refs: `import type { TcPlanVsActual } from "@adamstavely/trenchcoat/plan-vs-actual";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPlanVsActual["steps"]` with `import type { TcPlanVsActual } from "@adamstavely/trenchcoat/plan-vs-actual";`
- **Angular:** The directive types the template: `[steps]` takes `TcPlanVsActual["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPlanVsActual } from "@adamstavely/trenchcoat/plan-vs-actual";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPlanVsActual } from "@adamstavely/trenchcoat/plan-vs-actual";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `steps` | `PlanVsActualStep[]` | The plan's steps, in order – each with its planned time, what it waits for, and its real start and end so far; `icon` takes a React node |
| `title` | `string` | The heading, and the list's name (default "Plan vs actual") |

*Renamed or hidden on the wrapper: `steps`, `heading`, `look`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to each step in turn; a focused step shows what it waits for, what waits for it and its cost |

Nothing else is operated – the chart only reports.

### Screen readers

The steps are a list named by the heading (“Plan vs actual”). Each step is a focusable list item whose name says
where it stands: “Draft the copy: took 0:19, planned 0:14, $0.17. Waits for Read the brief”, “Build the layout:
running for 0:08 of 0:18 planned”, or “Wire up the pricing table: starts in about 0:21, planned 0:10”. The header's
time, cost and verdict are plain text, read in order. The ticks, finish lines, dependency links and key are hidden
from assistive technology. Nothing is announced as the run moves on.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| @property | 85 | 128 | 16.4 | 16.4 | itself | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 38.4 KB | 10.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **45.5 KB** | **12.6 KB** |
| With Lit – the first component on a page | 68.1 KB | 20.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.7 ms** | the gallery demo's data, 110 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of steps replaced |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |
| 100 items | 18 ms | steps: first render, 1,082 nodes; update 1.5 ms |
| 1,000 items | 111 ms | steps: first render, 10,466 nodes; update 7.9 ms |

1,000 items of steps: 111 ms. It renders every item, so a first render passes 50 ms (a long task) at about 450 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 51 React commits (clean), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setInterval, cleared`.
- 1 infinite CSS animation.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title steps with a verb and an object, in a few words: “Build the layout”, “Wire up the pricing table”.
- Set `task` to what the run is for, in the product's words: “Ship the pricing page”.
- Plan times should be the agent's own estimates – the chart is only as honest as the plan.
- Pass `formatCost` for other currencies or credits, and `formatTime` for runs measured in hours.

## Do and don't

### Do

- Give steps their `deps`, so a late step pushes what waits for it and the expected finish moves with it.
- Pass `elapsed` (or `now`) from the run's own clock when you have one, so the chart and the run agree.
- Add `cost` and `planCost` per step when spend matters – the header then compares them.

### Don't

- Don't use it for a run with no plan – without plan times there is nothing to compare.
- Don't show more than about a dozen steps; group small steps into one.
- Don't rely on colour alone in surrounding text – say “behind” or “late”, as the verdict does.

## Related

- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
