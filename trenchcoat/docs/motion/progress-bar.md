<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Progress Bar

**Motion** · New

A thin bar for a wait of known or unknown length – a value or a sweep, which fills and fades out when done

- **Element:** `<tc-progress-bar>`
- **Size:** 4.4 KB gzip · 11.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/progress-bar";` |
| React / Next.js | `import "@adamstavely/trenchcoat/progress-bar";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/progress-bar";` · tags starting with tc- are custom elements |
| Angular | `import { ProgressBar } from "@adamstavely/trenchcoat/angular/progress-bar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/progress-bar";` |

## Example

The live example is in the gallery at `#/motion/progress-bar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A thin bar for a page or panel. With `value` it shows how far along things are; without it, a sweep says work is happening. `done` fills it, fades it out and ends the sweep.

### When to use

- A page or panel loading, or one job running.
- A wait of a few seconds or more, where a spinner says too little.

### When not to use

- Placeholders for content that's on its way – use [Shimmer Loader](shimmer-loader.md).
- How much of a limit is used – use [Usage Meter](../components/usage-meter.md).
- Several jobs at once – use [Background Tasks](../components/background-tasks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Track** `.ui-pgb-track` – the `role="progressbar"`
2. **Fill** `.ui-pgb-fill` – how far along
3. **Word** `.ui-pgb-word` – shown beside a still bar with reduced motion

## Looks

No look of its own. A page can set `--tc-progress-bar-height`, `--tc-progress-bar-track` and `--tc-progress-bar-fill`.

## Usage

### HTML

```html
<tc-progress-bar label="Loading results"></tc-progress-bar>

<script type="module">
  import "@adamstavely/trenchcoat/progress-bar";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { ProgressBar } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Import({ share }: { share: number }) {
  return <ProgressBar label="Importing" value={share} done={share >= 1} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/progress-bar";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-progress-bar></tc-progress-bar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { ProgressBar } from "@adamstavely/trenchcoat/angular/progress-bar";

@Component({
  selector: "app-progress-bar-example",
  imports: [ProgressBar],
  template: `<tc-progress-bar></tc-progress-bar>`,
})
export class ProgressBarExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/progress-bar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProgressBar } from "@adamstavely/trenchcoat/progress-bar";

  let el: TcProgressBar;
</script>

<tc-progress-bar bind:this={el}></tc-progress-bar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `number \| undefined` | `undefined` | How far along, 0 to 1. Unset, the length of the wait isn't known |
| `label` | `label` | `string` | `"Loading"` | What's being waited for: names the bar |
| `done` | `done` | `boolean` | `false` | The work has finished: fills the bar and fades it out |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-progress-bar-height` | `3px` | both |
| `--tc-progress-bar-track` | `var(--tc-meter-track)` | both |
| `--tc-progress-bar-fill` | `var(--tc-meter-fill)` | both |

#### Design tokens it reads (11)

`--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-size-xs`, `--tc-meter-fill`, `--tc-meter-track`, `--tc-radius-full`, `--tc-space-1`, `--tc-text-secondary`

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

*Also attributes: `value`, `label`, `done` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-progress-bar")` returns a `TcProgressBar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProgressBar } from "@adamstavely/trenchcoat/progress-bar";`
- **React / Next.js:** The element class: `import type { TcProgressBar } from "@adamstavely/trenchcoat/progress-bar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProgressBar["value"]` with `import type { TcProgressBar } from "@adamstavely/trenchcoat/progress-bar";`
- **Angular:** The directive types the template: `[value]` takes `TcProgressBar["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProgressBar } from "@adamstavely/trenchcoat/progress-bar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProgressBar } from "@adamstavely/trenchcoat/progress-bar";`

## Accessibility

### Keyboard

Nothing to operate. It takes no focus.

### Screen readers

The track is a `progressbar` named by `label`, with `aria-valuenow` as a percentage when `value` is known and none when it isn't.

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
| **This piece alone** | 4.9 KB | 2.3 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **11.6 KB** | **4.4 KB** |
| With Lit – the first component on a page | 32.3 KB | 11.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 3 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 5.7 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Write `label` as what's being waited for: "Loading results". An unknown wait sweeps until `done`, so always set `done` or remove it.

## Do and don't

### Do

- Set `value` when you know it. A real number is more reassuring than a sweep.

### Don't

- Don't leave an unknown wait sweeping if the work failed. Replace it with what went wrong.

## Related

- [Shimmer Loader](shimmer-loader.md) – Skeleton blocks with a soft light sweep on one beat, plus shimmering text for “Thinking…” states that stays readable
- [Usage Meter](../components/usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Progress Tracker](../components/progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Background Tasks](../components/background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
