<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Integration Beam

**Illustrations**

Your product between the tools it connects – light pulses flow along curved beams, hover to focus a tool, click to pause it; a few sync cycles each time it comes into view

- **Element:** `<tc-integration-beam>`
- **Size:** 12.2 KB gzip · 34.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/integration-beam";` |
| React / Next.js | `import { IntegrationBeam } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/integration-beam";` · tags starting with tc- are custom elements |
| Angular | `import { IntegrationBeam } from "@adamstavely/trenchcoat/angular/integration-beam";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/integration-beam";` |

## Example

The live example is in the gallery at `#/illustrations/integration-beam`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Your product in the middle, the tools it connects on either side, joined by curved beams. In sync cycles, soft
light pulses travel from the tools on the left into your product and on to the tools on the right, and each arrival
makes its target glow – data moving through your product, shown rather than told. Pointing at a tool brings its beam
forward; clicking it pauses that tool and the chip under your product counts what's still connected. On narrow
widths the tools stack above and below, and the beams bend into their new places.

### When to use

- A landing or feature section that explains how your product sits between two sets of tools.
- The header of an integrations or sync page, above the real settings.
- Onboarding, to show what will happen once the tools are connected.

### When not to use

- Connecting, disconnecting or configuring real integrations – the toggles only change the picture; use
  [Integration Picker](../components/integration-picker.md) or [Integration Settings](../components/integration-settings.md).
