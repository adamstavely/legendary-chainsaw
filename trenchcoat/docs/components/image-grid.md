<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Image Grid

**AI & chat** · New

Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image

- **Element:** `<tc-image-grid>`
- **Size:** 15.3 KB gzip · 54.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/image-grid";` |
| React / Next.js | `import { ImageGrid } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/image-grid";` · tags starting with tc- are custom elements |
| Angular | `import { ImageGrid } from "@adamstavely/trenchcoat/angular/image-grid";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/image-grid";` |

## Example

The live example is in the gallery at `#/image-grid`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Generated images as a grid of variations, with what people do next on every tile: regenerate one, upscale it,
compare two, download. A tile is pending (a shimmer, with its progress when the app knows it), done or failed (with
Try again), so a whole batch can come in at its own pace. Every image has an alt-text line under it that people can
edit, and a missing one is flagged, so generated images reach the page described. Compare lays two tiles on top of
each other with a divider to drag between them. The app can put its own state on a tile – a `badge` such as
“Attested” or “Picked”, a `meta` note such as “3 claims” – and, with `openable`, open a tile in its own viewer.

### When to use

- Showing the results of an image-generation prompt, usually four variations.
- When people pick one of several images and need to refine, enlarge or save it.
- Anywhere generated images will be published and need alt text before they go.

### When not to use

- Uploading people's own files – use [Dropzone](dropzone.md).
- Everything a run produced – files, documents, code and images together – use [Artifact Panel](artifact-panel.md).
- Comparing two models' text answers – use [Answer Arena](answer-arena.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – an image icon, the grid's name and the prompt the images came from
2. **Tile** `.ui-igrid__tile` – one variation: pending, done or failed, numbered in its corner, with its `meta` beside the number
3. **Badge** `.ui-igrid__badge` – the app's state for the tile, a toned pill in the top-left corner
4. **Actions** `.ui-igrid__tools` – Regenerate, Upscale, Compare and Download, over a done tile on hover or focus
5. **Alt text** `.ui-igrid__alt` – the image's description, with a button to edit it
6. **Summary** `.ui-igrid__foot` – “4 images · 1 needs alt text”, or the comparison and its Swap and Done

## Looks

Standard puts the header on the gray tray, the grid on a white card below it and the summary on the tray under that.
Clean drops the tray: one white card whose first row is the header and whose last row holds the summary. Both use the same tiles, shimmer and compare view.
Both stop at 560 px wide; set `fill` to let the grid take its container's whole width, for a gallery page or a wide pane.

## Usage

### HTML

