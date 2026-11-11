<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Blur Crossfade

**Motion**

Swaps content with a soft blur while the box glides smoothly to the size of what comes next

- **Element:** `<tc-blur-crossfade>`
- **Size:** 5.4 KB gzip · 14.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/blur-crossfade";` |
| React / Next.js | `import { BlurCrossfade } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/blur-crossfade";` · tags starting with tc- are custom elements |
| Angular | `import { BlurCrossfade } from "@adamstavely/trenchcoat/angular/blur-crossfade";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/blur-crossfade";` |

## Example

The live example is in the gallery at `#/motion/blur-crossfade`, at 320 px, 480 px or full width.

## Overview

Swaps one piece of content for another with a soft blur, while the box glides to the size of what comes next. The
old content blurs and fades out as the new one blurs in, so a status, a card or a button label changes without a
jump in the layout. If keyboard focus was inside the old content, it moves to the first control of the new content,
so it never drops to the page. For people who ask for reduced motion, the content changes at once.

### When to use

- A status that changes in place – “Saved”, “Uploading 3 files”, “Sync paused” – where each state has a different size.
- Button labels or small cards that change after an action and shouldn't make the page jump.
- Steps in a small flow where the container should follow its content's height.

### When not to use

- Revealing a heading or a sentence as it first appears – use [Text Reveal](text-reveal.md).
- A number that counts up or down to a new value – use [Number Ticker](number-ticker.md).
- A placeholder while content loads – use [Shimmer Loader](shimmer-loader.md).

## Usage

### HTML

```html
<tc-blur-crossfade id="status" swap-key="saved" morph="both"><div>Saved</div></tc-blur-crossfade>

<script type="module">
  import "@adamstavely/trenchcoat/blur-crossfade";
  import "@adamstavely/trenchcoat/tokens.css";

  const box = document.querySelector("#status");
  const next = document.createElement("div");
  next.textContent = "Uploading 3 files";
  // Put the new content in, then change the key
  box.querySelector("div").replaceWith(next);
  box.swapKey = "uploading";
</script>
```

### React / Next.js

```tsx
import { BlurCrossfade } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SyncStatus({ state }: { state: "saved" | "uploading" | "paused" }) {
  return (
    <BlurCrossfade id={state} morph="both">
      {state === "saved" ? <strong>Saved</strong> : state === "uploading" ? <strong>Uploading 3 files</strong> : <strong>Sync paused</strong>}
    </BlurCrossfade>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/blur-crossfade";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-blur-crossfade></tc-blur-crossfade>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { BlurCrossfade } from "@adamstavely/trenchcoat/angular/blur-crossfade";

@Component({
  selector: "app-blur-crossfade-example",
  imports: [BlurCrossfade],
  template: `<tc-blur-crossfade></tc-blur-crossfade>`,
})
export class BlurCrossfadeExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/blur-crossfade";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBlurCrossfade } from "@adamstavely/trenchcoat/blur-crossfade";

  let el: TcBlurCrossfade;
</script>

<tc-blur-crossfade bind:this={el}></tc-blur-crossfade>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `swapKey` | `swap-key` | `string \| number \| undefined` | `undefined` | Change this to swap – the content that was there fades out, the new content fades in |
| `duration` | `duration` | `number` | `420` | Length of the swap in ms |
| `blurAmount` | `blur` | `number` | `10` | Blur in px at the start and end of the fade (the React prop `blur`; `blur` is the element's blur() method) |
| `morph` | `morph` | `BlurCrossfadeMorph` | `"height"` | Which sides glide to the new size; "both" sizes the box to its content |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-blur-crossfade-duration` | `420ms` | both |
| `--tc-blur-crossfade-blur` | `10px` | both |

#### Design tokens it reads (5)

`--tc-ease-in`, `--tc-ease-out`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Everything it takes is a string, number or boolean, so attributes work too.*

*Also attributes: `swap-key`, `duration`, `blur`, `morph` – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties (and, in React, the wrapper's children).

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-blur-crossfade")` returns a `TcBlurCrossfade` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBlurCrossfade } from "@adamstavely/trenchcoat/blur-crossfade";`
- **React / Next.js:** Props: `import type { BlurCrossfadeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BlurCrossfade>`. The element class, for refs: `import type { TcBlurCrossfade } from "@adamstavely/trenchcoat/blur-crossfade";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBlurCrossfade["swapKey"]` with `import type { TcBlurCrossfade } from "@adamstavely/trenchcoat/blur-crossfade";`
- **Angular:** The directive types the template: `[swapKey]` takes `TcBlurCrossfade["swapKey"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBlurCrossfade } from "@adamstavely/trenchcoat/blur-crossfade";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBlurCrossfade } from "@adamstavely/trenchcoat/blur-crossfade";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `id` | `string \| number` | Change this to swap – the children of the old id fade out, the new ones fade in |
| `children` | `React.ReactNode` | The content on show – it swaps whenever `id` changes |
| `duration` | `number` | Length of the swap in ms |
| `blur` | `number` | Blur in px at the start and end of the fade |
| `morph` | `"height" \| "both" \| "none"` | Which sides glide to the new size; "both" sizes the box to its content |
| `as` | `"div" \| "span"` | The layer element – use span inside buttons and other inline content |
| `className` | `string` | Classes on the root element |
| `style` | `React.CSSProperties` | Inline styles on the root element |
| `ref` | `React.Ref<TcBlurCrossfade>` | The root element |

*Renamed or hidden on the wrapper: `swapKey`, `blurAmount`, `both`, `height`, `both`, `none`, `div`, `span`*

## Accessibility

### Keyboard

Nothing to operate. When a swap removes the element that had focus, focus moves to the first focusable element in the
new content, or to the new content itself.

### Screen readers

Only the new content is read: the copy of the old content that fades out is `aria-hidden` and inert. The swap isn't
announced – if the change matters, say it in a live region of your own.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This piece alone** | 8.2 KB | 3.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **14.9 KB** | **5.4 KB** |
| With Lit – the first component on a page | 34.5 KB | 11.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 4.5 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 6 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Change `swapKey` (React: `id`) only when the content means something different; typing into the content needs no swap.
- Use `morph="both"` for content whose width changes too, like cards of different widths; the default glides the height.
- Use `as="span"` in React when the crossfade sits inside a button or a line of text.

### Don't

- Don't swap content on a timer faster than people can read it – and when it changes on its own, give people a way to pause it, as the demo does.
- Don't put the whole page in it; it's for one piece of content.

## Related

- [Text Reveal](text-reveal.md) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
- [Number Ticker](number-ticker.md) – Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once
- [Shimmer Loader](shimmer-loader.md) – Skeleton blocks with a soft light sweep on one beat, plus shimmering text for “Thinking…” states that stays readable
