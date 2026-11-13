<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Map Itinerary

**AI & chat** · New

A trip planned day by day – the days as tabs, each day's stops in order with times, kinds and travel between them, and the stops on a map drawn from their coordinates, the chosen day's route standing out and tiles loading only on request

- **Element:** `<tc-map-itinerary>`
- **Size:** 11.2 KB gzip · 36.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/map-itinerary";` |
| React / Next.js | `import { MapItinerary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/map-itinerary";` · tags starting with tc- are custom elements |
| Angular | `import { MapItinerary } from "@adamstavely/trenchcoat/angular/map-itinerary";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/map-itinerary";` |

## Example

The live example is in the gallery at `#/map-itinerary`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A trip planned day by day, with each day's stops on a map. Beside the map, the days are tabs and the chosen day's
stops are listed in order – numbered, with the time, what kind of stop it is (sight, food, stay, transport, venue),
how long to stay, and how long it takes to get there from the stop before. The map is drawn from the stops'
coordinates and fitted to the day or the whole trip: the chosen day's route and numbered markers stand out, the other
days stay muted. Picking a stop in the list lights it up on the map, and the other way round.

No map tiles load by default – a quiet grid stands in, so nothing is sent to another site. Give `tileUrl` and the
tiles wait behind **Show map tiles**, which says which site they load from.

### When to use

- A plan an assistant drew up – “three days in Lisbon”, a site-visit schedule, a field trip.
- A multi-day event across several venues.
- Any ordered set of places per day where the route matters.

### When not to use

