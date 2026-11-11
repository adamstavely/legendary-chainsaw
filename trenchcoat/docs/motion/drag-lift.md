<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Drag Lift

**Motion** · New

Lifts its child while it's dragged – it follows the pointer and leaves a gap, Escape cancels and it glides home, and where it lands is the page's call

- **Element:** `<tc-drag-lift>`
- **Size:** 4.8 KB gzip · 12.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/drag-lift";` |
| React / Next.js | `import "@adamstavely/trenchcoat/drag-lift";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/drag-lift";` · tags starting with tc- are custom elements |
| Angular | `import { DragLift } from "@adamstavely/trenchcoat/angular/drag-lift";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/drag-lift";` |

## Example

The live example is in the gallery at `#/motion/drag-lift`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Picks its child up while it's dragged: it lifts, follows the pointer and leaves a gap where it was. It's only the lift. Where things land is the page's call, so use `tc-list-motion` for rows that move once dropped.

### When to use

- Anything people drag, where the page decides what dropping does.
- Cards on a board, or tasks moving between lists.

### When not to use

- Rows gliding after a reorder – use [List Motion](list-motion.md).
- A complete board with dropping built in – use [Task Board](../blocks/task-board.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Host** `[data-ui="dlf"]` – shows the gap while `data-lifted`
2. **Child** `[data-ui="dlf"] > :first-child` – what's lifted
3. **Handle** `[data-drag-handle]` – optional; touch drags only from it

## Looks

No look of its own. A page can set `--tc-drag-lift-scale`, `--tc-drag-lift-shadow`, `--tc-drag-lift-gap` and `--tc-drag-lift-radius`.

## Usage

### HTML

```html
<tc-drag-lift><div><span data-drag-handle>⠿</span> A card</div></tc-drag-lift>

<script type="module">
  import "@adamstavely/trenchcoat/drag-lift";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { DragLift } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Card() {
  return (
    <DragLift onTcDragEnd={(e) => console.log(e.detail.x, e.detail.y)}>
      <div>A card</div>
    </DragLift>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/drag-lift";
import "@adamstavely/trenchcoat/tokens.css";

const onDragStart = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-drag-lift @tc-drag-start="onDragStart"></tc-drag-lift>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { DragLift } from "@adamstavely/trenchcoat/angular/drag-lift";

@Component({
  selector: "app-drag-lift-example",
  imports: [DragLift],
  template: `<tc-drag-lift (tc-drag-start)="onDragStart($event)"></tc-drag-lift>`,
})
export class DragLiftExample {
  onDragStart(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/drag-lift";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDragLift } from "@adamstavely/trenchcoat/drag-lift";

  let el: TcDragLift;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-drag-start", on);
    return () => el.removeEventListener("tc-drag-start", on);
  });
</script>

<tc-drag-lift bind:this={el}></tc-drag-lift>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `disabled` | `disabled` | `boolean` | `false` | Turn dragging off |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-drag-start` | – | Yes | The drag began ({ x, y }: DragLiftMove); cancelable – prevented, nothing lifts |
| `tc-drag-end` | – | Yes | The child was let go ({ x, y }: DragLiftMove); cancelable – prevented, the page has placed it and it doesn't glide home |
| `tc-drag-cancel` | – | No | Escape cancelled the drag ({ x, y }: DragLiftMove) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-drag-lift-scale` | `1.02` | both |
| `--tc-drag-lift-shadow` | `var(--tc-menu-shadow)` | both |
| `--tc-drag-lift-gap` | `var(--tc-border-strong)` | both |
| `--tc-drag-lift-radius` | `var(--tc-control-radius-md)` | both |
| `--tc-dlf-x` | `0` | not set – this fallback applies |
| `--tc-dlf-y` | `0` | not set – this fallback applies |

#### Design tokens it reads (4)

`--tc-border-strong`, `--tc-control-radius-md`, `--tc-menu-shadow`, `--tc-z-popover`

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

*Also attributes: `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-drag-start` | Yes | `el.addEventListener("tc-drag-start", (e) => …)` | `ref.current.addEventListener("tc-drag-start", …)` | `@tc-drag-start="…"` | `(tc-drag-start)="…($event)"` | `el.addEventListener("tc-drag-start", …)` |
| `tc-drag-end` | Yes | `el.addEventListener("tc-drag-end", (e) => …)` | `ref.current.addEventListener("tc-drag-end", …)` | `@tc-drag-end="…"` | `(tc-drag-end)="…($event)"` | `el.addEventListener("tc-drag-end", …)` |
| `tc-drag-cancel` | No | `el.addEventListener("tc-drag-cancel", (e) => …)` | `ref.current.addEventListener("tc-drag-cancel", …)` | `@tc-drag-cancel="…"` | `(tc-drag-cancel)="…($event)"` | `el.addEventListener("tc-drag-cancel", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

`tc-drag-start`, `tc-drag-end` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-drag-lift")` returns a `TcDragLift` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDragLift } from "@adamstavely/trenchcoat/drag-lift";`
- **React / Next.js:** The element class: `import type { TcDragLift } from "@adamstavely/trenchcoat/drag-lift";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDragLift["disabled"]` with `import type { TcDragLift } from "@adamstavely/trenchcoat/drag-lift";`
- **Angular:** The directive types the template: `[disabled]` takes `TcDragLift["disabled"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDragLift } from "@adamstavely/trenchcoat/drag-lift";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDragLift } from "@adamstavely/trenchcoat/drag-lift";`

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Escape | Cancels a drag, and the child glides home |

Dragging itself is by pointer, so the page must offer a keyboard way to do the same move.

### Screen readers

It adds no role and announces nothing. Announce what a drag did with a `role="status"` message, and offer a way that doesn't need dragging.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This piece alone** | 6.1 KB | 2.6 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **12.9 KB** | **4.8 KB** |
| With Lit – the first component on a page | 32.5 KB | 11.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.3 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 2.7 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window pointermove`, `window pointerup`, `window pointercancel`, `window keydown`, `window selectstart`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Give the child a visible handle when it also holds text people might select or scroll past on touch.

## Do and don't

### Do

- Call `preventDefault()` on `tc-drag-end` once your page has placed the item, so it doesn't glide home.
- Offer buttons or a menu for the same move.

### Don't

- Don't make dragging the only way to do something.

## Related

- [List Motion](list-motion.md) – Rows that glide when reordered, added or removed, in any framework, instead of jumping
- [Task Board](../blocks/task-board.md) – Kanban board with drag and drop, quick add, a detail panel, search, label filters and a compact view (uses `button`)
- [Scheduled Runs](../components/scheduled-runs.md) – Agent tasks placed into a week's sessions under usage limits – pinned first, big tasks split into linked parts, small ones filling gaps, and an Unscheduled list
- [Prioritisation Matrix](../components/prioritisation-matrix.md) – Value against effort as a 2 × 2 – numbered points you drag or move with the arrow keys, gathered when they overlap, and the items listed by quadrant beside it
