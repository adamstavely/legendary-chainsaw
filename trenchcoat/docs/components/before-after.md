<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Before After

**AI & chat** · New

An original and its edit in one frame with a divider to drag between them – labelled sides, arrow keys on the divider, vertical stacking, and a switch to side by side

- **Element:** `<tc-before-after>`
- **Size:** 7.6 KB gzip · 22.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/before-after";` |
| React / Next.js | `import { BeforeAfter } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/before-after";` · tags starting with tc- are custom elements |
| Angular | `import { BeforeAfter } from "@adamstavely/trenchcoat/angular/before-after";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/before-after";` |

## Example

The live example is in the gallery at `#/before-after`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An original and its edit in one frame, with a divider to drag between them: the original on one side of the line,
the edit on the other. It's for checking what an AI edit changed – a retouched photo, a cleaned-up chart, an upscale,
a removed background. Drag the divider, or press anywhere in the frame and drag; focus it and the arrow keys move it.
Each side is labelled where there's room. Side by side puts the two in labelled columns instead, and
`orientation="vertical"` stacks them – the original above, the edit below.

### When to use

- Reviewing an image edit before accepting it, where the difference is in the detail.
- Showing the effect of a filter, a cleanup or an upscale on the same image.
- Comparing two renders of the same layout.

### When not to use

- Picking one of several generated images – use [Image Grid](image-grid.md).
- Showing an image while it's being generated – use [Image Generation](image-generation.md).
- Showing what a vision model read on an image – use [Region Overlay](region-overlay.md).
- Comparing two versions of text – use [Inline Diff](inline-diff.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Frame** `.ui-bfa__frame` – the original, with the edit on top of it clipped to its side of the divider
2. **Divider** `.ui-bfa__line` – the line between the two
3. **Handle** `.ui-bfa__handle` – the round grip on the line; the slider people focus
4. **Labels** `.ui-bfa__label` – “Before” and “After” (or the images' own labels) in the corners, hidden when there's no room
5. **Side by side** `.ui-bfa__mode` – the header's switch to two columns
6. **Columns** `.ui-bfa__pair` – the two images side by side, each with its caption

## Looks

Standard puts the header on the gray tray above a white card holding the frame. Clean is one white card with the
header as its first row. `--tc-before-after-handle` sets the handle's size; it grows on touch screens.

## Usage

### HTML

```html
<tc-before-after id="cleanup" heading="Chart cleanup" position="40"></tc-before-after>

<script type="module">
  import "@adamstavely/trenchcoat/before-after";
  import "@adamstavely/trenchcoat/tokens.css";

  const image = (fill) =>
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="${fill}"/></svg>`);
  const compare = document.querySelector("#cleanup");
  compare.beforeImage = { src: image("#e9e4d8"), alt: "The original chart", label: "Original" };
  compare.afterImage = { src: image("#dfe7f3"), alt: "The cleaned-up chart", label: "AI edit" };
  compare.addEventListener("tc-position-change", (e) => console.log(e.detail.position));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { BeforeAfter, type BeforeAfterImage } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function EditReview({ before, after }: { before: BeforeAfterImage; after: BeforeAfterImage }) {
  const [position, setPosition] = useState(50);
  return <BeforeAfter title="Photo retouch" description="Asked: “Remove the glare”" beforeImage={before} afterImage={after} position={position} onPositionChange={setPosition} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/before-after";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";

defineProps<{ beforeImage: TcBeforeAfter["beforeImage"]; afterImage: TcBeforeAfter["afterImage"] }>();
const onPositionChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-before-after :beforeImage="beforeImage" :afterImage="afterImage" @tc-position-change="onPositionChange"></tc-before-after>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BeforeAfter } from "@adamstavely/trenchcoat/angular/before-after";
import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";

@Component({
  selector: "app-before-after-example",
  imports: [BeforeAfter],
  template: `<tc-before-after [beforeImage]="beforeImage()" [afterImage]="afterImage()" (tc-position-change)="onPositionChange($event)"></tc-before-after>`,
})
export class BeforeAfterExample {
  readonly beforeImage = input.required<TcBeforeAfter["beforeImage"]>();
  readonly afterImage = input.required<TcBeforeAfter["afterImage"]>();
  onPositionChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/before-after";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";

  let { beforeImage, afterImage }: { beforeImage: TcBeforeAfter["beforeImage"]; afterImage: TcBeforeAfter["afterImage"] } = $props();
  let el: TcBeforeAfter;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-position-change", on);
    return () => el.removeEventListener("tc-position-change", on);
  });
