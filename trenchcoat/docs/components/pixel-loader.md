<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Pixel Loader

**AI & chat** · New

A small working row – a 5 × 5 grid of dots lit in a wave, a snake, a twinkle or an orbit, a shimmering label and the time since the work started, settling into a check or a cross when it ends

- **Element:** `<tc-pixel-loader>`
- **Size:** 9.8 KB gzip · 33.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/pixel-loader";` |
| React / Next.js | `import "@adamstavely/trenchcoat/pixel-loader";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/pixel-loader";` · tags starting with tc- are custom elements |
| Angular | `import { PixelLoader } from "@adamstavely/trenchcoat/angular/pixel-loader";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/pixel-loader";` |

## Example

The live example is in the gallery at `#/pixel-loader`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Superseded by [Thinking Loader](thinking-loader.md) with `mark="pixels"`, which does everything here and more (phases,
a cross on error, the rays mark). `<tc-pixel-loader>` stays as that element with Pixel Loader's own look and the same
properties, so existing pages keep working; use Thinking Loader for new ones.

A small row that says some work is under way: a 5 × 5 grid of dots lit in a pattern, a label with a light sweeping
over it, and how long the work has taken so far – 0.2s, 12s, 1m 4s. Four patterns give different kinds of work their
own feel: a diagonal wave, a lit dot driving a snake path, a seeded twinkle and an orbit round the edge. When the work
ends, the dots settle into a check for done or a cross for an error, and the clock stops.

### When to use

- A step that takes a few seconds or more, where seeing the time pass reassures – reading files, matching records,
  exporting.
- Several jobs at once, each with its own pattern so they're told apart at a glance.
- A row in a list of tasks, with `size="sm"`.

### When not to use

