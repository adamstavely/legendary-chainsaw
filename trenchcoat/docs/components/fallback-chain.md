<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Fallback Chain

**Agents** · New

One request finding a model that answers, as a small flow – each model in fallback order, waiting, trying, failed, answered or skipped, with reasons and timings

- **Element:** `<tc-fallback-chain>`
- **Size:** 7.0 KB gzip · 21.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/fallback-chain";` |
| React / Next.js | `import { FallbackChain } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/fallback-chain";` · tags starting with tc- are custom elements |
| Angular | `import { FallbackChain } from "@adamstavely/trenchcoat/angular/fallback-chain";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/fallback-chain";` |

## Example

The live example is in the gallery at `#/fallback-chain`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One request finding a model that answers, as a small flow: the request, then each model in fallback order, waiting, trying, failed, answered or skipped. A line says how it went, and picking a model shows its reason and how long it took.

### When to use

- Showing why a particular model answered.
- Debugging a request that was slow or failed.

### When not to use

- Configuring routes and fallbacks – use [Model Routing](model-routing.md).
- Every step of an agent run – use [Trace Waterfall](trace-waterfall.md).
- Trying several models on purpose and comparing them – use [Parallel Attempts](parallel-attempts.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Request** `.ui-fbc__request` – what was asked
2. **Link** `.ui-fbc__link` – the connector, with a light on the way to the model being tried
3. **Model** `.ui-fbc__model` – its name, `.ui-fbc__provider` and `.ui-fbc__state`
4. **Summary** `.ui-fbc__summary` – how it went
5. **Detail** `.ui-fbc__detail` – `.ui-fbc__reason` and `.ui-fbc__took`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. The flow runs across on a wide page and down on a narrow one.

## Usage

### HTML

```html
<tc-fallback-chain id="chain" request="Summarise the report"></tc-fallback-chain>

<script type="module">
  import "@adamstavely/trenchcoat/fallback-chain";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#chain").attempts = [
    { id: "a", model: "Model A", state: "failed", reason: "Timed out" },
    { id: "b", model: "Model B", state: "answered", latencyMs: 1200 },
  ];
</script>
```

### React / Next.js

```tsx
import { FallbackChain, type FallbackAttempt } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const attempts: FallbackAttempt[] = [
  { id: "a", model: "Model A", state: "failed", reason: "Timed out" },
  { id: "b", model: "Model B", state: "answered", latencyMs: 1200 },
];

export function Chain() {
  return <FallbackChain request="Summarise the report" attempts={attempts} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/fallback-chain";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";

defineProps<{ attempts: TcFallbackChain["attempts"]; labels: TcFallbackChain["labels"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-fallback-chain :attempts="attempts" :labels="labels" @tc-selected-change="onSelectedChange"></tc-fallback-chain>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FallbackChain } from "@adamstavely/trenchcoat/angular/fallback-chain";
import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";

@Component({
  selector: "app-fallback-chain-example",
  imports: [FallbackChain],
  template: `<tc-fallback-chain [attempts]="attempts()" [labels]="labels()" (tc-selected-change)="onSelectedChange($event)"></tc-fallback-chain>`,
})
export class FallbackChainExample {
  readonly attempts = input.required<TcFallbackChain["attempts"]>();
  readonly labels = input.required<TcFallbackChain["labels"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/fallback-chain";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";

  let { attempts, labels }: { attempts: TcFallbackChain["attempts"]; labels: TcFallbackChain["labels"] } = $props();
  let el: TcFallbackChain;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-fallback-chain bind:this={el} {attempts} {labels}></tc-fallback-chain>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Fallback chain"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `request` | `request` | `string` | `""` | What was asked, in a few words |
| `attempts` | – | `FallbackAttempt[]` | `[]` | Each model, in fallback order |
| `selected` | `selected` | `string \| null` | `null` | The open model's id. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for durations |
| `labels` | – | `Partial<FallbackChainLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A model was opened or closed ({ selected, attempt }: FallbackSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-fbc-bg` | `var(--tc-surface-on-tray)` | both, standard |
| `--tc-fbc-link` | `var(--tc-space-4)` | both |
| `--tc-fbc-beat` | `var(--tc-duration-reveal)` | both |

#### Design tokens it reads (36)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-radius-md`, `--tc-duration-reveal`, `--tc-ease-move`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-meter-fill`, `--tc-meter-track`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `attempts` | `el.attempts = …;` | `<… attempts={…} />` | `<tc-fallback-chain :attempts="…">` | `<tc-fallback-chain [attempts]="…">` | `<tc-fallback-chain {attempts}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-fallback-chain :labels="…">` | `<tc-fallback-chain [labels]="…">` | `<tc-fallback-chain {labels}>` |

*Also attributes: `heading`, `description`, `request`, `selected`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-fallback-chain id="fallback-chain"></tc-fallback-chain>

<script type="module">
  import "@adamstavely/trenchcoat/fallback-chain";

  const el = document.querySelector("#fallback-chain");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { FallbackChain } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof FallbackChain>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledFallbackChain({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <FallbackChain {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/fallback-chain";
import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";

const props = defineProps<{ initial: TcFallbackChain["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcFallbackChain["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-fallback-chain :selected="selected" @tc-selected-change="onSelectedChange"></tc-fallback-chain>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FallbackChain } from "@adamstavely/trenchcoat/angular/fallback-chain";
import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";

@Component({
  selector: "app-controlled-fallback-chain",
  imports: [FallbackChain],
  template: `<tc-fallback-chain [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-fallback-chain>`,
})
export class ControlledFallbackChain {
  readonly initial = input.required<TcFallbackChain["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcFallbackChain["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/fallback-chain";
  import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";

  let { initial }: { initial: TcFallbackChain["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcFallbackChain;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcFallbackChain["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-fallback-chain bind:this={el} {selected}></tc-fallback-chain>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-fallback-chain")` returns a `TcFallbackChain` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";`
- **React / Next.js:** Props: `import type { FallbackChainProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FallbackChain>`. The element class, for refs: `import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFallbackChain["attempts"]` with `import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";`
- **Angular:** The directive types the template: `[attempts]` takes `TcFallbackChain["attempts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFallbackChain } from "@adamstavely/trenchcoat/fallback-chain";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Fallback chain" |
| `selected` | `string \| null` | The open model's id – controlled when given |
| `defaultSelected` | `string \| null` | The open model on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, attempt: FallbackAttempt \| null) => void` | A model was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move between models |
| Home / End | Go to the first or last model |
| Enter / Space | Opens or closes a model |
| Escape | Closes it |

### Screen readers

The models are a `listbox` named as being in fallback order, with one tab stop. Each state is a word, with a mark. The summary is `role="status"`, so progress is announced as the states change.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.4 KB | 4.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **21.9 KB** | **7.0 KB** |
| With Lit – the first component on a page | 43.7 KB | 14.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 49 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of attempts replaced |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | attempts: first render, 825 nodes; update 1.1 ms |
| 1,000 items | 40 ms | attempts: first render, 8,025 nodes; update 3.8 ms |

1,000 items of attempts: 40 ms, 8,025 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

Write `reason` as what happened: "Timed out after 8 seconds", not an error code. Give `latencyMs` for anything that was tried. Tries count models that failed, answered or are being tried, not skipped ones.

## Do and don't

### Do

- Update `attempts` as the request progresses, and the flow and summary follow.
- Set a reason on skipped models, so nobody wonders why they weren't tried.

### Don't

- Don't expose private routing details here if the people using it shouldn't see them.

## Related

- [Model Routing](model-routing.md) – Routing rules as a route with a fallback chain, target health, breakers and residency, and a route test that lights up the path taken
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Parallel Attempts](parallel-attempts.md) – An agent tries the same task several ways at once and the best one wins – every attempt races as a row with its model, approach and live bar, then gets a score; the best is marked and picked, and you can switch to another
- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price

## Changelog

- **Conflict Radar** (`tc-conflict-radar`), **Scheduled Runs** (`tc-scheduled-runs`), **Fallback Chain** (`tc-fallback-chain`), **Agent Handoff** (`tc-agent-handoff`), **Agent Findings** (`tc-agent-findings`) and **Agent Monitor** (`tc-agent-monitor`): where parallel agents collide, tasks across a week's sessions, one request finding a model, what's lost between agents, what a group of agents found, and one agent at work.
