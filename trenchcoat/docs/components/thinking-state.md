<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Thinking State

**AI & chat** · Also in React

AI working panel with a live timer, searched sources and thinking steps that appear one by one

- **Element:** `<tc-thinking-state>`
- **Size:** 10.7 KB gzip · 41.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/thinking-state";` |
| React / Next.js | `import { ThinkingState } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/thinking-state";` · tags starting with tc- are custom elements |
| Angular | `import { ThinkingState } from "@adamstavely/trenchcoat/angular/thinking-state";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/thinking-state";` |

## Example

The live example is in the gallery at `#/thinking-state`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The panel an AI chat shows while it works on an answer. A header says “Thinking” with a live timer, and below it
the steps appear one after another – what it's doing, and the searches it ran with their sources as small chips
people can open. When it's done, a check ends the list and the header turns into “Worked for 9s”; the header also
folds the steps away. It shows people that something is happening and what it's based on, so a long wait reads
as work rather than a stall.

### When to use

- Answers that take more than a few seconds and go through visible stages – reading, searching, comparing.
- Research or retrieval answers, where the sources searched are part of why people trust the result.
- Streaming the agent's real progress: set `progress` and `done` from your stream events.

### When not to use

- A short wait with nothing to report – use [Thinking Loader](thinking-loader.md).
- The answer itself, with its sources and follow-ups – use [AI Answer](ai-answer.md), or [Cited Answer](cited-answer.md) when each sentence links
  to its source.
