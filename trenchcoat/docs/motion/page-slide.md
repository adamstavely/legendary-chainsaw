<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Page Slide

**Motion** · New

Views that slide side by side as you move between them – forward from the end, back from the start, with a touch of parallax, the height gliding along and focus landing on the new view's heading

- **Element:** `<tc-page-slide>`
- **Size:** 5.4 KB gzip · 14.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/page-slide";` |
| React / Next.js | `import { PageSlide } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/page-slide";` · tags starting with tc- are custom elements |
| Angular | `import { PageSlide } from "@adamstavely/trenchcoat/angular/page-slide";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/page-slide";` |

## Example

The live example is in the gallery at `#/motion/page-slide`, at 320 px, 480 px or full width.

## Overview

Moves between views by sliding them side by side. Change `view` and the old view slides out – a little behind, fading,
for a touch of depth – as the new one slides in from the side you're heading, while the box's height glides to fit.
Going forward brings the new view in from the end, going back from the start; the direction comes from `direction`,
or from where the two views sit in `order`. Give it every view as a child marked `data-view`, or only the current one
and swap it yourself – in React, render the current view inside `PageSlide`. When focus was inside the old view it
moves into the new one, and with `focus-heading` the new view's heading takes focus after every change, so
screen-reader users land on the new step. For people who ask for reduced motion, the views switch at once.

### When to use

- The steps of a short wizard – scope, evidence, sign-off – with Back and Next.
- Drilling from a list into an item's view and back, inside a panel or a card.
- Switching between sibling pages in a side pane.

### When not to use

- A status or a label that changes in place – use [Blur Crossfade](blur-crossfade.md).
- A card that grows into its own detail view – use [Shared Element](shared-element.md).
- A long form with its steps listed – use [Stepper Form](../components/stepper-form.md).
- Showing or hiding a section – use [Collapse](collapse.md).

## Usage

### HTML

```html
<tc-page-slide view="scope" focus-heading>
  <section data-view="scope"><h3>Scope</h3><p>Vendor payments, July to September.</p></section>
  <section data-view="evidence"><h3>Evidence</h3><p>38 payments still need an invoice.</p></section>
  <section data-view="sign-off"><h3>Sign-off</h3><p>Reviewer: Audit team B.</p></section>
</tc-page-slide>
<button type="button" id="next">Next</button>

<script type="module">
  import "@adamstavely/trenchcoat/page-slide";
  import "@adamstavely/trenchcoat/tokens.css";

  const steps = ["scope", "evidence", "sign-off"];
  const slide = document.querySelector("tc-page-slide");
  document.querySelector("#next").addEventListener("click", () => {
    slide.view = steps[Math.min(steps.indexOf(slide.view) + 1, steps.length - 1)];
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PageSlide } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const STEPS = ["Scope", "Evidence", "Sign-off"];

export function ReviewWizard() {
  const [at, setAt] = useState(0);
  return (
    <div>
      <PageSlide view={STEPS[at]} order={STEPS} focusHeading>
        <h3>{STEPS[at]}</h3>
      </PageSlide>
      <button type="button" disabled={at === 0} onClick={() => setAt(at - 1)}>Back</button>
      <button type="button" disabled={at === STEPS.length - 1} onClick={() => setAt(at + 1)}>Next</button>
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/page-slide";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-page-slide></tc-page-slide>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { PageSlide } from "@adamstavely/trenchcoat/angular/page-slide";

@Component({
  selector: "app-page-slide-example",
  imports: [PageSlide],
  template: `<tc-page-slide></tc-page-slide>`,
})
export class PageSlideExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/page-slide";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPageSlide } from "@adamstavely/trenchcoat/page-slide";

  let el: TcPageSlide;
</script>

<tc-page-slide bind:this={el}></tc-page-slide>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `view` | `view` | `string` | `""` | The key of the view on show – change it to slide to another view |
| `direction` | `direction` | `PageSlideDirection` | `"auto"` | Which way to slide: "forward" brings the new view in from the end, "back" from the start; "auto" works it out from `order` |
| `order` | `order` | `string[]` | `[]` | The views' keys in order, for "auto" (an attribute takes a comma-separated list); default: the data-view children's order |
| `focusHeading` | `focus-heading` | `boolean` | `false` | Move focus to the new view's heading after each change |
| `duration` | `duration` | `number \| undefined` | `undefined` | Length of the slide in ms; default the --tc-duration-slow token |

#### Design tokens it reads (3)

`--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`

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

*Also attributes: `view`, `direction`, `order`, `focus-heading`, `duration` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-page-slide")` returns a `TcPageSlide` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPageSlide } from "@adamstavely/trenchcoat/page-slide";`
- **React / Next.js:** Props: `import type { PageSlideProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PageSlide>`. The element class, for refs: `import type { TcPageSlide } from "@adamstavely/trenchcoat/page-slide";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPageSlide["view"]` with `import type { TcPageSlide } from "@adamstavely/trenchcoat/page-slide";`
- **Angular:** The directive types the template: `[view]` takes `TcPageSlide["view"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPageSlide } from "@adamstavely/trenchcoat/page-slide";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPageSlide } from "@adamstavely/trenchcoat/page-slide";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `view` | `string` | The key of the view on show – change it to slide to the new view |
| `children` | `React.ReactNode` | The current view only – it's rendered in a layer keyed by `view`, so a new view is a new layer and the old one slides out |
| `as` | `"div" \| "section"` | The layer element |

*Renamed or hidden on the wrapper: `div`, `section`*

## Accessibility

### Keyboard

Nothing to operate – your Back and Next buttons change `view`. When the change removes the element that had focus,
focus moves to the new view's heading (with `focus-heading`) or its first control, so it never drops to the page.

### Screen readers

Only the new view is read: the old one is `aria-hidden` and inert while it slides out, then hidden. With
`focus-heading` the new view's heading is focused, which reads it out; without it, say what changed in a live region
of your own if it matters.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This piece alone** | 7.5 KB | 3.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **14.2 KB** | **5.4 KB** |
| With Lit – the first component on a page | 33.8 KB | 11.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.3 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of order replaced |
| First on the page | 2.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.3 ms | order: first render, 0 nodes; update 0.0 ms |
| 1,000 items | 0.2 ms | order: first render, 0 nodes; update 0.0 ms |

What it renders doesn't grow with order (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Give every view a heading and set `focus-heading` for step-by-step flows.
- Pass `order` (or use `data-view` children in order) so Back slides the right way.
- Keep the views about the same width; the height is what glides.

### Don't

- Don't change `view` on a timer – people lose their place.
- Don't use it for the page's main routing; it's for a view inside a panel or card.

## Related

- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
- [Shared Element](shared-element.md) – A piece of content grows into its detail view, with focus moving along and Escape to close, so people keep their place
- [Stepper Form](../components/stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Collapse](collapse.md) – Content that glides open and shut to its real height, with nothing to measure, and can't be reached while shut
