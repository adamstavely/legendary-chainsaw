<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Breakpoint Overlay

**Utilities** · New

Which breakpoint the page is at – a corner badge that opens a scale and list of every breakpoint with its media query, and a ruler across the window; follows the window or an element – ⌥⇧O to open it

- **Element:** `<tc-breakpoint-overlay>`
- **Size:** 9.2 KB gzip · 29.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/breakpoint-overlay";` |
| React / Next.js | `import { BreakpointOverlay } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/breakpoint-overlay";` · tags starting with tc- are custom elements |
| Angular | `import { BreakpointOverlay } from "@adamstavely/trenchcoat/angular/breakpoint-overlay";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/breakpoint-overlay";` |

## Example

The live example is in the gallery at `#/breakpoint-overlay`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Which breakpoint the page is at, for the people who build it. A small badge sits in a corner of the window with the
breakpoint in force and the width, in that breakpoint's colour. Open it – click it, press ⌥⇧O / Alt Shift O, or set
`open` – for a panel with the window's size, a scale of every breakpoint with the width marked on it, and each
breakpoint's name, media query and range, with the current one marked. A ruler runs across the top of the window while
it's open. Escape closes it.

It follows the window by default. Give it a `target` and it follows that element's width instead: a preview frame, a
resizable container, a component tested at container sizes.

It's Loupe's breakpoint ruler on its own, small enough to leave on while you work. Use
[Loupe](loupe.md) when you also want the page's components and its flex and grid layouts.

### When to use

- In development and review builds, to see which breakpoint a layout is at while resizing the window.
- Beside a preview frame or resizable container, to see which of its breakpoints applies.

### When not to use

- To find components, or the flex or grid container behind a spacing problem – use [Loupe](loupe.md).
- In the product for its users – it's a builder's tool. Leave it out of production builds, or behind a flag.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Badge** `.ui-bpo__badge` – the current breakpoint's colour, name and the width; opens the panel
2. **Panel** `.ui-bpo__panel` – the heading with the size and breakpoint, and Close
3. **Scale** `.ui-bpo__scale` – each breakpoint's stretch of widths, with the width marked
4. **Breakpoints** `.ui-bpo__bps` – each breakpoint's name, media query and range, the current one marked
5. **Ruler** `.ui-bpo__ruler` – breakpoints across the top of the window, with the width, while it's open

## Looks

Standard puts the panel's header on a gray tray above a white card; Clean is one white card with the header as its
first row. Floating (the default) the badge and panel sit in the window's `corner` (bottom left by default, so it
doesn't sit on Loupe's) with an overlay shadow. With `floating` off it's a card in the page, always open, with no badge.