- A plan people should review or edit before the agent runs it – use [Agent Plan](agent-plan.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-think__head` – “Thinking” and the timer, then “Worked for …”; folds the steps
2. **Step** `.ui-think__item` – one thing it did, the current one shimmering
3. **Sources** `.ui-think__sources` – the pages a search found, as chips that open them
4. **More** `.ui-think__more` – “+N more”, showing the rest of a search's sources

## Looks

Standard has no card: a chevron before the title, and the steps below it as an open list. Clean sits in one white
card with hairline shadows, with a 3×3 pixel mark that twinkles while it thinks in place of the chevron (which
moves to the end of the header), and shows the first step from the start instead of after a pause. In both, a thin
line joins the steps.

## Usage

### HTML

```html
<tc-thinking-state id="thinking" done-label="Ready to answer"></tc-thinking-state>

<script type="module">
  import "@adamstavely/trenchcoat/thinking-state";
  import "@adamstavely/trenchcoat/tokens.css";

  const panel = document.querySelector("#thinking");
  panel.steps = [
    { kind: "step", label: "Understanding the question" },
    {
      kind: "search",
      label: "Searched “heat pump running cost”",
      activeLabel: "Searching “heat pump running cost”",
      sources: [{ label: "energy.gov", href: "https://www.energy.gov" }],
    },
    { kind: "step", label: "Comparing yearly costs" },
  ];
  panel.progress = 1; // from your stream: one step so far
  panel.addEventListener("tc-done", (e) => console.log(`Worked for ${e.detail.seconds}s`));
</script>
```

### React / Next.js

```tsx
import { ThinkingState, type ThinkingStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const steps: ThinkingStep[] = [
  { kind: "step", label: "Understanding the question" },
  {
    kind: "search",
    label: "Searched “heat pump running cost”",
    activeLabel: "Searching “heat pump running cost”",
    sources: [{ label: "energy.gov", href: "https://www.energy.gov" }],
  },
  { kind: "step", label: "Comparing yearly costs" },
];

export function Working({ progress, done }: { progress: number; done: boolean }) {
  return <ThinkingState steps={steps} progress={progress} done={done} doneLabel="Ready to answer" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/thinking-state";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";

defineProps<{ steps: TcThinkingState["steps"]; done: TcThinkingState["done"] }>();
const onProgressChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-thinking-state :steps="steps" :done="done" @tc-progress-change="onProgressChange"></tc-thinking-state>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ThinkingState } from "@adamstavely/trenchcoat/angular/thinking-state";
import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";

@Component({
  selector: "app-thinking-state-example",
  imports: [ThinkingState],
  template: `<tc-thinking-state [steps]="steps()" [done]="done()" (tc-progress-change)="onProgressChange($event)"></tc-thinking-state>`,
})
export class ThinkingStateExample {
  readonly steps = input.required<TcThinkingState["steps"]>();
  readonly done = input.required<TcThinkingState["done"]>();
  onProgressChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/thinking-state";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";

  let { steps, done }: { steps: TcThinkingState["steps"]; done: TcThinkingState["done"] } = $props();
  let el: TcThinkingState;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-progress-change", on);
    return () => el.removeEventListener("tc-progress-change", on);
  });
</script>

<tc-thinking-state bind:this={el} {steps} {done}></tc-thinking-state>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `steps` | – | `ThinkingStep[]` | `[]` | The steps and searches to show, in order – `progress` (or the timeline) decides how many have appeared |
| `doneLabel` | `done-label` | `string` | `"Finished thinking"` | Label of the final row |
| `stepMs` | `step-ms` | `number` | `1300` | Pause between two steps, in ms (the timeline that runs when `progress` and `done` are unset) |
| `progress` | `progress` | `number \| undefined` | `undefined` | How many steps have appeared; unset, the timeline reveals them |
| `done` | – | `boolean \| undefined` | `undefined` | Finished; unset, the timeline decides (when `progress` is unset too) |
| `loop` | `loop` | `boolean` | `false` | Start over after a pause once finished – only while the timeline runs everything. Stops after a few runs, and as soon as the pointer or focus is inside (WCAG 2.2.2) |
| `open` | `open` | `boolean` | `true` | Whether the steps are unfolded |
| `startedAt` | `started-at` | `number \| undefined` | `undefined` | When the work started, in epoch ms – the header's timer counts from here. Defaults to when the run started |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-progress-change` | – | No | The timeline revealed a step; detail `{ progress: number }`, how many steps show |
| `tc-done` | – | No | It finished (by the timeline or by `done`); detail `{ seconds: number }`, how long it worked |
| `tc-open-change` | – | Yes | The header was clicked, or a new run unfolded the steps; detail `{ open: boolean }`. Cancelable: preventDefault() keeps `open` as it is (controlled use) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-thinking-state-shimmer` | `light-dark(rgba(255, 255, 255, 0.82), #ffffff)` | standard, clean |

#### Design tokens it reads (53)

`--tc-accent`, `--tc-border-default`, `--tc-border-strong`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-surface-raised`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-thinking-state :steps="…">` | `<tc-thinking-state [steps]="…">` | `<tc-thinking-state {steps}>` |
| `done` | `el.done = …;` | `<… done={…} />` | `<tc-thinking-state :done="…">` | `<tc-thinking-state [done]="…">` | `<tc-thinking-state {done}>` |

*Also attributes: `done-label`, `step-ms`, `progress`, `loop`, `open`, `started-at` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-progress-change` | No | `el.addEventListener("tc-progress-change", (e) => …)` | `onProgressChange={…}` | `@tc-progress-change="…"` | `(tc-progress-change)="…($event)"` | `el.addEventListener("tc-progress-change", …)` |
| `tc-done` | No | `el.addEventListener("tc-done", (e) => …)` | `onDone={…}` | `@tc-done="…"` | `(tc-done)="…($event)"` | `el.addEventListener("tc-done", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-thinking-state id="thinking-state"></tc-thinking-state>

<script type="module">
  import "@adamstavely/trenchcoat/thinking-state";

  const el = document.querySelector("#thinking-state");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ThinkingState } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ThinkingState>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledThinkingState({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <ThinkingState {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/thinking-state";
import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";

const props = defineProps<{ initial: TcThinkingState["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcThinkingState["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-thinking-state :open="open" @tc-open-change="onOpenChange"></tc-thinking-state>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ThinkingState } from "@adamstavely/trenchcoat/angular/thinking-state";
import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";

@Component({
  selector: "app-controlled-thinking-state",
  imports: [ThinkingState],
  template: `<tc-thinking-state [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-thinking-state>`,
})
export class ControlledThinkingState {
  readonly initial = input.required<TcThinkingState["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcThinkingState["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/thinking-state";
  import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";

  let { initial }: { initial: TcThinkingState["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcThinkingState;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcThinkingState["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-thinking-state bind:this={el} {open}></tc-thinking-state>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-thinking-state")` returns a `TcThinkingState` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";`
- **React / Next.js:** Props: `import type { ThinkingStateProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ThinkingState>`. The element class, for refs: `import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcThinkingState["steps"]` with `import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";`
- **Angular:** The directive types the template: `[steps]` takes `TcThinkingState["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcThinkingState } from "@adamstavely/trenchcoat/thinking-state";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `steps` | `ThinkingStep[]` | The steps and searches to show, in order; a source's icon may be a React node |
| `onProgressChange` | `(progress: number) => void` | Reports each step the timeline reveals |
| `onDone` | `(seconds: number) => void` | Called once it's finished – by the timeline or by `done` – with the seconds it worked |
| `open` | `boolean` | Whether the steps are unfolded (controlled when defined) |
| `defaultOpen` | `boolean` | Whether the steps start unfolded when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | Called when the header is clicked, or a new run unfolds the steps, with the new state |

*Renamed or hidden on the wrapper: `steps`, `open`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the header, then each source link and “+N more” |
| Enter / Space | On the header, folds or unfolds the steps; on “+N more”, shows or hides the extra sources |
| Enter | On a source, opens it in a new tab |
| Escape | Hides the tooltip of the source under the pointer or focus |

### Screen readers

The header is a button with `aria-expanded` that controls the steps; its name is “Thinking” while it works (the
timer is hidden) and “Worked for 9s” after. The steps are an ordered list – folded, they're `inert` and skipped.
New steps aren't announced one by one; when it finishes, a status message says the done label and the time:
“Ready to answer. Worked for 9s”. Source chips with an `href` are links; their tooltips are hidden from screen
readers. “+N more” is a button with `aria-expanded`.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
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

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 34.2 KB | 8.5 KB |
| Lit · the library every element is built on, the parts it uses | 19.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **41.6 KB** | **10.7 KB** |
| With Lit – the first component on a page | 62.6 KB | 17.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 10 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of steps replaced |
| First on the page | 7.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.6 ms | steps: first render, 10 nodes; update 0.1 ms |
| 1,000 items | 1.1 ms | steps: first render, 10 nodes; update 0.1 ms |

What it renders doesn't grow with steps (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 4 React commits (clean), 5 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **4 timer callbacks/s** on screen, **4 timer callbacks/s** scrolled away, **4 timer callbacks/s** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`, `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document keydown`, `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write steps as what's happening, in the present participle or as a short noun phrase: “Comparing yearly costs”,
  “Checking available tax credits”.
- Give searches both forms: `activeLabel` “Searching ‘…’” while it runs, `label` “Searched ‘…’” after.
- Label sources with the site's domain (“energy.gov”); put the full address in `tooltip` if it matters.
- Set `doneLabel` to what comes next – “Ready to answer” – rather than the default “Finished thinking” when the
  answer follows.

## Do and don't

### Do

- Drive it from real events: set `progress` as steps arrive and `done` when the answer starts.
- Show three to six steps; fold long lists of sources into `moreSources`.
- Pass `startedAt` when the work began before the panel was shown, so the timer is honest.

### Don't

- Don't invent steps the model isn't taking – the panel should reflect real work.
- Don't leave `loop` on outside demos; it replays the same run.
- Don't keep the panel open next to the finished answer if it pushes the answer down – let people fold it.

## Related

- [Thinking Loader](thinking-loader.md) – A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step

## Changelog

- thinking-state no longer reports `onOpenChange(true)` on mount when `open` is held false; date-range-picker doesn't flash its "Last 30 days" stand-in before reading today; memory-panel with `undoFor={Infinity}` keeps a failure message instead of clearing it at once; dropzone keeps focus on a row while another row folds away (the React version lost it in real browsers).
