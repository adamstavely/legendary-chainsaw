<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# All Done

**Illustrations** · New

An empty tray with a check above it, with the words You're all caught up, for an inbox or queue with nothing waiting

- **Element:** `<tc-all-done>`
- **Size:** 5.0 KB gzip · 13.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/all-done";` |
| React / Next.js | `import "@adamstavely/trenchcoat/all-done";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/all-done";` · tags starting with tc- are custom elements |
| Angular | `import { AllDone } from "@adamstavely/trenchcoat/angular/all-done";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/all-done";` |

## Example

The live example is in the gallery at `#/illustrations/all-done`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An empty tray with a check above it, with the words You're all caught up. It's the positive empty state for an inbox, a queue or a to-do list when nothing is waiting – a finish, not a failure.

### When to use

- An inbox, review queue or notification list that's been cleared.
- A list of tasks where everything is done.

### When not to use

- A search or filter that matched nothing – use [Nothing Found](nothing-found.md).
- A workspace that's new and has nothing in it yet – use [First Use](first-use.md).
- A day or week with nothing scheduled – use [Empty Calendar](empty-calendar.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tray** `.ui-ald-tray` – the empty tray, with its rim `.ui-ald-rim`
2. **Mark** `.ui-ald-mark` – the round badge with the check `.ui-ald-check`
3. **Words** `.ui-ald-caption` – what's happened; the default is You're all caught up

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Usage

### HTML

```html
<tc-all-done></tc-all-done>

<script type="module">
  import "@adamstavely/trenchcoat/all-done";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { AllDone } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <AllDone />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/all-done";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-all-done></tc-all-done>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { AllDone } from "@adamstavely/trenchcoat/angular/all-done";

@Component({
  selector: "app-all-done-example",
  imports: [AllDone],
  template: `<tc-all-done></tc-all-done>`,
})
export class AllDoneExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/all-done";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAllDone } from "@adamstavely/trenchcoat/all-done";

  let el: TcAllDone;
</script>

<tc-all-done bind:this={el}></tc-all-done>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `caption` | `caption` | `string` | `"You're all caught up"` | The words under the drawing; "" leaves them out |
| `label` | `label` | `string` | `""` | Accessible description, when it should say more than `caption` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-all-done-tray` | `light-dark(#ffffff, #2a2a2e)` | both |
| `--tc-all-done-edge` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.1))` | both |
| `--tc-all-done-rim` | `light-dark(#e6e9ee, #44464d)` | both |
| `--tc-all-done-mark` | `light-dark(#dcf3e4, #1f3d2b)` | both |
| `--tc-all-done-mark-edge` | `light-dark(#8fd1a8, #5fae7d)` | both |
| `--tc-all-done-ink` | `light-dark(#1f6b3d, #c8efd6)` | both |
| `--tc-all-done-glow` | `light-dark(rgba(110, 200, 145, 0.24), rgba(110, 200, 145, 0.12))` | both |
| `--tc-all-done-soft` | `12px` | both |
| `--tc-all-done-beat` | `3s` | both |

#### Design tokens it reads (8)

`--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-weight-medium`, `--tc-line-height-tight`, `--tc-text-primary`

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-all-done")` returns a `TcAllDone` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAllDone } from "@adamstavely/trenchcoat/all-done";`
- **React / Next.js:** The element class: `import type { TcAllDone } from "@adamstavely/trenchcoat/all-done";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAllDone["caption"]` with `import type { TcAllDone } from "@adamstavely/trenchcoat/all-done";`
- **Angular:** The directive types the template: `[caption]` takes `TcAllDone["caption"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAllDone } from "@adamstavely/trenchcoat/all-done";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAllDone } from "@adamstavely/trenchcoat/all-done";`

## Accessibility

### Keyboard

Nothing to operate. The illustration takes no focus.

### Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so the message is announced. With `caption=""` and no
`label` it's decorative and skipped, for when the words beside it say the same.

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

*Measured 2026-11-05 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 6.2 KB | 2.8 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **13.3 KB** | **5.0 KB** |
| With Lit – the first component on a page | 32.9 KB | 11.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 8 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 9.2 ms | default properties; includes adding its CSS to the document |

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

Keep it short and warm, and say what comes next if anything: "New proposals will show up here". Don't congratulate
people for an empty list they didn't empty.

## Do and don't

### Do

- Show it only when the list is truly empty, not while it's still loading.
- Offer a next step if there's a useful one, such as viewing what was done.

### Don't

- Don't use it when a filter hides items – say the filter is on and offer to clear it.
- Don't make it bigger than the list it replaces.

## Related

- [Nothing Found](nothing-found.md) – A magnifying glass passing over blank results, for a search or filter with no matches; it looks across a few times and rests
- [Awaiting Review](awaiting-review.md) – A document with an hourglass on it, with the words Awaiting review, for content held until someone approves it
- [Empty Calendar](empty-calendar.md) – Stack of calendar cards marked empty, fanning out on hover; the shimmer runs a few cycles and rests
- [First Use](first-use.md) – An empty workspace with one highlighted spot to start from, with the words Nothing here yet, for a new team or project
