<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Cover Flow

**Illustrations**

Browse covers in 3D – drag, flick or scrub the row, it springs to the nearest cover; images drift in their frames over a soft reflection

- **Element:** `<tc-cover-flow>`
- **Size:** 10.1 KB gzip · 30.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/cover-flow";` |
| React / Next.js | `import { CoverFlow } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/cover-flow";` · tags starting with tc- are custom elements |
| Angular | `import { CoverFlow } from "@adamstavely/trenchcoat/angular/cover-flow";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/cover-flow";` |

## Example

The live example is in the gallery at `#/illustrations/cover-flow`, at 320 px, 480 px or full width.

## Overview

A row of covers to browse in 3D. The cover in front faces you; the others turn away and stack up on both sides over
a soft reflection, and their images drift a little in their frames as they move. People drag, flick, scrub with a
trackpad, use the arrow keys or click a cover, and a spring carries the row along and settles on the nearest one.
The caption below rolls to the new title, with previous and next buttons beside it and a tick per cover under it.

### When to use

- Browsing a small, visual collection where the artwork is the point: albums, books, templates, themes.
- A showcase on a landing page that people can play with.
- Picking one item to open, with `selectable` – a click or Enter on the front cover fires `tc-select`.

### When not to use

- Comparing many images at once, or acting on several – use [Image Grid](../components/image-grid.md).
- Choosing between names rather than pictures – use [Model Wheel](model-wheel.md).
- A single card that reacts to the pointer – use [Tilt Card](../motion/tilt-card.md).
- Layers or stages of a product explained one at a time – use [Layer Stack](layer-stack.md).

## Usage

### HTML

```html
<tc-cover-flow id="albums" label="Albums" item-width="180" item-height="270" selectable></tc-cover-flow>

<script type="module">
  import "@adamstavely/trenchcoat/cover-flow";
  import "@adamstavely/trenchcoat/tokens.css";

  const flow = document.querySelector("#albums");
  flow.items = [
    { id: 1, title: "Northern Lights", subtitle: "Aurora Bay", image: "/covers/northern.jpg", alt: "Teal waves" },
    { id: 2, title: "Late Bloom", subtitle: "The Gardeners", image: "/covers/bloom.jpg", alt: "A pink circle" },
    { id: 3, title: "Static Hearts", subtitle: "Night Signal", image: "/covers/static.jpg", alt: "Violet bars" },
  ];
  flow.addEventListener("tc-select", (e) => console.log(e.detail.item.title));
</script>
```

### React / Next.js

