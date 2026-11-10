<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Capacity Bars

**Research & portfolio** · New

How loaded each person is – their allocation split by what they work on, against their capacity on one shared scale, each piece named with its amount, anyone over capacity marked and counted

- **Element:** `<tc-capacity-bars>`
- **Size:** 8.2 KB gzip · 25.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/capacity-bars";` |
| React / Next.js | `import { CapacityBars } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/capacity-bars";` · tags starting with tc- are custom elements |
| Angular | `import { CapacityBars } from "@adamstavely/trenchcoat/angular/capacity-bars";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/capacity-bars";` |

## Example

The live example is in the gallery at `#/capacity-bars`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How loaded each person is. Every row has the person's initials, name and role, their load against their capacity –
“1.2 / 1.0 FTE” – and a bar split into what they work on, one piece per allocation. All bars share one scale, so
loads compare across rows, and a line on each bar marks that person's capacity. Each piece is named under the bar with
its amount, so colour is never the only cue. Anyone over capacity is marked “over” and counted in the header. Rows
are sorted by load, most loaded first, and moving along a bar names each piece in the readout below.

### When to use

- Staffing reviews: who is stretched across too many topics or projects.
- Planning a move of work between people, and checking the result.
- Any “who carries what” view where the unit is FTE, hours a week or a percentage.

### When not to use

