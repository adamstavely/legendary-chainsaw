<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Badge Pop

**Motion** · New

A count badge on a corner of what it wraps that pops and rolls its digits when the count rises, shrinks away at zero, caps at 99+ or shows a dot, and says the count once it settles

- **Element:** `<tc-badge-pop>`
- **Size:** 5.5 KB gzip · 15.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/badge-pop";` |
| React / Next.js | `import "@adamstavely/trenchcoat/badge-pop";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/badge-pop";` · tags starting with tc- are custom elements |
| Angular | `import { BadgePop } from "@adamstavely/trenchcoat/angular/badge-pop";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/badge-pop";` |

## Example

The live example is in the gallery at `#/motion/badge-pop`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A count badge on a corner of what it wraps – an icon button, an avatar or a tab. When the count rises the badge pops, swelling past its size and springing back, and the digits roll up; when it falls they roll down. At 0 the badge shrinks away, and it pops back in from nothing. Above `max` it reads "99+", and `dot` shows a plain dot instead of a number. Nothing moves on first render. With reduced motion the number changes in place and the badge appears and goes without scaling.

### When to use

- Unread or waiting items on a button: a review queue, an inbox, mentions.
- A tab or menu item with new things in it.

### When not to use

- A status or a label – use a tag or [Validity Badge](../components/validity-badge.md).
- A number that's the point of the page – use [Number Ticker](number-ticker.md) or [Number Change](number-change.md).
- Counts that change every second – the badge would never stop moving.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Host** `[data-ui="bdp"]` – wraps the content and positions the badge
2. **Badge** `.ui-bdp__badge` – the pill or dot on the corner
3. **Digits** `.ui-bdp__digits` – the number, rolling between `.ui-bdp__out` and `.ui-bdp__in`

## Looks

No look of its own. A page can set `--tc-badge-pop-bg`, `--tc-badge-pop-fg`, `--tc-badge-pop-ring` (the ring that separates it from what's under it), `--tc-badge-pop-size`, `--tc-badge-pop-dot` and `--tc-badge-pop-offset`. `position` picks the corner: `top-end` (the default), `top-start`, `bottom-end` or `bottom-start`.

## Usage

### HTML

```html
<tc-badge-pop count="3" label="to review">
  <button aria-label="Review queue">…</button>
</tc-badge-pop>

<script type="module">
  import "@adamstavely/trenchcoat/badge-pop";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { BadgePop } from "@adamstavely/trenchcoat/react";

export function QueueButton({ waiting }: { waiting: number }) {
  return (
    <BadgePop count={waiting} label="to review">
      <button type="button">Queue</button>
    </BadgePop>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/badge-pop";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-badge-pop></tc-badge-pop>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { BadgePop } from "@adamstavely/trenchcoat/angular/badge-pop";

@Component({
  selector: "app-badge-pop-example",
  imports: [BadgePop],
  template: `<tc-badge-pop></tc-badge-pop>`,
})
export class BadgePopExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/badge-pop";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBadgePop } from "@adamstavely/trenchcoat/badge-pop";

  let el: TcBadgePop;
</script>

<tc-badge-pop bind:this={el}></tc-badge-pop>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `count` | `count` | `number` | `0` | The count; 0 hides the badge |
| `max` | `max` | `number` | `99` | Above this it reads "&lt;max>+" |
| `dot` | `dot` | `boolean` | `false` | A plain dot instead of the number |
| `position` | `position` | `BadgePopPosition` | `"top-end"` | Which corner it sits on |
| `label` | `label` | `string` | `"new"` | The word after the count for screen readers: "3 unread" |
| `announceDelay` | `announce-delay` | `number` | `800` | How long the count must hold before it's announced, in ms |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for writing the number |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-badge-pop-bg` | `var(--tc-status-danger-fg)` | both |
| `--tc-badge-pop-fg` | `var(--tc-surface-raised)` | both |
| `--tc-badge-pop-ring` | `var(--tc-surface-raised)` | both |
| `--tc-badge-pop-size` | `18px` | both |
| `--tc-badge-pop-dot` | `10px` | both |
| `--tc-badge-pop-offset` | `calc(var(--tc-badge-pop-size) / -3)` | both |

#### Design tokens it reads (16)

`--tc-bdp-from`, `--tc-bdp-to`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in`, `--tc-ease-out`, `--tc-ease-spring`, `--tc-font-size-2xs`, `--tc-font-weight-semibold`, `--tc-line-height-none`, `--tc-radius-full`, `--tc-space-1`, `--tc-status-danger-fg`, `--tc-surface-raised`

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

*Also attributes: `count`, `max`, `dot`, `position`, `label`, `announce-delay`, `locale` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-badge-pop")` returns a `TcBadgePop` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBadgePop } from "@adamstavely/trenchcoat/badge-pop";`
- **React / Next.js:** The element class: `import type { TcBadgePop } from "@adamstavely/trenchcoat/badge-pop";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBadgePop["count"]` with `import type { TcBadgePop } from "@adamstavely/trenchcoat/badge-pop";`
- **Angular:** The directive types the template: `[count]` takes `TcBadgePop["count"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBadgePop } from "@adamstavely/trenchcoat/badge-pop";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBadgePop } from "@adamstavely/trenchcoat/badge-pop";`

## Accessibility

### Keyboard

Nothing to operate: what it wraps keeps its own keys.

### Screen readers

The badge is hidden from screen readers; a polite status says the count in words with `label` ("5 findings to review"). It's updated once a burst of changes has held for `announce-delay` ms, so a run of quick changes is read once. Give the wrapped button its own name.

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
| **This piece alone** | 9.2 KB | 3.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.9 KB** | **5.5 KB** |
| With Lit – the first component on a page | 35.6 KB | 11.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 4 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 8.2 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `label` is the word after the count: "unread", "to review", "new".
- Keep `max` low enough that the badge stays small.

## Do and don't

### Do

- Clear the count when the person has seen the items.

### Don't

- Don't put the only route to the items in the badge – it isn't a control.

## Related

- [Number Ticker](number-ticker.md) – Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once
- [Number Change](number-change.md) – A number that briefly highlights when it changes, tinted by direction with an arrow and a word for screen readers, and never on first render
- [Notifications](../components/notifications.md) – The notification center – a bell with an unread badge that opens a panel of notifications grouped by day, with tabs, read state, inline actions, Mark all as read and Load more
- [Notification Stack](../components/notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