```html
<tc-image-grid id="images" openable heading="Lighthouse at dusk" prompt="A lighthouse on a sea cliff at dusk, soft watercolor"></tc-image-grid>

<script type="module">
  import "@adamstavely/trenchcoat/image-grid";
  import "@adamstavely/trenchcoat/tokens.css";

  const grid = document.querySelector("#images");
  grid.tiles = [
    { id: "a", src: "/out/a.png", alt: "A white lighthouse on a cliff, the sea glowing orange", badge: "Picked", badgeTone: "success", meta: "2 tries" },
    { id: "b", alt: "", status: "pending", progress: 0.4 },
  ];
  grid.addEventListener("tc-open", (e) => showViewer(e.detail.tile));
  grid.addEventListener("tc-regenerate", (e) => {
    grid.tiles = grid.tiles.map((t) => (t.id === e.detail.tile.id ? { ...t, status: "pending", progress: 0 } : t));
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ImageGrid, type ImageGridTile } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Variations({ start, regenerate, view }: { start: ImageGridTile[]; regenerate: (id: string) => void; view: (tile: ImageGridTile) => void }) {
  const [tiles, setTiles] = useState(start);
  return (
    <ImageGrid
      title="Lighthouse at dusk"
      prompt="A lighthouse on a sea cliff at dusk, soft watercolor"
      tiles={tiles}
      onTilesChange={setTiles}
      onOpen={view}
      onRegenerate={(tile) => {
        setTiles((list) => list.map((t) => (t.id === tile.id ? { ...t, status: "pending", progress: 0 } : t)));
        regenerate(tile.id);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/image-grid";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";

defineProps<{ tiles: TcImageGrid["tiles"]; actions: TcImageGrid["actions"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-image-grid :tiles="tiles" :actions="actions" @tc-open="onOpen"></tc-image-grid>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ImageGrid } from "@adamstavely/trenchcoat/angular/image-grid";
import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";

@Component({
  selector: "app-image-grid-example",
  imports: [ImageGrid],
  template: `<tc-image-grid [tiles]="tiles()" [actions]="actions()" (tc-open)="onOpen($event)"></tc-image-grid>`,
})
export class ImageGridExample {
  readonly tiles = input.required<TcImageGrid["tiles"]>();
  readonly actions = input.required<TcImageGrid["actions"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/image-grid";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";

  let { tiles, actions }: { tiles: TcImageGrid["tiles"]; actions: TcImageGrid["actions"] } = $props();
  let el: TcImageGrid;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-image-grid bind:this={el} {tiles} {actions}></tc-image-grid>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `tiles` | – | `ImageGridTile[]` | `[]` | The images, in order |
| `heading` | `heading` | `string` | `"Variations"` | Names the grid |
| `prompt` | `prompt` | `string \| undefined` | `undefined` | The prompt the images came from, shown under the heading |
| `columns` | `columns` | `number` | `2` | Tiles per row (fewer when there are fewer tiles) |
| `ratio` | `ratio` | `number` | `1` | Width / height of every tile |
| `actions` | – | `ImageGridAction[]` | `["regenerate", "upscale", "compare", "download"]` | Which actions a done tile offers |
| `compare` | – | `[string, string] \| null` | `null` | The two tile ids side by side, or null for the grid |
| `split` | `split` | `number` | `50` | Where the compare divider is: 0–100, percent from the left |
| `openable` | `openable` | `boolean` | `false` | Done tiles open: clicking the image, or Space or O on the tile, fires tc-open (for a viewer or a detail pane) |
| `fill` | `fill` | `boolean` | `false` | Grow to the container's width instead of stopping at 560px |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | A done tile was opened (its image clicked, or Space or O on the tile) – only when `openable` is set. Detail: ImageGridTileEvent ({ tile, index }) |
| `tc-regenerate` | – | No | Regenerate (or Try again) on a tile; the app answers by updating it. Detail: ImageGridTileEvent ({ tile, index }) |
| `tc-upscale` | – | No | Upscale on a done tile; the app answers by updating it. Detail: ImageGridTileEvent ({ tile, index }) |
| `tc-download` | – | Yes | Download on a done tile. Cancelable: unless prevented, the image is saved. Detail: ImageGridTileEvent ({ tile, index }) |
| `tc-tiles-change` | – | Yes | An alt text was edited. Cancelable. Detail: ImageGridTilesChange ({ tiles }) |
| `tc-compare-change` | – | Yes | Two tiles go side by side, or the comparison closes. Cancelable. Detail: ImageGridCompareChange ({ compare }) |
| `tc-split-change` | – | Yes | The compare divider moved. Cancelable. Detail: ImageGridSplitChange ({ split }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-image-grid-well` | `var(--tc-fill-subtle)` | standard, clean |
| `--tc-image-grid-cols` | `2` | not set – this fallback applies |
| `--tc-image-grid-ratio` | `1` | not set – this fallback applies |
| `--tc-image-grid-split` | `50%` | not set – this fallback applies |

#### Design tokens it reads (96)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-gray-0`, `--tc-hairline`, `--tc-icon-muted`, `--tc-image-grid-badge`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xl`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shadow-color-strong`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `tiles` | `el.tiles = …;` | `<… tiles={…} />` | `<tc-image-grid :tiles="…">` | `<tc-image-grid [tiles]="…">` | `<tc-image-grid {tiles}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-image-grid :actions="…">` | `<tc-image-grid [actions]="…">` | `<tc-image-grid {actions}>` |
| `compare` | `el.compare = …;` | `<… compare={…} />` | `<tc-image-grid :compare="…">` | `<tc-image-grid [compare]="…">` | `<tc-image-grid {compare}>` |

*Also attributes: `heading`, `prompt`, `columns`, `ratio`, `split`, `openable`, `fill` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-regenerate` | No | `el.addEventListener("tc-regenerate", (e) => …)` | `onRegenerate={…}` | `@tc-regenerate="…"` | `(tc-regenerate)="…($event)"` | `el.addEventListener("tc-regenerate", …)` |
| `tc-upscale` | No | `el.addEventListener("tc-upscale", (e) => …)` | `onUpscale={…}` | `@tc-upscale="…"` | `(tc-upscale)="…($event)"` | `el.addEventListener("tc-upscale", …)` |
| `tc-download` | Yes | `el.addEventListener("tc-download", (e) => …)` | `onDownload={…}` | `@tc-download="…"` | `(tc-download)="…($event)"` | `el.addEventListener("tc-download", …)` |
| `tc-tiles-change` | Yes | `el.addEventListener("tc-tiles-change", (e) => …)` | `onTilesChange={…}` | `@tc-tiles-change="…"` | `(tc-tiles-change)="…($event)"` | `el.addEventListener("tc-tiles-change", …)` |
| `tc-compare-change` | Yes | `el.addEventListener("tc-compare-change", (e) => …)` | `onCompareChange={…}` | `@tc-compare-change="…"` | `(tc-compare-change)="…($event)"` | `el.addEventListener("tc-compare-change", …)` |
| `tc-split-change` | Yes | `el.addEventListener("tc-split-change", (e) => …)` | `onSplitChange={…}` | `@tc-split-change="…"` | `(tc-split-change)="…($event)"` | `el.addEventListener("tc-split-change", …)` |

### Controlled

The element changes `tiles`, `compare` and `split` itself unless a listener calls `preventDefault()` on `tc-tiles-change`, `tc-compare-change` or `tc-split-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-image-grid id="image-grid"></tc-image-grid>

