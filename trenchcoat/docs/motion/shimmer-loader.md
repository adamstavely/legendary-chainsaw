<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Shimmer Loader

**Motion**

Skeleton blocks with a soft light sweep on one beat, plus shimmering text for “Thinking…” states that stays readable

- **Element:** `<tc-skeleton>`, `<tc-shimmer-text>`
- **Size:** 5.4 KB gzip · 14.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/shimmer-loader";` |
| React / Next.js | `import { Skeleton, ShimmerText } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/shimmer-loader";` · tags starting with tc- are custom elements |
| Angular | `import { Skeleton, ShimmerText } from "@adamstavely/trenchcoat/angular/shimmer-loader";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/shimmer-loader";` |

## Example

The live example is in the gallery at `#/motion/shimmer-loader`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Two loading states with a soft sweep of light. `tc-skeleton` draws placeholder blocks in the shape of the content
that's on its way – an avatar, a line of text, an image – so the layout doesn't jump when it arrives.
`tc-shimmer-text` runs a brighter band through the letters of a short label, for an AI “Thinking…” state; the label
stays readable the whole time. The sweeps run three passes and then rest, hold while off screen, and turn into
plain blocks and plain text with reduced motion.

### When to use

- Loading a card, a list or a profile whose shape you know – skeleton blocks in the same layout.
- A one-word status while a model works: “Thinking…”, “Searching…”.
- Waits of a second or more; shorter ones are better with nothing at all.

### When not to use

- Showing the model's reasoning or steps while it works – use [Thinking State](../components/thinking-state.md).
- An animated “the model is working” mark without text – use [Thinking Loader](../components/thinking-loader.md).
- Swapping one piece of content for another once it's loaded – use [Blur Crossfade](blur-crossfade.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Skeleton** `tc-skeleton` – a placeholder block; `circle` makes it round for avatars
2. **Shimmer text** `tc-shimmer-text` – a label with a brighter band sliding through its letters

## Usage

### HTML

```html
<tc-skeleton circle width="40"></tc-skeleton>
<tc-skeleton width="45%" height="12"></tc-skeleton>
<tc-shimmer-text id="status" text="Thinking…"></tc-shimmer-text>

<script type="module">
  import "@adamstavely/trenchcoat/shimmer-loader";

  document.querySelector("#status").duration = 2;
</script>
```

### React / Next.js

```tsx
import { ShimmerText, Skeleton } from "@adamstavely/trenchcoat/react";

export function LoadingProfile() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Skeleton circle width={40} />
      <Skeleton width="45%" height={12} />
      <Skeleton width="30%" height={10} />
      <ShimmerText>Thinking…</ShimmerText>
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/shimmer-loader";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-skeleton></tc-skeleton>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { Skeleton } from "@adamstavely/trenchcoat/angular/shimmer-loader";

@Component({
  selector: "app-shimmer-loader-example",
  imports: [Skeleton],
  template: `<tc-skeleton></tc-skeleton>`,
})
export class ShimmerLoaderExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/shimmer-loader";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSkeleton } from "@adamstavely/trenchcoat/shimmer-loader";

  let el: TcSkeleton;
</script>

<tc-skeleton bind:this={el}></tc-skeleton>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

### `<tc-skeleton>`

*A placeholder block with a soft band of light sweeping over it. Hidden from assistive tech unless the page sets
aria-hidden itself.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `width` | `width` | `number \| string \| undefined` | `undefined` | Width – a number is px, a string any CSS length; defaults to 100% |
| `height` | `height` | `number \| string \| undefined` | `undefined` | Height – a number is px, a string any CSS length; defaults to 12px |
| `radius` | `radius` | `number \| string \| undefined` | `undefined` | Corner radius; defaults to 6px |
| `circle` | `circle` | `boolean` | `false` | Round shape, e.g. for avatars – uses width for both sides |

#### Design tokens it reads (3)

`--tc-duration-shimmer`, `--tc-shimmer`, `--tc-text-strong`

### `<tc-shimmer-text>`

*A label with a brighter band running through its letters, like an AI "Thinking…" state. The label stays readable;
the brighter copy in the band is hidden from assistive tech.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The label |
| `content` | – | `Element \| undefined` | `undefined` | Rich content instead of `text`: an element that's cloned for the label and for the band's copy |
| `duration` | `duration` | `number` | `1.6` | Seconds for one pass of the highlight |

#### Design tokens it reads (3)

`--tc-duration-shimmer`, `--tc-shimmer`, `--tc-text-strong`

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

*Also attributes: `width`, `height`, `radius`, `circle` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-skeleton")` returns a `TcSkeleton` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSkeleton } from "@adamstavely/trenchcoat/shimmer-loader";`
- **React / Next.js:** Props: `import type { SkeletonProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Skeleton>`. The element class, for refs: `import type { TcSkeleton } from "@adamstavely/trenchcoat/shimmer-loader";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSkeleton["width"]` with `import type { TcSkeleton } from "@adamstavely/trenchcoat/shimmer-loader";`
- **Angular:** The directive types the template: `[width]` takes `TcSkeleton["width"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSkeleton } from "@adamstavely/trenchcoat/shimmer-loader";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSkeleton } from "@adamstavely/trenchcoat/shimmer-loader";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

