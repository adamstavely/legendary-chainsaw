<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Gradient Text

**Motion**

Letters cut from a liquid, flowing gradient – the color sweeps across the word the first time it's seen

- **Element:** `<tc-gradient-text>`
- **Size:** 5.5 KB gzip · 15.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/gradient-text";` |
| React / Next.js | `import { GradientText } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/gradient-text";` · tags starting with tc- are custom elements |
| Angular | `import { GradientText } from "@adamstavely/trenchcoat/angular/gradient-text";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/gradient-text";` |

## Example

The live example is in the gallery at `#/motion/gradient-text`, at 320 px, 480 px or full width.

## Overview

A word or short line whose letters are cut from a liquid gradient: a few soft colour blobs drift over a two-colour
base while the glyphs stay crisp. The first time the text scrolls into view, the colour sweeps across it from left to
right; the flow then runs for five seconds and comes to rest. It takes its font, size and weight from where it sits,
so it drops into a heading or a sentence without its own type styles.

### When to use

- One or two words a hero or empty state should draw the eye to: “Ship faster”, “liquid color”.
- A product name or the key phrase of a heading, set in large display type.

### When not to use

- Text that arrives as it's written or revealed word by word – use [Text Reveal](text-reveal.md).
- A number that changes – use [Number Ticker](number-ticker.md).
- A glow behind content rather than in the letters – use [Gradient Floor](gradient-floor.md).
- Text standing in for content that is still loading – use [Shimmer Loader](shimmer-loader.md).

## Usage

### HTML

```html
<h1 style="font-size: 56px; font-weight: 800">
  <tc-gradient-text id="hero" text="Ship faster"></tc-gradient-text>
</h1>

<script type="module">
  import "@adamstavely/trenchcoat/gradient-text";
  import "@adamstavely/trenchcoat/tokens.css";

  const word = document.querySelector("#hero");
  word.colors = ["#7c3aed", "#db2777", "#f59e0b", "#06b6d4"];
  word.speed = 6;
</script>
```

### React / Next.js

```tsx
import { GradientText } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Hero() {
  return (
    <div style={{ fontSize: 56, fontWeight: 800 }}>
      <GradientText as="h1">Ship faster</GradientText>
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/gradient-text";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGradientText } from "@adamstavely/trenchcoat/gradient-text";

defineProps<{ content: TcGradientText["content"]; colors: TcGradientText["colors"] }>();
</script>

<template>
  <tc-gradient-text :content="content" :colors="colors"></tc-gradient-text>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GradientText } from "@adamstavely/trenchcoat/angular/gradient-text";
import type { TcGradientText } from "@adamstavely/trenchcoat/gradient-text";

@Component({
  selector: "app-gradient-text-example",
  imports: [GradientText],
  template: `<tc-gradient-text [content]="content()" [colors]="colors()"></tc-gradient-text>`,
})
export class GradientTextExample {
  readonly content = input.required<TcGradientText["content"]>();
  readonly colors = input.required<TcGradientText["colors"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/gradient-text";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGradientText } from "@adamstavely/trenchcoat/gradient-text";

  let { content, colors }: { content: TcGradientText["content"]; colors: TcGradientText["colors"] } = $props();
  let el: TcGradientText;
</script>

<tc-gradient-text bind:this={el} {content} {colors}></tc-gradient-text>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The text |
| `content` | – | `Element \| undefined` | `undefined` | Rich content instead of `text`: an element that's cloned for the text and for its gradient copy |
| `colors` | – | `string[] \| undefined` | `undefined` | Gradient start, end and up to two blob colours: [start, end, blob, blob] |
| `speed` | `speed` | `number` | `8` | Seconds per flow cycle |
| `playFor` | `play-for` | `number` | `5` | Seconds the flow runs before it rests (on the nearest quarter cycle below); Infinity never stops – then give users a way to pause it (WCAG 2.2.2) |
| `sweep` | `sweep` | `boolean` | `true` | Sweep the colour in from left to right when the text scrolls into view (attribute: sweep="false" turns it off) |
| `as` | `as` | `GradientTextTag` | `"span"` | What the text is: inline text, a paragraph or a heading (h1, h2: the host becomes a heading of that level) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-gradient-text-c1` | `light-dark(#dd0674, #f472b6)` | both |
| `--tc-gradient-text-c2` | `light-dark(#5e3ee0, #a78bfa)` | both |
| `--tc-gradient-text-c3` | `light-dark(#ec4899, #f9a8d4)` | both |
| `--tc-gradient-text-c4` | `light-dark(#7c5cff, #c4b5fd)` | both |
| `--tc-gradient-text-sweep` | `1100ms` | both |
| `--tc-gradient-text-passes` | `infinite` | not set – this fallback applies |