<script type="module">
  import "@adamstavely/trenchcoat/image-grid";

  const el = document.querySelector("#image-grid");
  el.addEventListener("tc-tiles-change", (e) => {
    e.preventDefault(); // the element keeps its tiles…
    if (allowed(e.detail.tiles)) el.tiles = e.detail.tiles; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ImageGrid } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ImageGrid>;
type Props = Omit<Own, "tiles" | "onTilesChange"> & { initial: NonNullable<Own["tiles"]> };

// Controlled: passing tiles makes the wrapper prevent the element's own change; the app sets it
export function ControlledImageGrid({ initial, ...props }: Props) {
  const [tiles, setTiles] = useState<Own["tiles"]>(initial);
  return <ImageGrid {...props} tiles={tiles} onTilesChange={(next) => setTiles(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/image-grid";
import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";

const props = defineProps<{ initial: TcImageGrid["tiles"] }>();
const tiles = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTilesChange = (e: CustomEvent<{ tiles: TcImageGrid["tiles"] }>) => {
  e.preventDefault();
  tiles.value = e.detail.tiles;
};
</script>

<template>
  <tc-image-grid :tiles="tiles" @tc-tiles-change="onTilesChange"></tc-image-grid>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ImageGrid } from "@adamstavely/trenchcoat/angular/image-grid";
import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";

@Component({
  selector: "app-controlled-image-grid",
  imports: [ImageGrid],
  template: `<tc-image-grid [tiles]="tiles()" (tc-tiles-change)="onTilesChange($event)"></tc-image-grid>`,
})
export class ControlledImageGrid {
  readonly initial = input.required<TcImageGrid["tiles"]>();
  readonly tiles = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTilesChange(e: CustomEvent<{ tiles: TcImageGrid["tiles"] }>) {
    e.preventDefault();
    this.tiles.set(e.detail.tiles);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/image-grid";
  import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";

  let { initial }: { initial: TcImageGrid["tiles"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let tiles = $derived(initial);
  let el: TcImageGrid;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      tiles = (e as CustomEvent<{ tiles: TcImageGrid["tiles"] }>).detail.tiles;
    };
    el.addEventListener("tc-tiles-change", on);
    return () => el.removeEventListener("tc-tiles-change", on);
  });
</script>

<tc-image-grid bind:this={el} {tiles}></tc-image-grid>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-image-grid")` returns a `TcImageGrid` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";`
- **React / Next.js:** Props: `import type { ImageGridProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ImageGrid>`. The element class, for refs: `import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcImageGrid["tiles"]` with `import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";`
- **Angular:** The directive types the template: `[tiles]` takes `TcImageGrid["tiles"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcImageGrid } from "@adamstavely/trenchcoat/image-grid";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Names the grid – the heading over the images |
| `prompt` | `string` | The prompt the images came from, shown under the title |
| `tiles` | `ImageGridTile[]` | The images. Controlled when defined – pass back what onTilesChange reports (alt-text edits) |
| `defaultTiles` | `ImageGridTile[]` | Starting images when uncontrolled |
| `onTilesChange` | `(tiles: ImageGridTile[]) => void` | An alt text was edited: the whole list with the change |
| `compare` | `[string, string] \| null` | The two tile ids side by side, or null for the grid. Controlled when defined |
| `defaultCompare` | `[string, string] \| null` | The compared pair at first when uncontrolled – null, the grid, by default |
| `onCompareChange` | `(compare: [string, string] \| null) => void` | Two tiles went side by side, or the comparison closed (null) |
| `split` | `number` | Where the compare divider is, 0–100. Controlled when defined |
| `defaultSplit` | `number` | Where the divider starts when uncontrolled – 50 by default |
| `onSplitChange` | `(split: number) => void` | The compare divider moved: its new place, 0–100 |
| `onOpen` | `(tile: ImageGridTile, index: number) => void` | A done tile was opened – its image clicked, or Space or O on it. Setting it makes the tiles openable |
| `onRegenerate` | `(tile: ImageGridTile, index: number) => void` | Regenerate (or Try again) on a tile – answer by updating the tile: pending, then done with the new src |
| `onUpscale` | `(tile: ImageGridTile, index: number) => void` | Upscale on a tile – answer by updating the tile |
| `onDownload` | `(tile: ImageGridTile, index: number, event: Event) => void` | Download on a tile; the image is saved unless you call event.preventDefault() |

*Renamed or hidden on the wrapper: `heading`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves between tiles |
| Home / End | First or last tile in the row |
| Ctrl Home / Ctrl End | First or last tile |
| Space / O | With `openable`: opens the focused done tile (`tc-open`) |
| Enter | Moves into the tile's actions; Tab and Shift Tab then cycle them |
| Escape | From the actions or the alt-text button: back to the tile |
| F2 | Edits the tile's alt text; Enter saves, Escape cancels |
| R / U / C / D | Regenerates, upscales, compares or downloads the focused tile |

In the compare view the divider is a slider: ← / → or ↑ / ↓ move it by 1 (Shift by 10), Page Up / Page Down by 10,
Home / End to either side, and Escape closes the comparison.

### Screen readers

The grid is a `grid` named by the heading and described by the prompt, with one `gridcell` per tile and a single
tab stop. Each tile's name says what it is: “Variation 2: A lighthouse on a cliff at dusk”, “Variation 3:
Generating 40%” or “Variation 4: The model timed out, Try again”, with the badge and meta after it (“Variation 1: A
lighthouse on a cliff at dusk. Attested, 3 claims”), and it is described by “Enter for actions, F2 to edit alt text, R
regenerate, U upscale, C compare, D download” – led by “Space to open” when the grid is `openable`. A pending tile has a `progressbar`. The action
buttons name their tile (“Upscale Variation 2”) and carry `aria-keyshortcuts`. A status region says what happened:
“Variation 2 is ready”, “Regenerating Variation 2”, “Variation 1 picked. Pick a second image to compare”, “Comparing
Variation 1 and Variation 2”, “Alt text saved for Variation 2”. The compare divider is a `slider` whose value text
says how much of each image shows (“50% Variation 1, 50% Variation 2”).

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
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
| backdrop-filter (with the -webkit- prefix) | 76 (Edge 17) | 103 | 9 | 9 | itself | What's behind a translucent surface isn't blurred; the surface keeps its fill. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 45.6 KB | 12.5 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **54.8 KB** | **15.3 KB** |
| With Lit – the first component on a page | 78.1 KB | 22.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 69 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of tiles replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 20 ms | tiles: first render, 1,197 nodes; update 1.5 ms |
| 1,000 items | 139 ms | tiles: first render, 11,772 nodes; update 6.9 ms |

1,000 items of tiles: 139 ms. It renders every item, so a first render passes 50 ms (a long task) at about 360 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write alt text as what the image shows, in one sentence: “A lighthouse on a sea cliff at dusk, warm light on the
  water” – not “Generated image”.
- Show the prompt with `prompt`, so people remember what they asked for.
- Give pending tiles an `activity` when they're doing something other than generating: “Upscaling”, “Varying”.
- Keep `error` short and specific: “The model timed out”, not a stack trace.
- Keep a `badge` to one or two words (“Attested”, “Unverified”, “Picked”) and pick its `badgeTone` – `success`,
  `warning`, `danger`, `info` or `neutral` – from what it means, not to decorate. `meta` is a count or a short note:
  “3 claims”, “2 tries”.

## Do and don't

### Do

- Answer `tc-regenerate` and `tc-upscale` by updating the tile: `status: "pending"`, then done with the new `src`.
- Pass `progress` when the model reports it, so the bar shows how far along a tile is.
- Ask for alt text before the images are used – the summary counts the ones still missing.
- Set `openable` (or pass `onOpen` in React) when a tile has somewhere to go – a lightbox, a detail pane – and answer
  `tc-open` by showing it.

### Don't

- Don't fill `alt` with the prompt for every tile; the variations differ, and so should their descriptions.
- Don't offer actions your backend can't do – limit them with `actions`.
- Don't use more than about four `columns`; the tiles get too small to judge – with `fill` on a wide page, raise
  `columns` instead of letting two tiles grow huge.
- Don't put the whole state in the badge; a sentence belongs in the alt text or the app's detail view.

## Related

- [Dropzone](dropzone.md) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry
- [Artifact Panel](artifact-panel.md) – Everything a run produced in one place – files, code, documents and images with a preview for each, versions you can diff, and download
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason

## Changelog

- `tc-image-grid` – generated images as a grid: pending, done and failed tiles, regenerate, upscale, download (saves by default), compare two with a keyboard slider, and required, editable alt text. WAI-ARIA grid.
