<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Dissolve Clear

**Motion** · New

A clear button for a text input – the field empties at once and keeps focus while the old text dissolves letter by letter, with Escape to clear too

- **Element:** `<tc-dissolve-clear>`
- **Size:** 5.3 KB gzip · 14.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/dissolve-clear";` |
| React / Next.js | `import { DissolveClear } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/dissolve-clear";` · tags starting with tc- are custom elements |
| Angular | `import { DissolveClear } from "@adamstavely/trenchcoat/angular/dissolve-clear";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/dissolve-clear";` |

## Example

The live example is in the gallery at `#/motion/dissolve-clear`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Wraps a text input and adds a clear button that shows while the input has text. Clearing empties the field at once, so the page's state changes straight away, while a copy of the old text dissolves over it: each letter drifts and blurs out from left to right. Focus stays in the input, and Escape in the input clears it too. With reduced motion the text goes at once, with no dissolve.

### When to use

- Search and filter fields, where people clear and start again often.
- Short text fields with a quick way to start over.

### When not to use

- Long text in a textarea – the dissolve is for a line.
- Fields where clearing loses work that can't be typed again quickly.
- A field that should reset to a default rather than empty – reset it with a button that says so.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Host** `[data-ui="dclr"]` – wraps the page's input
2. **Clear button** `.ui-dclr__clear` – the ×, shown while there's text
3. **Ghost** `.ui-dclr__ghost` – the copy of the text that dissolves, made of `.ui-dclr__letter`s

## Looks

No look of its own: the input keeps the page's styles, with room at its end for the button. A page can set `--tc-dissolve-clear-button` (the button's size) and `--tc-dissolve-clear-room` (the input's end padding).

## Usage

### HTML

```html
<tc-dissolve-clear clear-label="Clear search">
  <input type="search" placeholder="Search findings" aria-label="Search findings" />
</tc-dissolve-clear>

<script type="module">
  import "@adamstavely/trenchcoat/dissolve-clear";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DissolveClear } from "@adamstavely/trenchcoat/react";

export function FindingSearch() {
  const [query, setQuery] = useState("");
  return (
    <DissolveClear clearLabel="Clear search" onClear={(value) => console.log("cleared", value)}>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search findings" aria-label="Search findings" />
    </DissolveClear>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/dissolve-clear";
import "@adamstavely/trenchcoat/tokens.css";

const onClear = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-dissolve-clear @tc-clear="onClear"></tc-dissolve-clear>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { DissolveClear } from "@adamstavely/trenchcoat/angular/dissolve-clear";

@Component({
  selector: "app-dissolve-clear-example",
  imports: [DissolveClear],
  template: `<tc-dissolve-clear (tc-clear)="onClear($event)"></tc-dissolve-clear>`,
})
export class DissolveClearExample {
  onClear(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/dissolve-clear";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDissolveClear } from "@adamstavely/trenchcoat/dissolve-clear";

  let el: TcDissolveClear;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-clear", on);
    return () => el.removeEventListener("tc-clear", on);
  });
</script>

<tc-dissolve-clear bind:this={el}></tc-dissolve-clear>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `clearLabel` | `clear-label` | `string` | `"Clear"` | The clear button's name |
| `clearedLabel` | `cleared-label` | `string` | `"Cleared"` | Announced after clearing |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-clear` | – | Yes | The field is about to be cleared ({ value }: DissolveClearDetail); cancelable – prevented, the text stays |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `clear()` | `void` | Clears the input with the dissolve, as the button does |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-dissolve-clear-button` | `22px` | both |
| `--tc-dissolve-clear-room` | `calc(var(--tc-dissolve-clear-button) + var(--tc-space-2))` | both |

#### Design tokens it reads (11)

`--tc-duration-fast`, `--tc-duration-slow`, `--tc-ease-out`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-radius-full`, `--tc-space-1-5`, `--tc-space-2`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`

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

*Also attributes: `clear-label`, `cleared-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-clear` | Yes | `el.addEventListener("tc-clear", (e) => …)` | `onClear={…}` | `@tc-clear="…"` | `(tc-clear)="…($event)"` | `el.addEventListener("tc-clear", …)` |

### Controlled

`tc-clear` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-dissolve-clear")` returns a `TcDissolveClear` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDissolveClear } from "@adamstavely/trenchcoat/dissolve-clear";`
- **React / Next.js:** Props: `import type { DissolveClearProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DissolveClear>`. The element class, for refs: `import type { TcDissolveClear } from "@adamstavely/trenchcoat/dissolve-clear";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDissolveClear["clearLabel"]` with `import type { TcDissolveClear } from "@adamstavely/trenchcoat/dissolve-clear";`
- **Angular:** The directive types the template: `[clearLabel]` takes `TcDissolveClear["clearLabel"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDissolveClear } from "@adamstavely/trenchcoat/dissolve-clear";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDissolveClear } from "@adamstavely/trenchcoat/dissolve-clear";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onClear` | `(value: string) => boolean \| void` | Called before the field clears with the text it had; return false to keep the text |

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Escape (in the input) | Clears the text |
| Tab | Moves to the clear button while there's text |
| Enter or Space (on the button) | Clears the text, and focus goes back to the input |

### Screen readers

The button's name is `clear-label` ("Clear"). After clearing, a polite status says `cleared-label` ("Cleared"). The dissolving copy is hidden from screen readers.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
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
| **This piece alone** | 7.3 KB | 3.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **14.1 KB** | **5.3 KB** |
| With Lit – the first component on a page | 33.7 KB | 11.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 5 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give the input its own label; the element doesn't add one.
- Rename the button for the field when it helps: "Clear search".

## Do and don't

### Do

- Let `tc-clear` (or `onClear`) undo filtering that depended on the text.

### Don't

- Don't add a second clear button – the native search × is hidden inside it.

## Related

- [AI Search](../components/ai-search.md) – One search box with an AI mode – recent and suggested searches as you type, a multi-line prompt with example prompts in AI mode, Search within file contents, removable scope chips, Clear and ⌘K
- [Search History](../components/search-history.md) – Recent and saved searches – tabs with counts, a filter, searches grouped by day with scope chips, result counts and times, and Run again, a save star and Remove with Undo on each
- [Facet Sidebar](../components/facet-sidebar.md) – Filters beside search results, with counts – checkbox, radio, range and date facets that fold, the filters in use as removable chips with Clear all, Show more and a search box in long facets
- [Text Reveal](text-reveal.md) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
