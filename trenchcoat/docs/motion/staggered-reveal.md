<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Staggered Reveal

**Motion** · New

Children arrive one after another, once, the first time they're seen, with capped waits and nothing hidden without motion

- **Element:** `<tc-staggered-reveal>`
- **Size:** 4.2 KB gzip · 10.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/staggered-reveal";` |
| React / Next.js | `import "@adamstavely/trenchcoat/staggered-reveal";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/staggered-reveal";` · tags starting with tc- are custom elements |
| Angular | `import { StaggeredReveal } from "@adamstavely/trenchcoat/angular/staggered-reveal";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/staggered-reveal";` |

## Example

The live example is in the gallery at `#/motion/staggered-reveal`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Children arrive one after another, once, the first time they're seen. The waits are capped, so a long list doesn't keep anyone waiting. Only the animation hides children, so without JavaScript or with reduced motion they're simply there.

### When to use

- A list, set of cards or dashboard appearing for the first time.
- A short result set arriving together.

### When not to use

- Rows that are reordered, added or removed later – use [List Motion](list-motion.md).
- Text arriving word by word – use [Text Reveal](text-reveal.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Host** `[data-ui="srv"]` – each direct child arrives in turn

## Looks

No look of its own. It follows `--tc-duration-slow` and `--tc-ease-move`. Lay out its children by styling the element as you would the list.

## Usage

### HTML

```html
<tc-staggered-reveal><div>One</div><div>Two</div></tc-staggered-reveal>

<script type="module">
  import "@adamstavely/trenchcoat/staggered-reveal";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { StaggeredReveal } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Cards({ names }: { names: string[] }) {
  return <StaggeredReveal>{names.map((n) => <div key={n}>{n}</div>)}</StaggeredReveal>;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/staggered-reveal";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-staggered-reveal></tc-staggered-reveal>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { StaggeredReveal } from "@adamstavely/trenchcoat/angular/staggered-reveal";

@Component({
  selector: "app-staggered-reveal-example",
  imports: [StaggeredReveal],
  template: `<tc-staggered-reveal></tc-staggered-reveal>`,
})
export class StaggeredRevealExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/staggered-reveal";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStaggeredReveal } from "@adamstavely/trenchcoat/staggered-reveal";

  let el: TcStaggeredReveal;
</script>

<tc-staggered-reveal bind:this={el}></tc-staggered-reveal>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `delay` | `delay` | `number` | `60` | The wait between one child and the next, in ms |
| `maxDelay` | `max-delay` | `number` | `480` | The longest any child waits, in ms, however long the list is |
| `playKey` | `play-key` | `string \| number \| undefined` | `undefined` | Change this to play it again |

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

*Also attributes: `delay`, `max-delay`, `play-key` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-staggered-reveal")` returns a `TcStaggeredReveal` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStaggeredReveal } from "@adamstavely/trenchcoat/staggered-reveal";`
- **React / Next.js:** The element class: `import type { TcStaggeredReveal } from "@adamstavely/trenchcoat/staggered-reveal";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStaggeredReveal["delay"]` with `import type { TcStaggeredReveal } from "@adamstavely/trenchcoat/staggered-reveal";`
- **Angular:** The directive types the template: `[delay]` takes `TcStaggeredReveal["delay"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStaggeredReveal } from "@adamstavely/trenchcoat/staggered-reveal";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStaggeredReveal } from "@adamstavely/trenchcoat/staggered-reveal";`

## Accessibility

### Keyboard

Nothing to operate. Children can take focus as soon as they're there.

### Screen readers

It adds no role, and children are in the page throughout, so they're read in order.

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
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This piece alone** | 3.9 KB | 2.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **10.6 KB** | **4.2 KB** |
| With Lit – the first component on a page | 30.2 KB | 10.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 3.8 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Each direct child is one item. Children added later arrive without the stagger.

## Do and don't

### Do

- Keep `delay` short, and let `max-delay` do its job.

### Don't

- Don't use it on every view of a page people return to often. It only plays once for each element, so remounting it replays it.

## Related

- [List Motion](list-motion.md) – Rows that glide when reordered, added or removed, in any framework, instead of jumping
- [Text Reveal](text-reveal.md) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
- [Collapse](collapse.md) – Content that glides open and shut to its real height, with nothing to measure, and can't be reached while shut
