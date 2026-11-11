<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Sliding Indicator

**Motion** · New

A highlight that slides to the selected tab, option or nav link – an underline or a pill that follows the page's own selected state, with an optional hover ghost

- **Element:** `<tc-sliding-indicator>`
- **Size:** 5.4 KB gzip · 15.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/sliding-indicator";` |
| React / Next.js | `import "@adamstavely/trenchcoat/sliding-indicator";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/sliding-indicator";` · tags starting with tc- are custom elements |
| Angular | `import { SlidingIndicator } from "@adamstavely/trenchcoat/angular/sliding-indicator";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/sliding-indicator";` |

## Example

The live example is in the gallery at `#/motion/sliding-indicator`, at 320 px, 480 px or full width.

## Overview

A highlight that slides to whichever item is selected – in tabs, a row of options or a nav – instead of jumping. Wrap
your own buttons or links in it: it reads which one is selected from `aria-selected`, `aria-current`, `aria-checked`
or `data-selected`, follows that as it changes, and keeps up when the items resize or wrap. `variant="underline"`
draws a bar under the selected item (beside it when the items run down the page); `variant="pill"` fills the item's
box behind its text. With `hover-preview`, a faint ghost follows the pointer across the items. It adds no roles or
keys of its own – your tablist, radio group or nav keeps them. For people who ask for reduced motion, the highlight
moves without sliding.

### When to use

- Tabs you've built yourself, so the selected tab's underline glides across.
- A row of options or filters where a pill should slide to the chosen one.
- A side or top nav where the current page's marker should follow the route.

### When not to use

- A ready-made row of options with its own keyboard handling – use [Segmented Control](../components/segmented-control.md).
- A whole navigation sidebar – use [Side Nav](../components/side-nav.md).
- Items that are added, removed or reordered – use [List Motion](list-motion.md).
- Content that changes inside one box – use [Blur Crossfade](blur-crossfade.md).

## Usage

### HTML

```html
<tc-sliding-indicator variant="underline" hover-preview>
  <div role="tablist" aria-label="Finding F-214">
    <button type="button" role="tab" aria-selected="true">Overview</button>
    <button type="button" role="tab" aria-selected="false" tabindex="-1">Evidence</button>
    <button type="button" role="tab" aria-selected="false" tabindex="-1">History</button>
  </div>
</tc-sliding-indicator>

<script type="module">
  import "@adamstavely/trenchcoat/sliding-indicator";
  import "@adamstavely/trenchcoat/tokens.css";

  // Your tabs set aria-selected; the highlight follows
  const tabs = document.querySelectorAll('[role="tab"]');
  for (const tab of tabs)
    tab.addEventListener("click", () => {
      for (const t of tabs) t.setAttribute("aria-selected", String(t === tab));
    });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SlidingIndicator } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FindingTabs() {
  const [tab, setTab] = useState("Overview");
  return (
    <SlidingIndicator variant="pill">
      <div role="tablist" aria-label="Finding F-214">
        {["Overview", "Evidence", "History"].map((t) => (
          <button key={t} type="button" role="tab" aria-selected={t === tab} tabIndex={t === tab ? 0 : -1} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
    </SlidingIndicator>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/sliding-indicator";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSlidingIndicator } from "@adamstavely/trenchcoat/sliding-indicator";

defineProps<{ place: TcSlidingIndicator["place"] }>();
</script>

<template>
  <tc-sliding-indicator :place="place"></tc-sliding-indicator>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SlidingIndicator } from "@adamstavely/trenchcoat/angular/sliding-indicator";
import type { TcSlidingIndicator } from "@adamstavely/trenchcoat/sliding-indicator";

@Component({
  selector: "app-sliding-indicator-example",
  imports: [SlidingIndicator],
  template: `<tc-sliding-indicator [place]="place()"></tc-sliding-indicator>`,
})
export class SlidingIndicatorExample {
  readonly place = input.required<TcSlidingIndicator["place"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sliding-indicator";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSlidingIndicator } from "@adamstavely/trenchcoat/sliding-indicator";

  let { place }: { place: TcSlidingIndicator["place"] } = $props();
  let el: TcSlidingIndicator;
</script>

<tc-sliding-indicator bind:this={el} {place}></tc-sliding-indicator>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `variant` | `variant` | `SlidingIndicatorVariant` | `"underline"` | "underline" draws a bar under the selected item (beside it when vertical); "pill" fills its box behind the text |
| `orientation` | `orientation` | `SlidingIndicatorOrientation` | `"horizontal"` | Which way the items run – a vertical underline sits at the items' start edge |
| `hoverPreview` | `hover-preview` | `boolean` | `false` | A faint ghost follows the pointer over the items, sliding the same way |
| `items` | `items` | `string` | `'[role="tab"], [role="option"], [role="radio"], [role="menuitemradio"], a[href], button'` | A CSS selector for the items inside it; the default takes tabs, options, radios, links and buttons |
| `place` | – | `` | – | Places the highlight on the selected item and the ghost on the hovered one |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `selectedItem()` | `HTMLElement \| null` | The item that's selected now, if any |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sind-thickness` | `2px` | both |
| `--tc-sind-underline` | `var(--tc-accent)` | both |
| `--tc-sind-pill-bg` | `var(--tc-seg-thumb-bg)` | both |
| `--tc-sind-pill-shadow` | `var(--tc-seg-thumb-shadow)` | both |
| `--tc-sind-pill-radius` | `var(--tc-control-radius-sm)` | both |
| `--tc-sind-ghost-bg` | `var(--tc-fill-subtle)` | both |
| `--tc-sind-duration` | `var(--tc-duration-base)` | both |

