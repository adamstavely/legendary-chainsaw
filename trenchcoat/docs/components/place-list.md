<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Place List

**People & profiles** · New

The places on record – type with an icon, Confirmed / Unverified / Vacated in words, address, coordinates and when each applies, with a place picked for a map

- **Element:** `<tc-place-list>`
- **Size:** 7.6 KB gzip · 22.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/place-list";` |
| React / Next.js | `import { PlaceList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/place-list";` · tags starting with tc- are custom elements |
| Angular | `import { PlaceList } from "@adamstavely/trenchcoat/angular/place-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/place-list";` |

## Example

The live example is in the gallery at `#/place-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The places on record for a person, an account or a business. Each place shows its type with an icon – Residence,
Work, Frequent, Former or Other, or your own – whether it's confirmed (Confirmed, Unverified, Vacated, in words with
a mark), the address, optional coordinates in mono, and when it applies: “Jun 2021 –”, “Until Nov 2020”, or your own
words such as “Visits 2024 –”. Picking a place fires a cancelable change, so a page can show it on a map such as
`world-map`.

### When to use

- A customer or supplier record during a know-your-customer or due-diligence review.
- Sites a business operates from, with which ones are verified.
- Pairing a list of places with a map.

### When not to use

- Trips between places – use [Travel Itinerary](travel-itinerary.md).
- Events in order – use [Entity Timeline](entity-timeline.md).
- Facts of every kind with their sources – use [Fact Sheet](fact-sheet.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Icon** `.ui-plc__icon` – the type's icon in its tone
2. **Name** `.ui-plc__name` – the place's name, or its type's
3. **Status** `.ui-plc__status` – Confirmed, Unverified or Vacated, in words with a mark
4. **Address** `.ui-plc__address` – the full address
5. **Coordinates** `.ui-plc__coords` – latitude and longitude in mono
6. **Period** `.ui-plc__span` – when the place applies

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight names. Clean is one
white card with the header as its first row. The icons, pills and selection are the same in both.

## Usage

### HTML

```html
<tc-place-list id="places" heading="Places"></tc-place-list>

<script type="module">
  import "@adamstavely/trenchcoat/place-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#places");
  list.places = [
    { id: "p1", name: "Registered office", type: "work", status: "confirmed", address: "14 Harbour Row, Leith, Edinburgh", since: Date.parse("2021-06-01") },
    { id: "p2", name: "Warehouse 7", type: "frequent", status: "unverified", address: "Unit 7, Port Approach, Grangemouth" },
  ];
  list.addEventListener("tc-selected-change", (e) => console.log(e.detail.place));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PlaceList, type PlaceRecord } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const places: PlaceRecord[] = [
  { id: "p1", name: "Registered office", type: "work", status: "confirmed", address: "14 Harbour Row, Leith, Edinburgh" },
];

