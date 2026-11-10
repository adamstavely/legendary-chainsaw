<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Inspect Frame

**Illustrations** · New

Any component seen like a selection in a design tool – tilted back, a cursor walks through its rows while a frame with handles, padding numbers on guide lines and a W Fill width chip draw round each; twice through, then it rests on the first row

- **Element:** `<tc-inspect-frame>`
- **Size:** 7.6 KB gzip · 22.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/inspect-frame";` |
| React / Next.js | `import { InspectFrame } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/inspect-frame";` · tags starting with tc- are custom elements |
| Angular | `import { InspectFrame } from "@adamstavely/trenchcoat/angular/inspect-frame";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/inspect-frame";` |

## Example

The live example is in the gallery at `#/illustrations/inspect-frame`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A real component seen like a selection in a design tool. The component you put inside is tilted back, and a cursor
walks through its rows: on each one a selection frame with corner handles draws round it, its padding shows as
numbers on guide lines, and a chip under it gives its width and sizing ("W Fill 300px"). Every number is measured from
the live component, so it's true to the pixel. It walks the rows twice and rests on the first one.

It wraps any Trenchcoat component, so the same illustration shows an agent card, a composer or anything else.

### When to use

- The hero or a feature section of a design system, UI kit or developer product – it says the interface is built
  with care, down to the pixel.
- Either side of a headline: give the left one `mirror` and a different `delay`, so they take turns.
- Launch posts and social images: `flat` with `playing={false}` makes a clear still.

### When not to use

- As the real interface – it's a picture of one, and nothing in it can be clicked or focused.
- In tight spaces: it needs about 400 × 330 px, and its fades want room round them.
- To inspect a page while building it – use [Loupe](../components/loupe.md), which works on the live page.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Overlay** `.ui-isp-layer` – in the same grid cell with the same transform, so it lines up however it's tilted
4. **Guides** `.ui-isp-guide` – one per non-zero padding, each with its number `.ui-isp-num`
5. **Width chip** `.ui-isp-chip` – width and sizing: Fill when the row spans its parent's content box, Hug otherwise
6. **Cursor** `.ui-isp-cursor`

## Looks

One look. The selection and chip use `--tc-inspect-frame-select` (blue by default), the guides
`--tc-inspect-frame-guide` (red); both follow the page theme. The content keeps its own look – put a
`<tc-look-provider>` round it to show it in Clean.

## Usage

### HTML

```html
<tc-inspect-frame mirror delay="900">
  <tc-agent-monitor name="Survey writer" status="done"></tc-agent-monitor>
</tc-inspect-frame>

<script type="module">
  import "@adamstavely/trenchcoat/inspect-frame";
  import "@adamstavely/trenchcoat/agent-monitor";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { AgentMonitor, InspectFrame } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Hero() {
  return (
    <InspectFrame mirror delay={900}>
      <AgentMonitor name="Survey writer" status="done" />
    </InspectFrame>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/inspect-frame";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-inspect-frame></tc-inspect-frame>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { InspectFrame } from "@adamstavely/trenchcoat/angular/inspect-frame";

@Component({
  selector: "app-inspect-frame-example",
  imports: [InspectFrame],
  template: `<tc-inspect-frame></tc-inspect-frame>`,
})
export class InspectFrameExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/inspect-frame";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcInspectFrame } from "@adamstavely/trenchcoat/inspect-frame";

  let el: TcInspectFrame;
</script>

<tc-inspect-frame bind:this={el}></tc-inspect-frame>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Accessible name; without it the illustration is decorative and hidden from screen readers |
| `targets` | `targets` | `string` | `""` | CSS selector for the rows to walk through, inside the content; "" (the default) picks the root's block children |
| `playing` | `playing` | `boolean` | `true` | Walks the selection through the rows; false holds it on the first row |
| `hold` | `hold` | `number` | `1600` | How long the selection stays on a row, in ms |
| `delay` | `delay` | `number` | `600` | Wait before the first selection, in ms – e.g. until the section around it has come in |
| `rounds` | `rounds` | `number` | `2` | How many times it walks through the rows before it rests on the first one |
| `mirror` | `mirror` | `boolean` | `false` | Tilted the other way and fading out to the left – for the left side of a layout |
| `flat` | `flat` | `boolean` | `false` | No tilt and no fade |
| `contentWidth` | `content-width` | `number` | `300` | The content's width in px, before it's scaled to fit the frame |
| `measuredRows` | – | `readonly InspectFrameRow[]` | – | The rows as measured, in the content's CSS pixels |
| `selectedIndex` | – | `` | – | The row the selection is on |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `measure()` | `void` | Measures the rows again – call it after changing the content in a way that keeps its size |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-inspect-frame-select` | `var(--tc-blue-600, #2456d6)` | both |
| `--tc-inspect-frame-on-select` | `var(--tc-text-on-accent, #ffffff)` | both |
| `--tc-inspect-frame-guide` | `var(--tc-action-danger-bg, var(--tc-red-600))` | both |
| `--tc-inspect-frame-on-guide` | `var(--tc-action-danger-fg, #ffffff)` | both |
| `--tc-inspect-frame-handle-fill` | `var(--tc-surface-raised, light-dark(#ffffff, var(--tc-zinc-875)))` | both |
| `--tc-inspect-frame-cursor` | `var(--tc-text-primary, light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9)))` | both |
| `--tc-inspect-frame-cursor-edge` | `var(--tc-surface-raised, light-dark(#ffffff, var(--tc-zinc-875)))` | both |
| `--tc-inspect-frame-tilt` | `rotateX(22deg) rotateY(-16deg) rotateZ(5deg)` | both |
| `--tc-inspect-frame-tilt-mirror` | `rotateX(22deg) rotateY(16deg) rotateZ(-5deg)` | both |
| `--tc-inspect-frame-perspective` | `1100px` | both |
| `--tc-inspect-frame-width` | `300px` | both |
| `--tc-inspect-frame-fade` | `linear-gradient(to right, #000 55%, transparent 98%)` | both |
| `--tc-inspect-frame-fade-mirror` | `linear-gradient(to left, #000 55%, transparent 98%)` | both |
| `--tc-inspect-frame-fade-y` | `linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)` | both |

