<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Evidence Gallery

**Blocks** · New

The images behind a set of claims – filter by attestation, compare and download in the image grid, and each item's attestation and linked-claim count in a sortable table beside it (uses `@adamstavely/trenchcoat/react`: `segmented-control`, `image-grid`, `data-table`)

- **Element:** `<tc-evidence-gallery>`
- **Size:** 34.7 KB gzip · 142.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/evidence-gallery";` |
| React / Next.js | `import { EvidenceGallery } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/evidence-gallery";` · tags starting with tc- are custom elements |
| Angular | `import { EvidenceGallery } from "@adamstavely/trenchcoat/angular/evidence-gallery";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/evidence-gallery";` |

## Example

The live example is in the gallery at `#/blocks/evidence-gallery`, in both looks; Replay restarts its animations.

## Overview

The images behind a set of claims, with whether each is attested and how many claims lean on it. A filter at the top
picks All, Attested, Unverified or Failed, each with its count, and a line beside it sums up what's shown. Below, the
library's Image Grid shows the images – each tile carries its attestation as a badge and its linked claims as a note,
with alt text, Compare and Download – and the library's Data Table lists the same items, read only and sortable, so
"most-cited" or "failed first" is a click. The two sit side by side when there's room and stack when there isn't; the
grid drops to one column when the gallery is narrow.

### When to use

- Reviewing the pictures, scans and charts an investigation or report rests on.
- Showing which evidence is attested before a claim is accepted.
- Editing alt text for evidence images in place.

### When not to use

- Evidence that isn't images, with chain of custody – use [Evidence List](../components/evidence-list.md).
- Generated variations to choose between – use [Image Grid](../components/image-grid.md) on its own.
- A plain table of records – use [Data Table](../components/data-table.md).

## Anatomy

1. **Bar** `.ui-evg__bar` – the attestation filter and the summary
2. **Summary** `.ui-evg__summary` – items shown, how many are attested, and their linked claims
3. **Panes** `.ui-evg__panes` – the image grid and the attestation table, side by side or stacked

## Looks

The gallery itself has no card; its pieces carry the look. Standard puts the grid and the table on gray trays with
white cards; Clean draws them as single white cards. The filter follows the same look.

## Usage

### HTML

```html
<tc-evidence-gallery id="evidence" heading="Evidence" subtitle="Claim 2291 · damaged delivery"></tc-evidence-gallery>

<script type="module">
  import "@adamstavely/trenchcoat/evidence-gallery";
  import "@adamstavely/trenchcoat/tokens.css";

  const gallery = document.querySelector("#evidence");
  gallery.items = [
    { id: "dock", title: "Loading bay, camera 2", kind: "Photo", src: "/evidence/dock.jpg", alt: "Loading bay at dawn, both doors open", attestation: "attested", claims: 3, source: "Site camera 2" },
    { id: "box", title: "Pallet damage", kind: "Photo", src: "/evidence/box.jpg", alt: "Box split down one side", attestation: "unverified", claims: 1, source: "Customer email" },
  ];
  gallery.addEventListener("tc-filter-change", (e) => console.log(e.detail.filter));
  gallery.addEventListener("tc-alt-change", (e) => console.log(e.detail.item.id, e.detail.alt));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EvidenceGallery, type EvidenceFilter, type EvidenceItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: EvidenceItem[] = [
  { id: "dock", title: "Loading bay, camera 2", kind: "Photo", src: "/evidence/dock.jpg", alt: "Loading bay at dawn, both doors open", attestation: "attested", claims: 3, source: "Site camera 2" },
  { id: "box", title: "Pallet damage", kind: "Photo", src: "/evidence/box.jpg", alt: "Box split down one side", attestation: "unverified", claims: 1, source: "Customer email" },
];

export function ClaimEvidence() {
  const [filter, setFilter] = useState<EvidenceFilter>("all");
  return <EvidenceGallery title="Evidence" subtitle="Claim 2291" items={items} filter={filter} onFilterChange={setFilter} onAltChange={(item, alt) => console.log(item.id, alt)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/evidence-gallery";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";

defineProps<{ items: TcEvidenceGallery["items"]; attestationLabels: TcEvidenceGallery["attestationLabels"] }>();
const onFilterChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-evidence-gallery :items="items" :attestationLabels="attestationLabels" @tc-filter-change="onFilterChange"></tc-evidence-gallery>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EvidenceGallery } from "@adamstavely/trenchcoat/angular/evidence-gallery";
import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";

@Component({
  selector: "app-evidence-gallery-example",
  imports: [EvidenceGallery],
  template: `<tc-evidence-gallery [items]="items()" [attestationLabels]="attestationLabels()" (tc-filter-change)="onFilterChange($event)"></tc-evidence-gallery>`,
})
export class EvidenceGalleryExample {
  readonly items = input.required<TcEvidenceGallery["items"]>();
  readonly attestationLabels = input.required<TcEvidenceGallery["attestationLabels"]>();
  onFilterChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/evidence-gallery";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";

  let { items, attestationLabels }: { items: TcEvidenceGallery["items"]; attestationLabels: TcEvidenceGallery["attestationLabels"] } = $props();
  let el: TcEvidenceGallery;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-evidence-gallery bind:this={el} {items} {attestationLabels}></tc-evidence-gallery>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `EvidenceItem[]` | `[]` | The evidence, in display order |
| `filter` | `filter` | `EvidenceFilter` | `"all"` | Which items show: "all", "attested", "unverified" or "failed" |
| `attestationLabels` | – | `Partial<Record<Attestation, string>>` | `{}` | Words for the attestation states, merged over defaultAttestationLabels |
| `heading` | `heading` | `string` | `"Evidence"` | The grid's heading |
| `subtitle` | `subtitle` | `string \| undefined` | `undefined` | A line under the grid's heading, e.g. the case or report it belongs to |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-filter-change` | – | Yes | Another filter was picked ({ filter }: EvidenceFilterChange); cancelable – prevented, `filter` stays |
| `tc-alt-change` | – | Yes | An alt text was edited in the grid ({ item, alt }: EvidenceAltChange); cancelable – prevented, the old alt text stays |

