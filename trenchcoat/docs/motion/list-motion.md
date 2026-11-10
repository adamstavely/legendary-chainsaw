<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# List Motion

**Motion** · New

Rows that glide when reordered, added or removed, in any framework, instead of jumping

- **Element:** `<tc-list-motion>`
- **Size:** 4.5 KB gzip · 11.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/list-motion";` |
| React / Next.js | `import "@adamstavely/trenchcoat/list-motion";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/list-motion";` · tags starting with tc- are custom elements |
| Angular | `import { ListMotion } from "@adamstavely/trenchcoat/angular/list-motion";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/list-motion";` |

## Example

The live example is in the gallery at `#/motion/list-motion`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Rows that glide. When a list's rows are reordered, added or removed, each one moves from where it was to where it is instead of jumping, so people can follow what changed. New rows fade in and removed rows fade out.

### When to use

- A list people reorder with buttons or keys.
- A list that changes while someone's reading it, such as a queue.

### When not to use

- Swapping one thing for another – use [Blur Crossfade](blur-crossfade.md).
- Opening and shutting one section – use [Collapse](collapse.md).
- Dragging, where the row should follow the pointer – it animates after a change, not during it.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **List** `[data-ui="lsm"]` – holds the rows, which stay your own elements

## Looks

No look of its own. A page can set `duration`; by default it follows `--tc-duration-slow`.

## Usage

### HTML

```html
<tc-list-motion id="rows"><div>One</div><div>Two</div></tc-list-motion>

<script type="module">
  import "@adamstavely/trenchcoat/list-motion";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { ListMotion } from "@adamstavely/trenchcoat/react";

export function Rows({ rows }: { rows: { id: string; name: string }[] }) {
  return <ListMotion>{rows.map((r) => <div key={r.id}>{r.name}</div>)}</ListMotion>;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/list-motion";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-list-motion></tc-list-motion>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { ListMotion } from "@adamstavely/trenchcoat/angular/list-motion";

@Component({
  selector: "app-list-motion-example",
  imports: [ListMotion],
  template: `<tc-list-motion></tc-list-motion>`,
})
export class ListMotionExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/list-motion";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcListMotion } from "@adamstavely/trenchcoat/list-motion";

  let el: TcListMotion;
</script>

<tc-list-motion bind:this={el}></tc-list-motion>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `duration` | `duration` | `number \| undefined` | `undefined` | Length of the move in ms; by default the --tc-duration-slow token |
| `exits` | `exits` | `boolean` | `true` | Removed rows leave as a fading copy; set exits="false" to have them go at once |
| `rowCount` | – | `` | – | How many rows it holds, without the copies of rows that are leaving |

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

*Also attributes: `duration`, `exits` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-list-motion")` returns a `TcListMotion` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcListMotion } from "@adamstavely/trenchcoat/list-motion";`
- **React / Next.js:** The element class: `import type { TcListMotion } from "@adamstavely/trenchcoat/list-motion";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcListMotion["duration"]` with `import type { TcListMotion } from "@adamstavely/trenchcoat/list-motion";`
- **Angular:** The directive types the template: `[duration]` takes `TcListMotion["duration"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcListMotion } from "@adamstavely/trenchcoat/list-motion";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcListMotion } from "@adamstavely/trenchcoat/list-motion";`

## Accessibility

### Keyboard

Nothing to operate. Your own controls keep doing what they do. Moving a row in the DOM can lose focus, so put focus back on the moved row or its control.

### Screen readers

It adds no role, so use `role="list"` when the rows are a list. A removed row's fading copy is `aria-hidden` and `inert`.

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
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This piece alone** | 3.4 KB | 1.8 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/list-motion` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **11.4 KB** | **4.5 KB** |
| With Lit – the first component on a page | 31.0 KB | 10.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.1 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.0 ms** | re-render with the same data |
| First on the page | 1.0 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Each direct child is a row. Give rows stable identity in your framework (a React `key`), or they'll be replaced rather than moved.

## Do and don't

### Do

- Announce moves in words as well, with a `role="status"` message.
- Give rows a stable `key`.

### Don't

- Don't use it for long lists that change constantly. The movement stops being useful.

## Related

- [Collapse](collapse.md) – Content that glides open and shut to its real height, with nothing to measure, and can't be reached while shut
- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
- [Team Flag Editor](../components/team-flag-editor.md) – Where a team decides what its flags mean – each flag's colour, name, meaning and order, with a check on names and a question before removing a flag that's on files.
- [To-do List](../components/todo-list.md) – A to-do list people keep themselves – add, tick off, edit in place, move with Alt + arrows and remove with Undo, with All / To do / Done tabs, progress and Clear done

## Changelog

- **List Motion** (`tc-list-motion`) – rows glide when reordered, added or removed. Team Flag Editor now uses it.
