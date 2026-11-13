<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Region Overlay

**AI & chat** · New

What a vision model read, drawn on the image – numbered boxes linked to a list with each region's kind, confidence in a word and a percentage and the text it read, filtered by kind and a confidence threshold, with the boxes switched off to see the image plainly

- **Element:** `<tc-region-overlay>`
- **Size:** 9.3 KB gzip · 31.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/region-overlay";` |
| React / Next.js | `import { RegionOverlay } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/region-overlay";` · tags starting with tc- are custom elements |
| Angular | `import { RegionOverlay } from "@adamstavely/trenchcoat/angular/region-overlay";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/region-overlay";` |

## Example

The live example is in the gallery at `#/region-overlay`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What a vision model read, drawn on the image it read. Every region it found – a line of text, a table, a figure, a
face it blurred, an object – is a numbered outline on the image, and the same regions are a list beside it with the
label, the kind, the confidence in a word and a percentage, and the text the model read. The two are linked: pointing
at a box lights up its row, and moving through the list lights up its box. Chips filter by kind, a slider hides regions
under a confidence, and Show boxes takes the outlines off so the image can be seen plainly. Selecting a region opens
its full read text in the list.

### When to use

- Showing people what an OCR or vision step found on a scan, a photo or a screenshot before they rely on it.
- Debugging a document pipeline: which regions were found, of what kind, and how sure the model was.
- Explaining why an answer cites part of an image – select the region it came from.

### When not to use

