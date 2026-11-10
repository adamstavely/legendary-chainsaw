<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Layer Stack

**Illustrations**

Isometric stack of five layers with a list beside it – the chosen entry lifts its layer out in color; steps through twice and rests (`rounds`)

- **Element:** `<tc-layer-stack>`
- **Size:** 7.2 KB gzip · 20.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/layer-stack";` |
| React / Next.js | `import { LayerStack } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/layer-stack";` · tags starting with tc- are custom elements |
| Angular | `import { LayerStack } from "@adamstavely/trenchcoat/angular/layer-stack";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/layer-stack";` |

## Example

The live example is in the gallery at `#/illustrations/layer-stack`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An illustration for explaining a product in layers: an isometric stack of up to five layers beside a list of the
same entries. The chosen entry lifts its layer out of the stack in blue, with a soft glow underneath. It steps
through the entries on its own – twice round by default, then it rests – and people can pick an entry themselves
by clicking it or with the arrow keys. It pauses while hovered or focused, off screen, and for people who prefer
reduced motion.

### When to use

- A landing page or a feature tour describing what a product is built from: triggers, data, connections, models.
- Any short list of three to five ideas that build on each other, where one at a time should stand out.

### When not to use

- Showing data flowing from many tools into one place – use [Integration Flow](integration-flow.md).
- A list of AI models to choose from – use [Model Wheel](model-wheel.md).
- Showing several agents with roles working together – use [Agent Team](agent-team.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Stack** `.ui-lyr-stack` – the isometric layers, the chosen one lifted out in blue
2. **List** `.ui-lyr-menu` – one entry per layer, top layer first
3. **Entry** `.ui-lyr-row` – a title and a short muted hint; the chosen one is highlighted

## Usage

### HTML

```html
<tc-layer-stack id="layers" rounds="1"></tc-layer-stack>

<script type="module">
  import "@adamstavely/trenchcoat/layer-stack";
  import "@adamstavely/trenchcoat/tokens.css";

  const stack = document.querySelector("#layers");
  stack.items = [
    { title: "Triggered by events", hint: "Webhooks", icon: "bolt" },
    { title: "Grounded in your data", hint: "Context", icon: "database" },
    { title: "Connected to your apps", hint: "APIs", icon: "plug" },
  ];
  stack.addEventListener("tc-index-change", (e) => console.log(e.detail.index, e.detail.user));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { LayerStack, type LayerStackItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: LayerStackItem[] = [
  { title: "Triggered by events", hint: "Webhooks", icon: "bolt" },
  { title: "Grounded in your data", hint: "Context", icon: "database" },
  { title: "Works with any model", hint: "Routing", icon: "spark" },
];

export function HowItWorks() {
  const [layer, setLayer] = useState(0);
  return (
    <>
      <LayerStack items={items} defaultIndex={0} onIndexChange={setLayer} />
      <p>{items[layer].title}</p>
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/layer-stack";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";

defineProps<{ items: TcLayerStack["items"] }>();
const onIndexChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-layer-stack :items="items" @tc-index-change="onIndexChange"></tc-layer-stack>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { LayerStack } from "@adamstavely/trenchcoat/angular/layer-stack";
import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";

@Component({
  selector: "app-layer-stack-example",
  imports: [LayerStack],
  template: `<tc-layer-stack [items]="items()" (tc-index-change)="onIndexChange($event)"></tc-layer-stack>`,
})
export class LayerStackExample {
  readonly items = input.required<TcLayerStack["items"]>();
  onIndexChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/layer-stack";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";

  let { items }: { items: TcLayerStack["items"] } = $props();
  let el: TcLayerStack;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-layer-stack bind:this={el} {items}></tc-layer-stack>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `LayerStackItem[]` | `[ { title: "Triggered by events", hint: "Webhooks", icon: "bolt" }, { title: "Grounded in your data", hint: "Context", icon: "database" }, { title: "Connected to your apps", hint: "APIs", icon: "plug" }, { title: "Works with any model", hint: "Routing", icon: "spark" }, { title: "Traced at every step", hint: "Logs", icon: "pulse" }, ]` | Up to five entries, top layer first |
| `index` | `index` | `number` | `0` | The chosen entry |
| `interval` | `interval` | `number` | `2600` | Time per entry while it plays on its own, in ms |
| `rounds` | `rounds` | `number` | `2` | How many times it steps through all entries on its own before it rests (default 2; Infinity keeps going, 0 never steps) |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-index-change` | – | Yes | Cancelable, before the chosen entry changes; detail: LayerStackIndexChange ({ index, user }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-layer-stack-u` | `calc(100cqw / 600)` | both |
| `--tc-layer-stack-row` | `calc(52 * var(--tc-layer-stack-u))` | both |
| `--tc-layer-stack-accent` | `light-dark(#2f6bff, #6b95ff)` | both |
| `--tc-layer-stack-accent-deep` | `light-dark(#2557d9, #2f6bff)` | both |
| `--tc-layer-stack-tint` | `light-dark(#e9f0ff, #1f2c4d)` | both |
| `--tc-layer-stack-glow` | `light-dark(rgba(47, 107, 255, 0.28), rgba(47, 107, 255, 0.3))` | both |
| `--tc-layer-stack-face` | `light-dark(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.04))` | both |
| `--tc-layer-stack-edge` | `light-dark(rgba(10, 10, 10, 0.11), rgba(255, 255, 255, 0.13))` | both |
| `--tc-layer-stack-side` | `light-dark(#ececef, #26262a)` | both |
| `--tc-layer-stack-face-above` | `light-dark(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.025))` | both |
| `--tc-layer-stack-side-above` | `light-dark(rgba(236, 236, 239, 0.55), rgba(38, 38, 42, 0.5))` | both |
| `--tc-layer-stack-panel` | `light-dark(#f5f5f5, #161618)` | both |

#### Design tokens it reads (14)

`--tc-accent-text`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-weight-medium`, `--tc-shadow-raised`, `--tc-surface-overlay`, `--tc-text-muted`, `--tc-text-primary`, `--tc-tracking-snug`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-layer-stack :items="…">` | `<tc-layer-stack [items]="…">` | `<tc-layer-stack {items}>` |

*Also attributes: `index`, `interval`, `rounds` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-index-change` | Yes | `el.addEventListener("tc-index-change", (e) => …)` | `onChange={…}` | `@tc-index-change="…"` | `(tc-index-change)="…($event)"` | `el.addEventListener("tc-index-change", …)` |

### Controlled

The element changes `index` itself unless a listener calls `preventDefault()` on `tc-index-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-layer-stack id="layer-stack"></tc-layer-stack>

<script type="module">
  import "@adamstavely/trenchcoat/layer-stack";

  const el = document.querySelector("#layer-stack");
  el.addEventListener("tc-index-change", (e) => {
    e.preventDefault(); // the element keeps its index…
    if (allowed(e.detail.index)) el.index = e.detail.index; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { LayerStack } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof LayerStack>;
type Props = Omit<Own, "index" | "onChange"> & { initial: NonNullable<Own["index"]> };

// Controlled: passing index makes the wrapper prevent the element's own change; the app sets it
export function ControlledLayerStack({ initial, ...props }: Props) {
  const [index, setIndex] = useState<Own["index"]>(initial);
  return <LayerStack {...props} index={index} onChange={(next) => setIndex(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/layer-stack";
import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";

const props = defineProps<{ initial: TcLayerStack["index"] }>();
const index = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onIndexChange = (e: CustomEvent<{ index: TcLayerStack["index"] }>) => {
  e.preventDefault();
  index.value = e.detail.index;
};
</script>

<template>
  <tc-layer-stack :index="index" @tc-index-change="onIndexChange"></tc-layer-stack>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { LayerStack } from "@adamstavely/trenchcoat/angular/layer-stack";
import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";

@Component({
  selector: "app-controlled-layer-stack",
  imports: [LayerStack],
  template: `<tc-layer-stack [index]="index()" (tc-index-change)="onIndexChange($event)"></tc-layer-stack>`,
})
export class ControlledLayerStack {
  readonly initial = input.required<TcLayerStack["index"]>();
  readonly index = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onIndexChange(e: CustomEvent<{ index: TcLayerStack["index"] }>) {
    e.preventDefault();
    this.index.set(e.detail.index);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/layer-stack";
  import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";

  let { initial }: { initial: TcLayerStack["index"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let index = $derived(initial);
  let el: TcLayerStack;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      index = (e as CustomEvent<{ index: TcLayerStack["index"] }>).detail.index;
    };
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-layer-stack bind:this={el} {index}></tc-layer-stack>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-layer-stack")` returns a `TcLayerStack` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";`
- **React / Next.js:** Props: `import type { LayerStackProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof LayerStack>`. The element class, for refs: `import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLayerStack["items"]` with `import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";`
- **Angular:** The directive types the template: `[items]` takes `TcLayerStack["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLayerStack } from "@adamstavely/trenchcoat/layer-stack";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `index` | `number` | The chosen entry (controlled when defined: it doesn't step on its own then) |
| `defaultIndex` | `number` | Entry to start on when uncontrolled |
| `onIndexChange` | `(index: number) => void` | Reports every change of the chosen entry – picked by the user or stepped to on its own |
| `onChange` | `(index: number) => void` | Called when an entry is picked by the user |

*Renamed or hidden on the wrapper: `index`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the chosen entry, and on out of the list |
| ↓ / ↑ | Picks the next or previous entry, wrapping round |
| Home / End | Picks the first or last entry |
| Enter / Space | Picks the focused entry |

Once someone picks an entry, the stack stops stepping on its own.

### Screen readers

The entries are tabs in a vertical tablist labelled “Layers”, named by their title and hint, with `aria-selected` on
the chosen one. The stack drawing is hidden from assistive technology – the list carries what it shows. The tabs
have no panels: the change is visual only, so put anything people must read in the page around it.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
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
| **This piece alone** | 13.6 KB | 5.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **20.7 KB** | **7.2 KB** |
| With Lit – the first component on a page | 40.3 KB | 13.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 72 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of items replaced |
| First on the page | 9.0 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.8 ms | items: first render, 72 nodes; update 0.1 ms |
| 1,000 items | 0.7 ms | items: first render, 72 nodes; update 0.1 ms |

What it renders doesn't grow with items (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Related

- [Integration Flow](integration-flow.md) – Integration pills rotating along a dashed arc, each beaming its data into a central analysis hub – once round the integrations, then it rests
- [Model Wheel](model-wheel.md) – AI model names on a turning drum – the rows bend away at the edges and each model lands on a soft gray fill; turns once round the drum and rests (`turns`)
- [Agent Team](agent-team.md) – A prompt types itself and branches out into three agents, each with a role and overlapping tool logos – three times, then the team stays