- How a budget splits across priority tiers – use [Investment Balance](investment-balance.md).
- Spend against budgets – use [Budget Burn](budget-burn.md).
- One person's use against a plan limit – use [Usage Meter](usage-meter.md).
- Who is linked to whom – use [Person Links](person-links.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Person** `.ui-capb__person` – initials or picture, name, role and load against capacity
2. **Over** `.ui-capb__over` – the mark when load is past capacity
3. **Bar** `.ui-capb__track` – the allocation, one piece per piece of work, on a shared scale
4. **Piece** `.ui-capb__seg` – one allocation; focusable
5. **Capacity line** `.ui-capb__cap` – where the person's capacity falls on the bar
6. **Legend** `.ui-capb__legend` – each piece's name and amount, under the bar
7. **Readout** `.ui-capb__readout` – the person or piece in focus, in full

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Pieces take `--tc-chart-1` to `--tc-chart-6`, by the order work first appears, so the same
topic has the same colour on every row.

## Usage

### HTML

```html
<tc-capacity-bars id="capacity" unit="FTE"></tc-capacity-bars>

<script type="module">
  import "@adamstavely/trenchcoat/capacity-bars";
  import "@adamstavely/trenchcoat/tokens.css";

  const capacity = document.querySelector("#capacity");
  capacity.people = [
    { id: "am", name: "Arjun Mehta", role: "Principal Investigator", capacity: 1, allocations: [
      { id: "crm", label: "Climate Resilience Modeling", amount: 0.7 },
      { id: "wps", label: "Wildfire Prediction Systems", amount: 0.5 },
    ] },
    { id: "jt", name: "Jonah Tran", role: "Staff Scientist", allocations: [{ id: "nc", label: "Neuromorphic Computing", amount: 0.7 }] },
  ];
  capacity.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CapacityBars, type CapacityPerson } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const people: CapacityPerson[] = [
  { id: "am", name: "Arjun Mehta", role: "Principal Investigator", capacity: 1, allocations: [
    { id: "crm", label: "Climate Resilience Modeling", amount: 0.7 },
    { id: "wps", label: "Wildfire Prediction Systems", amount: 0.5 },
  ] },
  { id: "jt", name: "Jonah Tran", role: "Staff Scientist", allocations: [{ id: "nc", label: "Neuromorphic Computing", amount: 0.7 }] },
];

export function Capacity() {
  const [selected, setSelected] = useState<string | null>(null);
  return <CapacityBars people={people} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/capacity-bars";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";

defineProps<{ people: TcCapacityBars["people"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-capacity-bars :people="people" @tc-selected-change="onSelectedChange"></tc-capacity-bars>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CapacityBars } from "@adamstavely/trenchcoat/angular/capacity-bars";
import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";

@Component({
  selector: "app-capacity-bars-example",
  imports: [CapacityBars],
  template: `<tc-capacity-bars [people]="people()" (tc-selected-change)="onSelectedChange($event)"></tc-capacity-bars>`,
})
export class CapacityBarsExample {
  readonly people = input.required<TcCapacityBars["people"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/capacity-bars";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";

  let { people }: { people: TcCapacityBars["people"] } = $props();
  let el: TcCapacityBars;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-capacity-bars bind:this={el} {people}></tc-capacity-bars>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"People capacity"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `people` | – | `CapacityPerson[]` | `[]` | The people |
| `unit` | `unit` | `string` | `"FTE"` | The unit loads are counted in: "FTE", "h", "%" |
| `sort` | `sort` | `"load" \| "none"` | `"load"` | "load" puts the most loaded first; "none" keeps the order given |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `selected` | `selected` | `string \| null` | `null` | The selected person's id. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A person was selected or cleared ({ selected, person }: CapacitySelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-capb-c` | `var(--tc-chart-1)` | not set – this fallback applies |

#### Design tokens it reads (57)

`--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-2`, `--tc-chart-3`, `--tc-chart-4`, `--tc-chart-5`, `--tc-chart-6`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-weight`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `people` | `el.people = …;` | `<… people={…} />` | `<tc-capacity-bars :people="…">` | `<tc-capacity-bars [people]="…">` | `<tc-capacity-bars {people}>` |

*Also attributes: `heading`, `description`, `unit`, `sort`, `locale`, `selected` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-capacity-bars id="capacity-bars"></tc-capacity-bars>

<script type="module">
  import "@adamstavely/trenchcoat/capacity-bars";

  const el = document.querySelector("#capacity-bars");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/capacity-bars";
import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";

const props = defineProps<{ initial: TcCapacityBars["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcCapacityBars["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-capacity-bars :selected="selected" @tc-selected-change="onSelectedChange"></tc-capacity-bars>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CapacityBars } from "@adamstavely/trenchcoat/angular/capacity-bars";
import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";

@Component({
  selector: "app-controlled-capacity-bars",
  imports: [CapacityBars],
  template: `<tc-capacity-bars [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-capacity-bars>`,
})
export class ControlledCapacityBars {
  readonly initial = input.required<TcCapacityBars["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcCapacityBars["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/capacity-bars";
  import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";

  let { initial }: { initial: TcCapacityBars["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcCapacityBars;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcCapacityBars["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-capacity-bars bind:this={el} {selected}></tc-capacity-bars>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-capacity-bars")` returns a `TcCapacityBars` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";`
- **React / Next.js:** Props: `import type { CapacityBarsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CapacityBars>`. The element class, for refs: `import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCapacityBars["people"]` with `import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";`
- **Angular:** The directive types the template: `[people]` takes `TcCapacityBars["people"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCapacityBars } from "@adamstavely/trenchcoat/capacity-bars";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `selected` | `string \| null` | The selected person's id – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The person selected on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, person?: CapacityPerson) => void` | A person was selected or cleared; `person` is the selected person |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the person above or below, at the same place along the bar |
| ← / → | Moves between the person and the pieces of their bar |
| Home / End | Moves to the person, or to the last piece of their bar |
| Enter / Space | Selects the person, or clears them if they're selected |
| Escape | Clears the selected person |
| Tab | Leaves the grid |

### Screen readers

The rows are a `grid` named by the heading and described by “Up and down arrows move between people, left and right
along their work; Enter selects the person”. Each row's first cell is a row header that reads the person and their
load – “Arjun Mehta, Principal Investigator: 1.2 FTE of 1 FTE, over capacity” – and each piece is a cell that reads
its work and amount, “Wildfire Prediction Systems, 0.5 FTE”. The selected row is `aria-selected`, and selecting is
confirmed in a polite status message. The legend and readout repeat the cells, so they're hidden.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.0 KB | 5.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **25.8 KB** | **8.3 KB** |
| With Lit – the first component on a page | 47.6 KB | 15.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 147 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of people replaced |
| First on the page | 9.0 ms | default properties; includes adding its CSS to the document |
| 100 items | 18 ms | people: first render, 2,172 nodes; update 8.3 ms |
| 1,000 items | 258 ms | people: first render, 21,522 nodes; update 173 ms |

1,000 items of people: 258 ms. It renders every item, so a first render passes 50 ms (a long task) at about 190 items – page or filter longer lists.

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

- Give each piece of work a stable `id`, so it keeps its colour across rows.
- Set `capacity` per person when it isn't 1 – part-timers, people on leave.
- Set `unit` to how you count: “FTE”, “h” for hours a week, or “%”.

## Do and don't

### Do

- Show everyone on a team, not only the overloaded – the spare capacity is the answer.
- Pair a selected person with their topics or tasks.

### Don't

- Don't mix units across people – one `unit` per element.
- Don't show more than about six pieces per person; group small ones as “Other”.

## Related

- [Investment Balance](investment-balance.md) – Are dollars and people following priority? – each tier's share of items, budget and people side by side as numbers and bars, over- and under-invested tiers flagged in words, and the biggest mismatch said in one line
- [Budget Burn](budget-burn.md) – How fast each budget is being spent – spent against budget, the burn as a bar with a pace marker and Ahead, On or Behind pace in words, people and team, totals in the header and a sort by budget or burn
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Person Links](person-links.md) – The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"

## Changelog

- **`tc-capacity-bars`:** each person's allocation, split by what they work on, against their capacity. - **Scale:** all people share one scale. - **Over capacity:** marked on the person and counted.
