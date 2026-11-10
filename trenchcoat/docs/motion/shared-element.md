<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Shared Element

**Motion** · New

A piece of content grows into its detail view, with focus moving along and Escape to close, so people keep their place

- **Element:** `<tc-shared-element>`
- **Size:** 4.5 KB gzip · 11.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/shared-element";` |
| React / Next.js | `import { SharedElement } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/shared-element";` · tags starting with tc- are custom elements |
| Angular | `import { SharedElement } from "@adamstavely/trenchcoat/angular/shared-element";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/shared-element";` |

## Example

The live example is in the gallery at `#/motion/shared-element`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A piece of content grows into its detail view, so people keep their place. The detail grows out of the summary's box and shrinks back into it, and focus moves with it. With reduced motion it simply switches.

### When to use

- A row or card that opens into more of itself.
- A preview that becomes the full view in the same spot.

### When not to use

- Opening a section in place – use [Collapse](collapse.md).
- Swapping unrelated content – use [Blur Crossfade](blur-crossfade.md).
- A task that needs its own focus and blocks the page – use [Dialog](../components/dialog.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `[data-shared="summary"]` – what shows when shut
2. **Detail** `[data-shared="detail"]` – what it grows into
3. **Toggle** `[data-shared-toggle]` – opens or closes it

## Looks

No look of its own. It follows `--tc-duration-slow` and `--tc-ease-move`. Style the two parts yourself.

## Usage

### HTML

```html
<tc-shared-element>
  <button data-shared="summary" data-shared-toggle>Trial 12</button>
  <div data-shared="detail"><button data-shared-toggle>Close</button> The whole report</div>
</tc-shared-element>

<script type="module">
  import "@adamstavely/trenchcoat/shared-element";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { SharedElement } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Row() {
  return (
    <SharedElement>
      <button data-shared="summary" data-shared-toggle>Trial 12</button>
      <div data-shared="detail"><button data-shared-toggle>Close</button> The whole report</div>
    </SharedElement>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/shared-element";
import "@adamstavely/trenchcoat/tokens.css";

const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-shared-element @tc-open-change="onOpenChange"></tc-shared-element>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { SharedElement } from "@adamstavely/trenchcoat/angular/shared-element";

@Component({
  selector: "app-shared-element-example",
  imports: [SharedElement],
  template: `<tc-shared-element (tc-open-change)="onOpenChange($event)"></tc-shared-element>`,
})
export class SharedElementExample {
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/shared-element";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSharedElement } from "@adamstavely/trenchcoat/shared-element";

  let el: TcSharedElement;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-shared-element bind:this={el}></tc-shared-element>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Whether the detail shows. Changed by the user unless a tc-open-change listener calls preventDefault() |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The detail is opening or closing ({ open }: SharedElementOpenChange); cancelable – prevented, `open` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `toggle(next: unknown)` | `void` | Opens or closes it, as a toggle would |

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

*Also attributes: `open` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-shared-element id="shared-element"></tc-shared-element>

<script type="module">
  import "@adamstavely/trenchcoat/shared-element";

  const el = document.querySelector("#shared-element");
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
import "@adamstavely/trenchcoat/shared-element";
import type { TcSharedElement } from "@adamstavely/trenchcoat/shared-element";

const props = defineProps<{ initial: TcSharedElement["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcSharedElement["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-shared-element :open="open" @tc-open-change="onOpenChange"></tc-shared-element>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SharedElement } from "@adamstavely/trenchcoat/angular/shared-element";
import type { TcSharedElement } from "@adamstavely/trenchcoat/shared-element";

@Component({
  selector: "app-controlled-shared-element",
  imports: [SharedElement],
  template: `<tc-shared-element [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-shared-element>`,
})
export class ControlledSharedElement {
  readonly initial = input.required<TcSharedElement["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcSharedElement["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/shared-element";
  import type { TcSharedElement } from "@adamstavely/trenchcoat/shared-element";

  let { initial }: { initial: TcSharedElement["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcSharedElement;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcSharedElement["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-shared-element bind:this={el} {open}></tc-shared-element>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-shared-element")` returns a `TcSharedElement` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSharedElement } from "@adamstavely/trenchcoat/shared-element";`
- **React / Next.js:** Props: `import type { SharedElementProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SharedElement>`. The element class, for refs: `import type { TcSharedElement } from "@adamstavely/trenchcoat/shared-element";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSharedElement["open"]` with `import type { TcSharedElement } from "@adamstavely/trenchcoat/shared-element";`
- **Angular:** The directive types the template: `[open]` takes `TcSharedElement["open"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSharedElement } from "@adamstavely/trenchcoat/shared-element";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSharedElement } from "@adamstavely/trenchcoat/shared-element";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `open` | `boolean` | Whether the detail shows – controlled when given |
| `defaultOpen` | `boolean` | Whether it shows on mount when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | The detail is opening or closing |

*Renamed or hidden on the wrapper: `open`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space on a toggle | Opens or closes it |
| Escape | Closes it |

On opening, focus goes to the detail's first control; on closing, back to the summary.

### Screen readers

The part that isn't showing is `hidden`, so it's skipped. Toggles get `aria-expanded`. Focus moving tells people where they've landed.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 5.0 KB | 2.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **11.6 KB** | **4.5 KB** |
| With Lit – the first component on a page | 31.2 KB | 10.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.1 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 1.0 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Use real buttons as toggles. Give the detail a heading that repeats the summary's name.

## Do and don't

### Do

- Keep the two parts visibly the same thing, so the growth makes sense.

### Don't

- Don't use it for detail far larger than the page. The growth gets hard to follow.

## Related

- [Collapse](collapse.md) – Content that glides open and shut to its real height, with nothing to measure, and can't be reached while shut
- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
- [Dialog](../components/dialog.md) – A native modal with interactive content and restored focus
- [File Details](../blocks/file-details.md) – One file in one place – what it is, the team's flag on it, what's in it, its versions, and who it's shared with after their entitlements are checked (uses `team-flag-picker`, `file-summary`, `version-history`, `share-panel`)
