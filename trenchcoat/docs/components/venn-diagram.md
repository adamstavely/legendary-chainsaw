<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Venn Diagram

**Charts** · New

How two or three sets overlap, as circles sized by the sets, with each region's own count on a chip and the three largest drawn when there are more.

- **Element:** `<tc-venn-diagram>`
- **Size:** 16.9 KB gzip · 48.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/venn-diagram";` |
| React / Next.js | `import { VennDiagram } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/venn-diagram";` · tags starting with tc- are custom elements |
| Angular | `import { VennDiagram } from "@adamstavely/trenchcoat/angular/venn-diagram";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/venn-diagram";` |

## Example

The live example is in the gallery at `#/venn-diagram`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How two or three sets overlap. Each set is a circle whose area is its size, and the circles are placed so each pair
overlaps by about what the two share – exactly for two sets, as near as circles allow for three. Rows follow venn.js:
`{ sets: ["Genomics"], size: 64 }` gives a set, and `{ sets: ["Genomics", "Imaging"], size: 14 }` everything the two
share, including anyone also in a third.

Each region – a set alone, two sets only, all three – carries its own count on a chip of the card's colour, worked out
from those totals. The sets' names sit outside their circles. With more than three sets the three largest are drawn
and a note under the drawing says so; the table still lists every row. The circles grow from their centres when the
chart scrolls into view and glide when the data changes.

### When to use

- Who or what belongs to more than one group: researchers across labs, samples across studies, sources that agree.
- The overlap is the point – how much two lists share, or what only one of them has.

### When not to use

- Four or more sets that all matter – use [Heatmap](heatmap.md) of pairs, or an UpSet-style table.
- Flows between groups rather than shared members – use [Chord Chart](chord-chart.md).
- Parts of one whole that don't overlap – use [Treemap](treemap.md) or [Waffle Chart](waffle-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, and the Table button
2. **Circle** `.ui-vnn__circle` – a set, a translucent fill of its ink; `.ui-vnn__edge` its outline
3. **Region** `.ui-vnn__region` – one area of the diagram, lit in the accent when it's the active one
4. **Chip** `.ui-vnn__chip` – the region's own count, on the card's colour
5. **Name** `.tc-chart__tick` – the set's name, outside its circle
6. **Note** `.ui-vnn__note` – under the drawing when more than three sets were given
7. **Tooltip** `.tc-chart__tip` – the region, its count and its share of everyone

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row; `bare` drops both. Circles take `--tc-plot-ink-1` to `-3` at `--tc-vnn-fill-opacity`; the active region is lit in
`--tc-plot-accent` at `--tc-vnn-active-opacity`. Counts never sit on a fill directly – each is on a chip of
`--tc-plot-bg`. `still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-venn-diagram heading="Researchers by lab" description="This year"></tc-venn-diagram>

<script type="module">
  import "@adamstavely/trenchcoat/venn-diagram";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-venn-diagram").data = [
    { sets: ["Genomics"], size: 64 },
    { sets: ["Imaging"], size: 48 },
    { sets: ["Genomics", "Imaging"], size: 14 },
  ];
</script>
```

### React / Next.js