#### Design tokens it reads (5)

`--tc-duration-base`, `--tc-duration-moderate`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-gradient-text-speed`

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
| `content` | `el.content = …;` | `<… content={…} />` | `<tc-gradient-text :content="…">` | `<tc-gradient-text [content]="…">` | `<tc-gradient-text {content}>` |
| `colors` | `el.colors = …;` | `<… colors={…} />` | `<tc-gradient-text :colors="…">` | `<tc-gradient-text [colors]="…">` | `<tc-gradient-text {colors}>` |

*Also attributes: `text`, `speed`, `play-for`, `sweep`, `as` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-gradient-text")` returns a `TcGradientText` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGradientText } from "@adamstavely/trenchcoat/gradient-text";`
- **React / Next.js:** Props: `import type { GradientTextProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GradientText>`. The element class, for refs: `import type { TcGradientText } from "@adamstavely/trenchcoat/gradient-text";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGradientText["content"]` with `import type { TcGradientText } from "@adamstavely/trenchcoat/gradient-text";`
- **Angular:** The directive types the template: `[content]` takes `TcGradientText["content"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGradientText } from "@adamstavely/trenchcoat/gradient-text";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGradientText } from "@adamstavely/trenchcoat/gradient-text";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | The text – a string, or rich content that is cloned for the text and its gradient copy |
| `colors` | `string[]` | Gradient start, end and up to two blob colors: [start, end, blob, blob] |
| `speed` | `number` | Seconds per flow cycle |
| `playFor` | `number` | Seconds the flow runs before it rests (on the nearest quarter cycle below); Infinity never stops – then give users a way to pause it (WCAG 2.2.2) |
| `sweep` | `boolean` | Sweep the color in from left to right when the text scrolls into view |
| `as` | `"span" \| "h1" \| "h2" \| "p"` | What the text is: inline text, a paragraph or a heading |
| `className` | `string` | Classes for the root element |
| `ref` | `React.Ref<TcGradientText>` | The root element |

*Renamed or hidden on the wrapper: `text`, `content`, `span`, `h1`, `h2`, `p`*

## Accessibility

### Screen readers

Screen readers read the plain text once; the gradient copy over it is hidden. With `as="h1"` or `as="h2"` the element
is a heading of that level. Reduced motion shows the finished gradient with no sweep or flow.

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
| **This piece alone** | 8.4 KB | 3.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.0 KB** | **5.5 KB** |
| With Lit – the first component on a page | 34.6 KB | 11.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 2 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 6.0 ms | default properties; includes adding its CSS to the document |

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

## Content

- Keep it to a few words – a whole paragraph of moving colour is hard to read.
- The default colours keep 3:1 for large display text; for body-size text pass `colors` with 4.5:1 against the
  background.
- If you set `playFor` to `Infinity`, give people a way to pause it.

## Related

- [Text Reveal](text-reveal.md) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
- [Number Ticker](number-ticker.md) – Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once
- [Gradient Floor](gradient-floor.md) – A blurred colour gradient that glows up from the bottom edge – two layers that drift and morph, then settle
- [Shimmer Loader](shimmer-loader.md) – Skeleton blocks with a soft light sweep on one beat, plus shimmering text for “Thinking…” states that stays readable