A breakpoint is min-width only, max-width only, or a range. The one in force is the one that applies with the largest
min, so a list of min-widths reads as it does in CSS. Breakpoints are coloured from the theme's tones, in order. A page
can set `--tc-bpo-w` (the panel's width) and `--tc-bpo-ruler-h`.

## Usage

### HTML

```html
<tc-breakpoint-overlay corner="bottom-right"></tc-breakpoint-overlay>
<script type="module">
  import "@adamstavely/trenchcoat/breakpoint-overlay";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-breakpoint-overlay").breakpoints = [
    { id: "mobile", label: "Mobile", max: 767 },
    { id: "tablet", label: "Tablet", min: 768, max: 1023 },
    { id: "desktop", label: "Desktop", min: 1024 },
  ];
</script>
```

### React / Next.js

```tsx
import { BreakpointOverlay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function DevTools() {
  if (process.env.NODE_ENV === "production") return null;
  return <BreakpointOverlay corner="bottom-right" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/breakpoint-overlay";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";

defineProps<{ breakpoints: TcBreakpointOverlay["breakpoints"]; hotkey: TcBreakpointOverlay["hotkey"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-breakpoint-overlay :breakpoints="breakpoints" :hotkey="hotkey" @tc-open-change="onOpenChange"></tc-breakpoint-overlay>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BreakpointOverlay } from "@adamstavely/trenchcoat/angular/breakpoint-overlay";
import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";

@Component({
  selector: "app-breakpoint-overlay-example",
  imports: [BreakpointOverlay],
  template: `<tc-breakpoint-overlay [breakpoints]="breakpoints()" [hotkey]="hotkey()" (tc-open-change)="onOpenChange($event)"></tc-breakpoint-overlay>`,
})
export class BreakpointOverlayExample {
  readonly breakpoints = input.required<TcBreakpointOverlay["breakpoints"]>();
  readonly hotkey = input.required<TcBreakpointOverlay["hotkey"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/breakpoint-overlay";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";

  let { breakpoints, hotkey }: { breakpoints: TcBreakpointOverlay["breakpoints"]; hotkey: TcBreakpointOverlay["hotkey"] } = $props();
  let el: TcBreakpointOverlay;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-breakpoint-overlay bind:this={el} {breakpoints} {hotkey}></tc-breakpoint-overlay>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Breakpoints"` | The panel's heading |
| `open` | `open` | `boolean` | `false` | Whether the panel is open. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `breakpoints` | – | `BreakpointOverlayBreakpoint[]` | `defaultBreakpoints` | The breakpoints, in px: min only, max only, or a range. Tailwind's by default |
| `hotkey` | – | `string \| false` | `"alt+shift+o"` | Opens and closes it from anywhere ("alt+shift+o" is ⌥⇧O on Apple keyboards, Alt Shift O elsewhere); false turns it off |
| `showRuler` | `show-ruler` | `boolean` | `true` | While open, a ruler across the top of the window with each breakpoint and the width. Only when it follows the window |
| `floating` | `floating` | `boolean` | `true` | The badge and panel float at the window's corner; off, it's a card in the page, always open |
| `corner` | `corner` | `BreakpointOverlayCorner` | `"bottom-left"` | Which corner of the window it floats in |
| `target` | – | `Element \| null` | `null` | Follow this element's width instead of the window's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | Opened or closed ({ open }: BreakpointOverlayOpenChange), by the badge, the hotkey, Escape or Close; cancelable – prevented, `open` stays as it was |
| `tc-breakpoint-change` | – | No | The breakpoint in force changed as the width changed ({ breakpoint, width }: BreakpointOverlayBreakpointChange) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-bpo-w` | `340px` | clean |
| `--tc-bpo-ruler-h` | `28px` | clean |

#### Design tokens it reads (54)

`--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-toast`

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
| `breakpoints` | `el.breakpoints = …;` | `<… breakpoints={…} />` | `<tc-breakpoint-overlay :breakpoints="…">` | `<tc-breakpoint-overlay [breakpoints]="…">` | `<tc-breakpoint-overlay {breakpoints}>` |
| `hotkey` | `el.hotkey = …;` | `<… hotkey={…} />` | `<tc-breakpoint-overlay :hotkey="…">` | `<tc-breakpoint-overlay [hotkey]="…">` | `<tc-breakpoint-overlay {hotkey}>` |
| `target` | `el.target = …;` | `<… target={…} />` | `<tc-breakpoint-overlay :target="…">` | `<tc-breakpoint-overlay [target]="…">` | `<tc-breakpoint-overlay {target}>` |

*Also attributes: `heading`, `open`, `show-ruler`, `floating`, `corner` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-breakpoint-change` | No | `el.addEventListener("tc-breakpoint-change", (e) => …)` | `onBreakpointChange={…}` | `@tc-breakpoint-change="…"` | `(tc-breakpoint-change)="…($event)"` | `el.addEventListener("tc-breakpoint-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-breakpoint-overlay id="breakpoint-overlay"></tc-breakpoint-overlay>

<script type="module">
  import "@adamstavely/trenchcoat/breakpoint-overlay";

  const el = document.querySelector("#breakpoint-overlay");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

*The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref.*

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/breakpoint-overlay";
import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";

const props = defineProps<{ initial: TcBreakpointOverlay["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcBreakpointOverlay["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-breakpoint-overlay :open="open" @tc-open-change="onOpenChange"></tc-breakpoint-overlay>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BreakpointOverlay } from "@adamstavely/trenchcoat/angular/breakpoint-overlay";
import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";

@Component({
  selector: "app-controlled-breakpoint-overlay",
  imports: [BreakpointOverlay],
  template: `<tc-breakpoint-overlay [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-breakpoint-overlay>`,
})
export class ControlledBreakpointOverlay {
  readonly initial = input.required<TcBreakpointOverlay["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcBreakpointOverlay["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/breakpoint-overlay";
  import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";

  let { initial }: { initial: TcBreakpointOverlay["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcBreakpointOverlay;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcBreakpointOverlay["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-breakpoint-overlay bind:this={el} {open}></tc-breakpoint-overlay>
```

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-breakpoint-overlay")` returns a `TcBreakpointOverlay` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";`
- **React / Next.js:** Props: `import type { BreakpointOverlayProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BreakpointOverlay>`. The element class, for refs: `import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBreakpointOverlay["breakpoints"]` with `import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";`
- **Angular:** The directive types the template: `[breakpoints]` takes `TcBreakpointOverlay["breakpoints"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBreakpointOverlay } from "@adamstavely/trenchcoat/breakpoint-overlay";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The panel's heading |
| `open` | `boolean` | Whether the panel is open – controlled when given |
| `defaultOpen` | `boolean` | Whether an uncontrolled overlay starts open |
| `onOpenChange` | `(open: boolean) => void` | Opened or closed (the badge, the hotkey, Escape, Close) |
| `onBreakpointChange` | `(detail: BreakpointOverlayBreakpointChange) => void` | The breakpoint in force changed as the width changed |

*Renamed or hidden on the wrapper: `heading`, `open`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | Does |
| --- | --- |
| ⌥ ⇧ O / Alt Shift O | Opens and closes the panel, from anywhere (`hotkey`; false turns it off) |
| Enter or Space on the badge | Opens and closes the panel |
| Escape | Closes the panel – unless a dialog or menu on the page has it first – and focus goes back to the badge |

### Screen readers

- The badge is a button that says the breakpoint and width, and whether the panel is open (`aria-expanded`).
- The panel is a region named by its heading; the breakpoints are a list, each saying whether it's current, applies
  or doesn't.
- A change of breakpoint is announced in a polite status line while the panel is open.
- The scale and the ruler are drawn for sighted builders and hidden from assistive tech; the list carries the same
  information.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| backdrop-filter | 76 (Edge 79) | 103 | 18 | 18 | itself | What's behind a translucent surface isn't blurred; the surface keeps its fill. |
| Popover API | 114 | 125 | 17 | 18.3 | itself | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.0 KB | 6.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/breakpoints` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.4 KB** | **9.3 KB** |
| With Lit – the first component on a page | 49.0 KB | 15.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 52 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of breakpoints replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.2 ms | breakpoints: first render, 989 nodes; update 0.6 ms |
| 1,000 items | 53 ms | breakpoints: first render, 9,689 nodes; update 11 ms |

1,000 items of breakpoints: 53 ms. It renders every item, so a first render passes 50 ms (a long task) at about 940 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window resize`, `window keydown` (internal/controllers – HotkeyController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Match `breakpoints` to the ones your CSS uses, with labels people say ("Medium", not "md"); the id shows beside it.
- Use ranges (`min` and `max`) when your breakpoints don't stack up, like a tablet-only layout.

## Do and don't

### Do

- Ship it in development and preview builds only.
- Pick a `corner` that doesn't cover the part of the page you're checking.
- Listen to `tc-breakpoint-change` to log or test which breakpoint each width lands in.

### Don't

- Use it to make a layout decision in the product; use CSS media or container queries.
- Rely on it to tell users anything.

## Related

- [Loupe](loupe.md) – A design-system inspector over the live page – components outlined with a card of their name, path and links, a breakpoint ruler, flex and grid containers listed – ⌘⇧L to turn it on
- [Look Provider](look-provider.md) – Sets the look, Standard or Clean, for every Trenchcoat element inside it – one wrapper for a whole app, with any element still free to choose its own

## Changelog

- **Breakpoint Overlay** (`tc-breakpoint-overlay`): which breakpoint the page is at – a corner badge that opens a scale and list of every breakpoint with its range and media query, and a ruler across the window; ⌥⇧O to open it. It follows the window or a `target` element. Loupe now shares its breakpoint helpers.