#### Skeleton

| Prop | Type | Description |
| --- | --- | --- |
| `width` | `number \| string` | Width – a number is px, a string any CSS length; defaults to 100% |
| `height` | `number \| string` | Height – a number is px, a string any CSS length; defaults to 12px |
| `radius` | `number \| string` | Corner radius; defaults to 6px |
| `circle` | `boolean` | Round shape, e.g. for avatars – uses width for both sides |
| `className` | `string` | Classes on the element |
| `style` | `React.CSSProperties` | Inline styles on the element – width and height size the block |
| `ref` | `React.Ref<TcSkeleton>` | The placeholder element |

#### ShimmerText

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | The text that shimmers – a string, or React nodes the element clones |
| `duration` | `number` | Seconds for one pass of the highlight |
| `className` | `string` | Classes on the element |
| `ref` | `React.Ref<TcShimmerText>` | The text element |

*Renamed or hidden on the wrapper: `text`, `content`*

## Accessibility

### Screen readers

Skeletons are hidden from assistive technology (`aria-hidden="true"`) unless the page sets `aria-hidden` itself –
announce the loading state once, elsewhere on the page. Shimmer text reads as its label, once: the brighter copy in
the band is hidden.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |
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
| **This piece alone** | 8.0 KB | 3.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **14.8 KB** | **5.4 KB** |
| With Lit – the first component on a page | 34.4 KB | 11.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 4.2 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep shimmer text to one or two words with an ellipsis: “Thinking…”, “Writing…”.
- Size skeletons like the content they stand for – a short line for a name, a wider one for a title.

## Do and don't

### Do

- Match the real layout: the same gaps, the same avatar size, the last line of a paragraph shorter.
- Replace the skeletons with the content as soon as it arrives, in one go.
- Set `--tc-shimmer-loader-passes` to `infinite` only when you give people a way to pause it.

### Don't

- Don't skeleton a whole page for a wait of a few hundred milliseconds.
- Don't use shimmer text for anything people must read to act – it's a status, not a message.

## Related

- [Thinking Loader](../components/thinking-loader.md) – A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check
- [Thinking State](../components/thinking-state.md) – AI working panel with a live timer, searched sources and thinking steps that appear one by one
- [Text Reveal](text-reveal.md) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next

## Changelog

- The 22 illustrations and 8 motion pieces as elements (step 2.7), 105 tags in all; shimmer-loader is two (`tc-skeleton`, `tc-shimmer-text`). Same React names and props through `trenchcoat/react`; parity with the React versions at 0.00 % except voice-orb's canvas particles (timing) and tilt-card, which drops 3 px of line space under its inline-block root.
