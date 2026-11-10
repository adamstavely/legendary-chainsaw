<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Grid Background

**Motion**

A fine line grid that drifts slowly behind your content and fades out towards the edges

- **Element:** `<tc-grid-background>`
- **Size:** 5.4 KB gzip · 15.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/grid-background";` |
| React / Next.js | `import { GridBackground } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/grid-background";` · tags starting with tc- are custom elements |
| Angular | `import { GridBackground } from "@adamstavely/trenchcoat/angular/grid-background";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/grid-background";` |

## Example

The live example is in the gallery at `#/motion/grid-background`, at 320 px, 480 px or full width.

## Overview

A fine line grid behind a hero section or an empty state. It gives a large, bare area some texture without
competing with the words on it: the lines are faint, they fade out towards the edges, and they drift by one cell at
a time for a few seconds before they rest. On first view a circle grows from the centre to uncover the grid. Your
content goes inside it and sits above the lines.

### When to use

- Behind the headline and call to action of a landing or welcome section.
- Behind an empty state that would otherwise be a large blank panel.
- Where the product's look is technical or structured and a grid fits it.

### When not to use

- Behind dense content – tables, forms, long text – where the lines cut through what people read. If the section
  needs a backdrop at all, use [Gradient Floor](gradient-floor.md), which colours only its floor.
- To draw attention to one phrase – use [Gradient Text](gradient-text.md) or [Text Reveal](text-reveal.md).

## Usage

### HTML

```html
<tc-grid-background id="hero" size="40" direction="up">
  <div class="hero">
    <h1>Build on a solid grid</h1>
    <a href="/start">Get started</a>
  </div>
</tc-grid-background>

<script type="module">
  import "@adamstavely/trenchcoat/grid-background";
  import "@adamstavely/trenchcoat/tokens.css";

  const grid = document.querySelector("#hero");
  grid.fade = 60;
  grid.playFor = 8;
</script>
```

### React / Next.js

```tsx
import { GridBackground } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Hero() {
  return (
    <GridBackground size={40} direction="up" fade={60}>
      <div className="hero">
        <h1>Build on a solid grid</h1>
        <a href="/start">Get started</a>
      </div>
    </GridBackground>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/grid-background";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-grid-background></tc-grid-background>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { GridBackground } from "@adamstavely/trenchcoat/angular/grid-background";

@Component({
  selector: "app-grid-background-example",
  imports: [GridBackground],
  template: `<tc-grid-background></tc-grid-background>`,
})
export class GridBackgroundExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/grid-background";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGridBackground } from "@adamstavely/trenchcoat/grid-background";

  let el: TcGridBackground;
</script>

<tc-grid-background bind:this={el}></tc-grid-background>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `size` | `size` | `number` | `48` | Cell size in px |
| `color` | `color` | `string \| undefined` | `undefined` | Line colour – defaults to a faint black, or a faint white in dark mode |
| `speed` | `speed` | `number` | `3` | Seconds per cell; 0 keeps the grid still |
| `playFor` | `play-for` | `number` | `5` | Seconds the grid drifts before it rests; Infinity never stops – then give users a way to pause it (WCAG 2.2.2) |
| `direction` | `direction` | `GridDirection` | `"diagonal"` | Drift direction; "diagonal" runs from top right to bottom left |
| `reveal` | `reveal` | `boolean` | `true` | Uncover the grid with a growing circle when it first comes into view (attribute: reveal="false" turns it off) |
| `fade` | `fade` | `number` | `70` | Radius of the edge fade, in % of the distance to the corners |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-grid-background-reveal` | `1.6s` | both |
| `--tc-grid-background-line` | `var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)))` | not set – this fallback applies |
| `--tc-grid-background-passes` | `infinite` | not set – this fallback applies |

#### Design tokens it reads (8)

`--tc-ease-out`, `--tc-fill-default`, `--tc-grid-background-dx`, `--tc-grid-background-dy`, `--tc-grid-background-fade`, `--tc-grid-background-r`, `--tc-grid-background-size`, `--tc-grid-background-speed`

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

*Also attributes: `size`, `color`, `speed`, `play-for`, `direction`, `reveal`, `fade` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-grid-background")` returns a `TcGridBackground` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGridBackground } from "@adamstavely/trenchcoat/grid-background";`
- **React / Next.js:** Props: `import type { GridBackgroundProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GridBackground>`. The element class, for refs: `import type { TcGridBackground } from "@adamstavely/trenchcoat/grid-background";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGridBackground["size"]` with `import type { TcGridBackground } from "@adamstavely/trenchcoat/grid-background";`
- **Angular:** The directive types the template: `[size]` takes `TcGridBackground["size"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGridBackground } from "@adamstavely/trenchcoat/grid-background";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGridBackground } from "@adamstavely/trenchcoat/grid-background";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | Content rendered above the grid |
| `size` | `number` | Cell size in px |
| `color` | `string` | Line color – defaults to a faint black, or a faint white in dark mode |
| `speed` | `number` | Seconds per cell; 0 keeps the grid still |
| `playFor` | `number` | Seconds the grid drifts before it rests; Infinity never stops – then give users a way to pause it (WCAG 2.2.2) |
| `direction` | `GridDirection` | Drift direction; "diagonal" runs from top right to bottom left |
| `reveal` | `boolean` | Uncover the grid with a growing circle when it first comes into view |
| `fade` | `number` | Radius of the edge fade, in % of the distance to the corners |
| `className` | `string` | Class names for the root element |
| `ref` | `React.Ref<TcGridBackground>` | The root element |

*Renamed or hidden on the wrapper: `diagonal`*

## Accessibility

### Keyboard

Nothing to operate – the grid is decoration and takes no focus. The content you put inside keeps its own keyboard
behaviour.

### Screen readers

The grid is `aria-hidden="true"`, so screen readers skip it and read only your content.

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
| @property | 85 | 128 | 16.4 | 16.4 | itself | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 8.4 KB | 3.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.0 KB** | **5.4 KB** |
| With Lit – the first component on a page | 34.6 KB | 11.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 3 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 2.5 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Keep the content short and centred, where the fade leaves the grid most visible.
- Match `size` to the spacing of what's on top – 40 or 48 px cells suit most hero sections.
- Leave `playFor` at its default: the drift stops after five seconds, as WCAG 2.2.2 asks.

### Don't

- Don't set `playFor` to `Infinity` without giving people a way to pause the drift.
- Don't darken the lines with `color` until they compete with the text – they should read as texture.
- Don't nest it inside another moving background.

## Related

- [Gradient Floor](gradient-floor.md) – A blurred colour gradient that glows up from the bottom edge – two layers that drift and morph, then settle
- [Gradient Text](gradient-text.md) – Letters cut from a liquid, flowing gradient – the color sweeps across the word the first time it's seen
- [Text Reveal](text-reveal.md) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
