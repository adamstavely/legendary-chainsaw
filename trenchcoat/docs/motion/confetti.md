<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Confetti

**Motion** · New

A celebration for a finished milestone – paper that bursts out of what it wraps or rains from the top of the viewport, flutters and falls in the theme's chart colours on one canvas that's gone when it settles, with words for screen readers and a brief tint instead under reduced motion

- **Element:** `<tc-confetti>`
- **Size:** 6.2 KB gzip · 15.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/confetti";` |
| React / Next.js | `import "@adamstavely/trenchcoat/confetti";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/confetti";` · tags starting with tc- are custom elements |
| Angular | `import { Confetti } from "@adamstavely/trenchcoat/angular/confetti";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/confetti";` |

## Example

The live example is in the gallery at `#/motion/confetti`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A celebration for a finished milestone. Wrap what it celebrates, such as a Close review button, and call `fire()`, change `fire-key`, or set `trigger="click"`: paper bursts up out of the content, flutters and falls, and is gone. Bare, or with `origin="viewport-top"`, it rains from the top of the viewport. It never fires when first shown. The pieces are drawn on one canvas over the page that only exists while something is falling, and their colours are the chart tokens, so they follow the theme. With reduced motion there's no paper: the content holds a brief success tint instead, and `announce` is still said.

### When to use

- The end of something people worked towards: all checks passed, a review closed, a long import finished.
- Once per milestone, right after the person's own action.

### When not to use

- Routine saves and small confirmations – use Success Check.
- Drawing the eye to something new – use Attention Pulse.
- Anything that went wrong or needs a decision.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Host** `[data-ui="cft"]` – wraps the content; holds the reduced-motion tint
2. **Canvas** `.ui-cft__canvas` – over the whole viewport while pieces fall, in the top layer where the Popover API exists; never takes the pointer
3. **Status** `.ui-cft__status` – a visually hidden polite live region for `announce`

## Looks

No look of its own. The pieces use `--tc-chart-1` to `--tc-chart-6` and `--tc-status-success-fg`, or the `colors` you pass (any CSS colour, `var(--token)` included). A page can set `--tc-confetti-tint`, `--tc-confetti-ring` and `--tc-confetti-radius` for the reduced-motion tint.

## Usage

### HTML

```html
<tc-confetti trigger="click" announce="Review closed"><button type="button">Close review</button></tc-confetti>

<script type="module">
  import "@adamstavely/trenchcoat/confetti";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { useRef } from "react";
import { Confetti } from "@adamstavely/trenchcoat/react";
import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";

export function Reconciled({ onClose }: { onClose: () => void }) {
  const confetti = useRef<TcConfetti>(null);
  return (
    <Confetti ref={confetti} announce="Review closed">
      <button type="button" onClick={() => { onClose(); confetti.current?.fire(); }}>Close review</button>
    </Confetti>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/confetti";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";

defineProps<{ colors: TcConfetti["colors"] }>();
const onConfettiDone = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-confetti :colors="colors" @tc-confetti-done="onConfettiDone"></tc-confetti>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Confetti } from "@adamstavely/trenchcoat/angular/confetti";
import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";

@Component({
  selector: "app-confetti-example",
  imports: [Confetti],
  template: `<tc-confetti [colors]="colors()" (tc-confetti-done)="onConfettiDone($event)"></tc-confetti>`,
})
export class ConfettiExample {
  readonly colors = input.required<TcConfetti["colors"]>();
  onConfettiDone(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/confetti";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";

  let { colors }: { colors: TcConfetti["colors"] } = $props();
  let el: TcConfetti;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-confetti-done", on);
    return () => el.removeEventListener("tc-confetti-done", on);
  });
</script>

<tc-confetti bind:this={el} {colors}></tc-confetti>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `fireKey` | `fire-key` | `string \| number \| undefined` | `undefined` | Change this to fire once; never fires on first render |
| `trigger` | `trigger` | `"none" \| "click"` | `"none"` | "click" fires when the wrapped content is clicked |
| `count` | `count` | `number` | `80` | Pieces per burst (capped at 300) |
| `spread` | `spread` | `number` | `70` | Width of the cone the pieces leave in, in degrees |
| `origin` | `origin` | `ConfettiOrigin` | `"self"` | Where a burst starts: "self" (the wrapped content; the viewport's top when bare), "viewport-top", or "x,y" in viewport pixels |
| `colors` | – | `string[]` | `["var(--tc-chart-1)", "var(--tc-chart-2)", "var(--tc-chart-3)", "var(--tc-chart-4)", "var(--tc-chart-5)", "var(--tc-chart-6)", "var(--tc-status-success-fg)"]` | CSS colours for the pieces; by default the chart tokens and the success colour |
| `seed` | `seed` | `number` | `1` | Seed for the pattern; each burst uses the next one |
| `announce` | `announce` | `string` | `""` | Said politely once per burst, e.g. "Review closed" |
| `active` | – | `` | – | Pieces in the air now |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-confetti-done` | – | No | The last piece has settled and the canvas is gone ({ bursts }: ConfettiDone) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `fire(options: ConfettiOptions)` | `void` | Fires a burst – options override the attributes for this one |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-confetti-tint` | `var(--tc-status-success-bg)` | both |
| `--tc-confetti-ring` | `var(--tc-status-success-fg)` | both |
| `--tc-confetti-radius` | `var(--tc-control-radius-md)` | both |

#### Design tokens it reads (5)

`--tc-control-radius-md`, `--tc-duration-reveal-slow`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-z-drag`

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
| `colors` | `el.colors = …;` | `<… colors={…} />` | `<tc-confetti :colors="…">` | `<tc-confetti [colors]="…">` | `<tc-confetti {colors}>` |

