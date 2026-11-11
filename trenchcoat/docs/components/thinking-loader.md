<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Thinking Loader

**AI & chat** · Also in React

A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check

- **Element:** `<tc-thinking-loader>`
- **Size:** 7.1 KB gzip · 22.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/thinking-loader";` |
| React / Next.js | `import { ThinkingLoader } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/thinking-loader";` · tags starting with tc- are custom elements |
| Angular | `import { ThinkingLoader } from "@adamstavely/trenchcoat/angular/thinking-loader";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/thinking-loader";` |

## Example

The live example is in the gallery at `#/thinking-loader`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A small pill that says the model is working on a reply. An eight-ray spinner turns while the label, with a light
sweeping over it, walks through phases – Thinking, Searching the web, Reading sources – and the pill glides to each
new width. When the work is done, the spinner turns into a check and the label settles on how long it took
(“Thought for 6s”). It tells people something is happening, and roughly what, without taking room from the
conversation.

### When to use

- The gap between sending a message and the first words of the answer.
- Inside a chat bubble or a card, where a full panel would be too much – use `variant="plain"` there.
- Driving the phases from your stream's events, so the label says what the model is really doing.

### When not to use

- Showing the sources searched and the reasoning steps as they happen – use [Thinking State](thinking-state.md).
- The answer itself, with its sources and actions – use [AI Answer](ai-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Spinner** `.ui-tl__spinner` – eight rays turning while the model works
2. **Check** `.ui-tl__check` – takes the spinner's place once done
3. **Label** `.ui-tl__text` – the current phase with a light sweeping over it, then the done label

## Looks

Standard is a rounded capsule with a hairline border and a muted label. Clean is a white chip with a hairline
shadow, a slightly heavier label and a thin accent spinner. In both, `variant="plain"` drops the chip and keeps the
spinner and the label, and `size="sm"` makes everything smaller.

## Usage

### HTML

```html
<tc-thinking-loader id="loader" interval="1400"></tc-thinking-loader>

<script type="module">
  import "@adamstavely/trenchcoat/thinking-loader";
  import "@adamstavely/trenchcoat/tokens.css";

  const loader = document.querySelector("#loader");
  loader.phases = ["Thinking", "Searching the web", "Writing response"];
  loader.doneLabel = (s) => `Thought for ${s}s`;
  loader.addEventListener("tc-phase-change", (e) => console.log(e.detail.phase));
  // Later, when the answer starts streaming:
  setTimeout(() => (loader.done = true), 4200);
</script>
```

### React / Next.js

```tsx
import { ThinkingLoader } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Working({ phase, done }: { phase: number; done: boolean }) {
  return <ThinkingLoader phases={["Thinking", "Searching the web", "Writing response"]} phase={phase} done={done} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/thinking-loader";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";

defineProps<{ phases: TcThinkingLoader["phases"]; doneLabel: TcThinkingLoader["doneLabel"] }>();
const onPhaseChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-thinking-loader :phases="phases" :doneLabel="doneLabel" @tc-phase-change="onPhaseChange"></tc-thinking-loader>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ThinkingLoader } from "@adamstavely/trenchcoat/angular/thinking-loader";
import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";

@Component({
  selector: "app-thinking-loader-example",
  imports: [ThinkingLoader],
  template: `<tc-thinking-loader [phases]="phases()" [doneLabel]="doneLabel()" (tc-phase-change)="onPhaseChange($event)"></tc-thinking-loader>`,
})
export class ThinkingLoaderExample {
  readonly phases = input.required<TcThinkingLoader["phases"]>();
  readonly doneLabel = input.required<TcThinkingLoader["doneLabel"]>();
  onPhaseChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/thinking-loader";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";

  let { phases, doneLabel }: { phases: TcThinkingLoader["phases"]; doneLabel: TcThinkingLoader["doneLabel"] } = $props();
  let el: TcThinkingLoader;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-phase-change", on);
    return () => el.removeEventListener("tc-phase-change", on);
  });
</script>

<tc-thinking-loader bind:this={el} {phases} {doneLabel}></tc-thinking-loader>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `phases` | – | `string[]` | `["Thinking", "Searching the web", "Reading sources", "Writing response"]` | Labels to walk through, one after another |
| `interval` | `interval` | `number` | `2200` | Time per phase, in ms |
| `phase` | `phase` | `number` | `0` | The phase shown. The timer moves it on unless a tc-phase-change listener calls preventDefault() |
| `manual` | `manual` | `boolean` | `false` | The phase is set from outside (e.g. from stream events): no timer |
| `startedAt` | `startedAt` | `number \| undefined` | `undefined` | When the work started, in epoch ms – the done label counts from here. Defaults to when the loader connected (or work restarted) |
| `loop` | `loop` | `boolean` | `false` | Start over after the last phase instead of holding it – at most twice, then it holds the last phase (WCAG 2.2.2) |
| `done` | `done` | `boolean` | `false` | Finished: the spinner turns into a check and the label into doneLabel |
| `doneLabel` | – | `string \| ((seconds: number) => string)` | – | Label once done – a string, or a function that gets the seconds since the loader started |
| `size` | `size` | `"sm" \| "md"` | `"md"` | "md" is the default pill; "sm" is smaller, e.g. inside a chat bubble |
| `variant` | `variant` | `"pill" \| "plain"` | `"pill"` | "pill" = bordered capsule, "plain" = just the spinner and the label, e.g. inside a chat bubble |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-phase-change` | – | Yes | The timer moved to another phase (detail: { phase: number }); cancelable – the phase stays if a listener calls preventDefault() |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-thinking-loader-shimmer` | `light-dark(rgba(255, 255, 255, 0.82), #ffffff)` | standard, clean |
| `--tc-thinking-loader-h` | `32px` | standard, clean |
| `--tc-thinking-loader-font` | `var(--tc-font-size-md)` | standard, clean |
| `--tc-thinking-loader-lh` | `var(--tc-line-height-normal)` | standard, clean |
| `--tc-thinking-loader-icon` | `16px` | standard, clean |

#### Design tokens it reads (36)

`--tc-accent`, `--tc-border-default`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`

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
| `phases` | `el.phases = …;` | `<… phases={…} />` | `<tc-thinking-loader :phases="…">` | `<tc-thinking-loader [phases]="…">` | `<tc-thinking-loader {phases}>` |
| `doneLabel` | `el.doneLabel = …;` | `<… doneLabel={…} />` | `<tc-thinking-loader :doneLabel="…">` | `<tc-thinking-loader [doneLabel]="…">` | `<tc-thinking-loader {doneLabel}>` |

*Also attributes: `interval`, `phase`, `manual`, `startedAt`, `loop`, `done`, `size`, `variant` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-phase-change` | Yes | `el.addEventListener("tc-phase-change", (e) => …)` | `onPhaseChange={…}` | `@tc-phase-change="…"` | `(tc-phase-change)="…($event)"` | `el.addEventListener("tc-phase-change", …)` |

### Controlled

The element changes `phase` itself unless a listener calls `preventDefault()` on `tc-phase-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-thinking-loader id="thinking-loader"></tc-thinking-loader>

<script type="module">
  import "@adamstavely/trenchcoat/thinking-loader";

  const el = document.querySelector("#thinking-loader");
  el.addEventListener("tc-phase-change", (e) => {
    e.preventDefault(); // the element keeps its phase…
    if (allowed(e.detail.phase)) el.phase = e.detail.phase; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ThinkingLoader } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ThinkingLoader>;
type Props = Omit<Own, "phase" | "onPhaseChange"> & { initial: NonNullable<Own["phase"]> };

// Controlled: passing phase makes the wrapper prevent the element's own change; the app sets it
export function ControlledThinkingLoader({ initial, ...props }: Props) {
  const [phase, setPhase] = useState<Own["phase"]>(initial);
  return <ThinkingLoader {...props} phase={phase} onPhaseChange={(next) => setPhase(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/thinking-loader";
import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";

const props = defineProps<{ initial: TcThinkingLoader["phase"] }>();
const phase = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPhaseChange = (e: CustomEvent<{ phase: TcThinkingLoader["phase"] }>) => {
  e.preventDefault();
  phase.value = e.detail.phase;
};
</script>

<template>
  <tc-thinking-loader :phase="phase" @tc-phase-change="onPhaseChange"></tc-thinking-loader>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ThinkingLoader } from "@adamstavely/trenchcoat/angular/thinking-loader";
import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";

@Component({
  selector: "app-controlled-thinking-loader",
  imports: [ThinkingLoader],
  template: `<tc-thinking-loader [phase]="phase()" (tc-phase-change)="onPhaseChange($event)"></tc-thinking-loader>`,
})
export class ControlledThinkingLoader {
  readonly initial = input.required<TcThinkingLoader["phase"]>();
  readonly phase = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPhaseChange(e: CustomEvent<{ phase: TcThinkingLoader["phase"] }>) {
    e.preventDefault();
    this.phase.set(e.detail.phase);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/thinking-loader";
  import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";

  let { initial }: { initial: TcThinkingLoader["phase"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let phase = $derived(initial);
  let el: TcThinkingLoader;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      phase = (e as CustomEvent<{ phase: TcThinkingLoader["phase"] }>).detail.phase;
    };
    el.addEventListener("tc-phase-change", on);
    return () => el.removeEventListener("tc-phase-change", on);
  });
</script>

<tc-thinking-loader bind:this={el} {phase}></tc-thinking-loader>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-thinking-loader")` returns a `TcThinkingLoader` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";`
- **React / Next.js:** Props: `import type { ThinkingLoaderProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ThinkingLoader>`. The element class, for refs: `import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcThinkingLoader["phases"]` with `import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";`
- **Angular:** The directive types the template: `[phases]` takes `TcThinkingLoader["phases"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcThinkingLoader } from "@adamstavely/trenchcoat/thinking-loader";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `phase` | `number` | Show a specific phase instead of advancing on a timer – e.g. from your stream events (controlled when defined) |
| `defaultPhase` | `number` | The phase to start from when uncontrolled; the timer moves on from there |
| `onPhaseChange` | `(phase: number) => void` | Reports each phase the timer moves to |

*Renamed or hidden on the wrapper: `phase`, `manual`*

## Accessibility

### Keyboard

Nothing to operate – the loader only reports.

### Screen readers

The element is a polite status region (`role="status"`, unless the page sets its own role). It announces the first
phase (“Thinking”) and then the done label (“Thought for 6s”) – not every phase on the way, so screen reader users
aren't interrupted every couple of seconds. The spinner and the moving labels are hidden from assistive technology.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 15.2 KB | 5.0 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **22.3 KB** | **7.1 KB** |
| With Lit – the first component on a page | 42.6 KB | 13.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 17 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of phases replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.7 ms | phases: first render, 17 nodes; update 0.1 ms |
| 1,000 items | 0.6 ms | phases: first render, 17 nodes; update 0.0 ms |

What it renders doesn't grow with phases (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 5 React commits (clean), 5 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write phases as short present-tense activities, sentence case, no full stop: “Searching the web”, “Reading 12
  sources”.
- Keep each phase under about four words – the pill grows to fit.
- Use the done label for what happened and how long it took: “Thought for 6s”, “Searched 12 sources”.
- Name only phases the model really goes through; set `phase` from the stream instead of a timer when you can.

## Do and don't

### Do

- Set `done` as soon as the first part of the answer arrives.
- Pass `startedAt` when the work started before the loader appeared, so the done label counts the real time.
- Keep `loop` off unless the work can run long; even then it starts over at most twice and holds the last phase.

### Don't

- Don't show it next to a streaming answer that is already visible – the text is the progress.
- Don't put more than one loader on screen for the same piece of work.
- Don't use it for long jobs with steps people need to follow; show the steps.

## Related

- [Thinking State](thinking-state.md) – AI working panel with a live timer, searched sources and thinking steps that appear one by one
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
