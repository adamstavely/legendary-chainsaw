<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# World Map Continental

**Illustrations**

World map with one highlighted continent and a pastel band along its coastline, switchable between all six

- **Element:** `<tc-world-map>`
- **Size:** 18.7 KB gzip · 55.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/world-map";` |
| React / Next.js | `import { WorldMap } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/world-map";` · tags starting with tc- are custom elements |
| Angular | `import { WorldMap } from "@adamstavely/trenchcoat/angular/world-map";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/world-map";` |

## Example

The live example is in the gallery at `#/illustrations/world-map`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A world map with one continent picked out: the highlighted continent sits white with a soft shadow on a light gray
world, and a pastel band travels twice round its coastline before it rests. A small menu in the top-left corner
switches between the six continents, the old highlight fading as the new one settles in. Use it to say where
something happens – a region a product launches in, where a team or its customers are – at a glance.

### When to use

- In a section about regional availability, data residency or a launch in one part of the world.
- Beside copy about a team, an office or customers on one continent.
- In onboarding, where the person's region is already known and the map confirms it.

### When not to use

- For a single country or region within a continent – use [DACH Region](region-dach.md) for the German-speaking region.
- To show that a product connects to other tools – use [Logo Cluster](logo-cluster.md) or [Integration Beam](integration-beam.md).
- Values by region – it highlights one continent and carries no data; use [Breakdown Chart](../components/breakdown-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Map** `.ui-wm-map` – the world, with the highlighted continent and the band along its coast
2. **Continent** `.ui-wm-focus` – the highlighted continent
3. **Switcher** `.ui-wm-trigger` – the pill in the top-left corner that names the continent; it opens a menu of all six

## Usage

### HTML

```html
<tc-world-map id="map" continent="asia"></tc-world-map>

<script type="module">
  import "@adamstavely/trenchcoat/world-map";
  import "@adamstavely/trenchcoat/tokens.css";

  const map = document.querySelector("#map");
  map.label = (continent) => `Customers in ${continent.replace("-", " ")}`;
  map.addEventListener("tc-continent-change", (e) => console.log(e.detail.continent));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { WorldMap, type Continent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Regions() {
  const [continent, setContinent] = useState<Continent>("asia");
  return (
    <WorldMap
      continent={continent}
      onContinentChange={setContinent}
      label={(c) => `Customers in ${c.replace("-", " ")}`}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/world-map";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";

defineProps<{ label: TcWorldMap["label"] }>();
const onContinentChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-world-map :label="label" @tc-continent-change="onContinentChange"></tc-world-map>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { WorldMap } from "@adamstavely/trenchcoat/angular/world-map";
import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";

@Component({
  selector: "app-world-map-example",
  imports: [WorldMap],
  template: `<tc-world-map [label]="label()" (tc-continent-change)="onContinentChange($event)"></tc-world-map>`,
})
export class WorldMapExample {
  readonly label = input.required<TcWorldMap["label"]>();
  onContinentChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/world-map";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";

  let { label }: { label: TcWorldMap["label"] } = $props();
  let el: TcWorldMap;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-continent-change", on);
    return () => el.removeEventListener("tc-continent-change", on);
  });
</script>

<tc-world-map bind:this={el} {label}></tc-world-map>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `continent` | `continent` | `Continent` | `"europe"` | Highlighted continent |
| `showSwitcher` | `show-switcher` | `boolean` | `true` | Show the continent menu in the top-left corner |
| `label` | – | `string \| ((continent: Continent) => string) \| undefined` | `undefined` | Accessible description of the map; a function receives the current continent |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-continent-change` | – | Yes | Cancelable, when the viewer picks a continent; detail: WorldMapContinentChange ({ continent }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-world-map-travel` | `14s` | both |
| `--tc-world-map-loops` | `2` | both |
| `--tc-world-map-chevron` | `light-dark(#737373, #8f8f8f)` | both |
| `--tc-world-map-menu-shadow` | `light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.4))` | both |
| `--tc-world-map-menu-shadow-near` | `light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.35))` | both |
| `--tc-world-map-drop` | `light-dark(rgba(31, 33, 40, 0.1), rgba(0, 0, 0, 0.45))` | both |
| `--tc-world-map-land` | `light-dark(#e8e8e8, #2a2a2d)` | both |
| `--tc-world-map-focus` | `light-dark(#ffffff, #46464c)` | both |
| `--tc-world-map-focus-edge` | `light-dark(#e2e2e2, rgba(255, 255, 255, 0.12))` | both |
| `--tc-world-map-s` | `1` | not set – this fallback applies |

#### Design tokens it reads (38)

`--tc-border-default`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-emphasized`, `--tc-ease-in`, `--tc-ease-out`, `--tc-ease-spring`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-weight-medium`, `--tc-line-height-none`, `--tc-line-height-snug`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-radius-full`, `--tc-shadow-control`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-surface-overlay`, `--tc-text-primary`, `--tc-world-map-morph`

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-world-map :label="…">` | `<tc-world-map [label]="…">` | `<tc-world-map {label}>` |

*Also attributes: `continent`, `show-switcher` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-continent-change` | Yes | `el.addEventListener("tc-continent-change", (e) => …)` | `ref.current.addEventListener("tc-continent-change", …)` | `@tc-continent-change="…"` | `(tc-continent-change)="…($event)"` | `el.addEventListener("tc-continent-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `continent` itself unless a listener calls `preventDefault()` on `tc-continent-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-world-map id="world-map"></tc-world-map>

<script type="module">
  import "@adamstavely/trenchcoat/world-map";

  const el = document.querySelector("#world-map");
  el.addEventListener("tc-continent-change", (e) => {
    e.preventDefault(); // the element keeps its continent…
    if (allowed(e.detail.continent)) el.continent = e.detail.continent; // …until the app sets it
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
import "@adamstavely/trenchcoat/world-map";
import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";

const props = defineProps<{ initial: TcWorldMap["continent"] }>();
const continent = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onContinentChange = (e: CustomEvent<{ continent: TcWorldMap["continent"] }>) => {
  e.preventDefault();
  continent.value = e.detail.continent;
};
</script>

<template>
  <tc-world-map :continent="continent" @tc-continent-change="onContinentChange"></tc-world-map>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { WorldMap } from "@adamstavely/trenchcoat/angular/world-map";
import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";

@Component({
  selector: "app-controlled-world-map",
  imports: [WorldMap],
  template: `<tc-world-map [continent]="continent()" (tc-continent-change)="onContinentChange($event)"></tc-world-map>`,
})
export class ControlledWorldMap {
  readonly initial = input.required<TcWorldMap["continent"]>();
  readonly continent = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onContinentChange(e: CustomEvent<{ continent: TcWorldMap["continent"] }>) {
    e.preventDefault();
    this.continent.set(e.detail.continent);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/world-map";
  import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";

  let { initial }: { initial: TcWorldMap["continent"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let continent = $derived(initial);
  let el: TcWorldMap;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      continent = (e as CustomEvent<{ continent: TcWorldMap["continent"] }>).detail.continent;
    };
    el.addEventListener("tc-continent-change", on);
    return () => el.removeEventListener("tc-continent-change", on);
  });
</script>

<tc-world-map bind:this={el} {continent}></tc-world-map>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-world-map")` returns a `TcWorldMap` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";`
- **React / Next.js:** Props: `import type { WorldMapProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof WorldMap>`. The element class, for refs: `import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWorldMap["label"]` with `import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";`
- **Angular:** The directive types the template: `[label]` takes `TcWorldMap["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWorldMap } from "@adamstavely/trenchcoat/world-map";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `continent` | `Continent` | Highlighted continent (controlled when defined; pass onContinentChange so the menu can change it) |
| `defaultContinent` | `Continent` | Continent highlighted first when `continent` is not set |
| `onContinentChange` | `(continent: Continent) => void` | Called when the viewer picks a continent in the menu |

*Renamed or hidden on the wrapper: `continent`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the trigger: opens the menu. In the menu: picks the active continent and closes it |
| ↓ / ↑ | On the trigger: opens the menu. In the menu: moves to the next or previous continent |
| Home / End | Moves to the first or last continent |
| Escape | Closes the menu and returns focus to the trigger |
| Tab | Closes the menu and moves on |

### Screen readers

The map is `role="img"`, named “World map with Europe highlighted” – or by `label`, which can be a string or a
function of the continent. The trigger is a button with `aria-haspopup="listbox"` and `aria-expanded`, named
“Continent: Europe”. The menu is a listbox named “Select a continent”; focus moves to it when it opens, and
`aria-activedescendant` points at the active option. The current continent is `aria-selected`. There is no live
region: the new name reaches screen readers through the trigger when focus returns to it.

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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 48.0 KB | 16.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **55.2 KB** | **18.7 KB** |
| With Lit – the first component on a page | 77.0 KB | 26.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 68 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |

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

- When the map stands for something specific, say it in `label`: “Our customers in Asia” tells more than the default.
- Keep the copy beside the map about the place; the map can't carry text of its own.

## Do and don't

### Do

- Hide the menu (`showSwitcher` false) when the continent is fixed by the page.
- Use the function form of `label` when the menu is shown, so the name follows the pick.
- Give it the full width of its column – the menu scales down with the map, and it stops shrinking at about
  340 px wide.

### Don't

- Don't set `continent` in React without `onContinentChange` while the menu is shown – the menu can't change it, and
  the wrapper warns in development.
- Don't use the highlight to mean a country – it always covers the whole continent.

## Related

- [DACH Region](region-dach.md) – DACH map with fading neighbours and a pastel band along the border, switchable to the US, China, India, Brazil or Japan
- [Logo Cluster](logo-cluster.md) – Your mark on a white disc in the middle – company logos bounce out of it and settle around it; the ring turns once
- [Integration Beam](integration-beam.md) – Your product between the tools it connects – light pulses flow along curved beams, hover to focus a tool, click to pause it; a few sync cycles each time it comes into view
