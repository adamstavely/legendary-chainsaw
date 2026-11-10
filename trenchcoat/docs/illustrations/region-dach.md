<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# DACH Region

**Illustrations**

DACH map with fading neighbours and a pastel band along the border, switchable to the US, China, India, Brazil or Japan

- **Element:** `<tc-region-dach>`
- **Size:** 29.0 KB gzip · 78.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/region-dach";` |
| React / Next.js | `import { RegionDach } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/region-dach";` · tags starting with tc- are custom elements |
| Angular | `import { RegionDach } from "@adamstavely/trenchcoat/angular/region-dach";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/region-dach";` |

## Example

The live example is in the gallery at `#/illustrations/region-dach`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A calm map for marketing pages and empty states that talk about a market: Germany, Austria and Switzerland sit
filled in the middle, the neighbouring countries fade out towards the edges, and a pastel band travels along the
outer border twice, then rests. A small menu in the top-left corner switches the map to the United States, China,
India, Brazil or Japan; the old map fades out as the new one fades in. Country shapes come from Natural Earth.

### When to use

- A landing page or announcement about launching in, or serving, one of the six regions.
- An empty state for region settings – “No customers in DACH yet”.
- Letting visitors see the same message for another market with the menu.

### When not to use

- Showing where things are across the whole world – use [World Map Continental](world-map.md).
- Picking a region as part of a form – use [Combobox](../components/combobox.md) or [Segmented Control](../components/segmented-control.md), and keep the map as decoration.
- Showing the services a product connects to – use [Integration Grid](integration-grid.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Map** `.ui-rd-map` – the countries of the region, filled, with the neighbours fading out
2. **Band** `.ui-rd-band` – the pastel light travelling along the outer border
3. **Menu** `.ui-rd-trigger` – shows the current region and opens the list of the six

## Usage

### HTML

```html
<tc-region-dach id="map" region="dach"></tc-region-dach>

<script type="module">
  import "@adamstavely/trenchcoat/region-dach";

  const map = document.querySelector("#map");
  map.label = (region) =>
    region === "dach"
      ? "Our customers in Germany, Austria and Switzerland"
      : `Our customers in ${region.toUpperCase()}`;
  map.addEventListener("tc-region-change", (e) => console.log(e.detail.region));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RegionDach, type Region } from "@adamstavely/trenchcoat/react";

export function MarketMap() {
  const [region, setRegion] = useState<Region>("dach");
  return <RegionDach region={region} onRegionChange={setRegion} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/region-dach";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";

defineProps<{ label: TcRegionDach["label"] }>();
const onRegionChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-region-dach :label="label" @tc-region-change="onRegionChange"></tc-region-dach>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RegionDach } from "@adamstavely/trenchcoat/angular/region-dach";
import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";

@Component({
  selector: "app-region-dach-example",
  imports: [RegionDach],
  template: `<tc-region-dach [label]="label()" (tc-region-change)="onRegionChange($event)"></tc-region-dach>`,
})
export class RegionDachExample {
  readonly label = input.required<TcRegionDach["label"]>();
  onRegionChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/region-dach";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";

  let { label }: { label: TcRegionDach["label"] } = $props();
  let el: TcRegionDach;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-region-change", on);
    return () => el.removeEventListener("tc-region-change", on);
  });
</script>

<tc-region-dach bind:this={el} {label}></tc-region-dach>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `region` | `region` | `Region` | `"dach"` | Shown region |
| `showSwitcher` | `show-switcher` | `boolean` | `true` | Show the region menu in the top-left corner |
| `label` | – | `string \| ((region: Region) => string) \| undefined` | `undefined` | Accessible description of the map; a function receives the current region |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-region-change` | – | Yes | Cancelable, when the viewer picks a region; detail: RegionDachRegionChange ({ region }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-region-dach-travel` | `14s` | both |
| `--tc-region-dach-loops` | `2` | both |
| `--tc-region-dach-chevron` | `light-dark(#737373, #8f8f8f)` | both |
| `--tc-region-dach-menu-shadow` | `light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.4))` | both |
| `--tc-region-dach-menu-shadow-near` | `light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.35))` | both |
| `--tc-region-dach-drop` | `light-dark(rgba(31, 33, 40, 0.07), rgba(0, 0, 0, 0.45))` | both |
| `--tc-region-dach-neighbors` | `light-dark(#a6abb3, #5c5c63)` | both |
| `--tc-region-dach-land` | `light-dark(#f8f8f8, #2c2c30)` | both |
| `--tc-region-dach-land-edge` | `light-dark(#d6d9de, #4a4a50)` | both |
| `--tc-region-dach-s` | `1` | not set – this fallback applies |

#### Design tokens it reads (38)

`--tc-border-default`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-emphasized`, `--tc-ease-in`, `--tc-ease-out`, `--tc-ease-spring`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-weight-medium`, `--tc-line-height-none`, `--tc-line-height-snug`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-radius-full`, `--tc-region-dach-morph`, `--tc-shadow-control`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-surface-overlay`, `--tc-text-primary`

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-region-dach :label="…">` | `<tc-region-dach [label]="…">` | `<tc-region-dach {label}>` |

*Also attributes: `region`, `show-switcher` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-region-change` | Yes | `el.addEventListener("tc-region-change", (e) => …)` | `ref.current.addEventListener("tc-region-change", …)` | `@tc-region-change="…"` | `(tc-region-change)="…($event)"` | `el.addEventListener("tc-region-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `region` itself unless a listener calls `preventDefault()` on `tc-region-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-region-dach id="region-dach"></tc-region-dach>

<script type="module">
  import "@adamstavely/trenchcoat/region-dach";

  const el = document.querySelector("#region-dach");
  el.addEventListener("tc-region-change", (e) => {
    e.preventDefault(); // the element keeps its region…
    if (allowed(e.detail.region)) el.region = e.detail.region; // …until the app sets it
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
import "@adamstavely/trenchcoat/region-dach";
import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";

const props = defineProps<{ initial: TcRegionDach["region"] }>();
const region = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRegionChange = (e: CustomEvent<{ region: TcRegionDach["region"] }>) => {
  e.preventDefault();
  region.value = e.detail.region;
};
</script>

<template>
  <tc-region-dach :region="region" @tc-region-change="onRegionChange"></tc-region-dach>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RegionDach } from "@adamstavely/trenchcoat/angular/region-dach";
import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";

@Component({
  selector: "app-controlled-region-dach",
  imports: [RegionDach],
  template: `<tc-region-dach [region]="region()" (tc-region-change)="onRegionChange($event)"></tc-region-dach>`,
})
export class ControlledRegionDach {
  readonly initial = input.required<TcRegionDach["region"]>();
  readonly region = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRegionChange(e: CustomEvent<{ region: TcRegionDach["region"] }>) {
    e.preventDefault();
    this.region.set(e.detail.region);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/region-dach";
  import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";

  let { initial }: { initial: TcRegionDach["region"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let region = $derived(initial);
  let el: TcRegionDach;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      region = (e as CustomEvent<{ region: TcRegionDach["region"] }>).detail.region;
    };
    el.addEventListener("tc-region-change", on);
    return () => el.removeEventListener("tc-region-change", on);
  });
</script>

<tc-region-dach bind:this={el} {region}></tc-region-dach>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-region-dach")` returns a `TcRegionDach` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";`
- **React / Next.js:** Props: `import type { RegionDachProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RegionDach>`. The element class, for refs: `import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRegionDach["label"]` with `import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";`
- **Angular:** The directive types the template: `[label]` takes `TcRegionDach["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRegionDach } from "@adamstavely/trenchcoat/region-dach";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `region` | `Region` | Shown region (controlled when defined; pass onRegionChange so the menu can change it) |
| `defaultRegion` | `Region` | Region shown first when `region` is not set |
| `onRegionChange` | `(region: Region) => void` | Called when the viewer picks a region in the menu |

*Renamed or hidden on the wrapper: `region`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the menu button: opens the list, with focus on it |
| ↓ / ↑ | On the menu button: opens the list; in the list: moves to the next or previous region |
| Home / End | In the list: moves to the first or last region |
| Enter / Space | In the list: picks the region and returns focus to the menu button |
| Escape | Closes the list and returns focus to the menu button |
| Tab | Closes the list and moves on |

### Screen readers

The map is an image with a name that follows the region – “Map of the DACH region: Germany, Austria and Switzerland”,
“Map of Japan” – or your own `label`. The menu button is named “Region: DACH” with `aria-haspopup="listbox"` and
`aria-expanded`; the list is a `listbox` named “Select a region”, with `aria-activedescendant` on the active option
and `aria-selected` on the one shown.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
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

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 71.8 KB | 26.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **78.9 KB** | **28.9 KB** |
| With Lit – the first component on a page | 100.7 KB | 36.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 84 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 7.1 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document pointerdown`, `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pass `label` when the map carries a message of its own – “Our customers in Germany, Austria and Switzerland”.
- Put the words next to the map, not on it: a heading and a sentence about the region.

## Do and don't

### Do

- Turn the menu off (`show-switcher="false"`) when the page is about one region only.
- Listen to `tc-region-change` if the text around the map should change with it.

### Don't

- Don't use it as the only way to choose a region that matters to the product – it's an illustration.
- Don't make it narrower than about 340px – below that the menu stops shrinking with the map and covers more of it.

## Related

- [World Map Continental](world-map.md) – World map with one highlighted continent and a pastel band along its coastline, switchable between all six
- [Integration Grid](integration-grid.md) – Honeycomb-like wall of integration logos around a bright centre tile with your product mark, fading out toward the edges
- [Logo Cluster](logo-cluster.md) – Your mark on a white disc in the middle – company logos bounce out of it and settle around it; the ring turns once
