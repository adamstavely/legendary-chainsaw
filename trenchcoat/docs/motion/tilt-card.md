<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Tilt Card

**Motion**

A card that tilts in 3D towards the pointer, with a soft glare that follows it and a smooth spring back

- **Element:** `<tc-tilt-card>`
- **Size:** 5.3 KB gzip · 15.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tilt-card";` |
| React / Next.js | `import { TiltCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tilt-card";` · tags starting with tc- are custom elements |
| Angular | `import { TiltCard } from "@adamstavely/trenchcoat/angular/tilt-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tilt-card";` |

## Example

The live example is in the gallery at `#/motion/tilt-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A wrapper that tilts its card in 3D towards the pointer, lifts it a little with a deeper shadow, and lays a soft
glare over it that follows the pointer. When the pointer leaves, the card springs back to rest. It makes one card
feel tangible – a plan, a membership, a featured item – without changing what's on it. Touch pointers don't tilt
it, keyboard focus inside it gives a slight lift instead, and with reduced motion only the shadow changes.

### When to use

- One featured card that should invite a closer look: a pricing plan, a membership or gift card, a hero tile.
- A small set of showcase cards on a landing or upgrade page.
- Cards whose content is mostly visual, where a little depth adds to it.

### When not to use

- Cards in a dense grid or list people scan and click through – the movement distracts; use [Project Card](../components/project-card.md) on
  its own.
- Cards holding forms or controls people type into – a surface that moves under the pointer is harder to use.
- Swapping one piece of content for another – use [Blur Crossfade](blur-crossfade.md).
- A glowing backdrop for a section rather than a card – use [Gradient Floor](gradient-floor.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Content** `.ui-tlt-content` – your card's content, clipped to the rounded corners (the React wrapper's div)
2. **Shadow** `.ui-tlt-card` – the shadow layer behind the content, deeper while tilting

## Usage

### HTML

```html
<tc-tilt-card id="plan" max-tilt="12">
  <div class="plan-card">
    <h3>Pro</h3>
    <p>$24 a month · unlimited agents</p>
  </div>
</tc-tilt-card>

<script type="module">
  import "@adamstavely/trenchcoat/tilt-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#plan");
  card.perspective = 700;
  card.addEventListener("pointerenter", () => console.log("Looking at the Pro plan"));
</script>
```

### React / Next.js

```tsx
import { TiltCard } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PlanCard() {
  return (
    <TiltCard maxTilt={12} glare perspective={700}>
      <div className="plan-card">
        <h3>Pro</h3>
        <p>$24 a month · unlimited agents</p>
      </div>
    </TiltCard>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tilt-card";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-tilt-card></tc-tilt-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { TiltCard } from "@adamstavely/trenchcoat/angular/tilt-card";

@Component({
  selector: "app-tilt-card-example",
  imports: [TiltCard],
  template: `<tc-tilt-card></tc-tilt-card>`,
})
export class TiltCardExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tilt-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTiltCard } from "@adamstavely/trenchcoat/tilt-card";

  let el: TcTiltCard;
</script>

<tc-tilt-card bind:this={el}></tc-tilt-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `maxTilt` | `max-tilt` | `number` | `10` | Maximum tilt in degrees |
| `glare` | `glare` | `boolean` | `true` | Show a soft glare that follows the pointer (attribute: glare="false" turns it off) |
| `scale` | `scale` | `number` | `1.02` | Scale while the pointer is over the card |
| `perspective` | `perspective` | `number` | `900` | Perspective distance in px – smaller is more dramatic |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tilt-card-shadow` | `0 1px 2px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4)), 0 8px 24px -12px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.6))` | both |
| `--tc-tilt-card-shadow-active` | `0 2px 4px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 24px 48px -16px light-dark(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.75))` | both |
| `--tc-tilt-card-glare-color` | `light-dark(rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0.24))` | both |
| `--tc-tilt-card-rx` | `0deg` | both |
| `--tc-tilt-card-ry` | `0deg` | both |
| `--tc-tilt-card-gx` | `50%` | both |
| `--tc-tilt-card-gy` | `50%` | both |
| `--tc-tilt-card-lift` | `0px` | both |
| `--tc-tilt-card-s` | `1` | both |

#### Design tokens it reads (11)

`--tc-duration-fast`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-radius-3xl`, `--tc-tilt-card-perspective`, `--tc-tilt-card-scale`

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

*Also attributes: `max-tilt`, `glare`, `scale`, `perspective` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tilt-card")` returns a `TcTiltCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTiltCard } from "@adamstavely/trenchcoat/tilt-card";`
- **React / Next.js:** Props: `import type { TiltCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TiltCard>`. The element class, for refs: `import type { TcTiltCard } from "@adamstavely/trenchcoat/tilt-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTiltCard["maxTilt"]` with `import type { TcTiltCard } from "@adamstavely/trenchcoat/tilt-card";`
- **Angular:** The directive types the template: `[maxTilt]` takes `TcTiltCard["maxTilt"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTiltCard } from "@adamstavely/trenchcoat/tilt-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTiltCard } from "@adamstavely/trenchcoat/tilt-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | The card's content – it fills the tilting surface |
| `maxTilt` | `number` | Maximum tilt in degrees |
| `glare` | `boolean` | Show a soft glare that follows the pointer |
| `scale` | `number` | Scale while the pointer is over the card |
| `perspective` | `number` | Perspective distance in px – smaller is more dramatic |
| `className` | `string` | Classes on the root, the untransformed wrapper |
| `ref` | `React.Ref<TcTiltCard>` | The root (the untransformed wrapper) |

## Accessibility

### Keyboard

Nothing to operate – the card itself takes no focus. When something inside it has keyboard focus, the card lifts
slightly so the focused card stands out.

### Screen readers

The shadow and glare layers are `aria-hidden="true"`; screen readers read only your content, which stays in the
order you wrote it.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 8.4 KB | 3.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.0 KB** | **5.3 KB** |
| With Lit – the first component on a page | 34.6 KB | 11.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.3 ms** | the gallery demo's data, 2 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 4.9 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Give it element children – text alone can't take the transform. The React wrapper puts children in a div for
  you.
- Keep `maxTilt` around the default 10° – past about 15° the content gets hard to read.
- Turn `glare` off on light, busy artwork where the soft-light glare washes it out.

### Don't

- Don't tilt every card on a page – keep it for the one that matters.
- Don't rely on the tilt to say something – touch screens and reduced motion never show it.

## Related

- [Project Card](../components/project-card.md) – A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover
- [Gradient Floor](gradient-floor.md) – A blurred colour gradient that glows up from the bottom edge – two layers that drift and morph, then settle
- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
