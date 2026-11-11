<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Prioritisation Matrix

**Research & portfolio** · New

Value against effort as a 2 × 2 – numbered points you drag or move with the arrow keys, gathered when they overlap, and the items listed by quadrant beside it

- **Element:** `<tc-prioritisation-matrix>`
- **Size:** 8.7 KB gzip · 28.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/prioritisation-matrix";` |
| React / Next.js | `import { PrioritisationMatrix } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/prioritisation-matrix";` · tags starting with tc- are custom elements |
| Angular | `import { PrioritisationMatrix } from "@adamstavely/trenchcoat/angular/prioritisation-matrix";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/prioritisation-matrix";` |

## Example

The live example is in the gallery at `#/prioritisation-matrix`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Value against effort: the 2 × 2 teams use to choose what to do next. Each item is a numbered point placed by its
effort (across, 0–10) and its value (up, 0–10). The quadrants are Quick wins (high value, low effort), Big bets (high
value, high effort), Fill-ins (low value, low effort) and Time sinks (low value, high effort). The items are listed by
quadrant beside the plot, or under it when the card is narrow, with counts. Pointing at a row lights up its point,
and pointing at a point lights up its row.

Drag a point to move it, in half steps, with a mouse, pen or touch. Or focus a point and move it with the arrow keys.
Points on the same spot gather into one with a count; click it to fan them out.

### When to use

- A steering group or team weighing candidate projects, features or fixes.
- Showing why some work is first: what's cheap and valuable stands out.

### When not to use

