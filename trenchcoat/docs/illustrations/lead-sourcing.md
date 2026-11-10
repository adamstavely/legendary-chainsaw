<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Lead Sourcing

**Illustrations**

ChatGPT tile linked to Gmail and Grok, with a shine running along the connection

- **Element:** `<tc-lead-sourcing>`
- **Size:** 8.6 KB gzip · 23.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/lead-sourcing";` |
| React / Next.js | `import "@adamstavely/trenchcoat/lead-sourcing";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/lead-sourcing";` · tags starting with tc- are custom elements |
| Angular | `import { LeadSourcing } from "@adamstavely/trenchcoat/angular/lead-sourcing";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/lead-sourcing";` |

## Example

The live example is in the gallery at `#/illustrations/lead-sourcing`, at 320 px, 480 px or full width.

## Overview

A small card illustration: a ChatGPT tile in the middle, linked to Gmail on the left and Grok on the right, with
four empty tiles fading out around it. A coloured shine runs along the connecting line three times and then rests.
It says “these sources feed this assistant” at a glance – for a feature card, an empty state or an onboarding step
about where leads come from. The shine pauses while the illustration is off screen and is left out for people who
ask for reduced motion; its colours follow the page's light or dark theme.

### When to use

- A feature or marketing card about pulling leads or data from several apps into an AI assistant.
- An empty state or onboarding step that explains a connection before anything is connected.
- Anywhere a quiet, decorative scene helps more than a diagram.

### When not to use

- Your own product between the tools it connects, with pulses people can focus and pause – use [Integration Beam](integration-beam.md).
- Many integrations feeding one analysis hub – use [Integration Flow](integration-flow.md).
- Your mark surrounded by the companies that use it – use [Logo Cluster](logo-cluster.md).

## Usage

### HTML

```html
<tc-lead-sourcing label="Leads sourced from Gmail and Grok"></tc-lead-sourcing>

<script type="module">
  import "@adamstavely/trenchcoat/lead-sourcing";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { LeadSourcing } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SourcesCard() {
  return (
    <figure style={{ width: 320, margin: 0 }}>
      <LeadSourcing label="Leads sourced from Gmail and Grok" />
      <figcaption>Leads from your inbox and from Grok, in one place.</figcaption>
    </figure>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/lead-sourcing";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-lead-sourcing></tc-lead-sourcing>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { LeadSourcing } from "@adamstavely/trenchcoat/angular/lead-sourcing";

@Component({
  selector: "app-lead-sourcing-example",
  imports: [LeadSourcing],
  template: `<tc-lead-sourcing></tc-lead-sourcing>`,
})
export class LeadSourcingExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/lead-sourcing";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLeadSourcing } from "@adamstavely/trenchcoat/lead-sourcing";

  let el: TcLeadSourcing;
</script>

<tc-lead-sourcing bind:this={el}></tc-lead-sourcing>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string \| undefined` | `undefined` | Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden |
| `neutral` | `neutral` | `boolean` | `false` | Draw plain marks (a spark, an envelope and a globe) instead of the ChatGPT, Gmail and Grok logos |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-lead-sourcing-tile` | `light-dark(#ffffff, #232326)` | both |
| `--tc-lead-sourcing-tile-edge` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.08))` | both |
| `--tc-lead-sourcing-drop` | `light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4))` | both |
| `--tc-lead-sourcing-sliver` | `light-dark(#eaecef, #1a1a1c)` | both |
| `--tc-lead-sourcing-line` | `light-dark(#e4e7ec, #3a3a3f)` | both |
| `--tc-lead-sourcing-mark` | `light-dark(#171717, #ededed)` | both |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-lead-sourcing")` returns a `TcLeadSourcing` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLeadSourcing } from "@adamstavely/trenchcoat/lead-sourcing";`
- **React / Next.js:** The element class: `import type { TcLeadSourcing } from "@adamstavely/trenchcoat/lead-sourcing";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLeadSourcing["label"]` with `import type { TcLeadSourcing } from "@adamstavely/trenchcoat/lead-sourcing";`
- **Angular:** The directive types the template: `[label]` takes `TcLeadSourcing["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLeadSourcing } from "@adamstavely/trenchcoat/lead-sourcing";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLeadSourcing } from "@adamstavely/trenchcoat/lead-sourcing";`

## Accessibility

### Screen readers

Decorative by default: the host is `aria-hidden`. Give it a `label` and it becomes an image (`role="img"`) named by
that label – do that when the scene says something the text around it doesn't.

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

*Measured 2026-10-31 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 16.6 KB | 6.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **23.7 KB** | **8.6 KB** |
| With Lit – the first component on a page | 43.3 KB | 15.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 115 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 6.0 ms | default properties; includes adding its CSS to the document |

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

- Write the `label` as what the scene shows in context: “Leads sourced from Gmail and Grok”, not “Illustration”.
- Keep the copy next to it about the outcome; the picture carries the apps.

## Do and don't

### Do

- Set `neutral` for client-facing work: it draws plain marks in place of third-party logos.
- Let it fill the width of its container – it keeps a 3 : 2 frame and scales its art.
- Leave it decorative when a heading next to it already says the same thing.

### Don't

- Don't use it to claim an integration the product doesn't have – the logos are fixed.
- Don't place it where the moving shine competes with a task people are doing.

## Related

- [Integration Beam](integration-beam.md) – Your product between the tools it connects – light pulses flow along curved beams, hover to focus a tool, click to pause it; a few sync cycles each time it comes into view
- [Integration Flow](integration-flow.md) – Integration pills rotating along a dashed arc, each beaming its data into a central analysis hub – once round the integrations, then it rests
- [Logo Cluster](logo-cluster.md) – Your mark on a white disc in the middle – company logos bounce out of it and settle around it; the ring turns once
