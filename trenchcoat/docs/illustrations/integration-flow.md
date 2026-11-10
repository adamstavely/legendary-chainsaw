<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Integration Flow

**Illustrations**

Integration pills rotating along a dashed arc, each beaming its data into a central analysis hub – once round the integrations, then it rests

- **Element:** `<tc-integration-flow>`
- **Size:** 19.5 KB gzip · 61.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/integration-flow";` |
| React / Next.js | `import { IntegrationFlow } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/integration-flow";` · tags starting with tc- are custom elements |
| Angular | `import { IntegrationFlow } from "@adamstavely/trenchcoat/angular/integration-flow";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/integration-flow";` |

## Example

The live example is in the gallery at `#/illustrations/integration-flow`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An animated scene for marketing pages and empty states: integration pills turn along a dashed arc, and each one in
turn charges up and sends a beam of light into a central “Data Analysis” hub. It shows, without words, that data
from many tools ends up in one place. The scene goes once round the integrations (at least five turns), then rests
on the centre pill; it only runs while it is on screen, and stays still for people who prefer reduced motion.

### When to use

- A landing or onboarding page explaining that the product pulls data from the tools people already use.
- An empty state before any integration is connected, showing what connecting one will do.

### When not to use

- Letting people pick and connect integrations – use [Integration Picker](../components/integration-picker.md).
- Showing your product between the tools it connects, with hover and pause – use [Integration Beam](integration-beam.md).
- A wall of every supported logo – use [Integration Grid](integration-grid.md).
- An AI step enriching data rather than collecting it – use [Enrichment Orbit](enrichment-orbit.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Hub** `.ui-if-hub` – “Data Analysis”, where every beam lands
2. **Pill** `.ui-if-pill` – one integration: its logo, a title and its name
3. **Beam** `.ui-if-link` – the light that sweeps from the centre pill to the hub

## Usage

### HTML

```html
<tc-integration-flow id="flow" label="Your CRM, inbox and calendar feeding one analysis hub"></tc-integration-flow>

<script type="module">
  import "@adamstavely/trenchcoat/integration-flow";
  import "@adamstavely/trenchcoat/tokens.css";

  const flow = document.querySelector("#flow");
  const logo = (src) => Object.assign(document.createElement("img"), { src, alt: "" });
  flow.items = [
    { name: "HubSpot", title: "CRM", icon: logo("/logos/hubspot.svg") },
    { name: "Gmail", title: "Inbox", icon: logo("/logos/gmail.svg") },
    { name: "Calendar", title: "Schedule", icon: logo("/logos/calendar.svg") },
    { name: "Slack", icon: logo("/logos/slack.svg") },
    { name: "Notion", icon: logo("/logos/notion.svg") },
  ];
</script>
```

### React / Next.js

```tsx
import { IntegrationFlow } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Hero() {
  return (
    <IntegrationFlow
      label="Your CRM and inbox feeding one analysis hub"
      items={[
        { name: "HubSpot", title: "CRM", icon: <img src="/logos/hubspot.svg" alt="" /> },
        { name: "Gmail", title: "Inbox", icon: <img src="/logos/gmail.svg" alt="" /> },
      ]}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/integration-flow";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcIntegrationFlow } from "@adamstavely/trenchcoat/integration-flow";

defineProps<{ items: TcIntegrationFlow["items"] }>();
</script>

<template>
  <tc-integration-flow :items="items"></tc-integration-flow>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { IntegrationFlow } from "@adamstavely/trenchcoat/angular/integration-flow";
import type { TcIntegrationFlow } from "@adamstavely/trenchcoat/integration-flow";

@Component({
  selector: "app-integration-flow-example",
  imports: [IntegrationFlow],
  template: `<tc-integration-flow [items]="items()"></tc-integration-flow>`,
})
export class IntegrationFlowExample {
  readonly items = input.required<TcIntegrationFlow["items"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/integration-flow";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcIntegrationFlow } from "@adamstavely/trenchcoat/integration-flow";

  let { items }: { items: TcIntegrationFlow["items"] } = $props();
  let el: TcIntegrationFlow;
</script>

<tc-integration-flow bind:this={el} {items}></tc-integration-flow>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string \| undefined` | `undefined` | The scene's accessible name (it is an image) – defaults to one naming the first integrations |
| `items` | – | `IntegrationFlowItem[] \| undefined` | `undefined` | Integrations that rotate through the pills (5 or more look best); unset or empty shows a default set |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-integration-flow-bg` | `light-dark(#ffffff, #1f1f21)` | both |
| `--tc-integration-flow-fade` | `light-dark(#ffffff, #1f1f21)` | both |
| `--tc-integration-flow-veil` | `light-dark(transparent, rgba(31, 31, 33, 0.2))` | both |
| `--tc-integration-flow-haze` | `light-dark(#ffffff, transparent)` | both |
| `--tc-integration-flow-glow` | `light-dark(#ffffff, rgba(255, 255, 255, 0.45))` | both |
| `--tc-integration-flow-card-top` | `light-dark(rgba(255, 255, 255, 0.8), rgba(38, 38, 41, 0.86))` | both |
| `--tc-integration-flow-card-bottom` | `light-dark(rgba(255, 255, 255, 0.4), rgba(38, 38, 41, 0.62))` | both |
| `--tc-integration-flow-card-edge` | `light-dark(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.08))` | both |
| `--tc-integration-flow-card-shadow` | `light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.28))` | both |
| `--tc-integration-flow-ghost-top` | `light-dark(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.1))` | both |
| `--tc-integration-flow-ghost-bottom` | `light-dark(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))` | both |
| `--tc-integration-flow-charge` | `light-dark(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.14))` | both |
| `--tc-integration-flow-ink-title` | `light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.92))` | both |
| `--tc-integration-flow-ink-sub` | `light-dark(rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.5))` | both |
| `--tc-integration-flow-loops` | `2` | both |
| `--tc-integration-flow-step` | `.9s` | both |
| `--tc-integration-flow-sweep` | `1.1s` | both |
| `--tc-integration-flow-step-ease` | `cubic-bezier(.65, .02, .25, 1)` | both |
| `--tc-integration-flow-sweep-ease` | `cubic-bezier(.55, .06, .25, 1)` | both |
| `--tc-integration-flow-title-size` | `37px` | both |
| `--tc-integration-flow-sub-size` | `33.5px` | both |

#### Design tokens it reads (18)

`--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-in`, `--tc-ease-in-out`, `--tc-font-sans`, `--tc-integration-flow-delay`, `--tc-integration-flow-dur`, `--tc-integration-flow-dx`, `--tc-integration-flow-dy`, `--tc-integration-flow-fdelay`, `--tc-integration-flow-fdur`, `--tc-integration-flow-hi`, `--tc-integration-flow-ink`, `--tc-integration-flow-lo`, `--tc-integration-flow-r1`, `--tc-integration-flow-rot`, `--tc-space-2`, `--tc-space-5`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-integration-flow :items="…">` | `<tc-integration-flow [items]="…">` | `<tc-integration-flow {items}>` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-integration-flow")` returns a `TcIntegrationFlow` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcIntegrationFlow } from "@adamstavely/trenchcoat/integration-flow";`
- **React / Next.js:** Props: `import type { IntegrationFlowProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof IntegrationFlow>`. The element class, for refs: `import type { TcIntegrationFlow } from "@adamstavely/trenchcoat/integration-flow";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcIntegrationFlow["items"]` with `import type { TcIntegrationFlow } from "@adamstavely/trenchcoat/integration-flow";`
- **Angular:** The directive types the template: `[items]` takes `TcIntegrationFlow["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcIntegrationFlow } from "@adamstavely/trenchcoat/integration-flow";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcIntegrationFlow } from "@adamstavely/trenchcoat/integration-flow";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `IntegrationItem[]` | Integrations that rotate through the pills (5 or more look best) |

*Renamed or hidden on the wrapper: `items`, `children`*

## Accessibility

### Screen readers

The scene is one image (`role="img"`) whose name is `label`, or – when it is unset – a sentence naming the first
three integrations: “Integrations like HubSpot, Gmail and Calendar sending data into a central data analysis hub”.
Everything inside is hidden from assistive technology. Write `label` when the page needs the scene to say
something more specific.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| backdrop-filter (with the -webkit- prefix) | 76 (Edge 17) | 103 | 9 | 9 | itself | What's behind a translucent surface isn't blurred; the surface keeps its fill. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 53.9 KB | 17.2 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **61.0 KB** | **19.6 KB** |
| With Lit – the first component on a page | 81.7 KB | 26.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.7 ms** | the gallery demo's data, 243 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 3 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **0 timer callbacks/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Related

- [Integration Beam](integration-beam.md) – Your product between the tools it connects – light pulses flow along curved beams, hover to focus a tool, click to pause it; a few sync cycles each time it comes into view
- [Integration Grid](integration-grid.md) – Honeycomb-like wall of integration logos around a bright centre tile with your product mark, fading out toward the edges
- [Enrichment Orbit](enrichment-orbit.md) – Grok tile inside two rings with comets and data nodes orbiting around it – a few rounds, then they rest
- [Integration Picker](../components/integration-picker.md) – Integrations page of a command menu – search, a list of services and the picked one with its connection on two tiles