- The gap before a chat reply, with phases – use [Thinking Loader](thinking-loader.md).
- Showing the sources and reasoning steps as they happen – use [Thinking State](thinking-state.md).
- Long jobs people leave and come back to – use [Background Tasks](background-tasks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Grid** `.ui-pxl__grid` – 25 dots, `.ui-pxl__dot`, lit in the pattern, then in a check or a cross
2. **Label** `.ui-pxl__label` – what the work is, with `.ui-pxl__shine` sweeping over it while it runs
3. **Time** `.ui-pxl__time` – the time since `started`
4. **Status** `.ui-pxl__sr` – the hidden line screen readers announce

## Looks

Standard is a capsule with a hairline border and dark dots. Clean is a white chip with a hairline shadow and accent
dots. Done lights the check in the success colour; error lights the cross in the danger colour – the shape says it as
well as the colour. Pages can resize the grid with `--tc-pixel-loader-dot` and `--tc-pixel-loader-gap`, and slow or
speed the pattern with `--tc-pixel-loader-cycle`.

## Usage

### HTML

```html
<tc-pixel-loader id="loader" label="Reading the audit log" pattern="orbit"></tc-pixel-loader>

<script type="module">
  import "@adamstavely/trenchcoat/pixel-loader";
  import "@adamstavely/trenchcoat/tokens.css";

  const loader = document.querySelector("#loader");
  loader.started = Date.now() - 1200;
  // Later, when the work ends:
  setTimeout(() => (loader.state = "done"), 4000);
</script>
```

### React / Next.js

```tsx
import { PixelLoader } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Export({ done, started }: { done: boolean; started: number }) {
  return <PixelLoader label="Exporting the register" pattern="drive" started={started} state={done ? "done" : "working"} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/pixel-loader";
import "@adamstavely/trenchcoat/tokens.css";

const onPhaseChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-pixel-loader @tc-phase-change="onPhaseChange"></tc-pixel-loader>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { PixelLoader } from "@adamstavely/trenchcoat/angular/pixel-loader";

@Component({
  selector: "app-pixel-loader-example",
  imports: [PixelLoader],
  template: `<tc-pixel-loader (tc-phase-change)="onPhaseChange($event)"></tc-pixel-loader>`,
})
export class PixelLoaderExample {
  onPhaseChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/pixel-loader";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPixelLoader } from "@adamstavely/trenchcoat/pixel-loader";

  let el: TcPixelLoader;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-phase-change", on);
    return () => el.removeEventListener("tc-phase-change", on);
  });
</script>

<tc-pixel-loader bind:this={el}></tc-pixel-loader>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-phase-change` | – | Yes | The timer moved to another phase (detail: { phase: number }); cancelable – the phase stays if a listener calls preventDefault() |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-pixel-loader-dot` | `3px` | both |
| `--tc-pixel-loader-gap` | `2px` | both |
| `--tc-pixel-loader-ink` | `var(--tc-accent)` | standard, clean |
| `--tc-pixel-loader-shine` | `light-dark(rgba(255, 255, 255, 0.85), #ffffff)` | standard, clean |

#### Design tokens it reads (25)

`--tc-accent`, `--tc-border-default`, `--tc-control-h-sm`, `--tc-duration-shimmer`, `--tc-duration-slower`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

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

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-phase-change` | Yes | `el.addEventListener("tc-phase-change", (e) => …)` | `ref.current.addEventListener("tc-phase-change", …)` | `@tc-phase-change="…"` | `(tc-phase-change)="…($event)"` | `el.addEventListener("tc-phase-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

`tc-phase-change` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-pixel-loader")` returns a `TcPixelLoader` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPixelLoader } from "@adamstavely/trenchcoat/pixel-loader";`
- **React / Next.js:** The element class: `import type { TcPixelLoader } from "@adamstavely/trenchcoat/pixel-loader";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPixelLoader["look"]` with `import type { TcPixelLoader } from "@adamstavely/trenchcoat/pixel-loader";`
- **Angular:** The directive types the template: `[look]` takes `TcPixelLoader["look"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPixelLoader } from "@adamstavely/trenchcoat/pixel-loader";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPixelLoader } from "@adamstavely/trenchcoat/pixel-loader";`

## Accessibility

### Keyboard

Nothing to operate – the loader only reports.

### Screen readers

A hidden `role="status"` line announces the label when the loader appears and again when the work ends (“Done:
Exporting the register”, “Failed: Uploading to the archive”). The grid, the moving label and the ticking time are
hidden, so the time isn't read out every tenth of a second.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, thinking-loader, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself, thinking-loader | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, thinking-loader, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | thinking-loader | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself, thinking-loader | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, internal/pixel-mark, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 4.2 KB | 1.5 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/pixel-mark` · Shared Trenchcoat code | 3.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [thinking-loader](thinking-loader.md) · Element it renders | 16.8 KB | – |
| **Added to a page that already has Lit** | **33.7 KB** | **9.8 KB** |
| With Lit – the first component on a page | 53.9 KB | 16.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 32 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **9 timer callbacks/s** on screen, **9 timer callbacks/s** scrolled away, **9 timer callbacks/s** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared` (thinking-loader).
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (thinking-loader), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Reads the clock: `Date.now()` (thinking-loader).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the label as a short present-tense activity, sentence case, no full stop: “Reading the audit log”.
- Keep it to a few words – a long label is cut off.
- Rename the ending words with `labels` (`{ done, error }`) when the page has its own.

## Do and don't

### Do

- Pass `started` when the work began before the loader appeared, so the time is the real time.
- Set `state` to `done` or `error` as soon as you know – the clock stops there.
- Pass `now` from your own clock when many loaders share one page, so they tick together.

### Don't

- Don't leave a loader working after the work has ended; it keeps counting.
- Don't use the colour of the end shape alone to say what happened – keep the label clear.
- Don't put several loaders on the same piece of work.

## Related

- [Thinking Loader](thinking-loader.md) – A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check
- [Thinking State](thinking-state.md) – AI working panel with a live timer, searched sources and thinking steps that appear one by one
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
- [Diff Table](diff-table.md) – An AI's proposed edits to a table, reviewed in place – old values struck and new ones marked, added and removed rows, accept or reject per edit, per row or all, undo, a popover with the reason, and edits that sweep in while streaming