- Showing many integrations at once – it is built for about three on each side; use [Integration Grid](integration-grid.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tool** `.ui-ib__tool` – a tool's tile, a toggle button that pauses or reconnects it; its name shows on hover
2. **Beam** `.ui-ib__line` – the curve from a tool to your product, with pulses travelling along it
3. **Product** `.ui-ib__center` – the dark tile with your mark in the middle
4. **Status** `.ui-ib__chip` – “Syncing…”, “6 connected” or “All paused”, under your product

## Looks

One look. Colours follow the page theme through `light-dark()`, so it works with a `.dark` class, `data-theme`,
`data-tc-theme` or the system setting. A paused tool turns grey and its beam turns to a faint dashed line; the beam you
point at or focus brightens while the others dim.

## Usage

### HTML

```html
<tc-integration-beam id="beam"></tc-integration-beam>

<script type="module">
  import "@adamstavely/trenchcoat/integration-beam";
  import "@adamstavely/trenchcoat/tokens.css";

  const logo = (src) => Object.assign(new Image(28, 28), { src, alt: "" });
  const beam = document.querySelector("#beam");
  beam.left = [{ name: "Slack", logo: logo("/logos/slack.svg") }, { name: "Gmail", logo: logo("/logos/gmail.svg") }];
  beam.right = [{ name: "Notion", logo: logo("/logos/notion.svg") }, { name: "Linear", logo: logo("/logos/linear.svg") }];
  beam.center = { name: "Acme" };
  beam.addEventListener("click", (e) => {
    const tool = e.target.closest("button");
    if (tool) console.log(tool.getAttribute("aria-label"));
  });
</script>
```

### React / Next.js

```tsx
import { IntegrationBeam, type BeamTool } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const logo = (src: string) => <img src={src} alt="" width={28} height={28} />;

const left: BeamTool[] = [
  { name: "Slack", logo: logo("/logos/slack.svg") },
  { name: "Gmail", logo: logo("/logos/gmail.svg") },
];
const right: BeamTool[] = [
  { name: "Notion", logo: logo("/logos/notion.svg") },
  { name: "Linear", logo: logo("/logos/linear.svg") },
];

export function SyncHero() {
  return <IntegrationBeam left={left} right={right} center={{ name: "Acme" }} label="Acme syncs your chat and mail to your docs" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/integration-beam";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcIntegrationBeam } from "@adamstavely/trenchcoat/integration-beam";

defineProps<{ left: TcIntegrationBeam["left"]; right: TcIntegrationBeam["right"] }>();
</script>

<template>
  <tc-integration-beam :left="left" :right="right"></tc-integration-beam>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { IntegrationBeam } from "@adamstavely/trenchcoat/angular/integration-beam";
import type { TcIntegrationBeam } from "@adamstavely/trenchcoat/integration-beam";

@Component({
  selector: "app-integration-beam-example",
  imports: [IntegrationBeam],
  template: `<tc-integration-beam [left]="left()" [right]="right()"></tc-integration-beam>`,
})
export class IntegrationBeamExample {
  readonly left = input.required<TcIntegrationBeam["left"]>();
  readonly right = input.required<TcIntegrationBeam["right"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/integration-beam";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcIntegrationBeam } from "@adamstavely/trenchcoat/integration-beam";

  let { left, right }: { left: TcIntegrationBeam["left"]; right: TcIntegrationBeam["right"] } = $props();
  let el: TcIntegrationBeam;
</script>

<tc-integration-beam bind:this={el} {left} {right}></tc-integration-beam>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `left` | – | `IntegrationBeamTool[] \| undefined` | `undefined` | Tools that send data in (left, or above on narrow widths) – three look best; unset shows a default set |
| `right` | – | `IntegrationBeamTool[] \| undefined` | `undefined` | Tools that receive data (right, or below on narrow widths) – three look best; unset shows a default set |
| `center` | – | `IntegrationBeamCenter` | `{ name: "Acme" }` | The product in the middle |
| `label` | `label` | `string \| undefined` | `undefined` | Accessible description of the scene – defaults to the product and the tools it connects |

#### Design tokens it reads (42)

`--tc-duration-base`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-integration-beam-accent`, `--tc-integration-beam-breathe`, `--tc-integration-beam-ease`, `--tc-integration-beam-faint`, `--tc-integration-beam-glow`, `--tc-integration-beam-hub`, `--tc-integration-beam-hub-edge`, `--tc-integration-beam-hub-mark`, `--tc-integration-beam-line`, `--tc-integration-beam-line-hi`, `--tc-integration-beam-pulse`, `--tc-integration-beam-ring`, `--tc-integration-beam-shadow`, `--tc-integration-beam-tip-color`, `--tc-integration-beam-tip-from`, `--tc-line-height-tight`, `--tc-radius-2xl`, `--tc-radius-full`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-surface-inverse`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`

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
| `left` | `el.left = …;` | `<… left={…} />` | `<tc-integration-beam :left="…">` | `<tc-integration-beam [left]="…">` | `<tc-integration-beam {left}>` |
| `right` | `el.right = …;` | `<… right={…} />` | `<tc-integration-beam :right="…">` | `<tc-integration-beam [right]="…">` | `<tc-integration-beam {right}>` |
| `center` | `el.center = …;` | `<… center={…} />` | `<tc-integration-beam :center="…">` | `<tc-integration-beam [center]="…">` | `<tc-integration-beam {center}>` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-integration-beam")` returns a `TcIntegrationBeam` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcIntegrationBeam } from "@adamstavely/trenchcoat/integration-beam";`
- **React / Next.js:** Props: `import type { IntegrationBeamProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof IntegrationBeam>`. The element class, for refs: `import type { TcIntegrationBeam } from "@adamstavely/trenchcoat/integration-beam";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcIntegrationBeam["left"]` with `import type { TcIntegrationBeam } from "@adamstavely/trenchcoat/integration-beam";`
- **Angular:** The directive types the template: `[left]` takes `TcIntegrationBeam["left"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcIntegrationBeam } from "@adamstavely/trenchcoat/integration-beam";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcIntegrationBeam } from "@adamstavely/trenchcoat/integration-beam";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `left` | `BeamTool[]` | Tools that send data in (left, or above on narrow widths) – three look best |
| `right` | `BeamTool[]` | Tools that receive data (right, or below on narrow widths) – three look best |
| `center` | `BeamCenter` | The product in the middle |

*Renamed or hidden on the wrapper: `left`, `right`, `center`, `children`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the tools, left to right; a focused tool brings its beam forward and shows its name |
| Enter / Space | Pauses the focused tool, or connects it again |

### Screen readers

The host is a `group` named by `label`, or by your product and the tools (“Acme connected to Slack, Notion, …”).
Each tool is a toggle button named with its state (“Slack, connected”) and `aria-pressed`. A polite live region
says what a click did: “Slack paused. 5 of 6 connected.” The beams, pulses and logos are hidden.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
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
| **This piece alone** | 27.6 KB | 10.2 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.4 KB** | **12.2 KB** |
| With Lit – the first component on a page | 54.6 KB | 18.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.9 ms** | the gallery demo's data, 127 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 3 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange`.
- Reads the clock: `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name every tool and your product the way people know them – the names are the only text screen readers get.
- Put the tools that send data on the left (`left`) and those that receive it on the right (`right`).
- Set `label` when a sentence says it better than the list of names (“Acme syncs your CRM to your inbox”).

## Do and don't

### Do

- Keep three tools on each side – that's what the curves are drawn for.
- Pass logos as `<svg>` elements; they fill a 28 × 28 box, your mark a 36 × 36 box.
- Let the pulses rest: they run a few cycles each time the scene comes into view, and stay off with reduced motion.

### Don't

- Don't wire the toggles to real connections – pausing here changes nothing outside the picture.
- Don't put it where people have to read something else at the same time – the motion pulls the eye.

## Related

- [Integration Grid](integration-grid.md) – Honeycomb-like wall of integration logos around a bright centre tile with your product mark, fading out toward the edges
- [Integration Picker](../components/integration-picker.md) – Integrations page of a command menu – search, a list of services and the picked one with its connection on two tiles
- [Integration Settings](../components/integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
