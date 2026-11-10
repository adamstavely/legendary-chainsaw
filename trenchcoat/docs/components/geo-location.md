<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Geo Location

**People & profiles** · New

Coordinates made useful – decimal or degrees-minutes-seconds, Copy, Open in Google Maps, Apple Maps, OpenStreetMap, Bing or your own tools, and an embedded map that loads nothing until Show map

- **Element:** `<tc-geo-location>`
- **Size:** 9.7 KB gzip · 29.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/geo-location";` |
| React / Next.js | `import { GeoLocation } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/geo-location";` · tags starting with tc- are custom elements |
| Angular | `import { GeoLocation } from "@adamstavely/trenchcoat/angular/geo-location";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/geo-location";` |

## Example

The live example is in the gallery at `#/geo-location`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A pair of coordinates made useful. It shows the place's name and its latitude and longitude, in decimal or in
degrees, minutes and seconds, with Copy beside them. "Open in" links take the point to Google Maps, Apple Maps,
OpenStreetMap or Bing Maps, or to your own mapping tools, given as URL templates. An embedded OpenStreetMap shows the
spot.

**Privacy:** by default the map waits behind **Show map**, with a line saying which site it loads from. Nothing is
fetched from another site until someone asks. Set `embed="auto"` to show it at once, or `embed="off"` to leave it out.

Give `points` instead of one pair to switch between several places. Coordinates out of range say what's wrong in
words, with no links and no map.

### When to use

- A record carries coordinates people need to look at or pass on: a site, a sensor, an incident location.
- People use different mapping tools and you want to offer each of them.
- A map is useful but shouldn't load on its own, for privacy or bandwidth.

### When not to use

