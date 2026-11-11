<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Enrichment Orbit

**Illustrations**

Grok tile inside two rings with comets and data nodes orbiting around it – a few rounds, then they rest

- **Element:** `<tc-enrichment-orbit>`
- **Size:** 6.7 KB gzip · 17.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/enrichment-orbit";` |
| React / Next.js | `import "@adamstavely/trenchcoat/enrichment-orbit";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/enrichment-orbit";` · tags starting with tc- are custom elements |
| Angular | `import { EnrichmentOrbit } from "@adamstavely/trenchcoat/angular/enrichment-orbit";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/enrichment-orbit";` |

## Example

The live example is in the gallery at `#/illustrations/enrichment-orbit`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A small animated scene that says “an AI model is working on your data”: a Grok tile sits inside two rings, coloured
comets run round the rings in opposite directions, and three data nodes orbit the outer ring, staying upright as
they travel. It suits loading and empty states where enrichment takes a while. The comets and nodes make a few
rounds and then rest; they hold still off screen, in a hidden tab, and for people who prefer reduced motion.
Colours follow the page theme.

### When to use

- An empty or waiting state while records are being enriched, scored or researched by a model.
- A marketing section about data enrichment.

### When not to use

- A short wait inside a conversation – use [Thinking Loader](../components/thinking-loader.md).
- Showing data arriving from several tools – use [Integration Flow](integration-flow.md).
- Showing one tool reaching out to others – use [Lead Sourcing](lead-sourcing.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tile** `.ui-eo-tile` – the model's mark in the centre
2. **Rings** `.ui-eo-rings` – the two orbits
3. **Comets** `.ui-eo-spin` – coloured light running round each ring
4. **Node** `.ui-eo-orbit` – one of the three data nodes travelling round the outer ring

## Usage

### HTML

```html
<div style="width: 320px">
  <tc-enrichment-orbit id="orbit"></tc-enrichment-orbit>
</div>

<script type="module">
  import "@adamstavely/trenchcoat/enrichment-orbit";
  import "@adamstavely/trenchcoat/tokens.css";

  // Named while the work runs; without a label the scene is decorative
  document.querySelector("#orbit").label = "Enriching your leads";
</script>
```

### React / Next.js

```tsx
import { EnrichmentOrbit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Enriching() {
  return (
    <div style={{ width: 320 }}>
      <EnrichmentOrbit label="Enriching your leads" />
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/enrichment-orbit";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-enrichment-orbit></tc-enrichment-orbit>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { EnrichmentOrbit } from "@adamstavely/trenchcoat/angular/enrichment-orbit";

@Component({
  selector: "app-enrichment-orbit-example",
  imports: [EnrichmentOrbit],
  template: `<tc-enrichment-orbit></tc-enrichment-orbit>`,
})
export class EnrichmentOrbitExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/enrichment-orbit";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEnrichmentOrbit } from "@adamstavely/trenchcoat/enrichment-orbit";

  let el: TcEnrichmentOrbit;
</script>

<tc-enrichment-orbit bind:this={el}></tc-enrichment-orbit>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Accessible description – when set, the scene is announced as an image; otherwise it is decorative |
| `neutral` | `neutral` | `boolean` | `false` | Draw a plain spark instead of the Grok logo |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-enrichment-orbit-comet` | `7s` | both |
| `--tc-enrichment-orbit-node` | `22s` | both |

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

*Also attributes: `label`, `neutral` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-enrichment-orbit")` returns a `TcEnrichmentOrbit` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEnrichmentOrbit } from "@adamstavely/trenchcoat/enrichment-orbit";`
- **React / Next.js:** The element class: `import type { TcEnrichmentOrbit } from "@adamstavely/trenchcoat/enrichment-orbit";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEnrichmentOrbit["label"]` with `import type { TcEnrichmentOrbit } from "@adamstavely/trenchcoat/enrichment-orbit";`
- **Angular:** The directive types the template: `[label]` takes `TcEnrichmentOrbit["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEnrichmentOrbit } from "@adamstavely/trenchcoat/enrichment-orbit";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEnrichmentOrbit } from "@adamstavely/trenchcoat/enrichment-orbit";`

## Accessibility

### Screen readers

Decorative by default: the element is `aria-hidden` and assistive technology skips it. Set `label` and it becomes an
image named by that text (“Enriching your leads”) – do that when the scene is the only sign that work is going on,
and say what is happening, not what it looks like.

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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 10.1 KB | 4.4 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **17.3 KB** | **6.7 KB** |
| With Lit – the first component on a page | 38.0 KB | 13.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 60 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |

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

## Related

- [Integration Flow](integration-flow.md) – Integration pills rotating along a dashed arc, each beaming its data into a central analysis hub – once round the integrations, then it rests
- [Lead Sourcing](lead-sourcing.md) – ChatGPT tile linked to Gmail and Grok, with a shine running along the connection
- [Thinking Loader](../components/thinking-loader.md) – A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check