#### Design tokens it reads (8)

`--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-line-height-normal`, `--tc-space-2`, `--tc-space-4`, `--tc-text-muted`, `--tc-text-primary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultAttestationLabels: Record<Attestation, string>` | The words for the attestation states |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-evidence-gallery :items="…">` | `<tc-evidence-gallery [items]="…">` | `<tc-evidence-gallery {items}>` |
| `attestationLabels` | `el.attestationLabels = …;` | `<… attestationLabels={…} />` | `<tc-evidence-gallery :attestationLabels="…">` | `<tc-evidence-gallery [attestationLabels]="…">` | `<tc-evidence-gallery {attestationLabels}>` |

*Also attributes: `filter`, `heading`, `subtitle` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-alt-change` | Yes | `el.addEventListener("tc-alt-change", (e) => …)` | `onAltChange={…}` | `@tc-alt-change="…"` | `(tc-alt-change)="…($event)"` | `el.addEventListener("tc-alt-change", …)` |

### Controlled

The element changes `filter` itself unless a listener calls `preventDefault()` on `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-evidence-gallery id="evidence-gallery"></tc-evidence-gallery>

<script type="module">
  import "@adamstavely/trenchcoat/evidence-gallery";

  const el = document.querySelector("#evidence-gallery");
  el.addEventListener("tc-filter-change", (e) => {
    e.preventDefault(); // the element keeps its filter…
    if (allowed(e.detail.filter)) el.filter = e.detail.filter; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { EvidenceGallery } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof EvidenceGallery>;
type Props = Omit<Own, "filter" | "onFilterChange"> & { initial: NonNullable<Own["filter"]> };

// Controlled: passing filter makes the wrapper prevent the element's own change; the app sets it
export function ControlledEvidenceGallery({ initial, ...props }: Props) {
  const [filter, setFilter] = useState<Own["filter"]>(initial);
  return <EvidenceGallery {...props} filter={filter} onFilterChange={(next) => setFilter(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/evidence-gallery";
import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";

const props = defineProps<{ initial: TcEvidenceGallery["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcEvidenceGallery["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-evidence-gallery :filter="filter" @tc-filter-change="onFilterChange"></tc-evidence-gallery>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EvidenceGallery } from "@adamstavely/trenchcoat/angular/evidence-gallery";
import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";

@Component({
  selector: "app-controlled-evidence-gallery",
  imports: [EvidenceGallery],
  template: `<tc-evidence-gallery [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-evidence-gallery>`,
})
export class ControlledEvidenceGallery {
  readonly initial = input.required<TcEvidenceGallery["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcEvidenceGallery["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/evidence-gallery";
  import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";

  let { initial }: { initial: TcEvidenceGallery["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcEvidenceGallery;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcEvidenceGallery["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-evidence-gallery bind:this={el} {filter}></tc-evidence-gallery>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-evidence-gallery")` returns a `TcEvidenceGallery` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";`
- **React / Next.js:** Props: `import type { EvidenceGalleryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EvidenceGallery>`. The element class, for refs: `import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEvidenceGallery["items"]` with `import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";`
- **Angular:** The directive types the template: `[items]` takes `TcEvidenceGallery["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEvidenceGallery } from "@adamstavely/trenchcoat/evidence-gallery";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The grid's heading – "Evidence" by default |
| `filter` | `EvidenceFilter` | Which items show (controlled) |
| `defaultFilter` | `EvidenceFilter` | The filter at first when uncontrolled – "all" by default |
| `onFilterChange` | `(filter: EvidenceFilter) => void` | Called when another filter is picked |
| `onAltChange` | `(item: EvidenceItem, alt: string) => void` | An alt text was edited in the grid: the item with its new alt text |

*Renamed or hidden on the wrapper: `heading`, `filter`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the filter, the grid and the table |
| ← / → | In the filter, picks the previous or next state |
| Grid and table keys | As in `image-grid` and `data-table` – open, compare, download, edit alt text, sort |

### Screen readers

The filter is a radio group named “Show”; each option reads its state and count. The summary is a polite live region,
so a new filter is announced with what it shows: “4 items · 4 attested · 8 linked claims”. The grid and the table
announce themselves as they do on their own; each tile's badge says its attestation in words.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | data-table, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | image-grid, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, image-grid | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | data-table, internal/kit, image-grid, segmented-control | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | data-table | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | image-grid | – |
| inset | 87 | 66 | 14.1 | 14.1 | data-table, image-grid | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | data-table, internal/base, image-grid, segmented-control, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, internal/controllers, segmented-control | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | data-table, segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |
| backdrop-filter (with the -webkit- prefix) | 76 (Edge 17) | 103 | 9 | 9 | image-grid | What's behind a translucent surface isn't blurred; the surface keeps its fill. |

## Performance

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 7.3 KB | 3.3 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 4.7 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [data-table](../components/data-table.md) · Element it renders | 49.5 KB | – |
| [image-grid](../components/image-grid.md) · Element it renders | 43.1 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **142.9 KB** | **34.7 KB** |
| With Lit – the first component on a page | 165.5 KB | 42.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | default properties, 100 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (data-table), `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController), `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController), `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (image-grid), `setTimeout` (segmented-control).
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/controllers – SmoothHeightController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (segmented-control).
- Listens on the page: `window pointerup` (data-table), `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give every item real alt text: what the image shows, not its file name. An empty alt is flagged “No alt text”.
- Keep titles short and specific – “Loading bay, camera 2” – and put the kind in `kind`: “Photo”, “Scan”, “Map”.
- Say where it came from in `source`, the way a reviewer would check it: “Site camera 2”, “Customer email”.
- Rename the states with `attestationLabels` when your process uses other words, such as “Verified”.

## Do and don't

### Do

- Count claims the same way everywhere the evidence appears.
- Listen for `tc-alt-change` and save the new alt text.
- Keep a failed item in the gallery so people can see why it's out.

### Don't

- Don't use colour alone for attestation – the badge and the table say it in words.
- Don't hide unverified evidence by default; let the filter do it.
- Don't put more than a few dozen images in one gallery; split it by claim.

## Related

- [Image Grid](../components/image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Data Table](../components/data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Evidence List](../components/evidence-list.md) – The exhibits behind a matter – reference, title, type, source with its grade, date, holder and a status in words, each opening onto its chain of custody with every step's hash, copyable, and whether the hashes agree
- [Segmented Control](../components/segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