</script>

<tc-before-after bind:this={el} {beforeImage} {afterImage}></tc-before-after>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Before and after"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A quiet line under the heading – what was edited |
| `beforeImage` | – | `BeforeAfterImage \| null` | `null` | The original |
| `afterImage` | – | `BeforeAfterImage \| null` | `null` | The edit |
| `position` | `position` | `number` | `50` | How much of the original shows, 0–100 |
| `orientation` | `orientation` | `BeforeAfterOrientation` | `"horizontal"` | "horizontal": the divider moves left and right; "vertical": up and down, the original above |
| `mode` | `mode` | `BeforeAfterMode` | `"slider"` | "slider", or "side-by-side" for two columns |
| `hideMode` | `hide-mode` | `boolean` | `false` | Hides the Side by side switch |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-position-change` | – | Yes | The divider moved. Cancelable. Detail: BeforeAfterPositionChange ({ position }) |
| `tc-mode-change` | – | Yes | Switched between the slider and side by side. Cancelable. Detail: BeforeAfterModeChange ({ mode }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-before-after-handle` | `40px` | standard, clean, both |

#### Design tokens it reads (42)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-regular`, `--tc-gray-0`, `--tc-gray-900`, `--tc-gray-950`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `beforeImage` | `el.beforeImage = …;` | `<… beforeImage={…} />` | `<tc-before-after :beforeImage="…">` | `<tc-before-after [beforeImage]="…">` | `<tc-before-after {beforeImage}>` |
| `afterImage` | `el.afterImage = …;` | `<… afterImage={…} />` | `<tc-before-after :afterImage="…">` | `<tc-before-after [afterImage]="…">` | `<tc-before-after {afterImage}>` |

*Also attributes: `heading`, `description`, `position`, `orientation`, `mode`, `hide-mode` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-position-change` | Yes | `el.addEventListener("tc-position-change", (e) => …)` | `onPositionChange={…}` | `@tc-position-change="…"` | `(tc-position-change)="…($event)"` | `el.addEventListener("tc-position-change", …)` |
| `tc-mode-change` | Yes | `el.addEventListener("tc-mode-change", (e) => …)` | `onModeChange={…}` | `@tc-mode-change="…"` | `(tc-mode-change)="…($event)"` | `el.addEventListener("tc-mode-change", …)` |

### Controlled

The element changes `position` and `mode` itself unless a listener calls `preventDefault()` on `tc-position-change` or `tc-mode-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-before-after id="before-after"></tc-before-after>