```tsx
import { CoverFlow, type CoverFlowItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const albums: CoverFlowItem[] = [
  { id: 1, title: "Northern Lights", subtitle: "Aurora Bay", image: "/covers/northern.jpg", alt: "Teal waves" },
  { id: 2, title: "Late Bloom", subtitle: "The Gardeners", image: "/covers/bloom.jpg", alt: "A pink circle" },
  { id: 3, title: "Static Hearts", subtitle: "Night Signal", image: "/covers/static.jpg", alt: "Violet bars" },
];

export function Albums() {
  return <CoverFlow items={albums} itemWidth={180} itemHeight={270} aria-label="Albums" onSelect={(item) => console.log(item.title)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/cover-flow";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";

defineProps<{ items: TcCoverFlow["items"]; renderCaption: TcCoverFlow["renderCaption"] }>();
const onIndexChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-cover-flow :items="items" :renderCaption="renderCaption" @tc-index-change="onIndexChange"></tc-cover-flow>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CoverFlow } from "@adamstavely/trenchcoat/angular/cover-flow";
import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";

@Component({
  selector: "app-cover-flow-example",
  imports: [CoverFlow],
  template: `<tc-cover-flow [items]="items()" [renderCaption]="renderCaption()" (tc-index-change)="onIndexChange($event)"></tc-cover-flow>`,
})
export class CoverFlowExample {
  readonly items = input.required<TcCoverFlow["items"]>();
  readonly renderCaption = input.required<TcCoverFlow["renderCaption"]>();
  onIndexChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cover-flow";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";

  let { items, renderCaption }: { items: TcCoverFlow["items"]; renderCaption: TcCoverFlow["renderCaption"] } = $props();
  let el: TcCoverFlow;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-cover-flow bind:this={el} {items} {renderCaption}></tc-cover-flow>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `CoverFlowItem[]` | `[]` | The covers, in order: an image or your own content each, with a title and subtitle for the caption |
| `index` | `index` | `number \| undefined` | `undefined` | The front cover; unset starts on the middle one |
| `itemWidth` | `item-width` | `number` | `280` | Cover size in px – scales down on narrow containers |
| `itemHeight` | `item-height` | `number` | `280` | Cover height in px – scales down with the width |
| `angle` | `angle` | `number` | `50` | How far the side covers turn away, in degrees |
| `reflection` | `reflection` | `boolean` | `true` | Mirror the covers on the floor |
| `caption` | `caption` | `boolean` | `true` | Title and subtitle of the front cover |
| `renderCaption` | – | `((item: CoverFlowItem, index: number) => Node \| string \| null \| undefined) \| undefined` | `undefined` | Replaces the default caption: returns a node (cloned) or text |
| `controls` | `controls` | `boolean` | `true` | Previous / next buttons next to the caption |
| `ticks` | `ticks` | `boolean` | `true` | A row of small position ticks under the caption |
| `sound` | `sound` | `boolean` | `false` | A soft click each time a new cover reaches the front |
| `selectable` | `selectable` | `boolean` | `false` | A click or Enter on the cover in front fires tc-select |
| `label` | `label` | `string` | `"Cover flow"` | Names the carousel region |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-index-change` | – | Yes | Cancelable, when a drag, flick, key or click asks for a cover; detail: CoverFlowIndexChange ({ index }) |
| `tc-front-change` | – | No | Each time a new cover reaches the front while the row moves; detail: CoverFlowIndexChange ({ index }) |
| `tc-select` | – | No | A click (or Enter) on the cover in front, when `selectable`; detail: CoverFlowSelect ({ item, index }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cover-flow-card` | `light-dark(#f1f1f1, #1d1d20)` | both |
| `--tc-cover-flow-dim` | `light-dark(rgba(255, 255, 255, 0.24), rgba(0, 0, 0, 0.5))` | both |
| `--tc-cover-flow-shadow` | `0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.3)), 0 10px 20px -12px light-dark(rgba(0, 0, 0, 0.18), transparent), 0 12px 24px -14px light-dark(transparent, rgba(0, 0, 0, 0.6))` | both |
| `--tc-cover-flow-reflect-mask` | `light-dark(rgba(0, 0, 0, var(--tc-cover-flow-reflect, 0.22)), rgba(0, 0, 0, var(--tc-cover-flow-reflect, 0.3)))` | both |
| `--tc-cover-flow-ground` | `light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.45))` | both |
| `--tc-cover-flow-edge` | `light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1))` | both |
| `--tc-cover-flow-tick` | `light-dark(rgba(0, 0, 0, 0.16), rgba(255, 255, 255, 0.2))` | both |
| `--tc-cover-flow-reflect` | `0.22` | not set – this fallback applies |
| `--tc-cover-flow-d` | `0` | not set – this fallback applies |
| `--tc-cover-flow-t` | `0` | not set – this fallback applies |

#### Design tokens it reads (30)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-cover-flow-h`, `--tc-cover-flow-w`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-weight-semibold`, `--tc-radius-full`, `--tc-radius-xl`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-5`, `--tc-text-muted`, `--tc-text-primary`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-cover-flow :items="…">` | `<tc-cover-flow [items]="…">` | `<tc-cover-flow {items}>` |
| `renderCaption` | `el.renderCaption = …;` | `<… renderCaption={…} />` | `<tc-cover-flow :renderCaption="…">` | `<tc-cover-flow [renderCaption]="…">` | `<tc-cover-flow {renderCaption}>` |

*Also attributes: `index`, `item-width`, `item-height`, `angle`, `reflection`, `caption`, `controls`, `ticks` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-index-change` | Yes | `el.addEventListener("tc-index-change", (e) => …)` | `onIndexChange={…}` | `@tc-index-change="…"` | `(tc-index-change)="…($event)"` | `el.addEventListener("tc-index-change", …)` |
| `tc-front-change` | No | `el.addEventListener("tc-front-change", (e) => …)` | `onIndexChange={…}` | `@tc-front-change="…"` | `(tc-front-change)="…($event)"` | `el.addEventListener("tc-front-change", …)` |
| `tc-select` | No | `el.addEventListener("tc-select", (e) => …)` | `onSelect={…}` | `@tc-select="…"` | `(tc-select)="…($event)"` | `el.addEventListener("tc-select", …)` |

### Controlled

The element changes `index` itself unless a listener calls `preventDefault()` on `tc-index-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-cover-flow id="cover-flow"></tc-cover-flow>

<script type="module">
  import "@adamstavely/trenchcoat/cover-flow";

  const el = document.querySelector("#cover-flow");
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
import { CoverFlow } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof CoverFlow>;
type Props = Omit<Own, "index" | "onIndexChange"> & { initial: NonNullable<Own["index"]> };

// Controlled: passing index makes the wrapper prevent the element's own change; the app sets it
export function ControlledCoverFlow({ initial, ...props }: Props) {
  const [index, setIndex] = useState<Own["index"]>(initial);
  return <CoverFlow {...props} index={index} onIndexChange={(next) => setIndex(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/cover-flow";
import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";

const props = defineProps<{ initial: TcCoverFlow["index"] }>();
const index = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onIndexChange = (e: CustomEvent<{ index: TcCoverFlow["index"] }>) => {
  e.preventDefault();
  index.value = e.detail.index;
};
</script>

<template>
  <tc-cover-flow :index="index" @tc-index-change="onIndexChange"></tc-cover-flow>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CoverFlow } from "@adamstavely/trenchcoat/angular/cover-flow";
import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";

@Component({
  selector: "app-controlled-cover-flow",
  imports: [CoverFlow],
  template: `<tc-cover-flow [index]="index()" (tc-index-change)="onIndexChange($event)"></tc-cover-flow>`,
})
export class ControlledCoverFlow {
  readonly initial = input.required<TcCoverFlow["index"]>();
  readonly index = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onIndexChange(e: CustomEvent<{ index: TcCoverFlow["index"] }>) {
    e.preventDefault();
    this.index.set(e.detail.index);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cover-flow";
  import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";

  let { initial }: { initial: TcCoverFlow["index"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let index = $derived(initial);
  let el: TcCoverFlow;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      index = (e as CustomEvent<{ index: TcCoverFlow["index"] }>).detail.index;
    };
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-cover-flow bind:this={el} {index}></tc-cover-flow>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-cover-flow")` returns a `TcCoverFlow` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";`
- **React / Next.js:** Props: `import type { CoverFlowProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CoverFlow>`. The element class, for refs: `import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCoverFlow["items"]` with `import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";`
- **Angular:** The directive types the template: `[items]` takes `TcCoverFlow["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCoverFlow } from "@adamstavely/trenchcoat/cover-flow";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `CoverFlowItem[]` | The covers, in order: an image or your own content each, with a title and subtitle for the caption |
| `index` | `number` | Controlled front cover – changes are asked for through onIndexChange |
| `defaultIndex` | `number` | Starting cover when uncontrolled – defaults to the middle one |
| `onIndexChange` | `(index: number) => void` | Uncontrolled: called as each new cover reaches the front. Controlled: called with the cover a gesture settles on |
| `onSelect` | `(item: CoverFlowItem, index: number) => void` | Clicking (or pressing Enter on) the cover in front |
| `renderCaption` | `(item: CoverFlowItem, index: number) => React.ReactNode` | Replaces the default caption (title and subtitle) |
| `"aria-label"` | `string` | Names the carousel region |

*Renamed or hidden on the wrapper: `items`, `index`, `label`, `selectable`, `renderCaption`, `onSelect`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| ← / → | Brings the previous or next cover to the front |
| Home / End | Brings the first or last cover to the front |
| Enter / Space | With `selectable`: fires `tc-select` for the cover in front |
| Tab | Moves between the carousel, Previous and Next |

### Screen readers

The row is a focusable region with `aria-roledescription="carousel"`, named by `label` (“Cover flow” by default).
Each cover is a slide named “3 of 7: Static Hearts”; only the front one is exposed, and the reflection is hidden.
When the row comes to rest, a polite status region says where – “3 of 7: Static Hearts, Night Signal”. Previous and
Next are `aria-disabled` at the ends, so focus stays on them; the ticks are named “Show Static Hearts” and are for
the pointer only. Reduced motion jumps straight to the chosen cover.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
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
| **This piece alone** | 23.6 KB | 8.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.7 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **30.8 KB** | **10.1 KB** |
| With Lit – the first component on a page | 52.7 KB | 17.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 86 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of items replaced |
| First on the page | 6.4 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.8 ms | items: first render, 1,016 nodes; update 0.9 ms |
| 1,000 items | 68 ms | items: first render, 10,016 nodes; update 8.1 ms |

1,000 items of items: 68 ms. It renders every item, so a first render passes 50 ms (a long task) at about 740 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give every item a `title` – it's the caption and part of each slide's name – and an `alt` for its image.
- Use `subtitle` for the one thing that tells covers apart after the title: an artist, an author, a price.
- Keep it to a few dozen covers; people browse a cover flow, they don't search it.

## Related

- [Image Grid](../components/image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Model Wheel](model-wheel.md) – AI model names on a turning drum – the rows bend away at the edges and each model lands on a soft gray fill; turns once round the drum and rests (`turns`)
- [Tilt Card](../motion/tilt-card.md) – A card that tilts in 3D towards the pointer, with a soft glare that follows it and a smooth spring back
- [Layer Stack](layer-stack.md) – Isometric stack of five layers with a list beside it – the chosen entry lifts its layer out in color; steps through twice and rests (`rounds`)