- A list of addresses with their status and dates – use [Place List](place-list.md), and pair it with this for the picked place.
- Many points at once on one drawing – use [World Map Continental](../illustrations/world-map.md).
- Journeys between places – use [Travel Itinerary](travel-itinerary.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Points** `.ui-geo__points` – the places to switch between, when `points` has more than one
2. **Label** `.ui-geo__label` – what the place is
3. **Coordinates** `.ui-geo__coords` – latitude and longitude in mono, in the chosen notation
4. **Notation** `.ui-geo__notation` – Decimal or DMS
5. **Copy** `.ui-geo__copy` – copies the coordinates as shown
6. **Open in** `.ui-geo__links` – a link per mapping tool, each opening in a new tab
7. **Map** `.ui-geo__map` – the embedded map, or its Show map placeholder
8. **Error** `.ui-geo__error` – what's wrong with coordinates that can't be used

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The coordinates, links and map are the same in both.

The map's height is the component token `--tc-geo-map-h` (220px), which a page can override on the element.

## Usage

### HTML

```html
<tc-geo-location id="site" heading="Field site" label="North weather mast" latitude="57.04121" longitude="-3.61274" zoom="13"></tc-geo-location>

<script type="module">
  import "@adamstavely/trenchcoat/geo-location";
  import "@adamstavely/trenchcoat/tokens.css";

  const site = document.querySelector("#site");
  site.addEventListener("tc-open", (e) => console.log("Opening", e.detail.provider.name, e.detail.url));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { GeoLocation, defaultGeoProviders, type GeoPoint } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sites: GeoPoint[] = [
  { id: "mast", label: "North weather mast", latitude: 57.04121, longitude: -3.61274 },
  { id: "buoy", label: "Lochside sensor buoy", latitude: 57.11853, longitude: -3.82406 },
];

export function FieldSites() {
  const [selected, setSelected] = useState<string | null>("mast");
  return (
    <GeoLocation
      title="Field sites"
      points={sites}
      selected={selected}
      onSelectedChange={setSelected}
      providers={[...defaultGeoProviders, { id: "gis", name: "Institute GIS", url: "https://gis.example.org/map?lat={lat}&lon={lng}" }]}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/geo-location";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";

defineProps<{ points: TcGeoLocation["points"]; providers: TcGeoLocation["providers"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-geo-location :points="points" :providers="providers" @tc-selected-change="onSelectedChange"></tc-geo-location>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GeoLocation } from "@adamstavely/trenchcoat/angular/geo-location";
import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";

@Component({
  selector: "app-geo-location-example",
  imports: [GeoLocation],
  template: `<tc-geo-location [points]="points()" [providers]="providers()" (tc-selected-change)="onSelectedChange($event)"></tc-geo-location>`,
})
export class GeoLocationExample {
  readonly points = input.required<TcGeoLocation["points"]>();
  readonly providers = input.required<TcGeoLocation["providers"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/geo-location";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";

  let { points, providers }: { points: TcGeoLocation["points"]; providers: TcGeoLocation["providers"] } = $props();
  let el: TcGeoLocation;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-geo-location bind:this={el} {points} {providers}></tc-geo-location>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Location"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `latitude` | `latitude` | `number \| undefined` | `undefined` | The latitude, −90 to 90 – used when `points` is empty |
| `longitude` | `longitude` | `number \| undefined` | `undefined` | The longitude, −180 to 180 – used when `points` is empty |
| `label` | `label` | `string \| undefined` | `undefined` | What the place is, e.g. "North weather mast" – used when `points` is empty |
| `zoom` | `zoom` | `number` | `14` | The map zoom, 1 (the world) to 19 (a building) |
| `points` | – | `GeoPoint[]` | `[]` | Several places to switch between, instead of latitude / longitude |
| `selected` | `selected` | `string \| null` | `null` | The shown point's id when `points` is given; null shows the first. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `notation` | `notation` | `GeoNotation` | `"decimal"` | Decimal (57.041200, −3.612700) or degrees-minutes-seconds. Changed by the user unless a tc-notation-change listener calls preventDefault() |
| `precision` | `precision` | `number` | `5` | Decimal places shown in decimal notation |
| `providers` | – | `GeoProvider[]` | `[ { id: "google", name: "Google Maps", url: "https://www.google.com/maps/search/?api=1&query={lat},{lng}" }, { id: "apple", name: "Apple Maps", url: "https://maps.apple.com/?ll={lat},{lng}&q={label}&z={zoom}" }, { id: "osm", name: "OpenStreetMap", url: "https://www.openstreetmap.org/?mlat={lat}&mlon={lng}#map={zoom}/{lat}/{lng}" }, { id: "bing", name: "Bing Maps", url: "https://www.bing.com/maps?cp={lat}~{lng}&lvl={zoom}&sp=point.{lat}_{lng}_{label}" }, ]` | The mapping tools, replacing the defaults – spread `defaultGeoProviders` to add to them. Only http(s) templates are kept |
| `embed` | `embed` | `GeoEmbed` | `"click"` | The embedded map: "click" waits for Show map (nothing loads until then), "auto" shows it at once, "off" has none |
| `embedSrc` | `embed-src` | `string` | `"https://www.openstreetmap.org/export/embed.html?bbox={bbox}&layer=mapnik&marker={lat},{lng}"` | The embedded map's address as a template with {lat} {lng} {zoom} {label} {bbox}; by default OpenStreetMap's embed |
| `embedNote` | `embed-note` | `string \| undefined` | `undefined` | Says where the map loads from under Show map, e.g. "The map loads from openstreetmap.org" – by default the embed's host |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | Another of `points` was picked ({ selected, point }: GeoSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-notation-change` | – | Yes | Decimal or DMS was picked ({ notation }: GeoNotationChange); cancelable – prevented, `notation` stays as it was |
| `tc-open` | – | Yes | A mapping link is about to open ({ provider, url, point }: GeoOpen); cancelable – prevented, the link doesn't open |
| `tc-copy` | – | Yes | The coordinates are about to be copied ({ text, point }: GeoCopy); cancelable – prevented, nothing is copied |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-geo-map-h` | `220px` | both |

#### Design tokens it reads (53)

`--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultGeoProviders: GeoProvider[]` | The mapping tools offered when the page gives none – spread them to add your own |
| `defaultGeoEmbedSrc: string` | The embedded map when the page gives no `embedSrc`: OpenStreetMap's embed, with {bbox} around the point |
| `geoProblem(latitude: unknown, longitude: unknown): string \| null` | Why a point can't be used, in words, or null when it can |
| `toDms(value: number, axis: "lat" \| "lng"): void` | 57.0412 → 57°2′28.3″N |
| `fillGeoTemplate(template: string, p: GeoPoint, zoom: number, precision: unknown): void` | A template filled for a point: {lat} {lng} {zoom} {label} {bbox}, each encoded |

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
| `points` | `el.points = …;` | `<… points={…} />` | `<tc-geo-location :points="…">` | `<tc-geo-location [points]="…">` | `<tc-geo-location {points}>` |
| `providers` | `el.providers = …;` | `<… providers={…} />` | `<tc-geo-location :providers="…">` | `<tc-geo-location [providers]="…">` | `<tc-geo-location {providers}>` |

*Also attributes: `heading`, `description`, `latitude`, `longitude`, `label`, `zoom`, `selected`, `notation` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-notation-change` | Yes | `el.addEventListener("tc-notation-change", (e) => …)` | `ref.current.addEventListener("tc-notation-change", …)` | `@tc-notation-change="…"` | `(tc-notation-change)="…($event)"` | `el.addEventListener("tc-notation-change", …)` |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onOpenMap={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyCoordinates={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` and `notation` itself unless a listener calls `preventDefault()` on `tc-selected-change` or `tc-notation-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-geo-location id="geo-location"></tc-geo-location>

<script type="module">
  import "@adamstavely/trenchcoat/geo-location";

  const el = document.querySelector("#geo-location");
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
import "@adamstavely/trenchcoat/geo-location";
import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";

const props = defineProps<{ initial: TcGeoLocation["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcGeoLocation["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-geo-location :selected="selected" @tc-selected-change="onSelectedChange"></tc-geo-location>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { GeoLocation } from "@adamstavely/trenchcoat/angular/geo-location";
import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";

@Component({
  selector: "app-controlled-geo-location",
  imports: [GeoLocation],
  template: `<tc-geo-location [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-geo-location>`,
})
export class ControlledGeoLocation {
  readonly initial = input.required<TcGeoLocation["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcGeoLocation["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/geo-location";
  import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";

  let { initial }: { initial: TcGeoLocation["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcGeoLocation;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcGeoLocation["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-geo-location bind:this={el} {selected}></tc-geo-location>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-geo-location")` returns a `TcGeoLocation` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";`
- **React / Next.js:** Props: `import type { GeoLocationProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GeoLocation>`. The element class, for refs: `import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGeoLocation["points"]` with `import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";`
- **Angular:** The directive types the template: `[points]` takes `TcGeoLocation["points"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGeoLocation } from "@adamstavely/trenchcoat/geo-location";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `selected` | `string \| null` | The shown point's id when `points` is given – controlled when given (null shows the first) |
| `defaultSelected` | `string \| null` | The point shown on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, point?: GeoPoint) => void` | Another point was picked |
| `notation` | `GeoNotation` | Decimal or DMS – controlled when given |
| `defaultNotation` | `GeoNotation` | The notation on mount when `notation` isn't controlled |
| `onNotationChange` | `(notation: GeoNotation) => void` | Decimal or DMS was picked |
| `onOpenMap` | `(detail: GeoOpen) => boolean \| void` | A mapping link is about to open; return false to stop it, e.g. to open your own map |
| `onCopyCoordinates` | `(detail: GeoCopy) => boolean \| void` | The coordinates are about to be copied; return false to stop it |

*Renamed or hidden on the wrapper: `heading`, `selected`, `notation`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the points, the notation, Copy, each link and Show map |
| ↑ / ↓ | In the points, moves to the previous or next place |
| Home / End | In the points, moves to the first or last place |
| Enter / Space | In the points, shows the place |
| ← / → | In the notation, switches between Decimal and DMS |

### Screen readers

The points are a single-select `listbox` named "Places", and showing one is confirmed in a polite status message
("Lochside sensor buoy selected"). The coordinates are introduced as "Latitude, longitude" or "Coordinates, degrees
minutes seconds". The notation is a `radiogroup`. Each link reads its tool's name and "opens in a new tab". Show map
names the place, and the map's iframe is titled "Map of …". Bad coordinates are announced as an alert.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

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
| **This component alone** | 21.3 KB | 7.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.1 KB** | **9.7 KB** |
| With Lit – the first component on a page | 50.9 KB | 16.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 76 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of providers replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.9 ms | providers: first render, 748 nodes; update 0.5 ms |
| 1,000 items | 24 ms | providers: first render, 7,048 nodes; update 3.8 ms |

1,000 items of providers: 24 ms, 7,048 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give each point a label that says what it is, not where: "North weather mast", not "57.04, −3.61".
- Set `zoom` to suit the thing: 13 for a site in open country, 16–17 for a building.
- In your own provider templates, use {lat}, {lng}, {zoom} and {label}. The element encodes each value, and keeps
  only http(s) links.

## Do and don't

### Do

- Keep Show map (`embed="click"`) unless the page already loads from the map's site.
- Listen to `tc-open` to open your own map view instead of leaving the app.
- Spread `defaultGeoProviders` to add an internal GIS tool beside the usual ones.

### Don't

- Don't pass coordinates you haven't checked – the element flags only ones out of range.
- Don't show precision you don't have; five decimal places is about a metre.
- Don't point `embedSrc` at a site you haven't reviewed. The iframe is sandboxed, but it still loads that site.

## Related

- [Place List](place-list.md) – The places on record – type with an icon, Confirmed / Unverified / Vacated in words, address, coordinates and when each applies, with a place picked for a map
- [World Map Continental](../illustrations/world-map.md) – World map with one highlighted continent and a pastel band along its coastline, switchable between all six
- [Travel Itinerary](travel-itinerary.md) – Trips as legs for a travel or expense audit – route codes, mode and carrier, the document used, confidence as a meter and %, source and grade, flags such as No record or Cash ticket in words, and connecting legs grouped into journeys
- [Contact Channels](contact-channels.md) – The ways to reach a person or an account, grouped as Email, Phone, Messaging and Address – each masked until shown, with its role, when it was last used, how far it's verified, Copy and the page's own actions

## Changelog

- `tc-geo-location` – coordinates in decimal or DMS, Copy, Open in Google Maps, Apple Maps, OpenStreetMap, Bing or your own `providers`, and an OpenStreetMap embed that loads nothing until Show map. Generative UI can't set `embed` or `embedSrc`, so a generated map always waits for the click.