```tsx
import { VennDiagram } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const data = [
  { sets: ["Genomics"], size: 64 },
  { sets: ["Imaging"], size: 48 },
  { sets: ["Genomics", "Imaging"], size: 14 },
];

export function Labs() {
  return <VennDiagram title="Researchers by lab" description="This year" data={data} onMarkClick={(e) => console.log(e.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/venn-diagram";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";

defineProps<{ sets: TcVennDiagram["sets"]; size: TcVennDiagram["size"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-venn-diagram :sets="sets" :size="size" @tc-view-change="onViewChange"></tc-venn-diagram>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { VennDiagram } from "@adamstavely/trenchcoat/angular/venn-diagram";
import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";

@Component({
  selector: "app-venn-diagram-example",
  imports: [VennDiagram],
  template: `<tc-venn-diagram [sets]="sets()" [size]="size()" (tc-view-change)="onViewChange($event)"></tc-venn-diagram>`,
})
export class VennDiagramExample {
  readonly sets = input.required<TcVennDiagram["sets"]>();
  readonly size = input.required<TcVennDiagram["size"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/venn-diagram";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";

  let { sets, size }: { sets: TcVennDiagram["sets"]; size: TcVennDiagram["size"] } = $props();
  let el: TcVennDiagram;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-venn-diagram bind:this={el} {sets} {size}></tc-venn-diagram>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `sets` | – | `Accessor<T, string[]> \| undefined` | `undefined` | The field naming the sets a row is about – one set, or the two or three it overlaps; by default "sets" |
| `size` | – | `Accessor<T, number> \| undefined` | `undefined` | The size field: a set's size, or all that a pair or triple shares; by default "size" |
| `vennLabels` | – | `Partial<VennLabels>` | `{}` | The Venn diagram's own words, merged over defaultVennLabels |
| `heading` | `heading` | `string` | `""` | The heading, and the chart's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `data` | – | `readonly T[]` | `[]` | The rows to draw |
| `highlight` | – | `Highlight<T> \| undefined` | `undefined` | What to emphasise: an index, a label, a list of them, "max", "min", "first", "last", "none", or a test |
| `format` | – | `FormatSpec \| undefined` | `undefined` | How values are written: "number", "integer", "percent", "compact", "currency", Intl options, or a function |
| `unit` | `unit` | `string` | `""` | The unit after each value: "%", "ms", " runs" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "de"; by default the browser's |
| `height` | `height` | `number \| undefined` | `undefined` | The plot's height in px; by default the chart's own for its width |
| `still` | `still` | `boolean` | `false` | Draws everything at once: no entrance and no transitions |
| `easing` | `easing` | `EasingName` | `"spring"` | How marks move: "spring", "easeOut", "easeInOut" or "linear" |
| `duration` | `duration` | `number \| undefined` | `undefined` | How long a move takes, in ms; by default the chart's own |
| `hideLabels` | `hide-labels` | `boolean` | `false` | Leaves the values off the marks |
| `hideTooltip` | `hide-tooltip` | `boolean` | `false` | No tooltip on hover or focus |
| `bare` | `bare` | `boolean` | `false` | No card: just the plot, for a chart inside another component |
| `view` | `view` | `ChartView` | `"chart"` | The chart or the same numbers as a table. Changed by the Table button unless a tc-view-change listener calls preventDefault() |
| `labels` | – | `Partial<ChartLabels>` | `{}` | The words it shows and says, merged over defaultChartLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-view-change` | – | Yes | The Table button was pressed ({ view }: ChartViewChange); cancelable – prevented, `view` stays as it was |
| `tc-mark-hover` | – | No | The pointer or keyboard moved to a region, or off them ({ event }: ChartMarkHover) |
| `tc-mark-click` | – | No | A region was clicked, or picked with Enter or Space ({ event }: ChartMarkClick) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |
| `linkActive(key: string \| null)` | `void` | Shows the mark with this event key (or none) as active, as an echo of another chart – drawn, but with no tooltip, announcement or event – for charts that move together (tc-small-multiples). A mark the chart's own pointer or keyboard is on wins |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-vnn-fill-opacity` | `0.22` | both |
| `--tc-vnn-active-opacity` | `0.4` | both |

#### Design tokens it reads (9)

`--tc-duration-fast`, `--tc-ease-standard`, `--tc-font-size-sm`, `--tc-plot-accent`, `--tc-plot-bg`, `--tc-plot-focus`, `--tc-space-2`, `--tc-text-muted`, `--tc-vnn-ink`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `lensArea(r1: number, r2: number, d: number): number` | The area two circles share, radii r1 and r2 with centres d apart |
| `distanceFor(r1: number, r2: number, overlap: number): number` | How far apart two circles' centres are for them to share `overlap`: bisection, as the lens shrinks with distance |
| `vennLayout(sizes: readonly number[], pair: (a: number, b: number) => number): { x: number; y: number; r: number }[]` | Circles for up to three sets, in data units (area = size): the first two side by side, the third placed from its distances to both, or at the nearest point it can go when they can't both be met |

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
| `sets` | `el.sets = …;` | `<… sets={…} />` | `<tc-venn-diagram :sets="…">` | `<tc-venn-diagram [sets]="…">` | `<tc-venn-diagram {sets}>` |
| `size` | `el.size = …;` | `<… size={…} />` | `<tc-venn-diagram :size="…">` | `<tc-venn-diagram [size]="…">` | `<tc-venn-diagram {size}>` |
| `vennLabels` | `el.vennLabels = …;` | `<… vennLabels={…} />` | `<tc-venn-diagram :vennLabels="…">` | `<tc-venn-diagram [vennLabels]="…">` | `<tc-venn-diagram {vennLabels}>` |
| `data` | `el.data = …;` | `<… data={…} />` | `<tc-venn-diagram :data="…">` | `<tc-venn-diagram [data]="…">` | `<tc-venn-diagram {data}>` |
| `highlight` | `el.highlight = …;` | `<… highlight={…} />` | `<tc-venn-diagram :highlight="…">` | `<tc-venn-diagram [highlight]="…">` | `<tc-venn-diagram {highlight}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-venn-diagram :format="…">` | `<tc-venn-diagram [format]="…">` | `<tc-venn-diagram {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-venn-diagram :labels="…">` | `<tc-venn-diagram [labels]="…">` | `<tc-venn-diagram {labels}>` |