export function Places() {
  const [selected, setSelected] = useState<string | null>(null);
  return <PlaceList title="Places" places={places} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/place-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";

defineProps<{ places: TcPlaceList["places"]; types: TcPlaceList["types"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-place-list :places="places" :types="types" @tc-selected-change="onSelectedChange"></tc-place-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PlaceList } from "@adamstavely/trenchcoat/angular/place-list";
import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";

@Component({
  selector: "app-place-list-example",
  imports: [PlaceList],
  template: `<tc-place-list [places]="places()" [types]="types()" (tc-selected-change)="onSelectedChange($event)"></tc-place-list>`,
})
export class PlaceListExample {
  readonly places = input.required<TcPlaceList["places"]>();
  readonly types = input.required<TcPlaceList["types"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/place-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";

  let { places, types }: { places: TcPlaceList["places"]; types: TcPlaceList["types"] } = $props();
  let el: TcPlaceList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-place-list bind:this={el} {places} {types}></tc-place-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Places"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `places` | – | `PlaceRecord[]` | `[]` | The places, in order |
| `types` | – | `Record<string, { label: string; tone: PlaceTone; icon?: PlaceIcon }>` | `{}` | Types' names, tones and icons, merged over the defaults (residence, work, frequent, former, other) |
| `statuses` | – | `Record<string, { label: string; tone: PlaceTone }>` | `{}` | Statuses' names and tones, merged over the defaults (confirmed, unverified, vacated) |
| `coordinates` | `coordinates` | `boolean` | `true` | Shows each place's coordinates under its address |
| `selected` | – | `string \| null` | `null` | The picked place. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A place was picked or cleared ({ selected, place }: PlaceSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Design tokens it reads (52)

`--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-plc-tone`, `--tc-plc-tone-bg`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultPlaceTypes: Record<string, { label: string; tone: PlaceTone; icon: PlaceIcon }>` | The types' names, tones and icons used when the page gives none |
| `defaultPlaceStatuses: Record<string, { label: string; tone: PlaceTone }>` | The statuses' names and tones used when the page gives none |

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
| `places` | `el.places = …;` | `<… places={…} />` | `<tc-place-list :places="…">` | `<tc-place-list [places]="…">` | `<tc-place-list {places}>` |
| `types` | `el.types = …;` | `<… types={…} />` | `<tc-place-list :types="…">` | `<tc-place-list [types]="…">` | `<tc-place-list {types}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-place-list :statuses="…">` | `<tc-place-list [statuses]="…">` | `<tc-place-list {statuses}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-place-list :selected="…">` | `<tc-place-list [selected]="…">` | `<tc-place-list {selected}>` |

*Also attributes: `heading`, `description`, `coordinates`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-place-list id="place-list"></tc-place-list>

<script type="module">
  import "@adamstavely/trenchcoat/place-list";

  const el = document.querySelector("#place-list");
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
import "@adamstavely/trenchcoat/place-list";
import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";

const props = defineProps<{ initial: TcPlaceList["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcPlaceList["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-place-list :selected="selected" @tc-selected-change="onSelectedChange"></tc-place-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PlaceList } from "@adamstavely/trenchcoat/angular/place-list";
import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";

@Component({
  selector: "app-controlled-place-list",
  imports: [PlaceList],
  template: `<tc-place-list [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-place-list>`,
})
export class ControlledPlaceList {
  readonly initial = input.required<TcPlaceList["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcPlaceList["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/place-list";
  import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";

  let { initial }: { initial: TcPlaceList["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcPlaceList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcPlaceList["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-place-list bind:this={el} {selected}></tc-place-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-place-list")` returns a `TcPlaceList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";`
- **React / Next.js:** Props: `import type { PlaceListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PlaceList>`. The element class, for refs: `import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPlaceList["places"]` with `import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";`
- **Angular:** The directive types the template: `[places]` takes `TcPlaceList["places"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPlaceList } from "@adamstavely/trenchcoat/place-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `selected` | `string \| null` | The picked place – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The place picked on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, place?: PlaceRecord) => void` | A place was picked or cleared; `place` is the picked one |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

The list is one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next place |
| Home / End | Moves to the first or last place |
| Enter / Space | Picks the place, or clears it if it's picked |
| Escape | Clears the picked place |

### Screen readers

The list is a single-select `listbox` named by the heading; each place is an option that reads its name, type,
status, address, coordinates and period, and is `aria-selected` when picked. Picking is confirmed in a polite status
message, “Registered office selected”, and clearing with “Selection cleared”.

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
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/util | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.7 KB | 5.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.2 KB** | **7.6 KB** |
| With Lit – the first component on a page | 44.0 KB | 14.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 89 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of places replaced |
| First on the page | 7.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.8 ms | places: first render, 1,514 nodes; update 2.4 ms |
| 1,000 items | 76 ms | places: first render, 15,014 nodes; update 24 ms |

1,000 items of places: 76 ms. It renders every item, so a first render passes 50 ms (a long task) at about 660 items – page or filter longer lists.

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

- Name places by what they are to the record: “Registered office”, “Warehouse 7”.
- Give coordinates only when you have them from a reliable source.
- Use `span` when dates don't tell it: “Visits 2024 –”, “Deliveries 2025 –”.

## Do and don't

### Do

- Mark places your team hasn't checked as unverified, so reviewers know what's left.
- Pair the list with a map, moving it to the picked place.
- Keep former places, marked vacated, when history matters.

### Don't

- Don't list the same place twice under different types – pick the main one.
- Don't use the tones for anything but the type and status.
- Don't hide coordinates people need to confirm a site; turn them off only when they add nothing.

## Related

- [World Map Continental](../illustrations/world-map.md) – World map with one highlighted continent and a pastel band along its coastline, switchable between all six
- [Entity Timeline](entity-timeline.md) – What happened to a person, account or case, in order – events under month headers, each with a category, its source and Admiralty grade tinted by confidence, an optional flag and a detail that opens in place, filtered by category chips with counts
- [Travel Itinerary](travel-itinerary.md) – Trips as legs for a travel or expense audit – route codes, mode and carrier, the document used, confidence as a meter and %, source and grade, flags such as No record or Cash ticket in words, and connecting legs grouped into journeys
- [Fact Sheet](fact-sheet.md) – What's known and how far to trust it – facts in sections, each value tagged with its source and an Admiralty grade, tinted and marked by confidence, with conflicting readings side by side and unknowns said plainly

## Changelog

- **People & profiles:** - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category. - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys. - `tc-place-list`: places with type, status, coordinates and dates. - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats. - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips. - Entities' and transfers' flows are lit with a readout, and there's a table view. - `tc-co-occurrence`: entities ranked by the events they share with a subject. - Strength in words and bars, with counts per source. - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement. - `tc-asset-list`: grouped assets with masked identifiers and a status. - `tc-contact-channels`: emails, phone numbers, messaging and addresses. - Masked until shown, with role, last use and verification.