*Also attributes: `fire-key`, `trigger`, `count`, `spread`, `origin`, `seed`, `announce` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-confetti-done` | No | `el.addEventListener("tc-confetti-done", (e) => …)` | `ref.current.addEventListener("tc-confetti-done", …)` | `@tc-confetti-done="…"` | `(tc-confetti-done)="…($event)"` | `el.addEventListener("tc-confetti-done", …)` |

*React: events without a prop are listened to on the element through a ref.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-confetti")` returns a `TcConfetti` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";`
- **React / Next.js:** The element class: `import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcConfetti["colors"]` with `import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";`
- **Angular:** The directive types the template: `[colors]` takes `TcConfetti["colors"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcConfetti } from "@adamstavely/trenchcoat/confetti";`

## Accessibility

### Keyboard

Nothing of its own to operate. With `trigger="click"`, the wrapped button fires it from the keyboard as it does from the pointer.

### Screen readers

The canvas is hidden from assistive technology. Set `announce` to say what happened ("Review closed"); it's read once per burst, also with reduced motion.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | itself | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 8.7 KB | 4.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.7 KB** | **6.2 KB** |
| With Lit – the first component on a page | 35.4 KB | 12.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 1 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of colors replaced |
| First on the page | 4.7 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.5 ms | colors: first render, 1 nodes; update 0.1 ms |
| 1,000 items | 0.7 ms | colors: first render, 1 nodes; update 0.0 ms |

What it renders doesn't grow with colors (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window resize`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

`count` sets the pieces per burst (80 by default, at most 300), `spread` the cone's width in degrees, and `seed` the pattern – each burst uses the next seed, so a page that sets one falls the same way every time. `origin` is `self`, `viewport-top` or `x,y` in viewport pixels; `fire({ count, spread, origin, colors, seed })` overrides them for one burst. `tc-confetti-done` fires when the last piece has settled and the canvas is gone.

## Do and don't

### Do

- Keep it for real milestones, so it still means something.
- Say what happened in words as well, with `announce` or on the page.

### Don't

- Don't fire it on page load or on a timer.
- Don't fire it for every row in a list – one burst for the whole job.

## Related

- [Success Check](success-check.md) – A small tick that draws itself once, for shared or saved, and then rests
- [Attention Pulse](attention-pulse.md) – Draws the eye once – a soft ring passes around something new a single time, and never on page load
- [Status Morph](status-morph.md) – One state's mark changing into the next with its word – pending, checking, done, failed or warning – with polite announcing on request
- [Number Ticker](number-ticker.md) – Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once