#### Design tokens it reads (23)

`--tc-action-danger-bg`, `--tc-action-danger-fg`, `--tc-blue-600`, `--tc-duration-base`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-weight-semibold`, `--tc-line-height-tight`, `--tc-radius-xs`, `--tc-red-600`, `--tc-space-0-5`, `--tc-space-1`, `--tc-surface-raised`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-zinc-875`

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

*Also attributes: `label`, `targets`, `playing`, `hold`, `delay`, `rounds`, `mirror`, `flat` and 1 more – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-inspect-frame")` returns a `TcInspectFrame` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcInspectFrame } from "@adamstavely/trenchcoat/inspect-frame";`
- **React / Next.js:** Props: `import type { InspectFrameProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof InspectFrame>`. The element class, for refs: `import type { TcInspectFrame } from "@adamstavely/trenchcoat/inspect-frame";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcInspectFrame["label"]` with `import type { TcInspectFrame } from "@adamstavely/trenchcoat/inspect-frame";`
- **Angular:** The directive types the template: `[label]` takes `TcInspectFrame["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcInspectFrame } from "@adamstavely/trenchcoat/inspect-frame";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcInspectFrame } from "@adamstavely/trenchcoat/inspect-frame";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | The component to show – it's measured and walked through, row by row |
| `label` | `string` | Accessible name; without it the illustration is decorative |
| `targets` | `string` | CSS selector for the rows, inside the content; unset picks the root's block children |
| `playing` | `boolean` | Walks the selection through the rows; false holds it on the first row |
| `hold` | `number` | How long the selection stays on a row, in ms |
| `delay` | `number` | Wait before the first selection, in ms |
| `rounds` | `number` | How many times it walks through the rows before it rests on the first one |
| `mirror` | `boolean` | Tilted the other way and fading out to the left |
| `flat` | `boolean` | No tilt and no fade |
| `contentWidth` | `number` | The content's width in px, before it's scaled to fit |
| `className` | `string` | Classes on the root |
| `ref` | `React.Ref<TcInspectFrame>` | The root element |

## Accessibility

### Keyboard

Nothing to operate. The host is `inert`, so nothing inside it takes focus, even when the content is interactive.

### Screen readers

Decorative by default: hidden from screen readers. Give it a `label` and the host is `role="img"` with that name –
say what the picture shows, e.g. "An agent card with its header selected and its spacing shown".

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 15.7 KB | 5.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **22.8 KB** | **7.6 KB** |
| With Lit – the first component on a page | 42.4 KB | 13.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.2 ms** | the gallery demo's data, 1 DOM nodes – to layout, median of 7 |
| Typical update | **0.0 ms** | re-render with the same data |
| First on the page | 2.5 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- Timers: `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Use a real component with real-looking data, at its natural width (`content-width`).
- Point `targets` at the parts worth showing when the default rows are too fine or too coarse.

### Don't

- Don't put it where people expect to use the component.
- Don't run several on screen at once with the same `delay`.

## Related

- [Tilt Card](../motion/tilt-card.md) – A card that tilts in 3D towards the pointer, with a soft glare that follows it and a smooth spring back
- [Loupe](../components/loupe.md) – A design-system inspector over the live page – components outlined with a card of their name, path and links, a breakpoint ruler, flex and grid containers listed – ⌘⇧L to turn it on
- [Agent Monitor](../components/agent-monitor.md) – One agent at work as a compact card – its current step with a clock and the cost so far, a strip of steps sized by duration, the finished steps, and Pause and Stop
- [Chat Composer](../components/chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane

## Changelog

- **Inspect Frame** illustration (`tc-inspect-frame`): any component seen like a selection in a design tool – tilted back, a cursor walks its measured rows while a frame, padding guides and a width chip draw round each; finite, and still under reduced motion.
