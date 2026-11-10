<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Text Reveal

**Motion**

Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view

- **Element:** `<tc-text-reveal>`
- **Size:** 4.9 KB gzip · 13.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/text-reveal";` |
| React / Next.js | `import { TextReveal } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/text-reveal";` · tags starting with tc- are custom elements |
| Angular | `import { TextReveal } from "@adamstavely/trenchcoat/angular/text-reveal";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/text-reveal";` |

## Example

The live example is in the gallery at `#/motion/text-reveal`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Text that arrives piece by piece when it scrolls into view – word by word or letter by letter, each piece rising a
little out of a soft blur. It gives a headline or an intro sentence a moment of attention without moving the layout:
the text takes its full space from the start. Font, size and colour come from the surrounding page; `as` makes it a
paragraph, a heading (h1–h3) or inline text.

### When to use

- A hero headline or the one sentence that introduces a feature, onboarding step or empty state.
- Section headings on a marketing or announcement page, revealed as people scroll.
- Short lines – a heading or a sentence or two.

### When not to use

- Swapping one piece of content for another in place – use [Blur Crossfade](blur-crossfade.md).
- Drawing attention to a word with colour instead of motion – use [Gradient Text](gradient-text.md).
- A number that changes – use [Number Ticker](number-ticker.md).
- Body text, labels, buttons and anything people need to read straight away – show it without motion.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Piece** `[as="p"] .ui-trv__p` – one word (or one letter) that fades and rises in
2. **Word** `.ui-trv__w` – letter by letter, the letters of one word, kept together so it doesn't break across lines

## Usage

### HTML

```html
<tc-text-reveal id="headline" as="h2" by="char"></tc-text-reveal>

<script type="module">
  import "@adamstavely/trenchcoat/text-reveal";
  import "@adamstavely/trenchcoat/tokens.css";

  const headline = document.querySelector("#headline");
  headline.text = "Meet your new teammate.";
  headline.stagger = 30;
</script>
```

### React / Next.js

```tsx
import { TextReveal } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Hero() {
  return (
    <header>
      <TextReveal as="h1" by="char" stagger={30} text="Meet your new teammate." />
      <TextReveal delay={700} text="It reads the brief, drafts the plan and checks in before anything ships." />
    </header>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/text-reveal";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-text-reveal></tc-text-reveal>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { TextReveal } from "@adamstavely/trenchcoat/angular/text-reveal";

@Component({
  selector: "app-text-reveal-example",
  imports: [TextReveal],
  template: `<tc-text-reveal></tc-text-reveal>`,
})
export class TextRevealExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/text-reveal";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTextReveal } from "@adamstavely/trenchcoat/text-reveal";

  let el: TcTextReveal;
</script>

<tc-text-reveal bind:this={el}></tc-text-reveal>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The text to reveal |
| `by` | `by` | `TextRevealBy` | `"word"` | Reveal word by word or letter by letter |
| `stagger` | `stagger` | `number` | `40` | Time between two pieces, in ms |
| `delay` | `delay` | `number` | `0` | Wait before the first piece, in ms |
| `duration` | `duration` | `number` | `700` | Time each piece takes to arrive, in ms |
| `as` | `as` | `TextRevealTag` | `"p"` | What the text is: a paragraph, a heading (h1–h3, the host becomes a heading of that level) or inline text |
| `once` | `once` | `boolean` | `true` | Reveal only the first time; false plays it again each time it enters the view (attribute: once="false") |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-text-reveal-heading-weight` | `bold` | both |
| `--tc-text-reveal-blur` | `8px` | both |
| `--tc-text-reveal-rise` | `0.35em` | both |

#### Design tokens it reads (5)

`--tc-ease-emphasized`, `--tc-text-reveal-delay`, `--tc-text-reveal-duration`, `--tc-text-reveal-i`, `--tc-text-reveal-stagger`

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

*Also attributes: `text`, `by`, `stagger`, `delay`, `duration`, `as`, `once` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-text-reveal")` returns a `TcTextReveal` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTextReveal } from "@adamstavely/trenchcoat/text-reveal";`
- **React / Next.js:** Props: `import type { TextRevealProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TextReveal>`. The element class, for refs: `import type { TcTextReveal } from "@adamstavely/trenchcoat/text-reveal";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTextReveal["text"]` with `import type { TcTextReveal } from "@adamstavely/trenchcoat/text-reveal";`
- **Angular:** The directive types the template: `[text]` takes `TcTextReveal["text"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTextReveal } from "@adamstavely/trenchcoat/text-reveal";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTextReveal } from "@adamstavely/trenchcoat/text-reveal";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `text` | `string` | The text to reveal |
| `by` | `"word" \| "char"` | Reveal word by word or letter by letter |
| `stagger` | `number` | Time between two pieces, in ms |
| `delay` | `number` | Wait before the first piece, in ms |
| `duration` | `number` | Time each piece takes to arrive, in ms |
| `as` | `"p" \| "h1" \| "h2" \| "h3" \| "span"` | What the text is: a paragraph, a heading or inline text |
| `once` | `boolean` | Reveal only the first time; otherwise it plays again each time it enters the view |
| `className` | `string` | Class names for the root element |
| `ref` | `React.Ref<TcTextReveal>` | The root element |

*Renamed or hidden on the wrapper: `word`, `char`, `p`, `h1`, `h2`, `h3`, `span`*

## Accessibility

### Screen readers

The moving pieces are hidden; screen readers read one visually hidden copy of the whole text at once, so it isn't
spelled out letter by letter. With `as="h1"`, `"h2"` or `"h3"` the element is a heading of that level
(`role="heading"`, `aria-level`), and it appears in the page's heading outline. With reduced motion the text is
shown at once, without the blur or the rise.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This piece alone** | 6.8 KB | 2.9 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **13.4 KB** | **4.9 KB** |
| With Lit – the first component on a page | 34.2 KB | 11.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 26 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | re-render with the same data |
| First on the page | 5.6 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep it to a headline or a sentence or two – a long paragraph takes too long to arrive.
- Use `by="char"` for short headlines and the default `by="word"` for sentences.
- Write the text as plain text in `text`; markup inside it isn't rendered.

## Do and don't

### Do

- Stagger a heading and its subline with `delay`, so the subline starts as the heading finishes.
- Use `as` to give a heading its level, rather than wrapping the element in an `h2`.
- Set `once="false"` only where replaying on every scroll adds something, such as a looping showcase.

### Don't

- Don't reveal several blocks on one screen at once – the motion competes with itself.
- Don't slow it down past what people will wait for: with the default 40 ms stagger, 30 words take over a second.

## Related

- [Number Ticker](number-ticker.md) – Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once
- [Gradient Text](gradient-text.md) – Letters cut from a liquid, flowing gradient – the color sweeps across the word the first time it's seen
- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