- A single ranked list – use [Priority List](priority-list.md).
- How spend is split across themes – use [Investment Balance](investment-balance.md).
- Many scored attributes at once – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Plot** `.ui-pmx__plot` – the four quadrants, value up and effort across
2. **Quadrant** `.ui-pmx__quad` – its name and tone
3. **Point** `.ui-pmx__point` – an item's number on its spot; its name shows on hover and focus
4. **Cluster** `.ui-pmx__cluster` – items on the same spot, with a count
5. **Lists** `.ui-pmx__lists` – the items by quadrant, with their scores

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
Quick wins are tinted success, Big bets info and Time sinks warning, while Fill-ins are neutral. Each point is ringed
in its quadrant's colour, and the quadrant's name is always written. A page can set `--tc-pmx-point` (the point's
size) and `--tc-pmx-plot-max` (the plot's largest width).

## Usage

### HTML

```html
<tc-prioritisation-matrix heading="2027 portfolio"></tc-prioritisation-matrix>
<script type="module">
  const m = document.querySelector("tc-prioritisation-matrix");
  m.items = [
    { id: "portal", label: "Open data portal", value: 8.5, effort: 3 },
    { id: "reef", label: "Coral reef sensor network", value: 9, effort: 8 },
  ];
  m.addEventListener("tc-items-change", (e) => console.log(e.detail.change));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PrioritisationMatrix, type PrioritisationItem } from "@adamstavely/trenchcoat/react";

export function Portfolio() {
  const [items, setItems] = useState<PrioritisationItem[]>([{ id: "portal", label: "Open data portal", value: 8.5, effort: 3 }]);
  return <PrioritisationMatrix title="2027 portfolio" items={items} onItemsChange={setItems} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/prioritisation-matrix";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";

defineProps<{ items: TcPrioritisationMatrix["items"]; labels: TcPrioritisationMatrix["labels"] }>();
const onItemsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-prioritisation-matrix :items="items" :labels="labels" @tc-items-change="onItemsChange"></tc-prioritisation-matrix>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PrioritisationMatrix } from "@adamstavely/trenchcoat/angular/prioritisation-matrix";
import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";

@Component({
  selector: "app-prioritisation-matrix-example",
  imports: [PrioritisationMatrix],
  template: `<tc-prioritisation-matrix [items]="items()" [labels]="labels()" (tc-items-change)="onItemsChange($event)"></tc-prioritisation-matrix>`,
})
export class PrioritisationMatrixExample {
  readonly items = input.required<TcPrioritisationMatrix["items"]>();
  readonly labels = input.required<TcPrioritisationMatrix["labels"]>();
  onItemsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/prioritisation-matrix";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";

  let { items, labels }: { items: TcPrioritisationMatrix["items"]; labels: TcPrioritisationMatrix["labels"] } = $props();
  let el: TcPrioritisationMatrix;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-items-change", on);
    return () => el.removeEventListener("tc-items-change", on);
  });
</script>

<tc-prioritisation-matrix bind:this={el} {items} {labels}></tc-prioritisation-matrix>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Prioritisation"` | The heading, and the plot's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `PrioritisationItem[]` | `[]` | The items. Moved by the user unless tc-items-change is prevented |
| `xLabel` | `x-label` | `string` | `"Effort"` | The across axis's name |
| `yLabel` | `y-label` | `string` | `"Value"` | The up axis's name |
| `labels` | – | `Partial<PrioritisationLabels>` | `{}` | Names for the quadrants |
| `readonly` | `readonly` | `boolean` | `false` | Points can't be moved |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-items-change` | – | Yes | An item was moved ({ items, change }: PrioritisationItemsChange), by dragging or the arrow keys; cancelable – prevented, `items` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-pmx-point` | `28px` | clean |
| `--tc-pmx-plot-max` | `420px` | clean |

#### Design tokens it reads (56)

`--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-pill-h`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shadow-control`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `quadrantOf(value: number, effort: number): PrioritisationQuadrant` | Which quadrant a value and effort fall in: value 5 and over is high, effort under 5 is low |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-prioritisation-matrix :items="…">` | `<tc-prioritisation-matrix [items]="…">` | `<tc-prioritisation-matrix {items}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-prioritisation-matrix :labels="…">` | `<tc-prioritisation-matrix [labels]="…">` | `<tc-prioritisation-matrix {labels}>` |

*Also attributes: `heading`, `description`, `x-label`, `y-label`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-items-change` | Yes | `el.addEventListener("tc-items-change", (e) => …)` | `onItemsChange={…}` | `@tc-items-change="…"` | `(tc-items-change)="…($event)"` | `el.addEventListener("tc-items-change", …)` |

### Controlled

The element changes `items` itself unless a listener calls `preventDefault()` on `tc-items-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-prioritisation-matrix id="prioritisation-matrix"></tc-prioritisation-matrix>

<script type="module">
  import "@adamstavely/trenchcoat/prioritisation-matrix";

  const el = document.querySelector("#prioritisation-matrix");
  el.addEventListener("tc-items-change", (e) => {
    e.preventDefault(); // the element keeps its items…
    if (allowed(e.detail.items)) el.items = e.detail.items; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { PrioritisationMatrix } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof PrioritisationMatrix>;
type Props = Omit<Own, "items" | "onItemsChange"> & { initial: NonNullable<Own["items"]> };

// Controlled: passing items makes the wrapper prevent the element's own change; the app sets it
export function ControlledPrioritisationMatrix({ initial, ...props }: Props) {
  const [items, setItems] = useState<Own["items"]>(initial);
  return <PrioritisationMatrix {...props} items={items} onItemsChange={(next) => setItems(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/prioritisation-matrix";
import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";

const props = defineProps<{ initial: TcPrioritisationMatrix["items"] }>();
const items = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onItemsChange = (e: CustomEvent<{ items: TcPrioritisationMatrix["items"] }>) => {
  e.preventDefault();
  items.value = e.detail.items;
};
</script>

<template>
  <tc-prioritisation-matrix :items="items" @tc-items-change="onItemsChange"></tc-prioritisation-matrix>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PrioritisationMatrix } from "@adamstavely/trenchcoat/angular/prioritisation-matrix";
import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";

@Component({
  selector: "app-controlled-prioritisation-matrix",
  imports: [PrioritisationMatrix],
  template: `<tc-prioritisation-matrix [items]="items()" (tc-items-change)="onItemsChange($event)"></tc-prioritisation-matrix>`,
})
export class ControlledPrioritisationMatrix {
  readonly initial = input.required<TcPrioritisationMatrix["items"]>();
  readonly items = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onItemsChange(e: CustomEvent<{ items: TcPrioritisationMatrix["items"] }>) {
    e.preventDefault();
    this.items.set(e.detail.items);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/prioritisation-matrix";
  import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";

  let { initial }: { initial: TcPrioritisationMatrix["items"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let items = $derived(initial);
  let el: TcPrioritisationMatrix;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      items = (e as CustomEvent<{ items: TcPrioritisationMatrix["items"] }>).detail.items;
    };
    el.addEventListener("tc-items-change", on);
    return () => el.removeEventListener("tc-items-change", on);
  });
</script>

<tc-prioritisation-matrix bind:this={el} {items}></tc-prioritisation-matrix>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-prioritisation-matrix")` returns a `TcPrioritisationMatrix` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";`
- **React / Next.js:** Props: `import type { PrioritisationMatrixProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PrioritisationMatrix>`. The element class, for refs: `import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPrioritisationMatrix["items"]` with `import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";`
- **Angular:** The directive types the template: `[items]` takes `TcPrioritisationMatrix["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPrioritisationMatrix } from "@adamstavely/trenchcoat/prioritisation-matrix";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the plot's name |
| `items` | `PrioritisationItem[]` | The items – controlled when given: every move reports the next list through onItemsChange |
| `defaultItems` | `PrioritisationItem[]` | The items on mount when `items` isn't controlled |
| `onItemsChange` | `(next: PrioritisationItem[], change: PrioritisationItemsChange["change"]) => void` | An item was moved; `next` is the list as it will be |

*Renamed or hidden on the wrapper: `heading`, `items`, `children`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | From point to point, then into the lists |
| ↑ / ↓ | Value up / down half a step (Shift: two) |
| ← / → | Effort down / up half a step (Shift: two) |
| Enter on a cluster | Fans its items out |
| Escape | Gathers a fanned-out cluster back |

### Screen readers

- The plot is a group named after the chart and its axes. Its key description says how the arrow keys move a point.
- Each point is a button named by its item, and described with where it is: "Value 8.5, effort 3 – Quick wins".
- A cluster says how many items it holds and what they are.
- Moves are announced, including a change of quadrant ("now in Big bets").
- The lists carry the same information as the plot, in reading order.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.8 KB | 6.6 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.2 KB** | **8.7 KB** |
| With Lit – the first component on a page | 50.0 KB | 16.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.1 ms** | the gallery demo's data, 146 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of items replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | items: first render, 876 nodes; update 1.0 ms |
| 1,000 items | 53 ms | items: first render, 8,076 nodes; update 9.8 ms |

1,000 items of items: 53 ms. It renders every item, so a first render passes 50 ms (a long task) at about 950 items – page or filter longer lists.

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

- Score on a 0–10 scale with the same people in the room; half steps are enough.
- Rename the axes and quadrants for your process (`x-label`, `y-label`, `labels`): "Confidence", "Impact" and so on.
- Keep item names short – they show in a small tip on the plot and in full in the lists.

## Do and don't

### Do

- Re-score together and let the moves be seen – the announcement and the list both follow.
- Keep the changes (`tc-items-change`) so the scores survive the meeting.

### Don't

- Read precision into it – it's a conversation aid.
- Put fifty items on one plot; split by programme.

## Related

- [Priority List](priority-list.md) – A portfolio's topics or projects by priority – a tier badge, owner and team, health in words, momentum as a line with its change, coverage as a bar, what's open and the work in flight, with health filters and groups per priority
- [Investment Balance](investment-balance.md) – Are dollars and people following priority? – each tier's share of items, budget and people side by side as numbers and bars, over- and under-invested tiers flagged in words, and the biggest mismatch said in one line
- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **Research & portfolio** - **Roadmap Timeline** (`tc-roadmap-timeline`) – Gantt-style lanes with progress, milestones, Today and dependency arrows, at week, month or quarter scale. - **Prioritisation Matrix** (`tc-prioritisation-matrix`) – value against effort, points dragged or moved with the arrow keys, listed by quadrant. - **Risk Register** (`tc-risk-register`) – a 5 × 5 likelihood × impact grid beside a sortable, rescorable register. - **Bibliography** (`tc-bibliography`) – references in APA, MLA, Chicago, Harvard or IEEE, with Copy and BibTeX / RIS export.