- Checking and correcting extracted field values one by one – use [Extraction Review](extraction-review.md).
- Comparing an image with an edited version of it – use [Before After](before-after.md).
- Browsing generated images – use [Image Grid](image-grid.md).
- Showing the text passages behind an answer – use [Retrieval Inspector](retrieval-inspector.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tools** `.ui-rgo__tools` – the kind chips with counts, the Minimum confidence slider and the Show boxes switch
2. **Image** `.ui-rgo__frame` – the image with a box over every region shown
3. **Box** `.ui-rgo__box` – the region's outline and its number; dashed when confidence is Low, with the label above it when lit
4. **List** `.ui-rgo__list` – the regions in order, linked to the boxes
5. **Region** `.ui-rgo__option` – the number, label, confidence in a word and a percentage, the kind and a line of read text
6. **Read text** `.ui-rgo__text` – the selected region's full text, or “No text read”

## Looks

Standard puts the header on the gray tray above a white card with the tools, the image in a gray well and the list.
Clean is one white card with hairline dividers, a lighter label weight and the selected region tinted with the accent.
`--tc-region-overlay-side` sets the list's width and `--tc-region-overlay-image-max` the widest the image grows.

## Usage

### HTML

```html
<tc-region-overlay id="scan" heading="What the model read" alt="Scanned audit form"></tc-region-overlay>

<script type="module">
  import "@adamstavely/trenchcoat/region-overlay";
  import "@adamstavely/trenchcoat/tokens.css";

  const overlay = document.querySelector("#scan");
  overlay.src =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fff"/><text x="24" y="48" font-size="20">AUD-2026-0412</text><rect x="24" y="90" width="352" height="120" fill="#f2f2f5"/></svg>');
  overlay.regions = [
    { id: "case", label: "Case number", kind: "text", box: { x: 0.05, y: 0.1, width: 0.45, height: 0.1 }, confidence: 0.96, text: "AUD-2026-0412" },
    { id: "table", label: "Claims table", kind: "table", box: { x: 0.06, y: 0.3, width: 0.88, height: 0.4 }, confidence: 0.58 },
  ];
  overlay.addEventListener("tc-selected-change", (e) => console.log("Selected", e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RegionOverlay, type OverlayRegion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ScanCheck({ src, regions }: { src: string; regions: OverlayRegion[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0);
  return (
    <RegionOverlay
      title="What the model read"
      src={src}
      alt="Scanned expense form"
      regions={regions}
      selected={selected}
      onSelectedChange={setSelected}
      threshold={threshold}
      onThresholdChange={setThreshold}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/region-overlay";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";

defineProps<{ regions: TcRegionOverlay["regions"]; kinds: TcRegionOverlay["kinds"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-region-overlay :regions="regions" :kinds="kinds" @tc-selected-change="onSelectedChange"></tc-region-overlay>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RegionOverlay } from "@adamstavely/trenchcoat/angular/region-overlay";
import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";

@Component({
  selector: "app-region-overlay-example",
  imports: [RegionOverlay],
  template: `<tc-region-overlay [regions]="regions()" [kinds]="kinds()" (tc-selected-change)="onSelectedChange($event)"></tc-region-overlay>`,
})
export class RegionOverlayExample {
  readonly regions = input.required<TcRegionOverlay["regions"]>();
  readonly kinds = input.required<TcRegionOverlay["kinds"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/region-overlay";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";

  let { regions, kinds }: { regions: TcRegionOverlay["regions"]; kinds: TcRegionOverlay["kinds"] } = $props();
  let el: TcRegionOverlay;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-region-overlay bind:this={el} {regions} {kinds}></tc-region-overlay>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"What the model read"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A quiet line under the heading – the file or the model |
| `src` | `src` | `string` | `""` | The image the model read – a data: URL works too |
| `alt` | `alt` | `string` | `""` | What the image is, for people who can't see it |
| `regions` | – | `OverlayRegion[]` | `[]` | The regions the model found |
| `selected` | `selected` | `string \| null` | `null` | The selected region's id, or null |
| `threshold` | `threshold` | `number` | `0` | Regions under this confidence (0–1) are hidden |
| `kinds` | – | `string[] \| null` | `null` | The kinds shown; null shows every kind |
| `showBoxes` | `show-boxes` | `boolean` | `true` | Whether the boxes are drawn on the image |
| `labels` | – | `RegionOverlayLabelsInput` | `{}` | Names the page can change, merged over defaultRegionOverlayLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A region was selected or the selection cleared. Cancelable. Detail: RegionSelectedChange ({ selected, region }) |
| `tc-threshold-change` | – | Yes | The confidence slider moved. Cancelable. Detail: RegionThresholdChange ({ threshold }) |
| `tc-kinds-change` | – | Yes | A kind chip was turned on or off. Cancelable. Detail: RegionKindsChange ({ kinds }) |
| `tc-show-boxes-change` | – | Yes | Show boxes was switched. Cancelable. Detail: RegionShowBoxesChange ({ showBoxes }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-region-overlay-side` | `300px` | standard, clean |
| `--tc-region-overlay-image-max` | `520px` | standard, clean |

#### Design tokens it reads (60)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-gray-0`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-8`, `--tc-status-info-fg`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `regions` | `el.regions = …;` | `<… regions={…} />` | `<tc-region-overlay :regions="…">` | `<tc-region-overlay [regions]="…">` | `<tc-region-overlay {regions}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-region-overlay :kinds="…">` | `<tc-region-overlay [kinds]="…">` | `<tc-region-overlay {kinds}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-region-overlay :labels="…">` | `<tc-region-overlay [labels]="…">` | `<tc-region-overlay {labels}>` |

*Also attributes: `heading`, `description`, `src`, `alt`, `selected`, `threshold`, `show-boxes` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-threshold-change` | Yes | `el.addEventListener("tc-threshold-change", (e) => …)` | `onThresholdChange={…}` | `@tc-threshold-change="…"` | `(tc-threshold-change)="…($event)"` | `el.addEventListener("tc-threshold-change", …)` |
| `tc-kinds-change` | Yes | `el.addEventListener("tc-kinds-change", (e) => …)` | `onKindsChange={…}` | `@tc-kinds-change="…"` | `(tc-kinds-change)="…($event)"` | `el.addEventListener("tc-kinds-change", …)` |
| `tc-show-boxes-change` | Yes | `el.addEventListener("tc-show-boxes-change", (e) => …)` | `onShowBoxesChange={…}` | `@tc-show-boxes-change="…"` | `(tc-show-boxes-change)="…($event)"` | `el.addEventListener("tc-show-boxes-change", …)` |

### Controlled

The element changes `selected`, `threshold`, `kinds` and `showBoxes` itself unless a listener calls `preventDefault()` on `tc-selected-change`, `tc-threshold-change`, `tc-kinds-change` or `tc-show-boxes-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-region-overlay id="region-overlay"></tc-region-overlay>

<script type="module">
  import "@adamstavely/trenchcoat/region-overlay";

  const el = document.querySelector("#region-overlay");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { RegionOverlay } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RegionOverlay>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledRegionOverlay({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <RegionOverlay {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/region-overlay";
import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";

const props = defineProps<{ initial: TcRegionOverlay["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcRegionOverlay["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-region-overlay :selected="selected" @tc-selected-change="onSelectedChange"></tc-region-overlay>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RegionOverlay } from "@adamstavely/trenchcoat/angular/region-overlay";
import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";

@Component({
  selector: "app-controlled-region-overlay",
  imports: [RegionOverlay],
  template: `<tc-region-overlay [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-region-overlay>`,
})
export class ControlledRegionOverlay {
  readonly initial = input.required<TcRegionOverlay["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcRegionOverlay["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/region-overlay";
  import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";

  let { initial }: { initial: TcRegionOverlay["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcRegionOverlay;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcRegionOverlay["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-region-overlay bind:this={el} {selected}></tc-region-overlay>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-region-overlay")` returns a `TcRegionOverlay` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";`
- **React / Next.js:** Props: `import type { RegionOverlayProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RegionOverlay>`. The element class, for refs: `import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRegionOverlay["regions"]` with `import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";`
- **Angular:** The directive types the template: `[regions]` takes `TcRegionOverlay["regions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRegionOverlay } from "@adamstavely/trenchcoat/region-overlay";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `selected` | `string \| null` | The selected region's id. Controlled when defined – pass back what onSelectedChange reports |
| `defaultSelected` | `string \| null` | The selected region when uncontrolled |
| `onSelectedChange` | `(selected: string \| null, region?: OverlayRegion) => void` | A region was selected, or the selection cleared (null) |
| `threshold` | `number` | Regions under this confidence (0–1) are hidden. Controlled when defined |
| `defaultThreshold` | `number` | The starting threshold when uncontrolled |
| `onThresholdChange` | `(threshold: number) => void` | The confidence slider moved |
| `kinds` | `string[] \| null` | The kinds shown, null for all. Controlled when defined |
| `defaultKinds` | `string[] \| null` | The kinds shown when uncontrolled |
| `onKindsChange` | `(kinds: string[] \| null) => void` | A kind chip was turned on or off |
| `showBoxes` | `boolean` | Whether the boxes are drawn. Controlled when defined |
| `defaultShowBoxes` | `boolean` | Whether the boxes start drawn when uncontrolled |
| `onShowBoxesChange` | `(showBoxes: boolean) => void` | Show boxes was switched |

*Renamed or hidden on the wrapper: `heading`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the kind chips, the slider, Show boxes and the list (one tab stop) |
| ↑ / ↓ | Moves through the regions; the box on the image lights up |
| Home / End | First or last region |
| Enter or Space | Selects the region and shows its read text; again clears it |
| Escape | Clears the selection |
| ← / → on the slider | Changes the minimum confidence by 5% |

### Screen readers

The list is a `listbox` named “Regions”, with one `option` per region shown and a single tab stop; it's described by
“Arrows move between regions, Enter selects, Escape clears”. Each option reads its label, the confidence in a word
and a percentage (“Medium 67% confidence”), the kind and the read text; the selected one carries `aria-selected`. The
boxes on the image are hidden from assistive technology – the list carries the same information – and the image has
its own alt text. The kind chips are toggle buttons with `aria-pressed` in a group named “Kinds”; the slider is
labelled “Minimum confidence” and reads its value as a percentage; Show boxes is a `switch`. The header says how many
regions are shown (“6 of 9 regions”).

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 23.6 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **31.5 KB** | **9.3 KB** |
| With Lit – the first component on a page | 54.6 KB | 17.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 168 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of regions replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.5 ms | regions: first render, 1,331 nodes; update 1.1 ms |
| 1,000 items | 68 ms | regions: first render, 12,831 nodes; update 7.1 ms |

1,000 items of regions: 68 ms. It renders every item, so a first render passes 50 ms (a long task) at about 740 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Label regions by what they are on the page – “Case number”, “Claims table” – not by the model's class names.
- Pass `text` exactly as the model read it, mistakes included: the point is to see what it got wrong.
- Use the built-in kinds where they fit; any other kind shows as given, or rename it with `labels.kindNames`.
- Blur faces and mask personal data in the image before it reaches the element – it shows the image it's given.

## Do and don't

### Do

- Write the image's `alt` as what the document is, so people who can't see it know what was read.
- Start with a region selected when there's one people should check first.
- Rename the confidence words with `labels.confidence` if your model's scale means something else by High.

### Don't

- Don't use colour alone to say which regions are uncertain – the word, the percentage and the dashed outline say it too.
- Don't hide Low regions by default; set a threshold only when people ask for it.
- Don't draw hundreds of regions on one image – group words into lines or blocks first.

## Related

- [Extraction Review](extraction-review.md) – Fields pulled from a document, each linked to its place on the page – confidence per field, accept, correct or reject, field by field from the keyboard
- [Before After](before-after.md) – An original and its edit in one frame with a divider to drag between them – labelled sides, arrow keys on the divider, vertical stacking, and a switch to side by side
- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Retrieval Inspector](retrieval-inspector.md) – What the model was given to answer with – every retrieved chunk with its score, source, freshness, and whether the answer used it