<script type="module">
  import "@adamstavely/trenchcoat/before-after";

  const el = document.querySelector("#before-after");
  el.addEventListener("tc-position-change", (e) => {
    e.preventDefault(); // the element keeps its position…
    if (allowed(e.detail.position)) el.position = e.detail.position; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { BeforeAfter } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof BeforeAfter>;
type Props = Omit<Own, "position" | "onPositionChange"> & { initial: NonNullable<Own["position"]> };

// Controlled: passing position makes the wrapper prevent the element's own change; the app sets it
export function ControlledBeforeAfter({ initial, ...props }: Props) {
  const [position, setPosition] = useState<Own["position"]>(initial);
  return <BeforeAfter {...props} position={position} onPositionChange={(next) => setPosition(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/before-after";
import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";

const props = defineProps<{ initial: TcBeforeAfter["position"] }>();
const position = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPositionChange = (e: CustomEvent<{ position: TcBeforeAfter["position"] }>) => {
  e.preventDefault();
  position.value = e.detail.position;
};
</script>

<template>
  <tc-before-after :position="position" @tc-position-change="onPositionChange"></tc-before-after>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BeforeAfter } from "@adamstavely/trenchcoat/angular/before-after";
import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";

@Component({
  selector: "app-controlled-before-after",
  imports: [BeforeAfter],
  template: `<tc-before-after [position]="position()" (tc-position-change)="onPositionChange($event)"></tc-before-after>`,
})
export class ControlledBeforeAfter {
  readonly initial = input.required<TcBeforeAfter["position"]>();
  readonly position = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPositionChange(e: CustomEvent<{ position: TcBeforeAfter["position"] }>) {
    e.preventDefault();
    this.position.set(e.detail.position);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/before-after";
  import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";

  let { initial }: { initial: TcBeforeAfter["position"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let position = $derived(initial);
  let el: TcBeforeAfter;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      position = (e as CustomEvent<{ position: TcBeforeAfter["position"] }>).detail.position;
    };
    el.addEventListener("tc-position-change", on);
    return () => el.removeEventListener("tc-position-change", on);
  });
</script>

<tc-before-after bind:this={el} {position}></tc-before-after>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-before-after")` returns a `TcBeforeAfter` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";`
- **React / Next.js:** Props: `import type { BeforeAfterProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BeforeAfter>`. The element class, for refs: `import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBeforeAfter["beforeImage"]` with `import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";`
- **Angular:** The directive types the template: `[beforeImage]` takes `TcBeforeAfter["beforeImage"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBeforeAfter } from "@adamstavely/trenchcoat/before-after";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `position` | `number` | How much of the original shows, 0–100. Controlled when defined – pass back what onPositionChange reports |
| `defaultPosition` | `number` | The starting position when uncontrolled |
| `onPositionChange` | `(position: number) => void` | The divider moved |
| `mode` | `BeforeAfterMode` | "slider" or "side-by-side". Controlled when defined |
| `defaultMode` | `BeforeAfterMode` | The starting mode when uncontrolled |
| `onModeChange` | `(mode: BeforeAfterMode) => void` | Switched between the slider and side by side |

*Renamed or hidden on the wrapper: `heading`, `slider`, `side-by-side`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| ← / → | Moves the divider 1% left or right |
| ↑ / ↓ | Moves the divider 1% – up or down when vertical; when horizontal, ↑ shows more of the original and ↓ less |
| Shift + an arrow | Moves it 10% |
| Page Up / Page Down | Moves it 10% |
| Home / End | All the edit, or all the original |
| Enter or Space on Side by side | Switches between the divider and two columns |

### Screen readers

The handle is a `slider` named “Divider between before and after” (from the images' labels), with its orientation,
its value from 0 to 100 and a value text that says both sides – “42% before, 58% after”. It's described by how the
keys move it. Each image has its own alt text; the corner labels are hidden from assistive technology because the
slider says them. Side by side is a toggle button with `aria-pressed`, and in that mode each image is a `figure` with
its label as the caption.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 15.1 KB | 5.3 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.9 KB** | **7.6 KB** |
| With Lit – the first component on a page | 43.6 KB | 14.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 29 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |

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

- Write each image's `alt` as what it shows, so the difference can be understood without seeing it.
- Use labels that say what each side is – “Original” and “AI edit”, “Low light” and “Enhanced” – when Before and After
  aren't clear enough.
- Give both images the same size and framing; the frame takes its size from the original.
- Pass the images as `beforeImage` and `afterImage` – `before` and `after` are DOM methods every element already has.

## Do and don't

### Do

- Start the divider where the change is easiest to see.
- Say what was asked for in the description, so people judge the edit against it.
- Offer Side by side when the change is in colour or layout rather than detail.

### Don't

- Don't compare images of different sizes or crops – the divider lines them up by position, not content.
- Don't use it for more than two images.
- Don't animate the divider on its own; let people move it.

## Related

- [Region Overlay](region-overlay.md) – What a vision model read, drawn on the image – numbered boxes linked to a list with each region's kind, confidence in a word and a percentage and the text it read, filtered by kind and a confidence threshold, with the boxes switched off to see the image plainly
- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Image Generation](image-generation.md) – One image while it's generated – its place in the queue, then the picture taking shape in a frame of the image's own shape as a blurred preview or colour field clears, the step, percentage and time left, the image fading in when it's done or why it failed with Try again, the prompt with Show more, and Cancel, Download, Regenerate and Copy prompt
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
