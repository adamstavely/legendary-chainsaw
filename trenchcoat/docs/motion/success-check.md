<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Success Check

**Motion** · New

A small tick that draws itself once, for shared or saved, and then rests

- **Element:** `<tc-success-check>`
- **Size:** 4.2 KB gzip · 10.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/success-check";` |
| React / Next.js | `import "@adamstavely/trenchcoat/success-check";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/success-check";` · tags starting with tc- are custom elements |
| Angular | `import { SuccessCheck } from "@adamstavely/trenchcoat/angular/success-check";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/success-check";` |

## Example

The live example is in the gallery at `#/motion/success-check`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A small tick that draws itself once, for moments like shared or saved, then rests. It never loops, which suits calm, serious work.

### When to use

- Beside words that confirm something finished, such as Saved.
- A step that has just completed.

### When not to use

- Ongoing status – use [Progress Tracker](../components/progress-tracker.md).
- A message people must read – use [Toaster](../components/toaster.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Ring** `.ui-sck-ring` – the circle, drawn first
2. **Tick** `.ui-sck-tick` – drawn after it

## Looks

No look of its own. A page can set `--tc-success-check-size` and `--tc-success-check-color`.

## Usage

### HTML

```html
<tc-success-check></tc-success-check> Saved

<script type="module">
  import "@adamstavely/trenchcoat/success-check";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { SuccessCheck } from "@adamstavely/trenchcoat/react";

export function Saved() {
  return <span><SuccessCheck /> Saved</span>;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/success-check";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-success-check></tc-success-check>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { SuccessCheck } from "@adamstavely/trenchcoat/angular/success-check";

@Component({
  selector: "app-success-check-example",
  imports: [SuccessCheck],
  template: `<tc-success-check></tc-success-check>`,
})
export class SuccessCheckExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/success-check";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSuccessCheck } from "@adamstavely/trenchcoat/success-check";

  let el: TcSuccessCheck;
</script>

<tc-success-check bind:this={el}></tc-success-check>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Accessible description – when set, it's announced as an image; otherwise it's decorative |
| `playKey` | `play-key` | `string \| number \| undefined` | `undefined` | Change this to draw it again |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-success-check-size` | `1.25em` | both |
| `--tc-success-check-color` | `var(--tc-status-success-fg)` | both |

#### Design tokens it reads (4)

`--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-status-success-fg`

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

*Also attributes: `label`, `play-key` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-success-check")` returns a `TcSuccessCheck` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSuccessCheck } from "@adamstavely/trenchcoat/success-check";`
- **React / Next.js:** The element class: `import type { TcSuccessCheck } from "@adamstavely/trenchcoat/success-check";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSuccessCheck["label"]` with `import type { TcSuccessCheck } from "@adamstavely/trenchcoat/success-check";`
- **Angular:** The directive types the template: `[label]` takes `TcSuccessCheck["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSuccessCheck } from "@adamstavely/trenchcoat/success-check";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSuccessCheck } from "@adamstavely/trenchcoat/success-check";`

## Accessibility

### Keyboard

Nothing to operate. It takes no focus.

### Screen readers

Decorative by default and skipped, so put the words beside it. With `label` it's an image named by the label. It doesn't announce itself, so use a `role="status"` message for anything that matters.

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
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 4.1 KB | 2.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **10.8 KB** | **4.2 KB** |
| With Lit – the first component on a page | 30.4 KB | 10.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 3 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |

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

Pair it with a word or two, such as Shared.

## Do and don't

### Do

- Change `play-key` to draw it again after a later save.

### Don't

- Don't rely on the tick alone to say what happened.

## Related

- [Attention Pulse](attention-pulse.md) – Draws the eye once – a soft ring passes around something new a single time, and never on page load
- [Toaster](../components/toaster.md) – Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss
- [Progress Tracker](../components/progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Text Reveal](text-reveal.md) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view

## Changelog

- **Collapse** (`tc-collapse`), **Success Check** (`tc-success-check`) and **Attention Pulse** (`tc-attention-pulse`) – opening and shutting, a one-time tick, and a one-time ring to draw the eye.
