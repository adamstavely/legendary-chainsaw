<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Logo Cluster

**Illustrations**

Your mark on a white disc in the middle – company logos bounce out of it and settle around it; the ring turns once

- **Element:** `<tc-logo-cluster>`
- **Size:** 15.8 KB gzip · 37.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/logo-cluster";` |
| React / Next.js | `import "@adamstavely/trenchcoat/logo-cluster";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/logo-cluster";` · tags starting with tc- are custom elements |
| Angular | `import { LogoCluster } from "@adamstavely/trenchcoat/angular/logo-cluster";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/logo-cluster";` |

## Example

The live example is in the gallery at `#/illustrations/logo-cluster`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An illustration that says “this fits in with the tools you already use”: a brand mark on a white disc in the
middle, with company logos gathered round it in bubbles of mixed sizes. When it scrolls into view the disc appears
first and the logos bounce out of it one after another; once they have landed the ring turns once, slowly, and
rests, the logos staying upright. It is square and scales with its container, up to 420 px.

### When to use

- In a landing or onboarding section about integrations, as the picture beside the copy.
- In an empty state for an integrations page, before anything is connected.

### When not to use

- When the logos are the product's actual integrations and people need to pick one – use [Integration Picker](../components/integration-picker.md).
- To show data moving between two services – use [Integration Beam](integration-beam.md).
- To lay out many integrations as a browsable set – use [Integration Grid](integration-grid.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Middle** `.ui-lc-mid` – the white disc with the brand mark, which appears first
2. **Ring** `.ui-lc-orbit` – the logos together, which turn once after they land
3. **Bubble** `.ui-lc-face` – one company logo on its own disc

## Usage

### HTML

```html
<tc-logo-cluster id="tools"></tc-logo-cluster>

<script type="module">
  import "@adamstavely/trenchcoat/logo-cluster";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#tools").label = "Works with Notion, Figma, Linear and more";
</script>
```

### React / Next.js

```tsx
import { LogoCluster } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Tools() {
  return <LogoCluster label="Works with Notion, Figma, Linear and more" style={{ maxWidth: 320 }} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/logo-cluster";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-logo-cluster></tc-logo-cluster>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { LogoCluster } from "@adamstavely/trenchcoat/angular/logo-cluster";

@Component({
  selector: "app-logo-cluster-example",
  imports: [LogoCluster],
  template: `<tc-logo-cluster></tc-logo-cluster>`,
})
export class LogoClusterExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/logo-cluster";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLogoCluster } from "@adamstavely/trenchcoat/logo-cluster";

  let el: TcLogoCluster;
</script>

<tc-logo-cluster bind:this={el}></tc-logo-cluster>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-logo-cluster-mid` | `light-dark(#ffffff, #2a2a2e)` | both |
| `--tc-logo-cluster-ring` | `light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08))` | both |
| `--tc-logo-cluster-shadow` | `0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 8px 20px -8px light-dark(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.6))` | both |
| `--tc-logo-cluster-shadow-hover` | `0 2px 4px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.45)), 0 14px 28px -10px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.7))` | both |
| `--tc-logo-cluster-spin` | `48s` | both |

#### Design tokens it reads (8)

`--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-surface-overlay`, `--tc-text-primary`

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-logo-cluster")` returns a `TcLogoCluster` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLogoCluster } from "@adamstavely/trenchcoat/logo-cluster";`
- **React / Next.js:** The element class: `import type { TcLogoCluster } from "@adamstavely/trenchcoat/logo-cluster";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLogoCluster["label"]` with `import type { TcLogoCluster } from "@adamstavely/trenchcoat/logo-cluster";`
- **Angular:** The directive types the template: `[label]` takes `TcLogoCluster["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLogoCluster } from "@adamstavely/trenchcoat/logo-cluster";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLogoCluster } from "@adamstavely/trenchcoat/logo-cluster";`

## Accessibility

### Keyboard

Nothing to operate – the cluster takes no focus.

### Screen readers

Decorative by default: the host is `aria-hidden="true"` and screen readers skip it. Set `label` and the host becomes
`role="img"` named by it (“Works with Notion, Figma, Linear and more”); the logos themselves stay hidden.

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
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This piece alone** | 30.4 KB | 13.5 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **37.1 KB** | **15.8 KB** |
| With Lit – the first component on a page | 57.8 KB | 22.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 33 DOM nodes – to layout, median of 7 |
| Typical update | **2.7 ms** | re-render with the same data |
| First on the page | 7.7 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Set `label` when the cluster is the only place the page names the tools.
- Give it a square space at least 240 px wide, so the smallest bubbles keep a readable logo.

### Don't

- Don't use it to claim integrations the product doesn't have – the logos are fixed: Notion, Spotify, Stripe, Google
  Calendar, Linear, GitHub and Figma.
- Don't put two clusters on one screen; the entrance is meant to be seen once.

## Related

- [Integration Beam](integration-beam.md) – Your product between the tools it connects – light pulses flow along curved beams, hover to focus a tool, click to pause it; a few sync cycles each time it comes into view
- [Integration Grid](integration-grid.md) – Honeycomb-like wall of integration logos around a bright centre tile with your product mark, fading out toward the edges
- [Model Wheel](model-wheel.md) – AI model names on a turning drum – the rows bend away at the edges and each model lands on a soft gray fill; turns once round the drum and rests (`turns`)
