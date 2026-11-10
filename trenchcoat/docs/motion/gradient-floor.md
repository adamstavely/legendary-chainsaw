<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Gradient Floor

**Motion**

A blurred colour gradient that glows up from the bottom edge – two layers that drift and morph, then settle

- **Element:** `<tc-gradient-floor>`
- **Size:** 6.2 KB gzip · 15.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/gradient-floor";` |
| React / Next.js | `import { GradientFloor } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/gradient-floor";` · tags starting with tc- are custom elements |
| Angular | `import { GradientFloor } from "@adamstavely/trenchcoat/angular/gradient-floor";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/gradient-floor";` |

## Example

The live example is in the gallery at `#/motion/gradient-floor`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A soft, blurred band of colour that glows up from the bottom edge of a section. It gives a hero or a launch panel
warmth and depth without an image: a colour layer and a white layer above it rise and fall against each other while
both drift sideways, then slow down and rest after five seconds. Your content goes inside it and sits above the
glow. It scales with the width of its container, so the same floor works in a narrow card and a full-width hero.

### When to use

- Behind the headline and call to action of a landing, launch or welcome section.
- The bottom of an announcement or “what's new” panel, to give it some lift.
- Where the product's look is soft and colourful rather than technical.

### When not to use

- Behind dense content – tables, forms, long text – where the colour fights what people read. Use a plain surface.
- For a structured, technical texture – use [Grid Background](grid-background.md).
- To draw attention to one phrase – use [Gradient Text](gradient-text.md) or [Text Reveal](text-reveal.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Colour layer** `.ui-gf-layer--color` – the blurred gradient shape, from `colors[0]` at the crest down
2. **Light layer** `.ui-gf-layer--light` – the white shape on top that lightens it where they overlap
3. **Content** `.ui-gf-content` – your children, above the floor (with the element: every child)

## Usage

### HTML

```html
<tc-gradient-floor id="hero" style="height: 320px">
  <div class="hero">
    <h1>Agents that ship.</h1>
    <a href="/start">Get started</a>
  </div>
</tc-gradient-floor>

<script type="module">
  import "@adamstavely/trenchcoat/gradient-floor";
  import "@adamstavely/trenchcoat/tokens.css";

  const floor = document.querySelector("#hero");
  floor.colors = ["#FF7700", "#FF0055", "#0073FF"];
  floor.playFor = 8;
</script>
```

### React / Next.js

```tsx
import { GradientFloor } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Hero() {
  return (
    <GradientFloor colors={["#22c55e", "#06b6d4", "#6366f1"]} speed={4} style={{ height: 320 }}>
      <h1>Agents that ship.</h1>
      <a href="/start">Get started</a>
    </GradientFloor>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/gradient-floor";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGradientFloor } from "@adamstavely/trenchcoat/gradient-floor";

defineProps<{ colors: TcGradientFloor["colors"] }>();
</script>

<template>
  <tc-gradient-floor :colors="colors"></tc-gradient-floor>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GradientFloor } from "@adamstavely/trenchcoat/angular/gradient-floor";
import type { TcGradientFloor } from "@adamstavely/trenchcoat/gradient-floor";

@Component({
  selector: "app-gradient-floor-example",
  imports: [GradientFloor],
  template: `<tc-gradient-floor [colors]="colors()"></tc-gradient-floor>`,
})
export class GradientFloorExample {
  readonly colors = input.required<TcGradientFloor["colors"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/gradient-floor";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGradientFloor } from "@adamstavely/trenchcoat/gradient-floor";

  let { colors }: { colors: TcGradientFloor["colors"] } = $props();
  let el: TcGradientFloor;
</script>

<tc-gradient-floor bind:this={el} {colors}></tc-gradient-floor>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `colors` | – | `GradientFloorColors` | `["#FF7700", "#FF0055", "#0073FF"]` | Gradient from the crest down: [top, middle, bottom] |
| `speed` | `speed` | `number` | `3` | Seconds per morph loop; 0 keeps the shape still (the sideways drift keeps going) |
| `playFor` | `play-for` | `number` | `5` | Seconds of motion before the floor slows down and rests (rounded to whole drift loops of 2.5 s); Infinity never stops – then give users a way to pause it (WCAG 2.2.2) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-gradient-floor-bg` | `light-dark(#fafafa, #111113)` | both |
| `--tc-gradient-floor-drift` | `2.5s` | both |
| `--tc-gradient-floor-passes` | `infinite` | not set – this fallback applies |

#### Design tokens it reads (1)

`--tc-ease-in-out`

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
| `colors` | `el.colors = …;` | `<… colors={…} />` | `<tc-gradient-floor :colors="…">` | `<tc-gradient-floor [colors]="…">` | `<tc-gradient-floor {colors}>` |

*Also attributes: `speed`, `play-for` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-gradient-floor")` returns a `TcGradientFloor` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGradientFloor } from "@adamstavely/trenchcoat/gradient-floor";`
- **React / Next.js:** Props: `import type { GradientFloorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GradientFloor>`. The element class, for refs: `import type { TcGradientFloor } from "@adamstavely/trenchcoat/gradient-floor";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGradientFloor["colors"]` with `import type { TcGradientFloor } from "@adamstavely/trenchcoat/gradient-floor";`
- **Angular:** The directive types the template: `[colors]` takes `TcGradientFloor["colors"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGradientFloor } from "@adamstavely/trenchcoat/gradient-floor";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGradientFloor } from "@adamstavely/trenchcoat/gradient-floor";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | Content rendered above the floor |
| `colors` | `[string, string, string]` | Gradient from the crest down: [top, middle, bottom] |
| `speed` | `number` | Seconds per morph loop; 0 keeps the shape still (the sideways drift keeps going) |
| `playFor` | `number` | Seconds of motion before the floor slows down and rests (rounded to whole drift loops of 2.5 s); Infinity never stops – then give users a way to pause it (WCAG 2.2.2) |
| `className` | `string` | Classes on the element |
| `ref` | `React.Ref<TcGradientFloor>` | The root element |

## Accessibility

### Keyboard

Nothing to operate – the floor is decoration and takes no focus. The content inside keeps its own keyboard
behaviour.

### Screen readers

Both layers are `aria-hidden="true"`, so screen readers skip the floor and read only your content.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This piece alone** | 9.3 KB | 4.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.9 KB** | **6.2 KB** |
| With Lit – the first component on a page | 35.5 KB | 12.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 13 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of colors replaced |
| First on the page | 3.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.4 ms | colors: first render, 13 nodes; update 0.0 ms |
| 1,000 items | 0.3 ms | colors: first render, 13 nodes; update 0.0 ms |

What it renders doesn't grow with colors (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- 2 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Give the container a height – the floor is anchored to its bottom edge and fills the width.
- Keep the text near the top, where the background stays light (`--tc-gradient-floor-bg`), and check its contrast.
- Leave `playFor` at its default: the motion stops after five seconds, as WCAG 2.2.2 asks. It also stays still with
  reduced motion and pauses off screen.

### Don't

- Don't set `playFor` to `Infinity` without giving people a way to pause it.
- Don't pick three colours of the same lightness – the crest, middle and bottom read best as a clear progression.
- Don't stack it under another moving background.

## Related

- [Grid Background](grid-background.md) – A fine line grid that drifts slowly behind your content and fades out towards the edges
- [Gradient Text](gradient-text.md) – Letters cut from a liquid, flowing gradient – the color sweeps across the word the first time it's seen
- [Text Reveal](text-reveal.md) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
