<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Tab Overload

**Illustrations**

Overlapping browser windows where the highlight follows the hovered tab

- **Element:** `<tc-tab-overload>`
- **Size:** 5.6 KB gzip · 16.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tab-overload";` |
| React / Next.js | `import { TabOverload } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tab-overload";` · tags starting with tc- are custom elements |
| Angular | `import { TabOverload } from "@adamstavely/trenchcoat/angular/tab-overload";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tab-overload";` |

## Example

The live example is in the gallery at `#/illustrations/tab-overload`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Three overlapping browser windows on a 3 : 2 frame that fades out to the right and the bottom. The front window is
lit – coloured dots, a gradient outline and a soft glow – and its placeholder content shimmers a few times; point at a
window behind it and the highlight moves over. It illustrates “too many tabs” or “everything in one place” on a
landing page, an empty state or an onboarding step.

### When to use

- A marketing or onboarding card about browsing, research across many pages, or bringing scattered work together.
- An empty state for a feature that collects pages or links.

### When not to use

- Showing real pages or real screenshots – use [Cover Flow](cover-flow.md).
- Illustrating files and folders rather than pages – use [Glass Folder](glass-folder.md) or [Side Folder](side-folder.md).
- A stack of layers or versions – use [Layer Stack](layer-stack.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Window** `.ui-to-tab-1` – one of the three browser frames; hovering it moves the highlight
2. **Content** `.ui-to-content-3` – the placeholder lines, bright in the lit window and faint in the others
3. **Highlight** `.ui-to-front-3` – the coloured dots and gradient outline of the lit window

## Usage

### HTML

```html
<tc-tab-overload label="Three browser windows, the front one highlighted"></tc-tab-overload>

<script type="module">
  import "@adamstavely/trenchcoat/tab-overload";
  import "@adamstavely/trenchcoat/tokens.css";

  const art = document.querySelector("tc-tab-overload");
  art.label = "Three browser windows – everything you had open, in one place";
</script>
```

### React / Next.js

```tsx
import { TabOverload } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function EmptyTabs() {
  return (
    <div style={{ width: 360 }}>
      <TabOverload label="Three browser windows, the front one highlighted" />
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tab-overload";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-tab-overload></tc-tab-overload>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { TabOverload } from "@adamstavely/trenchcoat/angular/tab-overload";

@Component({
  selector: "app-tab-overload-example",
  imports: [TabOverload],
  template: `<tc-tab-overload></tc-tab-overload>`,
})
export class TabOverloadExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tab-overload";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTabOverload } from "@adamstavely/trenchcoat/tab-overload";

  let el: TcTabOverload;
</script>

<tc-tab-overload bind:this={el}></tc-tab-overload>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string \| undefined` | `undefined` | Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tab-overload-frame` | `light-dark(#f4f5f7, #1b1b1d)` | both |
| `--tc-tab-overload-frame-edge` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.1))` | both |
| `--tc-tab-overload-dot` | `light-dark(#cccccc, #3a3a3f)` | both |
| `--tc-tab-overload-page` | `light-dark(#ffffff, #232326)` | both |
| `--tc-tab-overload-page-edge` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.08))` | both |
| `--tc-tab-overload-bar` | `light-dark(#eff1f4, #2e2e32)` | both |
| `--tc-tab-overload-bar-peak` | `light-dark(#dde1e5, #3a3a3f)` | both |
| `--tc-tab-overload-shimmer` | `2.4s` | both |

#### Design tokens it reads (2)

`--tc-duration-slow`, `--tc-ease-standard`

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tab-overload")` returns a `TcTabOverload` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTabOverload } from "@adamstavely/trenchcoat/tab-overload";`
- **React / Next.js:** Props: `import type { TabOverloadProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TabOverload>`. The element class, for refs: `import type { TcTabOverload } from "@adamstavely/trenchcoat/tab-overload";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTabOverload["label"]` with `import type { TcTabOverload } from "@adamstavely/trenchcoat/tab-overload";`
- **Angular:** The directive types the template: `[label]` takes `TcTabOverload["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTabOverload } from "@adamstavely/trenchcoat/tab-overload";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTabOverload } from "@adamstavely/trenchcoat/tab-overload";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

*Renamed or hidden on the wrapper: `children`, `look`*

## Accessibility

### Keyboard

There is nothing to operate: the highlight follows the pointer only, and the illustration takes no focus.

### Screen readers

Decorative by default: the host is `aria-hidden`. Set `label` and it becomes an image (`role="img"`) named by the
label; take the label away and it is decorative again.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

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
| **This piece alone** | 9.4 KB | 3.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **16.5 KB** | **5.6 KB** |
| With Lit – the first component on a page | 36.1 KB | 12.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 85 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 4.3 ms | default properties; includes adding its CSS to the document |

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

## Do and don't

### Do

- Set `label` when the illustration says something the text around it doesn't.
- Give it a container at least 300px wide; it scales with the width and keeps its 3 : 2 shape.

### Don't

- Don't make hovering a window the only way to reach anything – it's decoration.
- Don't put it on a busy background: the fade at the edges blends into the surface behind it.

## Related

- [Glass Folder](glass-folder.md) – Glassy blue folder with documents behind a frosted pocket that tips open on hover
- [Layer Stack](layer-stack.md) – Isometric stack of five layers with a list beside it – the chosen entry lifts its layer out in color; steps through twice and rests (`rounds`)
- [Side Folder](side-folder.md) – Glassy blue folder on its side, documents sliding out to the right as the pocket swings open on hover