- Trips already taken, audited leg by leg – use [Travel Itinerary](travel-itinerary.md).
- Places on record with no order or days – use [Place List](place-list.md).
- One location with its coordinates – use [Geo Location](geo-location.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Day tabs** `.ui-mit__tabs` – one tab per day, with its date; hidden for a one-day plan
2. **Day heading** `.ui-mit__day-head` – the chosen day's name and date
3. **Stops** `.ui-mit__stops` – the day's stops in order
4. **Stop** `.ui-mit__stop` – number, name, time, kind, how long to stay and a note
5. **Travel** `.ui-mit__travel` – how long it takes from the stop before
6. **Map** `.ui-mit__map` – the stops drawn from their coordinates
7. **Route** `.ui-mit__route` – each day's path; the chosen day's in the accent, the others muted and dashed
8. **Marker** `.ui-mit__marker` – a numbered stop on the map
9. **Fit** `.ui-mit__fit` – Show all days or Zoom to the day
10. **Tiles prompt** `.ui-mit__tiles-ask` – where tiles would load from, and Show map tiles

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight stop names. Clean is
one white card with the header as its first row. The map, markers and routes are the same in both. The list's width
is the component token `--tc-mit-side`, and the number badges' size is `--tc-mit-num`. Below 640 px of width the map
moves above the list.

## Usage

### HTML

```html
<tc-map-itinerary id="trip" heading="Lisbon field visit"></tc-map-itinerary>

<script type="module">
  import "@adamstavely/trenchcoat/map-itinerary";
  import "@adamstavely/trenchcoat/tokens.css";

  const trip = document.querySelector("#trip");
  trip.days = [
    {
      id: "d1",
      label: "Day 1",
      stops: [
        { id: "s1", name: "Hotel Avenida", lat: 38.7189, lng: -9.1437, time: "11:00", kind: "stay" },
        { id: "s2", name: "Praça do Comércio", lat: 38.7075, lng: -9.1364, time: "15:00", kind: "sight", travel: "20 min walk" },
      ],
    },
    {
      id: "d2",
      label: "Day 2",
      stops: [
        { id: "s3", name: "Belém Tower", lat: 38.6916, lng: -9.216, time: "10:00", kind: "sight" },
        { id: "s4", name: "Jerónimos Monastery", lat: 38.6979, lng: -9.2068, time: "11:30", kind: "sight", travel: "10 min walk" },
      ],
    },
  ];
  trip.addEventListener("tc-stop-select", (e) => console.log(e.detail.item));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MapItinerary, type ItineraryDay } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Trip({ days }: { days: ItineraryDay[] }) {
  const [day, setDay] = useState<string | null>(days[0]?.id ?? null);
  const [stop, setStop] = useState<string | null>(null);
  return (
    <MapItinerary
      title="Lisbon field visit"
      days={days}
      day={day}
      onDayChange={setDay}
      stop={stop}
      onStopSelect={setStop}
      tileUrl="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      tileAttribution="© OpenStreetMap contributors"
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/map-itinerary";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";

defineProps<{ days: TcMapItinerary["days"]; kinds: TcMapItinerary["kinds"] }>();
const onDayChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-map-itinerary :days="days" :kinds="kinds" @tc-day-change="onDayChange"></tc-map-itinerary>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MapItinerary } from "@adamstavely/trenchcoat/angular/map-itinerary";
import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";

@Component({
  selector: "app-map-itinerary-example",
  imports: [MapItinerary],
  template: `<tc-map-itinerary [days]="days()" [kinds]="kinds()" (tc-day-change)="onDayChange($event)"></tc-map-itinerary>`,
})
export class MapItineraryExample {
  readonly days = input.required<TcMapItinerary["days"]>();
  readonly kinds = input.required<TcMapItinerary["kinds"]>();
  onDayChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/map-itinerary";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";

  let { days, kinds }: { days: TcMapItinerary["days"]; kinds: TcMapItinerary["kinds"] } = $props();
  let el: TcMapItinerary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-day-change", on);
    return () => el.removeEventListener("tc-day-change", on);
  });
</script>

<tc-map-itinerary bind:this={el} {days} {kinds}></tc-map-itinerary>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Itinerary"` | The heading, and the map's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `days` | – | `ItineraryDay[]` | `[]` | The days, in order, each with its stops in order |
| `day` | `day` | `string \| null` | `null` | The chosen day's id; by default the first. Changed by the user unless a tc-day-change listener calls preventDefault() |
| `stop` | `stop` | `string \| null` | `null` | The picked stop's id. Changed by the user unless a tc-stop-select listener calls preventDefault() |
| `fit` | `fit` | `"day" \| "all"` | `"day"` | What the map fits: the chosen "day", or "all" days |
| `kinds` | – | `Record<string, { label: string; icon?: ItineraryKindIcon }>` | `{}` | Kinds' names and icons, merged over the defaults (sight, food, stay, transport, venue, other) |
| `tileUrl` | `tile-url` | `string \| undefined` | `undefined` | A map tile URL template with {z}, {x} and {y} (and optionally {s}); nothing loads until "Show map tiles" |
| `tileAttribution` | `tile-attribution` | `string \| undefined` | `undefined` | The tiles' credit, shown on the map once they load, e.g. "© OpenStreetMap contributors" |
| `tileNote` | `tile-note` | `string \| undefined` | `undefined` | Says where the tiles load from beside Show map tiles; by default the template's host |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-day-change` | – | Yes | A day was chosen ({ day, item }: ItineraryDayChange); cancelable – prevented, `day` stays as it was |
| `tc-stop-select` | – | Yes | A stop was picked or cleared, in the list or on the map ({ stop, item, day }: ItineraryStopSelect); cancelable – prevented, `stop` stays as it was. Also fired, not cancelable, with `stop: null` when choosing another day clears the pick |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-mit-side` | `300px` | both |
| `--tc-mit-num` | `22px` | both |

#### Design tokens it reads (49)

`--tc-accent`, `--tc-accent-solid`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultItineraryKinds: Record<string, { label: string; icon: ItineraryKindIcon }>` | The kinds' names and icons used when the page gives none |
| `mercator(lat: number, lng: number): [number, number]` | Web Mercator: longitude and latitude as 0–1 across the world, x to the east and y to the south |

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
| `days` | `el.days = …;` | `<… days={…} />` | `<tc-map-itinerary :days="…">` | `<tc-map-itinerary [days]="…">` | `<tc-map-itinerary {days}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-map-itinerary :kinds="…">` | `<tc-map-itinerary [kinds]="…">` | `<tc-map-itinerary {kinds}>` |

*Also attributes: `heading`, `description`, `day`, `stop`, `fit`, `tile-url`, `tile-attribution`, `tile-note` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-day-change` | Yes | `el.addEventListener("tc-day-change", (e) => …)` | `ref.current.addEventListener("tc-day-change", …)` | `@tc-day-change="…"` | `(tc-day-change)="…($event)"` | `el.addEventListener("tc-day-change", …)` |
| `tc-stop-select` | Yes | `el.addEventListener("tc-stop-select", (e) => …)` | `ref.current.addEventListener("tc-stop-select", …)` | `@tc-stop-select="…"` | `(tc-stop-select)="…($event)"` | `el.addEventListener("tc-stop-select", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `day` and `stop` itself unless a listener calls `preventDefault()` on `tc-day-change` or `tc-stop-select` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-map-itinerary id="map-itinerary"></tc-map-itinerary>

<script type="module">
  import "@adamstavely/trenchcoat/map-itinerary";

  const el = document.querySelector("#map-itinerary");
  el.addEventListener("tc-day-change", (e) => {
    e.preventDefault(); // the element keeps its day…
    if (allowed(e.detail.day)) el.day = e.detail.day; // …until the app sets it
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
import "@adamstavely/trenchcoat/map-itinerary";
import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";

const props = defineProps<{ initial: TcMapItinerary["day"] }>();
const day = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDayChange = (e: CustomEvent<{ day: TcMapItinerary["day"] }>) => {
  e.preventDefault();
  day.value = e.detail.day;
};
</script>

<template>
  <tc-map-itinerary :day="day" @tc-day-change="onDayChange"></tc-map-itinerary>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MapItinerary } from "@adamstavely/trenchcoat/angular/map-itinerary";
import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";

@Component({
  selector: "app-controlled-map-itinerary",
  imports: [MapItinerary],
  template: `<tc-map-itinerary [day]="day()" (tc-day-change)="onDayChange($event)"></tc-map-itinerary>`,
})
export class ControlledMapItinerary {
  readonly initial = input.required<TcMapItinerary["day"]>();
  readonly day = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDayChange(e: CustomEvent<{ day: TcMapItinerary["day"] }>) {
    e.preventDefault();
    this.day.set(e.detail.day);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/map-itinerary";
  import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";

  let { initial }: { initial: TcMapItinerary["day"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let day = $derived(initial);
  let el: TcMapItinerary;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      day = (e as CustomEvent<{ day: TcMapItinerary["day"] }>).detail.day;
    };
    el.addEventListener("tc-day-change", on);
    return () => el.removeEventListener("tc-day-change", on);
  });
</script>

<tc-map-itinerary bind:this={el} {day}></tc-map-itinerary>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-map-itinerary")` returns a `TcMapItinerary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";`
- **React / Next.js:** Props: `import type { MapItineraryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MapItinerary>`. The element class, for refs: `import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMapItinerary["days"]` with `import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";`
- **Angular:** The directive types the template: `[days]` takes `TcMapItinerary["days"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMapItinerary } from "@adamstavely/trenchcoat/map-itinerary";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the map's name |
| `day` | `string \| null` | The chosen day's id – controlled when given |
| `defaultDay` | `string \| null` | The day chosen on mount when `day` isn't controlled; by default the first |
| `onDayChange` | `(day: string, item?: ItineraryDay) => void` | A day was chosen |
| `stop` | `string \| null` | The picked stop's id – controlled when given (null for none) |
| `defaultStop` | `string \| null` | The stop picked on mount when `stop` isn't controlled |
| `onStopSelect` | `(stop: string \| null, item?: ItineraryStop) => void` | A stop was picked or cleared, in the list or on the map |

*Renamed or hidden on the wrapper: `heading`, `day`, `stop`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

The day tabs, the stops and the map's markers are a tab stop each.

| Key | What it does |
|---|---|
| ← / → (day tabs) | Chooses the previous or next day |
| Home / End (day tabs) | Chooses the first or last day |
| ↑ / ↓ (stops) | Moves to the previous or next stop |
| Home / End (stops, markers) | Moves to the first or last stop |
| ← → ↑ ↓ (markers) | Moves between the day's markers on the map |
| Enter / Space | Picks the stop, or clears it if it's picked |
| Escape | Clears the picked stop |

### Screen readers

The days are a `tablist` named “Days”, each tab controlling the panel of stops. The stops are a single-select
`listbox` named by the day; each option reads its number, name, time, kind, how long to stay, note and how to get there
(“Getting there: 12 min walk”). The map is a group named “Map of Day 2”; each marker is a toggle button reading its
number, name and time, pressed when picked, and the other days' routes are hidden from screen readers. Picking is
confirmed in a polite status message – “Belém Tower selected, stop 2 of 3, Day 2” – and so are changing the day and the
fit.

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
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.2 KB | 8.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.1 KB** | **11.2 KB** |
| With Lit – the first component on a page | 57.9 KB | 18.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 128 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of days replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | days: first render, 937 nodes; update 4.7 ms |
| 1,000 items | 66 ms | days: first render, 8,437 nodes; update 28 ms |

1,000 items of days: 66 ms. It renders every item, so a first render passes 50 ms (a long task) at about 760 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name stops by what people will see on the street: “Belém Tower”, not a booking reference.
- Write times the way the plan does: “09:40”, “Afternoon”.
- Put travel on the stop it leads to: “12 min walk”, “25 min by metro”.
- Use notes for what matters on the day: a booking, an entrance, what to bring.

## Do and don't

### Do

- Give accurate coordinates – the map fits to them, so one wrong stop squeezes the rest.
- Keep each day short enough to read without scrolling the list.
- Credit the tile provider with `tileAttribution` when you give `tileUrl`.

### Don't

- Don't load tiles without asking – leave them behind Show map tiles unless people have agreed.
- Don't put places with no location on the map; leave `lat` and `lng` out and the list says so.
- Don't use the itinerary for an audit of past travel – use `travel-itinerary`.

## Related

- [Travel Itinerary](travel-itinerary.md) – Trips as legs for a travel or expense audit – route codes, mode and carrier, the document used, confidence as a meter and %, source and grade, flags such as No record or Cash ticket in words, and connecting legs grouped into journeys
- [Place List](place-list.md) – The places on record – type with an icon, Confirmed / Unverified / Vacated in words, address, coordinates and when each applies, with a place picked for a map
- [Geo Location](geo-location.md) – Coordinates made useful – decimal or degrees-minutes-seconds, Copy, Open in Google Maps, Apple Maps, OpenStreetMap, Bing or your own tools, and an embedded map that loads nothing until Show map
- [Schedule Card](schedule-card.md) – A recurring agent task at a glance – the schedule in words, a live countdown to the next run, the last runs as marks in words with when and how long, and Run now, Pause / Resume and Edit