#### Design tokens it reads (9)

`--tc-accent`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSlidingIndicatorItems: string` | The page's items, when `items` isn't given |

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
| `place` | `el.place = …;` | `<… place={…} />` | `<tc-sliding-indicator :place="…">` | `<tc-sliding-indicator [place]="…">` | `<tc-sliding-indicator {place}>` |

*Also attributes: `variant`, `orientation`, `hover-preview`, `items` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-sliding-indicator")` returns a `TcSlidingIndicator` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSlidingIndicator } from "@adamstavely/trenchcoat/sliding-indicator";`
- **React / Next.js:** The element class: `import type { TcSlidingIndicator } from "@adamstavely/trenchcoat/sliding-indicator";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSlidingIndicator["place"]` with `import type { TcSlidingIndicator } from "@adamstavely/trenchcoat/sliding-indicator";`
- **Angular:** The directive types the template: `[place]` takes `TcSlidingIndicator["place"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSlidingIndicator } from "@adamstavely/trenchcoat/sliding-indicator";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSlidingIndicator } from "@adamstavely/trenchcoat/sliding-indicator";`

## Accessibility

### Keyboard

Nothing of its own. Your items keep their keys – for tabs, the arrow keys move between them and the highlight follows
the one that becomes selected.

### Screen readers

Nothing is read: the highlight and the ghost are `aria-hidden`. What's selected comes from your own `aria-selected`,
`aria-current` or `aria-checked`, which is also what the highlight follows – so the two can't disagree.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This piece alone** | 8.5 KB | 3.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.2 KB** | **5.4 KB** |
| With Lit – the first component on a page | 34.8 KB | 11.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 3 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 6.5 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window resize`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Set the selected state on the item itself (`aria-selected="true"` on the tab, `aria-current="page"` on the link).
- Change the selected item's text colour as well – the highlight alone shouldn't carry the meaning.
- Use `items` with a selector when the row holds other buttons that aren't options.

### Don't

- Don't use `data-selected` where an ARIA state fits – screen readers can't see it.
- Don't put it around items that scroll sideways inside their own container; it measures against its own box.

## Related

- [Segmented Control](../components/segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Side Nav](../components/side-nav.md) – An app's main navigation down the side – brand, places with icons and badges in sections, the current page, real links with a cancelable `tc-navigate` for routing, a footer of the page's own and a fold into an icon-only rail
- [List Motion](list-motion.md) – Rows that glide when reordered, added or removed, in any framework, instead of jumping
- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
