<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Parallel Attempts

**Agents**

An agent tries the same task several ways at once and the best one wins – every attempt races as a row with its model, approach and live bar, then gets a score; the best is marked and picked, and you can switch to another

- **Element:** `<tc-parallel-attempts>`
- **Size:** 9.4 KB gzip · 37.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/parallel-attempts";` |
| React / Next.js | `import { ParallelAttempts } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/parallel-attempts";` · tags starting with tc- are custom elements |
| Angular | `import { ParallelAttempts } from "@adamstavely/trenchcoat/angular/parallel-attempts";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/parallel-attempts";` |

## Example

The live example is in the gallery at `#/parallel-attempts`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An agent tries the same task several ways at once, and the best one wins. Every attempt races as a row with its
model, its approach and a live bar showing how far it is and what it's doing; once it's through it gets a score or
says why it failed. When all are through, the best finished attempt is marked “Best” and picked on its own – and
people can switch to another with “Use this one”. The bar on top counts how many are done and what they cost
together.

### When to use

- Running one task with several models or strategies and keeping the best result.
- Showing why one result was chosen – scores side by side – and letting people overrule the choice.
- Fixes, drafts or plans where a few tries are cheap and one good answer is what counts.

### When not to use

- Comparing two runs or prompt versions in depth, output by output – use [Run Compare](run-compare.md).
- Two answers that a person judges themselves – use [Answer Arena](answer-arena.md).
- Many different sub-tasks running at once, not one task tried several ways – use [Fan-out Grid](fan-out-grid.md).
- Choosing a model before anything runs – use [Model Picker](model-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a lanes icon, the heading and the task, with “2 of 4 done” and the total cost at the right
2. **Attempt** `.ui-pa__row` – one try: its mark, name, model, approach and current step or outcome
3. **Mark** `.ui-pa__icon` – the model maker's logo, or the attempt's first letter
4. **Lane** `.ui-pa__lane` – the bar that fills as the attempt runs
5. **Result** `.ui-pa__end` – the percentage, then the score or “Failed”; “Use this one” once all are through

## Looks

Standard stacks a white card per attempt on the gray tray, with the header on the tray above them. Clean drops the
tray: the header sits above the list and every attempt is a quiet card with hairline shadows. Both race the same bars, fade
the attempts not in use, and mark the best one green.

## Usage

### HTML

```html
<tc-parallel-attempts id="race" task="Fix the flaky checkout test"></tc-parallel-attempts>

<script type="module">
  import "@adamstavely/trenchcoat/parallel-attempts";
  import "@adamstavely/trenchcoat/tokens.css";

  const race = document.querySelector("#race");
  race.attempts = [
    {
      id: "a",
      name: "Attempt A",
      approach: "Mock the payment API",
      model: "Claude Sonnet",
      status: "done",
      score: 92,
      note: "20/20 runs green",
      took: 41000,
      cost: 0.31,
    },
    {
      id: "b",
      name: "Attempt B",
      approach: "Add explicit waits",
      model: "Claude Haiku",
      status: "running",
      progress: 0.6,
      step: "Running tests 12/20",
    },
  ];
  race.addEventListener("tc-picked-change", (e) => console.log(e.detail.picked, e.detail.auto));
</script>
```

### React / Next.js

```tsx
import { ParallelAttempts, type Attempt } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FixRace({ attempts, apply }: { attempts: Attempt[]; apply: (id: string) => void }) {
  return (
    <ParallelAttempts
      title="Parallel attempts"
      task="Fix the flaky checkout test"
      attempts={attempts}
      onPick={(attempt) => apply(attempt.id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/parallel-attempts";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";

defineProps<{ attempts: TcParallelAttempts["attempts"]; picked: TcParallelAttempts["picked"] }>();
const onPickedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-parallel-attempts :attempts="attempts" :picked="picked" @tc-picked-change="onPickedChange"></tc-parallel-attempts>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ParallelAttempts } from "@adamstavely/trenchcoat/angular/parallel-attempts";
import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";

@Component({
  selector: "app-parallel-attempts-example",
  imports: [ParallelAttempts],
  template: `<tc-parallel-attempts [attempts]="attempts()" [picked]="picked()" (tc-picked-change)="onPickedChange($event)"></tc-parallel-attempts>`,
})
export class ParallelAttemptsExample {
  readonly attempts = input.required<TcParallelAttempts["attempts"]>();
  readonly picked = input.required<TcParallelAttempts["picked"]>();
  onPickedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/parallel-attempts";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";

  let { attempts, picked }: { attempts: TcParallelAttempts["attempts"]; picked: TcParallelAttempts["picked"] } = $props();
  let el: TcParallelAttempts;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-picked-change", on);
    return () => el.removeEventListener("tc-picked-change", on);
  });
</script>

<tc-parallel-attempts bind:this={el} {attempts} {picked}></tc-parallel-attempts>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `attempts` | – | `ParallelAttempt[]` | `[]` | The attempts, one row each – name, approach, status and, once done, a score |
| `task` | `task` | `string` | `""` | What all of them try to do – e.g. "Fix the flaky checkout test" |
| `heading` | `heading` | `string \| undefined` | `undefined` | The heading; unset shows "Best of &lt;n>" |
| `picked` | – | `string \| null` | `null` | The id of the attempt in use; null or an unknown id falls back to the best finished attempt once all are through |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – defaults to dollars, e.g. "$0.31" |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-picked-change` | – | Yes | The attempt in use changed; detail `{ picked, attempt, auto }`. Cancelable when picked by hand (`auto: false`): preventDefault() keeps the current pick (controlled use). `auto: true` reports the best one taken on its own once all are through. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-parallel-attempts-picked-bg` | `light-dark(#f3fbf6, #1c2b22)` | standard |
| `--tc-parallel-attempts-best-bg` | `light-dark(rgba(0, 164, 51, 0.24), rgba(40, 200, 110, 0.32))` | standard, clean |
| `--tc-parallel-attempts-best-edge` | `light-dark(rgba(0, 140, 50, 0.48), rgba(60, 220, 130, 0.6))` | standard, clean |
| `--tc-parallel-attempts-sweep` | `1500ms` | standard, clean |
| `--tc-parallel-attempts-glow` | `1100ms` | standard, clean |
| `--tc-parallel-attempts-picked-wash` | `light-dark(rgba(0, 164, 51, 0.035), rgba(40, 200, 110, 0.06))` | clean |

#### Design tokens it reads (63)

`--tc-avatar-radius-agent`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-radius`, `--tc-parallel-attempts-status-bg`, `--tc-parallel-attempts-status-edge`, `--tc-parallel-attempts-status-ink`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-border`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `attempts` | `el.attempts = …;` | `<… attempts={…} />` | `<tc-parallel-attempts :attempts="…">` | `<tc-parallel-attempts [attempts]="…">` | `<tc-parallel-attempts {attempts}>` |
| `picked` | `el.picked = …;` | `<… picked={…} />` | `<tc-parallel-attempts :picked="…">` | `<tc-parallel-attempts [picked]="…">` | `<tc-parallel-attempts {picked}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-parallel-attempts :formatCost="…">` | `<tc-parallel-attempts [formatCost]="…">` | `<tc-parallel-attempts {formatCost}>` |

*Also attributes: `task`, `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-picked-change` | Yes | `el.addEventListener("tc-picked-change", (e) => …)` | `onPick={…}` | `@tc-picked-change="…"` | `(tc-picked-change)="…($event)"` | `el.addEventListener("tc-picked-change", …)` |

### Controlled

The element changes `picked` itself unless a listener calls `preventDefault()` on `tc-picked-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-parallel-attempts id="parallel-attempts"></tc-parallel-attempts>

<script type="module">
  import "@adamstavely/trenchcoat/parallel-attempts";

  const el = document.querySelector("#parallel-attempts");
  el.addEventListener("tc-picked-change", (e) => {
    e.preventDefault(); // the element keeps its picked…
    if (allowed(e.detail.picked)) el.picked = e.detail.picked; // …until the app sets it
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
import "@adamstavely/trenchcoat/parallel-attempts";
import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";

const props = defineProps<{ initial: TcParallelAttempts["picked"] }>();
const picked = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPickedChange = (e: CustomEvent<{ picked: TcParallelAttempts["picked"] }>) => {
  e.preventDefault();
  picked.value = e.detail.picked;
};
</script>

<template>
  <tc-parallel-attempts :picked="picked" @tc-picked-change="onPickedChange"></tc-parallel-attempts>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ParallelAttempts } from "@adamstavely/trenchcoat/angular/parallel-attempts";
import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";

@Component({
  selector: "app-controlled-parallel-attempts",
  imports: [ParallelAttempts],
  template: `<tc-parallel-attempts [picked]="picked()" (tc-picked-change)="onPickedChange($event)"></tc-parallel-attempts>`,
})
export class ControlledParallelAttempts {
  readonly initial = input.required<TcParallelAttempts["picked"]>();
  readonly picked = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPickedChange(e: CustomEvent<{ picked: TcParallelAttempts["picked"] }>) {
    e.preventDefault();
    this.picked.set(e.detail.picked);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/parallel-attempts";
  import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";

  let { initial }: { initial: TcParallelAttempts["picked"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let picked = $derived(initial);
  let el: TcParallelAttempts;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      picked = (e as CustomEvent<{ picked: TcParallelAttempts["picked"] }>).detail.picked;
    };
    el.addEventListener("tc-picked-change", on);
    return () => el.removeEventListener("tc-picked-change", on);
  });
</script>

<tc-parallel-attempts bind:this={el} {picked}></tc-parallel-attempts>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-parallel-attempts")` returns a `TcParallelAttempts` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";`
- **React / Next.js:** Props: `import type { ParallelAttemptsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ParallelAttempts>`. The element class, for refs: `import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcParallelAttempts["attempts"]` with `import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";`
- **Angular:** The directive types the template: `[attempts]` takes `TcParallelAttempts["attempts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcParallelAttempts } from "@adamstavely/trenchcoat/parallel-attempts";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `attempts` | `Attempt[]` | The attempts, one row each; icons can be React nodes |
| `picked` | `string \| null` | The id of the attempt in use. Controlled when defined; null or an unknown id falls back to the best finished attempt once all are through |
| `defaultPicked` | `string \| null` | The attempt in use on mount when `picked` isn't controlled |
| `onPick` | `(attempt: Attempt, reason: AttemptPickReason) => void` | Called with the attempt in use whenever it changes – picked by hand (`auto: false`), or the best one taken on its own once all are through (`auto: true`) |
| `title` | `string` | The heading – "Best of &lt;n>" when unset |

*Renamed or hidden on the wrapper: `attempts`, `picked`, `heading`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the “Use this one” buttons – one stop for the group, on the one in use |
| ↓ / → | Picks the next finished attempt and moves focus to it, wrapping round |
| ↑ / ← | Picks the previous finished attempt |
| Enter / Space | Picks the focused attempt |

The buttons appear once every attempt is through; only finished attempts with a result can be picked.

### Screen readers

The attempts are a `radiogroup` named by the heading (“Best of 4” unless set); each “Use this one” is a `radio` with
`aria-checked`, named “Use this one: Attempt A, score 92” or “In use: Attempt A, score 92”. The progress bars are
hidden – a status region doesn't read running percentages, only the result once all are through and each pick: “4
of 4 done, best: Attempt A. Using Attempt A.”

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

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
| **This component alone** | 29.4 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 19.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **37.4 KB** | **9.4 KB** |
| With Lit – the first component on a page | 58.4 KB | 16.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 82 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of attempts replaced |
| First on the page | 9.4 ms | default properties; includes adding its CSS to the document |
| 100 items | 17 ms | attempts: first render, 1,618 nodes; update 2.5 ms |
| 1,000 items | 191 ms | attempts: first render, 16,018 nodes; update 29 ms |

1,000 items of attempts: 191 ms. It renders every item, so a first render passes 50 ms (a long task) at about 260 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 11 React commits (clean), 11 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name attempts plainly (“Attempt A”) and put the difference in `approach`: “Mock the payment API”, “Add explicit
  waits”.
- Write `step` as what it's doing now, with a count where there is one: “Running tests 12/20”.
- Use `note` for the outcome in a few words – “20/20 runs green” – or the error when it failed.
- Set `task` to the goal they share: “Fix the flaky checkout test”.

## Do and don't

### Do

- Score every finished attempt on the same 0–100 scale, so the best one is the highest.
- Listen to `tc-picked-change` (`onPick`) for both the automatic pick (`auto: true`) and a person's choice.
- Pass `took` and `cost`, so people can weigh a slightly better result against a slower or dearer one.

### Don't

- Don't race more than about five attempts – the rows get hard to compare.
- Don't leave `score` empty on a finished attempt you want to win – an attempt without one counts as 0.
- Don't pick for people once they've chosen – keep `picked` on their choice.

## Related

- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason
- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover
- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