*Also attributes: `heading`, `description`, `unit`, `locale`, `height`, `still`, `easing`, `duration` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-mark-hover` | No | `el.addEventListener("tc-mark-hover", (e) => …)` | `onMarkHover={…}` | `@tc-mark-hover="…"` | `(tc-mark-hover)="…($event)"` | `el.addEventListener("tc-mark-hover", …)` |
| `tc-mark-click` | No | `el.addEventListener("tc-mark-click", (e) => …)` | `onMarkClick={…}` | `@tc-mark-click="…"` | `(tc-mark-click)="…($event)"` | `el.addEventListener("tc-mark-click", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view` itself unless a listener calls `preventDefault()` on `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-venn-diagram id="venn-diagram"></tc-venn-diagram>

<script type="module">
  import "@adamstavely/trenchcoat/venn-diagram";

  const el = document.querySelector("#venn-diagram");
  el.addEventListener("tc-view-change", (e) => {
    e.preventDefault(); // the element keeps its view…
    if (allowed(e.detail.view)) el.view = e.detail.view; // …until the app sets it
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
import "@adamstavely/trenchcoat/venn-diagram";
import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";

const props = defineProps<{ initial: TcVennDiagram["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcVennDiagram["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-venn-diagram :view="view" @tc-view-change="onViewChange"></tc-venn-diagram>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { VennDiagram } from "@adamstavely/trenchcoat/angular/venn-diagram";
import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";

@Component({
  selector: "app-controlled-venn-diagram",
  imports: [VennDiagram],
  template: `<tc-venn-diagram [view]="view()" (tc-view-change)="onViewChange($event)"></tc-venn-diagram>`,
})
export class ControlledVennDiagram {
  readonly initial = input.required<TcVennDiagram["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcVennDiagram["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/venn-diagram";
  import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";

  let { initial }: { initial: TcVennDiagram["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcVennDiagram;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcVennDiagram["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-venn-diagram bind:this={el} {view}></tc-venn-diagram>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-venn-diagram")` returns a `TcVennDiagram` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";`
- **React / Next.js:** Props: `import type { VennDiagramProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof VennDiagram>`. The element class, for refs: `import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcVennDiagram["sets"]` with `import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";`
- **Angular:** The directive types the template: `[sets]` takes `TcVennDiagram["sets"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcVennDiagram } from "@adamstavely/trenchcoat/venn-diagram";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the chart's name |
| `view` | `ChartView` | The chart or the table – controlled when given |
| `defaultView` | `ChartView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: ChartView) => void` | The Table button was pressed |
| `onMarkHover` | `(event: ChartEvent \| null) => void` | The pointer or keyboard moved to a mark (null: off them) |
| `onMarkClick` | `(event: ChartEvent) => void` | A mark was clicked, or picked with Enter or Space |

*Renamed or hidden on the wrapper: `heading`, `view`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the plot – one tab stop |
| Arrow keys | Move to the next or previous region; the tooltip shows it and it's read with its count and share |
| Home / End | The first or last region |
| Enter / Space | Picks the region (fires `tc-mark-click`) |
| Escape | Lets go of the region; pressed again, it's the page's |

### Screen readers

- The plot is a group named by the heading, described in words: everyone counted, then every region and its count.
- A table of every region is always there for screen readers; the Table button shows it to everyone. With more than
  three sets the rows not drawn follow, and are read from the keyboard too.
- Moving with the arrows announces the region ("Genomics and Imaging only: 10 (8%), 4 of 7").
- The drawing itself is hidden; nothing is said by colour alone.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/chart/element, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | internal/chart/element | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit, internal/chart/element | Focus rings for keyboard users. |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/chart/accessor | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, internal/chart/element, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/chart/element | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/chart/element | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | internal/chart/element | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/chart/element, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 11.6 KB | 5.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.6 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **48.1 KB** | **16.9 KB** |
| With Lit – the first component on a page | 67.5 KB | 23.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 43 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of data replaced |
| First on the page | 26 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.1 ms | data: first render, 204 nodes; update 1.0 ms |
| 1,000 items | 3.2 ms | data: first render, 204 nodes; update 1.0 ms |

1,000 items of data: 3.2 ms, 204 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (internal/chart/element – TcChartElement), `IntersectionObserver` (internal/chart/element – TcChartElement), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (internal/chart/element – TcChartElement).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give every set's size, and every pair's (and the triple's) shared size; a missing overlap is taken as none.
- Keep set names short – they sit beside the circles.
- Rename the region names and note through `vennLabels`, and the shared words through `labels`.

## Do and don't

### Do

- Use it for two or three sets, where the reader can see every region at once.
- Let the counts carry the numbers; the areas show the proportions only roughly.

### Don't

- Read precise sizes from the areas – three circles can't always match every overlap.
- Feed it more than three sets and expect them drawn; it shows the three largest.

## Related

- [Chord Chart](chord-chart.md) – What a handful of groups exchange with each other – an arc per group sized by what it sends and receives, a ribbon per pair showing both directions, the largest group and its ribbons in the accent, and a table view
- [Treemap](treemap.md) – Parts of a whole as squarified tiles sized by value, nested under group headers with their shares – the largest emphasised, names and shares on card-coloured chips in tiles big enough, tiles that grow in and glide on change
- [Waffle Chart](waffle-chart.md) – Shares of a whole as a grid of 100 cells, one category emphasised with its share written large beside it, the rest in the chart inks with a legend, cells that pop in one by one and a share that counts up, and a table view
- [Heatmap](heatmap.md) – A matrix of rows by columns shaded by value – sequential or diverging, binned or continuous – with a legend, the highest and lowest cells, a tooltip per cell, an optional crosshair, selection and a table view
