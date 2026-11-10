<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Soup Cans

**Illustrations** · New

Three plain soup cans with no labels, standing together at different heights with ridge rings, for items that are there but not yet labelled or sorted

- **Element:** `<tc-soup-cans>`
- **Size:** 5.3 KB gzip · 15.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/soup-cans";` |
| React / Next.js | `import "@adamstavely/trenchcoat/soup-cans";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/soup-cans";` · tags starting with tc- are custom elements |
| Angular | `import { SoupCans } from "@adamstavely/trenchcoat/angular/soup-cans";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/soup-cans";` |

## Example

The live example is in the gallery at `#/illustrations/soup-cans`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Three plain soup cans with no labels, standing together at different heights – tall, medium and short – with ridge
rings round each. It's for things that are there but not yet named, sorted or described: uncategorised items, a pantry
or inventory, a pile to work through. The short can in front wobbles a couple of times and rests.

### When to use

- Items that have arrived but haven't been labelled, tagged or categorised.
- A pantry, stock or inventory page with nothing in it yet, or an onboarding step about sorting.

### When not to use

- A search or filter with no matches – use [Nothing Found](nothing-found.md).
- An inbox or queue with nothing left to do – use [All Done](all-done.md).
- A brand-new workspace – use [First Use](first-use.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Cans** `.ui-sop-can` – three tins, each with a body, rims, ridge rings `.ui-sop-ridge` and a lid; `.ui-sop-front` is the short one in front
2. **Glow** `.ui-sop-glow` – the soft shadow beneath the heap
3. **Words** `.ui-sop-caption` – optional; none by default

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Usage

### HTML

```html
<tc-soup-cans caption="Nothing sorted yet"></tc-soup-cans>

<script type="module">
  import "@adamstavely/trenchcoat/soup-cans";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { SoupCans } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <SoupCans caption="Nothing sorted yet" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/soup-cans";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-soup-cans></tc-soup-cans>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { SoupCans } from "@adamstavely/trenchcoat/angular/soup-cans";

@Component({
  selector: "app-soup-cans-example",
  imports: [SoupCans],
  template: `<tc-soup-cans></tc-soup-cans>`,
})
export class SoupCansExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/soup-cans";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSoupCans } from "@adamstavely/trenchcoat/soup-cans";

  let el: TcSoupCans;
</script>

<tc-soup-cans bind:this={el}></tc-soup-cans>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `caption` | `caption` | `string` | `""` | Words under the drawing, which also name it; "" (the default) leaves them out |
| `label` | `label` | `string` | `""` | Accessible name without visible words; with neither, it's decorative |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-soup-cans-tin` | `light-dark(#e3e9f2, #2f3846)` | both |
| `--tc-soup-cans-shade` | `light-dark(#cdd7e5, #262d39)` | both |
| `--tc-soup-cans-lid` | `light-dark(#f1f4f9, #46526a)` | both |
| `--tc-soup-cans-well` | `light-dark(#dfe6f0, #36404f)` | both |
| `--tc-soup-cans-edge` | `light-dark(#a7b6cc, #8293ad)` | both |
| `--tc-soup-cans-ink` | `light-dark(#4a5d7a, #d6dfec)` | both |
| `--tc-soup-cans-glow` | `light-dark(rgba(130, 150, 190, 0.26), rgba(130, 150, 190, 0.13))` | both |
| `--tc-soup-cans-soft` | `12px` | both |
| `--tc-soup-cans-beat` | `3.2s` | both |

#### Design tokens it reads (7)

`--tc-ease-move`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-weight-medium`, `--tc-line-height-tight`, `--tc-text-primary`

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

*Also attributes: `caption`, `label` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-soup-cans")` returns a `TcSoupCans` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSoupCans } from "@adamstavely/trenchcoat/soup-cans";`
- **React / Next.js:** The element class: `import type { TcSoupCans } from "@adamstavely/trenchcoat/soup-cans";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSoupCans["caption"]` with `import type { TcSoupCans } from "@adamstavely/trenchcoat/soup-cans";`
- **Angular:** The directive types the template: `[caption]` takes `TcSoupCans["caption"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSoupCans } from "@adamstavely/trenchcoat/soup-cans";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSoupCans } from "@adamstavely/trenchcoat/soup-cans";`

## Accessibility

### Keyboard

Nothing to operate. The illustration takes no focus.

### Screen readers

Decorative by default, and skipped. Give it a `caption` to show words under it, which also name it, or a `label` to
name it without showing anything; the host is then `role="img"`.

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
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 8.4 KB | 3.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **15.5 KB** | **5.3 KB** |
| With Lit – the first component on a page | 35.0 KB | 11.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 31 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 3.4 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

When it stands for a state, say it in words beside it or as the caption: "Nothing sorted yet", and what to do next.

## Do and don't

### Do

- Pair it with the action that gives things their labels: "Add categories".
- Keep it at a size where the three cans read; it works from about 160px wide.

### Don't

- Don't put words or logos on the cans; they're unlabeled on purpose.
- Don't use it for an error.

## Related

- [All Done](all-done.md) – An empty tray with a check above it, with the words You're all caught up, for an inbox or queue with nothing waiting
- [First Use](first-use.md) – An empty workspace with one highlighted spot to start from, with the words Nothing here yet, for a new team or project
- [Nothing Found](nothing-found.md) – A magnifying glass passing over blank results, for a search or filter with no matches; it looks across a few times and rests
- [Awaiting Review](awaiting-review.md) – A document with an hourglass on it, with the words Awaiting review, for content held until someone approves it

## Changelog

- **Soup Cans** (`tc-soup-cans`): three unlabeled tins standing at different heights, for things not yet labelled or sorted.
