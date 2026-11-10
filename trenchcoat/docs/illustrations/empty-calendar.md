<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Empty Calendar

**Illustrations**

Stack of calendar cards marked empty, fanning out on hover; the shimmer runs a few cycles and rests

- **Element:** `<tc-empty-calendar>`
- **Size:** 6.0 KB gzip · 16.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/empty-calendar";` |
| React / Next.js | `import "@adamstavely/trenchcoat/empty-calendar";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/empty-calendar";` · tags starting with tc- are custom elements |
| Angular | `import { EmptyCalendar } from "@adamstavely/trenchcoat/angular/empty-calendar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/empty-calendar";` |

## Example

The live example is in the gallery at `#/illustrations/empty-calendar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Three calendar cards stacked and fanned out, each with an “Empty” badge, faint placeholder lines and a greyed-out
“Join meeting” button. It tells people at a glance that there's nothing on their schedule – no meetings, no events –
in a way that reads warmer than a blank panel. Hover the front card and it lifts; hover a back card and it slides
further out. The placeholder lines shimmer and the glow under the front card breathes for a few cycles, then rest.

### When to use

- An empty calendar, agenda or meetings view, above the text that says nothing is booked.
- The empty state of a scheduling or booking integration before the first event is synced.
- Onboarding or landing sections about meetings and calendars.

### When not to use

- An empty folder, file list or upload area – use [Glass Folder](glass-folder.md).
- An empty conversation or chat history – use [Ghosted Chat](ghosted-chat.md).
- As a date picker or a way to book time – the cards are a picture, not a control; use [Date Range Picker](../components/date-range-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Front card** `.ui-ec-front` – the card that lifts and tilts on hover, with the glow beneath it
2. **Back card** `.ui-ec-back-left` – one of the two cards fanned out behind it; slides further out on hover
3. **Placeholder lines** `.ui-ec-front .ui-ec-bar` – the empty rows that shimmer a few times and rest
4. **Button** `.ui-ec-front .ui-ec-btn` – the disabled-looking “Join meeting” button, drawn, not a real control

## Looks

One look. Colours follow the page theme through `light-dark()`: in dark the cards turn charcoal with faint edges and
the badge a translucent peach. It works with a `.dark` class, `data-theme`, `data-tc-theme` or the system setting.

## Usage

### HTML

```html
<div style="width: 320px">
  <tc-empty-calendar id="empty"></tc-empty-calendar>
  <p>No meetings this week.</p>
</div>

<script type="module">
  import "@adamstavely/trenchcoat/empty-calendar";
  import "@adamstavely/trenchcoat/tokens.css";

  const art = document.querySelector("#empty");
  // Only when the picture carries meaning the text doesn't
  art.label = "Empty calendar";
</script>
```

### React / Next.js

```tsx
import { EmptyCalendar } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function NoMeetings() {
  return (
    <div style={{ width: 320 }}>
      <EmptyCalendar />
      <p>No meetings this week.</p>
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/empty-calendar";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-empty-calendar></tc-empty-calendar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { EmptyCalendar } from "@adamstavely/trenchcoat/angular/empty-calendar";

@Component({
  selector: "app-empty-calendar-example",
  imports: [EmptyCalendar],
  template: `<tc-empty-calendar></tc-empty-calendar>`,
})
export class EmptyCalendarExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/empty-calendar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEmptyCalendar } from "@adamstavely/trenchcoat/empty-calendar";

  let el: TcEmptyCalendar;
</script>

<tc-empty-calendar bind:this={el}></tc-empty-calendar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Accessible description – when set, the scene is announced as an image; otherwise it is decorative |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-empty-calendar-card` | `light-dark(#ffffff, #232326)` | both |
| `--tc-empty-calendar-edge` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.08))` | both |
| `--tc-empty-calendar-drop` | `light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4))` | both |
| `--tc-empty-calendar-title` | `light-dark(#8a8a8a, #8f8f8f)` | both |
| `--tc-empty-calendar-badge` | `light-dark(#fef8ef, rgba(250, 176, 130, 0.16))` | both |
| `--tc-empty-calendar-bar` | `light-dark(#eff1f4, #2a2a2d)` | both |
| `--tc-empty-calendar-bar-peak` | `light-dark(#dde1e5, #36363b)` | both |
| `--tc-empty-calendar-btn` | `light-dark(#f4f4f6, #2a2a2d)` | both |
| `--tc-empty-calendar-btn-ink` | `light-dark(#9a9aa3, #6b6b70)` | both |
| `--tc-empty-calendar-shimmer` | `2.4s` | both |
| `--tc-empty-calendar-breathe` | `5s` | both |

#### Design tokens it reads (4)

`--tc-duration-slow`, `--tc-ease-in-out`, `--tc-ease-out`, `--tc-font-sans`

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

*Also attributes: `label` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-empty-calendar")` returns a `TcEmptyCalendar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEmptyCalendar } from "@adamstavely/trenchcoat/empty-calendar";`
- **React / Next.js:** The element class: `import type { TcEmptyCalendar } from "@adamstavely/trenchcoat/empty-calendar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEmptyCalendar["label"]` with `import type { TcEmptyCalendar } from "@adamstavely/trenchcoat/empty-calendar";`
- **Angular:** The directive types the template: `[label]` takes `TcEmptyCalendar["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEmptyCalendar } from "@adamstavely/trenchcoat/empty-calendar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEmptyCalendar } from "@adamstavely/trenchcoat/empty-calendar";`

## Accessibility

### Keyboard

Nothing to operate – the illustration takes no focus, and the “Join meeting” button is part of the drawing. Hover
only moves the cards.

### Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped. With `label`, the host becomes `role="img"`
named by the label (“Nothing scheduled”); clearing `label` makes it decorative again. The drawing itself is always
hidden, so the “Calendar”, “EMPTY” and “Join meeting” text in it is never read.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 9.6 KB | 3.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **16.7 KB** | **6.0 KB** |
| With Lit – the first component on a page | 36.3 KB | 12.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 66 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

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

- Pair it with a short heading (“No meetings this week”) and one line on what to do next.
- Give it a `label` only when the picture says something the text beside it doesn't.

## Do and don't

### Do

- Size its container, not the illustration: it fills the width at a 3 : 2 frame.
- Put a real call to action next to it – “Connect your calendar”, “Book a time” – as a button in the page.

### Don't

- Don't rely on the drawn “Join meeting” button – it can't be clicked or focused.
- Don't place it in a small toolbar or list row – it is meant to be seen at card size.

## Related

- [Glass Folder](glass-folder.md) – Glassy blue folder with documents behind a frosted pocket that tips open on hover
- [Ghosted Chat](ghosted-chat.md) – Unanswered chat messages marked as read, with a thumbs-down reply on hover; the red shine sweeps three times
- [Side Folder](side-folder.md) – Glassy blue folder on its side, documents sliding out to the right as the pocket swings open on hover
